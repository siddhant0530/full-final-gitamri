import type { Metadata } from "next";
import ComingSoonPage from "@/components/layout/ComingSoonPage";

export const metadata: Metadata = {
  title: "Recipes",
  description: "Traditional recipes and serving ideas using Gitamri Maaji pickles, masalas, and pulses.",
  robots: { index: false, follow: false },
};

export default function Recipes() {
  return (
    <ComingSoonPage
      title="Recipes"
      description="We're putting together serving ideas and traditional recipes using our products — check back soon."
    />
  );
}
