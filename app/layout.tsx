import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Playfair_Display, Manrope } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site-config";
import { company } from "@/data/company";
import { Toaster } from "sonner";

// Premium serif for headings + a clean grotesque for body text —
// self-hosted by Next.js at build time (no extra network calls at runtime).
const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800", "900"],
});
const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_TITLE = "Gitamri Maaji | Gitamri Premium Foods";
const SITE_DESCRIPTION =
  "Pickles, masalas, pulses, dry fruits and traditional foods — authentic Indian foods from Gitamri Maaji.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Gitamri Maaji",
  },
  description: SITE_DESCRIPTION,
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Gitamri Maaji",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Gitamri Maaji — Authentic Indian Pickles & Traditional Foods" }],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#123524",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Gitamri Maaji",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png.jpeg`,
  email: company.email,
  telephone: company.phoneDisplay,
  sameAs: [company.facebookUrl, company.instagramUrl],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <JsonLd data={organizationJsonLd} />
        <CartProvider>
          <Navbar />
          <div className="pt-[88px]">{children}</div>
          <Footer />
          <WhatsAppButton />

          <Toaster
            position="bottom-center"
            richColors
            duration={2500}
            closeButton
          />
        </CartProvider>
      </body>
    </html>
  );
}
