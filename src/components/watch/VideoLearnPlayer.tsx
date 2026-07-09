"use client";

// Player "belajar" Watch & Learn — versi web dari immersion player app mobile.
// Kiri: video YouTube (IFrame API) + baris fokus (kalimat aktif bisa di-tap +
// terjemahan emas + tombol Analisa). Kanan (separator di desktop): transkrip
// penuh yang tersinkron — klik baris buat loncat. Tap kata → tooltip arti /
// simpan / analisa / dengar. Semua best-effort; kalau transkrip tak ada, video
// tetap jalan dengan caption bawaan YouTube.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Loader2,
  Maximize,
  Minimize,
  Palette,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  RotateCcw,
  Type,
  X,
} from "lucide-react";
import {
  fetchTranscript,
  getSentenceBreakdown,
  isNonLatin,
  LearnCue,
  POS_COLOR,
  POS_LABEL_ID,
  SentenceBreakdown,
  splitWords,
  transliterateLines,
} from "@/lib/immersionLearn";
import { ImmersionVideo, youtubeThumb } from "@/lib/immersion";
import { WordTooltip } from "./WordTooltip";

const TEAL = "#1A9E9E";
const GOLD = "#F4B740";
const CARD = "#161A1C";
const BORDER = "rgba(255,255,255,0.08)";
const SUB = "rgba(255,255,255,0.5)";

const SPEEDS = [1, 0.75, 0.5, 1.25];

// Ukuran teks subtitle/transkrip yang bisa dipilih siswa (disimpan lokal).
const FONT_LEVELS = [
  { label: "Kecil", scale: 0.85 },
  { label: "Sedang", scale: 1 },
  { label: "Besar", scale: 1.2 },
];
const FONT_KEY = "linguo:watch:fontsize:v1";

