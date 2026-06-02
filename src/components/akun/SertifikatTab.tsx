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
  Sparkles, Star,
} from "lucide-react";

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

// ── Palet per-bahasa ──────────────────────────────────────────────────────
type Col = { accent: string; bg: string; text: string };
const PALETTE: Col[] = [
  { accent: "#16796E", bg: "#16796E1A", text: "#0F5A52" },
  { accent: "#E11D48", bg: "#FFF1F2", text: "#BE123C" },
  { accent: "#4F46E5", bg: "#EEF2FF", text: "#4338CA" },
  { accent: "#D97706", bg: "#FFFBEB", text: "#B45309" },
  { accent: "#0EA5E9", bg: "#F0F9FF", text: "#0369A1" },
  { accent: "#7C3AED", bg: "#F5F3FF", text: "#6D28D9" },
  { accent: "#059669", bg: "#ECFDF5", text: "#047857" },
  { accent: "#EA580C", bg: "#FFF7ED", text: "#C2410C" },
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

function FlagBadge({ lang, variant }: { lang: string; variant: "list" | "hero" | "chip" }) {
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
    return (
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15">
        {url
          ? <img src={url} alt={lang} className="h-9 w-14 rounded-md object-cover shadow" />
          : <span className="text-[34px] font-extrabold">{glyphOf(lang)}</span>}
      </span>
    );
  }
  // list (12x12)
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ background: col.bg }}>
      {url
        ? <img src={url} alt={lang} className="h-7 w-10 rounded-[4px] object-cover shadow-sm" />
        : <span className="text-xl font-extrabold" style={{ color: col.text }}>{glyphOf(lang)}</span>}
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
    <div className="mx-auto mt-8 w-full max-w-[480px] rounded-2xl border border-slate-100 bg-white/70 p-5">
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

  const [selectedId, setSelectedId] = useState<string>(list[0]?.id);
  const selected = list.find((c) => c.id === selectedId) || list[0];

  if (!selected) {
    return (
      <div className="w-full">
        <div className="rounded-[26px] border border-slate-100 bg-white p-12 text-center shadow-[0_24px_60px_-40px_rgba(18,23,43,.45)]">
          <Award className="mx-auto mb-3 h-10 w-10 text-slate-300" strokeWidth={1.6} />
          <p className="text-[15px] font-extrabold text-[#12172B]">Belum ada sertifikat</p>
          <p className="mt-1 text-[13px] text-[#6B7280]">Sertifikat terbit otomatis setelah kamu menuntaskan satu sublevel (16 sesi).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex min-w-0 flex-col-reverse overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-[0_24px_60px_-40px_rgba(18,23,43,0.45)] lg:flex-row">
        {/* LEFT: list */}
        <section className="flex w-full shrink-0 flex-col border-t border-slate-100 bg-white lg:w-[320px] lg:border-r lg:border-t-0">
          <div className="px-6 pb-3 pt-7">
            <h2 className="text-[18px] font-extrabold text-[#12172B]">Sertifikat</h2>
            <p className="mt-0.5 text-[12px] font-medium text-[#6B7280]">{issuedCount} terbit · {lockedCount} dalam proses</p>
          </div>
          <div className="flex max-h-[360px] flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-4 lg:max-h-none">
            {list.map((ct) => {
              const active = ct.id === selected.id;
              return (
                <button
                  key={ct.id}
                  onClick={() => setSelectedId(ct.id)}
                  className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-[#F5F6F8]"
                  style={active ? { background: "#fff", outline: "2px solid #16796E", boxShadow: "0 16px 36px -22px rgba(18,23,43,.55)" } : undefined}
                >
                  <FlagBadge lang={ct.language} variant="list" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-extrabold text-[#12172B]">{ct.language} — {ct.level}</span>
                    <span className="block truncate text-[12px] font-medium text-[#6B7280]">CEFR · {ct.title}</span>
                  </span>
                  {ct.status === "issued" ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" />Terbit</span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-[#6B7280]"><Lock className="h-3 w-3" />{ct.pct ?? 0}%</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100 px-6 py-4">
            <div className="rounded-2xl bg-[#16796E0D] p-4">
              <p className="flex items-center gap-2 text-[13px] font-extrabold text-[#12172B]"><Info className="h-4 w-4 text-[#16796E]" />Tentang CEFR</p>
              <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-[#6B7280]">Sertifikat terbit otomatis setelah kamu menuntaskan satu sublevel (16 sesi).</p>
            </div>
          </div>
        </section>

        {/* RIGHT: detail */}
        <main className="min-w-0 flex-1 bg-[#F5F6F8]">
          <div className="flex flex-col gap-6 p-6 lg:p-8">
            {selected.status === "issued"
              ? <IssuedDetail ct={selected} studentName={studentName} />
              : <ProgressDetail ct={selected} onContinue={onContinue} onSchedule={onSchedule} />}
          </div>
        </main>
      </div>
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
        className="relative overflow-hidden rounded-2xl bg-white"
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
        <button onClick={handleShare} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><Share2 className="h-[18px] w-[18px]" />Bagikan</button>
        <button onClick={handleLinkedIn} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><ExternalLink className="h-[18px] w-[18px]" />Tambah ke LinkedIn</button>
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
              <p className="mt-5 flex items-start gap-2 rounded-2xl bg-[#16796E0D] p-3 text-[11px] font-medium leading-relaxed text-[#6B7280]">
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
  const total = ct.total ?? 16;
  const used = ct.used ?? 0;
  const pct = ct.pct ?? (total > 0 ? Math.round((used / total) * 100) : 0);
  const remain = Math.max(0, total - used);
  return (
    <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,.5)]">
      <div className="relative flex items-center gap-5 px-6 py-7 text-white sm:px-8" style={{ background: col.accent }}>
        <FlagBadge lang={ct.language} variant="hero" />
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold"><Lock className="h-3 w-3" />Belum Terbit</span>
          <h2 className="mt-2 text-[22px] font-extrabold leading-tight">{ct.language} — CEFR {ct.level}</h2>
          <p className="mt-1 text-[13px] font-medium text-white/85">{ct.title} · {ct.teacher}</p>
        </div>
        <div className="pointer-events-none ml-2 hidden shrink-0 opacity-90 md:flex">
          <div className="h-14 w-14 rotate-6 bg-white/25" style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)", borderRadius: 8 }} />
          <div className="-ml-5 mt-4 h-16 w-16 bg-white/15" style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)", borderRadius: 8 }} />
        </div>
      </div>
      <div className="px-6 py-7 sm:px-8">
        <div className="flex items-center justify-between text-[13px] font-bold text-[#12172B]"><span>Progress menuju sertifikat</span><span>{pct}%</span></div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#E8EAEE]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#16796E" }} /></div>
        <p className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280]"><Flag className="h-4 w-4 text-[#16796E]" />Tinggal <b className="text-[#12172B]">{remain} sesi</b> lagi ({used}/{total}) untuk membuka sertifikat ini.</p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 p-4 text-center"><p className="text-[22px] font-extrabold text-[#12172B]">{used}/{total}</p><p className="mt-1 text-[12px] font-medium text-[#6B7280]">Sesi Selesai</p></div>
          <div className="rounded-2xl border border-slate-100 p-4 text-center"><p className="text-[22px] font-extrabold text-[#12172B]">{remain}</p><p className="mt-1 text-[12px] font-medium text-[#6B7280]">Sesi Tersisa</p></div>
          <div className="rounded-2xl border border-slate-100 p-4 text-center"><p className="text-[22px] font-extrabold text-[#12172B]">CEFR {ct.level}</p><p className="mt-1 text-[12px] font-medium text-[#6B7280]">Target Level</p></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={onContinue} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#16796E] px-6 text-[14px] font-extrabold text-white transition hover:bg-[#0F5A52]"><Play className="h-[18px] w-[18px]" />Lanjut Belajar</button>
          <button onClick={onSchedule} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-bold text-[#12172B] transition hover:bg-slate-50"><CalendarDays className="h-[18px] w-[18px]" />Lihat Jadwal</button>
        </div>
      </div>
    </div>
  );
}
