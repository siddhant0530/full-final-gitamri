import Image from "next/image";
import Link from "next/link";
import { products } from "@/data/products";
import { formatPrice } from "@/lib/formatPrice";

// Homepage spotlight for the newest launch. To feature a different product
// later, change SPOTLIGHT_PRODUCT_ID. Renders nothing if that product is
// missing, coming soon or out of stock — so it can never show a dead link.
const SPOTLIGHT_PRODUCT_ID = "makhana-pure";

export default function NewArrivalSpotlight() {
  const product = products.find((p) => p.id === SPOTLIGHT_PRODUCT_ID);
  if (!product || product.comingSoon || !product.inStock || !product.image) return null;

  const variant = product.variants?.[0];
  const price = variant?.price ?? product.price;
  const mrp = variant?.mrp;
  const weight = variant?.weight ?? product.weight;
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      <Link
        href={`/products/${product.slug}`}
        className="group grid min-w-0 items-center gap-6 overflow-hidden rounded-3xl bg-[#183F35] p-4 text-white shadow-lg sm:p-8 md:grid-cols-2 md:gap-10"
      >
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-white md:max-w-md">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 90vw, 448px"
            className="object-contain transition duration-300 group-hover:scale-105"
          />
        </div>

        <div className="min-w-0 text-center md:text-left">
          <span className="inline-block animate-pulse rounded-full bg-gold-400 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#183F35]">
            ✨ New Arrival
          </span>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">{product.name}</h2>
          {product.shortDescription && (
            <p className="mt-3 text-base text-white/80 md:text-lg">{product.shortDescription}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <span className="text-3xl font-bold text-gold-300">{formatPrice(price)}</span>
            {weight && <span className="text-white/70">/ {weight}</span>}
            {off > 0 && mrp && (
              <>
                <span className="text-lg text-white/50 line-through">{formatPrice(mrp)}</span>
                <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  {off}% OFF · Save {formatPrice(mrp - price)}
                </span>
              </>
            )}
          </div>

          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-400 px-7 py-3 font-semibold text-[#183F35] transition group-hover:bg-gold-300">
            Shop Now →
          </span>
        </div>
      </Link>
    </section>
  );
}
