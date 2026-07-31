/**
 * category holds the human-readable category name (must match a
 * `name` in data/categories.ts). It's a plain string rather than a
 * fixed union so new categories can be added in data/categories.ts
 * without touching this type — the site is designed to scale to
 * hundreds of products/categories with no code changes here.
 */
export type ProductCategory = string;

export interface NutritionInfo {
  energy?: string;
  protein?: string;
  carbohydrates?: string;
  fat?: string;
}

// A single purchasable size for a product, e.g. 220g @ ₹195.
// Products with only one size can omit `variants` and use the
// top-level price/weight fields instead (kept for backward compatibility).
export interface ProductVariant {
  weight: string;
  price: number;
  mrp?: number; // original/MRP price, shown struck-through when higher than price
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  description: string;
  shortDescription: string;
  image: string;
  gallery: string[];
  price: number;
  weight: string;
  variants?: ProductVariant[];
  featured: boolean;
  inStock: boolean;
  bestSeller?: boolean;
  topRated?: boolean;
  newlyAdded?: boolean;
  mostLoved?: boolean;
  comingSoon?: boolean; // no photos/price yet — shown as a placeholder card, not purchasable
  ingredients: string[];
  nutrition: NutritionInfo;
  shelfLife: string;
  storage: string;
  whatsappMessage: string;
  knowYourPickle?: string;
}
