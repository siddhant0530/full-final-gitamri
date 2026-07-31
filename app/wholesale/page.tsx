import type { Metadata } from "next";
import ComingSoonPage from "@/components/layout/ComingSoonPage";

export const metadata: Metadata = {
  title: "Wholesale",
  description: "Wholesale and bulk ordering of Gitamri Maaji pickles, masalas, pulses, and traditional foods.",
  robots: { index: false, follow: false },
};

export default function Wholesale() {
  return (
    <ComingSoonPage
      title="Wholesale"
      description="Interested in bulk or wholesale orders? Reach out and we'll walk you through it directly."
    />
  );
}
