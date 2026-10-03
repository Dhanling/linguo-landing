"use client";

// [latihan-menulis-v1] [latihan-menulis-v2] Menu "Latihan Menulis" — latihan menulis aksara non-Latin
// (Jepang, Mandarin, Korea, Thailand, Arab, Rusia, Hindi, Yunani, Ibrani).
// Berkas ini KEMBAR dengan linguo-admin-dashboard/src/components/teacher/WritingPractice.tsx
// (beda cuma jalur impor) — ubah dua-duanya sekaligus.
//
// Dua papan:
//   • PapanGoresan — aksara yang punya data urutan goresan (kana/kanji/Hanzi):
//     animasi cara menulis + latihan goresan demi goresan, urutan & arahnya dicek.
//   • PapanJiplak — semua aksara: kanvas bebas dengan bayangan huruf yang bisa
//     disembunyikan, dinilai dari kemiripan bentuk (lokal) atau oleh AI.
// Kemajuan disimpan di localStorage per peramban, tidak ke database.
//
// [latihan-menulis-v2] Latihan berjenjang (saran review tim): Tahap 1 huruf →
// Tahap 2 kata → Tahap 3 kalimat sederhana, tiap kata/kalimat tampil dengan
// artinya. Kata & kalimat ditulis bagian demi bagian (per aksara atau per kata);
// bagian yang lebih dari satu aksara memakai papan lebar.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, Check, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2, PenLine, Play, RotateCcw,
  Sparkles, Undo2, Volume2,
} from "lucide-react";
import { useUiLang } from "@/lib/uiLang";
import {
  KOTAK_GORESAN, SCRIPT_LANGS, muatGoresan, pecahBagian, pilihBahasaAksara, teksFrasa,
  type Glyph, type ScriptLang, type ScriptSet,
} from "@/lib/writingScripts";

export type HasilNilaiAi = { score: number; feedback: string; tips: string[] };
export type MintaNilaiAi = (a: {
  /** PNG tulisan (base64 tanpa prefiks data:), tinta hitam di atas putih. */
  png: string;
  char: string;
  roman: string;
  script: string;
  uiLang: "id" | "en";
}) => Promise<HasilNilaiAi>;

type Props = {
  /** Kelas warna mengikuti dashboard tempatnya dipasang. */
  skin?: "siswa" | "pengajar";
  /** Nama bahasa kelas yang sedang diikuti/diajar — menentukan aksara yang dibuka duluan. */
  preferLangs?: (string | null | undefined)[];
  speak?: (teks: string, kode: string) => void;
  aiGrade?: MintaNilaiAi;
};

/* ── teks antarmuka ───────────────────────────────────────────────────────────
   Kamus EN ditaruh di sini (bukan di lib/uiLang) supaya komponen kembar di dua
   repo tetap satu berkas utuh. Kuncinya kalimat Indonesia, sama seperti lib/uiLang. */
const EN: Record<string, string> = {
  "Latihan Menulis": "Writing Practice",
  "Latih tulisan tangan aksara non-Latin secara bertahap: mulai dari huruf, lanjut ke kata, lalu kalimat — lengkap dengan cara baca dan artinya.":
    "Practise handwriting non-Latin scripts step by step: start with letters, move on to words, then sentences — each with its reading and meaning.",
  "Tahap": "Stage", "Huruf": "Letters", "Kata": "Words", "Kalimat": "Sentences",
  "Kata dasar": "Basic words", "Kalimat sederhana (A1)": "Simple sentences (A1)",
  "Saran: kuasai dulu huruf-hurufnya di Tahap 1 supaya menulis kata dan kalimat lebih lancar.":
    "Tip: master the letters in Stage 1 first so writing words and sentences comes more easily.",
  "Tahap ini tuntas!": "Stage complete!", "Lanjut ke": "Continue to",
  "Tulis bagian demi bagian": "Write it part by part", "Bagian": "Part",
  "Bagian berikutnya": "Next part",
  "Semua bagian sudah ditulis.": "Every part has been written.",
  "Penilaian AI sedang tidak tersedia, jadi tulisanmu dinilai dari kemiripan bentuknya dulu.":
    "AI grading is unavailable right now, so your writing was scored by shape similarity instead.",
  "Jepang": "Japanese", "Mandarin": "Mandarin", "Korea": "Korean", "Thailand": "Thai", "Arab": "Arabic",
  "Rusia": "Russian", "Hindi": "Hindi", "Yunani": "Greek", "Ibrani": "Hebrew",
  "Kanji dasar (N5)": "Basic kanji (N5)", "Hanzi dasar (HSK 1)": "Basic Hanzi (HSK 1)",
  "Konsonan": "Consonants", "Vokal": "Vowels", "Suku kata": "Syllables", "Angka": "Numerals",
  "Huruf hijaiyah": "Arabic letters", "Alfabet Kiril": "Cyrillic alphabet", "Alfabet": "Alphabet",
  "Tulis sendiri": "Your own text",
  "dikuasai": "mastered",
  "Ketik kata atau huruf yang mau dilatih": "Type the word or letters you want to practise",
  "Maksimal 8 huruf. Tulisannya dinilai dari bentuk atau oleh AI.": "Up to 8 characters. Your writing is scored by shape or by AI.",
  "Baca": "Reading", "Arti": "Meaning", "Dengar": "Listen",
  "Urutan goresan": "Stroke order", "Tulis bebas": "Free writing",
  "Putar animasi": "Play animation", "Ulangi": "Start over", "Batalkan goresan": "Undo stroke", "Hapus": "Clear",
  "Sembunyikan bayangan": "Hide guide", "Tampilkan bayangan": "Show guide",
  "Cek tulisan": "Check writing", "Nilai dengan AI": "Grade with AI", "Menilai…": "Grading…",
  "Memuat urutan goresan…": "Loading stroke order…",
  "Data urutan goresan belum tersedia untuk huruf ini — latihan pakai papan tulis bebas.":
    "Stroke-order data is not available for this character — practise on the free-writing board.",
  "Goresan": "Stroke", "dari": "of",
  "Tulis goresan berikutnya, mulai dari titik hijau.": "Draw the next stroke, starting from the green dot.",
  "Belum pas — coba lagi.": "Not quite — try again.",
  "Arah goresannya terbalik.": "The stroke direction is reversed.",
  "Perhatikan contohnya, lalu ulangi.": "Watch the example, then try again.",
  "Selesai! Urutan goresanmu benar.": "Done! Your stroke order is correct.",
  "Skor": "Score", "Skor terbaik": "Best score",
  "Tulis dulu hurufnya di papan.": "Write the character on the board first.",
  "Mirip sekali — pertahankan!": "Very close — keep it up!",
  "Sudah terbaca, rapikan lagi bentuknya.": "Readable — tidy up the shape a little more.",
  "Bentuknya masih jauh. Coba jiplak dengan bayangan dulu.": "The shape is still off. Try tracing with the guide first.",
  "Penilaian AI": "AI feedback",
  "Penilaian AI sedang tidak bisa dipakai. Coba lagi sebentar lagi.": "AI grading is unavailable right now. Please try again shortly.",
  "Sebelumnya": "Previous", "Berikutnya": "Next",
  "Urutan goresan: KanjiVG (CC BY-SA 3.0) & Make Me a Hanzi.": "Stroke order: KanjiVG (CC BY-SA 3.0) & Make Me a Hanzi.",
  "Kemajuan tersimpan di perangkat ini.": "Progress is saved on this device.",
  "pendek": "short", "panjang": "long",
};

