const KUNCI_PEMISAH = "pesandulu.pemisah";
const ALAMAT_UNDUH = {
  "rekap-harian": "/api/rekap/harian.csv",
  pesanan: "/api/rekap/pesanan.csv",
};

const pesanDashboard = document.getElementById("pesan-dashboard");
const ringkasan = document.getElementById("ringkasan");
const totalPenjualan = document.getElementById("total-penjualan");
const daftarTerlaris = document.getElementById("daftar-terlaris");
const templatTerlaris = document.getElementById("templat-terlaris");
const terlarisKosong = document.getElementById("terlaris-kosong");
const totalTerjual = document.getElementById("total-terjual");
const badanHarian = document.getElementById("badan-tabel-harian");
const templatHarian = document.getElementById("templat-baris-harian");
const keteranganTanpaTanggal = document.getElementById("keterangan-tanpa-tanggal");
const pemisahCsv = document.getElementById("pemisah-csv");
const pesanUnduh = document.getElementById("pesan-unduh");

let cetakan = null;
let pesanMuatTampil = true;
let hariIni = null;

function buatBaris(baris, jumlahTerbanyak) {
  const elemen = templatTerlaris.content.firstElementChild.cloneNode(true);
  elemen.querySelector(".nama-terlaris").textContent = baris.nama;
  elemen.querySelector(".isi-batang").style.width = `${(baris.jumlah / jumlahTerbanyak) * 100}%`;
  elemen.querySelector(".jumlah-terlaris").textContent = baris.jumlah;
  return elemen;
}

function buatBarisHarian(hari) {
  const baris = templatHarian.content.firstElementChild.cloneNode(true);
  const berjalan = STATUS_AKTIF.reduce((jumlah, status) => jumlah + hari.jumlah_per_status[status], 0);
  baris.querySelector(".teks-tanggal").textContent = hari.tanggal === null ? "Tidak tercatat" : formatTanggal(hari.tanggal);
  baris.querySelector(".tanda-hari-ini").hidden = hari.tanggal !== hariIni;
  baris.querySelector(".sel-jumlah-pesanan").textContent = hari.jumlah_pesanan;
  baris.querySelector(".sel-berjalan").textContent = berjalan;
  baris.querySelector(".sel-selesai").textContent = hari.jumlah_per_status.selesai;
  baris.querySelector(".sel-dibatalkan").textContent = hari.jumlah_per_status.dibatalkan;
  baris.querySelector(".sel-terjual").textContent = `${hari.total_terjual} porsi`;
  baris.querySelector(".sel-harga").textContent = formatRupiah(hari.total_penjualan);
  return baris;
}

function tampilkan(rekap) {
  const jumlahTerbanyak = rekap.menu_terlaris.length > 0 ? rekap.menu_terlaris[0].jumlah : 0;
  hariIni = rekap.hari_ini;
  for (const kotak of ringkasan.querySelectorAll("[data-status]")) {
    const jumlah = rekap.jumlah_per_status[kotak.dataset.status];
    kotak.querySelector(".angka").textContent = jumlah;
    kotak.classList.toggle("ada", jumlah > 0);
  }
  totalPenjualan.textContent = formatRupiah(rekap.total_penjualan);
  ringkasan.hidden = false;
  daftarTerlaris.replaceChildren(...rekap.menu_terlaris.map((baris) => buatBaris(baris, jumlahTerbanyak)));
  terlarisKosong.hidden = rekap.menu_terlaris.length > 0;
  totalTerjual.textContent = `${rekap.total_terjual} porsi`;
  badanHarian.replaceChildren(...rekap.per_hari.map(buatBarisHarian));
  keteranganTanpaTanggal.hidden = rekap.per_hari.every((hari) => hari.tanggal !== null);
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

function pemisahAwal() {
  const tersimpan = localStorage.getItem(KUNCI_PEMISAH);
  if ([...pemisahCsv.options].some((pilihan) => pilihan.value === tersimpan)) {
    return tersimpan;
  }
  return (1.5).toLocaleString().includes(",") ? "titik-koma" : "koma";
}

async function unduh(tombol) {
  const namaBerkas = `pesandulu-${tombol.dataset.berkas}${hariIni === null ? "" : `-${hariIni}`}.csv`;
  tombol.disabled = true;
  tampilkanPesan(pesanUnduh, "Menyiapkan berkas…");
  try {
    await unduhBerkas(`${ALAMAT_UNDUH[tombol.dataset.berkas]}?pemisah=${pemisahCsv.value}`, namaBerkas);
    tampilkanPesan(pesanUnduh, `Unduhan dimulai: ${namaBerkas}`, "ok");
  } catch (galat) {
    tampilkanPesan(pesanUnduh, galat.message, "gagal");
  }
  tombol.disabled = false;
}

pemisahCsv.value = pemisahAwal();
pemisahCsv.addEventListener("change", () => localStorage.setItem(KUNCI_PEMISAH, pemisahCsv.value));
for (const tombol of document.querySelectorAll(".tombol-unduh")) {
  tombol.addEventListener("click", () => unduh(tombol));
}
segarkan();
segarkanBerkala(segarkan);
