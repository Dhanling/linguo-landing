"use client";

// [sertifikat-rapor-2hal-v1] Halaman 2 dokumen sertifikat: rapor resmi kelas yang sama.
// Ukurannya kembar dengan CourseCertificatePaper (1120×792, A4 landscape) supaya
// "Unduh PDF" bisa langsung jadi dua halaman: sertifikat lalu rapor. Semua gaya
// inline — aturan mode gelap shell bekerja lewat nama class Tailwind, dan kertas ini
// harus tetap putih karena difoto html2canvas.
// Isi rapor = class_reports TERBIT (rapor akhir kalau ada, kalau tidak yang terbaru).
// Bahasa kertas mengikuti sertifikat: Inggris; komentar pengajar apa adanya.
// Tema brush dua warna mengikuti ilustrasi negara/budaya sertifikat.
// Nilai, komentar, kehadiran, tanda tangan, dan identitas tetap memakai data rapor asli.

import { forwardRef, useEffect, useRef, useState } from "react";
import { COURSE_CERT_WIDTH, COURSE_CERT_HEIGHT } from "./CourseCertificatePaper";
import CertWatermark from "./CertWatermark";
import { certificateCountryCode } from "@/lib/courseCertificateTheme";
import { reportIllustration } from "@/lib/reportImages";
import { Mic, Headphones, BookOpen, PenLine, MessageCircle, Target, CalendarDays } from "lucide-react";

export type RaporRow = {
  id: string;
  report_type: string;
  skills: any;
  attendance: any;
  teacher_comment?: string | null;
  recommendation?: string | null;
  published_at: string;
};

/** Rapor akhir menang; kalau belum ada, rapor terbit paling baru. */
export function pilihRapor(rows: RaporRow[] | null | undefined): RaporRow | null {
  const list = (rows || []).filter((r) => r && r.published_at);
  if (!list.length) return null;
  const urut = [...list].sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)));
  return urut.find((r) => r.report_type === "final") || urut[0];
}

const SKILLS = [
  { key: "speaking", label: "Speaking", Icon: Mic },
  { key: "listening", label: "Listening", Icon: Headphones },
  { key: "reading", label: "Reading", Icon: BookOpen },
  { key: "writing", label: "Writing", Icon: PenLine },
] as const;
const BAND = ["A1", "A2", "B1", "B2", "C1"];
const band = (v: number) => BAND[Math.min(5, Math.max(1, Math.round(v))) - 1];
function grade(n: number): { huruf: string; label: string } {
  if (n >= 85) return { huruf: "A", label: "Excellent" };
  if (n >= 70) return { huruf: "B", label: "Good" };
  if (n >= 55) return { huruf: "C", label: "Fair" };
  return { huruf: "D", label: "Needs Practice" };
}
const STATUS: Record<string, { teks: string; warna: string }> = {
  lulus: { teks: "Passed · ready for the next level", warna: "#16796E" },
  bersyarat: { teks: "Conditional pass · reinforcement recommended", warna: "#C2770C" },
  ulang: { teks: "Recommended to repeat this level", warna: "#C0392B" },
};
function judulRapor(type: string): string {
  const m = /^s(\d+)$/.exec(type || "");
  if (m) return `Session ${m[1]} Report`;
  return type === "final" ? "Final Report" : type === "mid" ? "Mid-term Report" : "Progress Report";
}
function tglEn(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).replace("Sept", "Sep");
}
const fs = (s: string, base: number, panjang: number) => (s.length > panjang * 2 ? base - 3 : s.length > panjang ? base - 1.5 : base);

