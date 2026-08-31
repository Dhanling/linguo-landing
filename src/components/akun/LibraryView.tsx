"use client";

// [linguo-patch:pustaka-page-v1] Halaman "Perpustakaan Saya" (E-Book & E-Learning yang sudah dibeli).
// Data: digital_purchases JOIN digital_products + digital_product_pricing (skema existing, TIDAK diubah).
// Progress e-learning: best-effort dari lms_progress, dipetakan via digital_products.language → lms_modules.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// [ui-lang-switcher-v1] judul & label ikut bahasa antarmuka
import { useT } from "@/lib/uiLang";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  Film, BookOpen, Bookmark, BookmarkCheck, Play, Search, LayoutGrid, List,
  Infinity as InfinityIcon, CalendarClock, Clock, ChevronRight,
  Flame, Loader2, ShoppingBag, GraduationCap, ExternalLink, X, Check, CreditCard, Sparkles,
  Lock, Ticket, ShoppingCart, Trash2, Plus, History,
} from "lucide-react";
import {
  externalLinkFor, isStoragePath, accessVerb, isPlaceholderLink,
  fetchProductLangs, usableLangs, materialReady, type ProductLang,
} from "@/lib/digitalAccess";
/* linguo-patch:produk-digital-link-v1 — playlist YouTube diputar di dashboard, bukan tab baru */
import { parseYouTube } from "@/lib/youtube";
import YouTubePlayerModal, { type PlayerTarget } from "@/components/YouTubePlayerModal";
/* produk-digital-per-bahasa-v1 — paket multi-bahasa: pilih bahasa dulu, baru playlist-nya dibuka */
import LangMateriPicker, { type LangPickerTarget } from "@/components/LangMateriPicker";
// [lms-content-readiness-v1] progres e-learning cuma dihitung dari sesi yang sudah ada materinya
import { fetchLessonStats, keepReady } from "@/lib/lmsContent";
/* [perpustakaan-akses-email-v1] kepemilikan = auth_user_id ATAU email sesi */
import { orMilikSaya } from "@/lib/digitalOwnership";
/* [pustaka-kartu-foto-v1] sampul kartu pakai foto stok bahasa yang sama dengan
   kartu kelas di dashboard siswa, jadi Perpustakaan tidak lagi terasa "kartu warna polos". */
import { getLangPhoto } from "@/lib/lang-visuals";
// [pustaka-judul-bendera-v1] bendera rounded-rectangle di kiri judul kartu
import { FLAG_CODE_BY_SLUG, RectFlag } from "@/components/RectFlag";
// [ebook-reader-v1] e-book berkas dibaca di dalam dashboard, bukan diunduh
import EbookReader, { prewarmEbookReader, prewarmEbookModul, mintaLayarPenuh } from "@/components/akun/EbookReader";
import { ELEARNING_BUNDLE_SLUG, masihDijual } from "@/lib/elearningBundle";
/* [pustaka-terakhir-dibuka-v1] baris pintas "Terakhir dibuka" — sama seperti di
   Perpustakaan dashboard pengajar, dirakit dari jejak reader di perangkat ini */
import { bacaTerakhirDibuka, hapusTerakhirDibuka, type JejakPustaka } from "@/lib/pustakaTerakhir";
// [pustaka-popup-blocked-v1] tab bayar dibuka di dalam gestur klik, bukan sesudah fetch
import { siapkanTabPembayaran } from "@/lib/bukaTabPembayaran";
// [pustaka-keranjang-v1] beli beberapa produk sekaligus → satu invoice
import {
  useKeranjang, tambahKeKeranjang, hapusDariKeranjang, kosongkanKeranjang,
  sinkronkanKeranjang, type ItemKeranjang,
} from "@/lib/keranjangPustaka";
/* [lingbook-lebur-pustaka-v1] Lingbook tidak lagi jadi menu sendiri di sidebar —
   dia rak di sini. Alasannya: siswa tidak berpikir "ini e-book atau lingbook",
   dia berpikir "di mana bahan bacaanku". Satu rumah, tiga rak. */

/* ---------------- types ---------------- */
type ProductType = "elearning" | "ebook";

interface DProduct {
  id: string;
  type: ProductType;
  title: string;
  slug: string | null;
  cover_url: string | null;
  file_url: string | null;
  video_playlist_url: string | null;
  language: string | null;
  level: string | null;
  pages: number | null;
  modules_count: number | null;
  total_duration_min: number | null;
}

interface Purchase {
  id: string;
  payment_status: string;
  /* [ebook-pratinjau-unit1-v1] 'preview' = baris CICIP (Rp0, Unit 1 saja).
     Nilai lain (xendit/manual/promo/…) = kepemilikan penuh. */
  source: string | null;
  access_granted: boolean;
  expires_at: string | null;
  download_count: number;
  created_at: string;
  digital_products: DProduct;
  digital_product_pricing: { display_label: string | null; duration_days: number | null } | null;
}

interface Prog { pct: number; done: number; total: number; resume: { id: string; title: string } | null; nextIndex: number }

/* ---------------- tokens / helpers ---------------- */
const GRADIENTS = [
  "linear-gradient(150deg,#1FA98A,#0C8163)",
  "linear-gradient(150deg,#3B82F6,#1D4ED8)",
  "linear-gradient(150deg,#8B5CF6,#6D28D9)",
  "linear-gradient(150deg,#F59E0B,#D97706)",
  "linear-gradient(150deg,#EC4899,#BE185D)",
  "linear-gradient(150deg,#14B8A6,#0F766E)",
];
function gradFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

const LANG_GLYPH: Record<string, string> = {
  english: "EN", inggris: "EN", korean: "한", korea: "한", japanese: "あ", jepang: "あ",
  mandarin: "中", chinese: "中", arabic: "ع", arab: "ع", french: "FR", prancis: "FR",
  german: "DE", jerman: "DE", spanish: "ES", spanyol: "ES", italian: "IT", italia: "IT",
  thai: "TH", vietnamese: "VN", vietnam: "VN", dutch: "NL", belanda: "NL",
};
function glyphFor(p: DProduct) {
  if (/12\s*\+|multi|semua bahasa/i.test(p.title)) return "12+";
  const lang = p.language?.toLowerCase().trim();
  if (lang && LANG_GLYPH[lang]) return LANG_GLYPH[lang];
  if (p.level) return p.level.slice(0, 3).toUpperCase();
  if (lang) return lang.slice(0, 2).toUpperCase();
  return p.type === "ebook" ? "PDF" : "EN";
}

// [pustaka-kartu-foto-v1] Sampul kartu: cover_url produk kalau ada, kalau tidak
// jatuh ke foto stok bahasa (public/lang/<slug>.jpg) — sumber yang sama dipakai
// kartu kelas. Balikin null → kartu tetap pakai gradien + glyph seperti dulu.
function fotoSampul(p: DProduct): string | null {
  if (p.cover_url) return p.cover_url;
  return getLangPhoto(p.language);
}

// [ebook-sampul-produk-v1] Sampul rancangan itu potret 1:√2 (judul di sepertiga
// atas), sementara kotak sampul kartu lebar. `object-cover` yang menjangkar di
// tengah memotong persis judulnya — yang tersisa cuma dagu ilustrasi. Foto stok
// bahasa lanskap tak punya masalah itu, jadi jangkar atas hanya dipakai kalau
// sampulnya memang berasal dari cover_url.
function jangkarSampul(p: DProduct): string {
  return p.cover_url ? " object-top" : "";
}

