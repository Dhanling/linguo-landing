"use client";

// [sim-certificate-v3] LEMBAR sertifikat hasil simulasi — murni tampilan.
// Dipisah dari halamannya supaya bisa dirender dengan data sintetis saat
// mengecek tata letaknya (lihat [[verifikasi-ui-akun-harness-tmp]]).
//
// SALINANNYA hidup di linguo-admin-dashboard/src/components/simulasi/
// CertificateSheet.tsx (lembar yang diterbitkan admin) — kalau berkas ini
// diubah, salinan itu WAJIB ikut diubah, kalau tidak sertifikat versi admin
// beda dengan yang diunduh siswa.
//
// Ukurannya piksel-pasti: 794×1123 px CSS = 210×297 mm @96dpi = A4 POTRET,
// jadi dialog cetak browser menghasilkan PDF satu halaman penuh tanpa pustaka
// PDF apa pun. Skala layar dipakai HANYA untuk pratinjau dan dimatikan saat cetak.
//
// v3 — orientasinya diputar jadi potret. Sertifikat dicetak/dipajang/diunggah
// ke LinkedIn dalam format potret seperti ijazah & sertifikat kursus pada
// umumnya; versi lanskap bikin lembarnya tak sebaris dengan berkas lain dan
// kekecilan saat dibuka di HP. Tata letaknya ikut ditumpuk vertikal: kartu skor
// jadi blok tengah selebar isi, daftar subtes turun ke bawahnya (dulu keduanya
// bersebelahan kiri-kanan).
//
// v2 — tampilan dirombak jadi modern-clean: bingkai ganda diganti pita aksen
// kiri + garis rambut, rincian subtes jadi daftar bertumpuk (bukan kotak 2 kolom),
// dan seksi resmi yang TIDAK diujikan ikut dicetak sebagai baris "Tidak diujikan"
// — dulu baris itu dibuang diam-diam sehingga sertifikat TOEFL ITP tampil hanya
// "Section 1" dan "Section 3" tanpa penjelasan ke mana Section 2 pergi.
import type { OfficialScore } from "@/lib/simScore";
import { officialBody } from "@/lib/simCertificate";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";

export const SHEET_W = 794;
export const SHEET_H = 1123;

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

/**
 * Ukuran nama penerima menurut panjangnya — lembar POTRET cuma punya lebar isi
 * 672px, jadi nama panjang ("Muhamad Lutfi Ramadhani Pratama") pecah dua baris
 * kalau ukurannya tetap. Turunannya bertingkat supaya nama sependek "Rara" tetap
 * tampil besar.
 */
const namaFontSize = (nama: string) => {
  const n = nama.length;
  if (n <= 18) return undefined;   // 46px — bawaan CSS
  if (n <= 24) return 40;
  if (n <= 30) return 34;
  if (n <= 38) return 28;
  return 24;
};

export const fmtTanggalPanjang = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "—";

