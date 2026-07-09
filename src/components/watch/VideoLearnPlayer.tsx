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
  Palette,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import {
  fetchTranscript,
  getSentenceBreakdown,
  LearnCue,
  POS_COLOR,
  POS_LABEL_ID,
  SentenceBreakdown,
  splitWords,
} from "@/lib/immersionLearn";
import { ImmersionVideo } from "@/lib/immersion";
import { WordTooltip } from "./WordTooltip";

const TEAL = "#1A9E9E";
const GOLD = "#F4B740";
const CARD = "#161A1C";
const BORDER = "rgba(255,255,255,0.08)";
const SUB = "rgba(255,255,255,0.5)";

const SPEEDS = [1, 0.75, 0.5, 1.25];

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
}: {
  video: ImmersionVideo;
  langCode: string;
  onClose: () => void;
  onSavedChange?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [showCC, setShowCC] = useState(false); // CC bawaan YouTube (fallback)

  const [cues, setCues] = useState<LearnCue[]>([]);
  const [txState, setTxState] = useState<"loading" | "ready" | "none">("loading");
  // True saat transkrip jatuh ke jalur AI (yt-asr) yang lambat — buat pesan loading.
  const [asrRunning, setAsrRunning] = useState(false);

  const [analyze, setAnalyze] = useState(false);
  const [breakdowns, setBreakdowns] = useState<Record<number, SentenceBreakdown | "loading" | "error">>({});

  const [anchor, setAnchor] = useState<Anchor | null>(null);

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
    setCues([]);
    setBreakdowns({});
    fetchTranscript(video.videoId, langCode, {
      onAsr: () => !cancelled && setAsrRunning(true),
    }).then((r) => {
      if (cancelled) return;
      if (r.cues.length) {
        setCues(r.cues);
        setTxState("ready");
      } else {
        setTxState("none");
        setShowCC(true); // fallback ke caption bawaan YouTube
      }
    });
    return () => {
      cancelled = true;
    };
  }, [video.videoId, langCode]);

  // Terapkan CC bawaan (dipakai kalau transkrip kita tak tersedia).
  useEffect(() => {
    if (!ready) return;
    try {
      if (showCC) playerRef.current?.loadModule?.("captions");
      else playerRef.current?.unloadModule?.("captions");
    } catch {
      /* abaikan */
    }
  }, [showCC, ready]);

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
        {/* Kiri: video + baris fokus + kontrol */}
        <div className="flex min-h-0 flex-col lg:w-[62%]">
          <div className="relative w-full shrink-0 bg-black" style={{ aspectRatio: "16 / 9" }}>
            <div ref={hostRef} className="absolute inset-0 h-full w-full" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin" color={SUB} />
              </div>
            )}
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
          </div>
        </div>

        {/* Kanan: transkrip penuh */}
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
                        className="text-[14px] font-semibold leading-snug"
                      />
                    ) : (
                      <p className="text-[14px] font-semibold leading-snug text-white">
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
                      <p className="mt-0.5 text-[12px] italic" style={{ color: SUB }}>
                        {c.translit}
                      </p>
                    )}
                    {c.base && (
                      <p className="mt-0.5 text-[12.5px] font-semibold" style={{ color: GOLD }}>
                        {c.base}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
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
}: {
  cue: LearnCue | null;
  time: number;
  analyze: boolean;
  breakdown: SentenceBreakdown | "loading" | "error" | undefined;
  onWordTap: (e: React.MouseEvent, word: string, sentence: string) => void;
  onRetryAnalyze: () => void;
  txState: "loading" | "ready" | "none";
  asrRunning: boolean;
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
                    className="block text-[19px] font-extrabold leading-tight sm:text-[22px]"
                    style={{ color: POS_COLOR[t.cat] }}
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
              <p className="mt-2.5 text-[14px] font-bold" style={{ color: GOLD }}>
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
        className="text-[20px] font-extrabold leading-snug sm:text-[24px]"
      />
      {cue.translit && (
        <p className="mt-1 text-[13px] italic" style={{ color: SUB }}>
          {cue.translit}
        </p>
      )}
      {cue.base && (
        <p className="mt-1.5 text-[15px] font-bold sm:text-[16px]" style={{ color: GOLD }}>
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

function karaokeTokens(
  cue: LearnCue,
  time: number
): { text: string; isWord: boolean; state: KaraokeState; progress: number }[] {
  const toks = splitWords(cue.target);
  const total = cue.target.length || 1;
  const dur = Math.max(0.001, cue.end - cue.start);
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
}: {
  cue: LearnCue;
  time: number;
  onWordTap: (e: React.MouseEvent, word: string, sentence: string) => void;
  className?: string;
}) {
  const toks = useMemo(() => karaokeTokens(cue, time), [cue, time]);
  return (
    <p className={className}>
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
