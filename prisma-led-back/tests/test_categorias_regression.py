"""Regresiones C06/C07 sin red ni credenciales.

Ejecutar desde prisma-led-back: python -m unittest discover -s tests -v
Extrae las funciones por AST y sustituye Sheets, request y jsonify.
No valida decoradores JWT, routing Flask ni sincronización con AppSheet.
"""
import ast
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
import unittest

ROOT = Path(__file__).resolve().parents[1] / 'app' / 'routes'


def load_function(filename, name, env):
    tree = ast.parse((ROOT / filename).read_text(encoding='utf-8'))
    node = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == name)
    node.decorator_list = []
    exec(compile(ast.Module(body=[node], type_ignores=[]), filename, 'exec'), env)
    return env[name]


class CategoriaDetalleTests(unittest.TestCase):
    def query(self, reserva_id, detalles, user='C1'):
        reservas = [dict(id_prereserva=i, id_cliente='C1', fecha_inicio='2026-11-01',
                         fecha_fin='2026-11-08', fecha_creacion='2026-10-27') for i in ['A', 'B']]
        env = dict(get_jwt_identity=lambda: user, get_prereservas=lambda: reservas,
                   get_detalle_prereserva=lambda: detalles,
                   get_pantallas=lambda: [dict(id_pantalla='P1', cilindro=1, identificador='A')],
                   get_tarifas=lambda: [dict(codigo_tarifa='T1', duracion_seg=20, precio_semana=100)],
                   jsonify=lambda x: x, pd=SimpleNamespace(to_datetime=datetime.fromisoformat))
        return load_function('prereservas.py', 'obtener_detalle_reserva', env)(reserva_id)

    def test_reservas_de_distinta_categoria_en_ambos_ordenes(self):
        detalles = [dict(id_prereserva=i, id_pantalla='P1', codigo_tarifa='T1', categoria=c)
                    for i, c in [('A', 'Alimentos'), ('B', 'Automóviles')]]
        for rows in [detalles, list(reversed(detalles))]:
            for i, expected in [('A', 'Alimentos'), ('B', 'Automóviles')]:
                with self.subTest(order=rows[0]['id_prereserva'], reserva=i):
                    body, status = self.query(i, rows)
                    self.assertEqual(status, 200)
                    self.assertEqual(body['categoria'], expected)
                    self.assertEqual(len(body['pantallas']), 1)
                    self.assertEqual(body['pantallas'][0]['precio'], 100)

    def test_sin_detalles_no_hereda_categoria_ajena(self):
        rows = [dict(id_prereserva='A', id_pantalla='P1', codigo_tarifa='T1', categoria='Alimentos')]
        body, status = self.query('B', rows)
        self.assertEqual((status, body['categoria'], body['pantallas']), (200, '', []))

    def test_no_autorizada(self):
        self.assertEqual(self.query('A', [], user='C2')[1], 404)

    def test_inexistente(self):
        self.assertEqual(self.query('NO_EXISTE', [])[1], 404)


class AltaCategoriaTests(unittest.TestCase):
    def call(self, payload, existing=(), fail=False):
        writes = []
        def append(row):
            if fail:
                raise RuntimeError('Fallo simulado')
            writes.append(row)
        ws = SimpleNamespace(get_all_records=lambda: [{'nombre': n} for n in existing], append_row=append)
        env = dict(request=SimpleNamespace(get_json=lambda **kwargs: payload), jsonify=lambda x: x,
                   connect_sheet=lambda: SimpleNamespace(worksheet=lambda name: ws))
        result = load_function('categorias.py', 'agregar_categoria', env)()
        return result, writes

    def test_alta_una_columna_y_nombre_limpio(self):
        (body, status), writes = self.call({'nombre': '  Automóviles  '})
        self.assertEqual(status, 201)
        self.assertEqual(body, {'nombre': 'Automóviles'})
        self.assertEqual(writes, [['Automóviles']])

    def test_duplicado_sin_escrituras(self):
        for nombre in ['Alimentos', ' alimentos ', 'ALIMENTOS']:
            with self.subTest(nombre=nombre):
                (_, status), writes = self.call({'nombre': nombre}, [' Alimentos '])
                self.assertEqual(status, 409)
                self.assertEqual(writes, [])

    def test_payload_invalido_sin_escrituras(self):
        for payload in [None, [], {}, {'nombre': None}, {'nombre': 123}, {'nombre': ''}, {'nombre': '   '}]:
            with self.subTest(payload=payload):
                (_, status), writes = self.call(payload)
                self.assertEqual(status, 400)
                self.assertEqual(writes, [])

    def test_error_almacenamiento(self):
        (_, status), writes = self.call({'nombre': 'Nueva'}, fail=True)
        self.assertEqual(status, 500)
        self.assertEqual(writes, [])


if __name__ == '__main__':
    unittest.main()
