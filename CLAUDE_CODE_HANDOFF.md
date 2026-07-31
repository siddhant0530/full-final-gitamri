RESUMING GITAMRI MAAJI — HANDOFF FROM A CLAUDE.AI CHAT SESSION

I've been working on this project (Gitamri Maaji e-commerce site, Next.js 15) in a separate
Claude.ai chat that had no network access — everything below was written and type-checked
there, but never run through a real `next build`/`next dev` or pushed to git. That's your
first job: verify it all actually runs, then pick up the open items.

WHAT'S IN THIS FOLDER
The zip I'm attaching (extract it here, or point me at wherever you extracted it) already has
my changes applied. It does NOT include node_modules or .next — run `npm install` first.

WHAT WAS FIXED / BUILT IN THAT SESSION, do a quick sanity pass on each:

1. Build-breaking bug — data/products.ts had a duplicate `image:` key on the Mustard Chutney
   Pickle product (leftover copy-paste). Fixed. Confirm `npm run build` actually succeeds now.

2. Security — .gitignore was only excluding `.vercel`, NOT node_modules/.next/.env.local.
   Fixed the .gitignore. IMPORTANT: check `git log` / GitHub for whether .env.local (with real
   Razorpay/Supabase/Delhivery/admin secrets) was ever actually committed before this fix. If
   it was, rotate all of those keys.

3. Homepage spacing — page.tsx was double-wrapping several sections (WhyChooseUs, Testimonials)
   in extra padded containers on top of their own internal padding, creating huge gaps between
   sections. Fixed — removed the redundant wrappers, standardized every home section to
   `py-16 md:py-20`. Worth eyeballing on an actual screen since I never rendered it.

4. SEO — added `aggregateRating`/`review` JSON-LD to product pages (pulls from real customer
   reviews), `BreadcrumbList` schema on product + category pages, `CollectionPage`/`ItemList`
   schema on category pages, explicit `viewport` export with theme color, and a new
   `/og-image.jpg` (1200x630, replaces the old square logo) wired into layout.tsx as the
   sitewide Open Graph/Twitter card image.

5. tsconfig.json — `moduleResolution` was the deprecated "node", changed to "bundler".

6. A real navbar bug I found while checking heading structure: components/Navbar.tsx had an
   <h1> around the brand wordmark, rendered on every page via root layout — meaning every page
   had two H1s (navbar's + the page's own). Changed to a <span>.

7. BIG ONE — full reviews backend, built to replace the static data/reviews.ts:
   - supabase/001_reviews_migration.sql — creates "Review" and "ReviewInvite" tables, RLS
     enabled, and seeds the existing 21 static reviews as already-approved.
     **THIS HAS NOT BEEN RUN YET.** Run it in the Supabase SQL Editor before testing reviews.
   - lib/reviews-store.ts — Supabase-backed CRUD, mirrors the existing lib/order-store.ts
     pattern. Has a fallback to the static file if Supabase isn't configured/reachable, so
     the site won't break if you test before running the migration.
   - Public flow: marking an order DELIVERED in /admin auto-generates a unique review link
     (app/api/orders/[trackingId]/route.ts). Customer visits /review/[token], rates + reviews
     each product from their order (components/reviews/ReviewSubmissionForm.tsx). Submissions
     save as PENDING via POST /api/reviews/submit.
   - Admin: app/admin/page.tsx now has Orders/Reviews tabs. Reviews tab = moderation queue
     (Approve/Reject/Delete/Feature-on-homepage). Orders tab shows a "Copy review link" button
     on any DELIVERED order.
   - middleware.ts updated to protect /api/admin/reviews*; robots.ts updated to disallow
     /review/.
   - ProductRating, ProductReviewsList, ProductReviewCard, homepage Testimonials, and the
     product-page JSON-LD all now read from this store instead of importing data/reviews.ts
     directly.
   - NOT built: photo upload on the review form (text + star rating only, v1 scope), and
     auto-sending the review link to customers (currently manual copy-paste from admin — needs
     an email/SMS provider, same as the existing TODO in order-store.ts for order-confirmation
     emails).

WHAT I NEED FROM YOU (Claude Code) NOW, IN ORDER:
1. `npm install`, then `npm run build`. Fix anything that surfaces that the sandboxed session
   couldn't catch (it only had `tsc --noEmit`, not a real Next build).
