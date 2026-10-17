"use client";

// [sertifikat-rapor-2hal-v1] Halaman 2 dokumen sertifikat: rapor resmi kelas yang sama.
// Ukurannya kembar dengan CourseCertificatePaper (1120×792, A4 landscape) supaya
// "Unduh PDF" bisa langsung jadi dua halaman: sertifikat lalu rapor. Semua gaya
// inline — aturan mode gelap shell bekerja lewat nama class Tailwind, dan kertas ini
// harus tetap putih karena difoto html2canvas.
// Isi rapor = class_reports TERBIT (rapor akhir kalau ada, kalau tidak yang terbaru).
// Bahasa kertas mengikuti sertifikat: Inggris; komentar pengajar apa adanya.

import { forwardRef, useEffect, useRef, useState } from "react";
import { COURSE_CERT_WIDTH, COURSE_CERT_HEIGHT } from "./CourseCertificatePaper";

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
  lulus: { teks: "Passed — ready for the next level", warna: "#16796E" },
  bersyarat: { teks: "Conditional pass — reinforcement recommended", warna: "#C2770C" },
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
};

const TEAL = "#16796E";
const INK = "#12172B";
const MUTED = "#606B80";

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
  const label: React.CSSProperties = { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 2.2, color: TEAL, textTransform: "uppercase" };

  return (
    <div ref={outer} style={{ width: "100%", maxWidth: COURSE_CERT_WIDTH, height: COURSE_CERT_HEIGHT * scale, overflow: "hidden", borderRadius: 8, boxShadow: "0 8px 36px #12172b12" }}>
      <div ref={ref} data-rapor-paper className="cert-paper" style={{ position: "relative", width: COURSE_CERT_WIDTH, height: COURSE_CERT_HEIGHT, transform: `scale(${scale})`, transformOrigin: "top left", overflow: "hidden", background: "#fff", color: INK, fontFamily: "'Inter', Arial, sans-serif" }}>
        {/* bingkai tipis + aksen atas */}
        <div style={{ position: "absolute", inset: 22, border: "1px solid #D9E6E3", borderRadius: 6 }} />
        <div style={{ position: "absolute", top: 22, left: 22, right: 22, height: 6, background: `linear-gradient(90deg, ${TEAL}, #2BA597 60%, #ef510b)`, borderRadius: "6px 6px 0 0" }} />

        {/* kepala */}
        <div style={{ position: "absolute", top: 54, left: 64, right: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src="/images/full-logo-linguo-hijau.png" alt="Linguo" style={{ height: 40, width: "auto" }} />
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 14, letterSpacing: 4, color: MUTED }}>STUDENT LEARNING REPORT</p>
            <p style={{ margin: "4px 0 0", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 26, fontWeight: 700 }}>{judulRapor(p.report.report_type)}</p>
          </div>
        </div>

        {/* identitas */}
        <div style={{ position: "absolute", top: 128, left: 64, right: 64, display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 18, padding: "16px 22px", background: "#F4FAF9", borderRadius: 12 }}>
          {[
            { k: "Student", v: p.name },
            { k: "Programme", v: `${p.language} — CEFR ${p.level}${p.programme ? ` · ${p.programme}` : ""}` },
            { k: "Instructor", v: p.teacher },
            { k: "Date of Report", v: tglEn(p.report.published_at) },
          ].map((x) => (
            <div key={x.k} style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: 1.8, color: MUTED, textTransform: "uppercase" }}>{x.k}</p>
              <p style={{ margin: "5px 0 0", fontSize: x.k === "Student" ? 19 : 15, fontWeight: 700, lineHeight: 1.25, overflowWrap: "anywhere" }}>{x.v}</p>
            </div>
          ))}
        </div>

        {/* isi: kiri nilai, kanan komentar */}
        <div style={{ position: "absolute", top: 232, left: 64, right: 64, bottom: 150, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
          <div style={{ minWidth: 0 }}>
            {rk && (
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 20px", border: "1px solid #CDEEE8", borderRadius: 12, marginBottom: 18 }}>
                <div style={{ textAlign: "center", minWidth: 96 }}>
                  <p style={{ margin: 0, fontSize: 46, fontWeight: 800, lineHeight: 1, color: TEAL }}>{rk.nilai_akhir}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 700 }}>{grade(rk.nilai_akhir).huruf} · {grade(rk.nilai_akhir).label}</p>
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.6, color: "#4B5568" }}>
                  <p style={{ ...label, fontSize: 11 }}>Final Score</p>
                  <p style={{ margin: "2px 0 0" }}>
                    Skills {rk.rata_skill} ({rk.bobot?.skill}%)
                    {rk.kuis ? ` · Quiz ${rk.kuis.rata} (${rk.bobot?.kuis}%)` : ""}
                    {rk.pr ? ` · Homework ${rk.pr.dikumpulkan}/${rk.pr.diberikan} (${rk.bobot?.pr}%)` : ""}
                    {rk.hadir ? ` · Attendance ${rk.hadir.persen} (${rk.bobot?.hadir}%)` : ""}
                  </p>
                  {status && <p style={{ margin: "4px 0 0", fontWeight: 700, color: status.warna }}>{status.teks}</p>}
                </div>
              </div>
            )}

            <p style={label}>Four-Skill Assessment{adaNilai ? " · Score 0–100" : " · CEFR"}</p>
            <div style={{ marginTop: 12 }}>
              {SKILLS.map(({ key, label: nama }) => {
                const v = Number(skills[key]?.score) || 0;
                const n = skills[key]?.nilai;
                const pct = adaNilai ? (Number.isFinite(n) ? Number(n) : 0) : (v / 5) * 100;
                const nilaiTeks = adaNilai
                  ? (Number.isFinite(n) ? `${n} · ${grade(Number(n)).huruf}${v ? ` · ${band(v)}` : ""}` : "—")
                  : (v ? band(v) : "—");
                const note = String(skills[key]?.note || "").trim();
                return (
                  <div key={key} style={{ marginBottom: rk ? 11 : 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ width: 86, fontSize: 14, fontWeight: 700 }}>{nama}</span>
                      <span style={{ flex: 1, height: 9, background: "#EEF1F4", borderRadius: 6, overflow: "hidden" }}>
                        <span style={{ display: "block", height: "100%", width: `${Math.max(0, Math.min(100, pct))}%`, background: TEAL, borderRadius: 6 }} />
                      </span>
                      <span style={{ width: 104, textAlign: "right", fontSize: 13, fontWeight: 800, color: TEAL }}>{nilaiTeks}</span>
                    </div>
                    {note && <p style={{ margin: "3px 0 0 98px", fontSize: 11, lineHeight: 1.35, color: MUTED, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{note}</p>}
                  </div>
                );
              })}
            </div>

            <p style={{ ...label, marginTop: rk ? 6 : 14 }}>Attendance</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 10 }}>
              {[
                { v: `${att.attended ?? "-"}/${att.total ?? "-"}`, l: "Attended" },
                { v: `${att.rate ?? "-"}%`, l: "Rate" },
                { v: att.hangus ?? 0, l: "Forfeited" },
                { v: att.cancelled ?? 0, l: "Cancelled" },
              ].map((x) => (
                <div key={x.l} style={{ textAlign: "center", padding: "9px 4px", background: "#FFF7EC", border: "1px solid #FFE1BF", borderRadius: 10 }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#DF4B09" }}>{x.v}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10.5, color: MUTED }}>{x.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ flex: saran ? 1.6 : 1, minHeight: 0, padding: "16px 20px", background: "#F7F9FA", borderLeft: `3px solid ${TEAL}`, borderRadius: "0 10px 10px 0", overflow: "hidden" }}>
              <p style={label}>Instructor&apos;s Comment</p>
              <p style={{ margin: "8px 0 0", fontSize: fs(komentar, 14.5, 420), lineHeight: 1.6, color: "#3A4357", whiteSpace: "pre-line" }}>{komentar || "—"}</p>
            </div>
            {saran && (
              <div style={{ flex: 1, minHeight: 0, padding: "16px 20px", background: "#FFF9F0", borderLeft: "3px solid #F5A623", borderRadius: "0 10px 10px 0", overflow: "hidden" }}>
                <p style={{ ...label, color: "#C2770C" }}>Recommendation</p>
                <p style={{ margin: "8px 0 0", fontSize: fs(saran, 14, 260), lineHeight: 1.6, color: "#3A4357", whiteSpace: "pre-line" }}>{saran}</p>
              </div>
            )}
          </div>
        </div>

        {/* kaki: tanda tangan + nomor */}
        <div style={{ position: "absolute", left: 64, right: 64, bottom: 44, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <img src={p.signature} alt={`${p.signer.name} — ${p.signer.role} signature`} style={{ display: "block", height: 58, width: 130, objectFit: "contain", objectPosition: "left center" }} />
            <p style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700 }}>{p.signer.name}</p>
            <p style={{ margin: "4px 0 0", paddingTop: 6, borderTop: "1px solid #B6C2D0", fontSize: 10.5, letterSpacing: 2, color: MUTED }}>{p.signer.role.toUpperCase()}</p>
          </div>
          <p style={{ margin: 0, fontSize: 11.5, letterSpacing: 1.2, color: MUTED, textAlign: "right" }}>
            {p.number ? <>Certificate No. · {p.number}<br /></> : null}
            Linguo — Online Language School · linguo.id
          </p>
        </div>
      </div>
    </div>
  );
});

export default RaporPaper;
