"use client";

// linguo-patch:akun-sertifikat-tab-v2
// Redesign modern: bendera per-bahasa (flagcdn -> data-URI, capture-safe),
// radar 4-skill (Speaking/Listening/Reading/Writing) inline-SVG (bukan Recharts -> aman di html2canvas),
// template per-produk (Private/Reguler = CEFR + skill, Kids = playful, Test Prep/E-Learning = Phase 2 fallback),
// font Inter (double-story 'a') + guard document.fonts.ready sebelum capture biar PDF ga fallback.
// Data diturunkan dari registrasi (sessions_used/total). Kosong → tampilan "Belum ada sertifikat".
// Palet inline (config-independent): teal #16796E, accent #F2CB05, ink #12172B.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award, BadgeCheck, Lock, Download, Share2, ExternalLink, ShieldCheck,
  Flag, Play, CalendarDays, Info, X, Loader2, Mic, Headphones, BookOpen, PenLine,
  Sparkles, Star, ChevronRight, GraduationCap, BarChart2,
} from "lucide-react";
// [sertifikat-banner-foto-v1] foto stok bahasa — sumber sama dgn kartu kelas di Beranda
import { prefetchCertificatePreview, prepareCertificatePrintImages } from "@/lib/certificateImages";
import { certificateCountryCode } from "@/lib/courseCertificateTheme";
import { getLangPhoto } from "@/lib/lang-visuals";
import CourseCertificatePaper, { COURSE_CERT_WIDTH, COURSE_CERT_HEIGHT } from "./CourseCertificatePaper";
import RaporPaper, { pilihRapor, type RaporRow } from "./RaporPaper"; // [sertifikat-rapor-2hal-v1]
import { supabase } from "@/lib/supabase-client";
import QRCode from "qrcode"; // [sertifikat-qr-verifikasi-v1]
import { TTD_RINI, useTtdDataUrl } from "@/components/akun/simulasi/CertificateSheet"; // [sertifikat-ttd-rini-v1]
import { tr, useT, useUiLang, type UiLang } from "@/lib/uiLang"; // [ui-lang-switcher-v1]
import { useLingwords } from "@/components/lingwords/useLingwords"; // [lingwords-v2]
import { toLangCode } from "@/lib/quiz/language";
import { LEVEL_VOCAB_TARGET } from "@/lib/vocabProgress";

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
  addPage: (format?: string, orientation?: string) => void;
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
  /** [sertifikat-b2b-v1] nama perusahaan klien kelas B2B — tampil di kertas & header. */
  company?: string | null;
  classStatus?: string | null; // Status registrasi, terpisah dari status terbit sertifikat.
  // [sertifikat-durasi-periode-v1] jam belajar = sesi × menit/sesi (bukan jumlah sesi),
  // periode = sesi pertama → sesi terakhir (ISO). Dirangkai jadi satu kalimat di kertas.
  minutesPerSession?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  // 4-skill CEFR (skala 1-5: Pemula/Dasar/Cukup/Baik/Mahir). Optional -> render cuma kalau ada.
  speaking?: number | null;
  listening?: number | null;
  reading?: number | null;
  writing?: number | null;
  // [sertifikat-rapor-2hal-v1] rapor terbit registrasi ini — cuma diisi pratinjau staf
  // (/api/preview-student). Siswa login: undefined → diambil sendiri lewat RLS.
  reports?: RaporRow[] | null;
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

// Bendera dan ilustrasi memakai pemetaan negara yang sama.
const flagCodeOf = certificateCountryCode;

