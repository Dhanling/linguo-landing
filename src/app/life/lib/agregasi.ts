// [life-dashboard-v1] Perakit angka untuk dashboard /life.
//
// Semua query jalan di SERVER dengan service role — tabel keuangan tertutup RLS
// dan memang tidak boleh dibuka ke browser. Halaman hanya menerima hasil jadi.
//
// ANTI DOBEL-HITUNG (aturan yang sama dipakai Overview admin dashboard):
//   • `registrations` = sumber utama omzet retail. Baris berproduk "B2B Corporate"
//     SENGAJA dibuang di sini — omzet korporat dihitung dari `corporate_invoices`
//     yang lunas (satu-satunya sumber kebenaran B2B, termasuk migrasi historis).
//   • `registration_addons` menyimpan omzet e-book bundel & add-on lain yang TIDAK
//     punya baris registrations sendiri → ditarik terpisah.
//   • `digital_purchases` cuma yang belum punya jejak di registrations
//     (migrated_to_reg_id NULL dan registration_id NULL); begitu di-migrate,
//     barisnya otomatis keluar dari set ini.
//   • Simulasi Tes tidak punya baris registrations (ditolak product_check),
//     jejaknya cuma `leads` program='simulasi' → ditarik dari sana.
//
// PENGAKUAN TANGGAL: uang diakui pada tanggal BAYAR (payment_date / paid_at /
// xendit_paid_at), jatuh balik ke tanggal daftar kalau kosong. Ini menutup
// insiden lama "Lunas tanpa payment_date hilang dari grafik".

import { createClient } from "@supabase/supabase-js";
import pribadiBawaan from "../data/pribadi.json";
import type { Lini, Ringkasan, TitikBulan, BarisTransaksi } from "./tipe";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const HALAMAN = 1000; // plafon baris PostgREST — wajib dipaginasi, bukan diabaikan
const OFFSET_WIB = 7 * 60 * 60 * 1000;
const BULAN_DITAMPILKAN = 12;

/* ────────────────────────── util waktu (WIB) ────────────────────────── */

