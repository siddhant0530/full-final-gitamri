"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/formatPrice";
import { stateFromPincode } from "@/lib/pincode-state";
import type { Order, OrderStatus } from "@/lib/order-store";
import type { Review, ReviewStatus } from "@/lib/reviews-store";

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminPage() {
  // "checking" | "authed" | "unauthed" — starts as "checking" so we don't
  // flash a login form before we even know if a valid session cookie
  // already exists.
  const [status, setStatus] = useState<"checking" | "authed" | "unauthed">("checking");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"orders" | "reviews" | "analytics">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewLinks, setReviewLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (status === "authed" && tab === "reviews") loadReviews();
  }, [status, tab]);

  // The password check now happens server-side (see /api/admin/login and
  // middleware.ts) — this just reflects whatever the API says. A 401 here
  // means "not logged in", not an error to alert the user about.
  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.status === 401) {
        setStatus("unauthed");
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setStatus("authed");
    } catch {
      // A failed request (dev server restart, network blip, etc.) used to
      // leave this stuck on "Checking session..." forever since status
      // never got updated. Falling back to the login screen with a
      // message means there's always a way forward instead of a silent hang.
      setStatus("unauthed");
      setLoginError("Could not reach the server. Please try logging in again.");
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    const res = await fetch("/api/admin/reviews");
    if (res.status === 401) {
      setStatus("unauthed");
      return;
    }
    const data = await res.json();
    setReviews(data.reviews || []);
  }

  async function handleLogin() {
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error || "Incorrect password.");
      return;
    }
    setPasswordInput("");
    loadOrders();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setOrders([]);
    setStatus("unauthed");
  }

  async function updateStatus(trackingId: string, newStatus: OrderStatus) {
    const res = await fetch(`/api/orders/${trackingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.status === 401) {
      setStatus("unauthed");
      return;
    }
    const data = await res.json().catch(() => ({}));
    // Marking an order DELIVERED auto-generates its review link — surface
    // it here so it can be copied and sent to the customer.
    if (data.reviewLink) {
      setReviewLinks((links) => ({ ...links, [trackingId]: data.reviewLink }));
    }
    loadOrders();
  }

  async function createShipment(trackingId: string) {
    const res = await fetch("/api/delivery/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingId }),
    });
    if (res.status === 401) {
      setStatus("unauthed");
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      alert(`Could not create Delhivery shipment: ${data.error}`);
      return;
    }
    loadOrders();
  }

  async function setReviewStatusAdmin(id: string, newStatus: ReviewStatus) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.status === 401) {
      setStatus("unauthed");
      return;
    }
    loadReviews();
  }

  async function toggleFeatured(id: string, homepageFeatured: boolean) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homepageFeatured }),
    });
    if (res.status === 401) {
      setStatus("unauthed");
      return;
    }
    loadReviews();
  }

  async function removeReview(id: string) {
    if (!confirm("Remove this review? It can be restored from Supabase if needed.")) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (res.status === 401) {
      setStatus("unauthed");
      return;
    }
    loadReviews();
  }

  function copyLink(link: string) {
    navigator.clipboard?.writeText(link);
    alert("Review link copied — send it to the customer over WhatsApp or email.");
  }

  // All analytics are derived client-side from the orders already loaded
  // for the Orders tab — no separate API call needed. Recomputed only
  // when the orders list actually changes.
  const analytics = useMemo(() => {
    const byState = new Map<string, { orders: number; revenue: number }>();
    const byCity = new Map<string, { orders: number; revenue: number }>();
    const byProduct = new Map<string, { name: string; quantity: number; revenue: number }>();
    const byWeight = new Map<string, number>();
    let codCount = 0;
    let onlineCount = 0;
    let totalRevenue = 0;

    for (const order of orders) {
      totalRevenue += order.total;
      if (order.paymentMethod === "COD") codCount++;
      else onlineCount++;

      const state = stateFromPincode(order.customer.pincode);
      const stateEntry = byState.get(state) ?? { orders: 0, revenue: 0 };
      stateEntry.orders += 1;
      stateEntry.revenue += order.total;
      byState.set(state, stateEntry);

      const city = order.customer.city?.trim() || "Unknown";
      const cityEntry = byCity.get(city) ?? { orders: 0, revenue: 0 };
      cityEntry.orders += 1;
      cityEntry.revenue += order.total;
      byCity.set(city, cityEntry);

      for (const item of order.items) {
        const entry = byProduct.get(item.productId) ?? {
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
        entry.quantity += item.quantity;
        entry.revenue += item.price * item.quantity;
        byProduct.set(item.productId, entry);

        const weightKey = item.weight || "Unspecified";
        byWeight.set(weightKey, (byWeight.get(weightKey) ?? 0) + item.quantity);
      }
    }

    const sortDesc = <T extends { orders?: number; quantity?: number }>(
      arr: T[],
      key: keyof T
    ) => [...arr].sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0));

    return {
      totalOrders: orders.length,
      totalRevenue,
      codCount,
      onlineCount,
      byState: sortDesc(
        Array.from(byState, ([state, v]) => ({ state, ...v })),
        "orders"
      ),
      byCity: sortDesc(
        Array.from(byCity, ([city, v]) => ({ city, ...v })),
        "orders"
      ),
      byProduct: sortDesc(
        Array.from(byProduct.values()),
        "quantity"
      ),
      byWeight: Array.from(byWeight, ([weight, quantity]) => ({ weight, quantity })).sort(
        (a, b) => b.quantity - a.quantity
      ),
    };
  }, [orders]);

  if (status === "checking") {
    return (
      <main className="mx-auto max-w-sm px-6 py-24 text-center text-zinc-500">
        Checking session…
      </main>
    );
  }

  if (status === "unauthed") {
    return (
      <main className="mx-auto flex max-w-sm flex-col items-center px-6 py-24">
        <h1 className="text-2xl font-bold">Admin Login</h1>
        <input
          type="password"
          placeholder="Admin password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-3"
        />
        {loginError && <p className="mt-2 text-sm text-red-600">{loginError}</p>}
        <button
          onClick={handleLogin}
          className="mt-4 w-full rounded-full bg-green-700 py-3 font-semibold text-white hover:bg-green-800"
        >
          Log In
        </button>
      </main>
    );
  }

  const pendingCount = reviews.filter((r) => r.status === "PENDING").length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-gray-50"
        >
          Log Out
        </button>
      </div>

      <div className="mb-8 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 text-sm font-semibold ${
            tab === "orders"
              ? "border-b-2 border-[#183F35] text-[#183F35]"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => setTab("reviews")}
          className={`px-4 py-2 text-sm font-semibold ${
            tab === "reviews"
              ? "border-b-2 border-[#183F35] text-[#183F35]"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Reviews{pendingCount > 0 && ` (${pendingCount} pending)`}
        </button>
        <button
          onClick={() => setTab("analytics")}
          className={`px-4 py-2 text-sm font-semibold ${
            tab === "analytics"
              ? "border-b-2 border-[#183F35] text-[#183F35]"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Analytics
        </button>
      </div>

      {tab === "orders" && (
        <>
          {loading && <p>Loading orders...</p>}
          {!loading && orders.length === 0 && <p>No orders yet.</p>}

          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{order.trackingId}</p>
                    <p className="text-sm text-zinc-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.trackingId, e.target.value as OrderStatus)}
                    className="rounded-lg border border-gray-300 px-3 py-2"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold">{order.customer.name}</p>
                    <p className="text-sm text-zinc-600">{order.customer.phone}</p>
                    <p className="text-sm text-zinc-600">{order.customer.email}</p>
                    <p className="text-sm text-zinc-600">
                      {order.customer.address}, {order.customer.city} - {order.customer.pincode}
                    </p>
                  </div>
                  <div className="text-sm">
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex justify-between">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="mt-2 flex justify-between border-t border-gray-200 pt-2">
                      <span>Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Prepaid Discount</span>
                        <span>-{formatPrice(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
                      <span>Total</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                    <p className="mt-1 text-zinc-500">
                      {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"} ·{" "}
                      {order.paymentStatus}
                    </p>

                    <div className="mt-3 border-t border-gray-200 pt-3">
                      {order.delhiveryWaybill ? (
                        <p className="text-sm">
                          Delhivery AWB:{" "}
                          <span className="font-semibold">{order.delhiveryWaybill}</span>
                          {order.delhiveryTrackingUrl && (
                            <>
                              {" "}
                              ·{" "}
                              <a
                                href={order.delhiveryTrackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gold-700 underline"
                              >
                                Track shipment
                              </a>
                            </>
                          )}
                        </p>
                      ) : (
                        <button
                          onClick={() => createShipment(order.trackingId)}
                          className="rounded-full bg-[#183F35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c2718]"
                        >
                          Create Delhivery Shipment
                        </button>
                      )}
                    </div>

                    <div className="mt-3 border-t border-gray-200 pt-3 flex items-center gap-3">
                      <a
                        href={`/api/admin/invoice/${order.trackingId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full border border-gold-400 px-4 py-2 text-sm font-semibold text-gold-800 hover:bg-gold-50"
                      >
                        Download Invoice
                      </a>
                      {order.invoiceNumber && (
                        <span className="text-xs text-zinc-500">
                          Invoice: {order.invoiceNumber}
                        </span>
                      )}
                    </div>

                    {order.status === "DELIVERED" && reviewLinks[order.trackingId] && (
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-gold-50 px-3 py-2">
                        <span className="truncate text-xs text-gold-800">
                          {reviewLinks[order.trackingId]}
                        </span>
                        <button
                          onClick={() => copyLink(reviewLinks[order.trackingId])}
                          className="shrink-0 rounded-full bg-terracotta-500 px-3 py-1 text-xs font-semibold text-ivory hover:bg-terracotta-600"
                        >
                          Copy review link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "reviews" && (
        <div className="space-y-4">
          {reviews.length === 0 && <p>No reviews yet.</p>}
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {review.customerName}{" "}
                    <span className="font-normal text-zinc-500">— {review.productSlug}</span>
                  </p>
                  <p className="text-gold-500">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    review.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : review.status === "PENDING"
                      ? "bg-gold-100 text-gold-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {review.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-700">{review.text}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {review.status !== "APPROVED" && (
                  <button
                    onClick={() => setReviewStatusAdmin(review.id, "APPROVED")}
                    className="rounded-full bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800"
                  >
                    Approve
                  </button>
                )}
                {review.status !== "REJECTED" && (
                  <button
                    onClick={() => setReviewStatusAdmin(review.id, "REJECTED")}
                    className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-gray-50"
                  >
                    Reject
                  </button>
                )}
                {review.status === "APPROVED" && (
                  <button
                    onClick={() => toggleFeatured(review.id, !review.homepageFeatured)}
                    className="rounded-full border border-gold-400 px-4 py-2 text-xs font-semibold text-olive hover:bg-gold-50"
                  >
                    {review.homepageFeatured ? "Remove from homepage" : "Feature on homepage"}
                  </button>
                )}
                <button
                  onClick={() => removeReview(review.id)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "analytics" && (
        <div className="space-y-8">
          {orders.length === 0 ? (
            <p>No orders yet — analytics will populate once orders start coming in.</p>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Orders</p>
                  <p className="mt-1 text-2xl font-bold text-[#183F35]">{analytics.totalOrders}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Revenue</p>
                  <p className="mt-1 text-2xl font-bold text-[#183F35]">{formatPrice(analytics.totalRevenue)}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Online Prepaid</p>
                  <p className="mt-1 text-2xl font-bold text-[#183F35]">{analytics.onlineCount}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Cash on Delivery</p>
                  <p className="mt-1 text-2xl font-bold text-[#183F35]">{analytics.codCount}</p>
                </div>
              </div>

              {/* Orders by State */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#183F35]">Orders by State</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Estimated from delivery pincode — approximate, not exact (a few pincodes sit on state borders).
                </p>
                <div className="mt-4 space-y-3">
                  {analytics.byState.map((row) => {
                    const maxOrders = analytics.byState[0]?.orders || 1;
                    const pct = Math.round((row.orders / maxOrders) * 100);
                    return (
                      <div key={row.state}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-zinc-800">{row.state}</span>
                          <span className="text-zinc-500">
                            {row.orders} order{row.orders !== 1 ? "s" : ""} · {formatPrice(row.revenue)}
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-terracotta-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Orders by City */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#183F35]">Orders by City</h2>
                <p className="mt-1 text-xs text-zinc-500">Exact — taken directly from the delivery address.</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-zinc-500">
                        <th className="py-2">City</th>
                        <th className="py-2 text-right">Orders</th>
                        <th className="py-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.byCity.map((row) => (
                        <tr key={row.city} className="border-b border-gray-100">
                          <td className="py-2 font-medium text-zinc-800">{row.city}</td>
                          <td className="py-2 text-right">{row.orders}</td>
                          <td className="py-2 text-right">{formatPrice(row.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Product-wise sales */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#183F35]">Which Pickle Sells the Most</h2>
                <p className="mt-1 text-xs text-zinc-500">Quantity and revenue summed across all orders, by product.</p>
                <div className="mt-4 space-y-3">
                  {analytics.byProduct.map((row) => {
                    const maxQty = analytics.byProduct[0]?.quantity || 1;
                    const pct = Math.round((row.quantity / maxQty) * 100);
                    return (
                      <div key={row.name}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-zinc-800">{row.name}</span>
                          <span className="text-zinc-500">
                            {row.quantity} sold · {formatPrice(row.revenue)}
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-[#183F35]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weight split (220g vs 500g etc) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#183F35]">Jar Size Preference</h2>
                <p className="mt-1 text-xs text-zinc-500">Which weight variants customers pick most often.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {analytics.byWeight.map((row) => (
                    <div
                      key={row.weight}
                      className="rounded-full border border-gold-300 bg-gold-50 px-4 py-2 text-sm font-semibold text-gold-800"
                    >
                      {row.weight}: {row.quantity} sold
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
