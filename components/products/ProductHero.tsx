"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";
import type { Review } from "@/lib/reviews-store";
import ProductActionBar from "@/components/products/ProductActionBar";
import ProductGallery from "@/components/products/ProductGallery";
import ProductDetailsAccordion from "@/components/products/ProductDetailsAccordion";
import ProductRating from "@/components/products/ProductRating";
import ProductReviewsList from "@/components/products/ProductReviewsList";

export default function ProductHero({ product, reviews }: { product: Product; reviews: Review[] }) {
  const [activeVariant, setActiveVariant] = useState(0);
  const variant = product.variants?.[activeVariant];
  const displayPrice = variant ? variant.price : product.price;
  const displayWeight = variant ? variant.weight : product.weight;
  const displayMrp = variant?.mrp;

  return (
   <>
    <section className="grid gap-8 md:grid-cols-2">
      <ProductGallery images={product.gallery} name={product.name} />
      <div>
        <h1 className="font-display text-4xl font-bold">{product.name}</h1>
        <div className="mt-2">
  <ProductRating reviews={reviews} />
</div>

        <div className="mt-2 flex items-baseline gap-3">
          <p className="text-lg font-semibold text-amber-700">
            {formatPrice(displayPrice)}{" "}
            <span className="text-sm text-zinc-500">/ {displayWeight}</span>
          </p>
          {displayMrp && displayMrp > displayPrice && (
            <span className="text-sm text-zinc-400 line-through">
              {formatPrice(displayMrp)}
            </span>
          )}
        </div>

        {product.variants && product.variants.length > 1 && (
          <div className="mt-4 flex gap-2">
            {product.variants.map((v, i) => (
              <button
                key={v.weight}
                onClick={() => setActiveVariant(i)}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  i === activeVariant
                    ? "border-amber-500 bg-amber-500 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-amber-300"
                }`}
              >
                {v.weight}
              </button>
            ))}
          </div>
        )}

        <p className="mt-4 text-zinc-600">{product.description}</p>
        <div className="mt-6">
          <ProductActionBar
            product={product}
            variant={variant ? { weight: variant.weight, price: variant.price } : undefined}
          />
        </div>
      </div>
    </section>
    <ProductDetailsAccordion product={product} />
    <ProductReviewsList reviews={reviews} />
    </>
  );
}
