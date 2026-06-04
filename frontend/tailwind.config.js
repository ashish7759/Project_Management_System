/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4f9',
          100: '#dbe5f0',
          200: '#bcd0e4',
          300: '#8fb1d2',
          400: '#5a8cbd',
          500: '#1e3a5f', // Navy Blue primary
          600: '#162b47',
          700: '#102035',
          800: '#0b1625',
          900: '#050a11',
        },
        gold: {
          50: '#fefcf3',
          100: '#fcf6d6',
          200: '#f8eaae',
          300: '#f2d67a',
          400: '#ebbd42',
          500: '#b58900', // Gold accent
          600: '#8e6c00',
          700: '#674f00',
          800: '#413200',
          900: '#1c1500',
        }
      }
    },
  },
  plugins: [],
}
