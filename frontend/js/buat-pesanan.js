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
const keteranganWaktu = document.getElementById("keterangan-waktu");

const keranjang = new Map();
let pelangganSaya = null;
let aturan = null;
let daftarMenu = [];
let waktuPenuh = [];
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
  const waktuPenuhDipilih = tampilkanKeteranganWaktu();
  tombolPesan.disabled = banyak === 0 || waktuPenuhDipilih;
}

function tampilkanKeteranganWaktu() {
  const waktu = formulir.elements.waktu_ambil.value;
  const penuh = waktuPenuh.includes(waktu);
  const semuaPenuh = aturan !== null && waktuPenuh.length >= aturan.waktu_ambil.length;
  keteranganWaktu.hidden = !penuh;
  if (penuh) {
    keteranganWaktu.textContent = semuaPenuh ? "Semua waktu ambil sudah penuh. Coba lagi nanti." : `Waktu ambil ${formatWaktu(waktu)} sudah penuh. Pilih waktu lain.`;
  }
  return penuh;
}

function batasJumlah(menu) {
  return menu.stok === null ? aturan.jumlah_tertinggi : Math.min(aturan.jumlah_tertinggi, menu.stok);
}

function aturItem(elemen, menu) {
  const jumlah = keranjang.get(menu.id) || 0;
  const habis = menuHabis(menu);
  const bisaDipesan = pelangganSaya !== null && !habis;
  const sisa = elemen.querySelector(".sisa-item");
  elemen.classList.toggle("habis", habis);
  elemen.querySelector(".label-habis").hidden = !habis;
  sisa.hidden = habis || menu.stok === null;
  sisa.textContent = menu.stok === null ? "" : `Sisa ${menu.stok}`;
  elemen.querySelector(".tombol-tambah").hidden = !bisaDipesan || jumlah > 0;
  elemen.querySelector(".penghitung").hidden = !bisaDipesan || jumlah === 0;
  elemen.querySelector(".jumlah").textContent = jumlah;
  elemen.querySelector(".tombol-lebih").disabled = jumlah >= batasJumlah(menu);
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

  elemen.dataset.kategori = menu.kategori;
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

function sesuaikanKeranjang(menuBaru) {
  const kalimat = [];
  const dikeluarkan = [];
  const dikurangi = [];
  for (const menu of daftarMenu) {
    if (!keranjang.has(menu.id)) {
      continue;
    }
    const terbaru = menuBaru.find((calon) => calon.id === menu.id);
    if (!terbaru || menuHabis(terbaru)) {
      keranjang.delete(menu.id);
      dikeluarkan.push(menu.nama);
    } else if (terbaru.stok !== null && keranjang.get(menu.id) > terbaru.stok) {
      keranjang.set(menu.id, terbaru.stok);
      dikurangi.push(`${terbaru.nama} menjadi ${terbaru.stok}`);
    }
  }
  if (dikeluarkan.length > 0) {
    kalimat.push(`${dikeluarkan.join(", ")} sudah tidak tersedia dan dikeluarkan dari keranjang.`);
  }
  if (dikurangi.length > 0) {
    kalimat.push(`Stok berkurang, jadi jumlah di keranjang disesuaikan: ${dikurangi.join(", ")}.`);
  }
  return kalimat.join(" ");
}

function waktuKosongSesudah(batas) {
  const kosong = (waktu) => !waktuPenuh.includes(waktu);
  return aturan.waktu_ambil.find((waktu) => waktu > batas && kosong(waktu)) || aturan.waktu_ambil.find(kosong);
}

function aturPilihanWaktu() {
  const pilihan = formulir.elements.waktu_ambil;
  let pengganti = null;
  if (pilihan.length === 0) {
    for (const waktu of aturan.waktu_ambil) {
      pilihan.add(new Option(formatWaktu(waktu), waktu));
    }
    pengganti = waktuKosongSesudah(new Date().toTimeString().slice(0, 5));
  } else if (keranjang.size === 0 && waktuPenuh.includes(pilihan.value)) {
    pengganti = waktuKosongSesudah(pilihan.value);
  }
  if (pengganti) {
    pilihan.value = pengganti;
  }
  for (const opsi of pilihan.options) {
    const penuh = waktuPenuh.includes(opsi.value);
    opsi.disabled = penuh;
    opsi.textContent = penuh ? `${formatWaktu(opsi.value)} (penuh)` : formatWaktu(opsi.value);
  }
}

function terapkan(pelanggan, menuBaru, penuhBaru) {
  const penyesuaian = sesuaikanKeranjang(menuBaru);
  pelangganSaya = pelanggan;
  daftarMenu = menuBaru;
  waktuPenuh = penuhBaru;
  if (pelangganSaya === null) {
    keranjang.clear();
  }
  belumLogin.hidden = pelangganSaya !== null;
  kartuKeranjang.hidden = pelangganSaya === null;
  aturPilihanWaktu();
  tampilkanMenu();
  tampilkanKeranjang();
  if (penyesuaian !== "") {
    tampilkanPesan(pesanKeranjang, penyesuaian, "gagal");
  }
}

async function segarkan() {
  try {
    const sesi = await muatSesi();
    const pelanggan = sesi.peran === "pelanggan" ? sesi.pelanggan : null;
    if (aturan === null) {
      aturan = await panggilApi("/api/pesanan/aturan");
      formulir.elements.catatan.maxLength = aturan.panjang_catatan;
    }
    const menuBaru = await panggilApi("/api/menu");
    const penuhBaru = pelanggan === null ? [] : await panggilApi("/api/pesanan/waktu-penuh");
    const cetakanBaru = JSON.stringify([pelanggan, menuBaru, penuhBaru]);
    if (cetakanBaru !== cetakan) {
      cetakan = cetakanBaru;
      terapkan(pelanggan, menuBaru, penuhBaru);
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
    catatan: formulir.elements.catatan.value,
  };

  tombolPesan.disabled = true;
  try {
    const pesanan = await panggilApi("/api/pesanan", "POST", isian);
    keranjang.clear();
    formulir.elements.catatan.value = "";
    tampilkanMenu();
    tampilkanKeranjang();
    tampilkanPesan(pesanKeranjang, `Pesanan #${pesanan.id} dibuat. Total ${formatRupiah(pesanan.total)}, ambil pukul ${formatWaktu(pesanan.waktu_ambil)}. Pantau statusnya di halaman Pesanan.`, "ok");
    await segarkan();
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
formulir.elements.waktu_ambil.addEventListener("change", tampilkanKeranjang);
segarkan();
segarkanBerkala(segarkan);
