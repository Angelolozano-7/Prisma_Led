import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function PreOrdenDoc() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cliente, setCliente] = useState(null);
  const correoEnviadoRef = useRef(false); // 👈 bandera persistente

  const {
    id_prereserva,
    duracion,
    fecha_inicio,
    fecha_fin,
    categoria,
    pantallas = []
  } = location.state || {};

  const subtotal = pantallas.reduce((acc, p) => acc + (p.precio || 0), 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  useEffect(() => {
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
          total
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
      <div className="bg-white border shadow-lg rounded-lg w-full max-w-md">
        <div className="bg-violet-400 text-white text-center py-3 rounded-t font-semibold text-lg">
          Prereserva # {id_prereserva?.toUpperCase()}
        </div>

        <div className="p-4 space-y-4 text-sm text-gray-800">
          <div>
            <p className="font-semibold underline mb-1">Información cliente</p>
            <p><strong>Razón Social:</strong> {cliente.razon_social || '---'}</p>
            <p><strong>NIT:</strong> {cliente.nit || '---'}</p>
            <p><strong>Correo electrónico:</strong> {cliente.correo || '---'}</p>
          </div>

          <div>
            <p className="font-semibold underline mb-1">Descripción prereserva</p>
            <p><strong>Fecha:</strong> {fecha_inicio} - {fecha_fin}</p>
            <p><strong>Categoría:</strong> {categoria}</p>
            {pantallas.map((p, i) => (
              <div key={i}>
                <p>
                  Pantalla {p.cilindro}{p.identificador} - {duracion} semana{duracion > 1 ? 's' : ''}  
                </p>
                <p className="text-xs text-gray-600 ml-2">
                  Base: ${p.base?.toLocaleString('es-CO')} | Descuento: {(p.descuento * 100).toFixed(1)}% | Total: ${p.precio?.toLocaleString('es-CO')}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t pt-2">
            <p><strong>Subtotal:</strong> ${subtotal.toLocaleString('es-CO')}</p>
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
