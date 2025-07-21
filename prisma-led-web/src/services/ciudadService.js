/**
 * Servicio para registrar una nueva ciudad en prisma-led-web.
 *
 * Utiliza el método POST hacia el endpoint /ciudades.
 * Retorna la respuesta del backend con el mensaje correspondiente.
 *
 * @param {string} nombre - Nombre de la ciudad a registrar.
 * @returns {Promise<Object>} Respuesta del backend.
 */
import api from './api';

// Solo exportamos el POST porque el GET ya lo haces desde el context
export const postCiudad = async (nombre) => {
  const response = await api.post('/ciudades', { nombre });
  return response.data;
};
