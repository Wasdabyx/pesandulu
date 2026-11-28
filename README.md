# PesanDulu

Aplikasi web pre-order makanan dan minuman untuk stand kelompok di market day kampus.
Proyek mata kuliah CAK3EAB3 Komputasi Awan dan Terdistribusi.

| Bagian | Alamat |
|---|---|
| Situs (front-end di Vercel) | https://pesandulu.vercel.app |
| Back-end (di PythonAnywhere) | https://muhammadhunafa.pythonanywhere.com/api/status |

## Struktur

| Folder | Isi |
|---|---|
| `backend/` | API dengan Python dan Flask. Data berupa list of dict yang disimpan ke satu berkas JSON, tanpa database. |
| `frontend/` | Halaman statis (HTML, CSS, JavaScript) yang memanggil API lewat HTTP. |

## Repositori

Seluruh kode PesanDulu, back-end dan front-end, disimpan di satu repositori Git dengan satu branch, `main`. Setiap tempat pemasangan mengambil kodenya dari repositori ini. Yang berbeda di tiap tempat hanya konfigurasinya.

| Tempat pemasangan | Yang dijalankan | Konfigurasi |
|---|---|---|
| Laptop anggota, untuk pengembangan | Back-end dan front-end | `backend/.env` dan `frontend/js/config.js` |
| Vercel | Front-end | `frontend/js/config.js` |
| PythonAnywhere | Back-end sebagai web app | `backend/.env` |
| Server Linux, misalnya instance EC2 | Back-end sebagai layanan systemd | `backend/.env` |

Berkas `.env` dan folder `.venv` sengaja tidak ikut Git. Keduanya dibuat di tiap tempat pemasangan dari `.env.example` dan `requirements.txt`. Berkas data `data.json`, yang dibuat back-end saat berjalan, juga tidak ikut Git. Begitu pula berkas kunci untuk masuk ke server, yang berakhiran `.pem` atau `.ppk`. Daftar lengkap yang tidak ikut Git ada di `.gitignore`.

## Menjalankan di Windows

Back-end butuh Python 3.11 atau lebih baru. Semua perintah back-end dijalankan dari folder `backend`. Pilih salah satu cara.

Cara 1, dengan conda, di Anaconda Prompt atau terminal lain yang mengenal perintah `conda`:

```
conda env create -f environment.yml
conda activate pesandulu
copy .env.example .env
python app.py
```

Cara 2, dengan venv:

```
py -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env
.venv\Scripts\python app.py
```

Pemasangan paket dan `copy` cukup sekali. Sesudah itu back-end dijalankan dengan baris terakhir saja. Pada cara 1, `conda activate pesandulu` diulang setiap membuka terminal baru.
Kalau `requirements.txt` berubah, jalankan lagi `conda env update -f environment.yml` atau baris `pip install` tadi.

Back-end berjalan di `http://127.0.0.1:5000`. Coba buka `http://127.0.0.1:5000/api/status`. Hentikan back-end dengan Ctrl+C.
Data tersimpan di `backend\data.json`, jadi tetap ada saat back-end dijalankan lagi. Untuk kembali ke data awal, hapus berkas itu.

Front-end, di terminal kedua, dari folder `frontend`:

```
py -m http.server 5500 --bind 127.0.0.1
```

Kalau perintah `py` tidak dikenali, misalnya di Anaconda Prompt, ganti `py` dengan `python`.

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

## Memasang back-end di PythonAnywhere

PythonAnywhere menjalankan back-end sebagai web app dengan alamat `https://<nama pengguna>.pythonanywhere.com`. Akun yang dibuat di eu.pythonanywhere.com mendapat alamat `https://<nama pengguna>.eu.pythonanywhere.com`. Akun gratisnya cukup untuk satu web app.
Buka konsol Bash di PythonAnywhere, lalu masukkan perintah berikut satu baris per satu baris.

