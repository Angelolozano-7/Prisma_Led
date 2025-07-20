import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export let options = {
  vus: 3,
  iterations: 3,
};

const BASE_URL = 'http://127.0.0.1:5000';
const PASSWORD = 'Que.3902211!';

export default function () {
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

    const rawDisponibles = resDisponibilidad.json();

    const pantallasValidas = Object.entries(rawDisponibles)
    .filter(([_, p]) => p.estado === 'disponible')
    .map(([id_pantalla, p]) => ({
        id_pantalla,
        cod_tarifas: 'a' // por ahora usamos tarifa fija, puedes hacerla dinámica
    }));

    if (pantallasValidas.length === 0) {
    console.warn('❌ No hay pantallas disponibles para reserva');
    return;
    }

const payloadPantallas = pantallasValidas.slice(0, 1); // solo una pantalla

  sleep(1);

  // Crear prerreserva
  const fecha_inicio = "2025-08-01";
  const fecha_fin = "2025-08-14";

  const prerreserva = http.post(`${BASE_URL}/api/prereservas/crear`, JSON.stringify({
    fecha_inicio, fecha_fin, categoria: "Alimentos y Bebidas",
  }), { headers: authHeaders });

  check(prerreserva, {
    'prerreserva creada': (r) => r.status === 201,
  });

  const id_prereserva = prerreserva.json('id_prereserva');
  if (!id_prereserva) return;

  sleep(1);

  // Crear detalle prereserva
  const detalle = http.post(`${BASE_URL}/api/prereservas/detalle_prereserva/crear`, JSON.stringify({
    id_prereserva,
    pantallas: payloadPantallas,
    categoria: "Alimentos y Bebidas",
  }), { headers: authHeaders });

  check(detalle, {
    'detalle creado': (r) => r.status === 201,
  });

  sleep(1);

  // Opcional: enviar correo (si está habilitado)
  /*
  const confirmacion = http.post(`${BASE_URL}/api/prereservas/enviar-correo`, JSON.stringify({
    id_prereserva,
    correo,
    razon_social: `Empresa ${uid}`,
    nit,
    fecha_inicio,
    fecha_fin,
    categoria: "comercial",
    pantallas: seleccionadas.map(p => ({
      ...p,
      base: 1400000, // solo si necesitas campos para correo
      precio: 1400000,
    })),
    subtotal: 1400000,
    iva: 266000,
    total: 1666000,
    duracion: 1,
  }), { headers: authHeaders });

  check(confirmacion, {
    'correo enviado o aceptado': (r) => [200, 409].includes(r.status),
  });
  */

  sleep(1);
}