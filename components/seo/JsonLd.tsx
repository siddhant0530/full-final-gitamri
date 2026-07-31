/**
 * Renders a JSON-LD structured data block. Server component — safe to
 * drop into any page or layout without a "use client" boundary.
 *
 * Usage: <JsonLd data={{ "@context": "https://schema.org", "@type": "Product", ... }} />
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
