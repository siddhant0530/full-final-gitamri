import type { Metadata } from "next";
import PolicyLayout from "@/components/legal/PolicyLayout";
import { company } from "@/data/company";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Gitamri Maaji collects, uses, and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PolicyLayout title="Privacy Policy" updated="24 July 2026">
      <div>
        <h2 className="text-xl font-bold text-[#123524]">1. Introduction</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Gitamri Maaji (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) values your privacy. This policy
          explains what information we collect when you use our website or place
          an order, how we use it, and who we share it with.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#123524]">2. Information We Collect</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-zinc-700">
          <li>Name, phone number, email address, and delivery address you provide at checkout</li>
          <li>Order details — items purchased, quantities, and order value</li>
          <li>Payment confirmation status (we never see or store your card, UPI, or bank details directly)</li>
          <li>Basic technical data such as browser type and pages visited, for improving the site</li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#123524]">3. How We Use Your Information</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          We use your information to process and deliver your order, send order
          and shipping updates, respond to enquiries (including over WhatsApp),
          and improve our products and website. We do not sell your personal
          information to third parties.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#123524]">4. Sharing With Our Service Providers</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          To fulfil your order, we share the minimum necessary information with:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-zinc-700">
          <li>
            <span className="font-semibold">Razorpay</span> — to process your payment securely. Razorpay
            handles your payment details directly under its own security standards and
            privacy policy; we only receive confirmation that payment was successful.
          </li>
          <li>
            <span className="font-semibold">Delhivery</span> — your name, address, and phone number are
            shared to create your shipment and deliver your order, and for delivery
            tracking.
          </li>
          <li>
            <span className="font-semibold">Supabase</span> — our order database provider, used to
            securely store your order records.
          </li>
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#123524]">5. Data Retention</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          We retain order information for as long as needed to fulfil your order,
          handle any returns or disputes, and meet our legal and accounting
          obligations.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#123524]">6. Your Rights</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          You may request access to, correction of, or deletion of your personal
          information by contacting us using the details below, subject to our
          legal obligations (for example, order records required for tax purposes).
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#123524]">7. Contact Us</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          For any privacy-related questions, reach us at{" "}
          <a href={`mailto:${company.supportEmail}`} className="font-semibold text-amber-700 hover:underline">
            {company.supportEmail}
          </a>{" "}
          or on WhatsApp at {company.whatsappDisplay}.
        </p>
      </div>
    </PolicyLayout>
  );
}
