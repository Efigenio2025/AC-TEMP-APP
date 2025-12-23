/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cold: '#ef4444',
        normal: '#22c55e',
        above: '#f97316',
        critical: '#dc2626',
      },
    },
  },
  plugins: [],
};