2. `npm run lint` — the sandboxed session couldn't run this either (ESLint 9 needs a flat
   config it didn't have set up; check if one exists here).
3. Run the SQL migration against the real Supabase project if the user gives you access/asks
   you to (don't do it unprompted).
4. `npm run dev` and actually click through: home → product page → cart → checkout, and the
   new review flow (mark a test order DELIVERED → copy link → submit a review → approve it in
   admin → confirm it shows on the product page).
5. Ask the user before touching git (commit/push) or deploying — same rule as the chat session
   was under.

OPEN ITEM NOT YET STARTED: a three-phase Meta Ads (Blinkit) campaign for Mango Pickle plus
Mustard Chutney creative assets — the user was drafting copy for this in a different chat
session I don't have access to. Ask them to paste it in if they want help with it.

---
FINAL UPDATE — everything built after the above, in one Claude.ai chat session
(still no real network/build access — verified with tsc + eslint only, same
caveat as always). This is the last update before the file was packaged as
the final deliverable.

1. Cleaned up legacy dead files that had been sitting in the project since
   before this conversation started: deleted top-level home/, products/,
   docs/ folders and README.md, README-PART2.md, SETUP_NOTES.md — these
   were leftovers from a much earlier build (described a hardcoded admin
   password and JSON-file order storage, neither true anymore). ONE file
   in there, products/ProductActionBar.tsx, was actually real and wired
   into ProductHero.tsx — moved it to its correct home at
   components/products/ProductActionBar.tsx and fixed the import.

2. Favicon — was completely missing (app/layout.tsx pointed at the raw
   wordmark JPEG, which isn't usable at 16x16). Generated a real
   app/favicon.ico, app/apple-icon.png, app/icon.png (dark green bg,
   amber "G" monogram, matches brand palette), removed the old manual
   `icons:` override in layout.tsx metadata since Next auto-detects these
   by filename/location now. Also completed public/site.webmanifest
   (was just `{"name":"Gitamri Maaji"}`, no icons at all).

3. FAQ — app/faq/page.tsx was a stub (just an <h1>, no content). Wrote 13
   real Q&As (data/faq.ts) covering ordering/payment/shipping/returns/
   ingredients/contact, sourced directly from the actual returns.tsx and
   shipping.tsx policy text so nothing contradicts what's already live
   elsewhere. Built components/faq/FAQAccordion.tsx (expand/collapse UI)
   and added FAQPage JSON-LD generated from the exact same data array —
   IMPORTANT CAVEAT: Google fully deprecated FAQ rich results in Search
   as of May 7, 2026 (confirmed via web search, this is after Claude's
   training cutoff) — the schema is still valid and worth keeping since
   it accurately describes real page content, but it will NOT produce a
   search-result dropdown. Don't oversell that part if asked.

4. Homepage Testimonials — was showing 4 featured reviews with no total
   count and no way to see more. app/page.tsx now fetches all approved
   reviews once, derives both the featured subset and a total
   count/average rating; Testimonials.tsx displays "X.X out of 5 · based
   on N reviews" and links to a new app/reviews/page.tsx — a real
   sitewide reviews page (all approved reviews, each linking to its
   product) that didn't exist before. Added /reviews to sitemap.ts.

5. Live Google rating badge in the footer — lib/google-reviews.ts fetches
   from Google Places API (New), server-only (API key never reaches the
   browser), 24h cache via fetch revalidate, returns null (not a thrown
   error) if GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID aren't set so the
   badge just doesn't render rather than breaking anything. Both env vars
   documented with exact setup steps in .env.local.example — the user
   has NOT set these up yet, so the badge won't appear until they do.
   Their real Maps link resolves to coordinates 21.2120895, 79.0562077
   (Nagpur) — noted in the env example to help them find their real
   Place ID via Google's Place ID Finder tool.

6. Footer completeness pass: copyright line (dynamic year), GSTIN
   (27AAMCG0530G1ZT, user-provided and confirmed real), Privacy/Shipping/
   Returns/Terms pages were LIVE but had zero internal links anywhere —
   added a "Policies" footer column linking all four.

7. Why Choose Us — swapped two of the six cards ("Crafted with Care" and
   "Tradition You Can Taste", both redundant with other cards/copy on the
   same section) for "Small Batch Crafted" and "No Artificial Colours" —
   ONLY added after the user explicitly confirmed both are true of their
   actual process; don't add further ingredient/process claims without
   the same kind of explicit confirmation.

8. Added "Trusted by Families Across India" as a small trust-badge line
   directly below the H1 on the homepage hero, per explicit user request
   (same caution as #7 — it's a factual claim, user's call to include it).

9. Verified no duplicate/conflicting JSON-LD anywhere (checked directly:
   product pages have exactly one Product + one BreadcrumbList; category
   pages have exactly one BreadcrumbList + one CollectionPage; root layout
   has exactly one Organization; FAQ page has exactly one FAQPage). Safe.

STILL OPEN, unchanged from before, still needs a real environment or the user directly:
- git log --all --full-history -- .env.local — STILL NEVER ACTUALLY RUN
  anywhere across this entire project history. Still the single highest-
  priority item. If it shows .env.local was ever committed, rotate
  Razorpay/Supabase/Delhivery/admin credentials.
- Run supabase/001_reviews_migration.sql in the Supabase SQL Editor.
- Set up GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID (see .env.local.example).
- A real `npm run build` — only ever verified via tsc --noEmit + eslint.
- Deploy, then real mobile-device testing + Lighthouse (both deliberately
  deferred until there's a live URL, per the user's own call).
- Decisions never revisited: WhatsApp navbar pill (currently removed,
  user seemed fine with it but never explicitly confirmed either way),
  photo upload on the review form (v1 scoped out, text+rating only),
  auto-sending review links instead of manual admin copy-paste, and the
  Meta Ads / Blinkit campaign (mentioned once early on, never returned to
  — user explicitly said NOT to add Blinkit to the site yet, single-city
  coverage would undercut the Amazon/Flipkart credibility nearby).

---
SECOND FINAL UPDATE — a genuine full file-by-file, folder-by-folder audit,
after the user caught that the previous "cleanup" was incomplete (the zip
still contained ~250 changed/junk files in components/products/ and
components/home/ that I never checked individually — only spot-checked
specific filenames existed, not that the folders were clean). Owning that
mistake: this update is the result of actually checking every single file.

1. Deleted 46 more unused files from components/products/ (real count is
   now exactly 12: PriceRangeSlider, ProductActionBar, ProductBadge,
   ProductCard, ProductDetailsAccordion, ProductFilterDrawer,
   ProductGallery, ProductGrid, ProductHero, ProductRating,
   ProductReviewCard, ProductReviewsList — every other file in that folder
   was dead scaffold junk with zero real imports anywhere).

2. Deleted 14 more unused files from components/home/ (real count is now
   exactly 7: ExportSection, FeaturedCategories, FeaturedProducts,
   FooterCTA, HeroBanner, Testimonials, WhyChooseUs).

3. Deleted the stray components/layout/SectionTitle.tsx (unused) and
   lib/constants.ts (unused stub, superseded by data/company.ts).

4. Deleted 6 unused data files: data/brand.ts, navigation.ts, site.ts,
   export.ts, stores.ts, products-full.ts — four of these were literally
   0 bytes. None had a single real import anywhere.

5. Found and fixed a real content/SEO bug this full audit surfaced:
   app/careers, app/export, app/media, app/recipes, app/stores,
   app/wholesale were ALL pure stub pages (just `<h1>PageName</h1>`,
   indexable metadata, real canonical URLs) — none linked from anywhere
   on the site, yet all 6 were explicitly submitted in the sitemap,
   actively telling Google to index six blank pages. Built a shared
   components/layout/ComingSoonPage.tsx (matches the site's existing
   "this category is launching soon" tone/convention), gave each page
   real (if minimal, non-fabricated) copy + a WhatsApp CTA, added
   robots: {index:false, follow:false} to all 6 since there's no real
   content to justify indexing yet, and removed them from sitemap.ts
   (a noindex page in the sitemap is a contradictory signal).

METHODOLOGY NOTE for whoever continues this: naive substring/basename
grep checks throw false positives on common-word filenames (e.g. "export",
"site", "stores" match all over the codebase as English words/JS
keywords, not real imports) — always verify with an exact
`from "@/path/to/file"` import-statement match, and always search the
SAME folder too (lib/ files importing other lib/ files were missed once
by only searching app/+components/). Confirmed this final state compiles
clean (tsc --noEmit) and lints clean (0 errors, same 1 pre-existing
intentional WhatsAppIcon warning) before packaging.
