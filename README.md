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
| Menu & Buat Pesanan | `/buat-pesanan.html` | Pelanggan |
| Pesanan Saya | `/pesanan-saya.html` | Pelanggan |
| Profil Saya | `/profil.html` | Pelanggan |
| Antrean Pesanan | `/antrean-pesanan.html` | Penjual |
| Kelola Menu | `/kelola-menu.html` | Penjual |
| Daftar Pelanggan | `/daftar-pelanggan.html` | Penjual |

Halaman Menu & Buat Pesanan, Pesanan Saya, dan Antrean Pesanan mengambil data terbaru dari back-end setiap 10 detik, jadi perubahan dari perangkat lain muncul tanpa memuat ulang halaman.

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
| GET | `/api/pesanan` | Melihat semua pesanan. Dengan `?pelanggan_id=<id>`, hanya pesanan pelanggan itu |
| GET | `/api/pesanan/<id>` | Melihat satu pesanan |
| GET | `/api/pesanan/aturan` | Melihat pilihan waktu ambil dan jumlah tertinggi per menu |
| POST | `/api/pesanan` | Membuat pesanan |
| PATCH | `/api/pesanan/<id>` | Mengubah status pesanan |
| DELETE | `/api/pesanan/<id>` | Membatalkan pesanan |

Isi permintaan dan jawaban berformat JSON. Pada PATCH menu dan pelanggan, kolom yang tidak dikirim tidak berubah.
Kalau permintaan gagal, back-end menjawab dengan kode status 4xx dan JSON `{"pesan": "..."}`.

| Entitas | Kolom |
|---|---|
| Menu | `nama`, `harga`, `kategori` (`Makanan` atau `Minuman`), `tersedia` (`true` atau `false`) |
| Pelanggan | `nama`, `no_hp` (diawali `08`, 10 sampai 13 angka, tidak boleh sama dengan pelanggan lain) |
| Pesanan | `pelanggan_id`, `items` (daftar berisi `menu_id` dan `jumlah`), `waktu_ambil` (`09:00` sampai `16:00`, tiap 15 menit), `total`, `status` |

Aturan pesanan:

- Saat pesanan dibuat, back-end memeriksa bahwa pelanggan terdaftar dan setiap menu tersedia, lalu menghitung `total` dan mengisi `status` dengan `menunggu`.
- Setiap item menyimpan salinan `nama` dan `harga` menu saat pesanan dibuat, jadi pesanan lama tidak berubah ketika harga menu diubah atau menunya dihapus.
- Status hanya bisa maju satu langkah: `menunggu`, `diproses`, `siap diambil`, `selesai`. PATCH mengirim `{"status": "<status berikutnya>"}`.
- Pesanan hanya bisa dibatalkan selama statusnya `menunggu`.
- Akun pelanggan tidak bisa dihapus selama masih punya pesanan yang belum `selesai`.
- Jawaban API menambahkan `nama_pelanggan`, yang bernilai `null` kalau akunnya sudah dihapus.

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

Setiap halaman memanggil CSS dan JavaScript dengan akhiran `?v=2`, misalnya `js/umum.js?v=2`.
Setiap kali CSS atau JavaScript diubah, naikkan angka itu di semua berkas HTML. Alamat yang berubah membuat browser mengambil berkas yang baru, bukan salinan lama yang disimpannya.
