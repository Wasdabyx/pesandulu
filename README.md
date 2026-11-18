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
| Halaman depan | `/` | Semua |
| Login | `/login.html` | Semua |
| Register | `/register.html` | Semua |
| Menu & Buat Pesanan | `/buat-pesanan.html` | Semua boleh melihat menu; memesan butuh login pelanggan |
| Dashboard pelanggan | `/dashboard-pelanggan.html` | Pelanggan |
| Pesanan Saya | `/pesanan-saya.html` | Pelanggan |
| Profil Saya | `/profil.html` | Pelanggan |
| Dashboard penjual | `/dashboard-penjual.html` | Penjual |
| Antrean Pesanan | `/antrean-pesanan.html` | Penjual |
| Kelola Menu | `/kelola-menu.html` | Penjual |
| Daftar Pelanggan | `/daftar-pelanggan.html` | Penjual |

Halaman pelanggan dan halaman penjual membawa ke Login kalau belum login, dan ke Dashboard yang sesuai kalau login sebagai peran lain.
Kedua Dashboard, Menu & Buat Pesanan, Pesanan Saya, dan Antrean Pesanan mengambil data terbaru dari back-end setiap 10 detik, jadi perubahan dari perangkat lain muncul tanpa memuat ulang halaman.

## Login

| Peran | Cara login | Akun contoh |
|---|---|---|
| Penjual | Kata sandi | `penjual123` |
| Pelanggan | No. HP dan kata sandi | `081200000001` sampai `081200000004`, kata sandi `pelanggan123` |

Pelanggan baru membuat akun di halaman Register. Kata sandi penjual diatur lewat `PESANDULU_SANDI_PENJUAL`.

Setelah login, back-end memberi token. Front-end menyimpan token itu di `localStorage` dan mengirimnya di setiap permintaan lewat header `Authorization: Bearer <token>`.
Sesi disimpan di memori back-end dan berakhir saat logout atau saat back-end dijalankan ulang.

## API

| Metode | Alamat | Kegunaan | Akses |
|---|---|---|---|
| GET | `/api/status` | Memeriksa back-end | Semua |
| POST | `/api/login` | Login; jawabannya berisi token | Semua |
| POST | `/api/logout` | Mengakhiri sesi | Semua |
| GET | `/api/sesi` | Melihat siapa yang sedang login | Semua |
| GET | `/api/menu` | Melihat semua menu | Semua |
| GET | `/api/menu/<id>` | Melihat satu menu | Semua |
| POST | `/api/menu` | Menambah menu | Penjual |
| PATCH | `/api/menu/<id>` | Mengubah menu | Penjual |
| DELETE | `/api/menu/<id>` | Menghapus menu | Penjual |
| GET | `/api/pelanggan` | Melihat semua pelanggan | Penjual |
| GET | `/api/pelanggan/<id>` | Melihat satu pelanggan | Penjual, pemilik akun |
| POST | `/api/pelanggan` | Register pelanggan | Semua |
| PATCH | `/api/pelanggan/<id>` | Mengubah pelanggan | Pemilik akun |
| DELETE | `/api/pelanggan/<id>` | Menghapus pelanggan | Pemilik akun |
| GET | `/api/pesanan` | Penjual melihat semua pesanan; pelanggan melihat pesanannya sendiri | Penjual, pelanggan |
| GET | `/api/pesanan/<id>` | Melihat satu pesanan | Penjual, pemesan |
| GET | `/api/pesanan/aturan` | Melihat pilihan waktu ambil dan jumlah tertinggi per menu | Semua |
| POST | `/api/pesanan` | Membuat pesanan atas nama pelanggan yang login | Pelanggan |
| PATCH | `/api/pesanan/<id>` | Mengubah status pesanan | Penjual |
| DELETE | `/api/pesanan/<id>` | Membatalkan pesanan | Pemesan |
| GET | `/api/rekap` | Jumlah pesanan per status, total penjualan, dan menu terlaris | Penjual |

Isi permintaan dan jawaban berformat JSON. Pada PATCH menu dan pelanggan, kolom yang tidak dikirim tidak berubah.
Kalau permintaan gagal, back-end menjawab dengan kode status 4xx dan JSON `{"pesan": "..."}`: 401 kalau belum login, 403 kalau login sebagai peran atau pemilik yang salah.

| Entitas | Kolom |
|---|---|
| Menu | `nama`, `harga`, `kategori` (`Makanan` atau `Minuman`), `tersedia` (`true` atau `false`) |
| Pelanggan | `nama`, `no_hp` (diawali `08`, 10 sampai 13 angka, tidak boleh sama dengan pelanggan lain), `kata_sandi` (6 sampai 64 karakter) |
| Pesanan | `pelanggan_id`, `items` (daftar berisi `menu_id` dan `jumlah`), `waktu_ambil` (`09:00` sampai `16:00`, tiap 15 menit), `total`, `status` |

Kata sandi pelanggan disimpan sebagai hash dan tidak pernah dikirim balik oleh API.

Aturan pesanan:

- Saat pesanan dibuat, back-end mengisi `pelanggan_id` dari sesi login, memeriksa bahwa setiap menu tersedia, lalu menghitung `total` dan mengisi `status` dengan `menunggu`.
- Setiap item menyimpan salinan `nama` dan `harga` menu saat pesanan dibuat, jadi pesanan lama tidak berubah ketika harga menu diubah atau menunya dihapus.
- Status hanya bisa maju satu langkah: `menunggu`, `diproses`, `siap diambil`, `selesai`. PATCH mengirim `{"status": "<status berikutnya>"}`.
- Pesanan hanya bisa dibatalkan selama statusnya `menunggu`.
- Akun pelanggan tidak bisa dihapus selama masih punya pesanan yang belum `selesai`.
- Jawaban API menambahkan `nama_pelanggan`, yang bernilai `null` kalau akunnya sudah dihapus.
- Penjualan dan menu terlaris di `/api/rekap` dihitung dari pesanan yang sudah `selesai`.

Data awal ada di `backend/data.py`. Perubahan hanya tersimpan di memori, jadi data kembali ke isi awal dan semua sesi login berakhir setiap back-end dijalankan ulang.

## Konfigurasi back-end

Back-end membaca environment variable berikut. Kalau tidak diisi, nilai bawaan yang dipakai.

| Variabel | Bawaan | Kegunaan |
|---|---|---|
| `PESANDULU_HOST` | `127.0.0.1` | Alamat tempat back-end menerima permintaan |
| `PESANDULU_PORT` | `5000` | Port back-end |
| `PESANDULU_ALLOWED_ORIGINS` | `http://127.0.0.1:5500,http://localhost:5500` | Alamat front-end yang boleh memanggil API, dipisah koma |
| `PESANDULU_SANDI_PENJUAL` | `penjual123` | Kata sandi login penjual. Ganti sebelum aplikasi dibuka untuk umum |

Alamat back-end yang dipanggil front-end diatur di `frontend/js/config.js`.

## Mengubah CSS atau JavaScript

Setiap halaman memanggil CSS dan JavaScript dengan akhiran `?v=3`, misalnya `js/umum.js?v=3`.
Setiap kali CSS atau JavaScript diubah, naikkan angka itu di semua berkas HTML. Alamat yang berubah membuat browser mengambil berkas yang baru, bukan salinan lama yang disimpannya.
