const statusBackend = document.getElementById("status-backend");

async function mulai() {
  try {
    const sesi = await muatSesi();
    if (sesi.peran !== null) {
      window.location.replace(HALAMAN_DASHBOARD[sesi.peran]);
      return;
    }
    const data = await panggilApi("/api/status");
    tampilkanPesan(statusBackend, `Terhubung ke back-end ${data.aplikasi}. Waktu server: ${data.waktu_server}.`, "ok");
  } catch (galat) {
    tampilkanPesan(statusBackend, galat.message, galat.belumOnline ? "" : "gagal");
  }
}

mulai();
