import { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react'; // Asegúrate de tener lucide-react o usa un ícono alternativo

export default function PantallaItem({ pantallaId, data, seleccionada, onToggleSeleccion }) {
  const { estado, identificador, cilindro, mensaje } = data;
  const [mostrarTooltip, setMostrarTooltip] = useState(false);
  const tooltipRef = useRef(null);

  const getColor = () => {
    if (seleccionada) return 'bg-black text-white';
    switch (estado) {
      case 'disponible': return 'bg-pink-200 text-black';
      case 'reservado': return 'bg-blue-300 text-black';
      case 'ocupado': return 'bg-gray-400 text-white';
      case 'restringido': return 'bg-red-300 text-black';
      case 'parcial': return 'bg-yellow-300 text-black';
      default: return 'bg-white text-black';
    }
  };

  const esSeleccionable = estado === 'disponible' || estado === 'parcial';

  const handleClick = () => {
    if (esSeleccionable) {
      onToggleSeleccion(pantallaId);
    }
  };

  const toggleTooltip = (e) => {
    e.stopPropagation(); // Evita que seleccione la pantalla al hacer clic en el ícono
    setMostrarTooltip(true);
  };

  const handleClickOutside = (event) => {
    if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
      setMostrarTooltip(false);
    }
  };

  useEffect(() => {
    if (mostrarTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      const timer = setTimeout(() => setMostrarTooltip(false), 5000);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        clearTimeout(timer);
      };
    }
  }, [mostrarTooltip]);

  return (
    <div className="relative">
      <button
        className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-md border border-gray-300 flex items-center justify-center text-xs font-semibold ${getColor()} transition duration-150 relative`}
        onClick={handleClick}
        title={`Cilindro ${cilindro} - ${identificador}`}
      >
        {identificador}
        {estado === 'parcial' && (
          <span
            onClick={toggleTooltip}
            className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-xs font-bold bg-white rounded-full shadow text-blue-600"
          >
            <Info size={10} />
          </span>
        )}
      </button>

      {mostrarTooltip && mensaje && (
        <div
          ref={tooltipRef}
          className="absolute z-10 bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded whitespace-nowrap shadow-md"
        >
          <div className="flex justify-between items-center mb-1">
            <span>{mensaje}</span>
            <button onClick={() => setMostrarTooltip(false)} className="ml-2 text-white">✖</button>
          </div>
        </div>
      )}
    </div>
  );
}