// Bendera lokal bisa langsung tampil dan ikut diekspor tanpa fetch lintas domain.
// `dark` sengaja PROP, bukan hook: varian "chip" hidup di dalam kertas sertifikat
// yang selalu terang, jadi cuma pemanggil yang tahu latarnya gelap atau tidak.
function FlagBadge({ lang, variant, dark = false }: { lang: string; variant: "list" | "hero" | "chip"; dark?: boolean }) {
  const flagCode = flagCodeOf(lang);
  const url = flagCode ? `/images/certificates/flags-v1/${flagCode}.png` : null;
  const col = colorOf(lang);
  if (variant === "chip") {
    // pill bendera + nama, dipakai di kartu sertifikat
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-[0_4px_14px_-8px_rgba(18,23,43,.4)]" style={{ border: "1px solid #ffc8a3", background: "#fff9e8" }}>
        {url
          ? <img src={url} alt={lang} className="h-4 w-6 rounded-[3px] object-cover" style={{ boxShadow: "0 0 0 1px rgba(0,0,0,.06)" }} />
          : <span className="flex h-4 w-6 items-center justify-center rounded-[3px] text-[9px] font-extrabold" style={{ background: col.bg, color: col.text }}>{glyphOf(lang)}</span>}
        <span className="text-[12px] font-extrabold tracking-wide" style={{ color: "#ef742e" }}>{lang}</span>
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
  // Daftar dan kertas memakai aset bendera lokal yang sama.
  const code = flagCodeOf(lang);
  return (
    <span
      className="relative flex h-7 w-10 shrink-0 transform-gpu items-center justify-center overflow-hidden rounded-md transition-transform duration-200 ease-out group-hover:scale-110"
      style={{ background: dark ? col.bgDark : col.bg, boxShadow: "0 0 0 1px rgba(0,0,0,.08)" }}
    >
      <span className="text-[11px] font-extrabold" style={{ color: dark ? col.textDark : col.text }}>{glyphOf(lang)}</span>
      {code ? (
        <img
          src={`/images/certificates/flags-v1/${code}.png`}
          alt={lang}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : null}
    </span>
  );
}

// ── Per-produk ──────────────────────────────────────────────────────────────
type Kind = "private" | "reguler" | "kids" | "testprep" | "b2b" | "default";
function productKindOf(p?: string): Kind {
  const s = (p || "").toLowerCase();
  if (s.includes("b2b")) return "b2b"; // [sertifikat-b2b-v1]
  if (s.includes("kids")) return "kids";
  if (s.includes("test") || s.includes("ielts") || s.includes("toefl")) return "testprep";
  if (s.includes("private")) return "private";
  if (s.includes("reguler") || s.includes("regular")) return "reguler";
  return "default";
}
const showsSkills = (k: Kind) => k === "private" || k === "reguler";

// Tiga filter berdasarkan status kelas asli, bukan jenis produk atau status sertifikat.
type FilterKey = "all" | "active" | "inactive";
function isActiveClass(c: Cert): boolean {
  if (c.classStatus?.trim()) return /^(aktif|active)$/i.test(c.classStatus.trim());
  return c.status === "progress"; // Kompatibilitas pratinjau/data lama tanpa status kelas.
}
/** Label pendek jenis program buat kartu daftar (kolomnya cuma 320px). */
const PROD_SHORT: Record<Kind, string> = {
  reguler: "Reguler",
  private: "Private",
  testprep: "IELTS & TOEFL",
  kids: "Kids",
  b2b: "B2B",
  default: "",
};
function matchesFilter(c: Cert, key: FilterKey): boolean {
  if (key === "all") return true;
  return key === "active" ? isActiveClass(c) : !isActiveClass(c);
}
// [ui-lang-switcher-v1] `body` dipecah jadi awalan + akhiran, nama bahasanya
// disisipkan di tengah saat render — kalimat utuh ber-`${lang}` tak akan pernah
// ketemu kuncinya di kamus EN.
const COPY: Record<Kind, { eyebrow: string; bodyPre: string; bodyPost: string }> = {
  private: { eyebrow: "Sertifikat Penyelesaian", bodyPre: "atas keberhasilan menuntaskan program privat Bahasa", bodyPost: "" },
  reguler: { eyebrow: "Sertifikat Penyelesaian", bodyPre: "atas keberhasilan menuntaskan program reguler Bahasa", bodyPost: "" },
  kids: { eyebrow: "Sertifikat Petualang Cilik", bodyPre: "telah menyelesaikan petualangan belajar Bahasa", bodyPost: "dengan penuh semangat" },
  testprep: { eyebrow: "Sertifikat Persiapan Tes", bodyPre: "atas penyelesaian program persiapan tes Bahasa", bodyPost: "" },
  b2b: { eyebrow: "Sertifikat Penyelesaian", bodyPre: "atas keberhasilan menuntaskan program korporat Bahasa", bodyPost: "" },
  default: { eyebrow: "Sertifikat Penyelesaian", bodyPre: "atas keberhasilan menuntaskan program Bahasa", bodyPost: "" },
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
  const t = useT(); // [ui-lang-switcher-v1]
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
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B7280]">{t("Penilaian Kemampuan")}</p>
      <div className="mt-3 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <SkillRadar s={Number(s)} l={Number(l)} r={Number(r)} w={Number(w)} accent={accent} />
        <div className="w-full flex-1 space-y-2.5">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0" style={{ color: accent }} strokeWidth={2.4} />
                <span className="w-[68px] shrink-0 text-left text-[12px] font-bold text-[#12172B]">{t(row.label)}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEF1F4]">
                  <span className="block h-full rounded-full" style={{ width: `${(row.v / 5) * 100}%`, background: accent }} />
                </span>
                <span className="w-[44px] shrink-0 text-right text-[11px] font-extrabold" style={{ color: accent }}>{t(skillWord(row.v))}</span>
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
  defaultName,
  onSaveName,
  certs,
  onContinue,
  onSchedule,
  focusId,
  lingwordsUserId = null,
  lingwordsPreviewId = null,
}: {
  /** [lingwords-pratinjau-v1] id siswa pratinjau POV → lencana dari data asli siswa (hanya-baca). */
  lingwordsPreviewId?: string | null;
  studentName: string;
  /** [lingwords-v2] id akun siswa untuk lencana kosakata. null (mode pratinjau POV) =
   *  lencana tak ditampilkan — data lokal staf bukan milik siswanya. */
  lingwordsUserId?: string | null;
  /** [sertifikat-edit-nama-v1] nama akun — dipakai tombol "kembalikan" di popup ubah nama. */
  defaultName?: string;
  /** Simpan nama sertifikat ("" = kembali ke nama akun). Tak diisi = tombol ubah disembunyikan. */
  onSaveName?: (name: string) => Promise<void>;
  certs: Cert[];
  onContinue?: () => void;
  onSchedule?: () => void;
  /** [rapor-ke-sertifikat-v1] id registrasi (opsional "|nonce") yang dipilih saat datang dari tab Rapor kelas. */
  focusId?: string | null;
}) {
  useEffect(() => { ensureInter(); }, []);
  const isDark = useIsDark();

  const t = useT(); // [ui-lang-switcher-v1]
  /* [sertifikat-tanpa-dummy-v1] Dulu daftar kosong diisi 5 sertifikat CONTOH (Japanese
     A1.1 "Kenji Tanaka" 91/100, dst.) — siswa tanpa sertifikat (mis. peserta B2B Abdul
     Aziz saat datanya belum termuat) mengira itu sertifikat miliknya. Kosong ya kosong. */
  const list = certs;

  const issuedCount = list.filter((c) => c.status === "issued").length;
  const lockedCount = list.filter((c) => c.status === "progress").length;

  // ── Filter status kelas ──
  const [filter, setFilter] = useState<FilterKey>("all");
  const FILTERS = [
    { key: "all" as const, label: t("Semua"), count: list.length },
    { key: "active" as const, label: t("Kelas Aktif"), count: list.filter(isActiveClass).length },
    { key: "inactive" as const, label: t("Nonaktif"), count: list.filter((c) => !isActiveClass(c)).length },
  ];
  const filtered = useMemo(() => list.filter((c) => matchesFilter(c, filter)), [list, filter]);

  const [selectedId, setSelectedId] = useState<string>(list[0]?.id);
  // focusId boleh berakhiran "|<nonce>" supaya klik ulang ke kelas yang sama tetap memilihnya lagi
  useEffect(() => {
    const id = focusId?.split("|")[0];
    if (!id || !list.some((c) => c.id === id)) return;
    setFilter("all");
    setSelectedId(id);
  }, [focusId, list]);
  // [sertifikat-cefr-modal-v1] popup penjelasan CEFR + peta levelisasi
  const [cefrOpen, setCefrOpen] = useState(false);
  // detail mengikuti list yang sedang difilter; fallback ke item pertama kategori aktif
  const selected = filtered.find((c) => c.id === selectedId) || filtered[0] || null;

  if (!list.length) {
    return (
      <div className="w-full">
        <div className="rounded-[26px] bg-white p-12 text-center shadow-[0_24px_60px_-40px_rgba(18,23,43,.45)]">
          <Award className="mx-auto mb-3 h-10 w-10 text-slate-300" strokeWidth={1.6} />
          <p className="text-[15px] font-extrabold text-[#12172B]">{t("Belum ada sertifikat")}</p>
          <p className="mt-1 text-[13px] text-[#6B7280]">{t("Sertifikat terbit otomatis setelah kamu menuntaskan satu sublevel (16 sesi).")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cert-tab w-full">
      {/* [sertifikat-dark-v1] Dua hal yang cuma bisa dibereskan lewat CSS:
          1) KERTAS SERTIFIKAT wajib tetap terang di mode gelap. Itu dokumen —
             sekaligus yang difoto html2canvas buat PDF; kalau ikut menghitam,
             PDF-nya ikut hitam. Selector sengaja 3 class (.lms-dark .cert-paper .x)
             biar menang atas aturan shell yang cuma 2 class + !important.
          2) Tombol sekunder `bg-white` di mode gelap jadi #1c1c1c — sewarna persis
             dengan kartunya, jadi tombolnya lenyap. Dinaikkan + dikasih garis. */}
      <style>{`
        /* [sertifikat-hitam-v1] Di mode gelap tab ini dulu bertumpuk abu-abu:
           kanvas #000, panel #101010, kolom kanan #080808, ubin #1c1c1c — empat
           nada yang beda tipis, kebacanya kotak abu di atas hitam. Sekarang semua
           bidangnya HITAM dan pemisahnya cuma garis rambut. Cakupannya .cert-tab
           doang biar tak menular ke halaman dashboard yang lain. */
        .lms-dark .cert-tab .bg-white,
        .lms-dark .cert-tab .bg-\[\#F5F6F8\],
        .lms-dark .cert-tab .bg-slate-50,
        .lms-dark .cert-tab .bg-gray-50{background-color:#000000 !important;}
        .lms-dark .cert-tab .cert-chip{background-color:#141414 !important;}
        .lms-dark .cert-tab .cert-chip:hover{background-color:#1e1e1e !important;}
        .lms-dark .cert-tab .cert-chip-num{background-color:#262626 !important;}
        .lms-dark .cert-tab .bg-\[\#E8EAEE\],.lms-dark .cert-tab .bg-\[\#EEF1F4\]{background-color:#1a1a1a !important;}
        .lms-dark .cert-tab .cert-shell{border:1px solid #1c1c1c;box-shadow:none !important;}
        .lms-dark .cert-tab .cert-card{border:1px solid #1c1c1c;box-shadow:none !important;}
        .lms-dark .cert-tab .cert-tile{border:1px solid #1c1c1c;}
        .lms-dark .cert-tab .cert-row-active{background-color:#000000 !important;}
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
      <div className="cert-shell flex min-w-0 flex-col-reverse overflow-hidden rounded-[26px] bg-white shadow-[0_24px_60px_-40px_rgba(18,23,43,0.45)] lg:flex-row">
        {/* LEFT: list */}
        <section className="flex w-full shrink-0 flex-col border-t border-slate-100 bg-white lg:w-[320px] lg:border-r lg:border-t-0">
          <div className="px-6 pb-3 pt-7">
            <h2 className="text-[18px] font-extrabold text-[#12172B]">{t("Sertifikat")}</h2>
            <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{issuedCount} {t("terbit")} · {lockedCount} {t("dalam proses")}</p>
          </div>
          {/* filter kategori */}
          {/* Satu baris: chip mengisi lebar kolom (flex-auto) & tak boleh turun baris. */}
          <div className="flex flex-nowrap gap-1 px-4 pb-3">
            {FILTERS.map((f) => {
              const on = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`inline-flex flex-auto items-center justify-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-bold transition ${
                    on ? "bg-[#16796E] text-white" : "cert-chip bg-[#F5F6F8] text-[#6B7280] hover:bg-[#EAEDF0]"
                  }`}
                >
                  {f.label}
                  <span className={`rounded-full px-1.5 text-[11px] ${on ? "bg-white/25 text-white" : "cert-chip-num bg-white text-[#6B7280]"}`}>{f.count}</span>
                </button>
              );
            })}
          </div>
          {/* [sertifikat-kartu-kepotong-v1] Kartu paling atas dulu kepotong waktu dipilih:
              garis pilihnya dipasang lewat `outline` (digambar DI LUAR kotak) sementara
              wadahnya `overflow-y-auto` tanpa ruang atas — jadi 2px sisi atasnya tergunting
              scroller. Sekarang wadahnya dikasih pt-1.5 dan garisnya ditarik ke dalam
              (outlineOffset -2px), jadi aman juga waktu daftarnya di-scroll. */}
          <div className="flex max-h-[360px] flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-4 pt-1.5 lg:max-h-none">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-center">
                <Award className="h-8 w-8 text-slate-300" strokeWidth={1.6} />
                <p className="text-[13px] font-bold text-[#12172B]">{t("Belum ada di kategori ini")}</p>
                <p className="text-[12px] font-medium text-[#6B7280]">{t("Coba pilih kategori lain di atas.")}</p>
              </div>
            )}
            {filtered.map((ct) => {
              const active = ct.id === selected?.id;
              return (
                // [sertifikat-list-hover-zoom-v1] hover = kartu membesar tipis + benderanya ikut zoom.
                // Skala kecil (1.03) biar tak kepotong wadah scroll (px-4 = 16px ruang samping).
                <button
                  key={ct.id}
                  onClick={() => setSelectedId(ct.id)}
                  onMouseEnter={() => { if (ct.status === "issued") prefetchCertificatePreview(ct.language); }}
                  onFocus={() => { if (ct.status === "issued") prefetchCertificatePreview(ct.language); }}
                  className="group flex w-full transform-gpu items-center gap-3 rounded-2xl p-3 text-left transition duration-200 ease-out [backface-visibility:hidden] hover:scale-[1.03] hover:bg-[#F5F6F8] active:scale-[.99]"
                  style={
                    active
                      ? isDark
                        // Dulu di sini hardcoded `background:"#fff"` — di mode gelap teksnya
                        // dipaksa putih oleh shell, hasilnya putih di atas putih alias hilang.
                        ? { background: "#111111", outline: "2px solid #2DD4BF", outlineOffset: "-2px", boxShadow: "none" }
                        : { background: "#fff", outline: "2px solid #16796E", outlineOffset: "-2px", boxShadow: "0 16px 36px -22px rgba(18,23,43,.55)" }
                      : undefined
                  }
                >
                  <FlagBadge lang={ct.language} variant="list" dark={isDark} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-extrabold text-[#12172B]">{ct.language} — {ct.level}</span>
                    {/* [sertifikat-kategori-program-v1] jenis program ikut tampil di kartu,
                        biar kategorinya kebaca tanpa harus main filter dulu. */}
                    <span className="block truncate text-[12px] font-medium text-[#6B7280]">
                      CEFR · {t(ct.title || "")}
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
                <Info className="h-4 w-4 text-[#16796E]" />{t("Tentang CEFR")}
                <ChevronRight className="ml-auto h-4 w-4 text-[#16796E]" />
              </p>
              <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-[#6B7280]">{t("Sertifikat terbit otomatis setelah kamu menuntaskan satu sublevel (16 sesi).")}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#16796E]">{t("Lihat peta level A1–B2")}</span>
            </button>
          </div>
        </section>

        {/* RIGHT: detail */}
        <main className="min-w-0 flex-1 bg-[#F5F6F8]">
          <div className="flex flex-col gap-6 p-4 sm:p-5 lg:p-6">
            {selected ? (
              selected.status === "issued"
                ? <IssuedDetail ct={selected} studentName={studentName} defaultName={defaultName} onSaveName={onSaveName} lingwordsUserId={lingwordsUserId} lingwordsPreviewId={lingwordsPreviewId} />
                : <ProgressDetail ct={selected} studentName={studentName} onContinue={onContinue} onSchedule={onSchedule} />
            ) : (
              <div className="cert-card rounded-2xl bg-white p-12 text-center">
                <Award className="mx-auto mb-3 h-10 w-10 text-slate-300" strokeWidth={1.6} />
                <p className="text-[15px] font-extrabold text-[#12172B]">{t("Pilih sertifikat")}</p>
                <p className="mt-1 text-[13px] text-[#6B7280]">{t("Belum ada sertifikat di kategori ini.")}</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {cefrOpen && <CefrModal onClose={() => setCefrOpen(false)} currentLevel={selected?.level} isDark={isDark} />}
    </div>
  );
}

// [sertifikat-durasi-periode-v1] "8 jam" / "7,5 jam" — koma desimal di ID, titik di EN.
function fmtHours(h: number, lang: UiLang): string {
  const r = Math.round(h * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toLocaleString(lang === "en" ? "en-GB" : "id-ID");
}
function fmtCertDate(iso: string | null | undefined, lang: UiLang): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  // en-GB menulis "Sept" — diseragamkan jadi "Sep" biar sama dengan format di tempat lain.
  return d.toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).replace("Sept", "Sep");
}

// ── [sertifikat-rapor-2hal-v3] Rapor kelas + pembuat PDF bersama ──────────────
// Rapor terbit registrasi ini (akhir dulu, kalau tidak terbaru). Pratinjau staf
// membawa barisnya di `ct.reports`; siswa login membaca sendiri lewat RLS.
function useRaporKelas(ct: Cert): RaporRow | null {
  const [rapor, setRapor] = useState<RaporRow | null>(null);
  useEffect(() => {
    if (ct.reports !== undefined) { setRapor(pilihRapor(ct.reports)); return; }
    setRapor(null);
    if (!/^[0-9a-f-]{36}$/i.test(ct.id)) return;
    let batal = false;
    supabase
      .from("class_reports")
      .select("id, report_type, skills, attendance, teacher_comment, recommendation, published_at")
      .eq("registration_id", ct.id)
      .not("published_at", "is", null)
      .then(({ data, error }) => {
        if (batal) return;
        if (error) { console.warn("[sertifikat] class_reports tak terbaca:", error.message); return; }
        setRapor(pilihRapor(data as RaporRow[]));
      });
    return () => { batal = true; };
  }, [ct.id, ct.reports]);
  return rapor;
}

// Satu kertas (1120×792) = satu halaman A4 landscape. Skala pratinjau dilepas & slide
// yang sedang tersembunyi (visibility) dimunculkan HANYA di dokumen salinan html2canvas.
async function buatPdf(pages: { el: HTMLElement; attr: string }[]): Promise<JsPdfDoc> {
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
  const foto = async (el: HTMLElement, attr: string) => {
    const images = Array.from(el.querySelectorAll("img"));
    await Promise.all(images.map(async (img) => {
      if (!img.complete) await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Gambar sertifikat gagal dimuat"));
      });
      if (!img.naturalWidth) throw new Error("Gambar sertifikat belum siap");
    }));
    const canvas = await h2c(el, {
      scale: 2, width: COURSE_CERT_WIDTH, height: COURSE_CERT_HEIGHT,
      windowWidth: 1440, backgroundColor: "#ffffff", useCORS: true, logging: false,
      onclone: async (doc: Document) => {
        const paper = doc.querySelector<HTMLElement>(`[${attr}]`);
        if (paper) {
          await prepareCertificatePrintImages(paper);
          paper.style.transform = "none";
          const slideEl = paper.closest<HTMLElement>("[data-cert-slide]");
          if (slideEl) slideEl.style.visibility = "visible";
          if (paper.parentElement) {
            paper.parentElement.style.width = `${COURSE_CERT_WIDTH}px`;
            paper.parentElement.style.height = `${COURSE_CERT_HEIGHT}px`;
            paper.parentElement.style.overflow = "visible";
          }
        }
      },
    });
    return canvas.toDataURL("image/jpeg", 0.95);
  };
  const pdf = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage("a4", "landscape");
    pdf.addImage(await foto(pages[i].el, pages[i].attr), "JPEG", 0, 0, pw, ph);
  }
  return pdf;
}

/** Tab Sertifikat | Rapor di kepala panel detail — tampil untuk semua kelas. */
function SlideTabs({ slide, onChange, note }: { slide: 0 | 1; onChange: (s: 0 | 1) => void; note?: string | null }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {([t("Sertifikat"), t("Rapor")] as const).map((lbl, i) => (
        <button
          key={i}
          onClick={() => onChange(i as 0 | 1)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
            slide === i ? "bg-[#16796E] text-white" : "cert-chip bg-white text-[#6B7280] hover:bg-[#EAEDF0]"
          }`}
        >
          {i === 0 ? <Award className="h-3.5 w-3.5" /> : <BarChart2 className="h-3.5 w-3.5" />}
          {lbl}
        </button>
      ))}
      {note ? <span className="ml-2 text-[11px] font-medium text-[#6B7280]">{note}</span> : null}
    </div>
  );
}

