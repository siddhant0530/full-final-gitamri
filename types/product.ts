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
  // Keyword-rich title/description used ONLY in <title>, meta description,
  // and Open Graph tags — never rendered on the storefront itself. Lets the
  // page rank for long-tail search terms (e.g. "Traditional Indian Aam Ka
  // Achar in Mustard Oil, No Vinegar") without cluttering the actual
  // product page, which keeps showing the short, clean `name`/
  // `shortDescription`. Falls back to name/shortDescription if omitted.
  // GST HSN code, required on a real tax invoice. Deliberately left
  // unset for every product for now — DO NOT invent, guess, or
  // placeholder-fill this. The invoice system reads whatever is here
  // (or blank) at generation time, so entering the correct code per
  // product later requires no code changes, just filling this in.
  hsnCode?: string;
  seoTitle?: string;
  seoDescription?: string;
  // Short vernacular/ingredient line shown right under the product name on
  // the storefront (e.g. "Traditional Aam Ka Achar · Mustard Oil · No
  // Vinegar") — keeps the keyword-rich terms visible to customers without
  // making the H1 itself read like an SEO title.
  subtitle?: string;
  // Short trust-building checklist shown near the top of the product page,
  // right under price/variants and before the full description — answers
  // "why should I buy this" before the customer scrolls further. Falls
  // back to a safe generic set in ProductHero if omitted, but should be
  // set per-product where ingredients differ (e.g. Amla Murabba is a sugar
  // syrup preserve, not a mustard-oil pickle, so its checklist shouldn't
  // claim "mustard oil" or "no vinegar").
  whyYoullLoveIt?: string[];
  // Freeform serving suggestion shown in its own "How to Enjoy" tab on the
  // product page.
  howToEnjoy?: string;
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
  // Free-text badge for one-off cases the boolean flags above don't cover
  // (e.g. "Perfect for First-Time Buyers" on the Trial Pack). Takes the
  // same saffron badge styling as the others when present.
  customBadge?: string;
  comingSoon?: boolean; // no photos/price yet — shown as a placeholder card, not purchasable
  ingredients: string[];
  nutrition: NutritionInfo;
  shelfLife: string;
  storage: string;
  whatsappMessage: string;
  knowYourPickle?: string;
}
