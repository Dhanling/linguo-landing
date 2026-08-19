"use client";

// linguo-patch:akun-sertifikat-tab-v2
// Redesign modern: bendera per-bahasa (flagcdn -> data-URI, capture-safe),
// radar 4-skill (Speaking/Listening/Reading/Writing) inline-SVG (bukan Recharts -> aman di html2canvas),
// template per-produk (Private/Reguler = CEFR + skill, Kids = playful, Test Prep/E-Learning = Phase 2 fallback),
// font Inter (double-story 'a') + guard document.fonts.ready sebelum capture biar PDF ga fallback.
// Data diturunkan dari registrasi (sessions_used/total). Fallback dummy kalau `certs` kosong.
// Palet inline (config-independent): teal #16796E, accent #F2CB05, ink #12172B.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award, BadgeCheck, Lock, Download, Share2, ExternalLink, ShieldCheck,
  Flag, Play, CalendarDays, Info, X, Loader2, Mic, Headphones, BookOpen, PenLine,
  Sparkles, Star, ChevronRight, GraduationCap,
} from "lucide-react";
// [sertifikat-banner-foto-v1] foto stok bahasa — sumber sama dgn kartu kelas di Beranda
import { getLangPhoto } from "@/lib/lang-visuals";

// ── lazy-load CDN sekali doang -> nol npm dep, workflow "cp 1 file" tetep aman. ──
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return reject(new Error("no document"));
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "1") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`gagal load ${src}`)));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => { s.dataset.loaded = "1"; resolve(); };
    s.onerror = () => reject(new Error(`gagal load ${src}`));
    document.head.appendChild(s);
  });
}
const H2C_URL = "https://cdn.jsdelivr.net/npm/html2canvas-pro@2.0.4/dist/html2canvas-pro.min.js";
const JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

// Inter (double-story 'a') — inject sekali, dipakai khusus di kartu sertifikat.
const CERT_FONT = "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
let interInjected = false;
function ensureInter() {
  if (typeof document === "undefined" || interInjected) return;
  interInjected = true;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
  document.head.appendChild(l);
}

type Html2Canvas = (el: HTMLElement, opt?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
type JsPdfDoc = {
  addImage: (data: string, fmt: string, x: number, y: number, w: number, h: number) => void;
  save: (name: string) => void;
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
};
type JsPdfCtor = new (o?: Record<string, unknown>) => JsPdfDoc;

export type Cert = {
  id: string;
  language: string;
  level: string;
  title: string;
  teacher: string;
  status: "issued" | "progress";
  date?: string;
  score?: number | string | null;
  hours?: number | null;
  idNo?: string | null;
  pct?: number;
  used?: number;
  total?: number;
  // v2:
  product?: string;
  // 4-skill CEFR (skala 1-5: Pemula/Dasar/Cukup/Baik/Mahir). Optional -> render cuma kalau ada.
  speaking?: number | null;
  listening?: number | null;
  reading?: number | null;
  writing?: number | null;
};

// ── Dark mode dashboard ────────────────────────────────────────────────────
// [sertifikat-dark-v1] Shell menyalakan tema lewat class `lms-dark` di <html> dan
// menimpanya via CSS berbasis NAMA CLASS Tailwind. Semua warna di file ini yang
// ditulis inline (`style={{ background: ... }}`) otomatis lolos dari aturan itu —
// dulu bikin kartu aktif tetap putih sementara teksnya dipaksa putih (tak kebaca).
// Jadi komponen ini baca sendiri temanya lalu memilih paletnya.
function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setDark(el.classList.contains("lms-dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

// ── Palet per-bahasa ──────────────────────────────────────────────────────
// accentDark/textDark = versi terang dari aksen yang sama, dipakai HANYA di
// kanvas gelap. Aksen light (#16796E dkk.) kontrasnya < 2:1 di atas #1c1c1c.
type Col = { accent: string; bg: string; text: string; accentDark: string; bgDark: string; textDark: string };
const PALETTE: Col[] = [
  { accent: "#16796E", bg: "#16796E1A", text: "#0F5A52", accentDark: "#2DD4BF", bgDark: "#2DD4BF26", textDark: "#5EEAD4" },
  { accent: "#E11D48", bg: "#FFF1F2", text: "#BE123C", accentDark: "#FB7185", bgDark: "#FB718526", textDark: "#FDA4AF" },
  { accent: "#4F46E5", bg: "#EEF2FF", text: "#4338CA", accentDark: "#818CF8", bgDark: "#818CF826", textDark: "#A5B4FC" },
  { accent: "#D97706", bg: "#FFFBEB", text: "#B45309", accentDark: "#FBBF24", bgDark: "#FBBF2426", textDark: "#FCD34D" },
  { accent: "#0EA5E9", bg: "#F0F9FF", text: "#0369A1", accentDark: "#38BDF8", bgDark: "#38BDF826", textDark: "#7DD3FC" },
  { accent: "#7C3AED", bg: "#F5F3FF", text: "#6D28D9", accentDark: "#A78BFA", bgDark: "#A78BFA26", textDark: "#C4B5FD" },
  { accent: "#059669", bg: "#ECFDF5", text: "#047857", accentDark: "#34D399", bgDark: "#34D39926", textDark: "#6EE7B7" },
  { accent: "#EA580C", bg: "#FFF7ED", text: "#C2410C", accentDark: "#FB923C", bgDark: "#FB923C26", textDark: "#FDBA74" },
];
const OVERRIDE: Record<string, number> = { Inggris: 0, English: 0, Jepang: 1, Japanese: 1, Korea: 2, Korean: 2 };
function colorOf(lang: string): Col {
  if (lang in OVERRIDE) return PALETTE[OVERRIDE[lang]];
  let h = 0;
  for (let i = 0; i < lang.length; i++) h = (h * 31 + lang.charCodeAt(i)) >>> 0;
  return PALETTE[3 + (h % (PALETTE.length - 3))];
}
const GLYPH: Record<string, string> = {
  Inggris: "Aa", English: "Aa", Jepang: "あ", Japanese: "あ", Korea: "한", Korean: "한",
  Mandarin: "中", Cantonese: "粵", Arab: "ع", Arabic: "ع", Rusia: "Я", Russian: "Я",
  Prancis: "Fr", French: "Fr", Jerman: "De", German: "De", Spanyol: "Es", Spanish: "Es",
};
const glyphOf = (lang: string) => GLYPH[lang] || (lang.slice(0, 2) || "Aa");

// ── Bendera per-bahasa (mapping dikonfirm Dhani 2 Jun 2026) ─────────────────
// English Conversation=US, British English=GB | Portuguese=BR (default), European=PT
// Arabic=SA | Mandarin=CN, Cantonese=HK
const FLAG: Record<string, string> = {
  "English Conversation": "us", English: "us", Inggris: "us",
  "British English": "gb", "English (UK)": "gb",
  Portuguese: "br", "Brazilian Portuguese": "br", "Portuguese (Brazil)": "br", Portugis: "br",
  "European Portuguese": "pt", "Portuguese (Portugal)": "pt",
  Arabic: "sa", Arab: "sa",
  Mandarin: "cn", "Mandarin (China)": "cn", Chinese: "cn",
  Cantonese: "hk",
  Japanese: "jp", Jepang: "jp", Korean: "kr", Korea: "kr",
  French: "fr", Prancis: "fr", German: "de", Jerman: "de", Spanish: "es", Spanyol: "es",
  Russian: "ru", Rusia: "ru", Dutch: "nl", Belanda: "nl", Italian: "it", Italia: "it",
  Hebrew: "il", Ibrani: "il", Turkish: "tr", Turki: "tr", Thai: "th", Vietnamese: "vn",
  Hindi: "in", Danish: "dk", Swedish: "se", Finnish: "fi", Polish: "pl", Czech: "cz",
  Greek: "gr", Yunani: "gr", Persian: "ir", Persia: "ir", Georgian: "ge", Norwegian: "no",
  Hungarian: "hu", Romanian: "ro", Bulgarian: "bg", Ukrainian: "ua", Icelandic: "is",
  Filipino: "ph", Khmer: "kh", Lao: "la", Burmese: "mm", Urdu: "pk",
  Javanese: "id", Jawa: "id", Sundanese: "id", Sunda: "id", Balinese: "id",
  Batak: "id", Bugis: "id", Madurese: "id", BIPA: "id",
};
const FLAG_LC: Record<string, string> = Object.keys(FLAG).reduce((acc, k) => {
  acc[k.toLowerCase()] = FLAG[k];
  return acc;
}, {} as Record<string, string>);
function flagCodeOf(lang: string): string | null {
  if (!lang) return null;
  return FLAG[lang] || FLAG_LC[lang.trim().toLowerCase()] || null;
}

// Prefetch bendera -> data-URI (base64). Same-origin URI = nol risiko CORS pas html2canvas capture.
function useFlagDataUrl(lang: string): string | null {
  const code = flagCodeOf(lang);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (!code) return;
    fetch(`https://flagcdn.com/w80/${code}.png`)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("flag fetch"))))
      .then((b) => new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result));
        fr.onerror = () => rej(new Error("read"));
        fr.readAsDataURL(b);
      }))
      .then((d) => { if (alive) setUrl(d); })
      .catch(() => { if (alive) setUrl(null); });
    return () => { alive = false; };
  }, [code]);
  return url;
}

