import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";
import { dbRpc, dbUpdate } from "./supabase";
import { stateFromPincode } from "./pincode-state";
import { prepaidDiscountRateForWeight } from "./pricing";
import { products as catalog } from "@/data/products";
import { company } from "@/data/company";
import type { Order } from "./order-store";

/**
 * GST INVOICE GENERATION
 * --------------------------------------------------------------
 * Official company details, exactly as given on the GST certificate.
 * Do not "clean up" spelling/formatting here without checking against
 * the certificate again — this is what appears on every invoice.
 *
 * Layout below is modeled directly on the Tally-generated tax invoice
 * the business actually issues (reference: invoice GEWEB2627000004,
 * 25-Aug-26) — same field labels, same table structure, same
 * declaration/signatory block — so a PDF generated here looks like
 * the same document, not a different-looking "website invoice".
 */
export const COMPANY = {
  legalName: "GITAMRI ENTERPRISE PVT. LTD.",
  gstin: "27AAMCG0530G1ZT",
  addressLines: [
    "FL NO - 102, SUMAN TOWER",
    "SUMAN NAGARI, GODHANI RLY, GODHANI",
    "NAGPUR",
  ],
  state: "Maharashtra",
  stateCode: "27",
  contact: "9172285933",
  email: company.supportEmail,
} as const;

const GST_RATE_PERCENT = 5;
const INVOICE_PREFIX = "GEWEB";

// Standard GST state codes for the states this business ships to
// (per lib/pincode-state.ts's coverage). "North East India" is a
// multi-state bucket with no single code, so it's left blank.
const STATE_GST_CODE: Record<string, string> = {
  "Jammu & Kashmir": "01",
  "Himachal Pradesh": "02",
  Punjab: "03",
  Uttarakhand: "05",
  Haryana: "06",
  Delhi: "07",
  Rajasthan: "08",
  "Uttar Pradesh": "09",
  Bihar: "10",
  Jharkhand: "20",
  Odisha: "21",
  Chhattisgarh: "22",
  "Madhya Pradesh": "23",
  Gujarat: "24",
  Maharashtra: "27",
  "Andhra Pradesh": "37",
  Karnataka: "29",
  Kerala: "32",
  "Tamil Nadu": "33",
  Telangana: "36",
  "West Bengal": "19",
  Assam: "18",
};

// Matches a state name to its canonical form (as used as the STATE_GST_CODE
// keys) case-insensitively. Real-world state strings can arrive in varying
// case — typed by hand at checkout, or from the pincode-lookup API — and a
// mismatch here would silently break both the GST code lookup and the
// intra-state vs inter-state (CGST+SGST vs IGST) decision below.
function normalizeStateName(raw: string): string {
  const trimmed = raw.trim();
  const match = Object.keys(STATE_GST_CODE).find(
    (canonical) => canonical.toLowerCase() === trimmed.toLowerCase()
  );
  return match ?? trimmed;
}

function financialYearParts(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = fyStart + 1;
  return {
    start: (fyStart % 100).toString().padStart(2, "0"),
    end: (fyEnd % 100).toString().padStart(2, "0"),
  };
}

function formatInvoiceDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-IN", { month: "short" });
  const year = (date.getFullYear() % 100).toString().padStart(2, "0");
  return `${day}-${month}-${year}`;
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

// ---------------------------------------------------------------
// Amount-in-words (Indian numbering system: lakh/crore, not million)
// ---------------------------------------------------------------
const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens];
}

function threeDigitWords(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds && rest) return `${ONES[hundreds]} Hundred ${twoDigitWords(rest)}`;
  if (hundreds) return `${ONES[hundreds]} Hundred`;
  return twoDigitWords(rest);
}

/** Converts a non-negative integer into Indian-numbering-system words. */
function integerToWords(n: number): string {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = n;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigitWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitWords(hundred));
  return parts.join(" ");
}

/** e.g. 608 -> "INR Six Hundred Eight Only" */
function rupeesInWords(rupeesAmount: number): string {
  return `INR ${integerToWords(Math.round(rupeesAmount))} Only`;
}

/** e.g. 28.94 -> "INR Twenty Eight and Ninety Four Paise Only" */
function amountInWordsWithPaise(amount: number): string {
  const rupeePart = Math.floor(amount);
  const paisePart = Math.round((amount - rupeePart) * 100);
  if (paisePart === 0) return rupeesInWords(rupeePart);
  return `INR ${integerToWords(rupeePart)} and ${integerToWords(paisePart)} Paise Only`;
}

