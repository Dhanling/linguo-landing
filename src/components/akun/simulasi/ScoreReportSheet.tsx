"use client";

// [sim-score-report-v1] LEMBAR "Laporan Skor Peserta" — versi POTRET (A4 portrait)
// dari hasil simulasi, tata letaknya meniru format laporan skor tes internasional
// yang sudah dikenal siswa: kop berwarna, blok identitas + foto/inisial, kisi data
// tes, panel skor total dengan cincin + kotak nilai per seksi, panel nilai
// tertinggi lintas pengerjaan, blok identifikasi, lalu catatan kaki.
//
// Bedanya dengan CertificateSheet (A4 landscape): sertifikat itu lembar apresiasi
// ("Dengan bangga diberikan kepada…"), sedangkan lembar ini DOKUMEN DATA — dibaca
// orang tua/kampus/sponsor yang ingin melihat rincian angka, bukan hiasan.
//
// PENTING: ini laporan hasil SIMULASI terbitan Linguo. Tidak memakai lambang,
// nama dagang, atau kop lembaga tes mana pun, dan kalimat penyangkalan wajib ikut
// tercetak (lihat .rpt-legal di bawah) supaya tak pernah dikira skor resmi.
//
// Ukurannya piksel-pasti: 794×1123 px CSS = 210×297 mm @96dpi = A4 potret, jadi
// dialog cetak browser menghasilkan PDF satu halaman penuh tanpa pustaka PDF.
import type { BestScores, OfficialScore } from "@/lib/simScore";
import { officialBody } from "@/lib/simCertificate";
import {
  BookOpen, Headphones, Mic, PenLine, SpellCheck, ClipboardCheck, type LucideIcon,
} from "lucide-react";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";
const AMBER_LINE = "#E3C173";

export const RPT_W = 794;
export const RPT_H = 1123;

export interface ScoreReportData {
  name: string;
  email: string | null;
  title: string;
  testLabel: string;
  official: OfficialScore;
  /** Nilai tertinggi tiap seksi dari SEMUA pengerjaan pada skala yang sama. */
  best: BestScores | null;
  submittedAt: string | null;
  startedAt: string | null;
  rawScore: number;
  rawMax: number;
  correct: number;
  objective: number;
  reportNo: string;
  /** ID peserta yang disamarkan — cukup untuk mencocokkan, tak membocorkan UUID. */
  participantId: string;
}

const fmtTanggal = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "—";

const fmtTanggalPendek = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

// Label seksi resmi bisa panjang ("Section 1 — Listening Comprehension"); di kotak
// nilai yang sempit cuma dipakai nama seksinya.
const shortLabel = (label: string) => label.replace(/^Section\s*\d+\s*[—–-]\s*/, "");

const ICON_BY_KEY: Record<string, LucideIcon> = {
  reading: BookOpen, dokkai: BookOpen,
  listening: Headphones, choukai: Headphones,
  writing: PenLine,
  speaking: Mic,
  structure: SpellCheck, goi: SpellCheck,
};
const iconOf = (key: string) => ICON_BY_KEY[key.replace(/^info-/, "")] ?? ClipboardCheck;

/** Cincin skor total — 3/4 lingkaran, terisi sesuai posisi skor di rentang skala. */
function ScoreRing({ fraction, headline, unit }: { fraction: number; headline: string; unit: string }) {
  const R = 34;
  const C = 2 * Math.PI * R;
  const ARC = 0.75; // 270°
  return (
    <div className="rpt-ring">
      <svg width="94" height="94" viewBox="0 0 94 94">
        <g transform="rotate(135 47 47)">
          <circle
            cx="47" cy="47" r={R} fill="none" stroke="#E4EDEC" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${ARC * C} ${C}`}
          />
          <circle
            cx="47" cy="47" r={R} fill="none" stroke={TEAL} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${Math.max(0.001, fraction) * ARC * C} ${C}`}
          />
        </g>
      </svg>
      <div className="rpt-ring-text">
        <b>{headline}</b>
        <span>{unit.startsWith("/") ? unit.slice(1) : unit}</span>
      </div>
    </div>
  );
}