```
git clone https://github.com/Wasdabyx/pesandulu.git
mkvirtualenv --python=/usr/bin/python3.13 pesandulu
pip install -r pesandulu/backend/requirements.txt
cp pesandulu/backend/.env.example pesandulu/backend/.env
nano pesandulu/backend/.env
```

Di `.env`, ganti dua nilai berikut. Tiga baris lainnya dibiarkan seperti contoh.

| Variabel | Nilai di PythonAnywhere |
|---|---|
| `PESANDULU_ALLOWED_ORIGINS` | `https://pesandulu.vercel.app`, alamat front-end di Vercel |
| `PESANDULU_SANDI_PENJUAL` | Kata sandi baru, bukan kata sandi contoh |

Simpan dan keluar dari `nano` dengan `Ctrl+X`, lalu `Y`, lalu `Enter`. Sesudah itu, di tab Web:

1. Pilih Add a new web app, lalu Manual configuration, lalu Python 3.13.
2. Di bagian Virtualenv, isi `pesandulu`.
3. Buka WSGI configuration file, ganti seluruh isinya dengan kode di bawah, lalu simpan.
4. Tekan tombol Reload.

```
import os
import sys
import time

os.environ["TZ"] = "Asia/Jakarta"
time.tzset()
sys.path.insert(0, os.path.expanduser("~/pesandulu/backend"))
from app import app as application
```

Coba buka alamat web app itu ditambah `/api/status`, misalnya `https://<nama pengguna>.pythonanywhere.com/api/status`. Kalau yang tampil halaman galat, pesan dari back-end tertulis di Error log pada tab Web.
Kalau kata sandi penjual masih kata sandi contoh, back-end menulis peringatan di Error log setiap kali dimuat.
Jam di server PythonAnywhere memakai UTC. Dua baris `TZ` di kode itu membuat back-end memakai WIB, jadi `waktu_server` menunjukkan jam WIB.
PythonAnywhere memakai server HTTP miliknya sendiri, bukan waitress, jadi `PESANDULU_HOST` dan `PESANDULU_PORT` tidak dipakai di sana. Keduanya tetap harus terisi.
Data tersimpan di `pesandulu/backend/data.json`, jadi tetap ada setelah Reload.
Setiap kali `.env` diubah, tekan Reload supaya nilai yang baru dipakai.
Untuk memperbarui kode, jalankan `git pull` dari folder `pesandulu` di konsol Bash, lalu tekan Reload. Kalau `requirements.txt` ikut berubah, jalankan dulu `workon pesandulu`, lalu `pip install -r backend/requirements.txt`.
Web app di akun gratis berlaku satu bulan, lalu berhenti kalau tidak diperpanjang. Tombol perpanjangannya ada di tab Web.

## Memasang back-end di server Linux

Di server, misalnya instance EC2, back-end dijalankan sebagai layanan systemd bernama `pesandulu`. Layanan itu ikut menyala setiap server dinyalakan, dan dijalankan lagi kalau programnya mati mendadak.
Perintah berikut untuk Ubuntu 24.04 atau lebih baru dengan pengguna `ubuntu`, dimulai dari folder home pengguna itu.
Masukkan perintahnya satu baris per satu baris, dan tunggu prompt muncul lagi sebelum baris berikutnya. Kalau beberapa baris ditempel sekaligus, di sebagian terminal hanya baris pertama yang jalan.

```
sudo apt update
sudo apt install -y git python3-venv
git clone https://github.com/Wasdabyx/pesandulu.git
cd pesandulu/backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
cp .env.example .env
chmod 600 .env
```

Perintah `chmod 600` membuat `.env` hanya bisa dibaca oleh pengguna itu. Buka `.env`, misalnya dengan `nano .env`, lalu ganti isinya dengan nilai untuk server.

