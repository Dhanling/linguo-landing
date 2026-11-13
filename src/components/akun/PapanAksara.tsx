'use client';

// [slide-menulis-v1] Papan menulis satu aksara — dipakai slide "Latihan Menulis · Part N"
// (ubin contoh + latihan mandiri) dan papan Tulis Bersama di Linguo Meet.
//
// Lapisan dari bawah: kertas + garis bantu 田 → bayangan/contoh huruf (path goresan
// kalau datanya ada, kalau tidak huruf dari font) → animasi urutan goresan → tinta.
// Tinta = daftar garis berkoordinat 0..1 terhadap sisi papan, jadi papan HP murid
// dan layar lebar pengajar menampilkan tulisan yang sama persis.
//
// Kertas SENGAJA selalu terang dengan warna inline (bukan kelas) — mode gelap dua
// dashboard menimpa lewat nama kelas. Berkas ini KEMBAR dengan
// linguo-admin-dashboard/src/components/materi/PapanAksara.tsx (beda jalur impor).

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { KOTAK_GORESAN, muatGoresan, type SumberGoresan } from "@/lib/writingScripts";
import type { MenulisHuruf } from "@/lib/materiSlides";
import { bahasaAksara, sumberGoresanPaket, teksTulis, teksUcap, type PaketTulis } from "@/lib/paketMenulis";

export const TINTA = "#0f172a";
export const TEAL = "#1A9E9E";
const BAYANGAN = "#d5dee6";
const GARIS_BANTU = "#f2c9c9";

export interface GarisTinta { pts: number[]; warna: string }

const FONT_CADANGAN =
  '"Noto Sans", "Noto Sans JP", "Noto Sans SC", "Noto Sans KR", "Noto Sans Thai", "Noto Sans Arabic", "Noto Sans Hebrew", "Noto Sans Devanagari", "Hiragino Sans", "PingFang SC", "Apple SD Gothic Neo", "Geeza Pro", system-ui, sans-serif';

