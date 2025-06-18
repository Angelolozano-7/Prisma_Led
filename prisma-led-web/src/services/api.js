import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Ajusta si usas otra IP/puerto

// Axios base instance
const api = axios.create({
  baseURL: API_URL,
});

// Añadir token a cada petición si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
