from flask import Flask, jsonify
from flask_cors import CORS
from utils.sheets import connect_sheet

app = Flask(__name__)
CORS(app)

@app.route('/api/reservas', methods=['GET'])
def get_reservas():
    # Conectamos al archivo completo
    spreadsheet = connect_sheet()

    # Aquí accedemos a la pestaña específica dentro del archivo
    sheet = spreadsheet.worksheet("reservas")  # 👈 ESTA ES LA LÍNEA QUE FALTABA

    # Obtenemos todos los registros como diccionarios
    data = sheet.get_all_records()

    # Enviamos como JSON
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
