import Image from "next/image";
import { Review } from "@/lib/reviews-store";

export default function ProductReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-800">{review.customerName}</span>
        <span className="text-amber-500 text-sm">
          {"★".repeat(review.rating)}
          {"☆".repeat(5 - review.rating)}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600">{review.text}</p>
      {review.photo && (
        <div className="relative mt-3 h-40 w-40 overflow-hidden rounded-lg">
          <Image src={review.photo} alt={review.customerName} fill className="object-cover" />
        </div>
      )}
    </div>
  );
}