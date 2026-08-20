import { NextRequest, NextResponse } from "next/server";
import { createDelhiveryShipment } from "@/lib/delhivery";
import { getOrderByTrackingId, patchOrder } from "@/lib/order-store";

// POST /api/delivery/create  { trackingId }
// Creates a Delhivery shipment for an existing order and stores the
// resulting waybill/tracking URL against it.
export async function POST(req: NextRequest) {
  const { trackingId } = await req.json();

  const order = await getOrderByTrackingId(trackingId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

 const result = await createDelhiveryShipment({
    orderId: order.trackingId,
    name: order.customer.name,
    address: order.customer.address,
    city: order.customer.city,
    pincode: order.customer.pincode,
    phone: order.customer.phone,
    paymentMode: order.paymentMethod === "COD" ? "COD" : "Prepaid",
    amount: order.subtotal,
    items: order.items.map((i) => ({ name: i.name, quantity: i.quantity })),
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const updated = await patchOrder(trackingId, {
    delhiveryWaybill: result.waybill,
    delhiveryTrackingUrl: result.trackingUrl,
    status: "SHIPPED",
  });

  return NextResponse.json({ order: updated });
}
