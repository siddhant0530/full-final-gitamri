import { NextResponse } from "next/server";
import { getAllReviewsForAdmin } from "@/lib/reviews-store";

// GET /api/admin/reviews -> every review (PENDING/APPROVED/REJECTED),
// for the admin moderation queue. Gated by middleware.ts.
export async function GET() {
  try {
    const reviews = await getAllReviewsForAdmin();
    return NextResponse.json({ reviews });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not load reviews." }, { status: 500 });
  }
}
