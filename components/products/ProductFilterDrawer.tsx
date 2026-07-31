"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { categories } from "@/data/categories";
import PriceRangeSlider from "./PriceRangeSlider";

export type DiscountFilter = "all" | "onSale" | 10 | 20 | 30;

export interface ProductFilters {
  categories: Set<string>;
  availability: Set<"inStock" | "outOfStock">;
  priceMin: number;
  priceMax: number;
  discount: DiscountFilter;
  packSizes: Set<string>;
}

const DISCOUNT_OPTIONS: { label: string; value: DiscountFilter }[] = [
  { label: "All", value: "all" },
  { label: "On Sale", value: "onSale" },
  { label: "10% or more off", value: 10 },
  { label: "20% or more off", value: 20 },
  { label: "30% or more off", value: 30 },
];

export default function ProductFilterDrawer({
  open,
  onClose,
  priceBounds,
  packSizeOptions,
  applied,
  onApply,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  priceBounds: { min: number; max: number };
  packSizeOptions: string[];
  applied: ProductFilters;
  onApply: (filters: ProductFilters) => void;
  onClear: () => void;
}) {
  // Draft state — only committed to the actual grid filter when "Apply" is
  // clicked, so adjusting several filters doesn't re-filter the grid on
  // every single click.
  const [draft, setDraft] = useState<ProductFilters>(applied);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset the draft to whatever's currently applied every time the drawer
  // opens, so a previous unapplied edit doesn't linger silently.
  useEffect(() => {
    if (open) setDraft(applied);
  }, [open, applied]);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  function toggleSetValue<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleClear() {
    const cleared: ProductFilters = {
      categories: new Set(),
      availability: new Set(),
      priceMin: priceBounds.min,
      priceMax: priceBounds.max,
      discount: "all",
      packSizes: new Set(),
    };
    setDraft(cleared);
    onClear();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel — slides in from the left, fixed sidebar on desktop, full-height on mobile */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filter products"
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[85vw] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
          <h2 className="font-display text-xl font-bold text-[#123524]">Filters</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close filters"
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {/* Availability */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-800">
              Availability
            </h3>
            <div className="space-y-2">
              {(["inStock", "outOfStock"] as const).map((key) => (
                <label key={key} className="flex items-center gap-2.5 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={draft.availability.has(key)}
                    onChange={() =>
                      setDraft((d) => ({ ...d, availability: toggleSetValue(d.availability, key) }))
                    }
                    className="h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                  />
                  {key === "inStock" ? "In Stock" : "Out of Stock"}
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-800">
              Price Range
            </h3>
            <PriceRangeSlider
              min={priceBounds.min}
              max={priceBounds.max}
              valueMin={draft.priceMin}
              valueMax={draft.priceMax}
              onChange={(priceMin, priceMax) => setDraft((d) => ({ ...d, priceMin, priceMax }))}
            />
          </div>

          {/* Discount */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-800">
              Discount
            </h3>
            <div className="space-y-2">
              {DISCOUNT_OPTIONS.map((opt) => (
                <label key={opt.label} className="flex items-center gap-2.5 text-sm text-zinc-700">
                  <input
                    type="radio"
                    name="discount"
                    checked={draft.discount === opt.value}
                    onChange={() => setDraft((d) => ({ ...d, discount: opt.value }))}
                    className="h-4 w-4 border-zinc-300 text-amber-600 focus:ring-amber-500"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Category — dynamically from data/categories.ts */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-800">
              Category
            </h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat.slug} className="flex items-center gap-2.5 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={draft.categories.has(cat.slug)}
                    onChange={() =>
                      setDraft((d) => ({ ...d, categories: toggleSetValue(d.categories, cat.slug) }))
                    }
                    className="h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                  />
                  {cat.icon} {cat.name}
                </label>
              ))}
            </div>
          </div>

          {/* Pack Size — dynamically from actual product data */}
          {packSizeOptions.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-800">
                Pack Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {packSizeOptions.map((size) => {
                  const active = draft.packSizes.has(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, packSizes: toggleSetValue(d.packSizes, size) }))
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-amber-500 bg-amber-500 text-white"
                          : "border-zinc-200 text-zinc-600 hover:border-amber-300"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-zinc-100 px-6 py-5">
          <button
            onClick={handleClear}
            className="flex-1 rounded-full border border-zinc-300 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
