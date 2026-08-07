"use client";

// [sim-certificate-v1] LEMBAR sertifikat hasil simulasi — murni tampilan.
// Dipisah dari halamannya supaya bisa dirender dengan data sintetis saat
// mengecek tata letaknya (lihat [[verifikasi-ui-akun-harness-tmp]]).
//
// Ukurannya piksel-pasti: 1123×794 px CSS = 297×210 mm @96dpi = A4 landscape,
// jadi dialog cetak browser menghasilkan PDF satu halaman penuh tanpa pustaka
// PDF apa pun. Skala layar dipakai HANYA untuk pratinjau dan dimatikan saat cetak.
import type { OfficialScore } from "@/lib/simScore";
import { officialBody } from "@/lib/simCertificate";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";

export const SHEET_W = 1123;
export const SHEET_H = 794;

export interface CertificateData {
  name: string;
  title: string;
  testLabel: string;
  official: OfficialScore;
  submittedAt: string | null;
  rawScore: number;
  rawMax: number;
  correct: number;
  objective: number;
  certNo: string;
}

export const fmtTanggalPanjang = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "—";

export default function CertificateSheet({ data, scale = 1 }: { data: CertificateData; scale?: number }) {
  const o = data.official;
  const unitInline = o.unit.startsWith("/") ? o.unit : ` ${o.unit}`;
  // Subtes yang dicetak: yang punya nilai + subtes informasional. Seksi resmi yang
  // tak ada di simulasi ini ("—") dilewati supaya tak jadi baris kosong di lembar.
  const rows = o.skills.filter((s) => s.value != null || s.informational);

  return (
    <div className="sert-scale" style={{ transform: `scale(${scale})`, height: SHEET_H * scale }}>
      <div className="sert-sheet">
        <div className="sert-frame">
          {/* Kop */}
          <div className="sert-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/FULL_LOGO_LINGUO_HIJAU.png" alt="Linguo" className="sert-logo" />
            <div className="sert-no">
              <span>NOMOR SERTIFIKAT</span>
              <b>{data.certNo}</b>
            </div>
          </div>

          {/* Judul */}
          <div className="sert-title-wrap">
            <h1 className="sert-title">SERTIFIKAT</h1>
            <p className="sert-subtitle">HASIL SIMULASI TES · {o.scaleLabel.toUpperCase()}</p>
          </div>

          {/* Penerima */}
          <p className="sert-given">Dengan bangga diberikan kepada</p>
          {/* Nama panjang dikecilkan supaya tetap satu baris & tak menabrak bingkai. */}
          <p className="sert-name" style={data.name.length > 30 ? { fontSize: 34 } : undefined}>{data.name}</p>
          <div className="sert-rule" />
          <p className="sert-desc">
            atas selesainya <b>{data.title}</b> — {data.testLabel} pada {fmtTanggalPanjang(data.submittedAt)},
            dengan perolehan skor sebagai berikut:
          </p>

          {/* Skor */}
          <div className="sert-body">
            <div className="sert-score">
              <p className="sert-score-label">PERKIRAAN SKOR</p>
              <p className="sert-score-value">
                {o.headline}<span className="sert-score-unit">{unitInline}</span>
              </p>
              <p className="sert-score-scale">{o.scaleLabel} · {o.rangeLabel}</p>
              {o.verdict && <span className="sert-verdict">{o.verdict}</span>}
            </div>

            <div className="sert-skills">
              <p className="sert-skills-title">NILAI PER SUBTES</p>
              <div className="sert-skill-grid">
                {rows.map((s) => (
                  <div key={s.key} className="sert-skill">
                    <div className="sert-skill-top">
                      <span className="sert-skill-label">{s.label}</span>
                      <span className="sert-skill-value">
                        {s.display}
                        {s.value != null && !s.informational && <i> / {s.max}</i>}
                      </span>
                    </div>
                    <div className="sert-skill-bar">
                      <div style={{ width: `${Math.round(s.fraction * 100)}%` }} />
                    </div>
                    <p className="sert-skill-detail">
                      {s.detail}{s.informational && " · di luar skala resmi"}
                    </p>
                  </div>
                ))}
              </div>
              <p className="sert-raw">
                Skor mentah {Math.round(data.rawScore)}/{Math.round(data.rawMax)} poin
                {data.objective > 0 && <> · {data.correct} dari {data.objective} soal objektif benar</>}
              </p>
            </div>
          </div>

          {/* Kaki */}
          <div className="sert-foot">
            <div className="sert-foot-left">
              <p><b>Diterbitkan</b> {fmtTanggalPanjang(data.submittedAt)}</p>
              <p>Keaslian sertifikat dapat dicek pada akun linguo.id pemiliknya dengan nomor di atas.</p>
            </div>
            <div className="sert-sign">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.png" alt="" className="sert-stamp" />
              <div className="sert-sign-line" />
              <p className="sert-sign-name">Linguo Language School</p>
              <p className="sert-sign-sub">linguo.id</p>
            </div>
          </div>

          <p className="sert-disclaimer">
            Sertifikat ini menyatakan hasil <b>simulasi</b> yang diselenggarakan Linguo. Skor merupakan
            <b> perkiraan</b> hasil konversi ke skala {o.scaleLabel} — bukan skor resmi dan tidak diterbitkan oleh {officialBody(o.scale)}.
          </p>
        </div>
      </div>
    </div>
  );
}

