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

## Memasang front-end di Vercel

Front-end berupa berkas statis, jadi dipasang di Vercel tanpa proses build. Pengaturan proyek di Vercel:

| Pengaturan | Nilai |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Other |
| Build Command | kosong |
| Output Directory | bawaan |

Setiap push ke branch `main` dipasang otomatis. Back-end tidak ikut dipasang di Vercel.

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

## Tampilan

Warna dan font diatur lewat variabel di bagian paling atas `frontend/css/style.css`. Mengganti nilainya di sana mengubah semua halaman.

| Variabel | Kode | Dipakai untuk |
|---|---|---|
| `--warna-utama` | `#1d6b3b` | Warna utama: tombol utama, tautan, status siap diambil |
| `--warna-utama-tua` | `#14452a` | Kepala halaman; latar halaman depan, Login, dan Register |
| `--warna-utama-muda` | `#e2f1e3` | Latar lembut: status diproses, tombol tambah, pesan berhasil |
| `--warna-kedua` | `#f8c12c` | Warna kedua: separuh nama aplikasi, penanda navigasi, nomor langkah, kotak Penjualan |
| `--warna-kedua-muda` | `#fff3cc` | Latar lembut: status menunggu, pemberitahuan |
| `--warna-kedua-tua` | `#7a5200` | Tulisan di atas latar kuning muda |
| `--warna-gagal` | `#bf2f1f` | Pesan galat, tombol hapus, label habis |
| `--warna-gagal-muda` | `#fde9e5` | Latar pesan galat |
| `--warna-teks` | `#1c1a16` | Tulisan |
| `--warna-redup` | `#625c52` | Tulisan keterangan |
| `--warna-latar` | `#f1f5ee` | Latar halaman |
| `--warna-kartu` | `#ffffff` | Latar kartu dan tiket pesanan |
| `--warna-garis` | `#dbe2d6` | Garis pemisah |
| `--warna-garis-isian` | `#7c8577` | Garis tepi isian formulir |

| Font | Variabel | Dipakai untuk |
|---|---|---|
| Plus Jakarta Sans | `--font-utama` | Font utama: isi halaman, formulir, tombol, tabel |
| Bricolage Grotesque | `--font-kedua` | Font kedua: nama aplikasi, judul, dan angka besar (jam ambil, total, nomor pesanan) |

Berkas kedua font ada di `frontend/fonts/`, diambil dari Google Fonts, jadi tampilan sama di semua perangkat tanpa bergantung pada layanan luar. Keduanya berlisensi SIL Open Font License 1.1; naskah lisensinya ada di folder yang sama.
Ikon navigasi, gambar kategori menu, dan gambar daun ditulis sebagai SVG di dalam `style.css`. Ikon tab browser ada di `frontend/favicon.svg`.

## Konfigurasi back-end

Back-end membaca environment variable berikut. Kalau tidak diisi, nilai bawaan yang dipakai.

| Variabel | Bawaan | Kegunaan |
|---|---|---|
| `PESANDULU_HOST` | `127.0.0.1` | Alamat tempat back-end menerima permintaan |
| `PESANDULU_PORT` | `5000` | Port back-end |
| `PESANDULU_ALLOWED_ORIGINS` | `http://127.0.0.1:5500,http://localhost:5500` | Alamat front-end yang boleh memanggil API, dipisah koma |
| `PESANDULU_SANDI_PENJUAL` | `penjual123` | Kata sandi login penjual. Ganti sebelum aplikasi dibuka untuk umum |

## Konfigurasi front-end

Alamat back-end yang dipanggil front-end diatur di `frontend/js/config.js`.

| Nilai | Bawaan | Dipakai saat |
|---|---|---|
| `BACKEND_LOKAL` | `http://127.0.0.1:5000` | Front-end dibuka dari `127.0.0.1` atau `localhost` |
| `BACKEND_ONLINE` | `null` | Front-end dibuka dari alamat lain, misalnya domain Vercel |

Selama `BACKEND_ONLINE` masih `null`, front-end yang online tidak memanggil API. Halamannya tetap tampil, dengan pesan bahwa back-end belum online.
Kalau back-end sudah punya alamat publik, isi alamat itu di `BACKEND_ONLINE`, lalu tambahkan alamat front-end ke `PESANDULU_ALLOWED_ORIGINS` di back-end.
Situs di Vercel memakai HTTPS, dan browser menolak panggilan dari halaman HTTPS ke alamat `http://`. Jadi untuk situs itu alamat back-end harus diawali `https://`.

## Mengubah CSS atau JavaScript

Setiap halaman memanggil CSS dan JavaScript dengan akhiran `?v=5`, misalnya `js/umum.js?v=5`.
Setiap kali CSS atau JavaScript diubah, naikkan angka itu di semua berkas HTML. Alamat yang berubah membuat browser mengambil berkas yang baru, bukan salinan lama yang disimpannya.
