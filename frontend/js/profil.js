const formulir = document.getElementById("formulir-profil");
const tombolSimpan = document.getElementById("tombol-simpan");
const tombolHapus = document.getElementById("tombol-hapus");
const pesan = document.getElementById("pesan-profil");

let pelangganSaya = null;

function isiFormulir(pelanggan) {
  pelangganSaya = pelanggan;
  formulir.elements.nama.value = pelanggan.nama;
  formulir.elements.no_hp.value = pelanggan.no_hp;
  formulir.elements.kata_sandi.value = "";
  formulir.hidden = false;
}

async function muatProfil() {
  try {
    const sesi = await wajibLogin("pelanggan");
    if (!sesi) {
      return;
    }
    isiFormulir(sesi.pelanggan);
    tampilkanPesan(pesan, "");
  } catch (galat) {
    tampilkanPesan(pesan, galat.message, "gagal");
  }
}

async function simpanProfil(peristiwa) {
  peristiwa.preventDefault();
  const isian = {
    nama: formulir.elements.nama.value,
    no_hp: formulir.elements.no_hp.value,
  };
  if (formulir.elements.kata_sandi.value !== "") {
    isian.kata_sandi = formulir.elements.kata_sandi.value;
  }

  tombolSimpan.disabled = true;
  try {
    const pelanggan = await panggilApi(`/api/pelanggan/${pelangganSaya.id}`, "PATCH", isian);
    isiFormulir(pelanggan);
    tampilkanPesan(pesan, isian.kata_sandi ? "Profil dan kata sandi disimpan." : "Profil disimpan.", "ok");
  } catch (galat) {
    tampilkanPesan(pesan, galat.message, "gagal");
  } finally {
    tombolSimpan.disabled = false;
  }
  pesan.scrollIntoView({ block: "nearest" });
}

async function hapusAkun() {
  if (!window.confirm("Hapus akun Anda? Tindakan ini tidak bisa dibatalkan.")) {
    return;
  }
  try {
    await panggilApi(`/api/pelanggan/${pelangganSaya.id}`, "DELETE");
    hapusToken();
    window.location.href = "index.html";
  } catch (galat) {
    tampilkanPesan(pesan, galat.message, "gagal");
    pesan.scrollIntoView({ block: "nearest" });
  }
}

formulir.addEventListener("submit", simpanProfil);
tombolHapus.addEventListener("click", hapusAkun);
muatProfil();