// [pustaka-judul-ringkas-v1] Judul katalog dari admin panjangnya bisa dua baris penuh
// ("Modul Belajar Bahasa Arab Linguo — Arabic 101 (Edisi Bahasa Indonesia)"). Di kartu
// yang dibaca sekilas, potongan boilerplate itu cuma bikin semua kartu kelihatan sama.
// Kita buang penggal yang isinya "Modul Belajar/Mandiri ..." atau cuma merek "Linguo",
// lalu sisakan penggal pertama yang benar-benar menamai produknya.
const PENGGAL_BOILERPLATE = /(modul\s+(belajar|mandiri)|^linguo$|^bahasa\s+\w+$)/i;
function judulRingkas(raw: string): string {
  const penggal = (raw || "")
    .split(/\s+[—–|]\s+|\s+-\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const sisa = penggal.filter((x) => !PENGGAL_BOILERPLATE.test(x));
  const judul = (sisa[0] || penggal[0] || raw || "").replace(/\s*\bLinguo\b\s*/gi, " ").trim();
  return judul || raw;
}

// [pustaka-judul-bendera-v1] Bendera negara di kiri judul kartu. Semua kartu
// katalog berjudul "<Bahasa> 101 (…)", jadi bahasanya cuma bisa dikenali dengan
// membaca judulnya satu per satu; benderanya kelihatan sekali lirik. Bahasa tanpa
// padanan negara (mis. Latin/Esperanto) sengaja tidak digambar apa-apa — Globe
// abu-abu cuma jadi noise dan bikin judulnya tidak rata.
function TitleFlag({ language, h = 15 }: { language: string | null; h?: number }) {
  const code = language ? FLAG_CODE_BY_SLUG[language.trim().toLowerCase()] : undefined;
  if (!code) return null;
  return <RectFlag code={code} h={h} className="shadow-sm" />;
}

// [pustaka-filter-edisi-v1] Katalog e-book terbit dalam dua edisi bahasa pengantar:
// "(Edisi Bahasa Indonesia)" dan "(English Edition)" — jadi tiap judul muncul dua
// kali di daftar dan siswa harus membaca ekor judulnya satu per satu. Edisi tidak
// punya kolom sendiri di `digital_products`, jadi dibaca dari slug (`…-id` / `…-en`)
// dengan judul sebagai cadangan. Per 20 Agu 2026: 27 EN, 20 ID, 1 tanpa edisi
// (paket 12+ bahasa) — yang tanpa edisi cuma tampil di pilihan "Semua".
type Edisi = "id" | "en";
function edisiProduk(p: { title: string; slug?: string | null }): Edisi | null {
  const s = `${p.slug ?? ""} ${p.title}`.toLowerCase();
  if (/english edition|\(en\)|-en\b/.test(s)) return "en";
  if (/edisi (bahasa )?indonesia|\(id\)|-id\b/.test(s)) return "id";
  return null;
}

// [pustaka-filter-lanjutan-v1] Tiga saringan tambahan yang paling sering ditanya
// siswa di Perpustakaan: "mana modul yang baru", "yang bahasa X", "yang level A1".
// Ketiganya dibaca dari kolom yang SUDAH ada di `digital_products` (title/language/
// level) — tidak ada perubahan skema.

// [judul-ebook-inggris-v2] Modul cetakan baru dikenali dari pola judul barunya
// "<Bahasa> 101 - A1" (dulu bertanda "… new edition"; pola lama tetap dikenali
// supaya produk yang belum tersinkron tidak hilang dari saringan). E-Learning dan
// modul edisi lama tidak pernah cocok, jadi memilih "New edition" otomatis
// menyisakan Lingbook cetakan baru saja — itu memang perilaku yang diharapkan.
function adalahNewEdition(p: { title: string }) {
  const judul = p.title || "";
  return /\bnew edition\b/i.test(judul) || /\b10\d\s*-\s*[ABC][12]\b/i.test(judul);
}

// `digital_products.language` isinya nama Inggris ("Sundanese", "Persian"),
// sementara dashboard siswa berbahasa Indonesia. Dipetakan di sini saja supaya
// tidak menyeret seluruh master kurikulum ke bundel halaman Perpustakaan.
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
function labelBahasa(raw: string) {
  return NAMA_BAHASA_ID[raw.trim().toLowerCase()] ?? raw.trim();
}

// Level dipakai apa adanya ("A1", "A2", "B1", "A1-B1"); yang kosong hanya muncul
// di pilihan "Semua level".
function urutLevel(a: string, b: string) {
  return a.localeCompare(b, "en");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function fmtRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

// [perpanjang-inplace-v1] tier harga produk digital (dari digital_product_pricing)
interface RenewTier { id: string; price: number; display_label: string | null; sort_order: number | null; duration_days: number | null }

// [pustaka-katalog-terkunci-v1] produk katalog yang BELUM dimiliki siswa —
// ditampilkan sebagai kartu tergembok di Perpustakaan, checkout Xendit di tempat.
interface CatalogItem extends DProduct { pricing: RenewTier[] }

type Access =
  | { kind: "forever" }
  | { kind: "expired" }
  | { kind: "soon"; days: number }
  | { kind: "dated"; until: string };

/* [ebook-pratinjau-unit1-v1] Baris cicip: masuk rak seperti milik sendiri, tapi
   readernya cuma membuka Unit 1 dan kartunya bertanda "Pratinjau". Sengaja tidak
   disembunyikan dari rak — justru di rak itu orang kembali membukanya, dan tiap
   pembukaan adalah kesempatan tombol belinya terlihat lagi. */
const cicipan = (p: Purchase) => p.source === "preview";

function accessInfo(p: Purchase): Access {
  if (!p.expires_at) return { kind: "forever" };
  const ms = new Date(p.expires_at).getTime() - Date.now();
  if (ms <= 0) return { kind: "expired" };
  const days = Math.ceil(ms / 86_400_000);
  if (days <= 14) return { kind: "soon", days };
  return { kind: "dated", until: p.expires_at };
}

/* ---------------- progress mapping (lms) ---------------- */
function buildProgressByLang(
  modules: { id: string; language: string; sort_order: number | null }[],
  lessons: { id: string; module_id: string; title: string; sort_order: number | null }[],
  doneSet: Set<string>
): Record<string, { total: number; done: number; resume: { id: string; title: string } | null }> {
  const modLang = new Map<string, string>();
  const modOrder = new Map<string, number>();
  const sorted = [...modules].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  sorted.forEach((m, i) => { modLang.set(m.id, m.language); modOrder.set(m.id, m.sort_order ?? i); });

  const byLang: Record<string, { id: string; title: string; mo: number; so: number }[]> = {};
  for (const l of lessons) {
    const lang = modLang.get(l.module_id);
    if (!lang) continue;
    const key = lang.toLowerCase().trim();
    (byLang[key] ||= []).push({ id: l.id, title: l.title, mo: modOrder.get(l.module_id) ?? 0, so: l.sort_order ?? 0 });
  }

  const out: Record<string, { total: number; done: number; resume: { id: string; title: string } | null }> = {};
  for (const key of Object.keys(byLang)) {
    const arr = byLang[key].sort((a, b) => a.mo - b.mo || a.so - b.so);
    const done = arr.filter((x) => doneSet.has(x.id)).length;
    const next = arr.find((x) => !doneSet.has(x.id)) || null;
    out[key] = { total: arr.length, done, resume: next ? { id: next.id, title: next.title } : null };
  }
  return out;
}

// [elearning-per-bahasa-v1] "Siap dibuka" untuk produk yang SUDAH dimiliki.
// Sedikit lebih longgar dari `materialReady` (yang menjaga etalase & kode promo):
// pemilik e-learning tanpa playlist masih boleh masuk lewat modul LMS bahasa yang
// sama kalau modulnya sudah berisi. Kalau dua-duanya kosong, kartunya bilang
// "Materi sedang disiapkan" — jangan tampilkan tombol yang tak membuka apa pun.
function siapDibuka(
  prod: Purchase["digital_products"],
  langs: ProductLang[] | undefined,
  byLang: Record<string, { total: number; done: number; resume: { id: string; title: string } | null }>,
): boolean {
  if (materialReady(prod, langs)) return true;
  if (prod.type !== "elearning") return false;
  const lang = prod.language?.toLowerCase().trim();
  return !!(lang && (byLang[lang]?.total ?? 0) > 0);
}

function progFor(p: Purchase, byLang: Record<string, { total: number; done: number; resume: { id: string; title: string } | null }>): Prog | null {
  if (p.digital_products.type !== "elearning") return null;
  const lang = p.digital_products.language?.toLowerCase().trim();
  if (!lang) return null;
  const pr = byLang[lang];
  if (!pr || pr.total === 0) return null;
  const pct = Math.round((pr.done / pr.total) * 100);
  return { pct, done: pr.done, total: pr.total, resume: pr.resume, nextIndex: Math.min(pr.done + 1, pr.total) };
}

/* ---------------- small UI atoms ---------------- */
function TypeBadge({ type }: { type: ProductType }) {
  const Icon = type === "ebook" ? BookOpen : Film;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#12172B] shadow-sm">
      <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      {/* [lingbook-nama-ebook-v1] "E-Book" diganti "Lingbook" — nama produknya
          sendiri, bukan format berkasnya. Kunci datanya TETAP `ebook`. */}
      {type === "ebook" ? "Lingbook" : "E-Learning"}
    </span>
  );
}

function AccessChip({ a }: { a: Access }) {
  if (a.kind === "forever")
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#12A37E]/10 px-2.5 py-1 text-[11px] font-bold text-[#0C8163]">
        <InfinityIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> Selamanya
      </span>
    );
  if (a.kind === "expired")
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600">
        <Clock className="h-3.5 w-3.5" strokeWidth={2.4} /> Akses Berakhir
      </span>
    );
  if (a.kind === "soon")
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">
        <Clock className="h-3.5 w-3.5" strokeWidth={2.4} /> Sisa {a.days} hari
      </span>
    );
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
      <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.4} /> s/d {fmtDate(a.until)}
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(pct, 3)}%`, background: "linear-gradient(90deg,#1FA98A,#0C8163)" }}
      />
    </div>
  );
}

/* ---------------- main ---------------- */
const BM_KEY = "linguo_pustaka_bookmarks";

// [perf:pustaka-cache-v1] cache module-level per user: buka lagi Perpustakaan →
// render instan dari kunjungan sebelumnya, data di-refresh di belakang layar.
type LangProgress = Record<string, { total: number; done: number; resume: { id: string; title: string } | null }>;
type LibData = { purchases: Purchase[]; byLang: LangProgress; prodLangs: Record<string, ProductLang[]> };
let libCache: ({ userId: string } & LibData) | null = null;

/* [perf:pustaka-prewarm-v1] Pemuatan pustaka dipindah ke level MODUL supaya bisa
   dipanaskan dari /akun sebelum menunya diklik (lihat warm() di app/akun/page.tsx).
   Dulu 5 query-nya baru berangkat SAAT komponen mount — klik "Perpustakaan" berarti
   menunggu jaringan dari nol dengan spinner. `libInflight` bikin pemanasan dan
   pemuatan komponen berbagi SATU rangkaian query, bukan dua yang balapan. */
let libInflight: { userId: string; p: Promise<LibData | null> } | null = null;

async function runLoadLibrary(
  supabase: SupabaseClient,
  userId: string,
  onEarly?: (d: { purchases: Purchase[]; byLang: LangProgress }) => void,
): Promise<LibData | null> {
  // [perpustakaan-akses-email-v1] pembelian lama sering ber-auth_user_id NULL
  // (akunnya dibuat sesudah bayar) → cocokkan juga lewat email sesi.
  const milikSaya = await orMilikSaya(supabase, userId);
  const purchasesBase = supabase
    .from("digital_purchases")
    .select(`
      id, payment_status, access_granted, expires_at, download_count, created_at, source,
      digital_products (
        id, type, title, slug, cover_url, file_url, video_playlist_url,
        language, level, pages, modules_count, total_duration_min
      ),
      digital_product_pricing ( display_label, duration_days )
    `);
  const purchasesReq = (milikSaya ? purchasesBase.or(milikSaya) : purchasesBase.eq("auth_user_id", userId))
    .eq("payment_status", "Lunas")
    .order("created_at", { ascending: false });

  // best-effort progress (kalau tabel/akses gak ada → diabaikan, progress=0)
  const modReq = supabase.from("lms_modules").select("id,language,sort_order").order("sort_order");
  const lessReq = supabase.from("lms_lessons").select("id,module_id,title,sort_order").order("sort_order");
  const progReq = supabase.from("lms_progress").select("lesson_id,status").eq("user_id", userId);

  const [pRes, mRes, lRes, prRes, lessonStats] = await Promise.all([
    purchasesReq,
    modReq,
    lessReq,
    progReq,
    fetchLessonStats(), // [lms-content-readiness-v1]
  ]);

  if (pRes.error) {
    console.error("Gagal memuat perpustakaan:", pRes.error);
    return null;
  }
  const purchases = (pRes.data ?? []) as unknown as Purchase[];

  let byLang: LangProgress = libCache?.userId === userId ? libCache.byLang : {};
  if (!mRes.error && !lRes.error) {
    const doneSet = new Set<string>(
      (((prRes.data as { lesson_id: string; status: string }[]) || []) || [])
        .filter((x) => x.status === "completed")
        .map((x) => x.lesson_id)
    );
    // [lms-content-readiness-v1] sesi yang materinya belum ditulis jangan jadi penyebut
    const allLessons = ((lRes.data as any) || []) as {
      id: string; module_id: string; title: string; sort_order: number | null;
    }[];
    byLang = buildProgressByLang((mRes.data as any) || [], keepReady(allLessons, lessonStats), doneSet);
  }
  // Daftar produk sudah bisa digambar duluan; link per bahasa menyusul.
  onEarly?.({ purchases, byLang });
  libCache = { userId, purchases, byLang, prodLangs: libCache?.userId === userId ? libCache.prodLangs : {} };

  // [produk-digital-per-bahasa-v1] link materi per bahasa untuk produk yang dibeli
  const prodLangs = await fetchProductLangs(supabase, purchases.map((p) => p.digital_products?.id));
  libCache = { userId, purchases, byLang, prodLangs };
  return { purchases, byLang, prodLangs };
}

/** Satu pemuatan bersama per user — pemanggil kedua ikut menumpang yang sedang jalan. */
function loadLibraryShared(
  supabase: SupabaseClient,
  userId: string,
  onEarly?: (d: { purchases: Purchase[]; byLang: LangProgress }) => void,
): Promise<LibData | null> {
  if (libInflight && libInflight.userId === userId) return libInflight.p;
  const p = runLoadLibrary(supabase, userId, onEarly).finally(() => {
    if (libInflight?.p === p) libInflight = null;
  });
  libInflight = { userId, p };
  return p;
}

// [pustaka-katalog-terkunci-v1] Katalog produk aktif (bisa dibaca anon: policy
// products_public_read_active + pricing_public_read_active). Di-cache modul
// karena isinya sama untuk semua siswa dan jarang berubah.
let katalogCache: CatalogItem[] | null = null;
let katalogInflight: Promise<CatalogItem[]> | null = null;

async function loadKatalog(supabase: SupabaseClient): Promise<CatalogItem[]> {
  if (katalogCache) return katalogCache;
  if (katalogInflight) return katalogInflight;
  katalogInflight = (async () => {
    const { data, error } = await supabase
      .from("digital_products")
      .select(`
        id, type, title, slug, cover_url, file_url, video_playlist_url,
        language, level, pages, modules_count, total_duration_min,
        digital_product_pricing ( id, price, display_label, sort_order, duration_days, is_active )
      `)
      .eq("is_active", true)
      // [elearning-per-bahasa-v1] paket 12+ bahasa tak dijual lagi (lihat
      // lib/elearningBundle.ts) — barisnya tetap aktif untuk pembeli lama,
      // tapi jangan ditawarkan lagi di katalog.
      .neq("slug", ELEARNING_BUNDLE_SLUG)
      .order("title");
    // Katalog cuma pemanis; kalau gagal, Perpustakaan tetap menampilkan milik siswa.
    if (error || !data) return [];
    const rows = (data as unknown as (DProduct & { digital_product_pricing: (RenewTier & { is_active: boolean })[] })[]).map((p) => {
      const { digital_product_pricing, ...prod } = p;
      const pricing = (digital_product_pricing ?? [])
        .filter((t) => t.is_active !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return { ...prod, pricing } as CatalogItem;
    });
    katalogCache = rows;
    return rows;
  })().finally(() => { katalogInflight = null; });
  return katalogInflight;
}

/**
 * [pustaka-keranjang-v1] Tier yang dipilihkan lebih dulu. Sengaja SAMA persis
 * dengan default popup Beli (tengah kalau ada 3 — paket "populer"), supaya
 * harga di kartu, di keranjang, dan di popup tidak pernah berbeda-beda.
 */
function tierDefault(pricing: RenewTier[]): RenewTier | null {
  if (pricing.length === 0) return null;
  return pricing.length >= 3 ? pricing[1] : pricing[0];
}

/** [pustaka-keranjang-v1] CatalogItem + tier terpilih → baris keranjang. */
function keItemKeranjang(item: CatalogItem, tier: RenewTier): ItemKeranjang {
  return {
    productId: item.id,
    pricingId: tier.id,
    title: item.title,
    type: item.type,
    price: tier.price,
    tierLabel: tier.display_label,
    durationDays: tier.duration_days,
    language: item.language,
    coverUrl: item.cover_url,
  };
}

/** Harga termurah produk katalog (null = belum ada tier aktif → belum bisa dibeli). */
function hargaMulai(item: CatalogItem): number | null {
  if (item.pricing.length === 0) return null;
  return Math.min(...item.pricing.map((t) => t.price));
}

/** [perf:pustaka-prewarm-v1] Dipanggil dari /akun saat browser senggang. */
export function prewarmLibrary(supabase: SupabaseClient, userId: string) {
  if (!userId || (libCache && libCache.userId === userId)) return;
  void loadLibraryShared(supabase, userId).catch(() => {
    /* pemanasan gagal → tab tetap memuat sendiri saat dibuka */
  });
}
// [perf:preview-cache-v1] cache terpisah untuk mode pratinjau (per siswa) — jangan
// menumpang libCache biar pustaka siswa yang dipratinjau tak bocor ke sesi staf.
let libPreviewCache: { student: string; purchases: Purchase[] } | null = null;

// [preview-session-v1] mode POV siswa: tanpa sesi login, `auth_user_id` mustahil
// dicocokkan dan policy digital_purchases (role authenticated) memblokir semua
// baris → dulu halamannya memantul ke /akun. Di mode ini isinya dari
// /api/preview-library (service role, dikunci cookie pratinjau) & read-only.
export default function LibraryView({ userId, supabase, previewStudentId = null, autoOpenEbookId = null, onAutoOpened }: {
  userId: string; supabase: SupabaseClient; previewStudentId?: string | null;
  /** [lanjutkan-ebook-buka-langsung-v1] purchaseId yang readernya harus langsung dibuka. */
  autoOpenEbookId?: string | null;
  onAutoOpened?: () => void;
}) {
  const t = useT(); // [ui-lang-switcher-v1]
  const preview = !!previewStudentId;
  const pvCached = preview && libPreviewCache?.student === previewStudentId ? libPreviewCache : null;
  const cached = !preview && libCache && libCache.userId === userId ? libCache : null;
  const [purchases, setPurchases] = useState<Purchase[]>(cached?.purchases ?? pvCached?.purchases ?? []);

  // [ebook-reader-cepat-v2] Begitu terlihat siswa punya e-book, bundel pdf.js
  // diunduh saat browser senggang. Dulu unduhan itu baru mulai PADA DETIK
  // tombol Baca ditekan — itulah sebagian besar layar "Menyiapkan modul…".
  useEffect(() => {
    if (purchases.some((p) => p.digital_products?.type === "ebook")) prewarmEbookReader();
  }, [purchases]);
  const [byLang, setByLang] = useState<LangProgress>(cached?.byLang ?? {});
  const [loading, setLoading] = useState(preview ? !pvCached : !cached);
  const [busy, setBusy] = useState<string | null>(null);

  /* [lingbook-rak-buku-tunggal-v1] Rak "Interaktif" (buku contoh CMS: Hajime no
     Ippo, Paso a Paso) DICABUT. Nama "Lingbook" sekarang menunjuk satu barang
     saja — e-book berkas yang benar-benar dibeli siswa. Dua rak yang sama-sama
     mengaku Lingbook cuma bikin siswa mengira modulnya hilang. */
  const [tab, setTab] = useState<"all" | "elearning" | "ebook">("all");
  // [pustaka-filter-edisi-v1] "all" = kedua edisi (plus produk tanpa edisi)
  const [edisi, setEdisi] = useState<"all" | Edisi>("all");
  // [pustaka-filter-lanjutan-v1] versi cetakan · bahasa · level
  const [versi, setVersi] = useState<"all" | "new" | "lama">("all");
  const [bahasa, setBahasa] = useState("all");
  const [level, setLevel] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  // [perpanjang-inplace-v1] popup perpanjang akses — checkout langsung tanpa pindah page
  const [renewFor, setRenewFor] = useState<Purchase | null>(null);
  // [pustaka-katalog-terkunci-v1] katalog produk lain + popup beli
  const [katalog, setKatalog] = useState<CatalogItem[]>(katalogCache ?? []);
  const [buyFor, setBuyFor] = useState<CatalogItem | null>(null);
  // [pustaka-keranjang-v1] keranjang belanja + popupnya. Mode pratinjau staf
  // memakai kunci kosong supaya keranjang siswa asli tak pernah tersentuh.
  const kunciKeranjang = preview ? "" : userId;
  const { items: keranjang, total: totalKeranjang } = useKeranjang(kunciKeranjang);
  const [bukaKeranjang, setBukaKeranjang] = useState(false);
  /* linguo-patch:produk-digital-link-v1 */
  const [playing, setPlaying] = useState<PlayerTarget | null>(null);
  /* produk-digital-per-bahasa-v1 — link materi per bahasa (paket 12+ bahasa) */
  const [prodLangs, setProdLangs] = useState<Record<string, ProductLang[]>>(cached?.prodLangs ?? {});
  const [picking, setPicking] = useState<LangPickerTarget | null>(null);
  /* [ebook-reader-v1] modul yang sedang dibaca (null = reader tertutup) */
  const [reading, setReading] = useState<
    {
      purchaseId: string; title: string; accessToken: string; watermark: string;
      language: string | null;
      /* [ebook-pratinjau-unit1-v1] dipakai tombol "Beli untuk lanjut baca" di
         dalam reader untuk menemukan produk katalognya. */
      productId: string;
    } | null
  >(null);

  /* [pustaka-terakhir-dibuka-v1] Baris "Terakhir dibuka". Jejaknya hidup di
     localStorage, jadi WAJIB dibaca sesudah mount — dibaca saat render, server
     dan klien menghasilkan HTML yang berbeda dan React membuang seluruh pohonnya.
     Dibaca ulang tiap reader ditutup supaya nomor halamannya ikut maju. */
  const [terakhir, setTerakhir] = useState<JejakPustaka[]>([]);
  useEffect(() => { if (!reading) setTerakhir(bacaTerakhirDibuka()); }, [reading]);

  /* bookmarks (localStorage — tanpa ubah skema DB) */
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(BM_KEY) || "[]");
      if (Array.isArray(raw)) setBookmarks(new Set(raw));
    } catch {}
  }, []);
  function toggleBookmark(id: string, title: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast(`Dihapus dari simpanan`); }
      else { next.add(id); toast.success(`Disimpan: ${title}`); }
      try { localStorage.setItem(BM_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  /* fetch */
  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [userId, previewStudentId]);

  /* [pustaka-keranjang-v1] Produk yang sudah lunas rontok dari keranjang. Tanpa
     ini, sepulang dari Xendit barang yang baru dibayar masih nangkring di sana
     dan terbaca seolah pembayarannya gagal. */
  useEffect(() => {
    if (!kunciKeranjang || purchases.length === 0) return;
    sinkronkanKeranjang(kunciKeranjang, new Set(purchases.map((p) => p.digital_products.id)));
  }, [purchases, kunciKeranjang]);

  /* [pustaka-katalog-terkunci-v1] katalog produk aktif — dimuat terpisah dari
     pembelian supaya kegagalannya tak menjatuhkan isi perpustakaan. Baris bahasa
     produk katalog ikut diambil buat menentukan materinya sudah siap atau belum. */
  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await loadKatalog(supabase);
      if (!alive) return;
      setKatalog(rows);
      const langs = await fetchProductLangs(supabase, rows.map((r) => r.id));
      if (!alive) return;
      // Entri milik siswa yang sudah dimuat menang — ini cuma menambal sisanya.
      setProdLangs((prev) => ({ ...langs, ...prev }));
    })();
    return () => { alive = false; };
  }, [supabase]);

  async function fetchAll() {
    // Sesi belum ketahuan → jangan query pakai userId kosong (hasilnya pasti nol
    // dan malah tersimpan di cache modul atas nama user "").
    if (!previewStudentId && !userId) return;
    // [preview-session-v1] pratinjau: satu panggilan server, cache modul sengaja
    // TIDAK disentuh supaya pustaka siswa lain tak bocor ke sesi staf di tab yang sama.
    if (previewStudentId) {
      // spinner cuma saat belum ada cache; kunjungan berikutnya refresh diam-diam
      if (libPreviewCache?.student !== previewStudentId) setLoading(true);
      try {
        const res = await fetch(`/api/preview-library?student=${encodeURIComponent(previewStudentId)}`, { cache: "no-store" });
        const j = res.ok ? await res.json() : null;
        const next = ((j?.purchases ?? []) as unknown) as Purchase[];
        setPurchases(next);
        // baris bahasa boleh dibaca anon (policy dpl_public_read) → pratinjau ikut dapat
        const pvLangs = await fetchProductLangs(supabase, next.map((p) => p.digital_products?.id));
        // [pustaka-katalog-terkunci-v1] gabung, jangan timpa: baris bahasa produk
        // katalog dimuat effect lain dan masih dipakai kartu tergembok.
        setProdLangs((prev) => ({ ...prev, ...pvLangs }));
        if (j) libPreviewCache = { student: previewStudentId, purchases: next };
      } catch {
        setPurchases([]);
      }
      setByLang({});
      setLoading(false);
      return;
    }
    // [perf:pustaka-cache-v1] spinner cuma pas belum ada cache; refresh berikutnya diam-diam
    if (!(libCache && libCache.userId === userId)) setLoading(true);
    // [perf:pustaka-prewarm-v1] query-nya milik modul: kalau pemanasan dari /akun
    // sudah jalan/selesai, di sini tinggal menumpang hasilnya — bukan mulai dari nol.
    const data = await loadLibraryShared(supabase, userId, (early) => {
      setPurchases(early.purchases);
      setByLang(early.byLang);
      setLoading(false);
    });
    if (!data) {
      toast.error("Gagal memuat perpustakaan.");
      if (!libCache || libCache.userId !== userId) setPurchases([]);
      setLoading(false);
      return;
    }
    setPurchases(data.purchases);
    setByLang(data.byLang);
    setProdLangs((prev) => ({ ...prev, ...data.prodLangs }));
    setLoading(false);
  }

  /* [pustaka-keranjang-v1] tambah/keluarkan produk katalog dari keranjang */
  function toggleKeranjang(item: CatalogItem) {
    if (preview) { toast("Mode pratinjau — hanya tampilan."); return; }
    if (keranjang.some((x) => x.productId === item.id)) {
      hapusDariKeranjang(kunciKeranjang, item.id);
      toast(`${judulRingkas(item.title)} dikeluarkan dari keranjang`);
      return;
    }
    const tier = tierDefault(item.pricing);
    if (!tier) { toast.error("Produk ini belum punya paket harga."); return; }
    tambahKeKeranjang(kunciKeranjang, keItemKeranjang(item, tier));
    toast.success(`${judulRingkas(item.title)} masuk keranjang`);
  }

  /* [produk-digital-per-bahasa-v1] buka satu bahasa dari paket */
  function openLang(productTitle: string, l: ProductLang) {
    setPicking(null);
    const url = (l.video_playlist_url ?? "").trim();
    const yt = parseYouTube(url);
    if (yt) { setPlaying({ title: `${productTitle} — ${l.language}`, ref: yt }); return; }
    toast.success(`Membuka materi ${l.language}…`);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  /* open / download */
  async function openProduct(p: Purchase) {
    // [preview-session-v1] pratinjau staf: tampilan saja — membuka produk butuh
    // sesi siswa (signed URL storage + catatan unduhan atas namanya).
    if (preview) { toast("Mode pratinjau — hanya tampilan."); return; }
    const prod = p.digital_products;
    if (accessInfo(p).kind === "expired") { toast.error("Akses produk ini sudah berakhir."); return; }

    // [produk-digital-per-bahasa-v1] Paket multi-bahasa: materinya bukan satu
    // playlist, jadi tanya bahasanya dulu. Kalau barisnya ada tapi belum ada
    // satu pun yang dipasang admin, bilang apa adanya — jangan buka link paket
    // yang sudah tak dipakai lagi.
    const kids = prodLangs[prod.id];
    if (kids && kids.length > 0) {
      const ready = usableLangs(kids);
      if (ready.length === 0) {
        toast.error(`Materi "${prod.title}" belum dipasang linknya oleh admin. Hubungi CS Linguo ya.`);
        return;
      }
      if (ready.length === 1) { openLang(prod.title, ready[0]); return; }
      setPicking({ title: prod.title, langs: ready });
      return;
    }

    // Produk dikirim sebagai LINK (YouTube / Google Drive / dll) → buka langsung.
    const link = externalLinkFor(prod);
    // [bug-fix:placeholder-link-guard-v1] Lebih baik jujur "belum siap" daripada
    // membuka tab yang mendarat di beranda YouTube — itu terbaca sebagai produk
    // rusak, dan siswanya tidak tahu harus menghubungi siapa.
    if (link && isPlaceholderLink(link)) {
      toast.error(`Materi "${prod.title}" belum dipasang linknya oleh admin. Hubungi CS Linguo ya.`);
      return;
    }
    if (link) {
      if (prod.type === "ebook") {
        // catat akses (best-effort, tak memblokir buka link)
        supabase
          .from("digital_purchases")
          .update({ download_count: (p.download_count || 0) + 1, last_downloaded_at: new Date().toISOString() })
          .eq("id", p.id)
          .then(() => setTimeout(fetchAll, 800));
      }
      // [produk-digital-link-v1] YouTube diputar di dalam dashboard; link lain
      // (Drive dsb) tetap dibuka di tab baru seperti sebelumnya.
      const yt = parseYouTube(link);
      if (yt) {
        setPlaying({ title: prod.title, ref: yt });
        return;
      }
      toast.success(`Membuka ${prod.title}…`);
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }

    // [elearning-per-bahasa-v1] E-learning per bahasa terbit tanpa
    // `video_playlist_url` (admin mengisinya belakangan di /produk-digital).
    // Dulu tombolnya selalu melempar ke "/akun?menu=materi" polos — mendaratnya
    // di sub-tab Kelas Live, jadi dari sisi siswa tombolnya terbaca seolah tidak
    // melakukan apa-apa ("e-learning-nya belum kebuka"). Sekarang: kalau modul
    // LMS bahasa itu sudah berisi, buka pelajarannya langsung; kalau tidak ada
    // apa pun yang bisa dibuka, katakan apa adanya alih-alih pindah halaman.
    if (prod.type === "elearning") {
      const pr = progFor(p, byLang);
      if (pr?.resume) {
        toast("Membuka materi belajar…");
        window.location.href = `/akun?menu=materi&sesi=${pr.resume.id}`;
        return;
      }
      toast.error(`Materi "${prod.title}" belum dipasang linknya oleh admin. Hubungi CS Linguo ya.`);
      return;
    }

    // [ebook-reader-v1] e-book berkas → dibaca di dalam dashboard.
    // Dulu di sini dibuatkan signed URL 7 hari lalu dibuka di tab baru; URL itu
    // sampai ke browser apa adanya dan berlaku untuk siapa saja yang memegangnya.
    // Sekarang byte PDF-nya diambil route /api/ebook yang memverifikasi ulang
    // kepemilikan tiap kali, dan halamannya diberi cap nama pembeli.
    if (!isStoragePath(prod.file_url)) { toast.error("File e-book belum tersedia."); return; }
    // [ebook-reader-layar-penuh-v1] Diminta DI SINI, bukan di dalam reader:
    // izin layar penuh menempel pada klik ini, dan `await getSession()` di bawah
    // bisa memutus aktivasinya di browser yang ketat (Safari).
    void mintaLayarPenuh();
    setBusy(p.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { toast.error("Sesi kamu sudah habis. Masuk ulang ya."); return; }
      const u = session.user;
      const nama = (u.user_metadata?.full_name as string)
        || (u.user_metadata?.name as string)
        || (u.email?.split("@")[0] ?? "Siswa Linguo");
      setReading({
        purchaseId: p.id,
        productId: prod.id,
        title: prod.title,
        accessToken: session.access_token,
        watermark: `${nama} · ${u.email ?? ""}`.trim(),
        // [ebook-tts-ketuk-kata-v1] bahasa modul → suara Chirp yang dipakai
        language: prod.language ?? null,
      });
      // Hitungan akses dicatat route-nya; segarkan sebentar lagi biar angkanya ikut.
      setTimeout(fetchAll, 1500);
    } catch {
      toast.error("Terjadi kesalahan saat membuka e-book.");
    } finally {
      setBusy(null);
    }
  }

  /* [ebook-pratinjau-unit1-v1] "Coba gratis" di kartu tergembok: terbitkan baris
     cicip lalu LANGSUNG buka readernya. Menyuruh orang mencari sendiri modulnya
     di rak sesudah klik itu satu langkah mundur — yang dia mau adalah membaca,
     bukan menambah koleksi. */
  const [cobaBusy, setCobaBusy] = useState<string | null>(null);
  async function cobaGratis(item: CatalogItem) {
    if (preview) { toast("Mode pratinjau — hanya tampilan."); return; }
    setCobaBusy(item.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { toast.error("Sesi kamu sudah habis. Masuk ulang ya."); return; }
      const res = await fetch("/api/ebook/pratinjau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: session.access_token, productId: item.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Gagal membuka pratinjau.");
      // Baris barunya belum ada di state; readernya dibuka dari data yang sudah
      // di tangan (produk katalog + id baris yang baru terbit), dan rak
      // menyusul di belakang layar.
      libCache = null;
      void openProduct({
        id: String(j.purchase_id),
        payment_status: "Lunas",
        access_granted: true,
        expires_at: j.expires_at ?? null,
        download_count: 0,
        created_at: new Date().toISOString(),
        source: "preview",
        digital_products: item,
        digital_product_pricing: null,
      });
      toast.success(j.sudahPunya ? "Modul ini sudah jadi milikmu." : "Pratinjau Unit 1 terbuka — selamat mencoba!");
      setTimeout(fetchAll, 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuka pratinjau.");
    } finally {
      setCobaBusy(null);
    }
  }

  /* [lanjutkan-ebook-buka-langsung-v1] Kartu "Lanjutkan Belajar" di beranda
     menunjuk SATU modul; mendaratkan siswa di daftar Perpustakaan lalu menyuruh
     dia mencarinya lagi itu langkah mundur. Beranda mengoper purchaseId-nya dan
     readernya dibuka sendiri begitu daftar belian selesai dimuat. Sekali saja —
     menutup reader tidak boleh membukanya kembali. */
  const autoDibuka = useRef<string | null>(null);
  useEffect(() => {
    if (!autoOpenEbookId || loading) return;
    if (autoDibuka.current === autoOpenEbookId) return;
    const target = purchases.find((x) => x.id === autoOpenEbookId);
    if (!target) return;
    autoDibuka.current = autoOpenEbookId;
    onAutoOpened?.();
    void openProduct(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenEbookId, purchases, loading]);

  /* [ebook-buka-instan-v1] Byte modul mulai diunduh begitu kursor/jari
     menyentuh kartunya. Waktu tombol Baca benar-benar ditekan, isinya biasanya
     sudah utuh di memori — readernya terbuka tanpa layar "Menyiapkan modul…".
     Tokennya diambil sekali lalu ditahan: getSession() dipanggil tiap kartu
     yang dilewati kursor itu boros. */
  const tokenRef = useRef<string | null>(null);
  const panaskanEbook = useCallback((p: Purchase) => {
    const prod = p.digital_products;
    if (preview || prod?.type !== "ebook") return;
    if (externalLinkFor(prod) || !isStoragePath(prod.file_url)) return;
    void (async () => {
      if (!tokenRef.current) {
        const { data: { session } } = await supabase.auth.getSession();
        tokenRef.current = session?.access_token ?? null;
      }
      if (tokenRef.current) prewarmEbookModul(p.id, tokenRef.current);
    })();
  }, [preview, supabase]);

  /* Modul yang paling baru dibeli dipanaskan sendiri waktu browser senggang —
     di HP tak ada "kursor lewat" yang bisa dijadikan aba-aba, dan satu ketukan
     terlalu pendek untuk mengunduh 1 MB. Cukup SATU modul. */
  useEffect(() => {
    const ebook = purchases.find((p) => p.digital_products?.type === "ebook"
      && !externalLinkFor(p.digital_products) && isStoragePath(p.digital_products.file_url));
    if (!ebook) return;
    const w = window as any;
    const jalan = () => panaskanEbook(ebook);
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(jalan, { timeout: 6000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(jalan, 2500);
    return () => window.clearTimeout(id);
  }, [purchases, panaskanEbook]);

  /* derived */
  const stats = useMemo(() => {
    let running = 0, certs = 0;
    for (const p of purchases) {
      const pr = progFor(p, byLang);
      if (pr && pr.pct > 0 && pr.pct < 100) running++;
      if (pr && pr.pct >= 100) certs++;
    }
    return { total: purchases.length, running, certs };
  }, [purchases, byLang]);

  // [pustaka-filter-lanjutan-v1] SATU predikat dipakai bertiga (angka di tab,
  // kartu milik siswa, kartu tergembok) — kalau dipisah, angka tab gampang
  // berbohong seperti dulu waktu saringan edisi belum ikut dihitung.
  const cocokSaring = useCallback((p: DProduct) => {
    if (edisi !== "all" && edisiProduk(p) !== edisi) return false;
    if (versi !== "all" && (versi === "new") !== adalahNewEdition(p)) return false;
    if (bahasa !== "all" && (p.language ?? "").trim().toLowerCase() !== bahasa) return false;
    if (level !== "all" && (p.level ?? "").trim() !== level) return false;
    return true;
  }, [edisi, versi, bahasa, level]);

  // Pilihan bahasa & level dibangun dari katalog yang benar-benar ada, bukan dari
  // daftar hardcode — kalau modul baru terbit, saringannya ikut tanpa disentuh.
  const opsiBahasa = useMemo(() => {
    const m = new Map<string, string>();
    const tambah = (p?: DProduct | null) => {
      const v = p?.language?.trim();
      if (v) m.set(v.toLowerCase(), labelBahasa(v));
    };
    purchases.forEach((p) => tambah(p.digital_products));
    katalog.forEach((k) => tambah(k));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1], "id"));
  }, [purchases, katalog]);

  const opsiLevel = useMemo(() => {
    const set = new Set<string>();
    const tambah = (p?: DProduct | null) => {
      const v = p?.level?.trim();
      if (v) set.add(v);
    };
    purchases.forEach((p) => tambah(p.digital_products));
    katalog.forEach((k) => tambah(k));
    return [...set].sort(urutLevel);
  }, [purchases, katalog]);

  const adaSaringan = edisi !== "all" || versi !== "all" || bahasa !== "all" || level !== "all";
  const resetSaringan = () => { setEdisi("all"); setVersi("all"); setBahasa("all"); setLevel("all"); };

  // [pustaka-tab-hitung-katalog-v1] Angka di tab dulu cuma menghitung produk yang
  // SUDAH dibeli, jadi selalu "0" padahal daftar di bawahnya berisi 47 produk
  // tergembok. Sekarang angkanya = jumlah kartu yang benar-benar muncul di tab itu
  // (milik siswa + katalog yang belum dimiliki).
  const counts = useMemo(() => {
    const punya = new Set(purchases.map((p) => p.digital_products?.id).filter(Boolean));
    // [pustaka-filter-edisi-v1] angka ikut saringan edisi yang sedang aktif —
    // kalau tidak, tabnya menjanjikan 47 produk padahal daftarnya cuma 20.
    const milik = purchases.filter((p) => cocokSaring(p.digital_products));
    const belum = katalog.filter((k) => !punya.has(k.id) && cocokSaring(k));
    const hitung = (tipe: ProductType) =>
      milik.filter((p) => p.digital_products.type === tipe).length +
      belum.filter((k) => k.type === tipe).length;
    return {
      all: milik.length + belum.length,
      elearning: hitung("elearning"),
      ebook: hitung("ebook"),
    };
  }, [purchases, katalog, cocokSaring]);

  const hero = useMemo(() => {
    for (const p of purchases) {
      const pr = progFor(p, byLang);
      if (pr && pr.pct > 0 && pr.pct < 100) return { p, pr };
    }
    return null;
  }, [purchases, byLang]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return purchases.filter((p) => {
      if (tab !== "all" && p.digital_products.type !== tab) return false;
      if (!cocokSaring(p.digital_products)) return false;
      if (needle && !p.digital_products.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [purchases, tab, cocokSaring, q]);

  // [pustaka-katalog-terkunci-v1] produk yang belum dimiliki → kartu tergembok.
  // Saring ikut tab & pencarian yang sama supaya terasa satu daftar.
  const terkunci = useMemo(() => {
    const punya = new Set(purchases.map((p) => p.digital_products?.id).filter(Boolean));
    const needle = q.trim().toLowerCase();
    return katalog.filter((k) => {
      if (punya.has(k.id)) return false;
      if (tab !== "all" && k.type !== tab) return false;
      if (!cocokSaring(k)) return false;
      if (needle && !k.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [katalog, purchases, tab, cocokSaring, q]);

  /* [pustaka-terakhir-dibuka-v1] Jejak dipasangkan dengan baris beliannya, karena
     yang dibutuhkan tombolnya (token akses, file_url, sampul produk) cuma ada di
     sana. Jejak tanpa pasangan DIBUANG diam-diam: modul yang aksesnya sudah habis
     atau pembeliannya diarsipkan admin tak bisa dibuka lagi, dan kartu yang
     diklik lalu menolak membuka lebih buruk daripada kartu yang tak ada.

     Judul & sampulnya sengaja diambil dari produk, bukan dari salinan di jejak —
     modul yang dirakit ulang berganti sampul dan kadang berganti judul, dan kartu
     yang memakai salinannya sendiri akan memperlihatkan versi lama. Salinan di
     jejak cuma dipakai sebagai cadangan terakhir. */
  const terakhirKartu = useMemo(
    () => terakhir
      .map((j) => ({ j, p: purchases.find((x) => x.id === j.purchaseId) }))
      .filter((x): x is { j: JejakPustaka; p: Purchase } =>
        !!x.p && x.p.digital_products?.type === "ebook" && accessInfo(x.p).kind !== "expired"),
    [terakhir, purchases],
  );

  /* ---------------- render ---------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* ===== HEADER ===== */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
            <span>{t("Dashboard")}</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-[#12A37E]">{t("Perpustakaan Saya")}</span>
          </p>
          <h1 className="mt-1 text-[28px] font-extrabold leading-tight text-[#12172B] sm:text-[32px]">
            {t("Perpustakaan Saya")}
          </h1>
          <p className="mt-1 text-[14px] font-medium text-slate-500">
            {t("Lingbook & E-Learning yang sudah kamu beli · buka kapan saja")}
          </p>

          {/* stats chips */}
          <div className="mt-4 flex flex-wrap gap-2.5">
            <StatChip icon={<BookOpen className="h-4 w-4" strokeWidth={2.2} />} label={`${stats.total} ${t("produk")}`} />
            <StatChip icon={<Flame className="h-4 w-4 text-[#12A37E]" strokeWidth={2.2} />} label={`${stats.running} ${t("sedang berjalan")}`} />
            <StatChip icon={<GraduationCap className="h-4 w-4" strokeWidth={2.2} />} label={`${stats.certs} ${t("sertifikat")}`} />
          </div>
        </div>

        {/* bookmark counter */}
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#12A37E] shadow-sm">
            <Bookmark className="h-5 w-5" strokeWidth={2.2} fill={bookmarks.size ? "currentColor" : "none"} />
          </div>
          {bookmarks.size > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#12A37E] px-1 text-[11px] font-bold text-white">
              {bookmarks.size}
            </span>
          )}
        </div>
      </header>

      {/* ===== CONTINUE HERO ===== */}
      {hero && (
        <section className="overflow-hidden rounded-3xl border border-[#12A37E]/15 bg-[#12A37E]/[0.04] p-4 sm:p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* cover */}
            <button
              onClick={() => openProduct(hero.p)}
              className="group relative h-[150px] w-full shrink-0 overflow-hidden rounded-2xl sm:h-[170px] sm:w-[200px]"
              style={{ background: gradFor(hero.p.digital_products.id) }}
            >
              <span className="absolute -bottom-3 right-2 text-[88px] font-black leading-none text-white/15">
                {glyphFor(hero.p.digital_products)}
              </span>
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#0C8163] shadow-lg transition group-hover:scale-105">
                  <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
                </span>
              </span>
            </button>

            {/* body */}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide text-[#0C8163]">
                <Flame className="h-4 w-4" strokeWidth={2.4} /> Lanjutkan belajar
              </p>
              <h2 className="mt-1 truncate text-[22px] font-extrabold text-[#12172B] sm:text-[26px]">
                {hero.p.digital_products.title}
              </h2>
              <p className="mt-0.5 text-[14px] font-medium text-slate-500">
                Pelajaran {hero.pr.nextIndex}
                {hero.pr.resume ? ` · ${hero.pr.resume.title}` : ""}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1"><ProgressBar pct={hero.pr.pct} /></div>
                <span className="shrink-0 text-[13px] font-bold text-slate-500">
                  {hero.pr.pct}% · {hero.pr.done}/{hero.pr.total} pelajaran
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => openProduct(hero.p)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#12A37E] px-5 py-3 text-[14px] font-bold text-white shadow-sm transition hover:bg-[#0C8163] active:scale-[0.98]"
                >
                  <Play className="h-4 w-4" fill="currentColor" /> Lanjut Nonton
                </button>
                <AccessChip a={accessInfo(hero.p)} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== [pustaka-terakhir-dibuka-v1] TERAKHIR DIBUKA =====
          Baris pintas ke modul yang sedang dibaca, kembar dengan baris yang sama
          di Perpustakaan dashboard pengajar. Yang membuatnya hemat waktu bukan
          cuma tempatnya di paling atas, tapi nomor halamannya: satu ketukan
          mendarat kembali di unit yang kemarin dibaca — readernya sendiri yang
          memulihkan posisi dari jejak yang sama. */}
      {terakhirKartu.length > 0 && (
        <section className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-[18px] w-[18px] text-[#12A37E]" strokeWidth={2.4} />
            <h2 className="text-[15px] font-extrabold text-[#12172B]">{t("Terakhir dibuka")}</h2>
            <button
              type="button"
              onClick={() => setTerakhir(hapusTerakhirDibuka())}
              className="ml-auto text-[12px] font-bold text-slate-400 transition hover:text-slate-600"
            >
              {t("Bersihkan")}
            </button>
          </div>

          {/* Digulir mendatar di layar sempit — kartunya sengaja tak dibungkus ke
              baris berikutnya supaya blok ini tak pernah menelan tinggi rak di bawahnya. */}
          <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
            {terakhirKartu.map(({ j, p: pur }) => {
              const prod = pur.digital_products;
              const sampul = j.sampul || fotoSampul(prod);
              return (
                <div
                  key={pur.id}
                  className="group relative flex w-[240px] shrink-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 text-left transition hover:border-[#12A37E]/40 hover:shadow-sm"
                  onPointerEnter={() => panaskanEbook(pur)}
                  onTouchStart={() => panaskanEbook(pur)}
                >
                  <button
                    type="button"
                    onClick={() => openProduct(pur)}
                    disabled={busy === pur.id}
                    title={`${prod.title} — ${t("halaman")} ${j.hal}`}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-wait"
                  >
                    <span
                      className="relative block h-[58px] w-[42px] shrink-0 overflow-hidden rounded-lg bg-slate-100"
                      style={sampul ? undefined : { background: gradFor(prod.id) }}
                    >
                      {sampul ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={sampul} alt="" loading="lazy" className={`h-full w-full object-cover${jangkarSampul(prod)}`} />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center text-[13px] font-black text-white/80">
                          {glyphFor(prod)}
                        </span>
                      )}
                      {busy === pur.id && (
                        <span className="absolute inset-0 grid place-items-center bg-black/40">
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                        </span>
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <TitleFlag language={prod.language} h={11} />
                        <span className="truncate text-[12.5px] font-extrabold leading-snug text-[#12172B]">
                          {judulRingkas(prod.title || j.title || "")}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-[11.5px] font-bold text-slate-400">
                        <span className="text-[#12A37E]">{t("Hal.")} {j.hal}</span>
                        {j.total > 0 ? ` / ${j.total}` : ""}
                      </span>
                    </span>
                  </button>

                  {/* Tombolnya cuma muncul waktu ditunjuk; di layar sentuh (tak ada
                      hover) ia selalu tampak — di sana tak ada cara lain membuang
                      satu kartu. */}
                  <button
                    type="button"
                    onClick={() => setTerakhir(hapusTerakhirDibuka(pur.id))}
                    aria-label={t("Hapus dari daftar")}
                    title={t("Hapus dari daftar")}
                    className="absolute right-1 top-1 rounded-md p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.6} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== CONTROLS ===== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
          {(
            [
              ["all", "Semua"],
              ["elearning", "E-Learning"],
              ["ebook", "Lingbook"],
            ] as readonly (readonly [typeof tab, string])[]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-bold transition ${
                tab === k ? "bg-white text-[#12172B] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t(label)}
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${tab === k ? "bg-[#12A37E]/10 text-[#0C8163]" : "bg-slate-200 text-slate-500"}`}>
                {counts[k]}
              </span>
            </button>
          ))}
        </div>

        {/* [pustaka-filter-edisi-v1] edisi bahasa pengantar — tiap modul terbit
            dalam dua versi, tanpa saringan ini daftarnya terbaca dobel semua. */}
        <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
          {([["all", "Semua edisi"], ["id", "Indonesia"], ["en", "English"]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setEdisi(k)}
              className={`rounded-xl px-3 py-2 text-[13px] font-bold transition ${
                edisi === k ? "bg-white text-[#12172B] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t(label)}
            </button>
          ))}
        </div>

        {/* [pustaka-filter-lanjutan-v1] versi cetakan — modul "new edition" adalah
            tulisan ulang 20 unit; siswa yang punya edisi lama datang ke sini justru
            untuk mencari yang baru. */}
        <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
          {([["all", "Semua versi"], ["new", "New edition"], ["lama", "Edisi lama"]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setVersi(k)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-bold transition ${
                versi === k ? "bg-white text-[#12172B] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {k === "new" && <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />}
              {t(label)}
            </button>
          ))}
        </div>

        {/* Bahasa & level: daftarnya puluhan, jadi dropdown — bukan deretan chip
            yang memakan tiga baris di layar HP. */}
        <select
          value={bahasa}
          onChange={(e) => setBahasa(e.target.value)}
          aria-label={t("Saring bahasa")}
          className={`rounded-2xl border px-3 py-2.5 text-[13px] font-bold outline-none transition ${
            bahasa === "all" ? "border-slate-200 bg-white text-slate-500" : "border-[#12A37E]/40 bg-[#12A37E]/10 text-[#0C8163]"
          }`}
        >
          <option value="all">{t("Semua bahasa")}</option>
          {opsiBahasa.map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>

        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          aria-label={t("Saring level")}
          className={`rounded-2xl border px-3 py-2.5 text-[13px] font-bold outline-none transition ${
            level === "all" ? "border-slate-200 bg-white text-slate-500" : "border-[#12A37E]/40 bg-[#12A37E]/10 text-[#0C8163]"
          }`}
        >
          <option value="all">{t("Semua level")}</option>
          {opsiLevel.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        {adaSaringan && (
          <button
            type="button"
            onClick={resetSaringan}
            className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-[13px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-[#12172B]"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.6} /> {t("Reset filter")}
          </button>
        )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-[280px] sm:flex-none">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("Cari produk…")}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-[14px] font-medium text-[#12172B] outline-none transition placeholder:text-slate-400 focus:border-slate-300"
            />
            {/* [pustaka-cari-hapus-v1] Tombol hapus teks — dulu satu-satunya cara balik ke
                daftar penuh itu menghapus ketikannya satu per satu (di HP tak ada tombol
                silang bawaan seperti input[type=search] di desktop). */}
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label={t("Hapus pencarian")}
                title={t("Hapus pencarian")}
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-[#12172B]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.6} />
              </button>
            )}
          </div>
          <div className="hidden items-center gap-1 rounded-2xl bg-slate-100 p-1 sm:flex">
            <button onClick={() => setView("grid")} aria-label="Grid" className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${view === "grid" ? "bg-white text-[#12172B] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
              <LayoutGrid className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <button onClick={() => setView("list")} aria-label="List" className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${view === "list" ? "bg-white text-[#12172B] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
              <List className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== EMPTY ===== */}
      {purchases.length === 0 && terkunci.length === 0 ? (
        <EmptyState />
      ) : shown.length === 0 ? (
        /* [pustaka-katalog-terkunci-v1] tanpa produk yang cocok, seksi terkunci
           di bawah yang jadi isinya — jangan bilang "tidak ada" kalau ada. */
        terkunci.length === 0 ? (
          <div className="rounded-3xl bg-white py-16 text-center">
            <p className="text-[14px] font-semibold text-slate-500">{t("Tidak ada produk yang cocok.")}</p>
          </div>
        ) : null
      ) : view === "grid" ? (
        <div /* [pustaka-rak-7-kolom-v1] rak lebih rapat: 7 sampul/baris di layar lebar (dulu mentok 5–6) */ className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-7">
          {shown.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              prog={progFor(p, byLang)}
              langCount={usableLangs(prodLangs[p.digital_products.id]).length}
              /* [materi-belum-siap-v1] katakan di muka, jangan tunggu diklik */
              ready={siapDibuka(p.digital_products, prodLangs[p.digital_products.id], byLang)}
              busy={busy === p.id}
              bookmarked={bookmarks.has(p.digital_products.id)}
              onToggleBookmark={() => toggleBookmark(p.digital_products.id, p.digital_products.title)}
              onOpen={() => openProduct(p)}
              onPrefetch={() => panaskanEbook(p)}
              onRenew={() => (preview ? toast("Mode pratinjau — hanya tampilan.") : setRenewFor(p))}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((p) => (
            <ProductRow
              key={p.id}
              p={p}
              prog={progFor(p, byLang)}
              langCount={usableLangs(prodLangs[p.digital_products.id]).length}
              /* [materi-belum-siap-v1] katakan di muka, jangan tunggu diklik */
              ready={siapDibuka(p.digital_products, prodLangs[p.digital_products.id], byLang)}
              busy={busy === p.id}
              bookmarked={bookmarks.has(p.digital_products.id)}
              onToggleBookmark={() => toggleBookmark(p.digital_products.id, p.digital_products.title)}
              onOpen={() => openProduct(p)}
              onPrefetch={() => panaskanEbook(p)}
              onRenew={() => (preview ? toast("Mode pratinjau — hanya tampilan.") : setRenewFor(p))}
            />
          ))}
        </div>
      )}

      {/* ===== [pustaka-katalog-terkunci-v1] KATALOG TERGEMBOK ===== */}
      {terkunci.length > 0 && (
        <section className="space-y-4 pt-2">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-[19px] font-extrabold text-[#12172B]">
                <Lock className="h-[18px] w-[18px] text-slate-400" strokeWidth={2.4} />
                {t("Belum kamu miliki")}
              </h2>
              <p className="mt-0.5 text-[13.5px] font-medium text-slate-500">
                {t("Klik salah satu untuk membeli — bayar sekali, akses langsung terbuka di sini.")}
              </p>
            </div>
            <span className="hidden shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-bold text-slate-500 sm:inline">
              {terkunci.length} {t("produk")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-7">
            {terkunci.map((k) => (
              <LockedCard
                key={k.id}
                item={k}
                /* [materi-belum-siap-v1] jangan jual yang materinya belum dipasang */
                ready={materialReady(k, prodLangs[k.id])}
                onBuy={() => (preview ? toast("Mode pratinjau — hanya tampilan.") : setBuyFor(k))}
                diKeranjang={keranjang.some((x) => x.productId === k.id)}
                onKeranjang={() => toggleKeranjang(k)}
                /* [ebook-pratinjau-unit1-v1] cuma Lingbook: e-learning tak punya
                   "unit 1" yang bisa dipagari. */
                onCoba={k.type === "ebook" ? () => cobaGratis(k) : undefined}
                cobaBusy={cobaBusy === k.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* [pustaka-keranjang-v1] Bilah keranjang — melayang di bawah supaya tetap
          terlihat sambil menggulir katalog. Disembunyikan saat popupnya terbuka
          biar tak bertumpuk dengan tombol Bayar di dalamnya. */}
      {keranjang.length > 0 && !bukaKeranjang && !preview && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] sm:pb-6">
          <button
            onClick={() => setBukaKeranjang(true)}
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-[#12172B] px-4 py-3 text-white shadow-2xl transition hover:bg-[#1c2340] active:scale-[0.99]"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2.4} />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#12A37E] px-1 text-[11px] font-extrabold">
                {keranjang.length}
              </span>
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[13.5px] font-bold leading-tight">
                {keranjang.length} produk di keranjang
              </span>
              <span className="block text-[12px] font-medium text-white/60">Bayar sekali untuk semuanya</span>
            </span>
            <span className="shrink-0 text-[15px] font-extrabold">{fmtRupiah(totalKeranjang)}</span>
            <ChevronRight className="h-5 w-5 shrink-0 text-white/70" strokeWidth={2.4} />
          </button>
        </div>
      )}

      {/* [pustaka-keranjang-v1] popup rincian + checkout satu invoice */}
      {bukaKeranjang && (
        <CartModal
          items={keranjang}
          supabase={supabase}
          onClose={() => setBukaKeranjang(false)}
          onHapus={(id) => hapusDariKeranjang(kunciKeranjang, id)}
          onKosongkan={() => kosongkanKeranjang(kunciKeranjang)}
        />
      )}

      {/* [perpanjang-inplace-v1] popup perpanjang akses */}
      {renewFor && (
        <RenewModal purchase={renewFor} supabase={supabase} onClose={() => setRenewFor(null)} />
      )}

      {/* [pustaka-katalog-terkunci-v1] popup beli produk katalog */}
      {buyFor && (
        <BuyModal
          item={buyFor}
          supabase={supabase}
          onClose={() => setBuyFor(null)}
          /* [pustaka-promo-kode-v1] cache modul dibuang dulu — tanpa itu kartu
             hasil klaim baru muncul sesudah halaman dimuat ulang. */
          onClaimed={() => { libCache = null; fetchAll(); }}
          diKeranjang={keranjang.some((x) => x.productId === buyFor.id)}
          onKeranjang={(tier) => {
            tambahKeKeranjang(kunciKeranjang, keItemKeranjang(buyFor, tier));
            toast.success(`${judulRingkas(buyFor.title)} masuk keranjang`);
          }}
        />
      )}

      {/* [produk-digital-per-bahasa-v1] paket multi-bahasa: pilih bahasa dulu */}
      <LangMateriPicker
        target={picking}
        onPick={(l) => openLang(picking?.title ?? "", l)}
        onClose={() => setPicking(null)}
      />

      {/* [produk-digital-link-v1] pemutar YouTube in-place */}
      <YouTubePlayerModal target={playing} onClose={() => setPlaying(null)} />

      {/* [ebook-reader-v1] pembaca modul */}
      {reading && (
        <EbookReader
          purchaseId={reading.purchaseId}
          title={reading.title}
          accessToken={reading.accessToken}
          watermark={reading.watermark}
          language={reading.language}
          /* [ebook-pratinjau-unit1-v1] Gembok di halaman berbayar → popup beli
             yang sama dengan katalog. Readernya ditutup dulu: popupnya digambar
             di bawah lapisan reader (z-[100] vs reader yang layar penuh), jadi
             kalau readernya dibiarkan terbuka tombolnya seolah tak berfungsi. */
          onBeli={() => {
            const k = katalog.find((x) => x.id === reading.productId);
            setReading(null);
            if (k) setBuyFor(k);
            else window.open("/toko", "_blank", "noopener,noreferrer");
          }}
          onClose={() => setReading(null)}
        />
      )}
    </div>
  );
}

/* ---------------- sub-components ---------------- */
function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-slate-600">
      {icon}
      {label}
    </span>
  );
}

// [pustaka-rak-sampul-v1] Rak buku: kartu Perpustakaan sekarang SAMPUL saja.
//
// Kartu lama itu kotak lanskap 16:10 + badan teks (tanggal beli, jumlah halaman,
// chip akses, tombol) — empat baris tulisan untuk tiap produk. Dengan 40+ modul di
// rak, layarnya terbaca seperti tabel, bukan perpustakaan; dan sampul e-book yang
// digambar potret 1:√2 dipotong jadi seliweran gambar tanpa judul.
//
// Sekarang kotaknya PERSIS seperti sampul aslinya (1:√2), jadi tidak ada yang
// terpotong, dan seluruh keterangan yang tidak dipakai sekilas (tanggal beli,
// chip "Selamanya", tombol) dipindah: yang mendesak saja — sisa hari, materi
// belum siap, akses berakhir — tampil sebagai satu baris kecil di bawah judul.
// Rinciannya masih utuh di tampilan Daftar (tombol list di kanan atas).
function ShelfCover({
  p, prog, locked = false, dim = false,
}: { p: DProduct; prog?: Prog | null; locked?: boolean; dim?: boolean }) {
  const foto = fotoSampul(p); // [pustaka-kartu-foto-v1]
  const pct = prog && prog.pct > 0 && prog.pct < 100 ? prog.pct : 0;
  return (
    <div
      className={`relative aspect-[1/1.414] w-full overflow-hidden rounded-xl shadow-[0_14px_30px_-16px_rgba(18,23,43,0.6)] ring-1 ring-black/[0.06] ${dim ? "saturate-[0.55]" : ""}`}
      style={{ background: gradFor(p.id) }}
    >
      {foto ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto}
            alt={p.title}
            className={`absolute inset-0 h-full w-full object-cover${jangkarSampul(p)}`}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </>
      ) : (
        /* tanpa berkas sampul: gambar sampul tiruan — glyph bahasa + judul ringkas,
           supaya rak tetap terbaca sebagai deretan buku, bukan kotak warna kosong. */
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
          <span className="text-[38px] font-black leading-none text-white/90">{glyphFor(p)}</span>
          <span className="line-clamp-3 text-[11px] font-bold uppercase leading-snug tracking-wide text-white/75">
            {judulRingkas(p.title)}
          </span>
        </span>
      )}

      {/* punggung buku + kilau tepi: bikin sampul datar terbaca sebagai benda */}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-[9px] bg-gradient-to-r from-black/40 via-black/12 to-transparent" />
      <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />

      {locked && <span className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1.5px]" />}

      {/* progres e-learning: garis tipis di kaki sampul, bukan bilah + angka di badan kartu */}
      {pct > 0 && (
        <span className="absolute inset-x-0 bottom-0 h-[5px] bg-black/25">
          <span
            className="block h-full transition-all"
            style={{ width: `${Math.max(pct, 4)}%`, background: "linear-gradient(90deg,#1FA98A,#0C8163)" }}
          />
        </span>
      )}
    </div>
  );
}

// ikon jenis produk di pojok sampul — versi ringkas TypeBadge (tanpa teks) supaya
// rak tidak penuh label; judul lengkapnya tetap ada di atribut title.
function TypeDot({ type }: { type: ProductType }) {
  const Icon = type === "ebook" ? BookOpen : Film;
  const nama = type === "ebook" ? "Lingbook" : "E-Learning";
  return (
    <span
      title={nama}
      aria-label={nama}
      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-[#12172B] shadow-sm"
    >
      <Icon className="h-[15px] w-[15px]" strokeWidth={2.4} />
    </span>
  );
}

function ProductCard({
  p, prog, busy, bookmarked, langCount = 0, ready = true, onToggleBookmark, onOpen, onRenew, onPrefetch,
}: {
  p: Purchase; prog: Prog | null; busy: boolean; bookmarked: boolean; langCount?: number;
  /** [materi-belum-siap-v1] false = link materinya belum dipasang admin. */
  ready?: boolean;
  onToggleBookmark: () => void; onOpen: () => void; onRenew: () => void;
  /* [ebook-buka-instan-v1] kursor/jari menyentuh kartu → modulnya mulai diunduh */
  onPrefetch?: () => void;
}) {
  const prod = p.digital_products;
  const a = accessInfo(p);
  const expired = a.kind === "expired";
  /* [elearning-per-bahasa-v1] Paket 12+ bahasa berhenti dijual: kartunya tetap
     ada supaya pembeli lama melihat riwayat & sisa aksesnya, tapi "Perpanjang"
     dicabut — tombol itu menerbitkan pembelian BARU atas produk yang sudah
     tidak ditawarkan lagi. Yang masanya habis berhenti di chip "Akses Berakhir". */
  const bolehPerpanjang = masihDijual(prod.slug);
  const isExternal = !!externalLinkFor(prod);
  const verb = accessVerb(prod);
  const label = prod.type === "elearning" && prog && prog.pct > 0 ? "Lanjut" : verb;
  // [ebook-reader-v1] berkas e-book dibaca di dashboard → ikon buku, bukan panah unduh
  // [ikon-fill-none-v1] `fill` WAJIB "none", jangan undefined: undefined MENGHAPUS atribut
  // fill bawaan lucide, dan SVG tanpa fill jatuh ke hitam — ikonnya jadi kotak hitam pekat
  // di tengah tombol teal.
  const BtnIcon = prod.type === "ebook" && !isExternal ? BookOpen : verb === "Buka" ? ExternalLink : Play;

  const meta =
    prod.type === "ebook"
      ? (prod.pages ? `${prod.pages} halaman` : "Lingbook")
      : langCount > 1
        ? `${langCount} bahasa`
        : prog
          ? `${prog.total} pelajaran`
          : prod.modules_count
            ? `${prod.modules_count} modul`
            : "Materi video";

  return (
    <div onPointerEnter={onPrefetch} onTouchStart={onPrefetch} className="group">
      <div className="relative">
        <button
          onClick={onOpen}
          disabled={expired || busy}
          className={`block w-full text-left transition duration-300 disabled:cursor-not-allowed ${expired ? "opacity-70" : "group-hover:-translate-y-1.5"}`}
        >
          <ShelfCover p={prod} prog={prog} dim={expired} />

          {/* aksi tampil saat kursor di atas sampul; di HP sampulnya tinggal disentuh */}
          {!expired && (
            <span className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-xl bg-gradient-to-t from-black/55 via-transparent to-transparent pb-3 opacity-0 transition duration-300 group-hover:opacity-100">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#12A37E] px-3.5 py-2 text-[12px] font-bold text-white shadow-lg">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BtnIcon className="h-3.5 w-3.5" fill={BtnIcon === Play ? "currentColor" : "none"} />}
                {ready ? label : "Belum siap"}
              </span>
            </span>
          )}
        </button>

        <span className="pointer-events-none absolute left-2 top-2 transition duration-300 group-hover:-translate-y-1.5">
          <TypeDot type={prod.type} />
        </span>

        {/* penanda: selalu kelihatan di HP, muncul saat hover di layar lebar */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
          aria-label={bookmarked ? "Hapus penanda" : "Tandai"}
          title={bookmarked ? "Hapus penanda" : "Tandai"}
          className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-[#12A37E] shadow-sm transition duration-300 hover:scale-105 group-hover:-translate-y-1.5 ${
            bookmarked ? "" : "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          }`}
        >
          {bookmarked ? <BookmarkCheck className="h-4 w-4" fill="currentColor" /> : <Bookmark className="h-4 w-4" />}
        </button>
      </div>

      {/* judul di bawah sampul — satu baris, judul panjang dipotong */}
      <div className="mt-2.5 px-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <TitleFlag language={prod.language} h={13} />
          <h3 title={prod.title} className="truncate text-[12.5px] font-extrabold leading-snug text-[#12172B]">
            {judulRingkas(prod.title)}
          </h3>
        </div>
        <p className="mt-0.5 truncate text-[11.5px] font-semibold text-slate-400">
          {meta}
          {prog && prog.pct > 0 ? ` · ${prog.pct}%` : ""}
        </p>

        {/* cuma yang mendesak yang naik ke rak: sisa hari, materi belum siap, akses habis */}
        {expired ? (
          bolehPerpanjang ? (
            <button
              onClick={onRenew}
              className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-600 hover:text-amber-700"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} /> Perpanjang
            </button>
          ) : (
            <p className="mt-1.5 text-[11.5px] font-bold text-rose-500">Akses berakhir</p>
          )
        ) : cicipan(p) ? (
          /* [ebook-pratinjau-unit1-v1] Rak tak boleh membuat orang mengira
             modulnya sudah utuh miliknya — sisa harinya kalah penting dari
             kenyataan bahwa isinya baru satu unit. */
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#12A37E]/10 px-2 py-0.5 text-[10.5px] font-extrabold text-[#0C8163]">
            <Sparkles className="h-3 w-3" strokeWidth={2.6} /> Pratinjau · Unit 1
          </p>
        ) : a.kind === "soon" ? (
          <p className="mt-1.5 text-[11.5px] font-bold text-amber-600">Sisa {a.days} hari</p>
        ) : !ready ? (
          <p className="mt-1.5 text-[11.5px] font-bold text-amber-600">Materi disiapkan</p>
        ) : null}
      </div>
    </div>
  );
}

