import type { Metadata } from "next";
import PolicyLayout from "@/components/legal/PolicyLayout";
import { company } from "@/data/company";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description: "Gitamri Maaji's return and refund policy for damaged, defective, or incorrect orders.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <PolicyLayout title="Return & Refund Policy" updated="24 July 2026">
      <div>
        <h2 className="text-xl font-bold text-[#263526]">1. Our Promise</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Since our products are food items, we don&apos;t accept returns for
          change of mind. However, if something arrives damaged, defective,
          spoiled, or different from what you ordered, we will make it right.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">2. Reporting Window</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Please report any issue with your order — damaged packaging, leakage,
          a missing or incorrect item — within{" "}
          <span className="font-semibold">24–48 hours of delivery</span>. This
          short window helps us verify and resolve issues quickly while your
          order is still fresh. Claims raised after this window may not be
          eligible for a refund or replacement.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">3. How to Report an Issue</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Message us on WhatsApp at {company.whatsappDisplay} or email{" "}
          <a href={`mailto:${company.supportEmail}`} className="font-semibold text-gold-700 hover:underline">
            {company.supportEmail}
          </a>{" "}
          with your order tracking ID and a photo of the item/packaging. This
          helps us process your claim faster.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">4. Resolution</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Once verified, we will offer a replacement of the affected item or a
          refund, at our discretion. Replacements are shipped at no extra cost
          to you.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">5. Refund Timelines</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Approved refunds for online payments are processed back to your
          original payment method via Razorpay within 5–7 business days. Cash
          on Delivery refunds are processed via bank transfer or UPI once
          details are shared with us.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">6. Non-Returnable Situations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-zinc-700">
          <li>Change of mind after an order has shipped</li>
          <li>Issues reported after the 24–48 hour window</li>
          <li>Products opened or consumed, unless the issue is a manufacturing defect</li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">7. Contact Us</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          We want you to be happy with every order. If anything&apos;s wrong,
          reach out at{" "}
          <a href={`mailto:${company.supportEmail}`} className="font-semibold text-gold-700 hover:underline">
            {company.supportEmail}
          </a>{" "}
          or WhatsApp {company.whatsappDisplay} — we&apos;re here to help.
        </p>
      </div>
    </PolicyLayout>
  );
}
