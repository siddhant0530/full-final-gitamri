"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import ProductFilterDrawer, { ProductFilters, DiscountFilter } from "./ProductFilterDrawer";

type SortOption = "featured" | "bestSelling" | "newArrivals" | "priceLowHigh" | "priceHighLow";

const SORT_LABELS: Record<SortOption, string> = {
  featured: "Featured",
  bestSelling: "Best Selling",
  newArrivals: "New Arrivals",
  priceLowHigh: "Price: Low → High",
  priceHighLow: "Price: High → Low",
};

function displayPrice(product: Product): number {
  return product.variants?.[0]?.price ?? product.price;
}

// Highest discount % across a product's variants (0 if none/no MRP set).
function maxDiscountPercent(product: Product): number {
  if (!product.variants) return 0;
  return product.variants.reduce((max, v) => {
    if (!v.mrp || v.mrp <= v.price) return max;
    const pct = ((v.mrp - v.price) / v.mrp) * 100;
    return Math.max(max, pct);
  }, 0);
}

function packSizesOf(product: Product): string[] {
  return product.variants ? product.variants.map((v) => v.weight) : [product.weight];
}

// Accepts an optional initial category slug (e.g. from a ?category= URL
// param) so links from the navbar/homepage land on the right filter.
export default function ProductGrid({
  initialCategory,
  initialSearch,
}: {
  initialCategory?: string;
  initialSearch?: string;
}) {
  const priceBounds = useMemo(() => {
    const prices = products.filter((p) => !p.comingSoon).map(displayPrice).filter((n) => n > 0);
    if (prices.length === 0) return { min: 0, max: 1000 };
    return {
      min: Math.floor(Math.min(...prices) / 10) * 10,
      max: Math.ceil(Math.max(...prices) / 10) * 10,
    };
  }, []);

  const packSizeOptions = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach((p) => packSizesOf(p).forEach((s) => sizes.add(s)));
    return Array.from(sizes).sort();
  }, []);

  const initialCategorySet = useMemo(
    () => new Set(initialCategory && initialCategory !== "all" ? [initialCategory] : []),
    [initialCategory]
  );

  const [filters, setFilters] = useState<ProductFilters>({
    categories: initialCategorySet,
    availability: new Set(),
    priceMin: priceBounds.min,
    priceMax: priceBounds.max,
    discount: "all",
    packSizes: new Set(),
  });
  const [sort, setSort] = useState<SortOption>("featured");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Category pills stay exclusive/single-select (unchanged existing UX),
  // but write into the exact same `filters.categories` set the drawer's
  // checkboxes use — one source of truth, no duplicate state.
  function selectPillCategory(slug: string | "all") {
    setFilters((f) => ({ ...f, categories: slug === "all" ? new Set() : new Set([slug]) }));
  }

  const filtered = useMemo(() => {
    let list = products.slice();

    if (filters.categories.size > 0) {
      const names = new Set(
        Array.from(filters.categories)
          .map((slug) => categories.find((c) => c.slug === slug)?.name)
          .filter(Boolean)
      );
      list = list.filter((p) => names.has(p.category));
    }
    if (initialSearch && initialSearch.trim()) {
      const q = initialSearch.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }

    if (filters.availability.size > 0) {
      list = list.filter((p) => {
        const bucket = p.inStock ? "inStock" : "outOfStock";
        return filters.availability.has(bucket as "inStock" | "outOfStock");
      });
    }

    list = list.filter((p) => {
      if (p.comingSoon) return true; // no price yet — don't hide behind a price filter
      const price = displayPrice(p);
      return price >= filters.priceMin && price <= filters.priceMax;
    });

    if (filters.discount !== "all") {
      const threshold = filters.discount === "onSale" ? 0.01 : (filters.discount as number);
      list = list.filter((p) => maxDiscountPercent(p) >= threshold);
    }

    if (filters.packSizes.size > 0) {
      list = list.filter((p) => packSizesOf(p).some((s) => filters.packSizes.has(s)));
    }

    return list;
  }, [filters, initialSearch]);

  const sorted = useMemo(() => {
    const list = filtered.slice();
    switch (sort) {
      case "bestSelling":
        return list.sort((a, b) => Number(!!b.bestSeller) - Number(!!a.bestSeller));
      case "newArrivals":
        return list.sort((a, b) => Number(!!b.newlyAdded) - Number(!!a.newlyAdded));
      case "priceLowHigh":
        return list.sort((a, b) => displayPrice(a) - displayPrice(b));
      case "priceHighLow":
        return list.sort((a, b) => displayPrice(b) - displayPrice(a));
      case "featured":
      default:
        return list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    }
  }, [filtered, sort]);

  const activeFilterCount =
    filters.categories.size +
    filters.availability.size +
    filters.packSizes.size +
    (filters.discount !== "all" ? 1 : 0) +
    (filters.priceMin !== priceBounds.min || filters.priceMax !== priceBounds.max ? 1 : 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => selectPillCategory("all")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            filters.categories.size === 0
              ? "bg-terracotta-500 text-white"
              : "border border-gold-300 text-zinc-700 hover:bg-gold-50"
          }`}
        >
          All Products
        </button>
        {categories.map((cat) => {
          const count = products.filter((p) => p.category === cat.name).length;
          if (count === 0) return null; // don't show filter tabs with nothing in them yet
          const active = filters.categories.has(cat.slug);
          return (
            <button
              key={cat.slug}
              onClick={() => selectPillCategory(cat.slug)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-terracotta-500 text-white"
                  : "border border-gold-300 text-zinc-700 hover:bg-gold-50"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          );
        })}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-gold-400 hover:text-gold-700"
        >
          <SlidersHorizontal size={16} />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-xs font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <label className="flex items-center gap-2 text-sm text-zinc-600">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 focus:border-gold-400 focus:outline-none"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ProductFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        priceBounds={priceBounds}
        packSizeOptions={packSizeOptions}
        applied={filters}
        onApply={setFilters}
        onClear={() =>
          setFilters({
            categories: new Set(),
            availability: new Set(),
            priceMin: priceBounds.min,
            priceMax: priceBounds.max,
            discount: "all" as DiscountFilter,
            packSizes: new Set(),
          })
        }
      />

      {sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gold-300 bg-gold-50/50 p-16 text-center">
          <p className="text-lg font-semibold text-zinc-700">No products match these filters.</p>
          <p className="mt-2 text-zinc-500">Try adjusting or clearing a filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
