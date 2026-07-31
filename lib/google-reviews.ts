interface GoogleRatingResult {
  rating: number;
  reviewCount: number;
  mapsUrl: string;
}

const GOOGLE_MAPS_REVIEWS_URL = "https://maps.app.goo.gl/XYfjjXS3rCyL4D5Y8";

/**
 * Fetches the live rating + review count from Google Places API (New).
 *
 * Requires GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID in .env.local — see
 * .env.local.example for exactly how to get both. Returns null (not a
 * thrown error) if either is missing or the request fails, so the footer
 * badge just quietly doesn't render rather than breaking the page — same
 * fallback pattern used everywhere else in this project (reviews, orders).
 *
 * Cached for 24 hours via Next's fetch revalidate — a business rating
 * doesn't need to be more real-time than that, and Places API bills per
 * request, so this keeps cost near-zero regardless of site traffic.
 */
export async function getGoogleRating(): Promise<GoogleRatingResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=rating,userRatingCount,googleMapsUri`,
      {
        headers: { "X-Goog-Api-Key": apiKey },
        next: { revalidate: 60 * 60 * 24 }, // 24 hours
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (typeof data.rating !== "number" || typeof data.userRatingCount !== "number") {
      return null;
    }

    return {
      rating: data.rating,
      reviewCount: data.userRatingCount,
      mapsUrl: data.googleMapsUri || GOOGLE_MAPS_REVIEWS_URL,
    };
  } catch {
    return null;
  }
}
