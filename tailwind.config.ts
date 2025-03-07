import type { Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e6f7fa",
          100: "#cceff5",
          200: "#99dfeb",
          300: "#66cfe1",
          400: "#33bfd7",
          500: "#2BBDE5",
          600: "#2297b7",
          700: "#1a7189",
          800: "#114c5c",
          900: "#09262e",
        },
        "surface": "#fff" // in School Bud-E: "#f4eecf",
      },
      borderColor: {
        DEFAULT: "#e6e7e7", // in School Bud-E: "rgb(214, 201, 161)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fadeIn 1s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
