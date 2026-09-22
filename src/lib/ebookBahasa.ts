// [ebook-bahasa-dari-katalog-v1] Daftar bahasa e-book di /produk/ebook dibaca
// dari `digital_products`, bukan lagi dari konstanta LANGS yang ditulis tangan
// di halamannya.
//
// Kenapa: konstanta itu berhenti di 20 bahasa sejak awal, sementara katalognya
// tumbuh jadi 50+ lewat pipeline "101 new edition" yang TIDAK menyentuh repo
// landing (lihat scripts/ebook-publish.mjs). Hasilnya persis laporan Faujiah
// (21 Sep 2026): bahasa yang sudah nongol di Perpustakaan dashboard siswa —
// Rumania, Latin, Denmark, Polandia, Irlandia, … — tak pernah bisa dibeli dari
// landing page, padahal bukunya sudah terbit dan sudah ada tier harganya.
//
// Saringannya sengaja ketat, karena halaman ini menjual DURASI AKSES dengan
// harga tetap (6 bln 79rb / 12 bln 149rb / selamanya 249rb, lihat ebookPricing):
//
//   1. slug berakhiran `-id` — edisi Bahasa Indonesia. Pemenuhan di edge fn
//      `xendit-webhook` menyaring kandidat dengan `slug.endsWith("-" + edition)`
//      dan edition checkout landing selalu "id"; modul ber-slug `-en`
//      (mis. `indonesian-101-a1-en`) akan dibayar tapi TIDAK pernah diberikan.
//   2. judul "… 101 - A1" (new edition, tingkat awal) — sama dengan buku yang
//      dipilih `pilihProdukEbook()` di webhook, jadi yang ditawarkan di sini
//      persis yang nanti terbuka di akunnya. Sekaligus membuang modul persiapan
//      tes (IELTS/TOEFL Prep) yang dijual lewat /toko dengan harga sendiri.
//   3. berkasnya di bucket, bukan tautan Drive — syarat pratinjau Unit 1.
//   4. punya tier harga aktif. Modul edisi lama yang tier-nya cuma "Lifetime"
//      ikut tersaring di (2): membelinya di sini berarti bayar tarif 6 bulan
//      untuk akses selamanya, atau sebaliknya.
//
// Bahasa yang baru terbit otomatis muncul tanpa deploy — TAPI nama Indonesianya
// harus ada di dua tempat: NAMA_BAHASA_ID (src/lib/katalogDigital.ts) dan
// EBOOK_LANG_TO_CATALOG (linguo-app/supabase/functions/xendit-webhook). Yang
// kedua yang menerjemahkan balik "Rumania" → "Romanian" saat pembayaran masuk;
// tanpa itu pembayarannya tercatat ORPHAN dan aksesnya harus dibuat manual.

import { createClient } from "@supabase/supabase-js";
import { adalahNewEdition } from "@/lib/ebookEdisi";
import { labelBahasa, tingkatJudul } from "@/lib/katalogDigital";
import { isStoragePath } from "@/lib/digitalAccess";

export type BahasaEbook = {
  /** `digital_products.language` — nama Inggris, kunci pemenuhan di webhook. */
  katalog: string;
  /** Nama Indonesia yang dilihat pembeli ("Rumania"). */
  label: string;
  /** Slug bendera untuk <LangSlugFlag/> (Latin dkk tak punya bendera negara). */
  bendera: string;
  /** Slug produk 101 - A1 — dipakai pratinjau Unit 1. */
  slug: string;
  judul: string;
  cover: string | null;
  /** Berkasnya ada di bucket → tombol "Baca Gratis Unit 1" boleh muncul. */
  pratinjau: boolean;
};

const BUCKET = "ebook-files";

/**
 * Cadangan kalau katalog gagal dibaca (Supabase down, kunci hilang saat build):
 * 20 bahasa yang dulu ditulis tangan di halaman ini. Halaman jualan yang muncul
 * tanpa satu pun bahasa lebih buruk daripada halaman yang cuma menawarkan
 * sebagian — dan ke-20 ini yang pasti bisa dipenuhi webhook. Tanpa slug produk,
 * jadi tombol pratinjaunya memang tak ditawarkan.
 */
export const BAHASA_CADANGAN: BahasaEbook[] = [
  ["English", "Inggris"], ["Spanish", "Spanyol"], ["German", "Jerman"],
  ["Japanese", "Jepang"], ["Mandarin", "Mandarin"], ["Dutch", "Belanda"],
  ["Arabic", "Arab"], ["French", "Prancis"], ["Korean", "Korea"],
  ["Tagalog", "Tagalog"], ["Italian", "Italia"], ["Turkish", "Turki"],
  ["Russian", "Rusia"], ["Portuguese", "Portugis"], ["Thai", "Thailand"],
  ["Vietnamese", "Vietnam"], ["Hindi", "Hindi"], ["Swedish", "Swedia"],
  ["Norwegian", "Norwegia"], ["Finnish", "Finlandia"],
].map(([katalog, label]) => ({
  katalog, label, bendera: katalog.toLowerCase(),
  slug: "", judul: `${katalog} 101 - A1`, cover: null, pratinjau: false,
}));

