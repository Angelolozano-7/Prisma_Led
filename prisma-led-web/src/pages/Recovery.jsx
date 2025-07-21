/**
 * Página de recuperación de contraseña para prisma-led-web.
 *
 * Permite al usuario solicitar una contraseña temporal enviando su correo electrónico.
 * - Muestra un loader mientras se procesa la solicitud.
 * - Informa al usuario si el correo fue enviado exitosamente o si hubo un error.
 * - Redirige automáticamente al login tras el éxito.
 *
 * Detalles clave:
 * - El campo de correo es obligatorio y validado por el navegador.
 * - SweetAlert2 se usa para mostrar el estado de la operación (loader, éxito, error).
 * - El backend debe retornar el campo 'correo_visible' para mostrar el correo parcialmente oculto.
 *
 * Futuro desarrollador:
 * - Puedes mejorar la validación de correo o agregar verificación visual.
 * - El endpoint /auth/recovery debe manejar la lógica de envío y generación de contraseña temporal.
 * - El componente es reutilizable y desacoplado de la lógica de autenticación.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function Recovery() {
  const [correo, setCorreo] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mostrar loader mientras se procesa la solicitud
    Swal.fire({
      title: 'Procesando...',
      text: 'Estamos enviando la contraseña temporal',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await api.post('/auth/recovery', { correo });

      // Cierra el loader
      Swal.close();

      // Mostrar éxito y redirigir
      await Swal.fire({
        title: 'Correo enviado',
        text: `Hemos enviado una contraseña temporal a ${res.data.correo_visible}***`,
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      navigate('/auth/login');

    } catch (err) {
      Swal.close();

      const msg = err.response?.data?.msg || 'Error en la recuperación';

      await Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        <div className="flex gap-4">
          <Link
            to="/auth/login"
            className="w-1/2 text-center text-black py-2 rounded hover:bg-gray-300"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="w-1/2 bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            Restablecer
          </button>
        </div>
      </form>
    </div>
  );
}
