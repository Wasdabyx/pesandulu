import ipaddress
import os
import re
import unicodedata
from pathlib import Path

try:
    from dotenv import dotenv_values
except ModuleNotFoundError:
    raise SystemExit("Paket python-dotenv belum terpasang. Pasang semua paket di requirements.txt, lihat README.") from None

FOLDER = Path(__file__).resolve().parent
BERKAS_ENV = FOLDER / ".env"
BERKAS_CONTOH = FOLDER / ".env.example"
POLA_ASAL = re.compile(r"https?://[a-z0-9._-]+(:[0-9]{1,5})?")


def baca_host(teks):
    if teks.lower() == "localhost":
        return "localhost"
    try:
        return str(ipaddress.ip_address(teks))
    except ValueError:
        raise ValueError("harus berupa alamat IP seperti 127.0.0.1 atau 0.0.0.0, atau localhost") from None


def baca_port(teks):
    if not (teks.isascii() and teks.isdigit() and len(teks) <= 5 and 1 <= int(teks) <= 65535):
        raise ValueError("harus angka 1 sampai 65535")
    return int(teks)


def baca_asal(teks):
    daftar = []
    for potongan in teks.split(","):
        asal = potongan.strip().rstrip("/").lower()
        if not asal:
            continue
        if not POLA_ASAL.fullmatch(asal):
            raise ValueError(f'berisi "{potongan.strip()}", padahal harus berupa alamat seperti http://127.0.0.1:5500')
        if asal not in daftar:
            daftar.append(asal)
    if not daftar:
        raise ValueError("belum berisi alamat")
    return daftar


PEMBACA = {
    "PESANDULU_HOST": baca_host,
    "PESANDULU_PORT": baca_port,
    "PESANDULU_ALLOWED_ORIGINS": baca_asal,
    "PESANDULU_SANDI_PENJUAL": str,
}


def periksa_teks(teks):
    try:
        teks.encode()
    except UnicodeEncodeError:
        raise ValueError("harus berupa teks UTF-8") from None
    if any(unicodedata.category(huruf) == "Cc" for huruf in teks):
        raise ValueError("tidak boleh memuat tab, baris baru, atau karakter kendali lain")


def baca_berkas(berkas):
    try:
        return dotenv_values(berkas, interpolate=False)
    except UnicodeDecodeError:
        raise SystemExit(f"Berkas {berkas.name} tidak bisa dibaca. Simpan berkas itu sebagai teks UTF-8.") from None


def muat():
    dari_berkas = baca_berkas(BERKAS_ENV)
    nilai, masalah = {}, []
    for nama, baca in PEMBACA.items():
        teks = (os.environ.get(nama) or "").strip() or (dari_berkas.get(nama) or "").strip()
        if not teks:
            masalah.append(f"{nama} belum diisi")
            continue
        try:
            periksa_teks(teks)
            nilai[nama] = baca(teks)
        except ValueError as galat:
            masalah.append(f"{nama} {galat}")
    if masalah:
        raise SystemExit(
            "Konfigurasi back-end belum benar:\n"
            + "".join(f"  - {m}\n" for m in masalah)
            + "Isi lewat environment variable, atau salin .env.example menjadi .env di folder backend lalu sesuaikan isinya."
        )
    return nilai


NILAI = muat()
HOST = NILAI["PESANDULU_HOST"]
PORT = NILAI["PESANDULU_PORT"]
ALLOWED_ORIGINS = NILAI["PESANDULU_ALLOWED_ORIGINS"]
SANDI_PENJUAL = NILAI["PESANDULU_SANDI_PENJUAL"]
HOST_LOKAL = HOST == "localhost" or ipaddress.ip_address(HOST).is_loopback


def sandi_penjual_masih_contoh():
    contoh = (baca_berkas(BERKAS_CONTOH).get("PESANDULU_SANDI_PENJUAL") or "").strip()
    return bool(contoh) and SANDI_PENJUAL == contoh
