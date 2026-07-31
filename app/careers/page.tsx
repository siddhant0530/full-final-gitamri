import type { Metadata } from "next";
import ComingSoonPage from "@/components/layout/ComingSoonPage";

export const metadata: Metadata = {
  title: "Careers",
  description: "Explore career opportunities at Gitamri Maaji.",
  robots: { index: false, follow: false },
};

export default function Careers() {
  return (
    <ComingSoonPage
      title="Careers"
      description="We're not actively listing open roles yet — but if you're interested in joining Gitamri Maaji, reach out and we'll keep you in mind."
    />
  );
}
