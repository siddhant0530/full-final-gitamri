/**
 * DELHIVERY INTEGRATION
 * --------------------------------------------------------------
 * Reads credentials from env vars — see .env.local.example.
 *
 * NOTE ON ACCURACY: Delhivery's exact required fields can vary
 * slightly depending on your seller agreement (Surface vs Express,
 * COD vs Prepaid setup, and how your account was onboarded). The
 * payload below follows their standard "Create Shipment" (cmu/create)
 * format used by most sellers, but if your account rejects a field,
 * check the response `rmk`/`remarks` message and your Delhivery
 * onboarding docs — this is the one integration point worth testing
 * with a real low-value order first.
 */

const BASE_URL = process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com";
const API_TOKEN = process.env.DELHIVERY_API_TOKEN;
const PICKUP_LOCATION = process.env.DELHIVERY_PICKUP_LOCATION;

/**
 * SHIPMENT BOX DIMENSIONS
 * --------------------------------------------------------------
 * Real, measured glass-jar dimensions (L x W x H, cm), provided directly
 * by Siddhant. Delhivery's Create Shipment API takes exactly one set of
 * dimensions per shipment (not per item), so for orders mixing 220g and
 * 500g jars, the larger (500g) box dimensions are used as a conservative
 * approximation. Revisit if mixed-size orders need more precise handling.
 */
const JAR_DIMENSIONS_CM: Record<string, { length: number; width: number; height: number }> = {
  "220g": { length: 7.5, width: 7.5, height: 9 },
  "500g": { length: 8.5, width: 8.5, height: 11 },
};
const DEFAULT_JAR_DIMENSIONS = JAR_DIMENSIONS_CM["220g"];

function shipmentDimensionsForItems(items: { weight?: string }[]) {
  const hasAny500g = items.some((i) => i.weight === "500g");
  if (hasAny500g) return JAR_DIMENSIONS_CM["500g"];
  const hasAny220g = items.some((i) => i.weight === "220g");
  if (hasAny220g) return JAR_DIMENSIONS_CM["220g"];
  return DEFAULT_JAR_DIMENSIONS;
}

interface ShipmentInput {
  orderId: string; // your tracking ID, used as Delhivery's order reference
  name: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  paymentMode: "COD" | "Prepaid";
  amount: number; // amount to collect if COD, else 0
  items: { name: string; quantity: number; weight?: string }[];
}

export interface ShipmentResult {
  success: boolean;
  waybill?: string;
  trackingUrl?: string;
  raw?: unknown;
  error?: string;
}

export async function createDelhiveryShipment(input: ShipmentInput): Promise<ShipmentResult> {
  if (!API_TOKEN || !PICKUP_LOCATION) {
    return {
      success: false,
      error:
        "Delhivery is not configured. Add DELHIVERY_API_TOKEN and DELHIVERY_PICKUP_LOCATION to .env.local",
    };
  }

 const productsDesc = input.items
    .map((i) => `${i.name} x${i.quantity}`)
    .join(", ")
    .slice(0, 500); // Delhivery caps this field's length
  const totalQuantity = input.items.reduce((sum, i) => sum + i.quantity, 0);
  const dims = shipmentDimensionsForItems(input.items);

  const payload = {
    shipments: [
      {
        name: input.name,
        add: input.address,
        city: input.city,
        pin: input.pincode,
        phone: input.phone,
        order: input.orderId,
        payment_mode: input.paymentMode,
        cod_amount: input.paymentMode === "COD" ? input.amount : 0,
        total_amount: input.amount,
        products_desc: productsDesc,
        cod_amount_currency: "INR",
        quantity: totalQuantity,
        // Box dimensions in cm — see JAR_DIMENSIONS_CM above. Field names
        // follow Delhivery's standard Create Shipment schema; if your
        // account rejects these, check the response `rmk`/`remarks` and
        // your Delhivery onboarding docs for the exact field names used.
        shipment_length: dims.length,
        shipment_width: dims.width,
        shipment_height: dims.height,
      },
    ],
    pickup_location: { name: PICKUP_LOCATION },
  };

  try {
    const res = await fetch(`${BASE_URL}/api/cmu/create.json`, {
      method: "POST",
      headers: {
        Authorization: `Token ${API_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `format=json&data=${encodeURIComponent(JSON.stringify(payload))}`,
    });

    const data = await res.json();

    const waybill = data?.packages?.[0]?.waybill;
    if (!res.ok || !waybill) {
      return { success: false, error: JSON.stringify(data), raw: data };
    }

    return {
      success: true,
      waybill,
      trackingUrl: `https://www.delhivery.com/track/package/${waybill}`,
      raw: data,
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function trackDelhiveryShipment(waybill: string) {
  if (!API_TOKEN) {
    throw new Error("DELHIVERY_API_TOKEN is not configured.");
  }
  const res = await fetch(
    `${BASE_URL}/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}`,
    { headers: { Authorization: `Token ${API_TOKEN}` } }
  );
  if (!res.ok) throw new Error("Failed to fetch tracking status from Delhivery.");
  return res.json();
}
