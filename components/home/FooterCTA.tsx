import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { company } from "@/data/company";

// Subtle traditional Indian lattice ("jaali") motif — a simple repeating
// diamond-and-dot pattern, kept at low opacity so it reads as texture
// rather than decoration competing with the headline.
const PATTERN_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Cpath d='M22 0 L44 22 L22 44 L0 22 Z' fill='none' stroke='white' stroke-width='1'/%3E%3Ccircle cx='22' cy='22' r='2' fill='white'/%3E%3C/svg%3E";

export default function FooterCTA() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-900 via-orange-800 to-red-900 py-16 md:py-20">
      {/* Subtle traditional lattice texture, sits between the gradient and the content */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: `url("${PATTERN_SVG}")`, backgroundSize: "44px 44px" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 text-center text-white sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold md:text-5xl">
          Ready to Taste the Tradition?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/85 md:text-lg">
          Order your favourites today and experience the authentic, homemade
          taste of Gitamri Maaji — straight from Maaji&apos;s kitchen to your table.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={`https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent("Hi Gitamri Maaji, I'd like to place an order.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-green-600 px-7 py-4 font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-green-700"
          >
            <WhatsAppIcon size={20} /> Order on WhatsApp
          </a>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full border-2 border-amber-400 bg-white/5 px-7 py-4 font-semibold text-amber-300 backdrop-blur transition hover:bg-amber-400 hover:text-[#123524]"
          >
            <ShoppingBag size={20} /> Explore Products
          </Link>
        </div>
      </div>
    </section>
  );
}