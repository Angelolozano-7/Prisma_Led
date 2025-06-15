import { Link } from 'react-router-dom';
import logo from '../assets/logo_prisma.png';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-fondo-suave text-texto-principal">
      

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
