/**
 * SUPABASE AUTH — BROWSER CLIENT
 * --------------------------------------------------------------
 * Used only in "use client" components (login page, account page)
 * for customer-facing sign-in/sign-up/OAuth/sign-out. Uses the
 * public anon key, which is safe to ship to the browser now that
 * RLS is enabled with no open policies on User/Order/OrderItem —
 * this key alone cannot read or write those tables.
 *
 * Do NOT import this from server code (API routes, server
 * components) — use lib/supabase-server.ts there instead.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add both to .env.local and Vercel env vars (must have the NEXT_PUBLIC_ prefix to be readable in the browser)."
    );
  }
  return createBrowserClient(url, anonKey);
}
