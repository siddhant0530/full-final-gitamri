import type { Metadata } from "next";
import ComingSoonPage from "@/components/layout/ComingSoonPage";

export const metadata: Metadata = {
  title: "Find a Store",
  description: "Find Gitamri Maaji products in stores near you.",
  robots: { index: false, follow: false },
};

export default function Stores() {
  return (
    <ComingSoonPage
      title="Find a Store"
      description="We're expanding into physical retail. In the meantime, order directly online or find us on Amazon and Flipkart."
    />
  );
}
