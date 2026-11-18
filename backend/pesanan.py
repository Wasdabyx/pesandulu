from flask import Blueprint, g, jsonify, request

from data import MENU, PELANGGAN, PESANAN, cari, id_baru
from sesi import tidak_berhak, wajib_login

URUTAN_STATUS = ("menunggu", "diproses", "siap diambil", "selesai")
JAM_BUKA = 9
JAM_TUTUP = 16
SELANG_MENIT = 15
JUMLAH_TERTINGGI = 20
WAKTU_AMBIL = [
    f"{menit // 60:02d}:{menit % 60:02d}"
    for menit in range(JAM_BUKA * 60, JAM_TUTUP * 60 + 1, SELANG_MENIT)
]

pesanan_bp = Blueprint("pesanan", __name__, url_prefix="/api/pesanan")


def periksa_isian(kiriman, id_pelanggan):
    if not isinstance(kiriman, dict):
        return None, "Isi permintaan harus berupa JSON."

    kiriman_items = kiriman.get("items")
    waktu_ambil = kiriman.get("waktu_ambil")

    if not isinstance(kiriman_items, list) or not kiriman_items:
        return None, "Pesanan harus berisi paling sedikit satu menu."

    items = []
    for kiriman_item in kiriman_items:
        if not isinstance(kiriman_item, dict):
            return None, "Setiap item pesanan harus berisi menu_id dan jumlah."
        id_menu = kiriman_item.get("menu_id")
        jumlah = kiriman_item.get("jumlah")
        menu = cari(MENU, id_menu) if type(id_menu) is int else None
        if menu is None:
            return None, "Menu yang dipesan tidak ditemukan."
        if any(item["menu_id"] == id_menu for item in items):
            return None, f"{menu['nama']} ditulis lebih dari sekali."
        if not menu["tersedia"]:
            return None, f"{menu['nama']} sedang habis."
        if type(jumlah) is not int or not 0 < jumlah <= JUMLAH_TERTINGGI:
            return None, f"Jumlah {menu['nama']} harus 1 sampai {JUMLAH_TERTINGGI}."
        items.append({"menu_id": id_menu, "nama": menu["nama"], "harga": menu["harga"], "jumlah": jumlah})

    if not isinstance(waktu_ambil, str) or waktu_ambil not in WAKTU_AMBIL:
        return None, f"Waktu ambil harus dari {WAKTU_AMBIL[0]} sampai {WAKTU_AMBIL[-1]}, tiap {SELANG_MENIT} menit."

    return {
        "pelanggan_id": id_pelanggan,
        "items": items,
        "total": sum(item["harga"] * item["jumlah"] for item in items),
        "waktu_ambil": waktu_ambil,
        "status": URUTAN_STATUS[0],
    }, None


def punya_pesanan_aktif(id_pelanggan):
    return any(
        pesanan["pelanggan_id"] == id_pelanggan and pesanan["status"] != URUTAN_STATUS[-1]
        for pesanan in PESANAN
    )


def lengkapi(pesanan):
    pelanggan = cari(PELANGGAN, pesanan["pelanggan_id"])
    return {**pesanan, "nama_pelanggan": pelanggan["nama"] if pelanggan else None}


def milik_orang_lain(pesanan):
    return g.sesi["peran"] == "pelanggan" and g.sesi["pelanggan_id"] != pesanan["pelanggan_id"]


def tidak_ditemukan():
    return jsonify({"pesan": "Pesanan tidak ditemukan."}), 404


@pesanan_bp.get("")
@wajib_login("penjual", "pelanggan")
def daftar_pesanan():
    return jsonify([lengkapi(pesanan) for pesanan in PESANAN if not milik_orang_lain(pesanan)])


@pesanan_bp.get("/aturan")
def aturan_pesanan():
    return jsonify({"waktu_ambil": WAKTU_AMBIL, "jumlah_tertinggi": JUMLAH_TERTINGGI})


@pesanan_bp.get("/<int:id_pesanan>")
@wajib_login("penjual", "pelanggan")
def lihat_pesanan(id_pesanan):
    pesanan = cari(PESANAN, id_pesanan)
    if pesanan is None:
        return tidak_ditemukan()
    if milik_orang_lain(pesanan):
        return tidak_berhak()
    return jsonify(lengkapi(pesanan))


@pesanan_bp.post("")
@wajib_login("pelanggan")
def buat_pesanan():
    isian, pesan = periksa_isian(request.get_json(silent=True), g.sesi["pelanggan_id"])
    if pesan:
        return jsonify({"pesan": pesan}), 400
    pesanan = {"id": id_baru("pesanan"), **isian}
    PESANAN.append(pesanan)
    return jsonify(lengkapi(pesanan)), 201


@pesanan_bp.patch("/<int:id_pesanan>")
@wajib_login("penjual")
def ubah_status(id_pesanan):
    pesanan = cari(PESANAN, id_pesanan)
    if pesanan is None:
        return tidak_ditemukan()
    kiriman = request.get_json(silent=True)
    if not isinstance(kiriman, dict):
        return jsonify({"pesan": "Isi permintaan harus berupa JSON."}), 400
    if pesanan["status"] == URUTAN_STATUS[-1]:
        return jsonify({"pesan": "Pesanan sudah selesai."}), 400
    berikutnya = URUTAN_STATUS[URUTAN_STATUS.index(pesanan["status"]) + 1]
    if kiriman.get("status") != berikutnya:
        return jsonify({"pesan": f"Status pesanan ini hanya bisa diubah menjadi {berikutnya}."}), 400
    pesanan["status"] = berikutnya
    return jsonify(lengkapi(pesanan))


@pesanan_bp.delete("/<int:id_pesanan>")
@wajib_login("pelanggan")
def batalkan_pesanan(id_pesanan):
    pesanan = cari(PESANAN, id_pesanan)
    if pesanan is None:
        return tidak_ditemukan()
    if milik_orang_lain(pesanan):
        return tidak_berhak()
    if pesanan["status"] != URUTAN_STATUS[0]:
        return jsonify({"pesan": "Pesanan yang sudah diproses tidak bisa dibatalkan."}), 400
    PESANAN.remove(pesanan)
    return "", 204
