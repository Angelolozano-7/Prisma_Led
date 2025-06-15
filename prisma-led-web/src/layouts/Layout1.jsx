import { Link, Outlet } from 'react-router-dom';
import logo from '../assets/logo_prisma.png';

export default function Layout1() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-fondo-suave px-4">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-start gap-y-6 min-h-[60vh] max-h-[90vh] overflow-auto">

        {/* Logo responsivo */}
        <Link to="/">
          <img
            src={logo}
            alt="Logo PrismaLED"
            className="h-12 sm:h-14 md:h-16 lg:h-20"
          />
        </Link>

        {/* Contenido dinámico */}
        <div className="w-full flex-1 flex items-center justify-center">
          <Outlet />
        </div>

      </div>
    </div>
  );
}
