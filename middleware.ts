import { NextRequest, NextResponse } from "next/server";
import { isValidAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

/**
 * SECURITY MIDDLEWARE
 * --------------------------------------------------------------
 * Three things happen here, in order:
 *
 * 1. Admin API protection — GET /api/orders (list all customer orders),
 *    PATCH /api/orders/:id (change order status), POST
 *    /api/delivery/create (create a shipment), and everything under
 *    /api/admin/reviews (moderate customer reviews) all expose or act
 *    on customer/order data. Previously these had NO server-side check
 *    at all — the "admin password" only gated the /admin page's UI, so
 *    anyone who found the URL could curl the API directly and read
 *    every order. This closes that gap: those specific method+path
 *    combinations now require a valid signed session cookie, set by
 *    /api/admin/login after a real password check against the
 *    ADMIN_PASSWORD env var.
 *
 *    Customer-facing routes (POST /api/orders to place an order, GET
 *    /api/orders/:id to look up one's own order by its own unguessable
 *    tracking ID, the Razorpay routes) are deliberately left open.
 *
 * 2. Basic rate limiting on /api/* — an in-memory sliding window per
 *    IP. NOTE: this resets whenever the server/edge instance restarts
 *    and does not share state across multiple instances/regions, so
 *    it's a basic deterrent, not a substitute for a real rate limiter
 *    (e.g. Vercel's built-in protection or an Upstash/Redis-backed one)
 *    if this site expects meaningful traffic or attack attempts.
 *
 * 3. Cache-Control: no-store on pages/APIs that show personal or
 *    session-specific data, so no CDN or shared browser cache ever
 *    serves one visitor's cart, checkout, or admin data to another.
 */

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60; // per IP, per window, for /api/*
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

const NO_STORE_PREFIXES = ["/admin", "/checkout", "/cart", "/api", "/review"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (pathname.startsWith("/api/")) {
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }
  }

  const isProtectedAdminApi =
    (pathname === "/api/orders" && req.method === "GET") ||
    (/^\/api\/orders\/[^/]+$/.test(pathname) && req.method === "PATCH") ||
    (pathname === "/api/delivery/create" && req.method === "POST") ||
    pathname.startsWith("/api/admin/reviews");

  if (isProtectedAdminApi) {
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const valid = secret ? await isValidAdminSessionToken(token, secret) : false;
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const res = NextResponse.next();
  if (NO_STORE_PREFIXES.some((p) => pathname.startsWith(p))) {
    res.headers.set("Cache-Control", "no-store, max-age=0");
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/checkout/:path*", "/cart/:path*", "/api/:path*", "/review/:path*"],
};
