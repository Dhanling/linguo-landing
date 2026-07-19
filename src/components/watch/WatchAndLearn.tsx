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
  getSavedWords,
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
import { supabase } from "@/lib/supabase-client";
import { CEFR_STYLE, type CefrLevel } from "@/lib/cefr";
import { RectFlag } from "@/components/RectFlag";
import VideoLearnPlayer from "./VideoLearnPlayer";
import FlashcardDeck from "./FlashcardDeck";
import { LangPickerPanel } from "./LangPickerPanel";

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
// [linguo-patch:watch-orient-toggle-v1] Ambang pemisah Shorts vs Video landscape.
// Shorts YouTube praktis selalu ≤60 dtk & vertikal; klip landscape (adegan film,
// TV, wawancara) di katalog umumnya lebih panjang. Bukan deteksi aspect ratio
// sempurna (API tak sediakan), tapi proxy durasi ini cocok utk mayoritas kasus.
const SHORTS_MAX_SEC = 60;
// Layout grid: 5 kartu per baris di desktop (grid lg:grid-cols-5). Default tampil
// 1 baris (GRID_COLS) biar halaman tak kepanjangan; tiap klik "Muat lainnya"
// menambah 2 baris lagi (LOAD_MORE_COUNT = 2 × GRID_COLS).
const GRID_COLS = 5;
const LOAD_MORE_COUNT = GRID_COLS * 2;

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
const orientCache = new Map<string, boolean>();
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
  window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
}

// [perf:watch-catalog-cache-v1] Cache katalog module-level: pindah menu lalu balik
// ke Watch & Learn → grid tampil instan tanpa nembak yt-search lagi. Kunci per
// (bahasa, query); TTL 10 menit — lewat itu tampilkan cache dulu, refresh diam-diam.
const catalogCache = new Map<string, { videos: ImmersionVideo[]; nextToken?: string; at: number }>();
const CATALOG_TTL_MS = 10 * 60 * 1000;
// Kunci cache memuat filter durasi: tiap tab ("< 5", "5–10", "10–20") kini fetch
// bucket YouTube berbeda (short/medium), jadi hasilnya tak boleh saling menimpa.
const catalogKeyOf = (langCode: string, q: string, dur = "all") => `${langCode}|${dur}|${q}`;

// Rentang durasi (detik) yang dikirim ke yt-search untuk sebuah tab filter.
// "Semua" tetap dibatasi ke katalog ≤20 mnt; sisanya kirim min & max eksplisit
// agar server membias hasil ke bucket durasi yang benar (bukan Shorts semua).
function durRange(id: DurationFilter): { min: number; max: number } {
  const d = DURATION_FILTERS.find((x) => x.id === id) ?? DURATION_FILTERS[0];
  return { min: d.min, max: d.max === Infinity ? CATALOG_MAX_DURATION_SEC : d.max };
}

