import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { linkCustomerAccount } from "@/lib/link-customer-account";

/**
 * Google/Facebook redirect here after the customer approves sign-in.
 * Exchanges the one-time `code` for a real session (sets cookies via
 * lib/supabase-server.ts), then links or creates the matching "User"
 * row before sending them on to their account page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/account";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      try {
        await linkCustomerAccount(data.user);
      } catch (linkError) {
        // Don't block login over a linking failure — the customer is
        // still authenticated; they just may not see past guest orders
        // merged in yet. Worth checking server logs if this fires often.
        console.error("linkCustomerAccount failed in OAuth callback:", linkError);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
