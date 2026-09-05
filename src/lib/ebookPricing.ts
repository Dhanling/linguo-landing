// =============================================================================
// [ebook-harga-katalog-sync-v1] → [ebook-durasi-akses-v1]
// Harga paket e-book di /produk/ebook — SUMBER TUNGGAL untuk halamannya DAN
// untuk /api/create-invoice yang menghitung ulang nominalnya (anti-tamper).
//
// ── Apa yang dijual di halaman ini ─────────────────────────────────────────
// HANYA e-book seri "101 new edition" (slug `*-id`, pengantar Bahasa
// Indonesia). Edisi English (`modul-*-en`, modul lama) sudah TIDAK dijual di
// landing sejak [ebook-durasi-akses-v1] — pemilih edisi dihapus dari halaman.
//
// Dimensinya sekarang DURASI AKSES, persis tier yang ada di katalog
// (`digital_product_pricing`), bukan lagi edisi:
//   6 Bulan Rp 79.000 · 12 Bulan Rp 149.000 · Selamanya Rp 249.000  (per buku)
// Dulu halaman ini cuma menjual tier "Selamanya", jadi harga termurahnya
// tertulis Rp 249.000 sementara etalase /toko dan semua materi promosi
// menjanjikan "mulai Rp 79.000" — itu yang bikin harganya terlihat tak sinkron.
//
// ── Cara angka bundle diturunkan ───────────────────────────────────────────
// harga = harga 1 buku × jumlah buku × (1 − diskon paket), dibulatkan ke ribuan.
// Diskon paketnya (20% / 29% / 62%) memang model harga halaman ini sejak awal.
//
// Kalau tier katalog berubah, ubah EBOOK_PER_BUKU + tabel EBOOK_PRICES di bawah.
// JANGAN menulis angka mati lagi di komponen halaman atau di route invoice.
//
// PERINGATAN: jangan hapus nominal lama dari EBOOK_EDITION_BY_AMOUNT di
// linguo-app/supabase/functions/xendit-webhook/index.ts — peta itu cadangan
// penentu edisi untuk invoice lama yang external_id-nya belum membawa SKU.
// =============================================================================

export type EbookPaketId = "satuan" | "hemat" | "populer" | "all";
export type EbookDurasiId = "6bln" | "12bln" | "selamanya";

/** Durasi akses yang dijual — mirror tier `digital_product_pricing`. */
export const EBOOK_DURASI: {
  id: EbookDurasiId;
  /** Label di layar. */
  label: string;
  /** Label tier di katalog — dipakai xendit-webhook buat memilih pricing_id. */
  tierLabel: string;
  /** Masa aktif; null = selamanya (expires_at NULL). */
  days: number | null;
}[] = [
  { id: "6bln", label: "6 Bulan", tierLabel: "6 Bulan", days: 180 },
  { id: "12bln", label: "12 Bulan", tierLabel: "12 Bulan", days: 365 },
  { id: "selamanya", label: "Selamanya", tierLabel: "Selamanya", days: null },
];

export const EBOOK_DURASI_LABEL: Record<EbookDurasiId, string> = {
  "6bln": "6 Bulan",
  "12bln": "12 Bulan",
  selamanya: "Selamanya",
};

/** Harga satu e-book per durasi akses — mirror tier katalog. */
export const EBOOK_PER_BUKU: Record<EbookDurasiId, number> = {
  "6bln": 79000,
  "12bln": 149000,
  selamanya: 249000,
};

/** Jumlah bahasa yang bisa dipilih di halaman /produk/ebook. */
export const EBOOK_ALL_ACCESS_QTY = 20;

export const EBOOK_PAKET: { id: EbookPaketId; label: string; qty: number; hemat: number }[] = [
  { id: "satuan", label: "Satuan", qty: 1, hemat: 0 },
  { id: "hemat", label: "Bundle Hemat", qty: 3, hemat: 20 },
  { id: "populer", label: "Bundle Populer", qty: 5, hemat: 29 },
  { id: "all", label: "All-Access", qty: EBOOK_ALL_ACCESS_QTY, hemat: 62 },
];

/**
 * Tabel harga final. Ditulis eksplisit (bukan dihitung saat render) supaya
 * nominalnya stabil & bisa diaudit: harga yang sudah beredar di invoice lama
 * tidak boleh bergeser gara-gara pembulatan berubah.
 *
 *   6bln      (79.000) → 79.000 · 3×0,80=189.600→190.000 · 5×0,71=280.450→280.000
 *                        · 20×0,38=600.400→600.000
 *   12bln    (149.000) → 149.000 · 357.600→358.000 · 528.950→529.000
 *                        · 1.132.400→1.132.000
 *   selamanya(249.000) → 249.000 · 598.000 · 884.000 · 1.892.000  (TIDAK berubah —
 *                        angka ini sudah beredar di invoice sejak 4 Sep 2026)
 */
export const EBOOK_PRICES: Record<EbookDurasiId, Record<EbookPaketId, number>> = {
  "6bln": { satuan: 79000, hemat: 190000, populer: 280000, all: 600000 },
  "12bln": { satuan: 149000, hemat: 358000, populer: 529000, all: 1132000 },
  selamanya: { satuan: 249000, hemat: 598000, populer: 884000, all: 1892000 },
};

/** Harga paket e-book. Selalu lewat sini — jangan hardcode nominalnya lagi. */
export function hargaEbook(durasi: EbookDurasiId, paketId: EbookPaketId): number {
  return EBOOK_PRICES[durasi][paketId];
}

/** Harga e-book termurah yang bisa dibeli di halaman ini ("mulai dari"). */
export const EBOOK_HARGA_TERENDAH = Math.min(
  ...(Object.keys(EBOOK_PRICES) as EbookDurasiId[]).map((d) => hargaEbook(d, "satuan")),
);

/**
 * SKU lama (sebelum [ebook-durasi-akses-v1]): `ebook-<paket>-<id|en>` = akses
 * selamanya. Dipertahankan supaya tab yang sudah kebuka dengan bundel halaman
 * versi lama tetap bisa checkout dengan harga yang benar, dan supaya regex
 * `LINGUO-EBOOK-<paket>-<edisi>-` di xendit-webhook tidak perlu diubah.
 * Edisi English tidak lagi ditawarkan di halaman mana pun.
 */
const EBOOK_LEGACY_EN: Record<EbookPaketId, number> = {
  satuan: 79000, hemat: 189000, populer: 279000, all: 599000,
};

/** SKU productKey → { amount, description } untuk /api/create-invoice. */
export function ebookSkuPrices(): Record<string, { amount: number; description: string }> {
  const out: Record<string, { amount: number; description: string }> = {};
  for (const paket of EBOOK_PAKET) {
    for (const durasi of EBOOK_DURASI) {
      out[`ebook-${paket.id}-id-${durasi.id}`] = {
        amount: hargaEbook(durasi.id, paket.id),
        description: `E-Book ${paket.label} - ${paket.qty} bahasa (akses ${durasi.label})`,
      };
    }
    // Jalur lama — tetap dilayani, dianggap akses selamanya.
    out[`ebook-${paket.id}-id`] = {
      amount: hargaEbook("selamanya", paket.id),
      description: `E-Book ${paket.label} - ${paket.qty} bahasa (akses Selamanya)`,
    };
    out[`ebook-${paket.id}-en`] = {
      amount: EBOOK_LEGACY_EN[paket.id],
      description: `E-Book ${paket.label} - ${paket.qty} bahasa (English Edition)`,
    };
  }
  return out;
}
