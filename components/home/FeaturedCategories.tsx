import Link from "next/link";
import { categories } from "@/data/categories";
import { products } from "@/data/products";

export default function FeaturedCategories() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sage via-white to-sage py-16 md:py-20">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#B78F45,transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <span className="inline-block rounded-full bg-gold-100 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-gold-700">
            Our Collection
          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-zinc-900 md:text-5xl">
            A Premium Range, Built for Every Kitchen
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-600">
            From pickles to pulses, masalas to dry fruits — every category reflects
            authentic Indian heritage, premium ingredients, and handcrafted quality
            that families have trusted for generations.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => {
            const count = products.filter(
              (p) => p.category === category.name && !p.comingSoon
            ).length;
            const comingSoon = count === 0;

            return (
              <div
                key={category.slug}
                style={{ animationDelay: `${index * 80}ms` }}
                className="group relative animate-fade-in-up rounded-3xl border border-gold-100 bg-white/80 p-8 backdrop-blur-md shadow-xl transition-all duration-500 hover:-translate-y-3 hover:border-gold-400 hover:shadow-2xl"
              >
                {comingSoon && (
                  <span className="absolute right-5 top-5 rounded-full bg-zinc-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Coming Soon
                  </span>
                )}

                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-100 to-gold-200 text-5xl transition-transform duration-500 group-hover:scale-110">
                  {category.icon}
                </div>

                <h3 className="text-xl font-bold text-zinc-900">{category.name}</h3>

                <p className="mt-4 text-sm leading-6 text-zinc-600">
                  {category.description}
                </p>

                {comingSoon ? (
                  <span className="mt-8 inline-block rounded-full bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-500">
                    Launching Soon
                  </span>
                ) : (
                  <Link
                    href={`/category/${category.slug}`}
                    className="mt-8 inline-block rounded-full bg-terracotta-500 px-6 py-3 text-sm font-semibold text-ivory transition-all duration-300 hover:scale-105 hover:bg-terracotta-600 hover:shadow-lg"
                  >
                    Explore ({count}) →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
