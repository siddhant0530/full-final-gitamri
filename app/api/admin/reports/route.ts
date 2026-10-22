import { NextRequest, NextResponse } from "next/server";
import { getReportRows, generateReportExcel, generateReportPdf, type ReportKind } from "@/lib/reports";

// Copies bytes into a fresh, plain ArrayBuffer. Needed because both
// exceljs (Buffer) and pdf-lib (Uint8Array) return byte arrays typed
// against ArrayBufferLike in this @types/node version, which doesn't
// line up with what NextResponse's body type expects (plain
// ArrayBuffer) — copying sidesteps that mismatch entirely.
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
}

// GET /api/admin/reports?start=2026-01-01&end=2026-01-31&format=xlsx|pdf&type=sales|complimentary
//
// Custom date-range export of orders for the CEO's manual monthly/yearly
// bookkeeping entry: order no., date, customer name, products ordered
// (with weight), GST value, final value — one row per order.
//
// Gated by middleware.ts alongside the other /api/admin/* routes (see
// isProtectedAdminApi there — this path needs to be added to that list).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const format = searchParams.get("format");
  const kind: ReportKind = searchParams.get("type") === "complimentary" ? "complimentary" : "sales";

  if (!start || !end) {
    return NextResponse.json({ error: "Both 'start' and 'end' dates are required." }, { status: 400 });
  }
  if (format !== "xlsx" && format !== "pdf") {
    return NextResponse.json({ error: "'format' must be 'xlsx' or 'pdf'." }, { status: 400 });
  }

  try {
    // Inclusive of the entire end date, not just midnight of it.
    // Picked dates are IST calendar days; the server runs in UTC, so pin the offset.
    const startISO = new Date(`${start}T00:00:00+05:30`).toISOString();
    const endISO = new Date(`${end}T23:59:59.999+05:30`).toISOString();

    const rows = await getReportRows(startISO, endISO, kind);
    const label = start === end ? start : `${start}_to_${end}`;
    const filePrefix = kind === "complimentary" ? "Gitamri-Complimentary" : "Gitamri-Sales";

    if (format === "xlsx") {
      const buf = await generateReportExcel(rows, label, kind);
      return new NextResponse(toArrayBuffer(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filePrefix}-${label}.xlsx"`,
        },
      });
    }

    const pdfBytes = await generateReportPdf(rows, label, kind);
    return new NextResponse(toArrayBuffer(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filePrefix}-${label}.pdf"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not generate report." }, { status: 500 });
  }
}
