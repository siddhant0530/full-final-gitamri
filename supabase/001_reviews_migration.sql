-- ============================================================
-- Gitamri Maaji — Reviews backend migration
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- 1. Review table — replaces the static data/reviews.ts file.
create table if not exists "Review" (
  id uuid primary key default gen_random_uuid(),
  "orderId" text references "Order"(id) on delete set null,
  "productSlug" text not null,
  "customerName" text not null,
  rating int not null check (rating between 1 and 5),
  text text not null,
  photo text,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','DELETED')),
  "homepageFeatured" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

-- If this migration was already run once (before the DELETED status was
-- added below), refresh the constraint so it allows the new value too.
-- Safe no-op on a fresh run.
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'Review') then
    alter table "Review" drop constraint if exists "Review_status_check";
    alter table "Review" add constraint "Review_status_check"
      check (status in ('PENDING','APPROVED','REJECTED','DELETED'));
  end if;
end $$;

create index if not exists review_status_idx on "Review" (status);
create index if not exists review_product_slug_idx on "Review" ("productSlug");

-- 2. ReviewInvite table — one row per "please review your order" link.
--    token is the unguessable part of the URL: /review/<token>
create table if not exists "ReviewInvite" (
  token text primary key,
  "orderId" text not null references "Order"(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "usedAt" timestamptz
);

create unique index if not exists review_invite_order_idx on "ReviewInvite" ("orderId");

-- 3. Row Level Security — this project talks to Supabase using the
--    Service Role key from the server only (see lib/supabase.ts), which
--    bypasses RLS, so these policies aren't strictly required for the
--    app to work. Enabling RLS with no public policies is still good
--    practice: it means these tables are NOT readable/writable via the
--    public anon key even if that key ever leaked.
alter table "Review" enable row level security;
alter table "ReviewInvite" enable row level security;

-- 4. One-time seed — migrates your existing 21 hand-curated reviews
--    from data/reviews.ts into the database as already-APPROVED, so
--    nothing is lost and the site keeps showing them immediately.
--    ON CONFLICT guard: safe to re-run, won't duplicate on a second run.
insert into "Review" ("productSlug", "customerName", rating, text, photo, status, "homepageFeatured", "createdAt")
select v.* from (values
('green-chilli-pickle', 'Nirmala Wankhede', 5, 'Absolutely loved the Green Chilli Pickle —ghargutti taste, just like homemade.', '/nirmala wankhede.png.jpeg', 'APPROVED', true, now()),
('grated-mango-pickle', 'Verified Customer', 5, 'Loved the Mango Chutney and Red Chilli Pickle both — great taste and quality.', '/verified customer.png.jpeg', 'APPROVED', true, now()),
('red-chilli-pickle', 'Rajkumar Panyala', 5, 'super yummy Reminds my granmaa''s Taste, and great packaging.', NULL, 'APPROVED', true, now()),
('red-chilli-pickle', 'Ritesh Deshmukh', 5, 'glass jar reflects care and quality. Excellent flavour and presentation.', NULL, 'APPROVED', true, now()),
('mango-pickle', 'Ankit Shahu', 5, 'Excellent quality and authentic taste. The pickle reminds me of homemade recipes from childhood. Highly recommended.', NULL, 'APPROVED', false, now()),
('grated-mango-pickle', 'Koti Tiwari', 5, 'Rich traditional flavour with excellent quality. You can tell it''s made with care.', NULL, 'APPROVED', false, now()),
('mango-pickle', 'Dilip Rana', 4, 'Very tasty and fresh. The flavour is authentic, and the packaging is neat and secure.', NULL, 'APPROVED', false, now()),
('red-chilli-pickle', 'Tanmay Nagrale', 5, 'One of the best homemade-style pickles I''ve tried. Delicious with every meal.', NULL, 'APPROVED', false, now()),
('grated-mango-pickle', 'Pranjali Dhamgaye', 5, 'Authentic taste, premium quality, and beautifully packed. My family loved it.', NULL, 'APPROVED', false, now()),
('mango-pickle', 'Biplab Poddar', 5, 'Great flavour and consistent quality. It tastes just like traditional homemade pickle.', NULL, 'APPROVED', false, now()),
('red-chilli-pickle', 'Priyal', 5, 'Fresh, aromatic, and perfectly balanced. Definitely worth buying again.', NULL, 'APPROVED', false, now()),
('grated-mango-pickle', 'Gitesh', 4, 'Very good quality with rich flavours. A great product for everyday meals.', NULL, 'APPROVED', false, now()),
('mango-pickle', 'Mamita', 5, 'The freshness and traditional taste really stand out. Highly satisfied.', NULL, 'APPROVED', false, now()),
('red-chilli-pickle', 'Sharad Barsagade', 5, 'Premium quality products with authentic homemade flavour. Highly recommended.', NULL, 'APPROVED', false, now()),
('grated-mango-pickle', 'Rani', 5, 'Delicious taste and excellent packaging. Everyone at home enjoyed it.', NULL, 'APPROVED', false, now()),
('mango-pickle', 'Rahul Yelmanchi', 4, 'Great flavour and good quality ingredients. Looking forward to trying more varieties.', NULL, 'APPROVED', false, now()),
('red-chilli-pickle', 'Rahul Takod', 5, 'Excellent taste and consistent quality. Perfect with chapati and rice.', NULL, 'APPROVED', false, now()),
('grated-mango-pickle', 'Robin Dsouza', 5, 'Authentic Indian flavours with premium quality. Truly enjoyable.', NULL, 'APPROVED', false, now()),
('mango-pickle', 'Vijit Rathod', 5, 'Fresh ingredients and rich traditional taste. A product I''d happily recommend.', NULL, 'APPROVED', false, now()),
('grated-mango-pickle', 'Ishan Bargav', 4, 'Very satisfying taste with good spice balance. Great product overall.', NULL, 'APPROVED', false, now()),
('mango-pickle', 'Phuntsok Bhutia', 5, 'Authentic flavour, premium quality, and careful packaging. Highly impressed.', NULL, 'APPROVED', false, now())
) as v("productSlug", "customerName", rating, text, photo, status, "homepageFeatured", "createdAt")
where not exists (
  select 1 from "Review" r
  where r."customerName" = v."customerName" and r."productSlug" = v."productSlug" and r.text = v.text
);
