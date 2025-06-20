import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setPopupVisible(false);

    try {
      const res = await api.post('/auth/login', { correo, password });
      localStorage.setItem('token', res.data.access_token);
      navigate('/cliente');
    } catch (err) {
      const msg = err.response?.data?.msg || 'Error de conexión';
      setMensaje(msg);
      setPopupVisible(true);
      setTimeout(() => setPopupVisible(false), 4000);
    }
  };

  return (
    <div className="relative bg-white p-6 rounded shadow-md w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Correo</label>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            type="password"
            placeholder="******"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          Iniciar sesión
        </button>
      </form>

      {/* POP-UP DE ERROR DENTRO DEL CONTENEDOR */}
      {popupVisible && (
        <div className="absolute top-[-70px] left-1/2 transform -translate-x-1/2 w-60 p-4 bg-white shadow-lg border border-gray-300 rounded-md flex flex-col items-center z-50">
          <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center">
            <AlertCircle className="text-white w-6 h-6" />
          </div>
          <p className="mt-2 text-center text-sm font-medium text-black">{mensaje}</p>
        </div>
      )}

      <div className="mt-4 text-sm text-center">
        <Link to="/auth/recovery" className="text-violeta-oscuro hover:underline block">
          ¿Olvidaste tu contraseña?
        </Link>
        <Link to="/perfil/registro" className="text-violeta-oscuro hover:underline block">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}
