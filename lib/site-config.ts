/**
 * SITE_URL — single source of truth for the site's canonical domain.
 * --------------------------------------------------------------
 * Used to build canonical URLs, the sitemap, and absolute Open Graph
 * image URLs. Reads NEXT_PUBLIC_RAZORPAY-style env var if set, otherwise
 * falls back to a placeholder.
 *
 * ⚠️ PLACEHOLDER — the domain wasn't finalized when this was built.
 * Before launch: set NEXT_PUBLIC_SITE_URL in .env.local (and in your
 * hosting provider's env vars) to the real domain, e.g.
 *   NEXT_PUBLIC_SITE_URL=https://www.gitamrimaaji.com
 * Nothing else needs to change — every SEO file reads from here.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.gitamrimaaji.com";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
