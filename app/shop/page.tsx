import type { Metadata } from "next";
import ProductGrid from "@/components/products/ProductGrid";

// This page renders the same unfiltered product grid as /products, so the
// canonical tag points there — otherwise Google sees two identical pages
// and may split ranking signal between them or pick the "wrong" one.
export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop Gitamri Maaji's full range of pickles, masalas, pulses, dry fruits and traditional foods.",
  alternates: { canonical: "/products" },
};

export default function ShopPage(){
 return <main className="mx-auto max-w-7xl p-6"><h1 className="text-4xl font-bold mb-6">Shop</h1><ProductGrid/></main>;
}