/** Date yang digeser ke WIB — dibaca pakai getUTC* supaya bebas dari zona server. */
function wib(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getTime() + OFFSET_WIB);
}
function kunciBulan(d: Date) {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
}
function kunciHari(d: Date) {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

/* ────────────────────────── util query ────────────────────────── */

type Klien = ReturnType<typeof createClient>;

function klien(): Klien {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Tarik SEMUA baris dengan paginasi. PostgREST memotong di 1000 baris tanpa
 * error — tanpa ini omzet tahun-tahun awal diam-diam hilang begitu tabelnya
 * lewat seribu baris. `urut` wajib kolom stabil supaya halaman tidak tumpang tindih.
 */
async function semuaBaris(
  buat: () => any,
  urut = "id",
  peringatan: string[] = [],
  label = "",
): Promise<any[]> {
  const keluar: any[] = [];
  for (let mulai = 0; ; mulai += HALAMAN) {
    const { data, error } = await buat()
      .order(urut, { ascending: true })
      .range(mulai, mulai + HALAMAN - 1);
    if (error) {
      if (label) peringatan.push(`Gagal membaca ${label}: ${error.message}`);
      break;
    }
    const batch = data || [];
    keluar.push(...batch);
    if (batch.length < HALAMAN) break;
    if (mulai > 200_000) break; // rem pengaman
  }
  return keluar;
}

async function hitungBaris(buat: () => any): Promise<number> {
  const { count, error } = await buat();
  if (error) return 0;
  return count || 0;
}

/* ────────────────────────── peta produk → lini ────────────────────────── */

/**
 * Slot warna MELEKAT pada lini, bukan pada peringkatnya — menyaring atau
 * mengurutkan ulang tidak boleh mengecat ulang yang tersisa.
 *
 * Palet kategorikalnya cuma tujuh warna dan lininya dua belas, jadi tujuh lini
 * terbesar (diukur dari omzet sepanjang masa) memegang slot 0–6 dan sisanya
 * sengaja diberi slot -1 = ekor abu-abu. Di grafik ekor itu dilebur jadi satu
 * potongan "Lainnya"; angkanya tetap utuh per lini di daftar Bisnis yang jalan.
 * Jangan menambah warna kedelapan — tambahkan ke ekor.
 */
const LINI: { key: string; nama: string; kategori: Lini["kategori"]; slot: number }[] = [
  { key: "private", nama: "Kelas Private & Semi", kategori: "Kelas", slot: 0 },
  { key: "b2b", nama: "B2B Corporate", kategori: "Korporat", slot: 1 },
  { key: "reguler", nama: "Kelas Reguler", kategori: "Kelas", slot: 2 },
  { key: "testprep", nama: "Test Preparation", kategori: "Kelas", slot: 3 },
  { key: "ebook", nama: "E-Book / Lingbook", kategori: "Digital", slot: 4 },
  { key: "elearning", nama: "E-Learning", kategori: "Digital", slot: 5 },
  { key: "addon", nama: "Add-on Kelas", kategori: "Layanan", slot: 6 },
  { key: "simulasi", nama: "Simulasi Tes", kategori: "Digital", slot: -1 },
  { key: "kids", nama: "Kelas Anak", kategori: "Kelas", slot: -1 },
  { key: "terjemahan", nama: "Terjemahan & Interpreting", kategori: "Layanan", slot: -1 },
  { key: "manual", nama: "Pemasukan Manual", kategori: "Lainnya", slot: -1 },
  { key: "lainnya", nama: "Lainnya", kategori: "Lainnya", slot: -1 },
];

function liniDariProduk(produk: string | null): string {
  const p = (produk || "").trim();
  if (p === "Kelas Private" || p === "Kelas Semi Private") return "private";
  if (p === "Kelas Reguler") return "reguler";
  if (p === "English Test Preparation (IELTS/TOEFL)") return "testprep";
  if (p.startsWith("Kelas Kids") || p.toLowerCase().includes("kids")) return "kids";
  if (p === "E-Book") return "ebook";
  if (p === "E-Learning") return "elearning";
  if (p === "Translation Service") return "terjemahan";
  return "lainnya";
}

function liniDariTipeDigital(tipe: string | null): string {
  const t = (tipe || "").toLowerCase();
  if (t.includes("ebook") || t.includes("e-book") || t.includes("book")) return "ebook";
  if (t.includes("learning")) return "elearning";
  return "lainnya";
}

/* ────────────────────────── tipe internal ────────────────────────── */

type Uang = {
  lini: string;
  nominal: number;
  tanggal: Date;
  nama: string;
};

/* ────────────────────────── perakit utama ────────────────────────── */

export async function rakitRingkasan(): Promise<Ringkasan> {
  const peringatan: string[] = [];
  const sb = klien();

  const sekarang = new Date(Date.now() + OFFSET_WIB);
  const tahunIni = sekarang.getUTCFullYear();
  const bulanIniIdx = sekarang.getUTCMonth();
  const kBulanIni = `${tahunIni}-${bulanIniIdx}`;
  const bulanLaluDate = new Date(Date.UTC(tahunIni, bulanIniIdx - 1, 1));
  const kBulanLalu = kunciBulan(bulanLaluDate);
  const kHariIni = kunciHari(sekarang);
  const kKemarin = kunciHari(new Date(sekarang.getTime() - 86_400_000));
  const batas7Hari = new Date(sekarang.getTime() - 7 * 86_400_000);
  const batasAktif = new Date(sekarang.getTime() - 60 * 86_400_000);

  /* ── tarik data mentah, paralel ── */
  const [
    regs,
    addons,
    digital,
    leadsSimulasi,
    invoiceB2B,
    pengeluaran,
    transaksi,
    payouts,
    leadsSemua,
  ] = await Promise.all([
    semuaBaris(
      () =>
        sb
          .from("registrations")
          .select(
            "id, product, total_amount, installment_paid, payment_status, payment_date, registration_date, status, archived_at, students(name)",
          )
          .in("payment_status", ["Lunas", "Cicilan"])
          .is("archived_at", null),
      "id",
      peringatan,
      "registrations",
    ),
    semuaBaris(
      () =>
        sb
          .from("registration_addons")
          .select("id, addon_type, total_amount, payment_status, payment_date, purchase_date")
          .eq("payment_status", "Lunas"),
      "id",
      peringatan,
      "registration_addons",
    ),
    semuaBaris(
      () =>
        sb
          .from("digital_purchases")
          .select(
            "id, buyer_name, amount, payment_status, xendit_paid_at, created_at, migrated_to_reg_id, archived_at, registration_id, digital_products(type)",
          )
          .eq("payment_status", "Lunas")
          .is("migrated_to_reg_id", null)
          .is("archived_at", null)
          .is("registration_id", null),
      "id",
      peringatan,
      "digital_purchases",
    ),
    semuaBaris(
      () =>
        sb
          .from("leads")
          .select("id, name, amount, paid_amount, paid_at, created_at, payment_status")
          .eq("program", "simulasi")
          .in("payment_status", ["PAID", "CONVERTED"])
          .is("archived_at", null),
      "id",
      peringatan,
      "leads simulasi",
    ),
    semuaBaris(
      () => sb.from("corporate_invoices").select("id, amount, paid_at").not("paid_at", "is", null),
      "id",
      peringatan,
      "corporate_invoices",
    ),
    semuaBaris(
      () => sb.from("expenses").select("id, date, category, description, amount"),
      "id",
      peringatan,
      "expenses",
    ),
    semuaBaris(
      () => sb.from("transactions").select("id, type, date, category, description, amount"),
      "id",
      peringatan,
      "transactions",
    ),
    semuaBaris(
      () =>
        sb
          .from("teacher_payouts")
          .select("id, month, year, status, netto, total_fee, adjustment_amount, transferred_at"),
      "id",
      peringatan,
      "teacher_payouts",
    ),
    semuaBaris(
      () => sb.from("leads").select("id, created_at, payment_status"),
      "id",
      peringatan,
      "leads",
    ),
  ]);

  /* ── operasional (pakai count, bukan tarik semua baris) ── */
  const awalBulanISO = new Date(Date.UTC(tahunIni, bulanIniIdx, 1)).toISOString().slice(0, 10);
  const akhirBulanISO = new Date(Date.UTC(tahunIni, bulanIniIdx + 1, 0)).toISOString().slice(0, 10);

  const [pengajarAktif, sesiBulanIni, sesiSelesai] = await Promise.all([
    hitungBaris(() =>
      sb.from("teachers").select("id", { count: "exact", head: true }).in("status", ["Aktif", "active", "aktif", "Active"]),
    ),
    hitungBaris(() =>
      sb
        .from("schedules")
        .select("id", { count: "exact", head: true })
        .gte("scheduled_at", awalBulanISO)
        .lte("scheduled_at", `${akhirBulanISO}T23:59:59`),
    ),
    hitungBaris(() =>
      sb
        .from("schedules")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("scheduled_at", awalBulanISO)
        .lte("scheduled_at", `${akhirBulanISO}T23:59:59`),
    ),
  ]);

  /* ── ubah semua sumber jadi satu daftar "uang masuk" ── */
  const uang: Uang[] = [];

  for (const r of regs as any[]) {
    const produk = (r.product || "").trim();
    // B2B ditangani corporate_invoices — lihat catatan anti dobel-hitung di atas.
    if (produk === "B2B Corporate") continue;
    const nominal = Number(r.total_amount) || 0;
    if (nominal <= 0) continue;
    const t = wib(r.payment_date) || wib(r.registration_date) || wib(r.created_at);
    if (!t) continue;
    uang.push({
      lini: liniDariProduk(produk),
      nominal,
      tanggal: t,
      nama: (r.students as any)?.name || produk || "Registrasi",
    });
  }

  for (const a of addons as any[]) {
    const nominal = Number(a.total_amount) || 0;
    if (nominal <= 0) continue;
    const t = wib(a.payment_date) || wib(a.purchase_date);
    if (!t) continue;
    const tipe = (a.addon_type || "").toLowerCase();
    uang.push({
      lini: tipe === "ebook" ? "ebook" : "addon",
      nominal,
      tanggal: t,
      nama: tipe === "ebook" ? "E-Book (add-on kelas)" : `Add-on ${a.addon_type || "kelas"}`,
    });
  }

  for (const d of digital as any[]) {
    const nominal = Number(d.amount) || 0;
    if (nominal <= 0) continue;
    const t = wib(d.xendit_paid_at) || wib(d.created_at);
    if (!t) continue;
    uang.push({
      lini: liniDariTipeDigital((d.digital_products as any)?.type ?? null),
      nominal,
      tanggal: t,
      nama: d.buyer_name || "Pembelian digital",
    });
  }

  for (const l of leadsSimulasi as any[]) {
    const nominal = Number(l.paid_amount ?? l.amount) || 0;
    if (nominal <= 0) continue; // akses gratis dari kode promo tidak dihitung omzet
    const t = wib(l.paid_at) || wib(l.created_at);
    if (!t) continue;
    uang.push({ lini: "simulasi", nominal, tanggal: t, nama: l.name || "Simulasi Tes" });
  }

  for (const inv of invoiceB2B as any[]) {
    const nominal = Number(inv.amount) || 0;
    if (nominal <= 0) continue;
    const t = wib(inv.paid_at);
    if (!t) continue;
    uang.push({ lini: "b2b", nominal, tanggal: t, nama: "Invoice korporat" });
  }

  for (const tx of transaksi as any[]) {
    if (tx.type !== "pemasukan") continue;
    const nominal = Number(tx.amount) || 0;
    if (nominal <= 0) continue;
    const t = wib(tx.date);
    if (!t) continue;
    uang.push({ lini: "manual", nominal, tanggal: t, nama: tx.description || tx.category || "Pemasukan manual" });
  }

  /* ── ember waktu ── */
  const perBulan = new Map<string, number>();
  const perBulanLini = new Map<string, Map<string, number>>();
  const perHari = new Map<string, number>();
  const statLini = new Map<
    string,
    { bulanIni: number; bulanLalu: number; ytd: number; total: number; nBulanIni: number; nTotal: number; terakhir: number }
  >();

  let omzetHariIni = 0;
  let omzetKemarin = 0;
  let omzet7Hari = 0;
  let omzetBulanIni = 0;
  let omzetBulanLalu = 0;
  let omzetYtd = 0;
  let omzetTotal = 0;

  for (const u of uang) {
    const kb = kunciBulan(u.tanggal);
    const kh = kunciHari(u.tanggal);
    perBulan.set(kb, (perBulan.get(kb) || 0) + u.nominal);
    if (!perBulanLini.has(kb)) perBulanLini.set(kb, new Map());
    const pl = perBulanLini.get(kb)!;
    pl.set(u.lini, (pl.get(u.lini) || 0) + u.nominal);
    perHari.set(kh, (perHari.get(kh) || 0) + u.nominal);

    const s =
      statLini.get(u.lini) ||
      { bulanIni: 0, bulanLalu: 0, ytd: 0, total: 0, nBulanIni: 0, nTotal: 0, terakhir: 0 };
    s.total += u.nominal;
    s.nTotal += 1;
    if (u.tanggal.getTime() > s.terakhir) s.terakhir = u.tanggal.getTime();
    if (kb === kBulanIni) {
      s.bulanIni += u.nominal;
      s.nBulanIni += 1;
    }
    if (kb === kBulanLalu) s.bulanLalu += u.nominal;
    if (u.tanggal.getUTCFullYear() === tahunIni) s.ytd += u.nominal;
    statLini.set(u.lini, s);

    omzetTotal += u.nominal;
    if (u.tanggal.getUTCFullYear() === tahunIni) omzetYtd += u.nominal;
    if (kb === kBulanIni) omzetBulanIni += u.nominal;
    if (kb === kBulanLalu) omzetBulanLalu += u.nominal;
    if (kh === kHariIni) omzetHariIni += u.nominal;
    if (kh === kKemarin) omzetKemarin += u.nominal;
    if (u.tanggal >= batas7Hari) omzet7Hari += u.nominal;
  }

  /* ── deret 12 bulan ── */
  const NAMA = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const PANJANG = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const seriBulanan: TitikBulan[] = [];
  for (let i = BULAN_DITAMPILKAN - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(tahunIni, bulanIniIdx - i, 1));
    const k = kunciBulan(d);
    const perLini: Record<string, number> = {};
    const pl = perBulanLini.get(k);
    if (pl) for (const [lini, v] of pl) perLini[lini] = v;
    seriBulanan.push({
      key: k,
      label: NAMA[d.getUTCMonth()],
      labelPanjang: `${PANJANG[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
      total: perBulan.get(k) || 0,
      perLini,
    });
  }

  /* ── data manual (kas, aset, utang, bisnis luar) ── */
  let pribadi: any = pribadiBawaan;
  if (process.env.LIFE_ASET_JSON) {
    try {
      pribadi = JSON.parse(process.env.LIFE_ASET_JSON);
    } catch {
      peringatan.push("LIFE_ASET_JSON gagal dibaca (JSON tidak valid) — dipakai data/pribadi.json.");
    }
  }
  const kasList: any[] = Array.isArray(pribadi.kas) ? pribadi.kas : [];
  const investasiList: any[] = Array.isArray(pribadi.investasi) ? pribadi.investasi : [];
  const asetTetapList: any[] = Array.isArray(pribadi.asetTetap) ? pribadi.asetTetap : [];
  const utangList: any[] = Array.isArray(pribadi.utang) ? pribadi.utang : [];
  const bisnisLain: any[] = Array.isArray(pribadi.bisnisLain) ? pribadi.bisnisLain : [];
  const bebanRutin: any[] = Array.isArray(pribadi.bebanRutinPribadi) ? pribadi.bebanRutinPribadi : [];

  /* ── lini bisnis ── */
  const daftarLini: Lini[] = LINI.map((def) => {
    const s = statLini.get(def.key);
    return {
      ...def,
      bulanIni: s?.bulanIni || 0,
      bulanLalu: s?.bulanLalu || 0,
      ytd: s?.ytd || 0,
      sepanjangMasa: s?.total || 0,
      transaksiBulanIni: s?.nBulanIni || 0,
      transaksiSepanjangMasa: s?.nTotal || 0,
      terakhirTransaksi: s?.terakhir ? new Date(s.terakhir - OFFSET_WIB).toISOString() : null,
      aktif: !!s?.terakhir && s.terakhir >= batasAktif.getTime(),
    };
  }).filter((l) => l.sepanjangMasa > 0);

  // Usaha di luar Linguo yang omzetnya belum masuk database — ditandai manual
  // supaya jelas mana angka hidup dan mana angka ketikan.
  bisnisLain
    .filter((b) => b && b.nama && (b.aktif || Number(b.omzetBulananPerkiraan) > 0))
    .forEach((b, i) => {
      const perkiraan = Number(b.omzetBulananPerkiraan) || 0;
      daftarLini.push({
        key: `manual-${i}`,
        nama: b.nama,
        kategori: (b.kategori as Lini["kategori"]) || "Lainnya",
        slot: -1,
        bulanIni: perkiraan,
        bulanLalu: perkiraan,
        ytd: perkiraan * (bulanIniIdx + 1),
        sepanjangMasa: perkiraan * (bulanIniIdx + 1),
        transaksiBulanIni: 0,
        transaksiSepanjangMasa: 0,
        terakhirTransaksi: null,
        aktif: !!b.aktif,
        manual: true,
      });
    });

  daftarLini.sort((a, b) => b.bulanIni - a.bulanIni || b.sepanjangMasa - a.sepanjangMasa);

  /* ── beban ── */
  let bebanBulanIni = 0;
  let bebanBulanLalu = 0;
  let bebanYtd = 0;
  let bebanTotal = 0;
  const bebanKategori = new Map<string, number>();

  const catatBeban = (tanggal: Date | null, nominal: number, kategori: string) => {
    if (!tanggal || nominal <= 0) return;
    const kb = kunciBulan(tanggal);
    bebanTotal += nominal;
    if (tanggal.getUTCFullYear() === tahunIni) bebanYtd += nominal;
    if (kb === kBulanIni) {
      bebanBulanIni += nominal;
      bebanKategori.set(kategori, (bebanKategori.get(kategori) || 0) + nominal);
    }
    if (kb === kBulanLalu) bebanBulanLalu += nominal;
  };

  // Baris pengeluaran berkategori fee pengajar SENGAJA dilewati: fee dihitung
  // dari `teacher_payouts` di bawah (sumber kebenarannya), jadi mencatat
  // keduanya akan menghitung uang keluar yang sama dua kali.
  const kategoriFee = (k: string) => /fee\s*pengajar/i.test(k || "");

  for (const e of pengeluaran as any[]) {
    if (kategoriFee(e.category)) continue;
    catatBeban(wib(e.date), Number(e.amount) || 0, e.category || "Lainnya");
  }
  for (const tx of transaksi as any[]) {
    if (tx.type !== "pengeluaran") continue;
    if (kategoriFee(tx.category)) continue;
    catatBeban(wib(tx.date), Number(tx.amount) || 0, tx.category || "Lainnya");
  }

  /* ── fee pengajar ──
     Ini pos biaya terbesar Linguo dan hampir tidak pernah masuk tabel
     `expenses`. Tanpa memasukkannya, margin bulan berjalan tampil ~100% —
     angka yang cantik tapi bohong. Fee diakui pada PERIODE fee-nya (bulan/tahun
     baris payout), bukan tanggal transfernya, supaya sejajar dengan omzet
     bulan yang sama. */
  const nominalPayout = (p: any) =>
    Number(p.netto ?? 0) ||
    (Number(p.total_fee) || 0) + (Number(p.adjustment_amount) || 0);

  let feeBulanIni = 0;
  let feeYtd = 0;
  let feeBelumCair = 0;
  for (const p of payouts as any[]) {
    const n = nominalPayout(p);
    if (n <= 0) continue;
    const bulan = Number(p.month) - 1;
    const tahun = Number(p.year);
    if (!isFinite(bulan) || !isFinite(tahun)) continue;
    const batal = ["rejected", "failed", "cancelled"].includes(p.status);
    if (batal) continue;

    const sudahCair = p.status === "transferred" || !!p.transferred_at;
    if (sudahCair) {
      if (tahun === tahunIni) feeYtd += n;
      if (tahun === tahunIni && bulan === bulanIniIdx) feeBulanIni += n;
    } else {
      feeBelumCair += n;
    }
    // Dibebankan pada periodenya baik sudah cair maupun belum — fee bulan
    // berjalan biasanya baru ditransfer bulan depan, dan kalau yang belum cair
    // tidak ikut, laba bulan berjalan selalu tampil terlalu besar.
    // Tanggal 28 hanya wakil periode; cuma bulannya yang dipakai.
    catatBeban(new Date(Date.UTC(tahun, bulan, 28)), n, "Fee Pengajar");
  }

  if (feeBulanIni === 0 && feeBelumCair === 0) {
    peringatan.push(
      "Tidak ada fee pengajar tercatat untuk bulan ini — laba bulan berjalan masih tampil lebih besar dari kenyataan sampai rekap fee dibuat.",
    );
  }

  /* ── piutang cicilan ── */
  let piutang = 0;
  for (const r of regs as any[]) {
    if (r.payment_status !== "Cicilan") continue;
    const sisa = (Number(r.total_amount) || 0) - (Number(r.installment_paid) || 0);
    if (sisa > 0) piutang += sisa;
  }

  /* ── posisi kekayaan ── */
  const rincianAset = [
    ...kasList.map((k) => ({
      nama: k.nama || "Kas",
      jenis: k.jenis || "kas",
      nilai: Number(k.saldo) || 0,
      kelompok: "Kas" as const,
    })),
    ...investasiList.map((k) => ({
      nama: k.nama || "Investasi",
      jenis: k.jenis || "investasi",
      nilai: Number(k.nilai) || 0,
      kelompok: "Investasi" as const,
    })),
    ...asetTetapList.map((k) => ({
      nama: k.nama || "Aset",
      jenis: k.jenis || "aset",
      nilai: Number(k.nilai) || 0,
      kelompok: "Aset Tetap" as const,
    })),
  ];
  const rincianUtang = utangList.map((u) => ({
    nama: u.nama || "Utang",
    jenis: u.jenis || "utang",
    sisa: Number(u.sisa) || 0,
    angsuranBulanan: Number(u.angsuranBulanan) || 0,
  }));

  const asetLikuid = rincianAset.filter((a) => a.kelompok === "Kas").reduce((s, a) => s + a.nilai, 0);
  const investasi = rincianAset.filter((a) => a.kelompok === "Investasi").reduce((s, a) => s + a.nilai, 0);
  const asetTetap = rincianAset.filter((a) => a.kelompok === "Aset Tetap").reduce((s, a) => s + a.nilai, 0);
  const totalAset = asetLikuid + investasi + asetTetap;
  const totalUtang = rincianUtang.reduce((s, u) => s + u.sisa, 0);

  const rutinPribadi = bebanRutin.reduce((s, b) => s + (Number(b.jumlahBulanan) || 0), 0);
  const angsuranBulanan = rincianUtang.reduce((s, u) => s + u.angsuranBulanan, 0);
  const bakarBulanan = rutinPribadi + angsuranBulanan;
  const danaDarurat = bakarBulanan > 0 ? asetLikuid / bakarBulanan : null;

  if (totalAset === 0 && totalUtang === 0) {
    peringatan.push(
      "Kas, investasi, dan utang masih nol — isi src/app/life/data/pribadi.json (atau env LIFE_ASET_JSON) supaya kartu Kekayaan Bersih hidup.",
    );
  }

  /* ── transaksi terakhir ── */
  const namaLini = new Map(LINI.map((l) => [l.key, l.nama]));
  const transaksiTerakhir: BarisTransaksi[] = [...uang]
    .sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime())
    .slice(0, 12)
    .map((u) => ({
      tanggal: new Date(u.tanggal.getTime() - OFFSET_WIB).toISOString(),
      nama: u.nama,
      lini: namaLini.get(u.lini) || u.lini,
      jumlah: u.nominal,
    }));

  /* ── operasional ── */
  const registrasiAktif = (regs as any[]).filter((r) => r.status === "Aktif").length;
  const siswaAktif = new Set(
    (regs as any[]).filter((r) => r.status === "Aktif").map((r) => (r.students as any)?.name || r.id),
  ).size;
  let leadsBulanIni = 0;
  let leadsBayarBulanIni = 0;
  for (const l of leadsSemua as any[]) {
    const t = wib(l.created_at);
    if (!t || kunciBulan(t) !== kBulanIni) continue;
    leadsBulanIni += 1;
    if (["PAID", "CONVERTED"].includes(l.payment_status)) leadsBayarBulanIni += 1;
  }

  /* ── prorata: proyeksi akhir bulan berdasar laju sampai hari ini ── */
  const hariBerjalan = sekarang.getUTCDate();
  const hariSebulan = new Date(Date.UTC(tahunIni, bulanIniIdx + 1, 0)).getUTCDate();
  const prorata = hariBerjalan > 0 ? (omzetBulanIni / hariBerjalan) * hariSebulan : 0;

  const bebanEfektifBulanIni = bebanBulanIni;
  const laba = {
    bulanIni: omzetBulanIni - bebanEfektifBulanIni,
    bulanLalu: omzetBulanLalu - bebanBulanLalu,
    ytd: omzetYtd - bebanYtd,
    marginBulanIni: omzetBulanIni ? ((omzetBulanIni - bebanEfektifBulanIni) / omzetBulanIni) * 100 : null,
  };

  return {
    dibuatPada: new Date().toISOString(),
    peringatan,
    omzet: {
      hariIni: omzetHariIni,
      kemarin: omzetKemarin,
      tujuhHari: omzet7Hari,
      bulanIni: omzetBulanIni,
      bulanLalu: omzetBulanLalu,
      bulanIniProrata: prorata,
      ytd: omzetYtd,
      sepanjangMasa: omzetTotal,
      targetBulanan: Number(pribadi?.target?.omzetBulanan) || 0,
    },
    seriBulanan,
    lini: daftarLini,
    beban: {
      bulanIni: bebanBulanIni,
      bulanLalu: bebanBulanLalu,
      ytd: bebanYtd,
      sepanjangMasa: bebanTotal,
      perKategoriBulanIni: [...bebanKategori.entries()]
        .map(([kategori, jumlah]) => ({ kategori, jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah),
      feePengajarBulanIni: feeBulanIni,
      feePengajarYtd: feeYtd,
      rutinPribadiBulanan: rutinPribadi,
    },
    laba,
    kas: {
      kasBisnisTercatat: kasList.filter((k) => k.bisnis).reduce((s, k) => s + (Number(k.saldo) || 0), 0),
      kasPribadiTercatat: kasList.filter((k) => !k.bisnis).reduce((s, k) => s + (Number(k.saldo) || 0), 0),
      akumulasiLabaHistoris: omzetTotal - bebanTotal,
      piutangCicilan: piutang,
      feePengajarBelumCair: feeBelumCair,
    },
    posisi: {
      asetLikuid,
      investasi,
      asetTetap,
      totalAset,
      totalUtang,
      kekayaanBersih: totalAset - totalUtang,
      rincianAset,
      rincianUtang,
      danaDaruratBulanTertutupi: danaDarurat,
    },
    operasional: {
      siswaAktif,
      registrasiAktif,
      pengajarAktif,
      sesiBulanIni,
      sesiSelesaiBulanIni: sesiSelesai,
      leadsBulanIni,
      leadsBayarBulanIni,
    },
    transaksiTerakhir,
  };
}
