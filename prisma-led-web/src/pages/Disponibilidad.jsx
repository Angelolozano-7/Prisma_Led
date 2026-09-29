/**
 * Selección de pantallas y disponibilidad.
 *
 * Es el núcleo del flujo de reserva: consulta estados por pantalla, agrupa
 * pantallas por cilindro, permite selección manual o selección mágica,
 * asigna cupos de 20/40/60 segundos y calcula el importe estimado antes de
 * avanzar al resumen.
 *
 * Estados del backend: disponible, parcial, reservado, ocupado y restringido.
 * En edición utiliza PrereservaContext para conservar la entidad legacy.
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useAppData } from '../hooks/useAppData';
import CilindroBox from '../components/CilindroBox';
import CilindroModal from '../components/CilindroModal';
import BusquedaInline from '../components/BusquedaInline';
import api from '../services/api';
import VideoLoader from '../components/VideoLoader';
import { usePrereserva } from '../contexts/PrereservaContext';
import Swal from 'sweetalert2';

export default function Disponibilidad() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tarifas: tarifasContext, categorias } = useAppData();
  const [loading, setLoading] = useState(false);
  const { prereserva, setPrereserva } = usePrereserva();

  // Estado principal de filtros y selección
  const [isEditando, setisEditando] = useState(prereserva?.edicion?.isEditando || false );
  const [fechaInicio, setFechaInicio] = useState(location.state?.fecha_inicio || prereserva?.edicion?.fecha_inicio || '');
  const [duracion, setDuracion] = useState(parseInt(location.state?.duracion) || parseInt(prereserva?.edicion?.duracion) || 1);
  const [categoria, setCategoria] = useState(location.state?.categoria || prereserva?.edicion?.categoria ||(categorias[0]?.nombre || ''));
  const [data, setData] = useState(null);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [duraciones, setDuraciones] = useState({});
  const [cilindroSeleccionado, setCilindroSeleccionado] = useState(null);
  const [tooltipInfo, setTooltipInfo] = useState(null);
  // --- Selección mágica ---
  const [magicCantidad, setMagicCantidad] = useState(6);   // N pantallas
  const [magicSegundos, setMagicSegundos] = useState(20);  // M cupos en segundos: 20|40|60

  // Tarifas y códigos por duración
  const tarifas = tarifasContext.reduce((acc, t) => {
    acc[t.duracion_seg] = t.precio_semana;
    return acc;
  }, {});
  const get_code = tarifasContext.reduce((acc, t) => {
    acc[t.duracion_seg] = t.codigo_tarifa;
    return acc;
  }, {});

  // Redirige si no hay data
  useEffect(() => {
    if (data === null) return;
    if (Object.keys(data).length === 0) navigate('/cliente');
  }, [data, navigate]);

  /**
   * Memoiza la visualización de pantallas, marcando las propias de la prereserva como disponibles.
   */
  const dataVisual = useMemo(() => {
    if (!data) return null;

    const pantallasDeMiPrereserva = isEditando
      ? new Set(prereserva?.edicion?.pantallas?.map(p => p.id_pantalla))
      : new Set();

    const nuevo = { ...data };

    for (const id of pantallasDeMiPrereserva) {
      if (nuevo[id]) {
        nuevo[id] = {
          ...nuevo[id],
          estado: 'disponible',
          mensaje: 'Pantalla propia de tu prereserva'
        };
      }
    }

    return nuevo;
  }, [data, isEditando, prereserva]);

  /**
   * Consulta la disponibilidad inicial y filtra pantallas seleccionadas/no disponibles.
   */
  useEffect(() => {
    const fetchDisponibilidad = async () => {
      setLoading(true);
      try {
        const res = await api.post('/reservas/disponibilidad', {
          fecha_inicio: fechaInicio,
          duracion_semanas: duracion,
          categoria,
          excluir_prereserva_id: isEditando ? prereserva?.edicion?.id_prereserva : undefined
        });
        setData(res.data);
        
        // Pantallas iniciales según edición o navegación
        const pantallasIniciales =
          location.state?.seleccionadas?.length > 0
            ? location.state?.seleccionadas
            : (prereserva?.edicion?.pantallas || []);
        const filteredData = Object.fromEntries(
          Object.entries(res.data).filter(([_, pantalla]) => pantalla.estado !== 'ocupado')
        );
        const disponibles = Object.keys(filteredData);
        const solicitadas = pantallasIniciales.map(p => p.id_pantalla);

        const seleccionFiltrada = solicitadas.filter(id => disponibles.includes(id)); 
        const noDisponibles = solicitadas.filter(id => !disponibles.includes(id));
        if (noDisponibles.length > 0) {
          const nombres = noDisponibles.map(id => {
            const pantalla = res.data[id];
            return pantalla
              ? `Cilindro ${pantalla.cilindro}${pantalla.identificador}`
              : id;
          });
          
          await Swal.fire({
            title: 'Pantallas no disponibles',
            html: `⚠️ Las siguientes pantallas no están disponibles:<br><br><strong>${nombres.join('<br>')}</strong>`,
            icon: 'warning',
            confirmButtonText: 'Entendido'
          });
        }

        setSeleccionadas(seleccionFiltrada);

        // Duraciones iniciales
        const nuevasDuraciones = {};
        pantallasIniciales.forEach(p => {
          if (seleccionFiltrada.includes(p.id_pantalla)) {
            nuevasDuraciones[p.id_pantalla] = p.segundos;
          }
        });
        setDuraciones(nuevasDuraciones);

      } catch (error) {
        console.error('Error al consultar disponibilidad al montar:', error);
        navigate('/cliente');
      } finally {
        setLoading(false);
      }
    };

    if (fechaInicio && duracion && categoria) {
      fetchDisponibilidad();
    }
  }, []);

  /**
   * Calcula la fecha de fin según la duración en semanas.
   */
  const calcularFechaFin = () => {
    if (!fechaInicio || !duracion) return '';
    const inicio = new Date(fechaInicio);
    inicio.setDate(inicio.getDate() + parseInt(duracion) * 7);
    return inicio.toISOString().split('T')[0];
  };

  /**
   * Agrupa pantallas por cilindro para visualización en el mapa.
   */
  const agrupadasPorCilindro = useMemo(() => {
    if (!dataVisual) return {};
    const porCilindro = {};
    Object.entries(dataVisual).forEach(([id, pantalla]) => {
      const cil = parseInt(pantalla.cilindro);
      if (!porCilindro[cil]) porCilindro[cil] = [];
      porCilindro[cil].push({ id, data: pantalla });
    });
    Object.values(porCilindro).forEach(arr => {
      arr.sort((a, b) => a.data.identificador.localeCompare(b.data.identificador));
    });
    return porCilindro;
  }, [dataVisual]);

  // Selección mágica balanceada por cilindro (round-robin)
