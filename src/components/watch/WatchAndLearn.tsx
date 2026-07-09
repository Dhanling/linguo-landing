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
  WATCH_MAX_DURATION_SEC,
  formatDuration,
  youtubeThumb,
} from "@/lib/immersion";
import { fetchReadyVideos, getSavedWords, prewarmTranscripts } from "@/lib/immersionLearn";
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
// Tab "Siap": video yang transkripnya sudah tersimpan → buka = instan, tanpa
// biaya AI. Bukan kategori YouTube, jadi ditangani khusus (baca dari cache).
const SIAP_ID = "siap";

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

  // [linguo-patch:watch-orient-toggle-v1] Terapkan filter jenis konten ke grid.
  // Video tanpa durasi terbaca dianggap "video" (landscape) — biar tak hilang
  // dari tampilan default; hanya masuk "shorts" kalau durasinya jelas ≤60 dtk.
  const shownVideos = useMemo(() => {
    if (orient === "shorts")
      return videos.filter((v) => v.duration != null && v.duration <= SHORTS_MAX_SEC);
    if (orient === "video")
      return videos.filter((v) => v.duration == null || v.duration > SHORTS_MAX_SEC);
    return videos;
  }, [videos, orient]);

  // Hidrasi bahasa tersimpan + riwayat tonton saat mount.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if (saved && getImmersionLang(saved)) setLangCode(saved);
    } catch {
      /* abaikan */
    }
    setHistory(getWatchHistory());
    setVocabCount(getSavedWords().length);
  }, []);

  const refreshVocab = useCallback(() => setVocabCount(getSavedWords().length), []);

  // Tombol Back (browser/in-app) saat nonton video → tutup player, balik ke
  // Watch & Learn, BUKAN keluar halaman. Dorong satu entri history pas video
  // dibuka; popstate menutup player. Kalau ditutup lewat tombol X, entri kita
  // dikonsumsi balik biar history tetap rapi.
  // Key ke buka/tutup (bukan `active`) supaya ganti video via rekomendasi tidak
  // memicu cleanup → history.back → popstate yang malah menutup player.
  const playerOpen = active != null;
  useEffect(() => {
    if (!playerOpen) return;
    window.history.pushState({ watchModal: true }, "");
    const onPop = () => setActive(null);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (window.history.state?.watchModal) window.history.back();
    };
  }, [playerOpen]);

  // Token buat membatalkan hasil fetch yang ketinggalan (bahasa/kategori keburu ganti).
  const reqId = useRef(0);

  const runSearch = useCallback(
    async (l: ImmersionLang, c: ImmersionCategory, text: string) => {
      const id = ++reqId.current;
      setState("loading");
      setVideos([]);
      setNextToken(undefined);
      const q = buildQuery(c, l, text);
      const page = await searchImmersionVideos({
        query: q,
        language: l.searchCode ?? l.code,
        order: c.news || c.fresh ? "date" : undefined,
        max: 18,
        maxDurationSec: WATCH_MAX_DURATION_SEC, // katalog cuma video pendek (≤5 mnt)
      });
      if (id !== reqId.current) return; // hasil basi — abaikan
      // Saring ke bahasa target biar audio & subtitle-nya beneran cocok, lalu buang
      // sisa video kepanjangan (jaga-jaga kalau durasi tak terbaca di server).
      const results = filterVideosByLanguage(page.results, l.code).filter(
        (v) => !v.duration || v.duration <= WATCH_MAX_DURATION_SEC
      );
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
  const loadReady = useCallback(async (l: ImmersionLang) => {
    const id = ++reqId.current;
    setState("loading");
    setVideos([]);
    setNextToken(undefined);
    const ready = await fetchReadyVideos(l.code);
    if (id !== reqId.current) return;
    setVideos(ready);
    setState(ready.length ? "done" : "empty");
  }, []);

  // Apakah tab "Siap" sedang aktif (dan bukan sedang mencari teks bebas).
  const readyMode = category === SIAP_ID && !committedText.trim();

  // Muat ulang tiap bahasa / kategori / teks yang di-commit berubah.
  useEffect(() => {
    if (category === SIAP_ID && !committedText.trim()) loadReady(lang);
    else runSearch(lang, cat, committedText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langCode, category, committedText]);

  const loadMore = useCallback(async () => {
    if (!nextToken || state === "more") return;
    const id = reqId.current;
    setState("more");
    const q = buildQuery(cat, lang, committedText);
    const page = await searchImmersionVideos({
      query: q,
      language: lang.searchCode ?? lang.code,
      order: cat.news || cat.fresh ? "date" : undefined,
      max: 18,
      pageToken: nextToken,
      maxDurationSec: WATCH_MAX_DURATION_SEC,
    });
    if (id !== reqId.current) return;
    const more = filterVideosByLanguage(page.results, lang.code).filter(
      (v) => !v.duration || v.duration <= WATCH_MAX_DURATION_SEC
    );
    setVideos((prev) => {
      const seen = new Set(prev.map((v) => v.videoId));
      return [...prev, ...more.filter((v) => !seen.has(v.videoId))];
    });
    setNextToken(page.nextPageToken);
    setState("done");
    prewarmTranscripts(more, lang.code);
  }, [nextToken, state, cat, lang, committedText]);

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

  const clearHistory = useCallback(() => {
    clearWatchHistory();
    setHistory([]);
  }, []);

  return (
    <main style={{ backgroundColor: BG, minHeight: "100vh" }} className="text-white">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6">
        {/* Top bar — balik ke beranda */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: SUB }}
          >
            <ArrowLeft className="h-4 w-4" /> Beranda
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
        {history.length > 0 && (
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
              {history.map((h) => (
                <button
                  key={h.videoId}
                  onClick={() =>
                    openVideo(
                      { videoId: h.videoId, title: h.title, thumbnail: h.thumbnail, channel: h.channel },
                      h.lang
                    )
                  }
                  className="group w-[180px] shrink-0 text-left"
                >
                  <Thumb videoId={h.videoId} thumbnail={h.thumbnail} />
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
            onClick={() => (readyMode ? loadReady(lang) : runSearch(lang, cat, committedText))}
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

        {/* Grid video */}
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {state === "loading"
            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
            : shownVideos.map((v) => (
                <button key={v.videoId} onClick={() => openVideo(v, lang.code)} className="text-left">
                  <Thumb videoId={v.videoId} thumbnail={v.thumbnail} duration={v.duration} />
                  <p className="mt-2 line-clamp-2 text-[13px] font-bold leading-snug">{v.title}</p>
                  {v.channel && (
                    <p className="mt-0.5 line-clamp-1 text-[11.5px]" style={{ color: SUB }}>
                      {v.channel}
                    </p>
                  )}
                </button>
              ))}
        </div>

        {/* [linguo-patch:watch-orient-toggle-v1] Grid kosong gara-gara filter jenis konten
            (bukan karena hasil server nihil) → arahkan balik ke "Semua". */}
        {state !== "loading" && videos.length > 0 && shownVideos.length === 0 && (
          <div
            className="mt-6 rounded-2xl p-6 text-center"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-[15px] font-bold">
              Tak ada {orient === "shorts" ? "Shorts" : "video landscape"} di halaman ini
            </p>
            <p className="mx-auto mt-1 max-w-md text-[13px]" style={{ color: SUB }}>
              Coba pilih <b>Semua</b>, muat lainnya, atau ganti kategori.
            </p>
            <button
              onClick={() => setOrient("all")}
              className="mt-3 rounded-full px-4 py-2 text-[12.5px] font-bold"
              style={{ backgroundColor: "rgba(26,158,158,0.14)", color: TEAL }}
            >
              Tampilkan semua
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
                  menampilkan video pendek (≤5 menit) & terbatas kuota harian YouTube —
                  beberapa saat lagi biasanya kembali penuh.
                </p>
              </>
            )}
          </div>
        )}

        {/* Muat lainnya */}
        {state !== "loading" && nextToken && videos.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={loadMore}
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
}: {
  videoId: string;
  thumbnail: string | null;
  duration?: number | null;
}) {
  const durLabel = formatDuration(duration);
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
