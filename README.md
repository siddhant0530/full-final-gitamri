# Gitamri Maaji — Session Updates (24 Aug 2026)

Extract this zip and copy each file over its matching path in your repo
(`full-final-gitamri`), overwriting existing files. Files marked *(new)*
don't exist in your repo yet — everything else replaces an existing file.

---

## 1. Razorpay webhook — self-healing missed orders
Root cause of the Pratik Khasale incident: payment succeeded on
Razorpay but the order was never written to Supabase (no webhook
existed as a backup, and no cart/customer data was even sent to
Razorpay to recover from).

- **`app/api/webhooks/razorpay/route.ts`** *(new)* — Razorpay calls
  this independently on every `payment.captured` event. If no order
  exists yet for that payment, it recreates one automatically using
  the customer/cart details stashed in the Razorpay order's `notes`.
- **`lib/razorpay.ts`** — `createRazorpayOrder` now accepts `notes`;
  added `verifyRazorpayWebhookSignature`.
- **`app/api/payments/razorpay/create-order/route.ts`** — stashes
  customer + cart details as Razorpay order notes at creation time.
- **`app/checkout/page.tsx`** — sends `customer` details so they reach
  those notes.
- **`lib/order-store.ts`** + **`app/api/orders/route.ts`** — added
  `getOrderByRazorpayPaymentId` and an idempotency check, so the
  webhook and normal checkout never create a duplicate order.

### Manual setup required
1. Razorpay Dashboard -> Settings -> Webhooks -> Add New Webhook
   - URL: `https://gitamrimaaji.com/api/webhooks/razorpay`
   - Active event: `payment.captured`
   - Copy the generated **Webhook Secret**
2. Add `RAZORPAY_WEBHOOK_SECRET=<that secret>` to `.env.local` AND
   Vercel -> Environment Variables (Production). Different value from
   `RAZORPAY_KEY_SECRET` — don't reuse it.
3. After deploying, place a small test order and check Vercel's
   runtime logs for `[razorpay webhook]` entries.

---

## 2. State field — auto-fill + everywhere it was missing
- **`app/checkout/page.tsx`** — pincode entry auto-fills State (and
  City, if empty) via India Post's free public pincode API.
- **`app/admin/page.tsx`** — customer detail block now shows State.
- **`lib/invoice-pdf.ts`** — Bill To/Ship To block shows State.
- **`lib/delhivery.ts`** + **`app/api/delivery/create/route.ts`** —
  State now sent to Delhivery (was missing from every past shipment).

---

## 3. HSN codes
- **`data/invoice.ts`** — all products set to HSN `2005`, except
  `amla-murabba` -> `2006` (confirmed against a real Tally invoice —
  murabba is sugar-preserved, different classification from oil/vinegar
  pickles). Worth double-checking the rest against your CA's records.

---

## 4. Invoice PDF — brought up to GST-compliant Tally-style format
Compared line-by-line against a real Tally tax invoice. `lib/invoice-pdf.ts`
now includes, which were missing before:
- "Amount Chargeable (in words)" and "Tax Amount (in words)"
- HSN-wise CGST/SGST (intra-state) or IGST (inter-state) breakdown
  table, grouped by HSN code
- Declaration statement, "Computer Generated Invoice" note,
  "Authorised Signatory" line
