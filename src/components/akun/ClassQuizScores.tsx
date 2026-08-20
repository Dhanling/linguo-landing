'use client';

// [nilai-per-pertemuan-v1] Nilai kuis tiap pertemuan di tab Progress siswa.
//
// Pola kelasnya: tiap pertemuan diawali kuis 15–20 menit + pembahasan, jadi setiap
// sesi menghasilkan satu angka. Angkanya diisi pengajar (kuis kertas/lisan) atau
// datang otomatis dari kuis online yang dikoreksi AI — dua-duanya mendarat di
// kolom `schedules.quiz_*`, jadi komponen ini cukup membaca satu sumber.
//
// Bentuknya batang per pertemuan (satu deret, satu warna merek — bukan warna per
// batang: warna di sini menyandi besaran, bukan identitas) + satu angka rata-rata.
// Nilai tiap batang selalu ada di tooltip DAN di label sesi terakhir, jadi tidak
// pernah warna-saja yang menyampaikan informasi.

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getUiLang, useT } from '@/lib/uiLang'; // [ui-lang-switcher-v1]
import {
  ClipboardCheck, TrendingUp, TrendingDown, X, Check, Minus, Sparkles,
  ThumbsUp, AlertTriangle, Target, BookOpen,
} from 'lucide-react';

const BRAND = '#16796E';

// [kuis-sesi-analisis-v1] Rapor kuis: bukan cuma "berapa", tapi KURANGNYA apa dan
// PERBAIKANNYA bagaimana. Dibuat AI sekali waktu koreksi lalu disimpan di
// quiz_submissions.analysis — jadi kalimatnya tetap, dan sama persis dengan yang
// dibaca pengajar di dashboardnya.
interface QuizAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  topics: string[];
}

function parseAnalysis(raw: unknown): QuizAnalysis | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const list = (v: unknown) =>
    Array.isArray(v) ? v.map((x) => String(x ?? '').trim()).filter(Boolean) : [];
  const a: QuizAnalysis = {
    summary: String(o.summary ?? '').trim(),
    strengths: list(o.strengths),
    weaknesses: list(o.weaknesses),
    improvements: list(o.improvements),
    topics: list(o.topics),
  };
  if (!a.summary && !a.strengths.length && !a.weaknesses.length && !a.improvements.length) return null;
  return a;
}

export interface QuizScoreRow {
  id: string;
  sessionNo: number;
  scheduled_at: string;
  quiz_score: number | null;
  quiz_max: number | null;
  quiz_source: string | null;
  quiz_submission_id: string | null;
}

export const quizPct = (score: number | null | undefined, max: number | null | undefined): number | null => {
  const s = Number(score), m = Number(max);
  if (!Number.isFinite(s) || !Number.isFinite(m) || m <= 0) return null;
  return Math.round((s / m) * 100);
};

/** Ambil sesi yang punya nilai, urut kronologis, sudah bernomor seperti timeline. */
export function quizScoreRows(schedules: any[]): QuizScoreRow[] {
  return schedules
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .map((s, i) => ({ ...s, sessionNo: i + 1 }))
    .filter((s) => quizPct(s.quiz_score, s.quiz_max) !== null);
}

