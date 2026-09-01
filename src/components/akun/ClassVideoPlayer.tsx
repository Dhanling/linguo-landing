"use client";

// [vc-player-v1] Pemutar rekaman kelas milik sendiri — bukan `<video controls>`.
// Salinan kembar dari dashboard (src/components/videoclass/VCVideoPlayer.tsx):
// dua repo terpisah, dan siswa berhak dapat pemutar yang sama enaknya.
//
// Dua alasan kenapa kontrol bawaan browser ditinggalkan:
//
//  1. **Tombol panah harus memaju-mundurkan video.** Kontrol bawaan baru mau
//     menerima papan ketik setelah bilahnya sendiri di-fokus (dan di dalam
//     dialog, fokus itu hampir tidak pernah mendarat di sana), jadi menonton
//     rekaman 50 menit berarti menyeret garis waktu dengan tetikus. Di sini
//     ← → = ±5 detik, J/L = ±10 detik, spasi = putar/jeda — persis YouTube.
//
//  2. **Layar penuh bawaan menarik gelembung "Google Translate" Chrome ke
//     dalam frame video**, dan gelembung itu mendarat di POJOK KIRI ATAS,
//     tepat menimpa materi yang dibagikan di rekaman. Selama pemutar tinggal
//     sebagai elemen halaman biasa, gelembung itu tetap menempel di kanan atas
//     jendela (dekat ikon terjemah di bilah alamat) dan tidak menutupi apa pun.
//     Permukaan pemutar juga ditandai `translate="no"` supaya Chrome tidak
//     menawarkan menerjemahkan isinya sama sekali.
//
// Kontrol overlay ditaruh di KANAN ATAS dengan alasan yang sama: kiri atas
// adalah tempat nama pemapar & judul dokumen berada di dalam rekaman.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, PictureInPicture2,
  RotateCcw, RotateCw, Gauge,
} from "lucide-react";

const teal = "#16796E"; // teal dashboard siswa
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const ARROW_STEP = 5;   // ← →  (YouTube)
const JL_STEP = 10;     // J L   (YouTube)

export const fmtClock = (sec: number): string => {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
};

interface Props {
  src: string;
  /** Aksi tambahan di pojok kanan atas panggung (tutup, unduh, …). */
  topRight?: ReactNode;
  autoPlay?: boolean;
  /** Pintasan papan ketik dipasang di window — matikan kalau ada pemutar lain. */
  keyboard?: boolean;
  className?: string;
}

