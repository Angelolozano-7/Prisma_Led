import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Recovery() {
  const [correo, setCorreo] = useState('');
  const [visibleMsg, setVisibleMsg] = useState(false);
  const [correoVisible, setCorreoVisible] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setVisibleMsg(false);

    try {
      const res = await api.post('/auth/recovery', { correo });
      setCorreoVisible(res.data.correo_visible);
      setVisibleMsg(true);

      setTimeout(() => {
        setVisibleMsg(false);
        navigate('/auth/login');
      }, 5000);
    } catch (err) {
      setErrorMsg(err.response?.data?.msg || 'Error en la recuperación');
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        <div className="flex gap-4">
          <Link
            to="/auth/login"
            className="w-1/2 text-center text-black py-2 rounded hover:bg-gray-300"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="w-1/2 bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            Restablecer
          </button>
        </div>

        {visibleMsg && (
          <div className="text-center text-green-600 text-sm mt-4">
            Hemos enviado una contraseña temporal a <strong>{correoVisible}***</strong>
          </div>
        )}

        {errorMsg && (
          <div className="text-center text-red-600 text-sm mt-4 flex justify-center items-center gap-2">
            <span className="text-lg font-bold">!</span>
            <span>{errorMsg}</span>
          </div>
        )}
      </form>
    </div>
  );
}
