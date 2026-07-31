"use client";

import WhatsAppIcon from "@/components/icons/WhatsAppIcon"
import { company } from "@/data/company";

export default function WhatsAppButton() {
  const message = encodeURIComponent(
    "Hi Gitamri Maaji, I'd like to place an order."
  );

  return (
    <a
      href={`https://wa.me/${company.whatsappNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Order on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-green-600 px-5 py-4 text-white font-semibold shadow-xl hover:bg-green-700 hover:scale-105 transition"
    >
      <WhatsAppIcon size={22} />
      <span className="hidden sm:inline">Order on WhatsApp</span>
    </a>
  );
}