function ProductRow({
  p, prog, busy, bookmarked, langCount = 0, ready = true, onToggleBookmark, onOpen, onRenew, onPrefetch,
}: {
  p: Purchase; prog: Prog | null; busy: boolean; bookmarked: boolean; langCount?: number;
  /** [materi-belum-siap-v1] false = link materinya belum dipasang admin. */
  ready?: boolean;
  onToggleBookmark: () => void; onOpen: () => void; onRenew: () => void;
  /* [ebook-buka-instan-v1] kursor/jari menyentuh kartu → modulnya mulai diunduh */
  onPrefetch?: () => void;
}) {
  const prod = p.digital_products;
  const a = accessInfo(p);
  const expired = a.kind === "expired";
  /* [elearning-per-bahasa-v1] Paket 12+ bahasa berhenti dijual: kartunya tetap
     ada supaya pembeli lama melihat riwayat & sisa aksesnya, tapi "Perpanjang"
     dicabut — tombol itu menerbitkan pembelian BARU atas produk yang sudah
     tidak ditawarkan lagi. Yang masanya habis berhenti di chip "Akses Berakhir". */
  const bolehPerpanjang = masihDijual(prod.slug);
  const isExternal = !!externalLinkFor(prod);
  const verb = accessVerb(prod);
  // [ebook-reader-v1] berkas e-book dibaca di dashboard → ikon buku, bukan panah unduh
  // [ikon-fill-none-v1] `fill` WAJIB "none", jangan undefined: undefined MENGHAPUS atribut
  // fill bawaan lucide, dan SVG tanpa fill jatuh ke hitam — ikonnya jadi kotak hitam pekat
  // di tengah tombol teal.
  const BtnIcon = prod.type === "ebook" && !isExternal ? BookOpen : verb === "Buka" ? ExternalLink : Play;
  return (
    <div
      onPointerEnter={onPrefetch}
      onTouchStart={onPrefetch}
      className={`flex items-center gap-4 rounded-2xl bg-white p-3 transition hover:border-slate-200 ${expired ? "opacity-70" : ""}`}
    >
      <button onClick={onOpen} disabled={expired} className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl disabled:cursor-not-allowed" style={{ background: gradFor(prod.id) }}>
        {fotoSampul(prod) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotoSampul(prod) as string}
            alt={prod.title}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white/25">{glyphFor(prod)}</span>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <TypeBadge type={prod.type} />
          {prog && <span className="text-[11px] font-bold text-slate-400">{prog.pct}%</span>}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <TitleFlag language={prod.language} />
          <h3 title={prod.title} className="truncate text-[15px] font-extrabold text-[#12172B]">{judulRingkas(prod.title)}</h3>
        </div>
        <p className="text-[12px] font-medium text-slate-400">
          {cicipan(p) ? `Pratinjau sejak ${fmtDate(p.created_at)}` : `Dibeli ${fmtDate(p.created_at)}`}
        </p>
        {/* [ebook-pratinjau-unit1-v1] */}
        {cicipan(p) && !expired && (
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#12A37E]/10 px-2 py-0.5 text-[11px] font-extrabold text-[#0C8163]">
            <Sparkles className="h-3 w-3" strokeWidth={2.6} /> Pratinjau — cuma Unit 1 yang terbuka
          </p>
        )}
        {/* [materi-belum-siap-v1] */}
        {!ready && !expired && (
          <p className="mt-1 text-[11px] font-semibold text-amber-600">Materi sedang disiapkan tim Linguo</p>
        )}
      </div>
      <div className="hidden sm:block"><AccessChip a={a} /></div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#12A37E] transition hover:bg-[#12A37E]/10"
      >
        {bookmarked ? <BookmarkCheck className="h-[18px] w-[18px]" fill="currentColor" /> : <Bookmark className="h-[18px] w-[18px]" />}
      </button>
      {expired && !bolehPerpanjang ? null : expired ? (
        <button onClick={onRenew} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-amber-600 active:scale-[0.98]"><Sparkles className="h-4 w-4" strokeWidth={2.4} /> Perpanjang</button>
      ) : (
        <button onClick={onOpen} disabled={busy} className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-bold text-white transition disabled:opacity-50 ${ready ? "bg-[#12A37E] hover:bg-[#0C8163]" : "bg-slate-400 hover:bg-slate-500"}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BtnIcon className="h-4 w-4" fill={BtnIcon === Play ? "currentColor" : "none"} />}
          {ready ? verb : "Belum siap"}
        </button>
      )}
    </div>
  );
}

