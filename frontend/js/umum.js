function formatRupiah(angka) {
  return `Rp ${angka.toLocaleString("id-ID")}`;
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
    throw new Error(isi && isi.pesan ? isi.pesan : `Permintaan gagal (HTTP ${jawaban.status}).`);
  }
  return isi;
}