/** Slide Rapor saat belum ada rapor terbit. */
function RaporKosong() {
  const t = useT();
  return (
    <div className="cert-card flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-14 text-center">
      <BarChart2 className="mb-3 h-10 w-10 text-slate-300" strokeWidth={1.6} />
      <p className="text-[15px] font-extrabold text-[#12172B]">{t("Belum ada rapor yang diterbitkan")}</p>
      <p className="mt-1 max-w-[380px] text-[13px] text-[#6B7280]">{t("Pengajar menerbitkan rapor tiap 4 sesi dan Rapor Akhir di akhir program")}</p>
    </div>
  );
}

/* [lingwords-v2] Lencana tonggak kosakata: "Menguasai N kosakata A1" muncul di sertifikat
   & rapor kalau jumlah kata dikuasai (Lingwords) bahasa ini sudah mencapai target level
   sertifikatnya (LEVEL_VOCAB_TARGET, level induk: A1.2 → A1). */
function useVocabBadge(userId: string | null, previewId: string | null, language: string, level: string): { n: number; level: string; target: number } | null {
  const { words } = useLingwords(userId, [], { sync: false, previewStudentId: previewId });
  return useMemo(() => {
    if (!userId && !previewId) return null;
    const lang = toLangCode(language);
    const base = (level || "").split(".")[0].toUpperCase();
    const target = LEVEL_VOCAB_TARGET[base];
    if (!lang || !target) return null;
    const n = words.filter((w) => w.lang === lang && w.stage === "dikuasai").length;
    return n >= target ? { n, level: base, target } : null;
  }, [userId, previewId, words, language, level]);
}

