"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Product } from "@/types/product";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  weight: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: { weight: string; price: number }) => void;
  removeFromCart: (productId: string, weight?: string) => void;
  updateQuantity: (productId: string, weight: string | undefined, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "gitamri-maaji-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load cart from localStorage on first mount (client only)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist cart whenever it changes
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  // A product with multiple sizes (e.g. 220g and 500g) needs each size to be
  // its own line item, so the cart matches on productId + weight together
  // rather than productId alone.
  function addToCart(
    product: Product,
    quantity: number = 1,
    variant?: { weight: string; price: number }
  ) {
    const weight = variant?.weight ?? product.weight;
    const price = variant?.price ?? product.price;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id && i.weight === weight);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.weight === weight
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          price,
          weight,
          quantity,
        },
      ];
    });
  }

  // `weight` is optional for backward compatibility with callers that only
  // ever deal with a product's single default size; omitting it removes
  // every line for that productId.
  function removeFromCart(productId: string, weight?: string) {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && (weight === undefined || i.weight === weight)))
    );
  }

  function updateQuantity(productId: string, weight: string | undefined, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId, weight);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && (weight === undefined || i.weight === weight)
          ? { ...i, quantity }
          : i
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, totalItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
