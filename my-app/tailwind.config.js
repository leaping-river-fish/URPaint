/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.no-arrows': {
          '-moz-appearance': 'textfield', 
        },
        '.no-arrows::-webkit-inner-spin-button': {
          '-webkit-appearance': 'none',
          margin: '0',
        },
        '.no-arrows::-webkit-outer-spin-button': {
          '-webkit-appearance': 'none',
          margin: '0',
        },
      });
    },
  ],
}