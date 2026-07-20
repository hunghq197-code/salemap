import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102033",
        ocean: "#0f5f8f",
        mint: "#22c58b",
        cloud: "#f5f8fb",
      },
      boxShadow: {
        soft: "0 16px 45px rgba(16, 32, 51, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
