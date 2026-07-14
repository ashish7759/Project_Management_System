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
        primary: {
          DEFAULT : '#1a5c38',
          dark    : '#145030',
          light   : '#2e7d52',
          bg      : '#f7faf8',
          bg2     : '#eaf4ee',
        },
        accent: {
          DEFAULT : '#c9a84c',
          light   : '#f9f5ec',
          dark    : '#a8863c',
        },
      },
    },
  },
  plugins: [],
};
