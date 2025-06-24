import { useLocation, useNavigate } from 'react-router-dom';

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

  const calcularFechaFin = () => {
    if (!fecha_inicio || !duracion) return '';
    const inicio = new Date(fecha_inicio);
    inicio.setDate(inicio.getDate() + parseInt(duracion) * 7);
    return inicio.toISOString().split('T')[0];
  };

  const subtotal = pantallas.reduce((acc, p) => acc + (p.precio || 0), 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  const reenviarPantallas = pantallas.map((p) => ({
    id_pantalla: p.id || p.id_pantalla,
    cilindro: p.cilindro,
    identificador: p.identificador,
    segundos: p.segundos,
    precio: p.precio,
  }));

  return (
    <div className="flex flex-col items-center bg-white p-6">
      <div className="border rounded shadow-lg w-full max-w-md bg-white">
        <div className="bg-violet-500 text-white text-center py-3 font-bold text-lg rounded-t">
          Resumen prereserva
        </div>

        <div className="p-4 space-y-2 text-sm">
          {/* 🆕 Mostrar ID y fecha de creación */}
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
                <span>Pantalla {p.cilindro}{p.identificador} - {duracion} semana{duracion > 1 && 's'}</span>
                <span>${p.precio?.toLocaleString('es-CO')}</span>
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
              disponibilidad: {},
              seleccionadas: reenviarPantallas,
              fromEdicion: true
            }
          })}
          className="bg-violet-300 hover:bg-violet-400 text-white px-4 py-2 rounded"
        >
          Disponibilidad
        </button>
        <button
          onClick={() => navigate('/cliente')}
          className="bg-violet-300 hover:bg-violet-400 text-white px-4 py-2 rounded"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
