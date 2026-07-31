import type { Metadata } from "next";
import ProductGrid from "@/components/products/ProductGrid";

export const metadata: Metadata = {
  title: "Our Products",
  description:
    "Browse all Gitamri Maaji products — pickles, masalas, pulses, dry fruits and traditional foods, made the authentic way.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-2 text-4xl font-bold">Our Products</h1>
      <p className="mb-8 text-zinc-600">
        Pickles • Masalas • Pulses • Dry Fruits • Traditional Foods
      </p>
      <ProductGrid initialCategory={category} />
    </main>
  );
}