const SKIN = {
  siswa: {
    kartu: "rounded-2xl border border-slate-200 bg-white shadow-sm",
    judul: "text-slate-900",
    redup: "text-slate-500",
    pil: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
    pilAktif: "border-teal-600 bg-teal-600 text-white",
    sel: "border-slate-200 bg-white text-slate-800 hover:border-teal-400",
    selAktif: "border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-200",
    selLulus: "border-teal-200 bg-teal-50 text-teal-800",
    tombol: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    utama: "bg-teal-600 text-white hover:bg-teal-700",
    masukan: "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400",
    ikon: "bg-teal-50 text-teal-700",
    rel: "bg-slate-100",
    catatan: "border-slate-200 bg-slate-50 text-slate-700",
  },
  pengajar: {
    kartu: "rounded-2xl border bg-card shadow-sm",
    judul: "text-foreground",
    redup: "text-muted-foreground",
    pil: "border-border bg-background text-foreground/70 hover:bg-muted",
    pilAktif: "border-[#0c7d6c] bg-[#0c7d6c] text-white",
    sel: "border-border bg-background text-foreground hover:border-[#0c7d6c]",
    selAktif: "border-[#0c7d6c] bg-[#0c7d6c]/10 text-foreground ring-2 ring-[#0c7d6c]/30",
    selLulus: "border-[#0c7d6c]/40 bg-[#0c7d6c]/10 text-foreground",
    tombol: "border-border bg-background text-foreground hover:bg-muted",
    utama: "bg-[#0c7d6c] text-white hover:bg-[#0a6a5c]",
    masukan: "border-border bg-background text-foreground placeholder:text-muted-foreground",
    ikon: "bg-[#0c7d6c]/10 text-[#0c7d6c] dark:text-[#2cbca4]",
    rel: "bg-muted",
    catatan: "border-border bg-muted/50 text-foreground",
  },
} as const;
type Skin = (typeof SKIN)[keyof typeof SKIN];

/* Kertas papan tulis SENGAJA selalu terang (warna inline, bukan kelas): mode gelap
   dua dashboard menimpa lewat nama kelas, dan tinta gelap di atas kertas putih
   paling mudah dibaca — sama seperti kertas sertifikat. */
const KERTAS = "#ffffff";
const TINTA = "#0f172a";
const BAYANGAN = "#dbe3ea";
const TEAL = "#1A9E9E";
const MERAH = "#e11d48";
const BATAS_LULUS = 80;

const FONT_AKSARA =
  '"Noto Sans", "Noto Sans JP", "Noto Sans KR", "Noto Sans Thai", "Noto Sans Arabic", "Noto Sans Devanagari", "Noto Sans Hebrew", "Hiragino Sans", "Apple SD Gothic Neo", "Thonburi", "Geeza Pro", "Malgun Gothic", "Leelawadee UI", "Nirmala UI", system-ui, sans-serif';

/* ── kemajuan (localStorage) ──────────────────────────────────────────────── */
const KUNCI_KEMAJUAN = "linguo:menulis:v1";
type Kemajuan = Record<string, Record<string, number>>;
function bacaKemajuan(): Kemajuan {
  try { return JSON.parse(localStorage.getItem(KUNCI_KEMAJUAN) || "{}") as Kemajuan; } catch { return {}; }
}

/* ── geometri ─────────────────────────────────────────────────────────────── */
type Pt = [number, number];
const jarak = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const panjangGaris = (p: Pt[]) => p.reduce((s, q, i) => (i ? s + jarak(p[i - 1], q) : 0), 0);

/** n titik berjarak sama di sepanjang garis. */
function sampelUlang(p: Pt[], n: number): Pt[] {
  const total = panjangGaris(p);
  if (p.length < 2 || total === 0) return Array.from({ length: n }, () => p[0]);
  const out: Pt[] = [p[0]];
  let lewat = 0;
  let i = 1;
  for (let k = 1; k < n; k++) {
    const target = (total * k) / (n - 1);
    while (i < p.length - 1 && lewat + jarak(p[i - 1], p[i]) < target) {
      lewat += jarak(p[i - 1], p[i]);
      i++;
    }
    const seg = jarak(p[i - 1], p[i]) || 1;
    const t = Math.min(1, Math.max(0, (target - lewat) / seg));
    out.push([p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t]);
  }
  return out;
}

/** Cocokkan goresan siswa dengan goresan acuan (satuan kotak 109). */
function cocokGoresan(siswa: Pt[], acuan: SVGPathElement, panjang: number): "ok" | "terbalik" | "meleset" {
  const N = 16;
  const R: Pt[] = Array.from({ length: N }, (_, i) => {
    const t = acuan.getPointAtLength((panjang * i) / (N - 1));
    return [t.x, t.y];
  });
  const U = sampelUlang(siswa, N);
  const panjangSiswa = panjangGaris(siswa);
  // Titik & goresan pendek (dakuten, tetesan): cukup jatuh di tempat yang benar.
  if (panjang < 14) return jarak(U[N >> 1], R[N >> 1]) < 22 && panjangSiswa < 45 ? "ok" : "meleset";
  const rasio = panjangSiswa / panjang;
  if (rasio < 0.4 || rasio > 2.2) return "meleset";
  const rata = U.reduce((s, u, i) => s + jarak(u, R[i]), 0) / N;
  const rataBalik = U.reduce((s, u, i) => s + jarak(u, R[N - 1 - i]), 0) / N;
  if (rata < 17 && jarak(U[0], R[0]) < 28 && jarak(U[N - 1], R[N - 1]) < 32) return "ok";
  if (rataBalik < 17 && rataBalik < rata) return "terbalik";
  return "meleset";
}

/* ── kanvas ───────────────────────────────────────────────────────────────── */
/* Papan bisa persegi (satu aksara) atau lebar (kata). Titik tulisan dinormalkan
   terhadap LEBAR papan di kedua sumbu, jadi y berkisar 0..rasio. */
const RASIO_LEBAR = 0.5;

function gambarHuruf(ctx: CanvasRenderingContext2D, W: number, H: number, teks: string, warna: string, rtl: boolean) {
  ctx.save();
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = warna;
  let px = H * 0.62;
  const ukur = () => {
    ctx.font = `${px}px ${FONT_AKSARA}`;
    const m = ctx.measureText(teks);
    return {
      kiri: m.actualBoundingBoxLeft,
      w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
      naik: m.actualBoundingBoxAscent,
      h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
    };
  };
  let m = ukur();
  const skala = Math.min(1.25, (W * (W === H ? 0.72 : 0.88)) / Math.max(1, m.w), (H * 0.72) / Math.max(1, m.h));
  px *= skala;
  m = ukur();
  ctx.fillText(teks, (W - m.w) / 2 + m.kiri, (H - m.h) / 2 + m.naik);
  ctx.restore();
}

