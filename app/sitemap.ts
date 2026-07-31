import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { SITE_URL } from "@/lib/site-config";

// Static, non-transactional pages worth indexing. Cart/checkout/login/
// admin/order-confirmation are deliberately excluded — see robots.ts.
const staticPages: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/products", priority: 0.9, changeFrequency: "weekly" },
  { path: "/shop", priority: 0.5, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/reviews", priority: 0.6, changeFrequency: "weekly" },
  { path: "/support", priority: 0.4, changeFrequency: "monthly" },
  // wholesale, export, careers, media, recipes, stores are intentionally
  // excluded — they're placeholder "coming soon" pages (noindex) until
  // real content exists; see components/layout/ComingSoonPage.tsx
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/shipping", priority: 0.2, changeFrequency: "yearly" },
  { path: "/returns", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Coming-soon products aren't purchasable yet — still worth indexing at
  // a lower priority so the pages exist ahead of stock arriving, but real,
  // in-stock products are the pages that should rank highest.
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p.comingSoon ? 0.4 : 0.8,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
