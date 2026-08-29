// [life-dashboard-v1] Bentuk data yang dikirim /life/api/data ke halaman.
// Dipisah dari agregasi.ts supaya komponen klien boleh mengimpor tipenya
// tanpa ikut menarik service-role client ke bundel browser.

export type KategoriLini = "Kelas" | "Digital" | "Korporat" | "Layanan" | "Lainnya";

export type Lini = {
  key: string;
  nama: string;
  kategori: KategoriLini;
  /** slot warna kategorikal 0..6 — tetap per lini, tidak ikut peringkat */
  slot: number;
  bulanIni: number;
  bulanLalu: number;
  ytd: number;
  sepanjangMasa: number;
  transaksiBulanIni: number;
  transaksiSepanjangMasa: number;
  terakhirTransaksi: string | null;
  /** ada uang masuk dalam 60 hari terakhir */
  aktif: boolean;
  /** true = angkanya diketik manual di data/pribadi.json, bukan dari database */
  manual?: boolean;
};

export type TitikBulan = {
  /** "2026-8" (bulan 0-indeks) */
  key: string;
  label: string;
  labelPanjang: string;
  total: number;
  /** key lini → nominal */
  perLini: Record<string, number>;
};

export type BarisTransaksi = {
  tanggal: string;
  nama: string;
  lini: string;
  jumlah: number;
};

export type Ringkasan = {
  dibuatPada: string;
  peringatan: string[];
  omzet: {
    hariIni: number;
    kemarin: number;
    tujuhHari: number;
    bulanIni: number;
    bulanLalu: number;
    bulanIniProrata: number;
    ytd: number;
    sepanjangMasa: number;
    targetBulanan: number;
  };
  seriBulanan: TitikBulan[];
  lini: Lini[];
  beban: {
    bulanIni: number;
    bulanLalu: number;
    ytd: number;
    sepanjangMasa: number;
    perKategoriBulanIni: { kategori: string; jumlah: number }[];
    feePengajarBulanIni: number;
    feePengajarYtd: number;
    rutinPribadiBulanan: number;
  };
  laba: {
    bulanIni: number;
    bulanLalu: number;
    ytd: number;
    marginBulanIni: number | null;
  };
  kas: {
    /** saldo akun yang ditandai bisnis di data/pribadi.json */
    kasBisnisTercatat: number;
    kasPribadiTercatat: number;
    /** akumulasi (omzet − beban) sepanjang masa, sebagai pembanding kasar */
    akumulasiLabaHistoris: number;
    piutangCicilan: number;
    feePengajarBelumCair: number;
  };
  posisi: {
    asetLikuid: number;
    investasi: number;
    asetTetap: number;
    totalAset: number;
    totalUtang: number;
    kekayaanBersih: number;
    rincianAset: { nama: string; jenis: string; nilai: number; kelompok: "Kas" | "Investasi" | "Aset Tetap" }[];
    rincianUtang: { nama: string; jenis: string; sisa: number; angsuranBulanan: number }[];
    danaDaruratBulanTertutupi: number | null;
  };
  operasional: {
    siswaAktif: number;
    registrasiAktif: number;
    pengajarAktif: number;
    sesiBulanIni: number;
    sesiSelesaiBulanIni: number;
    leadsBulanIni: number;
    leadsBayarBulanIni: number;
  };
  transaksiTerakhir: BarisTransaksi[];
};
