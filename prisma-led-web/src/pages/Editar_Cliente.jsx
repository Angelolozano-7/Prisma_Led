import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo_prisma.png';
import api from '../services/api';
import { useAppData } from '../hooks/useAppData';

export default function Editar_Cliente() {
  const navigate = useNavigate();
  const { cliente, setDatos } = useAppData();
  const [mensaje, setMensaje] = useState('');
  const [form, setForm] = useState({
    razon_social: '',
    nit: '',
    correo: '',
    ciudad: '',
    direccion: '',
    telefono: '',
    nombre_contacto: '',
    usuario: '',
    password: ''
  });

  useEffect(() => {
    if (cliente) {
      setForm({
        razon_social: cliente.razon_social || '',
        nit: cliente.nit || '',
        correo: cliente.correo || '',
        ciudad: cliente.ciudad || '',
        direccion: cliente.direccion || '',
        telefono: cliente.telefono || '',
        nombre_contacto: cliente.nombre_contacto || '',
        usuario: cliente.correo || '',
        password: ''
      });
    }
  }, [cliente]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      razon_social: form.razon_social,
      nit: form.nit,
      correo: form.correo,
      ciudad: form.ciudad,
      direccion: form.direccion,
      telefono: form.telefono,
      nombre_contacto: form.nombre_contacto
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      await api.put(`/cliente`, payload);
      const refreshed = await api.get('/cliente');
      setDatos((prev) => ({ ...prev, cliente: refreshed.data }));
      setMensaje('Datos actualizados correctamente');
      setTimeout(() => navigate('/cliente'), 2000);
    } catch (error) {
      console.error(error);
      setMensaje('Error al actualizar los datos');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Columna izquierda */}
      <div className="space-y-4 border border-gray-200 p-4 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Razón Social</label>
          <input name="razon_social" type="text" value={form.razon_social} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nit</label>
          <input name="nit" type="text" value={form.nit} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Correo electrónico</label>
          <input name="correo" type="email" value={form.correo} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ciudad</label>
          <input name="ciudad" type="text" value={form.ciudad} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <input name="direccion" type="text" value={form.direccion} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teléfono de contacto</label>
          <input name="telefono" type="text" value={form.telefono} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de contacto</label>
          <input name="nombre_contacto" type="text" value={form.nombre_contacto} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
      </div>

      {/* Columna derecha */}
      <div className="space-y-4 border border-gray-200 p-4 rounded h-fit flex flex-col items-center">
        <img src={logo} alt="Logo PrismaLED" className="h-16 sm:h-20 mb-2" />

        <div className="w-full space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Usuario</label>
            <input type="text" value={form.usuario} disabled className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Solo si deseas cambiarla" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
            Modificar
          </button>
          <button
            type="button"
            onClick={() => navigate('/cliente')}
            className="w-full bg-violeta-medio text-white py-2 rounded hover:bg-violeta-oscuro transition"
          >
            Regresar sin cambios
          </button>
        </div>
        {mensaje && <p className="text-sm text-center text-red-600 mt-2">{mensaje}</p>}
      </div>
    </form>
  );
}
  