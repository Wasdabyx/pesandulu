const badanTabel = document.getElementById("badan-tabel-menu");
const templatBaris = document.getElementById("templat-baris-menu");
const daftarKosong = document.getElementById("daftar-kosong");
const pesanDaftar = document.getElementById("pesan-daftar");
const tombolTambah = document.getElementById("tombol-tambah");
const formulir = document.getElementById("formulir-menu");
const judulFormulir = document.getElementById("judul-formulir");
const pesanFormulir = document.getElementById("pesan-formulir");
const tombolSimpan = document.getElementById("tombol-simpan");
const tombolBatal = document.getElementById("tombol-batal");

let idYangDiubah = null;
let stokAwal = null;
let menuTerakhir = [];
let cetakan = null;
let galatMuatTampil = false;

function teksKetersediaan(tersedia) {
  return tersedia ? "Ya" : "Habis";
}

function buatBaris(menu) {
  const baris = templatBaris.content.firstElementChild.cloneNode(true);
  const sakelar = baris.querySelector(".sakelar");
  const teksSakelar = baris.querySelector(".teks-sakelar");
  const selStok = baris.querySelector(".sel-stok");

  baris.querySelector(".sel-nama").textContent = menu.nama;
  baris.querySelector(".sel-kategori").textContent = menu.kategori;
  baris.querySelector(".sel-harga").textContent = formatRupiah(menu.harga);
  selStok.textContent = menu.stok === null ? "–" : menu.stok;
  selStok.classList.toggle("habis", menu.stok === 0);
  if (menu.stok === null) {
    selStok.title = "Tidak dibatasi";
    selStok.setAttribute("aria-label", "Tidak dibatasi");
  }
  sakelar.checked = menu.tersedia;
  sakelar.setAttribute("aria-label", `${menu.nama} tersedia`);
  teksSakelar.textContent = teksKetersediaan(menu.tersedia);

  sakelar.addEventListener("change", () => ubahKetersediaan(menu, sakelar, teksSakelar));
  baris.querySelector(".tombol-ubah").addEventListener("click", () => bukaFormulir(menu));
  baris.querySelector(".tombol-hapus").addEventListener("click", () => hapusMenu(menu));
  return baris;
}

async function muatMenu() {
  const sesi = await wajibLogin("penjual");
  if (!sesi) {
    return;
  }
  const daftarMenu = await panggilApi("/api/menu");
  const cetakanBaru = JSON.stringify(daftarMenu);
  if (cetakanBaru !== cetakan) {
    cetakan = cetakanBaru;
    menuTerakhir = daftarMenu;
    badanTabel.replaceChildren(...daftarMenu.map(buatBaris));
    daftarKosong.hidden = daftarMenu.length > 0;
  }
}

async function segarkanDiam() {
  try {
    await muatMenu();
    if (galatMuatTampil) {
      galatMuatTampil = false;
      tampilkanPesan(pesanDaftar, "");
    }
  } catch (galat) {
    galatMuatTampil = true;
    tampilkanPesan(pesanDaftar, galat.message, "gagal");
  }
}

async function segarkan(pesan = "", jenis = "ok") {
  try {
    await muatMenu();
    galatMuatTampil = false;
    tampilkanPesan(pesanDaftar, pesan, jenis);
  } catch (galat) {
    galatMuatTampil = true;
    tampilkanPesan(pesanDaftar, galat.message, "gagal");
  }
}

function siapkanFormulir(menu) {
  formulir.reset();
  idYangDiubah = menu ? menu.id : null;
  stokAwal = menu ? menu.stok : null;
  judulFormulir.textContent = menu ? "Ubah Menu" : "Tambah Menu";
  if (menu) {
    formulir.elements.nama.value = menu.nama;
    formulir.elements.kategori.value = menu.kategori;
    formulir.elements.harga.value = menu.harga;
    formulir.elements.stok.value = menu.stok === null ? "" : menu.stok;
    formulir.elements.tersedia.checked = menu.tersedia;
  }
  tampilkanPesan(pesanFormulir, "");
}

function bukaFormulir(menu) {
  siapkanFormulir(menu);
  formulir.elements.nama.focus();
}

async function simpanMenu(peristiwa) {
  peristiwa.preventDefault();
  const isian = {
    nama: formulir.elements.nama.value,
    kategori: formulir.elements.kategori.value,
    harga: Number(formulir.elements.harga.value),
    tersedia: formulir.elements.tersedia.checked,
  };
  const stok = formulir.elements.stok.value === "" ? null : Number(formulir.elements.stok.value);
  if (idYangDiubah === null || stok !== stokAwal) {
    isian.stok = stok;
  }

  tombolSimpan.disabled = true;
  try {
    let menu;
    if (idYangDiubah === null) {
      menu = await panggilApi("/api/menu", "POST", isian);
    } else {
      menu = await panggilApi(`/api/menu/${idYangDiubah}`, "PATCH", isian);
    }
    siapkanFormulir(null);
    tampilkanPesan(pesanFormulir, `Menu ${menu.nama} disimpan.`, "ok");
    await segarkan();
  } catch (galat) {
    tampilkanPesan(pesanFormulir, galat.message, "gagal");
  } finally {
    tombolSimpan.disabled = false;
  }
}

async function ubahKetersediaan(menu, sakelar, teksSakelar) {
  try {
    const hasil = await panggilApi(`/api/menu/${menu.id}`, "PATCH", { tersedia: sakelar.checked });
    menu.tersedia = hasil.tersedia;
    cetakan = JSON.stringify(menuTerakhir);
    teksSakelar.textContent = teksKetersediaan(menu.tersedia);
    if (idYangDiubah === menu.id) {
      formulir.elements.tersedia.checked = menu.tersedia;
    }
    tampilkanPesan(pesanDaftar, `${menu.nama} ditandai ${menu.tersedia ? "tersedia" : "habis"}.`, "ok");
  } catch (galat) {
    sakelar.checked = menu.tersedia;
    await segarkan(galat.message, "gagal");
  }
}

async function hapusMenu(menu) {
  if (!window.confirm(`Hapus menu ${menu.nama}?`)) {
    return;
  }
  try {
    await panggilApi(`/api/menu/${menu.id}`, "DELETE");
    if (idYangDiubah === menu.id) {
      siapkanFormulir(null);
    }
    await segarkan(`Menu ${menu.nama} dihapus.`);
  } catch (galat) {
    await segarkan(galat.message, "gagal");
  }
  tombolTambah.focus({ preventScroll: true });
}

formulir.addEventListener("submit", simpanMenu);
tombolTambah.addEventListener("click", () => bukaFormulir(null));
tombolBatal.addEventListener("click", () => siapkanFormulir(null));
segarkan();
segarkanBerkala(segarkanDiam);
