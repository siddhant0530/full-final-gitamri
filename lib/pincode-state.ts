/**
 * PINCODE → STATE (approximate)
 * --------------------------------------------------------------
 * The checkout form only collects city + pincode, not state directly.
 * India's PIN codes are assigned in state-aligned blocks by the first
 * two digits, so we can derive a reasonable state estimate from that
 * prefix for analytics purposes (e.g. "which states are we selling in").
 *
 * This is an approximation, not authoritative — a handful of prefixes
 * sit on state borders or cover union territories bundled with a
 * neighboring state. It's accurate enough to spot regional trends
 * (e.g. "60% of orders are from Maharashtra + Karnataka") but shouldn't
 * be used for anything requiring exact state-level correctness (tax,
 * compliance, etc). If exact state ever matters, capture it as its own
 * field at checkout instead of deriving it here.
 */

const PREFIX_TO_STATE: Record<string, string> = {
  "11": "Delhi",
  "12": "Haryana",
  "13": "Haryana",
  "14": "Punjab",
  "15": "Punjab",
  "16": "Punjab",
  "17": "Himachal Pradesh",
  "18": "Jammu & Kashmir",
  "19": "Jammu & Kashmir",
  "20": "Uttar Pradesh",
  "21": "Uttar Pradesh",
  "22": "Uttar Pradesh",
  "23": "Uttar Pradesh",
  "24": "Uttarakhand",
  "25": "Uttar Pradesh",
  "26": "Uttarakhand",
  "27": "Uttar Pradesh",
  "28": "Uttar Pradesh",
  "30": "Rajasthan",
  "31": "Rajasthan",
  "32": "Rajasthan",
  "33": "Rajasthan",
  "34": "Rajasthan",
  "36": "Gujarat",
  "37": "Gujarat",
  "38": "Gujarat",
  "39": "Gujarat",
  "40": "Maharashtra",
  "41": "Maharashtra",
  "42": "Maharashtra",
  "43": "Maharashtra",
  "44": "Maharashtra",
  "45": "Madhya Pradesh",
  "46": "Madhya Pradesh",
  "47": "Madhya Pradesh",
  "48": "Madhya Pradesh",
  "49": "Chhattisgarh",
  "50": "Telangana",
  "51": "Andhra Pradesh",
  "52": "Andhra Pradesh",
  "53": "Andhra Pradesh",
  "56": "Karnataka",
  "57": "Karnataka",
  "58": "Karnataka",
  "59": "Karnataka",
  "60": "Tamil Nadu",
  "61": "Tamil Nadu",
  "62": "Tamil Nadu",
  "63": "Tamil Nadu",
  "64": "Tamil Nadu",
  "67": "Kerala",
  "68": "Kerala",
  "69": "Kerala",
  "70": "West Bengal",
  "71": "West Bengal",
  "72": "West Bengal",
  "73": "West Bengal",
  "74": "West Bengal",
  "75": "Odisha",
  "76": "Odisha",
  "77": "Odisha",
  "78": "Assam",
  "79": "North East India",
  "80": "Bihar",
  "81": "Bihar",
  "82": "Bihar",
  "83": "Jharkhand",
  "84": "Bihar",
  "85": "Jharkhand",
};

export function stateFromPincode(pincode?: string): string {
  const digits = (pincode ?? "").replace(/\D/g, "");
  const prefix = digits.slice(0, 2);
  return PREFIX_TO_STATE[prefix] ?? "Unknown";
}
