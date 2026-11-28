const daftar = document.getElementById("daftar-pesanan");
const templatPesanan = document.getElementById("templat-pesanan");
const pesanDaftar = document.getElementById("pesan-daftar");
const daftarKosong = document.getElementById("daftar-kosong");

let cetakan = null;
let pesanMuatTampil = true;

function buatItem(pesanan) {
  const elemen = templatPesanan.content.firstElementChild.cloneNode(true);
  const tombolBatalkan = elemen.querySelector(".tombol-batalkan");

  isiPesanan(elemen, pesanan);
  tombolBatalkan.hidden = pesanan.status !== "menunggu";
  tombolBatalkan.setAttribute("aria-label", `Batalkan pesanan #${pesanan.id}`);
  tombolBatalkan.addEventListener("click", () => batalkanPesanan(pesanan));
  return elemen;
}

function tampilkanDaftar(daftarPesanan) {
  const terbaruDulu = [...daftarPesanan].sort((a, b) => b.id - a.id);
  daftar.replaceChildren(...terbaruDulu.map(buatItem));
  daftarKosong.hidden = daftarPesanan.length > 0;
}

async function segarkan() {
  try {
    const sesi = await wajibLogin("pelanggan");
    if (!sesi) {
      return;
    }
    const daftarPesanan = await panggilApi("/api/pesanan");
    const cetakanBaru = JSON.stringify(daftarPesanan);
    if (cetakanBaru !== cetakan) {
      cetakan = cetakanBaru;
      tampilkanDaftar(daftarPesanan);
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
    await panggilApi(`/api/pesanan/${pesanan.id}`, "PATCH", { status: "dibatalkan" });
    tampilkanPesan(pesanDaftar, `Pesanan #${pesanan.id} dibatalkan.`, "ok");
  } catch (galat) {
    tampilkanPesan(pesanDaftar, galat.message, "gagal");
  }
  pesanMuatTampil = false;
  await segarkan();
}

segarkan();
segarkanBerkala(segarkan);
