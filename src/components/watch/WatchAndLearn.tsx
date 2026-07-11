"use client";

// Watch & Learn — versi web dari fitur immersion di app mobile Linguo.
// Katalog video YouTube per bahasa + kategori (search lewat Edge Function
// `yt-search`), player embed dengan caption, dan rail "Lanjut Menonton" dari
// riwayat lokal. Tema gelap biar konten video kelihatan nendang, senada app.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, Play, RefreshCw, Search, Trash2, X, Check } from "lucide-react";
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
  youtubeThumb,
} from "@/lib/immersion";
import { fetchReadyVideos, getSavedWords, prewarmTranscripts } from "@/lib/immersionLearn";
import { CEFR_STYLE, type CefrLevel } from "@/lib/cefr";
import { RectFlag } from "@/components/RectFlag";
import VideoLearnPlayer from "./VideoLearnPlayer";
import FlashcardDeck from "./FlashcardDeck";

const TEAL = "#1A9E9E";
const GOLD = "#F4B740";
const BG = "#0B0E0F";
const CARD = "#161A1C";
const BORDER = "rgba(255,255,255,0.08)";
const SUB = "rgba(255,255,255,0.5)";

const LANG_KEY = "linguo:watch:lang:v1";
// [linguo-patch:watch-orient-toggle-v1] Ambang pemisah Shorts vs Video landscape.
// Shorts YouTube praktis selalu ≤60 dtk & vertikal; klip landscape (adegan film,
// TV, wawancara) di katalog umumnya lebih panjang. Bukan deteksi aspect ratio
// sempurna (API tak sediakan), tapi proxy durasi ini cocok utk mayoritas kasus.
const SHORTS_MAX_SEC = 60;
// Jumlah kartu per "halaman" tampilan = 1 baris di desktop (grid lg:grid-cols-4).
// Grid mulai dengan segini biar halaman tak kepanjangan; "Muat lainnya" menambah
// sebanyak ini lagi tiap klik.
const GRID_PAGE = 4;

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

// [linguo-patch:watch-orient-frame0-v1] Deteksi orientasi ASLI video via thumbnail
// `frame0.jpg`. Kenapa: YouTube Data API tak kasih orientasi, dan durasi bukan proxy
// andal (Shorts kini bisa >60 dtk, jadi bocor ke tab "Video"; video ber-durasi null
// juga salah masuk). Tapi `https://i.ytimg.com/vi/<id>/frame0.jpg` = frame pertama
// dengan RASIO ASPEK ASLI (portrait → tinggi>lebar), beda dari hqdefault yang selalu
// 480×360 (letterboxed). Keyless, tanpa kuota API. Rasio tak pernah berubah → cache
// permanen (module-level, lintas ganti bahasa/kategori). true = portrait (Shorts).
const orientCache = new Map<string, boolean>();
const frame0Url = (id: string) => `https://i.ytimg.com/vi/${id}/frame0.jpg`;

