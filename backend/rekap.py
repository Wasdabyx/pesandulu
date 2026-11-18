from flask import Blueprint, jsonify

from data import PESANAN
from pesanan import URUTAN_STATUS
from sesi import wajib_login

rekap_bp = Blueprint("rekap", __name__, url_prefix="/api/rekap")


@rekap_bp.get("")
@wajib_login("penjual")
def lihat_rekap():
    jumlah_per_status = {status: 0 for status in URUTAN_STATUS}
    terjual = {}
    total_penjualan = 0

    for pesanan in PESANAN:
        jumlah_per_status[pesanan["status"]] += 1
        if pesanan["status"] != URUTAN_STATUS[-1]:
            continue
        total_penjualan += pesanan["total"]
        for item in pesanan["items"]:
            baris = terjual.setdefault(item["menu_id"], {"menu_id": item["menu_id"], "nama": "", "jumlah": 0})
            baris["nama"] = item["nama"]
            baris["jumlah"] += item["jumlah"]

    menu_terlaris = sorted(terjual.values(), key=lambda baris: (-baris["jumlah"], baris["nama"]))
    return jsonify(
        {
            "jumlah_per_status": jumlah_per_status,
            "total_penjualan": total_penjualan,
            "total_terjual": sum(baris["jumlah"] for baris in menu_terlaris),
            "menu_terlaris": menu_terlaris,
        }
    )
