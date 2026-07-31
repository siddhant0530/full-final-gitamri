import type { Metadata } from "next";
import ComingSoonPage from "@/components/layout/ComingSoonPage";

export const metadata: Metadata = {
  title: "Media & Press",
  description: "News, press, and media coverage of Gitamri Maaji.",
  robots: { index: false, follow: false },
};

export default function Media() {
  return (
    <ComingSoonPage
      title="Media & Press"
      description="Press coverage and media resources will be featured here as they come in."
    />
  );
}
