/** 
 * Configuración de Tailwind CSS para prisma-led-web.
 *
 * Define los archivos a analizar para generar las clases CSS, 
 * extiende la paleta de colores personalizada y permite la integración de plugins.
 * 
 * Los colores personalizados facilitan la coherencia visual en toda la aplicación.
 */

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