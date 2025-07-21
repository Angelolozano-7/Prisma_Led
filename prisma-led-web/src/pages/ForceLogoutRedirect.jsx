/**
 * ForceLogoutRedirect: Componente para forzar cierre de sesión y redirigir al login.
 *
 * Limpia el token JWT de localStorage y sessionStorage, y opcionalmente de cookies.
 * Se usa como ruta catch-all para manejar errores, rutas inválidas o sesión expirada.
 * Redirige automáticamente al login usando <Navigate /> de react-router-dom.
 *
 * Detalles clave:
 * - Elimina cualquier rastro de sesión para evitar acceso no autorizado.
 * - Puedes agregar limpieza de otros datos sensibles si tu app lo requiere.
 * - El componente es seguro y desacoplado de la lógica de autenticación.
 *
 * Futuro desarrollador:
 * - Si cambias el método de almacenamiento de sesión, ajusta la limpieza aquí.
 * - Puedes mostrar un mensaje de "Sesión expirada" antes de redirigir si lo deseas.
 * - Úsalo como fallback en el router para proteger rutas no definidas.
 */

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
