/**
 * Script de prueba de carga para el registro de usuarios en prisma-led-back usando k6.
 *
 * Genera usuarios únicos en cada iteración y simula el proceso de registro.
 * Verifica que el registro sea exitoso (201) o que el usuario ya exista (409).
 * Configura etapas de carga progresiva para simular distintos niveles de concurrencia.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export let options = {
  stages: [
    { duration: '1m', target: 5 },   // bloque 1: 5 usuarios simultáneos
    { duration: '1m', target: 10 },  // bloque 2: 10 usuarios simultáneos
    { duration: '1m', target: 15 },  // bloque 3: 15 usuarios simultáneos
    { duration: '30s', target: 0 },  // cierre
  ],
};

const BASE_URL = 'http://127.0.0.1:5000';
const PASSWORD = 'Que.3902211!';

export default function () {
  // Genera datos únicos para cada usuario
  const uid = uuidv4().replace(/-/g, '').slice(0, 8);
  const correo = `user_${uid}@demo.com`;
  const nit = `90${Math.floor(1000000 + Math.random() * 8999999)}-1`;

  const payload = JSON.stringify({
    nombre_contacto: `Usuario ${uid}`,
    correo: correo,
    telefono: `300${Math.floor(1000000 + Math.random() * 8999999)}`,
    password: PASSWORD,
    razon_social: `Empresa ${uid}`,
    nit: nit,
    ciudad: "Cali",
    direccion: `Calle ${uid} #0-0`,
  });

  const headers = { 'Content-Type': 'application/json' };

  // Realiza la petición de registro
  const res = http.post(`${BASE_URL}/api/auth/register`, payload, { headers });

  check(res, {
    'registro exitoso o ya existe': (r) => r.status === 201 || r.status === 409,
    'respuesta válida': (r) => r.status >= 200 && r.status < 500,
  });

  sleep(2); // ayuda a distribuir mejor las peticiones dentro de cada bloque
}