// `dark` sengaja PROP, bukan hook: varian "chip" hidup di dalam kertas sertifikat
// yang selalu terang, jadi cuma pemanggil yang tahu latarnya gelap atau tidak.
function FlagBadge({ lang, variant, dark = false }: { lang: string; variant: "list" | "hero" | "chip"; dark?: boolean }) {
  const url = useFlagDataUrl(lang);
  const col = colorOf(lang);
  if (variant === "chip") {
    // pill bendera + nama, dipakai di kartu sertifikat
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-[0_4px_14px_-8px_rgba(18,23,43,.4)]" style={{ border: `1px solid ${col.accent}33` }}>
        {url
          ? <img src={url} alt={lang} className="h-4 w-6 rounded-[3px] object-cover" style={{ boxShadow: "0 0 0 1px rgba(0,0,0,.06)" }} />
          : <span className="flex h-4 w-6 items-center justify-center rounded-[3px] text-[9px] font-extrabold" style={{ background: col.bg, color: col.text }}>{glyphOf(lang)}</span>}
        <span className="text-[12px] font-extrabold tracking-wide" style={{ color: col.text }}>{lang}</span>
      </span>
    );
  }
  if (variant === "hero") {
    // [sertifikat-list-bendera-v2] kotaknya ikut diturunkan (64→48) biar sebanding
    // dengan bendera kecil di daftar kiri.
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15">
        {url
          ? <img src={url} alt={lang} className="h-7 w-10 rounded-md object-cover shadow" />
          : <span className="text-[26px] font-extrabold">{glyphOf(lang)}</span>}
      </span>
    );
  }
  // [sertifikat-list-bendera-v1] list — benderanya diambil LANGSUNG dari CDN,
  // bukan lewat prefetch data-URI. Baris ini tidak pernah ikut capture html2canvas
  // (cuma kertas sertifikat yang butuh same-origin), sementara nunggu data-URI bikin
  // barisnya jatuh ke inisial huruf ("Bu", "Po") tiap prefetch telat/gagal.
  // Inisialnya tetap ada di belakang sebagai jaring pengaman kalau gambar gagal muat.
  // [sertifikat-list-bendera-v2] ukurannya bendera biasa (28x40, sudut tumpul) —
  // dulu kotak 48x48 yang bikin gambarnya dipotong & barisnya terasa berat.
  const code = flagCodeOf(lang);
  return (
    <span
      className="relative flex h-7 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md"
      style={{ background: dark ? col.bgDark : col.bg, boxShadow: "0 0 0 1px rgba(0,0,0,.08)" }}
    >
      <span className="text-[11px] font-extrabold" style={{ color: dark ? col.textDark : col.text }}>{glyphOf(lang)}</span>
      {code ? (
        <img
          src={`https://flagcdn.com/w80/${code}.png`}
          alt={lang}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : null}
    </span>
  );
}

// ── Per-produk ──────────────────────────────────────────────────────────────
type Kind = "private" | "reguler" | "kids" | "testprep" | "default";
function productKindOf(p?: string): Kind {
  const s = (p || "").toLowerCase();
  if (s.includes("kids")) return "kids";
  if (s.includes("test") || s.includes("ielts") || s.includes("toefl")) return "testprep";
  if (s.includes("private")) return "private";
  if (s.includes("reguler") || s.includes("regular")) return "reguler";
  return "default";
}
const showsSkills = (k: Kind) => k === "private" || k === "reguler";

// ── Kategori sertifikat ─────────────────────────────────────────────────────
// Dua sumbu kategori dipakai bareng di satu baris chip:
//   1) cara belajar  — Kelas Live vs Belajar Mandiri (LMS/e-learning)
//   2) jenis program — Kelas Reguler / Kelas Private / IELTS & TOEFL Prep / Kids,
//      diturunkan dari Cert.product lewat productKindOf().
type CertCat = "live" | "mandiri";
function certCategory(c: Cert): CertCat {
  const p = (c.product || "").toLowerCase();
  if (/e-?learning|mandiri|lms|self[\s-]?paced/.test(p)) return "mandiri";
  return "live"; // private / reguler / kids / testprep = kelas dengan pengajar
}

