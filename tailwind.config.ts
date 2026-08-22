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
        // Gitamri Maaji brand palette (6-color system with saffron accent).
        // "gold" replaces the old default Tailwind "amber" everywhere it was
        // used (buttons, borders, hover states, text accents) — same shade
        // positions (50-900) so every existing amber-XXX usage becomes
        // gold-XXX with identical lightness relationships, just repainted.
        gold: {
          50: "#FDF8F0",
          100: "#FAF0DC",
          200: "#F3E0B8",
          300: "#E9CB8C",
          400: "#C9A35D", // Champagne Gold — the palette's defined main tone
          500: "#B78F45",
          600: "#9C7735",
          700: "#7D5D29",
          800: "#5E451F",
          900: "#453116",
        },
        // Terracotta — food/action/CTA accent (secondary buttons, "Add to
        // Cart", offer badges).
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
        // Deep Olive — primary brand color (navbar, footer, headers,
        // primary buttons). Replaces the old #123524.
        olive: {
          DEFAULT: "#263526",
          dark: "#16211A", // darker gradient partner, replaces old #0B2C20
        },
        // Warm Ivory — main site background.
        ivory: "#F8F5EC",
        // Pale Sage — secondary/alternating section backgrounds.
        sage: "#E7EDE2",
        // Dark Cocoa — near-black neutral for text/dark gradient accents.
        // Replaces the old #4A2E12.
        cocoa: "#2A2119",
        // Signature Saffron — tiny accents ONLY: badges, tags, festive
        // highlights. Not used for large surfaces or as a general CTA color.
        saffron: "#D88924",
      },
    },
  },
  plugins: [],
};
export default config;
