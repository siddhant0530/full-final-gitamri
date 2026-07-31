import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Phone, Mail, Instagram, Facebook } from "lucide-react";
import { company } from "@/data/company";
import { categories } from "@/data/categories";
import { getGoogleRating } from "@/lib/google-reviews";

const STORE_LOGO_DIMS: Record<string, { width: number; height: number }> = {
  Amazon: { width: 588, height: 393 },
  Flipkart: { width: 553, height: 553 },
};

export default async function Footer() {
  const googleRating = await getGoogleRating();
  const stores = [
    { name: "Amazon", logo: "/amazon.png.jpeg", href: "https://www.amazon.in/stores/Gitamri/page/AB347498-8B7C-4C76-AE46-4A0C865BD5EE?lp_context_asin=B0GDMWJCTR&lp_context_query=gitamri+maaji+pickles&store_ref=bl_ast_dp_brandlogo_sto&ref_=cm_sw_r_ud_ast_store_QM3FXDW6DV4TTNEB9DE9" },
    { name: "Flipkart", logo: "/flipkart.png.jpeg", href: "https://www.flipkart.com/gitamri-maaji-premium-mango-pickle-traditional-indian-aam-ka-achar-no-sirka/p/itm77409b38184f1?pid=PCKHKCN7DHEQDMFF&lid=LSTPCKHKCN7DHEQDMFFFJ5USJ&marketplace=FLIPKART" },
  ];

  return (
    <footer className="bg-gradient-to-b from-[#FFF8EA] via-[#F5F8F2] to-[#0D3B2A]">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <p className="uppercase tracking-[5px] text-amber-700 font-semibold">Available On</p>
          <h2 className="text-4xl font-bold text-[#123524] mt-3">
            India&apos;s Leading Online Marketplaces
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12 max-w-2xl mx-auto">
          {stores.map((s) => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
              className="rounded-3xl border border-amber-300 bg-white/90 p-8 shadow-lg hover:-translate-y-2 transition">
              <Image
                src={s.logo}
                alt={s.name}
                width={STORE_LOGO_DIMS[s.name].width}
                height={STORE_LOGO_DIMS[s.name].height}
                className="h-20 mx-auto object-contain"
              />
              <h3 className="text-center text-2xl font-bold mt-6">{s.name}</h3>
            </a>
          ))}
        </div>

        <div className="text-center mt-20 space-y-6">
          <a href={`https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent("Hi Gitamri Maaji, I'd like to place an order.")}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-4 text-white font-semibold">
            <Phone size={20}/> Order on WhatsApp
          </a>
          <div>
            <Link href="/products"
              className="inline-flex items-center gap-2 rounded-full border-2 border-amber-500 px-8 py-4 font-semibold text-[#123524]">
              <ShoppingBag size={20}/> Explore Our Collection
            </Link>
          </div>
        </div>

        <div className="text-center mt-20">
          <h2 className="text-5xl font-black text-[#123524] leading-tight">
            Once Tasted.<br/>Forever Remembered.
          </h2>
          <p className="max-w-3xl mx-auto mt-8 text-gray-700">
            Crafted from carefully selected <b>PURE</b> ingredients, inspired by timeless recipes and made to bring the warmth of home to every table.
          </p>
        </div>
      </div>

      <div className="bg-[#0B2C20] text-white">
        <div className="max-w-7xl mx-auto grid gap-8 px-6 py-14 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <h3 className="text-2xl font-bold text-amber-400">Gitamri Maaji</h3>
            <p className="mt-4 text-gray-300">
              Premium Indian foods — pickles, masalas, pulses, dry fruits and
              traditional essentials, made with authentic taste.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-amber-400 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/products">Products</Link></li>
              <li><Link href="/cart">Cart</Link></li>
              <li><Link href="/login">Login / Sign Up</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-amber-400 mb-4">Categories</h4>
            <ul className="space-y-2 text-gray-300">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/category/${cat.slug}`} className="hover:text-amber-300">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-amber-400 mb-4">Policies</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/privacy" className="hover:text-amber-300">Privacy Policy</Link></li>
              <li><Link href="/shipping" className="hover:text-amber-300">Shipping Policy</Link></li>
              <li><Link href="/returns" className="hover:text-amber-300">Returns Policy</Link></li>
              <li><Link href="/terms" className="hover:text-amber-300">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-amber-400 mb-4">Contact</h4>
            <p className="flex gap-2 items-center">
              <Mail size={16}/>
              <a href={`mailto:${company.supportEmail}`} className="hover:text-amber-300">{company.supportEmail}</a>
            </p>
            <p className="flex gap-2 items-center mt-3">
              <Phone size={16}/>
              <a href={`https://wa.me/${company.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-amber-300">
                {company.whatsappDisplay} (WhatsApp)
              </a>
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-amber-400 mb-4">Follow Us</h4>
            {googleRating && (
              <a
                href={googleRating.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.43.34-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z" />
                </svg>
                <span className="text-amber-500 text-sm">
                  {"★".repeat(Math.round(googleRating.rating))}
                  {"☆".repeat(5 - Math.round(googleRating.rating))}
                </span>
                <span className="text-xs font-semibold text-zinc-800">
                  {googleRating.rating.toFixed(1)} · {googleRating.reviewCount} review
                  {googleRating.reviewCount !== 1 ? "s" : ""}
                </span>
              </a>
            )}
            <div className="flex gap-4">
              <a
                href={company.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Gitamri Maaji on Instagram"
                className="text-white/80 transition hover:text-amber-300"
              >
                <Instagram />
              </a>
              <a
                href={company.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Gitamri Maaji on Facebook"
                className="text-white/80 transition hover:text-amber-300"
              >
                <Facebook />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-5">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
            <p className="text-center text-gray-400 sm:text-left">
              &copy; {new Date().getFullYear()} Gitamri Maaji. All rights reserved. &middot; FSSAI lic. No. 11525056000297 &middot; GSTIN: 27AAMCG0530G1ZT
            </p>
            <div className="flex items-center gap-4">
              {stores.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Shop on ${s.name}`}
                  className="rounded-md bg-white/90 px-2 py-1 transition hover:bg-white"
                >
                  <Image src={s.logo} alt={s.name} width={STORE_LOGO_DIMS[s.name].width} height={STORE_LOGO_DIMS[s.name].height} className="h-5 w-auto object-contain" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
