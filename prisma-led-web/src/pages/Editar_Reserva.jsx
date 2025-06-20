import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getUserFromToken } from '../services/decodeToken';

export default function EditarReserva() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState('');
  const [mensaje, setMensaje] = useState('');
  const user = getUserFromToken(); // 👈 Aquí se obtiene el ID del cliente

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        if (!user?.id) {
          setMensaje('No se pudo identificar al usuario.');
          return;
        }
        const res = await api.get(`/reservas/cliente/${user.id}`); // 👈 Aquí cambiamos la ruta
        setReservas(res.data);
      } catch (error) {
        setMensaje('No se pudieron cargar tus reservas');
      }
    };
    fetchReservas();
  }, [user]);

  const handleBuscar = () => {
    const match = reservas.find(r => r.id_reserva === reservaSeleccionada);
    if (match) {
      navigate('/cliente/disponibilidad', { state: match });
    } else {
      setMensaje('Reserva no encontrada o no pertenece a tu cuenta');
      setTimeout(() => setMensaje(''), 4000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-[70vh] px-4">
      <div className="bg-white border border-gray-300 rounded p-6 max-w-md w-full text-center space-y-4">
        <label className="block text-sm font-semibold">Ingrese Número de reserva</label>

        <input
          list="lista-reservas"
          value={reservaSeleccionada}
          onChange={(e) => setReservaSeleccionada(e.target.value)}
          placeholder="Ej: RES123"
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <datalist id="lista-reservas">
          {reservas.map((r, idx) => (
            <option key={idx} value={r.id_reserva} />
          ))}
        </datalist>

        {mensaje && <p className="text-red-600 text-sm mt-1">{mensaje}</p>}

        <div className="flex justify-between mt-4">
          <button
            onClick={() => navigate('/cliente')}
            className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleBuscar}
            className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800"
          >
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
}