// [sertifikat-kategori-program-v1] chip jenis program.
type ProdKey = Exclude<Kind, "default">;
type FilterKey = "all" | CertCat | ProdKey;
const PRODUCT_FILTERS: { key: ProdKey; label: string; hint?: string }[] = [
  { key: "reguler", label: "Kelas Reguler" },
  { key: "private", label: "Kelas Private", hint: "Program Private tersedia sampai level tertinggi B1." },
  { key: "testprep", label: "IELTS & TOEFL Prep" },
  { key: "kids", label: "Kelas Kids" },
];
/** Label pendek jenis program buat kartu daftar (kolomnya cuma 320px). */
const PROD_SHORT: Record<Kind, string> = {
  reguler: "Reguler",
  private: "Private",
  testprep: "IELTS & TOEFL",
  kids: "Kids",
  default: "",
};
function matchesFilter(c: Cert, key: FilterKey): boolean {
  if (key === "all") return true;
  if (key === "live" || key === "mandiri") return certCategory(c) === key;
  return productKindOf(c.product) === key;
}
const COPY: Record<Kind, { eyebrow: string; body: (lang: string) => string }> = {
  private: { eyebrow: "Sertifikat Penyelesaian", body: (l) => `atas keberhasilan menuntaskan program privat Bahasa ${l}` },
  reguler: { eyebrow: "Sertifikat Penyelesaian", body: (l) => `atas keberhasilan menuntaskan program reguler Bahasa ${l}` },
  kids: { eyebrow: "Sertifikat Petualang Cilik", body: (l) => `telah menyelesaikan petualangan belajar Bahasa ${l} dengan penuh semangat` },
  testprep: { eyebrow: "Sertifikat Persiapan Tes", body: (l) => `atas penyelesaian program persiapan tes Bahasa ${l}` },
  default: { eyebrow: "Sertifikat Penyelesaian", body: (l) => `atas keberhasilan menuntaskan program Bahasa ${l}` },
};

