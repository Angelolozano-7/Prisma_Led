import { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';

export default function PantallaItem({ pantallaId, data, seleccionada, onToggleSeleccion }) {
  const { estado, identificador, cilindro, mensaje } = data;
  const [mostrarTooltip, setMostrarTooltip] = useState(false);
  const tooltipRef = useRef(null);

  const getColor = () => {
    if (seleccionada) return 'bg-black text-white';
    switch (estado) {
      case 'disponible': return 'bg-green-200 text-black';
      case 'reservado': return 'bg-blue-300 text-black';
      case 'ocupado': return 'bg-gray-300 text-black';
      case 'restringido': return 'bg-red-400 text-black';
      case 'parcial': return 'bg-yellow-200 text-black';
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
    e.stopPropagation();
    setMostrarTooltip((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
      setMostrarTooltip(false);
    }
  };

  useEffect(() => {
    if (mostrarTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      const timer = setTimeout(() => setMostrarTooltip(false), 6000);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        clearTimeout(timer);
      };
    }
  }, [mostrarTooltip]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative">
        <button
          className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-md border border-gray-300 flex items-center justify-center text-xs font-semibold ${getColor()} transition duration-150`}
          onClick={handleClick}
          title={`Cilindro ${cilindro} - ${identificador}`}
        >
          {identificador}
        </button>

        {(estado === 'parcial' || estado === 'restringido')&& (
          <button
            onClick={toggleTooltip}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow"
          >
            <Info size={12} className="text-blue-600" />
          </button>
        )}
      </div>

{mostrarTooltip && mensaje && (
  <div
    ref={tooltipRef}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
  >
    <div className="bg-white text-black text-sm px-4 py-3 rounded shadow max-w-sm w-[90%] relative">
      <button
        onClick={() => setMostrarTooltip(false)}
        className="absolute top-1 right-2 text-black text-lg"
      >
        ✖
      </button>
      <p className="whitespace-pre-line">{mensaje}</p>
    </div>
  </div>
)}


    </div>
  );
}
