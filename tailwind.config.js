/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
        },
        accent: {
          400: "var(--color-accent-400)",
          500: "var(--color-accent-500)",
        },
        surface: {
          400: "var(--color-surface-400)",
          500: "var(--color-surface-500)",
          600: "var(--color-surface-600)",
          700: "var(--color-surface-700)",
          800: "var(--color-surface-800)",
          900: "var(--color-surface-900)",
        },
        cs: {
          success: "var(--color-success)",
          warning: "var(--color-warning)",
          error:   "var(--color-error)",
          info:    "var(--color-info)",
        },
      },
      fontFamily: {
        sans: ["Inter", "Hind", "sans-serif"],
        hindi: ["Hind", "Inter", "sans-serif"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        card:   "var(--shadow-card)",
        glow:   "var(--shadow-glow)",
        accent: "var(--shadow-accent)",
      },
      animation: {
        "fade-in":  "fade-in 250ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "slide-up": "slide-up 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "ping-in":  "ping-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        shimmer:    "shimmer 1.5s infinite",
        spin:       "spin 0.7s linear infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "ping-in": {
          "0%":   { opacity: "0", transform: "scale(0.85) translateY(16px)" },
          "60%":  { opacity: "1", transform: "scale(1.03) translateY(-4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        shimmer: {
          "0%":   { "background-position": "-200% 0" },
          "100%": { "background-position":  "200% 0" },
        },
      },
      maxWidth: {
        mobile: "480px",
      },
    },
  },
  plugins: [],
};
