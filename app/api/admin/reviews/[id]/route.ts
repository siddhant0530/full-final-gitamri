import { NextRequest, NextResponse } from "next/server";
import { setReviewStatus, setReviewFeatured, deleteReview, ReviewStatus } from "@/lib/reviews-store";

// PATCH /api/admin/reviews/:id -> approve/reject a review, and/or toggle
// whether it's featured on the homepage. Gated by middleware.ts.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as { status?: ReviewStatus; homepageFeatured?: boolean };

  try {
    let review = null;
    if (body.status) {
      if (!["PENDING", "APPROVED", "REJECTED"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      review = await setReviewStatus(id, body.status);
    }
    if (typeof body.homepageFeatured === "boolean") {
      review = await setReviewFeatured(id, body.homepageFeatured);
    }
    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }
    return NextResponse.json({ review });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not update review." }, { status: 500 });
  }
}

// DELETE /api/admin/reviews/:id -> soft-delete (marks REJECTED, recoverable).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deleteReview(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not delete review." }, { status: 500 });
  }
}
