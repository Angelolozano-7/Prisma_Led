import { useState } from 'react';
import logo from '../assets/logo_prisma.png';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Registro() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    razon_social: '',
    nit: '',
    correo: '',
    ciudad: '',
    direccion: '',
    telefono: '',
    nombre_contacto: '',
    password: ''
  });

  const [mensaje, setMensaje] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    try {
      const payload = {
        nombre: form.nombre_contacto,
        correo: form.correo,
        telefono: form.telefono,
        password: form.password,
        rol: 'cliente',
        creado_por: 'registro_web',
        razon_social: form.razon_social,
        nit: form.nit,
        ciudad: form.ciudad,
        direccion: form.direccion,
        nombre_contacto: form.nombre_contacto
      };

      await api.post('/auth/register', payload);
      setMensaje('¡Registro exitoso! Redirigiendo...');
      setTimeout(() => navigate('/auth/login'), 2000);
    } catch (err) {
      setMensaje(err.response?.data?.msg || 'Error en el registro');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Columna izquierda */}
      <div className="space-y-4 border border-gray-200 p-4 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Razón Social</label>
          <input name="razon_social" type="text" placeholder="Prisma Wall" className="w-full border border-gray-300 rounded px-3 py-2" onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nit</label>
          <input name="nit" type="text" placeholder="9010955333" className="w-full border border-gray-300 rounded px-3 py-2" onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Correo electrónico</label>
          <input name="correo" type="email" placeholder="correo@empresa.com" className="w-full border border-gray-300 rounded px-3 py-2" onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ciudad</label>
          <input name="ciudad" type="text" placeholder="Cali" className="w-full border border-gray-300 rounded px-3 py-2" onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <input name="direccion" type="text" placeholder="Avenida 4" className="w-full border border-gray-300 rounded px-3 py-2" onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teléfono de contacto</label>
          <input name="telefono" type="text" placeholder="123456789" className="w-full border border-gray-300 rounded px-3 py-2" onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de contacto</label>
          <input name="nombre_contacto" type="text" placeholder="Angelo Lozano" className="w-full border border-gray-300 rounded px-3 py-2" onChange={handleChange} required />
        </div>
      </div>

      {/* Columna derecha */}
      <div className="space-y-4 border border-gray-200 p-4 rounded h-fit flex flex-col items-center">
        <img src={logo} alt="Logo PrismaLED" className="h-16 sm:h-20 mb-2" />
        <div className="w-full space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input name="password" type="password" placeholder="********" className="w-full border border-gray-300 rounded px-3 py-2" onChange={handleChange} required />
          </div>
          <button type="submit" className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
            Registrarse
          </button>
          <button
            type="button"
            onClick={() => navigate('/auth/login')}
            className="w-full bg-violeta-medio text-white py-2 rounded hover:bg-violeta-oscuro transition"
          >
            Regresar
          </button>
          {mensaje && <p className="text-center text-sm text-red-600">{mensaje}</p>}
        </div>
      </div>
    </form>
  );
}
