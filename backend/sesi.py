import secrets
from functools import wraps

from flask import g, jsonify, request

AWALAN_TOKEN = "Bearer "
SESI = {}


def buat_sesi(peran, id_pelanggan=None):
    token = secrets.token_urlsafe(32)
    SESI[token] = {"peran": peran, "pelanggan_id": id_pelanggan}
    return token


def baca_token():
    kepala = request.headers.get("Authorization", "")
    if kepala.startswith(AWALAN_TOKEN):
        return kepala[len(AWALAN_TOKEN):]
    return None


def sesi_sekarang():
    return SESI.get(baca_token())


def hapus_sesi_pelanggan(id_pelanggan):
    for token in [token for token, sesi in SESI.items() if sesi["pelanggan_id"] == id_pelanggan]:
        del SESI[token]


def tidak_berhak():
    return jsonify({"pesan": "Akun ini tidak berhak melakukan itu."}), 403


def wajib_login(*peran_diizinkan):
    def pembungkus(fungsi):
        @wraps(fungsi)
        def rute(*args, **kwargs):
            sesi = sesi_sekarang()
            if sesi is None:
                return jsonify({"pesan": "Login dulu untuk melanjutkan."}), 401
            if sesi["peran"] not in peran_diizinkan:
                return tidak_berhak()
            g.sesi = sesi
            return fungsi(*args, **kwargs)

        return rute

    return pembungkus
