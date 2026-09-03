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
    /** Captured directly at checkout via pincode lookup (see
     * /api/pincode/[code]), not derived. Optional because orders placed
     * before this existed won't have it — see lib/pincode-state.ts for
     * the approximate fallback used on those older orders. */
    state?: string;
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
  /** Set the first time an invoice PDF is generated for this order, then
   * reused on every subsequent download so the number never changes. */
  invoiceNumber?: string;
  invoiceGeneratedAt?: string;
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
  // Nullable so this keeps working against orders saved before this
  // column existed — see the "state" field on Order["customer"] above.
  state: string | null;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  delhiveryWaybill: string | null;
  delhiveryTrackingUrl: string | null;
  // Nullable so this keeps working against orders saved before invoicing
  // existed — they simply won't have an invoice number until one is
  // generated for them.
  invoiceNumber: string | null;
  invoiceGeneratedAt: string | null;
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
      state: row.state ?? undefined,
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
    invoiceNumber: row.invoiceNumber ?? undefined,
    invoiceGeneratedAt: row.invoiceGeneratedAt ?? undefined,
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

/**
 * Used by the customer account page (app/account/page.tsx) to show a
 * logged-in customer their own order history — userId here is the
 * "User".id row linked to their Supabase Auth account via
 * lib/link-customer-account.ts, not the auth UID itself.
 */
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const orderRows = await dbSelect<OrderRow>(
    "Order",
    `select=*&userId=eq.${encodeURIComponent(userId)}&order=createdAt.desc`
  );
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

/**
 * Used for idempotency by the Razorpay webhook safety net (see
 * app/api/webhooks/razorpay/route.ts) — before self-healing a missing
 * order for a captured payment, it checks whether the normal checkout
 * flow already wrote one for this exact razorpayPaymentId, so a payment
 * never ends up with two order rows.
 */
export async function getOrderByRazorpayPaymentId(razorpayPaymentId: string): Promise<Order | undefined> {
  const orderRows = await dbSelect<OrderRow>(
    "Order",
    `select=*&razorpayPaymentId=eq.${encodeURIComponent(razorpayPaymentId)}`
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

/**
 * Finds the existing guest "User" row for this email (if any) and reuses
 * it, or creates a new one. Without this, saveOrder() would try to INSERT
 * a brand-new User row on every single order — which works exactly once
 * per email, then fails with a 409 conflict the next time that same
 * customer orders again, because User.email has a unique index. (This
 * exact fix — findOrCreateUser() — existed in an earlier build but was
 * lost in a git-restore during a later session; this restores it.)
 */
async function findOrCreateGuestUser(name: string, email: string | null): Promise<string> {
  if (email) {
    const existing = await dbSelect<{ id: string }>(
      "User",
      `select=id&email=eq.${encodeURIComponent(email)}&limit=1`
    );
    if (existing.length > 0) return existing[0].id;
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  try {
    await dbInsert("User", [{ id, name, email: email || null, updatedAt: now }]);
    return id;
  } catch (err) {
    // Rare race: two orders with the same brand-new email created their
    // User rows at almost the same moment, and this one lost the race
    // after already passing the "doesn't exist yet" check above. Rather
    // than fail the whole order, look the row up again and reuse whichever
    // one actually landed.
    if (email) {
      const existing = await dbSelect<{ id: string }>(
        "User",
        `select=id&email=eq.${encodeURIComponent(email)}&limit=1`
      );
      if (existing.length > 0) return existing[0].id;
    }
    throw err;
  }
}

export async function saveOrder(input: SaveOrderInput): Promise<Order> {
  const guestUserId = await findOrCreateGuestUser(input.customer.name, input.customer.email || null);

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
      state: input.customer.state || null,
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

  return toOrder(
    orderRow,
    input.items.map((item) => ({
      id: "",
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      weight: item.weight ?? null,
    }))
  );
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