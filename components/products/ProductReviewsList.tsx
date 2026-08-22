"use client";

import { useState } from "react";
import type { Review } from "@/lib/reviews-store";
import ProductReviewCard from "./ProductReviewCard";

export default function ProductReviewsList({ reviews }: { reviews: Review[] }) {
  const [showAll, setShowAll] = useState(false);

  if (reviews.length === 0) return null;

  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold text-zinc-900">Customer Reviews</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {visibleReviews.map((review) => (
          <ProductReviewCard key={review.id} review={review} />
        ))}
      </div>
      {reviews.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-sm font-medium text-gold-600 hover:underline"
        >
          {showAll ? "Show Less" : `More Reviews (${reviews.length - 3})`}
        </button>
      )}
    </div>
  );
}
