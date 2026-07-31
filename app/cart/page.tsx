"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/formatPrice";
import { Trash2 } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-zinc-900">Your cart is empty</h1>
        <p className="mt-3 text-zinc-600">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-full bg-amber-500 px-6 py-3 font-semibold text-white hover:bg-amber-600"
        >
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-4xl font-bold text-zinc-900">Your Cart</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.weight}`}
            className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row"
          >
            <Image
              src={item.image}
              alt={item.name}
              width={96}
              height={96}
              className="h-24 w-24 rounded-xl object-contain bg-amber-50"
            />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-zinc-900">{item.name}</h3>
              <p className="text-sm text-zinc-500">{item.weight}</p>
              <p className="mt-1 font-bold text-amber-700">{formatPrice(item.price)}</p>
            </div>

            <div className="flex items-center rounded-full border border-gray-300">
              <button
                className="px-3 py-1 text-lg"
                onClick={() => updateQuantity(item.productId, item.weight, item.quantity - 1)}
              >
                −
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                className="px-3 py-1 text-lg"
                onClick={() => updateQuantity(item.productId, item.weight, item.quantity + 1)}
              >
                +
              </button>
            </div>

            <p className="w-24 text-center font-semibold">
              {formatPrice(item.price * item.quantity)}
            </p>

            <button
              aria-label="Remove item"
              onClick={() => removeFromCart(item.productId, item.weight)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-end gap-4">
        <div className="text-2xl font-bold text-zinc-900">
          Subtotal: {formatPrice(subtotal)}
        </div>
        <Link
          href="/checkout"
          className="rounded-full bg-green-700 px-8 py-4 font-semibold text-white hover:bg-green-800"
        >
          Proceed to Checkout
        </Link>
      </div>
    </main>
  );
}
