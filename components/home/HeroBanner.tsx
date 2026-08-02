"use client";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Leaf, ChefHat, Star, Truck } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { company } from "@/data/company";

export default function HeroBanner() {
  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-gradient-to-br from-[#0B2C20] via-[#123524] to-[#4A2E12] text-white">
      {/* Decorative glow orbs, contained by overflow-hidden on the section */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-20 md:px-12 lg:grid-cols-2 lg:py-0">
        <div className="animate-fade-in-up">
          <span className="inline-block rounded-full border border-amber-400/40 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-200 backdrop-blur">
            Gitamri Premium Foods
          </span>

          <h1 className="mt-6 font-display text-5xl font-black leading-tight md:text-7xl">
            Gitamri Maaji
          </h1>

          <p className="mt-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            <Star size={16} className="fill-amber-300 text-amber-300" />
            Trusted by Families Across India
          </p>

          <p className="mt-4 text-xl text-amber-100/90 md:text-2xl">
            Pickles • Masalas • Pulses • Dry Fruits • Traditional Foods
          </p>

          <p className="mt-6 max-w-xl text-base leading-8 text-white/75 md:text-lg">
            From Maaji&apos;s hands to your table — a full range of authentic Indian
            foods prepared with carefully selected ingredients, traditional
            recipes and uncompromising quality.
          </p>

      <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full border-2 border-amber-400 bg-white/5 px-7 py-4 font-semibold text-amber-200 backdrop-blur transition hover:bg-amber-400 hover:text-[#123524]"
            >
              <ShoppingBag size={20} /> Explore Products
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 text-sm text-white/80 md:grid-cols-4">
            <div className="flex items-center gap-2"><Leaf size={18} className="text-amber-300" />Pure ingredients</div>
            <div className="flex items-center gap-2"><ChefHat size={18} className="text-amber-300" />Homemade</div>
            <div className="flex items-center gap-2"><Star size={18} className="text-amber-300" />Premium</div>
            <div className="flex items-center gap-2"><Truck size={18} className="text-amber-300" />Pan India</div>
          </div>
        </div>

      <div className="relative flex justify-center lg:justify-end">
  <div className="absolute h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
  <div
    className="animate-float relative w-full max-w-md"
    style={{
      WebkitMaskImage:
        "radial-gradient(ellipse 65% 70% at center, black 40%, transparent 95%)",
      maskImage:
        "radial-gradient(ellipse 65% 70% at center, black 40%, transparent 95%)",
    }}
  >
    <Image
      src="/hero-maaji.jpg.jpeg"
      alt="Gitamri Maaji with pickle jars"
      width={500}
      height={700}
      priority
      className="w-full h-auto object-cover"
    />
  </div>
</div>
      </div>
    </section>
  );
}