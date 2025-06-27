import { useLocation, useNavigate } from 'react-router-dom';
import { useResumenReserva } from '../hooks/useResumenReserva';
import api from "../services/api";
import { useAppData } from '../hooks/useAppData';

export default function PreVisualizacion() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    id_reserva,
    fecha_creacion,
    fecha_inicio,
    duracion,
    categoria,
    pantallas = [],
  } = location.state || {};

  const { tarifas: tarifasContext } = useAppData();

  const tarifas = tarifasContext.reduce((acc, t) => {
    acc[t.duracion_seg] = t.precio_semana;
    return acc;
  }, {});

  const resumen = useResumenReserva(pantallas, duracion, tarifas, fecha_inicio);

  const formatCOP = valor =>
    valor.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });

  const calcularFechaFin = () => {
    if (!fecha_inicio || !duracion) return '';
    const inicio = new Date(fecha_inicio);
    inicio.setDate(inicio.getDate() + parseInt(duracion) * 7);
    return inicio.toISOString().split('T')[0];
  };

  const reenviarPantallas = pantallas.map((p) => ({
    id_pantalla: p.id || p.id_pantalla,
    cilindro: p.cilindro,
    identificador: p.identificador,
    segundos: p.segundos,
    precio: p.precio,
  }));

  const handleEliminar = async () => {
    if (!id_reserva) {
      alert("No hay prereserva para eliminar.");
      return;
    }

    if (!window.confirm("¿Seguro que deseas eliminar esta prereserva? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await api.delete(`/prereservas/${id_reserva}`);
      alert("✅ Prereserva eliminada correctamente.");
      navigate("/cliente");
    } catch (error) {
      console.error("Error al eliminar prereserva:", error);
      alert("❌ Ocurrió un error al eliminar la prereserva.");
    }
  };


  return (
    <div className="flex flex-col items-center bg-white p-6">
      <div className="border rounded shadow-lg w-full max-w-md bg-white">
        <div className="bg-violet-500 text-white text-center py-3 font-bold text-lg rounded-t">
          Resumen prereserva
        </div>

        <div className="p-4 space-y-2 text-sm">
          <ul className="space-y-1 text-gray-600 text-xs">
            {id_reserva && <li><strong>ID Prereserva:</strong> {id_reserva}</li>}
            {fecha_creacion && <li><strong>Creación:</strong> {fecha_creacion}</li>}
          </ul>

          <ul className="space-y-1 text-gray-700 mt-2">
            <li>• Fecha: {fecha_inicio} - {calcularFechaFin()}</li>
            <li>• Categoría: {categoria}</li>
          </ul>

          <hr className="my-2" />

          <ul className="space-y-1 text-gray-800">
            {pantallas.map((p, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  Pantalla {p.cilindro}{p.identificador} - {duracion} semana{duracion > 1 ? 's' : ''}
                </span>
                <span>{formatCOP(p.precio)}</span>
              </li>
            ))}
          </ul>

          <hr className="my-2" />

          <div className="flex justify-between font-bold text-black items-center">
            <span>Subtotal:</span>
            <span>
              {resumen.descuento > 0 ? (
                <>
                  <span className="line-through text-gray-400 mr-2">{formatCOP(resumen.baseTotal)}</span>
                  <span>{formatCOP(resumen.totalConDescuento)}</span>
                </>
              ) : (
                <span>{formatCOP(resumen.totalConDescuento)}</span>
              )}
            </span>
          </div>

          {resumen.descuento > 0 && (
            <div className="text-right text-xs text-red-600 font-medium">
              <p>Descuento aplicado: -{(resumen.descuento * 100).toFixed(1)}%</p>
              <p>Ahorro: {formatCOP(resumen.ahorro)}</p>
            </div>
          )}


          <div className="flex justify-between font-bold">
            <span>IVA</span>
            <span>{formatCOP(resumen.iva)}</span>
          </div>

          <div className="flex justify-between font-bold text-lg text-black">
            <span>Total</span>
            <span>{formatCOP(resumen.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4 flex-wrap">
        <button
          onClick={handleEliminar}
          className="bg-black  hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Eliminar
        </button>
        <button
          onClick={() =>
            navigate('/cliente/disponibilidad', {
              state: {
                fecha_inicio,
                duracion,
                categoria,
                disponibilidad: {},
                seleccionadas: reenviarPantallas,
                fromEdicion: true
              }
            })}
          className="bg-violet-500 hover:bg-violet-400 text-white px-4 py-2 rounded"
        >
          Editar
        </button>
        <button
          onClick={() => navigate('/cliente')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800  px-4 py-2 rounded"
        >
          Volver
        </button>
        
      </div>

    </div>
  );
}
