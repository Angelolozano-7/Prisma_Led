import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useEffect } from 'react';



export default function Reserva() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [duracion, setDuracion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [aceptaCondicion, setAceptaCondicion] = useState(false);
  const [errores, setErrores] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  useEffect(() => {
  const fetchCategorias = async () => {
    try {
      const res = await api.get('/categorias');
      setCategorias(res.data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };
  fetchCategorias();
  }, []);

  const navigate = useNavigate();

  const handleMostrarDisponibilidad = async () => {
    const nuevosErrores = {};
    if (!fechaInicio) nuevosErrores.fechaInicio = true;
    if (!duracion) nuevosErrores.duracion = true;
    if (!categoria) nuevosErrores.categoria = true;
    if (!aceptaCondicion) nuevosErrores.condicion = true;

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) return;

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

  const today = new Date();
  const localISODate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];

  const handleDuracionChange = (e) => {
    const value = parseInt(e.target.value);
    setDuracion(!isNaN(value) && value >= 1 && value <= 52 ? value : '');
  };

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
              className={`border rounded px-3 py-2 ${errores.fechaInicio ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errores.fechaInicio && (
              <p className="text-xs text-red-500 mt-1">Selecciona una fecha válida</p>
            )}
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
              className={`w-full border rounded px-3 py-2 ${
                errores.duracion ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errores.duracion && (
              <p className="text-xs text-red-500 mt-1">Ingresa una duración válida</p>
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

                {/* Flecha personalizada opcional */}
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
                className={`w-4 h-4 ${
                  errores.condicion ? 'accent-red-500' : ''
                }`}
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
