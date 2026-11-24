import hmac

from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash

from data import PELANGGAN, cari, teks_utf8_sah
from konfigurasi import SANDI_PENJUAL
from pelanggan import rapikan_no_hp, tanpa_sandi
from sesi import SESI, baca_token, buat_sesi, sesi_sekarang

login_bp = Blueprint("login", __name__, url_prefix="/api")


def cari_pelanggan_login(no_hp, kata_sandi):
    if not isinstance(no_hp, str) or not teks_utf8_sah(kata_sandi):
        return None
    no_hp = rapikan_no_hp(no_hp)
    for pelanggan in PELANGGAN:
        if pelanggan["no_hp"] == no_hp and check_password_hash(pelanggan["kata_sandi"], kata_sandi):
            return pelanggan
    return None


@login_bp.post("/login")
def login():
    kiriman = request.get_json(silent=True)
    if not isinstance(kiriman, dict):
        return jsonify({"pesan": "Isi permintaan harus berupa JSON."}), 400

    peran = kiriman.get("peran")
    kata_sandi = kiriman.get("kata_sandi")
    if peran not in ("pelanggan", "penjual"):
        return jsonify({"pesan": "Peran harus pelanggan atau penjual."}), 400
    if not isinstance(kata_sandi, str) or not kata_sandi:
        return jsonify({"pesan": "Kata sandi wajib diisi."}), 400

    if peran == "penjual":
        if not teks_utf8_sah(kata_sandi) or not hmac.compare_digest(kata_sandi.encode(), SANDI_PENJUAL.encode()):
            return jsonify({"pesan": "Kata sandi salah."}), 401
        return jsonify({"token": buat_sesi("penjual"), "peran": "penjual", "pelanggan": None})

    pelanggan = cari_pelanggan_login(kiriman.get("no_hp"), kata_sandi)
    if pelanggan is None:
        return jsonify({"pesan": "Nomor HP atau kata sandi salah."}), 401
    return jsonify(
        {
            "token": buat_sesi("pelanggan", pelanggan["id"]),
            "peran": "pelanggan",
            "pelanggan": tanpa_sandi(pelanggan),
        }
    )


@login_bp.post("/logout")
def logout():
    SESI.pop(baca_token(), None)
    return "", 204


@login_bp.get("/sesi")
def lihat_sesi():
    sesi = sesi_sekarang()
    if sesi is None:
        return jsonify({"peran": None, "pelanggan": None})
    pelanggan = cari(PELANGGAN, sesi["pelanggan_id"])
    return jsonify({"peran": sesi["peran"], "pelanggan": tanpa_sandi(pelanggan) if pelanggan else None})
