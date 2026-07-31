import { company } from "@/data/company";

export interface FAQItem {
  question: string;
  answer: string;
}

export const faqs: FAQItem[] = [
  // Ordering & Payment
  {
    question: "How do I place an order?",
    answer:
      "Browse our products, add what you'd like to your cart, and check out directly on the site — or message us on WhatsApp and we'll help you place the order there.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept Cash on Delivery (COD) as well as online payments (cards, UPI, netbanking) through Razorpay.",
  },
  {
    question: "Can I change or cancel my order after placing it?",
    answer:
      `Message us on WhatsApp (${company.whatsappDisplay}) as soon as possible after ordering. If your order hasn't been packed yet, we'll do our best to update or cancel it.`,
  },

  // Shipping & Delivery
  {
    question: "How long does delivery take?",
    answer:
      "Orders are packed and handed to our courier partner, Delhivery, within 1–2 business days. Delivery typically takes another 3–7 business days depending on your location, with remote areas sometimes taking slightly longer.",
  },
  {
    question: "How can I track my order?",
    answer:
      "Once your order ships, you'll receive a tracking ID and tracking link. You can also message us on WhatsApp anytime with your tracking ID for an update.",
  },
  {
    question: "Do you ship across India?",
    answer:
      "Yes, we ship pan-India through Delhivery. Any shipping charges are shown clearly at checkout before you complete your order.",
  },

  // Returns & Refunds
  {
    question: "What's your return policy?",
    answer:
      "Since our products are food items, we don't accept returns for change of mind. But if your order arrives damaged, defective, spoiled, or different from what you ordered, we'll make it right — replacement or refund, at our discretion.",
  },
  {
    question: "How do I report a damaged or incorrect order?",
    answer:
      `Message us on WhatsApp or email ${company.supportEmail} within 24–48 hours of delivery, with your tracking ID and a photo of the item or packaging. This helps us resolve it quickly.`,
  },
  {
    question: "How long do refunds take?",
    answer:
      "Approved refunds for online payments are processed back to your original payment method via Razorpay within 5–7 business days. Cash on Delivery refunds are processed via bank transfer or UPI once you share your details with us.",
  },

  // Products & Ingredients
  {
    question: "Are your products made with artificial colours or preservatives?",
    answer:
      "No — our pickles and foods are naturally coloured and flavoured, with no artificial colours added. We make everything in small batches using traditional recipes.",
  },
  {
    question: "How should I store my order after it arrives?",
    answer:
      "Store in a cool, dry place unless noted otherwise on the product. Exact shelf life varies by product — you'll find it listed on each product's page.",
  },
  {
    question: "Are your products FSSAI certified?",
    answer:
      "Yes, Gitamri Maaji is FSSAI licensed (License No. 11525056000297), and our products are prepared under quality-controlled, hygienic processes.",
  },

  // Contact
  {
    question: "How can I contact you?",
    answer:
      `Reach us anytime on WhatsApp or by email at ${company.supportEmail} — we're happy to help with orders, products, or anything else.`,
  },
];
