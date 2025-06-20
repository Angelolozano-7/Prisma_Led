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
