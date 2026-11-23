const KUNCI_TOKEN = "pesandulu.token";
const SELANG_SEGARKAN_MS = 10000;
const HALAMAN_DASHBOARD = {
  pelanggan: "dashboard-pelanggan.html",
  penjual: "dashboard-penjual.html",
};

function formatRupiah(angka) {
  return `Rp ${angka.toLocaleString("id-ID")}`;
}

function formatNoHp(noHp) {
  return `${noHp.slice(0, 4)}-${noHp.slice(4, 8)}-${noHp.slice(8)}`;
}

function formatWaktu(waktu) {
  return waktu.replace(":", ".");
}

function ringkasItems(items) {
  return items.map((item) => `${item.jumlah}× ${item.nama}`).join(", ");
}

function isiLabelStatus(elemen, status) {
  elemen.className = `label-status ${status.replaceAll(" ", "-")}`;
  elemen.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

function isiPesanan(elemen, pesanan) {
  elemen.dataset.status = pesanan.status;
  elemen.querySelector(".nomor-pesanan").textContent = `#${pesanan.id}`;
  isiLabelStatus(elemen.querySelector(".label-status"), pesanan.status);
  elemen.querySelector(".isi-pesanan").textContent = ringkasItems(pesanan.items);
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

async function panggilApi(alamat, metode = "GET", data) {
  if (window.location.protocol === "file:") {
    throw new Error("Halaman ini dibuka langsung sebagai berkas. Jalankan server front-end (lihat README), lalu buka alamatnya di browser.");
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
    throw new Error(`Back-end di ${API_BASE_URL} tidak bisa dihubungi. Jalankan back-end, lalu muat ulang halaman ini.`);
  }

  const teks = await jawaban.text();
  let isi = null;
  try {
    isi = teks ? JSON.parse(teks) : null;
  } catch (galat) {
    isi = null;
  }

  if (jawaban.status === 401 && token) {
    hapusToken();
    window.location.replace("login.html");
  }
  if (!jawaban.ok) {
    const galat = new Error(isi && isi.pesan ? isi.pesan : `Permintaan gagal (HTTP ${jawaban.status}).`);
    galat.status = jawaban.status;
    throw galat;
  }
  return isi;
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
