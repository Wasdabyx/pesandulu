import logging
import sys
from threading import Lock
from urllib.parse import quote

from flask import Flask, g, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from data import sekarang
from konfigurasi import ALLOWED_ORIGINS, BERKAS_DATA, HOST, HOST_LOKAL, PORT, berhenti, sandi_penjual_masih_contoh
from login import login_bp
from menu import menu_bp
from pelanggan import pelanggan_bp
from penyimpanan import muat, segarkan, selaraskan
from pesanan import pesanan_bp
from rekap import rekap_bp

try:
    from waitress import create_server
except ModuleNotFoundError:
    berhenti("Paket waitress belum terpasang. Pasang semua paket di requirements.txt, lihat README.")

UKURAN_ISI_TERBESAR = 1024 * 1024
PESAN_GALAT = {
    404: "Alamat tidak ditemukan.",
    405: "Metode tidak diizinkan untuk alamat ini.",
    413: "Isi permintaan terlalu besar.",
    500: "Terjadi kesalahan di server.",
}
PESAN_TIDAK_TERSIMPAN = "Perubahan tidak tersimpan di server. Coba lagi."
PERINGATAN_SANDI = "PERINGATAN: kata sandi penjual masih sama dengan contoh di .env.example. Ganti PESANDULU_SANDI_PENJUAL sebelum aplikasi dibuka untuk umum."

app = Flask(__name__)
app.json.sort_keys = False
app.config["MAX_CONTENT_LENGTH"] = UKURAN_ISI_TERBESAR
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS, "max_age": 600}})
app.register_blueprint(login_bp)
app.register_blueprint(menu_bp)
app.register_blueprint(pelanggan_bp)
app.register_blueprint(pesanan_bp)
app.register_blueprint(rekap_bp)
muat()
giliran = Lock()


@app.get("/api/status")
def status():
    return jsonify(
        {
            "aplikasi": "PesanDulu",
            "status": "ok",
            "waktu_server": sekarang(),
        }
    )


@app.before_request
def ambil_giliran():
    giliran.acquire()
    g.memegang_giliran = True
    segarkan()


@app.teardown_request
def lepas_giliran(galat):
    if g.pop("memegang_giliran", False):
        giliran.release()


@app.errorhandler(HTTPException)
def galat_http(galat):
    return jsonify({"pesan": PESAN_GALAT.get(galat.code, galat.name)}), galat.code


@app.after_request
def catat_permintaan(jawaban):
    print(f"{request.remote_addr} {request.method[:10]} {quote(request.path)[:200]} {jawaban.status_code}", flush=True)
    return jawaban


@app.after_request
def simpan_perubahan(jawaban):
    if selaraskan(jawaban.status_code < 400):
        return jawaban
    pengganti = jsonify({"pesan": PESAN_TIDAK_TERSIMPAN})
    pengganti.status_code = 503
    return pengganti


if __name__ == "__main__":
    print("Alamat front-end yang diizinkan: " + ", ".join(ALLOWED_ORIGINS), flush=True)
    print(f"Data disimpan di {BERKAS_DATA}.", flush=True)
    if sandi_penjual_masih_contoh() and not HOST_LOKAL:
        print(PERINGATAN_SANDI, flush=True)
    logging.getLogger("waitress.queue").setLevel(logging.ERROR)
    try:
        server = create_server(app, host=HOST, port=PORT, threads=1, max_request_body_size=UKURAN_ISI_TERBESAR)
    except OSError as galat:
        raise SystemExit(f"Back-end tidak bisa memakai alamat {HOST} port {PORT}: {galat.strerror}.") from None
    print(f"Back-end berjalan di {HOST} port {PORT}.", flush=True)
    server.run()
elif sandi_penjual_masih_contoh():
    print(PERINGATAN_SANDI, file=sys.stderr, flush=True)