| Variabel | Nilai di server |
|---|---|
| `PESANDULU_HOST` | `0.0.0.0`, supaya back-end bisa dipanggil dari luar server |
| `PESANDULU_PORT` | `5000`, sama dengan contoh |
| `PESANDULU_ALLOWED_ORIGINS` | Alamat front-end yang sudah online, yaitu `http://` diikuti alamat publik server front-end |
| `PESANDULU_SANDI_PENJUAL` | Kata sandi baru, bukan kata sandi contoh |
| `PESANDULU_BERKAS_DATA` | `/var/lib/pesandulu/data.json`, di folder yang disiapkan systemd untuk layanan ini |

Alamat front-end ditulis lengkap dengan `http://` di depannya. Selama front-end belum punya alamat, baris itu boleh dibiarkan seperti contoh.
Di `nano`, simpan dan keluar dengan `Ctrl+X`, lalu `Y`, lalu `Enter`.

Sesudah itu, masih dari folder `backend`, pasang layanannya.

```
sudo cp pesandulu.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now pesandulu
systemctl status pesandulu
```

Baris `Active: active (running)` berarti back-end sudah berjalan. Di terminal, `systemctl status` menahan layar sampai tombol `q` ditekan.
Kalau yang tampil `Active: failed` dengan `status=78/CONFIG`, isi `.env` belum benar dan pesannya tertulis di baris catatan di bawahnya. Perbaiki `.env`, lalu jalankan `sudo systemctl restart pesandulu`.
Dari server itu sendiri, coba `curl http://127.0.0.1:5000/api/status`.
Dari luar, back-end dibuka di port 5000 pada alamat publik server, setelah port itu diizinkan di firewall server, misalnya di security group EC2.

| Perintah | Kegunaan |
|---|---|
| `systemctl status pesandulu` | Melihat keadaan layanan dan beberapa baris catatan terakhir |
| `systemctl status pesandulu --no-pager -l` | Sama, tetapi langsung kembali ke prompt dan baris catatannya tidak dipotong |
| `journalctl -u pesandulu -n 50` | Melihat 50 baris catatan terakhir |
| `sudo systemctl restart pesandulu` | Menjalankan ulang layanan, misalnya setelah `.env` diubah |
| `sudo systemctl stop pesandulu` | Menghentikan layanan |

Data tersimpan di `/var/lib/pesandulu/data.json`, jadi tetap ada saat layanan atau servernya dijalankan ulang.
Untuk memperbarui kode di server, jalankan `git pull`, lalu `.venv/bin/python -m pip install -r requirements.txt`, lalu `sudo systemctl restart pesandulu`.
Kalau `pesandulu.service` ikut berubah, salin lagi berkas itu ke `/etc/systemd/system/` dan jalankan `sudo systemctl daemon-reload` sebelum `restart`.

Isi `backend/pesandulu.service`:

| Baris | Arti |
|---|---|
| `Description=Back-end PesanDulu` | Keterangan yang tampil di `systemctl status` |
| `After=network.target` | Layanan dimulai setelah jaringan server disiapkan |
| `User=ubuntu` | Program berjalan sebagai pengguna `ubuntu`, bukan root |
| `WorkingDirectory=/home/ubuntu/pesandulu/backend` | Folder tempat program dijalankan |
| `ExecStart=/home/ubuntu/pesandulu/backend/.venv/bin/python app.py` | Perintah yang dijalankan: Python dari `.venv` menjalankan `app.py` |
| `SyslogIdentifier=pesandulu` | Nama program di catatan |
| `Restart=on-failure` dan `RestartSec=5` | Kalau program mati karena galat, systemd menjalankannya lagi 5 detik kemudian |
| `RestartPreventExitStatus=78` | Pengecualian: kalau konfigurasi salah, back-end berhenti dengan kode 78 dan tidak dijalankan lagi sampai diperbaiki |
| `NoNewPrivileges=true` | Program tidak bisa memperoleh hak root, misalnya lewat `sudo` |
| `ProtectSystem=strict` dan `ProtectHome=read-only` | Program hanya bisa membaca berkas di server, tidak bisa mengubahnya, kecuali di folder datanya |
| `PrivateTmp=true` | Program mendapat folder `/tmp` sendiri |
| `StateDirectory=pesandulu` | systemd menyiapkan folder `/var/lib/pesandulu` milik pengguna tadi, tempat program menulis berkas data |
| `WantedBy=multi-user.target` | Dengan `systemctl enable`, layanan dijalankan setiap server dinyalakan |

