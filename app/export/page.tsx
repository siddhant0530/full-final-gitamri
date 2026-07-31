import type { Metadata } from "next";
import ComingSoonPage from "@/components/layout/ComingSoonPage";

export const metadata: Metadata = {
  title: "Export Enquiries",
  description: "Gitamri Maaji export enquiries for authentic Indian pickles, masalas, and traditional foods.",
  robots: { index: false, follow: false },
};

export default function Export() {
  return (
    <ComingSoonPage
      title="Export Enquiries"
      description="Interested in bringing Gitamri Maaji products to your market? Get in touch and we'll follow up directly."
    />
  );
}
