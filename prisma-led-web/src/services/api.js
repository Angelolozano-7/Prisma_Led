import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Ajusta según tu entorno

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// Añadir token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ⚠️ Control centralizado de errores
const MAX_RETRIES = 3;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // --- 1. Error 401: sesión expirada
    if (error.response?.status === 401 && !originalRequest._retry401) {
      originalRequest._retry401 = true;

      localStorage.removeItem('token');
      alert('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');

      window.location.href = ''; // Ajusta si usas otra ruta
      return Promise.reject(error);
    }

    // --- 2. Error 429: Too Many Requests con backoff
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
        alert('⚠️ Se alcanzó el límite de solicitudes. Intenta nuevamente en unos segundos.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
