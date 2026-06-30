import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          void: "#050508",
          deep: "#08091a",
          mid: "#0d1528",
          blue: "#1a3a5c",
          glow: "#2a5a8a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.35em",
      },
    },
  },
  plugins: [],
};

export default config;
