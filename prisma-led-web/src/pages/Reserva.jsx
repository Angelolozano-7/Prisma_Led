import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // asegúrate de importar api correctamente


export default function Reserva() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [duracion, setDuracion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [aceptaCondicion, setAceptaCondicion] = useState(false);
  const [errorCheckbox, setErrorCheckbox] = useState(false);
  const navigate = useNavigate();

  const handleMostrarDisponibilidad = async () => {
    if (!aceptaCondicion) {
      setErrorCheckbox(true);
      return;
    }

    try {
      const payload = {
        fecha_inicio: fechaInicio,
        duracion_semanas: duracion,
        categoria: categoria
      };

      const res = await api.post('/reservas/disponibilidad', payload);
      navigate('/cliente/disponibilidad', {
        state: {
          disponibilidad: res.data,
          fecha_inicio: fechaInicio,
          duracion: duracion,
          categoria: categoria,
        }
      });


    } catch (error) {
      console.error('Error al consultar disponibilidad:', error);
      alert('No se pudo consultar la disponibilidad. Intenta más tarde.');
    }
  };

  const calcularFechaFin = () => {
    if (!fechaInicio || !duracion) return '';
    const inicio = new Date(fechaInicio);
    inicio.setDate(inicio.getDate() + parseInt(duracion) * 7);
    return inicio.toISOString().split('T')[0];
  };

  const today = new Date().toISOString().split('T')[0];

  const handleDuracionChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 52) {
      setDuracion(value);
    } else {
      setDuracion('');
    }
  };

  
  return (
    <div className="flex flex-col items-center bg-white px-4 py-6 md:py-4">
      <h2 className="text-xl font-semibold mb-4 md:mb-6">Filtros de búsqueda</h2>

      <div className="grid md:grid-cols-2 gap-6 md:gap-10 w-full max-w-6xl items-start">

        {/* Filtros */}
        <div className="space-y-4 border border-gray-300 p-4 md:p-6 rounded-md">
          {/* Fecha inicio */}
          <div>
            <label className="block text-sm font-medium mb-1">Fecha inicio</label>
            <div className="relative">
              <div
                className="w-full flex items-center justify-between border border-gray-300 rounded px-3 py-2 bg-white cursor-pointer"
                onClick={() => setMostrarCalendario(!mostrarCalendario)}
              >
                <span>
                  {fechaInicio ? new Date(fechaInicio).toLocaleDateString('es-CO') : 'dd/mm/aaaa'}
                </span>
                <Calendar className="w-5 h-5 text-violeta-medio" />
              </div>
              {mostrarCalendario && (
                <input
                  type="date"
                  min={today}
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    setMostrarCalendario(false);
                  }}
                  className="absolute top-full mt-2 w-full border border-gray-300 rounded px-3 py-2 bg-white z-10"
                />
              )}
            </div>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-sm font-medium mb-1">Duración (semanas)</label>
            <input
              type="number"
              min={1}
              max={52}
              value={duracion}
              onChange={handleDuracionChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Seleccionar</option>
              <option value="Bebidas alcoholicas">Bebidas alcohólicas</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Moda">Moda</option>
            </select>
          </div>

          {/* Checkbox obligatorio */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2 relative group">
              <input
                type="checkbox"
                id="competencia"
                className="w-4 h-4"
                checked={aceptaCondicion}
                onChange={(e) => setAceptaCondicion(e.target.checked)}
              />
              <label htmlFor="competencia" className="text-sm cursor-help">
                No competencia Emcali*
              </label>
              <div className="absolute top-full mt-1 left-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity w-64 z-10">
                Confirma que su marca no es competencia directa de Emcali
              </div>
            </div>
            {errorCheckbox && (
              <span className="text-xs text-red-600 mt-1">
                Debes aceptar esta condición para continuar.
              </span>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div className="border border-gray-300 p-4 md:p-6 rounded-md bg-violeta-claro text-white space-y-2">
          <h3 className="font-semibold text-lg mb-2">Resumen</h3>
          <p>Fecha pauta: {fechaInicio || '---'} – {calcularFechaFin() || '---'}</p>
          <p>Categoría: {categoria || '---'}</p>
        </div>
      </div>

      {/* Botón */}
      <button
        onClick={handleMostrarDisponibilidad}
        className="mt-6 bg-violeta-medio hover:bg-violeta-oscuro text-white py-2 px-6 rounded"
      >
        Mostrar disponibilidad
      </button>
    </div>
  );
}