Kalau repositori disalin ke folder lain atau pengguna servernya bukan `ubuntu`, sesuaikan `User`, `WorkingDirectory`, dan `ExecStart` sebelum berkas itu disalin ke `/etc/systemd/system/`.

## Halaman

| Halaman | Alamat | Pengguna |
|---|---|---|
| Halaman depan | `/` | Semua |
| Login | `/login.html` | Semua |
| Register | `/register.html` | Semua |
| Profil Anggota | `/anggota.html` | Semua |
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
Profil Anggota memuat profil anggota kelompok. Halaman itu statis dan tidak memanggil API, jadi tetap tampil walaupun back-end tidak bisa dihubungi.

## Login

| Peran | Cara login | Akun contoh |
|---|---|---|
| Penjual | Kata sandi | `penjual123` |
| Pelanggan | No. HP dan kata sandi | `081200000001` sampai `081200000004`, kata sandi `pelanggan123` |

Pelanggan baru membuat akun di halaman Register. Kata sandi penjual diatur lewat `PESANDULU_SANDI_PENJUAL`; `penjual123` adalah nilai di `backend/.env.example`. Di back-end yang online, nilai itu diganti dengan kata sandi lain.

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
Kalau perubahan tidak bisa ditulis ke berkas data, jawabannya 503 dengan bentuk yang sama, dan perubahan itu dibatalkan.

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

Data awal ada di `backend/data.py` dan dipakai kalau berkas data belum ada. Setiap perubahan langsung ditulis ke berkas data, jadi menu, pelanggan, dan pesanan tetap ada setelah back-end dijalankan ulang.
Sesi login tidak ikut disimpan, jadi setelah back-end dijalankan ulang semua pengguna login lagi.

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

## Dependensi

Semua paket Python yang dibutuhkan back-end ditulis di `backend/requirements.txt`, masing-masing dengan versi yang pasti.

| Paket | Dipakai untuk |
|---|---|
| Flask | Kerangka API |
| flask-cors | Izin akses dari alamat front-end (CORS) |
| python-dotenv | Membaca berkas `.env` |
| waitress | Server HTTP yang menjalankan aplikasi |
| Werkzeug | Hash kata sandi dan galat HTTP |

Back-end dijalankan oleh waitress dengan satu utas pekerja. Permintaan dilayani satu per satu, sehingga data tidak diubah oleh dua permintaan pada saat yang sama. Isi satu permintaan dibatasi 1 MiB.
Kalau aplikasinya dijalankan server lain, misalnya di PythonAnywhere, back-end sendiri yang membuat permintaan bergiliran dan menolak isi di atas 1 MiB.
Lima paket lain di berkas itu (blinker, click, itsdangerous, Jinja2, MarkupSafe) dibutuhkan oleh Flask. Versinya ikut dikunci supaya setiap pemasangan menghasilkan susunan paket yang sama.

`backend/environment.yml` membuat lingkungan conda bernama `pesandulu` berisi Python 3.13, lalu memasang paket dari `requirements.txt`. Jadi daftar paket hanya ditulis di satu tempat.
Paket dipasang di lingkungan conda itu atau di folder `.venv`, bukan di Python milik sistem. Untuk menambah paket atau menaikkan versinya, ubah `requirements.txt`, lalu pasang lagi.
Daftar paket ini diuji dengan Python 3.11 sampai 3.14.

Front-end tidak memakai paket atau pustaka dari luar, jadi tidak membutuhkan `package.json`. Dua font yang dipakai disimpan di `frontend/fonts/`, dan tidak ada berkas yang diambil dari CDN.

## Konfigurasi back-end

Back-end mengambil semua konfigurasinya dari environment variable. Di dalam kode tidak ada nilai bawaan.

