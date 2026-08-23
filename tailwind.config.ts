import type {Config} from
  "tailwindcss";
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme:{
    extend:{
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Gitamri Maaji brand palette v2 (kirana-store repositioning,
        // locked Aug 2026). "gold" replaces the old default Tailwind
        // "amber" everywhere it was used (buttons, borders, hover states,
        // text accents) — same shade positions (50-900) so every existing
        // amber-XXX / gold-XXX usage becomes the new Antique Gold tone with
        // identical lightness relationships, just repainted.
        gold: {
          50: "#F9F6F0",
          100: "#F0E8DA",
          200: "#E0D0B5",
          300: "#CDB386",
          400: "#B28A45", // Antique Gold — the palette's defined main tone
          500: "#9D793D",
          600: "#866834",
          700: "#6E562B",
          800: "#554221",
          900: "#392C16",
        },
        // Terracotta — food/action/CTA accent (secondary buttons, "Add to
        // Cart", offer badges). Unchanged in v2.
        terracotta: {
          50: "#FBEEE9",
          100: "#F5D9CD",
          200: "#E9B29B",
          300: "#D98A67",
          400: "#C06B47",
          500: "#A34F35", // matches the palette's defined main tone
          600: "#86402A",
          700: "#6B3320",
          800: "#4F2617",
          900: "#38190F",
        },
        // Deep Trust Green — primary brand color (navbar, footer, headers,
        // primary buttons). Replaces Deep Olive #263526.
        olive: {
          DEFAULT: "#183F35",
          dark: "#0E2620", // darker gradient partner, replaces old #16211A
        },
        // Warm Ivory — main site background.
        ivory: "#F7F1E5",
        // Pale Sage — secondary/alternating section backgrounds.
        sage: "#E7EDE2",
        // Dark Espresso — near-black warm neutral for text/dark gradient
        // accents and high-contrast promo blocks. Replaces old Cocoa
        // #2A2119.
        cocoa: "#29221D",
        // Soft Green — secondary tone for alternating section backgrounds,
        // hover states on primary, and secondary outline buttons.
        pine: "#245447",
        // Signature Saffron — tiny accents ONLY: badges, tags, festive
        // highlights. Not used for large surfaces or as a general CTA color.
        saffron: "#D88924",
      },
    },
  },
  plugins: [],
};
export default config;
