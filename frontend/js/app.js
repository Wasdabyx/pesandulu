async function periksaBackend() {
  const elemen = document.getElementById("status-backend");

  if (window.location.protocol === "file:") {
    elemen.textContent = "Halaman ini dibuka langsung sebagai berkas. Jalankan server front-end (lihat README), lalu buka alamatnya di browser.";
    elemen.className = "status gagal";
    return;
  }

  try {
    const jawaban = await fetch(`${API_BASE_URL}/api/status`);
    if (!jawaban.ok) {
      throw new Error(`HTTP ${jawaban.status}`);
    }
    const data = await jawaban.json();
    elemen.textContent = `Terhubung ke back-end ${data.aplikasi}. Waktu server: ${data.waktu_server}.`;
    elemen.className = "status ok";
  } catch (galat) {
    elemen.textContent = `Back-end di ${API_BASE_URL} tidak bisa dihubungi. Jalankan back-end, lalu muat ulang halaman ini.`;
    elemen.className = "status gagal";
    console.error(galat);
  }
}

document.addEventListener("DOMContentLoaded", periksaBackend);
