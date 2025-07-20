import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export let options = {
  stages: [
    { duration: '1m', target: 5 },  // bloque 1
    { duration: '1m', target: 10 },  // bloque 2
    { duration: '1m', target: 15 },  // bloque 3
    { duration: '30s', target: 0 },  // cierre
  ],
};

const BASE_URL = 'http://127.0.0.1:5000';
const PASSWORD = 'Que.3902211!';

export default function () {
  const uid = uuidv4().replace(/-/g, '').slice(0, 8); // ID corto y único
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

  const res = http.post(`${BASE_URL}/api/auth/register`, payload, { headers });

  check(res, {
    'registro exitoso o ya existe': (r) => r.status === 201 || r.status === 409,
    'respuesta válida': (r) => r.status >= 200 && r.status < 500,
  });

  sleep(2); // ayuda a distribuir mejor las peticiones dentro de cada bloque
}
