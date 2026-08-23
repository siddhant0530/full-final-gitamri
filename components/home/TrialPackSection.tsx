import Link from "next/link";
import Image from "next/image";
import { products } from "@/data/products";
import { Layers, Package, Heart } from "lucide-react";

// Dedicated conversion section for the Pickle Trial Pack — pulled out of the
// FeaturedProducts grid into its own standalone banner since it's the
// primary new-customer acquisition product (₹399 vs ₹649 MRP for 6 mini
// jars covering the full flavour range). Product data (price, MRP, image,
// slug) is read from data/products.ts so this stays in sync automatically
// if pricing changes — nothing here is hardcoded except the marketing copy.
export default function TrialPackSection() {
  const trialPack = products.find((p) => p.id === "pickle-trial-pack");
  if (!trialPack) return null;

  const variant = trialPack.variants?.[0];
  const price = variant?.price ?? trialPack.price;
  const mrp = variant?.mrp;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-olive-dark via-olive to-cocoa py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
        <div className="relative order-2 md:order-1">
          <div className="relative aspect-square max-w-md mx-auto rounded-3xl overflow-hidden border border-gold-400/30 shadow-2xl">
            <Image
              src={trialPack.image}
              alt={trialPack.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 400px"
            />
          </div>
        </div>

        <div className="order-1 md:order-2 text-center md:text-left">
          <span className="inline-block rounded-full bg-gold-400/15 border border-gold-400/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
            Not Sure Which One You&apos;ll Love?
          </span>

          <h2 className="mt-5 text-4xl md:text-5xl font-black text-ivory leading-tight">
            Meet the Maaji<br />Pickle Trial Box
          </h2>

          <div className="mt-6 space-y-2 text-lg text-ivory/85">
            <p className="flex items-center justify-center md:justify-start gap-2">
              <Layers size={18} className="text-gold-300 shrink-0" />
              6 flavours.
            </p>
            <p className="flex items-center justify-center md:justify-start gap-2">
              <Package size={18} className="text-gold-300 shrink-0" />
              6 little jars.
            </p>
            <p className="flex items-center justify-center md:justify-start gap-2">
              <Heart size={18} className="text-gold-300 shrink-0" />
              One delicious introduction to Maaji.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center md:justify-start gap-3">
            <span className="text-4xl font-bold text-ivory">₹{price}</span>
            {mrp && (
              <span className="text-xl text-ivory/50 line-through">₹{mrp}</span>
            )}
          </div>

          <Link
            href={`/products/${trialPack.slug}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-terracotta-500 px-10 py-4 font-semibold text-ivory hover:bg-terracotta-600 transition text-lg shadow-lg"
          >
            Try Them All
          </Link>
        </div>
      </div>
    </section>
  );
}
