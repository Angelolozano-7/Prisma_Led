import PantallaItem from './PantallaItem';

export default function CilindroBox({ cilindro, pantallas, seleccionadas, onToggleSeleccion, onMostrarImagen }) {
  return (
    <div className="w-full max-w-[160px] border border-gray-300 p-3 rounded-md shadow text-center space-y-2 bg-white">
      <button
        className="text-xs font-semibold underline text-violet-700 hover:text-violet-900 break-words"
        onClick={() => onMostrarImagen(cilindro)}
      >
        Cilindro {cilindro}
      </button>
      <div className="flex justify-center flex-wrap gap-1">
        {pantallas.map(({ id, data }) => (
          <PantallaItem
            key={id}
            pantallaId={id}
            data={data}
            seleccionada={seleccionadas.includes(id)}
            onToggleSeleccion={onToggleSeleccion}
          />
        ))}
      </div>
    </div>
  );
}
