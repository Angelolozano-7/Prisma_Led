/**
 * Página de reserva para prisma-led-web.
 * Ahora permite elegir periodo por Semanas o Meses (enteros),
 * pero siempre envía la duración unificada en semanas al backend.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../hooks/useAppData';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function Reserva() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [periodo, setPeriodo] = useState('week'); // 'week' | 'month'
  const [duracion, setDuracion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [aceptaCondicion, setAceptaCondicion] = useState(false);
  const [errores, setErrores] = useState({});
  const { categorias } = useAppData();

  const navigate = useNavigate();

  // ---- Helpers de periodo
  const limits = periodo === 'week' ? { min: 1, max: 52 } : { min: 1, max: 12 };
  const toInt = (v) => Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : '';

  const semanasDesdePeriodo = () => {
    const n = toInt(duracion);
    if (!n) return 0;
    return periodo === 'week' ? n : n * 4; // Regla: 1 mes = 4 semanas
  };

  // ---- Handlers
  const handleDuracionChange = (e) => {
    const value = toInt(e.target.value);
    if (!value) { setDuracion(''); return; }
    // validar según periodo
    if (value >= limits.min && value <= limits.max) {
      setDuracion(value);
      setErrores((prev) => ({ ...prev, duracion: null }));
    } else {
      setDuracion('');
    }
  };

  const handlePeriodoChange = (value) => {
    setPeriodo(value);
    setDuracion(''); // limpiar para evitar inconsistencias al cambiar de modo
    setErrores((prev) => ({ ...prev, duracion: null }));
  };

  const handleMostrarDisponibilidad = async () => {
    const nuevosErrores = {};
    if (!fechaInicio) nuevosErrores.fechaInicio = true;
    if (!duracion) nuevosErrores.duracion = true;
    if (!categoria) nuevosErrores.categoria = true;
    if (!aceptaCondicion) nuevosErrores.condicion = true;

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    try {
      const duracionSemanas = semanasDesdePeriodo();

      const payload = {
        fecha_inicio: fechaInicio,
        duracion_semanas: duracionSemanas,
        categoria: categoria,
        // periodo, // opcional, solo si quieres saber qué eligió el usuario
      };

      const res = await api.post('/reservas/disponibilidad', payload);

      navigate('/cliente/disponibilidad', {
        state: {
          disponibilidad: res.data,
          fecha_inicio: fechaInicio,
          duracion: duracionSemanas, // seguimos usando semanas hacia adelante
          categoria: categoria,
          // extra opcional para UI:
          _periodo_seleccionado: periodo,
          _duracion_original: duracion,
        }
      });
    } catch (error) {
      console.error('Error al consultar disponibilidad:', error);
      await Swal.fire({
        title: 'Error de conexión',
        text: 'No se pudo consultar la disponibilidad. Intenta más tarde.',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    }
  };

  // ---- Fecha fin basada en semanas unificadas
  const calcularFechaFin = () => {
    const dSemanas = semanasDesdePeriodo();
    if (!fechaInicio || !dSemanas) return '';
    const inicio = new Date(fechaInicio);
    inicio.setDate(inicio.getDate() + dSemanas * 7);
    return inicio.toISOString().split('T')[0];
  };

  // Fecha mínima para el input de fecha (hoy)
  const today = new Date();
  const localISODate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString().split('T')[0];

  return (
    <div className="flex flex-col items-center bg-white px-4 py-6 md:py-4">
      <h2 className="text-xl font-semibold mb-4 md:mb-6">Filtros de búsqueda</h2>

      <div className="grid md:grid-cols-2 gap-6 md:gap-10 w-full max-w-6xl items-start">

        {/* Filtros */}
        <div className="space-y-4 border border-gray-300 p-4 md:p-6 rounded-md">
          {/* Fecha inicio */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Fecha inicio:</label>
            <input
              type="date"
              value={fechaInicio}
              min={localISODate}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setErrores({ ...errores, fechaInicio: null });
              }}
              onKeyDown={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              className={`border rounded px-3 py-2 ${errores.fechaInicio ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errores.fechaInicio && (
              <p className="text-xs text-red-500 mt-1">Selecciona una fecha válida</p>
            )}
          </div>

          {/* Periodo: Semanas | Meses */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Periodo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePeriodoChange('week')}
                className={`px-3 py-2 rounded border ${
                  periodo === 'week' ? 'bg-violeta-medio text-white border-violeta-medio' : 'bg-white border-gray-300'
                }`}
              >
                Semanas
              </button>
              <button
                type="button"
                onClick={() => handlePeriodoChange('month')}
                className={`px-3 py-2 rounded border ${
                  periodo === 'month' ? 'bg-violeta-medio text-white border-violeta-medio' : 'bg-white border-gray-300'
                }`}
              >
                Meses
              </button>
            </div>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Duración ({periodo === 'week' ? 'semanas' : 'meses'})
            </label>
            <input
              type="number"
              min={limits.min}
              max={limits.max}
              value={duracion}
              onChange={handleDuracionChange}
              className={`w-full border rounded px-3 py-2 ${
                errores.duracion ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errores.duracion && (
              <p className="text-xs text-red-500 mt-1">Ingresa una duración válida</p>
            )}
            {periodo === 'month' && duracion && (
              <p className="text-xs text-gray-500 mt-1">
                Equivale a {semanasDesdePeriodo()} semana(s).
              </p>
            )}
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <div className="relative">
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className={`w-full border rounded px-3 py-2 appearance-none bg-white text-sm ${errores.categoria ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar</option>
                {categorias.map((cat) => (
                  <option key={cat.id_categoria} value={cat.nombre}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                ▼
              </div>
            </div>
            {errores.categoria && (
              <p className="text-xs text-red-500 mt-1">Selecciona una categoría</p>
            )}
          </div>

          {/* Checkbox obligatorio */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2 relative group">
              <input
                type="checkbox"
                id="competencia"
                className={`w-4 h-4 ${errores.condicion ? 'accent-red-500' : ''}`}
                checked={aceptaCondicion}
                onChange={(e) => setAceptaCondicion(e.target.checked)}
              />
              <label htmlFor="competencia" className="text-sm cursor-help">
                No competencia Emcali*
              </label>
              <div className="absolute top-full mt-1 left-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity w-64 z-10">
                Al seleccionar esta casilla, confirma que su marca no es competencia directa de Emcali; Telefonía hogar e internet hogar.
              </div>
            </div>
            {errores.condicion && (
              <span className="text-xs text-red-600 mt-1">
                Debes aceptar esta condición para continuar.
              </span>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div className="border border-gray-300 p-4 md:p-6 rounded-md bg-violeta-claro text-white space-y-2">
          <h3 className="font-semibold text-lg mb-2">Resumen</h3>
          <p>Fecha pauta: {fechaInicio || '---'} - {calcularFechaFin() || '---'}</p>
          <p>Categoría: {categoria || '---'}</p>
          {duracion ? (
            <p>
              Duración: {duracion} {periodo === 'week' ? 'semana(s)' : 'mes(es)'}
              {periodo === 'month' && <> ({semanasDesdePeriodo()} semana(s))</>}
            </p>
          ) : (
            <p>Duración: ---</p>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={() => navigate('/cliente')}
          className="mt-6 border-gray-400 hover:bg-gray-100 text-black py-2 px-10 rounded"
        >
          Cancelar
        </button>

        <button
          onClick={handleMostrarDisponibilidad}
          className="mt-6 bg-violeta-medio hover:bg-violeta-oscuro text-white py-2 px-6 rounded"
        >
          Mostrar disponibilidad
        </button>
      </div>
    </div>
  );
}
