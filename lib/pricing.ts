import { products } from "@/data/products";
import type { OrderItem } from "@/lib/order-store";

/**
 * PRICE VALIDATION — closes a price-tampering gap.
 * --------------------------------------------------------------
 * Previously, /api/orders and /api/payments/razorpay/create-order both
 * trusted the price/subtotal fields sent from the browser. Since those
 * come from client-side cart state, anyone could edit the request (e.g.
 * with devtools or curl) and check out a real order — or a real Razorpay
 * payment — for whatever amount they chose, regardless of the cart's
 * actual contents.
 *
 * Every order now gets its price recomputed from data/products.ts on the
 * server. Only productId, weight (to pick a variant), and quantity are
 * taken from the client; name, price, and subtotal are always derived
 * here and cannot be overridden by the request body.
 */

export interface ClientOrderItem {
  productId: string;
  weight?: string;
  quantity: number;
}

export class PricingError extends Error {}

export function resolveOrderItems(clientItems: ClientOrderItem[]): {
  items: OrderItem[];
  subtotal: number;
} {
  if (!Array.isArray(clientItems) || clientItems.length === 0) {
    throw new PricingError("Cart is empty.");
  }

  const items: OrderItem[] = clientItems.map((ci) => {
    const quantity = Number(ci.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new PricingError(`Invalid quantity for product "${ci.productId}".`);
    }

    const product = products.find((p) => p.id === ci.productId);
    if (!product) {
      throw new PricingError(`Unknown product "${ci.productId}".`);
    }
    if (product.comingSoon || !product.inStock) {
      throw new PricingError(`"${product.name}" is not currently available to order.`);
    }

    let price = product.price;
    if (product.variants && product.variants.length > 0) {
      const variant = ci.weight
        ? product.variants.find((v) => v.weight === ci.weight)
        : product.variants[0];
      if (!variant) {
        throw new PricingError(`Unknown variant "${ci.weight}" for "${product.name}".`);
      }
      price = variant.price;
    }

    return {
      productId: product.id,
      name: product.name,
      price,
      quantity,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { items, subtotal };
}
