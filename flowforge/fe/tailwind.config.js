/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f6fc',
          100: '#e2eaf7',
          200: '#c4d5ef',
          300: '#98b6e1',
          400: '#658ecd',
          500: '#3f6ab5',
          600: '#2f5399',
          700: '#28437c',
          800: '#243968',
          900: '#223258',
        },
        surface: '#0f1420',
        panel: '#161c2c',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0,0,0,0.06), 0 1px 3px 0 rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
