import { randomUUID } from "crypto";
import { dbInsert, dbSelect, dbUpdate } from "@/lib/supabase";
import { reviews as staticReviews } from "@/data/reviews";

/**
 * REVIEWS STORAGE (Supabase-backed)
 * --------------------------------------------------------------
 * Talks to the "Review" and "ReviewInvite" tables — see
 * supabase/001_reviews_migration.sql for the schema and a one-time
 * seed of the old static data/reviews.ts content.
 *
 * FALLBACK: every public read function here falls back to the old
 * static data/reviews.ts (treated as already-approved) if the
 * Supabase call throws for any reason — e.g. the migration hasn't
 * been run yet, or SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY aren't set
 * in this environment yet. That means the site keeps showing reviews
 * exactly as before at every point during the rollout; nothing goes
 * blank. Once the migration has run, real data always wins over the
 * fallback (Supabase is only skipped on an actual error/misconfig).
 */

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "DELETED";

export interface Review {
  id: string;
  orderId?: string;
  productSlug: string;
  customerName: string;
  rating: number;
  text: string;
  photo?: string;
  status: ReviewStatus;
  homepageFeatured: boolean;
  createdAt: string;
}

interface ReviewRow {
  id: string;
  orderId: string | null;
  productSlug: string;
  customerName: string;
  rating: number;
  text: string;
  photo: string | null;
  status: ReviewStatus;
  homepageFeatured: boolean;
  createdAt: string;
}

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    orderId: row.orderId ?? undefined,
    productSlug: row.productSlug,
    customerName: row.customerName,
    rating: row.rating,
    text: row.text,
    photo: row.photo ?? undefined,
    status: row.status,
    homepageFeatured: row.homepageFeatured,
    createdAt: row.createdAt,
  };
}

function staticFallback(): Review[] {
  return staticReviews.map((r) => ({
    id: `static-${r.id}`,
    productSlug: r.productSlug,
    customerName: r.customerName,
    rating: r.rating,
    text: r.text,
    photo: r.photo,
    status: "APPROVED" as const,
    homepageFeatured: !!r.homepageFeatured,
    createdAt: new Date(0).toISOString(),
  }));
}

/** All approved reviews (public-facing product pages). */
export async function getApprovedReviews(): Promise<Review[]> {
  try {
    const rows = await dbSelect<ReviewRow>(
      "Review",
      "select=*&status=eq.APPROVED&order=createdAt.desc"
    );
    return rows.map(toReview);
  } catch {
    return staticFallback();
  }
}

/** Approved + homepageFeatured=true (homepage testimonials). */
export async function getFeaturedReviews(): Promise<Review[]> {
  const approved = await getApprovedReviews();
  return approved.filter((r) => r.homepageFeatured);
}

/** PENDING/APPROVED/REJECTED reviews for the admin moderation queue — DELETED ones are hidden (soft-deleted, not meant to keep resurfacing). */
export async function getAllReviewsForAdmin(): Promise<Review[]> {
  const rows = await dbSelect<ReviewRow>(
    "Review",
    "select=*&status=neq.DELETED&order=createdAt.desc"
  );
  return rows.map(toReview);
}

export async function setReviewStatus(
  id: string,
  status: ReviewStatus
): Promise<Review | null> {
  const [row] = await dbUpdate<ReviewRow>("Review", `id=eq.${id}`, { status });
  return row ? toReview(row) : null;
}

export async function setReviewFeatured(
  id: string,
  homepageFeatured: boolean
): Promise<Review | null> {
  const [row] = await dbUpdate<ReviewRow>("Review", `id=eq.${id}`, { homepageFeatured });
  return row ? toReview(row) : null;
}

export async function deleteReview(id: string): Promise<void> {
  // Soft-delete: flip to DELETED (its own status, not REJECTED) rather
  // than a hard DELETE — a wrongly-removed review is still recoverable
  // directly in Supabase, but it no longer resurfaces in the Rejected
  // filter of the moderation queue like a real manual rejection would.
  await dbUpdate("Review", `id=eq.${id}`, { status: "DELETED" });
}

// ── Review invites (the post-delivery "please review your order" link) ──

interface InviteRow {
  token: string;
  orderId: string;
  createdAt: string;
  usedAt: string | null;
}

/**
 * Creates a review invite for an order if one doesn't already exist
 * (idempotent — safe to call every time an order's status is set to
 * DELIVERED, even if that happens more than once). Returns the token
 * to build the link from: `${SITE_URL}/review/${token}`.
 */
export async function getOrCreateInviteForOrder(orderId: string): Promise<string> {
  const existing = await dbSelect<InviteRow>("ReviewInvite", `orderId=eq.${orderId}`);
  if (existing.length > 0) return existing[0].token;

  const token = randomUUID().replace(/-/g, "");
  await dbInsert<InviteRow>("ReviewInvite", [
    { token, orderId, createdAt: new Date().toISOString(), usedAt: null },
  ]);
  return token;
}

export async function getInviteByToken(token: string): Promise<InviteRow | null> {
  const rows = await dbSelect<InviteRow>("ReviewInvite", `token=eq.${encodeURIComponent(token)}`);
  return rows[0] ?? null;
}

export async function markInviteUsed(token: string): Promise<void> {
  await dbUpdate("ReviewInvite", `token=eq.${encodeURIComponent(token)}`, {
    usedAt: new Date().toISOString(),
  });
}

interface SubmitReviewInput {
  orderId: string;
  productSlug: string;
  customerName: string;
  rating: number;
  text: string;
  photo?: string;
}

/** Customer-submitted review — always starts PENDING, needs admin approval before it's public. */
export async function submitReview(input: SubmitReviewInput): Promise<Review> {
  const [row] = await dbInsert<ReviewRow>("Review", [
    {
      id: randomUUID(),
      orderId: input.orderId,
      productSlug: input.productSlug,
      customerName: input.customerName,
      rating: input.rating,
      text: input.text,
      photo: input.photo || null,
      status: "PENDING",
      homepageFeatured: false,
      createdAt: new Date().toISOString(),
    },
  ]);
  return toReview(row);
}
