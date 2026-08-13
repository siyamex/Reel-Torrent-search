/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          950: '#08090c',
          900: '#0e1015',
          850: '#13161d',
          800: '#181c25',
          700: '#242833',
          600: '#343a48',
          500: '#4a5266',
          400: '#6b7386',
          300: '#98a0b3',
          200: '#c4c9d4',
          100: '#e6e8ed',
        },
        accent: {
          600: '#c2140a',
          500: '#e50914',
          400: '#f6121d',
          300: '#ff4d55',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