const fontDimuat = new Set<string>();
/** Muat keluarga Google Fonts aksaranya sekali per halaman (sama dengan WritingPractice). */
export function muatFontAksara(family?: string) {
  if (!family || fontDimuat.has(family) || typeof document === "undefined") return;
  fontDimuat.add(family);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}&display=swap`;
  document.head.appendChild(l);
}

/** Path goresan satu huruf (null = belum/tak ada data → pakai huruf dari font). */
export function useGoresan(teks: string, sumber?: SumberGoresan): string[] | null {
  const [jalur, setJalur] = useState<string[] | null>(null);
  useEffect(() => {
    setJalur(null);
    // Satu aksara saja yang punya urutan goresan; gabungan (mis. "ゃ" + tanda) jatuh ke font.
    if (!sumber || Array.from(teks).length !== 1) return;
    let batal = false;
    void muatGoresan(teks, sumber).then((j) => { if (!batal) setJalur(j); });
    return () => { batal = true; };
  }, [teks, sumber]);
  return jalur;
}

/** Titik awal tiap path (untuk nomor urut goresan). */
function titikAwal(d: string): [number, number] | null {
  const m = /M\s*(-?[\d.]+)[ ,]+(-?[\d.]+)/i.exec(d);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

const GAYA_ANIM = `@keyframes papan-goresan{to{stroke-dashoffset:0}}`;

export function PapanAksara({
  huruf, sumber, font, tampil = "bayangan", demo = 0, tinta = [], versi = 0,
  bisaTulis = false, tebal = 0.032, onMulai, onTambah, onSelesai, className, style, judul,
}: {
  huruf: MenulisHuruf;
  sumber?: SumberGoresan;
  font?: string;
  /** "contoh" = huruf gelap + nomor urut (ubin slide), "bayangan" = jiplakan pucat. */
  tampil?: "contoh" | "bayangan" | "kosong";
  /** Naikkan angkanya untuk memutar ulang animasi urutan goresan (0 = tidak diputar). */
  demo?: number;
  tinta?: GarisTinta[];
  /** Naikkan tiap isi `tinta` berubah (array-nya boleh dimutasi di tempat). */
  versi?: number;
  bisaTulis?: boolean;
  /** Tebal tinta relatif sisi papan. */
  tebal?: number;
  onMulai?: (x: number, y: number) => void;
  onTambah?: (x: number, y: number) => void;
  onSelesai?: () => void;
  className?: string;
  style?: CSSProperties;
  judul?: string;
}) {
  const teks = teksTulis(huruf);
  const jalur = useGoresan(teks, sumber);
  const kanvasRef = useRef<HTMLCanvasElement>(null);
  const bungkusRef = useRef<HTMLDivElement>(null);
  const tintaRef = useRef(tinta);
  tintaRef.current = tinta;
  const sedangRef = useRef(false);
  const fam = font ? `"${font}", ${FONT_CADANGAN}` : FONT_CADANGAN;

  const lukis = () => {
    const c = kanvasRef.current;
    const w = bungkusRef.current;
    if (!c || !w) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const S = Math.max(1, Math.round(w.clientWidth * dpr));
    if (c.width !== S || c.height !== S) { c.width = S; c.height = S; }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, S, S);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const g of tintaRef.current) {
      const p = g.pts;
      if (p.length < 2) continue;
      ctx.strokeStyle = g.warna;
      ctx.fillStyle = g.warna;
      ctx.lineWidth = Math.max(2, tebal * S);
      if (p.length === 2) {
        ctx.beginPath();
        ctx.arc(p[0] * S, p[1] * S, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(p[0] * S, p[1] * S);
      for (let i = 2; i < p.length - 2; i += 2) {
        const mx = ((p[i] + p[i + 2]) / 2) * S;
        const my = ((p[i + 1] + p[i + 3]) / 2) * S;
        ctx.quadraticCurveTo(p[i] * S, p[i + 1] * S, mx, my);
      }
      ctx.lineTo(p[p.length - 2] * S, p[p.length - 1] * S);
      ctx.stroke();
    }
  };

  useEffect(lukis);
  useEffect(() => {
    const w = bungkusRef.current;
    if (!w || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => lukis());
    ro.observe(w);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // `versi` cukup memicu render ulang; lukis() jalan di efek tanpa dependensi di atas.
  void versi;

  const titik = (e: React.PointerEvent): [number, number] => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (e.clientX - r.left) / Math.max(1, r.width))),
      Math.min(1, Math.max(0, (e.clientY - r.top) / Math.max(1, r.height))),
    ];
  };

  const K = KOTAK_GORESAN;
  const awal = useMemo(() => (jalur ?? []).map(titikAwal), [jalur]);
  const contoh = tampil === "contoh";
  const warnaHuruf = contoh ? "#334155" : BAYANGAN;

  return (
    <div ref={bungkusRef} className={className} title={judul}
      style={{ position: "relative", aspectRatio: "1 / 1", background: "#ffffff", borderRadius: "0.6em", overflow: "hidden",
        boxShadow: "inset 0 0 0 1px #e2e8f0", touchAction: bisaTulis ? "none" : undefined, ...style }}>
      <style>{GAYA_ANIM}</style>
      <svg viewBox={`0 0 ${K} ${K}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} aria-hidden>
        {/* Garis bantu 田: silang putus-putus seperti buku latihan menulis. */}
        <g stroke={GARIS_BANTU} strokeWidth={0.6} strokeDasharray="2.4 2.4" fill="none">
          <line x1={K / 2} y1={2} x2={K / 2} y2={K - 2} />
          <line x1={2} y1={K / 2} x2={K - 2} y2={K / 2} />
        </g>
        {tampil !== "kosong" && (jalur ? (
          <g fill="none" stroke={warnaHuruf} strokeWidth={contoh ? 5.5 : 7.5} strokeLinecap="round" strokeLinejoin="round">
            {jalur.map((d, i) => <path key={i} d={d} />)}
          </g>
        ) : (
          <text x={K / 2} y={K / 2} textAnchor="middle" dominantBaseline="central" fill={warnaHuruf}
            style={{ fontFamily: fam, fontSize: Array.from(teks).length > 1 ? 52 : 74 }}>{teks}</text>
        ))}
        {/* Nomor urut di titik awal tiap goresan. */}
        {jalur && tampil !== "kosong" && awal.map((a, i) => a && (
          <g key={i}>
            <circle cx={a[0]} cy={a[1]} r={4.2} fill={contoh ? TEAL : "#9fd8d8"} />
            <text x={a[0]} y={a[1] + 0.2} textAnchor="middle" dominantBaseline="central" fill="#fff" style={{ fontSize: 5.4, fontWeight: 800, fontFamily: "system-ui, sans-serif" }}>{i + 1}</text>
          </g>
        ))}
        {demo > 0 && jalur && (
          <g key={demo} fill="none" stroke={TEAL} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
            {jalur.map((d, i) => (
              <path key={i} d={d} pathLength={1}
                style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: `papan-goresan .62s ease-in-out ${i * 0.7}s forwards` }} />
            ))}
          </g>
        )}
      </svg>
      <canvas ref={kanvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: bisaTulis ? "crosshair" : "default", pointerEvents: bisaTulis ? "auto" : "none" }}
        onPointerDown={bisaTulis ? (e) => {
          e.preventDefault();
          try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* lama */ }
          sedangRef.current = true;
          const [x, y] = titik(e);
          onMulai?.(x, y);
        } : undefined}
        onPointerMove={bisaTulis ? (e) => {
          if (!sedangRef.current) return;
          const [x, y] = titik(e);
          onTambah?.(x, y);
        } : undefined}
        onPointerUp={bisaTulis ? () => { if (sedangRef.current) { sedangRef.current = false; onSelesai?.(); } } : undefined}
        onPointerCancel={bisaTulis ? () => { if (sedangRef.current) { sedangRef.current = false; onSelesai?.(); } } : undefined}
      />
    </div>
  );
}

