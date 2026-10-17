/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FDFCF7',
          100: '#F9F6F0',
          200: '#F3ECE0',
          300: '#E8DEC8',
          400: '#D6C8AA',
          500: '#C2B18E',
          600: '#A4926F',
          700: '#7E6F52',
          800: '#5A4E39',
          900: '#3A3224',
        },
        burgundy: {
          50: '#FAF0F2',
          100: '#F4DEE3',
          200: '#EABEC7',
          300: '#DC96A5',
          400: '#CA687E',
          500: '#B5415B',
          600: '#9B2A44',
          700: '#801A32',
          800: '#6B172A',
          900: '#541221',
          950: '#330812',
        },
        gold: {
          50: '#FDFBF4',
          100: '#FBF5E4',
          200: '#F6E9C4',
          300: '#EEDA9C',
          400: '#E4C770',
          500: '#D4AF37', // Classic Muted Antique Gold
          600: '#B89228',
          700: '#93701E',
          800: '#75561B',
          900: '#5D4419',
        },
        charcoal: {
          50: '#F6F6F6',
          100: '#E7E7E7',
          200: '#D1D1D1',
          300: '#B0B0B0',
          400: '#888888',
          500: '#6D6D6D',
          600: '#5D5D5D',
          700: '#4F4F4F',
          800: '#454545',
          900: '#262626',
          950: '#171717',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 4px 25px -4px rgba(84, 18, 33, 0.08), 0 2px 10px -2px rgba(84, 18, 33, 0.04)',
        'luxury-hover': '0 10px 35px -5px rgba(84, 18, 33, 0.15), 0 4px 15px -3px rgba(84, 18, 33, 0.08)',
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.25)',
      }
    },
  },
  plugins: [],
}
