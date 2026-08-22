import type { Metadata } from "next";
import PolicyLayout from "@/components/legal/PolicyLayout";
import { company } from "@/data/company";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using the Gitamri Maaji website and placing orders.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PolicyLayout title="Terms & Conditions" updated="24 July 2026">
      <div>
        <h2 className="text-xl font-bold text-[#263526]">1. Acceptance of Terms</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          By accessing or placing an order on this website, you agree to be
          bound by these Terms & Conditions. If you do not agree, please do
          not use this website or place an order.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">2. Products & Pricing</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          We make every effort to display product descriptions, images, and
          prices accurately. Prices are listed in Indian Rupees (INR) and are
          subject to change without prior notice. In the rare event a listed
          price is incorrect, we will contact you before processing your order.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">3. Orders & Payment</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Orders can be placed through our website (Cash on Delivery or online
          payment via Razorpay) or via WhatsApp. Online payments are processed
          securely by Razorpay; we do not store your card, UPI, or bank details.
          An order is confirmed only once payment is verified (for online
          payments) or once accepted for Cash on Delivery.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">4. Shipping</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Orders are shipped via our delivery partner, Delhivery. Please see
          our{" "}
          <a href="/shipping" className="font-semibold text-gold-700 hover:underline">
            Shipping Policy
          </a>{" "}
          for delivery timelines.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">5. Returns & Refunds</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Please see our{" "}
          <a href="/returns" className="font-semibold text-gold-700 hover:underline">
            Return & Refund Policy
          </a>{" "}
          for details on damaged, defective, or incorrect items.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">6. Intellectual Property</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          All content on this website — including our logo, product photography,
          and text — is the property of Gitamri Maaji and may not be reproduced
          without our written permission.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">7. Limitation of Liability</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          We are not liable for delays or issues caused by circumstances beyond
          our reasonable control, including courier delays, natural events, or
          incorrect delivery details provided at checkout.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">8. Changes to These Terms</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          We may update these Terms from time to time. Continued use of the
          website after changes are posted constitutes acceptance of the
          revised Terms.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#263526]">9. Contact Us</h2>
        <p className="mt-3 leading-7 text-zinc-700">
          Questions about these Terms? Reach us at{" "}
          <a href={`mailto:${company.supportEmail}`} className="font-semibold text-gold-700 hover:underline">
            {company.supportEmail}
          </a>{" "}
          or on WhatsApp at {company.whatsappDisplay}.
        </p>
      </div>
    </PolicyLayout>
  );
}
