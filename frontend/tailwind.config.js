/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7C3AED',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        pink: {
          400: '#f472b6',
          500: '#EC4899',
          600: '#db2777',
        },
        surface: {
          light: '#ffffff',
          dark: '#1a1a2e',
        },
        background: {
          light: '#f8f9fa',
          dark: '#0f0f23',
        },
        text: {
          light: '#1f2937',
          'light-secondary': '#6b7280',
          dark: '#f3f4f6',
          'dark-secondary': '#9ca3af',
        },
        border: {
          light: '#e5e7eb',
          dark: '#2d2d44',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7C3AED, #EC4899)',
        'gradient-primary-hover': 'linear-gradient(135deg, #6d28d9, #db2777)',
      },
    },
  },
  plugins: [],
};