// ── Skill radar (inline SVG, capture-safe) ──────────────────────────────────
const SKILL_WORD = ["—", "Pemula", "Dasar", "Cukup", "Baik", "Mahir"];
function skillWord(v?: number | null) {
  const n = Math.round(Number(v || 0));
  return SKILL_WORD[Math.max(0, Math.min(5, n))] || "—";
}
function SkillRadar({ s, l, r, w, accent }: { s: number; l: number; r: number; w: number; accent: string }) {
  const C = 64, R = 46, MAX = 5;
  const pt = (val: number, deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    const rr = (Math.max(0, Math.min(MAX, val)) / MAX) * R;
    return [C + rr * Math.cos(a), C + rr * Math.sin(a)] as const;
  };
  // Speaking=atas(0), Listening=kanan(90), Reading=bawah(180), Writing=kiri(270) — match admin
  const data = [pt(s, 0), pt(l, 90), pt(r, 180), pt(w, 270)].map((p) => p.join(",")).join(" ");
  const rings = [1, 2, 3, 4, 5].map((k) => {
    const rr = (k / MAX) * R;
    return [[C, C - rr], [C + rr, C], [C, C + rr], [C - rr, C]].map((p) => p.join(",")).join(" ");
  });
  return (
    <svg viewBox="0 0 128 128" className="h-[128px] w-[128px] shrink-0" aria-hidden>
      {rings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#E2E8F0" strokeWidth={1} />
      ))}
      <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="#E2E8F0" strokeWidth={1} />
      <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="#E2E8F0" strokeWidth={1} />
      <polygon points={data} fill={`${accent}26`} stroke={accent} strokeWidth={2} strokeLinejoin="round" />
      {[pt(s, 0), pt(l, 90), pt(r, 180), pt(w, 270)].map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={2.6} fill={accent} />
      ))}
    </svg>
  );
}
function SkillBlock({ ct, accent }: { ct: Cert; accent: string }) {
  const s = ct.speaking, l = ct.listening, r = ct.reading, w = ct.writing;
  const has = [s, l, r, w].every((v) => typeof v === "number");
  if (!has) return null;
  const rows: { icon: typeof Mic; label: string; v: number }[] = [
    { icon: Mic, label: "Berbicara", v: Number(s) },
    { icon: Headphones, label: "Menyimak", v: Number(l) },
    { icon: BookOpen, label: "Membaca", v: Number(r) },
    { icon: PenLine, label: "Menulis", v: Number(w) },
  ];
  return (
    <div className="mx-auto mt-8 w-full max-w-[480px] rounded-2xl bg-white/70 p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B7280]">Penilaian Kemampuan</p>
      <div className="mt-3 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <SkillRadar s={Number(s)} l={Number(l)} r={Number(r)} w={Number(w)} accent={accent} />
        <div className="w-full flex-1 space-y-2.5">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0" style={{ color: accent }} strokeWidth={2.4} />
                <span className="w-[68px] shrink-0 text-left text-[12px] font-bold text-[#12172B]">{row.label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEF1F4]">
                  <span className="block h-full rounded-full" style={{ width: `${(row.v / 5) * 100}%`, background: accent }} />
                </span>
                <span className="w-[44px] shrink-0 text-right text-[11px] font-extrabold" style={{ color: accent }}>{skillWord(row.v)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SertifikatTab({
  studentName,
  certs,
  onContinue,
  onSchedule,
}: {
  studentName: string;
  certs: Cert[];
  onContinue?: () => void;
  onSchedule?: () => void;
}) {
  useEffect(() => { ensureInter(); }, []);
  const isDark = useIsDark();

  const DUMMY: Cert[] = useMemo(() => [
    { id: "d-eng-a2", product: "Kelas Private", language: "English", level: "A2", title: "Elementary", teacher: "Sarah Wijaya", status: "issued", date: "14 Feb 2026", score: 88, hours: 32, idNo: "LING-EN-A2-204815", speaking: 4, listening: 5, reading: 4, writing: 3 },
    { id: "d-jpn-a1", product: "Kelas Private", language: "Japanese", level: "A1.1", title: "Pemula", teacher: "Kenji Tanaka", status: "issued", date: "3 Apr 2026", score: 91, hours: 16, idNo: "LING-JP-A1-205533", speaking: 3, listening: 4, reading: 4, writing: 4 },
    { id: "d-kid-a1", product: "Kelas Kids", language: "English", level: "A1", title: "Young Explorer", teacher: "Miss Dina", status: "issued", date: "20 Mei 2026", hours: 12, idNo: "LING-EN-A1-208841" },
    { id: "d-eng-b1", product: "Kelas Reguler", language: "English", level: "B1", title: "Conversational", teacher: "Sarah Wijaya", status: "progress", pct: 75, used: 12, total: 16 },
    { id: "d-kor-a2", product: "Kelas Private", language: "Korean", level: "A2.1", title: "Pra-Menengah", teacher: "Min-ji Park", status: "progress", pct: 31, used: 5, total: 16 },
  ], []);
  const list = certs.length ? certs : DUMMY;

  const issuedCount = list.filter((c) => c.status === "issued").length;
  const lockedCount = list.filter((c) => c.status === "progress").length;

  // ── Filter kategori (cara belajar + jenis program) ──
  const [filter, setFilter] = useState<FilterKey>("all");
  const FILTERS = useMemo(() => {
    const countOf = (k: FilterKey) => list.filter((c) => matchesFilter(c, k)).length;
    const rows: { key: FilterKey; label: string; count: number; hint?: string }[] = [
      { key: "all", label: "Semua", count: list.length },
      { key: "live", label: "Kelas Live", count: countOf("live") },
      { key: "mandiri", label: "Belajar Mandiri", count: countOf("mandiri") },
    ];
    // Chip jenis program cuma muncul kalau siswa memang punya sertifikat jenisnya —
    // kalau keempatnya selalu dipasang, kolom 320px penuh chip berangka 0.
    for (const p of PRODUCT_FILTERS) {
      const n = countOf(p.key);
      if (n) rows.push({ key: p.key, label: p.label, count: n, hint: p.hint });
    }
    return rows;
  }, [list]);
  // Sertifikat baru terbit bisa bikin chip yang lagi aktif hilang → balik ke "Semua"
  // supaya daftarnya tidak kosong tanpa sebab yang kelihatan.
  useEffect(() => {
    if (!FILTERS.some((f) => f.key === filter)) setFilter("all");
  }, [FILTERS, filter]);
  const filtered = useMemo(() => list.filter((c) => matchesFilter(c, filter)), [list, filter]);
  const activeHint = FILTERS.find((f) => f.key === filter)?.hint;

  const [selectedId, setSelectedId] = useState<string>(list[0]?.id);
  // [sertifikat-cefr-modal-v1] popup penjelasan CEFR + peta levelisasi
  const [cefrOpen, setCefrOpen] = useState(false);
  // detail mengikuti list yang sedang difilter; fallback ke item pertama kategori aktif
  const selected = filtered.find((c) => c.id === selectedId) || filtered[0] || null;

  if (!list.length) {
    return (
      <div className="w-full">
        <div className="rounded-[26px] bg-white p-12 text-center shadow-[0_24px_60px_-40px_rgba(18,23,43,.45)]">
          <Award className="mx-auto mb-3 h-10 w-10 text-slate-300" strokeWidth={1.6} />
          <p className="text-[15px] font-extrabold text-[#12172B]">Belum ada sertifikat</p>
          <p className="mt-1 text-[13px] text-[#6B7280]">Sertifikat terbit otomatis setelah kamu menuntaskan satu sublevel (16 sesi).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* [sertifikat-dark-v1] Dua hal yang cuma bisa dibereskan lewat CSS:
          1) KERTAS SERTIFIKAT wajib tetap terang di mode gelap. Itu dokumen —
             sekaligus yang difoto html2canvas buat PDF; kalau ikut menghitam,
             PDF-nya ikut hitam. Selector sengaja 3 class (.lms-dark .cert-paper .x)
             biar menang atas aturan shell yang cuma 2 class + !important.
          2) Tombol sekunder `bg-white` di mode gelap jadi #1c1c1c — sewarna persis
             dengan kartunya, jadi tombolnya lenyap. Dinaikkan + dikasih garis. */}
      <style>{`
        .lms-dark .cert-paper.bg-white,.lms-dark .cert-paper .bg-white{background-color:#ffffff !important;}
        .lms-dark .cert-paper .bg-white\\/70{background-color:rgba(255,255,255,.72) !important;}
        .lms-dark .cert-paper .bg-\\[\\#EEF1F4\\]{background-color:#EEF1F4 !important;}
        .lms-dark .cert-paper .bg-slate-300{background-color:#CBD5E1 !important;}
        .lms-dark .cert-paper .text-\\[\\#12172B\\]{color:#12172B !important;}
        .lms-dark .cert-paper .text-\\[\\#6B7280\\]{color:#6B7280 !important;}
        .lms-dark .cert-btn-ghost.bg-white{background-color:#262626 !important;border:1px solid #3A3A3A !important;}
        .lms-dark .cert-btn-ghost.bg-white:hover{background-color:#333333 !important;}
        .lms-dark .cert-tint{background-color:rgba(45,212,191,.10) !important;}
      `}</style>
      <div className="flex min-w-0 flex-col-reverse overflow-hidden rounded-[26px] bg-white shadow-[0_24px_60px_-40px_rgba(18,23,43,0.45)] lg:flex-row">
        {/* LEFT: list */}
        <section className="flex w-full shrink-0 flex-col border-t border-slate-100 bg-white lg:w-[320px] lg:border-r lg:border-t-0">
          <div className="px-6 pb-3 pt-7">
            <h2 className="text-[18px] font-extrabold text-[#12172B]">Sertifikat</h2>
            <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{issuedCount} terbit · {lockedCount} dalam proses</p>
          </div>
          {/* filter kategori */}
          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
            {FILTERS.map((f) => {
              const on = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
                    on ? "bg-[#16796E] text-white" : "bg-[#F5F6F8] text-[#6B7280] hover:bg-[#EAEDF0]"
                  }`}
                >
                  {f.label}
                  <span className={`rounded-full px-1.5 text-[11px] ${on ? "bg-white/25 text-white" : "bg-white text-[#6B7280]"}`}>{f.count}</span>
                </button>
              );
            })}
          </div>
          {activeHint && (
            <p className="-mt-1 px-4 pb-3 text-[11px] font-medium leading-relaxed text-[#6B7280]">{activeHint}</p>
          )}
          <div className="flex max-h-[360px] flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-4 lg:max-h-none">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-center">
                <Award className="h-8 w-8 text-slate-300" strokeWidth={1.6} />
                <p className="text-[13px] font-bold text-[#12172B]">Belum ada di kategori ini</p>
                <p className="text-[12px] font-medium text-[#6B7280]">Coba pilih kategori lain di atas.</p>
              </div>
            )}
            {filtered.map((ct) => {
              const active = ct.id === selected?.id;
              return (
                <button
                  key={ct.id}
                  onClick={() => setSelectedId(ct.id)}
                  className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-[#F5F6F8]"
                  style={
                    active
                      ? isDark
                        // Dulu di sini hardcoded `background:"#fff"` — di mode gelap teksnya
                        // dipaksa putih oleh shell, hasilnya putih di atas putih alias hilang.
                        ? { background: "#2E2E2E", outline: "2px solid #2DD4BF", boxShadow: "0 16px 36px -22px rgba(0,0,0,.8)" }
                        : { background: "#fff", outline: "2px solid #16796E", boxShadow: "0 16px 36px -22px rgba(18,23,43,.55)" }
                      : undefined
                  }
                >
                  <FlagBadge lang={ct.language} variant="list" dark={isDark} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-extrabold text-[#12172B]">{ct.language} — {ct.level}</span>
                    {/* [sertifikat-kategori-program-v1] jenis program ikut tampil di kartu,
                        biar kategorinya kebaca tanpa harus main filter dulu. */}
                    <span className="block truncate text-[12px] font-medium text-[#6B7280]">
                      CEFR · {ct.title}
                      {PROD_SHORT[productKindOf(ct.product)] ? ` · ${PROD_SHORT[productKindOf(ct.product)]}` : ""}
                    </span>
                  </span>
                  {/* [sertifikat-list-bendera-v1] chip status/persen di kanan nama bahasa
                      dibuang — barisnya jadi sesak & informasinya sudah lengkap di panel
                      detail (plus hitungan "x terbit · y dalam proses" di kepala tab). */}
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100 px-6 py-4">
            {/* [sertifikat-cefr-modal-v1] kotaknya sekarang tombol — buka penjelasan
                CEFR + grafik levelisasi (A1.1 s.d. B2.7). */}
            <button
              type="button"
              onClick={() => setCefrOpen(true)}
              className="cert-tint w-full rounded-2xl bg-[#16796E0D] p-4 text-left transition hover:brightness-[.97] active:scale-[.99]"
            >
              <p className="flex items-center gap-2 text-[13px] font-extrabold text-[#12172B]">
                <Info className="h-4 w-4 text-[#16796E]" />Tentang CEFR
                <ChevronRight className="ml-auto h-4 w-4 text-[#16796E]" />
              </p>
              <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-[#6B7280]">Sertifikat terbit otomatis setelah kamu menuntaskan satu sublevel (16 sesi).</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#16796E]">Lihat peta level A1–B2</span>
            </button>
          </div>
        </section>

        {/* RIGHT: detail */}
        <main className="min-w-0 flex-1 bg-[#F5F6F8]">
          <div className="flex flex-col gap-6 p-4 sm:p-5 lg:p-6">
            {selected ? (
              selected.status === "issued"
                ? <IssuedDetail ct={selected} studentName={studentName} />
                : <ProgressDetail ct={selected} onContinue={onContinue} onSchedule={onSchedule} />
            ) : (
              <div className="rounded-2xl bg-white p-12 text-center">
                <Award className="mx-auto mb-3 h-10 w-10 text-slate-300" strokeWidth={1.6} />
                <p className="text-[15px] font-extrabold text-[#12172B]">Pilih sertifikat</p>
                <p className="mt-1 text-[13px] text-[#6B7280]">Belum ada sertifikat di kategori ini.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {cefrOpen && <CefrModal onClose={() => setCefrOpen(false)} currentLevel={selected?.level} isDark={isDark} />}
    </div>
  );
}

function IssuedDetail({ ct, studentName }: { ct: Cert; studentName: string }) {
  const col = colorOf(ct.language);
  const kind = productKindOf(ct.product);
  const copy = COPY[kind];
  const isKids = kind === "kids";
  const showCefr = kind !== "kids";
  const cardRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const handleDownloadPdf = async () => {
    if (!cardRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      ensureInter();
      await loadScript(H2C_URL);
      await loadScript(JSPDF_URL);
      // Pastiin font + bendera (data-URI udah di state) siap sebelum capture.
      try { await (document as Document & { fonts?: { ready: Promise<unknown>; load: (f: string) => Promise<unknown> } }).fonts?.load("800 30px Inter"); } catch { /* noop */ }
      try { await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready; } catch { /* noop */ }
      await new Promise((res) => setTimeout(res, 60));
      const w = window as typeof window & { html2canvas?: Html2Canvas; jspdf?: { jsPDF: JsPdfCtor } };
      const h2c = w.html2canvas;
      const JsPDF = w.jspdf?.jsPDF;
      if (!h2c || !JsPDF) throw new Error("lib belum siap");
      const canvas = await h2c(cardRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      const img = canvas.toDataURL("image/png");
      const pdf = new JsPDF({ orientation: canvas.width > canvas.height ? "landscape" : "portrait", unit: "px", format: [canvas.width, canvas.height] });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      pdf.addImage(img, "PNG", 0, 0, pw, ph);
      pdf.save(`Sertifikat-Linguo-${ct.language}-${ct.level}${ct.idNo ? "-" + ct.idNo : ""}.pdf`);
    } catch (e) {
      console.error("[Sertifikat] gagal membuat PDF:", e);
      alert("Gagal membuat PDF. Coba lagi sebentar ya.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShare = async () => {
    const what = showCefr ? `${ct.language} CEFR ${ct.level}` : `Bahasa ${ct.language}`;
    const text = `Aku baru menuntaskan ${what} di Linguo! 🎉${ct.idNo ? ` (No. ${ct.idNo})` : ""}`;
    const url = "https://linguo.id";
    try {
      if (navigator.share) await navigator.share({ title: "Sertifikat Linguo", text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); alert("Teks sertifikat disalin ke clipboard ✓"); }
    } catch { /* user batal share -> abaikan */ }
  };

  const handleLinkedIn = () => {
    const certName = showCefr
      ? `Bahasa ${ct.language} — CEFR ${ct.level}${ct.title ? ` (${ct.title})` : ""}`
      : `Bahasa ${ct.language}${ct.title ? ` — ${ct.title}` : ""}`;
    const params = new URLSearchParams({ startTask: "CERTIFICATION_NAME", name: certName, organizationName: "Linguo" });
    if (ct.idNo) params.set("certId", ct.idNo);
    const yr = ct.date ? /\b(20\d{2})\b/.exec(ct.date) : null;
    if (yr) params.set("issueYear", yr[1]);
    window.open(`https://www.linkedin.com/profile/add?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  const stats = [
    !isKids && ct.score != null ? { k: "Nilai Akhir", v: `${ct.score}/100` } : null,
    ct.hours != null ? { k: "Jam Belajar", v: `${ct.hours} jam` } : null,
    ct.date ? { k: "Tanggal", v: ct.date } : null,
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <>
      <div
        ref={cardRef}
        // `cert-paper` = penanda "ini kertas, jangan ikut menghitam". Lihat blok <style> di atas.
        className="cert-paper relative overflow-hidden rounded-2xl bg-white"
        style={{
          fontFamily: CERT_FONT,
          border: "1px solid #ECECEC",
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(22,121,110,.045) 0 2px, transparent 2px 9px), repeating-linear-gradient(-45deg, rgba(22,121,110,.045) 0 2px, transparent 2px 9px)",
        }}
      >
        {/* double border guilloche */}
        <div className="pointer-events-none absolute inset-0 m-3 rounded-xl" style={{ border: `2px solid ${col.accent}1f` }} />
        <div className="pointer-events-none absolute inset-0 m-[18px] rounded-lg" style={{ border: `1px solid ${col.accent}40` }} />
        {/* accent corners */}
        <div className="pointer-events-none absolute left-[18px] top-[18px] h-8 w-8 rounded-tl-lg border-l-2 border-t-2" style={{ borderColor: col.accent }} />
        <div className="pointer-events-none absolute right-[18px] top-[18px] h-8 w-8 rounded-tr-lg border-r-2 border-t-2" style={{ borderColor: col.accent }} />
        <div className="pointer-events-none absolute bottom-[18px] left-[18px] h-8 w-8 rounded-bl-lg border-b-2 border-l-2" style={{ borderColor: col.accent }} />
        <div className="pointer-events-none absolute bottom-[18px] right-[18px] h-8 w-8 rounded-br-lg border-b-2 border-r-2" style={{ borderColor: col.accent }} />

        <div className="relative px-6 py-9 text-center sm:px-10">
          {/* header: logo + flag chip */}
          <div className="flex items-center justify-center gap-3">
            <img src="/images/full-logo-linguo-hijau.png" alt="Linguo" className="h-10 w-auto object-contain" />
          </div>
          <div className="mt-4 flex items-center justify-center">
            <FlagBadge lang={ct.language} variant="chip" />
          </div>

          <p className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.25em] text-[#6B7280]">
            {isKids && <Sparkles className="h-3.5 w-3.5" style={{ color: col.accent }} />}{copy.eyebrow}
          </p>
          <p className="mt-5 text-[13px] font-medium text-[#6B7280]">Diberikan kepada</p>
          <h2 className="mt-1 text-[26px] font-extrabold leading-tight text-[#12172B] sm:text-[30px]">{studentName}</h2>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full" style={{ background: col.accent }} />

          <p className="mx-auto mt-5 max-w-[440px] text-[13px] font-medium leading-relaxed text-[#6B7280]">
            {copy.body(ct.language)}{showCefr ? <> — <b className="text-[#12172B]">Level CEFR {ct.level}</b></> : ""}{ct.title && !isKids ? ` (${ct.title})` : ""} di Linguo.
          </p>

          {/* CEFR level chip (non-kids) atau bintang (kids) */}
          {showCefr ? (
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5" style={{ background: col.bg }}>
              <Award className="h-5 w-5" style={{ color: col.text }} />
              <span className="text-[16px] font-extrabold tracking-wide" style={{ color: col.text }}>CEFR {ct.level}</span>
            </div>
          ) : (
            <div className="mx-auto mt-5 flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((i) => <Star key={i} className="h-6 w-6" style={{ color: col.accent }} fill={col.accent} />)}
            </div>
          )}

          {stats.length > 0 && (
            <div className="mx-auto mt-8 grid max-w-[440px] gap-4 text-left" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
              {stats.map((s) => (
                <div key={s.k}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">{s.k}</p>
                  <p className="mt-0.5 text-[16px] font-extrabold text-[#12172B]">{s.v}</p>
                </div>
              ))}
            </div>
          )}

          {/* 4-skill radar (Private/Reguler only, render kalau data ada) */}
          {showsSkills(kind) && <SkillBlock ct={ct} accent={col.accent} />}

          <div className="mx-auto mt-9 flex max-w-[440px] items-end justify-between">
            <div className="text-left">
              <p className="text-[20px] font-bold italic text-[#12172B]">{ct.teacher}</p>
              <div className="mt-1 h-px w-36 bg-slate-300" />
              <p className="mt-1 text-[11px] font-semibold text-[#6B7280]">Pengajar</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ border: `2px solid ${col.accent}` }}>
              <Award className="h-7 w-7" style={{ color: col.accent }} />
            </div>
          </div>
          {ct.idNo && <p className="mt-7 text-[11px] font-medium text-[#6B7280]">No. Sertifikat: {ct.idNo}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#16796E] px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pdfLoading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Download className="h-[18px] w-[18px]" />}
          {pdfLoading ? "Membuat PDF…" : "Unduh PDF"}
        </button>
        <button onClick={handleShare} className="cert-btn-ghost inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><Share2 className="h-[18px] w-[18px]" />Bagikan</button>
        <button onClick={handleLinkedIn} className="cert-btn-ghost inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><ExternalLink className="h-[18px] w-[18px]" />Tambah ke LinkedIn</button>
        <button onClick={() => setVerifyOpen(true)} className="ml-auto inline-flex h-12 items-center gap-2 px-3 text-[13px] font-bold text-[#16796E] hover:underline"><ShieldCheck className="h-[18px] w-[18px]" />Verifikasi keaslian</button>
      </div>

      {verifyOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setVerifyOpen(false)}>
          <div className="w-full max-w-[400px] overflow-hidden rounded-[24px] bg-white shadow-[0_40px_90px_-30px_rgba(18,23,43,.6)]" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex flex-col items-center px-7 py-8 text-center text-white" style={{ background: col.accent }}>
              <button onClick={() => setVerifyOpen(false)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30" aria-label="Tutup"><X className="h-4 w-4" /></button>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20"><ShieldCheck className="h-7 w-7" /></span>
              <p className="mt-3 text-[16px] font-extrabold">Sertifikat Terverifikasi</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-white/90"><BadgeCheck className="h-4 w-4" />Asli &amp; diterbitkan oleh Linguo</p>
            </div>
            <div className="px-7 py-6">
              <dl className="space-y-3 text-[13px]">
                <div className="flex items-start justify-between gap-4"><dt className="font-medium text-[#6B7280]">Diberikan kepada</dt><dd className="text-right font-extrabold text-[#12172B]">{studentName}</dd></div>
                <div className="flex items-start justify-between gap-4"><dt className="font-medium text-[#6B7280]">Program</dt><dd className="text-right font-extrabold text-[#12172B]">Bahasa {ct.language}{showCefr ? ` — CEFR ${ct.level}` : ""}</dd></div>
                <div className="flex items-start justify-between gap-4"><dt className="font-medium text-[#6B7280]">Pengajar</dt><dd className="text-right font-extrabold text-[#12172B]">{ct.teacher}</dd></div>
                {ct.date && <div className="flex items-start justify-between gap-4"><dt className="font-medium text-[#6B7280]">Tanggal terbit</dt><dd className="text-right font-extrabold text-[#12172B]">{ct.date}</dd></div>}
                {ct.idNo && <div className="flex items-start justify-between gap-4"><dt className="font-medium text-[#6B7280]">No. Sertifikat</dt><dd className="text-right font-mono text-[12px] font-bold text-[#12172B]">{ct.idNo}</dd></div>}
              </dl>
              <p className="cert-tint mt-5 flex items-start gap-2 rounded-2xl bg-[#16796E0D] p-3 text-[11px] font-medium leading-relaxed text-[#6B7280]">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#16796E]" />
                Halaman verifikasi publik dengan QR code sedang disiapkan. Untuk konfirmasi keaslian, hubungi tim Linguo dengan menyebutkan No. Sertifikat di atas.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProgressDetail({ ct, onContinue, onSchedule }: { ct: Cert; onContinue?: () => void; onSchedule?: () => void }) {
  const col = colorOf(ct.language);
  const isDark = useIsDark();
  const photo = getLangPhoto(ct.language); // [sertifikat-banner-foto-v1]
  const total = ct.total ?? 16;
  const used = ct.used ?? 0;
  const pct = ct.pct ?? (total > 0 ? Math.round((used / total) * 100) : 0);
  const remain = Math.max(0, total - used);
  return (
    <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,.5)]">
      {/* [sertifikat-banner-foto-v1] Banner pakai FOTO bahasa, persis kartu kelas di
          Beranda (sumber: getLangPhoto). Dulu cuma blok warna aksen — di kanvas hitam
          bidang oranye/merah sepenuh lebar itu menyilaukan. Kalau bahasanya belum punya
          foto stok, jatuh balik ke warna aksen (di mode gelap tetap diredam ~30%).
          Gradient hitam WAJIB: tanpa itu teks putih hilang di atas foto yang terang. */}
      <div
        className="relative flex items-center gap-5 overflow-hidden px-6 py-7 text-white sm:px-8"
        style={{ background: isDark ? `linear-gradient(0deg, rgba(0,0,0,.34), rgba(0,0,0,.34)), ${col.accent}` : col.accent }}
      >
        {photo && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={ct.language}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
          </>
        )}
        <div className="relative shrink-0"><FlagBadge lang={ct.language} variant="hero" /></div>
        <div className="relative min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold"><Lock className="h-3 w-3" />Belum Terbit</span>
          <h2 className="mt-2 text-[22px] font-extrabold leading-tight">{ct.language} — CEFR {ct.level}</h2>
          <p className="mt-1 text-[13px] font-medium text-white/85">{ct.title} · {ct.teacher}</p>
        </div>
        {/* Hiasan heksagon cuma dipakai kalau banner TIDAK punya foto — di atas foto
            dua bercak putih itu cuma bikin kotor. */}
        <div className={`pointer-events-none relative ml-2 hidden shrink-0 opacity-90 ${photo ? "" : "md:flex"}`}>
          <div className="h-14 w-14 rotate-6 bg-white/25" style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)", borderRadius: 8 }} />
          <div className="-ml-5 mt-4 h-16 w-16 bg-white/15" style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)", borderRadius: 8 }} />
        </div>
      </div>
      <div className="px-6 py-7 sm:px-8">
        <div className="flex items-center justify-between text-[13px] font-bold text-[#12172B]"><span>Progress menuju sertifikat</span><span>{pct}%</span></div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#E8EAEE]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: isDark ? "#2DD4BF" : "#16796E" }} /></div>
        <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280]"><Flag className="h-4 w-4 text-[#16796E]" />Tinggal <b className="text-[#12172B]">{remain} sesi</b> lagi ({used}/{total}) untuk membuka sertifikat ini.</p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-[22px] font-extrabold text-[#12172B]">{used}/{total}</p><p className="mt-1 text-[12px] font-medium text-[#6B7280]">Sesi Selesai</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-[22px] font-extrabold text-[#12172B]">{remain}</p><p className="mt-1 text-[12px] font-medium text-[#6B7280]">Sesi Tersisa</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-[22px] font-extrabold text-[#12172B]">CEFR {ct.level}</p><p className="mt-1 text-[12px] font-medium text-[#6B7280]">Target Level</p></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={onContinue} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#16796E] px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]"><Play className="h-[18px] w-[18px]" />Lanjut Belajar</button>
          <button onClick={onSchedule} className="cert-btn-ghost inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><CalendarDays className="h-[18px] w-[18px]" />Lihat Jadwal</button>
        </div>
      </div>
    </div>
  );
}