export default function CertificateSheet({ data, scale = 1 }: { data: CertificateData; scale?: number }) {
  const o = data.official;
  const unitInline = o.unit.startsWith("/") ? o.unit : ` ${o.unit}`;
  // SEMUA seksi resmi dicetak, termasuk yang tak ada di simulasi ini — kalau
  // dibuang, pembaca cuma melihat "Section 1" & "Section 3" dan mengira lembarnya
  // salah. Baris yang absen ditandai jelas dan barnya kosong.
  const rows = o.skills;
  const isAbsent = (s: OfficialScore["skills"][number]) => s.value == null && !s.informational;

  return (
    <div
      className="sert-scale"
      style={{ transform: `scale(${scale})`, width: SHEET_W * scale, height: SHEET_H * scale }}
    >
      <div className="sert-sheet">
        {/* Pita aksen kiri — pengganti bingkai ganda yang lama. */}
        <div className="sert-edge" />

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
            <p className="sert-eyebrow">Hasil Simulasi Tes · {o.scaleLabel}</p>
            <h1 className="sert-title">SERTIFIKAT</h1>
            <div className="sert-title-rule" />
          </div>

          {/* Penerima */}
          <p className="sert-given">Dengan bangga diberikan kepada</p>
          {/* Nama panjang dikecilkan supaya tetap satu baris & tak menabrak tepi. */}
          <p className="sert-name" style={{ fontSize: namaFontSize(data.name) }}>
            {data.name}
          </p>
          <p className="sert-desc">
            atas selesainya <b>{data.title}</b> — {data.testLabel} pada {fmtTanggalPanjang(data.submittedAt)}
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
              <div className="sert-skills-head">
                <p className="sert-skills-title">NILAI PER SUBTES</p>
                <p className="sert-skills-meta">
                  {data.objective > 0
                    ? `${data.correct} dari ${data.objective} soal objektif benar`
                    : `Skor mentah ${Math.round(data.rawScore)}/${Math.round(data.rawMax)} poin`}
                </p>
              </div>

              {/* Sisa tinggi lembar potret cukup untuk 4 baris berukuran penuh;
                  5–6 baris dirapatkan, lebih dari itu baru dipecah dua kolom.
                  Tanpa penyempitan ini lembar 6 subtes melewati batas 1123px dan
                  kaki + penyangkalannya terpotong dari PDF. */}
              <div
                className={`sert-skill-list${
                  rows.length > 6 ? " is-two" : rows.length > 4 ? " is-compact" : ""
                }`}
              >
                {rows.map((s) => {
                  const absent = isAbsent(s);
                  return (
                    <div key={s.key} className={`sert-skill${absent ? " is-absent" : ""}`}>
                      <div className="sert-skill-top">
                        <span className="sert-skill-label">{s.label}</span>
                        <span className="sert-skill-value">
                          {absent ? (
                            "Tidak diujikan"
                          ) : (
                            <>
                              {s.display}
                              {s.value != null && !s.informational && <i> / {s.max}</i>}
                            </>
                          )}
                        </span>
                      </div>
                      <div className="sert-skill-bar">
                        <div style={{ width: absent ? 0 : `${Math.round(s.fraction * 100)}%` }} />
                      </div>
                      <p className="sert-skill-detail">
                        {absent
                          ? "seksi ini tidak termasuk dalam paket simulasi yang dikerjakan"
                          : s.detail}
                        {s.informational && " · di luar skala resmi"}
                      </p>
                    </div>
                  );
                })}
              </div>

              {o.partial && (
                <p className="sert-partial">
                  Skor total diperkirakan proporsional dari seksi yang diujikan saja.
                </p>
              )}
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
              <div>
                <p className="sert-sign-name">Linguo Language School</p>
                <p className="sert-sign-sub">linguo.id · Online Language School</p>
              </div>
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
/* Lebar/tinggi kotak layoutnya diisi inline = ukuran SETELAH diskalakan, supaya
   pembungkusnya tak pernah lebih lebar dari lembar yang terlihat (dulu tetap
   ukuran penuh → pratinjau di dalam dialog kepotong di kanan). */
.sert-scale { margin: 0 auto; transform-origin: top left; }
.sert-sheet {
  box-sizing: border-box; width: ${SHEET_W}px; height: ${SHEET_H}px; background: #fff;
  position: relative; overflow: hidden; border: 1px solid #e4edec;
  box-shadow: 0 20px 50px rgba(15,23,42,.14);
  font-family: var(--font-sans), system-ui, sans-serif; color: #0f172a;
  -webkit-font-smoothing: antialiased;
}
/* Wash lembut dua sudut — tetap terbaca saat dicetak hitam-putih. */
.sert-sheet::before, .sert-sheet::after {
  content: ""; position: absolute; width: 520px; height: 520px; border-radius: 50%;
}
.sert-sheet::before {
  top: -250px; right: -170px;
  background: radial-gradient(circle, rgba(26,158,158,.11) 0%, rgba(26,158,158,0) 70%);
}
.sert-sheet::after {
  bottom: -290px; left: -160px;
  background: radial-gradient(circle, rgba(15,110,86,.08) 0%, rgba(15,110,86,0) 70%);
}
.sert-edge {
  position: absolute; top: 0; left: 0; width: 10px; height: 100%;
  background: linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DEEP} 100%);
}

.sert-frame { position: absolute; inset: 0; padding: 46px 56px 30px 66px; display: flex; flex-direction: column; }

