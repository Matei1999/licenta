/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // New medical theme with cool tones and high accessibility
        primary: {
          DEFAULT: '#0891b2',   // cyan-600 - primary interactive
          hover: '#0e7490',     // cyan-700
          active: '#155e75',    // cyan-800
          light: '#cffafe',     // cyan-50
        },
        secondary: {
          DEFAULT: '#475569',   // slate-600
          hover: '#334155',     // slate-700
        },
        // Semantic colors matching design tokens
        bg: {
          primary: '#f5f7fa',
          elevated: '#ffffff',
          surface: '#f8fafc',
          'surface-light': '#e2e8f0',
          accent: '#ebf4ff',
        },
        text: {
          primary: '#1e293b',
          secondary: '#475569',
          tertiary: '#64748b',
          inverse: '#ffffff',
          link: '#2563eb',
        },
        border: {
          light: '#cbd5e1',
          medium: '#94a3b8',
          focus: '#3b82f6',
          error: '#dc2626',
        },
        // Alert colors
        error: {
          bg: '#fef2f2',
          text: '#991b1b',
          border: '#dc2626',
        },
        warning: {
          bg: '#fffbeb',
          text: '#92400e',
          border: '#f59e0b',
        },
        success: {
          bg: '#f0fdf4',
          text: '#166534',
          border: '#16a34a',
        },
        info: {
          bg: '#eff6ff',
          text: '#1e40af',
          border: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Inter', 'sans-serif']
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}

