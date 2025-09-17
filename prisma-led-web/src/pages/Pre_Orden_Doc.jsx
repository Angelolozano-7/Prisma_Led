/**
 * Página de documento de prereserva para prisma-led-web.
 *
 * Muestra el resumen final de la prereserva y envía automáticamente la información al correo del cliente.
 * - Obtiene los datos del cliente autenticado y los muestra junto al detalle de la prereserva.
 * - Calcula y muestra el subtotal, IVA y total de la orden.
 * - Envía el correo solo una vez usando una bandera persistente (useRef).
 * - Permite al usuario regresar al dashboard tras la confirmación.
 *
 * Detalles clave:
 * - El correo se envía automáticamente al montar el componente, evitando duplicados.
 * - Los datos del cliente y la prereserva se obtienen del backend y del estado de navegación.
 * - Los valores monetarios se formatean en COP para claridad.
 * - El botón "Aceptar" redirige al usuario al dashboard de cliente.
 *
 * Futuro desarrollador:
 * - Puedes agregar más información en el correo o modificar el formato visual del resumen.
 * - El manejo de envío de correo está desacoplado y centralizado para fácil mantenimiento.
 * - El componente usa hooks y contexto para mantener la lógica desacoplada y reutilizable.
 */

import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResumenReserva } from '../hooks/useResumenReserva';
import { useAppData } from '../hooks/useAppData';
import api from '../services/api';

export default function PreOrdenDoc() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cliente, setCliente] = useState(null);
  const correoEnviadoRef = useRef(false); // Bandera persistente para evitar doble envío

  const {
    id_prereserva,
    uxid,
    duracion,
    fecha_inicio,
    fecha_fin,
    categoria,
    pantallas = []
  } = location.state || {};

  const { tarifas: tarifasContext } = useAppData();

  // Mapea tarifas por duración en segundos
  const tarifas = tarifasContext.reduce((acc, t) => {
    acc[t.duracion_seg] = t.precio_semana;
    return acc;
  }, {});

  const resumen = useResumenReserva(pantallas, duracion, tarifas, fecha_inicio);
  const subtotal = pantallas.reduce((acc, p) => acc + (p.precio || 0), 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  useEffect(() => {
    /**
     * Obtiene los datos del cliente y envía el correo de confirmación de prereserva.
     * El correo solo se envía una vez por render usando la bandera correoEnviadoRef.
     */
    const fetchYEnviar = async () => {
      if (correoEnviadoRef.current) return; // ⛔ evitar segundo envío
      correoEnviadoRef.current = true; // ✅ marcar como enviado

      try {
        const res = await api.get('/cliente');
        const clienteData = res.data;
        setCliente(clienteData);

        await api.post('/prereservas/enviar-correo', {
          correo: clienteData.correo,
          razon_social: clienteData.razon_social,
          nit: clienteData.nit,
          id_prereserva,
          fecha_inicio,
          duracion,
          fecha_fin,
          categoria,
          pantallas,
          subtotal,
          iva,
          total,
          uxid
        });

        console.log('Correo enviado con éxito');
      } catch (err) {
        console.error('Error al obtener cliente o enviar correo:', err);
      }
    };

    fetchYEnviar();
  }, []);

  if (!cliente) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Cargando información del cliente...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="bg-white border  shadow-lg rounded-lg w-full max-w-md">
        <div className="bg-violet-400 text-white text-center py-3 rounded-t font-semibold text-lg">
          Reserva PW-{uxid}
        </div>

        <div className="p-4 space-y-4 text-sm text-gray-800">
          <div>
            <p className="font-semibold underline mb-1">Información cliente</p>
            <p><strong>Razón Social:</strong> {cliente.razon_social || '---'}</p>
            <p><strong>NIT:</strong> {cliente.nit || '---'}</p>
            <p><strong>Correo electrónico:</strong> {cliente.correo || '---'}</p>
          </div>

          <div>
            <p className="font-semibold underline mb-1">Descripción reserva</p>
            <p><strong>Fecha:</strong> {fecha_inicio} - {fecha_fin}</p>
            <p><strong>Categoría:</strong> {categoria}</p>
            {pantallas.map((p, i) => (
              <div className='py-2' key={i}>
                <p>
                  Pantalla {p.cilindro}{p.identificador} - {duracion} semana{duracion > 1 ? 's' : ''} - cupos {p.segundos/20}
                </p>
                <p className="text-xs text-gray-600 ml-2">
                  Base: ${(p.base * duracion)?.toLocaleString('es-CO')}| {p.descuento>0 && (<span className="text-red-600 font-medium"> Descuento: ${(Math.round(p.precio * p.descuento))?.toLocaleString('es-CO')} (-{(p.descuento * 100).toFixed(1)}%)</span>)} | Total: ${p.precio?.toLocaleString('es-CO')}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t pt-2">
            <p>Subtotal base: ${resumen.baseTotal.toLocaleString('es-CO')}</p>
            {resumen.descuento > 0 && (
              <p className="text-red-600 font-medium"><strong>Descuento:</strong> ${resumen.ahorro.toLocaleString('es-CO')} (-{(resumen.descuento * 100).toFixed(1)}%)</p>
            )}
            {resumen.descuento > 0 && (
              <p><strong>Subtotal con descuento:</strong> ${resumen.totalConDescuento.toLocaleString('es-CO')}</p>
            )}
            <p><strong>IVA:</strong> ${iva.toLocaleString('es-CO')}</p>
            <p className="text-lg font-bold"><strong>Total:</strong> ${total.toLocaleString('es-CO')}</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-6 text-sm text-gray-700">
        Toda la información adicional fue enviada al correo <strong>{cliente.correo}</strong>
      </div>

      <button
        onClick={() => navigate('/cliente')}
        className="mt-6 bg-violet-400 hover:bg-violet-500 text-white px-6 py-2 rounded transition"
      >
        Aceptar
      </button>
    </div>
  );
}