.sert-head { display: flex; align-items: center; justify-content: space-between; }
.sert-logo { height: 32px; width: auto; object-fit: contain; }
.sert-no { text-align: right; line-height: 1.5; }
.sert-no span { display: block; font-size: 8px; letter-spacing: 1.6px; color: #9aa8b8; font-weight: 700; }
.sert-no b { font-size: 11.5px; letter-spacing: .8px; color: ${TEAL_DEEP}; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

.sert-title-wrap { text-align: center; margin-top: 34px; }
.sert-eyebrow { margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 4px; color: ${TEAL}; text-transform: uppercase; }
.sert-title { font-family: Georgia, 'Times New Roman', serif; font-size: 40px; font-weight: 700; letter-spacing: 13px; color: #0f172a; margin: 9px 0 0; padding-left: 13px; }
.sert-title-rule { width: 54px; height: 3px; border-radius: 999px; margin: 13px auto 0; background: ${TEAL}; }

.sert-given { margin: 26px 0 0; text-align: center; font-size: 12px; color: #8494a6; }
.sert-name { margin: 10px 0 0; text-align: center; font-family: Georgia, 'Times New Roman', serif; font-size: 46px; font-weight: 700; line-height: 1.14; color: ${TEAL_DEEP}; }
.sert-desc { margin: 13px auto 0; max-width: 600px; text-align: center; font-size: 12.5px; line-height: 1.7; color: #64748b; }
.sert-desc b { color: #0f172a; font-weight: 700; }

/* margin auto atas-bawah: blok skor + subtes mengambang di TENGAH sisa ruang
   antara penerima dan kaki — tanpa ini lembar dengan 2 subtes menyisakan lubang
   besar di bawah. Potret menumpuk keduanya (dulu bersebelahan). */
.sert-body { display: flex; flex-direction: column; margin: auto 0; }
.sert-score {
  width: 372px; margin: 0 auto; box-sizing: border-box; border-radius: 26px; padding: 32px 24px;
  text-align: center; color: #fff;
  background: linear-gradient(150deg, #21B2AE 0%, ${TEAL} 42%, ${TEAL_DEEP} 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.sert-score-label { margin: 0; font-size: 9px; font-weight: 700; letter-spacing: 2.8px; color: rgba(255,255,255,.72); }
.sert-score-value { margin: 10px 0 0; font-size: 70px; font-weight: 800; line-height: 1; letter-spacing: -1.5px; }
.sert-score-unit { font-size: 22px; font-weight: 700; margin-left: 5px; opacity: .8; letter-spacing: 0; }
.sert-score-scale { margin: 12px 0 0; font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,.88); }
.sert-verdict { margin-top: 12px; display: inline-block; border-radius: 999px; background: rgba(255,255,255,.2); padding: 5px 14px; font-size: 11px; font-weight: 700; }

.sert-skills { margin-top: 36px; min-width: 0; display: flex; flex-direction: column; }
.sert-skills-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 2px solid #eef2f6; }
.sert-skills-title { margin: 0; font-size: 9px; font-weight: 700; letter-spacing: 2.6px; color: #8494a6; }
.sert-skills-meta { margin: 0; font-size: 10px; color: #a0aec0; white-space: nowrap; }
.sert-skill-list { display: grid; grid-template-columns: 1fr; }
.sert-skill-list.is-two { grid-template-columns: 1fr 1fr; column-gap: 26px; }
.sert-skill-list.is-compact .sert-skill { padding: 9px 0 8px; }
.sert-skill-list.is-compact .sert-skill-detail { margin-top: 5px; font-size: 9.5px; }
.sert-skill-list.is-compact .sert-skill-bar { margin-top: 6px; height: 3px; }
.sert-skill { padding: 15px 0 13px; border-bottom: 1px solid #eef2f6; }
.sert-skill:last-child { border-bottom: 0; }
.sert-skill-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.sert-skill-label { font-size: 12.5px; font-weight: 700; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sert-skill-value { font-size: 14px; font-weight: 800; color: ${TEAL_DEEP}; white-space: nowrap; }
.sert-skill-value i { font-style: normal; font-weight: 600; color: #a8b5c4; }
.sert-skill-bar { margin-top: 8px; height: 4px; border-radius: 999px; background: #eef2f6; overflow: hidden; }
.sert-skill-bar div { height: 100%; border-radius: 999px; background: linear-gradient(90deg, ${TEAL}, ${TEAL_DEEP}); }
.sert-skill-detail { margin: 6px 0 0; font-size: 10px; color: #a0aec0; }
/* Seksi resmi yang tak diujikan — sengaja tetap dicetak, tapi jelas berbeda. */
.sert-skill.is-absent .sert-skill-label { color: #94a3b8; font-weight: 600; }
.sert-skill.is-absent .sert-skill-value { font-size: 10px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: #b0bcc9; }
.sert-skill.is-absent .sert-skill-bar { background: #f3f6f9; }
.sert-partial { margin: 12px 0 0; font-size: 10px; color: #a0aec0; }

.sert-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding-top: 14px; border-top: 1px solid #eef2f6; }
.sert-foot-left { max-width: 330px; font-size: 9.5px; line-height: 1.75; color: #94a3b8; }
.sert-foot-left p { margin: 0; }
.sert-foot-left b { color: #334155; font-weight: 700; }
.sert-sign { display: flex; align-items: center; gap: 11px; }
.sert-stamp { height: 32px; width: auto; display: block; }
.sert-sign-name { margin: 0; font-size: 12px; font-weight: 700; color: ${TEAL_DEEP}; }
.sert-sign-sub { margin: 2px 0 0; font-size: 9.5px; color: #94a3b8; }

.sert-disclaimer { margin: 12px 0 0; text-align: center; font-size: 8.5px; line-height: 1.65; color: #a8b5c4; }
.sert-disclaimer b { color: #7d8b9c; }

@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body { background: #fff !important; animation: none !important; }
  .sert-noprint { display: none !important; }
  /* Widget mengambang milik layout (chat Ling, toaster, wizard trial) adalah
     saudara <body> dari halaman ini — tanpa aturan ini semuanya IKUT TERCETAK
     di atas sertifikat. :has() menjaga kalau kelak halaman dibungkus layout baru. */
  body > *:not(.sert-page):not(:has(.sert-page)) { display: none !important; }
  .sert-page { padding: 0 !important; background: #fff !important; }
  /* Kembalikan lembar ke ukuran A4 asli — skala layar cuma untuk pratinjau. */
  .sert-scale { transform: none !important; height: auto !important; width: ${SHEET_W}px !important; margin: 0 !important; }
  .sert-sheet { box-shadow: none !important; border: 0 !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
`;
