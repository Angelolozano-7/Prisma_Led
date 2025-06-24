import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getUserFromToken } from '../services/decodeToken';

export default function HistorialReservas() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const fetchHistorialConDetalles = async () => {
      try {
        const user = getUserFromToken();
        if (!user?.id) {
          setMensaje('Usuario no identificado');
          return;
        }

        // Paso 1: obtener reservas básicas
        const res = await api.get('/reservas/cliente');
        const reservasBase = res.data || [];
        console.log('Reservas obtenidas:', reservasBase);
        // Paso 2: obtener detalles para cada reserva
        const reservasConDetalles = await Promise.all(
          reservasBase.map(async (r) => {
            try {
              const detalleRes = await api.get(`/reservas/detalle/${r.id_reserva}`);
              const detalles = detalleRes.data;

              const subtotal = (detalles.pantallas || []).reduce(
                (acc, p) => acc + (p.precio || 0),
                0
              );

              return {
                id_reserva: r.id_reserva,
                fecha_inicio: detalles.fecha_inicio,
                fecha_fin: r.fecha_fin,
                duracion: detalles.duracion,
                categoria: detalles.categoria,
                pantallas: detalles.pantallas,
                subtotal
              };
            } catch (err) {
              console.warn(`No se pudo obtener detalles para reserva ${r.id_reserva}`);
              return null; // o puedes devolver algo parcial si prefieres
            }
          })
        );
        console.log('Reservas con detalles:', reservasConDetalles);
        // Filtrar cualquier nulo si hubo fallos
        const filtradas = reservasConDetalles.filter(Boolean);
        setReservas(filtradas);

      } catch (error) {
        console.error('Error al obtener historial:', error);
        setMensaje('No se pudo cargar el historial de reservas');
      }
    };

    fetchHistorialConDetalles();
  }, []);

  const handleRepetirReserva = (reserva) => {
    console.log('Repetir reserva:', reserva);
    const fechaActual = new Date().toISOString().split('T')[0];
    navigate('/cliente/disponibilidad', {
      state: {
        fecha_inicio: fechaActual,
        duracion: reserva.duracion,
        categoria: reserva.categoria,
        seleccionadas: (reserva.pantallas || []).map(p => ({
          id_pantalla: p.id,
          cilindro: p.cilindro,
          identificador: p.identificador,
          segundos: p.segundos,
          precio: p.precio
        }))
      }
    });
  };

  return (
    <div className="flex flex-col items-center bg-white p-6">
      <div className="border rounded shadow-lg w-full max-w-2xl bg-white">
        <div className="bg-violet-500 text-white text-center py-3 font-bold text-lg rounded-t">
          Historial de reservas
        </div>

        <div className="p-4 space-y-4 w-full overflow-x-auto">
          {reservas.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">Buscando reservas.</p>
          ) : (
            reservas.map((reserva, index) => (
              <div
                key={index}
                className="border p-3 rounded cursor-pointer hover:bg-gray-50 w-full sm:text-sm text-xs"
                onClick={() => handleRepetirReserva(reserva)}
              >
                <p><strong>ID:</strong> {reserva.id_reserva}</p>
                <p><strong>Periodo:</strong> {reserva.fecha_inicio} - {reserva.fecha_fin}</p>
                <p><strong>Categoría:</strong> {reserva.categoria}</p>
                <p><strong>Pantallas:</strong> {(reserva.pantallas || []).map(p => `${p.cilindro}${p.identificador}`).join(', ')}</p>
                <p><strong>Subtotal:</strong> ${reserva.subtotal?.toLocaleString('es-CO')}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={() => navigate('/cliente')}
          className="bg-violet-300 hover:bg-violet-400 text-white px-4 py-2 rounded"
        >
          Volver
        </button>
      </div>

      {mensaje && <p className="text-red-600 mt-4 text-sm">{mensaje}</p>}
    </div>
  );
}
