// =============================================================================
// [ebook-harga-katalog-sync-v1]
// Harga paket e-book di /produk/ebook — SUMBER TUNGGAL untuk halamannya DAN
// untuk /api/create-invoice yang menghitung ulang nominalnya (anti-tamper).
//
// Sebelumnya angkanya ditulis dua kali: `PRICES` di src/app/produk/ebook/page.tsx
// dan `PRODUCT_PRICES` di src/app/api/create-invoice/route.ts. Dua-duanya
// konsisten satu sama lain, tapi dua-duanya ketinggalan dari katalog asli
// (`digital_product_pricing`) — laporan bug "Harga E-Book di Landing Page Belum
// Ter-update", 4 Sep 2026.
//
// ── Apa yang sebenarnya dijual di halaman ini ──────────────────────────────
// Pemenuhannya (handleEbookLead di xendit-webhook) membuat baris
// `digital_purchases` TANPA `expires_at` → aksesnya SELAMANYA. Jadi patokan
// harga satu buku di sini adalah tier "Selamanya" di katalog, bukan tier 6/12
// bulan yang dipakai etalase /toko sebagai harga "mulai dari".
//
// Katalog per 4 Sep 2026 (digital_product_pricing, is_active):
//   • Edisi Bahasa Indonesia (seri "101 new edition", slug *-id)
//       6 Bulan Rp 79.000 · 12 Bulan Rp 149.000 · Selamanya Rp 249.000
//   • Edisi English (modul lama, slug modul-*-en)
//       Lifetime Rp 79.000 (tier tunggal)
//
// ── Cara angka bundle diturunkan ───────────────────────────────────────────
// harga = harga 1 buku × jumlah buku × (1 − diskon paket), dibulatkan ke ribuan.
// Diskon paketnya TIDAK berubah — itu memang model harga halaman ini sejak awal
// (dan persis angka yang sudah dipakai edisi English: 189.000 = 3 × 79.000 −20%,
// 279.000 = 5 × 79.000 −29%, 599.000 = 20 × 79.000 −62%).
//
// Kalau tier "Selamanya" di katalog berubah, ubah PER_BUKU di bawah lalu
// jalankan ulang — angka bundle ikut menyesuaikan sendiri. JANGAN menulis
// angka mati lagi di komponen halaman atau di route invoice.
// =============================================================================

export type EbookEditionId = "id" | "en";
export type EbookPaketId = "satuan" | "hemat" | "populer" | "all";

export const EBOOK_EDITION_LABEL: Record<EbookEditionId, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

/** Harga akses SELAMANYA satu e-book per edisi — mirror tier katalog. */
export const EBOOK_PER_BUKU: Record<EbookEditionId, number> = {
  id: 249000,
  en: 79000,
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
 *   id  → harga baru, diturunkan dari tier "Selamanya" katalog Rp 249.000:
 *           satuan  249.000
 *           hemat   249.000 × 3  × 0,80 =   597.600 → 598.000
 *           populer 249.000 × 5  × 0,71 =   883.950 → 884.000
 *           all     249.000 × 20 × 0,38 = 1.892.400 → 1.892.000
 *   en  → TIDAK berubah. Tier katalog edisi English masih Lifetime Rp 79.000,
 *         jadi angka yang sudah beredar (189/279/599 ribu) memang masih benar.
 */
export const EBOOK_PRICES: Record<EbookEditionId, Record<EbookPaketId, number>> = {
  id: { satuan: 249000, hemat: 598000, populer: 884000, all: 1892000 },
  en: { satuan: 79000, hemat: 189000, populer: 279000, all: 599000 },
};

/** Harga paket e-book. Selalu lewat sini — jangan hardcode nominalnya lagi. */
export function hargaEbook(edition: EbookEditionId, paketId: EbookPaketId): number {
  return EBOOK_PRICES[edition][paketId];
}

/** Harga e-book termurah yang bisa dibeli di halaman ini ("mulai dari"). */
export const EBOOK_HARGA_TERENDAH = Math.min(
  ...(Object.keys(EBOOK_PRICES) as EbookEditionId[]).map((e) => hargaEbook(e, "satuan")),
);

/** SKU productKey → { amount, description } untuk /api/create-invoice. */
export function ebookSkuPrices(): Record<string, { amount: number; description: string }> {
  const out: Record<string, { amount: number; description: string }> = {};
  for (const edition of ["id", "en"] as EbookEditionId[]) {
    for (const paket of EBOOK_PAKET) {
      out[`ebook-${paket.id}-${edition}`] = {
        amount: hargaEbook(edition, paket.id),
        description:
          `E-Book ${paket.label} - ${paket.qty} bahasa (Edisi ${EBOOK_EDITION_LABEL[edition]})`,
      };
    }
  }
  return out;
}
