import json
import os
import re
import sys
import time

from data import DAFTAR, PELANGGAN, keadaan, pasang
from konfigurasi import BERKAS_DATA, berhenti
from menu import HARGA_TERTINGGI, KATEGORI, STOK_TERTINGGI
from menu import PANJANG_NAMA_TERTINGGI as PANJANG_NAMA_MENU
from pelanggan import PANJANG_NAMA_TERTINGGI as PANJANG_NAMA_PELANGGAN
from pelanggan import POLA_NO_HP
from pesanan import JUMLAH_TERTINGGI, PANJANG_CATATAN_TERTINGGI, URUTAN_STATUS, WAKTU_AMBIL
from sesi import SESI

VERSI = 2
KOLOM_MENU = ("id", "nama", "harga", "kategori", "tersedia", "stok")
KOLOM_PELANGGAN = ("id", "nama", "no_hp", "kata_sandi")
KOLOM_PESANAN = ("id", "pelanggan_id", "items", "total", "waktu_ambil", "catatan", "status")
KOLOM_ITEM = ("menu_id", "nama", "harga", "jumlah")
KOLOM_BARU = {2: {"menu": {"stok": None}, "pesanan": {"catatan": ""}}}
POLA_HASH = re.compile(r"pbkdf2:sha256:[1-9][0-9]{3,6}\$[A-Za-z0-9]{1,64}\$[0-9a-f]{64}")
PERCOBAAN = 5
JEDA_PERCOBAAN = 0.05
BELUM_DIMUAT = object()
ingatan = {"isi": BELUM_DIMUAT, "keluhan": None, "sesi": {}}


class Masalah(Exception):
    awalan = "tidak bisa dibuka"
    saran = "Periksa PESANDULU_BERKAS_DATA dan izin berkas serta foldernya."


class TidakBisaDitulis(Masalah):
    awalan = "tidak bisa ditulis"


class TidakSah(Masalah):
    awalan = "tidak bisa dipakai"
    saran = "Perbaiki berkas itu, atau pindahkan ke tempat lain supaya back-end mulai lagi dari data awal."


class TidakLayakDitulis(Masalah):
    awalan = "tidak ditulis karena isinya akan ditolak saat dimuat lagi"


def keluhan(galat):
    return f"Berkas data {BERKAS_DATA} {galat.awalan}: {galat}."


def catat(teks):
    print(teks, file=sys.stderr, flush=True)


def syarat(terpenuhi, pesan):
    if not terpenuhi:
        raise TidakSah(pesan)


def bulat(nilai, terendah, tertinggi=None):
    return type(nilai) is int and nilai >= terendah and (tertinggi is None or nilai <= tertinggi)


def nama_sah(nilai, terpanjang):
    return isinstance(nilai, str) and 0 < len(nilai) <= terpanjang and nilai == " ".join(nilai.split())


def tanpa_kembar(nilai):
    return len(set(nilai)) == len(nilai)


def kolom_baru(versi, jenis):
    baru = {}
    for nomor in range(versi + 1, VERSI + 1):
        baru.update(KOLOM_BARU[nomor].get(jenis, {}))
    return baru


def ambil_kolom(butir, kolom, sebutan, baru=None):
    baru = baru or {}
    lama = tuple(nama for nama in kolom if nama not in baru)
    syarat(isinstance(butir, dict) and set(butir) == set(lama), f"{sebutan} harus berisi tepat kolom {', '.join(lama)}")
    return {nama: baru[nama] if nama in baru else butir[nama] for nama in kolom}


