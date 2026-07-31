import type { Metadata } from "next";
import { company } from "@/data/company";

export const metadata: Metadata = {
  title: "Support",
  description: "Need help with an order, product, or delivery? Reach Gitamri Maaji support via email or WhatsApp.",
  alternates: { canonical: "/support" },
};

export default function Support() {
  return (
    <main className="p-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold">Support</h1>
      <p className="mt-4 text-zinc-600">
        Need help with an order, product, or delivery? We&apos;re here for you.
      </p>
      <ul className="mt-6 space-y-2 text-zinc-700">
        <li>
          Email: <a className="text-amber-700 underline" href={`mailto:${company.supportEmail}`}>{company.supportEmail}</a>
        </li>
        <li>
          WhatsApp:{" "}
          <a
            className="text-amber-700 underline"
            href={`https://wa.me/${company.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {company.whatsappDisplay}
          </a>
        </li>
      </ul>
    </main>
  );
}