// - Si `reemplazar` es true, limpia selección antes de aplicar.
  // - Reparte 1 por cilindro en rondas hasta completar N o agotar candidatos.
  const aplicarSeleccionMagica = async (reemplazar = false) => {
    if (!dataVisual) return;

    const segundosNecesarios = magicSegundos;

    // Punto de partida (sumar o reemplazar)
    const actualesSet = new Set(reemplazar ? [] : seleccionadas);
    const nuevasSeleccion = reemplazar ? [] : [...seleccionadas];
    const nuevasDur = reemplazar ? {} : { ...duraciones };

    // ¿Cuántas ya hay por cilindro? (para priorizar cilindros menos cubiertos)
    const conteoSelPorCil = {};
    for (const id of actualesSet) {
      const cil = parseInt(dataVisual[id]?.cilindro);
      if (!isNaN(cil)) conteoSelPorCil[cil] = (conteoSelPorCil[cil] || 0) + 1;
    }

    // Orden de cilindros: menos seleccionados primero, y luego por número
    const cilindrosOrdenados = Object.keys(agrupadasPorCilindro)
      .map((c) => parseInt(c))
      .sort((a, b) => {
        const da = conteoSelPorCil[a] || 0;
        const db = conteoSelPorCil[b] || 0;
        return da === db ? a - b : da - db;
      });

    // Candidatos por cilindro, ya filtrados por disponibilidad real
    const listas = cilindrosOrdenados.map((cil) => {
      const arr = (agrupadasPorCilindro[cil] || []).filter(({ id, data }) => {
        const disp = Number(data.segundos_disponibles ?? 0);
        const estadoOk = data.estado === 'disponible' || data.estado === 'parcial';
        return estadoOk && disp >= segundosNecesarios && !actualesSet.has(id);
      });
      return arr; // cada item: { id, data }
    });

    // Round-robin: tomamos una del "nivel 0" de cada cilindro, luego nivel 1, etc.
    let agregadas = 0;
    let nivel = 0;
    while (agregadas < magicCantidad) {
      let avancesEnRonda = 0;
      for (let i = 0; i < listas.length && agregadas < magicCantidad; i++) {
        const cand = listas[i][nivel];
        if (cand) {
          const { id } = cand;
          if (!actualesSet.has(id)) {
            nuevasSeleccion.push(id);
            nuevasDur[id] = segundosNecesarios; // asigna M cupos a cada una
            actualesSet.add(id);
            agregadas++;
            avancesEnRonda++;
          }
        }
      }
      if (avancesEnRonda === 0) break; // no quedan candidatos en ningún cilindro
      nivel++;
    }

    setSeleccionadas(nuevasSeleccion);
    setDuraciones(nuevasDur);

    if (agregadas < magicCantidad) {
      await Swal.fire({
        title: 'Selección mágica incompleta',
        icon: 'info',
        html: `Se eligieron <strong>${agregadas}</strong> pantallas con ${segundosNecesarios/20} cupo(s) distribuidas por cilindro según los filtros.`,
        confirmButtonText: 'Entendido',
      });
    }
  };
  /////----------------------------------------------------------------

  /**
   * Alterna la selección de una pantalla.
   */
  const toggleSeleccion = (pantallaId) => {
    setSeleccionadas((prev) =>
      prev.includes(pantallaId) ? prev.filter((id) => id !== pantallaId) : [...prev, pantallaId]
    );
  };

  /**
   * Cambia la duración de pauta para una pantalla seleccionada.
   */
  const handleDuracionChange = (pantallaId, segundos) => {
    setDuraciones((prev) => ({ ...prev, [pantallaId]: segundos }));
  };
  // Utilidades de fecha para el cálculo comercial.
