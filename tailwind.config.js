/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wingman': {
          purple: '#3d2852',
          pink: '#c44569',
          orange: '#f39c12',
          teal: '#00a8cc',
          'purple-light': '#4a3463',
          'pink-light': '#d75a86',
          'orange-light': '#f5b041',
          'teal-light': '#3fb8d9',
        }
      }
    },
  },
  plugins: [],
}