import os
from datetime import datetime

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from menu import menu_bp
from pelanggan import pelanggan_bp
from pesanan import pesanan_bp

HOST = os.environ.get("PESANDULU_HOST", "127.0.0.1")
PORT = int(os.environ.get("PESANDULU_PORT", "5000"))
ALLOWED_ORIGINS = [
    asal.strip()
    for asal in os.environ.get(
        "PESANDULU_ALLOWED_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500",
    ).split(",")
    if asal.strip()
]
PESAN_GALAT = {
    404: "Alamat tidak ditemukan.",
    405: "Metode tidak diizinkan untuk alamat ini.",
    500: "Terjadi kesalahan di server.",
}

app = Flask(__name__)
app.json.sort_keys = False
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})
app.register_blueprint(menu_bp)
app.register_blueprint(pelanggan_bp)
app.register_blueprint(pesanan_bp)


@app.get("/api/status")
def status():
    return jsonify(
        {
            "aplikasi": "PesanDulu",
            "status": "ok",
            "waktu_server": datetime.now().isoformat(timespec="seconds"),
        }
    )


@app.errorhandler(HTTPException)
def galat_http(galat):
    return jsonify({"pesan": PESAN_GALAT.get(galat.code, galat.name)}), galat.code


if __name__ == "__main__":
    app.run(host=HOST, port=PORT)
