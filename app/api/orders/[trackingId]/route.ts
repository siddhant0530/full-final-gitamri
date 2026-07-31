import { NextRequest, NextResponse } from "next/server";
import { getOrderByTrackingId, updateOrderStatus, OrderStatus } from "@/lib/order-store";
import { getOrCreateInviteForOrder } from "@/lib/reviews-store";
import { SITE_URL } from "@/lib/site-config";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;
  const order = await getOrderByTrackingId(trackingId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}

// PATCH /api/orders/[trackingId] -> update order status (used by admin panel)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;
  const { status } = (await req.json()) as { status: OrderStatus };

  const validStatuses: OrderStatus[] = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const updated = await updateOrderStatus(trackingId, status);
  if (!updated) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // TODO: send a "delivery status updated" email/SMS to the customer here.

  // Once an order is marked DELIVERED, generate its review-submission
  // link (idempotent — re-marking DELIVERED won't create a second one)
  // and hand it back so the admin panel can show/copy it to send to
  // the customer (over WhatsApp, email, etc. — sending it automatically
  // is a follow-up once an email/SMS provider is wired in).
  let reviewLink: string | undefined;
  if (status === "DELIVERED") {
    try {
      const token = await getOrCreateInviteForOrder(updated.id);
      reviewLink = `${SITE_URL}/review/${token}`;
    } catch (err) {
      console.error("Could not create review invite:", err);
    }
  }

  return NextResponse.json({ order: updated, reviewLink });
}
