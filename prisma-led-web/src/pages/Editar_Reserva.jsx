/**
 * Página para editar prereservas en prisma-led-web.
 *
 * Permite al usuario seleccionar una prereserva existente y navegar a la previsualización para editarla.
 * - Muestra un dropdown con las prereservas disponibles del usuario autenticado.
 * - Al seleccionar y buscar, carga el detalle de la prereserva y navega a la página de previsualización.
 * - Incluye manejo de errores y loader mientras se cargan los datos.
 *
 * Detalles clave:
 * - El dropdown se cierra automáticamente al hacer clic fuera.
 * - El botón "Buscar" está deshabilitado hasta que se seleccione una prereserva.
 * - El botón "Cancelar" regresa al dashboard del cliente.
 * - Los mensajes de error se muestran de forma clara y se ocultan automáticamente.
 *
 * Futuro desarrollador:
 * - Puedes agregar filtros, búsqueda por número o fecha, o mostrar más detalles en el dropdown.
 * - El manejo de navegación y carga de detalles está desacoplado y centralizado.
 * - El componente usa hooks y contexto para mantener la lógica desacoplada y reutilizable.
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getUserFromToken } from '../services/decodeToken';
import VideoLoader from '../components/VideoLoader';

export default function EditarReserva() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [selectedReserva, setSelectedReserva] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const fetchReservas = async () => {
      const user = getUserFromToken();
      if (!user?.id) {
        setMensaje('No se pudo identificar al usuario.');
        setLoading(false);
        return;
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const res = await api.get('/prereservas/cliente');
        setReservas(res.data || []);
      } catch (error) {
        setMensaje('No se pudieron cargar tus prereservas');
      } finally {
        setLoading(false);
      }
    };

    fetchReservas();

    // Cerrar dropdown si se hace clic fuera
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBuscar = async () => {
    if (!selectedReserva) {
      setMensaje('Debes seleccionar una prereserva');
      return;
    }

    try {
      const res = await api.get(`/prereservas/detalle/${selectedReserva.id_prereserva}`);
      const { id_reserva, fecha_creacion, fecha_inicio, duracion, categoria, pantallas } = res.data;

      navigate('/cliente/pre-visualizacion', {
        state: {
          id_reserva,
          fecha_creacion,
          fecha_inicio,
          duracion,
          categoria,
          pantallas,
          disponibilidad: {},
        }
      });

    } catch (error) {
      console.error('Error al cargar detalles de la prereserva:', error);
      setMensaje('No se pudo cargar el detalle de la prereserva.');
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  if (loading) return <VideoLoader />;

  return (
    <div className="flex flex-col items-center justify-center w-full h-[70vh] px-4">
      <div className="bg-white border border-gray-300 rounded p-6 max-w-md w-full text-center space-y-4">
        <label className="block text-sm font-semibold mb-1">
          Seleccione número de prereserva
        </label>

        <div className="relative w-full" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-left flex justify-between items-center"
          >
            {selectedReserva?.id_prereserva || 'Seleccione una prereserva'}
            <svg
              className="w-4 h-4 ml-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <ul className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-gray-300 rounded shadow text-sm">
              {reservas.map((r, idx) => (
                <li
                  key={idx}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={() => {
                    setSelectedReserva(r);
                    setDropdownOpen(false);
                  }}
                >
                  {r.id_prereserva}
                </li>
              ))}
            </ul>
          )}
        </div>

        {mensaje && (
          <p className="text-red-600 text-sm mt-1">{mensaje}</p>
        )}

        <div className="flex justify-between mt-4">
          <button
            onClick={() => navigate('/cliente')}
            className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleBuscar}
            className="px-4 py-2 rounded bg-violeta-oscuro text-white hover:bg-violeta-medio transition"
            disabled={!selectedReserva}
          >
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
}