/** Garis dalam satuan lebar papan (S = lebar dalam piksel), dihaluskan lewat titik tengah. */
function gambarGaris(ctx: CanvasRenderingContext2D, S: number, garis: Pt[][], warna: string, tebal: number) {
  ctx.save();
  ctx.strokeStyle = warna;
  ctx.fillStyle = warna;
  ctx.lineWidth = tebal;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const g of garis) {
    if (!g.length) continue;
    if (g.length === 1) {
      ctx.beginPath();
      ctx.arc(g[0][0] * S, g[0][1] * S, tebal / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(g[0][0] * S, g[0][1] * S);
    for (let i = 1; i < g.length - 1; i++) {
      const tx = ((g[i][0] + g[i + 1][0]) / 2) * S;
      const ty = ((g[i][1] + g[i + 1][1]) / 2) * S;
      ctx.quadraticCurveTo(g[i][0] * S, g[i][1] * S, tx, ty);
    }
    const akhir = g[g.length - 1];
    ctx.lineTo(akhir[0] * S, akhir[1] * S);
    ctx.stroke();
  }
  ctx.restore();
}

function keBit(ctx: CanvasRenderingContext2D, W: number, H: number): Uint8Array {
  const d = ctx.getImageData(0, 0, W, H).data;
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = d[i * 4 + 3] > 70 ? 1 : 0;
  return out;
}

function tebalkan(src: Uint8Array, W: number, H: number, r: number): Uint8Array {
  let a = src;
  for (let k = 0; k < r; k++) {
    const b = new Uint8Array(a);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (a[i]) continue;
        if ((x > 0 && a[i - 1]) || (x < W - 1 && a[i + 1]) || (y > 0 && a[i - W]) || (y < H - 1 && a[i + W])) b[i] = 1;
      }
    }
    a = b;
  }
  return a;
}

/**
 * Skor kemiripan bentuk 0–100. Tulisan disamakan dulu ukuran & letaknya dengan
 * huruf acuan, jadi menulis tanpa bayangan (lebih kecil / agak bergeser) tidak
 * dihukum — yang dinilai bentuknya, bukan posisinya di kertas.
 */
function nilaiBentuk(teks: string, garis: Pt[][], rtl: boolean, rasio = 1): number | null {
  const titik = garis.flat();
  if (!titik.length) return null;
  const lebar = rasio !== 1;
  const W = lebar ? 192 : 96;
  const H = Math.round(W * rasio);
  const buat = () => {
    const k = document.createElement("canvas");
    k.width = W;
    k.height = H;
    return k.getContext("2d", { willReadFrequently: true });
  };
  const cg = buat();
  const ci = buat();
  if (!cg || !ci) return null;
  gambarHuruf(cg, W, H, teks, "#000", rtl);
  const G = keBit(cg, W, H);
  let gx0 = W, gy0 = H, gx1 = 0, gy1 = 0, isiG = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (G[y * W + x]) {
    isiG++;
    if (x < gx0) gx0 = x; if (x > gx1) gx1 = x; if (y < gy0) gy0 = y; if (y > gy1) gy1 = y;
  }
  if (!isiG) return null;
  let ix0 = Infinity, iy0 = Infinity, ix1 = -Infinity, iy1 = -Infinity;
  for (const [x, y] of titik) {
    if (x < ix0) ix0 = x; if (x > ix1) ix1 = x; if (y < iy0) iy0 = y; if (y > iy1) iy1 = y;
  }
  const jepit = (v: number) => Math.min(3, Math.max(0.5, v));
  let sx: number, sy: number;
  if (lebar) {
    // Kata: lebar & tinggi disamakan sendiri-sendiri — jarak antarhuruf tulisan
    // tangan hampir tak pernah sama dengan huruf cetak.
    sx = jepit((gx1 - gx0) / W / Math.max(ix1 - ix0, 0.04));
    sy = jepit((gy1 - gy0) / W / Math.max(iy1 - iy0, 0.04));
  } else {
    const dimG = Math.max(gx1 - gx0, gy1 - gy0) / W;
    const dimI = Math.max(ix1 - ix0, iy1 - iy0, 0.04);
    sx = sy = jepit(dimG / dimI);
  }
  const cxG = (gx0 + gx1) / 2 / W, cyG = (gy0 + gy1) / 2 / W;
  const cxI = (ix0 + ix1) / 2, cyI = (iy0 + iy1) / 2;
  const pas = garis.map((g) => g.map(([x, y]) => [(x - cxI) * sx + cxG, (y - cyI) * sy + cyG] as Pt));
  gambarGaris(ci, W, pas, "#000", H * 0.05);
  const I = keBit(ci, W, H);
  // Garis tengah tinta (tipis) dipakai untuk presisi: tinta tebal selalu "kena"
  // badan huruf walau jalurnya melenceng.
  const ct = buat();
  if (!ct) return null;
  gambarGaris(ct, W, pas, "#000", H * 0.02);
  const T = keBit(ct, W, H);
  const Gt = tebalkan(G, W, H, 2);
  const It = tebalkan(I, W, H, 3);
  let isiT = 0, kena = 0, tepat = 0;
  for (let i = 0; i < W * H; i++) {
    if (G[i] && It[i]) kena++;
    if (T[i]) { isiT++; if (Gt[i]) tepat++; }
  }
  if (!isiT) return null;
  // cakupan = bagian huruf yang tertulis; presisi = bagian tulisan yang memang di jalur huruf.
  const cakupan = Math.min(1, kena / isiG / 0.85);
  const presisi = Math.min(1, tepat / isiT / 0.92);
  return Math.round(100 * Math.pow(cakupan, 1.3) * Math.pow(presisi, 1.3));
}

function pngTulisan(garis: Pt[][], rasio = 1): string {
  const W = rasio === 1 ? 320 : 560;
  const H = Math.round(W * rasio);
  const k = document.createElement("canvas");
  k.width = W;
  k.height = H;
  const ctx = k.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  gambarGaris(ctx, W, garis, "#000", H * 0.03);
  return k.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
}

function ucapBrowser(teks: string, kode: string) {
  try {
    const u = new SpeechSynthesisUtterance(teks);
    u.lang = kode;
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* peramban tanpa speechSynthesis */ }
}

const KELAS_TOMBOL =
  "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/* ── Papan urutan goresan ─────────────────────────────────────────────────── */
