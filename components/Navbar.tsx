"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ShoppingCart, User, Search } from "lucide-react";
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/cart-context";
import { company } from "@/data/company";
import { categories } from "@/data/categories";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const { totalItems } = useCart();
  const router = useRouter();
const [searchQuery, setSearchQuery] = useState("");

function handleSearch(e: React.FormEvent) {
  e.preventDefault();
  const q = searchQuery.trim();
  router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
}
  const SHOW_CATEGORIES = false; //set to true to bring back the categories menu 

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll(); // run once on mount — browsers can restore a scrolled
    // position on reload without firing a scroll event, which previously
    // left the header stuck in its "transparent" state over non-dark
    // sections until the user scrolled again.
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "All Products" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className={`fixed top-9 inset-x-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-[#123524]/85 backdrop-blur-xl border-b border-amber-400 shadow-xl"
        : "bg-[#123524]/60 backdrop-blur-md"
    }`}>
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
            <Image
              src="/logo.png.jpeg"
              alt="Gitamri Maaji"
              width={1490}
              height={1055}
              priority
              className="h-12 w-auto object-contain"
            />
          </div>
          <div>
            <span className="block text-white font-bold text-xl">
              Gitamri <span className="text-amber-400">Maaji</span>
            </span>
            <p className="text-[11px] tracking-[3px] uppercase text-amber-200">
              Premium Indian Foods
            </p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative text-white hover:text-amber-300 transition after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-amber-400 hover:after:w-full after:transition-all"
            >
              {item.label}
            </Link>
          ))}
          {SHOW_CATEGORIES && (
          <div
            className="relative"
            onMouseEnter={() => setCategoriesOpen(true)}
            onMouseLeave={() => setCategoriesOpen(false)}
          >
            <button className="relative text-white hover:text-amber-300 transition after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-amber-400 hover:after:w-full after:transition-all">
              Categories
            </button>

            {categoriesOpen && (
              <div className="absolute left-1/2 top-full w-[480px] -translate-x-1/2 pt-4">
                <div className="grid grid-cols-2 gap-1 rounded-2xl border border-amber-400/30 bg-[#123524] p-4 shadow-2xl">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 hover:text-amber-300 transition"
                    >
                      <span className="text-lg">{cat.icon}</span>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 rounded-full border border-amber-400 px-5 py-3 text-amber-300 focus-within:bg-white/5"
          >
            <Search size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-36 bg-transparent text-sm text-white placeholder:text-amber-200/60 focus:outline-none caret-white cursor-text"
            />
          </form>

          <Link
            href="/cart"
            aria-label="Cart"
            className="relative rounded-full border border-amber-400 p-3 text-amber-300 hover:bg-amber-400 hover:text-[#123524] transition"
          >
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          <Link
            href="/login"
            aria-label="Login or Sign up"
            className="rounded-full border border-amber-400 p-3 text-amber-300 hover:bg-amber-400 hover:text-[#123524] transition"
          >
            <User size={18} />
          </Link>
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <Link href="/cart" aria-label="Cart" className="relative text-white">
            <ShoppingCart size={26} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>
          <button onClick={() => setOpen(!open)} className="text-white">
            {open ? <X size={30} /> : <Menu size={30} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden bg-[#123524]/95 backdrop-blur-xl border-t border-amber-400">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-4 text-white hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}

          {SHOW_CATEGORIES && (
          <div className="border-t border-white/10 px-6 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
              Categories
            </p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/90 hover:bg-white/10"
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
          )}

          <div className="p-6 space-y-3">
            <a
              href={`https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent("Hi Gitamri Maaji, I'd like to place an order.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-full bg-green-600 py-3 text-center text-white font-semibold"
            >
              Order on WhatsApp
            </a>
            <form
              onSubmit={(e) => {
                handleSearch(e);
                setOpen(false);
              }}
              className="flex items-center gap-2 rounded-full border border-amber-400 px-4 py-3 text-amber-300"
            >
              <Search size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-sm text-white placeholder:text-amber-200/60 focus:outline-none caret-white cursor-text"
              />
            </form>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block rounded-full border border-amber-400 py-3 text-center text-amber-300"
            >
              Login / Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