export default function ScoreReportSheet({ data, scale = 1 }: { data: ScoreReportData; scale?: number }) {
  const o = data.official;
  // Seksi resmi ujian (yang informational — mis. Writing di TOEFL ITP — dipisah
  // ke baris catatan sendiri supaya kotak nilai tetap sebaris dengan skala resmi).
  const officialSections = o.skills.filter((s) => !s.informational);
  const extraSections = o.skills.filter((s) => s.informational);
  const initials = data.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const unitTotal = o.unit.startsWith("/") ? o.unit.slice(1) : o.max;

  return (
    <div
      className="rpt-scale"
      style={{ transform: `scale(${scale})`, width: RPT_W * scale, height: RPT_H * scale }}
    >
      <div className="rpt-sheet">
        {/* ── Kop ── */}
        <div className="rpt-head">
          <div className="rpt-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/FULL_LOGO_LINGUO_HIJAU.png" alt="Linguo" className="rpt-logo" />
            <span className="rpt-brand-div" />
            <span className="rpt-brand-test">{o.scaleLabel}</span>
          </div>
          <p className="rpt-head-title">Laporan Skor Peserta</p>
        </div>

        <div className="rpt-body">
          {/* ── Identitas ── */}
          <div className="rpt-ident">
            <div className="rpt-ident-main">
              <p className="rpt-name">{data.name}</p>
              <p className="rpt-name-cap">Nama Lengkap Peserta / Test Taker Name</p>
              <p className="rpt-field"><b>Email:</b> <span>{data.email || "—"}</span></p>
              <div className="rpt-simbox">
                <span>Simulasi yang dikerjakan</span>
                <b>{data.title}</b>
                <i>{data.testLabel}</i>
              </div>
            </div>

            <div className="rpt-ident-side">
              <div className="rpt-photo">{initials || "L"}</div>
              <div className="rpt-codes">
                <div><span>Nomor Laporan</span><b>{data.reportNo.slice(-6)}</b></div>
                <div><span>Kode Peserta</span><b>{data.participantId.slice(-4)}</b></div>
              </div>
            </div>
          </div>

          {/* ── Kisi data tes ── */}
          <div className="rpt-meta">
            <p><b>Tanggal Tes:</b> {fmtTanggal(data.submittedAt)}</p>
            <p><b>Skala Penilaian:</b> {o.scaleLabel} ({o.rangeLabel.replace("Skala ", "")})</p>
            <p><b>Nomor Laporan:</b> {data.reportNo}</p>
            <p><b>Bahasa Ibu:</b> Indonesia</p>
            <p><b>Penyelenggara:</b> Linguo Language School</p>
            <p><b>Metode:</b> Simulasi daring (online)</p>
            <p><b>Negara Penyelenggara:</b> Indonesia</p>
            <p><b>Jenis Laporan:</b> Perkiraan skor (simulasi)</p>
          </div>

          {/* ── Panel skor ── */}
          <div className="rpt-panel">
            <p className="rpt-panel-date"><b>Tanggal Tes:</b> {fmtTanggal(data.submittedAt)}</p>
            <div className="rpt-scores">
              <div className="rpt-total">
                <p className="rpt-total-label">Skor Total</p>
                <ScoreRing fraction={o.fraction} headline={o.headline} unit={o.unit} />
                <p className="rpt-total-sub">dari {unitTotal}</p>
              </div>

              <div className="rpt-sections">
                {officialSections.map((s) => {
                  const Icon = iconOf(s.key);
                  const absent = s.value == null;
                  return (
                    <div key={s.key} className={`rpt-sec${absent ? " is-absent" : ""}`}>
                      <p className="rpt-sec-name"><Icon className="rpt-sec-icon" />{shortLabel(s.label)}</p>
                      <p className="rpt-sec-value">{absent ? "—" : s.display}</p>
                      <p className="rpt-sec-max">{absent ? "tidak diujikan" : `dari ${s.max}`}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rincian jawaban — dasar angka di atas, biar laporannya bisa diaudit. */}
            <p className="rpt-panel-note">
              {data.objective > 0
                ? `${data.correct} dari ${data.objective} soal objektif dijawab benar`
                : `Skor mentah ${Math.round(data.rawScore)}/${Math.round(data.rawMax)} poin`}
              {extraSections.length > 0 && (
                <> · di luar skala resmi: {extraSections.map((s) => `${s.label} ${s.display}`).join(" · ")}</>
              )}
              {o.verdict && <> · <b>{o.verdict}</b></>}
            </p>
          </div>

          {/* ── Nilai tertinggi lintas pengerjaan ── */}
          {data.best && (
            <div className="rpt-best">
              <p className="rpt-best-head">
                <b>Skor Terbaik</b>
                <span>
                  Nilai tertinggi tiap seksi dari {data.best.attempts} pengerjaan,
                  per {fmtTanggalPendek(data.best.asOf)}
                </span>
              </p>
              <div className="rpt-best-row">
                <div className="rpt-best-sum">
                  <span>Gabungan Nilai Tertinggi</span>
                  <b>{data.best.headline}</b>
                  <i>dari {unitTotal}</i>
                </div>
                <div className="rpt-best-cells">
                  {data.best.sections.map((s) => (
                    <div key={s.key} className={`rpt-best-cell${s.value == null ? " is-absent" : ""}`}>
                      <p className="rpt-best-label">{shortLabel(s.label)}</p>
                      <p className="rpt-best-value">{s.display}</p>
                      <p className="rpt-best-date">
                        {s.value == null ? "belum diujikan" : `Tes ${fmtTanggalPendek(s.testDate)}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Rincian pengerjaan ── dasar angka di panel skor, supaya pembaca
              laporan bisa menelusuri dari mana nilai tiap seksi berasal. */}
          <div className="rpt-detail">
            <p className="rpt-detail-title">RINCIAN PENGERJAAN</p>
            <table className="rpt-table">
              <thead>
                <tr>
                  <th>Seksi</th>
                  <th className="rpt-td-num">Nilai</th>
                  <th>Dasar penilaian</th>
                  <th className="rpt-td-bar">Ketercapaian</th>
                </tr>
              </thead>
              <tbody>
                {o.skills.map((s) => {
                  const absent = s.value == null && !s.informational;
                  return (
                    <tr key={s.key} className={absent ? "is-absent" : undefined}>
                      <td>{s.label}</td>
                      <td className="rpt-td-num">
                        {absent ? "—" : s.display}
                        {s.value != null && !s.informational && <i> / {s.max}</i>}
                      </td>
                      <td className="rpt-td-detail">
                        {absent ? "tidak termasuk paket simulasi ini" : s.detail}
                        {s.informational && " · di luar skala resmi"}
                      </td>
                      <td className="rpt-td-bar">
                        <span className="rpt-bar">
                          <span style={{ width: absent ? 0 : `${Math.round(s.fraction * 100)}%` }} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Identifikasi & catatan ── */}
          <div className="rpt-ver">
            <div className="rpt-ver-left">
              <p className="rpt-ver-title">IDENTIFIKASI LAPORAN</p>
              <p><b>Nomor Laporan:</b> {data.reportNo}</p>
              <p><b>Kode Peserta:</b> {data.participantId}</p>
              <p><b>Diterbitkan oleh:</b> Linguo Language School · linguo.id</p>
            </div>
            <div className="rpt-ver-right">
              <p>
                {o.partial
                  ? "Sebagian seksi resmi tidak termasuk dalam paket simulasi yang dikerjakan; skor total diperkirakan proporsional dari seksi yang diujikan saja. "
                  : ""}
                {o.estimateOnly
                  ? "Rincian per seksi tak tersedia pada pengerjaan ini, sehingga nilai seksi diperkirakan dari total poin. "
                  : ""}
                {o.note}
              </p>
              <p className="rpt-ver-check">
                Keaslian laporan dapat dicek pada akun linguo.id pemiliknya memakai nomor di samping.
              </p>
            </div>
          </div>

          {/* ── Kaki ── */}
          <div className="rpt-foot">
            <p className="rpt-legal">
              LAPORAN INI MEMUAT HASIL <b>SIMULASI</b> YANG DISELENGGARAKAN LINGUO — BUKAN SKOR RESMI
              DAN TIDAK DITERBITKAN OLEH {officialBody(o.scale).toUpperCase()}.
            </p>
            <div className="rpt-foot-line">
              <span>© {new Date().getFullYear()} Linguo Language School · linguo.id</span>
              <span>Halaman 1 dari 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// CSS lembar + aturan cetak — satu blok (bukan Tailwind) karena ukurannya harus
// piksel-pasti agar cocok A4 potret dan @media print-nya duduk berdampingan.
export const RPT_CSS = `
.rpt-scale { margin: 0 auto; transform-origin: top left; }
.rpt-sheet {
  box-sizing: border-box; width: ${RPT_W}px; height: ${RPT_H}px; background: #fff;
  position: relative; overflow: hidden; border: 1px solid #e4edec;
  box-shadow: 0 20px 50px rgba(15,23,42,.14);
  font-family: var(--font-sans), system-ui, sans-serif; color: #16202e;
  -webkit-font-smoothing: antialiased;
}

/* Kop */
.rpt-head {
  height: 78px; background: ${TEAL}; display: flex; align-items: center;
  justify-content: space-between; padding: 0 34px;
}
.rpt-brand { display: flex; align-items: center; gap: 14px; }
.rpt-logo { height: 26px; width: auto; background: #fff; border-radius: 7px; padding: 5px 10px; display: block; }
.rpt-brand-div { width: 1px; height: 26px; background: rgba(255,255,255,.45); }
.rpt-brand-test { font-size: 15px; font-weight: 700; letter-spacing: .3px; color: #fff; }
.rpt-head-title { margin: 0; font-size: 14.5px; font-weight: 700; color: #fff; letter-spacing: .2px; }

.rpt-body { display: flex; flex-direction: column; height: ${RPT_H - 78}px; padding: 26px 34px 22px; }

/* Identitas */
.rpt-ident { display: flex; gap: 24px; align-items: flex-start; }
.rpt-ident-main { flex: 1; min-width: 0; }
.rpt-name { margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -.2px; color: #16202e; }
.rpt-name-cap { margin: 3px 0 0; font-size: 9px; color: #93a1b1; }
.rpt-field { margin: 12px 0 0; font-size: 11.5px; color: #45566a; }
.rpt-field b { color: #16202e; font-weight: 700; }
.rpt-simbox {
  margin-top: 12px; border: 1px dashed #cfdcda; border-radius: 10px; padding: 9px 13px; background: #f8fbfb;
}
.rpt-simbox span { display: block; font-size: 8.5px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #9aa8b8; }
.rpt-simbox b { display: block; margin-top: 3px; font-size: 13px; font-weight: 700; color: #16202e; }
.rpt-simbox i { display: block; margin-top: 2px; font-size: 10.5px; font-style: normal; color: ${TEAL_DEEP}; font-weight: 600; }

.rpt-ident-side { width: 132px; flex-shrink: 0; }
.rpt-photo {
  height: 120px; border-radius: 10px; background: #dff0ef; border: 1px solid #c9e3e1;
  display: flex; align-items: center; justify-content: center;
  font-size: 38px; font-weight: 800; color: ${TEAL_DEEP}; letter-spacing: 1px;
}
.rpt-codes { margin-top: 6px; display: flex; border: 1px solid #dbe5e4; border-radius: 8px; overflow: hidden; }
.rpt-codes div { flex: 1; padding: 5px 7px; text-align: center; }
.rpt-codes div + div { border-left: 1px solid #dbe5e4; }
.rpt-codes span { display: block; font-size: 7px; font-weight: 700; color: #93a1b1; letter-spacing: .2px; }
.rpt-codes b { display: block; margin-top: 2px; font-size: 10.5px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #16202e; }

/* Kisi data */
.rpt-meta {
  margin-top: 18px; padding-top: 14px; border-top: 1px dashed #d8e2e1;
  display: grid; grid-template-columns: 1fr 1fr; column-gap: 26px; row-gap: 5px;
}
.rpt-meta p { margin: 0; font-size: 11px; color: #45566a; }
.rpt-meta b { color: #16202e; font-weight: 700; }

/* Panel skor */
.rpt-panel { margin-top: 16px; border: 1px solid #cfe0df; border-radius: 12px; padding: 14px 18px 12px; }
.rpt-panel-date { margin: 0; font-size: 11px; color: #45566a; }
.rpt-panel-date b { color: #16202e; font-weight: 700; }
.rpt-scores { margin-top: 10px; display: flex; align-items: center; gap: 18px; }

.rpt-total { width: 132px; flex-shrink: 0; text-align: center; }
.rpt-total-label { margin: 0; font-size: 10px; font-weight: 700; letter-spacing: .4px; color: #45566a; }
.rpt-ring { position: relative; width: 94px; height: 94px; margin: 4px auto 0; }
.rpt-ring-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.rpt-ring-text b { font-size: 27px; font-weight: 800; line-height: 1; color: #16202e; letter-spacing: -.5px; }
.rpt-ring-text span { margin-top: 2px; font-size: 8.5px; font-weight: 700; letter-spacing: .6px; color: ${TEAL_DEEP}; }
.rpt-total-sub { margin: 2px 0 0; font-size: 9.5px; color: #93a1b1; }

.rpt-sections { flex: 1; min-width: 0; display: flex; gap: 10px; }
.rpt-sec {
  flex: 1; min-width: 0; border-radius: 10px; background: #e8f4f3; border: 1px solid #cfe6e4;
  padding: 10px 8px 9px; text-align: center;
}
.rpt-sec-name {
  margin: 0; display: flex; align-items: center; justify-content: center; gap: 4px;
  font-size: 9.5px; font-weight: 700; color: #45566a; line-height: 1.25;
}
.rpt-sec-icon { height: 11px; width: 11px; flex-shrink: 0; color: ${TEAL_DEEP}; }
.rpt-sec-value { margin: 6px 0 0; font-size: 25px; font-weight: 800; line-height: 1; color: #16202e; }
.rpt-sec-max { margin: 4px 0 0; font-size: 8.5px; color: #7f8fa1; }
.rpt-sec.is-absent { background: #f4f7f8; border-color: #e3eaec; }
.rpt-sec.is-absent .rpt-sec-value { color: #b3c0cd; }

.rpt-panel-note { margin: 11px 0 0; padding-top: 9px; border-top: 1px solid #eef3f3; font-size: 9.5px; color: #7f8fa1; }
.rpt-panel-note b { color: ${TEAL_DEEP}; font-weight: 700; }

/* Skor terbaik */
.rpt-best { margin-top: 14px; border: 1px solid ${AMBER_LINE}; border-radius: 12px; padding: 12px 16px; background: #fffaf0; }
.rpt-best-head { margin: 0; display: flex; align-items: baseline; gap: 10px; }
.rpt-best-head b { font-size: 12.5px; font-weight: 800; color: #16202e; }
.rpt-best-head span { font-size: 9.5px; color: #94825f; }
.rpt-best-row { margin-top: 9px; display: flex; align-items: stretch; gap: 12px; }
.rpt-best-sum {
  width: 132px; flex-shrink: 0; border: 1px solid ${AMBER_LINE}; border-radius: 10px; background: #fff;
  padding: 8px 6px; text-align: center; display: flex; flex-direction: column; justify-content: center;
}
.rpt-best-sum span { font-size: 8px; font-weight: 700; letter-spacing: .3px; color: #94825f; line-height: 1.3; }
.rpt-best-sum b { margin-top: 3px; font-size: 26px; font-weight: 800; line-height: 1; color: #16202e; }
.rpt-best-sum i { margin-top: 2px; font-size: 8.5px; font-style: normal; color: #a9987a; }
.rpt-best-cells { flex: 1; min-width: 0; display: flex; gap: 10px; }
.rpt-best-cell {
  flex: 1; min-width: 0; border-radius: 10px; background: #fdf1d8; border: 1px solid #f0dcb2;
  padding: 8px 6px; text-align: center;
}
.rpt-best-label { margin: 0; font-size: 9px; font-weight: 700; color: #7c6a45; line-height: 1.25; }
.rpt-best-value { margin: 4px 0 0; font-size: 20px; font-weight: 800; line-height: 1; color: #16202e; }
.rpt-best-date { margin: 3px 0 0; font-size: 8px; color: #a9987a; }
.rpt-best-cell.is-absent { background: #f6f4ef; border-color: #e7e2d6; }
.rpt-best-cell.is-absent .rpt-best-value { color: #c3bcae; }

/* Rincian pengerjaan */
.rpt-detail { margin-top: 16px; }
.rpt-detail-title { margin: 0 0 6px; font-size: 9px; font-weight: 800; letter-spacing: .9px; color: #45566a; }
.rpt-table { width: 100%; border-collapse: collapse; }
.rpt-table th {
  text-align: left; font-size: 8.5px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase;
  color: #93a1b1; padding: 0 8px 5px 0; border-bottom: 1.5px solid #e7eeee;
}
.rpt-table td { padding: 6px 8px 6px 0; border-bottom: 1px solid #f1f5f5; font-size: 10.5px; color: #45566a; }
.rpt-table td:first-child { font-weight: 700; color: #16202e; }
.rpt-td-num { width: 78px; white-space: nowrap; font-weight: 800; color: ${TEAL_DEEP} !important; }
.rpt-td-num i { font-style: normal; font-weight: 600; color: #a8b5c4; }
.rpt-td-detail { font-size: 9.5px; color: #7f8fa1; }
.rpt-td-bar { width: 128px; }
.rpt-bar { display: block; height: 4px; border-radius: 999px; background: #eef3f3; overflow: hidden; }
.rpt-bar span { display: block; height: 100%; border-radius: 999px; background: ${TEAL}; }
.rpt-table tr.is-absent td { color: #a4b0bd; }
.rpt-table tr.is-absent td:first-child { color: #93a1b1; font-weight: 600; }
.rpt-table tr.is-absent .rpt-td-num { color: #b3c0cd !important; }

/* Identifikasi */
.rpt-ver { margin-top: 16px; display: flex; gap: 22px; }
.rpt-ver-left { width: 300px; flex-shrink: 0; }
.rpt-ver-title { margin: 0 0 4px; font-size: 9px; font-weight: 800; letter-spacing: .9px; color: #45566a; }
.rpt-ver-left p { margin: 0; font-size: 9.5px; line-height: 1.65; color: #7f8fa1; }
.rpt-ver-left b { color: #45566a; font-weight: 700; }
.rpt-ver-right { flex: 1; min-width: 0; }
.rpt-ver-right p { margin: 0; font-size: 9.5px; line-height: 1.6; color: #7f8fa1; }
.rpt-ver-check { margin-top: 6px !important; font-style: italic; }

/* Kaki — didorong ke dasar lembar. */
.rpt-foot { margin-top: auto; padding-top: 14px; }
.rpt-legal {
  margin: 0; text-align: center; font-size: 9px; font-weight: 700; letter-spacing: .3px;
  line-height: 1.6; color: #45566a;
}
.rpt-legal b { color: #16202e; }
.rpt-foot-line {
  margin-top: 9px; padding-top: 9px; border-top: 1px solid #e7eeee;
  display: flex; justify-content: space-between; font-size: 8.5px; color: #a4b0bd;
}

@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body { background: #fff !important; animation: none !important; }
  .rpt-noprint { display: none !important; }
  /* Widget mengambang milik layout (chat Ling, toaster, wizard trial) adalah
     saudara <body> dari halaman ini — tanpa aturan ini semuanya IKUT TERCETAK. */
  body > *:not(.rpt-page):not(:has(.rpt-page)) { display: none !important; }
  .rpt-page { padding: 0 !important; background: #fff !important; }
  /* Kembalikan lembar ke ukuran A4 asli — skala layar cuma untuk pratinjau. */
  .rpt-scale { transform: none !important; height: auto !important; width: ${RPT_W}px !important; margin: 0 !important; }
  .rpt-sheet { box-shadow: none !important; border: 0 !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
`;
