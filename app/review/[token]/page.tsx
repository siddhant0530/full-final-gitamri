import type { Metadata } from "next";
import { getInviteByToken } from "@/lib/reviews-store";
import { getOrders } from "@/lib/order-store";
import ReviewSubmissionForm from "@/components/reviews/ReviewSubmissionForm";

// Never index or cache a personal, unguessable-token page.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#263526]">Link not found</h1>
        <p className="mt-3 text-zinc-600">
          This review link is invalid or has expired. If you&apos;d still like to share feedback,
          reach out to us on WhatsApp and we&apos;ll help directly.
        </p>
      </main>
    );
  }

  if (invite.usedAt) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-4xl">🙏</p>
        <h1 className="mt-3 text-2xl font-bold text-[#263526]">Already reviewed</h1>
        <p className="mt-3 text-zinc-600">
          Thanks — we&apos;ve already received your review for this order.
        </p>
      </main>
    );
  }

  const orders = await getOrders();
  const order = orders.find((o) => o.id === invite.orderId);

  if (!order) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#263526]">Order not found</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <span className="inline-block rounded-full bg-gold-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-700">
          Order {order.trackingId}
        </span>
        <h1 className="mt-5 text-3xl font-black text-[#263526] md:text-4xl">
          How did we do?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-zinc-600">
          We&apos;d love to hear what you thought — it helps other customers, and helps us too.
        </p>
      </div>

      <div className="mt-10">
        <ReviewSubmissionForm
          token={token}
          items={order.items.map((i) => ({ productId: i.productId, name: i.name }))}
        />
      </div>
    </main>
  );
}
