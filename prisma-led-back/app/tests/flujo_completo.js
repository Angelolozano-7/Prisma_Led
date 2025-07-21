/**
 * Script de prueba de flujo completo para prisma-led-back usando k6.
 *
 * Este script automatiza el test de onboarding y reserva de un usuario, simulando el flujo real de la aplicación:
 * 1. Registro de usuario y empresa con datos únicos en cada iteración para evitar colisiones.
 * 2. Login y verificación de obtención de JWT.
 * 3. Consulta de disponibilidad de pantallas para una fecha, duración y categoría.
 * 4. Creación de prereserva y 
 * 5. Creación de detalle de prereserva con pantallas seleccionadas.
 *
 * Características clave:
 * - Cada iteración genera datos únicos para usuario, correo y NIT, permitiendo pruebas concurrentes y robustas.
 * - Verifica el éxito en cada paso usando checks de k6, asegurando la correcta respuesta de la API.
 * - Permite ajustar el número de usuarios virtuales y repeticiones para pruebas de carga y estrés.
 * - El flujo puede ser extendido para probar otros endpoints o escenarios de error.
 *
 * Futuro desarrollador:
 * - Puedes agregar validaciones adicionales, pruebas de error, o extender el flujo para cubrir más casos de negocio.
 * - El script puede ser adaptado para pruebas en ambientes de staging, QA o producción.
 * - Los datos de tarifas y pantallas pueden ser parametrizados para mayor flexibilidad.
 */

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
    'recibe JWT': (r) => !!r.json('token'),
  });

  const token = resLogin.json('token');
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

  // Selecciona pantallas disponibles
  const pantallasValidas = Object.entries(rawDisponibles)
    .filter(([_, p]) => p.estado === 'disponible')
    .map(([id_pantalla, p]) => ({
      id_pantalla,
      cod_tarifas: 'a' // puedes hacer dinámico según tu lógica de tarifas
    }));

  if (pantallasValidas.length === 0) {
    console.warn('❌ No hay pantallas disponibles para reserva');
    return;
  }

  const payloadPantallas = pantallasValidas.slice(0, 1); // solo una pantalla

  sleep(1);

  // Paso 4: Crear prerreserva
  const fecha_inicio = "2025-08-01";
  const fecha_fin = "2025-08-14";

  const prerreserva = http.post(`${BASE_URL}/api/prereservas/crear-completo`, JSON.stringify({
          fecha_inicio,
          fecha_fin,
          categoria: "Alimentos y Bebidas",
          duracion: "2",
          pantallas: payloadPantallas
}), { headers: authHeaders });
  check(prerreserva, {
    'prerreserva creada': (r) => r.status === 201,
  });

  const id_prereserva = prerreserva.json('id_prereserva');
  if (!id_prereserva) return;
  console.log(`✅ Prerreserva creada con ID: ${id_prereserva}`);
  sleep(1);
}