export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: { 50: '#fefdf7', 100: '#fdf8e7', 200: '#faefc4', 400: '#edc84a', 500: '#d4a017', 600: '#b8860b', 700: '#9a6f0a' },
        ivory: '#faf8f3',
        charcoal: '#1a1a1a'
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Jost"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
