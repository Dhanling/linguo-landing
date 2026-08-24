"use client";

// Watch & Learn — versi web dari fitur immersion di app mobile Linguo.
// Katalog video YouTube per bahasa + kategori (search lewat Edge Function
// `yt-search`), player embed dengan caption, dan rail "Lanjut Menonton" dari
// riwayat lokal. Tema gelap biar konten video kelihatan nendang, senada app.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  Play,
  RefreshCw,
  Search,
  Trash2,
  X,
  Check,
  CircleCheck,
  Sparkles,
  Flame,
  Clapperboard,
  ToyBrick,
  Newspaper,
  Music,
  Film,
  Trophy,
  Lightbulb,
  Video,
  Baby,
  Eye,
  TextSearch,
  Clock3,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  IMMERSION_CATEGORIES,
  IMMERSION_LANGS,
  ImmersionCategory,
  ImmersionLang,
  ImmersionVideo,
  buildQuery,
  clearWatchHistory,
  filterVideosByLanguage,
  getImmersionLang,
  getWatchHistory,
  getWatchPosition,
  pushWatchHistory,
  searchImmersionVideos,
  WatchHistoryItem,
  formatDuration,
  formatViews,
  fetchVideoStats,
  youtubeThumb,
} from "@/lib/immersion";
import {
  fetchReadyVideos,
  fetchReadyCounts,
  fetchReadyFlags,
  getSavedWords,
  onSavedWordsChanged,
  prewarmTranscripts,
  searchWordInVideos,
  type WordHit,
  BASE_LANGS,
  DEFAULT_BASE_LANG,
  getBaseLangDef,
  getStoredBaseLang,
  storeBaseLang,
  setWatchStaff,
  isWatchCompedEmail,
} from "@/lib/immersionLearn";
import { supabase, peekSessionCookie, resolveSessionForGate } from "@/lib/supabase-client"; // [perf:session-cookie-peek-v1] [auth-gate-resilient-v1]
import { CEFR_STYLE, type CefrLevel } from "@/lib/cefr";
import { RectFlag } from "@/components/RectFlag";
import { LangPickerPanel } from "./LangPickerPanel";
import { useWlPanel, useWlHeartbeat } from "@/lib/wlAnalytics";
import dynamic from "next/dynamic";
import { tr, useT } from "@/lib/uiLang"; // [ui-lang-switcher-v1]

// [perf:watch-split-player-v1] Player belajar (transkrip dwibahasa, analisa,
// tap-kata) + dashboard flashcard adalah dua komponen TERBESAR di fitur ini,
// tapi keduanya baru terpakai SESUDAH user mengklik sesuatu. Sebagai impor biasa
// mereka ikut terunduh & di-parse sebelum katalog boleh tampil — itu bagian
// terbesar dari "kok loadingnya lama" saat buka/refresh halaman. Dipisah jadi
// chunk sendiri, lalu diam-diam di-prefetch saat browser menganggur (lihat
// preload di bawah), jadi klik pertama tetap terasa instan.
const VideoLearnPlayer = dynamic(() => import("./VideoLearnPlayer"), {
  ssr: false,
  loading: () => (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center"
      style={{ backgroundColor: BG }}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-2"
        style={{ borderColor: TEAL, borderTopColor: "transparent" }}
      />
    </div>
  ),
});
const FlashcardDeck = dynamic(() => import("./FlashcardDeck"), { ssr: false });

// Dimensi bahasa yang ikut di tiap event analitik WL. `lang_country` dikirim apa
// adanya supaya dashboard bisa menggambar bendera tanpa menyalin daftar bahasa.
function wlLangProps(code: string) {
  const l = getImmersionLang(code);
  return { lang: code, lang_label: l?.name ?? code, lang_country: l?.country ?? "" };
}

const TEAL = "#1A9E9E";
const GOLD = "#F4B740";
const BG = "#0B0E0F";
const CARD = "#161A1C";
const BORDER = "rgba(255,255,255,0.08)";
const SUB = "rgba(255,255,255,0.5)";

const LANG_KEY = "linguo:watch:lang:v1";
// Riwayat bahasa yang terakhir dipilih di language selector (kode, terbaru dulu).
const RECENT_LANGS_KEY = "linguo:watch:recentLangs:v1";
const RECENT_LANGS_MAX = 5;
// Riwayat kata kunci pencarian video (teks, terbaru dulu).
const SEARCH_HISTORY_KEY = "linguo:watch:searchHistory:v1";
const SEARCH_HISTORY_MAX = 8;
// [linguo-patch:watch-orient-toggle-v1] Ambang pemisah Shorts vs Video landscape.
// Shorts YouTube praktis selalu ≤60 dtk & vertikal; klip landscape (adegan film,
// TV, wawancara) di katalog umumnya lebih panjang. Bukan deteksi aspect ratio
// sempurna (API tak sediakan), tapi proxy durasi ini cocok utk mayoritas kasus.
const SHORTS_MAX_SEC = 60;
// Layout grid: 5 kartu per baris di desktop (grid lg:grid-cols-5). Default tampil
// 4 baris (INITIAL_VISIBLE = 4 × GRID_COLS = 20 video) tiap tab; tiap klik
// "Muat lainnya" menambah 4 baris lagi (LOAD_MORE_COUNT = 4 × GRID_COLS).
const GRID_COLS = 5;
const INITIAL_VISIBLE = GRID_COLS * 4;
const LOAD_MORE_COUNT = GRID_COLS * 4;
// [watch-batch-20-v1] yt-search membatasi `max` di 25/halaman, dan sebagian hasil
// rontok kena filter bahasa/durasi → satu halaman sering tak cukup buat 20 kartu.
// Jadi tiap batch boleh merangkai beberapa halaman sampai kuotanya kekejar.
const CATALOG_PAGE_SIZE = 25;
const CATALOG_MAX_PAGES = 3;
// [watch-shuffle-v1] Tiap muat ulang harus nampilin video + channel yang beda.
// Dua tuas dipakai bareng:
//  1) POOL_FACTOR — ambil kolam lebih besar dari yang ditampilkan (20 kartu dari
//     ~40 kandidat), lalu diacak → refresh berikutnya kebagian isi kolam yang lain.
//     Sisanya jadi cadangan lokal buat "Muat lainnya" (tanpa kuota tambahan).
//  2) CATALOG_ORDERS — sort order YouTube diundi tiap batch. Tiap order punya
//     kunci cache server sendiri (yt-search cacheKey ikut `order`), jadi hasilnya
//     beneran kumpulan video beda, bukan cuma urutan beda dari 25 yang sama.
const POOL_FACTOR = 2;
type CatalogOrder = "date" | "rating" | "viewCount" | "relevance";
const CATALOG_ORDERS: CatalogOrder[] = ["relevance", "viewCount"];
// Maksimal kartu dari channel yang sama di dalam satu layar hasil. Tanpa ini satu
// channel dominan (mis. MrBeast di tab Kreator) bisa memborong hampir seluruh grid.
const MAX_PER_CHANNEL = 2;

// Fisher–Yates, tidak mengubah array asal.
function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Order acak buat sebuah kategori. Rail berita/terbaru tetap `date` — di sana
// urutan kronologis itu justru fiturnya.
function pickOrder(cat: ImmersionCategory): CatalogOrder {
  if (cat.news || cat.fresh) return "date";
  return CATALOG_ORDERS[Math.floor(Math.random() * CATALOG_ORDERS.length)];
}
// Pengisi otomatis kalau filter client (orientasi/Shorts) masih menyisakan grid
// kurang dari sebaris penuh. Dibatasi biar tak menguras kuota YouTube.
const AUTOFILL_MAX = 2;

// [watch-tab-order-v1] Urutan tab kategori: "Vlog" ditaruh paling depan supaya
// tampil tepat di kanan tab "Cari Kata"; sisanya ikut urutan asli.
const CATEGORY_TABS = [
  ...IMMERSION_CATEGORIES.filter((c) => c.id === "vlog"),
  ...IMMERSION_CATEGORIES.filter((c) => c.id !== "vlog"),
];

// [linguo-patch:watch-duration-filter-v1] Katalog kini memuat video sampai 20 menit
// (dulu ≤5 mnt) supaya filter durasi <5 / 5–10 / 10–20 mnt punya isi. Batas atas ini
// dikirim ke yt-search sebagai maxDurationSec sekaligus jadi saring ganda di client.
const CATALOG_MAX_DURATION_SEC = 20 * 60;

// Pilihan filter durasi di grid rekomendasi. Rentang [min, max) detik; video tanpa
// durasi hanya lolos di "Semua". Filter murni client-side — semua video ≤20 mnt sudah
// ikut terambil dari server, jadi ganti tab durasi tak perlu fetch ulang.
const DURATION_FILTERS = [
  { id: "all", label: "Semua durasi", min: 0, max: Infinity },
  { id: "u5", label: "< 5 mnt", min: 0, max: 300 },
  { id: "5to10", label: "5–10 mnt", min: 300, max: 600 },
  { id: "10to20", label: "10–20 mnt", min: 600, max: 20 * 60 },
] as const;
type DurationFilter = (typeof DURATION_FILTERS)[number]["id"];

// [linguo-patch:watch-level-filter-v1] Filter level CEFR di tab "Siap" — pelajar bisa
// menyaring video sesuai kemampuannya (A1 pemula … C1 mahir). "Semua" = tak menyaring.
// Hanya video tab "Siap" yang punya estimasi level, jadi filter ini cuma muncul di sana.
const LEVEL_FILTERS: ("all" | CefrLevel)[] = ["all", "A1", "A2", "B1", "B2", "C1"];
type LevelFilter = (typeof LEVEL_FILTERS)[number];

// [linguo-patch:watch-orient-frame0-v1] Deteksi orientasi ASLI video via thumbnail
// `frame0.jpg`. Kenapa: YouTube Data API tak kasih orientasi, dan durasi bukan proxy
// andal (Shorts kini bisa >60 dtk, jadi bocor ke tab "Video"; video ber-durasi null
// juga salah masuk). Tapi `https://i.ytimg.com/vi/<id>/frame0.jpg` = frame pertama
// dengan RASIO ASPEK ASLI (portrait → tinggi>lebar), beda dari hqdefault yang selalu
// 480×360 (letterboxed). Keyless, tanpa kuota API. Rasio tak pernah berubah → cache
// permanen (module-level, lintas ganti bahasa/kategori). true = portrait (Shorts).
// [perf:watch-orient-persist-v1] Orientasi asli tiap video dideteksi dengan
// MENGUNDUH frame0.jpg-nya — satu request per kartu, jadi ±40 request tiap grid
// terisi. Dulu hasilnya cuma di memori: refresh halaman = deteksi 40 video itu
// diulang dari nol, berebut bandwidth dengan thumbnail yang justru mau dilihat
// user. Sekarang dicerminkan ke localStorage (orientasi video tak pernah
// berubah), jadi kunjungan berikutnya nyaris tanpa request frame0.
const ORIENT_STORE_KEY = "linguo:watch:orient:v1";
const ORIENT_STORE_MAX = 600;
const orientCache = (() => {
  const map = new Map<string, boolean>();
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(ORIENT_STORE_KEY);
      const rows = raw ? (JSON.parse(raw) as [string, boolean][]) : [];
      for (const [k, v] of rows) if (typeof v === "boolean") map.set(k, v);
    } catch {
      /* storage diblokir → deteksi jalan seperti biasa, cuma tak awet */
    }
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const flush = () => {
    timer = undefined;
    try {
      // Sisakan yang terbaru saja (Map menjaga urutan sisip).
      const rows = [...map.entries()].slice(-ORIENT_STORE_MAX);
      window.localStorage.setItem(ORIENT_STORE_KEY, JSON.stringify(rows));
    } catch {
      try { window.localStorage.removeItem(ORIENT_STORE_KEY); } catch {}
    }
  };
  return {
    has: (k: string) => map.has(k),
    get: (k: string) => map.get(k),
    set: (k: string, v: boolean) => {
      map.set(k, v);
      if (typeof window === "undefined") return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, 600);
    },
  };
})();
const frame0Url = (id: string) => `https://i.ytimg.com/vi/${id}/frame0.jpg`;

