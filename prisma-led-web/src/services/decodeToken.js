/**
 * Extrae el ID de usuario desde el token JWT almacenado en localStorage.
 *
 * Decodifica el payload del token y retorna un objeto con el ID.
 * Si ocurre un error o no existe el token, retorna null.
 *
 * @returns {Object|null} Objeto con el id extraído del token o null si no es válido.
 */
export function getUserFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const payloadBase64 = token.split('.')[1];
    const decoded = JSON.parse(atob(payloadBase64));

    // Si el token contiene un ID plano en sub
    return { id: decoded.sub }; // Devolvemos siempre un objeto con id
  } catch (error) {
    console.error("Error al decodificar el token JWT:", error);
    return null;
  }
}