function PapanGoresan({ jalur, s, tl, onSelesai }: {
  jalur: string[];
  s: Skin;
  tl: (k: string) => string;
  onSelesai: (skor: number) => void;
}) {
  const refAcuan = useRef<(SVGPathElement | null)[]>([]);
  const [panjang, setPanjang] = useState<number[]>([]);
  const [selesai, setSelesai] = useState(0);
  const [salah, setSalah] = useState(0);
  const [salahIni, setSalahIni] = useState(0);
  // Animasi: "semua" memutar seluruh huruf, "petunjuk" cuma goresan berikutnya.
  const [anim, setAnim] = useState<{ mode: "semua" | "petunjuk"; i: number; nonce: number } | null>(null);
  const [garis, setGaris] = useState<Pt[]>([]);
  const [gagal, setGagal] = useState(false);
  const [pesan, setPesan] = useState("");
  const [bayangan, setBayangan] = useState(true);
  const menggaris = useRef<Pt[] | null>(null);

  useEffect(() => {
    setPanjang(jalur.map((_, i) => refAcuan.current[i]?.getTotalLength() ?? 0));
  }, [jalur]);
  // Huruf baru dibuka → perlihatkan dulu cara menulisnya.
  useEffect(() => {
    setAnim({ mode: "semua", i: 0, nonce: Date.now() });
  }, [jalur]);

  const n = jalur.length;
  const tuntas = selesai >= n;
  const putar = () => { setPesan(""); setAnim({ mode: "semua", i: 0, nonce: Date.now() }); };
  const ulangi = () => { setSelesai(0); setSalah(0); setSalahIni(0); setPesan(""); setAnim(null); setGaris([]); };

  const keKotak = (e: React.PointerEvent<SVGSVGElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * KOTAK_GORESAN, ((e.clientY - r.top) / r.height) * KOTAK_GORESAN];
  };
  const turun = (e: React.PointerEvent<SVGSVGElement>) => {
    if (tuntas) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer sudah lepas */ }
    setAnim(null);
    menggaris.current = [keKotak(e)];
    setGaris(menggaris.current);
  };
  const gerak = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!menggaris.current) return;
    const p = keKotak(e);
    const akhir = menggaris.current[menggaris.current.length - 1];
    if (jarak(p, akhir) < 0.6) return;
    menggaris.current = [...menggaris.current, p];
    setGaris(menggaris.current);
  };
  const angkat = () => {
    const g = menggaris.current;
    menggaris.current = null;
    setGaris([]);
    const acuan = refAcuan.current[selesai];
    if (!g || !acuan || tuntas) return;
    // Ketukan tak sengaja (bukan goresan) tidak dihitung salah.
    if (g.length < 2 && (panjang[selesai] ?? 99) >= 14) return;
    const hasil = cocokGoresan(g, acuan, panjang[selesai] || acuan.getTotalLength());
    if (hasil === "ok") {
      const berikut = selesai + 1;
      setSelesai(berikut);
      setSalahIni(0);
      if (berikut >= n) {
        setPesan(tl("Selesai! Urutan goresanmu benar."));
        onSelesai(Math.max(30, 100 - salah * 10));
      } else setPesan("");
      return;
    }
    const kali = salahIni + 1;
    setSalah((v) => v + 1);
    setSalahIni(kali);
    setGagal(true);
    window.setTimeout(() => setGagal(false), 380);
    if (kali >= 2) {
      setPesan(tl("Perhatikan contohnya, lalu ulangi."));
      setAnim({ mode: "petunjuk", i: selesai, nonce: Date.now() });
    } else setPesan(hasil === "terbalik" ? tl("Arah goresannya terbalik.") : tl("Belum pas — coba lagi."));
  };

  const animSelesai = () => {
    setAnim((a) => (a && a.mode === "semua" && a.i < n - 1 ? { ...a, i: a.i + 1 } : null));
  };

  // Saat animasi "semua" berjalan, yang tampil hitam = goresan yang sudah dianimasikan.
  const hitamSampai = anim?.mode === "semua" ? anim.i : selesai;
  const awal = !tuntas && !anim ? refAcuan.current[selesai]?.getPointAtLength(0) : null;
  const dGaris = garis.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");

  return (
    <div>
      <style>{"@keyframes wp-gores{to{stroke-dashoffset:0}}"}</style>
      <div
        className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-2xl"
        style={{ background: KERTAS, boxShadow: `inset 0 0 0 2px ${gagal ? MERAH : "#cbd5e1"}`, transition: "box-shadow .15s" }}
      >
        <svg
          viewBox={`0 0 ${KOTAK_GORESAN} ${KOTAK_GORESAN}`}
          className="h-full w-full select-none"
          style={{ touchAction: "none", cursor: tuntas ? "default" : "crosshair" }}
          onPointerDown={turun} onPointerMove={gerak} onPointerUp={angkat} onPointerCancel={angkat}
        >
          <g stroke="#e2e8f0" strokeWidth={0.6} strokeDasharray="2.5 2.5">
            <line x1={KOTAK_GORESAN / 2} y1={0} x2={KOTAK_GORESAN / 2} y2={KOTAK_GORESAN} />
            <line x1={0} y1={KOTAK_GORESAN / 2} x2={KOTAK_GORESAN} y2={KOTAK_GORESAN / 2} />
          </g>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Bayangan — tetap dirender walau disembunyikan: jadi acuan pencocokan. */}
            {jalur.map((d, i) => (
              <path key={`b${i}`} ref={(el) => { refAcuan.current[i] = el; }} d={d}
                stroke={BAYANGAN} strokeWidth={6} opacity={bayangan ? 1 : 0} />
            ))}
            {jalur.slice(0, hitamSampai).map((d, i) => (
              <path key={`h${i}`} d={d} stroke={TINTA} strokeWidth={4.5} />
            ))}
            {anim && panjang[anim.i] > 0 && (
              <path
                key={`a${anim.i}-${anim.nonce}`} d={jalur[anim.i]} stroke={TEAL} strokeWidth={4.5}
                strokeDasharray={panjang[anim.i]} strokeDashoffset={panjang[anim.i]}
                style={{ animation: `wp-gores ${Math.round(260 + panjang[anim.i] * 9)}ms ease-in-out forwards` }}
                onAnimationEnd={animSelesai}
              />
            )}
            {dGaris && <path d={dGaris} stroke={TEAL} strokeWidth={4} opacity={0.85} />}
          </g>
          {awal && <circle cx={awal.x} cy={awal.y} r={3.2} fill="#16a34a" stroke="#fff" strokeWidth={1} />}
        </svg>
      </div>

      <p className={`mt-2.5 min-h-[18px] text-center text-[12.5px] font-medium ${s.redup}`} aria-live="polite">
        {pesan || (tuntas ? "" : anim ? "" : tl("Tulis goresan berikutnya, mulai dari titik hijau."))}
      </p>
      <p className={`text-center text-[11.5px] ${s.redup}`}>
        {tl("Goresan")} {Math.min(selesai + (tuntas ? 0 : 1), n)} {tl("dari")} {n}
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={putar} className={`${KELAS_TOMBOL} ${s.tombol}`}>
          <Play className="h-3.5 w-3.5" /> {tl("Putar animasi")}
        </button>
        <button type="button" onClick={() => setBayangan((v) => !v)} className={`${KELAS_TOMBOL} ${s.tombol}`}>
          {bayangan ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {bayangan ? tl("Sembunyikan bayangan") : tl("Tampilkan bayangan")}
        </button>
        <button type="button" onClick={ulangi} className={`${KELAS_TOMBOL} ${s.tombol}`}>
          <RotateCcw className="h-3.5 w-3.5" /> {tl("Ulangi")}
        </button>
      </div>
    </div>
  );
}

