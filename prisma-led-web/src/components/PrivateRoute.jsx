/**
 * Protección de rutas privadas.
 *
 * Comprueba la presencia y expiración básica del JWT guardado en localStorage.
 * Si no existe, está vencido o no puede decodificarse, redirige a /auth/login.
 */

import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) return <Navigate to="/auth/login" replace />;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return <Navigate to="/auth/login" replace />;
    }
  } catch (error) {
    localStorage.removeItem('token');
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}
