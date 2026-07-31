import type { Metadata } from "next";

// Order confirmation pages contain a specific customer's order details —
// never index these.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