// ── [sertifikat-cefr-modal-v1] Popup "Tentang CEFR" ─────────────────────────
// Isinya: apa itu CEFR + peta levelisasi Linguo lewat grafik tangga (tiap batang
// = 1 sublevel, tingginya naik ikut level). ANGKA SUBLEVEL WAJIB SAMA dengan
// silabus & prompt AI: A1=3, A2=4, B1=5, B2=7 (B2.7 = test prep) — 19 sublevel,
// 16 sesi masing-masing = 304 sesi. Jangan dikarang ulang di sini.
type CefrLevel = {
  code: string; name: string; subs: number; blurb: string;
  c: string; cDark: string;
};
const CEFR_LEVELS: CefrLevel[] = [
  { code: "A1", name: "Pemula",    subs: 3, blurb: "Perkenalan diri, angka, dan kalimat sehari-hari yang sangat dasar.", c: "#9FDCD6", cDark: "#1F6B63" },
  { code: "A2", name: "Dasar",     subs: 4, blurb: "Ngobrol topik rutin: keluarga, belanja, pekerjaan, arah jalan.",     c: "#5FC2B8", cDark: "#2E9488" },
  { code: "B1", name: "Menengah",  subs: 5, blurb: "Cerita pengalaman & rencana, cukup mandiri saat traveling.",         c: "#2A9187", cDark: "#3FC5B4" },
  { code: "B2", name: "Mahir",     subs: 7, blurb: "Diskusi topik abstrak, debat, presentasi. B2.7 = persiapan tes.",    c: "#16796E", cDark: "#5EEAD4" },
];
const SESI_PER_SUB = 16;

