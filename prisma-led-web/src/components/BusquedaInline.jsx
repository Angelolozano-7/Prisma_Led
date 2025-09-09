import { useState } from 'react';
import { useAppData } from '../hooks/useAppData';

export default function BusquedaInline({
  fechaInicio,
  duracion,
  categoria,
  onChange,
  onBuscar
}) {
  const { categorias } = useAppData();

  const [localFecha, setLocalFecha] = useState(fechaInicio || '');
  const [periodo, setPeriodo] = useState('week'); // 'week' | 'month'
  const [localDuracion, setLocalDuracion] = useState(duracion || '');
  const [localCategoria, setLocalCategoria] = useState(categoria || '');
  const [errores, setErrores] = useState({});

  const today = new Date();
  const localISODate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];

  const limits = periodo === 'week' ? { min: 1, max: 52 } : { min: 1, max: 12 };
  const toInt = (v) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : '';
  };

  const toWeeks = () => {
    const n = toInt(localDuracion);
    if (!n) return 0;
    return periodo === 'week' ? n : n * 4; // Regla: 1 mes = 4 semanas
  };

  const validarCampos = () => {
    const errs = {};
    if (!localFecha) errs.fecha = 'La fecha es obligatoria.';
    const n = toInt(localDuracion);
    if (!n || n < limits.min || n > limits.max) {
      errs.duracion =
        periodo === 'week'
          ? 'Duración entre 1 y 52 semanas.'
          : 'Duración entre 1 y 12 meses.';
    }
    if (!localCategoria) errs.categoria = 'Selecciona una categoría.';
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBuscar = () => {
    if (!validarCampos()) return;

    const duracionSemanas = toWeeks();

    // Notifica al padre el nuevo estado (duración en semanas)
    onChange?.({
      fechaInicio: localFecha,
      duracion: duracionSemanas,
      categoria: localCategoria,
      // metadata opcional, no rompe al padre:
      _periodo: periodo,
      _duracionOriginal: toInt(localDuracion),
    });

    // Mantiene la firma existente: (fecha, duracion_en_semanas, categoria)
    onBuscar?.(localFecha, duracionSemanas, localCategoria);
  };

  const handlePeriodo = (value) => {
    setPeriodo(value);
    // limpiamos la duración para evitar inconsistencias (ej: 40 meses)
    setLocalDuracion('');
    setErrores((e) => ({ ...e, duracion: null }));
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 text-sm text-gray-700 mb-4">
      {/* Fecha */}
      <div className="flex flex-col">
        <label>Fecha:</label>
        <input
          type="date"
          value={localFecha}
          min={localISODate}
          onChange={(e) => {
            setLocalFecha(e.target.value);
            setErrores({ ...errores, fecha: null });
          }}
          onKeyDown={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
          className="border border-gray-300 rounded px-2 py-1"
        />
        {errores.fecha && (
          <span className="text-red-500 text-xs mt-1">{errores.fecha}</span>
        )}
      </div>

      {/* Periodo: Semanas | Meses */}
      <div className="flex flex-col">
        <label>Periodo:</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handlePeriodo('week')}
            className={`px-3 py-1 rounded border ${
              periodo === 'week'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white border-gray-300'
            }`}
          >
            Semanas
          </button>
          <button
            type="button"
            onClick={() => handlePeriodo('month')}
            className={`px-3 py-1 rounded border ${
              periodo === 'month'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white border-gray-300'
            }`}
          >
            Meses
          </button>
        </div>
      </div>

      {/* Duración */}
      <div className="flex flex-col">
        <label>
          Duración: <span className="text-gray-500">({periodo === 'week' ? 'semanas' : 'meses'})</span>
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={limits.min}
            max={limits.max}
            value={localDuracion}
            onChange={(e) => {
              setLocalDuracion(e.target.value);
              setErrores({ ...errores, duracion: null });
            }}
            className="w-24 border border-gray-300 rounded px-2 py-1"
          />
          <span>{periodo === 'week' ? 'semanas' : 'meses'}</span>
        </div>
        {periodo === 'month' && toInt(localDuracion) && (
          <span className="text-xs text-gray-500 mt-1">
            Equivale a {toWeeks()} semana(s).
          </span>
        )}
        {errores.duracion && (
          <span className="text-red-500 text-xs mt-1">{errores.duracion}</span>
        )}
      </div>

      {/* Categoría */}
      <div className="flex flex-col">
        <label>Categoría:</label>
        <select
          value={localCategoria}
          onChange={(e) => {
            setLocalCategoria(e.target.value);
            setErrores({ ...errores, categoria: null });
          }}
          className="border border-gray-300 rounded px-2 py-1 bg-white"
        >
          <option value="">Seleccionar</option>
          {categorias.map((cat) => (
            <option key={cat.id_categoria} value={cat.nombre}>
              {cat.nombre}
            </option>
          ))}
        </select>
        {errores.categoria && (
          <span className="text-red-500 text-xs mt-1">{errores.categoria}</span>
        )}
      </div>

      {/* Botón */}
      <button
        onClick={handleBuscar}
        className="h-fit bg-violet-600 text-white px-4 py-2 mt-2 sm:mt-0 rounded hover:bg-violet-700"
      >
        Buscar
      </button>
    </div>
  );
}
