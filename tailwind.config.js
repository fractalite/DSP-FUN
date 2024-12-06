/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",  // Changed to match our flat structure
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}