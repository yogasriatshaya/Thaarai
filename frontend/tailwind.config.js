/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        muted: '#4B5563',
        primary: '#000000',
        'primary-dark': '#000000',
        accent: '#000000',
        charcoal: '#000000',
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Albert Sans"', "system-ui", "sans-serif"],
        display: ['"Playfair Display"', "Georgia", "serif"],
      },
      borderRadius: {
        "none": "0",
        "sm": "0.125rem",
        "DEFAULT": "0.25rem",
        "xl": "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -2px rgba(0,0,0,0.05)",
        luxury: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
        premium: "0 25px 60px -12px rgba(0,0,0,0.25)",
        "inset-gold": "inset 0 1px 0 rgba(245,158,11,0.3)",
      },
      animation: {
        "fade-up": "fadeUp 0.7s ease forwards",
        "fade-in": "fadeIn 0.5s ease forwards",
        "slow-zoom": "slowZoom 12s ease-in-out infinite alternate",
        "slide-right": "slideRight 0.6s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slowZoom: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
}
