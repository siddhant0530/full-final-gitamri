"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import ProductBadge from "./ProductBadge";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";
import { useCart } from "@/lib/cart-context";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [activeVariant, setActiveVariant] = useState(0);

  if (product.comingSoon) {
    return (
      <div className="flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gold-300 bg-gold-50/40 p-10 text-center">
        <span className="rounded-full bg-zinc-900/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
          Coming Soon
        </span>
        <h3 className="mt-5 font-display text-xl font-bold text-zinc-800">{product.name}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{product.shortDescription}</p>
      </div>
    );
  }

  const variant = product.variants?.[activeVariant];
  const displayPrice = variant ? variant.price : product.price;
  const displayMrp = variant?.mrp;
  function handleAddToCart() {
    addToCart(
      product,
      1,
      variant
        ? {
            weight: variant.weight,
            price: variant.price,
          }
        : undefined
    );

    toast.success("Added to Cart", {
      description: `${product.name} added successfully.`,
      action: {
        label: "View Cart",
        onClick: () => router.push("/cart"),
      },
    });
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gold-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1.5 hover:border-gold-300 hover:shadow-xl">
      {/*
        The whole card used to be a <div onClick={...router.push}> — that
        works for mouse clicks but is invisible to search engine crawlers,
        which discover pages via real <a href> links, not JS click handlers.
        Wrapping the non-interactive parts (image, title, description) in a
        real Link fixes that. Variant-select and Add-to-Cart stay outside
        the Link as plain <button>s below, since <button> isn't valid
        nested inside <a>.
      */}
      <Link href={`/products/${product.slug}`} className="block">
      <div className="relative overflow-hidden bg-gradient-to-br from-gold-50 to-white p-4">
        {product.bestSeller && (
  <span className="absolute left-4 top-4 z-10 rounded-full bg-saffron px-3 py-1.5 text-xs font-bold text-white shadow">
    🏆 Best Seller
  </span>
)}
{product.mostLoved && (
  <span className="absolute left-4 top-4 z-10 rounded-full bg-saffron px-3 py-1.5 text-xs font-bold text-white shadow">
    ❤️ Most Loved
  </span>
)}
{product.newlyAdded && (
  <span className="absolute left-4 top-4 z-10 rounded-full bg-saffron px-3 py-1.5 text-xs font-bold text-white shadow">
    ✨ Newly Added
  </span>
)}
{product.topRated && (
  <span className="absolute left-4 top-4 z-10 rounded-full bg-saffron px-3 py-1.5 text-xs font-bold text-white shadow">
    ⭐ Top Rated
  </span>
)}
        <div
          className={`relative mx-auto h-40 w-full transition-transform duration-500 ease-out group-hover:scale-105 ${
            !product.inStock ? "grayscale opacity-60" : ""
          }`}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 30vw"
            className="object-contain"
          />
        </div>
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 font-display text-base font-bold tracking-tight text-zinc-900">
            {product.name}
          </h3>

          <ProductBadge
            text={product.inStock ? "In Stock" : "Out of Stock"}
            variant={product.inStock ? "success" : "danger"}
          />
        </div>

        <p className="line-clamp-2 min-h-[40px] text-sm leading-5 text-zinc-500">
          {product.shortDescription}
        </p>
      </div>
      </Link>

      <div className="space-y-2 px-4 pb-4">
        {product.variants && product.variants.length > 1 && (
          <div className="flex gap-2">
            {product.variants.map((v, i) => (
              <button
                key={v.weight}
                onClick={() => setActiveVariant(i)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  i === activeVariant
                    ? "border-terracotta-500 bg-terracotta-500 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-gold-300"
                }`}
              >
                {v.weight}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="bg-gradient-to-r from-gold-700 to-terracotta-600 bg-clip-text text-lg font-extrabold text-transparent">
              {formatPrice(displayPrice)}
            </span>
            {displayMrp && displayMrp > displayPrice && (
              <span className="text-sm text-zinc-400 line-through">
                {formatPrice(displayMrp)}
              </span>
            )}
          </div>

          <button
            disabled={!product.inStock}
            onClick={handleAddToCart}
            className="rounded-full bg-olive px-5 py-2 text-sm font-semibold text-ivory shadow-sm transition duration-200 hover:scale-105 hover:bg-olive-dark hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}