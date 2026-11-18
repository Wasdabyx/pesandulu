# PesanDulu

Aplikasi web pre-order makanan dan minuman untuk stand kelompok di market day kampus.
Proyek mata kuliah CAK3EAB3 Komputasi Awan dan Terdistribusi.

## Struktur

| Folder | Isi |
|---|---|
| `backend/` | API dengan Python dan Flask. Data disimpan di memori sebagai list of dict, tanpa database. |
| `frontend/` | Halaman statis (HTML, CSS, JavaScript) yang memanggil API lewat HTTP. |

## Menjalankan di Windows

Butuh Python 3.9 atau lebih baru.

Back-end, dari folder `backend`:

```
py -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python app.py
```

Back-end berjalan di `http://127.0.0.1:5000`. Coba buka `http://127.0.0.1:5000/api/status`.

Front-end, di terminal kedua, dari folder `frontend`:

```
py -m http.server 5500 --bind 127.0.0.1
```

Buka `http://127.0.0.1:5500` di browser.

## Halaman

| Halaman | Alamat | Pengguna |
|---|---|---|
| Beranda | `/` | Semua |
| Profil Saya | `/profil.html` | Pelanggan |
| Kelola Menu | `/kelola-menu.html` | Penjual |
| Daftar Pelanggan | `/daftar-pelanggan.html` | Penjual |

## API

| Metode | Alamat | Kegunaan |
|---|---|---|
| GET | `/api/status` | Memeriksa back-end |
| GET | `/api/menu` | Melihat semua menu |
| GET | `/api/menu/<id>` | Melihat satu menu |
| POST | `/api/menu` | Menambah menu |
| PATCH | `/api/menu/<id>` | Mengubah menu |
| DELETE | `/api/menu/<id>` | Menghapus menu |
| GET | `/api/pelanggan` | Melihat semua pelanggan |
| GET | `/api/pelanggan/<id>` | Melihat satu pelanggan |
| POST | `/api/pelanggan` | Mendaftarkan pelanggan |
| PATCH | `/api/pelanggan/<id>` | Mengubah pelanggan |
| DELETE | `/api/pelanggan/<id>` | Menghapus pelanggan |

Isi permintaan dan jawaban berformat JSON. Pada PATCH, kolom yang tidak dikirim tidak berubah.
Kalau permintaan gagal, back-end menjawab dengan kode status 4xx dan JSON `{"pesan": "..."}`.

| Entitas | Kolom |
|---|---|
| Menu | `nama`, `harga`, `kategori` (`Makanan` atau `Minuman`), `tersedia` (`true` atau `false`) |
| Pelanggan | `nama`, `no_hp` (diawali `08`, 10 sampai 13 angka, tidak boleh sama dengan pelanggan lain) |

Data awal ada di `backend/data.py`. Perubahan hanya tersimpan di memori, jadi data kembali ke isi awal setiap back-end dijalankan ulang.

## Konfigurasi back-end

Back-end membaca environment variable berikut. Kalau tidak diisi, nilai bawaan yang dipakai.

| Variabel | Bawaan | Kegunaan |
|---|---|---|
| `PESANDULU_HOST` | `127.0.0.1` | Alamat tempat back-end menerima permintaan |
| `PESANDULU_PORT` | `5000` | Port back-end |
| `PESANDULU_ALLOWED_ORIGINS` | `http://127.0.0.1:5500,http://localhost:5500` | Alamat front-end yang boleh memanggil API, dipisah koma |

Alamat back-end yang dipanggil front-end diatur di `frontend/js/config.js`.

## Mengubah CSS atau JavaScript

Setiap halaman memanggil CSS dan JavaScript dengan akhiran `?v=1`, misalnya `js/umum.js?v=1`.
Setiap kali CSS atau JavaScript diubah, naikkan angka itu di semua berkas HTML. Alamat yang berubah membuat browser mengambil berkas yang baru, bukan salinan lama yang disimpannya.
