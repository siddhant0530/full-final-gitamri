import { randomUUID } from "crypto";
import { dbInsert, dbSelect, dbUpdate } from "@/lib/supabase";

/**
 * LINK SUPABASE AUTH IDENTITY -> "User" ROW
 * --------------------------------------------------------------
 * Your "User" table predates real accounts: a guest row is
 * silently created for every checkout (see lib/order-store.ts),
 * with no login and no password. This helper runs right after a
 * real sign-in/sign-up and connects the two worlds:
 *
 *   1. Already linked (supabaseAuthId matches)? Return that row.
 *   2. A guest row exists with the same email, never linked yet?
 *      Claim it — this is what surfaces that customer's past
 *      orders under their new account.
 *   3. Otherwise, create a fresh User row for this new customer.
 *
 * Uses the service-role client (lib/supabase.ts), because "User"
 * has zero anon/authenticated RLS policies by design — only
 * server-side code with the service role key can write to it.
 */

interface MinimalAuthUser {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string; name?: string } | null;
}

interface UserRow {
  id: string;
}

export async function linkCustomerAccount(authUser: MinimalAuthUser): Promise<{
  userId: string;
  merged: boolean;
  created: boolean;
}> {
  const displayName =
    authUser.user_metadata?.full_name || authUser.user_metadata?.name || null;

  const alreadyLinked = await dbSelect<UserRow>(
    "User",
    `supabaseAuthId=eq.${authUser.id}&select=id&limit=1`
  );
  if (alreadyLinked.length > 0) {
    return { userId: alreadyLinked[0].id, merged: false, created: false };
  }

  if (authUser.email) {
    const guestRow = await dbSelect<UserRow>(
      "User",
      `email=eq.${encodeURIComponent(authUser.email)}&supabaseAuthId=is.null&select=id&limit=1`
    );
    if (guestRow.length > 0) {
      const updated = await dbUpdate<UserRow>(
        "User",
        `id=eq.${guestRow[0].id}`,
        {
          supabaseAuthId: authUser.id,
          ...(displayName ? { name: displayName } : {}),
        }
      );
      return { userId: updated[0].id, merged: true, created: false };
    }
  }

  const created = await dbInsert<UserRow>("User", [
    {
      id: randomUUID(),
      supabaseAuthId: authUser.id,
      name: displayName,
      email: authUser.email || null,
    },
  ]);
  return { userId: created[0].id, merged: false, created: true };
}
