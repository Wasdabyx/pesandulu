const daftar = document.getElementById("daftar-menu");
const templatItem = document.getElementById("templat-item-menu");
const daftarKosong = document.getElementById("daftar-kosong");
const pesanMenu = document.getElementById("pesan-menu");
const belumLogin = document.getElementById("belum-login");
const tombolSaring = document.querySelectorAll(".tombol-saring");
const kartuKeranjang = document.getElementById("kartu-keranjang");
const judulKeranjang = document.getElementById("judul-keranjang");
const totalKeranjang = document.getElementById("total-keranjang");
const isiKeranjang = document.getElementById("isi-keranjang");
const formulir = document.getElementById("formulir-pesanan");
const tombolPesan = document.getElementById("tombol-pesan");
const pesanKeranjang = document.getElementById("pesan-keranjang");

const keranjang = new Map();
let pelangganSaya = null;
let aturan = null;
let daftarMenu = [];
let kategoriDipilih = "";
let cetakan = null;
let pesanMuatTampil = true;

function itemKeranjang() {
  return daftarMenu
    .filter((menu) => keranjang.has(menu.id))
    .map((menu) => ({ menu_id: menu.id, nama: menu.nama, harga: menu.harga, jumlah: keranjang.get(menu.id) }));
}

function tampilkanKeranjang() {
  const items = itemKeranjang();
  let banyak = 0;
  let total = 0;
  for (const item of items) {
    banyak += item.jumlah;
    total += item.harga * item.jumlah;
  }
  judulKeranjang.textContent = `Keranjang (${banyak} item)`;
  totalKeranjang.textContent = formatRupiah(total);
  isiKeranjang.textContent = banyak > 0 ? ringkasItems(items) : "Keranjang masih kosong. Tambahkan menu dari daftar di atas.";
  tombolPesan.disabled = banyak === 0;
}

function aturItem(elemen, menu) {
  const jumlah = keranjang.get(menu.id) || 0;
  const bisaDipesan = pelangganSaya !== null && menu.tersedia;
  elemen.classList.toggle("habis", !menu.tersedia);
  elemen.querySelector(".label-habis").hidden = menu.tersedia;
  elemen.querySelector(".tombol-tambah").hidden = !bisaDipesan || jumlah > 0;
  elemen.querySelector(".penghitung").hidden = !bisaDipesan || jumlah === 0;
  elemen.querySelector(".jumlah").textContent = jumlah;
  elemen.querySelector(".tombol-lebih").disabled = jumlah >= aturan.jumlah_tertinggi;
}

function ubahJumlah(elemen, menu, selisih) {
  const jumlah = (keranjang.get(menu.id) || 0) + selisih;
  if (jumlah > 0) {
    keranjang.set(menu.id, jumlah);
  } else {
    keranjang.delete(menu.id);
  }
  aturItem(elemen, menu);
  tampilkanKeranjang();
  tampilkanPesan(pesanKeranjang, "");
}

function buatItem(menu) {
  const elemen = templatItem.content.firstElementChild.cloneNode(true);
  const tombolTambah = elemen.querySelector(".tombol-tambah");
  const tombolKurang = elemen.querySelector(".tombol-kurang");
  const tombolLebih = elemen.querySelector(".tombol-lebih");

  elemen.querySelector(".nama-item").textContent = menu.nama;
  elemen.querySelector(".harga-item").textContent = formatRupiah(menu.harga);
  tombolTambah.setAttribute("aria-label", `Tambah ${menu.nama} ke keranjang`);
  tombolKurang.setAttribute("aria-label", `Kurangi ${menu.nama}`);
  tombolLebih.setAttribute("aria-label", `Tambah ${menu.nama}`);

  tombolTambah.addEventListener("click", () => {
    ubahJumlah(elemen, menu, 1);
    tombolLebih.focus();
  });
  tombolLebih.addEventListener("click", () => ubahJumlah(elemen, menu, 1));
  tombolKurang.addEventListener("click", () => {
    ubahJumlah(elemen, menu, -1);
    if (!keranjang.has(menu.id)) {
      tombolTambah.focus();
    }
  });

  aturItem(elemen, menu);
  return elemen;
}

