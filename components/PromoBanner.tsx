import { Truck, Sparkles, Tag, Gift } from "lucide-react";

/**
 * Premium site-wide offer marquee above the navbar.
 * Keeps continuous motion, but uses slower pacing, refined spacing,
 * subtle separators, and restrained emphasis for a luxury FMCG feel.
 *
 * Offer text mirrors what's actually implemented elsewhere — keep these
 * in sync if pricing/policy changes:
 *   - Prepaid discount tiers: lib/pricing.ts (PREPAID_DISCOUNT_RATES)
 *   - Free shipping: true for every order today (no shipping fee exists
 *     anywhere in checkout), and every product already exceeds ₹200
 *   - Trial Pack price: data/products.ts, id "pickle-trial-pack"
 *
 * Scroll speed/duration lives in the .animate-marquee keyframe in
 * app/globals.css, not here — slowed to 34s there to match this
 * component's calmer, more deliberate pacing.
 */

function OfferRow() {
  return (
    <div className="flex items-center shrink-0">
      <span className="flex items-center gap-2.5 mx-8 sm:mx-12 text-[10.5px] sm:text-[13px] text-gold-50/95 tracking-[0.045em]">
        <Truck
          size={14}
          strokeWidth={1.6}
          className="shrink-0 text-gold-400"
        />
        <span>
          Free Shipping on Orders Above{" "}
          <span className="font-semibold text-gold-300">₹200</span>
        </span>
      </span>

      <span className="text-[7px] text-gold-400/45">◆</span>

      <span className="flex items-center gap-2.5 mx-8 sm:mx-12 text-[10.5px] sm:text-[13px] text-gold-50/95 tracking-[0.045em]">
        <Sparkles
          size={14}
          strokeWidth={1.6}
          className="shrink-0 text-gold-400"
        />
        <span>
          Pickle Trial Pack at{" "}
          <span className="font-semibold text-gold-300">₹399</span>
        </span>
      </span>

      <span className="text-[7px] text-gold-400/45">◆</span>

      <span className="flex items-center gap-2.5 mx-8 sm:mx-12 text-[10.5px] sm:text-[13px] text-gold-50/95 tracking-[0.045em]">
        <Tag
          size={14}
          strokeWidth={1.6}
          className="shrink-0 text-gold-400"
        />
        <span>Offers automatically applied at checkout</span>
      </span>

      <span className="text-[7px] text-gold-400/45">◆</span>

      <span className="flex items-center gap-2.5 mx-8 sm:mx-12 text-[10.5px] sm:text-[13px] text-gold-50/95 tracking-[0.045em]">
        <Gift
          size={14}
          strokeWidth={1.6}
          className="shrink-0 text-gold-400"
        />
        <span>
          Get Upto{" "}
          <span className="font-semibold text-gold-300">
            15% Discount
          </span>{" "}
          On all Prepaid Orders
        </span>
      </span>

      <span className="text-[7px] text-gold-400/45">◆</span>
    </div>
  );
}

export default function PromoBanner() {
  return (
    <div className="fixed top-0 inset-x-0 z-[60] overflow-hidden bg-[#263526] border-b border-gold-400/70">
      <div className="flex min-h-[34px] sm:min-h-[38px] items-center whitespace-nowrap">
        <div className="flex shrink-0 animate-marquee will-change-transform">
          <OfferRow />
          <OfferRow />
          <OfferRow />
          <OfferRow />
        </div>
      </div>
    </div>
  );
}
