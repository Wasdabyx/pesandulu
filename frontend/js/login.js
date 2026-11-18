const formulir = document.getElementById("formulir-login");
const kelompokNoHp = document.getElementById("kelompok-no-hp");
const tombolLogin = document.getElementById("tombol-login");
const pesan = document.getElementById("pesan-login");

function aturPeran() {
  const sebagaiPenjual = formulir.elements.peran.value === "penjual";
  kelompokNoHp.hidden = sebagaiPenjual;
  formulir.elements.no_hp.disabled = sebagaiPenjual;
}

async function mulai() {
  try {
    const sesi = await muatSesi();
    if (sesi.peran !== null) {
      window.location.replace(HALAMAN_DASHBOARD[sesi.peran]);
      return;
    }
    formulir.hidden = false;
    tampilkanPesan(pesan, "");
  } catch (galat) {
    tampilkanPesan(pesan, galat.message, "gagal");
  }
}

async function kirimLogin(peristiwa) {
  peristiwa.preventDefault();
  const peran = formulir.elements.peran.value;
  const isian = { peran, kata_sandi: formulir.elements.kata_sandi.value };
  if (peran === "pelanggan") {
    isian.no_hp = formulir.elements.no_hp.value;
  }

  tombolLogin.disabled = true;
  try {
    const hasil = await panggilApi("/api/login", "POST", isian);
    simpanToken(hasil.token);
    window.location.href = HALAMAN_DASHBOARD[hasil.peran];
  } catch (galat) {
    tampilkanPesan(pesan, galat.message, "gagal");
    tombolLogin.disabled = false;
  }
}

for (const pilihan of formulir.elements.peran) {
  pilihan.addEventListener("change", aturPeran);
}
formulir.addEventListener("submit", kirimLogin);
aturPeran();
mulai();
