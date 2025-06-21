// Disponibilidad.jsx - Ajustado para seleccionar segundos disponibles y calcular subtotal dinámicamente con tarifas desde el backend

import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import CilindroBox from '../components/CilindroBox';
import CilindroModal from '../components/CilindroModal';
import api from '../services/api';

const esDiciembre = (fecha) => new Date(fecha).getMonth() === 11;

export default function Disponibilidad() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.disponibilidad;
  const fecha_inicio = location.state?.fecha_inicio;
  const duracion = parseInt(location.state?.duracion);
  const categoria = location.state?.categoria;

  const [seleccionadas, setSeleccionadas] = useState([]);
  const [duraciones, setDuraciones] = useState({});
  const [tarifas, setTarifas] = useState({});
  const [cilindroSeleccionado, setCilindroSeleccionado] = useState(null);
  const [tooltipInfo, setTooltipInfo] = useState(null);

  useEffect(() => {
    if (!data) navigate('/cliente');
  }, [data, navigate]);

  useEffect(() => {
    const obtenerTarifas = async () => {
      try {
        const res = await api.get('/reservas/tarifas');
        const nuevasTarifas = {};
        res.data.forEach((t) => {
          nuevasTarifas[t.duracion_seg] = t.precio_semana;
        });
        setTarifas(nuevasTarifas);
      } catch (error) {
        console.error('Error al cargar tarifas:', error);
      }
    };
    obtenerTarifas();
  }, []);

  const agrupadasPorCilindro = useMemo(() => {
    if (!data) return {};
    const porCilindro = {};
    Object.entries(data).forEach(([id, pantalla]) => {
      const cil = parseInt(pantalla.cilindro);
      if (!porCilindro[cil]) porCilindro[cil] = [];
      porCilindro[cil].push({ id, data: pantalla });
    });
    Object.values(porCilindro).forEach(arr => {
      arr.sort((a, b) => a.data.identificador.localeCompare(b.data.identificador));
    });
    return porCilindro;
  }, [data]);

  const toggleSeleccion = (pantallaId) => {
    setSeleccionadas((prev) =>
      prev.includes(pantallaId) ? prev.filter((id) => id !== pantallaId) : [...prev, pantallaId]
    );
  };

  const handleDuracionChange = (pantallaId, segundos) => {
    setDuraciones((prev) => ({ ...prev, [pantallaId]: segundos }));
  };

  const calcularPrecio = (pantallaId) => {
    const segundos = duraciones[pantallaId];
    if (!segundos || !tarifas[segundos]) return 0;
    const base = esDiciembre(fecha_inicio) ? 2000000 : tarifas[segundos];
    let total = base * duracion;
    let descuento = 0;
    if (!esDiciembre(fecha_inicio)) {
      if (duracion > 26) descuento = 0.1;
      else if (duracion > 13) descuento = 0.034;
    }
    total *= 1 - descuento;
    return { total, base, descuento };
  };

  const subtotal = seleccionadas.reduce((acc, id) => {
    const precio = calcularPrecio(id);
    return acc + (precio?.total || 0);
  }, 0);

  const ahorroTotal = (() => {
    let ahorro = 0;
    seleccionadas.forEach(id => {
      const segundos = duraciones[id];
      if (!segundos || !tarifas[segundos]) return;
      const base = esDiciembre(fecha_inicio) ? 2000000 : tarifas[segundos];
      const totalSinDescuento = base * duracion;
      const precio = calcularPrecio(id);
      const totalConDescuento = precio ? precio.total : 0;
      ahorro += totalSinDescuento - totalConDescuento;
    });
    return ahorro;
  })();

  const handleTooltip = (pantalla) => {
    if ((pantalla.estado === 'parcial' || pantalla.estado === 'ocupado' || pantalla.estado === 'reservado') && pantalla.mensaje) {
      setTooltipInfo({ id: pantalla.id, mensaje: pantalla.mensaje });
      setTimeout(() => setTooltipInfo(null), 5000);
    }
  };

  return (
    <div className="bg-gray-50 p-4 md:p-6 flex flex-col min-h-full">
      <h2 className="text-2xl font-bold text-center mb-2">Mapa de disponibilidad</h2>
      <p className="text-center text-sm text-gray-600 mb-4">
        Fecha: {fecha_inicio} – Duración: {duracion} semanas / {categoria}
      </p>

      {cilindroSeleccionado && (
        <CilindroModal
          cilindro={cilindroSeleccionado}
          onClose={() => setCilindroSeleccionado(null)}
        />
      )}

      <div className="flex flex-col lg:flex-row gap-6 w-full">
        <div className="flex-1 border rounded p-4 bg-white shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-6 justify-items-center w-full">
            {Object.entries(agrupadasPorCilindro)
              .sort(([a], [b]) => a - b)
              .map(([cilindro, pantallas]) => (
                <CilindroBox
                  key={cilindro}
                  cilindro={cilindro}
                  pantallas={pantallas}
                  seleccionadas={seleccionadas}
                  onToggleSeleccion={toggleSeleccion}
                  onMostrarImagen={setCilindroSeleccionado}
                  onTooltip={handleTooltip}
                />
              ))}
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-black rounded" /> Seleccionada</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-400 rounded" /> Ocupado</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-300 rounded" /> Reservado</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-pink-200 rounded" /> Disponible</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-300 rounded" /> Parcial</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-300 rounded" /> Restringido</div>
          </div>
          {tooltipInfo && (
            <div className="fixed bottom-4 right-4 bg-black text-white text-xs px-4 py-2 rounded shadow z-50">
              {tooltipInfo.mensaje}
              <button onClick={() => setTooltipInfo(null)} className="ml-4 text-red-300">✖</button>
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 border rounded p-4 bg-white shadow">
          <p className="text-lg font-bold mb-2 text-violet-700">Elementos seleccionados</p>
          {seleccionadas.length === 0 ? (
            <p className="text-sm text-gray-500">No has seleccionado pantallas aún.</p>
          ) : (
            <ul className="text-sm space-y-3 mb-4">
              {seleccionadas.map((id) => {
                const info = data[id];
                const segundosDisp = info.segundos_disponibles;
                const opciones = [20, 40, 60].filter(op => op <= segundosDisp);
                return (
                  <li key={id} className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <span>Cilindro {info.cilindro}{info.identificador}</span>
                      <button className="text-red-600 text-sm ml-2" onClick={() => toggleSeleccion(id)}>❌</button>
                    </div>
                    <select
                      value={duraciones[id] || ''}
                      onChange={(e) => handleDuracionChange(id, parseInt(e.target.value))}
                      className="mt-1 border rounded px-2 py-1"
                    >
                      <option value="">Duración (s)</option>
                      {opciones.map((seg) => (
                        <option key={seg} value={seg}>{seg} segundos</option>
                      ))}
                    </select>
                    <span className="text-right text-xs mt-1 text-gray-500">
                      Precio: {(() => {
                        const precio = calcularPrecio(id);
                        return precio ? `$${precio.total.toLocaleString('es-CO')}` : '-';
                      })()} 
                      ( ${(() => {
                        const segundos = duraciones[id];
                        if (!segundos || !tarifas[segundos]) return 0;
                        return esDiciembre(fecha_inicio) ? 2000000 : tarifas[segundos];
                      })().toLocaleString('es-CO')} x semana )
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="text-sm font-semibold text-right mb-2">
            {seleccionadas.map((id) => {
              const result = calcularPrecio(id);
              const descuento = result ? result.descuento : 0;
              return (
                descuento > 0 && (
                  <div key={id} className="text-xs text-red-600 text-right">
                    Descuento aplicado: -{(descuento * 100).toFixed(1)}%
                  </div>
                )
              );
            })}
            Subtotal: <span className="text-violet-700">${subtotal.toLocaleString('es-CO')}</span>
            {ahorroTotal > 0 && (
              <div className="text-xs text-red-500 mt-1">
                Ahorro total: ${ahorroTotal.toLocaleString('es-CO')}
              </div>
            )}
          </div>
          <button
            disabled={seleccionadas.length === 0}
            className="w-full bg-violet-600 text-white py-2 rounded disabled:bg-gray-300"
          >
            Confirmar reserva
          </button>
        </div>
      </div>
    </div>
  );
}
