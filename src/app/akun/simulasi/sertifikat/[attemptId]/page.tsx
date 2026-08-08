"use client";

// [sim-certificate-v1] Sertifikat hasil simulasi — lembar A4 landscape yang bisa
// diunduh siswa (Cetak → "Simpan sebagai PDF").
//
// Datanya disusun ulang dari simulation_attempts + simulation_answers persis
// seperti halaman hasil (RLS: hanya baris sendiri), lalu skornya dikonversi ke
// SKALA RESMI lewat lib/simScore. Tak ada tabel/kolom baru: sertifikat murni
// turunan tampilan, jadi tak ada yang bisa basi.
//
// Sengaja TANPA pustaka PDF: lembarnya dirender HTML seukuran A4 lalu diserahkan
// ke dialog cetak browser — hasilnya vektor, teksnya bisa diseleksi, dan bundel
// tak bertambah berat (lihat components/akun/simulasi/CertificateSheet).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchAttemptReview, getStudentInfo, testTypeLabel } from "@/lib/simulations";
import { officialScore } from "@/lib/simScore";
import {
  canIssueCertificate, certificateFileTitle, certificateName, certificateNumber,
} from "@/lib/simCertificate";
import CertificateSheet, {
  CERT_CSS, SHEET_W, type CertificateData,
} from "@/components/akun/simulasi/CertificateSheet";
import { ArrowLeft, Download, FileText, Loader2, ShieldCheck } from "lucide-react";

const TEAL = "#1A9E9E";

export default function SertifikatSimulasiPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params?.attemptId as string;
  const [state, setState] = useState<"loading" | "ready" | "noauth" | "notfound" | "notyet">("loading");
  const [data, setData] = useState<CertificateData | null>(null);
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
      // Lembar kosong / belum dinilai tak diterbitkan sertifikatnya.
      if (!canIssueCertificate(attempt, official) || !official) { setState("notyet"); return; }

      setData({
        name: certificateName(attempt.student_name, info.name),
        title: attempt.title,
        testLabel: testTypeLabel(attempt.test_type, attempt.test_variant),
        official,
        submittedAt: attempt.submitted_at,
        rawScore: attempt.score ?? 0,
        rawMax: attempt.max_score ?? 0,
        correct: answers.filter((a) => a.is_correct === true).length,
        objective: answers.filter((a) => a.is_correct != null).length,
        certNo: certificateNumber(attempt.id, attempt.submitted_at),
      });
      setState("ready");
    })();
    return () => { alive = false; };
  }, [attemptId]);

  // Lembar berukuran tetap → dikecilkan proporsional biar muat di layar HP.
  // Saat mencetak, transform-nya dimatikan (lihat @media print di CERT_CSS)
  // supaya ukurannya kembali persis A4.
  useEffect(() => {
    const fit = () => {
      const avail = Math.min(window.innerWidth - 32, 1180);
      setScale(Math.min(1, avail / SHEET_W));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Judul dokumen = nama berkas default saat "Simpan sebagai PDF".
  useEffect(() => {
    if (!data) return;
    const before = document.title;
    document.title = certificateFileTitle(data.name, data.official.scaleLabel);
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
      state === "noauth" ? "Masuk dulu untuk mengunduh sertifikatmu."
      : state === "notyet" ? "Sertifikat terbit setelah simulasi dikumpulkan dan hasilnya bisa dikonversi ke skala resmi. Pengerjaan tanpa satu pun jawaban benar belum bisa disertifikatkan — silakan kerjakan ulang simulasinya."
      : "Sertifikat ini tidak ditemukan — mungkin pengerjaannya bukan milik akun ini.";
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
    <div className="sert-page">
      <style>{CERT_CSS}</style>

      {/* Bilah aksi — tak ikut tercetak */}
      <div className="sert-bar sert-noprint">
        <Link href={`/akun/simulasi/hasil/${attemptId}`} className="sert-back">
          <ArrowLeft className="h-4 w-4" />Kembali ke hasil
        </Link>
        <div className="sert-actions">
          <span className="sert-hint">Pilih tujuan <b>&ldquo;Simpan sebagai PDF&rdquo;</b> di dialog cetak</span>
          {/* [sim-score-report-v1] lembar potret berisi rincian angka — untuk
              keperluan yang butuh data, bukan lembar apresiasi. */}
          <Link href={`/akun/simulasi/laporan/${attemptId}`} className="sert-alt">
            <FileText className="h-4 w-4" />Versi laporan skor
          </Link>
          <button type="button" onClick={() => window.print()} className="sert-btn">
            <Download className="h-4 w-4" />Unduh PDF
          </button>
        </div>
      </div>

      <CertificateSheet data={data} scale={scale} />

      <div className="sert-tips sert-noprint">
        <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: TEAL }} />
        <p>
          Skor di sertifikat ini perkiraan untuk mengukur posisimu sebelum mendaftar tes asli.
          Tombol <b>Unduh PDF</b> membuka dialog cetak browser — di HP pilih <b>Cetak</b> lalu <b>Simpan sebagai PDF</b>.
        </p>
      </div>

      {/* Gaya bilah aksi & catatan (di luar lembar, tak ikut tercetak). */}
      <style>{`
        .sert-page { min-height: 100vh; background: #eef2f5; padding: 20px 16px 40px; }
        .sert-bar { max-width: 1180px; margin: 0 auto 14px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
        .sert-back { display: inline-flex; align-items: center; gap: 6px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; padding: 9px 16px; font-size: 13px; font-weight: 600; color: #475569; }
        .sert-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
        .sert-alt { display: inline-flex; align-items: center; gap: 6px; border-radius: 12px; border: 1px solid #cfe6e4; background: #fff; padding: 9px 15px; font-size: 13px; font-weight: 700; color: #0F6E56; }
        .sert-hint { font-size: 12px; color: #64748b; }
        .sert-btn { display: inline-flex; align-items: center; gap: 7px; border-radius: 12px; background: ${TEAL}; padding: 10px 20px; font-size: 13px; font-weight: 700; color: #fff; }
        .sert-btn:active { transform: scale(.97); }
        .sert-tips { max-width: 1180px; margin: 16px auto 0; display: flex; gap: 8px; border-radius: 14px; border: 1px solid #e2e8f0; background: #fff; padding: 12px 14px; font-size: 12px; line-height: 1.6; color: #64748b; }
      `}</style>
    </div>
  );
}