export default function WatchAndLearn() {
  // Bahasa target — disimpan di localStorage biar konsisten antar kunjungan.
  const [langCode, setLangCode] = useState("en");
  const [category, setCategory] = useState(SIAP_ID);
  const [freeText, setFreeText] = useState("");
  const [committedText, setCommittedText] = useState("");
  // [linguo-patch:watch-video-only-v1] Katalog kini khusus video landscape — Shorts
  // (klip vertikal pendek) disingkirkan sepenuhnya (lihat filter orientasi di shownVideos).
  // [linguo-patch:watch-duration-filter-v1] Filter durasi: semua / <5 / 5–10 / 10–20 mnt.
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");
  // [linguo-patch:watch-level-filter-v1] Filter level CEFR (hanya tab "Siap"). Client-side.
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  // Penanda buat memicu re-hitung filter tiap kali orientasi baru terdeteksi
  // (orientCache mutable di module scope, bukan dependency React).
  const [orientTick, setOrientTick] = useState(0);
  // Berapa kartu yang ditampilkan sekarang (paginasi client-side). Mulai 1 baris.
  const [visible, setVisible] = useState(GRID_COLS);

  const [videos, setVideos] = useState<ImmersionVideo[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [state, setState] = useState<"idle" | "loading" | "more" | "done" | "empty" | "error">(
    "idle"
  );
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  // Dropdown "bahasa yang dipelajari" di bilah menu — muncul saat hover.
  const [learnMenuOpen, setLearnMenuOpen] = useState(false);
  // Dropdown "bahasa terjemahan" (I speak) — juga hover, senada learn selector.
  const [baseMenuOpen, setBaseMenuOpen] = useState(false);
  const [langQuery, setLangQuery] = useState("");
  // Riwayat bahasa terakhir dipilih (kode, terbaru dulu) — quick-pick di picker.
  const [recentLangs, setRecentLangs] = useState<string[]>([]);
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
    const pending = videos.filter((v) => !orientCache.has(v.videoId));
    if (!pending.length) return;
    let cancelled = false;
    pending.forEach((v) => {
      const img = new Image();
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
  }, [videos]);

  // [linguo-patch:watch-orient-frame0-v1] Terapkan filter jenis konten ke grid.
  // Prioritas orientasi asli (frame0); selama deteksi belum selesai / frame0 gagal,
  // pakai proxy durasi sebagai fallback (≤60 dtk → Shorts). Video tanpa durasi
  // dianggap landscape sementara, tapi begitu frame0 resolve, penilaian dikoreksi.
  const shownVideos = useMemo(() => {
    const dur = DURATION_FILTERS.find((d) => d.id === durationFilter) ?? DURATION_FILTERS[0];
    // Filter level hanya relevan di tab "Siap" (satu-satunya sumber estimasi level).
    // Di tab lain video dari YouTube tak punya level → jangan ikut menyaring.
    const siapMode = category === SIAP_ID && !committedText.trim();
    return videos.filter((v) => {
      // Filter durasi (rentang [min, max) detik; tanpa durasi hanya lolos di "Semua").
      if (durationFilter !== "all") {
        if (v.duration == null || v.duration < dur.min || v.duration >= dur.max) return false;
      }
      // Filter level CEFR (tab "Siap"): sisakan video yang levelnya persis terpilih.
      if (siapMode && levelFilter !== "all" && v.level !== levelFilter) return false;
      // Hanya landscape: orientasi asli frame0 → fallback proxy durasi. Video portrait
      // (Shorts) disingkirkan; yang durasinya null dianggap landscape sementara sampai
      // frame0 resolve.
      const portrait = orientCache.get(v.videoId);
      if (portrait !== undefined) return !portrait;
      return v.duration == null || v.duration > SHORTS_MAX_SEC;
    });
    // orientTick sengaja jadi dependency: memicu re-filter tiap orientasi baru masuk cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos, orientTick, durationFilter, levelFilter, category, committedText]);

  // Hidrasi bahasa tersimpan + riwayat tonton saat mount.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(LANG_KEY);
      if (saved && getImmersionLang(saved)) setLangCode(saved);
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
      }
    } catch {
      /* abaikan — URL aneh, tampilkan katalog seperti biasa */
    }
  }, []);

  // Badge Kosakata menghitung kata bahasa aktif saja — konsisten dengan deck
  // yang default filter ke bahasa yang sedang ditonton. Recompute tiap ganti bahasa.
  const refreshVocab = useCallback(
    () => setVocabCount(getSavedWords().filter((w) => w.langCode === langCode).length),
    [langCode]
  );
  useEffect(() => {
    refreshVocab();
  }, [refreshVocab]);

  // Gate login: cek sesi di mount; tamu langsung dialihkan ke /akun (layar login).
  // onAuthStateChange menjaga kalau sesi berakhir saat halaman terbuka.
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
    const gate = (
      session: { user?: { id?: string; email?: string | null } } | null,
    ) => {
      if (!alive) return;
      const hasSession = !!session;
      setLoggedIn(hasSession);
      // Tamu → layar login /akun, bawa ?next=/watch supaya balik ke sini setelah login.
      if (!hasSession) {
        setWatchStaff(false);
        window.location.replace("/akun?next=%2Fwatch");
        return;
      }
      syncStaff(session?.user?.id, session?.user?.email);
    };
    supabase.auth
      .getSession()
      .then(({ data }) => gate(data.session))
      .catch(() => gate(null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => gate(session)
    );
    return () => {
      alive = false;
      subscription.unsubscribe();
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
      const q = buildQuery(c, l, text);
      // [linguo-patch:watch-duration-server-bucket-v1] Kirim rentang durasi tab
      // aktif ke server. Tab "5–10"/"10–20 mnt" → bucket `medium` YouTube; tanpa
      // ini `videoDuration=any` membanjiri halaman dgn Shorts → grid selalu kosong.
      const { min, max } = durRange(durId);
      const page = await searchImmersionVideos({
        query: q,
        language: l.searchCode ?? l.code,
        order: c.news || c.fresh ? "date" : undefined,
        max: 18,
        maxDurationSec: max,
        minDurationSec: min || undefined,
        regionCode: l.region,
      });
      if (id !== reqId.current) return; // hasil basi — abaikan
      // Saring ke bahasa target biar audio & subtitle-nya beneran cocok, lalu buang
      // sisa video di luar rentang (jaga-jaga kalau durasi tak terbaca di server).
      const results = filterVideosByLanguage(page.results, l.code).filter(
        (v) => !v.duration || v.duration <= max
      );
      catalogCache.set(catalogKeyOf(l.code, buildQuery(c, l, text), durId), {
        videos: results, nextToken: page.nextPageToken, at: Date.now(),
      });
      setVideos(results);
      setNextToken(page.nextPageToken);
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

  // Balikkan tampilan ke 1 baris tiap daftar/​filter berganti (bukan saat loadMore,
  // yang cuma menambah `videos` tanpa mengubah key di bawah).
  useEffect(() => {
    setVisible(GRID_COLS);
  }, [langCode, category, committedText, durationFilter]);

  const loadMore = useCallback(async () => {
    if (!nextToken || state === "more") return;
    const id = reqId.current;
    setState("more");
    const q = buildQuery(cat, lang, committedText);
    const { min, max } = durRange(durationFilter);
    const page = await searchImmersionVideos({
      query: q,
      language: lang.searchCode ?? lang.code,
      order: cat.news || cat.fresh ? "date" : undefined,
      max: 18,
      pageToken: nextToken,
      maxDurationSec: max,
      minDurationSec: min || undefined,
      regionCode: lang.region,
    });
    if (id !== reqId.current) return;
    const more = filterVideosByLanguage(page.results, lang.code).filter(
      (v) => !v.duration || v.duration <= max
    );
    setVideos((prev) => {
      const seen = new Set(prev.map((v) => v.videoId));
      const merged = [...prev, ...more.filter((v) => !seen.has(v.videoId))];
      // [perf:watch-catalog-cache-v1] hasil "Muat lainnya" ikut ke cache biar balik lagi utuh
      catalogCache.set(catalogKeyOf(lang.code, buildQuery(cat, lang, committedText), durationFilter), {
        videos: merged, nextToken: page.nextPageToken, at: Date.now(),
      });
      return merged;
    });
    setNextToken(page.nextPageToken);
    setState("done");
    prewarmTranscripts(more, lang.code);
  }, [nextToken, state, cat, lang, committedText, durationFilter]);

  // "Muat lainnya": tampilkan 1 baris berikutnya dari yang sudah dimuat; kalau
  // stok lokal habis & masih ada halaman server, ambil dari server lalu buka.
  const showMore = useCallback(() => {
    if (visible < shownVideos.length) setVisible((n) => n + LOAD_MORE_COUNT);
    else if (nextToken) {
      setVisible((n) => n + LOAD_MORE_COUNT);
      loadMore();
    }
  }, [visible, shownVideos.length, nextToken, loadMore]);

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
      setActiveStart(startAt);
      const next = pushWatchHistory({
        videoId: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail,
        channel: v.channel,
        duration: v.duration,
        lang: forLang,
        ts: Date.now(),
      });
      setHistory(next);
    },
    []
  );

  const onSearchSubmit = useCallback(() => {
    setCommittedText(freeText);
  }, [freeText]);

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
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeckOpen(true)}
              title="Kosakata"
              aria-label="Kosakata"
              className="group inline-flex items-center rounded-full px-3 py-1.5 text-sm font-bold transition-transform active:scale-95"
              style={{ backgroundColor: CARD }}
            >
              <Layers className="h-4 w-4 shrink-0" color={TEAL} />
              <RevealLabel>Kosakata</RevealLabel>
              {vocabCount > 0 && (
                <span
                  className="ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-extrabold leading-none"
                  style={{ backgroundColor: "rgba(26,158,158,0.2)", color: "#7FE0E0" }}
                >
                  {vocabCount}
                </span>
              )}
            </button>
            {/* Bahasa terjemahan ("I speak") — bendera + dropdown HOVER, senada
                dengan pemilih bahasa yang dipelajari. Bridge `pt-2` menutup celah
                trigger↔panel supaya kursor tak jatuh keluar saat mengarah. */}
            <div
              className="relative"
              onMouseEnter={() => setBaseMenuOpen(true)}
              onMouseLeave={() => setBaseMenuOpen(false)}
            >
              <button
                onClick={() => setBaseMenuOpen((v) => !v)}
                className="group inline-flex items-center rounded-full px-2.5 py-1.5 text-sm font-bold transition-transform active:scale-95"
                style={{ backgroundColor: CARD }}
                title={`Bahasa terjemahan: ${getBaseLangDef(baseLang).label}`}
                aria-label={getBaseLangDef(baseLang).label}
                aria-expanded={baseMenuOpen}
              >
                <RectFlag code={getBaseLangDef(baseLang).country} h={16} />
              </button>
              <div
                className={`absolute right-0 top-full z-30 pt-2 transition-all duration-150 ease-out ${
                  baseMenuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
                }`}
              >
                <div
                  className="flex flex-col overflow-hidden rounded-2xl shadow-2xl"
                  style={{ width: 240, backgroundColor: "#12171A", border: `1px solid ${BORDER}` }}
                >
                  <div
                    className="px-3 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: SUB }}
                  >
                    Bahasa terjemahan
                  </div>
                  <div className="px-1.5 pb-1.5">
                    {BASE_LANGS.map((b) => {
                      const on = b.code === baseLang;
                      return (
                        <button
                          key={b.code}
                          onClick={() => {
                            setBaseMenuOpen(false);
                            pickBase(b.code);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/5"
                          style={{ backgroundColor: on ? "rgba(26,158,158,0.16)" : "transparent" }}
                        >
                          <RectFlag code={b.country} h={18} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-bold text-white">
                              {b.label}
                            </span>
                            <span className="block truncate text-[11px]" style={{ color: SUB }}>
                              {b.english}
                            </span>
                          </span>
                          {on && <Check className="h-4 w-4 shrink-0" color={TEAL} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            {/* Bahasa yang dipelajari — dropdown HOVER (dulu pop-up layar penuh).
                [watch-learnlang-hover-v1] Hover buka dropdown cari + daftar; klik
                tetap men-toggle untuk perangkat sentuh. Bridge `pt-2` menutup
                celah trigger↔panel supaya kursor tak jatuh keluar saat mengarah. */}
            <div
              className="relative"
              onMouseEnter={() => setLearnMenuOpen(true)}
              onMouseLeave={() => setLearnMenuOpen(false)}
            >
              <button
                onClick={() => setLearnMenuOpen((v) => !v)}
                title={lang.name}
                aria-label={lang.name}
                aria-expanded={learnMenuOpen}
                className="group inline-flex items-center rounded-full px-2.5 py-1.5 text-sm font-bold transition-transform active:scale-95"
                style={{ backgroundColor: CARD }}
              >
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
              Belajar bahasa dari konten yang kamu suka
            </p>
          </div>
        </div>

        {/* Search box (pencarian video) — disembunyikan di tab Cari Kata yang
            punya kotak pencarian kata sendiri. */}
        {!wordMode && (
          <div
            className="mt-6 flex items-center gap-2.5 rounded-2xl px-4"
            style={{ backgroundColor: CARD }}
          >
            <Search className="h-4 w-4 shrink-0" color={SUB} />
            <input
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearchSubmit();
              }}
              placeholder={`Cari video dalam bahasa ${lang.name}…`}
              className="flex-1 bg-transparent py-3.5 text-[15px] text-white outline-none placeholder:text-white/35"
            />
            {(freeText || committedText) && (
              <button
                onClick={() => {
                  setFreeText("");
                  setCommittedText("");
                }}
                className="shrink-0 transition-opacity hover:opacity-70"
                aria-label="Hapus pencarian"
              >
                <X className="h-4 w-4" color={SUB} />
              </button>
            )}
          </div>
        )}

        {/* Continue watching */}
        {shownHistory.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold">Lanjut Menonton</h2>
              <button
                onClick={clearHistory}
                className="inline-flex items-center gap-1.5 text-[12px] font-bold transition-opacity hover:opacity-70"
                style={{ color: SUB }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Hapus
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
                <TextSearch className="mr-1 inline h-4 w-4 align-text-bottom" color={GOLD} /> Cari Kata
              </>
            ) : (
              <>
                <span style={{ color: GOLD }}>✨</span> Rekomendasi untukmu
              </>
            )}
          </h2>
          {!wordMode && (
            <button
              onClick={() => (readyMode ? loadReady(lang) : runSearch(lang, cat, committedText, durationFilter))}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-opacity hover:opacity-80"
              style={{ backgroundColor: "rgba(26,158,158,0.14)", color: TEAL }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Muat ulang
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
            Terjemahan Siap
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
            Cari Kata
          </button>
          {IMMERSION_CATEGORIES.map((c) => {
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
                {c.label}
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
                placeholder={`Ketik kata dalam bahasa ${lang.name}…`}
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
                  aria-label="Hapus"
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
                Cari
              </button>
            </div>
            <p className="mt-2 text-[12.5px]" style={{ color: SUB }}>
              Lihat cara sebuah kata dipakai di kalimat nyata dari video katalog. Klik hasil
              untuk lompat ke momen kata itu diucapkan.
            </p>

            {wordState === "loading" && (
              <div
                className="mt-8 flex items-center justify-center gap-2 text-[13px]"
                style={{ color: SUB }}
              >
                <Loader2 className="h-4 w-4 animate-spin" /> Mencari…
              </div>
            )}

            {wordState === "idle" && (
              <div className="mt-10 text-center text-[13px]" style={{ color: SUB }}>
                Ketik sebuah kata lalu tekan Enter untuk melihat contohnya di video.
              </div>
            )}

            {wordState === "empty" && (
              <div
                className="mt-6 rounded-2xl p-6 text-center"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
              >
                <p className="text-[15px] font-bold">Tidak ketemu di katalog</p>
                <p className="mx-auto mt-1 max-w-md text-[13px]" style={{ color: SUB }}>
                  Kata “{wordInput.trim()}” belum ada di transkrip video {lang.name} yang
                  tersimpan. Coba kata lain, atau tambah videonya ke katalog dulu.
                </p>
              </div>
            )}

            {wordState === "done" && (
              <div className="mt-5 space-y-2.5">
                <p className="text-[12.5px] font-bold" style={{ color: SUB }}>
                  {wordResults.length} contoh ditemukan
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
        {/* [linguo-patch:watch-duration-filter-v1] Filter durasi: Semua / <5 / 5–10 / 10–20 mnt */}
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
                {d.label}
              </button>
            );
          })}
        </div>

        {/* [linguo-patch:watch-level-filter-v1] Filter level CEFR — hanya tab "Siap"
            (video di sana yang punya estimasi level). Chip aktif memakai warna levelnya. */}
        {readyMode && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold" style={{ color: SUB }}>
              Level:
            </span>
            {LEVEL_FILTERS.map((lv) => {
              const on = levelFilter === lv;
              const style = lv !== "all" ? CEFR_STYLE[lv] : null;
              return (
                <button
                  key={lv}
                  onClick={() => {
                    setLevelFilter(lv);
                    setVisible(GRID_COLS);
                  }}
                  className="rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors"
                  style={{
                    backgroundColor: on ? (style ? style.bg : TEAL) : CARD,
                    color: on ? (style ? style.fg : "#fff") : "rgba(255,255,255,0.7)",
                  }}
                >
                  {lv === "all" ? "Semua" : lv}
                </button>
              );
            })}
          </div>
        )}

        {/* Grid video */}
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {state === "loading"
            ? Array.from({ length: GRID_COLS }).map((_, i) => <CardSkeleton key={i} />)
            : shownVideos.slice(0, visible).map((v) => (
                <button key={v.videoId} onClick={() => openVideo(v, lang.code)} className="group text-left">
                  <Thumb
                    videoId={v.videoId}
                    thumbnail={v.thumbnail}
                    duration={v.duration}
                    level={v.level}
                  />
                  <p className="mt-2 line-clamp-2 text-[13px] font-bold leading-snug">{v.title}</p>
                  {(v.channel || v.views != null) && (
                    <p
                      className="mt-0.5 line-clamp-1 flex items-center gap-1 text-[11.5px]"
                      style={{ color: SUB }}
                    >
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
            <p className="text-[15px] font-bold">Tak ada video cocok filter di halaman ini</p>
            <p className="mx-auto mt-1 max-w-md text-[13px]" style={{ color: SUB }}>
              Longgarkan filter durasi/level, muat lainnya, atau ganti kategori.
            </p>
            <button
              onClick={() => {
                setDurationFilter("all");
                setLevelFilter("all");
              }}
              className="mt-3 rounded-full px-4 py-2 text-[12.5px] font-bold"
              style={{ backgroundColor: "rgba(26,158,158,0.14)", color: TEAL }}
            >
              Reset filter
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
                <p className="text-[15px] font-bold">Belum ada video siap</p>
                <p className="mx-auto mt-1 max-w-md text-[13px]" style={{ color: SUB }}>
                  Tonton beberapa video dari kategori lain dulu. Begitu subtitle +
                  terjemahannya selesai diproses, video otomatis muncul di sini — dan
                  langsung tampil instan buat siapa pun yang membukanya.
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-bold">Belum ada video ketemu</p>
                <p className="mx-auto mt-1 max-w-md text-[13px]" style={{ color: SUB }}>
                  Coba kategori lain, ganti bahasa, atau muat ulang. Katalog cuma
                  menampilkan video pendek (≤20 menit) & terbatas kuota harian YouTube —
                  beberapa saat lagi biasanya kembali penuh.
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
              {state === "more" ? "Memuat…" : "Muat lainnya"}
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
              <p className="text-[15px] font-bold">Pilih bahasa</p>
              <button onClick={() => setLangPickerOpen(false)} aria-label="Tutup">
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
                placeholder="Cari bahasa…"
                autoFocus
                className="flex-1 bg-transparent py-3 text-[14px] text-white outline-none placeholder:text-white/35"
              />
            </div>
            {!langQuery.trim() && recentLangObjs.length > 0 && (
              <div className="mt-3 px-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: SUB }}>
                  Terakhir dipilih
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
                  Tidak ada bahasa cocok.
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
                <p className="text-[16px] font-bold">Kamu bicara bahasa apa?</p>
                <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: SUB }}>
                  Terjemahan di bawah subtitle akan ditampilkan dalam bahasa ini. Bisa
                  diganti kapan saja lewat tombol bendera di atas.
                </p>
              </div>
              {!baseFirstOpen && (
                <button onClick={() => setBasePickerOpen(false)} aria-label="Tutup" className="shrink-0">
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
          initialLang={langCode}
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
          title="Perkiraan level bahasa dari transkrip"
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
