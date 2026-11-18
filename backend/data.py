from itertools import count

MENU = [
    {"id": 1, "nama": "Nasi Goreng", "harga": 15000, "kategori": "Makanan", "tersedia": True},
    {"id": 2, "nama": "Ayam Geprek", "harga": 18000, "kategori": "Makanan", "tersedia": True},
    {"id": 3, "nama": "Mie Ayam", "harga": 12000, "kategori": "Makanan", "tersedia": False},
    {"id": 4, "nama": "Es Teh", "harga": 5000, "kategori": "Minuman", "tersedia": True},
    {"id": 5, "nama": "Es Jeruk", "harga": 7000, "kategori": "Minuman", "tersedia": True},
]

PELANGGAN = [
    {"id": 1, "nama": "Sari Dewi", "no_hp": "081200000001"},
    {"id": 2, "nama": "Budi Santoso", "no_hp": "081200000002"},
    {"id": 3, "nama": "Andi Pratama", "no_hp": "081200000003"},
    {"id": 4, "nama": "Rina Lestari", "no_hp": "081200000004"},
]


def _penghitung_setelah(daftar):
    id_terbesar = max((item["id"] for item in daftar), default=0)
    return count(id_terbesar + 1)


_penghitung_id = {
    "menu": _penghitung_setelah(MENU),
    "pelanggan": _penghitung_setelah(PELANGGAN),
}


def id_baru(jenis):
    return next(_penghitung_id[jenis])


def cari(daftar, id_dicari):
    for item in daftar:
        if item["id"] == id_dicari:
            return item
    return None
