/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: Object.fromEntries([
        "primary", "primary-dark", "accent", "background", "surface", "border",
        "text", "muted", "secondary", "white", "success", "warning", "error", "info",
        "success-soft", "warning-soft", "error-soft", "info-soft",
      ].map(name => [name, `rgb(var(--color-${name}-rgb) / <alpha-value>)`])),
      borderRadius: { lg: "12px", xl: "16px", "2xl": "16px" },
      boxShadow: {
        sm: "0 2px 8px rgba(73,47,42,0.06)",
        DEFAULT: "var(--shadow-card)",
        md: "var(--shadow-card)",
        lg: "var(--shadow-hover)",
        xl: "var(--shadow-hover)",
      },
      fontFamily: {
        sans: ["Mali", "cursive"],
        mali: ["Mali", "cursive"],
      },
    },
  },
  plugins: [],
};
