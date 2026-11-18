import os
from datetime import datetime

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from login import SANDI_PENJUAL, SANDI_PENJUAL_BAWAAN, login_bp
from menu import menu_bp
from pelanggan import pelanggan_bp
from pesanan import pesanan_bp
from rekap import rekap_bp

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
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS, "max_age": 600}})
app.register_blueprint(login_bp)
app.register_blueprint(menu_bp)
app.register_blueprint(pelanggan_bp)
app.register_blueprint(pesanan_bp)
app.register_blueprint(rekap_bp)


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
    if SANDI_PENJUAL == SANDI_PENJUAL_BAWAAN and HOST not in ("127.0.0.1", "localhost"):
        print("PERINGATAN: kata sandi penjual masih bawaan. Isi PESANDULU_SANDI_PENJUAL sebelum aplikasi dibuka untuk umum.")
    app.run(host=HOST, port=PORT)