- Business contact info: 9172285933 / welcome@gitamrimaaji.com
- `lib/invoice-logo.ts` (new) — the real brand logo (flattened onto
  the invoice header's green, re-encoded as a small JPEG), now
  actually embedded as an image in the PDF. The generator had zero
  image-embedding support before this — it was text-only.

### Still open — not yet changed, needs your decision
1. **Business address mismatch** — ours says "First Floor, Plot No.
   56, C/O Rajendra M Rote, Collector Colony..."; the real Tally
   invoice says "FL NO-102, Suman Tower, Suman Nagari, Godhani Rly,
   Godhani." Confirm which is correct.
2. **Invoice numbering scheme** — Tally generates GEWEB2627000003;
   the website generates its own via Supabase (next_gitamri_invoice_number).
   If the same order could ever be invoiced by both, you'd get two
   different invoice numbers for one sale.

---

## 5. Customer accounts — Login / Signup / Order History / Saved Addresses
The old `/login` page was a **non-functional mockup** — every button
just showed "isn't connected to a real backend yet." Nothing a
customer entered ever went anywhere, which is why nothing showed up
in the admin panel. This is now fully wired to **Supabase Auth**
(already included with your Supabase project, no new service needed).

### New/changed files
- **`lib/customer-auth.ts`** *(new)* — wraps Supabase Auth's REST API:
  email/password, mobile OTP, Google/Facebook OAuth, session cookies,
  local JWT verification (no network call needed to check login state).
- **`lib/customer-store.ts`** *(new)* — links a Supabase Auth user to
  your existing `User` table (reuses the same id, so it plugs into
  your existing Order -> User relationship with zero schema changes
  there) + full CRUD for saved addresses.
- **`lib/get-current-customer.ts`** *(new)* — reads the logged-in
  customer from cookies inside a route handler.
- **`lib/supabase.ts`** — added a `dbDelete` helper (didn't exist
  before, needed for removing saved addresses).
- **`lib/order-store.ts`** — `saveOrder` now accepts an optional
  logged-in customer id, linking their orders to their real account
  instead of always creating a fresh throwaway guest row; added
  `getOrdersByUserId` for the account page's order history.
- **`app/api/orders/route.ts`** — detects a logged-in customer via
  their session cookie and links the order to their account
  automatically. Guest checkout is completely unaffected.
- **8 new API routes:**
  - `app/api/auth/signup/route.ts` — email/password signup
  - `app/api/auth/login/route.ts` — email/password login
  - `app/api/auth/logout/route.ts` — clears session, revokes token
  - `app/api/auth/otp/send/route.ts` / `otp/verify/route.ts` — mobile OTP
  - `app/api/auth/oauth/[provider]/route.ts` — Google/Facebook redirect
  - `app/api/auth/session/route.ts` — completes OAuth login (see below)
  - `app/api/auth/me/route.ts` — "am I logged in?" for the Navbar
  - `app/api/account/orders/route.ts` — this customer's own orders
  - `app/api/account/addresses/route.ts` + `[id]/route.ts` — saved
    address CRUD
- **`app/login/page.tsx`** — rewritten to actually call the above.
- **`app/account/page.tsx`** *(new)* — order history + saved
  addresses, with a tab UI.
- **`app/auth/callback/page.tsx`** *(new)* — required for Google/
  Facebook login: Supabase returns OAuth tokens in the URL's hash
  fragment, which browsers never send to a server, so this tiny
  client page reads the hash and hands the tokens to
  `/api/auth/session` to be set as secure httpOnly cookies.
- **`middleware.ts`** — `/account` and `/api/account/*` now require a
  valid session, with silent token refresh (customer stays logged in
  without re-entering a password every hour).
- **`components/Navbar.tsx`** — shows "My Account" instead of "Login /
  Sign Up" once logged in.
- **`app/checkout/page.tsx`** — logged-in customers can now pick a
  saved address at checkout instead of retyping everything.
- **`supabase/003_customer_auth_migration.sql`** *(new)* — creates the
  `Address` table. No changes needed to your existing `Order` or
  `User` tables.

### Manual setup required
1. **Run the migration**: paste `supabase/003_customer_auth_migration.sql`
   into Supabase Dashboard -> SQL Editor -> Run.
2. **Add one env var** (Supabase Dashboard -> Settings -> API -> Legacy
   anon, service_role API keys tab) to `.env.local` and Vercel:
   - `SUPABASE_ANON_KEY` — the "anon / public" key
   (No JWT secret needed — this project uses Supabase's newer
   asymmetric JWT signing keys, so session tokens are verified against
   Supabase's public key automatically, fetched from its standard
   `/.well-known/jwks.json` endpoint. Nothing to copy or configure.)
3. **Email + Password works immediately** — no extra setup needed.
4. **Google login** — Supabase Dashboard -> Authentication -> Providers
   -> Google -> paste your Google Cloud OAuth Client ID/Secret (create
   one at Google Cloud Console -> APIs & Services -> Credentials ->
   OAuth Client ID -> Web application -> add
   `https://<your-project>.supabase.co/auth/v1/callback` as an
   authorized redirect URI).
5. **Facebook login** — same idea: Supabase Dashboard -> Authentication
   -> Providers -> Facebook -> paste your Meta App ID/Secret (create one
   at developers.facebook.com -> add Facebook Login product -> same
   Supabase callback URL as above).
6. **Mobile OTP** — Supabase Dashboard -> Authentication -> Providers ->
   Phone -> connect an SMS provider (Twilio is the most common choice
   for India — you'll need a Twilio account with Verify configured).
   Until this is connected, OTP send will fail with a clear error
   message rather than silently doing nothing.

### What already works today, with zero extra setup
Email + password signup/login, order history, and saved addresses —
all fully functional as soon as the migration is run and the two env
vars are added. Google, Facebook, and OTP buttons will show a clear
error until their respective provider is connected in steps 4–6 above,
rather than failing silently like the old mockup did.
