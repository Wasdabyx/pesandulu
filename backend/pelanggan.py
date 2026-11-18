import re

from flask import Blueprint, jsonify, request

from data import PELANGGAN, cari, id_baru

PANJANG_NAMA_TERTINGGI = 50
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

    return {"nama": nama, "no_hp": no_hp}, None


def tidak_ditemukan():
    return jsonify({"pesan": "Pelanggan tidak ditemukan."}), 404


@pelanggan_bp.get("")
def daftar_pelanggan():
    return jsonify(PELANGGAN)


@pelanggan_bp.get("/<int:id_pelanggan>")
def lihat_pelanggan(id_pelanggan):
    pelanggan = cari(PELANGGAN, id_pelanggan)
    if pelanggan is None:
        return tidak_ditemukan()
    return jsonify(pelanggan)


@pelanggan_bp.post("")
def daftarkan_pelanggan():
    isian, pesan = periksa_isian(request.get_json(silent=True))
    if pesan:
        return jsonify({"pesan": pesan}), 400
    pelanggan = {"id": id_baru("pelanggan"), **isian}
    PELANGGAN.append(pelanggan)
    return jsonify(pelanggan), 201


@pelanggan_bp.patch("/<int:id_pelanggan>")
def ubah_pelanggan(id_pelanggan):
    pelanggan = cari(PELANGGAN, id_pelanggan)
    if pelanggan is None:
        return tidak_ditemukan()
    isian, pesan = periksa_isian(request.get_json(silent=True), pelanggan)
    if pesan:
        return jsonify({"pesan": pesan}), 400
    pelanggan.update(isian)
    return jsonify(pelanggan)


@pelanggan_bp.delete("/<int:id_pelanggan>")
def hapus_pelanggan(id_pelanggan):
    pelanggan = cari(PELANGGAN, id_pelanggan)
    if pelanggan is None:
        return tidak_ditemukan()
    PELANGGAN.remove(pelanggan)
    return "", 204
