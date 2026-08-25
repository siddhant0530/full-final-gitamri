import { NextRequest, NextResponse } from "next/server";

/**
 * PINCODE LOOKUP (India Post)
 * --------------------------------------------------------------
 * Proxies India Post's free public pincode API server-side so the
 * checkout form can auto-fill State (and City, if left blank) from a
 * 6-digit pincode without a browser CORS request or exposing any key —
 * this API is free/keyless, but calling it from our own server keeps
 * the client bundle simple and gives us one place to adjust if the
 * upstream API ever changes shape.
 *
 * Response shape kept deliberately minimal: { state, city } | null.
 * This is real post-office data, not the coarse PIN-prefix guess in
 * lib/pincode-state.ts — use this wherever an exact state matters
 * (checkout, invoices, Delhivery), and keep pincode-state.ts only as
 * the fallback for orders placed before this existed.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Pincode must be exactly 6 digits." }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
    if (!res.ok) {
      return NextResponse.json({ error: "Pincode lookup failed." }, { status: 502 });
    }

    const data = await res.json();
    const postOffices = data?.[0]?.PostOffice;
    if (data?.[0]?.Status !== "Success" || !Array.isArray(postOffices) || postOffices.length === 0) {
      return NextResponse.json({ state: null, city: null });
    }

    const first = postOffices[0];
    return NextResponse.json({
      state: first.State || null,
      // District reads closer to a delivery "city" than the specific
      // post-office Name (e.g. "Pune" vs "Bavdhan Budruk") for most
      // urban pincodes — used only to suggest, never to overwrite what
      // the customer already typed.
      city: first.District || null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Pincode lookup failed." }, { status: 502 });
  }
}
