/**
 * Página de historial de reservas para prisma-led-web.
 *
 * Muestra todas las reservas realizadas por el cliente autenticado.
 * - Permite repetir una reserva con los mismos parámetros, navegando a la selección de disponibilidad.
 * - Muestra el resumen de cada reserva, incluyendo fechas, pantallas, categoría y precios/descuentos.
 * - Utiliza el hook useResumenReserva para calcular el subtotal, descuentos y ahorro.
 *
 * Detalles clave:
 * - El historial se obtiene del backend y se muestra en tarjetas individuales.
 * - El botón "Volver" regresa al dashboard del cliente.
 * - Si no hay reservas, muestra un mensaje informativo.
 * - El loader se muestra mientras se cargan los datos.
 *
 * Futuro desarrollador:
 * - Puedes agregar filtros por fecha, categoría o estado de reserva.
 * - El manejo de repetición de reserva está desacoplado y permite modificar la lógica fácilmente.
 * - El componente usa hooks y contexto para mantener la lógica desacoplada y reutilizable.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getUserFromToken } from '../services/decodeToken';
import VideoLoader from '../components/VideoLoader';
import { useAppData } from '../hooks/useAppData';
import { useResumenReserva } from '../hooks/useResumenReserva';

export default function HistorialReservas() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  const { tarifas: tarifasContext } = useAppData();

  const tarifas = tarifasContext.reduce((acc, t) => {
    acc[t.duracion_seg] = t.precio_semana;
    return acc;
  }, {});

  useEffect(() => {
    let isMounted = true;

    const fetchHistorial = async () => {
      try {
        const user = getUserFromToken();
        if (!user?.id) {
          if (isMounted) {
            setMensaje('Usuario no identificado');
            setCargando(false);
          }
          return;
        }

        const res = await api.get('/reservas/cliente/completo');
        if (isMounted) {
          setReservas(res.data || []);
          setCargando(false);
        }
      } catch (error) {
        console.error('Error al obtener historial:', error);
        if (isMounted) {
          setMensaje('No se pudo cargar el historial de pautas');
          setCargando(false);
        }
      }
    };

    fetchHistorial();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRepetirReserva = (reserva) => {
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

  const formatCOP = (valor) =>
    valor.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });

  if (cargando) return <VideoLoader />;

  return (
    <div className="flex flex-col items-center bg-white p-6">
      <div className="border rounded shadow-lg w-full max-w-2xl bg-white">
        <div className="bg-violet-500 text-white text-center py-3 font-bold text-lg rounded-t">
          Historial de pautas
        </div>

        <div className="p-4 space-y-4 w-full overflow-x-auto">
          {reservas.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">No se encontraron pautas.</p>
          ) : (
            reservas.map((reserva, index) => {
              const resumen = useResumenReserva(
                reserva.pantallas || [],
                reserva.duracion,
                tarifas,
                reserva.fecha_inicio
              );

              return (
                <div
                  key={index}
                  className="border p-3 rounded cursor-pointer hover:bg-gray-50 w-full sm:text-sm text-xs"
                  onClick={() => handleRepetirReserva(reserva)}
                >
                  <p><strong>Reserva:</strong> PW-{reserva.uxid}</p>
                  <p><strong>Periodo:</strong> {reserva.fecha_inicio} - {reserva.fecha_fin}</p>
                  <p><strong>Categoría:</strong> {reserva.categoria}</p>
                  <p><strong>Pantallas:</strong> {(reserva.pantallas || []).map(p => `${p.cilindro}${p.identificador}`).join(', ')}</p>

                  {resumen.descuento > 0 ? (
                    <>
                      <p>
                        <strong>Subtotal:</strong>{' '}
                        {resumen.descuento > 0 ? (
                          <>
                            <span className="line-through text-gray-400 mr-2">{formatCOP(resumen.baseTotal)}</span>
                            <span className="text-black font-semibold">{formatCOP(resumen.totalConDescuento)}</span>
                          </>
                        ) : (
                          <span>{formatCOP(resumen.totalConDescuento)}</span>
                        )}
                      </p>


                      <p className="text-sm text-red-600 font-medium">
                        Descuento aplicado: -{((resumen.ahorro/resumen.baseTotal) * 100).toFixed(1)}% {' '}
                        (Ahorro: {formatCOP(resumen.ahorro)})
                      </p>
                    </>
                  ) : (
                    <p>
                      <strong>Subtotal:</strong> {formatCOP(resumen.totalConDescuento)}
                    </p>
                  )}
                </div>
              );
            })
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
