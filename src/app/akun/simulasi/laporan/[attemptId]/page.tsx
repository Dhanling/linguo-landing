"use client";

// [sim-score-report-v1] Laporan Skor Peserta — lembar A4 POTRET yang bisa diunduh
// siswa (Cetak → "Simpan sebagai PDF").
//
// Pelengkap /akun/simulasi/sertifikat/[attemptId]: sertifikat itu lembar apresiasi
// (landscape, "diberikan kepada…"), sedangkan halaman ini dokumen data bergaya
// laporan skor tes internasional — dipakai siswa saat harus menunjukkan rincian
// angka ke orang tua, kampus, atau sponsor.
//
// Datanya disusun ulang dari simulation_attempts + simulation_answers (RLS: hanya
// baris sendiri) lalu dikonversi ke SKALA RESMI lewat lib/simScore. Riwayat
// pengerjaan lain pada skala yang sama ikut dibaca untuk panel "Skor Terbaik".
// Tak ada tabel/kolom baru: laporan murni turunan tampilan.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchAttemptReview, fetchMyAttempts, getStudentInfo, testTypeLabel } from "@/lib/simulations";
import { bestScores, officialScore, type OfficialScore } from "@/lib/simScore";
import {
  canIssueCertificate, certificateName, certificateNumber, maskedParticipantId, scoreReportFileTitle,
} from "@/lib/simCertificate";
import ScoreReportSheet, {
  RPT_CSS, RPT_W, type ScoreReportData,
} from "@/components/akun/simulasi/ScoreReportSheet";
import { ArrowLeft, Award, Download, Loader2, ShieldCheck } from "lucide-react";

const TEAL = "#1A9E9E";

export default function LaporanSkorSimulasiPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params?.attemptId as string;
  const [state, setState] = useState<"loading" | "ready" | "noauth" | "notfound" | "notyet">("loading");
  const [data, setData] = useState<ScoreReportData | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let alive = true;
    (async () => {
      const info = await getStudentInfo();
      if (!alive) return;
      if (!info) { setState("noauth"); return; }

      const review = await fetchAttemptReview(attemptId);
      if (!alive) return;
      if (!review) { setState("notfound"); return; }

      const { attempt, answers } = review;
      const official = officialScore({
        testType: attempt.test_type,
        variant: attempt.test_variant,
        title: attempt.title,
        skills: attempt.skills,
        aggregate: { score: attempt.score, max: attempt.max_score },
      });
      // Lembar kosong / belum dinilai tak diterbitkan laporannya — sama seperti
      // sertifikat: "310 ITP" dari lembar yang tak diisi itu menyesatkan.
      if (!canIssueCertificate(attempt, official) || !official) { setState("notyet"); return; }

      // Panel "Skor Terbaik": nilai tertinggi tiap seksi dari SEMUA pengerjaan
      // pada skala yang sama. Attempt yang sedang dibuka selalu ikut dihitung,
      // walau riwayatnya gagal dibaca (mis. sesi tamu tanpa riwayat).
      let entries: Array<{ official: OfficialScore; submittedAt: string | null }> = [
        { official, submittedAt: attempt.submitted_at },
      ];
      try {
        const history = await fetchMyAttempts();
        const others = history
          .filter((a) => a.id !== attempt.id)
          .map((a) => ({
            official: officialScore({
              testType: a.test_type, variant: a.test_variant, title: a.title,
              skills: a.skills, aggregate: { score: a.score, max: a.max_score },
            }),
            submittedAt: a.submitted_at,
          }))
          .filter((e): e is { official: OfficialScore; submittedAt: string | null } => !!e.official);
        entries = entries.concat(others);
      } catch {}
      if (!alive) return;

      const best = bestScores(official.scale, attempt.test_variant, entries);

      setData({
        name: certificateName(attempt.student_name, info.name),
        email: info.email,
        title: attempt.title,
        testLabel: testTypeLabel(attempt.test_type, attempt.test_variant),
        official,
        // Panel disembunyikan bila cuma ada satu pengerjaan — isinya akan persis
        // sama dengan panel skor di atasnya, jadi cuma jadi pengulangan.
        best: best && best.attempts > 1 ? best : null,
        submittedAt: attempt.submitted_at,
        startedAt: attempt.started_at,
        rawScore: attempt.score ?? 0,
        rawMax: attempt.max_score ?? 0,
        correct: answers.filter((a) => a.is_correct === true).length,
        objective: answers.filter((a) => a.is_correct != null).length,
        reportNo: certificateNumber(attempt.id, attempt.submitted_at),
        participantId: maskedParticipantId(info.user_id),
      });
      setState("ready");
    })();
    return () => { alive = false; };
  }, [attemptId]);

  // Lembar berukuran tetap → dikecilkan proporsional biar muat di layar HP.
  // Saat mencetak, transform-nya dimatikan (lihat @media print di RPT_CSS).
  useEffect(() => {
    const fit = () => {
      const avail = Math.min(window.innerWidth - 32, 860);
      setScale(Math.min(1, avail / RPT_W));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Judul dokumen = nama berkas default saat "Simpan sebagai PDF".
  useEffect(() => {
    if (!data) return;
    const before = document.title;
    document.title = scoreReportFileTitle(data.name, data.official.scaleLabel);
    return () => { document.title = before; };
  }, [data]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (state !== "ready" || !data) {
    const pesan =
      state === "noauth" ? "Masuk dulu untuk mengunduh laporan skormu."
      : state === "notyet" ? "Laporan skor terbit setelah simulasi dikumpulkan dan hasilnya bisa dikonversi ke skala resmi. Pengerjaan tanpa satu pun jawaban benar belum bisa dilaporkan — silakan kerjakan ulang simulasinya."
      : "Laporan ini tidak ditemukan — mungkin pengerjaannya bukan milik akun ini.";
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md text-center">
          <p className="text-sm leading-relaxed text-slate-600">{pesan}</p>
          <Link
            href={state === "noauth" ? "/akun" : "/akun?menu=simulasi"}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: TEAL }}
          >
            <ArrowLeft className="h-4 w-4" />{state === "noauth" ? "Masuk" : "Ke Riwayat Skor"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rpt-page">
      <style>{RPT_CSS}</style>

      {/* Bilah aksi — tak ikut tercetak */}
      <div className="rpt-bar rpt-noprint">
        <Link href={`/akun/simulasi/hasil/${attemptId}`} className="rpt-back">
          <ArrowLeft className="h-4 w-4" />Kembali ke hasil
        </Link>
        <div className="rpt-actions">
          <Link href={`/akun/simulasi/sertifikat/${attemptId}`} className="rpt-alt">
            <Award className="h-4 w-4" />Versi sertifikat
          </Link>
          <button type="button" onClick={() => window.print()} className="rpt-btn">
            <Download className="h-4 w-4" />Unduh PDF
          </button>
        </div>
      </div>

      <ScoreReportSheet data={data} scale={scale} />

      <div className="rpt-tips rpt-noprint">
        <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: TEAL }} />
        <p>
          Lembar ini merangkum hasil simulasimu pada skala {data.official.scaleLabel} — skornya
          <b> perkiraan</b> untuk mengukur posisimu sebelum mendaftar tes asli. Tombol <b>Unduh PDF</b> membuka
          dialog cetak browser: pilih tujuan <b>&ldquo;Simpan sebagai PDF&rdquo;</b> (di HP: <b>Cetak</b> → <b>Simpan sebagai PDF</b>).
        </p>
      </div>

      {/* Gaya bilah aksi & catatan (di luar lembar, tak ikut tercetak). */}
      <style>{`
        .rpt-page { min-height: 100vh; background: #eef2f5; padding: 20px 16px 40px; }
        .rpt-bar { max-width: 860px; margin: 0 auto 14px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
        .rpt-back { display: inline-flex; align-items: center; gap: 6px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; padding: 9px 16px; font-size: 13px; font-weight: 600; color: #475569; }
        .rpt-actions { display: flex; align-items: center; gap: 10px; }
        .rpt-alt { display: inline-flex; align-items: center; gap: 6px; border-radius: 12px; border: 1px solid #cfe6e4; background: #fff; padding: 9px 15px; font-size: 13px; font-weight: 700; color: #0F6E56; }
        .rpt-btn { display: inline-flex; align-items: center; gap: 7px; border-radius: 12px; background: ${TEAL}; padding: 10px 20px; font-size: 13px; font-weight: 700; color: #fff; }
        .rpt-btn:active { transform: scale(.97); }
        .rpt-tips { max-width: 860px; margin: 16px auto 0; display: flex; gap: 8px; border-radius: 14px; border: 1px solid #e2e8f0; background: #fff; padding: 12px 14px; font-size: 12px; line-height: 1.6; color: #64748b; }
        .rpt-tips b { color: #334155; }
      `}</style>
    </div>
  );
}
