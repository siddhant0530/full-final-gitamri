"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Leaf,
  ChefHat,
  Star,
  Truck,
  ShieldCheck,
} from "lucide-react";

export default function HeroBanner() {
  const categories = [
    "Pickles",
    "Spices",
    "Pulses",
    "Dry Fruits",
    "Traditional Foods",
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0B2C20] via-[#143A29] to-[#4A2E12] text-white">
      {/* Background Glow */}
      <div className="absolute -left-32 -top-24 h-96 w-96 rounded-full bg-amber-400/20 blur-[120px]" />
      <div className="absolute right-0 bottom-0 h-[30rem] w-[30rem] rounded-full bg-emerald-400/10 blur-[140px]" />

      <div className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-20 px-6 py-20 lg:grid-cols-2 lg:px-10">

        {/* LEFT CONTENT */}

        <div>

          {/* Badge */}

          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-white/10 px-5 py-2 backdrop-blur">
            <Star
              size={15}
              className="fill-amber-300 text-amber-300"
            />

            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200">
              Gitamri Premium Foods
            </span>
          </div>

          {/* Heading */}

          <h1 className="mt-8 font-display text-5xl font-black leading-[0.9] tracking-tight md:text-7xl">
            Gitamri
            <br />
            <span className="text-amber-300">
              Maaji
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-2xl font-semibold leading-snug text-white md:text-3xl">
            Authentic Homemade Foods
            <span className="mt-2 block text-amber-300">
              Crafted with Tradition. Served with Love.
            </span>
          </p>

          {/* Tagline */}

          {/* Categories */}

          <div className="mt-7 max-w-2xl">

              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
                  Authentic Collection
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-y-4 text-xl font-semibold leading-relaxed text-white md:text-2xl">

                  <span>🌶 Pickles</span>

                  <span className="mx-3 text-amber-400">•</span>

                  <span>🌿 Spices</span>

                  <span className="mx-3 text-amber-400">•</span>

                  <span>🌾 Pulses</span>

                  <span className="mx-3 text-amber-400">•</span>

                  <span>🥜 Dry Fruits</span>

                  <span className="mx-3 text-amber-400">•</span>

                  <span>🍲 Traditional Foods</span>Trusted by Families Across India

              </div>

          </div>

          {/* Description */}

          <p className="mt-6 max-w-xl text-lg leading-9 text-white/80">
            From Maaji&apos;s hands to your table — a full range of authentic Indian
            foods prepared with carefully selected ingredients, traditional recipes
            and uncompromising quality.
          </p>

          {/* Buttons */}

          <div className="mt-7 flex flex-wrap gap-6">

            <Link
              href="/products"
              className="inline-flex items-center gap-4 rounded-full bg-amber-400 px-8 py-4 font-semibold text-[#123524]shadow-xl transition duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
            >
              <ShoppingBag size={20} />
              Explore Our Collection
            </Link>

            <Link
              href="/about"
              className="rounded-full border border-white/20 bg-white/10 px-8 py-4 font-semibold backdrop-blur transition hover:bg-white/20"
            >
              Discover Our Story
            </Link>

          </div>

          {/* Features */}

          <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-4">

            <Feature
              icon={<Leaf size={22} />}
              title="Premium Ingredients"
            />

            <Feature
              icon={<ChefHat size={22} />}
              title="Traditional Recipes"
            />

            <Feature
              icon={<ShieldCheck size={22} />}
              title="Hygienically Prepared"
            />

            <Feature
              icon={<Truck size={22} />}
              title="Pan India Delivery"
            />

          </div>
        </div>

        {/* IMAGE */}

        <div className="relative flex justify-center">
          <div className="absolute h-96 w-96 rounded-full bg-amber-400/20 blur-[120px]" />

         <div className="relative flex justify-center"> {/* Background glow */} <div className="absolute h-[430px] w-[430px] rounded-full bg-amber-400/15 blur-[160px]" /> {/* Secondary glow */} <div className="absolute h-[520px] w-[360px] rounded-[50%] bg-white/10 blur-[90px]" /> <Image src="/hero-maaji.jpeg" alt="Gitamri Maaji" width={520} height={720} priority className="relative rounded-[2rem] object-cover [mask-image:radial-gradient(circle,black_48%,rgba(0,0,0,0.65)_68%,rgba(0,0,0,0.2)_88%,transparent_100%)] [-webkit-mask-image:radial-gradient(circle,black_48%,rgba(0,0,0,0.65)_68%,rgba(0,0,0,0.2)_88%,transparent_100%)]" /> </div>
        </div>
      </div>
    </section>
  );
}

function Feature({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-amber-300">
      <div className="text-amber-300">
        {icon}
      </div>

      <span className="text-sm font-medium">
        {title}
      </span>
    </div>
  );
}