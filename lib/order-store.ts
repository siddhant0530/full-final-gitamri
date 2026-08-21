import { randomUUID } from "crypto";
import { dbInsert, dbSelect, dbUpdate } from "@/lib/supabase";
import { products as catalog } from "@/data/products";

/**
 * ORDER STORAGE (Supabase-backed)
 * --------------------------------------------------------------
 * Talks to your existing "Order", "OrderItem", and "User" tables.
 *
 * Your Order table requires a non-null userId, and this project
 * uses guest checkout (no login required to buy). To satisfy that
 * constraint without forcing customers to create an account, a
 * lightweight guest "User" row is created for every order using
 * their checkout details (name + email). This does NOT create a
 * login-capable account (no password is set) -- it only exists to
 * satisfy the database relationship.
 *
 * OrderItem doesn't store a product name column, so item names are
 * looked up from this project's local product catalog (data/products.ts)
 * by productId when reading orders back out.
 */

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  /**
   * Jar size ("220g" / "500g"). Used to compute the weight-tiered prepaid
   * discount at checkout, and later to pick the right shipment box
   * dimensions when creating the Delhivery shipment — see lib/delhivery.ts.
   * Persisted to the OrderItem table's "weight" column.
   */
  weight?: string;
}

// Matches the "OrderStatus" Postgres enum exactly.
export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface Order {
  id: string;
  trackingId: string;
  createdAt: string;
  status: OrderStatus;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };
  items: OrderItem[];
  subtotal: number;
  /** 12% prepaid discount amount — 0 for COD orders. */
  discount: number;
  /** Actual amount owed/charged: subtotal - discount. */
  total: number;
  paymentMethod: "COD" | "ONLINE";
  paymentStatus: "Pending" | "Paid";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  delhiveryWaybill?: string;
  delhiveryTrackingUrl?: string;
}

function productName(productId: string): string {
  return catalog.find((p) => p.id === productId)?.name ?? productId;
}

interface OrderRow {
  id: string;
  userId: string;
  // NOTE: "total" here is the actual amount owed/charged — i.e. subtotal
  // minus the prepaid discount (0 for COD). "discount" is nullable so
  // this keeps working against older rows saved before this column
  // existed (treated as 0 / no discount).
  total: number;
  discount: number | null;
  status: OrderStatus;
  createdAt: string;
  trackingId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  address: string;
  city: string;
  pincode: string;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  delhiveryWaybill: string | null;
  delhiveryTrackingUrl: string | null;
}

interface OrderItemRow {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  // Nullable so this keeps working against older rows saved before this
  // column existed (weight will just be undefined on those items).
  weight: string | null;
}

function toOrder(row: OrderRow, itemRows: OrderItemRow[]): Order {
  return {
    id: row.id,
    trackingId: row.trackingId,
    createdAt: row.createdAt,
    status: row.status,
    customer: {
      name: row.customerName,
      email: row.customerEmail || "",
      phone: row.customerPhone,
      address: row.address,
      city: row.city,
      pincode: row.pincode,
    },
    items: itemRows
      .filter((i) => i.orderId === row.id)
      .map((i) => ({
        productId: i.productId,
        name: productName(i.productId),
        price: i.price,
        quantity: i.quantity,
        weight: i.weight ?? undefined,
      })),
    // row.total stores the actual amount charged (post-discount); the
    // pre-discount subtotal is derived by adding the discount back.
    subtotal: row.total + (row.discount ?? 0),
    discount: row.discount ?? 0,
    total: row.total,
    paymentMethod: row.paymentMethod === "ONLINE" ? "ONLINE" : "COD",
    paymentStatus: row.paymentStatus === "Paid" ? "Paid" : "Pending",
    razorpayOrderId: row.razorpayOrderId ?? undefined,
    razorpayPaymentId: row.razorpayPaymentId ?? undefined,
    delhiveryWaybill: row.delhiveryWaybill ?? undefined,
    delhiveryTrackingUrl: row.delhiveryTrackingUrl ?? undefined,
  };
}

