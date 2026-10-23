/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wellness: {
          50: '#F6FBF7',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A', // Primary green
          700: '#15803D',
          800: '#166534',
          900: '#0F5132', // Dark green headings
          950: '#052E16',
          mint: '#34D399',
          border: '#E3EFE6',
          surface: '#F6FBF7'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(15, 81, 50, 0.05), 0 1px 3px -1px rgba(15, 81, 50, 0.03)',
        'soft-lg': '0 10px 25px -5px rgba(15, 81, 50, 0.08), 0 8px 10px -6px rgba(15, 81, 50, 0.04)',
      }
    },
  },
  plugins: [],
}
