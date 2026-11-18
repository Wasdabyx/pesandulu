async function periksaBackend() {
  const elemen = document.getElementById("status-backend");
  try {
    const data = await panggilApi("/api/status");
    elemen.textContent = `Terhubung ke back-end ${data.aplikasi}. Waktu server: ${data.waktu_server}.`;
    elemen.className = "pesan ok";
  } catch (galat) {
    elemen.textContent = galat.message;
    elemen.className = "pesan gagal";
  }
}

periksaBackend();
