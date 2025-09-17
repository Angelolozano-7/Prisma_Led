/**
 * Página de pre-orden para prisma-led-web.
 *
 * Muestra el resumen de la prereserva antes de confirmar, permitiendo modificar, confirmar o cancelar la orden.
 * - Actualiza o crea la prereserva según si existe una edición previa.
 * - Calcula y muestra el desglose de precios, descuentos, IVA y total usando useResumenReserva.
 * - Permite modificar la selección de pantallas, cancelar la prereserva con confirmación, o confirmar y avanzar.
 *
 * Detalles clave:
 * - El botón "Modificar" permite regresar a la selección de pantallas con los datos actuales.
 * - El botón "Confirmar" guarda la prereserva (crea o actualiza) y navega a la página de documento.
 * - El botón "Cancelar" muestra un modal de confirmación y permite limpiar el contexto y volver al dashboard.
 * - Los precios se formatean en COP y se muestran los descuentos aplicados.
 *
 * Futuro desarrollador:
 * - Puedes agregar validaciones adicionales antes de confirmar la prereserva.
 * - El manejo de edición y creación está desacoplado y centralizado para fácil mantenimiento.
 * - El componente usa hooks y contexto para mantener la lógica desacoplada y reutilizable.
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';
import { useAppData } from '../hooks/useAppData';
import { useResumenReserva } from '../hooks/useResumenReserva';
import { usePrereserva } from '../contexts/PrereservaContext';
import Swal from 'sweetalert2';


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
    uxid,
  } = location.state || prereserva?.edicion || {};

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const { tarifas: tarifasContext } = useAppData();

  // Mapea tarifas por duración en segundos
  const tarifas = tarifasContext.reduce((acc, t) => {
    acc[t.duracion_seg] = t.precio_semana;
    return acc;
  }, {});

  // Calcula el resumen de precios y descuentos
  const resumen = useResumenReserva(pantallas, duracion, tarifas, fecha_inicio);

  // Formatea valores en COP
  const formatCOP = (valor) =>
    valor.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });

  // Calcula la fecha de fin según la duración
  const calcularFechaFin = () => {
    if (!fecha_inicio || !duracion) return '';
    const inicio = new Date(fecha_inicio);
    inicio.setDate(inicio.getDate() + parseInt(duracion) * 7);
    return inicio.toISOString().split('T')[0];
  };

  // Modal de confirmación para cancelar la prereserva
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

  // Confirma la prereserva (crea o actualiza según contexto)
  const handleConfirmar = async () => {
    try {
      let id_prereserva_final = prereserva?.original?.id_reserva;
      let uxid = prereserva?.edicion?.uxid || null;
      if (prereserva?.original?.id_reserva) {
        // Actualizar prereserva existente
        const res = await api.put(`/prereservas/actualizar-completo/${prereserva.original.id_reserva}`, {
          fecha_inicio,
          fecha_fin: calcularFechaFin(),
          categoria,
          duracion,
          uxid,
          pantallas: pantallas.map(p => ({
            id_pantalla: p.id_pantalla,
            cod_tarifas: p.cod_tarifas,
            precio: p.precio,
            cilindro: p.cilindro,
            identificador: p.identificador,
          }))
          
        });
        uxid = res.data.uxid;
        id_prereserva_final = res.data.id_prereserva;


        await Swal.fire({
          title: '¡Reserva actualizada!',
          text: 'Tu Reserva ha sido modificada con éxito.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });

      } else {
        // Crear nueva prereserva
        const res = await api.post('/prereservas/crear-completo', {
          fecha_inicio,
          fecha_fin: calcularFechaFin(),
          categoria,
          duracion,
          pantallas: pantallas.map(p => ({
            id_pantalla: p.id_pantalla,
            cod_tarifas: p.cod_tarifas,
            precio: p.precio,
            cilindro: p.cilindro,
            identificador: p.identificador,
          }))
        });

        id_prereserva_final = res.data.id_prereserva;
        uxid = res.data.uxid;
        await Swal.fire({
          title: '¡Reserva creada!',
          text: 'Tu reserva fue registrada exitosamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      }

      // Redirigir a PreOrdenDoc con los datos actualizados
      navigate('/cliente/pre-orden-doc', {
        state: {
          id_prereserva: id_prereserva_final,
          uxid,
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
        text: 'Ocurrió un problema al guardar tu reserva. Intenta nuevamente.',
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
                <span>Cilindro {p.cilindro} {p.identificador} - {duracion} semana{duracion > 1 && 's'} - cupos {p.segundos/20}</span>
                <div className="text-right">
                  <div className="text-xs text-gray-500 px-2">Subtotal: {formatCOP((p.base * duracion))}</div>
                  {p.descuento > 0 && (
                    <div className="text-xs text-red-600 px-2">Descuento: {formatCOP(p.descuento * p.precio)} (-{(p.descuento * 100).toFixed(1)}%)</div>
                  )}
                  <div className="text-sm font-semibold px-2">Total: {formatCOP(p.precio)}</div>
                </div>
              </li>
            ))}
          </ul>

          <hr className="my-2" />

          <div className="text-right space-y-1 mt-4 text-sm">
               <div className="flex justify-between text-sm font-semibold text-right pt-2 border-t mt-2">

                Subtotal base: <span className="text-violet-700">{formatCOP(resumen.baseTotal)}</span>

              </div>

            {resumen.descuento > 0 && (
              <div className=" text-right text-xs text-red-600 font-medium">
                <p>Descuento aplicado:  {formatCOP(resumen.ahorro)} (-{(resumen.descuento * 100).toFixed(1)}%)</p>
              </div>
            )}
            {resumen.descuento > 0 && (
              <div className=" flex justify-between text-sm font-bold text-right pt-2 border-t mt-2">
                Subtotal con descuento: <span className="text-violet-700">{formatCOP(resumen.totalConDescuento)}</span>
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
            <p className="text-lg font-medium mb-4">¿Estás seguro que deseas cancelar la reserva?</p>
            <p className="text-lg font-medium mb-4">Si ha tenido algun incoveniente puede comunicarnos al +57 300 7053297</p>
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
