import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';



export default function PreOrden() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    fecha_inicio,
    duracion,
    categoria,
    pantallas = [],
    disponibilidad = {},
  } = location.state || {};

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const calcularFechaFin = () => {
    if (!fecha_inicio || !duracion) return '';
    const inicio = new Date(fecha_inicio);
    inicio.setDate(inicio.getDate() + parseInt(duracion) * 7);
    return inicio.toISOString().split('T')[0];
  };

  const subtotal = pantallas.reduce((acc, p) => acc + (p.precio || 0), 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  const confirmarCancelacion = () => {
    setMostrarConfirmacion(true);
  };

  const cancelarConfirmacion = () => {
    setMostrarConfirmacion(false);
  };

  const procederCancelacion = () => {
    navigate('/cliente');
  };

const handleConfirmar = async () => {
  try {
    const response = await api.post('/prereservas/crear', {
      fecha_inicio,
      fecha_fin: calcularFechaFin(),
      categoria
    });

    const { id_prereserva } = response.data;

    // Preparar payload para detalle_prereserva
    const detallePayload = {
      id_prereserva,
      categoria,
      duracion,  // usado para calcular tarifa
      pantallas: pantallas.map(p => ({
        id_pantalla: p.id_pantalla,
        precio: p.precio
      }))
    };

    await api.post('/prereservas/detalle_prereserva/crear', detallePayload);

    alert("✅ Prereserva confirmada exitosamente");
    navigate('/cliente/pre-orden-doc', {
    state: {
      id_prereserva, // el devuelto del backend
      duracion,
      fecha_inicio,
      fecha_fin: calcularFechaFin(),
      categoria,
      pantallas
    }
  });

  } catch (error) {
    console.error('❌ Error al confirmar prereserva:', error);
    alert('Ocurrió un error al confirmar la prereserva.');
  }
};


  return (
    <div className="flex flex-col items-center bg-white p-6">
      <div className="border rounded shadow-lg w-full max-w-md bg-white">
        <div className="bg-violet-500 text-white text-center py-3 font-bold text-lg rounded-t">
          Resumen orden
        </div>

        <div className="p-4 space-y-2 text-sm">
          <ul className="space-y-1 text-gray-700">
            <li>• Fecha: {fecha_inicio} a {calcularFechaFin()}</li>
            <li>• Categoría: {categoria}</li>
          </ul>

          <hr className="my-2" />

          <ul className="space-y-1 text-gray-800">
            {pantallas.map((p, i) => (
              <li key={i} className="flex justify-between">
                <span>Cilindro {p.cilindro} {p.identificador} - {duracion} semana{duracion > 1 && 's'}</span>
                <span>${p.precio.toLocaleString('es-CO')}</span>
              </li>
            ))}
          </ul>

          <hr className="my-2" />

          <div className="text-right space-y-1">
            <div className="flex justify-between font-bold">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>IVA</span>
              <span>${iva.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-black">
              <span>Total</span>
              <span>${total.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={() => navigate('/cliente/disponibilidad', {
            state: {
              fecha_inicio,
              duracion,
              categoria,
              disponibilidad,
              seleccionadas: pantallas,
            }
          })}
          className="bg-violet-300 hover:bg-violet-400 text-white px-4 py-2 rounded"
        >
          Modificar
        </button>
        
        <button 
        onClick={handleConfirmar}
        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded">
          Confirmar
        </button>

        <button
          onClick={confirmarCancelacion}
          className="bg-violet-300 hover:bg-violet-400 text-white px-4 py-2 rounded"
        >
          Cancelar
        </button>
      </div>

      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-xl text-center max-w-sm w-full">
            <p className="text-lg font-medium mb-4">¿Estás seguro que deseas cancelar la prereserva?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={procederCancelacion}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Sí, cancelar
              </button>
              <button
                onClick={cancelarConfirmacion}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