export function generateTrackingId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GM-${stamp}-${rand}`;
}

export async function getOrders(): Promise<Order[]> {
  const orderRows = await dbSelect<OrderRow>("Order", "select=*&order=createdAt.desc");
  if (orderRows.length === 0) return [];

  const ids = orderRows.map((o) => o.id);
  const itemRows = await dbSelect<OrderItemRow>(
    "OrderItem",
    `select=*&orderId=in.(${ids.join(",")})`
  );

  return orderRows.map((row) => toOrder(row, itemRows));
}

export async function getOrderByTrackingId(trackingId: string): Promise<Order | undefined> {
  const orderRows = await dbSelect<OrderRow>(
    "Order",
    `select=*&trackingId=eq.${encodeURIComponent(trackingId)}`
  );
  if (orderRows.length === 0) return undefined;

  const itemRows = await dbSelect<OrderItemRow>(
    "OrderItem",
    `select=*&orderId=eq.${orderRows[0].id}`
  );

  return toOrder(orderRows[0], itemRows);
}

interface SaveOrderInput {
  customer: Order["customer"];
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: "COD" | "ONLINE";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

export async function saveOrder(input: SaveOrderInput): Promise<Order> {
  const guestUserId = randomUUID();
  await dbInsert("User", [
    {
      id: guestUserId,
      name: input.customer.name,
      email: input.customer.email || null,
    },
  ]);

  const trackingId = generateTrackingId();
  const orderId = randomUUID();
  const paymentStatus = input.paymentMethod === "ONLINE" && input.razorpayPaymentId ? "Paid" : "Pending";

  const [orderRow] = await dbInsert<OrderRow>("Order", [
    {
      id: orderId,
      userId: guestUserId,
      total: input.total,
      discount: input.discount,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      trackingId,
      customerName: input.customer.name,
      customerEmail: input.customer.email || null,
      customerPhone: input.customer.phone,
      address: input.customer.address,
      city: input.customer.city,
      pincode: input.customer.pincode,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      razorpayOrderId: input.razorpayOrderId || null,
      razorpayPaymentId: input.razorpayPaymentId || null,
    },
  ]);

  await dbInsert(
    "OrderItem",
    input.items.map((item) => ({
      id: randomUUID(),
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      weight: item.weight ?? null,
    }))
  );

  // TODO: Send real confirmation email here using a provider like
  // SendGrid / Resend / Postmark, e.g.:
  //   await sendEmail({ to: input.customer.email, subject: `Order Confirmed - ${trackingId}`, ... });
  console.log(
    `[MOCK EMAIL] Order confirmation would be sent to ${input.customer.email} with tracking ID ${trackingId}.`
  );

  return toOrder(orderRow, input.items.map((item) => ({ ...item, id: "", orderId })));
}

export async function updateOrderStatus(
  trackingId: string,
  status: OrderStatus
): Promise<Order | null> {
  const [row] = await dbUpdate<OrderRow>(
    "Order",
    `trackingId=eq.${encodeURIComponent(trackingId)}`,
    { status }
  );
  if (!row) return null;
  const itemRows = await dbSelect<OrderItemRow>("OrderItem", `select=*&orderId=eq.${row.id}`);
  return toOrder(row, itemRows);
}

export async function patchOrder(
  trackingId: string,
  fields: Partial<Pick<Order, "delhiveryWaybill" | "delhiveryTrackingUrl" | "status">>
): Promise<Order | null> {
  const [row] = await dbUpdate<OrderRow>(
    "Order",
    `trackingId=eq.${encodeURIComponent(trackingId)}`,
    fields
  );
  if (!row) return null;
  const itemRows = await dbSelect<OrderItemRow>("OrderItem", `select=*&orderId=eq.${row.id}`);
  return toOrder(row, itemRows);
}
