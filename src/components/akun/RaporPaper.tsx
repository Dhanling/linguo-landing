"use client";

// [sertifikat-rapor-2hal-v1] Halaman 2 dokumen sertifikat: rapor resmi kelas yang sama.
// Ukurannya kembar dengan CourseCertificatePaper (1120×792, A4 landscape) supaya
// "Unduh PDF" bisa langsung jadi dua halaman: sertifikat lalu rapor. Semua gaya
// inline — aturan mode gelap shell bekerja lewat nama class Tailwind, dan kertas ini
// harus tetap putih karena difoto html2canvas.
// Isi rapor = class_reports TERBIT (rapor akhir kalau ada, kalau tidak yang terbaru).
// Bahasa kertas mengikuti sertifikat: Inggris; komentar pengajar apa adanya.
// [rapor-simpel-v1] Tata letak dirampingkan (tanpa kotak warna, catatan per skill, rincian
// bobot & 4 kotak kehadiran) + tanda air [sertifikat-watermark-v1] + Report ID untuk dicocokkan.

import { forwardRef, useEffect, useRef, useState } from "react";
import { COURSE_CERT_WIDTH, COURSE_CERT_HEIGHT } from "./CourseCertificatePaper";
import CertWatermark from "./CertWatermark";

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
  { key: "speaking", label: "Speaking" },
  { key: "listening", label: "Listening" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
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

const TEAL = "#16796E";
const INK = "#12172B";
const SOFT = "#8A93A5";
const BODY = "#3A4357";

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
  const reportId = `LR-${String(p.report.id || "").replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const label: React.CSSProperties = { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 1.8, color: TEAL, textTransform: "uppercase" };
  const kunci: React.CSSProperties = { margin: 0, fontSize: 11, letterSpacing: 1.6, color: SOFT, textTransform: "uppercase" };

  return (
    <div ref={outer} style={{ width: "100%", maxWidth: COURSE_CERT_WIDTH, height: COURSE_CERT_HEIGHT * scale, overflow: "hidden", borderRadius: 8, boxShadow: "0 8px 36px #12172b12" }}>
      <div ref={ref} data-rapor-paper className="cert-paper" style={{ position: "relative", width: COURSE_CERT_WIDTH, height: COURSE_CERT_HEIGHT, transform: `scale(${scale})`, transformOrigin: "top left", overflow: "hidden", background: "#fff", color: INK, fontFamily: "'Inter', Arial, sans-serif" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: TEAL }} />
        <CertWatermark />

        {/* kepala */}
        <div style={{ position: "absolute", top: 64, left: 80, right: 80, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src="/images/certificates/logo-v1.webp" data-certificate-print-src="/images/full-logo-linguo-hijau.png" alt="Linguo" style={{ height: 34, width: "auto" }} />
          <p style={{ margin: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 24, fontWeight: 700 }}>{judulRapor(p.report.report_type)}</p>
        </div>

        {/* identitas */}
        <div style={{ position: "absolute", top: 138, left: 80, right: 80, display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 0.7fr", gap: 24, paddingBottom: 26, borderBottom: "1px solid #E6EAEE" }}>
          {[
            { k: "Student", v: p.name },
            { k: "Programme", v: `${p.language} ${p.level}${p.programme ? ` · ${p.programme}` : ""}` },
            { k: "Instructor", v: p.teacher },
            { k: "Date", v: tglEn(p.report.published_at) },
          ].map((x) => (
            <div key={x.k} style={{ minWidth: 0 }}>
              <p style={kunci}>{x.k}</p>
              <p style={{ margin: "6px 0 0", fontSize: x.k === "Student" ? 20 : 16, fontWeight: x.k === "Student" ? 700 : 600, lineHeight: 1.25, overflowWrap: "anywhere" }}>{x.v}</p>
            </div>
          ))}
        </div>

        {/* isi: kiri nilai, kanan komentar */}
        <div style={{ position: "absolute", top: 248, left: 80, right: 80, bottom: 150, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72 }}>
          <div style={{ minWidth: 0 }}>
            {rk && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 28 }}>
                <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, color: TEAL }}>{rk.nilai_akhir}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{grade(rk.nilai_akhir).label}</p>
                  {status && <p style={{ margin: "4px 0 0", fontSize: 13, color: status.warna }}>{status.teks}</p>}
                </div>
              </div>
            )}
            <p style={{ ...label, marginBottom: 14 }}>Skills{adaNilai ? "" : " · CEFR"}</p>
            {SKILLS.map(({ key, label: nama }) => {
              const v = Number(skills[key]?.score) || 0;
              const n = skills[key]?.nilai;
              const pct = adaNilai ? (Number.isFinite(n) ? Number(n) : 0) : (v / 5) * 100;
              const teks = adaNilai ? (Number.isFinite(n) ? String(n) : "—") : (v ? band(v) : "—");
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                  <span style={{ width: 90, fontSize: 15 }}>{nama}</span>
                  <span style={{ flex: 1, height: 6, background: "#EEF1F4", borderRadius: 4, overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${Math.max(0, Math.min(100, pct))}%`, background: TEAL, borderRadius: 4 }} />
                  </span>
                  <span style={{ width: 36, textAlign: "right", fontSize: 15, fontWeight: 700 }}>{teks}</span>
                </div>
              );
            })}
            <p style={{ margin: "20px 0 0", fontSize: 14, color: BODY }}>
              Attendance <b>{att.attended ?? "-"}/{att.total ?? "-"} sessions</b>{att.rate != null ? ` (${att.rate}%)` : ""}
            </p>
            {p.vocab && (
              <p style={{ margin: "8px 0 0", fontSize: 14, color: BODY }}>
                Vocabulary <b>mastered {p.vocab.n.toLocaleString("en-US")} words</b> (CEFR {p.vocab.level} target {p.vocab.target.toLocaleString("en-US")})
              </p>
            )}
          </div>

          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <p style={label}>Instructor&apos;s Comment</p>
            <p style={{ margin: "12px 0 0", fontSize: fs(komentar, 14, 420), lineHeight: 1.65, color: BODY, whiteSpace: "pre-line" }}>{komentar || "—"}</p>
            {saran && (
              <>
                <p style={{ ...label, marginTop: 26 }}>Next Step</p>
                <p style={{ margin: "12px 0 0", fontSize: fs(saran, 14, 260), lineHeight: 1.65, color: BODY, whiteSpace: "pre-line" }}>{saran}</p>
              </>
            )}
          </div>
        </div>

        {/* kaki: tanda tangan + nomor */}
        <div style={{ position: "absolute", left: 80, right: 80, bottom: 44, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <img src={p.signature} alt={`${p.signer.name} — ${p.signer.role} signature`} style={{ display: "block", height: 64, width: 120, objectFit: "contain", objectPosition: "left bottom" }} />
            <p style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700 }}>{p.signer.name}</p>
            <p style={{ margin: "3px 0 0", paddingTop: 5, borderTop: "1px solid #D5DCE3", fontSize: 10, letterSpacing: 1.8, color: SOFT }}>{p.signer.role.toUpperCase()}</p>
          </div>
          <p style={{ margin: 0, fontSize: 11, lineHeight: 1.7, letterSpacing: 0.5, color: SOFT, textAlign: "right" }}>
            Report ID · {reportId}{p.number ? <> · Certificate No. · {p.number}</> : null}<br />
            © PT. Linguo Edu Indonesia · linguo.id
          </p>
        </div>
      </div>
    </div>
  );
});

export default RaporPaper;
