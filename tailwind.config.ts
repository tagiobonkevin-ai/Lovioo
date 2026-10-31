import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand sheet: primary pink, accent coral, light pink backgrounds, dark text, light grey surfaces.
        pink: { DEFAULT: "#FF4FB8", soft: "#FFE8F1" },
        coral: "#FF8A5B",
        sunset: "#FFB84D",
        grape: "#A855F7",
        midnight: "#0F2742",
        cream: "#FFF7F1",
        blush: "#FFE9E2",
        peach: "#FFBFA7",
        signal: "#3B82F6",
        lavender: "#E7EAF6",
        line: "#E5E7EB",
        ink: "#111111",
        surface: "#F5F5F7",
      },
      fontFamily: {
        // Brand typeface Manrope for UI and body; headlines in a Plantin-style serif at daydream's sizes (app/fonts.ts).
        sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        poppins: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-newsreader)", "ui-serif", "Georgia", "serif"],
        ui: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        brand: "linear-gradient(135deg, #FF4FB8 0%, #FF8A5B 100%)",
        "brand-soft": "linear-gradient(135deg, #FFE8F1 0%, #FFF1EA 100%)",
        dusk: "linear-gradient(135deg, #A855F7 0%, #FF4FB8 100%)",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(15, 39, 66, 0.18)",
        pop: "0 18px 40px -14px rgba(255, 79, 184, 0.45)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        // Two copies of a row side by side: moving by half its width loops seamlessly.
        drift: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        floaty: "floaty 4s ease-in-out infinite",
        wiggle: "wiggle 1.2s ease-in-out infinite",
        drift: "drift 60s linear infinite",
        "drift-reverse": "drift 70s linear infinite reverse",
      },
    },
  },
  plugins: [],
};

export default config;
