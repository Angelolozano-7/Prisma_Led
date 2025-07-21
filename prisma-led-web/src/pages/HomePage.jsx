/**
 * Página principal (landing) para prisma-led-web.
 *
 * Presenta el mensaje motivacional y el acceso directo al flujo de reserva.
 * - El botón "Reservar" redirige al login para iniciar el proceso de reserva.
 * - El fondo y los colores usan la paleta personalizada definida en Tailwind.
 *
 * Detalles clave:
 * - El diseño es responsivo y centrado verticalmente.
 * - El texto motivacional puede ser personalizado para campañas o mensajes de bienvenida.
 * - El logo está disponible para futuras mejoras visuales (por ejemplo, agregarlo arriba del texto).
 *
 * Futuro desarrollador:
 * - Puedes agregar más secciones, testimonios, imágenes o enlaces según la estrategia de marketing.
 * - El botón de reserva puede ser reemplazado por un formulario rápido o integración con chat.
 * - El componente es simple y sirve como punto de entrada para usuarios nuevos y recurrentes.
 */

import { Link } from 'react-router-dom';
import logo from '../assets/logo_prisma.png';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-fondo-suave text-texto-principal">
      {/* Logo (opcional) */}
      {/* <img src={logo} alt="Logo PrismaLED" className="h-20 mb-6" /> */}

      {/* Texto motivacional */}
      <h1 className="text-2xl md:text-4xl font-bold text-center my-8">
        No dejes para mañana lo que puedes hacer hoy.
      </h1>

      {/* Botón de reserva */}
      <Link to="/auth/login">
        <button className="bg-violeta-medio hover:bg-violeta-oscuro text-white font-semibold py-3 px-6 rounded shadow-md transition">
          Reservar
        </button>
      </Link>
    </div>
  );
}
