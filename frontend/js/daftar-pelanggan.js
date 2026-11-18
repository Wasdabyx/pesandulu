const badanTabel = document.getElementById("badan-tabel-pelanggan");
const templatBaris = document.getElementById("templat-baris-pelanggan");
const isianCari = document.getElementById("isian-cari");
const daftarKosong = document.getElementById("daftar-kosong");
const pesanDaftar = document.getElementById("pesan-daftar");

let semuaPelanggan = [];

function buatBaris(pelanggan) {
  const baris = templatBaris.content.firstElementChild.cloneNode(true);
  baris.querySelector(".sel-nama").textContent = pelanggan.nama;
  baris.querySelector(".sel-no-hp").textContent = formatNoHp(pelanggan.no_hp);
  return baris;
}

function cocokDenganPencarian(pelanggan, kataKunci) {
  const tanpaPemisah = kataKunci.replace(/[\s-]/g, "");
  return pelanggan.nama.toLowerCase().includes(kataKunci) || pelanggan.no_hp.includes(tanpaPemisah);
}

function tampilkanDaftar() {
  const kataKunci = isianCari.value.trim().toLowerCase();
  const hasil = semuaPelanggan.filter((pelanggan) => cocokDenganPencarian(pelanggan, kataKunci));
  badanTabel.replaceChildren(...hasil.map(buatBaris));
  daftarKosong.textContent = semuaPelanggan.length === 0 ? "Belum ada pelanggan." : "Tidak ada pelanggan yang cocok.";
  daftarKosong.hidden = hasil.length > 0;
}

async function muatPelanggan() {
  try {
    semuaPelanggan = await panggilApi("/api/pelanggan");
    tampilkanDaftar();
    tampilkanPesan(pesanDaftar, "");
  } catch (galat) {
    tampilkanPesan(pesanDaftar, galat.message, "gagal");
  }
}

isianCari.addEventListener("input", tampilkanDaftar);
muatPelanggan();