| Variabel | Nilai di `.env.example` | Kegunaan |
|---|---|---|
| `PESANDULU_HOST` | `127.0.0.1` | Alamat IP tempat back-end menerima permintaan. `127.0.0.1` berarti hanya dari komputer itu sendiri, `0.0.0.0` berarti dari mana saja |
| `PESANDULU_PORT` | `5000` | Port back-end |
| `PESANDULU_ALLOWED_ORIGINS` | `http://127.0.0.1:5500,http://localhost:5500` | Alamat front-end yang boleh memanggil API, dipisah koma, tanpa nama halaman di belakangnya |
| `PESANDULU_SANDI_PENJUAL` | `penjual123` | Kata sandi login penjual. Ganti sebelum aplikasi dibuka untuk umum |
| `PESANDULU_BERKAS_DATA` | `data.json` | Berkas tempat back-end menyimpan data. Nama tanpa folder berarti di dalam folder `backend` |

Untuk pengembangan di laptop, variabel itu ditulis di berkas `backend/.env`. Berkas `backend/.env.example` berisi konfigurasi pengembangan dan tinggal disalin menjadi `.env`.
Berkas `.env` tidak ikut Git, jadi setiap tempat pemasangan punya konfigurasinya sendiri sedangkan kodenya sama.
Environment variable yang diisi langsung di terminal atau di server mengalahkan isi `.env`.
Kalau ada variabel yang belum diisi atau nilainya salah, back-end tidak mau berjalan dan menyebutkan variabel mana yang harus diperbaiki.
Di berkas `.env`, nilai yang memuat spasi atau tanda `#` ditulis di antara tanda kutip tunggal, misalnya `PESANDULU_SANDI_PENJUAL='sate #1 enak'`.

Berkas data berisi menu, pelanggan, dan pesanan dalam format JSON. Kata sandi pelanggan di dalamnya berupa hash. Berkas itu dibuat saat back-end pertama kali berjalan, berisi data awal.
Back-end memuat berkas itu lagi setiap kali isinya berubah. Jadi kalau berkasnya dihapus, back-end kembali ke data awal, dan kalau isinya diganti, isi yang baru yang dipakai.
Kalau isi berkas itu tidak sah, back-end tidak mau berjalan dan menyebutkan bagian yang salah. Kalau itu terjadi selagi back-end berjalan, data terakhir tetap bisa dilihat, tetapi perubahan ditolak sampai berkasnya diperbaiki.
Satu berkas data hanya untuk satu back-end yang sedang berjalan.

## Konfigurasi front-end

Alamat back-end yang dipanggil front-end diatur di `frontend/js/config.js`.

| Nilai | Bawaan | Dipakai saat |
|---|---|---|
| `BACKEND_LOKAL` | `http://127.0.0.1:5000` | Front-end dibuka dari `127.0.0.1` atau `localhost` |
| `BACKEND_ONLINE` | `https://muhammadhunafa.pythonanywhere.com` | Front-end dibuka dari alamat lain, misalnya domain Vercel |

`BACKEND_ONLINE` berisi alamat back-end di PythonAnywhere, ditulis tanpa garis miring di akhir. Alamat front-end yang memanggilnya harus terdaftar di `PESANDULU_ALLOWED_ORIGINS` di back-end itu.
Kalau `BACKEND_ONLINE` diisi `null`, front-end yang online tidak memanggil API. Halamannya tetap tampil, dengan pesan bahwa back-end belum online.
Situs di Vercel memakai HTTPS, dan browser menolak panggilan dari halaman HTTPS ke alamat `http://`. Jadi untuk situs itu alamat back-end harus diawali `https://`.

## Mengubah CSS atau JavaScript

Setiap halaman memanggil CSS dan JavaScript dengan akhiran `?v=7`, misalnya `js/umum.js?v=7`.
Setiap kali CSS atau JavaScript diubah, naikkan angka itu di semua berkas HTML. Alamat yang berubah membuat browser mengambil berkas yang baru, bukan salinan lama yang disimpannya.
