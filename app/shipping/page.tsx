import type { Metadata } from "next";
import PolicyLayout from "@/components/legal/PolicyLayout";
import { company } from "@/data/company";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description: "Delivery timelines, partners, and shipping details for Gitamri Maaji orders.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <PolicyLayout title="Shipping Policy" updated="24 July 2026">
      <div>
        <h2 className="text-xl font-bold text-[#263526]">1. Delivery Partner</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          All orders are shipped via Delhivery, one of India&apos;s leading
          logistics providers, ensuring reliable delivery across the country.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">2. Processing Time</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Orders are packed and handed over to our courier partner within
          1–2 business days of confirmation. You&apos;ll receive a tracking ID
          and tracking link once your order ships.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">3. Delivery Timelines</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Typical delivery takes 3–7 business days depending on your location,
          after the order is shipped. Remote areas may take slightly longer.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">4. Shipping Charges</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Any applicable shipping charges will be clearly shown at checkout
          before you complete your order.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">5. Order Tracking</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          You can track your order anytime using the tracking ID sent to you
          after dispatch, or by messaging us on WhatsApp at {company.whatsappDisplay}.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">6. Delivery Issues</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          If your order is delayed, marked delivered but not received, or
          arrives damaged, please contact us within 24–48 hours of the delivery
          update so we can help resolve it quickly. See our{" "}
          <a href="/returns" className="font-semibold text-gold-700 hover:underline">
            Return & Refund Policy
          </a>{" "}
          for next steps.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">7. Contact Us</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          For any shipping questions, reach us at{" "}
          <a href={`mailto:${company.supportEmail}`} className="font-semibold text-gold-700 hover:underline">
            {company.supportEmail}
          </a>{" "}
          or on WhatsApp at {company.whatsappDisplay}.
        </p>
      </div>
    </PolicyLayout>
  );
}
