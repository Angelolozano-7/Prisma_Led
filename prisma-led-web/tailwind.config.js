/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'violeta-oscuro': '#9747FF',
        'violeta-medio': '#B883DA',
        'violeta-claro': '#CAA2FF',
        'texto-principal': '#000000',
        'texto-secundario': '#B5B5B5',
        'fondo-suave': '#F6EFFF',
      },
    },
  },
  plugins: [],
}