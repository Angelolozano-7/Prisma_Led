export function getUserFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const payloadBase64 = token.split('.')[1];
    const decoded = JSON.parse(atob(payloadBase64));
    
    // Flask-JWT-Extended pone el payload en "sub" por defecto, si se usó identity=...
    return decoded.sub || decoded;
  } catch (error) {
    console.error("Error al decodificar el token JWT:", error);
    return null;
  }
}