def periksa_menu(butir, sebutan, baru):
    menu = ambil_kolom(butir, KOLOM_MENU, sebutan, baru)
    syarat(nama_sah(menu["nama"], PANJANG_NAMA_MENU), f"{sebutan}: nama harus 1 sampai {PANJANG_NAMA_MENU} karakter, tanpa spasi di tepi dan tanpa spasi ganda")
    syarat(bulat(menu["harga"], 1, HARGA_TERTINGGI), f"{sebutan}: harga harus bilangan bulat 1 sampai {HARGA_TERTINGGI}")
    syarat(menu["kategori"] in KATEGORI, f"{sebutan}: kategori harus {' atau '.join(KATEGORI)}")
    syarat(type(menu["tersedia"]) is bool, f"{sebutan}: tersedia harus true atau false")
    syarat(menu["stok"] is None or bulat(menu["stok"], 0, STOK_TERTINGGI), f"{sebutan}: stok harus null atau bilangan bulat 0 sampai {STOK_TERTINGGI}")
    return menu


def periksa_pelanggan(butir, sebutan, baru):
    pelanggan = ambil_kolom(butir, KOLOM_PELANGGAN, sebutan, baru)
    no_hp, kata_sandi = pelanggan["no_hp"], pelanggan["kata_sandi"]
    syarat(nama_sah(pelanggan["nama"], PANJANG_NAMA_PELANGGAN), f"{sebutan}: nama harus 1 sampai {PANJANG_NAMA_PELANGGAN} karakter, tanpa spasi di tepi dan tanpa spasi ganda")
    syarat(isinstance(no_hp, str) and POLA_NO_HP.fullmatch(no_hp) is not None, f"{sebutan}: no_hp harus diawali 08 dan terdiri dari 10 sampai 13 angka")
    syarat(isinstance(kata_sandi, str) and POLA_HASH.fullmatch(kata_sandi) is not None, f"{sebutan}: kata_sandi harus berupa hash yang ditulis back-end, bukan kata sandi aslinya")
    return pelanggan


def periksa_pesanan(butir, sebutan, baru):
    pesanan = ambil_kolom(butir, KOLOM_PESANAN, sebutan, baru)
    syarat(bulat(pesanan["pelanggan_id"], 1), f"{sebutan}: pelanggan_id harus bilangan bulat mulai dari 1")
    syarat(isinstance(pesanan["items"], list) and len(pesanan["items"]) > 0, f"{sebutan}: items harus berisi paling sedikit satu menu")
    items = []
    for nomor, butir_item in enumerate(pesanan["items"], 1):
        letak = f"{sebutan}, item ke-{nomor}"
        item = ambil_kolom(butir_item, KOLOM_ITEM, letak)
        syarat(bulat(item["menu_id"], 1), f"{letak}: menu_id harus bilangan bulat mulai dari 1")
        syarat(all(item["menu_id"] != lain["menu_id"] for lain in items), f"{letak}: menu_id {item['menu_id']} ditulis lebih dari sekali dalam satu pesanan")
        syarat(nama_sah(item["nama"], PANJANG_NAMA_MENU), f"{letak}: nama harus 1 sampai {PANJANG_NAMA_MENU} karakter, tanpa spasi di tepi dan tanpa spasi ganda")
        syarat(bulat(item["harga"], 1, HARGA_TERTINGGI), f"{letak}: harga harus bilangan bulat 1 sampai {HARGA_TERTINGGI}")
        syarat(bulat(item["jumlah"], 1, JUMLAH_TERTINGGI), f"{letak}: jumlah harus bilangan bulat 1 sampai {JUMLAH_TERTINGGI}")
        items.append(item)
    pesanan["items"] = items
    seharusnya = sum(item["harga"] * item["jumlah"] for item in items)
    syarat(type(pesanan["total"]) is int and pesanan["total"] == seharusnya, f"{sebutan}: total harus {seharusnya}, yaitu jumlah harga kali jumlah tiap item")
    syarat(isinstance(pesanan["waktu_ambil"], str) and pesanan["waktu_ambil"] in WAKTU_AMBIL, f"{sebutan}: waktu_ambil harus dari {WAKTU_AMBIL[0]} sampai {WAKTU_AMBIL[-1]} dengan menit 00, 15, 30, atau 45")
    catatan = pesanan["catatan"]
    syarat(isinstance(catatan, str) and len(catatan) <= PANJANG_CATATAN_TERTINGGI and catatan == " ".join(catatan.split()), f"{sebutan}: catatan harus teks paling panjang {PANJANG_CATATAN_TERTINGGI} karakter, tanpa spasi di tepi dan tanpa spasi ganda")
    syarat(isinstance(pesanan["status"], str) and pesanan["status"] in URUTAN_STATUS, f"{sebutan}: status harus salah satu dari {', '.join(URUTAN_STATUS)}")
    return pesanan


