import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { linkCustomerAccount } from "@/lib/link-customer-account";

/**
 * Called from the browser right after supabase.auth.signInWithPassword()
 * succeeds (the OAuth flow does this server-side already, in
 * app/auth/callback/route.ts, since it has no separate client step).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const result = await linkCustomerAccount(user);
  return NextResponse.json(result);
}