// [perpanjang-inplace-v1] Popup perpanjang akses — pilih durasi & checkout Xendit
// TANPA pindah page (invoice dibuka di tab baru, halaman Perpustakaan tetap).
// Reuse edge function xendit-create-digital-invoice (sama dgn /toko).
function RenewModal({
  purchase, supabase, onClose,
}: {
  purchase: Purchase; supabase: SupabaseClient; onClose: () => void;
}) {
  const prod = purchase.digital_products;
  const [tiers, setTiers] = useState<RenewTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [buyer, setBuyer] = useState<{ email: string; name: string; phone: string | null }>({ email: "", name: "", phone: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      // buyer info dari auth (email wajib utk invoice; phone opsional)
      const { data: userRes } = await supabase.auth.getUser();
      const u = userRes?.user;
      // tier harga produk ini
      const { data, error } = await supabase
        .from("digital_products")
        .select("digital_product_pricing ( id, price, display_label, sort_order, duration_days )")
        .eq("id", prod.id)
        .single();
      if (!alive) return;
      if (u) {
        setBuyer({
          email: u.email ?? "",
          name: (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || (u.email?.split("@")[0] ?? "Siswa Linguo"),
          phone: (u.user_metadata?.phone as string) || (u.phone ? `+${u.phone}` : null),
        });
      }
      if (error) {
        console.error("Gagal memuat paket perpanjang:", error);
        toast.error("Gagal memuat paket perpanjang.");
      } else {
        const rows = (((data as any)?.digital_product_pricing ?? []) as RenewTier[])
          .slice()
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setTiers(rows);
        // default: tier paling populer (tengah) kalau ada 3, else pertama
        setSelectedId(rows.length >= 3 ? rows[1].id : rows[0]?.id ?? null);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [prod.id, supabase]);

  const selected = tiers.find((t) => t.id === selectedId) || null;

  async function handlePay() {
    if (!selected) return;
    if (!buyer.email) { toast.error("Email tidak ditemukan. Coba login ulang."); return; }
    // [pustaka-popup-blocked-v1] tab dibuka SEKARANG, selagi gestur klik masih hidup
    const tabBayar = siapkanTabPembayaran();
    setSubmitting(true);
    try {
      const refCookie = typeof document !== "undefined"
        ? (("; " + document.cookie).split("; linguo_ref=")[1]?.split(";")[0] ?? null)
        : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/xendit-create-digital-invoice`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pricing_id: selected.id,
            referral_code: refCookie,
            buyer_email: buyer.email,
            buyer_name: buyer.name,
            buyer_phone: buyer.phone,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.invoice_url) throw new Error(data.error ?? "Gagal membuat invoice");
      // buka Xendit di tab baru → halaman Perpustakaan tetap (ga pindah page)
      const tabBaru = tabBayar.arahkan(data.invoice_url);
      if (tabBaru) toast.success("Halaman pembayaran dibuka. Akses aktif otomatis setelah bayar.");
      onClose();
    } catch (err) {
      tabBayar.batal();
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitting(false);
    }
  }

  function tierMonths(t: RenewTier) {
    if (!t.duration_days) return null;
    return Math.max(1, Math.round(t.duration_days / 30));
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-[17px] font-extrabold text-[#12172B]">Perpanjang Akses</h3>
            <p className="mt-0.5 truncate text-[13px] font-medium text-slate-500">{prod.title}</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200">
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : tiers.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[14px] font-semibold text-slate-500">Paket perpanjang belum tersedia.</p>
              {/* [nav-newtab-v1] toko dibuka di tab baru: belanja modul tidak menendang
                  siswa keluar dari dashboard yang lagi dibuka. */}
              <a href="/toko" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#12A37E] hover:underline">
                Lihat di Toko <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <p className="mb-1 text-[13px] font-medium text-slate-500">Pilih durasi perpanjangan:</p>
              {tiers.map((t) => {
                const active = t.id === selectedId;
                const m = tierMonths(t);
                const pm = m ? Math.round(t.price / m) : null;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition ${
                      active ? "border-[#12A37E] bg-[#12A37E]/[0.06] ring-1 ring-[#12A37E]" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-extrabold text-[#12172B]">{t.display_label || (m ? `${m} Bulan` : "Akses")}</p>
                      {pm && <p className="mt-0.5 text-[12px] font-medium text-slate-500">≈ {fmtRupiah(pm)}/bulan</p>}
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[15px] font-extrabold text-[#12172B]">{fmtRupiah(t.price)}</span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? "border-[#12A37E] bg-[#12A37E] text-white" : "border-slate-300 text-transparent"}`}>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* footer */}
        {!loading && tiers.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-4">
            <button
              onClick={handlePay}
              disabled={!selected || submitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#12A37E] text-[15px] font-bold text-white transition hover:bg-[#0C8163] active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" strokeWidth={2.2} />}
              {submitting ? "Menyiapkan…" : selected ? `Bayar ${fmtRupiah(selected.price)}` : "Pilih paket"}
            </button>
            <p className="mt-2.5 text-center text-[11px] font-medium text-slate-400">
              Pembayaran aman via Xendit · akses aktif otomatis setelah lunas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// [pustaka-katalog-terkunci-v1] Kartu produk yang belum dimiliki: sampulnya
// diredam + gembok, jadi tak pernah tertukar dengan produk milik siswa. Produk
// yang materinya belum dipasang admin TIDAK bisa dibeli — menjual dulu lalu
// menyuruh siswa menunggu berkasnya itu cara tercepat bikin permintaan refund.
function LockedCard({
  item, ready, onBuy, diKeranjang, onKeranjang, onCoba, cobaBusy,
}: {
  item: CatalogItem; ready: boolean; onBuy: () => void;
  /* [pustaka-keranjang-v1] */
  diKeranjang: boolean; onKeranjang: () => void;
  /* [ebook-pratinjau-unit1-v1] undefined = produk ini tak bisa dicicipi. */
  onCoba?: () => void; cobaBusy?: boolean;
}) {
  const mulai = hargaMulai(item);
  const bisaBeli = ready && mulai !== null;

  // [pustaka-rak-sampul-v1] Seragam dengan rak "sudah dimiliki": sampul potret,
  // judul kecil di bawahnya. Bedanya sampul di sini diredam + digembok, dan di
  // bawah judul ada harga + dua tombol (Beli / Keranjang) yang tetap bisa disentuh
  // di HP — bukan ikon kecil di pojok sampul.
  return (
    <div className="group">
      <div className="relative">
        <button
          onClick={bisaBeli ? onBuy : undefined}
          disabled={!bisaBeli}
          className={`block w-full text-left transition duration-300 disabled:cursor-default ${bisaBeli ? "group-hover:-translate-y-1.5" : ""}`}
        >
          <ShelfCover p={item} locked dim />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-lg transition duration-300 group-hover:scale-105">
              <Lock className="h-[18px] w-[18px]" strokeWidth={2.4} />
            </span>
          </span>
        </button>
        <span className="pointer-events-none absolute left-2 top-2 transition duration-300 group-hover:-translate-y-1.5">
          <TypeDot type={item.type} />
        </span>
      </div>

      <div className="mt-2.5 px-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <TitleFlag language={item.language} h={13} />
          <h3 title={item.title} className="truncate text-[13.5px] font-extrabold leading-snug text-[#12172B]">
            {judulRingkas(item.title)}
          </h3>
        </div>
        <p className="mt-0.5 truncate text-[11.5px] font-semibold text-slate-400">
          {mulai !== null
            ? `${item.pricing.length > 1 ? "mulai " : ""}${fmtRupiah(mulai)}`
            : "Harga menyusul"}
        </p>

        <div className="mt-2 flex items-center gap-1.5">
          {/* [pustaka-segera-hadir-kontras-v1] tombol nonaktif pakai kelas biasa +
              teks gelap supaya tetap terbaca di mode gelap dashboard. */}
          <button
            onClick={onBuy}
            disabled={!bisaBeli}
            className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12px] font-bold transition active:scale-[0.98] ${
              bisaBeli
                ? "bg-[#12A37E] text-white hover:bg-[#0C8163]"
                : "cursor-default bg-slate-200 text-slate-700 ring-1 ring-slate-300 active:scale-100"
            }`}
          >
            {bisaBeli ? <><ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.4} /> Beli</> : <><Clock className="h-3.5 w-3.5" strokeWidth={2.4} /> Segera</>}
          </button>
          {/* [pustaka-keranjang-v1] jalur kedua: kumpulkan dulu, bayar sekalian */}
          {bisaBeli && (
            <button
              onClick={onKeranjang}
              aria-label={diKeranjang ? "Sudah di keranjang" : "Masukkan keranjang"}
              title={diKeranjang ? "Sudah di keranjang" : "Masukkan keranjang"}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition active:scale-[0.98] ${
                diKeranjang
                  ? "bg-[#12A37E]/10 text-[#0C8163] ring-1 ring-[#12A37E]/40 hover:bg-[#12A37E]/15"
                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200"
              }`}
            >
              {diKeranjang ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" strokeWidth={2.6} />}
            </button>
          )}
        </div>

        {/* [ebook-pratinjau-unit1-v1] Jalur ketiga: baca dulu, bayar belakangan.
            Barisnya sendiri (bukan ikon ketiga di baris Beli) supaya kalimatnya
            terbaca utuh — "Unit 1" itu janji yang menentukan orang mengkliknya
            atau tidak. Hanya muncul kalau modulnya memang siap dibuka. */}
        {onCoba && bisaBeli && (
          <button
            onClick={onCoba}
            disabled={cobaBusy}
            className="mt-1.5 inline-flex h-7 w-full items-center justify-center gap-1.5 rounded-lg bg-[#12A37E]/10 text-[11.5px] font-bold text-[#0C8163] ring-1 ring-[#12A37E]/30 transition hover:bg-[#12A37E]/15 active:scale-[0.98] disabled:opacity-60"
          >
            {cobaBusy
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <BookOpen className="h-3.5 w-3.5" strokeWidth={2.4} fill="none" />}
            Coba gratis Unit 1
          </button>
        )}
      </div>
    </div>
  );
}

// [pustaka-keranjang-v1] Popup keranjang: rincian belanja + checkout SATU invoice.
//
// Bedanya dengan BuyModal: ini tidak memanggil edge fn xendit-create-digital-invoice
// (yang satu-invoice-satu-produk), melainkan /api/create-cart-invoice di repo ini
// yang menulis N baris digital_purchases untuk satu invoice. Harga di layar cuma
// tampilan — yang ditagih adalah hitungan ulang server dari digital_product_pricing.
function CartModal({
  items, supabase, onClose, onHapus, onKosongkan,
}: {
  items: ItemKeranjang[];
  supabase: SupabaseClient;
  onClose: () => void;
  onHapus: (productId: string) => void;
  onKosongkan: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const total = items.reduce((n, x) => n + (Number(x.price) || 0), 0);

  // Keranjang yang dikosongkan dari dalam popup tak menyisakan apa pun untuk
  // dilihat — tutup sendiri daripada memamerkan layar kosong.
  useEffect(() => { if (items.length === 0) onClose(); }, [items.length, onClose]);

  async function bayar() {
    if (items.length === 0) return;
    // [pustaka-popup-blocked-v1] tab dibuka SEKARANG, selagi gestur klik hidup
    const tabBayar = siapkanTabPembayaran();
    setSubmitting(true);
    try {
      const { data: sesi } = await supabase.auth.getSession();
      const token = sesi?.session?.access_token ?? "";
      if (!token) throw new Error("Sesi tidak terbaca — coba muat ulang halaman.");

      const refCookie = typeof document !== "undefined"
        ? (("; " + document.cookie).split("; linguo_ref=")[1]?.split(";")[0] ?? null)
        : null;

      const res = await fetch("/api/create-cart-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: token,
          referral_code: refCookie,
          items: items.map((x) => ({ productId: x.productId, pricingId: x.pricingId })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.invoice_url) throw new Error(data?.error ?? "Gagal membuat invoice");

      // Item yang gugur di server (sudah dimiliki / materi belum siap) dikatakan
      // apa adanya — tagihannya memang lebih kecil dari yang terlihat di layar.
      if (Array.isArray(data.ditolak) && data.ditolak.length > 0) {
        toast(`Tidak semua ikut ditagih: ${data.ditolak.join("; ")}.`);
      }

      const tabBaru = tabBayar.arahkan(data.invoice_url);
      if (tabBaru) {
        toast.success(`Halaman pembayaran dibuka — ${data.jumlah} produk. Akses terbuka otomatis setelah lunas.`);
      }
      // Keranjang SENGAJA tidak dikosongkan di sini: invoice belum tentu dibayar.
      // Yang membersihkannya adalah sinkronkanKeranjang() begitu barisnya lunas.
      onClose();
    } catch (err) {
      tabBayar.batal();
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[17px] font-extrabold text-[#12172B]">
              <ShoppingCart className="h-[18px] w-[18px] text-[#12A37E]" strokeWidth={2.4} />
              Keranjang
            </h3>
            <p className="mt-0.5 text-[13px] font-medium text-slate-500">
              {items.length} produk · satu kali pembayaran
            </p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200">
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        {/* daftar */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-2.5">
            {items.map((x) => (
              <li key={x.productId} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                <span
                  className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100"
                  style={{ background: gradFor(x.productId) }}
                >
                  {(x.coverUrl || getLangPhoto(x.language)) && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={x.coverUrl || getLangPhoto(x.language) || ""}
                      alt=""
                      className={`h-full w-full object-cover${x.coverUrl ? " object-top" : ""}`}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p title={x.title} className="truncate text-[13.5px] font-extrabold text-[#12172B]">
                    {judulRingkas(x.title)}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] font-semibold text-slate-500">
                    {[x.type === "ebook" ? "Lingbook" : "E-Learning", x.tierLabel].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="shrink-0 text-[13.5px] font-extrabold text-[#12172B]">{fmtRupiah(x.price)}</span>
                <button
                  onClick={() => onHapus(x.productId)}
                  aria-label={`Hapus ${x.title} dari keranjang`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={onKosongkan}
            className="mt-3 text-[12px] font-bold text-slate-400 underline-offset-2 transition hover:text-rose-600 hover:underline"
          >
            Kosongkan keranjang
          </button>
        </div>

        {/* footer */}
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-bold text-slate-500">Total</span>
            <span className="text-[19px] font-extrabold text-[#12172B]">{fmtRupiah(total)}</span>
          </div>
          <button
            onClick={bayar}
            disabled={submitting || items.length === 0}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#12A37E] text-[15px] font-bold text-white transition hover:bg-[#0C8163] active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" strokeWidth={2.2} />}
            {submitting ? "Menyiapkan…" : `Bayar ${fmtRupiah(total)}`}
          </button>
          <p className="mt-2.5 text-center text-[11px] font-medium text-slate-400">
            Pembayaran aman via Xendit · semua produk terbuka otomatis setelah lunas
          </p>
        </div>
      </div>
    </div>
  );
}

// [pustaka-katalog-terkunci-v1] Popup beli — kembar dengan RenewModal (edge fn
// xendit-create-digital-invoice yang sama, invoice dibuka di tab baru), bedanya
// tier harganya sudah ikut terbawa dari katalog jadi tak perlu query lagi.
function BuyModal({
  item, supabase, onClose, onClaimed, diKeranjang, onKeranjang,
}: {
  item: CatalogItem; supabase: SupabaseClient; onClose: () => void;
  /** [pustaka-promo-kode-v1] dipanggil sesudah akses promo terbit → pustaka dimuat ulang */
  onClaimed: () => void;
  /* [pustaka-keranjang-v1] tier yang sedang dipilih ikut dibawa ke keranjang */
  diKeranjang: boolean; onKeranjang: (tier: RenewTier) => void;
}) {
  const tiers = item.pricing;
  const [selectedId, setSelectedId] = useState<string | null>(
    tiers.length >= 3 ? tiers[1].id : tiers[0]?.id ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [buyer, setBuyer] = useState<{ email: string; name: string; phone: string | null }>({ email: "", name: "", phone: null });
  // [pustaka-promo-kode-v1] kode promo — divalidasi di server (/api/promo-digital),
  // token sesi dibawa karena route-nya menerbitkan kepemilikan atas nama akun ini.
  const [token, setToken] = useState("");
  const [kode, setKode] = useState("");
  const [promo, setPromo] = useState<{ code: string; label: string; hari: number } | null>(null);
  const [cekBusy, setCekBusy] = useState(false);
  const [promoErr, setPromoErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: sesi } = await supabase.auth.getSession();
      if (alive) setToken(sesi?.session?.access_token ?? "");
      const { data: userRes } = await supabase.auth.getUser();
      const u = userRes?.user;
      if (!alive || !u) return;
      setBuyer({
        email: u.email ?? "",
        name: (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || (u.email?.split("@")[0] ?? "Siswa Linguo"),
        phone: (u.user_metadata?.phone as string) || (u.phone ? `+${u.phone}` : null),
      });
    })();
    return () => { alive = false; };
  }, [supabase]);

  async function panggilPromo(mode: "cek" | "klaim") {
    const code = kode.trim().toUpperCase();
    if (!code) { setPromoErr("Masukkan kode promonya dulu."); return null; }
    if (!token) { setPromoErr("Sesi tidak terbaca — coba muat ulang halaman."); return null; }
    const res = await fetch("/api/promo-digital", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: token, productId: item.id, pricingId: selectedId, code, mode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      setPromoErr(data?.error ?? "Kode promo tidak bisa dipakai.");
      setPromo(null);
      return null;
    }
    setPromoErr(null);
    return data as { code: string; label: string; hari: number };
  }

  async function pakaiKode() {
    setCekBusy(true);
    const hasil = await panggilPromo("cek");
    if (hasil) {
      setPromo({ code: hasil.code, label: hasil.label, hari: hasil.hari });
      toast.success(`Kode ${hasil.code} dipakai — ${hasil.label}.`);
    }
    setCekBusy(false);
  }

  async function klaimGratis() {
    setSubmitting(true);
    const hasil = await panggilPromo("klaim");
    if (!hasil) { setSubmitting(false); return; }
    toast.success(`Akses ${hasil.hari} hari terbuka. Produknya sudah ada di Perpustakaan kamu.`);
    onClaimed();
    onClose();
  }

  const selected = tiers.find((t) => t.id === selectedId) || null;

  async function handlePay() {
    if (!selected) return;
    if (!buyer.email) { toast.error("Email tidak ditemukan. Coba login ulang."); return; }
    // [pustaka-popup-blocked-v1] tab dibuka SEKARANG, selagi gestur klik masih hidup
    const tabBayar = siapkanTabPembayaran();
    setSubmitting(true);
    try {
      const refCookie = typeof document !== "undefined"
        ? (("; " + document.cookie).split("; linguo_ref=")[1]?.split(";")[0] ?? null)
        : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/xendit-create-digital-invoice`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pricing_id: selected.id,
            referral_code: refCookie,
            buyer_email: buyer.email,
            buyer_name: buyer.name,
            buyer_phone: buyer.phone,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.invoice_url) throw new Error(data.error ?? "Gagal membuat invoice");
      const tabBaru = tabBayar.arahkan(data.invoice_url);
      // Kalau tab penampungnya terhalang, halaman ini yang pindah ke Xendit —
      // toast "halaman pembayaran dibuka" jadi mubazir (dan menyesatkan).
      if (tabBaru) toast.success("Halaman pembayaran dibuka. Produk masuk Perpustakaan otomatis setelah lunas.");
      onClose();
    } catch (err) {
      tabBayar.batal();
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-[17px] font-extrabold text-[#12172B]">Beli Produk</h3>
            <p className="mt-0.5 truncate text-[13px] font-medium text-slate-500">{item.title}</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200">
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tiers.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[14px] font-semibold text-slate-500">Paket harga belum tersedia.</p>
              <a href="/toko" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#12A37E] hover:underline">
                Lihat di Toko <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {tiers.length > 1 && <p className="mb-1 text-[13px] font-medium text-slate-500">Pilih paket:</p>}
              {tiers.map((t) => {
                const active = t.id === selectedId;
                const bulan = t.duration_days ? Math.max(1, Math.round(t.duration_days / 30)) : null;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition ${
                      active ? "border-[#12A37E] bg-[#12A37E]/[0.06] ring-1 ring-[#12A37E]" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-extrabold text-[#12172B]">{t.display_label || (bulan ? `${bulan} Bulan` : "Akses selamanya")}</p>
                      <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                        {t.duration_days ? `Akses ${t.duration_days} hari` : "Akses selamanya"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="text-[15px] font-extrabold text-[#12172B]">{fmtRupiah(t.price)}</span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? "border-[#12A37E] bg-[#12A37E] text-white" : "border-slate-300 text-transparent"}`}>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* [pustaka-promo-kode-v1] kode promo — divalidasi server, bukan di sini:
              kalau syaratnya dinilai di browser, "gratis" tinggal dipanggil sendiri
              dari console. Kode yang lolos mengganti tombol bayar jadi klaim. */}
          {tiers.length > 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-3.5">
              <p className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-[#12172B]">
                <Ticket className="h-4 w-4 text-[#12A37E]" strokeWidth={2.4} /> Punya kode promo?
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={kode}
                  onChange={(e) => { setKode(e.target.value); setPromoErr(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") pakaiKode(); }}
                  placeholder="Masukkan kode"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={!!promo}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-bold uppercase tracking-wide text-[#12172B] outline-none transition placeholder:font-medium placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#12A37E] disabled:bg-slate-100"
                />
                {promo ? (
                  <button
                    onClick={() => { setPromo(null); setKode(""); setPromoErr(null); }}
                    className="shrink-0 rounded-xl bg-slate-200 px-3.5 py-2.5 text-[13px] font-bold text-slate-700 transition hover:bg-slate-300"
                  >
                    Ganti
                  </button>
                ) : (
                  <button
                    onClick={pakaiKode}
                    disabled={cekBusy || !kode.trim()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#12172B] px-3.5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#12172B]/90 disabled:opacity-40"
                  >
                    {cekBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Pakai
                  </button>
                )}
              </div>
              {promo && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-[#0C8163]">
                  <Check className="h-4 w-4" strokeWidth={3} /> {promo.code} aktif — {promo.label} ({promo.hari} hari), tanpa bayar.
                </p>
              )}
              {promoErr && (
                <p className="mt-2 text-[12px] font-semibold text-rose-600">{promoErr}</p>
              )}
            </div>
          )}
        </div>

        {/* footer */}
        {tiers.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-4">
            {promo ? (
              <button
                onClick={klaimGratis}
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#12A37E] text-[15px] font-bold text-white transition hover:bg-[#0C8163] active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" strokeWidth={2.2} />}
                {submitting ? "Membuka akses…" : `Klaim akses gratis ${promo.hari} hari`}
              </button>
            ) : (
              <button
                onClick={handlePay}
                disabled={!selected || submitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#12A37E] text-[15px] font-bold text-white transition hover:bg-[#0C8163] active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" strokeWidth={2.2} />}
                {submitting ? "Menyiapkan…" : selected ? `Bayar ${fmtRupiah(selected.price)}` : "Pilih paket"}
              </button>
            )}

            {/* [pustaka-keranjang-v1] Alternatif "bayar sekarang": simpan paket
                yang dipilih lalu lanjut belanja. Disembunyikan saat kode promo
                aktif — klaim gratis tak lewat keranjang sama sekali. */}
            {!promo && selected && (
              <button
                onClick={() => { onKeranjang(selected); onClose(); }}
                disabled={submitting}
                className={`mt-2.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold transition active:scale-[0.99] disabled:opacity-50 ${
                  diKeranjang
                    ? "bg-[#12A37E]/10 text-[#0C8163] ring-1 ring-[#12A37E]/40 hover:bg-[#12A37E]/15"
                    : "bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200"
                }`}
              >
                {diKeranjang
                  ? <><Check className="h-[18px] w-[18px]" strokeWidth={3} /> Perbarui keranjang</>
                  : <><Plus className="h-[18px] w-[18px]" strokeWidth={2.6} /> Masukkan keranjang</>}
              </button>
            )}
            <p className="mt-2.5 text-center text-[11px] font-medium text-slate-400">
              {promo
                ? "Akses promo terbit langsung — tanpa halaman pembayaran."
                : "Pembayaran aman via Xendit · produk terbuka otomatis setelah lunas"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const t = useT(); // [ui-lang-switcher-v1]
  return (
    <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)]">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#12A37E]/10 text-[#12A37E]"><BookOpen className="h-9 w-9" strokeWidth={2} /></div>
      <h3 className="text-[20px] font-extrabold text-[#12172B]">{t("Perpustakaan masih kosong")}</h3>
      <p className="mx-auto mt-1 max-w-sm text-[14px] font-medium text-slate-500">
        {t("Kamu belum punya Lingbook atau E-Learning. Jelajahi toko untuk mulai belajar mandiri kapan saja.")}
      </p>
      <a
        href="/toko"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#12A37E] px-6 py-3 text-[14px] font-bold text-white transition hover:bg-[#0C8163] active:scale-[0.98]"
      >
        <ShoppingBag className="h-4 w-4" /> {t("Jelajahi Toko Digital")}
      </a>
    </div>
  );
}
