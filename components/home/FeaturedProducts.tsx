import { products } from "@/data/products";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";

export default function FeaturedProducts() {
  // Only show products that are actually available to buy right now —
  // previously this section used its own separate, hardcoded 4-item list
  // that had no connection to the real catalog, so it ignored stock status
  // entirely and never showed more than 4 products.
  // Trial Pack included here (with its own "Perfect for First-Time Buyers"
  // badge) AND further down in its own dedicated conversion section
  // (TrialPackSection) — intentional repetition, since it's the primary
  // new-customer acquisition product.
  const FEATURED_HOMEPAGE_IDS = ["mango-pickle", "red-chilli-pickle", "grated-mango-pickle", "pickle-trial-pack"];

const availableProducts = FEATURED_HOMEPAGE_IDS
  .map((id) => products.find((p) => p.id === id))
  .filter((p): p is (typeof products)[number] => Boolean(p));

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-[#F7F1E5] via-[#F7F1E5] to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="uppercase tracking-[4px] text-gold-700 font-semibold">The Maaji Favourites</p>
          <h2 className="text-4xl md:text-5xl font-bold text-[#183F35] mt-4">Timeless Flavours, Made the Traditional Way</h2>
          <p className="text-gray-600 mt-5 max-w-3xl mx-auto text-lg leading-8">
            Crafted using traditional recipes, carefully selected ingredients and generations of authentic Indian taste.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {availableProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-terracotta-500 px-8 py-4 font-semibold text-ivory hover:bg-terracotta-600 transition"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
