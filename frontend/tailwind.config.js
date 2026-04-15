/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF8C42',
        primaryLight: '#FFB380',
        primaryDark: '#E67E22',
        accent: '#FF8C42',
        light: '#F8F9FA',
        lightGray: '#F5F6F7',
      },
    },
  },
  plugins: [],
};