// Tombol top-bar (Kosakata / bahasa) tampil ikon saja; label "keluar" ke kiri saat
// hover — sama seperti tombol header di player. Wadah grid 0fr→1fr supaya lebar
// beranimasi mulus (bukan max-w yang loncat), teks geser + fade. Dipakai bareng
// class `group` di tombol induk. Ref: VideoLearnPlayer REVEAL_LABEL.
function RevealLabel({ children }: { children: ReactNode }) {
  return (
    <span className="grid grid-cols-[0fr] overflow-hidden transition-[grid-template-columns] duration-300 ease-out group-hover:grid-cols-[1fr]">
      <span className="min-w-0 overflow-hidden">
        <span className="block translate-x-1 whitespace-nowrap pl-2 leading-none opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100">
          {children}
        </span>
      </span>
    </span>
  );
}

// Tab "Siap": video yang transkripnya sudah tersimpan → buka = instan, tanpa
// biaya AI. Bukan kategori YouTube, jadi ditangani khusus (baca dari cache).
const SIAP_ID = "siap";

// Tab "Cari Kata" (ala YouGlish): ketik satu kata → daftar kalimat nyata dari
// video katalog tempat kata itu dipakai, klik lompat ke detiknya. Bukan pencarian
// video/YouTube, jadi ditangani khusus (RPC search_cues via /api/watch-search).
const WORD_ID = "cari-kata";

// Detik → "m:ss" (badge timestamp hasil Cari Kata).
function fmtStamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Pecah kalimat di sekitar kemunculan `word` (case-insensitive, literal) untuk
// menyorot kata yang dicari — mengembalikan potongan { text, hit }.
function highlightParts(sentence: string, word: string): { text: string; hit: boolean }[] {
  const w = word.trim();
  if (!w) return [{ text: sentence, hit: false }];
  const re = new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const out: { text: string; hit: boolean }[] = [];
  let last = 0;
  for (const m of sentence.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: sentence.slice(last, i), hit: false });
    out.push({ text: m[0], hit: true });
    last = i + m[0].length;
  }
  if (last < sentence.length) out.push({ text: sentence.slice(last), hit: false });
  return out.length ? out : [{ text: sentence, hit: false }];
}

// [linguo-patch:watch-tab-lucide-v1] Ikon Lucide per kategori (menggantikan emoji
// di tab). Dipetakan ke `id` kategori dari IMMERSION_CATEGORIES.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  populer: Sparkles,
  kreator: Flame,
  hiburan: Clapperboard,
  kartun: ToyBrick,
  berita: Newspaper,
  musik: Music,
  film: Film,
  olahraga: Trophy,
  teknologi: Lightbulb,
  vlog: Video,
  anak: Baby,
};

// [linguo-patch:watch-resume-refresh-v1] Video yang sedang dibuka disimpan di URL
// (?v=<videoId>&vl=<bahasa>) supaya REFRESH tetap kembali ke mode menonton, bukan
// mental ke katalog. Metadata kartu diambil dari riwayat tonton lokal (video yang
// dibuka selalu masuk riwayat), jadi judul & durasi tetap tampil setelah reload.
function stripWatchParams() {
  const u = new URL(window.location.href);
  if (!u.searchParams.has("v") && !u.searchParams.has("vl")) return;
  u.searchParams.delete("v");
  u.searchParams.delete("vl");
  u.searchParams.delete("t"); // [watch-lanjut-menit-v1] ikut dibuang bersama v/vl
  window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
}

// [perf:watch-catalog-cache-v1] Cache katalog module-level: pindah menu lalu balik
// ke Watch & Learn → grid tampil instan tanpa nembak yt-search lagi. Kunci per
// (bahasa, query); TTL 10 menit — lewat itu tampilkan cache dulu, refresh diam-diam.
//
// [perf:watch-catalog-persist-v1] …TAPI cache module-level mati begitu halaman
// di-REFRESH (modulnya dievaluasi ulang dari nol), dan justru itu keluhannya:
// "buka dari menu / refresh, loadingnya lama". Loading itu bukan render, tapi
// menunggu yt-search (beberapa halaman × jaringan). Jadi isinya dicerminkan ke
// localStorage: mount berikutnya — refresh, tab baru, besok pagi — grid langsung
// terlukis dari cermin itu, lalu disegarkan diam-diam kalau sudah lewat TTL.
type CatalogEntry = {
  videos: ImmersionVideo[];
  nextToken?: string;
  order?: CatalogOrder;
  at: number;
};
const CATALOG_TTL_MS = 10 * 60 * 1000;
const CATALOG_STORE_KEY = "linguo:watch:catalog:v1";
/** Entri terbaru yang ikut disimpan (± satu bahasa penuh + beberapa tab). */
const CATALOG_STORE_MAX = 8;
/** Video per entri yang disimpan — cukup untuk 2 layar pertama grid. */
const CATALOG_STORE_MAX_VIDEOS = 40;
/** Lewat ini, cache tersimpan tak dipakai lagi (judul/thumbnail bisa basi). */
const CATALOG_STORE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const catalogCache = (() => {
  const map = new Map<string, CatalogEntry>();

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(CATALOG_STORE_KEY);
      const rows = raw ? (JSON.parse(raw) as [string, CatalogEntry][]) : [];
      const now = Date.now();
      for (const [k, v] of rows) {
        if (v && Array.isArray(v.videos) && now - v.at < CATALOG_STORE_MAX_AGE_MS) {
          map.set(k, v);
        }
      }
    } catch {
      /* storage penuh/diblokir → jalan tanpa cermin, cuma lebih lambat */
    }
  }

  // Tulis balik ditunda: satu batch fetch bisa memanggil set() beberapa kali
  // (mis. enrich views tab "Siap"), dan JSON.stringify di jalur itu tak perlu
  // ikut menahan interaksi.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const flush = () => {
    timer = undefined;
    if (typeof window === "undefined") return;
    try {
      const rows = [...map.entries()]
        .sort((a, b) => b[1].at - a[1].at)
        .slice(0, CATALOG_STORE_MAX)
        .map(([k, v]) => [
          k,
          { ...v, videos: v.videos.slice(0, CATALOG_STORE_MAX_VIDEOS) },
        ]);
      window.localStorage.setItem(CATALOG_STORE_KEY, JSON.stringify(rows));
    } catch {
      // Kuota localStorage habis → buang cermin, jangan biarkan gagal terus.
      try { window.localStorage.removeItem(CATALOG_STORE_KEY); } catch {}
    }
  };

  return {
    get: (k: string) => map.get(k),
    set: (k: string, v: CatalogEntry) => {
      map.set(k, v);
      if (typeof window === "undefined") return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, 400);
    },
  };
})();
// Kunci cache memuat filter durasi: tiap tab ("< 5", "5–10", "10–20") kini fetch
// bucket YouTube berbeda (short/medium), jadi hasilnya tak boleh saling menimpa.
const catalogKeyOf = (langCode: string, q: string, dur = "all") => `${langCode}|${dur}|${q}`;

/** Bahasa target yang terakhir dipilih — dibaca sinkron biar tak ada fetch mubazir. */
function readStoredLang(): string {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    return saved && getImmersionLang(saved) ? saved : "en";
  } catch {
    return "en";
  }
}

// Rentang durasi (detik) yang dikirim ke yt-search untuk sebuah tab filter.
// "Semua" tetap dibatasi ke katalog ≤20 mnt; sisanya kirim min & max eksplisit
// agar server membias hasil ke bucket durasi yang benar (bukan Shorts semua).
function durRange(id: DurationFilter): { min: number; max: number } {
  const d = DURATION_FILTERS.find((x) => x.id === id) ?? DURATION_FILTERS[0];
  return { min: d.min, max: d.max === Infinity ? CATALOG_MAX_DURATION_SEC : d.max };
}

// [watch-batch-20-v1] Sebar hasil biar kartu bersebelahan tak dari channel yang
// sama: round-robin antar channel dengan urutan relevansi di dalam tiap channel
// tetap terjaga. Tak ada video yang dibuang — cuma diurutkan ulang.
function diversifyByChannel(list: ImmersionVideo[]): ImmersionVideo[] {
  const buckets = new Map<string, ImmersionVideo[]>();
  for (const v of list) {
    const key = (v.channel || v.videoId).toLowerCase();
    const b = buckets.get(key);
    if (b) b.push(v);
    else buckets.set(key, [v]);
  }
  const queues = [...buckets.values()];
  const out: ImmersionVideo[] = [];
  // [watch-shuffle-v1] Ronde 0..MAX_PER_CHANNEL-1 duluan (jatah wajar tiap channel),
  // sisanya nyusul di belakang. Tak ada yang dibuang — cuma didorong ke ekor daftar,
  // jadi channel dominan tetap kebagian tapi tak memborong layar pertama.
  const tail: ImmersionVideo[] = [];
  for (let i = 0; out.length + tail.length < list.length; i++) {
    for (const q of queues) {
      const v = q[i];
      if (!v) continue;
      if (i < MAX_PER_CHANNEL) out.push(v);
      else tail.push(v);
    }
    if (i > list.length) break; // jaga-jaga, tak mungkin tercapai
  }
  return [...out, ...tail];
}

