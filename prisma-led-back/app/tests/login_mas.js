/**
 * Script de prueba de carga para el login masivo de usuarios en prisma-led-back usando k6.
 *
 * Utiliza una lista de correos previamente registrados y simula intentos de autenticación concurrentes.
 * Verifica que el login sea exitoso (status 200) y que se reciba un JWT válido.
 * Configura usuarios virtuales y número de iteraciones para simular concurrencia.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 2,             // hasta 2 usuarios en paralelo
  iterations: 40,     // 40 intentos (1 por correo)
};

const BASE_URL = 'http://127.0.0.1:5000';
const PASSWORD = 'Que.3902211!';

// Lista de correos proporcionados
const correos = [
  "test_ed79e974@demo.com", "test_beaaaab6@demo.com", "test_cf16039a@demo.com",
  "test_6d634506@demo.com", "test_62d5db9e@demo.com", "test_cddebda5@demo.com",
  "test_9080332b@demo.com", "test_b91e682d@demo.com", "test_d9b4a00b@demo.com",
  "test_b170ef82@demo.com", "test_2be1c12b@demo.com", "user_c84b7722@demo.com",
  "user_8ad0e93a@demo.com", "user_d4ca06fe@demo.com", "user_c79cc28f@demo.com",
  "user_9a779e86@demo.com", "user_a2e91c05@demo.com", "user_07867a12@demo.com",
  "user_54fc6a89@demo.com", "user_b5109d0a@demo.com", "user_f555bc40@demo.com",
  "user_7719f93b@demo.com", "user_a702398c@demo.com", "user_0ef68a9e@demo.com",
  "user_32ceda85@demo.com", "user_1f7643b9@demo.com", "user_a5aaa2de@demo.com",
  "user_24bf2924@demo.com", "user_6e23cf71@demo.com", "user_a9d906d6@demo.com",
  "user_00d2b70d@demo.com", "user_9d5395d4@demo.com", "user_d4969f2d@demo.com",
  "user_d58c904c@demo.com", "user_245f12af@demo.com", "user_4ba73d08@demo.com",
  "user_2d1a63e6@demo.com", "user_8088e2f4@demo.com", "user_617328c7@demo.com",
  "user_13423364@demo.com"
];

export default function () {
  // Obtiene el correo correspondiente a la iteración actual
  const index = __ITER;
  const correo = correos[index];
  const headers = { 'Content-Type': 'application/json' };

  const loginPayload = JSON.stringify({
    correo: correo,
    password: PASSWORD,
  });

  // Realiza la petición de login
  const res = http.post(`${BASE_URL}/api/auth/login`, loginPayload, { headers });

  check(res, {
    'status 200': (r) => r.status === 200,
    'JWT recibido': (r) => !!r.json('access_token'),
  });

  sleep(0.5); // ligera pausa para no sobrecargar
}
