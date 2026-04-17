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
        agro: {
          green: "#009A44",
          "green-dark": "#007A36",
          blue: "#003893",
          "blue-dark": "#002A70",
        },
      },
    },
  },
  plugins: [],
};

export default config;
