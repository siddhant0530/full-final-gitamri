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

interface ShipmentInput {
  orderId: string; // your tracking ID, used as Delhivery's order reference
  name: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  paymentMode: "COD" | "Prepaid";
  amount: number; // amount to collect if COD, else 0
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
        products_desc: "Homemade pickles / food products",
        cod_amount_currency: "INR",
        quantity: 1,
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
