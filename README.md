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
| Kelola Menu | `/kelola-menu.html` | Penjual |

## API

| Metode | Alamat | Kegunaan |
|---|---|---|
| GET | `/api/status` | Memeriksa back-end |
| GET | `/api/menu` | Melihat semua menu |
| GET | `/api/menu/<id>` | Melihat satu menu |
| POST | `/api/menu` | Menambah menu |
| PATCH | `/api/menu/<id>` | Mengubah menu; kolom yang tidak dikirim tidak berubah |
| DELETE | `/api/menu/<id>` | Menghapus menu |

Isi permintaan dan jawaban berformat JSON. Kolom menu: `nama`, `harga`, `kategori` (`Makanan` atau `Minuman`), dan `tersedia` (`true` atau `false`).
Kalau permintaan gagal, back-end menjawab dengan kode status 4xx dan JSON `{"pesan": "..."}`.

Data awal ada di `backend/data.py`. Perubahan hanya tersimpan di memori, jadi data kembali ke isi awal setiap back-end dijalankan ulang.

## Konfigurasi back-end

Back-end membaca environment variable berikut. Kalau tidak diisi, nilai bawaan yang dipakai.

| Variabel | Bawaan | Kegunaan |
|---|---|---|
| `PESANDULU_HOST` | `127.0.0.1` | Alamat tempat back-end menerima permintaan |
| `PESANDULU_PORT` | `5000` | Port back-end |
| `PESANDULU_ALLOWED_ORIGINS` | `http://127.0.0.1:5500,http://localhost:5500` | Alamat front-end yang boleh memanggil API, dipisah koma |

Alamat back-end yang dipanggil front-end diatur di `frontend/js/config.js`.