/* ── Latihan mandiri (klik ubin di slide) ─────────────────────────────────── */

const EN: Record<string, string> = {
  "Latihan Menulis": "Writing Practice", "Contoh goresan": "Show strokes", "Bayangan": "Guide",
  "Batalkan": "Undo", "Hapus": "Clear", "Dengar": "Listen", "Tutup": "Close",
  "Tulis di papan mengikuti nomor urut goresannya.": "Write on the board following the numbered stroke order.",
};

export function LatihanAksaraModal({ paket, mulai = 0, ucap, ui, onClose }: {
  paket: PaketTulis;
  mulai?: number;
  /** Bunyikan teks (TTS); tanpa ini tombol Dengar disembunyikan. */
  ucap?: (teks: string) => void;
  ui?: "en";
  onClose: () => void;
}) {
  const t = (s: string) => (ui === "en" ? EN[s] ?? s : s);
  const lang = bahasaAksara(paket.aksara);
  const sumber = sumberGoresanPaket(paket.aksara, paket.set);
  const [i, setI] = useState(Math.min(Math.max(0, mulai), paket.huruf.length - 1));
  const [demo, setDemo] = useState(1);
  const [bayangan, setBayangan] = useState(true);
  const [versi, setVersi] = useState(0);
  const garisRef = useRef<GarisTinta[]>([]);
  const h = paket.huruf[i];

  useEffect(() => { muatFontAksara(lang?.font); }, [lang?.font]);
  useEffect(() => { garisRef.current = []; setVersi((v) => v + 1); setDemo((d) => d + 1); }, [i]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [onClose]);

  const tombol: CSSProperties = { border: "1px solid #e2e8f0", background: "#fff", color: "#334155", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(15,23,42,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "#f8fafc", color: "#0f172a", borderRadius: 20, width: "min(560px, 100%)", maxHeight: "94vh", overflowY: "auto", padding: 18, boxShadow: "0 20px 60px rgba(0,0,0,.35)", fontFamily: "inherit" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: TEAL }}>{t("Latihan Menulis")} · Part {paket.part}</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{paket.label}</div>
          </div>
          <button onClick={onClose} style={tombol}>{t("Tutup")}</button>
        </div>

        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {paket.huruf.map((x, j) => (
            <button key={j} onClick={() => setI(j)}
              style={{ minWidth: 44, height: 44, borderRadius: 12, cursor: "pointer", fontSize: 22, fontFamily: lang?.font ? `"${lang.font}", ${FONT_CADANGAN}` : FONT_CADANGAN,
                border: j === i ? `2px solid ${TEAL}` : "1px solid #e2e8f0", background: j === i ? "#e6f6f6" : "#fff", color: "#0f172a" }}>
              {x.c}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12 }}>
          <span style={{ fontSize: 26, fontWeight: 800 }}>{h.r}</span>
          {h.n && <span style={{ fontSize: 14, color: "#64748b" }}>{h.n}</span>}
        </div>

        <PapanAksara huruf={h} sumber={sumber} font={lang?.font} tampil={bayangan ? "bayangan" : "kosong"} demo={demo}
          tinta={garisRef.current} versi={versi} bisaTulis
          style={{ width: "min(100%, 62vh)", margin: "10px auto 0", boxShadow: "0 0 0 1px #cbd5e1, 0 6px 18px rgba(15,23,42,.08)" }}
          onMulai={(x, y) => { garisRef.current.push({ pts: [x, y], warna: TINTA }); setVersi((v) => v + 1); }}
          onTambah={(x, y) => { const g = garisRef.current[garisRef.current.length - 1]; if (g) { g.pts.push(x, y); setVersi((v) => v + 1); } }}
        />
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b", textAlign: "center" }}>{t("Tulis di papan mengikuti nomor urut goresannya.")}</p>

        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button style={tombol} onClick={() => setDemo((d) => d + 1)}>{t("Contoh goresan")}</button>
          <button style={{ ...tombol, ...(bayangan ? { borderColor: TEAL, color: TEAL } : null) }} onClick={() => setBayangan((b) => !b)}>{t("Bayangan")}</button>
          <button style={tombol} onClick={() => { garisRef.current.pop(); setVersi((v) => v + 1); }}>{t("Batalkan")}</button>
          <button style={tombol} onClick={() => { garisRef.current = []; setVersi((v) => v + 1); }}>{t("Hapus")}</button>
          {ucap && <button style={tombol} onClick={() => ucap(teksUcap(h))}>{t("Dengar")}</button>}
          <button style={tombol} disabled={i === 0} onClick={() => setI((j) => Math.max(0, j - 1))}>‹</button>
          <button style={tombol} disabled={i >= paket.huruf.length - 1} onClick={() => setI((j) => Math.min(paket.huruf.length - 1, j + 1))}>›</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
