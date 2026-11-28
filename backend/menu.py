from flask import Blueprint, jsonify, request

from data import MENU, cari, id_baru
from sesi import wajib_login

KATEGORI = ("Makanan", "Minuman")
PANJANG_NAMA_TERTINGGI = 50
HARGA_TERTINGGI = 1_000_000
STOK_TERTINGGI = 999

menu_bp = Blueprint("menu", __name__, url_prefix="/api/menu")


def periksa_isian(kiriman, menu_lama=None):
    if not isinstance(kiriman, dict):
        return None, "Isi permintaan harus berupa JSON."

    isian = {**(menu_lama or {}), **kiriman}
    nama = isian.get("nama")
    harga = isian.get("harga")
    kategori = isian.get("kategori")
    tersedia = isian.get("tersedia")
    stok = isian.get("stok")

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
    if stok is not None and (type(stok) is not int or not 0 <= stok <= STOK_TERTINGGI):
        return None, f"Stok harus berupa bilangan bulat dari 0 sampai {STOK_TERTINGGI}, atau dikosongkan kalau tidak dibatasi."

    return {"nama": nama, "harga": harga, "kategori": kategori, "tersedia": tersedia, "stok": stok}, None


def habis(menu):
    return not menu["tersedia"] or menu["stok"] == 0


def ubah_stok(id_menu, selisih):
    menu = cari(MENU, id_menu)
    if menu is not None and menu["stok"] is not None:
        menu["stok"] = min(STOK_TERTINGGI, menu["stok"] + selisih)


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
@wajib_login("penjual")
def tambah_menu():
    isian, pesan = periksa_isian(request.get_json(silent=True))
    if pesan:
        return jsonify({"pesan": pesan}), 400
    menu = {"id": id_baru("menu"), **isian}
    MENU.append(menu)
    return jsonify(menu), 201


@menu_bp.patch("/<int:id_menu>")
@wajib_login("penjual")
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
@wajib_login("penjual")
def hapus_menu(id_menu):
    menu = cari(MENU, id_menu)
    if menu is None:
        return tidak_ditemukan()
    MENU.remove(menu)
    return "", 204