// Tab "Siap": video yang transkripnya sudah tersimpan → buka = instan, tanpa
// biaya AI. Bukan kategori YouTube, jadi ditangani khusus (baca dari cache).
const SIAP_ID = "siap";

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
  const [category, setCategory] = useState("populer");
  const [freeText, setFreeText] = useState("");
  const [committedText, setCommittedText] = useState("");
  // [linguo-patch:watch-orient-toggle-v1] filter jenis konten: semua / shorts
  // (klip vertikal pendek) / video (landscape lebih panjang). YouTube Data API
  // tak kasih orientasi, jadi dipisah pakai durasi — proxy paling andal.
  const [orient, setOrient] = useState<"all" | "shorts" | "video">("all");
  // [linguo-patch:watch-duration-filter-v1] Filter durasi: semua / <5 / 5–10 / 10–20 mnt.
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");
  // Penanda buat memicu re-hitung filter tiap kali orientasi baru terdeteksi
  // (orientCache mutable di module scope, bukan dependency React).
  const [orientTick, setOrientTick] = useState(0);
  // Berapa kartu yang ditampilkan sekarang (paginasi client-side). Mulai 1 baris.
  const [visible, setVisible] = useState(GRID_PAGE);

  const [videos, setVideos] = useState<ImmersionVideo[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [state, setState] = useState<"idle" | "loading" | "more" | "done" | "empty" | "error">(
    "idle"
  );
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [langQuery, setLangQuery] = useState("");
  const [active, setActive] = useState<ImmersionVideo | null>(null);
  const [activeLang, setActiveLang] = useState("en");
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [deckOpen, setDeckOpen] = useState(false);
  const [vocabCount, setVocabCount] = useState(0);

  const lang = getImmersionLang(langCode) ?? IMMERSION_LANGS[0];
  const cat =
    IMMERSION_CATEGORIES.find((c) => c.id === category) ?? IMMERSION_CATEGORIES[0];

  // "Lanjut Menonton" hanya menampilkan riwayat bahasa yang sedang dipelajari —
  // saat belajar bahasa Inggris, video Spanyol dll tak ikut muncul.
  const shownHistory = useMemo(
    () => history.filter((h) => h.lang === langCode),
    [history, langCode]
  );

  // [linguo-patch:watch-orient-frame0-v1] Saat filter Shorts/Video aktif, deteksi
  // orientasi asli tiap video via frame0.jpg (sekali per videoId, hasilnya di-cache).
  // Hanya jalan kalau orient !== "all" biar tak muat gambar ekstra saat tak perlu.
  useEffect(() => {
    if (orient === "all") return;
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
  }, [videos, orient]);

  // [linguo-patch:watch-orient-frame0-v1] Terapkan filter jenis konten ke grid.
  // Prioritas orientasi asli (frame0); selama deteksi belum selesai / frame0 gagal,
  // pakai proxy durasi sebagai fallback (≤60 dtk → Shorts). Video tanpa durasi
  // dianggap landscape sementara, tapi begitu frame0 resolve, penilaian dikoreksi.
  const shownVideos = useMemo(() => {
    const dur = DURATION_FILTERS.find((d) => d.id === durationFilter) ?? DURATION_FILTERS[0];
    return videos.filter((v) => {
      // Filter durasi (rentang [min, max) detik; tanpa durasi hanya lolos di "Semua").
      if (durationFilter !== "all") {
        if (v.duration == null || v.duration < dur.min || v.duration >= dur.max) return false;
      }
      // Filter jenis konten (orientasi asli frame0 → fallback proxy durasi).
      if (orient !== "all") {
        const portrait = orientCache.get(v.videoId);
        if (portrait !== undefined) return orient === "shorts" ? portrait : !portrait;
        if (orient === "shorts") return v.duration != null && v.duration <= SHORTS_MAX_SEC;
        return v.duration == null || v.duration > SHORTS_MAX_SEC;
      }
      return true;
    });
    // orientTick sengaja jadi dependency: memicu re-filter tiap orientasi baru masuk cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos, orient, orientTick, durationFilter]);

  // Hidrasi bahasa tersimpan + riwayat tonton saat mount.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(LANG_KEY);
      if (saved && getImmersionLang(saved)) setLangCode(saved);
    } catch {
      /* abaikan */
    }
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
  }, []);

  // Apakah tab "Siap" sedang aktif (dan bukan sedang mencari teks bebas).
  const readyMode = category === SIAP_ID && !committedText.trim();

  // Muat ulang tiap bahasa / kategori / teks yang di-commit berubah.
  // [perf:watch-catalog-cache-v1] cache-first: keluar-masuk halaman/menu → grid muncul
  // instan dari cache module-level; kalau cache masih segar (<TTL) fetch dilewati,
  // kalau basi di-refresh diam-diam di belakang layar.
  useEffect(() => {
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
    setVisible(GRID_PAGE);
  }, [langCode, category, committedText, orient, durationFilter]);

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
    if (visible < shownVideos.length) setVisible((n) => n + GRID_PAGE);
    else if (nextToken) {
      setVisible((n) => n + GRID_PAGE);
      loadMore();
    }
  }, [visible, shownVideos.length, nextToken, loadMore]);

  const pickLang = useCallback((code: string) => {
    setLangCode(code);
    setLangPickerOpen(false);
    setLangQuery("");
    try {
      window.localStorage.setItem(LANG_KEY, code);
    } catch {
      /* abaikan */
    }
  }, []);

  const openVideo = useCallback(
    (v: ImmersionVideo, forLang: string) => {
      setActive(v);
      setActiveLang(forLang);
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

  return (
    <main style={{ backgroundColor: BG, minHeight: "100vh" }} className="text-white">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6">
        {/* Top bar — balik ke dashboard siswa (/akun), bukan beranda publik. */}
        <div className="flex items-center justify-between">
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
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold transition-transform active:scale-95"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            >
              <Layers className="h-4 w-4" color={TEAL} />
              <span>Kosakata</span>
              {vocabCount > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[11px] font-extrabold leading-none"
                  style={{ backgroundColor: "rgba(26,158,158,0.2)", color: "#7FE0E0" }}
                >
                  {vocabCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setLangPickerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold transition-transform active:scale-95"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            >
              <RectFlag code={lang.country} h={16} />
              <span>{lang.name}</span>
            </button>
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

        {/* Search box */}
        <div
          className="mt-6 flex items-center gap-2.5 rounded-2xl px-4"
          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
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
            <span style={{ color: GOLD }}>✨</span> Rekomendasi untukmu
          </h2>
          <button
            onClick={() => (readyMode ? loadReady(lang) : runSearch(lang, cat, committedText, durationFilter))}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-opacity hover:opacity-80"
            style={{ backgroundColor: "rgba(26,158,158,0.14)", color: TEAL }}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Muat ulang
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Tab "Siap" — video yang subtitle-nya langsung muncul (sudah diproses). */}
          <button
            onClick={() => setCategory(SIAP_ID)}
            className="shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors"
            style={{
              backgroundColor: category === SIAP_ID ? TEAL : CARD,
              border: `1px solid ${category === SIAP_ID ? TEAL : BORDER}`,
              color: category === SIAP_ID ? "#fff" : "rgba(255,255,255,0.8)",
            }}
          >
            <span className="mr-1">✅</span>
            Siap
          </button>
          {IMMERSION_CATEGORIES.map((c) => {
            const on = c.id === category;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className="shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors"
                style={{
                  backgroundColor: on ? TEAL : CARD,
                  border: `1px solid ${on ? TEAL : BORDER}`,
                  color: on ? "#fff" : "rgba(255,255,255,0.8)",
                }}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {/* [linguo-patch:watch-orient-toggle-v1] Toggle jenis konten: Semua / Shorts / Video */}
        <div
          className="mt-4 inline-flex gap-1 rounded-full p-1"
          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
        >
          {([
            ["all", "Semua", ""],
            ["shorts", "Shorts", "📱"],
            ["video", "Video", "🖥️"],
          ] as const).map(([k, label, emoji]) => {
            const on = orient === k;
            return (
              <button
                key={k}
                onClick={() => setOrient(k)}
                className="rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors"
                style={{
                  backgroundColor: on ? TEAL : "transparent",
                  color: on ? "#fff" : "rgba(255,255,255,0.7)",
                }}
              >
                {emoji && <span className="mr-1">{emoji}</span>}
                {label}
              </button>
            );
          })}
        </div>

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
                  border: `1px solid ${on ? TEAL : BORDER}`,
                  color: on ? "#fff" : "rgba(255,255,255,0.7)",
                }}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Grid video */}
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {state === "loading"
            ? Array.from({ length: GRID_PAGE }).map((_, i) => <CardSkeleton key={i} />)
            : shownVideos.slice(0, visible).map((v) => (
                <button key={v.videoId} onClick={() => openVideo(v, lang.code)} className="text-left">
                  <Thumb
                    videoId={v.videoId}
                    thumbnail={v.thumbnail}
                    duration={v.duration}
                    level={v.level}
                  />
                  <p className="mt-2 line-clamp-2 text-[13px] font-bold leading-snug">{v.title}</p>
                  {v.channel && (
                    <p className="mt-0.5 line-clamp-1 text-[11.5px]" style={{ color: SUB }}>
                      {v.channel}
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
              Longgarkan filter durasi/jenis konten, muat lainnya, atau ganti kategori.
            </p>
            <button
              onClick={() => {
                setOrient("all");
                setDurationFilter("all");
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

      {/* Player belajar — video + transkrip dwibahasa + analisa + tap kata */}
      {active && (
        <VideoLearnPlayer
          video={active}
          langCode={activeLang}
          recommendations={videos.filter((v) => v.videoId !== active.videoId)}
          onSelectVideo={(v) => openVideo(v, lang.code)}
          onClose={() => setActive(null)}
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
        className="absolute inset-0 h-full w-full object-cover"
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
      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 hover:opacity-100">
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
