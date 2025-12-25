import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    colors: {
      ...colors,
      slate: {
        50: '#f1f6fb',
        100: '#dfe9f4',
        200: '#c4d6e8',
        300: '#a9c1d9',
        400: '#8ca8c7',
        500: '#708fb5',
        600: '#59779a',
        700: '#455d79',
        800: '#33475c',
        900: '#243443',
        950: '#172433',
      },
    },
    extend: {
      colors: {
        cold: '#ef4444',
        normal: '#22c55e',
        above: '#f97316',
        critical: '#dc2626',
        brand: {
          DEFAULT: '#6fa8d6',
          dark: '#4c85b5',
          light: '#9ec5e6',
        },
      },
    },
  },
  plugins: [],
};
