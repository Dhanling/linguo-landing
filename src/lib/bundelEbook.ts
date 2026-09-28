// [ebook-paket-lengkap-v1] Paket Lengkap A1–B2: empat modul e-book new edition
// satu bahasa, akses Selamanya, Rp499.000 (normal 4 × Rp249.000 = Rp996.000).
//
// Bukan produk baru di DB — ini DISKON KERANJANG. Aturannya dihitung di sini
// dan dipakai tiga tempat: /api/create-cart-invoice (yang menentukan tagihan),
// popup keranjang Perpustakaan, dan kartu Paket Lengkap di /toko/[slug] (dua
// terakhir cuma tampilan). Harga per modul di dalam paket dibagi rata
// (Rp124.750) dan ditulis apa adanya ke `digital_purchases.amount` per baris —
// webhook `handleCartPurchase` (linguo-app) memakai amount per baris untuk
// xendit_paid_amount & komisi afiliasi, jadi jumlah baris = total invoice dan
// webhook-nya tak perlu diubah.
//
// Kuncinya SERI modul (awalan judul sebelum nomor), bukan kolom `language`:
// language "Arabic" berisi seri "Arabic" (A1–B2) DAN "Levantine Arabic" (A1
// saja), "Portuguese" berisi "Brazilian Portuguese" (A1–B2) dan "Portuguese"
// Eropa (A1 saja). Semua modul satu seri memakai nomor "101" apa pun levelnya
// ("Arabic 101 - B2"), jadi nomornya tak membedakan apa-apa.
//
// Syarat paket berlaku untuk satu seri:
//   1. keranjang berisi ≥ 2 modul bahasa itu dengan tier Selamanya
//      (duration_days NULL), dan
//   2. modul di keranjang + modul yang SUDAH dimiliki menutup A1, A2, B1, B2.
// Jadi siswa yang sudah punya A1 (mis. dari paket kelas) tinggal bayar 3 ×
// Rp124.750 untuk melengkapinya. Modul yang dimiliki TIDAK ikut di-upgrade ke
// Selamanya — itu jalur "Upgrade ke Selamanya" yang terpisah.
//
// Data 28 Sep 2026 (alasan harganya): 20 pembelian e-book mandiri semuanya A1,
// 8 di antaranya tier 6 Bulan. Paket ini dipasang sebagai jangkar harga di
// /toko dan jalan pintas buat yang serius sampai B2, bukan tebakan volume.

export const HARGA_PAKET_LENGKAP = 499_000;
export const LEVEL_PAKET = ["A1", "A2", "B1", "B2"] as const;
export const HARGA_PER_MODUL_PAKET = HARGA_PAKET_LENGKAP / LEVEL_PAKET.length; // 124.750

// "Brazilian Portuguese 101 - A2" → seri "Brazilian Portuguese", level A2.
// Cuma modul BERNOMOR 101–104 (bukan "IELTS Prep - Band 6.5+").
const POLA_MODUL = /^(.*?)\s*\b10[1-4]\s*[-–—]\s*(A1|A2|B1|B2)\s*$/i;

export function seriModulPaket(title: string | null | undefined): { seri: string; kunci: string; level: string } | null {
  const m = (title ?? "").trim().match(POLA_MODUL);
  if (!m || !m[1].trim()) return null;
  return { seri: m[1].trim(), kunci: m[1].trim().toLowerCase(), level: m[2].toUpperCase() };
}

export function levelModulPaket(title: string | null | undefined): string | null {
  return seriModulPaket(title)?.level ?? null;
}

export interface BarisPaket {
  productId: string;
  title: string;
  language: string | null;
  type?: string | null;
  /** NULL = tier Selamanya */
  durationDays: number | null;
  price: number;
}

export interface ModulDimiliki {
  title: string | null;
  language: string | null;
  type?: string | null;
}

export interface HasilPaket {
  /** Harga final per productId (yang tak kena paket = harga tiernya). */
  harga: Map<string, number>;
  /** productId yang masuk Paket Lengkap. */
  dalamPaket: Set<string>;
  /** Seri yang paketnya berlaku ("Arabic", "Brazilian Portuguese"). */
  bahasa: string[];
  total: number;
  hemat: number;
}

export function hitungPaketLengkap(items: BarisPaket[], dimiliki: ModulDimiliki[]): HasilPaket {
  const harga = new Map(items.map((x) => [x.productId, Number(x.price) || 0]));
  const dalamPaket = new Set<string>();
  const bahasa: string[] = [];

  const milikPerSeri = new Map<string, Set<string>>();
  for (const m of dimiliki) {
    if (m.type && m.type !== "ebook") continue;
    const sm = seriModulPaket(m.title);
    if (!sm) continue;
    if (!milikPerSeri.has(sm.kunci)) milikPerSeri.set(sm.kunci, new Set());
    milikPerSeri.get(sm.kunci)!.add(sm.level);
  }

  const calonPerSeri = new Map<string, BarisPaket[]>();
  for (const x of items) {
    if (x.type && x.type !== "ebook") continue;
    if (x.durationDays !== null) continue; // wajib Selamanya
    const sm = seriModulPaket(x.title);
    if (!sm) continue;
    if (!calonPerSeri.has(sm.kunci)) calonPerSeri.set(sm.kunci, []);
    calonPerSeri.get(sm.kunci)!.push(x);
  }

  for (const [k, calon] of calonPerSeri) {
    if (calon.length < 2) continue;
    const tertutup = new Set(milikPerSeri.get(k) ?? []);
    for (const x of calon) tertutup.add(levelModulPaket(x.title)!);
    if (!LEVEL_PAKET.every((lv) => tertutup.has(lv))) continue;
    for (const x of calon) {
      harga.set(x.productId, HARGA_PER_MODUL_PAKET);
      dalamPaket.add(x.productId);
    }
    bahasa.push(seriModulPaket(calon[0].title)!.seri);
  }

  const normal = items.reduce((n, x) => n + (Number(x.price) || 0), 0);
  const total = [...harga.values()].reduce((n, v) => n + v, 0);
  return { harga, dalamPaket, bahasa, total, hemat: normal - total };
}
