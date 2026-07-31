import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

// POST /api/admin/login  { password } -> sets an httpOnly session cookie
// The real admin password lives only in the ADMIN_PASSWORD env var — it
// is never sent to or stored in the browser bundle, unlike the previous
// client-side-only check.
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET || adminPassword;

  if (!adminPassword || !secret) {
    return NextResponse.json(
      { error: "Admin login is not configured. Set ADMIN_PASSWORD in .env.local." },
      { status: 500 }
    );
  }

  if (typeof password !== "string" || password !== adminPassword) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await createAdminSessionToken(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours, matches token expiry
  });
  return res;
}
