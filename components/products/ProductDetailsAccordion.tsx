"use client";

import { useState } from "react";
import { Product } from "@/types/product";

const TABS = ["Item Details", "Ingredients", "Know Your Pickle"] as const;

export default function ProductDetailsAccordion({ product, selectedWeight }: { product: Product; selectedWeight?: string }) {
  const [active, setActive] = useState<(typeof TABS)[number]>("Item Details");

  return (
    <div className="mt-10">
      <div className="flex gap-8 border-b border-zinc-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`pb-3 text-sm font-semibold tracking-wide transition ${
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