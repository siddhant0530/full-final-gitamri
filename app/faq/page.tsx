import type { Metadata } from "next";
import { faqs } from "@/data/faq";
import FAQAccordion from "@/components/faq/FAQAccordion";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Gitamri Maaji's products, orders, shipping, and returns.",
  alternates: { canonical: "/faq" },
};

export default function FAQ() {
  // Built from the exact same `faqs` array rendered below — the schema
  // can never describe content that isn't actually visible on the page.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd data={faqJsonLd} />

      <div className="text-center">
        <span className="inline-block rounded-full bg-gold-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-700">
          Got Questions?
        </span>
        <h1 className="mt-5 text-4xl font-black text-[#263526] md:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-zinc-600">
          Everything you need to know about ordering, shipping, and our products.
          Can&apos;t find your answer? Reach out to us directly.
        </p>
      </div>

      <div className="mt-10">
        <FAQAccordion items={faqs} />
      </div>
    </main>
  );
}
