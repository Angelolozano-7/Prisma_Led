/**
 * Extrae el ID de usuario desde el token JWT almacenado en localStorage.
 *
 * Decodifica el payload del token (formato base64url) y retorna un objeto con el ID.
 * Si ocurre un error o no existe el token, retorna null.
 *
 * @returns {Object|null} Objeto con el id extraído del token o null si no es válido.
 */
export function getUserFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const payloadBase64Url = token.split('.')[1];
    if (!payloadBase64Url) return null;

    // Convertir base64url → base64 estándar
    const base64 = payloadBase64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(payloadBase64Url.length + (4 - payloadBase64Url.length % 4) % 4, '=');

    const decoded = JSON.parse(atob(base64));
    return { id: decoded.sub || null };
  } catch (error) {
    console.error("Error al decodificar el token JWT:", error);
    return null;
  }
}
