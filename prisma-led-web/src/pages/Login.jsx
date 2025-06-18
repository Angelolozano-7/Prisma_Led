import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api'; 

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    try {
      const res = await api.post('/auth/login', { correo, password });
      localStorage.setItem('token', res.data.access_token);
      setMensaje('Login exitoso');
      // Redirigir, por ejemplo, a la página de inicio del cliente
      navigate('/cliente');
    } catch (err) {
      setMensaje('Credenciales inválidas o error de conexión');
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md w-full max-w-sm mx-auto">
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

      {mensaje && (
        <p className="mt-4 text-center text-sm text-red-600">{mensaje}</p>
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