/**
 * Returns this order's invoice number, generating one the first time
 * it's requested and persisting it so every later download of the same
 * order's invoice reuses the same number. Numbers come from a Postgres
 * sequence (next_invoice_number(), created via the migration in
 * supabase/002_invoice_migration.sql) so two admins downloading
 * invoices at the same moment can never collide on the same number.
 *
 * Format matches the business's existing Tally numbering exactly:
 * GEWEB<FY start><FY end><6-digit sequence>, e.g. GEWEB2627000004
 * for an invoice raised in FY 2026-27.
 */
export async function getOrCreateInvoiceNumber(order: Order): Promise<string> {
  if (order.invoiceNumber) return order.invoiceNumber;

  const seq = await dbRpc<number>("next_invoice_number");
  const fy = financialYearParts(new Date());
  const invoiceNumber = `${INVOICE_PREFIX}${fy.start}${fy.end}${String(seq).padStart(6, "0")}`;

  await dbUpdate("Order", `trackingId=eq.${encodeURIComponent(order.trackingId)}`, {
    invoiceNumber,
    invoiceGeneratedAt: new Date().toISOString(),
  });

  return invoiceNumber;
}

// ---------------------------------------------------------------
// PDF layout
// ---------------------------------------------------------------
const PAGE_WIDTH = 595.28; // A4 in points
const PAGE_HEIGHT = 841.89;
const MARGIN = 32;
const RIGHT_EDGE = PAGE_WIDTH - MARGIN;

/**
 * Makes arbitrary customer-entered text (name, address, city — anything
 * that isn't our own copy) safe to pass to pdf-lib's standard fonts.
 *
 * This exists because a real invoice crashed in production: a customer's
 * address (pasted from Google Maps/WhatsApp, most likely) contained a
 * literal newline character. pdf-lib's WinAnsi-encoded standard fonts
 * can't measure or draw a bare \n, \r, \t, other control characters, or
 * anything outside the Latin-1 range (emoji, most non-Latin scripts) —
 * font.widthOfTextAtSize() throws on them, which crashed invoice
 * generation entirely for that order. Every place in this file that
 * draws customer-supplied text runs it through this first so a single
 * unusual character in someone's address can never take down the whole
 * PDF again.
 */
// Windows-1252 (WinAnsi)'s upper range (0x80-0x9F) maps to these specific
// Unicode code points — real, WinAnsi-encodable characters that just
// happen to sit well above the 0x00-0xFF cutoff sanitizeForPdf otherwise
// uses. Without this allowlist, sanitizeForPdf would mangle the very
// ellipsis it adds when truncating text (a real bug this shipped with
// earlier tonight — showed up as a stray "?" on a live customer invoice
// where "…" should have been), plus any customer-typed curly quotes,
// en/em dashes, or bullets.
const WINANSI_UPPER_RANGE = new Set([
  "\u20AC", "\u201A", "\u0192", "\u201E", "\u2026", "\u2020", "\u2021",
  "\u02C6", "\u2030", "\u0160", "\u2039", "\u0152", "\u017D", "\u2018",
  "\u2019", "\u201C", "\u201D", "\u2022", "\u2013", "\u2014", "\u02DC",
  "\u2122", "\u0161", "\u203A", "\u0153", "\u017E", "\u0178",
]);

function sanitizeForPdf(str: string): string {
  return str
    .replace(/[\r\n\t]+/g, " ") // line/tab breaks -> single space, keeps it one line
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // other control chars
    .replace(/[^\u0000-\u00FF]/g, (ch) => (WINANSI_UPPER_RANGE.has(ch) ? ch : "?")) // outside WinAnsi's range
    .replace(/ {2,}/g, " ")
    .trim();
}

