import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pink: { DEFAULT: "#FF2D9A", soft: "#FFD6EC" },
        coral: "#FF6B4A",
        sunset: "#FFB84D",
        grape: "#A855F7",
        midnight: "#0F2742",
        cream: "#FFF7F1",
        blush: "#FFE9E2",
        peach: "#FFBFA7",
        signal: "#3B82F6",
        lavender: "#E7EAF6",
        line: "#E5E7EB",
        // Front page (daydream-style): near-black text on white, the way luxury retail sets type.
        ink: "#141414",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        ui: ["var(--font-ui)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        brand: "linear-gradient(135deg, #FF2D9A 0%, #FF6B4A 55%, #FFB84D 100%)",
        "brand-soft": "linear-gradient(135deg, #FFE3F1 0%, #FFE9E2 50%, #FFF3DE 100%)",
        dusk: "linear-gradient(135deg, #A855F7 0%, #FF2D9A 100%)",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(15, 39, 66, 0.18)",
        pop: "0 18px 40px -14px rgba(255, 45, 154, 0.45)",
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
