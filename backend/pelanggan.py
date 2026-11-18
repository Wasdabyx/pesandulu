import re

from flask import Blueprint, g, jsonify, request

from data import PELANGGAN, cari, hash_sandi, id_baru, teks_utf8_sah
from pesanan import punya_pesanan_aktif
from sesi import hapus_sesi_pelanggan, tidak_berhak, wajib_login

PANJANG_NAMA_TERTINGGI = 50
PANJANG_SANDI_TERENDAH = 6
PANJANG_SANDI_TERTINGGI = 64
POLA_NO_HP = re.compile(r"08[0-9]{8,11}")

pelanggan_bp = Blueprint("pelanggan", __name__, url_prefix="/api/pelanggan")


def rapikan_no_hp(no_hp):
    angka = "".join(karakter for karakter in no_hp if karakter not in "-.()" and not karakter.isspace())
    if angka.startswith("+62"):
        return "0" + angka[3:]
    if angka.startswith("62"):
        return "0" + angka[2:]
    return angka


def periksa_isian(kiriman, pelanggan_lama=None):
    if not isinstance(kiriman, dict):
        return None, "Isi permintaan harus berupa JSON."

    isian = {**(pelanggan_lama or {}), **kiriman}
    nama = isian.get("nama")
    no_hp = isian.get("no_hp")
    kata_sandi = kiriman.get("kata_sandi")

    if not isinstance(nama, str) or not nama.strip():
        return None, "Nama wajib diisi."
    nama = " ".join(nama.split())
    if len(nama) > PANJANG_NAMA_TERTINGGI:
        return None, f"Nama paling panjang {PANJANG_NAMA_TERTINGGI} karakter."
    if not isinstance(no_hp, str) or not no_hp.strip():
        return None, "Nomor HP wajib diisi."
    no_hp = rapikan_no_hp(no_hp)
    if not POLA_NO_HP.fullmatch(no_hp):
        return None, "Nomor HP harus diawali 08 dan terdiri dari 10 sampai 13 angka."
    for pelanggan in PELANGGAN:
        if pelanggan is not pelanggan_lama and pelanggan["no_hp"] == no_hp:
            return None, "Nomor HP sudah terdaftar."

    if pelanggan_lama is not None and kata_sandi is None:
        return {"nama": nama, "no_hp": no_hp}, None
    if not isinstance(kata_sandi, str) or not PANJANG_SANDI_TERENDAH <= len(kata_sandi) <= PANJANG_SANDI_TERTINGGI:
        return None, f"Kata sandi harus {PANJANG_SANDI_TERENDAH} sampai {PANJANG_SANDI_TERTINGGI} karakter."
    if not teks_utf8_sah(kata_sandi):
        return None, "Kata sandi mengandung karakter yang tidak didukung."
    return {"nama": nama, "no_hp": no_hp, "kata_sandi": hash_sandi(kata_sandi)}, None


def tanpa_sandi(pelanggan):
    return {kunci: nilai for kunci, nilai in pelanggan.items() if kunci != "kata_sandi"}


def milik_orang_lain(id_pelanggan):
    return g.sesi["peran"] == "pelanggan" and g.sesi["pelanggan_id"] != id_pelanggan


def tidak_ditemukan():
    return jsonify({"pesan": "Pelanggan tidak ditemukan."}), 404


@pelanggan_bp.get("")
@wajib_login("penjual")
def daftar_pelanggan():
    return jsonify([tanpa_sandi(pelanggan) for pelanggan in PELANGGAN])


@pelanggan_bp.get("/<int:id_pelanggan>")
@wajib_login("penjual", "pelanggan")
def lihat_pelanggan(id_pelanggan):
    if milik_orang_lain(id_pelanggan):
        return tidak_berhak()
    pelanggan = cari(PELANGGAN, id_pelanggan)
    if pelanggan is None:
        return tidak_ditemukan()
    return jsonify(tanpa_sandi(pelanggan))


@pelanggan_bp.post("")
def daftarkan_pelanggan():
    isian, pesan = periksa_isian(request.get_json(silent=True))
    if pesan:
        return jsonify({"pesan": pesan}), 400
    pelanggan = {"id": id_baru("pelanggan"), **isian}
    PELANGGAN.append(pelanggan)
    return jsonify(tanpa_sandi(pelanggan)), 201


@pelanggan_bp.patch("/<int:id_pelanggan>")
@wajib_login("pelanggan")
def ubah_pelanggan(id_pelanggan):
    if milik_orang_lain(id_pelanggan):
        return tidak_berhak()
    pelanggan = cari(PELANGGAN, id_pelanggan)
    if pelanggan is None:
        return tidak_ditemukan()
    isian, pesan = periksa_isian(request.get_json(silent=True), pelanggan)
    if pesan:
        return jsonify({"pesan": pesan}), 400
    pelanggan.update(isian)
    return jsonify(tanpa_sandi(pelanggan))


@pelanggan_bp.delete("/<int:id_pelanggan>")
@wajib_login("pelanggan")
def hapus_pelanggan(id_pelanggan):
    if milik_orang_lain(id_pelanggan):
        return tidak_berhak()
    pelanggan = cari(PELANGGAN, id_pelanggan)
    if pelanggan is None:
        return tidak_ditemukan()
    if punya_pesanan_aktif(id_pelanggan):
        return jsonify({"pesan": "Akun tidak bisa dihapus selama masih ada pesanan yang belum selesai."}), 400
    PELANGGAN.remove(pelanggan)
    hapus_sesi_pelanggan(id_pelanggan)
    return "", 204
