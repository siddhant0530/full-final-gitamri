import { NextRequest, NextResponse } from "next/server";
import { getOrderByTrackingId } from "@/lib/order-store";
import { generateInvoicePdf } from "@/lib/invoice";

// GET /api/admin/invoice/:trackingId -> generates (or re-generates, reusing
// the same persisted invoice number) a GST invoice PDF for one order.
// Gated by middleware.ts alongside the other /api/admin/* routes.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;
  try {
    const order = await getOrderByTrackingId(trackingId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const pdfBytes = await generateInvoicePdf(order);
    // pdf-lib's Uint8Array return type doesn't line up with what
    // NextResponse's body type expects in this @types/node version
    // (a known ArrayBufferLike vs ArrayBuffer mismatch). Copying into a
    // fresh, plain ArrayBuffer sidesteps it entirely rather than
    // fighting the type system further.
    const pdfArrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(pdfArrayBuffer).set(pdfBytes);

    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${order.trackingId}.pdf"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not generate invoice." }, { status: 500 });
  }
}
