import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";
import { dbRpc, dbUpdate } from "./supabase";
import { stateFromPincode } from "./pincode-state";
import { products as catalog } from "@/data/products";
import type { Order } from "./order-store";

/**
 * GST INVOICE GENERATION
 * --------------------------------------------------------------
 * Official company details, exactly as given on the GST certificate.
 * Do not "clean up" spelling/formatting here without checking against
 * the certificate again — this is what appears on every invoice.
 */
export const COMPANY = {
  legalName: "GITAMRI ENTERPRISE PRIVATE LIMITED",
  tradeName: "GITAMRI ENTERPRISE PVT. LTD.",
  gstin: "27AAMCG0530G1ZT",
  addressLines: [
    "First Floor, Plot No. 56, C/O Rajendra M Rote,",
    "Collector Colony, Godhani Rly, Godhani,",
    "Prabhat Nagar, Nagpur, Maharashtra - 441123",
  ],
  // Used to decide intra-state (CGST+SGST) vs inter-state (IGST) per order.
  state: "Maharashtra",
} as const;

const GST_RATE_PERCENT = 5;
const INVOICE_PREFIX = "GEPL";

function financialYearLabel(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = (fyStart + 1) % 100;
  return `${(fyStart % 100).toString().padStart(2, "0")}-${fyEnd.toString().padStart(2, "0")}`;
}

export interface LineGst {
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
}

/**
 * Reverse-calculates GST from a GST-INCLUSIVE amount (the website's
 * selling price is never marked up by GST — GST is backed out of it).
 * Deliberately does every step in integer paise, not floating-point
 * rupees, so the taxable value + tax always reconstructs the exact
 * inclusive amount the customer paid, with zero rounding drift —
 * standard floating-point rupee math (e.g. 259 / 1.05 in JS floats)
 * can be off by a paisa in either direction, which is exactly the kind
 * of discrepancy a real tax invoice can't have.
 */
export function splitInclusiveGst(inclusiveRupees: number, isIntraState: boolean): LineGst {
  const inclusivePaise = Math.round(inclusiveRupees * 100);
  const taxableValuePaise = Math.round((inclusivePaise * 100) / (100 + GST_RATE_PERCENT));
  const gstTotalPaise = inclusivePaise - taxableValuePaise;

  if (isIntraState) {
    const cgstPaise = Math.round(gstTotalPaise / 2);
    const sgstPaise = gstTotalPaise - cgstPaise; // absorbs the odd paisa, if any
    return { taxableValuePaise, cgstPaise, sgstPaise, igstPaise: 0, totalPaise: inclusivePaise };
  }
  return { taxableValuePaise, cgstPaise: 0, sgstPaise: 0, igstPaise: gstTotalPaise, totalPaise: inclusivePaise };
}

function rupees(paise: number): string {
  return (paise / 100).toFixed(2);
}

/**
 * Returns this order's invoice number, generating one the first time
 * it's requested and persisting it so every later download of the same
 * order's invoice reuses the same number. Numbers come from a Postgres
 * sequence (next_invoice_number(), created via the migration in
 * supabase/002_invoice_migration.sql) so two admins downloading
 * invoices at the same moment can never collide on the same number.
 */
export async function getOrCreateInvoiceNumber(order: Order): Promise<string> {
  if (order.invoiceNumber) return order.invoiceNumber;

  const seq = await dbRpc<number>("next_invoice_number");
  const fy = financialYearLabel(new Date());
  const invoiceNumber = `${INVOICE_PREFIX}/${fy}/${String(seq).padStart(4, "0")}`;

  await dbUpdate("Order", `trackingId=eq.${encodeURIComponent(order.trackingId)}`, {
    invoiceNumber,
    invoiceGeneratedAt: new Date().toISOString(),
  });

  return invoiceNumber;
}

