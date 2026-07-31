/**
 * PRODUCT CATEGORIES — single source of truth
 * --------------------------------------------------------------
 * Every category the brand sells under lives here, driven by the
 * product roadmap (Gitamri_Product_Diversification_Document).
 * The homepage, navbar, and /products page all read from this file,
 * so adding a new category later means editing ONE array here —
 * no other file needs to change.
 *
 * `slug` is the URL-safe key used in routes/filters (/products?category=slug).
 * Product counts are derived at runtime from data/products.ts, so this
 * file never needs to track how many items exist in each category.
 */

export interface Category {
  slug: string;
  name: string;
  icon: string; // emoji, used as a lightweight visual without extra image assets
  description: string;
}

export const categories: Category[] = [
  {
    slug: "pickles-chutneys",
    name: "Pickles & Chutneys",
    icon: "🥭",
    description:
      "Traditional pickles and chutneys made with authentic Indian spices and farm-fresh ingredients.",
  },
  {
    slug: "atta-sattu-flours",
    name: "Atta, Sattu & Flours",
    icon: "🌾",
    description:
      "Stone-ground flours and sattu, milled fresh for everyday cooking and traditional recipes.",
  },
  {
    slug: "pulses",
    name: "Pulses",
    icon: "🌱",
    description:
      "Premium dals and chana, sourced and cleaned for consistent quality in every batch.",
  },
  {
    slug: "masalas-whole-spices",
    name: "Masalas & Whole Spices",
    icon: "🌶️",
    description:
      "Expertly blended masalas and whole spices that bring rich aroma to every meal.",
  },
  {
    slug: "traditional-ready-to-eat",
    name: "Traditional Ready-to-Eat Foods",
    icon: "🥘",
    description:
      "Heritage snacks and instant foods prepared the traditional way, ready when you are.",
  },
  {
    slug: "dry-fruits-seeds",
    name: "Dry Fruits & Healthy Seeds",
    icon: "🥜",
    description:
      "Premium dry fruits, nuts, and seeds for everyday wellness and festive gifting.",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
