const KUNCI_TOKEN = "pesandulu.token";
const SELANG_SEGARKAN_MS = 10000;
const PESAN_BELUM_ONLINE = "Back-end belum online. Halaman bisa dilihat, tetapi login, register, dan pemesanan belum bisa dipakai.";
const PESAN_TIDAK_TERHUBUNG = API_BASE_URL === BACKEND_LOKAL
  ? `Back-end di ${BACKEND_LOKAL} tidak bisa dihubungi. Jalankan back-end, lalu muat ulang halaman ini.`
  : "Server PesanDulu tidak bisa dihubungi. Periksa sambungan internet, lalu muat ulang halaman ini.";
const HALAMAN_DASHBOARD = {
  pelanggan: "dashboard-pelanggan.html",
  penjual: "dashboard-penjual.html",
};
const STATUS_AKTIF = ["menunggu", "diproses", "siap diambil"];
const NAMA_BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatRupiah(angka) {
  return `Rp ${angka.toLocaleString("id-ID")}`;
}

function formatNoHp(noHp) {
  return `${noHp.slice(0, 4)}-${noHp.slice(4, 8)}-${noHp.slice(8)}`;
}

function formatWaktu(waktu) {
  return waktu.replace(":", ".");
}

function formatTanggal(tanggal) {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);
  return `${hari} ${NAMA_BULAN[bulan - 1]} ${tahun}`;
}

function formatDibuat(dibuat) {
  return `${formatTanggal(dibuat.slice(0, 10))}, ${formatWaktu(dibuat.slice(11, 16))}`;
}

function ringkasItems(items) {
  return items.map((item) => `${item.jumlah}× ${item.nama}`).join(", ");
}

function isiLabelStatus(elemen, status) {
  elemen.className = `label-status ${status.replaceAll(" ", "-")}`;
  elemen.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

function isiCatatan(elemen, catatan) {
  elemen.hidden = catatan === "";
  elemen.textContent = catatan === "" ? "" : `Catatan: ${catatan}`;
}

function isiKeteranganBatal(elemen, pesanan) {
  const dibatalkan = pesanan.status === "dibatalkan";
  elemen.hidden = !dibatalkan;
  elemen.textContent = dibatalkan
    ? `Dibatalkan oleh ${pesanan.dibatalkan_oleh}${pesanan.alasan_batal === "" ? "" : `: ${pesanan.alasan_batal}`}`
    : "";
}

function isiWaktuPesan(elemen, pesanan) {
  elemen.hidden = !pesanan.dibuat;
  elemen.textContent = pesanan.dibuat ? `Dipesan ${formatDibuat(pesanan.dibuat)}` : "";
}

function menuHabis(menu) {
  return !menu.tersedia || menu.stok === 0;
}

function isiPesanan(elemen, pesanan) {
  elemen.dataset.status = pesanan.status;
  elemen.querySelector(".nomor-pesanan").textContent = `#${pesanan.id}`;
  isiLabelStatus(elemen.querySelector(".label-status"), pesanan.status);
  elemen.querySelector(".isi-pesanan").textContent = ringkasItems(pesanan.items);
  isiCatatan(elemen.querySelector(".catatan-pesanan"), pesanan.catatan);
  isiKeteranganBatal(elemen.querySelector(".keterangan-batal"), pesanan);
  isiWaktuPesan(elemen.querySelector(".waktu-pesan"), pesanan);
  elemen.querySelector(".jam-ambil").textContent = formatWaktu(pesanan.waktu_ambil);
  elemen.querySelector(".total-pesanan").textContent = formatRupiah(pesanan.total);
}

function tampilkanPesan(elemen, teks, jenis = "") {
  elemen.textContent = teks;
  elemen.className = `pesan ${jenis}`.trim();
}

function bacaToken() {
  const token = localStorage.getItem(KUNCI_TOKEN);
  return token && /^[\w-]+$/.test(token) ? token : null;
}

function simpanToken(token) {
  localStorage.setItem(KUNCI_TOKEN, token);
}

function hapusToken() {
  localStorage.removeItem(KUNCI_TOKEN);
}

async function mintaApi(alamat, metode, data) {
  if (window.location.protocol === "file:") {
    throw new Error("Halaman ini dibuka langsung sebagai berkas. Jalankan server front-end (lihat README), lalu buka alamatnya di browser.");
  }
  if (API_BASE_URL === null) {
    const galat = new Error(PESAN_BELUM_ONLINE);
    galat.belumOnline = true;
    throw galat;
  }

  const token = bacaToken();
  const pilihan = { method: metode, headers: {} };
  if (token) {
    pilihan.headers.Authorization = `Bearer ${token}`;
  }
  if (data !== undefined) {
    pilihan.headers["Content-Type"] = "application/json";
    pilihan.body = JSON.stringify(data);
  }

  let jawaban;
  try {
    jawaban = await fetch(`${API_BASE_URL}${alamat}`, pilihan);
  } catch (galat) {
    throw new Error(PESAN_TIDAK_TERHUBUNG);
  }

  if (jawaban.status === 401 && token) {
    hapusToken();
    window.location.replace("login.html");
  }
  if (!jawaban.ok) {
    const isi = await jawaban.json().catch(() => null);
    const galat = new Error(isi && isi.pesan ? isi.pesan : `Permintaan gagal (HTTP ${jawaban.status}).`);
    galat.status = jawaban.status;
    throw galat;
  }
  return jawaban;
}

async function panggilApi(alamat, metode = "GET", data) {
  const jawaban = await mintaApi(alamat, metode, data);
  return jawaban.json().catch(() => null);
}

async function unduhBerkas(alamat, namaBerkas) {
  const jawaban = await mintaApi(alamat, "GET");
  let isi;
  try {
    isi = await jawaban.blob();
  } catch (galat) {
    throw new Error(PESAN_TIDAK_TERHUBUNG);
  }

  const alamatBerkas = URL.createObjectURL(isi);
  const tautan = document.createElement("a");
  tautan.href = alamatBerkas;
  tautan.download = namaBerkas;
  document.body.append(tautan);
  tautan.click();
  tautan.remove();
  window.setTimeout(() => URL.revokeObjectURL(alamatBerkas), 60000);
}

async function muatSesi() {
  if (!bacaToken()) {
    return { peran: null, pelanggan: null };
  }
  const sesi = await panggilApi("/api/sesi");
  if (sesi.peran === null) {
    hapusToken();
  }
  return sesi;
}

async function wajibLogin(peran) {
  const sesi = await muatSesi();
  if (sesi.peran === peran) {
    return sesi;
  }
  window.location.replace(sesi.peran === null ? "login.html" : HALAMAN_DASHBOARD[sesi.peran]);
  return null;
}

async function logout() {
  await panggilApi("/api/logout", "POST").catch(() => null);
  hapusToken();
  window.location.href = "index.html";
}

function segarkanBerkala(segarkan) {
  window.setInterval(() => {
    if (!document.hidden) {
      segarkan();
    }
  }, SELANG_SEGARKAN_MS);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      segarkan();
    }
  });
}

window.addEventListener("pageshow", (peristiwa) => {
  if (peristiwa.persisted) {
    window.location.reload();
  }
});

for (const tombol of document.querySelectorAll(".tombol-logout")) {
  tombol.addEventListener("click", logout);
}

for (const kotak of document.querySelectorAll(".tampilkan-sandi")) {
  kotak.addEventListener("change", () => {
    document.getElementById(kotak.dataset.untuk).type = kotak.checked ? "text" : "password";
  });
}