function CefrModal({ onClose, currentLevel, isDark }: { onClose: () => void; currentLevel?: string; isDark: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Daftar 19 sublevel berurutan — dipakai buat batang grafik sekaligus penanda
  // "kamu di sini" (dicocokkan ke level sertifikat yang lagi dibuka).
  const bars = useMemo(() => {
    const out: { code: string; lvl: CefrLevel; inGroup: number }[] = [];
    for (const lvl of CEFR_LEVELS) {
      for (let i = 1; i <= lvl.subs; i++) out.push({ code: `${lvl.code}.${i}`, lvl, inGroup: i - 1 });
    }
    return out;
  }, []);
  const here = currentLevel ? bars.findIndex((b) => b.code === currentLevel.trim().toUpperCase()) : -1;
  const totalSubs = bars.length;
  const totalSesi = totalSubs * SESI_PER_SUB;

  // Geometri SVG (viewBox tetap, lebarnya diserahkan ke container biar responsif).
  const PAD_L = 16, COL_W = 22, STEP = 31, BASE_Y = 196;
  const H0: Record<string, number> = { A1: 44, A2: 72, B1: 104, B2: 140 };
  const heightOf = (b: { lvl: CefrLevel; inGroup: number }) => H0[b.lvl.code] + b.inGroup * 6;
  const VB_W = PAD_L * 2 + (totalSubs - 1) * STEP + COL_W;
  const ink = isDark ? "#E7E9EE" : "#12172B";
  const sub = isDark ? "#9BA3AF" : "#6B7280";
  const card = isDark ? "#1F1F1F" : "#ffffff";
  const soft = isDark ? "#2A2A2A" : "#F5F6F8";
  const line = isDark ? "#333333" : "#E8EAEE";
  const teal = isDark ? "#2DD4BF" : "#16796E";

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Tentang CEFR"
    >
      <div
        className="max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-t-[26px] shadow-[0_40px_90px_-30px_rgba(0,0,0,.6)] sm:rounded-[26px]"
        style={{ background: card }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="relative px-6 py-7 text-white sm:px-8" style={{ background: isDark ? "linear-gradient(135deg,#0F5A52,#16796E)" : "linear-gradient(135deg,#16796E,#0F5A52)" }}>
          <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30" aria-label="Tutup"><X className="h-4 w-4" /></button>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><GraduationCap className="h-6 w-6" /></span>
          <p className="mt-3 text-[18px] font-extrabold">Tentang CEFR</p>
          <p className="mt-1 max-w-[46ch] text-[12.5px] font-medium leading-relaxed text-white/90">
            CEFR (Common European Framework of Reference) adalah standar internasional untuk mengukur kemampuan berbahasa — dari A1 (pemula) sampai C2 (setara penutur asli). Linguo memakai standar yang sama, lalu memecah tiap level jadi sublevel 16 sesi.
          </p>
        </div>

        <div className="px-5 py-6 sm:px-8">
          {/* ringkasan angka */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { n: "A1–B2", l: "Level tersedia" },
              { n: `${totalSubs}`, l: "Sublevel" },
              { n: `${totalSesi}`, l: "Total sesi" },
            ].map((k) => (
              <div key={k.l} className="rounded-2xl p-3 text-center" style={{ background: soft }}>
                <p className="text-[17px] font-extrabold" style={{ color: ink }}>{k.n}</p>
                <p className="mt-0.5 text-[11px] font-medium" style={{ color: sub }}>{k.l}</p>
              </div>
            ))}
          </div>

          {/* grafik tangga level */}
          <p className="mt-6 text-[13px] font-extrabold" style={{ color: ink }}>Peta level di Linguo</p>
          <p className="mt-0.5 text-[12px] font-medium leading-relaxed" style={{ color: sub }}>
            Tiap balok = 1 sublevel = 16 sesi. Semakin tinggi baloknya, semakin dalam materinya.
          </p>
          <div className="mt-3 overflow-x-auto">
            <svg viewBox={`0 0 ${VB_W} 246`} className="h-[246px] w-full min-w-[560px]" role="img" aria-label="Grafik level CEFR A1 sampai B2 beserta sublevelnya">
              {/* garis dasar */}
              <line x1="0" y1={BASE_Y + 0.5} x2={VB_W} y2={BASE_Y + 0.5} stroke={line} strokeWidth="1" />
              {bars.map((b, i) => {
                const h = heightOf(b);
                const x = PAD_L + i * STEP;
                const y = BASE_Y - h;
                const passed = here < 0 || i <= here;
                const isHere = i === here;
                const fill = isDark ? b.lvl.cDark : b.lvl.c;
                return (
                  <g key={b.code}>
                    <rect x={x} y={y} width={COL_W} height={h} rx="6" fill={fill} opacity={passed ? 1 : 0.32} />
                    {isHere && <rect x={x - 2.5} y={y - 2.5} width={COL_W + 5} height={h + 5} rx="8" fill="none" stroke={teal} strokeWidth="2.5" />}
                    <text x={x + COL_W / 2} y={y - 7} textAnchor="middle" fontSize="9.5" fontWeight="700" fill={isHere ? teal : sub}>{b.code}</text>
                  </g>
                );
              })}
              {/* penanda "kamu di sini" */}
              {here >= 0 && (() => {
                const b = bars[here];
                const x = PAD_L + here * STEP + COL_W / 2;
                const y = Math.max(16, BASE_Y - heightOf(b) - 22);
                return (
                  <g>
                    <rect x={x - 42} y={y - 12} width="84" height="18" rx="9" fill={teal} />
                    <text x={x} y={y + 1} textAnchor="middle" fontSize="10" fontWeight="800" fill={isDark ? "#0B0B0B" : "#ffffff"}>Kamu di sini</text>
                  </g>
                );
              })()}
              {/* label kelompok level */}
              {CEFR_LEVELS.map((lvl) => {
                const start = bars.findIndex((b) => b.lvl.code === lvl.code);
                const cx = PAD_L + start * STEP + ((lvl.subs - 1) * STEP + COL_W) / 2;
                const x1 = PAD_L + start * STEP;
                const x2 = x1 + (lvl.subs - 1) * STEP + COL_W;
                return (
                  <g key={lvl.code}>
                    <line x1={x1} y1={BASE_Y + 8} x2={x2} y2={BASE_Y + 8} stroke={isDark ? lvl.cDark : lvl.c} strokeWidth="3" strokeLinecap="round" />
                    <text x={cx} y={BASE_Y + 26} textAnchor="middle" fontSize="13" fontWeight="800" fill={ink}>{lvl.code} · {lvl.name}</text>
                    <text x={cx} y={BASE_Y + 41} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={sub}>{lvl.subs} sublevel · {lvl.subs * SESI_PER_SUB} sesi</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* rincian per level */}
          <div className="mt-5 flex flex-col gap-2">
            {CEFR_LEVELS.map((lvl) => (
              <div key={lvl.code} className="flex items-start gap-3 rounded-2xl p-3" style={{ background: soft }}>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-extrabold" style={{ background: isDark ? lvl.cDark : lvl.c, color: isDark ? "#0B0B0B" : "#0B2B28" }}>{lvl.code}</span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-extrabold" style={{ color: ink }}>
                    {lvl.name} <span className="font-semibold" style={{ color: sub }}>· {lvl.code}.1–{lvl.code}.{lvl.subs}</span>
                  </span>
                  <span className="mt-0.5 block text-[12px] font-medium leading-relaxed" style={{ color: sub }}>{lvl.blurb}</span>
                </span>
              </div>
            ))}
          </div>

          {/* catatan sertifikat */}
          <div className="cert-tint mt-5 flex items-start gap-2 rounded-2xl bg-[#16796E0D] p-4">
            <Award className="mt-0.5 h-4 w-4 shrink-0" style={{ color: teal }} />
            <p className="text-[12px] font-medium leading-relaxed" style={{ color: sub }}>
              <b style={{ color: ink }}>Satu sublevel = satu sertifikat.</b> Begitu 16 sesi di satu sublevel tuntas, sertifikatnya terbit otomatis di tab ini — misal selesai A1.1 langsung lanjut A1.2. Kalau evaluasi pengajar menyatakan kamu sudah mampu, sublevel boleh dilompati.
            </p>
          </div>

          <button onClick={onClose} className="mt-5 h-12 w-full rounded-2xl text-[14px] font-extrabold text-white transition hover:brightness-110" style={{ background: teal, color: isDark ? "#0B0B0B" : "#ffffff" }}>
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