function tampilkanMenu() {
  const terlihat = daftarMenu.filter((menu) => kategoriDipilih === "" || menu.kategori === kategoriDipilih);
  daftar.replaceChildren(...terlihat.map(buatItem));
  daftarKosong.textContent = daftarMenu.length === 0 ? "Belum ada menu." : `Belum ada menu ${kategoriDipilih.toLowerCase()}.`;
  daftarKosong.hidden = terlihat.length > 0;
}

function keluarkanYangTidakTersedia(menuBaru) {
  const dikeluarkan = [];
  for (const menu of daftarMenu) {
    const terbaru = menuBaru.find((calon) => calon.id === menu.id);
    if (keranjang.has(menu.id) && !(terbaru && terbaru.tersedia)) {
      keranjang.delete(menu.id);
      dikeluarkan.push(menu.nama);
    }
  }
  return dikeluarkan;
}

function terapkan(pelanggan, menuBaru) {
  const dikeluarkan = keluarkanYangTidakTersedia(menuBaru);
  pelangganSaya = pelanggan;
  daftarMenu = menuBaru;
  if (pelangganSaya === null) {
    keranjang.clear();
  }
  belumLogin.hidden = pelangganSaya !== null;
  kartuKeranjang.hidden = pelangganSaya === null;
  tampilkanMenu();
  tampilkanKeranjang();
  if (dikeluarkan.length > 0) {
    tampilkanPesan(pesanKeranjang, `${dikeluarkan.join(", ")} sudah tidak tersedia dan dikeluarkan dari keranjang.`, "gagal");
  }
}

function isiPilihanWaktu() {
  const pilihan = formulir.elements.waktu_ambil;
  if (pilihan.length > 0) {
    return;
  }
  const sekarang = new Date().toTimeString().slice(0, 5);
  const berikutnya = aturan.waktu_ambil.find((waktu) => waktu > sekarang);
  for (const waktu of aturan.waktu_ambil) {
    pilihan.add(new Option(formatWaktu(waktu), waktu));
  }
  if (berikutnya) {
    pilihan.value = berikutnya;
  }
}

async function segarkan() {
  try {
    const sesi = await muatSesi();
    const pelanggan = sesi.peran === "pelanggan" ? sesi.pelanggan : null;
    if (aturan === null) {
      aturan = await panggilApi("/api/pesanan/aturan");
      isiPilihanWaktu();
    }
    const menuBaru = await panggilApi("/api/menu");
    const cetakanBaru = JSON.stringify([pelanggan, menuBaru]);
    if (cetakanBaru !== cetakan) {
      cetakan = cetakanBaru;
      terapkan(pelanggan, menuBaru);
    }
    if (pesanMuatTampil) {
      pesanMuatTampil = false;
      tampilkanPesan(pesanMenu, "");
    }
  } catch (galat) {
    pesanMuatTampil = true;
    tampilkanPesan(pesanMenu, galat.message, "gagal");
  }
}

async function kirimPesanan(peristiwa) {
  peristiwa.preventDefault();
  const isian = {
    items: itemKeranjang().map((item) => ({ menu_id: item.menu_id, jumlah: item.jumlah })),
    waktu_ambil: formulir.elements.waktu_ambil.value,
  };

  tombolPesan.disabled = true;
  try {
    const pesanan = await panggilApi("/api/pesanan", "POST", isian);
    keranjang.clear();
    tampilkanMenu();
    tampilkanPesan(pesanKeranjang, `Pesanan #${pesanan.id} dibuat. Total ${formatRupiah(pesanan.total)}, ambil pukul ${formatWaktu(pesanan.waktu_ambil)}. Pantau statusnya di halaman Pesanan.`, "ok");
  } catch (galat) {
    tampilkanPesan(pesanKeranjang, galat.message, "gagal");
    if (galat.status) {
      await segarkan();
    }
  }
  tampilkanKeranjang();
  pesanKeranjang.scrollIntoView({ block: "nearest" });
}

function pilihKategori(tombolDipilih) {
  kategoriDipilih = tombolDipilih.dataset.kategori;
  for (const tombol of tombolSaring) {
    tombol.setAttribute("aria-pressed", String(tombol === tombolDipilih));
  }
  tampilkanMenu();
}

for (const tombol of tombolSaring) {
  tombol.addEventListener("click", () => pilihKategori(tombol));
}
formulir.addEventListener("submit", kirimPesanan);
segarkan();
segarkanBerkala(segarkan);
