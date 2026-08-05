"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { useCart } from "@/lib/cart-context";
import { company } from "@/data/company";

export default function ProductActionBar({
  product,
  variant,
}: {
  product: Product;
  variant?: { weight: string; price: number };
}) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);

  function handleBuyNow() {
    addToCart(product, qty, variant);
    router.push("/checkout");
  }
  function handleAddToCart() {
    addToCart(product, qty, variant);

    toast.success("Added to Cart", {
      description: `${qty} × ${product.name} added successfully.`,
      action: {
        label: "View Cart",
        onClick: () => router.push("/cart"),
      },
    });
  }

  const whatsappHref = `https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent(
    product.whatsappMessage || `Hi, I'm interested in ${product.name}.`
  )}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-zinc-600">Qty:</span>
        <div className="flex items-center rounded-full border border-gray-300">
          <button
            className="px-3 py-1 text-lg"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-8 text-center">{qty}</span>
          <button className="px-3 py-1 text-lg" onClick={() => setQty((q) => q + 1)}>
            +
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          disabled={!product.inStock}
          onClick={handleBuyNow}
          className="rounded bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buy Now
        </button>
        <button
          disabled={!product.inStock}
          onClick={handleAddToCart}
          className="rounded border border-green-700 px-6 py-3 font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to Cart
        </button>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-gray-300 px-6 py-3 font-semibold hover:bg-gray-50"
        >
          Enquire on WhatsApp
        </a>
      </div>
    </div>
  );
}