export function ClassVideoPlayer({ src, topRight, autoPlay = true, keyboard = true, className = "" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [rateOpen, setRateOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [err, setErr] = useState(false);
  // Sapaan singkat tiap pintasan dipakai — tanpa ini tombol panah terasa mati.
  const [flash, setFlash] = useState<{ text: string; at: number } | null>(null);
  const flashTimer = useRef<number | null>(null);

  const say = useCallback((text: string) => {
    setFlash({ text, at: Date.now() });
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 700);
  }, []);

  // ── Aksi dasar ────────────────────────────────────────────────────────────
  const toggle = useCallback(() => {
    const v = vidRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }, []);

  const seekBy = useCallback((delta: number) => {
    const v = vidRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta));
    say(`${delta > 0 ? "+" : "−"}${Math.abs(delta)} detik`);
  }, [say]);

  const seekTo = useCallback((t: number) => {
    const v = vidRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    v.currentTime = Math.max(0, Math.min(v.duration, t));
  }, []);

  const setSpeed = useCallback((r: number) => {
    const v = vidRef.current;
    if (!v) return;
    v.playbackRate = r;
    setRate(r);
    setRateOpen(false);
    say(`${r}×`);
  }, [say]);

  const toggleFull = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void el.requestFullscreen?.().catch(() => {});
  }, []);

  const togglePip = useCallback(async () => {
    const v = vidRef.current as (HTMLVideoElement & { requestPictureInPicture?: () => Promise<unknown> }) | null;
    if (!v?.requestPictureInPicture) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch { /* browser menolak (belum ada metadata / tab tidak aktif) */ }
  }, []);

  // ── Sinkron dengan elemen video ───────────────────────────────────────────
  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    setErr(false); // sumber baru (mis. signed URL diperbarui) → lupakan galat lama
    const onTime = () => {
      setCur(v.currentTime);
      try {
        const b = v.buffered;
        setBuffered(b.length ? b.end(b.length - 1) : 0);
      } catch { /* buffered belum tersedia */ }
    };
    const onMeta = () => setDur(Number.isFinite(v.duration) ? v.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVol = () => { setVol(v.volume); setMuted(v.muted); };
    const onWait = () => setWaiting(true);
    const onGo = () => setWaiting(false);
    const onErr = () => { setErr(true); setWaiting(false); };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("progress", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("volumechange", onVol);
    v.addEventListener("waiting", onWait);
    v.addEventListener("playing", onGo);
    v.addEventListener("canplay", onGo);
    v.addEventListener("error", onErr);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("progress", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onMeta);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("volumechange", onVol);
      v.removeEventListener("waiting", onWait);
      v.removeEventListener("playing", onGo);
      v.removeEventListener("canplay", onGo);
      v.removeEventListener("error", onErr);
    };
  }, [src]);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => () => { if (flashTimer.current) window.clearTimeout(flashTimer.current); }, []);

  // ── Pintasan papan ketik ──────────────────────────────────────────────────
  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      // Jangan rebut tombol dari kolom isian / pencarian yang kebetulan terbuka.
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const v = vidRef.current;
      if (!v) return;

      switch (e.key) {
        case " ":
        case "k": case "K":
          e.preventDefault(); toggle(); return;
        case "ArrowRight": e.preventDefault(); seekBy(ARROW_STEP); return;
        case "ArrowLeft":  e.preventDefault(); seekBy(-ARROW_STEP); return;
        case "l": case "L": e.preventDefault(); seekBy(JL_STEP); return;
        case "j": case "J": e.preventDefault(); seekBy(-JL_STEP); return;
        case "ArrowUp":
          e.preventDefault(); v.muted = false;
          v.volume = Math.min(1, v.volume + 0.1); say(`Volume ${Math.round(v.volume * 100)}%`); return;
        case "ArrowDown":
          e.preventDefault();
          v.volume = Math.max(0, v.volume - 0.1); say(`Volume ${Math.round(v.volume * 100)}%`); return;
        case "m": case "M":
          e.preventDefault(); v.muted = !v.muted; say(v.muted ? "Bisu" : "Suara aktif"); return;
        case "f": case "F":
          e.preventDefault(); toggleFull(); return;
        case "p": case "P":
          e.preventDefault(); void togglePip(); return;
        case "Home": e.preventDefault(); seekTo(0); return;
        case "End": e.preventDefault(); seekTo(v.duration || 0); return;
        case ",": e.preventDefault(); setSpeed(SPEEDS[Math.max(0, SPEEDS.indexOf(v.playbackRate) - 1)] ?? 1); return;
        case ".": e.preventDefault(); setSpeed(SPEEDS[Math.min(SPEEDS.length - 1, SPEEDS.indexOf(v.playbackRate) + 1)] ?? 1); return;
      }
      // 0–9 = lompat ke 0%–90% durasi, seperti YouTube.
      if (/^[0-9]$/.test(e.key) && Number.isFinite(v.duration)) {
        e.preventDefault();
        seekTo((v.duration * Number(e.key)) / 10);
        say(`${Number(e.key) * 10}%`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboard, toggle, seekBy, seekTo, setSpeed, toggleFull, togglePip, say]);

  // ── Garis waktu ───────────────────────────────────────────────────────────
  const barRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef(false);
  const timeAtX = (clientX: number) => {
    const el = barRef.current;
    if (!el || !dur) return 0;
    const r = el.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * dur;
  };
  const onBarDown = (e: React.PointerEvent) => {
    scrubRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    seekTo(timeAtX(e.clientX));
  };
  const onBarMove = (e: React.PointerEvent) => { if (scrubRef.current) seekTo(timeAtX(e.clientX)); };
  const onBarUp = () => { scrubRef.current = false; };

  const pct = dur ? (cur / dur) * 100 : 0;
  const bufPct = dur ? Math.min(100, (buffered / dur) * 100) : 0;

  return (
    <div
      ref={wrapRef}
      // `translate="no"` = Chrome tidak menawarkan menerjemahkan panggung ini,
      // jadi gelembung Google Translate tidak pernah menimpa rekamannya.
      translate="no"
      className={`notranslate group relative select-none ${className}`}
      style={{ background: "#050F13", ...(full ? { width: "100%", height: "100%" } : null) }}
    >
      <video
        ref={vidRef}
        src={src}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        onClick={toggle}
        onDoubleClick={toggleFull}
        className="w-full block cursor-pointer"
        style={{ aspectRatio: full ? undefined : "16/9", height: full ? "100%" : undefined, background: "#050F13", objectFit: "contain" }}
      />

      {/* Aksi pemilik panggung — KANAN atas, lihat catatan berkas. */}
      {topRight && (
        <div className="absolute top-2.5 right-2.5 z-[3] flex items-center gap-1.5">{topRight}</div>
      )}

      {/* Umpan balik pintasan */}
      {flash && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none z-[4]">
          <span className="rounded-2xl px-4 py-2 font-extrabold text-[15px] text-white" style={{ background: "rgba(0,0,0,.62)" }}>
            {flash.text}
          </span>
        </div>
      )}

      {/* Tombol putar besar saat dijeda */}
      {!playing && !err && (
        <button
          onClick={toggle}
          aria-label="Putar"
          className="absolute inset-0 grid place-items-center border-none bg-transparent cursor-pointer z-[2]"
        >
          <span className="grid place-items-center rounded-full w-16 h-16" style={{ background: "rgba(0,0,0,.55)" }}>
            <Play size={26} fill="#fff" className="text-white ml-1" />
          </span>
        </button>
      )}

      {waiting && playing && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none z-[2]">
          <span className="block w-9 h-9 rounded-full animate-spin" style={{ border: "3px solid rgba(255,255,255,.25)", borderTopColor: "#fff" }} />
        </div>
      )}

      {err && (
        <div className="absolute inset-0 grid place-items-center px-6 text-center z-[5]" style={{ background: "rgba(5,15,19,.9)" }}>
          <p className="text-white font-bold text-[13.5px] m-0">
            Rekaman gagal dimuat.<br />
            <span className="font-semibold text-[12.5px]" style={{ color: "#8FB8B4" }}>Tautan pemutaran berlaku 1 jam — tutup lalu buka lagi.</span>
          </p>
        </div>
      )}

      {/* ── Bilah kontrol ─────────────────────────────────────────────────── */}
      {/* Bilah SELALU terlihat: rekaman kelas ditonton sambil dicatat, dan
          kontrol yang sembunyi otomatis cuma bikin garis waktu susah dicari. */}
      <div
        className="absolute left-0 right-0 bottom-0 z-[6] px-3 pb-2 pt-8"
        style={{ background: "linear-gradient(transparent, rgba(0,0,0,.78))" }}
      >
        <div
          ref={barRef}
          onPointerDown={onBarDown}
          onPointerMove={onBarMove}
          onPointerUp={onBarUp}
          onPointerCancel={onBarUp}
          className="relative h-3 flex items-center cursor-pointer"
          style={{ touchAction: "none" }}
          role="slider"
          aria-label="Garis waktu"
          aria-valuemin={0}
          aria-valuemax={Math.round(dur)}
          aria-valuenow={Math.round(cur)}
        >
          <span className="absolute left-0 right-0 h-1 rounded-full" style={{ background: "rgba(255,255,255,.24)" }} />
          <span className="absolute left-0 h-1 rounded-full" style={{ width: `${bufPct}%`, background: "rgba(255,255,255,.34)" }} />
          <span className="absolute left-0 h-1 rounded-full" style={{ width: `${pct}%`, background: teal }} />
          <span className="absolute w-3 h-3 rounded-full" style={{ left: `calc(${pct}% - 6px)`, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.5)" }} />
        </div>

        <div className="flex items-center gap-1.5 mt-1 text-white">
          <Ctl onClick={toggle} title={playing ? "Jeda (spasi)" : "Putar (spasi)"}>
            {playing ? <Pause size={16} fill="#fff" /> : <Play size={16} fill="#fff" />}
          </Ctl>
          <Ctl onClick={() => seekBy(-JL_STEP)} title="Mundur 10 detik (J / ←)"><RotateCcw size={15} /></Ctl>
          <Ctl onClick={() => seekBy(JL_STEP)} title="Maju 10 detik (L / →)"><RotateCw size={15} /></Ctl>

          <span className="font-extrabold text-[12px] tabular-nums ml-1" style={{ color: "#CFE6E3" }}>
            {fmtClock(cur)} <span style={{ color: "#6F9A96" }}>/ {fmtClock(dur)}</span>
          </span>

          <span className="flex-1" />

          <div className="hidden sm:flex items-center gap-1.5">
            <Ctl onClick={() => { const v = vidRef.current; if (v) v.muted = !v.muted; }} title={muted ? "Bunyikan (M)" : "Bisukan (M)"}>
              {muted || vol === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </Ctl>
            <input
              type="range" min={0} max={1} step={0.05}
              value={muted ? 0 : vol}
              onChange={(e) => { const v = vidRef.current; if (!v) return; v.muted = false; v.volume = Number(e.target.value); }}
              aria-label="Volume"
              className="w-16 cursor-pointer"
              style={{ accentColor: teal }}
            />
          </div>

          <div className="relative">
            <Ctl onClick={() => setRateOpen((o) => !o)} title="Kecepatan putar (, dan .)" active={rate !== 1}>
              <span className="inline-flex items-center gap-1 font-extrabold text-[11.5px]"><Gauge size={14} />{rate}×</span>
            </Ctl>
            {rateOpen && (
              <div className="absolute bottom-9 right-0 rounded-xl overflow-hidden py-1" style={{ background: "rgba(13,39,46,.97)", border: "1px solid rgba(255,255,255,.12)", minWidth: 74 }}>
                {SPEEDS.map((s) => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className="block w-full text-left border-none cursor-pointer px-3 py-1.5 font-extrabold text-[12px] text-white"
                    style={{ background: s === rate ? teal : "transparent" }}>
                    {s}×
                  </button>
                ))}
              </div>
            )}
          </div>

          <Ctl onClick={() => void togglePip()} title="Putar di jendela kecil (P)"><PictureInPicture2 size={15} /></Ctl>
          <Ctl onClick={toggleFull} title={full ? "Keluar layar penuh (F)" : "Layar penuh (F)"}>
            {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </Ctl>
        </div>
      </div>
    </div>
  );
}

function Ctl({ children, onClick, title, active }: { children: ReactNode; onClick: () => void; title: string; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="grid place-items-center h-8 min-w-8 px-2 rounded-lg border-none cursor-pointer text-white shrink-0"
      style={{ background: active ? teal : "rgba(255,255,255,.1)" }}
    >
      {children}
    </button>
  );
}