function IssuedDetail({ ct, studentName, defaultName, onSaveName, lingwordsUserId = null, lingwordsPreviewId = null }: { ct: Cert; studentName: string; defaultName?: string; onSaveName?: (name: string) => Promise<void>; lingwordsUserId?: string | null; lingwordsPreviewId?: string | null }) {
  const t = useT(); // [ui-lang-switcher-v1]
  const vocab = useVocabBadge(lingwordsUserId, lingwordsPreviewId, ct.language, ct.level);
  const [editOpen, setEditOpen] = useState(false); // [sertifikat-edit-nama-v1]
  const col = colorOf(ct.language);
  const kind = productKindOf(ct.product);
  const isKids = kind === "kids";
  const showCefr = kind !== "kids";
  const cardRef = useRef<HTMLDivElement>(null);
  const raporRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  // [sertifikat-rapor-2hal-v1] slide 1 = sertifikat, slide 2 = rapor kelas yang sama;
  // "Unduh PDF" menjadikannya dua halaman.
  const [slide, setSlide] = useState<0 | 1>(0);
  const rapor = useRaporKelas(ct);
  useEffect(() => { setSlide(0); }, [ct.id]);
  const [verifyOpen, setVerifyOpen] = useState(false);
  // [sertifikat-qr-verifikasi-v1] TTD elektronik = QR ke halaman verifikasi publik
  // linguo.id/verifikasi/<id registrasi>. Data-URI (bukan gambar remote) supaya ikut
  // tertangkap html2canvas saat Unduh PDF. Sertifikat contoh (id bukan UUID) tanpa QR.
  const verifyUrl = ct.status === "issued" && /^[0-9a-f-]{36}$/i.test(ct.id) ? `https://linguo.id/verifikasi/${ct.id}` : null;
  // [sertifikat-ttd-rini-v1] tanda tangan Head of Curriculum (data-URI, ikut ke PDF)
  const ttdSrc = useTtdDataUrl();
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!verifyUrl) { setQrSrc(null); return; }
    let batal = false;
    QRCode.toDataURL(verifyUrl, { margin: 0, width: 192, errorCorrectionLevel: "M", color: { dark: "#12172B", light: "#FFFFFF" } })
      .then((u) => { if (!batal) setQrSrc(u); })
      .catch(() => { /* noop — jatuh ke segel */ });
    return () => { batal = true; };
  }, [verifyUrl]);

  const handleDownloadPdf = async () => {
    if (!cardRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      const denganRapor = !!(rapor && raporRef.current);
      const pdf = await buatPdf([
        { el: cardRef.current, attr: "data-course-certificate" },
        ...(denganRapor ? [{ el: raporRef.current!, attr: "data-rapor-paper" }] : []),
      ]);
      pdf.save(`${denganRapor ? "Sertifikat-Rapor" : "Sertifikat"}-Linguo-${ct.language}-${ct.level}${ct.idNo ? "-" + ct.idNo : ""}.pdf`);
    } catch (e) {
      console.error("[Sertifikat] gagal membuat PDF:", e);
      alert(t("Gagal membuat PDF. Coba lagi sebentar ya."));
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
      else { await navigator.clipboard.writeText(`${text} ${url}`); alert(t("Teks sertifikat disalin ke clipboard ✓")); }
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

  // [sertifikat-redesign-v2] Jam belajar + periode tak lagi jadi kolom statistik
  // terpisah — dirangkai ke kalimat utama ("... di Linguo, dengan total 8 jam belajar
  // (16 sesi × 30 menit) sejak 3 Jul 2026 hingga 24 Sep 2026.").
  // Bahasa pada lembar sertifikat selalu Inggris, terlepas dari bahasa dashboard.
  const from = fmtCertDate(ct.dateFrom, "en");
  const legacyDate = ct.date?.replace(/\b(Mei|Agu|Okt|Des)\b/g, (m) => ({ Mei: "May", Agu: "Aug", Okt: "Oct", Des: "Dec" }[m] || m));
  const to = fmtCertDate(ct.dateTo, "en") || fmtCertDate(legacyDate, "en");
  const hoursTxt = ct.hours != null && ct.hours > 0 ? `${fmtHours(ct.hours, "en")} ${ct.hours === 1 ? "hour" : "hours"} of study` : null;
  const sessTxt = ct.total && ct.minutesPerSession ? `${ct.total} ${ct.total === 1 ? "session" : "sessions"} × ${ct.minutesPerSession} minutes` : null;
  const programme = kind === "private" ? "private" : kind === "reguler" ? "group" : kind === "kids" ? "children's" : kind === "testprep" ? "test preparation" : kind === "b2b" ? "corporate" : "language";
  const levelTitle = ({ A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper Intermediate", C1: "Advanced", C2: "Proficient" } as Record<string, string>)[ct.level.split(".")[0].toUpperCase()] || tr(ct.title, "en");
  const ink = "#12172B";

  return (
    <>
      {/* [sertifikat-rapor-2hal-v1] Slide 1 sertifikat · slide 2 rapor. Keduanya ditumpuk
          di sel grid yang sama dan yang tak aktif cuma `visibility:hidden` — tetap ada di
          DOM berukuran asli supaya html2canvas bisa memotret dua-duanya untuk PDF. */}
      <SlideTabs slide={slide} onChange={setSlide} note={rapor ? t("PDF berisi 2 halaman: sertifikat + rapor") : null} />
      {/* Kolom minmax(0,1fr) + minWidth 0 wajib: tanpa itu kolom grid melebar ke lebar asli
          kertas (1120px) sehingga skala pratinjau tak pernah turun dan sertifikat meluber. */}
      <div className="mx-auto grid w-full max-w-[880px] grid-cols-[minmax(0,1fr)]">
      <div data-cert-slide style={{ gridArea: "1 / 1", minWidth: 0, visibility: slide === 0 ? "visible" : "hidden" }} aria-hidden={slide !== 0}>
      <CourseCertificatePaper
        ref={cardRef}
        code={flagCodeOf(ct.language)} language={ct.language}
        badge={<FlagBadge lang={ct.language} variant="chip" />}
        name={studentName}
        heading={isKids ? "ACHIEVEMENT" : "COMPLETION"}
        body={<>
          for successfully completing the {programme} {ct.language} programme at Linguo
          {ct.company ? <> for <b style={{ color: ink }}>{ct.company}</b></> : ""}
          {showCefr ? <> — <b style={{ color: ink, whiteSpace: "nowrap" }}>CEFR Level {ct.level}</b>{levelTitle ? ` (${levelTitle})` : ""}</> : ""}
          {hoursTxt ? <>, with a total of <b style={{ color: ink }}>{hoursTxt}</b>{sessTxt ? ` (${sessTxt})` : ""}</> : ""}
          {from && to && from !== to
            ? <> from <b style={{ color: ink, whiteSpace: "nowrap" }}>{from}</b> to <b style={{ color: ink, whiteSpace: "nowrap" }}>{to}</b></>
            : to ? <> on <b style={{ color: ink, whiteSpace: "nowrap" }}>{to}</b></> : ""}.
        </>}
        level={<>{showCefr ? `CEFR ${ct.level}` : "Young Explorer"}{ct.score != null ? ` · Final Score ${ct.score}/100` : ""}</>}
        qr={qrSrc}
        signature={ttdSrc || TTD_RINI.src}
        signer={{ name: TTD_RINI.nama, role: TTD_RINI.jabatan }}
        teacher={ct.teacher === "Pengajar Linguo" ? "Linguo Instructor" : ct.teacher}
        date={to || "—"}
        number={ct.idNo}
        labels={{ recipient: "This certificate is presented to", scan: "SCAN TO VERIFY", issued: "DATE OF ISSUE", teacher: "Instructor", number: "Certificate No." }}
      />
      </div>
      {rapor && (
        <div data-cert-slide style={{ gridArea: "1 / 1", minWidth: 0, visibility: slide === 1 ? "visible" : "hidden" }} aria-hidden={slide !== 1}>
          <RaporPaper
            ref={raporRef}
            report={rapor}
            name={studentName}
            language={ct.language}
            level={ct.level}
            programme={PROD_SHORT[kind] === "Reguler" ? "Group" : PROD_SHORT[kind]}
            teacher={ct.teacher === "Pengajar Linguo" ? "Linguo Instructor" : ct.teacher}
            number={ct.idNo}
            signature={ttdSrc || TTD_RINI.src}
            signer={{ name: TTD_RINI.nama, role: TTD_RINI.jabatan }}
            vocab={vocab}
          />
        </div>
      )}
      {!rapor && slide === 1 && (
        <div style={{ gridArea: "1 / 1", minWidth: 0 }}><RaporKosong /></div>
      )}
      </div>
      {showsSkills(kind) && slide === 0 && <SkillBlock ct={ct} accent={col.accent} />}
      {vocab && (
        <a href="/kosakata" className="flex items-center gap-3 rounded-2xl bg-[#1A9E9E]/8 px-4 py-3 ring-1 ring-[#1A9E9E]/25 transition hover:bg-[#1A9E9E]/12">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1A9E9E] text-white"><Award className="h-[18px] w-[18px]" /></span>
          <span className="min-w-0">
            <b className="block text-[14px] text-[#12172B]">{t("Menguasai")} {vocab.n.toLocaleString("id-ID")} {t("kosakata")} {vocab.level}</b>
            <span className="text-[12px] font-medium text-[#6B7280]">{t("Target kosakata level")} {vocab.level} ({vocab.target.toLocaleString("id-ID")} {t("kata")}) {t("tercapai — tercatat di Lingwords & rapor.")}</span>
          </span>
        </a>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#16796E] px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pdfLoading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Download className="h-[18px] w-[18px]" />}
          {pdfLoading ? t("Membuat PDF…") : t("Unduh PDF")}
        </button>
        <button onClick={handleShare} className="cert-btn-ghost inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><Share2 className="h-[18px] w-[18px]" />{t("Bagikan")}</button>
        <button onClick={handleLinkedIn} className="cert-btn-ghost inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><ExternalLink className="h-[18px] w-[18px]" />{t("Tambah ke LinkedIn")}</button>
        {onSaveName && (
          <button onClick={() => setEditOpen(true)} className="cert-btn-ghost inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><PenLine className="h-[18px] w-[18px]" />{t("Ubah nama")}</button>
        )}
        <button onClick={() => setVerifyOpen(true)} className="ml-auto inline-flex h-12 items-center gap-2 px-3 text-[13px] font-bold text-[#16796E] hover:underline"><ShieldCheck className="h-[18px] w-[18px]" />{t("Verifikasi keaslian")}</button>
      </div>

      {editOpen && onSaveName && (
        <EditNamaModal current={studentName} defaultName={defaultName} accent={col.accent} onSave={onSaveName} onClose={() => setEditOpen(false)} />
      )}

      {verifyOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setVerifyOpen(false)}>
          <div className="w-full max-w-[400px] overflow-hidden rounded-[24px] bg-white shadow-[0_40px_90px_-30px_rgba(18,23,43,.6)]" onClick={(e) => e.stopPropagation()}>
            <div className="relative flex flex-col items-center px-7 py-8 text-center text-white" style={{ background: col.accent }}>
              <button onClick={() => setVerifyOpen(false)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30" aria-label="Tutup"><X className="h-4 w-4" /></button>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20"><ShieldCheck className="h-7 w-7" /></span>
              <p className="mt-3 text-[16px] font-extrabold">{t("Sertifikat Terverifikasi")}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-white/90"><BadgeCheck className="h-4 w-4" />{t("Asli & diterbitkan oleh Linguo")}</p>
            </div>
            <div className="px-7 py-6">
              <dl className="space-y-3 text-[13px]">
                <div className="flex items-start justify-between gap-4"><dt className="font-medium text-[#6B7280]">{t("Diberikan kepada")}</dt><dd className="text-right font-extrabold text-[#12172B]">{studentName}</dd></div>
                <div className="flex items-start justify-between gap-4"><dt className="font-medium text-[#6B7280]">{t("Program")}</dt><dd className="text-right font-extrabold text-[#12172B]">{ct.language}{showCefr ? ` — CEFR ${ct.level}` : ""}</dd></div>
                <div className="flex items-start justify-between gap-4"><dt className="font-medium text-[#6B7280]">{t("Pengajar")}</dt><dd className="text-right font-extrabold text-[#12172B]">{ct.teacher}</dd></div>
                {ct.date && <div className="flex items-start justify-between gap-4"><dt className="font-medium text-[#6B7280]">{t("Tanggal terbit")}</dt><dd className="text-right font-extrabold text-[#12172B]">{ct.date}</dd></div>}
                {ct.idNo && <div className="flex items-start justify-between gap-4"><dt className="font-medium text-[#6B7280]">{t("No. Sertifikat")}</dt><dd className="text-right font-mono text-[12px] font-bold text-[#12172B]">{ct.idNo}</dd></div>}
              </dl>
              <p className="cert-tint mt-5 flex items-start gap-2 rounded-2xl bg-[#16796E0D] p-3 text-[11px] font-medium leading-relaxed text-[#6B7280]">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#16796E]" />
                {verifyUrl
                  ? <span>{t("Siapa pun bisa memastikan keaslian sertifikat ini dengan memindai QR di sertifikat atau membuka")} <a href={verifyUrl} target="_blank" rel="noopener" className="font-bold text-[#16796E] underline">{t("halaman verifikasi")}</a>.</span>
                  : t("Halaman verifikasi publik dengan QR code sedang disiapkan. Untuk konfirmasi keaslian, hubungi tim Linguo dengan menyebutkan No. Sertifikat di atas.")}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// [sertifikat-edit-nama-v1] Popup ubah nama yang tercetak di sertifikat.
function EditNamaModal({ current, defaultName, accent, onSave, onClose }: {
  current: string; defaultName?: string; accent: string;
  onSave: (name: string) => Promise<void>; onClose: () => void;
}) {
  const t = useT();
  const [val, setVal] = useState(current);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const bersih = val.trim().replace(/\s+/g, " ");
  const valid = bersih.length >= 2 && bersih.length <= 80;
  const simpan = async (nama: string) => {
    if (saving) return;
    setSaving(true); setErr("");
    try { await onSave(nama); onClose(); }
    catch (e) { console.error("[Sertifikat] gagal simpan nama:", e); setErr(t("Gagal menyimpan. Coba lagi ya.")); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="cert-card w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-[0_40px_90px_-30px_rgba(18,23,43,.6)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[16px] font-extrabold text-[#12172B]">{t("Ubah nama di sertifikat")}</p>
            <p className="mt-1 text-[12px] font-medium leading-relaxed text-[#6B7280]">{t("Tulis nama lengkap persis seperti yang ingin tercetak. Berlaku untuk semua sertifikatmu.")}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F6F8] text-[#6B7280] transition hover:bg-[#EAEDF0]" aria-label={t("Tutup")}><X className="h-4 w-4" /></button>
        </div>
        <input
          autoFocus
          value={val}
          maxLength={80}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && valid) void simpan(bersih); }}
          className="mt-4 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-bold text-[#12172B] outline-none transition focus:border-transparent focus:ring-2"
          style={{ ["--tw-ring-color" as string]: accent }}
          placeholder={t("Nama lengkap")}
        />
        {err && <p className="mt-2 text-[12px] font-semibold text-red-500">{err}</p>}
        <div className="mt-5 flex items-center gap-2">
          {defaultName && current !== defaultName && (
            <button onClick={() => void simpan("")} disabled={saving} className="text-[12px] font-bold text-[#6B7280] underline-offset-2 hover:underline disabled:opacity-50">{t("Pakai nama akun")}</button>
          )}
          <button onClick={onClose} className="cert-btn-ghost ml-auto inline-flex h-10 items-center rounded-xl bg-white px-4 text-[13px] font-bold text-[#12172B] transition hover:bg-slate-50">{t("Batal")}</button>
          <button
            onClick={() => void simpan(bersih)}
            disabled={!valid || saving || bersih === current}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#16796E] px-4 text-[13px] font-extrabold text-white transition hover:bg-[#0F5A52] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}{t("Simpan")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressDetail({ ct, studentName, onContinue, onSchedule }: { ct: Cert; studentName: string; onContinue?: () => void; onSchedule?: () => void }) {
  const t = useT(); // [ui-lang-switcher-v1]
  // [sertifikat-rapor-2hal-v3] kelas yang belum selesai juga punya tab Rapor — isinya
  // rapor terbit terbaru (tiap 4 sesi), bisa diunduh sendiri sebagai PDF 1 halaman.
  const [slide, setSlide] = useState<0 | 1>(0);
  useEffect(() => { setSlide(0); }, [ct.id]);
  const rapor = useRaporKelas(ct);
  const raporRef = useRef<HTMLDivElement>(null);
  const ttdSrc = useTtdDataUrl();
  const [pdfLoading, setPdfLoading] = useState(false);
  const unduhRapor = async () => {
    if (!raporRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      const pdf = await buatPdf([{ el: raporRef.current, attr: "data-rapor-paper" }]);
      pdf.save(`Rapor-Linguo-${ct.language}-${ct.level}.pdf`);
    } catch (e) {
      console.error("[Sertifikat] gagal membuat PDF rapor:", e);
      alert(t("Gagal membuat PDF. Coba lagi sebentar ya."));
    } finally {
      setPdfLoading(false);
    }
  };
  const col = colorOf(ct.language);
  const isDark = useIsDark();
  const photo = getLangPhoto(ct.language); // [sertifikat-banner-foto-v1]
  const total = ct.total ?? 16;
  const used = ct.used ?? 0;
  const pct = ct.pct ?? (total > 0 ? Math.round((used / total) * 100) : 0);
  const remain = Math.max(0, total - used);
  const kind = productKindOf(ct.product);
  if (slide === 1) {
    return (
      <>
        <SlideTabs slide={slide} onChange={setSlide} />
        {rapor ? (
          <>
            <div className="mx-auto w-full max-w-[880px]">
              <RaporPaper
                ref={raporRef}
                report={rapor}
                name={studentName}
                language={ct.language}
                level={ct.level}
                programme={PROD_SHORT[kind] === "Reguler" ? "Group" : PROD_SHORT[kind]}
                teacher={ct.teacher === "Pengajar Linguo" ? "Linguo Instructor" : ct.teacher}
                signature={ttdSrc || TTD_RINI.src}
                signer={{ name: TTD_RINI.nama, role: TTD_RINI.jabatan }}
              />
            </div>
            <div>
              <button
                onClick={unduhRapor}
                disabled={pdfLoading}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#16796E] px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pdfLoading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Download className="h-[18px] w-[18px]" />}
                {pdfLoading ? t("Membuat PDF…") : t("Unduh Rapor PDF")}
              </button>
            </div>
          </>
        ) : <RaporKosong />}
      </>
    );
  }
  return (
    <>
    <SlideTabs slide={slide} onChange={setSlide} />
    <div className="cert-card overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,.5)]">
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold"><Lock className="h-3 w-3" />{t("Belum Terbit")}</span>
          <h2 className="mt-2 text-[22px] font-extrabold leading-tight">{ct.language} — CEFR {ct.level}</h2>
          <p className="mt-1 text-[13px] font-medium text-white/85">{t(ct.title || "")} · {ct.company ? `${ct.company} · ` : ""}{ct.teacher}</p>
        </div>
        {/* Hiasan heksagon cuma dipakai kalau banner TIDAK punya foto — di atas foto
            dua bercak putih itu cuma bikin kotor. */}
        <div className={`pointer-events-none relative ml-2 hidden shrink-0 opacity-90 ${photo ? "" : "md:flex"}`}>
          <div className="h-14 w-14 rotate-6 bg-white/25" style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)", borderRadius: 8 }} />
          <div className="-ml-5 mt-4 h-16 w-16 bg-white/15" style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)", borderRadius: 8 }} />
        </div>
      </div>
      <div className="px-6 py-7 sm:px-8">
        <div className="flex items-center justify-between text-[13px] font-bold text-[#12172B]"><span>{t("Progress menuju sertifikat")}</span><span>{pct}%</span></div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#E8EAEE]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: isDark ? "#2DD4BF" : "#16796E" }} /></div>
        <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280]"><Flag className="h-4 w-4 text-[#16796E]" />{t("Tinggal")} <b className="text-[#12172B]">{remain} {t("sesi")}</b> {t("lagi")} ({used}/{total}) {t("untuk membuka sertifikat ini.")}</p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="cert-tile rounded-2xl bg-slate-50 p-4 text-center"><p className="text-[22px] font-extrabold text-[#12172B]">{used}/{total}</p><p className="mt-1 text-[12px] font-medium text-[#6B7280]">{t("Sesi Selesai")}</p></div>
          <div className="cert-tile rounded-2xl bg-slate-50 p-4 text-center"><p className="text-[22px] font-extrabold text-[#12172B]">{remain}</p><p className="mt-1 text-[12px] font-medium text-[#6B7280]">{t("Sesi Tersisa")}</p></div>
          <div className="cert-tile rounded-2xl bg-slate-50 p-4 text-center"><p className="text-[22px] font-extrabold text-[#12172B]">CEFR {ct.level}</p><p className="mt-1 text-[12px] font-medium text-[#6B7280]">{t("Target Level")}</p></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={onContinue} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#16796E] px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]"><Play className="h-[18px] w-[18px]" />{t("Lanjut Belajar")}</button>
          <button onClick={onSchedule} className="cert-btn-ghost inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><CalendarDays className="h-[18px] w-[18px]" />{t("Lihat Jadwal")}</button>
        </div>
      </div>
    </div>
    </>
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
  const t = useT(); // [ui-lang-switcher-v1]
  const VB_W = PAD_L * 2 + (totalSubs - 1) * STEP + COL_W;
  const ink = isDark ? "#E7E9EE" : "#12172B";
  const sub = isDark ? "#9BA3AF" : "#6B7280";
  // [sertifikat-hitam-v1] popup ikut palet hitam tab-nya (dulu #1F1F1F/#2A2A2A = abu)
  const card = isDark ? "#000000" : "#ffffff";
  const soft = isDark ? "#141414" : "#F5F6F8";
  const line = isDark ? "#242424" : "#E8EAEE";
  const teal = isDark ? "#2DD4BF" : "#16796E";

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("Tentang CEFR")}
    >
      <div
        className="max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-t-[26px] shadow-[0_40px_90px_-30px_rgba(0,0,0,.6)] sm:rounded-[26px]"
        style={{ background: card }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="relative px-6 py-7 text-white sm:px-8" style={{ background: isDark ? "linear-gradient(135deg,#0F5A52,#16796E)" : "linear-gradient(135deg,#16796E,#0F5A52)" }}>
          <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30" aria-label={t("Tutup")}><X className="h-4 w-4" /></button>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><GraduationCap className="h-6 w-6" /></span>
          <p className="mt-3 text-[18px] font-extrabold">{t("Tentang CEFR")}</p>
          <p className="mt-1 max-w-[46ch] text-[12.5px] font-medium leading-relaxed text-white/90">
            {t("CEFR (Common European Framework of Reference) adalah standar internasional untuk mengukur kemampuan berbahasa — dari A1 (pemula) sampai C2 (setara penutur asli). Linguo memakai standar yang sama, lalu memecah tiap level jadi sublevel 16 sesi.")}
          </p>
        </div>

        <div className="px-5 py-6 sm:px-8">
          {/* ringkasan angka */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { n: "A1–B2", l: t("Level tersedia") },
              { n: `${totalSubs}`, l: t("Sublevel") },
              { n: `${totalSesi}`, l: t("Total sesi") },
            ].map((k) => (
              <div key={k.l} className="rounded-2xl p-3 text-center" style={{ background: soft }}>
                <p className="text-[17px] font-extrabold" style={{ color: ink }}>{k.n}</p>
                <p className="mt-0.5 text-[11px] font-medium" style={{ color: sub }}>{k.l}</p>
              </div>
            ))}
          </div>

          {/* grafik tangga level */}
          <p className="mt-6 text-[13px] font-extrabold" style={{ color: ink }}>{t("Peta level di Linguo")}</p>
          <p className="mt-0.5 text-[12px] font-medium leading-relaxed" style={{ color: sub }}>
            {t("Tiap balok = 1 sublevel = 16 sesi. Semakin tinggi baloknya, semakin dalam materinya.")}
          </p>
          <div className="mt-3 overflow-x-auto">
            <svg viewBox={`0 0 ${VB_W} 246`} className="h-[246px] w-full min-w-[560px]" role="img" aria-label={t("Grafik level CEFR A1 sampai B2 beserta sublevelnya")}>
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
                    <text x={x} y={y + 1} textAnchor="middle" fontSize="10" fontWeight="800" fill={isDark ? "#0B0B0B" : "#ffffff"}>{t("Kamu di sini")}</text>
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
                    <text x={cx} y={BASE_Y + 26} textAnchor="middle" fontSize="13" fontWeight="800" fill={ink}>{lvl.code} · {t(lvl.name)}</text>
                    <text x={cx} y={BASE_Y + 41} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={sub}>{lvl.subs} {t("sublevel")} · {lvl.subs * SESI_PER_SUB} {t("sesi")}</text>
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
                    {t(lvl.name)} <span className="font-semibold" style={{ color: sub }}>· {lvl.code}.1–{lvl.code}.{lvl.subs}</span>
                  </span>
                  <span className="mt-0.5 block text-[12px] font-medium leading-relaxed" style={{ color: sub }}>{t(lvl.blurb)}</span>
                </span>
              </div>
            ))}
          </div>

          {/* catatan sertifikat */}
          <div className="cert-tint mt-5 flex items-start gap-2 rounded-2xl bg-[#16796E0D] p-4">
            <Award className="mt-0.5 h-4 w-4 shrink-0" style={{ color: teal }} />
            <p className="text-[12px] font-medium leading-relaxed" style={{ color: sub }}>
              <b style={{ color: ink }}>{t("Satu sublevel = satu sertifikat.")}</b> {t("Begitu 16 sesi di satu sublevel tuntas, sertifikatnya terbit otomatis di tab ini — misal selesai A1.1 langsung lanjut A1.2. Kalau evaluasi pengajar menyatakan kamu sudah mampu, sublevel boleh dilompati.")}
            </p>
          </div>

          <button onClick={onClose} className="mt-5 h-12 w-full rounded-2xl text-[14px] font-extrabold text-white transition hover:brightness-110" style={{ background: teal, color: isDark ? "#0B0B0B" : "#ffffff" }}>
            {t("Mengerti")}
          </button>
        </div>
      </div>
    </div>
  );
}
