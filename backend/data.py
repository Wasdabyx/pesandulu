from datetime import datetime

from werkzeug.security import generate_password_hash

CARA_HASH = "pbkdf2:sha256:600000"


def hash_sandi(kata_sandi):
    return generate_password_hash(kata_sandi, method=CARA_HASH)


def teks_utf8_sah(teks):
    try:
        teks.encode()
    except UnicodeEncodeError:
        return False
    return True


def sekarang():
    return datetime.now().isoformat(timespec="seconds")


def hari_ini():
    return sekarang()[:10]


def tanggal_dibuat(pesanan):
    return pesanan["dibuat"][:10] if pesanan["dibuat"] else None


_SANDI_CONTOH = hash_sandi("pelanggan123")

MENU = [
    {"id": 1, "nama": "Nasi Goreng", "harga": 15000, "kategori": "Makanan", "tersedia": True, "stok": None},
    {"id": 2, "nama": "Ayam Geprek", "harga": 18000, "kategori": "Makanan", "tersedia": True, "stok": None},
    {"id": 3, "nama": "Mie Ayam", "harga": 12000, "kategori": "Makanan", "tersedia": False, "stok": None},
    {"id": 4, "nama": "Es Teh", "harga": 5000, "kategori": "Minuman", "tersedia": True, "stok": None},
    {"id": 5, "nama": "Es Jeruk", "harga": 7000, "kategori": "Minuman", "tersedia": True, "stok": None},
]

PELANGGAN = [
    {"id": 1, "nama": "Sari Dewi", "no_hp": "081200000001", "kata_sandi": _SANDI_CONTOH},
    {"id": 2, "nama": "Budi Santoso", "no_hp": "081200000002", "kata_sandi": _SANDI_CONTOH},
    {"id": 3, "nama": "Andi Pratama", "no_hp": "081200000003", "kata_sandi": _SANDI_CONTOH},
    {"id": 4, "nama": "Rina Lestari", "no_hp": "081200000004", "kata_sandi": _SANDI_CONTOH},
]

PESANAN = [
    {
        "id": 1,
        "pelanggan_id": 1,
        "items": [{"menu_id": 3, "nama": "Mie Ayam", "harga": 12000, "jumlah": 2}],
        "total": 24000,
        "waktu_ambil": "10:30",
        "catatan": "",
        "status": "selesai",
        "dibuat": None,
        "dibatalkan_oleh": None,
        "alasan_batal": "",
    },
    {
        "id": 2,
        "pelanggan_id": 1,
        "items": [
            {"menu_id": 1, "nama": "Nasi Goreng", "harga": 15000, "jumlah": 1},
            {"menu_id": 4, "nama": "Es Teh", "harga": 5000, "jumlah": 2},
        ],
        "total": 25000,
        "waktu_ambil": "12:00",
        "catatan": "",
        "status": "siap diambil",
        "dibuat": None,
        "dibatalkan_oleh": None,
        "alasan_batal": "",
    },
    {
        "id": 3,
        "pelanggan_id": 2,
        "items": [
            {"menu_id": 2, "nama": "Ayam Geprek", "harga": 18000, "jumlah": 1},
            {"menu_id": 4, "nama": "Es Teh", "harga": 5000, "jumlah": 1},
        ],
        "total": 23000,
        "waktu_ambil": "12:15",
        "catatan": "",
        "status": "diproses",
        "dibuat": None,
        "dibatalkan_oleh": None,
        "alasan_batal": "",
    },
    {
        "id": 4,
        "pelanggan_id": 1,
        "items": [{"menu_id": 2, "nama": "Ayam Geprek", "harga": 18000, "jumlah": 1}],
        "total": 18000,
        "waktu_ambil": "12:30",
        "catatan": "Tidak pedas",
        "status": "menunggu",
        "dibuat": None,
        "dibatalkan_oleh": None,
        "alasan_batal": "",
    },
]


DAFTAR = {"menu": MENU, "pelanggan": PELANGGAN, "pesanan": PESANAN}
ID_BERIKUTNYA = {jenis: max((item["id"] for item in daftar), default=0) + 1 for jenis, daftar in DAFTAR.items()}


def id_baru(jenis):
    nomor = ID_BERIKUTNYA[jenis]
    ID_BERIKUTNYA[jenis] = nomor + 1
    return nomor


def keadaan():
    return {"id_berikutnya": ID_BERIKUTNYA, **DAFTAR}


def pasang(isi):
    for jenis, daftar in DAFTAR.items():
        daftar[:] = isi[jenis]
    ID_BERIKUTNYA.update(isi["id_berikutnya"])


def cari(daftar, id_dicari):
    for item in daftar:
        if item["id"] == id_dicari:
            return item
    return None