export async function generateInvoicePdf(order: Order): Promise<Uint8Array> {
  const invoiceNumber = await getOrCreateInvoiceNumber(order);
  const invoiceDate = new Date();
  // Prefer the real state captured at checkout (order.customer.state, via
  // /api/pincode) since it's exact — the pincode-prefix approximation in
  // lib/pincode-state.ts is only a fallback for orders placed before that
  // field existed.
  const placeOfSupply = normalizeStateName(order.customer.state || stateFromPincode(order.customer.pincode));
  const isIntraState = placeOfSupply === COMPANY.state;
  const buyerStateCode = STATE_GST_CODE[placeOfSupply] ?? "";

  // A GST tax invoice legally needs an HSN code on every line. HSN codes
  // are deliberately left blank in the catalog until confirmed (see
  // types/product.ts) — never invented here. Until every item on this
  // order has one, the PDF is clearly watermarked as a draft so it can
  // never be mistaken for, or filed as, a valid tax invoice.
  const allItemsHaveHsn = order.items.every((item) => {
    const product = catalog.find((p) => p.id === item.productId);
    return Boolean(product?.hsnCode);
  });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let logoImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  try {
    const logoBytes = await readFile(path.join(process.cwd(), "public", "invoice-logo.png"));
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch {
    logoImage = null;
  }

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  function text(
    str: string,
    x: number,
    yPos: number,
    opts: { size?: number; f?: PDFFont; color?: [number, number, number]; align?: "left" | "right" | "center"; maxWidth?: number } = {}
  ) {
    const size = opts.size ?? 8;
    const f = opts.f ?? font;
    str = sanitizeForPdf(str);
    let drawX = x;
    if (opts.align === "right" && opts.maxWidth !== undefined) {
      const w = f.widthOfTextAtSize(str, size);
      drawX = x + opts.maxWidth - w;
    } else if (opts.align === "center" && opts.maxWidth !== undefined) {
      const w = f.widthOfTextAtSize(str, size);
      drawX = x + (opts.maxWidth - w) / 2;
    }
    page.drawText(str, {
      x: drawX,
      y: yPos,
      size,
      font: f,
      color: opts.color ? rgb(...opts.color) : rgb(0, 0, 0),
    });
  }

  function rect(x: number, yTop: number, w: number, h: number) {
    page.drawRectangle({
      x,
      y: yTop - h,
      width: w,
      height: h,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.75,
    });
  }

  function hLine(x1: number, x2: number, yPos: number) {
    page.drawLine({ start: { x: x1, y: yPos }, end: { x: x2, y: yPos }, thickness: 0.75, color: rgb(0, 0, 0) });
  }

  function vLine(x: number, y1: number, y2: number) {
    page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness: 0.75, color: rgb(0, 0, 0) });
  }

  /** Truncates str (adding "…" if cut) so it fits within maxWidth at the given font/size. */
  function truncateToFit(str: string, maxWidth: number, f: PDFFont, size: number): string {
    str = sanitizeForPdf(str);
    if (f.widthOfTextAtSize(str, size) <= maxWidth) return str;
    let lo = 0;
    let hi = str.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      const candidate = str.slice(0, mid) + "…";
      if (f.widthOfTextAtSize(candidate, size) <= maxWidth) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return str.slice(0, lo) + "…";
  }

  // ============================================================
  // Title
  // ============================================================
  let y = 805;
  text("Tax Invoice", MARGIN, y, { size: 15, f: bold, align: "center", maxWidth: RIGHT_EDGE - MARGIN });
  y -= 22;

  // ============================================================
  // Header block: company/consignee/buyer (left) vs invoice meta (right)
  // ============================================================
  const headerTop = y;
  const midX = MARGIN + 330;
  const rightW = RIGHT_EDGE - midX;
  const subColW = rightW / 2;

  // --- Row A: 128pt tall ---
  const rowAHeight = 128;
  const rowAFieldH = rowAHeight / 4;

  rect(MARGIN, headerTop, midX - MARGIN, rowAHeight); // company cell
  rect(midX, headerTop, rightW, rowAHeight); // right meta outer box

  // Company cell content
  let cy = headerTop - 12;
  const LOGO_SIZE = 34;
  let companyTextX = MARGIN + 6;
  if (logoImage) {
    page.drawImage(logoImage, { x: MARGIN + 6, y: cy - LOGO_SIZE + 8, width: LOGO_SIZE, height: LOGO_SIZE });
    companyTextX = MARGIN + 6 + LOGO_SIZE + 8;
  }
  text(COMPANY.legalName, companyTextX, cy, { size: 10, f: bold });
  cy -= 12;
  for (const line of COMPANY.addressLines) {
    text(line, companyTextX, cy, { size: 8 });
    cy -= 10;
  }
  cy -= 2;
  text(`GSTIN/UIN: ${COMPANY.gstin}`, MARGIN + 6, cy, { size: 8 });
  cy -= 10;
  text(`State Name : ${COMPANY.state}, Code : ${COMPANY.stateCode}`, MARGIN + 6, cy, { size: 8 });
  cy -= 10;
  text(`Contact : ${COMPANY.contact}`, MARGIN + 6, cy, { size: 8 });
  cy -= 10;
  text(`E-Mail : ${COMPANY.email}`, MARGIN + 6, cy, { size: 8 });

  // Right meta grid: 4 rows x 2 label/value columns
  const metaRows: [string, string, string, string][] = [
    ["Invoice No.", invoiceNumber, "Dated", formatInvoiceDate(invoiceDate)],
    ["Delivery Note", "", "Mode/Terms of Payment", order.paymentMethod === "ONLINE" ? "Prepaid (Online)" : "Cash on Delivery"],
    ["Reference No. & Date.", "", "Other References", ""],
    ["Buyer's Order No.", "", "Dated", ""],
  ];
  metaRows.forEach((row, i) => {
    const rowTop = headerTop - i * rowAFieldH;
    if (i > 0) hLine(midX, RIGHT_EDGE, rowTop);
    const [label1, val1, label2, val2] = row;
    text(label1, midX + 4, rowTop - 10, { size: 7.5 });
    text(truncateToFit(val1, subColW - 6, bold, 8), midX + 4, rowTop - 21, { size: 8, f: bold });
    vLine(midX + subColW, rowTop, rowTop - rowAFieldH);
    text(label2, midX + subColW + 4, rowTop - 10, { size: 7.5 });
    text(truncateToFit(val2, subColW - 6, bold, 8), midX + subColW + 4, rowTop - 21, { size: 8, f: bold });
  });

  // --- Row B: Consignee + Buyer (left, stacked) vs dispatch info (right) ---
  const rowBTop = headerTop - rowAHeight;
  const consigneeH = 70;
  const buyerH = 92;
  const rowBHeight = consigneeH + buyerH;

  rect(MARGIN, rowBTop, midX - MARGIN, consigneeH);
  rect(MARGIN, rowBTop - consigneeH, midX - MARGIN, buyerH);
  rect(midX, rowBTop, rightW, rowBHeight);

  const leftCellW = midX - MARGIN - 12;
  // Consignee (Ship to)
  let sy = rowBTop - 10;
  text("Consignee (Ship to)", MARGIN + 6, sy, { size: 7.5, f: italic });
  sy -= 11;
  text(truncateToFit(`${order.customer.name} - ${order.customer.phone}`, leftCellW, bold, 8.5), MARGIN + 6, sy, { size: 8.5, f: bold });
  sy -= 10;
  text(truncateToFit(order.customer.address, leftCellW, font, 8), MARGIN + 6, sy, { size: 8 });
  sy -= 10;
  text(`${order.customer.city} - ${order.customer.pincode}`, MARGIN + 6, sy, { size: 8 });
  sy -= 10;
  text(`State Name : ${placeOfSupply}${buyerStateCode ? `, Code : ${buyerStateCode}` : ""}`, MARGIN + 6, sy, { size: 8 });

  // Buyer (Bill to)
  let by = rowBTop - consigneeH - 10;
  text("Buyer (Bill to)", MARGIN + 6, by, { size: 7.5, f: italic });
  by -= 11;
  text(truncateToFit(`${order.customer.name} - ${order.customer.phone}`, leftCellW, bold, 8.5), MARGIN + 6, by, { size: 8.5, f: bold });
  by -= 10;
  text(truncateToFit(order.customer.address, leftCellW, font, 8), MARGIN + 6, by, { size: 8 });
  by -= 10;
  text(`${order.customer.city} - ${order.customer.pincode}`, MARGIN + 6, by, { size: 8 });
  by -= 10;
  text(`State Name : ${placeOfSupply}${buyerStateCode ? `, Code : ${buyerStateCode}` : ""}`, MARGIN + 6, by, { size: 8 });

  // Dispatch info grid on the right: 3 rows + a taller Terms-of-Delivery row
  const dispatchRowH = 28;
  const dispatchRows: [string, string, string, string][] = [
    ["Dispatch Doc No.", invoiceNumber, "Delivery Note Date", formatInvoiceDate(invoiceDate)],
    ["Dispatched through", "Delhivery Logistics", "Destination", order.customer.city],
    [
      "Bill of Lading/LR-RR No.",
      order.delhiveryWaybill ? `AWB# ${order.delhiveryWaybill}` : "",
      "Motor Vehicle No.",
      "NA",
    ],
  ];
  dispatchRows.forEach((row, i) => {
    const rowTop = rowBTop - i * dispatchRowH;
    if (i > 0) hLine(midX, RIGHT_EDGE, rowTop);
    const [label1, val1, label2, val2] = row;
    text(label1, midX + 4, rowTop - 10, { size: 7.5 });
    text(truncateToFit(val1, subColW - 6, bold, 7.5), midX + 4, rowTop - 21, { size: 7.5, f: bold });
    vLine(midX + subColW, rowTop, rowTop - dispatchRowH);
    text(label2, midX + subColW + 4, rowTop - 10, { size: 7.5 });
    text(val2, midX + subColW + 4, rowTop - 21, { size: 8, f: bold });
  });
  const termsRowTop = rowBTop - 3 * dispatchRowH;
  hLine(midX, RIGHT_EDGE, termsRowTop);
  text("Terms of Delivery", midX + 4, termsRowTop - 10, { size: 7.5 });

  y = rowBTop - rowBHeight - 8;

  // ============================================================
  // Line items table
  // ============================================================
  const col = {
    sno: MARGIN,
    snoW: 20,
    desc: MARGIN + 20,
    descW: 195,
    hsn: MARGIN + 215,
    hsnW: 42,
    qty: MARGIN + 257,
    qtyW: 45,
    rate: MARGIN + 302,
    rateW: 48,
    disc: MARGIN + 350,
    discW: 30,
    amount: MARGIN + 380,
    amountW: RIGHT_EDGE - (MARGIN + 380),
  };

  const tableTop = y;
  text("SI", col.sno, y - 9, { size: 7.5, f: bold });
  text("No.", col.sno, y - 19, { size: 7.5, f: bold });
  text("Description of Goods", col.desc, y - 12, { size: 7.5, f: bold, align: "center", maxWidth: col.descW });
  text("HSN/SAC", col.hsn, y - 12, { size: 7.5, f: bold, align: "center", maxWidth: col.hsnW });
  text("Quantity", col.qty, y - 12, { size: 7.5, f: bold, align: "center", maxWidth: col.qtyW });
  text("Rate", col.rate, y - 9, { size: 7.5, f: bold, align: "center", maxWidth: col.rateW });
  text("(Incl. of Tax)", col.rate, y - 19, { size: 6.5, f: font, align: "center", maxWidth: col.rateW });
  text("Disc. %", col.disc, y - 12, { size: 7.5, f: bold, align: "center", maxWidth: col.discW });
  text("Amount", col.amount, y - 12, { size: 7.5, f: bold, align: "center", maxWidth: col.amountW });
  y -= 24;
  hLine(MARGIN, RIGHT_EDGE, y);

  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let grandTotal = 0;
  let totalQty = 0;
  const hsnGroups = new Map<string, { taxable: number; cgst: number; sgst: number; igst: number }>();

  order.items.forEach((item, idx) => {
    const product = catalog.find((p) => p.id === item.productId);
    const hsn = product?.hsnCode || "";
    const lineListInclusive = item.price * item.quantity;

    // GST is legally due on the amount actually paid, not the pre-discount
    // list price — Section 15 of the CGST Act requires discounts known at
    // the time of supply to reduce the taxable value. The prepaid discount
    // (online orders only, tiered by jar size) is applied here from the
    // exact same rate table pricing.ts used when the order was charged, so
    // the invoice can never drift from what the customer actually paid.
    // "Rate" below still shows the full list price (standard invoice
    // convention — MRP in Rate, reduction in Disc. %, net amount in Amount).
    const discountRate = order.paymentMethod === "ONLINE" ? prepaidDiscountRateForWeight(item.weight) : 0;
    // Rounded to whole rupees, in that order — exactly mirroring
    // calculateOrderTotal() in pricing.ts, which is what actually
    // determined order.total at checkout. Rounding in paise here instead
    // would leave a small but real mismatch against the amount the
    // customer was actually charged.
    const lineDiscountPaise = Math.round(lineListInclusive * discountRate) * 100;
    const lineNetInclusive = lineListInclusive - lineDiscountPaise / 100;
    const gst = splitInclusiveGst(lineNetInclusive, isIntraState);

    totalCgst += gst.cgstPaise;
    totalSgst += gst.sgstPaise;
    totalIgst += gst.igstPaise;
    grandTotal += gst.totalPaise;
    totalQty += item.quantity;

    const groupKey = hsn || "—";
    const g = hsnGroups.get(groupKey) ?? { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    g.taxable += gst.taxableValuePaise;
    g.cgst += gst.cgstPaise;
    g.sgst += gst.sgstPaise;
    g.igst += gst.igstPaise;
    hsnGroups.set(groupKey, g);

    y -= 12;
    text(String(idx + 1), col.sno, y, { size: 8 });
    const label = `${item.name}${item.weight ? ` | ${item.weight}` : ""}`;
    text(truncateToFit(label, col.descW - 4, bold, 8), col.desc, y, { size: 8, f: bold });
    text(hsn || "-", col.hsn, y, { size: 8, align: "center", maxWidth: col.hsnW });
    text(`${item.quantity} PCS`, col.qty, y, { size: 8, align: "center", maxWidth: col.qtyW });
    text(item.price.toFixed(2), col.rate, y, { size: 8, align: "right", maxWidth: col.rateW - 4 });
    text(discountRate > 0 ? `${(discountRate * 100).toFixed(0)}%` : "-", col.disc, y, {
      size: 8,
      align: "center",
      maxWidth: col.discW,
    });
    // Amount here is the line's taxable (pre-tax, post-discount) value —
    // tax is added back in below via the OUTPUT CGST/SGST/IGST rows,
    // matching how the reference Tally invoice presents it.
    text(rupees(gst.taxableValuePaise), col.amount, y, { size: 8, align: "right", maxWidth: col.amountW - 4 });
  });

  const itemRowsBottom = y - 4;
  // Column dividers only span the item rows themselves — the OUTPUT CGST/SGST/
  // ROUNDOFF/Total lines below read as a single merged row (matching the
  // reference invoice), except for the Amount column which continues down.
  vLine(col.desc - 2, tableTop, itemRowsBottom);
  vLine(col.hsn - 2, tableTop, itemRowsBottom);
  vLine(col.qty - 2, tableTop, itemRowsBottom);
  vLine(col.rate - 2, tableTop, itemRowsBottom);
  vLine(col.disc - 2, tableTop, itemRowsBottom);

  const summaryLabelMaxWidth = col.amount - 6 - col.desc;
  y -= 18;
  if (isIntraState) {
    if (totalCgst > 0) {
      text("OUTPUT CGST 2.5%", col.desc, y, { size: 8, f: italic, align: "right", maxWidth: summaryLabelMaxWidth });
      text(rupees(totalCgst), col.amount, y, { size: 8, align: "right", maxWidth: col.amountW - 4 });
      y -= 12;
    }
    if (totalSgst > 0) {
      text("OUTPUT SGST 2.5%", col.desc, y, { size: 8, f: italic, align: "right", maxWidth: summaryLabelMaxWidth });
      text(rupees(totalSgst), col.amount, y, { size: 8, align: "right", maxWidth: col.amountW - 4 });
      y -= 12;
    }
  } else if (totalIgst > 0) {
    text("OUTPUT IGST 5%", col.desc, y, { size: 8, f: italic, align: "right", maxWidth: summaryLabelMaxWidth });
    text(rupees(totalIgst), col.amount, y, { size: 8, align: "right", maxWidth: col.amountW - 4 });
    y -= 12;
  }

  // Round-off between the tax-inclusive line sum and the order's actual total.
  const roundOffPaise = Math.round(order.total * 100) - grandTotal;
  if (roundOffPaise !== 0) {
    text("ROUNDOFF", col.desc, y, { size: 8, f: italic, align: "right", maxWidth: summaryLabelMaxWidth });
    text((roundOffPaise / 100).toFixed(2), col.amount, y, { size: 8, align: "right", maxWidth: col.amountW - 4 });
    y -= 12;
  }
  grandTotal += roundOffPaise;

  y -= 6;
  hLine(MARGIN, RIGHT_EDGE, y);
  const itemsEndY = y;
  vLine(col.amount - 2, tableTop, itemsEndY);
  rect(MARGIN, tableTop, RIGHT_EDGE - MARGIN, tableTop - itemsEndY);

  y -= 12;
  text("Total", col.qty, y, { size: 9, f: bold, align: "center", maxWidth: col.qtyW });
  y -= 11;
  text(`${totalQty} PCS`, col.qty, y, { size: 9, f: bold, align: "center", maxWidth: col.qtyW });
  text(`Rs. ${rupees(grandTotal)}`, col.amount, y, { size: 10, f: bold, align: "right", maxWidth: col.amountW - 4 });
  y -= 6;
  hLine(MARGIN, RIGHT_EDGE, y);

  // ============================================================
  // Amount chargeable in words
  // ============================================================
  y -= 14;
  text("Amount Chargeable (in words)", MARGIN + 4, y, { size: 8, f: italic });
  text("E. & O.E", RIGHT_EDGE - 40, y, { size: 8, f: italic });
  y -= 13;
  text(rupeesInWords(grandTotal / 100), MARGIN + 4, y, { size: 9.5, f: bold });
  y -= 10;
  hLine(MARGIN, RIGHT_EDGE, y);

  // ============================================================
  // HSN-wise tax summary
  // ============================================================
  const hsnCol = {
    hsn: MARGIN,
    taxable: MARGIN + 130,
    taxableW: 80,
    cgstRate: MARGIN + 210,
    cgstRateW: 40,
    cgstAmt: MARGIN + 250,
    cgstAmtW: 60,
    sgstRate: MARGIN + 310,
    sgstRateW: 40,
    sgstAmt: MARGIN + 350,
    sgstAmtW: 60,
    totalTax: MARGIN + 410,
    totalTaxW: RIGHT_EDGE - (MARGIN + 410),
  };
  const summaryTop = y;
  const groupHeaderY = summaryTop - 10; // "HSN/SAC", "Taxable", "CGST", "SGST/UTGST", "Total"
  const groupHeaderY2 = summaryTop - 19; // "Value" / "Tax Amount" second line
  const groupDividerY = summaryTop - 24; // separates CGST/SGST group label from Rate|Amount sub-labels
  const subHeaderY = summaryTop - 33; // "Rate" / "Amount" sub-labels
  const headerBottomY = summaryTop - 39;

  text("HSN/SAC", hsnCol.hsn + 4, groupHeaderY, { size: 7.5, f: bold });
  text("Taxable", hsnCol.taxable, groupHeaderY, { size: 7, f: bold, align: "center", maxWidth: hsnCol.taxableW });
  text("Value", hsnCol.taxable, groupHeaderY2, { size: 7, f: bold, align: "center", maxWidth: hsnCol.taxableW });
  text("CGST", hsnCol.cgstRate, groupHeaderY, { size: 7, f: bold, align: "center", maxWidth: hsnCol.cgstAmt + hsnCol.cgstAmtW - hsnCol.cgstRate });
  text("SGST/UTGST", hsnCol.sgstRate, groupHeaderY, { size: 7, f: bold, align: "center", maxWidth: hsnCol.sgstAmt + hsnCol.sgstAmtW - hsnCol.sgstRate });
  text("Total", hsnCol.totalTax, groupHeaderY, { size: 7, f: bold, align: "center", maxWidth: hsnCol.totalTaxW });
  text("Tax Amount", hsnCol.totalTax, groupHeaderY2, { size: 6.5, f: bold, align: "center", maxWidth: hsnCol.totalTaxW });

  hLine(hsnCol.cgstRate, hsnCol.cgstAmt + hsnCol.cgstAmtW, groupDividerY);
  hLine(hsnCol.sgstRate, hsnCol.sgstAmt + hsnCol.sgstAmtW, groupDividerY);
  text("Rate", hsnCol.cgstRate, subHeaderY, { size: 6.5, f: bold, align: "center", maxWidth: hsnCol.cgstRateW });
  text("Amount", hsnCol.cgstAmt, subHeaderY, { size: 6.5, f: bold, align: "center", maxWidth: hsnCol.cgstAmtW });
  text("Rate", hsnCol.sgstRate, subHeaderY, { size: 6.5, f: bold, align: "center", maxWidth: hsnCol.sgstRateW });
  text("Amount", hsnCol.sgstAmt, subHeaderY, { size: 6.5, f: bold, align: "center", maxWidth: hsnCol.sgstAmtW });

  y = headerBottomY;
  hLine(MARGIN, RIGHT_EDGE, y);

  let sumTaxable = 0;
  let sumCgst = 0;
  let sumSgst = 0;
  let sumIgst = 0;
  for (const [hsn, g] of hsnGroups.entries()) {
    y -= 12;
    text(hsn, hsnCol.hsn + 4, y, { size: 8 });
    text(rupees(g.taxable), hsnCol.taxable, y, { size: 8, align: "right", maxWidth: hsnCol.taxableW - 4 });
    if (isIntraState) {
      text("2.50%", hsnCol.cgstRate, y, { size: 8, align: "center", maxWidth: hsnCol.cgstRateW });
      text(rupees(g.cgst), hsnCol.cgstAmt, y, { size: 8, align: "right", maxWidth: hsnCol.cgstAmtW - 4 });
      text("2.50%", hsnCol.sgstRate, y, { size: 8, align: "center", maxWidth: hsnCol.sgstRateW });
      text(rupees(g.sgst), hsnCol.sgstAmt, y, { size: 8, align: "right", maxWidth: hsnCol.sgstAmtW - 4 });
    } else {
      text("-", hsnCol.cgstRate, y, { size: 8, align: "center", maxWidth: hsnCol.cgstRateW });
      text("-", hsnCol.cgstAmt, y, { size: 8, align: "center", maxWidth: hsnCol.cgstAmtW });
      text("-", hsnCol.sgstRate, y, { size: 8, align: "center", maxWidth: hsnCol.sgstRateW });
      text("-", hsnCol.sgstAmt, y, { size: 8, align: "center", maxWidth: hsnCol.sgstAmtW });
    }
    const lineTax = g.cgst + g.sgst + g.igst;
    text(rupees(lineTax), hsnCol.totalTax, y, { size: 8, align: "right", maxWidth: hsnCol.totalTaxW - 4 });
    sumTaxable += g.taxable;
    sumCgst += g.cgst;
    sumSgst += g.sgst;
    sumIgst += g.igst;
  }
  y -= 6;
  hLine(MARGIN, RIGHT_EDGE, y);
  y -= 12;
  text("Total", hsnCol.hsn + 4, y, { size: 8, f: bold });
  text(rupees(sumTaxable), hsnCol.taxable, y, { size: 8, f: bold, align: "right", maxWidth: hsnCol.taxableW - 4 });
  if (isIntraState) {
    text(rupees(sumCgst), hsnCol.cgstAmt, y, { size: 8, f: bold, align: "right", maxWidth: hsnCol.cgstAmtW - 4 });
    text(rupees(sumSgst), hsnCol.sgstAmt, y, { size: 8, f: bold, align: "right", maxWidth: hsnCol.sgstAmtW - 4 });
  }
  const totalTaxAll = sumCgst + sumSgst + sumIgst;
  text(rupees(totalTaxAll), hsnCol.totalTax, y, { size: 8, f: bold, align: "right", maxWidth: hsnCol.totalTaxW - 4 });
  y -= 6;
  hLine(MARGIN, RIGHT_EDGE, y);
  rect(MARGIN, summaryTop, RIGHT_EDGE - MARGIN, summaryTop - y);
  // Group-boundary dividers (HSN|Taxable|CGST|SGST/UTGST|Total) run the full
  // height — they sit at true column-group edges, so they never cross the
  // merged "CGST" / "SGST/UTGST" header text.
  vLine(hsnCol.taxable, summaryTop, y);
  vLine(hsnCol.cgstRate, summaryTop, y);
  vLine(hsnCol.sgstRate, summaryTop, y);
  vLine(hsnCol.totalTax, summaryTop, y);
  // Rate|Amount sub-dividers only start below the group-label row, since
  // that row shows one merged "CGST"/"SGST/UTGST" label spanning both.
  vLine(hsnCol.cgstAmt, groupDividerY, y);
  vLine(hsnCol.sgstAmt, groupDividerY, y);

  y -= 14;
  text("Tax Amount (in words) :", MARGIN + 4, y, { size: 8, f: italic });
  text(amountInWordsWithPaise(totalTaxAll / 100), MARGIN + 150, y, { size: 9, f: bold });
  y -= 10;
  hLine(MARGIN, RIGHT_EDGE, y);

  // ============================================================
  // Declaration + signatory
  // ============================================================
  const declTop = y;
  const declHeight = 68;
  const declMidX = MARGIN + 300;
  rect(MARGIN, declTop, declMidX - MARGIN, declHeight);
  rect(declMidX, declTop, RIGHT_EDGE - declMidX, declHeight);

  let dy = declTop - 10;
  text("Declaration", MARGIN + 6, dy, { size: 8, f: bold });
  dy -= 10;
  const declLines = [
    "We declare that this invoice shows the actual price of the",
    "goods described and that all particulars are true and",
    "correct.",
  ];
  for (const line of declLines) {
    text(line, MARGIN + 6, dy, { size: 7.5 });
    dy -= 10;
  }

  let ry = declTop - 12;
  text(`for ${COMPANY.legalName}`, declMidX + 6, ry, { size: 8, f: bold, align: "center", maxWidth: RIGHT_EDGE - declMidX - 12 });
  ry -= 34;
  text("SIDDHANT KALKOTWAR", declMidX + 6, ry, { size: 8, f: bold, align: "center", maxWidth: RIGHT_EDGE - declMidX - 12 });
  ry -= 10;
  text("Authorised Signatory", declMidX + 6, ry, { size: 7.5, f: italic, align: "center", maxWidth: RIGHT_EDGE - declMidX - 12 });

  y = declTop - declHeight - 16;
  text("Thank you for bringing Maaji to your table.", MARGIN, y, {
    size: 9,
    f: bold,
    color: [0.09, 0.25, 0.21],
    align: "center",
    maxWidth: RIGHT_EDGE - MARGIN,
  });
  y -= 14;
  text("This is a Computer Generated Invoice", MARGIN, y, { size: 8, f: italic, align: "center", maxWidth: RIGHT_EDGE - MARGIN });

  // ============================================================
  // Draft watermark if HSN codes are missing on this order.
  // ============================================================
  if (!allItemsHaveHsn) {
    y -= 20;
    text(
      "One or more items on this order have no HSN code set in the product catalog yet.",
      MARGIN,
      y,
      { size: 8, color: [0.75, 0.1, 0.1] }
    );
    y -= 12;
    text(
      "This document is a DRAFT for internal reference only and must not be filed as a final GST tax invoice.",
      MARGIN,
      y,
      { size: 8, color: [0.75, 0.1, 0.1], f: bold }
    );
  }

  return pdfDoc.save();
}
