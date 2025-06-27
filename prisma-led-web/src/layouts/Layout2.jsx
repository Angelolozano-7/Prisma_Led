import { Outlet, Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo_prisma.png';
import { User } from 'lucide-react';
import { useAppData } from '../contexts/AppDataContext';

export default function Layout2() {
  const navigate = useNavigate();
  const { cliente, loading } = useAppData();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth/login');
  };

  const nombre = cliente?.nombre_contacto || cliente?.razon_social || 'usuario';

  return (
    <div className="min-h-screen bg-white text-texto-principal flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-start px-4 sm:px-6 md:px-10 py-6 border-b border-gray-200">
        <Link to="/cliente">
          <img src={logo} alt="Logo" className="h-24 sm:h-28 md:h-32" />
        </Link>

        <div className="flex flex-col items-center relative group">
          <Link to="/perfil/editar" className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-violeta-claro flex items-center justify-center text-white hover:brightness-110 transition">
              <User className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Editar Usuario
            </div>
          </Link>

          {!loading && (
            <>
              <span className="text-sm mt-2 underline">Bienvenido {nombre}</span>
              <button
                onClick={handleLogout}
                className="mt-1 text-xs text-red-600 hover:underline"
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 md:px-10 py-6">
        <div className="w-full max-w-6xl flex justify-center">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
