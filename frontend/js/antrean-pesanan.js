const LANGKAH_BERIKUT = {
  menunggu: { status: "diproses", tombol: "Proses" },
  diproses: { status: "siap diambil", tombol: "Tandai siap" },
  "siap diambil": { status: "selesai", tombol: "Selesai" },
};

const badanTabel = document.getElementById("badan-tabel-pesanan");
const templatBaris = document.getElementById("templat-baris-pesanan");
const tombolSaring = document.querySelectorAll(".tombol-saring");
const daftarKosong = document.getElementById("daftar-kosong");
const pesanDaftar = document.getElementById("pesan-daftar");

let semuaPesanan = [];
let statusDipilih = "";
let cetakan = null;
let pesanMuatTampil = true;

function buatBaris(pesanan) {
  const baris = templatBaris.content.firstElementChild.cloneNode(true);
  const tombol = baris.querySelector(".tombol-lanjut");
  const langkah = LANGKAH_BERIKUT[pesanan.status];

  baris.dataset.id = pesanan.id;
  baris.querySelector(".sel-nomor").textContent = `#${pesanan.id}`;
  baris.querySelector(".sel-pelanggan").textContent = pesanan.nama_pelanggan || "(akun dihapus)";
  baris.querySelector(".sel-isi").textContent = ringkasItems(pesanan.items);
  baris.querySelector(".sel-ambil").textContent = formatWaktu(pesanan.waktu_ambil);
  baris.querySelector(".sel-harga").textContent = formatRupiah(pesanan.total);
  isiLabelStatus(baris.querySelector(".label-status"), pesanan.status);
  if (langkah) {
    tombol.textContent = langkah.tombol;
    tombol.setAttribute("aria-label", `${langkah.tombol}: pesanan #${pesanan.id}`);
    tombol.addEventListener("click", () => lanjutkanPesanan(pesanan, langkah.status, tombol));
  } else {
    tombol.remove();
  }
  return baris;
}

function urutanAntrean(a, b) {
  const selesaiA = a.status === "selesai" ? 1 : 0;
  const selesaiB = b.status === "selesai" ? 1 : 0;
  return selesaiA - selesaiB || a.waktu_ambil.localeCompare(b.waktu_ambil) || a.id - b.id;
}

function berstatus(status) {
  return semuaPesanan.filter((pesanan) => status === "" || pesanan.status === status);
}

function tampilkanDaftar() {
  const terlihat = berstatus(statusDipilih).sort(urutanAntrean);
  badanTabel.replaceChildren(...terlihat.map(buatBaris));
  daftarKosong.textContent = semuaPesanan.length === 0 ? "Belum ada pesanan." : "Tidak ada pesanan dengan status ini.";
  daftarKosong.hidden = terlihat.length > 0;
  for (const tombol of tombolSaring) {
    tombol.querySelector(".jumlah-saring").textContent = `(${berstatus(tombol.dataset.status).length})`;
  }
}

async function segarkan() {
  try {
    const daftarPesanan = await panggilApi("/api/pesanan");
    const cetakanBaru = JSON.stringify(daftarPesanan);
    if (cetakanBaru !== cetakan) {
      cetakan = cetakanBaru;
      semuaPesanan = daftarPesanan;
      tampilkanDaftar();
    }
    if (pesanMuatTampil) {
      pesanMuatTampil = false;
      tampilkanPesan(pesanDaftar, "");
    }
  } catch (galat) {
    pesanMuatTampil = true;
    tampilkanPesan(pesanDaftar, galat.message, "gagal");
  }
}

async function lanjutkanPesanan(pesanan, statusBaru, tombol) {
  tombol.disabled = true;
  try {
    const hasil = await panggilApi(`/api/pesanan/${pesanan.id}`, "PATCH", { status: statusBaru });
    tampilkanPesan(pesanDaftar, `Pesanan #${hasil.id} ${hasil.status}.`, "ok");
  } catch (galat) {
    tampilkanPesan(pesanDaftar, galat.message, "gagal");
  }
  pesanMuatTampil = false;
  await segarkan();
  tombol.disabled = false;

  const tombolBaru = badanTabel.querySelector(`tr[data-id="${pesanan.id}"] .tombol-lanjut`);
  if (tombolBaru) {
    tombolBaru.focus({ preventScroll: true });
  }
}

function pilihStatus(tombolDipilih) {
  statusDipilih = tombolDipilih.dataset.status;
  for (const tombol of tombolSaring) {
    tombol.setAttribute("aria-pressed", String(tombol === tombolDipilih));
  }
  tampilkanDaftar();
}

for (const tombol of tombolSaring) {
  tombol.addEventListener("click", () => pilihStatus(tombol));
}
segarkan();
segarkanBerkala(segarkan);
