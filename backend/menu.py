from flask import Blueprint, jsonify, request

from data import MENU, cari, id_baru

KATEGORI = ("Makanan", "Minuman")
PANJANG_NAMA_TERTINGGI = 50
HARGA_TERTINGGI = 1_000_000

menu_bp = Blueprint("menu", __name__, url_prefix="/api/menu")


def periksa_isian(kiriman, menu_lama=None):
    if not isinstance(kiriman, dict):
        return None, "Isi permintaan harus berupa JSON."

    isian = {**(menu_lama or {}), **kiriman}
    nama = isian.get("nama")
    harga = isian.get("harga")
    kategori = isian.get("kategori")
    tersedia = isian.get("tersedia")

    if not isinstance(nama, str) or not nama.strip():
        return None, "Nama menu wajib diisi."
    nama = " ".join(nama.split())
    if len(nama) > PANJANG_NAMA_TERTINGGI:
        return None, f"Nama menu paling panjang {PANJANG_NAMA_TERTINGGI} karakter."
    for menu in MENU:
        if menu is not menu_lama and menu["nama"].lower() == nama.lower():
            return None, f"Menu bernama {menu['nama']} sudah ada."
    if type(harga) is not int or not 0 < harga <= HARGA_TERTINGGI:
        return None, "Harga harus berupa bilangan bulat dari 1 sampai 1.000.000."
    if kategori not in KATEGORI:
        return None, "Kategori harus Makanan atau Minuman."
    if type(tersedia) is not bool:
        return None, "Tersedia harus bernilai true atau false."

    return {"nama": nama, "harga": harga, "kategori": kategori, "tersedia": tersedia}, None


def tidak_ditemukan():
    return jsonify({"pesan": "Menu tidak ditemukan."}), 404


@menu_bp.get("")
def daftar_menu():
    return jsonify(MENU)


@menu_bp.get("/<int:id_menu>")
def lihat_menu(id_menu):
    menu = cari(MENU, id_menu)
    if menu is None:
        return tidak_ditemukan()
    return jsonify(menu)


@menu_bp.post("")
def tambah_menu():
    isian, pesan = periksa_isian(request.get_json(silent=True))
    if pesan:
        return jsonify({"pesan": pesan}), 400
    menu = {"id": id_baru("menu"), **isian}
    MENU.append(menu)
    return jsonify(menu), 201


@menu_bp.patch("/<int:id_menu>")
def ubah_menu(id_menu):
    menu = cari(MENU, id_menu)
    if menu is None:
        return tidak_ditemukan()
    isian, pesan = periksa_isian(request.get_json(silent=True), menu)
    if pesan:
        return jsonify({"pesan": pesan}), 400
    menu.update(isian)
    return jsonify(menu)


@menu_bp.delete("/<int:id_menu>")
def hapus_menu(id_menu):
    menu = cari(MENU, id_menu)
    if menu is None:
        return tidak_ditemukan()
    MENU.remove(menu)
    return "", 204
