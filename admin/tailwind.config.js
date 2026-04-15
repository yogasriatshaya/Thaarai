export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        muted: '#4B5563',
        primary: '#000000',
        'primary-dark': '#000000',
        accent: '#000000',
        charcoal: '#000000',
        gold: { 50: '#fefdf7', 100: '#fdf8e7', 200: '#faefc4', 400: '#edc84a', 500: '#d4a017', 600: '#b8860b', 700: '#9a6f0a' },
        ivory: '#faf8f3',
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Albert Sans"', "system-ui", "sans-serif"],
        display: ['"Playfair Display"', "Georgia", "serif"],
      }
    }
  },
  plugins: []
}
