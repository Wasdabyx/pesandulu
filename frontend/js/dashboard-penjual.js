const pesanDashboard = document.getElementById("pesan-dashboard");
const ringkasan = document.getElementById("ringkasan");
const totalPenjualan = document.getElementById("total-penjualan");
const daftarTerlaris = document.getElementById("daftar-terlaris");
const templatTerlaris = document.getElementById("templat-terlaris");
const terlarisKosong = document.getElementById("terlaris-kosong");
const totalTerjual = document.getElementById("total-terjual");

let cetakan = null;
let pesanMuatTampil = true;

function buatBaris(baris, jumlahTerbanyak) {
  const elemen = templatTerlaris.content.firstElementChild.cloneNode(true);
  elemen.querySelector(".nama-terlaris").textContent = baris.nama;
  elemen.querySelector(".isi-batang").style.width = `${(baris.jumlah / jumlahTerbanyak) * 100}%`;
  elemen.querySelector(".jumlah-terlaris").textContent = baris.jumlah;
  return elemen;
}

function tampilkan(rekap) {
  const jumlahTerbanyak = rekap.menu_terlaris.length > 0 ? rekap.menu_terlaris[0].jumlah : 0;
  for (const kotak of ringkasan.querySelectorAll("[data-status]")) {
    kotak.querySelector(".angka").textContent = rekap.jumlah_per_status[kotak.dataset.status];
  }
  totalPenjualan.textContent = formatRupiah(rekap.total_penjualan);
  ringkasan.hidden = false;
  daftarTerlaris.replaceChildren(...rekap.menu_terlaris.map((baris) => buatBaris(baris, jumlahTerbanyak)));
  terlarisKosong.hidden = rekap.menu_terlaris.length > 0;
  totalTerjual.textContent = `${rekap.total_terjual} porsi`;
}

async function segarkan() {
  try {
    const sesi = await wajibLogin("penjual");
    if (!sesi) {
      return;
    }
    const rekap = await panggilApi("/api/rekap");
    const cetakanBaru = JSON.stringify(rekap);
    if (cetakanBaru !== cetakan) {
      cetakan = cetakanBaru;
      tampilkan(rekap);
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
