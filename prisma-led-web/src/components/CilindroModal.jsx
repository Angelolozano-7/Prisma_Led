import { useEffect, useState } from 'react';

export default function CilindroModal({ cilindro, onClose }) {
  const [imagenSrc, setImagenSrc] = useState(null);

  useEffect(() => {
    const extensiones = ['png', 'jpg', 'jpeg', 'webp'];

    const buscarImagen = async () => {
      for (let ext of extensiones) {
        try {
          const modulo = await import(`../assets/cilindro${cilindro}.${ext}`);
          setImagenSrc(modulo.default);
          return;
        } catch (error) {}
      }
      setImagenSrc(null);
    };

    buscarImagen();
  }, [cilindro]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded relative max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 text-xl hover:text-red-500"
        >
          ❌
        </button>
        <h3 className="text-lg font-semibold mb-3">Vista del cilindro {cilindro}</h3>
        {imagenSrc ? (
          <img src={imagenSrc} alt={`Cilindro ${cilindro}`} className="w-full h-auto rounded" />
        ) : (
          <p className="text-center text-sm text-gray-500">Imagen no disponible</p>
        )}
      </div>
    </div>
  );
}
