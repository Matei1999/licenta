/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#14b8a6", // Turquoise for accents
        "secondary": "#3b82f6", // Light Blue
        "text-main": "#065f46", // Dark Green for primary text
        "text-subtle": "#0d9488", // Teal for secondary text
        "highlight-bg": "#fef9c3", // Light Yellow for AHI background
        "highlight-text": "#ca8a04", // Dark Yellow for AHI text
        "surface": "#f0fdfa", // Very light mint for surfaces
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
    },
  },
  plugins: [],
}
