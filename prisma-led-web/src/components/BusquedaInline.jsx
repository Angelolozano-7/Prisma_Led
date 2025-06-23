import { useState } from 'react';

export default function BusquedaInline({ fechaInicio, duracion, categoria, onChange, onBuscar }) {
  const [localFecha, setLocalFecha] = useState(fechaInicio);
  const [localDuracion, setLocalDuracion] = useState(duracion);
  const [localCategoria, setLocalCategoria] = useState(categoria);
  const [errores, setErrores] = useState({});

  const validarCampos = () => {
    const nuevosErrores = {};
    if (!localFecha) nuevosErrores.fecha = 'La fecha es obligatoria.';
    if (!localDuracion || localDuracion < 1 || localDuracion > 52) nuevosErrores.duracion = 'Duración entre 1 y 52 semanas.';
    if (!localCategoria) nuevosErrores.categoria = 'Selecciona una categoría.';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleBuscar = () => {
    if (!validarCampos()) return;

    onChange({
      fechaInicio: localFecha,
      duracion: localDuracion,
      categoria: localCategoria
    });
    onBuscar(localFecha, localDuracion, localCategoria);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 text-sm text-gray-700 mb-4">
      <div className="flex flex-col">
        <label>Fecha:</label>
        <input
          type="date"
          value={localFecha}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => {
            setLocalFecha(e.target.value);
            setErrores({ ...errores, fecha: null });
          }}
          className="border border-gray-300 rounded px-2 py-1"
        />
        {errores.fecha && <span className="text-red-500 text-xs mt-1">{errores.fecha}</span>}
      </div>

      <div className="flex flex-col">
        <label>Duración:</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={52}
            value={localDuracion}
            onChange={(e) => {
              setLocalDuracion(e.target.value);
              setErrores({ ...errores, duracion: null });
            }}
            className="w-20 border border-gray-300 rounded px-2 py-1"
          />
          <span>semanas</span>
        </div>
        {errores.duracion && <span className="text-red-500 text-xs mt-1">{errores.duracion}</span>}
      </div>

      <div className="flex flex-col">
        <label>Categoría:</label>
        <select
          value={localCategoria}
          onChange={(e) => {
            setLocalCategoria(e.target.value);
            setErrores({ ...errores, categoria: null });
          }}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value="">Seleccionar</option>
          <option value="Bebidas alcoholicas">Bebidas alcohólicas</option>
          <option value="Tecnología">Tecnología</option>
          <option value="Moda">Moda</option>
        </select>
        {errores.categoria && <span className="text-red-500 text-xs mt-1">{errores.categoria}</span>}
      </div>

      <button
        onClick={handleBuscar}
        className="h-fit bg-violet-600 text-white px-4 py-2 mt-2 sm:mt-0 rounded hover:bg-violet-700"
      >
        Buscar
      </button>
    </div>
  );
}
