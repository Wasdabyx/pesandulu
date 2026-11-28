import csv
import io

from flask import Blueprint, Response, jsonify, request

from data import PESANAN, hari_ini, tanggal_dibuat
from pesanan import SEMUA_STATUS, URUTAN_STATUS, lengkapi
from sesi import wajib_login

PEMISAH = {"koma": ",", "titik-koma": ";"}
AWAL_RUMUS = ("=", "+", "-", "@", "\t", "\r")
KEPALA_HARIAN = ("Tanggal pesan", "Jumlah pesanan", *(status.capitalize() for status in SEMUA_STATUS), "Porsi terjual", "Penjualan (Rp)")
KEPALA_PESANAN = (
    "No. pesanan",
    "Tanggal pesan",
    "Jam pesan",
    "Pelanggan",
    "Waktu ambil",
    "Isi pesanan",
    "Jumlah porsi",
    "Total (Rp)",
    "Catatan",
    "Status",
    "Dibatalkan oleh",
    "Alasan batal",
)

rekap_bp = Blueprint("rekap", __name__, url_prefix="/api/rekap")


def rekap_dari(daftar_pesanan):
    jumlah_per_status = {status: 0 for status in SEMUA_STATUS}
    terjual = {}
    total_penjualan = 0

    for pesanan in daftar_pesanan:
        jumlah_per_status[pesanan["status"]] += 1
        if pesanan["status"] != URUTAN_STATUS[-1]:
            continue
        total_penjualan += pesanan["total"]
        for item in pesanan["items"]:
            baris = terjual.setdefault(item["menu_id"], {"menu_id": item["menu_id"], "nama": "", "jumlah": 0})
            baris["nama"] = item["nama"]
            baris["jumlah"] += item["jumlah"]

    menu_terlaris = sorted(terjual.values(), key=lambda baris: (-baris["jumlah"], baris["nama"]))
    return {
        "jumlah_per_status": jumlah_per_status,
        "total_penjualan": total_penjualan,
        "total_terjual": sum(baris["jumlah"] for baris in menu_terlaris),
        "menu_terlaris": menu_terlaris,
    }


def rekap_per_hari():
    per_tanggal = {hari_ini(): []}
    for pesanan in PESANAN:
        per_tanggal.setdefault(tanggal_dibuat(pesanan), []).append(pesanan)
    tanpa_tanggal = per_tanggal.pop(None, None)
    urutan = [(tanggal, per_tanggal[tanggal]) for tanggal in sorted(per_tanggal, reverse=True)]
    if tanpa_tanggal is not None:
        urutan.append((None, tanpa_tanggal))
    per_hari = []
    for tanggal, daftar_pesanan in urutan:
        rekap = rekap_dari(daftar_pesanan)
        per_hari.append(
            {
                "tanggal": tanggal,
                "jumlah_pesanan": len(daftar_pesanan),
                "jumlah_per_status": rekap["jumlah_per_status"],
                "total_penjualan": rekap["total_penjualan"],
                "total_terjual": rekap["total_terjual"],
            }
        )
    return per_hari


def sel_aman(nilai):
    if isinstance(nilai, str) and nilai.startswith(AWAL_RUMUS):
        return "'" + nilai
    return nilai


def jawaban_csv(nama, kepala, semua_baris):
    pemisah = PEMISAH.get(request.args.get("pemisah", "koma"))
    if pemisah is None:
        return jsonify({"pesan": f"Pemisah harus {' atau '.join(PEMISAH)}."}), 400
    wadah = io.StringIO()
    penulis = csv.writer(wadah, delimiter=pemisah, lineterminator="\r\n")
    penulis.writerow(kepala)
    penulis.writerows([sel_aman(nilai) for nilai in baris] for baris in semua_baris)
    return Response(
        ("\ufeff" + wadah.getvalue()).encode("utf-8", "replace"),
        mimetype="text/csv",
        headers={"Content-Disposition": f'attachment; filename="pesandulu-{nama}-{hari_ini()}.csv"'},
    )


@rekap_bp.get("")
@wajib_login("penjual")
def lihat_rekap():
    return jsonify({**rekap_dari(PESANAN), "hari_ini": hari_ini(), "per_hari": rekap_per_hari()})


@rekap_bp.get("/harian.csv")
@wajib_login("penjual")
def unduh_rekap_harian():
    return jawaban_csv(
        "rekap-harian",
        KEPALA_HARIAN,
        (
            (
                hari["tanggal"] or "Tidak tercatat",
                hari["jumlah_pesanan"],
                *hari["jumlah_per_status"].values(),
                hari["total_terjual"],
                hari["total_penjualan"],
            )
            for hari in rekap_per_hari()
        ),
    )


@rekap_bp.get("/pesanan.csv")
@wajib_login("penjual")
def unduh_daftar_pesanan():
    return jawaban_csv(
        "pesanan",
        KEPALA_PESANAN,
        (
            (
                pesanan["id"],
                (pesanan["dibuat"] or "")[:10],
                (pesanan["dibuat"] or "")[11:16],
                pesanan["nama_pelanggan"] or "(akun dihapus)",
                pesanan["waktu_ambil"],
                ", ".join(f"{item['jumlah']} x {item['nama']}" for item in pesanan["items"]),
                sum(item["jumlah"] for item in pesanan["items"]),
                pesanan["total"],
                pesanan["catatan"],
                pesanan["status"],
                pesanan["dibatalkan_oleh"] or "",
                pesanan["alasan_batal"],
            )
            for pesanan in map(lengkapi, PESANAN)
        ),
    )
