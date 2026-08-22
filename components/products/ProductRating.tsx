import type { Review } from "@/lib/reviews-store";

export default function ProductRating({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gold-500">
        {"★".repeat(Math.round(avg))}
        {"☆".repeat(5 - Math.round(avg))}
      </span>
      <span className="font-medium text-zinc-800">{avg.toFixed(1)}</span>
      <span className="text-zinc-500">
        ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
      </span>
    </div>
  );
}
