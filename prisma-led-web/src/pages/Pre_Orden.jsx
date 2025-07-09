import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';
import { useAppData } from '../hooks/useAppData';
import { useResumenReserva } from '../hooks/useResumenReserva';
import { usePrereserva } from '../contexts/PrereservaContext';
import Swal from 'sweetalert2'


export default function PreOrden() {
  const location = useLocation();
  const navigate = useNavigate();
  const { prereserva, setPrereserva } = usePrereserva();

  const {
    fecha_inicio,
    duracion,
    categoria,
    disponibilidad,
    pantallas = [],
  } = location.state || prereserva?.edicion || {};

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const { tarifas: tarifasContext } = useAppData();

  const tarifas = tarifasContext.reduce((acc, t) => {
    acc[t.duracion_seg] = t.precio_semana;
    return acc;
  }, {});

  const resumen = useResumenReserva(pantallas, duracion, tarifas, fecha_inicio);

  const formatCOP = (valor) =>
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

  const confirmarCancelacion = () => {
    setMostrarConfirmacion(true);
  };

  const cancelarConfirmacion = () => {
    setMostrarConfirmacion(false);
  };

  const procederCancelacion = () => {
    setPrereserva(null);
    navigate('/cliente');
  };

  const handleConfirmar = async () => {
    try {
      let id_prereserva_final = prereserva?.original?.id_reserva;

      if (prereserva?.original?.id_reserva) {
        // 🔄 Actualizar prereserva existente
        await api.put(`/prereservas/${prereserva.original.id_reserva}`, {
          fecha_inicio,
          fecha_fin: calcularFechaFin(),
          categoria
        });

        await api.put(`/prereservas/detalle_prereserva/${prereserva.original.id_reserva}`, {
          categoria,
          duracion,
          pantallas: pantallas.map(p => ({
            id_pantalla: p.id_pantalla,
            precio: p.precio,
            cod_tarifas: p.cod_tarifas
          }))
        });

        id_prereserva_final = prereserva.original.id_reserva;

        await Swal.fire({
          title: '¡Prereserva actualizada!',
          text: 'Tu prereserva ha sido modificada con éxito.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });

      } else {
        // ✨ Crear nueva prereserva
        const response = await api.post('/prereservas/crear', {
          fecha_inicio,
          fecha_fin: calcularFechaFin(),
          categoria
        });

        id_prereserva_final = response.data.id_prereserva;

        await api.post('/prereservas/detalle_prereserva/crear', {
          id_prereserva: id_prereserva_final,
          categoria,
          duracion,
          pantallas: pantallas.map(p => ({
            id_pantalla: p.id_pantalla,
            precio: p.precio,
            cod_tarifas: p.cod_tarifas
          }))
        });

        await Swal.fire({
          title: '¡Prereserva creada!',
          text: 'Tu prereserva fue registrada exitosamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      }

      // 🚀 Redirigir a PreOrdenDoc con los datos actualizados
      navigate('/cliente/pre-orden-doc', {
        state: {
          id_prereserva: id_prereserva_final,
          duracion,
          fecha_inicio,
          fecha_fin: calcularFechaFin(),
          categoria,
          pantallas
        }
      });

    } catch (error) {
      console.error(error);
      Swal.fire({
        title: 'Error al confirmar',
        text: 'Ocurrió un problema al guardar tu prereserva. Intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
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
                <div className="text-right">
                  <div className="text-xs text-gray-500">Base: {formatCOP(p.base)}</div>
                  {p.descuento > 0 && (
                    <div className="text-xs text-red-600">Descuento: -{(p.descuento * 100).toFixed(1)}%</div>
                  )}
                  <div className="text-sm font-semibold">Total: {formatCOP(p.precio)}</div>
                </div>
              </li>
            ))}
          </ul>

          <hr className="my-2" />

          <div className="text-right space-y-1 mt-4 text-sm">
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


            <div className="flex justify-between font-bold mt-2">
              <span>IVA</span>
              <span>{formatCOP(resumen.iva)}</span>
            </div>

            <div className="flex justify-between font-bold text-lg text-black mt-1">
              <span>Total</span>
              <span>{formatCOP(resumen.total)}</span>
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
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded"
        >
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
