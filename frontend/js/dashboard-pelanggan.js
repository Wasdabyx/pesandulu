const sapaan = document.getElementById("sapaan");
const pesanDashboard = document.getElementById("pesan-dashboard");
const ringkasan = document.getElementById("ringkasan");
const daftarBerjalan = document.getElementById("daftar-berjalan");
const templatPesanan = document.getElementById("templat-pesanan");
const berjalanKosong = document.getElementById("berjalan-kosong");

let cetakan = null;
let pesanMuatTampil = true;

function buatItem(pesanan) {
  const elemen = templatPesanan.content.firstElementChild.cloneNode(true);
  isiPesanan(elemen, pesanan);
  return elemen;
}

function urutanAmbil(a, b) {
  return a.waktu_ambil.localeCompare(b.waktu_ambil) || a.id - b.id;
}

function tampilkan(pelanggan, daftarPesanan) {
  const berjalan = daftarPesanan.filter((pesanan) => pesanan.status !== "selesai").sort(urutanAmbil);
  sapaan.textContent = `Halo, ${pelanggan.nama}.`;
  for (const kotak of ringkasan.querySelectorAll("[data-status]")) {
    kotak.querySelector(".angka").textContent = daftarPesanan.filter((pesanan) => pesanan.status === kotak.dataset.status).length;
  }
  ringkasan.hidden = false;
  daftarBerjalan.replaceChildren(...berjalan.map(buatItem));
  berjalanKosong.hidden = berjalan.length > 0;
}

async function segarkan() {
  try {
    const sesi = await wajibLogin("pelanggan");
    if (!sesi) {
      return;
    }
    const daftarPesanan = await panggilApi("/api/pesanan");
    const cetakanBaru = JSON.stringify([sesi.pelanggan, daftarPesanan]);
    if (cetakanBaru !== cetakan) {
      cetakan = cetakanBaru;
      tampilkan(sesi.pelanggan, daftarPesanan);
    }
    if (pesanMuatTampil) {
      pesanMuatTampil = false;
      tampilkanPesan(pesanDashboard, "");
    }
  } catch (galat) {
    pesanMuatTampil = true;
    tampilkanPesan(pesanDashboard, galat.message, "gagal");
  }
}

segarkan();
segarkanBerkala(segarkan);
