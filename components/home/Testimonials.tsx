"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Review } from "@/lib/reviews-store";

export default function Testimonials({
  reviews: featured,
  totalCount,
  averageRating,
}: {
  reviews: Review[];
  totalCount: number;
  averageRating: number;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (featured.length === 0) return null;

  return (
    <section className="bg-gradient-to-br from-[#0B2C20] via-[#123524] to-[#4A2E12] py-16 md:py-20 text-white">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="text-center">
          <span className="inline-block rounded-full border border-amber-400/40 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">
            Customer Love
          </span>
          <h2 className="mt-6 font-display text-4xl font-black md:text-5xl">
            What Our Customers Say
          </h2>
          {totalCount > 0 && (
            <p className="mt-4 flex items-center justify-center gap-2 text-amber-200">
              <span className="text-amber-400">
                {"★".repeat(Math.round(averageRating))}
                {"☆".repeat(5 - Math.round(averageRating))}
              </span>
              <span className="text-sm font-semibold">
                {averageRating.toFixed(1)} out of 5 · based on {totalCount} review
                {totalCount !== 1 ? "s" : ""}
              </span>
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-amber-300/20 bg-white/5 p-6 backdrop-blur"
            >
              {review.photo && (
                <button
                  onClick={() => setLightbox(review.photo!)}
                  className="relative mb-4 h-16 w-16 overflow-hidden rounded-full border-2 border-amber-300/40 transition hover:scale-105"
                >
                  <Image
                    src={review.photo}
                    alt={review.customerName}
                    fill
                    className="object-cover"
                  />
                </button>
              )}
              <div className="text-amber-400">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </div>
              <p className="mt-3 text-sm leading-6 text-white/80">
                {review.text}
              </p>
              <p className="mt-4 text-sm font-semibold text-amber-200">
                — {review.customerName}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 px-6 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-400 hover:text-[#123524]"
          >
            See All Reviews →
          </Link>
        </div>
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
        >
          <div className="relative h-[80vh] w-full max-w-2xl">
            <Image src={lightbox} alt="Customer photo" fill className="object-contain" />
          </div>
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 text-3xl text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}