// Sesuaikan ukuran paragraf dengan ruang cetak agar catatan panjang tetap terbaca.
function ReportParagraph({ text, size }: { text: string; size: number }) {
  const paragraph = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    let active = true;
    const fit = () => {
      const el = paragraph.current;
      if (!active || !el) return;
      let fontSize = size;
      el.style.fontSize = `${fontSize}px`;
      while (el.scrollHeight > el.clientHeight + 1 && fontSize > 9) {
        fontSize -= 0.25;
        el.style.fontSize = `${fontSize}px`;
      }
    };
    fit();
    void document.fonts.ready.then(fit);
    return () => { active = false; };
  }, [text, size]);
  return <p ref={paragraph} style={{ margin: "8px 0 0", flex: 1, minHeight: 0, fontSize: size, lineHeight: 1.4, color: BODY, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>{text}</p>;
}

type Props = {
  report: RaporRow;
  name: string;
  language: string;
  level: string;
  programme: string;
  teacher: string;
  number?: string | null;
  signature: string;
  signer: { name: string; role: string };
  /** [lingwords-v2] Tonggak kosakata Lingwords — hanya diisi kalau target level tercapai. */
  vocab?: { n: number; level: string; target: number } | null;
};

const TEAL = "#1A9E9E";
const INK = "#103F4B";
const SOFT = "#54858B";
const BODY = "#244E59";

const RaporPaper = forwardRef<HTMLDivElement, Props>(function RaporPaper(p, ref) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const read = () => setScale(Math.min(1, el.clientWidth / COURSE_CERT_WIDTH));
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const skills = (p.report.skills || {}) as Record<string, { score?: number; nilai?: number; note?: string }>;
  const rk = p.report.skills?.ringkasan && Number.isFinite(p.report.skills.ringkasan.nilai_akhir) ? p.report.skills.ringkasan : null;
  const adaNilai = SKILLS.some(({ key }) => Number.isFinite(skills[key]?.nilai));
  const att = p.report.attendance || {};
  const komentar = String(p.report.teacher_comment || "").trim();
  const saran = String(p.report.recommendation || "").trim();
  const status = rk?.status ? STATUS[rk.status] : null;
  const country = certificateCountryCode(p.language);
  const illustration = reportIllustration(p.language);
  const theme = illustration.theme;
  const reportId = `LR-${String(p.report.id || "").replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const label: React.CSSProperties = { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 1.8, color: TEAL, textTransform: "uppercase" };
  const kunci: React.CSSProperties = { margin: 0, fontSize: 11, letterSpacing: 1.6, color: SOFT, textTransform: "uppercase" };

  return (
    <div ref={outer} style={{ width: "100%", maxWidth: COURSE_CERT_WIDTH, height: COURSE_CERT_HEIGHT * scale, overflow: "hidden", borderRadius: 8, boxShadow: "0 8px 36px #12172b12" }}>
      <div ref={ref} data-rapor-paper data-theme={theme} className="cert-paper" style={{ position: "relative", width: COURSE_CERT_WIDTH, height: COURSE_CERT_HEIGHT, transform: `scale(${scale})`, transformOrigin: "top left", overflow: "hidden", background: "#fff9e8", color: INK, fontFamily: "Georgia, 'Times New Roman', serif" }}>
        {/* Ilustrasi landmark brush khusus setiap bahasa mengikuti pemetaan sertifikat. */}
        <img src="/images/reports/brush-v1/paper.webp" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        <img src={illustration.preview} data-certificate-print-src={illustration.print} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        <CertWatermark />

        {/* kepala */}
        <div style={{ position: "absolute", top: 40, left: 52, right: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src="/images/certificates/logo-v1.webp" data-certificate-print-src="/images/full-logo-linguo-hijau.png" alt="Linguo" style={{ height: 48, width: "auto" }} />
          <p style={{ margin: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 48, fontWeight: 700 }}>{judulRapor(p.report.report_type)}</p>
        </div>

        {/* identitas */}
        <div style={{ position: "absolute", top: 126, left: 60, right: 52, display: "grid", gridTemplateColumns: "1.25fr 1.2fr 1.3fr 0.7fr", gap: 16, paddingBottom: 10 }}>
          {[
            { k: "Student", v: p.name },
            { k: "Programme", v: `${p.language} ${p.level}${p.programme ? ` · ${p.programme}` : ""}` },
            { k: "Instructor", v: p.teacher },
            { k: "Date", v: tglEn(p.report.published_at) },
          ].map((x) => (
            <div key={x.k} style={{ minWidth: 0, paddingRight: 12, borderRight: x.k === "Date" ? "none" : "1px solid #F5A62366" }}>
              <p style={kunci}>{x.k}</p>
              <p style={{ margin: "6px 0 0", fontSize: fs(x.v, x.k === "Student" ? 19 : 18, 25), fontWeight: x.k === "Student" ? 700 : 600, lineHeight: 1.25, overflowWrap: "anywhere" }}>{x.k === "Programme" && country && <img src={`/images/certificates/flags-v1/${country}.png`} alt="" style={{ width: 28, height: 19, objectFit: "cover", verticalAlign: "middle", marginRight: 8 }} />}{x.v}</p>
            </div>
          ))}
        </div>

        {/* isi: kiri nilai, kanan komentar */}
        <div style={{ position: "absolute", top: 192, left: 30, right: 30, bottom: 140, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={{ minWidth: 0, padding: "16px 18px", border: "11px solid #1A9E9E10", borderRadius: 26, background: "#FFFCF3F2" }}>
            {rk && (
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 2 }}>
                <span style={{ position: "relative", isolation: "isolate", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: p.vocab ? 110 : 140, height: p.vocab ? 100 : 140, fontSize: p.vocab ? 68 : 84, fontWeight: 800, lineHeight: 1, color: TEAL, fontFamily: "Georgia, serif" }}><img src="/images/reports/brush-v1/score.webp" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: -1 }} />{rk.nilai_akhir}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 27, fontWeight: 700, fontFamily: "Georgia, serif" }}>{grade(rk.nilai_akhir).label}</p>
                  {status && <p style={{ margin: "4px 0 0", fontSize: 13, color: status.warna }}>{status.teks}</p>}
                </div>
              </div>
            )}
            <div style={{ padding: "12px 14px", borderRadius: 20, background: "#FFFCF3F5", border: "1px solid #F5A62313" }}>
            <p style={{ ...label, marginBottom: 14 }}>Skills{adaNilai ? "" : " · CEFR"}</p>
            {SKILLS.map(({ key, label: nama, Icon }) => {
              const v = Number(skills[key]?.score) || 0;
              const n = skills[key]?.nilai;
              const pct = adaNilai ? (Number.isFinite(n) ? Number(n) : 0) : (v / 5) * 100;
              const teks = adaNilai ? (Number.isFinite(n) ? String(n) : "—") : (v ? band(v) : "—");
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7, paddingBottom: 6, borderBottom: "1px solid #F5A62322" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 12, width: 132, fontSize: 15 }}><span style={{ display: "flex", padding: 8, borderRadius: "50%", background: "#F5A62320", color: TEAL }}><Icon size={19} /></span>{nama}</span>
                  <span style={{ flex: 1, height: 12, background: "#1A9E9E12", borderRadius: 4, overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${Math.max(0, Math.min(100, pct))}%`, background: TEAL, borderRadius: 4 }} />
                  </span>
                  <span style={{ width: 36, textAlign: "right", fontSize: 15, fontWeight: 700 }}>{teks}</span>
                </div>
              );
            })}
            <p style={{ margin: "12px 0 0", fontSize: 14, color: BODY }}>
              <CalendarDays size={18} style={{ verticalAlign: "middle", color: TEAL, marginRight: 10 }} />Attendance <b>{att.attended ?? "-"}/{att.total ?? "-"} sessions</b>{att.rate != null ? ` (${att.rate}%)` : ""}
            </p>
            {p.vocab && (
              <p style={{ margin: "8px 0 0", fontSize: 14, color: BODY }}>
                Vocabulary <b>mastered {p.vocab.n.toLocaleString("en-US")} words</b> (CEFR {p.vocab.level} target {p.vocab.target.toLocaleString("en-US")})
              </p>
            )}
            </div>
          </div>

          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 10, marginBottom: 54 }}>
            <div style={{ padding: "15px 20px", border: "11px solid #1A9E9E10", borderRadius: 26, background: "#FFFCF3F5", display: "flex", flexDirection: "column", flex: saran ? "1.5" : "1", minHeight: 0, overflow: "hidden" }}>
              <p style={{ ...label, display: "flex", alignItems: "center", gap: 14 }}><span style={{ display: "inline-flex", padding: 10, borderRadius: "50%", background: "#F5A62320" }}><MessageCircle size={25} fill={TEAL} color={TEAL} /></span>Instructor&apos;s Comment</p>
              <ReportParagraph text={komentar || "—"} size={fs(komentar, 16, 350)} />
            </div>
            {saran && (
              <div style={{ padding: "10px 20px", border: "11px solid #1A9E9E10", borderRadius: 26, background: "#FFFCF3F5", display: "flex", flexDirection: "column", flex: "1", minHeight: 0, overflow: "hidden" }}>
                <p style={{ ...label, display: "flex", alignItems: "center", gap: 14 }}><span style={{ display: "inline-flex", padding: 10, borderRadius: "50%", background: "#F5A62320" }}><Target size={25} /></span>Next Step</p>
                <ReportParagraph text={saran} size={fs(saran, 16, 220)} />
              </div>
            )}
          </div>
        </div>

        {/* kaki: tanda tangan + nomor */}
        <div style={{ position: "absolute", left: 120, right: 40, bottom: 26, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ background: "#FFFCF3E8", padding: "4px 16px", borderRadius: 12 }}>
            <img src={p.signature} alt={`${p.signer.name} — ${p.signer.role} signature`} style={{ display: "block", height: 64, width: 120, objectFit: "contain", objectPosition: "left bottom" }} />
            <p style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700 }}>{p.signer.name}</p>
            <p style={{ margin: "3px 0 0", paddingTop: 5, borderTop: "1px solid #D5DCE3", fontSize: 10, letterSpacing: 1.8, color: SOFT }}>{p.signer.role.toUpperCase()}</p>
          </div>
          <p style={{ margin: 0, fontSize: 11, lineHeight: 1.7, letterSpacing: 0.5, color: SOFT, textAlign: "right", padding: "7px 10px", background: "#FFFCF3E8", borderRadius: 8 }}>
            Report ID · {reportId}{p.number ? <> · Certificate No. · {p.number}</> : null}<br />
            © PT. Linguo Edu Indonesia · linguo.id
          </p>
        </div>
      </div>
    </div>
  );
});

export default RaporPaper;
