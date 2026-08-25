"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/types/product";

const TABS = [
  "Item Details",
  "Ingredients",
  "Nutrition",
  "How to Enjoy",
  "Shipping",
  "Know Your Pickle",
] as const;

export default function ProductDetailsAccordion({ product, selectedWeight }: { product: Product; selectedWeight?: string }) {
  const [active, setActive] = useState<(typeof TABS)[number]>("Item Details");
  const hasNutrition = Object.keys(product.nutrition || {}).length > 0;

  return (
    <div className="mt-10">
      <div className="flex gap-8 border-b border-zinc-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`shrink-0 pb-3 text-sm font-semibold tracking-wide transition ${
              active === tab
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="pt-6 text-zinc-600">
        {active === "Item Details" && (
          <ul className="space-y-1 text-sm">
            <li><span className="font-medium text-zinc-800">Weight:</span> {selectedWeight ?? product.weight}</li>
            <li><span className="font-medium text-zinc-800">Shelf Life:</span> {product.shelfLife}</li>
            <li><span className="font-medium text-zinc-800">Storage:</span> {product.storage}</li>
          </ul>
        )}

        {active === "Ingredients" && (
          <ul className="space-y-2 text-sm">
            {product.ingredients.map((ing) => (
              <li key={ing}>• {ing}</li>
            ))}
          </ul>
        )}

        {active === "Nutrition" && (
          hasNutrition ? (
            <ul className="space-y-1 text-sm">
              {product.nutrition.energy && (
                <li><span className="font-medium text-zinc-800">Energy:</span> {product.nutrition.energy}</li>
              )}
              {product.nutrition.protein && (
                <li><span className="font-medium text-zinc-800">Protein:</span> {product.nutrition.protein}</li>
              )}
              {product.nutrition.carbohydrates && (
                <li><span className="font-medium text-zinc-800">Carbohydrates:</span> {product.nutrition.carbohydrates}</li>
              )}
              {product.nutrition.fat && (
                <li><span className="font-medium text-zinc-800">Fat:</span> {product.nutrition.fat}</li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">
              Nutrition information for this product is being finalized and
              will be added soon.
            </p>
          )
        )}

        {active === "How to Enjoy" && (
          <p className="text-sm leading-relaxed">
            {product.howToEnjoy ??
              "Best enjoyed with parathas, dal-chawal, curd rice, or as a flavourful side with any Indian meal."}
          </p>
        )}

        {active === "Shipping" && (
          <div className="text-sm leading-relaxed space-y-2">
            <p>
              Orders are packed and handed over to our courier partner within
              1–2 business days, with delivery typically taking 3–7 business
              days depending on your location.
            </p>
            <p>
              <Link href="/shipping" className="font-semibold text-gold-700 hover:underline">
                Read the full Shipping Policy →
              </Link>
            </p>
          </div>
        )}

        {active === "Know Your Pickle" && product.knowYourPickle && (
          <div>
            {product.knowYourPickle.split("\n\n").map((para, i) => (
              <p key={i} className="mb-3 text-sm leading-relaxed last:mb-0">
                {para}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}