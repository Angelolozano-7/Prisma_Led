/**
 * Script de prueba de flujo completo para prisma-led-back usando k6.
 *
 * Simula el registro de usuario, login, y consulta de disponibilidad de pantallas.
 * Cada iteración genera datos únicos para evitar colisiones y prueba el flujo principal de onboarding.
 * Verifica el éxito en cada paso y la obtención de JWT.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export let options = {
  vus: 4,
  iterations: 4,
};

const BASE_URL = 'http://127.0.0.1:5000';
const PASSWORD = 'Que.3902211!';

export default function () {
  // Genera datos únicos para cada usuario
  const uid = uuidv4().replace(/-/g, '').slice(0, 8);
  const correo = `flow_${uid}@demo.com`;
  const nit = `900${Math.floor(Math.random() * 1000000)}-1`;

  const headers = { 'Content-Type': 'application/json' };

  // Paso 1: Registro
  const registroPayload = JSON.stringify({
    nombre_contacto: `Usuario ${uid}`,
    correo,
    telefono: `300${Math.floor(1000000 + Math.random() * 8999999)}`,
    password: PASSWORD,
    razon_social: `Empresa ${uid}`,
    nit,
    ciudad: "Cali",
    direccion: `Calle ${uid} #0-0`,
  });

  const resRegister = http.post(`${BASE_URL}/api/auth/register`, registroPayload, { headers });

  check(resRegister, {
    'registro exitoso o ya registrado': (r) => r.status === 201 || r.status === 409,
  });

  sleep(2); // pausa ligera

  // Paso 2: Login
  const loginPayload = JSON.stringify({
    correo,
    password: PASSWORD,
  });

  const resLogin = http.post(`${BASE_URL}/api/auth/login`, loginPayload, { headers });

  check(resLogin, {
    'login exitoso': (r) => r.status === 200,
    'recibe JWT': (r) => !!r.json('access_token'),
  });

  const token = resLogin.json('access_token');
  if (!token) return;

  // Paso 3: Disponibilidad
  const disponibilidadPayload = JSON.stringify({
    fecha_inicio: "2025-08-01",
    duracion_semanas: 2,
    categoria: "Alimentos y Bebidas",
  });

  const authHeaders = {
    ...headers,
    Authorization: `Bearer ${token}`,
  };

  const resDisponibilidad = http.post(`${BASE_URL}/api/reservas/disponibilidad`, disponibilidadPayload, { headers: authHeaders });

  check(resDisponibilidad, {
    'disponibilidad OK': (r) => r.status === 200,
  });

  sleep(2);
}