PEMERIKSA = {"menu": periksa_menu, "pelanggan": periksa_pelanggan, "pesanan": periksa_pesanan}


def periksa(isi):
    kolom = ("versi", "id_berikutnya", *DAFTAR)
    syarat(isinstance(isi, dict) and set(isi) == set(kolom), f"isinya harus berupa satu objek dengan tepat kolom {', '.join(kolom)}")
    versi = isi["versi"]
    syarat(type(versi) is int and 1 <= versi <= VERSI, f"versi harus {' atau '.join(str(nomor) for nomor in range(1, VERSI + 1))}")
    rapi = {}
    for jenis, periksa_butir in PEMERIKSA.items():
        syarat(isinstance(isi[jenis], list), f"{jenis} harus berupa daftar")
        rapi[jenis] = [periksa_butir(butir, f"{jenis} ke-{nomor}", kolom_baru(versi, jenis)) for nomor, butir in enumerate(isi[jenis], 1)]
        nomor_id = [butir["id"] for butir in rapi[jenis]]
        syarat(all(bulat(nomor, 1) for nomor in nomor_id), f"{jenis}: id harus bilangan bulat mulai dari 1")
        syarat(tanpa_kembar(nomor_id), f"{jenis}: id tidak boleh kembar")
    syarat(tanpa_kembar([menu["nama"].lower() for menu in rapi["menu"]]), "menu: nama tidak boleh kembar")
    syarat(tanpa_kembar([pelanggan["no_hp"] for pelanggan in rapi["pelanggan"]]), "pelanggan: no_hp tidak boleh kembar")
    penghitung = ambil_kolom(isi["id_berikutnya"], tuple(DAFTAR), "id_berikutnya")
    for jenis in DAFTAR:
        terbesar = max((butir["id"] for butir in rapi[jenis]), default=0)
        syarat(bulat(penghitung[jenis], terbesar + 1), f"id_berikutnya untuk {jenis} harus bilangan bulat yang lebih besar dari {terbesar}, id terbesar di daftar itu")
    rapi["id_berikutnya"] = penghitung
    return rapi, versi


def objek_tanpa_kolom_kembar(pasangan):
    objek = {}
    for kolom, nilai in pasangan:
        syarat(kolom not in objek, f"kolom {kolom} ditulis lebih dari sekali dalam satu objek")
        objek[kolom] = nilai
    return objek


def urai(mentah):
    try:
        return json.loads(mentah.decode("utf-8-sig"), object_pairs_hook=objek_tanpa_kolom_kembar)
    except json.JSONDecodeError as galat:
        raise TidakSah(f"isinya bukan JSON yang sah, lihat baris {galat.lineno} kolom {galat.colno}") from None
    except (ValueError, RecursionError):
        raise TidakSah("isinya bukan JSON yang sah") from None


def serial():
    return (json.dumps({"versi": VERSI, **keadaan()}, indent=2) + "\n").encode("ascii")


AWAL = serial()


def alasan(galat):
    return galat.strerror or str(galat)


def ulangi(tindakan, *argumen):
    for sisa in reversed(range(PERCOBAAN)):
        try:
            return tindakan(*argumen)
        except PermissionError:
            if not sisa:
                raise
            time.sleep(JEDA_PERCOBAAN)


