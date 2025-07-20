import http from 'k6/http';
import { check, group, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 20 },
    { duration: '30s', target: 0 },
  ],
};

const BASE_URL = 'http://127.0.0.1:5000';
const USER = 'publilatina@publilatina.com';
const PASS = 'Que.3902211!';

export default function () {
  group('Login', function () {
    let loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      correo: USER,
      password: PASS,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(loginRes, {
      'login OK': (res) => res.status === 200 && res.json('access_token'),
    });

    let token = loginRes.json('access_token');
    let authHeaders = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    // Obtener pantallas
    let pantallasRes = http.get(`${BASE_URL}/api/pantallas`, authHeaders);
    let pantallas = pantallasRes.json();
    let idPantalla = pantallas && pantallas.length > 0 ? pantallas[0].id_pantalla : null;

    // Obtener tarifas
    let tarifasRes = http.get(`${BASE_URL}/api/tarifas`, authHeaders);
    let tarifas = tarifasRes.json();
    let codTarifa = tarifas && tarifas.length > 0 ? tarifas[0].codigo_tarifa : null;

    if (!idPantalla || !codTarifa) {
      console.error('No se encontraron pantallas o tarifas válidas');
      return;
    }

    group('Disponibilidad', function () {
      http.post(`${BASE_URL}/api/reservas/disponibilidad`, JSON.stringify({
        fecha_inicio: '2025-08-01',
        duracion_semanas: 2,
        categoria: 'cervezas'
      }), authHeaders);
    });

    group('Crear prerreserva', function () {
      let crearRes = http.post(`${BASE_URL}/api/prereservas/crear`, JSON.stringify({
        fecha_inicio: '2025-08-01',
        fecha_fin: '2025-08-15',
        categoria: 'cervezas',
      }), authHeaders);

      let id_prereserva = crearRes.json('id_prereserva');

      group('Crear detalle de prerreserva', function () {
        let detalleRes = http.post(`${BASE_URL}/api/prereservas/detalle_prereserva/crear`, JSON.stringify({
          id_prereserva: id_prereserva,
          categoria: 'cervezas',
          pantallas: [{
            id_pantalla: idPantalla,
            cod_tarifas: codTarifa
          }]
        }), authHeaders);

        check(detalleRes, {
          'detalle creado o validado': (res) => res.status === 201 || res.status === 409,
        });
      });
    });
  });

  sleep(1);
}
