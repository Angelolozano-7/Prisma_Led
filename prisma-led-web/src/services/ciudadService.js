import api from './api';

// Solo exportamos el POST porque el GET ya lo haces desde el context
export const postCiudad = async (nombre) => {
  const response = await api.post('/ciudades', { nombre });
  return response.data;
};
