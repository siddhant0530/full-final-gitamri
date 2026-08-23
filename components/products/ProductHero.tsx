"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/formatPrice";
import { prepaidDiscountRateForWeight } from "@/lib/pricing";
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
  const prepaidRate = prepaidDiscountRateForWeight(displayWeight);
  const prepaidPrice = prepaidRate > 0 ? displayPrice - Math.round(displayPrice * prepaidRate) : null;

  // Safe generic fallback — true for any traditionally prepared product
  // without claiming specifics (mustard oil, no vinegar) that don't apply
  // to every item (e.g. Amla Murabba is a sugar-syrup preserve).
  const checklist = product.whyYoullLoveIt ?? [
    "Traditional recipe",
    "Carefully selected ingredients",
    "No artificial preservatives",
    "Hygienically prepared",
  ];

  return (
   <>
    <section className="grid gap-8 md:grid-cols-2">
      <ProductGallery images={product.gallery} name={product.name} />
      <div>
        <h1 className="font-display text-4xl font-bold">{product.name}</h1>
        {product.subtitle && (
          <p className="mt-1 text-sm font-medium uppercase tracking-wide text-gold-700">
            {product.subtitle}
          </p>
        )}
        <div className="mt-2">
  <ProductRating reviews={reviews} />
</div>

        <div className="mt-2 flex items-baseline gap-3">
          <p className="text-lg font-semibold text-gold-700">
            {formatPrice(displayPrice)}{" "}
            <span className="text-sm text-zinc-500">/ {displayWeight}</span>
          </p>
          {displayMrp && displayMrp > displayPrice && (
            <span className="text-sm text-zinc-400 line-through">
              {formatPrice(displayMrp)}
            </span>
          )}
        </div>
        {prepaidPrice !== null && (
          <p className="mt-1 text-sm font-semibold text-[#183F35]">
            Get it for {formatPrice(prepaidPrice)} on prepaid orders ({Math.round(prepaidRate * 100)}% off)
          </p>
        )}

        {product.variants && product.variants.length > 1 && (
          <div className="mt-4 flex gap-2">
            {product.variants.map((v, i) => (
              <button
                key={v.weight}
                onClick={() => setActiveVariant(i)}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
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

        <p className="mt-4 text-zinc-600">{product.description}</p>

        <div className="mt-5 rounded-2xl border border-gold-100 bg-gold-50/40 p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-[#183F35]">
            Why You&apos;ll Love It
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-zinc-700">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 text-terracotta-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <ProductActionBar
            product={product}
            variant={variant ? { weight: variant.weight, price: variant.price } : undefined}
          />
        </div>
      </div>
    </section>
    <ProductDetailsAccordion product={product} selectedWeight={displayWeight} />
    <ProductReviewsList reviews={reviews} />
    </>
  );
}
