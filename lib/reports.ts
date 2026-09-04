import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getOrdersInRange, formatOrderNumber, type Order } from "@/lib/order-store";
import { splitInclusiveGst, normalizeStateName, COMPANY } from "@/lib/invoice";
import { stateFromPincode } from "@/lib/pincode-state";
import { prepaidDiscountRateForWeight } from "@/lib/pricing";

/**
 * One row of the export — one row per ORDER (not per line item), since
 * this is for the CEO's own monthly/yearly bookkeeping entry, not a
 * replacement for the per-order GST invoice. Multiple items on one
 * order are joined into a single "Products" cell.
 */
export interface ReportRow {
  orderNo: string;
  date: string; // dd-mmm-yyyy, matches the invoice's date formatting
  customerName: string;
  products: string; // "Red Chilli Pickle | 220g x1, Mango Pickle | 500g x2"
  gstValue: number; // total tax (CGST+SGST or IGST) for the whole order, in rupees
  finalValue: number; // order.total — what the customer actually paid
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Same GST math as the invoice (splitInclusiveGst, applied per line item
 * after the prepaid discount), just summed to one number per order
 * instead of broken out into CGST/SGST/IGST columns — deliberately kept
 * in lockstep with lib/invoice.ts so this report and an individual
 * order's invoice can never disagree on what the GST was.
 */
function orderToReportRow(order: Order): ReportRow {
  // Must match invoice.ts's place-of-supply logic exactly (ship-to
  // state, falling back to billing when no separate shipping address
  // was given) — this drifted out of sync once BILLSHIP added a real
  // ship-to address, since GST's place of supply for goods follows the
  // delivery address, not billing.
  const shipState = order.shippingAddress?.state || order.customer.state;
  const shipPincode = order.shippingAddress?.pincode || order.customer.pincode;
  const placeOfSupply = normalizeStateName(shipState || stateFromPincode(shipPincode));
  const isIntraState = placeOfSupply === COMPANY.state;

  let gstTotalRupees = 0;
  const productParts: string[] = [];

  for (const item of order.items) {
    const discountRate = order.paymentMethod === "ONLINE" ? prepaidDiscountRateForWeight(item.weight) : 0;
    const lineListInclusive = item.price * item.quantity;
    const lineDiscountPaise = Math.round(lineListInclusive * discountRate) * 100;
    const lineNetInclusive = lineListInclusive - lineDiscountPaise / 100;
    const gst = splitInclusiveGst(lineNetInclusive, isIntraState);
    gstTotalRupees += (gst.cgstPaise + gst.sgstPaise + gst.igstPaise) / 100;

    productParts.push(`${item.name}${item.weight ? ` | ${item.weight}` : ""} x${item.quantity}`);
  }

  return {
    orderNo: formatOrderNumber(order),
    date: formatDate(order.createdAt),
    customerName: order.customer.name,
    products: productParts.join(", "),
    gstValue: Math.round(gstTotalRupees * 100) / 100,
    finalValue: order.total,
  };
}

/** Fetches orders in range and converts them to report rows, oldest first. */
export async function getReportRows(startISO: string, endISO: string): Promise<ReportRow[]> {
  const orders = await getOrdersInRange(startISO, endISO);
  return orders.map(orderToReportRow);
}

// ---------------------------------------------------------------
// Excel
// ---------------------------------------------------------------

export async function generateReportExcel(rows: ReportRow[], label: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Gitamri Maaji";
  wb.created = new Date();

  const sheet = wb.addWorksheet(label.slice(0, 31)); // Excel sheet-name length limit

  sheet.columns = [
    { header: "Order No.", key: "orderNo", width: 14 },
    { header: "Date", key: "date", width: 14 },
    { header: "Customer Name", key: "customerName", width: 28 },
    { header: "Products Ordered", key: "products", width: 50 },
    { header: "GST Value (₹)", key: "gstValue", width: 16 },
    { header: "Final Value (₹)", key: "finalValue", width: 16 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: "middle" };

  rows.forEach((r) => sheet.addRow(r));

  // Totals row
  const totalsRow = sheet.addRow({
    orderNo: "",
    date: "",
    customerName: "",
    products: "TOTAL",
    gstValue: rows.reduce((s, r) => s + r.gstValue, 0),
    finalValue: rows.reduce((s, r) => s + r.finalValue, 0),
  });
  totalsRow.font = { bold: true };

  sheet.getColumn("gstValue").numFmt = "#,##0.00";
  sheet.getColumn("finalValue").numFmt = "#,##0.00";

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

// ---------------------------------------------------------------
// PDF
// ---------------------------------------------------------------

export async function generateReportPdf(rows: ReportRow[], label: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 841.89; // A4 landscape — this table is wide (6 columns incl. a long product list)
  const PAGE_H = 595.28;
  const MARGIN = 32;
  const ROW_H = 16;
  const HEADER_H = 40;

  const cols = [
    { key: "orderNo" as const, label: "Order No.", x: MARGIN, w: 60 },
    { key: "date" as const, label: "Date", x: MARGIN + 60, w: 60 },
    { key: "customerName" as const, label: "Customer Name", x: MARGIN + 120, w: 130 },
    { key: "products" as const, label: "Products Ordered", x: MARGIN + 250, w: 420 },
    { key: "gstValue" as const, label: "GST (Rs.)", x: MARGIN + 670, w: 65 },
    { key: "finalValue" as const, label: "Final (Rs.)", x: MARGIN + 735, w: 65 },
  ];
  const tableRight = MARGIN + 800;

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  function drawHeader() {
    page.drawText(`Gitamri Maaji — Order Report (${label})`, {
      x: MARGIN,
      y: y - 14,
      size: 13,
      font: bold,
    });
    y -= HEADER_H;
    for (const col of cols) {
      page.drawText(col.label, { x: col.x, y: y - 10, size: 8.5, font: bold });
    }
    y -= 4;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: tableRight, y }, thickness: 0.75, color: rgb(0, 0, 0) });
    y -= ROW_H;
  }

  function newPage() {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
    drawHeader();
  }

  drawHeader();

  function truncate(s: string, maxChars: number): string {
    return s.length > maxChars ? s.slice(0, maxChars - 1) + "…" : s;
  }

  let gstSum = 0;
  let finalSum = 0;

  for (const row of rows) {
    if (y < MARGIN + ROW_H * 2) newPage();

    page.drawText(row.orderNo, { x: cols[0].x, y, size: 8, font });
    page.drawText(row.date, { x: cols[1].x, y, size: 8, font });
    page.drawText(truncate(row.customerName, 22), { x: cols[2].x, y, size: 8, font });
    page.drawText(truncate(row.products, 70), { x: cols[3].x, y, size: 8, font });
    page.drawText(row.gstValue.toFixed(2), { x: cols[4].x, y, size: 8, font });
    page.drawText(row.finalValue.toFixed(2), { x: cols[5].x, y, size: 8, font });

    gstSum += row.gstValue;
    finalSum += row.finalValue;
    y -= ROW_H;
  }

  y -= 4;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: tableRight, y }, thickness: 0.75, color: rgb(0, 0, 0) });
  y -= ROW_H;
  page.drawText("TOTAL", { x: cols[3].x, y, size: 9, font: bold });
  page.drawText(gstSum.toFixed(2), { x: cols[4].x, y, size: 9, font: bold });
  page.drawText(finalSum.toFixed(2), { x: cols[5].x, y, size: 9, font: bold });

  return pdfDoc.save();
}