const toDate = (d) => new Date(d);
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const addWeeks = (date, w) => addDays(date, 7 * w);
const isDecember = (date) => toDate(date).getMonth() === 11; // 11 = diciembre (0-based)

// Cuenta cuántas de las "duracionSemanas" caen en diciembre
const countDecemberWeeks = (fechaInicio, duracionSemanas) => {
  const start = toDate(fechaInicio);
  let dec = 0;
  for (let k = 0; k < duracionSemanas; k++) {
    const weekStart = addWeeks(start, k);
    const weekEnd = addDays(weekStart, 6);
    // Criterio vigente: tanto el inicio como el final deben caer en diciembre.
    if (isDecember(weekEnd) && isDecember(weekStart)) dec++;
  }
  return dec;
};

// cupos por segundos
const cuposFromSegundos = (segundos) => {
  if (!segundos) return 0;
  return Math.max(1, Math.round(segundos / 20)); // 20s->1, 40s->2, 60s->3
};

// $2'000.000 por CUPo y por semana en diciembre
const PRECIO_DIC_POR_CUPO = 2_000_000;

// lógica por pantalla (sencilla)
const calcularPrecio = (pantallaId) => {
  const segundos = duraciones[pantallaId];
  const baseNormalSemana = segundos && tarifas[segundos];
  if (!segundos || !baseNormalSemana || !duracion || !fechaInicio) {
    return 0;
  }

  const semanasDic = countDecemberWeeks(fechaInicio, duracion);
  const semanasFueraDic = Math.max(0, duracion - semanasDic);

  const cupos = cuposFromSegundos(segundos);
  const baseDicSemana = PRECIO_DIC_POR_CUPO * cupos;

  const totalFueraDic = baseNormalSemana * semanasFueraDic;
  const totalDic      = baseDicSemana   * semanasDic;

  // Descuento por DURACIÓN TOTAL (pero solo se aplica a la porción FUERA de dic)
  let rate = 0;
  if (duracion > 26) rate = 0.10;
  else if (duracion > 13) rate = 0.035;

  const total = totalFueraDic * (1 - rate) + totalDic;

  return {
    total,
    descuento: rate,
    base: totalFueraDic + totalDic,
    semanasDic,
    semanasFueraDic,
    baseNormalSemana,
    baseDicSemana,
    totalFueraDic,
    totalDic
  };
};

// SUBTOTAL y AHORRO (con las mismas reglas)
const subtotal = seleccionadas.reduce((acc, id) => acc + (calcularPrecio(id)?.total || 0), 0);

const ahorroTotal = seleccionadas.reduce((acc, id) => {
  const r = calcularPrecio(id);
  if (!r) return acc;
  return acc + (r.totalFueraDic || 0) * (r.descuento || 0); // descuento solo sobre fuera de dic
}, 0);

