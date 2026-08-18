'use client';

// [kelas-tab-kuis-v1] Tab Kuis di detail kelas siswa — dulu tab "Tugas".
//
// Kuis tiap pertemuan adalah umpan balik paling sering yang diterima siswa
// (satu angka per sesi), tapi selama ini terkubur di tengah tab Progress.
// Sekarang punya tabnya sendiri: grafik skor antar pertemuan + daftar kuis
// lengkap dengan jumlah benar/salah, dan pembahasan per soal sekali klik.
//
// Sumber datanya SATU: `schedules.quiz_*` (diisi pengajar atau hasil koreksi AI)
// dan `quiz_answers` untuk rincian benar/salah — sama persis dengan yang dibaca
// pengajar di dashboardnya, jadi angkanya tak pernah beda.
//
// PR (`schedules.homework`) tidak ikut dihapus: kalau pengajar memberi PR,
// bloknya tetap muncul di bawah supaya setoran siswa tidak kehilangan pintu.

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import ClassQuizScores, { QuizReviewModal, quizScoreRows, quizPct, type QuizScoreRow } from '@/components/akun/ClassQuizScores';
import ClassTugasTab from '@/components/akun/ClassTugasTab';
import { ClipboardCheck, Check, X, ChevronRight } from 'lucide-react';

export default function ClassKuisTab({ reg, schedules }: { reg: any; schedules: any[] }) {
  const rows = quizScoreRows(schedules);
  const [detail, setDetail] = useState<QuizScoreRow | null>(null);
  // Rincian benar/salah per kuis. Dihitung dari `quiz_answers` — bukan dari
  // skor, karena bobot poin tiap soal bisa berbeda (skor 8/10 tidak otomatis
  // berarti 2 soal salah).
  const [tally, setTally] = useState<Record<string, { benar: number; salah: number }>>({});

  const subIds = rows.map((r) => r.quiz_submission_id).filter(Boolean) as string[];
  const subKey = subIds.join(',');

  useEffect(() => {
    if (!subKey) { setTally({}); return; }
    let alive = true;
    (async () => {
      // Boleh gagal (RLS/kolom belum dimigrasi): kalau kosong, kartunya cuma
      // tidak menampilkan chip benar/salah — halaman TIDAK boleh ikut error.
      const { data } = await supabase
        .from('quiz_answers')
        .select('submission_id, is_correct')
        .in('submission_id', subKey.split(','));
      if (!alive) return;
      const map: Record<string, { benar: number; salah: number }> = {};
      (data || []).forEach((a: any) => {
        const cur = map[a.submission_id] || { benar: 0, salah: 0 };
        if (a.is_correct === true) cur.benar += 1;
        else if (a.is_correct === false) cur.salah += 1;
        map[a.submission_id] = cur;
      });
      setTally(map);
    })();
    return () => { alive = false; };
  }, [subKey]);

  const adaPR = schedules.some((s: any) => (s.homework || '').trim());

  return (
    <div className="space-y-7">
      {/* Grafik + rata-rata (komponen yang sama dengan yang dulu di tab Progress) */}
      <ClassQuizScores schedules={schedules} />

      {rows.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Rincian per Kuis</h2>
          <ul className="space-y-2">
            {[...rows].reverse().map((r) => {
              const pct = quizPct(r.quiz_score, r.quiz_max);
              const t = r.quiz_submission_id ? tally[r.quiz_submission_id] : null;
              const bisaDibuka = !!r.quiz_submission_id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={!bisaDibuka}
                    onClick={() => bisaDibuka && setDetail(r)}
                    className={`flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 text-left ${bisaDibuka ? 'hover:border-[#16796E]/40 hover:bg-teal-50/40' : 'cursor-default'}`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-[13px] font-extrabold text-[#16796E]">
                      {pct !== null ? `${pct}` : '–'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-[#12172B]">
                        Sesi {r.sessionNo}
                        <span className="ml-2 text-xs font-semibold text-gray-500">
                          {r.quiz_score}/{r.quiz_max} poin
                        </span>
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
                        {new Date(r.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {t && (t.benar + t.salah) > 0 && (
                          <>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                              <Check className="h-3 w-3" strokeWidth={3} />{t.benar} benar
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-700">
                              <X className="h-3 w-3" strokeWidth={3} />{t.salah} salah
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                    {bisaDibuka && <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" strokeWidth={2.4} />}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] text-gray-400">
            <ClipboardCheck className="mr-1 inline h-3 w-3 align-[-2px]" strokeWidth={2.2} />
            Klik kuis untuk melihat pembahasan tiap soal beserta catatan perbaikannya.
          </p>
        </section>
      )}

      {/* PR tetap punya tempat — cuma muncul kalau pengajar benar-benar memberi PR. */}
      {adaPR && (
        <section className="border-t border-gray-100 pt-6">
          <ClassTugasTab reg={reg} schedules={schedules} />
        </section>
      )}

      {detail && <QuizReviewModal row={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
