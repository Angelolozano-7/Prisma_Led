import { useNavigate } from 'react-router-dom';

export default function EditarReserva() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center w-full h-[70vh] px-4">
      <div className="bg-white border border-gray-300 rounded p-6 max-w-md w-full text-center space-y-4">
        <label className="block text-sm font-semibold">Ingrese Número de reserva</label>
        <input
          type="text"
          placeholder="Value"
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <div className="flex justify-between mt-4">
          <button
            onClick={() => navigate('/cliente')}
            className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
          >
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
}
