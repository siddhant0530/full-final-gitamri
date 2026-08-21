// Slim, always-visible strip above the navbar advertising the two
// site-wide incentives: the tiered prepaid discount (accurate wording —
// "up to 15%", since it's actually 15% on 220g jars / 12% on 500g jars,
// see lib/pricing.ts) and free shipping (true for every order today,
// since no shipping fee is charged anywhere in checkout).
export default function PromoBanner() {
  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-white text-red-600 text-center text-[10px] sm:text-xs font-semibold py-1.5 px-2 leading-tight border-b border-red-100">
      <p>Get Upto 15% Discount On all Prepaid Orders</p>
      <p>Free Shipping on Orders Above ₹200</p>
    </div>
  );
}
