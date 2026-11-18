const daftar = document.getElementById("daftar-pesanan");
const templatPesanan = document.getElementById("templat-pesanan");
const pesanDaftar = document.getElementById("pesan-daftar");
const belumTerdaftar = document.getElementById("belum-terdaftar");
const daftarKosong = document.getElementById("daftar-kosong");

let cetakan = null;
let pesanMuatTampil = true;

function buatItem(pesanan) {
  const elemen = templatPesanan.content.firstElementChild.cloneNode(true);
  const tombolBatalkan = elemen.querySelector(".tombol-batalkan");

  elemen.querySelector(".nomor-pesanan").textContent = `#${pesanan.id}`;
  isiLabelStatus(elemen.querySelector(".label-status"), pesanan.status);
  elemen.querySelector(".isi-pesanan").textContent = ringkasItems(pesanan.items);
  elemen.querySelector(".rincian-pesanan").textContent = `Ambil ${formatWaktu(pesanan.waktu_ambil)} · ${formatRupiah(pesanan.total)}`;
  tombolBatalkan.hidden = pesanan.status !== "menunggu";
  tombolBatalkan.setAttribute("aria-label", `Batalkan pesanan #${pesanan.id}`);
  tombolBatalkan.addEventListener("click", () => batalkanPesanan(pesanan));
  return elemen;
}

function tampilkanDaftar(pelanggan, daftarPesanan) {
  const terbaruDulu = [...daftarPesanan].sort((a, b) => b.id - a.id);
  daftar.replaceChildren(...terbaruDulu.map(buatItem));
  belumTerdaftar.hidden = pelanggan !== null;
  daftarKosong.hidden = pelanggan === null || daftarPesanan.length > 0;
}

async function segarkan() {
  try {
    const pelanggan = await muatPelangganSaya();
    let daftarPesanan = [];
    if (pelanggan !== null) {
      daftarPesanan = await panggilApi(`/api/pesanan?pelanggan_id=${pelanggan.id}`);
    }
    const cetakanBaru = JSON.stringify([pelanggan, daftarPesanan]);
    if (cetakanBaru !== cetakan) {
      cetakan = cetakanBaru;
      tampilkanDaftar(pelanggan, daftarPesanan);
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

async function batalkanPesanan(pesanan) {
  if (!window.confirm(`Batalkan pesanan #${pesanan.id}?`)) {
    return;
  }
  try {
    await panggilApi(`/api/pesanan/${pesanan.id}`, "DELETE");
    tampilkanPesan(pesanDaftar, `Pesanan #${pesanan.id} dibatalkan.`, "ok");
  } catch (galat) {
    tampilkanPesan(pesanDaftar, galat.message, "gagal");
  }
  pesanMuatTampil = false;
  await segarkan();
}

segarkan();
segarkanBerkala(segarkan);
