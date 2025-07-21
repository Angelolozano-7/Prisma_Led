/**
 * Servicio centralizado de API para prisma-led-web.
 *
 * Proporciona una instancia de Axios configurada para interactuar con el backend.
 * - Añade automáticamente el token JWT en cada petición si existe en localStorage.
 * - Implementa manejo de errores global:
 *   - Redirige al login si la sesión expira (401).
 *   - Reintenta automáticamente peticiones en caso de límite de peticiones (429) con backoff exponencial.
 *   - Muestra alertas amigables al usuario usando SweetAlert2.
 *
 * Uso recomendado: importar `api` en tus servicios y componentes para todas las llamadas HTTP.
 * Ejemplo:
 *   import api from './api';
 *   const res = await api.get('/pantallas');
 *
 * @module api
 */

import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = 'http://localhost:5000/api'; // Cambia según tu entorno (dev/prod)

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// Interceptor para añadir el token JWT en cada request si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Número máximo de reintentos para errores 429 (Too Many Requests)
const MAX_RETRIES = 3;

// Interceptor de respuesta para manejo global de errores y reintentos
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const currentPath = window.location.pathname;
    const isInAuth = currentPath.startsWith('/auth');

    // --- 1. Error 401: sesión expirada (redirige al login si no está ya en /auth)
    if (error.response?.status === 401 && !originalRequest._retry401 && !isInAuth) {
      originalRequest._retry401 = true;

      localStorage.removeItem('token');

      await Swal.fire({
        title: 'Sesión expirada',
        text: 'Tu sesión ha caducado. Por favor, vuelve a iniciar sesión.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });

      window.location.href = '/auth/login'; // Redirige al login
      return Promise.reject(error);
    }

    // --- 2. Error 429: Too Many Requests con backoff exponencial y alerta
    if (error.response?.status === 429 && !originalRequest._retry429) {
      originalRequest._retry429 = true;
      originalRequest._retries = originalRequest._retries || 0;

      if (originalRequest._retries < MAX_RETRIES) {
        originalRequest._retries += 1;

        const delay = Math.pow(2, originalRequest._retries) * 500 + Math.random() * 300;
        console.warn(`⏳ Reintentando por 429... intento ${originalRequest._retries}, espera: ${delay.toFixed(0)}ms`);
        await new Promise(res => setTimeout(res, delay));

        return api(originalRequest);
      } else {
        await Swal.fire({
          title: 'Límite alcanzado',
          text: 'Has realizado demasiadas solicitudes. Intenta nuevamente en unos segundos.',
          icon: 'warning',
          confirmButtonText: 'Cerrar'
        });
      }
    }

    // Otros errores se rechazan y pueden ser manejados por el componente llamador
    return Promise.reject(error);
  }
);

export default api;
