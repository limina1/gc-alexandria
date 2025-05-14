import flowbite from "flowbite/plugin";
import plugin from "tailwindcss/plugin";
/** @type {import('tailwindcss').Config}*/
const config = {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}",
  ],
  theme: {
    extend: {
      colors: {
        highlight: "#f7fafc",
        primary: {
          0: "#f7fafc",
          50: "#edf5f9",
          100: "#d9eaf3",
          200: "#b3d6e7",
          300: "#8dc1da",
          400: "#67adce",
          500: "#4a98c2",
          600: "#3b7a9b",
          700: "#2c5b74",
          800: "#1e3d4d",
          900: "#0f1e27",
          950: "#091620",
          1000: "#060e14",
        },
        success: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        info: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
      },
      listStyleType: {
        "upper-alpha": "upper-alpha", // Uppercase letters
        "lower-alpha": "lower-alpha", // Lowercase letters
      },
    },
  },
  plugins: [
    flowbite(),
    plugin(function ({ addUtilities, matchUtilities }) {
      addUtilities({
        ".content-visibility-auto": {
          "content-visibility": "auto",
        },
        ".contain-size": {
          contain: "size",
        },
      });
      matchUtilities({
        "contain-intrinsic-w-*": (value) => ({
          width: value,
        }),
        "contain-intrinsic-h-*": (value) => ({
          height: value,
        }),
      });
    }),
  ],
  darkMode: "class",
};
module.exports = config;
