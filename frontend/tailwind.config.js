/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' }, screens: { '2xl': '1320px' } },
    extend: {
      colors: {
        maroon: { 50: '#FCF2F4', 100: '#F7DFE5', 200: '#EDB9C6', 300: '#DC8AA0', 400: '#C2546F', 500: '#A3304F', 600: '#8C1D3E', 700: '#741331', 800: '#5A0E26', 900: '#3D0819' },
        gold: { 50: '#FBF6E9', 100: '#F5EACB', 200: '#ECD79B', 300: '#E2C277', 400: '#D4AE5B', 500: '#C9A24A', 600: '#A9853A', 700: '#86672D', 800: '#614A21', 900: '#3F3016' },
        cream: { DEFAULT: '#FBF6EC', light: '#FFFDF8', dark: '#F3EAD7' },
        peacock: { DEFAULT: '#0E3D33', light: '#145A4B', teal: '#13607A' },
        ink: { DEFAULT: '#2B1B21', soft: '#5C4A50', muted: '#8C7B80' },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(61, 8, 25, 0.18)',
        card: '0 2px 10px -2px rgba(61, 8, 25, 0.08)',
      },
      borderRadius: { arch: '999px 999px 0 0' },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'none' } },
        'slide-in': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'none' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: {
        'fade-up': 'fade-up .7s cubic-bezier(.2,.7,.2,1) both',
        'slide-in': 'slide-in .35s cubic-bezier(.2,.7,.2,1) both',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
};
