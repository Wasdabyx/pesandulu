const formulir = document.getElementById("formulir-register");
const tombolRegister = document.getElementById("tombol-register");
const pesan = document.getElementById("pesan-register");

async function mulai() {
  try {
    const sesi = await muatSesi();
    if (sesi.peran !== null) {
      window.location.replace(HALAMAN_DASHBOARD[sesi.peran]);
      return;
    }
    formulir.hidden = false;
    tampilkanPesan(pesan, "");
  } catch (galat) {
    tampilkanPesan(pesan, galat.message, "gagal");
  }
}

async function kirimRegister(peristiwa) {
  peristiwa.preventDefault();
  const isian = {
    nama: formulir.elements.nama.value,
    no_hp: formulir.elements.no_hp.value,
    kata_sandi: formulir.elements.kata_sandi.value,
  };

  tombolRegister.disabled = true;
  try {
    await panggilApi("/api/pelanggan", "POST", isian);
    const hasil = await panggilApi("/api/login", "POST", { peran: "pelanggan", no_hp: isian.no_hp, kata_sandi: isian.kata_sandi });
    simpanToken(hasil.token);
    window.location.href = HALAMAN_DASHBOARD.pelanggan;
  } catch (galat) {
    tampilkanPesan(pesan, galat.message, "gagal");
    tombolRegister.disabled = false;
  }
}

formulir.addEventListener("submit", kirimRegister);
mulai();
