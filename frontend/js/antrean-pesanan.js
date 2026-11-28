const LANGKAH_BERIKUT = {
  menunggu: { status: "diproses", tombol: "Proses", batal: "Tolak" },
  diproses: { status: "siap diambil", tombol: "Tandai siap", batal: "Batalkan" },
  "siap diambil": { status: "selesai", tombol: "Selesai", batal: "Batalkan" },
};

const badanTabel = document.getElementById("badan-tabel-pesanan");
const templatBaris = document.getElementById("templat-baris-pesanan");
const tombolSaring = document.querySelectorAll(".tombol-saring");
const daftarKosong = document.getElementById("daftar-kosong");
const pesanDaftar = document.getElementById("pesan-daftar");
const dialogBatal = document.getElementById("dialog-batal");
const judulDialogBatal = document.getElementById("judul-dialog-batal");
const ringkasanBatal = document.getElementById("ringkasan-batal");
const isianAlasan = document.getElementById("isian-alasan");
const pesanDialogBatal = document.getElementById("pesan-dialog-batal");
const tombolKirimBatal = document.getElementById("kirim-batal");

let semuaPesanan = [];
let statusDipilih = "";
let cetakan = null;
let pesanMuatTampil = true;
let pesananDibatalkan = null;
let aturan = null;

function namaPemesan(pesanan) {
  return pesanan.nama_pelanggan || "(akun dihapus)";
}

function buatBaris(pesanan) {
  const baris = templatBaris.content.firstElementChild.cloneNode(true);
  const tombol = baris.querySelector(".tombol-lanjut");
  const tombolTolak = baris.querySelector(".tombol-tolak");
  const langkah = LANGKAH_BERIKUT[pesanan.status];

  baris.dataset.id = pesanan.id;
  baris.querySelector(".sel-nomor").textContent = `#${pesanan.id}`;
  baris.querySelector(".sel-pelanggan").textContent = namaPemesan(pesanan);
  baris.querySelector(".isi-baris").textContent = ringkasItems(pesanan.items);
  isiCatatan(baris.querySelector(".catatan-pesanan"), pesanan.catatan);
  isiKeteranganBatal(baris.querySelector(".keterangan-batal"), pesanan);
  isiWaktuPesan(baris.querySelector(".waktu-pesan"), pesanan);
  baris.querySelector(".sel-ambil").textContent = formatWaktu(pesanan.waktu_ambil);
  baris.querySelector(".sel-harga").textContent = formatRupiah(pesanan.total);
  isiLabelStatus(baris.querySelector(".label-status"), pesanan.status);
  if (langkah) {
    tombol.textContent = langkah.tombol;
    tombol.setAttribute("aria-label", `${langkah.tombol}: pesanan #${pesanan.id}`);
    tombol.addEventListener("click", () => lanjutkanPesanan(pesanan, langkah.status, tombol));
    tombolTolak.textContent = langkah.batal;
    tombolTolak.setAttribute("aria-label", `${langkah.batal}: pesanan #${pesanan.id}`);
    tombolTolak.addEventListener("click", () => bukaDialogBatal(pesanan, langkah.batal));
  } else {
    baris.querySelector(".kelompok-aksi").remove();
  }
  return baris;
}

function urutanAntrean(a, b) {
  const berakhirA = STATUS_AKTIF.includes(a.status) ? 0 : 1;
  const berakhirB = STATUS_AKTIF.includes(b.status) ? 0 : 1;
  return berakhirA - berakhirB || a.waktu_ambil.localeCompare(b.waktu_ambil) || a.id - b.id;
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
    const sesi = await wajibLogin("penjual");
    if (!sesi) {
      return;
    }
    if (aturan === null) {
      aturan = await panggilApi("/api/pesanan/aturan");
      isianAlasan.maxLength = aturan.panjang_alasan;
    }
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

function bukaDialogBatal(pesanan, kata) {
  pesananDibatalkan = pesanan;
  judulDialogBatal.textContent = `${kata} pesanan #${pesanan.id}`;
  ringkasanBatal.textContent = `${namaPemesan(pesanan)} · ${ringkasItems(pesanan.items)} · ambil ${formatWaktu(pesanan.waktu_ambil)}`;
  tombolKirimBatal.textContent = `${kata} pesanan`;
  isianAlasan.value = "";
  tampilkanPesan(pesanDialogBatal, "");
  dialogBatal.showModal();
  isianAlasan.focus();
}

function tutupDialogBatal(pesanan) {
  if (pesananDibatalkan === pesanan) {
    dialogBatal.close();
  }
}

async function kirimPembatalan(peristiwa) {
  const pesanan = pesananDibatalkan;
  let galatKirim = null;

  peristiwa.preventDefault();
  tombolKirimBatal.disabled = true;
  try {
    const hasil = await panggilApi(`/api/pesanan/${pesanan.id}`, "PATCH", { status: "dibatalkan", alasan: isianAlasan.value });
    tutupDialogBatal(pesanan);
    tampilkanPesan(pesanDaftar, `Pesanan #${hasil.id} ${hasil.status}.`, "ok");
  } catch (galat) {
    galatKirim = galat;
  }
  pesanMuatTampil = false;
  await segarkan();
  tombolKirimBatal.disabled = false;
  if (galatKirim === null) {
    return;
  }

  const terbaru = semuaPesanan.find((butir) => butir.id === pesanan.id);
  if (pesananDibatalkan === pesanan && terbaru && LANGKAH_BERIKUT[terbaru.status]) {
    tampilkanPesan(pesanDialogBatal, galatKirim.message, "gagal");
    return;
  }
  tutupDialogBatal(pesanan);
  tampilkanPesan(pesanDaftar, galatKirim.message, "gagal");
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
document.getElementById("formulir-batal").addEventListener("submit", kirimPembatalan);
document.getElementById("tutup-dialog-batal").addEventListener("click", () => dialogBatal.close());
dialogBatal.addEventListener("close", () => {
  pesananDibatalkan = null;
});
segarkan();
segarkanBerkala(segarkan);