/** Naik ke atas daftar: bahasa yang paling sering dicari (urutan LANGS lama). */
const POPULER = [
  "English", "Spanish", "German", "Japanese", "Mandarin", "Dutch",
  "Arabic", "French", "Korean", "Italian", "Turkish", "Russian",
];

type BarisProduk = {
  slug: string | null;
  title: string | null;
  language: string | null;
  cover_url: string | null;
  file_url: string | null;
  digital_product_pricing: { is_active: boolean | null; price: number | null }[] | null;
};

/**
 * Isi bucket `ebook-files` (datar, ±300 objek) dalam SATU panggilan. Dipakai
 * untuk memastikan berkas yang dijanjikan tombol pratinjau memang ada —
 * mengecek satu per satu lewat HEAD berarti 50 permintaan tiap halaman dirender.
 *
 * Gagal/memakai kunci yang tak ada → null, dan pemanggilnya memilih "ragu =
 * tampilkan": route pratinjau toh bisa merakit potongannya sendiri saat diklik.
 */
async function daftarBerkas(): Promise<Set<string> | null> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  try {
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.storage.from(BUCKET).list("", { limit: 2000 });
    if (error || !data) return null;
    return new Set(data.map((f) => f.name));
  } catch {
    return null;
  }
}

/**
 * Satu bahasa = satu kartu. Beberapa bahasa punya lebih dari satu modul A1
 * (Arabic: "Arabic 101" & "Levantine Arabic 101"; Portuguese: Eropa & Brasil) —
 * yang dipakai varian BAKU, yaitu yang judulnya diawali nama bahasanya sendiri.
 * Varian lain tetap dijual utuh di /toko, dan memang harus dipilih di sana:
 * checkout ini cuma mengirim nama bahasa, tak bisa membedakan keduanya.
 */
function lebihUtama(calon: BarisProduk, juara: BarisProduk, lang: string): boolean {
  const awalan = (p: BarisProduk) =>
    String(p.title ?? "").trim().toLowerCase().startsWith(lang.toLowerCase());
  if (awalan(calon) !== awalan(juara)) return awalan(calon);
  return String(calon.title ?? "").length < String(juara.title ?? "").length;
}

export async function muatBahasaEbook(): Promise<BahasaEbook[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];

  const db = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db
    .from("digital_products")
    .select("slug, title, language, cover_url, file_url, digital_product_pricing(is_active, price)")
    .eq("type", "ebook")
    .eq("is_active", true)
    .order("title");
  if (error || !data) return [];

  const layak = (data as unknown as BarisProduk[]).filter((p) => {
    if (!p.slug?.endsWith("-id")) return false;
    if (!adalahNewEdition(p.title, "ebook")) return false;
    if (tingkatJudul(p.title ?? "") !== "A1") return false;
    if (!isStoragePath(p.file_url)) return false;
    if (!String(p.language ?? "").trim()) return false;
    return (p.digital_product_pricing ?? []).some(
      (t) => t.is_active !== false && Number(t.price) > 0,
    );
  });

  const perBahasa = new Map<string, BarisProduk>();
  for (const p of layak) {
    const lang = String(p.language).trim();
    const juara = perBahasa.get(lang);
    if (!juara || lebihUtama(p, juara, lang)) perBahasa.set(lang, p);
  }

  const berkas = await daftarBerkas();
  const punyaBerkas = (fileUrl: string) => {
    if (!berkas) return true; // ragu = tampilkan; route pratinjau bisa merakit sendiri
    const dasar = fileUrl.replace(/\.pdf$/i, "");
    return berkas.has(`${dasar}.pratinjau.pdf`) || berkas.has(fileUrl);
  };

  const daftar: BahasaEbook[] = [...perBahasa.entries()].map(([lang, p]) => ({
    katalog: lang,
    label: labelBahasa(lang),
    bendera: lang.toLowerCase(),
    slug: p.slug!,
    judul: String(p.title ?? lang),
    cover: p.cover_url ?? null,
    pratinjau: punyaBerkas(String(p.file_url)),
  }));

  return daftar.sort((a, b) => {
    const ia = POPULER.indexOf(a.katalog);
    const ib = POPULER.indexOf(b.katalog);
    if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    return a.label.localeCompare(b.label, "id");
  });
}
