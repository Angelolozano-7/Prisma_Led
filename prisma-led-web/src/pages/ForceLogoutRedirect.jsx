import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

export default function ForceLogoutRedirect() {
  useEffect(() => {
    // Limpia el token (ajusta según dónde lo guardes)
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    // Si usas cookies, aquí también deberías limpiarlas
    // document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }, []);

  // Redirige al login
  return <Navigate to="/auth/login" replace />;
}
