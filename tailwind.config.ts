import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0a0a0a",
          muted: "#111111",
          elevated: "#191919",
        },
        gold: {
          DEFAULT: "#c9a227",
          light: "#e4bc52",
          dark: "#9a7a1a",
        },
        petal: {
          DEFAULT: "#e8b4b8",
          dark: "#c4909a",
        },
      },
      fontFamily: {
        heading: ["var(--font-righteous)", "cursive"],
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gold-rose": "linear-gradient(135deg, #c9a227 0%, #e8b4b8 100%)",
        "gold-shine":
          "linear-gradient(105deg, #e4bc52 0%, #c9a227 55%, #e8b4b8 100%)",
        "glass-card":
          "linear-gradient(135deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulse_glow: {
          "0%,100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        kawaii_float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s linear infinite",
        "fade-up": "fade-up 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
        pulse_glow: "pulse_glow 2.4s ease-in-out infinite",
        "kawaii-float": "kawaii_float 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
