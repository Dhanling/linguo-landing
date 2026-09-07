// [onboarding-belanja-v1] Katalog produk digital (e-book & e-learning) —
// pembacaan + label yang dipakai bersama oleh Perpustakaan (/akun) DAN checkout
// onboarding. Sebelum ini semua helper judul/bahasa tinggal di LibraryView.tsx,
// jadi layar belanja baru mana pun harus menyalinnya; salinan itu yang bikin
// judul kartu di dua layar bisa berbeda untuk produk yang sama.
//
// Yang menentukan harga tetap SERVER (/api/create-cart-invoice membaca ulang
// digital_product_pricing) — angka di sini murni untuk ditampilkan.

import type { SupabaseClient } from "@supabase/supabase-js";
import { saringEdisiLama } from "@/lib/ebookEdisi";
import { ELEARNING_BUNDLE_SLUG } from "@/lib/elearningBundle";
import { materialReady, fetchProductLangs } from "@/lib/digitalAccess";

export type TierKatalog = {
  id: string;
  price: number;
  display_label: string | null;
  duration_days: number | null;
  sort_order: number | null;
};

export type ProdukKatalog = {
  id: string;
  type: "ebook" | "elearning";
  title: string;
  slug: string | null;
  cover_url: string | null;
  file_url: string | null;
  video_playlist_url: string | null;
  language: string | null;
  level: string | null;
  pricing: TierKatalog[];
};

// ── Judul kartu ────────────────────────────────────────────────────────────
// Judul di DB penuh boilerplate ("Modul Belajar Mandiri — Linguo | Bahasa X").
const PENGGAL_BOILERPLATE = /(modul\s+(belajar|mandiri)|^linguo$|^bahasa\s+\w+$)/i;

// [pustaka-judul-level-v1] Judul cetakan baru membawa tingkatnya di ekor
// ("Danish 101 - A2") dan pemenggal di atas memotong tepat di " - " itu juga —
// empat modul Danish jadi empat kartu berjudul sama. Tingkatnya dipasang balik.
// Cuma ekor CEFR TUNGGAL yang dihitung: rentang edisi lama ("A1-B1") menandai
// isi modul, bukan tingkatnya.
const EKOR_LEVEL = /\b\d{3}\s*[-–—]\s*(A1|A2|B1|B2|C1|C2)\s*$/i;

export function tingkatJudul(raw: string): string | null {
  const m = (raw || "").trim().match(EKOR_LEVEL);
  return m ? m[1].toUpperCase() : null;
}

export function judulRingkas(raw: string): string {
  const penggal = (raw || "")
    .split(/\s+[—–|]\s+|\s+-\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const sisa = penggal.filter((x) => !PENGGAL_BOILERPLATE.test(x));
  const judul = (sisa[0] || penggal[0] || raw || "").replace(/\s*\bLinguo\b\s*/gi, " ").trim();
  const inti = judul || raw;
  const level = tingkatJudul(raw);
  if (!level || new RegExp(`\\b${level}\\s*$`, "i").test(inti)) return inti;
  return `${inti} - ${level}`;
}

// `digital_products.language` isinya nama Inggris ("Sundanese", "Persian"),
// sementara dashboard siswa berbahasa Indonesia.
const NAMA_BAHASA_ID: Record<string, string> = {
  arabic: "Arab", basque: "Basque", bengali: "Bengali", cantonese: "Kanton",
  chinese: "Mandarin", czech: "Ceko", danish: "Denmark", dutch: "Belanda",
  english: "Inggris", estonian: "Estonia", finnish: "Finlandia", french: "Prancis",
  georgian: "Georgia", german: "Jerman", greek: "Yunani", hebrew: "Ibrani",
  hindi: "Hindi", hungarian: "Hungaria", icelandic: "Islandia", indonesian: "Indonesia",
  italian: "Italia", japanese: "Jepang", javanese: "Jawa", khmer: "Khmer",
  korean: "Korea", lao: "Laos", malay: "Melayu", mandarin: "Mandarin",
  myanmar: "Myanmar", norwegian: "Norwegia", persian: "Persia", polish: "Polandia",
  portuguese: "Portugis", russian: "Rusia", serbian: "Serbia", slovak: "Slovakia",
  slovenian: "Slovenia", spanish: "Spanyol", sundanese: "Sunda", swahili: "Swahili",
  swedish: "Swedia", tagalog: "Tagalog", thai: "Thailand", turkish: "Turki",
  ukrainian: "Ukraina", urdu: "Urdu", uzbek: "Uzbek", vietnamese: "Vietnam",
};

export function labelBahasa(raw: string) {
  return NAMA_BAHASA_ID[raw.trim().toLowerCase()] ?? raw.trim();
}

export const fmtRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

/** Harga termurah produk (null = belum ada tier aktif → belum bisa dijual). */
export function hargaMulai(p: ProdukKatalog): number | null {
  if (p.pricing.length === 0) return null;
  return Math.min(...p.pricing.map((t) => t.price));
}

/**
 * Tier yang dipilihkan lebih dulu — SAMA persis dengan default popup Beli di
 * Perpustakaan (tengah kalau ada 3), supaya harga yang tampil di dua layar tak
 * pernah berbeda untuk produk yang sama.
 */
export function tierDefault(pricing: TierKatalog[]): TierKatalog | null {
  if (pricing.length === 0) return null;
  return pricing.length >= 3 ? pricing[1] : pricing[0];
}

// ── Pembacaan katalog ──────────────────────────────────────────────────────
// Di-cache per modul: isinya sama untuk semua pembeli dan jarang berubah.
let cache: ProdukKatalog[] | null = null;
let inflight: Promise<ProdukKatalog[]> | null = null;

/**
 * Produk aktif yang BOLEH dijual: materinya sudah siap (link/berkas terisi &
 * bukan placeholder) dan edisi lamanya disembunyikan kalau bahasanya sudah
 * punya edisi baru. Aturan yang sama ditegakkan ulang di server saat checkout —
 * ini cuma supaya etalasenya tidak menjanjikan barang yang belum ada.
 */
export async function loadKatalogDigital(supabase: SupabaseClient): Promise<ProdukKatalog[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await supabase
      .from("digital_products")
      .select(`
        id, type, title, slug, cover_url, file_url, video_playlist_url, language, level,
        digital_product_pricing ( id, price, display_label, sort_order, duration_days, is_active )
      `)
      .in("type", ["ebook", "elearning"])
      .eq("is_active", true)
      // paket "12+ bahasa" tidak dijual lagi (lihat lib/elearningBundle.ts)
      .neq("slug", ELEARNING_BUNDLE_SLUG)
      .order("title");
    if (error || !data) return [];

    const rows = (data as unknown as (Omit<ProdukKatalog, "pricing"> & {
      digital_product_pricing: (TierKatalog & { is_active: boolean })[];
    })[]).map((p) => {
      const { digital_product_pricing, ...prod } = p;
      const pricing = (digital_product_pricing ?? [])
        .filter((t) => t.is_active !== false && Number(t.price) > 0)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return { ...prod, pricing } as ProdukKatalog;
    });

    const dijual = saringEdisiLama(rows) as ProdukKatalog[];
    // Materi belum siap = jangan ditawarkan. Baris bahasa (paket multi-bahasa)
    // ikut dibaca supaya produk yang linknya per bahasa tidak ikut tersaring.
    const langs = await fetchProductLangs(supabase, dijual.map((p) => p.id));
    const siap = dijual.filter((p) => p.pricing.length > 0 && materialReady(p, langs[p.id]));
    cache = siap;
    return siap;
  })().finally(() => { inflight = null; });
  return inflight;
}
