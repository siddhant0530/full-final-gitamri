import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products } from "@/data/products";
import { getApprovedReviews } from "@/lib/reviews-store";
import { categories } from "@/data/categories";
import ProductHero from "@/components/products/ProductHero";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site-config";

// Pre-render a page for every real product at build time.
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return {};

  const url = `${SITE_URL}/products/${product.slug}`;
  const imageUrl = `${SITE_URL}${product.image}`;

  return {
    title: product.name,
    description: product.shortDescription || product.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.shortDescription || product.description,
      url,
      images: [{ url: imageUrl, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription || product.description,
      images: [imageUrl],
    },
    robots: product.comingSoon ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Unknown slugs now 404 instead of silently rendering the first product,
  // which previously meant a broken/typo'd URL could get indexed as a
  // duplicate of another product.
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const price = product.variants?.[0]?.price ?? product.price;
  const allApprovedReviews = await getApprovedReviews();
  const productReviews = allApprovedReviews.filter((r) => r.productSlug === product.slug);
  const category = categories.find((c) => c.name === product.category);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: `${SITE_URL}${product.image}`,
    sku: product.id,
    category: product.category,
    brand: { "@type": "Brand", name: "Gitamri Maaji" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "INR",
      price,
      availability: product.comingSoon
        ? "https://schema.org/PreOrder"
        : product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    // Only include rating/review data when real reviews exist — Google
    // requires aggregateRating to reflect genuine customer feedback, and
    // this reads from the Supabase-backed review store (approved reviews
    // only) so it stays accurate as more come in through the post-delivery
    // review flow and admin approval queue.
    ...(productReviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (
          productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
        ).toFixed(1),
        reviewCount: productReviews.length,
        bestRating: 5,
        worstRating: 1,
      },
      review: productReviews.map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.customerName },
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: r.text,
      })),
    }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: category.name,
              item: `${SITE_URL}/category/${category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 3 : 2,
        name: product.name,
        item: `${SITE_URL}/products/${product.slug}`,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <ProductHero product={product} reviews={productReviews} />
    </main>
  );
}
