"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/formatPrice";
import { prepaidDiscountRateForWeight } from "@/lib/pricing";

// Minimal shape of the Razorpay Checkout.js constructor this page actually
// uses — the full SDK has no official types, so this covers just what's
// needed instead of reaching for `any`.
interface RazorpayInstance {
  open: () => void;
}
interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayPaymentInfo {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
interface RazorpayOptions {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();

  // Cosmetic-only preview of the weight-tiered prepaid discount (15% on
  // 220g jars, 12% on 500g jars). The actual charge is always
  // recalculated server-side — see /api/payments/razorpay/create-order
  // and /api/orders.
  const discountPreview = items.reduce(
    (sum, item) => sum + Math.round(item.price * item.quantity * prepaidDiscountRateForWeight(item.weight)),
    0
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function payWithRazorpay(): Promise<RazorpayPaymentInfo | null> {
    // Create a Razorpay order on the server first. The server recomputes
    // the amount from the product catalog using productId/weight/quantity
    // — it does not trust a client-supplied total.
    const createRes = await fetch("/api/payments/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, weight: i.weight, quantity: i.quantity })),
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData.error || "Could not start payment.");

    const razorpayOrder = createData.order;

    // Load the Razorpay checkout script if it isn't already on the page
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay checkout script."));
        document.body.appendChild(script);
      });
    }

    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error("Razorpay checkout script failed to load."));
        return;
      }
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Gitamri Maaji",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#123524" },
        handler: async (response: RazorpaySuccessResponse) => {
          // Verify the signature server-side before trusting the payment
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.verified) {
            resolve({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              // Passed through to /api/orders so it can independently
              // re-verify the signature before applying the prepaid
              // discount or marking the order Paid — see that route.
              razorpaySignature: response.razorpay_signature,
            });
          } else {
            reject(new Error("Payment verification failed."));
          }
        },
        modal: {
          ondismiss: () => reject(new Error("Payment was cancelled.")),
        },
      });
      rzp.open();
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
      setError("Please fill in all required fields.");
      return;
    }
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      let paymentInfo: RazorpayPaymentInfo | null = null;

      if (paymentMethod === "ONLINE") {
        paymentInfo = await payWithRazorpay();
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          items: items.map((i) => ({
            productId: i.productId,
            weight: i.weight,
            quantity: i.quantity,
          })),
          paymentMethod,
          razorpayOrderId: paymentInfo?.razorpayOrderId,
          razorpayPaymentId: paymentInfo?.razorpayPaymentId,
          razorpaySignature: paymentInfo?.razorpaySignature,
        }),
      });

      if (!res.ok) throw new Error("Failed to place order");

      const { order } = await res.json();
      clearCart();
      router.push(`/order-confirmation/${order.trackingId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong placing your order. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <Link href="/products" className="mt-6 inline-block text-amber-700 underline">
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-4xl font-bold text-zinc-900">Checkout</h1>

      <div className="grid gap-10 md:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold">Delivery Details</h2>

          <input
            placeholder="Full Name *"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
          <input
            placeholder="Phone Number *"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
          <textarea
            placeholder="Address *"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
            rows={3}
          />
          <div className="flex gap-4">
            <input
              placeholder="City *"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="w-1/2 rounded-lg border border-gray-300 px-4 py-3"
            />
            <input
              placeholder="Pincode *"
              value={form.pincode}
              onChange={(e) => update("pincode", e.target.value)}
              className="w-1/2 rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>

          <h2 className="pt-4 text-xl font-semibold">Payment Method</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-3 rounded-lg border border-gray-300 p-4">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
              />
              Cash on Delivery
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-gray-300 p-4">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "ONLINE"}
                onChange={() => setPaymentMethod("ONLINE")}
              />
              Pay Online (Card / UPI / Netbanking) — Get up to 15% off
            </label>
          </div>
          {paymentMethod === "ONLINE" && (
            <p className="text-sm text-zinc-500">
              You&apos;ll be prompted to complete payment via Razorpay (UPI, card, netbanking, or wallet) before your order is placed. A prepaid discount (15% on 220g jars, 12% on 500g jars) is applied automatically.
            </p>
          )}

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-green-700 py-4 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {submitting
              ? paymentMethod === "ONLINE" ? "Processing Payment..." : "Placing Order..."
              : paymentMethod === "ONLINE" ? "Pay & Place Order" : "Place Order"}
          </button>
        </form>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-fit">
          <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {paymentMethod === "ONLINE" && (
            <div className="flex justify-between text-green-700">
              <span>Prepaid Discount</span>
              <span>-{formatPrice(discountPreview)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
            <span>Total</span>
            <span>
              {formatPrice(paymentMethod === "ONLINE" ? subtotal - discountPreview : subtotal)}
            </span>
          </div>
          {/* This preview is cosmetic only — the actual charge and any
              discount are always recalculated server-side from the
              catalog in /api/payments/razorpay/create-order and
              /api/orders, never trusted from here. */}
        </div>
      </div>
    </main>
  );
}
