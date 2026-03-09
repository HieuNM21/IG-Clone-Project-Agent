/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ig-primary': '#E1306C',
        'ig-primary-dark': '#C13584',
        'ig-secondary': '#F77737',
        'ig-purple': '#833AB4',
        'ig-blue': '#405DE6',
        'ig-dark': '#121212',
        'ig-darker': '#0a0a0a',
        'ig-card': '#1e1e1e',
        'ig-border': '#2d2d2d',
        'ig-text': '#fafafa',
        'ig-text-secondary': '#a8a8a8',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