// ── YouTube IFrame API loader (singleton) ────────────────────────────────────
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<void>((resolve) => {
    const prev = (window as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady;
    (window as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

interface Anchor {
  word: string;
  sentence: string;
  x: number;
  y: number;
}

export default function VideoLearnPlayer({
  video,
  langCode,
  onClose,
  onSavedChange,
  recommendations = [],
  onSelectVideo,
}: {
  video: ImmersionVideo;
  langCode: string;
  onClose: () => void;
  onSavedChange?: () => void;
  recommendations?: ImmersionVideo[];
  onSelectVideo?: (v: ImmersionVideo) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [showCC, setShowCC] = useState(false); // CC bawaan YouTube (fallback)
  const [fontIdx, setFontIdx] = useState(1); // ukuran teks subtitle (default Sedang)
  const fscale = FONT_LEVELS[fontIdx].scale;

  const [cues, setCues] = useState<LearnCue[]>([]);
  const [txState, setTxState] = useState<"loading" | "ready" | "none">("loading");
  // True saat transkrip jatuh ke jalur AI (yt-asr) yang lambat — buat pesan loading.
  const [asrRunning, setAsrRunning] = useState(false);
  // True selagi bacaan Latin (romaji/pinyin/dll) diisi di background utk bahasa non-Latin.
  const [translitLoading, setTranslitLoading] = useState(false);

  const [analyze, setAnalyze] = useState(false);
  const [breakdowns, setBreakdowns] = useState<Record<number, SentenceBreakdown | "loading" | "error">>({});

  const [anchor, setAnchor] = useState<Anchor | null>(null);

  // Fullscreen player kita sendiri (bukan iframe) + tampil/sembunyi panel transkrip.
  const [fullscreen, setFullscreen] = useState(false);
  const [showPanel, setShowPanel] = useState(true);

  // ── Fullscreen: sinkronkan state dengan API (termasuk exit lewat Esc) ─────────
  useEffect(() => {
    const onChange = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = document as any;
      const fsEl = document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
      setFullscreen(fsEl === rootRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = document as any;
    const active = document.fullscreenElement ?? d.webkitFullscreenElement;
    try {
      if (active) {
        (document.exitFullscreen ?? d.webkitExitFullscreen)?.call(document);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = el as any;
        (el.requestFullscreen ?? e.webkitRequestFullscreen)?.call(el);
      }
    } catch {
      /* abaikan — sebagian browser (iOS) tak izinkan fullscreen elemen */
    }
  }, []);

  // ── Muat YouTube player ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      playerRef.current = new (window as any).YT.Player(hostRef.current, {
        videoId: video.videoId,
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          cc_load_policy: 0,
          playsinline: 1,
          // Matikan fullscreen bawaan YouTube — fullscreen iframe menutupi overlay
          // kita (subtitle + transkrip). Kita pakai tombol fullscreen sendiri yang
          // men-fullscreen-kan seluruh player biar overlay tetap tampil.
          fs: 0,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            setReady(true);
            try {
              playerRef.current?.playVideo();
            } catch {
              /* abaikan */
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStateChange: (e: any) => {
            // 1 = playing, 2 = paused, 0 = ended
            setPlaying(e.data === 1);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* abaikan */
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.videoId]);

  // Polling waktu tiap 200ms untuk sinkronisasi subtitle.
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      try {
        const t = playerRef.current?.getCurrentTime?.();
        if (typeof t === "number") setTime(t);
      } catch {
        /* abaikan */
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [ready]);

  // ── Muat transkrip ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setTxState("loading");
    setAsrRunning(false);
    setTranslitLoading(false);
    setCues([]);
    setBreakdowns({});
    // Sambil transkrip interaktif disiapkan (jalur AI bisa ~1 menit), tampilkan CC
    // bawaan YouTube DALAM bahasa target biar siswa tak menonton tanpa subtitle.
    setShowCC(true);
    fetchTranscript(video.videoId, langCode, {
      onAsr: () => !cancelled && setAsrRunning(true),
    }).then((r) => {
      if (cancelled) return;
      if (r.cues.length) {
        setCues(r.cues);
        setTxState("ready");
        // Transkrip kita sudah tampil → matikan CC bawaan biar subtitle tak dobel.
        setShowCC(false);
        // Bahasa non-Latin (Jepang, Mandarin, dll): transkrip dari server tak bawa
        // bacaan Latin. Isi transliterasi di background biar transkrip tampil dulu,
        // lalu romaji/pinyin menyusul tanpa menahan render.
        if (isNonLatin(langCode) && r.cues.some((c) => !c.translit)) {
          setTranslitLoading(true);
          transliterateLines(r.cues.map((c) => c.target), langCode)
            .then((tr) => {
              if (cancelled || tr.length !== r.cues.length) return;
              setCues((prev) =>
                prev.length === tr.length
                  ? prev.map((c, i) => (c.translit || !tr[i] ? c : { ...c, translit: tr[i] }))
                  : prev
              );
            })
            .finally(() => !cancelled && setTranslitLoading(false));
        }
      } else {
        setTxState("none");
        setShowCC(true); // fallback ke caption bawaan YouTube
      }
    });
    return () => {
      cancelled = true;
    };
  }, [video.videoId, langCode]);

  // Terapkan CC bawaan + SINKRONKAN bahasanya ke bahasa yang sedang dipelajari.
  // Tanpa ini, track CC "lengket" ke bahasa video sebelumnya (mis. buka video
  // Inggris tapi CC-nya masih Italia dari video sebelumnya). setOption("track")
  // memilih track bahasa target sekaligus memaksanya tampil. Modul bisa bernama
  // "captions" (player AS3) atau "cc" (HTML5) — set keduanya, yang tak aktif no-op.
  useEffect(() => {
    if (!ready) return;
    const p = playerRef.current;
    if (!p) return;
    const base = (langCode || "").split("-")[0];
    const applyLang = () => {
      for (const mod of ["captions", "cc"]) {
        try {
          p.setOption?.(mod, "track", { languageCode: base });
        } catch {
          /* modul lain / belum siap — abaikan */
        }
      }
    };
    try {
      if (showCC) {
        p.loadModule?.("captions");
        p.loadModule?.("cc");
        // setOption sering diabaikan tepat setelah loadModule (modul belum siap),
        // jadi ulang beberapa kali sampai track bahasa target terpasang.
        applyLang();
        const t1 = window.setTimeout(applyLang, 400);
        const t2 = window.setTimeout(applyLang, 1200);
        return () => {
          window.clearTimeout(t1);
          window.clearTimeout(t2);
        };
      }
      p.unloadModule?.("captions");
      p.unloadModule?.("cc");
    } catch {
      /* abaikan */
    }
  }, [showCC, ready, langCode]);

  // Indeks cue aktif berdasarkan waktu sekarang.
  const activeIdx = useMemo(() => {
    if (!cues.length) return -1;
    // Cari cue yang mencakup `time`; kalau di celah, pakai cue terakhir yang lewat.
    let lo = 0;
    let hi = cues.length - 1;
    let ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (cues[mid].start <= time) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (ans === -1) return -1;
    // Kalau sudah lewat end cue ini dan belum masuk berikutnya, tetap sorot ini.
    return ans;
  }, [cues, time]);

  const activeCue = activeIdx >= 0 ? cues[activeIdx] : null;

  // Auto-scroll baris aktif ke tengah panel transkrip.
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-cue="${activeIdx}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx]);

  const seekTo = useCallback((sec: number) => {
    try {
      playerRef.current?.seekTo?.(Math.max(0, sec), true);
      playerRef.current?.playVideo?.();
    } catch {
      /* abaikan */
    }
  }, []);

  const togglePlay = useCallback(() => {
    try {
      if (playing) playerRef.current?.pauseVideo?.();
      else playerRef.current?.playVideo?.();
    } catch {
      /* abaikan */
    }
  }, [playing]);

  const applySpeed = useCallback((idx: number) => {
    setSpeedIdx(idx);
    try {
      playerRef.current?.setPlaybackRate?.(SPEEDS[idx]);
    } catch {
      /* abaikan */
    }
  }, []);

  // Pulihkan ukuran teks pilihan siswa; siklus Kecil → Sedang → Besar.
  useEffect(() => {
    try {
      const s = window.localStorage.getItem(FONT_KEY);
      if (s != null) {
        const n = parseInt(s, 10);
        if (n >= 0 && n < FONT_LEVELS.length) setFontIdx(n);
      }
    } catch {
      /* abaikan */
    }
  }, []);
  const cycleFont = useCallback(() => {
    setFontIdx((i) => {
      const n = (i + 1) % FONT_LEVELS.length;
      try {
        window.localStorage.setItem(FONT_KEY, String(n));
      } catch {
        /* abaikan */
      }
      return n;
    });
  }, []);

  const gotoCue = useCallback(
    (dir: -1 | 1) => {
      if (activeIdx < 0) return;
      const next = activeIdx + dir;
      if (next >= 0 && next < cues.length) seekTo(cues[next].start);
    },
    [activeIdx, cues, seekTo]
  );

  const replayLine = useCallback(() => {
    if (activeCue) seekTo(activeCue.start);
  }, [activeCue, seekTo]);

  // Minta analisa kalimat (breakdown) untuk sebuah cue — lazy + dedup.
  const requestBreakdown = useCallback(
    (idx: number) => {
      const cue = cues[idx];
      if (!cue) return;
      setBreakdowns((prev) => {
        if (prev[idx] !== undefined) return prev;
        return { ...prev, [idx]: "loading" };
      });
      getSentenceBreakdown({ sentence: cue.target, langCode })
        .then((b) => setBreakdowns((prev) => ({ ...prev, [idx]: b })))
        .catch(() => setBreakdowns((prev) => ({ ...prev, [idx]: "error" })));
    },
    [cues, langCode]
  );

  // Saat mode Analisa aktif, ambil breakdown untuk cue yang sedang tayang.
  useEffect(() => {
    if (analyze && activeIdx >= 0 && breakdowns[activeIdx] === undefined) {
      requestBreakdown(activeIdx);
    }
  }, [analyze, activeIdx, breakdowns, requestBreakdown]);

  const onWordTap = useCallback(
    (e: React.MouseEvent, word: string, sentence: string) => {
      e.stopPropagation();
      setAnchor({ word, sentence, x: e.clientX, y: e.clientY });
    },
    []
  );

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[90] flex flex-col"
      style={{ backgroundColor: "rgba(6,9,10,0.96)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <p className="mr-3 line-clamp-1 text-[14px] font-bold text-white sm:text-[15px]">
          {video.title}
        </p>
        <button
          onClick={onClose}
          className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"
          aria-label="Tutup player"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Isi — split view */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Kiri: video + baris fokus + kontrol. Full width saat panel disembunyikan. */}
        <div className={`flex min-h-0 flex-col ${showPanel ? "lg:w-[62%]" : "lg:w-full"}`}>
          {/* Container video: letterbox aman. Lebar penuh dibatasi tinggi (maxWidth
              dari 70vh) supaya saat panel disembunyikan/fullscreen video tak menutup
              layar & masih menyisakan ruang untuk subtitle + kontrol. */}
          <div className="relative flex w-full shrink-0 items-center justify-center bg-black" style={{ maxHeight: "70vh" }}>
            <div className="relative w-full" style={{ aspectRatio: "16 / 9", maxWidth: "calc(70vh * 16 / 9)" }}>
              <div ref={hostRef} className="absolute inset-0 h-full w-full" />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin" color={SUB} />
                </div>
              )}
            </div>
          </div>

          {/* Baris fokus — kalimat aktif */}
          <FocusLine
            cue={activeCue}
            time={time}
            analyze={analyze}
            breakdown={activeIdx >= 0 ? breakdowns[activeIdx] : undefined}
            onWordTap={onWordTap}
            onRetryAnalyze={() => activeIdx >= 0 && requestBreakdown(activeIdx)}
            txState={txState}
            asrRunning={asrRunning}
            scale={fscale}
          />

          {/* Kontrol */}
          <div
            className="flex flex-wrap items-center gap-2 border-t px-4 py-3 sm:px-6"
            style={{ borderColor: BORDER }}
          >
            <CtrlBtn label="Sebelumnya" onClick={() => gotoCue(-1)} disabled={activeIdx <= 0}>
              <ChevronLeft className="h-5 w-5" />
            </CtrlBtn>
            <button
              onClick={togglePlay}
              className="flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95"
              style={{ backgroundColor: "#fff" }}
              aria-label={playing ? "Jeda" : "Putar"}
            >
              {playing ? (
                <Pause className="h-5 w-5" fill="#0B0E0F" color="#0B0E0F" />
              ) : (
                <Play className="h-5 w-5" fill="#0B0E0F" color="#0B0E0F" />
              )}
            </button>
            <CtrlBtn
              label="Berikutnya"
              onClick={() => gotoCue(1)}
              disabled={activeIdx < 0 || activeIdx >= cues.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </CtrlBtn>
            <CtrlBtn label="Ulang kalimat" onClick={replayLine} disabled={!activeCue}>
              <RotateCcw className="h-4 w-4" />
            </CtrlBtn>

            <div className="mx-1 h-6 w-px" style={{ backgroundColor: BORDER }} />

            {/* Analisa */}
            <button
              onClick={() => setAnalyze((v) => !v)}
              disabled={txState !== "ready"}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors disabled:opacity-40"
              style={{
                backgroundColor: analyze ? TEAL : CARD,
                border: `1px solid ${analyze ? TEAL : BORDER}`,
                color: "#fff",
              }}
            >
              <Palette className="h-4 w-4" /> Analisa
            </button>

            {/* Kecepatan */}
            <button
              onClick={() => applySpeed((speedIdx + 1) % SPEEDS.length)}
              className="rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: "#fff" }}
            >
              {SPEEDS[speedIdx]}x
            </button>

            {/* CC bawaan YouTube — berguna saat transkrip kita tak ada */}
            <button
              onClick={() => setShowCC((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
              style={{
                backgroundColor: showCC ? "rgba(26,158,158,0.16)" : CARD,
                border: `1px solid ${showCC ? TEAL : BORDER}`,
                color: showCC ? TEAL : "#fff",
              }}
            >
              CC
            </button>

            {/* Ukuran teks subtitle & transkrip — Kecil / Sedang / Besar */}
            <button
              onClick={cycleFont}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: "#fff" }}
              title="Ukuran teks subtitle"
            >
              <Type className="h-4 w-4" /> {FONT_LEVELS[fontIdx].label}
            </button>

            {/* Tampil/sembunyikan panel transkrip di kanan — berguna di fullscreen
                buat memberi video ruang lebih atau memunculkan transkrip per-baris. */}
            <button
              onClick={() => setShowPanel((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
              style={{
                backgroundColor: showPanel ? "rgba(26,158,158,0.16)" : CARD,
                border: `1px solid ${showPanel ? TEAL : BORDER}`,
                color: showPanel ? TEAL : "#fff",
              }}
              title={showPanel ? "Sembunyikan transkrip" : "Tampilkan transkrip"}
            >
              {showPanel ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
              Transkrip
            </button>

            {/* Fullscreen player kita (bukan iframe) — subtitle & transkrip tetap ada. */}
            <button
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: "#fff" }}
              title={fullscreen ? "Keluar layar penuh" : "Layar penuh"}
            >
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              {fullscreen ? "Keluar" : "Layar penuh"}
            </button>
          </div>

          {/* Rekomendasi video — di bawah video yang ditonton (ala YouTube).
              Klik untuk langsung memutar video lain tanpa keluar player. */}
          {recommendations.length > 0 && onSelectVideo && (
            <div
              className="min-h-0 flex-1 overflow-y-auto border-t max-lg:max-h-[42vh] [scrollbar-width:thin]"
              style={{ borderColor: BORDER }}
            >
              <p className="px-4 pb-1 pt-3 text-[13px] font-extrabold text-white sm:px-6">
                Rekomendasi
              </p>
              <div className="px-2 pb-4 sm:px-4">
                {recommendations.map((v) => (
                  <button
                    key={v.videoId}
                    onClick={() => onSelectVideo(v)}
                    className="flex w-full gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/5"
                  >
                    <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={v.thumbnail ?? youtubeThumb(v.videoId)}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-bold leading-snug text-white">
                        {v.title}
                      </p>
                      {v.channel && (
                        <p className="mt-1 line-clamp-1 text-[11.5px]" style={{ color: SUB }}>
                          {v.channel}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kanan: transkrip penuh — bisa disembunyikan lewat tombol Transkrip. */}
        {showPanel && (
        <div
          className="flex min-h-0 flex-1 flex-col border-t lg:border-l lg:border-t-0"
          style={{ borderColor: BORDER }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 sm:px-5"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            <ListChecks className="h-4 w-4" color={TEAL} />
            <p className="text-[13px] font-extrabold text-white">Transkrip</p>
            <span className="text-[11.5px]" style={{ color: SUB }}>
              {txState === "ready" ? `${cues.length} baris` : ""}
            </span>
            {translitLoading && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: SUB }}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Menyiapkan bacaan Latin…
              </span>
            )}
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 [scrollbar-width:thin]"
          >
            {txState === "loading" && (
              <div className="flex items-start gap-2 px-2 py-6" style={{ color: SUB }}>
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                <span className="text-[13px] leading-relaxed">
                  {asrRunning
                    ? "Membuat subtitle dengan AI… ini bisa memakan waktu sekitar 1 menit. Kamu bisa tetap menonton dulu."
                    : "Memuat transkrip…"}
                </span>
              </div>
            )}
            {txState === "none" && (
              <div className="px-2 py-6 text-[13px] leading-relaxed" style={{ color: SUB }}>
                Transkrip interaktif belum tersedia untuk video ini. Subtitle bawaan
                YouTube (CC) sudah dinyalakan supaya kamu tetap bisa belajar sambil menonton.
              </div>
            )}
            {txState === "ready" &&
              cues.map((c, i) => {
                const on = i === activeIdx;
                return (
                  <div
                    key={i}
                    data-cue={i}
                    onClick={() => seekTo(c.start)}
                    className="cursor-pointer rounded-xl px-3 py-2.5 transition-colors"
                    style={{
                      backgroundColor: on ? "rgba(26,158,158,0.14)" : "transparent",
                      border: `1px solid ${on ? "rgba(26,158,158,0.4)" : "transparent"}`,
                    }}
                  >
                    {on ? (
                      <KaraokeText
                        cue={c}
                        time={time}
                        onWordTap={onWordTap}
                        className="font-semibold leading-snug"
                        fontSize={14 * fscale}
                      />
                    ) : (
                      <p
                        className="font-semibold leading-snug text-white"
                        style={{ fontSize: 14 * fscale }}
                      >
                        {splitWords(c.target).map((w, j) =>
                          w.isWord ? (
                            <span
                              key={j}
                              onClick={(e) => onWordTap(e, w.text, c.target)}
                              className="cursor-pointer rounded transition-colors hover:bg-[rgba(26,158,158,0.28)]"
                            >
                              {w.text}
                            </span>
                          ) : (
                            <span key={j}>{w.text}</span>
                          )
                        )}
                      </p>
                    )}
                    {c.translit && (
                      <p className="mt-0.5 italic" style={{ color: SUB, fontSize: 12 * fscale }}>
                        {c.translit}
                      </p>
                    )}
                    {c.base && (
                      <p
                        className="mt-0.5 font-semibold"
                        style={{ color: GOLD, fontSize: 12.5 * fscale }}
                      >
                        {c.base}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
        )}
      </div>

      {anchor && (
        <WordTooltip
          word={anchor.word}
          sentence={anchor.sentence}
          langCode={langCode}
          x={anchor.x}
          y={anchor.y}
          onClose={() => setAnchor(null)}
          onSavedChange={onSavedChange}
        />
      )}
    </div>
  );
}

// ── Baris fokus (kalimat aktif di bawah video) ────────────────────────────────
function FocusLine({
  cue,
  time,
  analyze,
  breakdown,
  onWordTap,
  onRetryAnalyze,
  txState,
  asrRunning,
  scale,
}: {
  cue: LearnCue | null;
  time: number;
  analyze: boolean;
  breakdown: SentenceBreakdown | "loading" | "error" | undefined;
  onWordTap: (e: React.MouseEvent, word: string, sentence: string) => void;
  onRetryAnalyze: () => void;
  txState: "loading" | "ready" | "none";
  asrRunning: boolean;
  scale: number;
}) {
  if (txState !== "ready") {
    return (
      <div className="flex min-h-[92px] items-center justify-center px-6 py-4 text-center">
        <p className="text-[13px]" style={{ color: SUB }}>
          {txState === "loading"
            ? asrRunning
              ? "Membuat subtitle dengan AI… (~1 menit)"
              : "Menyiapkan subtitle…"
            : "Menonton dengan subtitle bawaan YouTube."}
        </p>
      </div>
    );
  }
  if (!cue) {
    return (
      <div className="flex min-h-[92px] items-center justify-center px-6 py-4 text-center">
        <p className="text-[13px]" style={{ color: SUB }}>
          Tekan play — subtitle akan muncul mengikuti audio. Ketuk kata mana pun untuk artinya.
        </p>
      </div>
    );
  }

  // Mode Analisa: tampilkan token berwarna + terjemahan akurat.
  if (analyze) {
    return (
      <div className="min-h-[92px] px-5 py-4 sm:px-6">
        {breakdown === "loading" || breakdown === undefined ? (
          <div className="flex items-center gap-2" style={{ color: SUB }}>
            <Loader2 className="h-4 w-4 animate-spin" /> Menganalisa kalimat…
          </div>
        ) : breakdown === "error" ? (
          <button onClick={onRetryAnalyze} className="text-[13px] font-bold" style={{ color: TEAL }}>
            Gagal menganalisa — ketuk untuk coba lagi
          </button>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-x-2 gap-y-2">
              {breakdown.tokens.map((t, i) => (
                <span
                  key={i}
                  onClick={(e) => onWordTap(e, t.word, cue.target)}
                  className="cursor-pointer text-center"
                >
                  <span
                    className="block font-extrabold leading-tight"
                    style={{ color: POS_COLOR[t.cat], fontSize: 21 * scale }}
                  >
                    {t.word}
                  </span>
                  <span className="block text-[10px] font-semibold" style={{ color: SUB }}>
                    {POS_LABEL_ID[t.cat]}
                  </span>
                </span>
              ))}
            </div>
            {breakdown.translation && (
              <p className="mt-2.5 font-bold" style={{ color: GOLD, fontSize: 14 * scale }}>
                {breakdown.translation}
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  // Mode normal: kalimat target besar (bisa di-tap) + translit + terjemahan emas.
  // Kata yang sedang diucapkan disorot ala karaoke (tersapu teal kiri→kanan).
  return (
    <div className="min-h-[92px] px-5 py-4 text-center sm:px-6">
      <KaraokeText
        cue={cue}
        time={time}
        onWordTap={onWordTap}
        className="font-extrabold leading-snug"
        fontSize={22 * scale}
      />
      {cue.translit && (
        <p className="mt-1 italic" style={{ color: SUB, fontSize: 13 * scale }}>
          {cue.translit}
        </p>
      )}
      {cue.base && (
        <p className="mt-1.5 font-bold" style={{ color: GOLD, fontSize: 16 * scale }}>
          {cue.base}
        </p>
      )}
    </div>
  );
}

// ── Efek karaoke ──────────────────────────────────────────────────────────────
// Cue transkrip hanya punya timing per-baris (start/end), tak ada per kata. Jadi
// durasi baris didistribusikan ke tiap token proporsional dengan panjang
// karakter — perkiraan tempo bicara yang cukup baik. Tiap token dapat status:
// "sung" (sudah lewat), "active" (sedang diucapkan, dengan progress 0..1), atau
// "future" (belum).
type KaraokeState = "sung" | "active" | "future";

// Perkiraan detik-per-karakter untuk kecepatan bicara natural. Dipakai membatasi
// durasi sapuan karaoke: caption & transkrip AI (yt-asr) sering MENAHAN satu baris
// di layar jauh lebih lama dari durasi ucapan sebenarnya (jeda/hening di akhir,
// segmen ASR yang kelewat panjang). Kalau sapuan dibentang ke sepanjang window itu,
// ia merangkak jauh di belakang audio. Jadi kalau window lebih panjang dari
// perkiraan bicara, kita pakai perkiraannya — sapuan tak akan lebih lambat dari suara.
const CJK_RE = /[぀-ヿ㐀-鿿가-힯]/;
function estSpeechDur(text: string): number {
  const chars = text.length || 1;
  // Aksara CJK jauh lebih padat (sedikit karakter per detik) dari Latin.
  const secPerChar = CJK_RE.test(text) ? 0.2 : 0.075;
  return chars * secPerChar;
}

function karaokeTokens(
  cue: LearnCue,
  time: number
): { text: string; isWord: boolean; state: KaraokeState; progress: number }[] {
  const toks = splitWords(cue.target);
  const total = cue.target.length || 1;
  const windowDur = Math.max(0.001, cue.end - cue.start);
  // Durasi efektif = window sebenarnya, TAPI tak lebih panjang dari perkiraan bicara
  // (mengoreksi baris yang tertahan lama). Kalau window sudah ketat, itu yang dipakai.
  const dur = Math.max(0.4, Math.min(windowDur, estSpeechDur(cue.target)));
  const frac = Math.min(1, Math.max(0, (time - cue.start) / dur));
  const played = frac * total; // jumlah karakter yang "sudah" terucap
  let acc = 0;
  return toks.map((t) => {
    const startC = acc;
    const endC = acc + t.text.length;
    acc = endC;
    let state: KaraokeState = "future";
    let progress = 0;
    if (endC <= played) state = "sung";
    else if (startC < played) {
      state = "active";
      progress = (played - startC) / Math.max(1, t.text.length);
    }
    return { text: t.text, isWord: t.isWord, state, progress };
  });
}

function KaraokeWord({
  text,
  state,
  progress,
  onClick,
}: {
  text: string;
  state: KaraokeState;
  progress: number;
  onClick: (e: React.MouseEvent) => void;
}) {
  const active = state === "active";
  const pct = state === "sung" ? 100 : active ? Math.round(progress * 100) : 0;
  return (
    <span
      onClick={onClick}
      className="relative mx-[1px] inline-block cursor-pointer rounded align-baseline transition-transform duration-200 hover:bg-[rgba(26,158,158,0.28)]"
      style={{ transform: active ? "translateY(-1px) scale(1.05)" : "none" }}
    >
      {/* lapisan dasar — belum diucapkan (putih) */}
      <span style={{ color: "#fff" }}>{text}</span>
      {/* lapisan terisi — sudah diucapkan (teal), tersapu kiri→kanan */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 overflow-hidden whitespace-nowrap"
        style={{
          width: `${pct}%`,
          color: TEAL,
          transition: "width 220ms linear",
          textShadow: active ? "0 0 16px rgba(26,158,158,0.55)" : "none",
        }}
      >
        {text}
      </span>
    </span>
  );
}

function KaraokeText({
  cue,
  time,
  onWordTap,
  className,
  fontSize,
}: {
  cue: LearnCue;
  time: number;
  onWordTap: (e: React.MouseEvent, word: string, sentence: string) => void;
  className?: string;
  fontSize?: number;
}) {
  const toks = useMemo(() => karaokeTokens(cue, time), [cue, time]);
  return (
    <p className={className} style={fontSize ? { fontSize } : undefined}>
      {toks.map((t, j) =>
        t.isWord ? (
          <KaraokeWord
            key={j}
            text={t.text}
            state={t.state}
            progress={t.progress}
            onClick={(e) => onWordTap(e, t.text, cue.target)}
          />
        ) : (
          <span
            key={j}
            style={{
              color: t.state === "future" ? "#fff" : TEAL,
              transition: "color 220ms linear",
            }}
          >
            {t.text}
          </span>
        )
      )}
    </p>
  );
}

function CtrlBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:opacity-30"
      style={{ border: `1px solid ${BORDER}` }}
    >
      {children}
    </button>
  );
}
