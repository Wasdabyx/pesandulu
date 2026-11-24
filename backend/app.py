from datetime import datetime

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from konfigurasi import ALLOWED_ORIGINS, HOST, HOST_LOKAL, PORT, sandi_penjual_masih_contoh
from login import login_bp
from menu import menu_bp
from pelanggan import pelanggan_bp
from pesanan import pesanan_bp
from rekap import rekap_bp

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
    print("Alamat front-end yang diizinkan: " + ", ".join(ALLOWED_ORIGINS), flush=True)
    if sandi_penjual_masih_contoh() and not HOST_LOKAL:
        print("PERINGATAN: kata sandi penjual masih sama dengan contoh di .env.example. Ganti PESANDULU_SANDI_PENJUAL sebelum aplikasi dibuka untuk umum.", flush=True)
    app.run(host=HOST, port=PORT, load_dotenv=False)
