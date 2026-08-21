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

/**
 * PREPAID DISCOUNT
 * --------------------------------------------------------------
 * Applied only to orders paid online via Razorpay (never COD).
 * The rate is tiered by weight — 220g jars get 15% off, 500g jars get
 * 12% off. Computed here, per line item, server-side from the
 * recomputed items list — for the same reason prices are recomputed
 * above: paymentMethod (and weight) is client-supplied, so the discount
 * itself must be derived and applied on the server, never trusted as a
 * pre-calculated number from the browser.
 */
export const PREPAID_DISCOUNT_RATES: Record<string, number> = {
  "220g": 0.15,
  "500g": 0.12,
};
// Used for any item whose weight isn't 220g/500g (e.g. non-pickle
// products without weight-based variants).
export const DEFAULT_PREPAID_DISCOUNT_RATE = 0.12;

export function prepaidDiscountRateForWeight(weight?: string): number {
  if (weight && weight in PREPAID_DISCOUNT_RATES) return PREPAID_DISCOUNT_RATES[weight];
  return DEFAULT_PREPAID_DISCOUNT_RATE;
}

export function calculateOrderTotal(
  items: OrderItem[],
  subtotal: number,
  paymentMethod: "COD" | "ONLINE"
): { discount: number; total: number } {
  if (paymentMethod !== "ONLINE") {
    return { discount: 0, total: subtotal };
  }
  // Rounded per line item (not on the aggregate subtotal) so a mixed
  // 220g + 500g cart applies each jar's correct rate rather than one
  // blended rate across the whole order.
  const discount = items.reduce(
    (sum, item) => sum + Math.round(item.price * item.quantity * prepaidDiscountRateForWeight(item.weight)),
    0
  );
  return { discount, total: subtotal - discount };
}

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
    let weight = product.weight;
    if (product.variants && product.variants.length > 0) {
      const variant = ci.weight
        ? product.variants.find((v) => v.weight === ci.weight)
        : product.variants[0];
      if (!variant) {
        throw new PricingError(`Unknown variant "${ci.weight}" for "${product.name}".`);
      }
      price = variant.price;
      weight = variant.weight;
    }

    return {
      productId: product.id,
      name: product.name,
      price,
      quantity,
      weight,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { items, subtotal };
}
