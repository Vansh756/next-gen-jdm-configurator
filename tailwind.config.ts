import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#050505",
        neon: {
          blue: "#00f0ff",
          pink: "#ff2f8f",
          violet: "#7d5cff",
          lime: "#a3ff12",
        },
      },
      boxShadow: {
        neon: "0 0 24px rgba(0,240,255,0.35), 0 0 64px rgba(125,92,255,0.2)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        telemetry: ["var(--font-telemetry)", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
      letterSpacing: {
        telemetry: "0.16em",
      },
    },
  },
  plugins: [],
};

export default config;
