import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { categories, getCategoryBySlug } from "@/data/categories";
import { products } from "@/data/products";
import ProductCard from "@/components/products/ProductCard";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site-config";

// Pre-render a landing page for every category in data/categories.ts —
// add a new category there and it automatically gets a page here too,
// no new route file needed.
export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};

  const url = `${SITE_URL}/category/${category.slug}`;
  const title = `${category.name} | Shop ${category.name}`;

  return {
    title,
    description: category.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description: category.description,
      url,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const categoryProducts = products.filter((p) => p.category === category.name);
  const available = categoryProducts.filter((p) => !p.comingSoon);
  const upcoming = categoryProducts.filter((p) => p.comingSoon);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${SITE_URL}/category/${category.slug}`,
      },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: `${SITE_URL}/category/${category.slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: available.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/products/${p.slug}`,
      })),
    },
  };

  return (
    <main className="bg-gradient-to-b from-[#FFF8EA] via-white to-[#F5F8F2]">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={collectionJsonLd} />
      <section className="relative overflow-hidden bg-[#123524] py-20 text-white">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <Link
            href="/products"
            className="text-sm text-amber-300 hover:text-amber-200"
          >
            ← All Products
          </Link>

          <div className="mt-6 flex justify-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-5xl backdrop-blur">
              {category.icon}
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black md:text-6xl">{category.name}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/80">
            {category.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        {available.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50/50 p-16 text-center">
            <p className="text-xl font-semibold text-zinc-700">
              This category is launching soon.
            </p>
            <p className="mt-2 text-zinc-500">
              Message us on WhatsApp to be the first to know when it&apos;s live.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {available.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-[#123524]">
              Coming Soon in {category.name}
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
