const judul = document.getElementById("judul-profil");
const keterangan = document.getElementById("keterangan-profil");
const formulir = document.getElementById("formulir-profil");
const tombolSimpan = document.getElementById("tombol-simpan");
const tombolHapus = document.getElementById("tombol-hapus");
const pesan = document.getElementById("pesan-profil");

let pelangganSaya = null;

function tampilkanProfil(pelanggan) {
  pelangganSaya = pelanggan;
  judul.textContent = pelanggan ? "Profil Saya" : "Daftar";
  keterangan.textContent = pelanggan ? "" : "Isi nama dan nomor HP untuk mendaftar.";
  tombolSimpan.textContent = pelanggan ? "Simpan" : "Daftar";
  tombolHapus.hidden = !pelanggan;
  formulir.elements.nama.value = pelanggan ? pelanggan.nama : "";
  formulir.elements.no_hp.value = pelanggan ? pelanggan.no_hp : "";
  formulir.hidden = false;
}

function tanganiGalat(galat) {
  if (galat.status === 404 && pelangganSaya !== null) {
    lupakanPelanggan();
    tampilkanProfil(null);
    tampilkanPesan(pesan, "Akun Anda sudah tidak ada. Silakan daftar lagi.", "gagal");
  } else {
    tampilkanPesan(pesan, galat.message, "gagal");
  }
}

async function muatProfil() {
  const adaAkunTersimpan = Boolean(bacaPelangganTersimpan());
  try {
    const pelanggan = await muatPelangganSaya();
    tampilkanProfil(pelanggan);
    if (adaAkunTersimpan && !pelanggan) {
      tampilkanPesan(pesan, "Akun yang tersimpan di perangkat ini sudah tidak ada. Silakan daftar lagi.", "gagal");
    } else {
      tampilkanPesan(pesan, "");
    }
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

  tombolSimpan.disabled = true;
  try {
    let pelanggan;
    let pesanBerhasil;
    if (pelangganSaya === null) {
      pelanggan = await panggilApi("/api/pelanggan", "POST", isian);
      pesanBerhasil = "Pendaftaran berhasil.";
    } else {
      pelanggan = await panggilApi(`/api/pelanggan/${pelangganSaya.id}`, "PATCH", isian);
      pesanBerhasil = "Profil disimpan.";
    }
    simpanPelanggan(pelanggan);
    tampilkanProfil(pelanggan);
    tampilkanPesan(pesan, pesanBerhasil, "ok");
  } catch (galat) {
    tanganiGalat(galat);
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
    lupakanPelanggan();
    tampilkanProfil(null);
    tampilkanPesan(pesan, "Akun dihapus.", "ok");
  } catch (galat) {
    tanganiGalat(galat);
  }
  pesan.scrollIntoView({ block: "nearest" });
}

formulir.addEventListener("submit", simpanProfil);
tombolHapus.addEventListener("click", hapusAkun);
muatProfil();
