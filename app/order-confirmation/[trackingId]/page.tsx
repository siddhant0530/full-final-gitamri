import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getOrderByTrackingId } from "@/lib/order-store";
import { formatPrice } from "@/lib/formatPrice";
import { company } from "@/data/company";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ trackingId: string }>;
}) {
  const { trackingId } = await params;
  const order = await getOrderByTrackingId(trackingId);

  if (!order) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold">Order not found</h1>
        <p className="mt-3 text-zinc-600">
          We couldn&apos;t find an order with tracking ID {trackingId}.
        </p>
        <Link href="/" className="mt-6 inline-block text-gold-700 underline">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-center">
      <CheckCircle2 className="mx-auto text-green-600" size={64} />
      <h1 className="mt-6 text-4xl font-bold text-zinc-900">Order Confirmed!</h1>
      <p className="mt-3 text-zinc-600">
        Thank you, {order.customer.name}. Your order has been placed successfully.
      </p>

      <div className="mt-8 inline-block rounded-2xl border border-sage bg-sage px-8 py-5">
        <p className="text-sm uppercase tracking-widest text-olive">Tracking ID</p>
        <p className="mt-1 text-2xl font-bold text-zinc-900">{order.trackingId}</p>
      </div>

      <p className="mt-6 text-sm text-zinc-500">
        A confirmation with this tracking ID will be sent to{" "}
        <span className="font-medium">{order.customer.email || "the email you provided"}</span>.
        If you need help with your order, reach us at{" "}
        <a href={`mailto:${company.supportEmail}`} className="text-gold-700 underline">
          {company.supportEmail}
        </a>{" "}
        or on{" "}
        <a
          href={`https://wa.me/${company.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-700 underline"
        >
          WhatsApp
        </a>
        .
      </p>

      <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
        {order.items.map((item) => (
          <div key={item.productId} className="flex justify-between py-1 text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 font-bold">
          <span>Total</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Payment method: {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"} ·
          Status: {order.status}
        </p>
        {order.delhiveryTrackingUrl && (
          <p className="mt-2 text-sm">
            Courier tracking:{" "}
            <a
              href={order.delhiveryTrackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-700 underline"
            >
              {order.delhiveryWaybill}
            </a>
          </p>
        )}
      </div>

      <Link
        href="/products"
        className="mt-10 inline-block rounded-full bg-gold-500 px-8 py-4 font-semibold text-white hover:bg-gold-600"
      >
        Continue Shopping
      </Link>
    </main>
  );
}
