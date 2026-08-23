"use client";

import { Leaf, ChefHat, ShieldCheck, Package, Sparkles, Globe2 } from "lucide-react";

const promises = [
  {
    icon: Leaf,
    title: "Fresh Ingredients",
    text: "Handpicked for authentic taste and consistent quality.",
  },
  {
    icon: ChefHat,
    title: "Heritage Recipes",
    text: "Inspired by generations of traditional cooking.",
  },
  {
    icon: ShieldCheck,
    title: "Quality & Hygiene",
    text: "Prepared under modern quality-controlled processes.",
  },
  {
    icon: Package,
    title: "Crafted in Small Batches",
    text: "Made in small batches to protect flavour, freshness and consistency.",
  },
  {
    icon: Globe2,
    title: "Export-Ready Quality",
    text: "Prepared to serve customers across India and around the world.",
  },
  {
    icon: Sparkles,
    title: "No Artificial Colours",
    text: "Naturally coloured and flavoured — nothing artificial, ever.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 md:py-20 bg-pine">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-gold-300 font-semibold tracking-[4px] uppercase">
            The Maaji Promise
          </span>

          <h2 className="mt-4 text-5xl font-black text-ivory">
            Crafted With Tradition.<br />Made With Care.
          </h2>

          <p className="mt-8 text-xl italic text-ivory/80">
            &ldquo;Every recipe we create reflects our commitment to authenticity,
            quality and the warmth of Indian kitchens.&rdquo;
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {promises.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title}
                className="rounded-3xl border border-gold-400/40 bg-ivory/10 backdrop-blur-sm p-8 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition">
                <div className="w-14 h-14 rounded-2xl bg-gold-400/20 flex items-center justify-center">
                  <Icon className="text-gold-300" size={28}/>
                </div>
                <h3 className="mt-6 text-2xl font-bold text-ivory">{item.title}</h3>
                <p className="mt-3 text-ivory/70 leading-7">{item.text}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-20">
          <div className="text-gold-300 text-3xl">★★★★★</div>
          <h3 className="mt-5 text-3xl font-bold text-ivory">
            Every Product Carries the Warmth of Home.
          </h3>
          <p className="mt-3 text-lg italic text-ivory/80">
            Tradition in every bite. Quality in every pack.
          </p>
        </div>
      </div>
    </section>
  );
}
