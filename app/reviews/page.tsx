import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getApprovedReviews } from "@/lib/reviews-store";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Customer Reviews",
  description: "Real reviews from Gitamri Maaji customers across our range of pickles and traditional foods.",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const reviews = await getApprovedReviews();
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const productBySlug = new Map(products.map((p) => [p.slug, p]));

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <span className="inline-block rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
          Customer Love
        </span>
        <h1 className="mt-5 text-4xl font-black text-[#123524] md:text-5xl">
          Customer Reviews
        </h1>
        {reviews.length > 0 && (
          <p className="mt-4 flex items-center justify-center gap-2 text-zinc-700">
            <span className="text-amber-500">
              {"★".repeat(Math.round(averageRating))}
              {"☆".repeat(5 - Math.round(averageRating))}
            </span>
            <span className="text-sm font-semibold">
              {averageRating.toFixed(1)} out of 5 · based on {reviews.length} review
              {reviews.length !== 1 ? "s" : ""}
            </span>
          </p>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-12 text-center text-zinc-500">No reviews yet — check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {reviews.map((review) => {
            const product = productBySlug.get(review.productSlug);
            return (
              <div key={review.id} className="rounded-2xl border border-amber-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#123524]">{review.customerName}</span>
                  <span className="text-amber-500 text-sm">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{review.text}</p>
                {review.photo && (
                  <div className="relative mt-4 h-40 w-40 overflow-hidden rounded-lg">
                    <Image src={review.photo} alt={review.customerName} fill className="object-cover" />
                  </div>
                )}
                {product && (
                  <Link
                    href={`/products/${product.slug}`}
                    className="mt-4 inline-block text-sm font-semibold text-amber-700 hover:underline"
                  >
                    On {product.name} →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
