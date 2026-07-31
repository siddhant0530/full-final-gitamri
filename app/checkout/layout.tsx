import type { Metadata } from "next";

// This page is transactional/private and has no unique public content —
// keep it out of search results entirely.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