export default function ClassQuizScores({ schedules }: { schedules: any[] }) {
  const t = useT(); // [ui-lang-switcher-v1]
  const [reviewFor, setReviewFor] = useState<QuizScoreRow | null>(null);
  const rows = quizScoreRows(schedules);

  if (rows.length === 0) {
    return (
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">{t("Nilai Kuis per Pertemuan")}</h2>
        <div className="rounded-2xl bg-gray-50 p-6 text-center">
          <ClipboardCheck className="mx-auto mb-2 h-7 w-7 text-gray-300" strokeWidth={1.5} />
          <div className="text-sm text-gray-500">{t("Belum ada nilai kuis")}</div>
          <div className="mt-1 text-xs text-gray-400">{t("Nilai kuis tiap pertemuan muncul di sini setelah pengajar mengisinya")}</div>
        </div>
      </section>
    );
  }

  const pcts = rows.map((r) => quizPct(r.quiz_score, r.quiz_max) as number);
  const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  const last = pcts[pcts.length - 1];
  const prev = pcts.length > 1 ? pcts[pcts.length - 2] : null;
  const delta = prev === null ? null : last - prev;

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t("Nilai Kuis per Pertemuan")}</h2>
        <span className="text-[11px] text-gray-400">{rows.length} {t("kuis")}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
        <div className="rounded-2xl bg-white p-4">
          {/* Batang per pertemuan. Skala tetap 0–100% supaya tinggi batang bisa
              dibandingkan antar sesi; grid 50% jadi patokan diam. */}
          <div className="relative flex h-36 items-end gap-1.5 border-b border-gray-200 pb-0">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-gray-200" />
            {rows.map((r) => {
              const pct = quizPct(r.quiz_score, r.quiz_max) as number;
              const isLast = r.id === rows[rows.length - 1].id;
              const clickable = !!r.quiz_submission_id;
              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && setReviewFor(r)}
                  title={`${t('Sesi')} ${r.sessionNo} · ${new Date(r.scheduled_at).toLocaleDateString(getUiLang() === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · ${r.quiz_score}/${r.quiz_max} (${pct}%)${clickable ? ` — ${t('klik untuk lihat pembahasan')}` : ''}`}
                  className={`group relative flex min-w-0 flex-1 flex-col justify-end ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{ height: '100%' }}
                >
                  {isLast && (
                    <span className="mb-1 text-center text-[10px] font-bold" style={{ color: BRAND }}>{pct}%</span>
                  )}
                  <span
                    className="w-full rounded-t transition-opacity group-hover:opacity-80"
                    style={{ height: `${Math.max(pct, 2)}%`, background: BRAND, opacity: isLast ? 1 : 0.55 }}
                  />
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {rows.map((r) => (
              <span key={r.id} className="min-w-0 flex-1 text-center text-[10px] text-gray-400">{r.sessionNo}</span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            {t("Angka di bawah = nomor pertemuan. Batang yang ada pembahasannya bisa diklik.")}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#16796E] to-emerald-600 p-4 text-center text-white">
          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{t("Rata-rata")}</div>
          <div className="text-4xl font-extrabold">{avg}%</div>
          <div className="text-[11px] opacity-80">{t("dari")} {rows.length} {t("kuis")}</div>
          {delta !== null && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
              {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                : delta < 0 ? <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                : <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />}
              {delta > 0 ? `+${delta}` : delta} {t("poin")}
            </div>
          )}
        </div>
      </div>

      {reviewFor && <QuizReviewModal row={reviewFor} onClose={() => setReviewFor(null)} />}
    </section>
  );
}

// ── Rapor kuis ──────────────────────────────────────────────────────────────
// Urutan bloknya disengaja: yang sudah bagus → yang masih kurang → perbaikannya.
// Kalimat "kurang" lebih mudah diterima sesudah siswa melihat apa yang berhasil,
// dan blok terakhir yang tertinggal di ingatan jadi yang bisa dikerjakan — bukan
// daftar kesalahan.
//
// Warna cuma memperkuat; tiap blok selalu punya JUDUL dan IKON sendiri, jadi
// maknanya tidak pernah hanya disandikan lewat warna.
function AnalysisBlock({
  icon: Icon, title, items, ring, tint, fg,
}: {
  icon: typeof ThumbsUp; title: string; items: string[];
  ring: string; tint: string; fg: string;
}) {
  if (!items.length) return null;
  return (
    <div className={`rounded-2xl border ${ring} ${tint} p-3`}>
      <p className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${fg}`}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} /> {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-snug text-gray-700">
            <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${fg.replace('text-', 'bg-')}`} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnalysisPanel({ analysis }: { analysis: QuizAnalysis }) {
  const t = useT(); // [ui-lang-switcher-v1]
  return (
    <div className="mb-4 space-y-2.5">
      <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: BRAND }}>
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} /> {t("Catatan buat kamu")}
      </h3>

      {analysis.summary && (
        <p className="rounded-2xl bg-gray-50 p-3 text-[13px] leading-relaxed text-gray-600">{analysis.summary}</p>
      )}

      {/* Kelas warnanya sengaja TANPA modifier opacity (`bg-emerald-50`, bukan
          `bg-emerald-50/60`): override dark mode di StudentShell menyasar nama
          kelas polos, dan varian /60 lolos dari situ lalu jadi blok terang
          menyilaukan di atas latar hitam. */}
      <AnalysisBlock icon={ThumbsUp} title={t("Sudah bagus")} items={analysis.strengths}
        ring="border-emerald-200" tint="bg-emerald-50" fg="text-emerald-700" />
      <AnalysisBlock icon={AlertTriangle} title={t("Masih kurang")} items={analysis.weaknesses}
        ring="border-amber-200" tint="bg-amber-50" fg="text-amber-700" />
      <AnalysisBlock icon={Target} title={t("Perbaikannya")} items={analysis.improvements}
        ring="border-teal-200" tint="bg-teal-50" fg="text-teal-700" />

      {analysis.topics.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
            <BookOpen className="h-3 w-3" /> {t("Ulang lagi")}:
          </span>
          {analysis.topics.map((t, i) => (
            <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pembahasan per soal ─────────────────────────────────────────────────────
// Kunci jawaban & pembahasan baru boleh dibaca siswa SETELAH kuisnya dikoreksi —
// itu ditegakkan di RLS (policy quiz_questions_own_read → quiz_my_graded_set_ids),
// bukan di sini. Kalau kebijakannya belum dimigrasi, query balik kosong dan modal
// ini menampilkan pesan, bukan layar rusak.
interface AnswerRow {
  id: string;
  response: any;
  is_correct: boolean | null;
  score: number | null;
  feedback: string | null;
  quiz_questions: any;
}

export function QuizReviewModal({ row, onClose }: { row: QuizScoreRow; onClose: () => void }) {
  const t = useT(); // [ui-lang-switcher-v1]
  const [answers, setAnswers] = useState<AnswerRow[] | null>(null);
  const [analysis, setAnalysis] = useState<QuizAnalysis | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('quiz_answers')
        .select('id, response, is_correct, score, feedback, quiz_questions(prompt, options, explanation, points, sort_order)')
        .eq('submission_id', row.quiz_submission_id);
      if (!alive) return;
      const sorted = ((data || []) as any[]).sort(
        (a, b) => (a.quiz_questions?.sort_order ?? 0) - (b.quiz_questions?.sort_order ?? 0),
      );
      setAnswers(sorted as AnswerRow[]);
    })();

    // Rapornya query terpisah, dan sengaja TIDAK memblokir pembahasan per soal:
    // kalau kolomnya belum dimigrasi atau rapornya gagal dibuat, siswa tetap
    // mendapat koreksinya. Dibaca lewat policy quiz_submissions_own_read.
    (async () => {
      const { data } = await supabase
        .from('quiz_submissions')
        .select('analysis')
        .eq('id', row.quiz_submission_id)
        .maybeSingle();
      if (!alive) return;
      setAnalysis(parseAnalysis((data as any)?.analysis));
    })();

    return () => { alive = false; };
  }, [row.quiz_submission_id]);

  const pct = quizPct(row.quiz_score, row.quiz_max);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: BRAND }}>{t("Pembahasan")} · {t("Sesi")} {row.sessionNo}</div>
            <div className="text-sm font-semibold text-gray-900">
              {t("Nilai")} {row.quiz_score}/{row.quiz_max}{pct !== null ? ` · ${pct}%` : ''}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100" aria-label={t('Tutup')}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Rapor dulu, baru soal per soal. Siswa yang buru-buru cuma membaca yang
            paling atas — jadi yang paling atas harus "harus ngapain", bukan daftar
            20 soal yang menuntut dia menyimpulkan sendiri. */}
        {analysis && <AnalysisPanel analysis={analysis} />}

        {answers === null ? (
          <div className="py-8 text-center text-sm text-gray-400">{t("Memuat pembahasan…")}</div>
        ) : answers.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
            {t("Pembahasan belum tersedia untuk kuis ini.")}
          </div>
        ) : (
          <div className="space-y-2.5">
            <h3 className="pt-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">{t("Koreksi per soal")}</h3>
            {answers.map((a, i) => {
              const q = a.quiz_questions || {};
              const ok = a.is_correct === true;
              return (
                /* bg tanpa /60 — lihat catatan di AnalysisPanel soal dark mode. */
                <div key={a.id} className={`rounded-2xl border p-3 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[10px] font-bold text-gray-600">{i + 1}</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
                      {ok ? t('Benar') : t('Belum tepat')}
                    </span>
                    <span className="ml-auto text-[11px] font-semibold text-gray-500">{a.score ?? 0}/{q.points ?? 1} {t("poin")}</span>
                  </div>
                  <p className="text-[13px] font-medium text-gray-800">{q.prompt}</p>
                  {a.feedback && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-white px-3 py-2 text-[13px] text-gray-600">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: BRAND }} strokeWidth={2} />
                      <span>{a.feedback}</span>
                    </p>
                  )}
                  {q.explanation && (
                    <p className="mt-1.5 text-[12px] text-gray-500"><span className="font-semibold">{t('Pembahasan')}:</span> {q.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