const formatCOP = (n) =>
  (n ?? 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const buildPrecioLabel = (id) => {
  const r = calcularPrecio(id);
  if (!r) return 'Precio: -';

  const partes = [];

  // Semanas fuera de diciembre (con opción de mostrar el % de descuento)
  if (r.semanasFueraDic > 0) {
    partes.push(`${r.semanasFueraDic} sem a ${formatCOP(r.baseNormalSemana)}`);
  }

  // Semanas de diciembre (precio especial por cupo/semana)
  if (r.semanasDic > 0) {
    partes.push(`${r.semanasDic} sem dic a ${formatCOP(r.baseDicSemana)}`);
  }
  return `Precio: ${formatCOP(r.base)} (${partes.join(' + ')})`;
};





  /**
   * Muestra tooltip informativo para pantallas ocupadas, reservadas o parciales.
   */
  const handleTooltip = (pantalla) => {
    if ((pantalla.estado === 'parcial' || pantalla.estado === 'ocupado' || pantalla.estado === 'reservado') && pantalla.mensaje) {
      setTooltipInfo({ id: pantalla.id, mensaje: pantalla.mensaje });
      setTimeout(() => setTooltipInfo(null), 5000);
    }
  };
  // Elimina toda la selección actual
  const eliminarSeleccion = () => {
    setSeleccionadas([]);
    setDuraciones({});
  };


  /**
   * Determina si la selección actual puede ser confirmada.
   */
  const puedeConfirmar = seleccionadas.length > 0 && seleccionadas.every(id => duraciones[id]);

  if (loading) {
    return <VideoLoader />;
  }
  return (
    <div className="bg-gray-50 p-4 md:p-6 flex flex-col min-h-full">
      <h2 className="text-2xl font-bold text-center mb-2">Mapa de disponibilidad</h2>
      <BusquedaInline
        fechaInicio={fechaInicio}
        duracion={duracion}
        categoria={categoria}
        onChange={({ fechaInicio, duracion, categoria }) => {
          setFechaInicio(fechaInicio);
          setDuracion(duracion);
          setCategoria(categoria);
        }}
        onBuscar={async (fecha, semanas, cat) => {
          setLoading(true); // 👉 inicia loader
          try {
            const res = await api.post('/reservas/disponibilidad', {
              fecha_inicio: fecha,
              duracion_semanas: semanas,
              categoria: cat,
              excluir_prereserva_id: isEditando ? prereserva?.edicion?.id_prereserva : undefined
            });
            setSeleccionadas([]);
            setDuraciones({});
            setTooltipInfo(null);
            setData(res.data);
          } catch (error) {
            await Swal.fire({
            title: 'Error al consultar',
            text: 'No se pudo obtener disponibilidad. Intenta de nuevo.',
            icon: 'error',
            confirmButtonText: 'Ok'
          });
            console.error(error);
          }finally {
            setLoading(false); // 👉 termina loader
          }
        }}
      />

      {cilindroSeleccionado && (
        <CilindroModal
          cilindro={cilindroSeleccionado}
          onClose={() => setCilindroSeleccionado(null)}
        />
      )}

      <div className="flex flex-col lg:flex-row gap-6 w-full overflow-hidden">  
        {/* Mapa de pantallas agrupadas por cilindro */}
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
          {/* Leyenda de estados */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-black rounded" /> Seleccionada</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-300 rounded" /> Ocupado</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-300 rounded" /> Reservado</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-200 rounded" /> Disponible</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-300 rounded" /> Parcialmente ocupada</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded" /> Restringido</div>
          </div>
          {/* Tooltip informativo */}
          {tooltipInfo && (
            <div className="fixed bottom-4 right-4 bg-black text-white text-xs px-4 py-2 rounded shadow z-50 whitespace-pre-line">
              {tooltipInfo.mensaje}
              <button onClick={() => setTooltipInfo(null)} className="ml-4 text-red-300">✖</button>
            </div>
          )}
        </div>
        

        {/* Resumen de selección y acciones */}
        <div className="w-full lg:w-80 border rounded p-4 bg-white shadow flex flex-col max-h-[85vh]">
          <div className="overflow-y-auto pr-2 flex-1">
            {/* --- Selección mágica --- */}
            <div className="mb-4 border rounded p-3 bg-violet-50/40">
              <p className="font-semibold text-violet-700 mb-2">Selección mágica</p>

              <div className="grid grid-cols-2 gap-2 items-end">
                <div>
                  <label className="block text-xs text-gray-600">Cantidad de pantallas</label>
                  <input
                    type="number"
                    min={1}
                    value={magicCantidad}
                    onChange={(e) => setMagicCantidad(Math.max(1, parseInt(e.target.value || '1', 10)))}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600">Cupos por pantalla</label>
                  <select
                    value={magicSegundos}
                    onChange={(e) => setMagicSegundos(parseInt(e.target.value, 10))}
                    className="w-full border rounded px-2 py-1 bg-white text-sm"
                  >
                    <option value={20}>1 cupo (20s)</option>
                    <option value={40}>2 cupos (40s)</option>
                    <option value={60}>3 cupos (60s)</option>
                  </select>
                </div>
              </div>

              {/* Botonera pequeña y responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs sm:text-sm rounded-md bg-violet-600 text-white hover:bg-violet-700"
                  onClick={() => aplicarSeleccionMagica(false)}
                >
                  Agregar
                </button>

                <button
                  type="button"
                  className="px-3 py-1.5 text-xs sm:text-sm rounded-md border bg-white text-gray-700 hover:bg-gray-50"
                  onClick={() => aplicarSeleccionMagica(true)}
                >
                  Limpiar y aplicar
                </button>
              </div>

              
            </div>

            <p className="text-lg font-bold mb-2 text-violet-700">Resumen selección</p>
            <p className="text-lg mb-2 text-violet-700">Fechas pauta </p>
            <p className="text-lg mb-2">Fecha inicio:  {fechaInicio || '---'}  </p>
            <p className="text-lg mb-2">Fechas fin:  {calcularFechaFin() || '---'} </p>
            <p className="text-lg mb-2 text-violet-700">Categoría: {categoria || '---'} </p>
            <p className="text-lg font-bold mb-2 text-violet-700"> - - - - - - </p>
            {seleccionadas.length === 0 ? (
              <p className="text-sm text-gray-500">No has seleccionado pantallas aún.</p>
            ) : (
              <ul className="text-sm space-y-3 mb-4">
                {seleccionadas.map((id) => {
                  const info = dataVisual[id];
                  const segundosDisp = info.segundos_disponibles;
                  const esPantallaDeMiPrereserva = isEditando && prereserva?.edicion?.pantallas?.some(p => p.id_pantalla === id);
                  const opciones = esPantallaDeMiPrereserva ? [20, 40, 60] : [20, 40, 60].filter(op => op <= segundosDisp);

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
                        <option value="">Duración (cupos)</option>
                        {opciones.map((seg) => (
                          <option key={seg} value={seg}>{seg/20} cupo{seg/20 > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                      <span className="text-right text-xs mt-1 text-gray-500">

                          {buildPrecioLabel(id)}
                        
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="text-sm font-semibold text-right pt-2 border-t mt-2">

            Subtotal base: <span className="text-violet-700">${(subtotal+ahorroTotal).toLocaleString('es-CO')}</span>

            {ahorroTotal > 0 && <div className="text-xs text-red-600 text-right">
            Descuento aplicado: ${ahorroTotal.toLocaleString('es-CO')} ({((ahorroTotal/subtotal) * 100).toFixed(1)}%)

            </div>}

            
            {ahorroTotal > 0 && (
              <div className="text-sm font-semibold text-right pt-2 border-t mt-2">
              Subtotal con descuento:
              <span className="text-violet-700">
                 ${subtotal.toLocaleString('es-CO')}
              </span>
              </div>
            )}
          </div>
          
      {/* Botón para confirmar selección */}
      <button
        disabled={!puedeConfirmar}
        className="w-full bg-violet-600 text-white py-2 mt-2 rounded disabled:bg-gray-300"
        onClick={() => {
          const payload = seleccionadas.map(id => {
            const segundos = duraciones[id];
            const precio = calcularPrecio(id);
            const cod_tarifas = get_code[segundos];
            return {
              id_pantalla: id,
              cilindro: dataVisual[id].cilindro,
              identificador: dataVisual[id].identificador,
              segundos,
              cod_tarifas,
              precio: precio?.total || 0,
              base: precio?.base || 0,
              descuento: precio?.descuento || 0
            };
          });
          if (isEditando) {
              setPrereserva({
                ...prereserva,
                edicion: {
                  ...prereserva.edicion,
                  fecha_inicio: fechaInicio,
                  duracion,
                  categoria,
                  pantallas: payload,
                  uxid: prereserva.edicion.uxid,
                }
              });
              navigate('/cliente/pre-orden')
            }else{
              navigate('/cliente/pre-orden', {
                state: {
                  fecha_inicio: fechaInicio,
                  duracion,
                  categoria,
                  pantallas: payload,
                  disponibilidad: data
                }
              });
          }
        }}
      >
        Confirmar reserva
      </button>
      {/* Botón para cancelar selección */}
      <button
        onClick={() => navigate('/cliente/reserva')}
        className="w-full bg-black text-white py-2 mt-2 rounded disabled:bg-gray-300"
      >
        Cancelar reserva
      </button>
      <button
        type="button"
        className="px-3  text-xs sm:text-sm rounded-md py-2 mt-2 bg-rose-600 text-white hover:bg-rose-700"
        onClick={eliminarSeleccion}
      >
        Borrar selección
      </button>
        </div>
      </div>
    </div>
  );
}
