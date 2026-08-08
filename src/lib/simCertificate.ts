// [sim-certificate-v1] Sertifikat hasil simulasi tes.
//
// Setelah mengerjakan simulasi, siswa cuma punya layar hasil di dalam akunnya —
// tak ada apa pun yang bisa disimpan/dikirim ke orang lain (orang tua, kampus,
// sponsor beasiswa). Berkas ini menyiapkan bahan sertifikatnya: nomor sertifikat
// yang stabil + aturan siapa yang berhak dapat.
//
// PENTING: ini sertifikat SIMULASI (perkiraan skor), bukan skor resmi ETS/IDP/
// JEES/Hanban/NIIED/Goethe. Kalimat penyangkalan itu WAJIB ikut tercetak — lihat
// halaman /akun/simulasi/sertifikat/[attemptId].
import type { OfficialScore, ScoreScale } from "@/lib/simScore";

// Lembaga penyelenggara resmi tiap ujian — disebut di kalimat penyangkalan agar
// pembaca sertifikat tak salah kira ini terbitan lembaga tersebut.
const OFFICIAL_BODY: Record<ScoreScale, string> = {
  toefl_itp: "ETS",
  toefl_ibt: "ETS",
  ielts: "IDP / British Council / Cambridge",
  jlpt: "JEES & Japan Foundation",
  hsk: "Chinese Testing International (Hanban)",
  topik: "NIIED",
  goethe: "Goethe-Institut",
};

export const officialBody = (scale: ScoreScale): string => OFFICIAL_BODY[scale] ?? "lembaga tes resmi";

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Nomor sertifikat — deterministik dari attempt, jadi lembar yang dicetak ulang
 * selalu bernomor sama. Format: LNG-SIM-YYYYMMDD-XXXXXX
 * (XXXXXX = 6 karakter pertama UUID attempt, huruf besar).
 */
export function certificateNumber(attemptId: string, submittedAt: string | null): string {
  const d = submittedAt ? new Date(submittedAt) : null;
  const ymd = d && !Number.isNaN(d.getTime())
    ? `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`
    : "00000000";
  const code = attemptId.replace(/-/g, "").slice(0, 6).toUpperCase() || "000000";
  return `LNG-SIM-${ymd}-${code}`;
}

/**
 * Berhak dapat sertifikat bila pengerjaannya SUDAH dikumpulkan DAN skornya bisa
 * dikonversi ke skala resmi. Lembar kosong / belum dinilai sengaja ditolak:
 * officialScore() mengembalikan null untuk hasil nol (lihat [sim-blank-attempt-v1]),
 * dan sertifikat bertuliskan "310 ITP" dari lembar yang tak diisi itu menyesatkan.
 */
export function canIssueCertificate(
  attempt: { submitted_at: string | null },
  official: OfficialScore | null,
): boolean {
  return !!attempt.submitted_at && !!official;
}

/** Nama peserta pada sertifikat — nama yang dipakai saat mengerjakan menang. */
export function certificateName(
  attemptName: string | null | undefined,
  profileName: string | null | undefined,
): string {
  return (attemptName?.trim() || profileName?.trim() || "Peserta Simulasi").slice(0, 80);
}

/** Nama berkas PDF saat "Simpan sebagai PDF" — biar rapi di folder unduhan. */
export function certificateFileTitle(name: string, scaleLabel: string): string {
  const clean = name.replace(/[^\p{L}\p{N} ]/gu, "").trim() || "Peserta";
  return `Sertifikat Simulasi ${scaleLabel} - ${clean}`;
}

/** [sim-score-report-v1] Nama berkas PDF laporan skor (lembar A4 potret). */
export function scoreReportFileTitle(name: string, scaleLabel: string): string {
  const clean = name.replace(/[^\p{L}\p{N} ]/gu, "").trim() || "Peserta";
  return `Laporan Skor ${scaleLabel} - ${clean}`;
}

/**
 * [sim-score-report-v1] Kode peserta yang DISAMARKAN untuk dicetak di laporan.
 * Cukup untuk mencocokkan lembar dengan akunnya, tapi tak membocorkan UUID
 * penuh ke siapa pun yang memegang PDF-nya.
 */
export function maskedParticipantId(userId: string | null | undefined): string {
  const tail = (userId ?? "").replace(/-/g, "").slice(-4).toUpperCase();
  return tail ? `xxxxxxxxxxxxxxxx${tail}` : "—";
}