/* ── Papan jiplak / tulis bebas ───────────────────────────────────────────── */
function PapanJiplak({ teks, rtl, lebar = false, s, tl, uiLang, onSkor, mintaAi }: {
  teks: string;
  rtl: boolean;
  /** Papan 2:1 untuk kata (lebih dari satu aksara). */
  lebar?: boolean;
  s: Skin;
  tl: (k: string) => string;
  uiLang: "id" | "en";
  onSkor: (skor: number) => void;
  mintaAi?: (png: string) => Promise<HasilNilaiAi>;
}) {
  const refBungkus = useRef<HTMLDivElement>(null);
  const refKanvas = useRef<HTMLCanvasElement>(null);
  const [sisi, setSisi] = useState(320);
  const rasio = lebar ? RASIO_LEBAR : 1;
  const tinggi = Math.round(sisi * rasio);
  const [garis, setGaris] = useState<Pt[][]>([]);
  const [bayangan, setBayangan] = useState(true);
  const [skor, setSkor] = useState<number | null>(null);
  const [catatan, setCatatan] = useState("");
  const [ai, setAi] = useState<{ status: "idle" | "jalan" | "gagal" } | { status: "ok"; hasil: HasilNilaiAi }>({ status: "idle" });
  const menggaris = useRef(false);

  useEffect(() => {
    const el = refBungkus.current;
    if (!el) return;
    const ukur = () => setSisi(Math.max(200, Math.min(lebar ? 460 : 360, Math.round(el.clientWidth))));
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => ro.disconnect();
  }, [lebar]);

  useEffect(() => {
    const k = refKanvas.current;
    const ctx = k?.getContext("2d");
    if (!k || !ctx) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    if (k.width !== sisi * dpr || k.height !== tinggi * dpr) { k.width = sisi * dpr; k.height = tinggi * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = KERTAS;
    ctx.fillRect(0, 0, sisi, tinggi);
    ctx.save();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    if (!lebar) { ctx.moveTo(sisi / 2, 0); ctx.lineTo(sisi / 2, tinggi); }
    ctx.moveTo(0, tinggi / 2); ctx.lineTo(sisi, tinggi / 2);
    ctx.stroke();
    ctx.restore();
    if (bayangan) gambarHuruf(ctx, sisi, tinggi, teks, BAYANGAN, rtl);
    gambarGaris(ctx, sisi, garis, TINTA, lebar ? tinggi * 0.04 : sisi * 0.032);
  }, [sisi, tinggi, lebar, garis, bayangan, teks, rtl]);

  const keNormal = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.width];
  };
  const turun = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer sudah lepas */ }
    menggaris.current = true;
    // Dihitung DI LUAR updater: saat updater jalan, e.currentTarget sudah null.
    const mulai = keNormal(e);
    setSkor(null); setCatatan(""); setAi({ status: "idle" });
    setGaris((g) => [...g, [mulai]]);
  };
  const gerak = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!menggaris.current) return;
    // Pena/stylus melapor lebih rapat dari frame layar — ambil semuanya biar lengkungnya halus.
    const asli = e.nativeEvent;
    const semua = typeof asli.getCoalescedEvents === "function" ? asli.getCoalescedEvents() : [];
    const r = e.currentTarget.getBoundingClientRect();
    const baru: Pt[] = (semua.length ? semua : [asli]).map((ev) => [(ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.width]);
    setGaris((g) => {
      if (!g.length) return g;
      const akhir = g[g.length - 1];
      return [...g.slice(0, -1), [...akhir, ...baru]];
    });
  };
  const angkat = () => { menggaris.current = false; };

  const hapus = () => { setGaris([]); setSkor(null); setCatatan(""); setAi({ status: "idle" }); };
  const batal = () => { setGaris((g) => g.slice(0, -1)); setSkor(null); setCatatan(""); setAi({ status: "idle" }); };

  const cek = () => {
    const n = nilaiBentuk(teks, garis, rtl, rasio);
    if (n === null) { setSkor(null); setCatatan(tl("Tulis dulu hurufnya di papan.")); return; }
    setSkor(n);
    setCatatan(n >= 80 ? tl("Mirip sekali — pertahankan!") : n >= 55 ? tl("Sudah terbaca, rapikan lagi bentuknya.") : tl("Bentuknya masih jauh. Coba jiplak dengan bayangan dulu."));
    onSkor(n);
  };

  const nilaiAi = async () => {
    if (!mintaAi) return;
    if (!garis.length) { setCatatan(tl("Tulis dulu hurufnya di papan.")); return; }
    setAi({ status: "jalan" });
    try {
      const hasil = await mintaAi(pngTulisan(garis, rasio));
      setAi({ status: "ok", hasil });
      setSkor(hasil.score);
      setCatatan("");
      onSkor(hasil.score);
    } catch {
      // [latihan-menulis-v2] AI tumbang (kuota habis/jaringan) jangan jadi jalan
      // buntu: tulisan tetap dinilai dari kemiripan bentuk supaya latihan lanjut.
      setAi({ status: "gagal" });
      cek();
    }
  };

  return (
    <div>
      <div ref={refBungkus} className={`mx-auto w-full ${lebar ? "max-w-[460px]" : "max-w-[360px]"}`}>
        <canvas
          ref={refKanvas}
          className="mx-auto block select-none rounded-2xl"
          style={{ width: sisi, height: tinggi, touchAction: "none", cursor: "crosshair", boxShadow: "0 0 0 2px #cbd5e1", background: KERTAS }}
          onPointerDown={turun} onPointerMove={gerak} onPointerUp={angkat} onPointerCancel={angkat}
          aria-label={`${tl("Tulis bebas")}: ${teks}`}
        />
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => setBayangan((v) => !v)} className={`${KELAS_TOMBOL} ${s.tombol}`}>
          {bayangan ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {bayangan ? tl("Sembunyikan bayangan") : tl("Tampilkan bayangan")}
        </button>
        <button type="button" onClick={batal} disabled={!garis.length} className={`${KELAS_TOMBOL} ${s.tombol}`}>
          <Undo2 className="h-3.5 w-3.5" /> {tl("Batalkan goresan")}
        </button>
        <button type="button" onClick={hapus} disabled={!garis.length} className={`${KELAS_TOMBOL} ${s.tombol}`}>
          <RotateCcw className="h-3.5 w-3.5" /> {tl("Hapus")}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => { setAi({ status: "idle" }); cek(); }} className={`${KELAS_TOMBOL} border-transparent ${s.utama}`}>
          <Check className="h-3.5 w-3.5" /> {tl("Cek tulisan")}
        </button>
        {mintaAi && (
          <button type="button" onClick={nilaiAi} disabled={ai.status === "jalan"} className={`${KELAS_TOMBOL} ${s.tombol}`}>
            {ai.status === "jalan" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {ai.status === "jalan" ? tl("Menilai…") : tl("Nilai dengan AI")}
          </button>
        )}
      </div>

      {(skor !== null || catatan || ai.status === "gagal" || ai.status === "ok") && (
        <div className={`mt-3 rounded-xl border p-3 text-[12.5px] leading-relaxed ${s.catatan}`} aria-live="polite" lang={uiLang}>
          {ai.status === "gagal" && (
            <p className={skor !== null ? "mb-1.5" : ""}>
              {skor !== null
                ? tl("Penilaian AI sedang tidak tersedia, jadi tulisanmu dinilai dari kemiripan bentuknya dulu.")
                : tl("Penilaian AI sedang tidak bisa dipakai. Coba lagi sebentar lagi.")}
            </p>
          )}
          {skor !== null && (
            <p className="text-[13px] font-bold">
              {tl("Skor")}: {skor}/100
            </p>
          )}
          {catatan && <p>{catatan}</p>}
          {ai.status === "ok" && (
            <>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wide opacity-70">{tl("Penilaian AI")}</p>
              <p>{ai.hasil.feedback}</p>
              {ai.hasil.tips.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {ai.hasil.tips.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Komponen utama ───────────────────────────────────────────────────────── */
const SET_SENDIRI = "sendiri";
const NAMA_TAHAP = ["Huruf", "Kata", "Kalimat"] as const;
const jumlahAksara = (t: string) => Array.from(t).length;

export default function WritingPractice({ skin = "siswa", preferLangs, speak, aiGrade }: Props) {
  const uiLang = useUiLang();
  const tl = useCallback((k: string) => (uiLang === "en" ? EN[k] ?? k : k), [uiLang]);
  const s: Skin = SKIN[skin];

  const kunciPilihan = (preferLangs ?? []).join("|");
  const [bahasa, setBahasa] = useState<ScriptLang>(() => pilihBahasaAksara(preferLangs ?? []) ?? SCRIPT_LANGS[0]);
  const [idSet, setIdSet] = useState<string>(() => (pilihBahasaAksara(preferLangs ?? []) ?? SCRIPT_LANGS[0]).sets[0].id);
  const [indeks, setIndeks] = useState(0);
  const [sendiri, setSendiri] = useState("");
  const [mode, setMode] = useState<"goresan" | "bebas">("goresan");
  const [kemajuan, setKemajuan] = useState<Kemajuan>({});
  const sudahPilih = useRef(false);

  useEffect(() => { setKemajuan(bacaKemajuan()); }, []);
  // Bahasa kelas sering baru diketahui sesudah data dimuat — ikuti selama siswa
  // belum memilih sendiri.
  useEffect(() => {
    if (sudahPilih.current) return;
    const kena = pilihBahasaAksara(kunciPilihan.split("|"));
    if (kena) { setBahasa(kena); setIdSet(kena.sets[0].id); setIndeks(0); }
  }, [kunciPilihan]);

  const set: ScriptSet | null = idSet === SET_SENDIRI ? null : bahasa.sets.find((x) => x.id === idSet) ?? bahasa.sets[0];
  const huruf: Glyph | null = set
    ? set.glyphs[Math.min(indeks, set.glyphs.length - 1)]
    : sendiri.trim() ? { c: sendiri.trim(), r: "" } : null;

  /* [latihan-menulis-v2] Kata & kalimat ditulis bagian demi bagian: per aksara
     (kana, Hanzi, blok Hangul) atau per kata. Huruf tunggal = satu bagian. */
  const frasa = !!set?.frasa;
  const teksTampil = huruf ? (frasa ? teksFrasa(bahasa, huruf.c) : huruf.c) : "";
  const teksBunyi = huruf ? (set?.pair ? huruf.c.slice(-1) : teksTampil) : "";
  const bagian = useMemo(
    () => (!huruf ? [] : frasa ? pecahBagian(huruf.c, bahasa.unit ?? "word") : [set?.pair ? huruf.c.slice(-1) : huruf.c]),
    [huruf, frasa, bahasa, set],
  );
  // Posisi & skor bagian ditempeli kunci hurufnya, jadi pindah huruf otomatis
  // mulai dari nol tanpa sempat mencatat skor huruf sebelumnya ke huruf baru.
  const kunciHuruf = `${bahasa.key}:${idSet}:${huruf?.c ?? ""}`;
  const [maju, setMaju] = useState<{ kunci: string; i: number; skor: Record<number, number> }>({ kunci: "", i: 0, skor: {} });
  const iBagian = maju.kunci === kunciHuruf ? Math.min(maju.i, Math.max(0, bagian.length - 1)) : 0;
  const skorBagian = useMemo(() => (maju.kunci === kunciHuruf ? maju.skor : {}), [maju, kunciHuruf]);
  const teksPapan = bagian[iBagian] ?? "";
  // Huruf Tahap 1 selalu papan persegi (vokal Thai/Devanagari memang beberapa kode
  // tapi satu aksara); papan lebar hanya untuk kata & "Tulis sendiri".
  const papanLebar = (frasa || !set) && jumlahAksara(teksPapan) > 1;

  /* Urutan goresan diambil saat hurufnya dibuka. */
  const [jalur, setJalur] = useState<{ c: string; status: "muat" | "ada" | "kosong"; d: string[] }>({ c: "", status: "kosong", d: [] });
  const sumber = papanLebar ? undefined : set?.strokes;
  const cHuruf = teksPapan;
  useEffect(() => {
    if (!sumber || !cHuruf) { setJalur({ c: cHuruf, status: "kosong", d: [] }); return; }
    let hidup = true;
    setJalur({ c: cHuruf, status: "muat", d: [] });
    muatGoresan(cHuruf, sumber).then((d) => {
      if (hidup) setJalur({ c: cHuruf, status: d ? "ada" : "kosong", d: d ?? [] });
    });
    return () => { hidup = false; };
  }, [sumber, cHuruf]);

  const simpan = useCallback((skor: number) => {
    if (!set || !huruf) return;
    setKemajuan((lama) => {
      const sebelum = lama[set.id]?.[huruf.c] ?? 0;
      if (skor <= sebelum) return lama;
      const baru = { ...lama, [set.id]: { ...(lama[set.id] ?? {}), [huruf.c]: skor } };
      try { localStorage.setItem(KUNCI_KEMAJUAN, JSON.stringify(baru)); } catch { /* storage penuh/terblokir */ }
      return baru;
    });
  }, [set, huruf]);

  const catat = useCallback((skor: number) => {
    if (!frasa) { simpan(skor); return; }
    setMaju((lama) => {
      const dulu = lama.kunci === kunciHuruf ? lama.skor : {};
      return { kunci: kunciHuruf, i: iBagian, skor: { ...dulu, [iBagian]: Math.max(dulu[iBagian] ?? 0, skor) } };
    });
  }, [frasa, simpan, kunciHuruf, iBagian]);
  // Kata/kalimat baru dihitung sesudah SEMUA bagiannya ditulis; nilainya = bagian terlemah.
  const skorFrasa = frasa && bagian.length > 0 && bagian.every((_, i) => typeof skorBagian[i] === "number")
    ? Math.min(...bagian.map((_, i) => skorBagian[i]))
    : null;
  useEffect(() => { if (skorFrasa !== null) simpan(skorFrasa); }, [skorFrasa, simpan]);
  const keBagian = (i: number) => setMaju({ kunci: kunciHuruf, i, skor: skorBagian });

  const mintaAi = useMemo(() => {
    if (!aiGrade || !huruf || !teksPapan) return undefined;
    return (png: string) => aiGrade({
      png, char: teksPapan, roman: bagian.length > 1 ? "" : huruf.r,
      script: set ? `${bahasa.label} — ${set.label}` : bahasa.label, uiLang,
    });
  }, [aiGrade, huruf, teksPapan, bagian, set, bahasa, uiLang]);

  const bunyikan = () => {
    if (!teksBunyi) return;
    if (speak) speak(teksBunyi, bahasa.code);
    else ucapBrowser(teksBunyi, bahasa.code);
  };

  const pilihBahasa = (l: ScriptLang) => { sudahPilih.current = true; setBahasa(l); setIdSet(l.sets[0].id); setIndeks(0); };
  const pilihSet = (id: string) => { sudahPilih.current = true; setIdSet(id); setIndeks(0); };

  const lulusSet = set ? set.glyphs.filter((x) => (kemajuan[set.id]?.[x.c] ?? 0) >= BATAS_LULUS).length : 0;
  const terbaik = set && huruf ? kemajuan[set.id]?.[huruf.c] ?? 0 : 0;
  const adaGoresan = jalur.status === "ada" && jalur.c === cHuruf;
  const pakaiGoresan = !!sumber && mode === "goresan";
  const artiDari = (x: Glyph) =>
    !x.n ? "" : x.n === "pendek" || x.n === "panjang" ? tl(x.n) : uiLang === "en" && x.e ? x.e : x.n;
  const arti = huruf ? artiDari(huruf) : "";
  const lulusDi = (x: ScriptSet) => x.glyphs.filter((y) => (kemajuan[x.id]?.[y.c] ?? 0) >= BATAS_LULUS).length;
  const tahapSet = set?.stage ?? 1;
  const iSet = set ? bahasa.sets.indexOf(set) : -1;
  const setBerikut = iSet >= 0 ? bahasa.sets[iSet + 1] : undefined;
  const hurufTahap1 = bahasa.sets.filter((x) => (x.stage ?? 1) === 1);
  const dasarKurang = tahapSet > 1 &&
    hurufTahap1.reduce((n, x) => n + lulusDi(x), 0) < hurufTahap1.reduce((n, x) => n + x.glyphs.length, 0) / 2;

  return (
    <div className="space-y-4">
      <div className={`${s.kartu} p-4`}>
        <div className="flex items-start gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${s.ikon}`}>
            <PenLine className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className={`text-base font-semibold ${s.judul}`}>{tl("Latihan Menulis")}</h2>
            <p className={`mt-0.5 text-[12px] leading-snug ${s.redup}`}>
              {tl("Latih tulisan tangan aksara non-Latin secara bertahap: mulai dari huruf, lanjut ke kata, lalu kalimat — lengkap dengan cara baca dan artinya.")}
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {SCRIPT_LANGS.map((l) => (
            <button key={l.key} type="button" onClick={() => pilihBahasa(l)}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${l.key === bahasa.key ? s.pilAktif : s.pil}`}>
              {tl(l.label)}
            </button>
          ))}
        </div>
        {/* [latihan-menulis-v2] Set dikelompokkan per tahap: huruf → kata → kalimat. */}
        <div className="mt-2.5 space-y-1.5">
          {([1, 2, 3] as const).map((t) => {
            const daftar = bahasa.sets.filter((x) => (x.stage ?? 1) === t);
            if (!daftar.length) return null;
            return (
              <div key={t} className="flex flex-wrap items-center gap-1.5">
                <span className={`w-[104px] shrink-0 text-[10.5px] font-bold uppercase tracking-wide ${s.redup}`}>
                  {tl("Tahap")} {t} · {tl(NAMA_TAHAP[t - 1])}
                </span>
                {daftar.map((x) => (
                  <button key={x.id} type="button" onClick={() => pilihSet(x.id)}
                    className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${x.id === idSet ? s.pilAktif : s.pil}`}>
                    {tl(x.label)}
                    <span className="ml-1.5 font-medium tabular-nums opacity-70">{lulusDi(x)}/{x.glyphs.length}</span>
                  </button>
                ))}
                {t === 1 && (
                  <button type="button" onClick={() => pilihSet(SET_SENDIRI)}
                    className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${idSet === SET_SENDIRI ? s.pilAktif : s.pil}`}>
                    {tl("Tulis sendiri")}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {set && (
          <div className="mt-3">
            <div className={`h-1.5 overflow-hidden rounded-full ${s.rel}`}>
              <div className="h-full rounded-full" style={{ width: `${(lulusSet / set.glyphs.length) * 100}%`, background: TEAL, transition: "width .3s" }} />
            </div>
            <p className={`mt-1 text-[11.5px] ${s.redup}`}>
              {lulusSet}/{set.glyphs.length} {tl("dikuasai")} · {tl("Kemajuan tersimpan di perangkat ini.")}
            </p>
            {dasarKurang && (
              <p className={`mt-2 rounded-xl border px-3 py-2 text-[12px] ${s.catatan}`}>
                {tl("Saran: kuasai dulu huruf-hurufnya di Tahap 1 supaya menulis kata dan kalimat lebih lancar.")}
              </p>
            )}
            {lulusSet === set.glyphs.length && setBerikut && (
              <div className={`mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[12.5px] ${s.catatan}`}>
                <span className="font-semibold">{tl("Tahap ini tuntas!")}</span>
                <button type="button" onClick={() => pilihSet(setBerikut.id)} className={`${KELAS_TOMBOL} border-transparent ${s.utama}`}>
                  {tl("Lanjut ke")} {tl(setBerikut.label)} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        {/* Papan duluan di HP: memilih huruf lalu harus menggulir ke bawah itu melelahkan. */}
        <div className={`order-1 lg:order-2 ${s.kartu} p-4 lg:sticky lg:top-4 lg:self-start`}>
          {huruf ? (
            <>
              <div className={frasa ? "flex items-start gap-3" : "flex items-center gap-3"}>
                {!frasa && (
                  <span className={`min-w-0 max-w-[55%] truncate text-[40px] font-semibold leading-none ${s.judul}`}
                    lang={bahasa.code} dir={bahasa.rtl ? "rtl" : "ltr"} style={{ fontFamily: FONT_AKSARA }}>
                    {huruf.c}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {frasa && (
                    <p className={`mb-1 break-words text-[26px] font-semibold leading-snug ${s.judul}`}
                      lang={bahasa.code} dir={bahasa.rtl ? "rtl" : "ltr"} style={{ fontFamily: FONT_AKSARA }}>
                      {teksTampil}
                    </p>
                  )}
                  {huruf.r && huruf.r !== "-" && (
                    <p className={`${frasa ? "" : "truncate "}text-[13px] ${s.judul}`}>
                      <span className={`mr-1.5 text-[10.5px] font-bold uppercase tracking-wide ${s.redup}`}>{tl("Baca")}</span>
                      <span className="font-semibold">{huruf.r}</span>
                    </p>
                  )}
                  {arti && (
                    <p className={`${frasa ? "" : "truncate "}text-[13px] ${s.judul}`}>
                      <span className={`mr-1.5 text-[10.5px] font-bold uppercase tracking-wide ${s.redup}`}>{tl("Arti")}</span>
                      {arti}
                    </p>
                  )}
                  {terbaik > 0 && <p className={`text-[11.5px] ${s.redup}`}>{tl("Skor terbaik")}: {terbaik}</p>}
                </div>
                <button type="button" onClick={bunyikan} title={tl("Dengar")} aria-label={tl("Dengar")}
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors ${s.tombol}`}>
                  <Volume2 className="h-[18px] w-[18px]" />
                </button>
              </div>

              {frasa && bagian.length > 1 && (
                <div className="mt-3">
                  <p className={`text-[11.5px] ${s.redup}`}>
                    {tl("Tulis bagian demi bagian")} · {tl("Bagian")} {iBagian + 1} {tl("dari")} {bagian.length}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5" dir={bahasa.rtl ? "rtl" : "ltr"}>
                    {bagian.map((b, i) => {
                      const lulus = (skorBagian[i] ?? 0) >= BATAS_LULUS;
                      return (
                        <button key={i} type="button" onClick={() => keBagian(i)} aria-pressed={i === iBagian}
                          lang={bahasa.code} style={{ fontFamily: FONT_AKSARA }}
                          className={`relative rounded-lg border px-2.5 py-1 text-[18px] leading-tight transition-colors ${i === iBagian ? s.selAktif : lulus ? s.selLulus : s.sel}`}>
                          {b}
                          {lulus && (
                            <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full text-white" style={{ background: TEAL }}>
                              <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {sumber && (
                <div className={`mt-3 grid grid-cols-2 gap-1 rounded-xl p-1 ${s.rel}`}>
                  {(["goresan", "bebas"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setMode(m)}
                      className={`rounded-lg px-2 py-1.5 text-[12.5px] font-semibold transition-colors ${mode === m ? s.utama : s.redup}`}>
                      {m === "goresan" ? tl("Urutan goresan") : tl("Tulis bebas")}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3">
                {pakaiGoresan && jalur.status === "muat" && (
                  <div className={`grid aspect-square w-full max-w-[360px] place-items-center mx-auto text-[12.5px] ${s.redup}`}>
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {tl("Memuat urutan goresan…")}</span>
                  </div>
                )}
                {pakaiGoresan && adaGoresan && (
                  <PapanGoresan key={`${kunciHuruf}:${iBagian}`} jalur={jalur.d} s={s} tl={tl} onSelesai={catat} />
                )}
                {pakaiGoresan && jalur.status === "kosong" && jalur.c === cHuruf && (
                  <p className={`mb-3 rounded-xl border p-3 text-[12.5px] ${s.catatan}`}>
                    {tl("Data urutan goresan belum tersedia untuk huruf ini — latihan pakai papan tulis bebas.")}
                  </p>
                )}
                {(!pakaiGoresan || (jalur.status === "kosong" && jalur.c === cHuruf)) && (
                  <PapanJiplak key={`${kunciHuruf}:${iBagian}`} teks={teksPapan} rtl={!!bahasa.rtl} lebar={papanLebar}
                    s={s} tl={tl} uiLang={uiLang} onSkor={catat} mintaAi={mintaAi} />
                )}
                {frasa && bagian.length > 1 && typeof skorBagian[iBagian] === "number" && iBagian < bagian.length - 1 && (
                  <div className="mt-3 flex justify-center">
                    <button type="button" onClick={() => keBagian(iBagian + 1)} className={`${KELAS_TOMBOL} border-transparent ${s.utama}`}>
                      {tl("Bagian berikutnya")} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {frasa && bagian.length > 1 && skorFrasa !== null && (
                  <p className={`mt-3 rounded-xl border p-3 text-center text-[12.5px] font-semibold ${s.catatan}`} aria-live="polite">
                    {tl("Semua bagian sudah ditulis.")} {tl("Skor")}: {skorFrasa}/100
                  </p>
                )}
              </div>

              {set && (
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button type="button" onClick={() => setIndeks((i) => Math.max(0, i - 1))} disabled={indeks <= 0}
                    className={`${KELAS_TOMBOL} ${s.tombol}`}>
                    <ChevronLeft className="h-4 w-4" /> {tl("Sebelumnya")}
                  </button>
                  <span className={`text-[12px] tabular-nums ${s.redup}`}>{indeks + 1}/{set.glyphs.length}</span>
                  <button type="button" onClick={() => setIndeks((i) => Math.min(set.glyphs.length - 1, i + 1))}
                    disabled={indeks >= set.glyphs.length - 1} className={`${KELAS_TOMBOL} ${s.tombol}`}>
                    {tl("Berikutnya")} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className={`py-10 text-center text-[13px] ${s.redup}`}>{tl("Ketik kata atau huruf yang mau dilatih")}</p>
          )}
        </div>

        <div className={`order-2 lg:order-1 ${s.kartu} p-4`}>
          {set ? (
            <div dir={bahasa.rtl ? "rtl" : "ltr"} className={`grid gap-2 ${
              !frasa ? "grid-cols-[repeat(auto-fill,minmax(64px,1fr))]"
                : tahapSet === 2 ? "grid-cols-[repeat(auto-fill,minmax(128px,1fr))]" : "grid-cols-1 sm:grid-cols-2"}`}>
              {set.glyphs.map((x, i) => {
                const lulus = (kemajuan[set.id]?.[x.c] ?? 0) >= BATAS_LULUS;
                return (
                  <button key={x.c} type="button" onClick={() => { sudahPilih.current = true; setIndeks(i); }}
                    aria-pressed={i === indeks}
                    className={`relative flex flex-col items-center rounded-xl border px-1 pb-1.5 pt-2 transition-colors ${i === indeks ? s.selAktif : lulus ? s.selLulus : s.sel}`}>
                    <span className={`max-w-full break-words text-center ${frasa ? "px-1 text-[19px] leading-snug" : "text-[24px] leading-tight"}`}
                      lang={bahasa.code} style={{ fontFamily: FONT_AKSARA }}>{frasa ? teksFrasa(bahasa, x.c) : x.c}</span>
                    <span className={`mt-0.5 max-w-full truncate text-[10.5px] ${s.redup}`} dir="ltr">{x.r}</span>
                    {frasa && (
                      <span className={`max-w-full px-1 text-center text-[11.5px] leading-snug ${s.judul}`} dir="ltr">{artiDari(x)}</span>
                    )}
                    {lulus && (
                      <span className="absolute right-1 top-1 grid h-3.5 w-3.5 place-items-center rounded-full text-white" style={{ background: TEAL }}>
                        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <label className={`text-[12.5px] font-semibold ${s.judul}`} htmlFor="wp-sendiri">
                {tl("Ketik kata atau huruf yang mau dilatih")}
              </label>
              <input id="wp-sendiri" value={sendiri} onChange={(e) => setSendiri(Array.from(e.target.value).slice(0, 8).join(""))}
                lang={bahasa.code} dir={bahasa.rtl ? "rtl" : "ltr"} autoComplete="off"
                className={`mt-1.5 h-11 w-full rounded-xl border px-3 text-[20px] outline-none focus:ring-2 focus:ring-teal-500/40 ${s.masukan}`}
                style={{ fontFamily: FONT_AKSARA }} />
              <p className={`mt-1.5 text-[11.5px] ${s.redup}`}>{tl("Maksimal 8 huruf. Tulisannya dinilai dari bentuk atau oleh AI.")}</p>
            </div>
          )}
          {sumber && <p className={`mt-3 text-[10.5px] ${s.redup}`}>{tl("Urutan goresan: KanjiVG (CC BY-SA 3.0) & Make Me a Hanzi.")}</p>}
        </div>
      </div>
    </div>
  );
}
