async function periksaBackend() {
  const elemen = document.getElementById("status-backend");
  try {
    const data = await panggilApi("/api/status");
    tampilkanPesan(elemen, `Terhubung ke back-end ${data.aplikasi}. Waktu server: ${data.waktu_server}.`, "ok");
  } catch (galat) {
    tampilkanPesan(elemen, galat.message, "gagal");
  }
}

periksaBackend();
