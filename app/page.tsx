import HeroBanner from "@/components/home/HeroBanner";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import ExportSection from "@/components/home/ExportSection";
import Testimonials from "@/components/home/Testimonials";
import FooterCTA from "@/components/home/FooterCTA";
import { getApprovedReviews } from "@/lib/reviews-store";

export default async function Home() {
  const approvedReviews = await getApprovedReviews();
  const featuredReviews = approvedReviews.filter((r) => r.homepageFeatured);
  const averageRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : 0;

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-b from-[#fffdf8] via-white to-[#f8f4ec]">
      <section className="relative">
        <HeroBanner />
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="mb-10 text-center">
          <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
            Premium Collection
          </span>
          <h2 className="mt-5 text-4xl font-bold text-zinc-900 md:text-5xl">
            Authentic Indian Foods, Crafted with Care
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-zinc-600">
            Crafted with traditional recipes and premium ingredients — from our
            signature pickles to masalas, pulses, dry fruits and more.
          </p>
        </div>
      </section>

      <FeaturedProducts />
      <FeaturedCategories />
      <WhyChooseUs />
      <ExportSection />
      <Testimonials
        reviews={featuredReviews}
        totalCount={approvedReviews.length}
        averageRating={averageRating}
      />
      <FooterCTA />
    </main>
  );
}