export async function generateInvoicePdf(order: Order): Promise<Uint8Array> {
  const invoiceNumber = await getOrCreateInvoiceNumber(order);
  const placeOfSupply = stateFromPincode(order.customer.pincode);
  const isIntraState = placeOfSupply === COMPANY.state;

  // A GST tax invoice legally needs an HSN code on every line. Until
  // every item on this specific order has one filled in (see
  // data/products.ts), the PDF is clearly watermarked as a draft so it
  // can never be mistaken for, or filed as, a valid tax invoice.
  const allItemsHaveHsn = order.items.every((item) => {
    const product = catalog.find((p) => p.id === item.productId);
    return Boolean(product?.hsnCode);
  });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Logo lives at public/invoice-logo.png — replace that file to change
  // the logo without touching any code here.
  let logoImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  try {
    const logoBytes = await readFile(path.join(process.cwd(), "public", "invoice-logo.png"));
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch {
    // If the logo file is ever missing/unreadable, the invoice still
    // generates fine — it just skips the image rather than failing.
    logoImage = null;
  }

  const PAGE_WIDTH = 595.28; // A4 in points
  const PAGE_HEIGHT = 841.89;
  const margin = 40;

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = 800;

  function text(
    str: string,
    x: number,
    yPos: number,
    opts: { size?: number; f?: PDFFont; color?: [number, number, number] } = {}
  ) {
    page.drawText(str, {
      x,
      y: yPos,
      size: opts.size ?? 10,
      font: opts.f ?? font,
      color: opts.color ? rgb(...opts.color) : rgb(0, 0, 0),
    });
  }

  function hLine(yPos: number) {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: PAGE_WIDTH - margin, y: yPos },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  function newPageIfNeeded(minY: number) {
    if (y < minY) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = 800;
    }
  }

  // --- Header ---
  const LOGO_SIZE = 60;
  const textStartX = logoImage ? margin + LOGO_SIZE + 14 : margin;

  if (logoImage) {
    page.drawImage(logoImage, {
      x: margin,
      y: y - LOGO_SIZE + 10,
      width: LOGO_SIZE,
      height: LOGO_SIZE,
    });
  }

  text(COMPANY.legalName, textStartX, y, { size: 13, f: bold });
  y -= 15;
  text(`Trade Name: ${COMPANY.tradeName}`, textStartX, y, { size: 9 });
  y -= 13;
  for (const line of COMPANY.addressLines) {
    text(line, textStartX, y, { size: 9 });
    y -= 12;
  }
  text(`GSTIN: ${COMPANY.gstin}`, textStartX, y, { size: 9, f: bold });
  y = Math.min(y, 800 - LOGO_SIZE) - 12;
  y -= 10;

  const title = allItemsHaveHsn
    ? "TAX INVOICE"
    : "DRAFT INVOICE — HSN PENDING (NOT A VALID TAX INVOICE)";
  text(title, margin, y, {
    size: 13,
    f: bold,
    color: allItemsHaveHsn ? [0.09, 0.25, 0.21] : [0.75, 0.1, 0.1],
  });
  y -= 20;

  text(`Invoice No: ${invoiceNumber}`, margin, y, { size: 10 });
  text(`Invoice Date: ${new Date().toLocaleDateString("en-IN")}`, 340, y, { size: 10 });
  y -= 14;
  text(`Order Tracking ID: ${order.trackingId}`, margin, y, { size: 10 });
  text(`Place of Supply: ${placeOfSupply}`, 340, y, { size: 10 });
  y -= 22;

  text("Billed To:", margin, y, { size: 10, f: bold });
  y -= 14;
  text(order.customer.name, margin, y, { size: 10 });
  y -= 12;
  text(order.customer.address, margin, y, { size: 10 });
  y -= 12;
  text(`${order.customer.city} - ${order.customer.pincode}`, margin, y, { size: 10 });
  y -= 12;
  text(`Phone: ${order.customer.phone}`, margin, y, { size: 10 });
  y -= 24;

  // --- Table ---
  const col = {
    sno: margin,
    item: margin + 22,
    hsn: margin + 175,
    weight: margin + 230,
    qty: margin + 268,
    rate: margin + 298,
    taxable: margin + 345,
    cgst: margin + 400,
    sgst: margin + 440,
    igst: margin + 480,
  };

  function drawTableHeader() {
    text("#", col.sno, y, { size: 8, f: bold });
    text("Item", col.item, y, { size: 8, f: bold });
    text("HSN", col.hsn, y, { size: 8, f: bold });
    text("Wt", col.weight, y, { size: 8, f: bold });
    text("Qty", col.qty, y, { size: 8, f: bold });
    text("Rate", col.rate, y, { size: 8, f: bold });
    text("Taxable", col.taxable, y, { size: 8, f: bold });
    text("CGST", col.cgst, y, { size: 8, f: bold });
    text("SGST", col.sgst, y, { size: 8, f: bold });
    text("IGST", col.igst, y, { size: 8, f: bold });
    y -= 6;
    hLine(y);
    y -= 12;
  }

  drawTableHeader();

  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let grandTotal = 0;

  order.items.forEach((item, idx) => {
    const product = catalog.find((p) => p.id === item.productId);
    const hsn = product?.hsnCode || "__________";
    const lineInclusive = item.price * item.quantity;
    const gst = splitInclusiveGst(lineInclusive, isIntraState);

    totalTaxable += gst.taxableValuePaise;
    totalCgst += gst.cgstPaise;
    totalSgst += gst.sgstPaise;
    totalIgst += gst.igstPaise;
    grandTotal += gst.totalPaise;

    newPageIfNeeded(90);
    text(String(idx + 1), col.sno, y, { size: 8 });
    text(item.name.slice(0, 27), col.item, y, { size: 8 });
    text(hsn, col.hsn, y, { size: 8, color: hsn === "__________" ? [0.75, 0.1, 0.1] : undefined });
    text(item.weight || "-", col.weight, y, { size: 8 });
    text(String(item.quantity), col.qty, y, { size: 8 });
    text(rupees(item.price * 100), col.rate, y, { size: 8 });
    text(rupees(gst.taxableValuePaise), col.taxable, y, { size: 8 });
    text(isIntraState ? rupees(gst.cgstPaise) : "-", col.cgst, y, { size: 8 });
    text(isIntraState ? rupees(gst.sgstPaise) : "-", col.sgst, y, { size: 8 });
    text(!isIntraState ? rupees(gst.igstPaise) : "-", col.igst, y, { size: 8 });
    y -= 14;
  });

  y -= 4;
  hLine(y);
  y -= 16;

  text("Taxable Value:", 360, y, { size: 9, f: bold });
  text(`Rs. ${rupees(totalTaxable)}`, 480, y, { size: 9 });
  y -= 14;

  if (isIntraState) {
    text("CGST (2.5%):", 360, y, { size: 9 });
    text(`Rs. ${rupees(totalCgst)}`, 480, y, { size: 9 });
    y -= 14;
    text("SGST (2.5%):", 360, y, { size: 9 });
    text(`Rs. ${rupees(totalSgst)}`, 480, y, { size: 9 });
    y -= 14;
  } else {
    text("IGST (5%):", 360, y, { size: 9 });
    text(`Rs. ${rupees(totalIgst)}`, 480, y, { size: 9 });
    y -= 14;
  }

  text("Grand Total:", 360, y, { size: 11, f: bold });
  text(`Rs. ${rupees(grandTotal)}`, 480, y, { size: 11, f: bold });
  y -= 30;

  if (!allItemsHaveHsn) {
    newPageIfNeeded(60);
    text(
      "One or more items on this order do not yet have an HSN code assigned in the product catalog.",
      margin,
      y,
      { size: 8, color: [0.75, 0.1, 0.1] }
    );
    y -= 12;
    text(
      "This document is a draft for internal reference only and must not be issued as a final GST tax invoice.",
      margin,
      y,
      { size: 8, color: [0.75, 0.1, 0.1] }
    );
    y -= 20;
  }

  text("This is a system-generated document.", margin, 40, { size: 8, color: [0.5, 0.5, 0.5] });

  return pdfDoc.save();
}
