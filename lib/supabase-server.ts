/**
 * SUPABASE AUTH — SERVER CLIENT
 * --------------------------------------------------------------
 * Reads/refreshes the customer's auth session from cookies inside
 * Server Components and Route Handlers. Uses the anon key + the
 * signed-in user's own session — this can only ever act as that
 * one customer (RLS-scoped), never as an admin. It is NOT the same
 * as lib/supabase.ts, which uses the service role key and bypasses
 * RLS entirely for admin/order-processing work.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component render, where cookies can't be
          // written directly — middleware.ts handles refreshing the
          // session cookie on the response instead, so this is safe to
          // swallow here.
        }
      },
    },
  });
}
