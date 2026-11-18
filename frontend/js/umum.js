const KUNCI_PELANGGAN = "pesandulu.pelanggan";

function formatRupiah(angka) {
  return `Rp ${angka.toLocaleString("id-ID")}`;
}

function formatNoHp(noHp) {
  return `${noHp.slice(0, 4)}-${noHp.slice(4, 8)}-${noHp.slice(8)}`;
}

function tampilkanPesan(elemen, teks, jenis = "") {
  elemen.textContent = teks;
  elemen.className = `pesan ${jenis}`.trim();
}

async function panggilApi(alamat, metode = "GET", data) {
  if (window.location.protocol === "file:") {
    throw new Error("Halaman ini dibuka langsung sebagai berkas. Jalankan server front-end (lihat README), lalu buka alamatnya di browser.");
  }

  const pilihan = { method: metode };
  if (data !== undefined) {
    pilihan.headers = { "Content-Type": "application/json" };
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

  if (!jawaban.ok) {
    const galat = new Error(isi && isi.pesan ? isi.pesan : `Permintaan gagal (HTTP ${jawaban.status}).`);
    galat.status = jawaban.status;
    throw galat;
  }
  return isi;
}

function bacaPelangganTersimpan() {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_PELANGGAN));
  } catch (galat) {
    return null;
  }
}

function simpanPelanggan(pelanggan) {
  localStorage.setItem(KUNCI_PELANGGAN, JSON.stringify(pelanggan));
}

function lupakanPelanggan() {
  localStorage.removeItem(KUNCI_PELANGGAN);
}

async function muatPelangganSaya() {
  const tersimpan = bacaPelangganTersimpan();
  if (!tersimpan) {
    return null;
  }

  try {
    const pelanggan = await panggilApi(`/api/pelanggan/${tersimpan.id}`);
    if (pelanggan.no_hp === tersimpan.no_hp) {
      return pelanggan;
    }
  } catch (galat) {
    if (galat.status !== 404) {
      throw galat;
    }
  }

  lupakanPelanggan();
  return null;
}
