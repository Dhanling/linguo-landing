"use client";

// [sim-riwayat-v1] Panel "Riwayat Skor" di tab Simulasi Tes.
// Keluhan siswa: skor cuma kelihatan sekali pas selesai, begitu halaman ditutup
// tak ketemu lagi. Panel ini menampilkan semua pengerjaan yang sudah dikumpulkan
// beserta skor pada SKALA RESMI (lihat lib/simScore) + selisih dari percobaan
// sebelumnya, dan tiap baris bisa dibuka lagi lengkap dengan pembahasannya.
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMyAttempts, testTypeLabel, type AttemptSummary } from "@/lib/simulations";
import { officialScore, type OfficialScore } from "@/lib/simScore";
import { History, ArrowRight, Loader2, TrendingUp, TrendingDown, Minus, ClipboardCheck } from "lucide-react";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";

// [perf] cache modul: pindah tab lalu balik → langsung render tanpa spinner.
let riwayatCache: Row[] | null = null;

interface Row {
  attempt: AttemptSummary;
  official: OfficialScore | null;
  delta: number | null; // selisih skor resmi vs percobaan sebelumnya (jenis+varian sama)
  blank: boolean; // dikumpulkan tanpa satu pun jawaban → tak bisa dikonversi
}

const fmtTanggal = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "—";

function buildRows(attempts: AttemptSummary[]): Row[] {
  const rows: Row[] = attempts.map((attempt) => ({
    attempt,
    official: officialScore({
      testType: attempt.test_type,
      variant: attempt.test_variant,
      title: attempt.title,
      skills: attempt.skills,
      aggregate: { score: attempt.score, max: attempt.max_score },
    }),
    delta: null,
    blank: attempt.skills.length > 0 && attempt.skills.every((s) => (s.answered ?? 0) === 0),
  }));
  // Selisih dibanding percobaan SEBELUMNYA pada skala yang sama (attempt terbaru
  // di indeks 0, jadi pembandingnya ada di indeks yang lebih besar).
  rows.forEach((r, i) => {
    if (!r.official) return;
    for (let j = i + 1; j < rows.length; j++) {
      const prev = rows[j];
      if (prev.official && prev.official.scale === r.official.scale) {
        r.delta = Number(r.official.headline) - Number(prev.official.headline);
        break;
      }
    }
  });
  return rows;
}

export default function RiwayatSkor() {
  const [rows, setRows] = useState<Row[]>(riwayatCache ?? []);
  const [loading, setLoading] = useState(!riwayatCache);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const attempts = await fetchMyAttempts();
      if (!alive) return;
      const next = buildRows(attempts);
      riwayatCache = next;
      setRows(next);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />Memuat riwayat skor…
      </div>
    );
  }

  // Belum pernah mengerjakan → jangan bikin tab penuh panel kosong.
  if (rows.length === 0) return null;

  const shown = showAll ? rows : rows.slice(0, 3);

  return (
    <section className="mb-6 overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <History className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold text-[#12172B]">Riwayat Skor</h2>
          <p className="text-[12px] text-gray-500">{rows.length} pengerjaan tersimpan — klik untuk lihat skor &amp; pembahasannya lagi</p>
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {shown.map(({ attempt, official, delta, blank }) => (
          <li key={attempt.id}>
            <Link
              href={`/akun/simulasi/hasil/${attempt.id}`}
              className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: attempt.test_type === "toefl" ? "#2563eb" : attempt.test_type === "ielts" ? "#e11d48" : TEAL_DEEP }}
              >
                <ClipboardCheck className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{attempt.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-slate-500">
                  <span>{testTypeLabel(attempt.test_type, attempt.test_variant)}</span>
                  <span className="text-slate-300">·</span>
                  <span>{fmtTanggal(attempt.submitted_at)}</span>
                  {attempt.max_score != null && attempt.score != null && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>{Math.round(attempt.score)}/{Math.round(attempt.max_score)} poin</span>
                    </>
                  )}
                </p>
              </div>

              <div className="shrink-0 text-right">
                {official ? (
                  <>
                    <p className="text-lg font-extrabold leading-none" style={{ color: TEAL_DEEP }}>
                      {official.headline}
                      <span className="ml-1 text-[11px] font-bold text-slate-400">{official.unit}</span>
                    </p>
                    {delta != null && delta !== 0 ? (
                      <p className={`mt-1 flex items-center justify-end gap-0.5 text-[11px] font-bold ${delta > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {delta > 0 ? "+" : ""}{Number(delta.toFixed(1))}
                      </p>
                    ) : delta === 0 ? (
                      <p className="mt-1 flex items-center justify-end gap-0.5 text-[11px] font-semibold text-slate-400">
                        <Minus className="h-3 w-3" />sama
                      </p>
                    ) : (
                      official.verdict && (
                        <p className="mt-1 text-[11px] font-semibold text-slate-400">{official.verdict}</p>
                      )
                    )}
                  </>
                ) : (
                  <p className="text-sm font-bold text-slate-400">
                    {blank ? "Tidak dijawab" : attempt.score === 0 ? "Belum ada jawaban benar" : "Belum dinilai"}
                  </p>
                )}
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          </li>
        ))}
      </ul>

      {rows.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="w-full border-t border-slate-100 py-2.5 text-[13px] font-semibold transition hover:bg-slate-50"
          style={{ color: TEAL }}
        >
          {showAll ? "Tampilkan lebih sedikit" : `Lihat semua ${rows.length} pengerjaan`}
        </button>
      )}
    </section>
  );
}
