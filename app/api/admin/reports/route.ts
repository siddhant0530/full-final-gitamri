import { NextRequest, NextResponse } from "next/server";
import { getReportRows, generateReportExcel, generateReportPdf } from "@/lib/reports";

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

// GET /api/admin/reports?start=2026-01-01&end=2026-01-31&format=xlsx|pdf
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

  if (!start || !end) {
    return NextResponse.json({ error: "Both 'start' and 'end' dates are required." }, { status: 400 });
  }
  if (format !== "xlsx" && format !== "pdf") {
    return NextResponse.json({ error: "'format' must be 'xlsx' or 'pdf'." }, { status: 400 });
  }

  try {
    // Inclusive of the entire end date, not just midnight of it.
    const startISO = new Date(`${start}T00:00:00`).toISOString();
    const endISO = new Date(`${end}T23:59:59.999`).toISOString();

    const rows = await getReportRows(startISO, endISO);
    const label = start === end ? start : `${start}_to_${end}`;

    if (format === "xlsx") {
      const buf = await generateReportExcel(rows, label);
      return new NextResponse(toArrayBuffer(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Gitamri-Orders-${label}.xlsx"`,
        },
      });
    }

    const pdfBytes = await generateReportPdf(rows, label);
    return new NextResponse(toArrayBuffer(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Gitamri-Orders-${label}.pdf"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not generate report." }, { status: 500 });
  }
}