def isi_berkas():
    try:
        return ulangi(BERKAS_DATA.read_bytes)
    except FileNotFoundError:
        return None
    except OSError as galat:
        raise Masalah(alasan(galat)) from None


def tulis_berkas(isi, tujuan=BERKAS_DATA):
    sementara = tujuan.with_name(tujuan.name + ".tmp")
    try:
        with open(sementara, "wb") as berkas:
            try:
                os.chmod(sementara, 0o600)
            except OSError:
                pass
            berkas.write(isi)
            berkas.flush()
            os.fsync(berkas.fileno())
        ulangi(os.replace, sementara, tujuan)
    except OSError as galat:
        try:
            os.remove(sementara)
        except OSError:
            pass
        raise TidakBisaDitulis(alasan(galat)) from None


def pengenal_pelanggan():
    return {pelanggan["id"]: (pelanggan["no_hp"], pelanggan["kata_sandi"]) for pelanggan in PELANGGAN}


def ganti(isi):
    lama = pengenal_pelanggan()
    pasang(isi)
    baru = pengenal_pelanggan()
    for token, sesi in list(SESI.items()):
        if sesi["pelanggan_id"] is not None and lama.get(sesi["pelanggan_id"]) != baru.get(sesi["pelanggan_id"]):
            del SESI[token]


def ambil(selalu_tulis=False):
    mentah = isi_berkas()
    if mentah == ingatan["isi"]:
        return None, None
    isi, versi = (json.loads(AWAL), VERSI) if mentah is None else periksa(urai(mentah))
    cadangan = BERKAS_DATA.with_name(f"{BERKAS_DATA.name}.versi-{versi}")
    if versi < VERSI:
        tulis_berkas(mentah, cadangan)
    ganti(isi)
    ingatan["isi"] = serial()
    if selalu_tulis or ingatan["isi"] != mentah:
        tulis_berkas(ingatan["isi"])
    if mentah is None:
        return "hilang", "tidak ada lagi, jadi back-end kembali ke data awal"
    if versi < VERSI:
        return "naik", f"berasal dari versi {versi}, jadi dinaikkan ke versi {VERSI}; isi lamanya disalin ke {cadangan.name}"
    return "berubah", "berubah di luar proses ini, jadi isinya dimuat ulang"


def muat():
    try:
        jenis, kejadian = ambil(selalu_tulis=True)
        if jenis == "naik":
            print(f"Berkas data {BERKAS_DATA} {kejadian}.", flush=True)
    except Masalah as galat:
        berhenti(f"{keluhan(galat)}\n{galat.saran}")


def segarkan():
    try:
        _, kejadian = ambil()
        if kejadian is not None:
            print(f"Berkas data {BERKAS_DATA} {kejadian}.", flush=True)
        teks = None
    except Masalah as galat:
        teks = keluhan(galat)
    if teks is not None and teks != ingatan["keluhan"]:
        catat(teks)
    ingatan["keluhan"] = teks
    ingatan["sesi"] = dict(SESI)


def pastikan_layak(isi):
    try:
        periksa(urai(isi))
    except TidakSah as galat:
        raise TidakLayakDitulis(str(galat)) from None


def selaraskan(berhasil):
    isi = serial()
    if isi == ingatan["isi"]:
        return True
    if berhasil:
        try:
            pastikan_layak(isi)
            if isi_berkas() != ingatan["isi"]:
                raise TidakBisaDitulis("isi berkas itu tidak sama dengan data yang sedang dipegang back-end")
            tulis_berkas(isi)
            ingatan["isi"] = isi
            return True
        except Masalah as galat:
            catat(f"{keluhan(galat)} Perubahan dari permintaan ini dibatalkan.")
    pasang(json.loads(ingatan["isi"]))
    SESI.clear()
    SESI.update(ingatan["sesi"])
    return not berhasil