// [watch-batch-20-v1] Ambil satu batch katalog berisi ~`want` video: merangkai
// beberapa halaman yt-search kalau satu halaman kurang (banyak yang rontok kena
// filter bahasa/durasi), lalu disebar antar channel. Balikin juga pageToken
// terakhir supaya "Muat lainnya" berikutnya lanjut dari sana (video baru semua).
async function fetchCatalogBatch(opts: {
  lang: ImmersionLang;
  cat: ImmersionCategory;
  text: string;
  durId: DurationFilter;
  want: number;
  pageToken?: string;
  /** Sort order YouTube untuk batch ini. WAJIB sama dengan order yang melahirkan
   *  `pageToken` — token halaman terikat ke parameter pencariannya. */
  order: CatalogOrder;
  /** videoId yang sudah tampil di grid — jangan dihitung sebagai "hasil baru". */
  exclude?: Set<string>;
}): Promise<{ results: ImmersionVideo[]; nextToken?: string }> {
  const { lang, cat, text, durId, want, order, exclude } = opts;
  const q = buildQuery(cat, lang, text);
  const freeText = !!text.trim();
  const { min, max } = durRange(durId);
  const seen = new Set<string>(exclude ?? []);
  const out: ImmersionVideo[] = [];
  let token = opts.pageToken;
  for (let i = 0; i < CATALOG_MAX_PAGES && out.length < want; i++) {
    const page = await searchImmersionVideos({
      query: q,
      language: lang.searchCode ?? lang.code,
      order,
      max: CATALOG_PAGE_SIZE,
      pageToken: token,
      maxDurationSec: max,
      minDurationSec: min || undefined,
      regionCode: lang.region,
    });
    const ok = filterVideosByLanguage(page.results, lang.code, freeText).filter(
      (v) => !v.duration || v.duration <= max
    );
    for (const v of ok) {
      if (seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      out.push(v);
    }
    token = page.nextPageToken;
    if (!token) break; // halaman habis
  }
  // [watch-shuffle-v1] Rail berita/terbaru tetap kronologis; sisanya diacak dulu
  // sebelum disebar antar channel supaya tiap muat ulang beda isinya.
  const pool = order === "date" ? out : shuffle(out);
  return { results: diversifyByChannel(pool), nextToken: token };
}

export default function WatchAndLearn() {
  const t = useT(); // [ui-lang-switcher-v1]
  // [perf:watch-boot-v1] Bahasa tersimpan dibaca SINKRON di render pertama, bukan
  // lewat useEffect. Dulu state mulai dari "en" lalu effect menggantinya dengan
  // bahasa simpanan → efek katalog jalan DUA kali: satu fetch penuh untuk katalog
  // Inggris yang hasilnya langsung dibuang, baru fetch bahasa yang benar. Itu
  // menggandakan waktu tunggu di layar (dan kuota yt-search) tiap buka halaman.
  //
  // Aman dari hydration mismatch: render pertama di klien tetap keluar di cabang
  // gate (`loggedIn === null` → spinner), sama persis dengan HTML dari server —
  // nilai bahasa belum ikut menentukan apa pun yang dirender di titik itu.
  const [boot] = useState(() => {
    const code = readStoredLang();
    return {
      code,
      // Grid dari kunjungan sebelumnya (cermin localStorage) dipasang sebagai
      // nilai AWAL state, bukan lewat effect → tak ada satu frame pun spinner
      // sebelum kartu muncul.
      hit: typeof window === "undefined" ? undefined : catalogCache.get(catalogKeyOf(code, SIAP_ID)),
    };
  });
  // Bahasa target — disimpan di localStorage biar konsisten antar kunjungan.
  const [langCode, setLangCode] = useState(boot.code);
  const [category, setCategory] = useState(SIAP_ID);
  const [freeText, setFreeText] = useState("");
  const [committedText, setCommittedText] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  // [linguo-patch:watch-video-only-v1] Katalog kini khusus video landscape — Shorts
  // (klip vertikal pendek) disingkirkan sepenuhnya (lihat filter orientasi di shownVideos).
  // [linguo-patch:watch-duration-filter-v1] Filter durasi: semua / <5 / 5–10 / 10–20 mnt.
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");
  // [linguo-patch:watch-level-filter-v1] Filter level CEFR (hanya tab "Siap"). Client-side.
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  // Penanda buat memicu re-hitung filter tiap kali orientasi baru terdeteksi
  // (orientCache mutable di module scope, bukan dependency React).
  const [orientTick, setOrientTick] = useState(0);
  // Berapa kartu yang ditampilkan sekarang (paginasi client-side). Mulai 2 baris.
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  // [watch-ready-badge-v1] videoId yang transkripnya sudah tersimpan → kartu di
  // tab kategori dapat centang hijau "subtitle siap". Di tab "Terjemahan Siap"
  // tak dipakai (semua isinya memang sudah siap).
  const [readyIds, setReadyIds] = useState<Set<string>>(new Set());

  const [videos, setVideos] = useState<ImmersionVideo[]>(boot.hit?.videos ?? []);
  const [nextToken, setNextToken] = useState<string | undefined>(boot.hit?.nextToken);
  // [watch-shuffle-v1] Sort order yang dipakai batch aktif. `nextToken` cuma sah
  // buat order yang melahirkannya, jadi "Muat lainnya" harus meneruskan yang ini —
  // bukan mengundi ulang.
  const [order, setOrder] = useState<CatalogOrder>(boot.hit?.order ?? "relevance");
  const [state, setState] = useState<"idle" | "loading" | "more" | "done" | "empty" | "error">(
    boot.hit?.videos.length ? "done" : "idle"
  );
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  // Dropdown pemilih bahasa GABUNGAN (bahasa saya + bahasa yang dipelajari) di
  // bilah menu — muncul saat hover.
  const [learnMenuOpen, setLearnMenuOpen] = useState(false);
  const [langQuery, setLangQuery] = useState("");
  // Riwayat bahasa terakhir dipilih (kode, terbaru dulu) — quick-pick di picker.
  const [recentLangs, setRecentLangs] = useState<string[]>([]);
  // Jumlah video "Siap" per bahasa → badge di pemilih bahasa. Dimuat sekali di mount.
  const [readyCounts, setReadyCounts] = useState<Record<string, number>>({});
  // Bahasa terjemahan di bawah subtitle ("kamu bicara bahasa apa?"). `basePickerOpen`
  // = picker biasa (bisa ditutup); `baseFirstOpen` = tanya pertama kali (wajib pilih).
  const [baseLang, setBaseLang] = useState(DEFAULT_BASE_LANG);
  const [basePickerOpen, setBasePickerOpen] = useState(false);
  const [baseFirstOpen, setBaseFirstOpen] = useState(false);
  const [active, setActive] = useState<ImmersionVideo | null>(null);
  const [activeLang, setActiveLang] = useState("en");
  // Detik awal pemutaran saat dibuka dari "Cari Kata" (lompat ke momen kata).
  const [activeStart, setActiveStart] = useState<number | undefined>(undefined);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  // ── Cari Kata (YouGlish) ──
  const [wordInput, setWordInput] = useState("");
  const [wordResults, setWordResults] = useState<WordHit[]>([]);
  const [wordState, setWordState] = useState<"idle" | "loading" | "done" | "empty">("idle");
  const wordReqId = useRef(0);
  const [deckOpen, setDeckOpen] = useState(false);
  const [vocabCount, setVocabCount] = useState(0);

  // Watch & Learn WAJIB login dashboard LMS. `null` = sesi masih dicek (tampilkan
  // spinner); `false` = tamu → dilempar ke /akun (layar login); `true` = render.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  const lang = getImmersionLang(langCode) ?? IMMERSION_LANGS[0];
  const cat =
    IMMERSION_CATEGORIES.find((c) => c.id === category) ?? IMMERSION_CATEGORIES[0];

  // Analitik WL: dwell di katalog, sesi nonton video, & buka dashboard Kosakata.
  // Tiap event dibubuhi bahasa yang sedang dibuka (katalog = bahasa yang dijelajahi,
  // player = bahasa video yang diputar) supaya dashboard bisa menjawab "bahasa apa
  // yang paling sering ditonton", bukan cuma "fitur apa yang paling sering dibuka".
  const catalogLangProps = useMemo(() => wlLangProps(langCode), [langCode]);
  const playerLangProps = useMemo(
    () => ({
      ...wlLangProps(activeLang),
      video_id: active?.videoId,
      video_title: active?.title ? active.title.slice(0, 80) : undefined,
    }),
    [activeLang, active]
  );
  useWlPanel("watch_catalog", true, catalogLangProps);
  useWlPanel("watch_player", active !== null, playerLangProps);
  useWlPanel("watch_kosakata", deckOpen, catalogLangProps);
  // Denyut "masih di sini" → kartu Aktif sekarang di dashboard admin. `watching`
  // membedakan yang benar-benar memutar video dari yang cuma buka katalog.
  useWlHeartbeat(loggedIn === true, {
    ...(active ? playerLangProps : catalogLangProps),
    watching: active ? 1 : 0,
  });

  // "Lanjut Menonton" hanya menampilkan riwayat bahasa yang sedang dipelajari —
  // saat belajar bahasa Inggris, video Spanyol dll tak ikut muncul.
  const shownHistory = useMemo(
    () => history.filter((h) => h.lang === langCode),
    [history, langCode]
  );

  // [linguo-patch:watch-orient-frame0-v1] Katalog khusus landscape: deteksi orientasi
  // asli tiap video via frame0.jpg (sekali per videoId, hasilnya di-cache) supaya klip
  // portrait/Shorts bisa disaring keluar dari grid.
  useEffect(() => {
    // [perf:watch-orient-persist-v1] Cukup periksa kartu yang memang sedang
    // ditampilkan. Satu batch katalog berisi ~2× isi grid (cadangan "Muat
    // lainnya"), dan dulu SEMUANYA diperiksa di muka — puluhan request untuk
    // kartu yang belum kelihatan, tepat saat halaman sedang sibuk melukis.
    // Diberi kelebihan satu-dua baris: kartu yang lolos filter durasi/level bisa
    // menggeser posisi, jadi batas persis `visible` bisa meleset sedikit.
    const pending = videos
      .slice(0, visible + GRID_COLS * 2)
      .filter((v) => !orientCache.has(v.videoId));
    if (!pending.length) return;
    let cancelled = false;
    pending.forEach((v) => {
      const img = new Image();
      // Thumbnail yang dilihat user duluan; deteksi orientasi boleh mengalah.
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "low";
      img.onload = () => {
        orientCache.set(v.videoId, img.naturalHeight > img.naturalWidth);
        if (!cancelled) setOrientTick((n) => n + 1);
      };
      // frame0 tak tersedia → biarkan tak terdeteksi; filter jatuh ke fallback durasi.
      img.onerror = () => {
        if (!cancelled) setOrientTick((n) => n + 1);
      };
      img.src = frame0Url(v.videoId);
    });
    return () => {
      cancelled = true;
    };
  }, [videos, visible]);

  // [linguo-patch:watch-orient-frame0-v1] Terapkan filter jenis konten ke grid.
  // Prioritas orientasi asli (frame0); selama deteksi belum selesai / frame0 gagal,
  // pakai proxy durasi sebagai fallback (≤60 dtk → Shorts). Video tanpa durasi
  // dianggap landscape sementara, tapi begitu frame0 resolve, penilaian dikoreksi.
  const shownVideos = useMemo(() => {
    const dur = DURATION_FILTERS.find((d) => d.id === durationFilter) ?? DURATION_FILTERS[0];
    // Filter level hanya relevan di tab "Siap" (satu-satunya sumber estimasi level).
    // Di tab lain video dari YouTube tak punya level → jangan ikut menyaring.
    const siapMode = category === SIAP_ID && !committedText.trim();
    // Tahap 1: filter yang DIPILIH pengguna secara eksplisit (durasi & level).
    // Kalau ini yang mengosongkan grid, empty-state "Tak ada video cocok filter"
    // memang tepat — user tinggal longgarkan filternya.
    const base = videos.filter((v) => {
      // Filter durasi (rentang [min, max) detik; tanpa durasi hanya lolos di "Semua").
      if (durationFilter !== "all") {
        if (v.duration == null || v.duration < dur.min || v.duration >= dur.max) return false;
      }
      // Filter level CEFR (tab "Siap"): sisakan video yang levelnya persis terpilih.
      if (siapMode && levelFilter !== "all" && v.level !== levelFilter) return false;
      return true;
    });
    // Tahap 2: buang portrait/Shorts pakai orientasi asli frame0 → fallback proxy durasi.
    // Video durasi null dianggap landscape sementara sampai frame0 resolve.
    const landscape = base.filter((v) => {
      const portrait = orientCache.get(v.videoId);
      if (portrait !== undefined) return !portrait;
      return v.duration == null || v.duration > SHORTS_MAX_SEC;
    });
    // [linguo-patch:watch-orient-nonempty-v1] frame0 rapuh (bisa placeholder/timeout,
    // atau server sesekali meloloskan Shorts yang lalu dibuang habis di client) →
    // JANGAN sampai heuristik orientasi mengosongkan seluruh grid. Kalau semua kebuang,
    // kembalikan hasil lolos durasi/level apa adanya (pola sama filterVideosByLanguage:
    // "kalau semua kebuang, balikin daftar asli"). User tetap dapat sesuatu ketimbang
    // empty-state palsu; begitu SATU landscape terdeteksi, penyaringan Shorts jalan lagi.
    return landscape.length ? landscape : base;
    // orientTick sengaja jadi dependency: memicu re-filter tiap orientasi baru masuk cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos, orientTick, durationFilter, levelFilter, category, committedText]);

  // [watch-ready-badge-v1] Tanyakan ke cache transkrip: dari kartu yang SEDANG
  // tampak, mana yang subtitle-nya sudah siap → centang hijau. Cuma untuk tab
  // kategori/pencarian (di tab "Terjemahan Siap" semuanya siap, jadi centangnya
  // mubazir). Best-effort & di-memo per bahasa di lib, jadi scroll/"Muat lainnya"
  // hanya menanyakan id yang benar-benar baru.
  useEffect(() => {
    if (category === SIAP_ID && !committedText.trim()) return;
    const ids = shownVideos.slice(0, visible).map((v) => v.videoId);
    if (!ids.length) return;
    let alive = true;
    void fetchReadyFlags(ids, langCode).then((hit) => {
      if (!alive || !hit.size) return;
      setReadyIds((prev) => {
        let added = false;
        const next = new Set(prev);
        for (const id of hit) if (!next.has(id)) { next.add(id); added = true; }
        return added ? next : prev;
      });
    });
    return () => {
      alive = false;
    };
  }, [shownVideos, visible, langCode, category, committedText]);


  // Hidrasi riwayat (bahasa target sudah dibaca sinkron di `boot`) saat mount.
  useEffect(() => {
    const saved: string | null = boot.code;
    try {
      const rawRecent = window.localStorage.getItem(RECENT_LANGS_KEY);
      if (rawRecent) {
        const parsed = JSON.parse(rawRecent);
        if (Array.isArray(parsed)) {
          setRecentLangs(
            parsed
              .filter((c): c is string => typeof c === "string" && !!getImmersionLang(c))
              .slice(0, RECENT_LANGS_MAX)
          );
        }
      }
      const rawSearch = window.localStorage.getItem(SEARCH_HISTORY_KEY);
      if (rawSearch) {
        const parsed = JSON.parse(rawSearch);
        if (Array.isArray(parsed)) {
          setSearchHistory(
            parsed
              .filter((q): q is string => typeof q === "string" && !!q.trim())
              .slice(0, SEARCH_HISTORY_MAX)
          );
        }
      }
    } catch {
      /* abaikan */
    }
    // Bahasa terjemahan: pulihkan pilihan, atau tanya kalau ini pertama kali.
    const storedBase = getStoredBaseLang();
    if (storedBase) {
      // Jangan biarkan terjemahan == bahasa yang dipelajari (mis. dua-duanya
      // Indonesia). Geser otomatis biar terjemahan tetap masuk akal.
      const target = saved && getImmersionLang(saved) ? saved : "en";
      if (storedBase === target) {
        const fallback = target === "en" ? "id" : "en";
        setBaseLang(fallback);
        storeBaseLang(fallback);
      } else {
        setBaseLang(storedBase);
      }
    } else setBaseFirstOpen(true);
    const hist = getWatchHistory();
    setHistory(hist);
    // [linguo-patch:watch-resume-refresh-v1] URL bawa ?v= → refresh terjadi saat
    // menonton: pulihkan player-nya, jangan mentalkan siswa ke katalog.
    try {
      const params = new URLSearchParams(window.location.search);
      const vid = params.get("v");
      if (vid) {
        const h = hist.find((x) => x.videoId === vid);
        const vl = params.get("vl") || h?.lang || saved || "en";
        setActive(
          h
            ? { videoId: h.videoId, title: h.title, thumbnail: h.thumbnail,
                channel: h.channel, duration: h.duration }
            : { videoId: vid, title: "", thumbnail: null }
        );
        setActiveLang(getImmersionLang(vl) ? vl : "en");
        /* [watch-lanjut-menit-v1] `?t=` (detik) menang kalau ada — kartu "Lanjutkan
           Belajar" mengirimnya supaya titik lanjutnya tetap benar walau riwayat di
           perangkat ini sudah dipangkas. Kalau tak ada, pakai catatan riwayat. */
        const detik = Number(params.get("t"));
        const mulai = Number.isFinite(detik) && detik > 5 ? detik : getWatchPosition(vid);
        setActiveStart(mulai > 0 ? mulai : undefined);
      }
      // URL bawa ?kosakata=1 → refresh terjadi saat dashboard Kosakata terbuka:
      // buka lagi overlay flashcard, jangan mentalkan siswa ke katalog Watch & Learn.
      if (params.get("kosakata") === "1") setDeckOpen(true);
    } catch {
      /* abaikan — URL aneh, tampilkan katalog seperti biasa */
    }
  }, [boot.code]);

  // Sinkronkan status buka dashboard Kosakata ke URL (?kosakata=1) — pakai
  // replaceState (bukan push) supaya buka/tutup tak menumpuk history; efeknya
  // REFRESH saat dashboard terbuka mengembalikan ke dashboard, bukan ke katalog.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const u = new URL(window.location.href);
      if (deckOpen) u.searchParams.set("kosakata", "1");
      else u.searchParams.delete("kosakata");
      window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
    } catch {
      /* URL diblokir — abaikan */
    }
  }, [deckOpen]);

  // Badge Kosakata menghitung kata bahasa aktif saja — konsisten dengan deck
  // yang default filter ke bahasa yang sedang ditonton. Recompute tiap ganti bahasa.
  const refreshVocab = useCallback(
    () => setVocabCount(getSavedWords().filter((w) => w.langCode === langCode).length),
    [langCode]
  );
  useEffect(() => {
    refreshVocab();
  }, [refreshVocab]);
  // Badge juga ikut event perubahan kosakata (impor deck, tab lain, simpan kata dari
  // player) supaya angkanya tak pernah basi.
  useEffect(() => onSavedWordsChanged(refreshVocab), [refreshVocab]);

  // [perf:watch-split-player-v1] Begitu browser menganggur (katalog sudah tampil
  // & thumbnail sudah jalan), tarik diam-diam chunk player + flashcard. Jadi
  // pemisahan chunk cuma memindahkan unduhannya ke waktu yang tak dilihat user,
  // bukan menambah jeda saat kartu pertama diklik.
  useEffect(() => {
    const idle: (cb: () => void) => number =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback ?? ((cb) => window.setTimeout(cb, 1500));
    const id = idle(() => {
      void import("./VideoLearnPlayer");
      void import("./FlashcardDeck");
    });
    return () => {
      const cancel = (window as unknown as { cancelIdleCallback?: (h: number) => void })
        .cancelIdleCallback;
      if (cancel) cancel(id);
      else window.clearTimeout(id);
    };
  }, []);

  // Muat jumlah video "Siap" per bahasa sekali di mount → badge di pemilih bahasa.
  useEffect(() => {
    let alive = true;
    fetchReadyCounts().then((c) => {
      if (alive) setReadyCounts(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Gate login: cek sesi di mount; tamu langsung dialihkan ke /akun (layar login).
  // Hanya SIGNED_OUT (atau vonis tegas dari Auth server) yang boleh melempar user
  // keluar — lihat resolveSessionForGate() di supabase-client.
  //
  // Pengecualian staf: kalau user login adalah owner/admin Linguo (profiles.role),
  // buka akses penuh (setWatchStaff) supaya tim internal bebas gate langganan —
  // isWatchPremium() ikut true di seluruh player tanpa mengubah call site gate.
  useEffect(() => {
    let alive = true;
    // Asal "dari dashboard admin": link katalog admin membawa ?admin=1 → buka akses
    // penuh (staf) tanpa gate langganan, tanpa bergantung pada profiles.role. Flag
    // disimpan di sessionStorage supaya tetap terbuka saat navigasi/refresh tab ini,
    // lalu param di-strip dari URL agar link tak ikut kebagikan sebagai bypass.
    let adminOrigin = false;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("admin") === "1") {
        adminOrigin = true;
        window.sessionStorage.setItem("linguo:watch:adminOrigin:v1", "1");
        const u = new URL(window.location.href);
        u.searchParams.delete("admin");
        window.history.replaceState(
          window.history.state, "", u.pathname + u.search + u.hash
        );
      } else {
        adminOrigin =
          window.sessionStorage.getItem("linguo:watch:adminOrigin:v1") === "1";
      }
    } catch {
      /* storage/URL diblokir — abaikan, jatuh ke cek role biasa */
    }
    const syncStaff = async (
      userId: string | undefined,
      email: string | null | undefined,
    ) => {
      // Dari dashboard admin → selalu staf; cek role tak boleh menurunkannya.
      if (adminOrigin) return void setWatchStaff(true);
      // Email di daftar akses penuh cuma-cuma → langsung staf tanpa cek role.
      if (isWatchCompedEmail(email)) return void setWatchStaff(true);
      if (!userId) return void setWatchStaff(false);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        if (!alive) return;
        setWatchStaff(data?.role === "owner" || data?.role === "admin");
      } catch {
        if (alive) setWatchStaff(false);
      }
    };
    // Tamu → layar login /akun, bawa ?next=<halaman ini> supaya balik ke tempat
    // yang sama (termasuk ?v=<video> kalau sedang nonton) setelah login.
    const toLogin = () => {
      const here = window.location.pathname + window.location.search;
      window.location.replace(`/akun?next=${encodeURIComponent(here || "/watch")}`);
    };
    const admit = (user: { id: string; email: string | null } | null) => {
      if (!alive) return;
      setLoggedIn(true);
      syncStaff(user?.id, user?.email);
    };
    const evict = () => {
      if (!alive) return;
      setLoggedIn(false);
      setWatchStaff(false);
      toLogin();
    };
    // [preview-session-v1] POV siswa dari dashboard admin (/watch?preview=<id>)
    // tidak punya sesi login sama sekali — tanpa jalan keluar ini gate-nya melempar
    // staf ke layar masuk dan sesi pratinjaunya ikut hilang. Param URL TIDAK
    // dipercaya begitu saja: keabsahannya ditanyakan ke endpoint pratinjau yang
    // mewajibkan cookie httpOnly terbitan /api/preview-start.
    const verifyPreview = async () => {
      const pid = new URLSearchParams(window.location.search).get("preview");
      if (!pid || !/^[0-9a-f-]{36}$/i.test(pid)) return false;
      try {
        const res = await fetch(`/api/preview-student?id=${encodeURIComponent(pid)}`, { cache: "no-store" });
        return res.ok;
      } catch {
        return false;
      }
    };

    let subscription: { unsubscribe: () => void } | null = null;
    // [perf:session-cookie-peek-v1] Buka gate duluan dari identitas di cookie:
    // getSession() antre di Web Locks / bisa refresh token ke jaringan dulu, dan
    // selama itu SELURUH katalog ketutup spinner — itu yang bikin klik "Watch &
    // Learn" dari dashboard terasa lambat. Jawaban getSession() tetap yang final.
    //
    // [perf:watch-boot-v1] Dibaca dari peekSessionCookie(), bukan peekSessionUser():
    // yang terakhir sengaja menolak cookie ber-access-token kedaluwarsa — padahal
    // itu keadaan NORMAL tiap refresh setelah sejam, dan justru di situ tukar token
    // paling lama. Hasilnya dulu: layar spinner penuh selama SDK menukar token.
    // Kehadiran refresh token di cookie sudah cukup untuk membuka katalog; kalau
    // ternyata tokennya ditolak, resolveSessionForGate() di bawah yang menutupnya.
    const peeked = peekSessionCookie();
    if (peeked?.refresh_token && peeked.user) {
      setLoggedIn(true);
      syncStaff(peeked.user.id, peeked.user.email);
    }
    (async () => {
      if (await verifyPreview()) {
        if (!alive) return;
        // Pratinjau = akses penuh katalog (staf), tanpa sesi & tanpa gate langganan.
        setLoggedIn(true);
        setWatchStaff(true);
        return;
      }
      if (!alive) return;
      // [auth-gate-resilient-v1] "Buka Watch & Learn dari dashboard, di-refresh,
      // malah mendarat di layar masuk." Akarnya: gate ini dulu menerima
      // `session: null` mentah-mentah — padahal pas hard refresh (beda dengan
      // pindah halaman biasa yang memakai klien yang sama di memori) SDK harus
      // membaca cookie & menukar refresh token dulu, dan jawaban sesaatnya null.
      // resolveSessionForGate() yang memutuskan: dia coba ulang + tebus sesi dari
      // cookie, dan cuma menyerah kalau Auth server memang menolak tokennya.
      const verdict = await resolveSessionForGate();
      if (!alive) return;
      if (verdict.session || verdict.uncertain) admit(verdict.user);
      else evict();
      subscription = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          return admit(
            session.user?.id
              ? { id: session.user.id, email: session.user.email ?? null }
              : null,
          );
        }
        // Cuma SIGNED_OUT yang benar-benar berarti user keluar. INITIAL_SESSION
        // yang balapan / TOKEN_REFRESHED gagal sesaat juga datang tanpa sesi —
        // dulu keduanya ikut melempar user ke layar masuk.
        if (event === "SIGNED_OUT") evict();
      }).data.subscription;
    })();
    return () => {
      alive = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Tombol Back (browser/in-app) saat nonton video → tutup player, balik ke
  // Watch & Learn, BUKAN keluar halaman. Dorong satu entri history pas video
  // dibuka; popstate menutup player. Kalau ditutup lewat tombol X, entri kita
  // dikonsumsi balik biar history tetap rapi.
  // Key ke buka/tutup (bukan `active`) supaya ganti video via rekomendasi tidak
  // memicu cleanup → history.back → popstate yang malah menutup player.
  const playerOpen = active != null;
  useEffect(() => {
    if (!playerOpen) return;
    // [linguo-patch:watch-resume-refresh-v1] Setelah refresh, entri history sesi
    // sebelumnya (state watchModal) masih hidup — jangan dorong dobel.
    if (!window.history.state?.watchModal) {
      window.history.pushState({ watchModal: true }, "");
    }
    const onPop = () => {
      setActive(null);
      // Bersihkan ?v= yang mungkin ikut di entri tujuan (kasus buka via link
      // langsung) — biar refresh berikutnya tak membuka player yang sudah ditutup.
      stripWatchParams();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (window.history.state?.watchModal) {
        // back() asinkron; strip param di entri tujuan begitu popstate-nya tiba.
        window.addEventListener("popstate", stripWatchParams, { once: true });
        window.history.back();
      } else {
        stripWatchParams();
      }
    };
  }, [playerOpen]);

  // [linguo-patch:watch-resume-refresh-v1] Tulis video aktif ke URL. replaceState
  // (bukan push) supaya pindah-pindah video via rekomendasi tak menumpuk history —
  // Back tetap sekali tekan untuk keluar dari mode menonton.
  useEffect(() => {
    if (!active) return;
    const u = new URL(window.location.href);
    u.searchParams.set("v", active.videoId);
    u.searchParams.set("vl", activeLang);
    /* [watch-lanjut-menit-v1] `t=` cuma tiket sekali pakai dari kartu "Lanjutkan
       Belajar". Dibiarkan menempel, refresh setengah jam kemudian akan memutar ulang
       dari detik lama itu — padahal riwayat sudah punya posisi yang lebih baru. */
    u.searchParams.delete("t");
    window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
  }, [active, activeLang]);

  // Token buat membatalkan hasil fetch yang ketinggalan (bahasa/kategori keburu ganti).
  const reqId = useRef(0);

  const runSearch = useCallback(
    // [perf:watch-catalog-cache-v1] silent=true → refresh diam-diam (grid dari cache
    // sudah tampil, jangan diganti spinner).
    async (l: ImmersionLang, c: ImmersionCategory, text: string, durId: DurationFilter, silent = false) => {
      const id = ++reqId.current;
      if (!silent) {
        setState("loading");
        setVideos([]);
        setNextToken(undefined);
      }
      // [watch-batch-20-v1] Batch pertama langsung sebanyak grid awal (20 kartu =
      // 4 baris) — hasil sudah disaring ke bahasa target + rentang durasi tab aktif
      // dan disebar antar channel di dalam fetchCatalogBatch.
      // [watch-shuffle-v1] Ambil POOL_FACTOR× lipat: 20 kartu pertama ditampilkan,
      // sisanya jadi cadangan "Muat lainnya" — dan karena kolamnya diacak, tiap
      // muat ulang memunculkan potongan yang berbeda.
      let ord = pickOrder(c);
      let { results, nextToken: tok } = await fetchCatalogBatch({
        lang: l, cat: c, text, durId, want: INITIAL_VISIBLE * POOL_FACTOR, order: ord,
      });
      if (id !== reqId.current) return; // hasil basi — abaikan
      // [watch-shuffle-v1] Order alternatif (mis. viewCount) kadang miskin hasil di
      // bahasa/kategori tertentu → grid bisa cuma separuh baris. Kalau kurang dari
      // satu layar penuh, ulangi sekali pakai `relevance` (kolam paling gemuk) biar
      // 20 kartu tetap kekejar. Server cache-nya sudah panas → nyaris tanpa kuota.
      if (results.length < INITIAL_VISIBLE && ord !== "relevance") {
        const fb = await fetchCatalogBatch({
          lang: l, cat: c, text, durId, want: INITIAL_VISIBLE * POOL_FACTOR, order: "relevance",
        });
        if (id !== reqId.current) return;
        if (fb.results.length > results.length) {
          ord = "relevance";
          results = fb.results;
          tok = fb.nextToken;
        }
      }
      // [perf:watch-catalog-persist-v1] Refresh diam-diam yang pulang kosong
      // (jaringan/kuota) TIDAK boleh menghapus grid yang sudah tampil dari cache —
      // user akan melihat katalog penuh mendadak jadi "tak ada video".
      if (silent && !results.length) return;
      catalogCache.set(catalogKeyOf(l.code, buildQuery(c, l, text), durId), {
        videos: results, nextToken: tok, order: ord, at: Date.now(),
      });
      setVideos(results);
      setNextToken(tok);
      setOrder(ord);
      setState(results.length ? "done" : "empty");
      // Hangatkan cache transkrip di background biar subtitle + terjemahan
      // "langsung muncul" saat video mana pun di grid diklik (tak nunggu ASR ~1 mnt).
      prewarmTranscripts(results, l.code);
    },
    []
  );

  // Tab "Siap" — baca video ber-transkrip dari cache (instan, tanpa kuota YouTube).
  const loadReady = useCallback(async (l: ImmersionLang, silent = false) => {
    const id = ++reqId.current;
    if (!silent) {
      setState("loading");
      setVideos([]);
      setNextToken(undefined);
    }
    const ready = await fetchReadyVideos(l.code);
    // [perf:watch-catalog-persist-v1] Penyegaran diam-diam yang pulang kosong
    // (endpoint timeout) jangan menimpa grid dari cache dengan layar "kosong".
    if (silent && !ready.length) return;
    catalogCache.set(catalogKeyOf(l.code, SIAP_ID), { videos: ready, at: Date.now() });
    if (id !== reqId.current) return;
    setVideos(ready);
    setState(ready.length ? "done" : "empty");
    // Kartu "Terjemahan Siap" lahir dari cache transkrip DB → tak bawa jumlah
    // penonton. Enrich dengan viewCount live dari YouTube (mode `ids` yt-search,
    // 1 unit kuota, di-cache 6 jam) supaya badge views ikut muncul. Best-effort:
    // gagal → kartu tetap tampil tanpa views.
    if (ready.length) {
      const stats = await fetchVideoStats(ready.map((v) => v.videoId));
      if (id !== reqId.current || stats.size === 0) return;
      const enriched = ready.map((v) => {
        const s = stats.get(v.videoId);
        return s ? { ...v, views: s.views, duration: v.duration ?? s.duration } : v;
      });
      catalogCache.set(catalogKeyOf(l.code, SIAP_ID), { videos: enriched, at: Date.now() });
      setVideos(enriched);
    }
  }, []);

  // Apakah tab "Siap" sedang aktif (dan bukan sedang mencari teks bebas).
  const readyMode = category === SIAP_ID && !committedText.trim();
  // Apakah tab "Cari Kata" (YouGlish) sedang aktif.
  const wordMode = category === WORD_ID;

  // Muat ulang tiap bahasa / kategori / teks yang di-commit berubah.
  // [perf:watch-catalog-cache-v1] cache-first: keluar-masuk halaman/menu → grid muncul
  // instan dari cache module-level; kalau cache masih segar (<TTL) fetch dilewati,
  // kalau basi di-refresh diam-diam di belakang layar.
  useEffect(() => {
    // Tab "Cari Kata" tak memuat grid video — pencarian kata ditangani terpisah.
    if (category === WORD_ID) return;
    const siap = category === SIAP_ID && !committedText.trim();
    // Tab "Siap" tak ikut filter durasi server (baca cache DB, disaring di client),
    // jadi kuncinya tak menyertakan durationFilter → tak fetch ulang saat toggle.
    const key = siap
      ? catalogKeyOf(langCode, SIAP_ID)
      : catalogKeyOf(langCode, buildQuery(cat, lang, committedText), durationFilter);
    const hit = catalogCache.get(key);
    if (hit) {
      reqId.current++; // batalkan fetch lama yang mungkin masih jalan
      setVideos(hit.videos);
      setNextToken(hit.nextToken);
      setOrder(hit.order ?? "relevance");
      setState(hit.videos.length ? "done" : "empty");
      // Tab "Siap" baca cache transkrip DB kita sendiri (murah, tanpa kuota
      // YouTube) → SELALU refresh diam-diam biar video yang transkripnya baru
      // selesai langsung muncul saat balik ke tab ini, tak nunggu TTL 10 menit.
      // Katalog pencarian (kena kuota YouTube) tetap hormati TTL biar hemat.
      if (!siap && Date.now() - hit.at < CATALOG_TTL_MS) return; // masih segar
    }
    if (siap) loadReady(lang, !!hit);
    else runSearch(lang, cat, committedText, durationFilter, !!hit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langCode, category, committedText, durationFilter]);

  // Balikkan tampilan ke 2 baris tiap daftar/​filter berganti (bukan saat loadMore,
  // yang cuma menambah `videos` tanpa mengubah key di bawah).
  useEffect(() => {
    setVisible(INITIAL_VISIBLE);
  }, [langCode, category, committedText, durationFilter]);

  const loadMore = useCallback(async () => {
    if (!nextToken || state === "more") return;
    const id = reqId.current;
    setState("more");
    // [watch-batch-20-v1] Tiap klik "Muat lainnya" = 20 video BARU (bukan 10),
    // dedup terhadap yang sudah tampil & disebar antar channel.
    const { results: more, nextToken: tok } = await fetchCatalogBatch({
      lang, cat, text: committedText, durId: durationFilter,
      want: LOAD_MORE_COUNT,
      pageToken: nextToken,
      order,
      exclude: new Set(videos.map((v) => v.videoId)),
    });
    if (id !== reqId.current) return;
    setVideos((prev) => {
      const seen = new Set(prev.map((v) => v.videoId));
      const merged = [...prev, ...more.filter((v) => !seen.has(v.videoId))];
      // [perf:watch-catalog-cache-v1] hasil "Muat lainnya" ikut ke cache biar balik lagi utuh
      catalogCache.set(catalogKeyOf(lang.code, buildQuery(cat, lang, committedText), durationFilter), {
        videos: merged, nextToken: tok, order, at: Date.now(),
      });
      return merged;
    });
    setNextToken(tok);
    setState("done");
    prewarmTranscripts(more, lang.code);
  }, [nextToken, state, cat, lang, committedText, durationFilter, videos, order]);

  // "Muat lainnya": tampilkan 1 baris berikutnya dari yang sudah dimuat; kalau
  // stok lokal habis & masih ada halaman server, ambil dari server lalu buka.
  const showMore = useCallback(() => {
    if (visible < shownVideos.length) setVisible((n) => n + LOAD_MORE_COUNT);
    else if (nextToken) {
      setVisible((n) => n + LOAD_MORE_COUNT);
      loadMore();
    }
  }, [visible, shownVideos.length, nextToken, loadMore]);

  // [watch-batch-20-v1] Filter client (orientasi/Shorts) kadang menyisakan grid
  // kurang dari 20 kartu walau servernya sudah mengirim 20+. Susul otomatis
  // sekali-dua kali biar barisnya penuh, tapi berhenti di situ supaya kuota
  // YouTube tak terkuras kalau bahasanya memang miskin konten.
  const autofill = useRef(0);
  useEffect(() => {
    autofill.current = 0;
  }, [langCode, category, committedText, durationFilter]);
  useEffect(() => {
    if (state !== "done" || readyMode || wordMode) return;
    if (!nextToken || shownVideos.length >= visible) return;
    if (autofill.current >= AUTOFILL_MAX) return;
    autofill.current++;
    loadMore();
  }, [state, readyMode, wordMode, nextToken, shownVideos.length, visible, loadMore]);

  const pickLang = useCallback((code: string) => {
    setLangCode(code);
    // Bahasa terjemahan ("kamu bicara apa") tak boleh sama dengan bahasa yang
    // dipelajari — mis. pilih belajar Indonesia tapi terjemahan juga Indonesia
    // tak masuk akal. Kalau bentrok, geser otomatis: belajar Inggris → terjemahan
    // Indonesia, selain itu → Inggris.
    setBaseLang((prevBase) => {
      if (code !== prevBase) return prevBase;
      const fallback = code === "en" ? "id" : "en";
      storeBaseLang(fallback);
      return fallback;
    });
    setLangPickerOpen(false);
    setLangQuery("");
    // Ganti bahasa → buang teks pencarian lama. Tanpa ini query "learn khmer"
    // (mis.) tetap nempel & mendominasi hasil YouTube; filter aksara tak bisa
    // menolaknya untuk bahasa Latin (judul Inggris lolos) → grid nampilin bahasa
    // lain walau bendera sudah ganti. Reset biar balik ke katalog kurasi bahasa.
    setFreeText("");
    setCommittedText("");
    // Catat ke riwayat: pindahkan/masukkan `code` ke depan, buang duplikat, batasi.
    setRecentLangs((prev) => {
      const next = [code, ...prev.filter((c) => c !== code)].slice(0, RECENT_LANGS_MAX);
      try {
        window.localStorage.setItem(RECENT_LANGS_KEY, JSON.stringify(next));
      } catch {
        /* abaikan */
      }
      return next;
    });
    try {
      window.localStorage.setItem(LANG_KEY, code);
    } catch {
      /* abaikan */
    }
  }, []);

  const pickBase = useCallback((code: string) => {
    setBaseLang(code);
    storeBaseLang(code);
    setBasePickerOpen(false);
    setBaseFirstOpen(false);
  }, []);

  const openVideo = useCallback(
    (v: ImmersionVideo, forLang: string, startAt?: number) => {
      setActive(v);
      setActiveLang(forLang);
      /* [watch-lanjut-menit-v1] Tanpa titik mulai yang diminta pemanggil (mis. klik
         baris transkrip), video dibuka DARI DETIK TERAKHIR ditonton. Membuka ulang
         video 20 menit dari detik 0 bukan "lanjut menonton". */
      setActiveStart((startAt ?? getWatchPosition(v.videoId)) || undefined);
      const next = pushWatchHistory({
        videoId: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail,
        channel: v.channel,
        duration: v.duration,
        // [lanjutkan-watch-level-v1] Level ikut dicatat supaya kartu "Lanjutkan
        // Belajar" di Beranda bisa memasang badge levelnya tanpa menghitung ulang.
        level: v.level ?? null,
        lang: forLang,
        ts: Date.now(),
      });
      setHistory(next);
    },
    []
  );

  // Simpan kata kunci ke riwayat (dedup case-insensitive, terbaru dulu).
  const pushSearchHistory = useCallback((raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setSearchHistory((prev) => {
      const next = [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(
        0,
        SEARCH_HISTORY_MAX
      );
      try {
        window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* abaikan */
      }
      return next;
    });
  }, []);

  const removeSearchHistory = useCallback((q: string) => {
    setSearchHistory((prev) => {
      const next = prev.filter((x) => x !== q);
      try {
        window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* abaikan */
      }
      return next;
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      window.localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      /* abaikan */
    }
  }, []);

  const onSearchSubmit = useCallback(() => {
    setCommittedText(freeText);
    pushSearchHistory(freeText);
    setSearchFocused(false);
  }, [freeText, pushSearchHistory]);

  // Pilih dari riwayat: isi kotak + langsung cari.
  const applySearchHistory = useCallback(
    (q: string) => {
      setFreeText(q);
      setCommittedText(q);
      pushSearchHistory(q);
      setSearchFocused(false);
    },
    [pushSearchHistory]
  );

  // Riwayat yang ditampilkan di dropdown: kalau sedang mengetik, saring yang cocok.
  const shownSearchHistory = useMemo(() => {
    const q = freeText.trim().toLowerCase();
    if (!q) return searchHistory;
    return searchHistory.filter((x) => x.toLowerCase().includes(q) && x.toLowerCase() !== q);
  }, [searchHistory, freeText]);

  // Cari Kata (YouGlish): cari `wordInput` di transkrip katalog bahasa aktif.
  const runWordSearch = useCallback(async () => {
    const q = wordInput.trim();
    if (q.length < 2) {
      setWordResults([]);
      setWordState("idle");
      return;
    }
    const id = ++wordReqId.current;
    setWordState("loading");
    const hits = await searchWordInVideos(q, langCode);
    if (id !== wordReqId.current) return; // pencarian lebih baru sudah jalan
    setWordResults(hits);
    setWordState(hits.length ? "done" : "empty");
  }, [wordInput, langCode]);

  // Ganti bahasa saat di tab Cari Kata → kosongkan hasil lama (bahasa beda).
  useEffect(() => {
    wordReqId.current++;
    setWordResults([]);
    setWordState("idle");
  }, [langCode]);

  // Objek bahasa untuk chip "Terakhir dipilih" (hanya saat tak sedang mencari).
  const recentLangObjs = useMemo(
    () =>
      recentLangs
        .map((c) => getImmersionLang(c))
        .filter((l): l is NonNullable<typeof l> => !!l),
    [recentLangs]
  );

  const filteredLangs = useMemo(() => {
    const q = langQuery.trim().toLowerCase();
    if (!q) return IMMERSION_LANGS;
    return IMMERSION_LANGS.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q) ||
        l.code.includes(q)
    );
  }, [langQuery]);

  // Cuma hapus riwayat bahasa aktif (yang sedang tampil), bukan semua bahasa.
  const clearHistory = useCallback(() => {
    setHistory(clearWatchHistory(langCode));
  }, [langCode]);

  // Gate login: selama sesi belum pasti (null) atau tamu (false, sedang dialihkan
  // ke /akun), jangan render katalog — cukup spinner biar konten tak sempat bocor.
  if (loggedIn !== true) {
    return (
      <main
        style={{ backgroundColor: BG, minHeight: "100vh" }}
        className="flex items-center justify-center text-white"
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: TEAL, borderTopColor: "transparent" }}
        />
      </main>
    );
  }

  return (
    <main style={{ backgroundColor: BG, minHeight: "100vh" }} className="text-white">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6">
        {/* Top bar — balik ke dashboard siswa (/akun), bukan beranda publik.
            Melayang (sticky) saat scroll: Kosakata + tombol bahasa tetap terjangkau
            di kanan atas tanpa harus scroll balik ke puncak. z-40 di bawah modal
            pemilih bahasa (z-80) supaya dialog tetap di atas. */}
        <div
          className="sticky top-0 z-40 -mx-4 flex items-center justify-between px-4 py-3 sm:-mx-6 sm:px-6"
          style={{ backgroundColor: BG, borderBottom: `1px solid ${BORDER}` }}
        >
          <Link
            href="/akun"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: SUB }}
          >
            <ArrowLeft className="h-4 w-4" /> {t("Dashboard")}
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeckOpen(true)}
              title={t("Kosakata")}
              aria-label={t("Kosakata")}
              className="group inline-flex items-center rounded-full px-3 py-1.5 text-sm font-bold transition-transform active:scale-95"
              style={{ backgroundColor: CARD }}
            >
              <Layers className="h-4 w-4 shrink-0" color={TEAL} />
              <RevealLabel>{t("Kosakata")}</RevealLabel>
              {vocabCount > 0 && (
                <span
                  className="ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-extrabold leading-none"
                  style={{ backgroundColor: "rgba(26,158,158,0.2)", color: "#7FE0E0" }}
                >
                  {vocabCount}
                </span>
              )}
            </button>
            {/* Pemilih bahasa GABUNGAN — satu tombol menampilkan dua bendera
                dipisah "/": kiri = bahasa saya (terjemahan), kanan = bahasa yang
                dipelajari. Hover → satu dropdown dengan dua section ("Bahasa
                saya" + "Bahasa target"). Bridge `pt-2` menutup celah trigger↔panel
                supaya kursor tak jatuh keluar saat mengarah. */}
            <div
              className="relative"
              onMouseEnter={() => setLearnMenuOpen(true)}
              onMouseLeave={() => setLearnMenuOpen(false)}
            >
              <button
                onClick={() => setLearnMenuOpen((v) => !v)}
                title={`${getBaseLangDef(baseLang).label} → ${lang.name}`}
                aria-label={`${t("Bahasa saya")} ${getBaseLangDef(baseLang).label}, ${t("bahasa yang dipelajari")} ${lang.name}`}
                aria-expanded={learnMenuOpen}
                className="group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-bold transition-transform active:scale-95"
                style={{ backgroundColor: CARD }}
              >
                <RectFlag code={getBaseLangDef(baseLang).country} h={16} />
                <span className="text-white/35">/</span>
                <RectFlag code={lang.country} h={16} />
              </button>
              <div
                className={`absolute right-0 top-full z-30 pt-2 transition-all duration-150 ease-out ${
                  learnMenuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
                }`}
              >
                <LangPickerPanel
                  open={learnMenuOpen}
                  langCode={langCode}
                  onPick={(code) => {
                    setLearnMenuOpen(false);
                    pickLang(code);
                  }}
                  recentCodes={recentLangs}
                  readyCounts={readyCounts}
                  baseLangs={BASE_LANGS}
                  baseLangCode={baseLang}
                  onPickBase={(code) => pickBase(code)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mt-6 flex items-center gap-3.5">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
            style={{ background: "linear-gradient(135deg, #FF4D6A, #E60028)" }}
          >
            <Play className="h-6 w-6" fill="#fff" color="#fff" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Watch &amp; Learn</h1>
            <p className="mt-0.5 text-[13px] sm:text-sm" style={{ color: SUB }}>
              {t("Belajar bahasa dari konten yang kamu suka")}
            </p>
          </div>
        </div>

        {/* Search box (pencarian video) — disembunyikan di tab Cari Kata yang
            punya kotak pencarian kata sendiri. */}
        {!wordMode && (
          <div className="relative mt-6">
            <div
              className="flex items-center gap-2.5 rounded-2xl px-4"
              style={{ backgroundColor: CARD }}
            >
              <Search className="h-4 w-4 shrink-0" color={SUB} />
              <input
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSearchSubmit();
                  else if (e.key === "Escape") setSearchFocused(false);
                }}
                placeholder={`${t("Cari video dalam bahasa")} ${lang.name}…`}
                className="flex-1 bg-transparent py-3.5 text-[15px] text-white outline-none placeholder:text-white/35"
              />
              {(freeText || committedText) && (
                <button
                  onClick={() => {
                    setFreeText("");
                    setCommittedText("");
                  }}
                  className="shrink-0 transition-opacity hover:opacity-70"
                  aria-label={t("Hapus pencarian")}
                >
                  <X className="h-4 w-4" color={SUB} />
                </button>
              )}
            </div>

            {/* Riwayat pencarian — muncul saat kotak fokus & ada riwayat. */}
            {searchFocused && shownSearchHistory.length > 0 && (
              <div
                className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                style={{ backgroundColor: CARD }}
              >
                <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: SUB }}>
                    {t("Pencarian terakhir")}
                  </span>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={clearSearchHistory}
                    className="text-[11px] font-bold transition-opacity hover:opacity-70"
                    style={{ color: SUB }}
                  >
                    {t("Hapus semua")}
                  </button>
                </div>
                <ul className="pb-1.5">
                  {shownSearchHistory.map((q) => (
                    <li key={q} className="group flex items-center">
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applySearchHistory(q)}
                        className="flex flex-1 items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5"
                      >
                        <Clock3 className="h-4 w-4 shrink-0" color={SUB} />
                        <span className="truncate text-[14px] text-white">{q}</span>
                      </button>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => removeSearchHistory(q)}
                        className="shrink-0 px-3 py-2.5 opacity-60 transition-opacity hover:opacity-100"
                        aria-label={`${t("Hapus")} "${q}" ${t("dari riwayat")}`}
                      >
                        <X className="h-3.5 w-3.5" color={SUB} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Continue watching */}
        {shownHistory.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold">{t("Lanjut Menonton")}</h2>
              <button
                onClick={clearHistory}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold transition-opacity hover:opacity-70"
                style={{ color: SUB }}
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("Hapus")}
              </button>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {shownHistory.map((h) => (
                <button
                  key={h.videoId}
                  onClick={() =>
                    openVideo(
                      {
                        videoId: h.videoId,
                        title: h.title,
                        thumbnail: h.thumbnail,
                        channel: h.channel,
                        duration: h.duration,
                      },
                      h.lang
                    )
                  }
                  className="group w-[180px] shrink-0 text-left"
                >
                  <Thumb videoId={h.videoId} thumbnail={h.thumbnail} duration={h.duration} />
                  <p className="mt-2 line-clamp-2 text-[12.5px] font-bold leading-snug">
                    {h.title}
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: SUB }}>
                    {getImmersionLang(h.lang)?.flag} {getImmersionLang(h.lang)?.name ?? h.lang}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Category chips */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold">
            {wordMode ? (
              <>
                <TextSearch className="mr-1 inline h-4 w-4 align-text-bottom" color={GOLD} /> {t("Cari Kata")}
              </>
            ) : (
              <>
                <span style={{ color: GOLD }}>✨</span> {t("Rekomendasi untukmu")}
              </>
            )}
          </h2>
          {!wordMode && (
            <button
              onClick={() => (readyMode ? loadReady(lang) : runSearch(lang, cat, committedText, durationFilter))}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-opacity hover:opacity-80"
              style={{ backgroundColor: "rgba(26,158,158,0.14)", color: TEAL }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> {t("Muat ulang")}
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Tab "Siap" — video yang subtitle-nya langsung muncul (sudah diproses). */}
          <button
            onClick={() => setCategory(SIAP_ID)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors"
            style={{
              backgroundColor: category === SIAP_ID ? TEAL : CARD,
              color: category === SIAP_ID ? "#fff" : "rgba(255,255,255,0.8)",
            }}
          >
            <CircleCheck className="h-4 w-4" />
            {t("Terjemahan Siap")}
          </button>
          {/* Tab "Cari Kata" (ala YouGlish) — cari cara pakai kata di kalimat video. */}
          <button
            onClick={() => setCategory(WORD_ID)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors"
            style={{
              backgroundColor: category === WORD_ID ? GOLD : CARD,
              color: category === WORD_ID ? "#1A1205" : "rgba(255,255,255,0.8)",
            }}
          >
            <TextSearch className="h-4 w-4" />
            {t("Cari Kata")}
          </button>
          {CATEGORY_TABS.map((c) => {
            const on = c.id === category;
            const Icon = CATEGORY_ICONS[c.id];
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors"
                style={{
                  backgroundColor: on ? TEAL : CARD,
                  color: on ? "#fff" : "rgba(255,255,255,0.8)",
                }}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {t(c.label)}
              </button>
            );
          })}
        </div>

        {/* [watch-cue-search-v1] Panel Cari Kata (YouGlish): kotak kata + hasil kalimat. */}
        {wordMode && (
          <div className="mt-5">
            <div
              className="flex items-center gap-2.5 rounded-2xl px-4"
              style={{ backgroundColor: CARD }}
            >
              <TextSearch className="h-4 w-4 shrink-0" color={GOLD} />
              <input
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runWordSearch();
                }}
                placeholder={`${t("Ketik kata dalam bahasa")} ${lang.name}…`}
                className="flex-1 bg-transparent py-3.5 text-[15px] text-white outline-none placeholder:text-white/35"
              />
              {wordInput && (
                <button
                  onClick={() => {
                    setWordInput("");
                    setWordResults([]);
                    setWordState("idle");
                    wordReqId.current++;
                  }}
                  className="shrink-0 transition-opacity hover:opacity-70"
                  aria-label={t("Hapus")}
                >
                  <X className="h-4 w-4" color={SUB} />
                </button>
              )}
              <button
                onClick={runWordSearch}
                disabled={wordInput.trim().length < 2}
                className="shrink-0 rounded-xl px-4 py-2 text-[13px] font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: GOLD, color: "#1A1205" }}
              >
                {t("Cari")}
              </button>
            </div>
            <p className="mt-2 text-[12.5px]" style={{ color: SUB }}>
              {t("Lihat cara sebuah kata dipakai di kalimat nyata dari video katalog. Klik hasil untuk lompat ke momen kata itu diucapkan.")}
            </p>

            {wordState === "loading" && (
              <div
                className="mt-8 flex items-center justify-center gap-2 text-[13px]"
                style={{ color: SUB }}
              >
                <Loader2 className="h-4 w-4 animate-spin" /> {t("Mencari…")}
              </div>
            )}

            {wordState === "idle" && (
              <div className="mt-10 text-center text-[13px]" style={{ color: SUB }}>
                {t("Ketik sebuah kata lalu tekan Enter untuk melihat contohnya di video.")}
              </div>
            )}

            {wordState === "empty" && (
              <div
                className="mt-6 rounded-2xl p-6 text-center"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
              >
                <p className="text-[15px] font-bold">{t("Tidak ketemu di katalog")}</p>
                <p className="mx-auto mt-1 max-w-md text-[13px]" style={{ color: SUB }}>
                  {t("Kata")} “{wordInput.trim()}” {t("belum ada di transkrip video")} {lang.name} {t("yang tersimpan. Coba kata lain, atau tambah videonya ke katalog dulu.")}
                </p>
              </div>
            )}

            {wordState === "done" && (
              <div className="mt-5 space-y-2.5">
                <p className="text-[12.5px] font-bold" style={{ color: SUB }}>
                  {wordResults.length} {t("contoh ditemukan")}
                </p>
                {wordResults.map((h, i) => {
                  const parts = highlightParts(h.target, wordInput.trim());
                  const lvl =
                    h.level && CEFR_STYLE[h.level as CefrLevel]
                      ? CEFR_STYLE[h.level as CefrLevel]
                      : null;
                  return (
                    <button
                      key={`${h.videoId}-${h.start}-${i}`}
                      onClick={() =>
                        openVideo(
                          {
                            videoId: h.videoId,
                            title: h.title,
                            thumbnail: youtubeThumb(h.videoId),
                            channel: h.channel,
                            level: (h.level as CefrLevel) ?? null,
                          },
                          langCode,
                          h.start
                        )
                      }
                      className="flex w-full gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-white/5"
                      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                    >
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={youtubeThumb(h.videoId)}
                          alt=""
                          className="h-[54px] w-[96px] rounded-lg object-cover"
                        />
                        <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded bg-black/75 px-1 py-0.5 text-[10px] font-bold text-white">
                          <Clock3 className="h-2.5 w-2.5" /> {fmtStamp(h.start)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold leading-snug text-white">
                          {parts.map((p, j) =>
                            p.hit ? (
                              <mark
                                key={j}
                                className="rounded px-0.5"
                                style={{ backgroundColor: "rgba(244,183,64,0.28)", color: GOLD }}
                              >
                                {p.text}
                              </mark>
                            ) : (
                              <span key={j}>{p.text}</span>
                            )
                          )}
                        </p>
                        {h.base && (
                          <p className="mt-1 line-clamp-2 text-[12.5px]" style={{ color: SUB }}>
                            {h.base}
                          </p>
                        )}
                        <p
                          className="mt-1.5 line-clamp-1 flex items-center gap-1.5 text-[11.5px]"
                          style={{ color: SUB }}
                        >
                          {lvl && (
                            <span
                              className="rounded px-1 py-0.5 text-[10px] font-bold"
                              style={{ backgroundColor: lvl.bg, color: lvl.fg }}
                            >
                              {h.level}
                            </span>
                          )}
                          <Play className="h-3 w-3 shrink-0" color={GOLD} />
                          <span className="truncate">{h.title}</span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!wordMode && (
        <>
        {/* [linguo-patch:watch-duration-filter-v1] Filter durasi: Semua / <5 / 5–10 / 10–20 mnt.
            Hanya muncul di tab rekomendasi (kategori) — disembunyikan di "Terjemahan Siap"
            (yang pakai filter Level) & "Cari Kata". */}
        {!readyMode && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {DURATION_FILTERS.map((d) => {
              const on = durationFilter === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDurationFilter(d.id)}
                  className="rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors"
                  style={{
                    backgroundColor: on ? TEAL : CARD,
                    color: on ? "#fff" : "rgba(255,255,255,0.7)",
                  }}
                >
                  {t(d.label)}
                </button>
              );
            })}
          </div>
        )}

        {/* [linguo-patch:watch-level-filter-v1] Filter level CEFR — hanya tab "Siap"
            (video di sana yang punya estimasi level). Chip aktif memakai warna levelnya. */}
        {readyMode && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold" style={{ color: SUB }}>
              {t("Level")}:
            </span>
            {LEVEL_FILTERS.map((lv) => {
              const on = levelFilter === lv;
              const style = lv !== "all" ? CEFR_STYLE[lv] : null;
              return (
                <button
                  key={lv}
                  onClick={() => {
                    setLevelFilter(lv);
                    setVisible(INITIAL_VISIBLE);
                  }}
                  className="rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors"
                  style={{
                    backgroundColor: on ? (style ? style.bg : TEAL) : CARD,
                    color: on ? (style ? style.fg : "#fff") : "rgba(255,255,255,0.7)",
                  }}
                >
                  {lv === "all" ? t("Semua") : lv}
                </button>
              );
            })}
          </div>
        )}

        {/* Grid video */}
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {state === "loading"
            ? Array.from({ length: INITIAL_VISIBLE }).map((_, i) => <CardSkeleton key={i} />)
            : shownVideos.slice(0, visible).map((v) => (
                <button key={v.videoId} onClick={() => openVideo(v, lang.code)} className="group text-left">
                  <Thumb
                    videoId={v.videoId}
                    thumbnail={v.thumbnail}
                    duration={v.duration}
                    level={v.level}
                  />
                  <p className="mt-2 line-clamp-2 text-[13px] font-bold leading-snug">{v.title}</p>
                  {(v.channel || v.views != null || readyIds.has(v.videoId)) && (
                    <p
                      className="mt-0.5 line-clamp-1 flex items-center gap-1 text-[11.5px]"
                      style={{ color: SUB }}
                    >
                      {readyIds.has(v.videoId) && (
                        <CircleCheck
                          className="h-3.5 w-3.5 shrink-0"
                          color="#22C55E"
                          aria-label={t("Subtitle siap")}
                        />
                      )}
                      {v.channel && <span className="truncate">{v.channel}</span>}
                      {v.channel && v.views != null && <span aria-hidden>·</span>}
                      {v.views != null && (
                        <span className="inline-flex shrink-0 items-center gap-0.5">
                          <Eye className="h-3 w-3" />
                          {formatViews(v.views)}
                        </span>
                      )}
                    </p>
                  )}
                </button>
              ))}
        </div>

        {/* Grid kosong gara-gara filter (jenis konten / durasi), bukan hasil server nihil
            → arahkan balik ke setelan longgar. */}
        {state !== "loading" && videos.length > 0 && shownVideos.length === 0 && (
          <div
            className="mt-6 rounded-2xl p-6 text-center"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-[15px] font-bold">{t("Tak ada video cocok filter di halaman ini")}</p>
            <p className="mx-auto mt-1 max-w-md text-[13px]" style={{ color: SUB }}>
              {t("Longgarkan filter durasi/level, muat lainnya, atau ganti kategori.")}
            </p>
            <button
              onClick={() => {
                setDurationFilter("all");
                setLevelFilter("all");
              }}
              className="mt-3 rounded-full px-4 py-2 text-[12.5px] font-bold"
              style={{ backgroundColor: "rgba(26,158,158,0.14)", color: TEAL }}
            >
              {t("Reset filter")}
            </button>
          </div>
        )}

        {/* Empty / error state */}
        {state === "empty" && (
          <div
            className="mt-6 rounded-2xl p-6 text-center"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
          >
            {readyMode ? (
              <>
                <p className="text-[15px] font-bold">{t("Belum ada video siap")}</p>
                <p className="mx-auto mt-1 max-w-md text-[13px]" style={{ color: SUB }}>
                  {t("Tonton beberapa video dari kategori lain dulu. Begitu subtitle + terjemahannya selesai diproses, video otomatis muncul di sini — dan langsung tampil instan buat siapa pun yang membukanya.")}
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-bold">{t("Belum ada video ketemu")}</p>
                <p className="mx-auto mt-1 max-w-md text-[13px]" style={{ color: SUB }}>
                  {t("Coba kategori lain, ganti bahasa, atau muat ulang. Katalog cuma menampilkan video pendek (≤20 menit) & terbatas kuota harian YouTube — beberapa saat lagi biasanya kembali penuh.")}
                </p>
              </>
            )}
          </div>
        )}

        {/* Muat lainnya — muncul kalau masih ada sisa lokal ATAU halaman server. */}
        {state !== "loading" && videos.length > 0 && shownVideos.length > 0 &&
          (visible < shownVideos.length || nextToken) && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={showMore}
              disabled={state === "more"}
              className="rounded-full px-6 py-3 text-sm font-bold transition-transform active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            >
              {state === "more" ? t("Memuat…") : t("Muat lainnya")}
            </button>
          </div>
        )}
        </>
        )}
      </div>

      {/* Language picker */}
      {langPickerOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(4,7,8,0.7)" }}
          onClick={() => setLangPickerOpen(false)}
        >
          <div
            className="flex max-h-[76vh] w-full max-w-md flex-col overflow-hidden rounded-3xl"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <p className="text-[15px] font-bold">{t("Pilih bahasa")}</p>
              <button onClick={() => setLangPickerOpen(false)} aria-label={t("Tutup")}>
                <X className="h-5 w-5" color={SUB} />
              </button>
            </div>
            <div
              className="mx-5 mt-3 flex items-center gap-2.5 rounded-xl px-3.5"
              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
            >
              <Search className="h-4 w-4" color={SUB} />
              <input
                value={langQuery}
                onChange={(e) => setLangQuery(e.target.value)}
                placeholder={t("Cari bahasa…")}
                autoFocus
                className="flex-1 bg-transparent py-3 text-[14px] text-white outline-none placeholder:text-white/35"
              />
            </div>
            {!langQuery.trim() && recentLangObjs.length > 0 && (
              <div className="mt-3 px-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: SUB }}>
                  {t("Terakhir dipilih")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recentLangObjs.map((l) => {
                    const on = l.code === langCode;
                    return (
                      <button
                        key={l.code}
                        onClick={() => pickLang(l.code)}
                        className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-transform active:scale-95"
                        style={{
                          backgroundColor: on ? "rgba(26,158,158,0.16)" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${on ? "rgba(26,158,158,0.4)" : BORDER}`,
                        }}
                      >
                        <RectFlag code={l.country} h={16} />
                        <span className="text-[13px] font-bold">{l.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mt-2 flex-1 overflow-y-auto px-2.5 pb-3">
              {filteredLangs.map((l) => {
                const on = l.code === langCode;
                return (
                  <button
                    key={l.code}
                    onClick={() => pickLang(l.code)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
                    style={{ backgroundColor: on ? "rgba(26,158,158,0.16)" : "transparent" }}
                  >
                    <RectFlag code={l.country} h={22} />
                    <span className="flex-1">
                      <span className="block text-[15px] font-bold">{l.name}</span>
                      <span className="block text-[11.5px]" style={{ color: SUB }}>
                        {l.native}
                      </span>
                    </span>
                    {on && <Check className="h-5 w-5" color={TEAL} />}
                  </button>
                );
              })}
              {filteredLangs.length === 0 && (
                <p className="px-3 py-6 text-center text-[13px]" style={{ color: SUB }}>
                  {t("Tidak ada bahasa cocok.")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bahasa terjemahan ("kamu bicara bahasa apa?") — tanya pertama kali (wajib
          pilih, tak bisa ditutup) atau ganti kapan saja lewat tombol di header. */}
      {(basePickerOpen || baseFirstOpen) && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(4,7,8,0.8)" }}
          onClick={() => !baseFirstOpen && setBasePickerOpen(false)}
        >
          <div
            className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5">
              <div>
                <p className="text-[16px] font-bold">{t("Kamu bicara bahasa apa?")}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: SUB }}>
                  {t("Terjemahan di bawah subtitle akan ditampilkan dalam bahasa ini. Bisa diganti kapan saja lewat tombol bendera di atas.")}
                </p>
              </div>
              {!baseFirstOpen && (
                <button onClick={() => setBasePickerOpen(false)} aria-label={t("Tutup")} className="shrink-0">
                  <X className="h-5 w-5" color={SUB} />
                </button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1.5 px-2.5 pb-4 sm:grid-cols-2">
              {/* Sembunyikan bahasa yang sedang dipelajari — terjemahan ke bahasa
                  yang sama tak masuk akal. */}
              {BASE_LANGS.filter((b) => b.code !== langCode).map((b) => {
                const on = b.code === baseLang;
                return (
                  <button
                    key={b.code}
                    onClick={() => pickBase(b.code)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
                    style={{
                      backgroundColor: on ? "rgba(244,183,64,0.16)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${on ? "rgba(244,183,64,0.4)" : BORDER}`,
                    }}
                  >
                    <RectFlag code={b.country} h={20} />
                    <span className="flex-1">
                      <span className="block text-[14.5px] font-bold">{b.label}</span>
                      <span className="block text-[11px]" style={{ color: SUB }}>
                        {b.english}
                      </span>
                    </span>
                    {on && <Check className="h-4 w-4" color={GOLD} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Player belajar — video + transkrip dwibahasa + analisa + tap kata */}
      {active && (
        <VideoLearnPlayer
          video={active}
          langCode={activeLang}
          baseLang={baseLang}
          initialStart={activeStart}
          recommendations={videos.filter((v) => v.videoId !== active.videoId)}
          onSelectVideo={(v) => openVideo(v, lang.code)}
          onClose={() => setActive(null)}
          // Ganti bahasa yang dipelajari saat menonton → tutup player & buka pemilih
          // bahasa; setelah dipilih, beranda Watch & Learn tampil dgn bahasa baru.
          // Fallback perangkat sentuh (dropdown hover tak bisa di-hover).
          onChangeLang={() => {
            setActive(null);
            setLangPickerOpen(true);
          }}
          // Pilih bahasa langsung dari dropdown hover di header player → tutup video
          // & pindah ke katalog bahasa baru (tanpa mampir pop-up).
          onPickLang={(code) => {
            setActive(null);
            pickLang(code);
          }}
          recentLangCodes={recentLangs}
          // Ganti bahasa terjemahan langsung dari header player (tanpa tutup video).
          onChangeBaseLang={(code) => {
            setBaseLang(code);
            storeBaseLang(code);
          }}
          onOpenVocab={() => setDeckOpen(true)}
          onSavedChange={refreshVocab}
        />
      )}

      {/* Flashcard kosakata tersimpan */}
      {deckOpen && (
        <FlashcardDeck
          // Dibuka dari player (video sedang tayang) → default ke bahasa VIDEO
          // (activeLang), bukan bahasa katalog (langCode) yang bisa berbeda saat
          // user membuka video hasil pencarian di bahasa lain. Kalau tidak, kata
          // yang baru disimpan (langCode = bahasa video) tampak "hilang" karena
          // dashboard memfilter ke bahasa katalog. Dari bilah katalog → langCode.
          initialLang={active ? activeLang : langCode}
          onClose={() => {
            setDeckOpen(false);
            refreshVocab();
          }}
          onChange={refreshVocab}
        />
      )}
    </main>
  );
}

function Thumb({
  videoId,
  thumbnail,
  duration,
  level,
}: {
  videoId: string;
  thumbnail: string | null;
  duration?: number | null;
  level?: CefrLevel | null;
}) {
  const durLabel = formatDuration(duration);
  const lvlStyle = level ? CEFR_STYLE[level] : null;
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ paddingTop: "56.25%", backgroundColor: CARD }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnail ?? youtubeThumb(videoId)}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
      />
      {/* Badge level CEFR (estimasi dari transkrip) — hanya video tab "Siap". */}
      {level && lvlStyle && (
        <span
          className="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10.5px] font-extrabold leading-none"
          style={{ backgroundColor: lvlStyle.bg, color: lvlStyle.fg }}
          title={tr("Perkiraan level bahasa dari transkrip")}
        >
          {level}
        </span>
      )}
      {durLabel && (
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
          {durLabel}
        </span>
      )}
      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
          <Play className="h-4 w-4" fill="#10201f" color="#10201f" />
        </span>
      </span>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div>
      <div
        className="w-full animate-pulse rounded-xl"
        style={{ paddingTop: "56.25%", backgroundColor: CARD }}
      />
      <div className="mt-2 h-3 w-4/5 animate-pulse rounded" style={{ backgroundColor: CARD }} />
      <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded" style={{ backgroundColor: CARD }} />
    </div>
  );
}
