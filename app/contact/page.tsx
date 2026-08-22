import type { Metadata } from "next";
import { company } from "@/data/company";
import { Mail, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Gitamri Maaji for orders, enquiries, or support via email or WhatsApp.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl p-6 py-16">
      <h1 className="mb-6 text-4xl font-bold">Contact Gitamri Maaji</h1>
      <p className="text-zinc-600">
        For orders, enquiries, or support, reach out to us anytime.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <a
          href={`mailto:${company.supportEmail}`}
          className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md"
        >
          <Mail className="text-gold-600" />
          <div>
            <p className="font-semibold">Email Support</p>
            <p className="text-zinc-600">{company.supportEmail}</p>
          </div>
        </a>

        <a
          href={`https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent("Hi Gitamri Maaji, I have a question.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md"
        >
          <Phone className="text-green-600" />
          <div>
            <p className="font-semibold">WhatsApp</p>
            <p className="text-zinc-600">{company.whatsappDisplay}</p>
          </div>
        </a>
      </div>
    </main>
  );
}
