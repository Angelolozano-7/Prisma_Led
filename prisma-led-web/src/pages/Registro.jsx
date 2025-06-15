import logo from '../assets/logo_prisma.png';
import { useNavigate } from 'react-router-dom';

export default function Registro() {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Columna izquierda */}
      <div className="space-y-4 border border-gray-200 p-4 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Razón Social</label>
          <input type="text" placeholder="Prisma Wall" className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nit</label>
          <input type="text" placeholder="9010955333" className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Correo electrónico</label>
          <input type="email" placeholder="angelo@hotmail.com" className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ciudad</label>
          <input type="text" placeholder="Cali" className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <input type="text" placeholder="Avenida4" className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teléfono de contacto</label>
          <input type="text" placeholder="123456789" className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de contacto</label>
          <input type="text" placeholder="andres" className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
      </div>

        {/* Columna derecha con logo y datos de acceso */}
      <div className="space-y-4 border border-gray-200 p-4 rounded h-fit flex flex-col items-center">
        <img src={logo} alt="Logo PrismaLED" className="h-16 sm:h-20 mb-2" />

        <div className="w-full space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Usuario</label>
            <input type="text" placeholder="Value" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input type="password" placeholder="Value" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <button className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
            Registrarse
          </button>
          <button
            onClick={() => navigate('/auth/login')}
            className="w-full bg-violeta-medio text-white py-2 rounded hover:bg-violeta-oscuro transition"
          >
            Regresar
          </button>
        </div>
      </div>
    </div>
  );
}
