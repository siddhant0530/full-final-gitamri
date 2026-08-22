// Slim, always-visible strip above the navbar advertising site-wide
// offers: the tiered prepaid discount (accurate wording — "up to 15%",
// since it's actually 15% on 220g jars / 12% on 500g jars, see
// lib/pricing.ts), free shipping (true for every order today, since no
// shipping fee is charged anywhere in checkout), and the Trial Pack's
// fixed ₹399 price (see data/products.ts, id "pickle-trial-pack" — no
// prepaid discount applies to it, hence calling out its price directly
// rather than a discount percentage).
//
// Scrolls continuously left, like a marquee/news ticker. The content is
// duplicated back-to-back so the loop appears seamless (as soon as the
// first copy scrolls fully off-screen, the second copy is right behind
// it in the same position) — see globals.css for the @keyframes.
const OFFER_TEXT =
  "Get Upto 15% Discount On all Prepaid Orders  •  Free Shipping on Orders Above ₹200  •  Pickle Trial Pack at ₹399  •  Offers automatically applied at checkout";

export default function PromoBanner() {
  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-[#123524] border-b-2 border-amber-400 overflow-hidden py-2">
      <div className="flex whitespace-nowrap animate-marquee">
        <span className="mx-8 text-amber-400 text-xs sm:text-sm font-bold">{OFFER_TEXT}</span>
        <span className="mx-8 text-amber-400 text-xs sm:text-sm font-bold">{OFFER_TEXT}</span>
        <span className="mx-8 text-amber-400 text-xs sm:text-sm font-bold">{OFFER_TEXT}</span>
        <span className="mx-8 text-amber-400 text-xs sm:text-sm font-bold">{OFFER_TEXT}</span>
      </div>
    </div>
  );
}
