/**
 * SUPABASE CLIENT (lightweight, no SDK)
 * --------------------------------------------------------------
 * Talks directly to Supabase's auto-generated REST API (PostgREST)
 * using fetch, so there's no extra npm package to install. Uses the
 * Service Role key, which bypasses Row Level Security — this file
 * must only ever be imported from server-side code (API routes,
 * server components), never from a "use client" file.
 */


function headers(extra?: Record<string, string>) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local"
    );
  }
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function restUrl(table: string, query: string = "") {
return `${process.env.SUPABASE_URL}/rest/v1/${table}${query}`;
}

export async function dbInsert<T>(table: string, rows: Record<string, unknown>[]): Promise<T[]> {
  const res = await fetch(restUrl(table), {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`Supabase insert into ${table} failed: ${await res.text()}`);
  }
  return res.json();
}

export async function dbSelect<T>(table: string, query: string): Promise<T[]> {
  const res = await fetch(restUrl(table, `?${query}`), {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Supabase select from ${table} failed: ${await res.text()}`);
  }
  return res.json();
}

export async function dbUpdate<T>(
  table: string,
  query: string,
  fields: Record<string, unknown>
): Promise<T[]> {
  const res = await fetch(restUrl(table, `?${query}`), {
    method: "PATCH",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    throw new Error(`Supabase update on ${table} failed: ${await res.text()}`);
  }
  return res.json();
}
export async function dbUpsert<T>(
  table: string,
  rows: Record<string, unknown>[],
  conflictColumn: string
): Promise<T[]> {
  const res = await fetch(restUrl(table, `?on_conflict=${conflictColumn}`), {
    method: "POST",
    headers: headers({
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`Supabase upsert into ${table} failed: ${await res.text()}`);
  }
  return res.json();
}