// CSS lembar + aturan cetak. Ditulis sebagai satu blok (bukan Tailwind) karena
// ukurannya harus piksel-pasti agar cocok A4, dan agar @media print-nya duduk
// berdampingan dengan gayanya.
export const CERT_CSS = `
.sert-scale { width: ${SHEET_W}px; margin: 0 auto; transform-origin: top left; }
@media (max-width: 1212px) { .sert-scale { margin: 0; } }
.sert-sheet {
  width: ${SHEET_W}px; height: ${SHEET_H}px; background: #fff; position: relative;
  box-shadow: 0 18px 45px rgba(15,23,42,.18); overflow: hidden;
  font-family: var(--font-sans), system-ui, sans-serif; color: #0f172a;
}
/* Ornamen sudut — lembut, tetap terbaca saat dicetak hitam-putih. */
.sert-sheet::before, .sert-sheet::after {
  content: ""; position: absolute; width: 300px; height: 300px; border-radius: 50%;
  background: radial-gradient(circle, rgba(26,158,158,.12) 0%, rgba(26,158,158,0) 72%);
}
.sert-sheet::before { top: -150px; left: -130px; }
.sert-sheet::after { bottom: -170px; right: -150px; }

.sert-frame {
  position: absolute; inset: 16px; border: 2px solid ${TEAL}; border-radius: 6px;
  padding: 24px 46px 20px; display: flex; flex-direction: column;
}
.sert-frame::before { content: ""; position: absolute; inset: 6px; border: 1px solid rgba(26,158,158,.35); border-radius: 3px; pointer-events: none; }

.sert-head { display: flex; align-items: flex-start; justify-content: space-between; }
.sert-logo { height: 38px; width: auto; object-fit: contain; }
.sert-no { text-align: right; line-height: 1.5; }
.sert-no span { display: block; font-size: 8.5px; letter-spacing: 1.4px; color: #94a3b8; font-weight: 700; }
.sert-no b { font-size: 12px; letter-spacing: .6px; color: ${TEAL_DEEP}; }

.sert-title-wrap { text-align: center; margin-top: 10px; }
.sert-title { font-family: Georgia, 'Times New Roman', serif; font-size: 40px; font-weight: 700; letter-spacing: 14px; color: ${TEAL_DEEP}; margin: 0; padding-left: 14px; }
.sert-subtitle { margin: 6px 0 0; font-size: 11px; font-weight: 700; letter-spacing: 4.2px; color: #94a3b8; }

.sert-given { margin: 20px 0 0; text-align: center; font-size: 13px; font-style: italic; color: #64748b; }
.sert-name { margin: 6px 0 0; text-align: center; font-family: Georgia, 'Times New Roman', serif; font-size: 46px; font-weight: 700; line-height: 1.15; color: ${TEAL_DEEP}; }
.sert-rule { width: 600px; height: 1px; margin: 11px auto 0; background: linear-gradient(90deg, rgba(26,158,158,0), ${TEAL}, rgba(26,158,158,0)); }
.sert-desc { margin: 13px auto 0; max-width: 800px; text-align: center; font-size: 13px; line-height: 1.65; color: #475569; }
.sert-desc b { color: #0f172a; }

/* margin auto atas-bawah: blok skor mengambang di TENGAH sisa ruang antara
   penerima dan kaki — tanpa ini lembar dengan 2 subtes menyisakan lubang besar. */
.sert-body { display: flex; gap: 24px; margin: auto 0; align-items: stretch; }
.sert-score {
  width: 290px; flex-shrink: 0; border-radius: 18px; padding: 24px 18px; text-align: center; color: #fff;
  background: linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DEEP} 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.sert-score-label { margin: 0; font-size: 9.5px; font-weight: 700; letter-spacing: 2.6px; color: rgba(255,255,255,.75); }
.sert-score-value { margin: 6px 0 0; font-size: 64px; font-weight: 800; line-height: 1; letter-spacing: -1px; }
.sert-score-unit { font-size: 22px; font-weight: 700; margin-left: 4px; opacity: .85; }
.sert-score-scale { margin: 9px 0 0; font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,.9); }
.sert-verdict { margin-top: 11px; display: inline-block; border-radius: 999px; background: rgba(255,255,255,.18); padding: 5px 15px; font-size: 11.5px; font-weight: 700; }

.sert-skills { flex: 1; min-width: 0; border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px 18px 14px; display: flex; flex-direction: column; }
.sert-skills-title { margin: 0 0 10px; font-size: 9.5px; font-weight: 700; letter-spacing: 2.4px; color: #94a3b8; }
/* align-content: center → 2 subtes tetap duduk di tengah kartu, bukan menumpuk di atas. */
.sert-skill-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; align-content: center; }
.sert-skill-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.sert-skill-label { font-size: 12.5px; font-weight: 700; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sert-skill-value { font-size: 13px; font-weight: 800; color: ${TEAL_DEEP}; white-space: nowrap; }
.sert-skill-value i { font-style: normal; font-weight: 600; color: #94a3b8; }
.sert-skill-bar { margin-top: 5px; height: 4px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.sert-skill-bar div { height: 100%; border-radius: 999px; background: ${TEAL}; }
.sert-skill-detail { margin: 4px 0 0; font-size: 10px; color: #94a3b8; }
.sert-raw { margin: 12px 0 0; padding-top: 10px; border-top: 1px dashed #e2e8f0; font-size: 11px; color: #64748b; }

.sert-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
.sert-foot-left { max-width: 420px; font-size: 10px; line-height: 1.7; color: #64748b; }
.sert-foot-left p { margin: 0; }
.sert-foot-left b { color: #334155; }
.sert-sign { text-align: center; width: 230px; }
.sert-stamp { height: 32px; width: auto; margin: 0 auto 4px; display: block; opacity: .9; }
.sert-sign-line { height: 1px; background: #cbd5e1; margin-bottom: 5px; }
.sert-sign-name { margin: 0; font-size: 12px; font-weight: 700; color: ${TEAL_DEEP}; }
.sert-sign-sub { margin: 1px 0 0; font-size: 9.5px; color: #94a3b8; }

.sert-disclaimer { margin: 9px 0 0; text-align: center; font-size: 9px; line-height: 1.6; color: #94a3b8; }
.sert-disclaimer b { color: #64748b; }

@media print {
  @page { size: A4 landscape; margin: 0; }
  html, body { background: #fff !important; animation: none !important; }
  .sert-noprint { display: none !important; }
  /* Widget mengambang milik layout (chat Ling, toaster, wizard trial) adalah
     saudara <body> dari halaman ini — tanpa aturan ini semuanya IKUT TERCETAK
     di atas sertifikat. :has() menjaga kalau kelak halaman dibungkus layout baru. */
  body > *:not(.sert-page):not(:has(.sert-page)) { display: none !important; }
  .sert-page { padding: 0 !important; background: #fff !important; }
  /* Kembalikan lembar ke ukuran A4 asli — skala layar cuma untuk pratinjau. */
  .sert-scale { transform: none !important; height: auto !important; width: ${SHEET_W}px !important; margin: 0 !important; }
  .sert-sheet { box-shadow: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
`;
