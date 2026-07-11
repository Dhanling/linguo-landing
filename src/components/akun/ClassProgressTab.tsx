'use client';

// [kelas-tab-v1] Tab Progress di detail kelas siswa.
// Dua bagian, semua datanya SUDAH diisi pengajar dari dashboard-nya:
//   1. Skill CEFR — 4 skill (student_skills, skor 1–5 → band A1–C1, skala &
//      konversi sama persis dgn TeacherDashboard catatan-progress-v1).
//   2. Timeline sesi — laporan tiap sesi completed dari schedules (topik/PR/
//      catatan diparse dari notes via class-notes.ts, presensi & recording
//      dari kolomnya sendiri). Terbaru di atas.

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { parseSessionNotes, ATTENDANCE_BADGE } from '@/components/akun/class-notes';
import { Mic, Headphones, BookOpen, PenLine, TrendingUp, Video, ClipboardList, MessageCircle, type LucideIcon } from 'lucide-react';

const SKILLS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: 'speaking', label: 'Speaking', Icon: Mic },
  { key: 'listening', label: 'Listening', Icon: Headphones },
  { key: 'reading', label: 'Reading', Icon: BookOpen },
  { key: 'writing', label: 'Writing', Icon: PenLine },
];

// Skor 1–5 → band CEFR (samakan dgn CEFR_LEVELS di TeacherDashboard).
const CEFR_LEVELS = [
  { band: 'A1', name: 'Pemula' },
  { band: 'A2', name: 'Dasar' },
  { band: 'B1', name: 'Menengah' },
  { band: 'B2', name: 'Menengah Atas' },
  { band: 'C1', name: 'Mahir' },
];
export const cefr = (score: number) => CEFR_LEVELS[Math.min(5, Math.max(1, Math.round(score))) - 1];

export default function ClassProgressTab({ reg, schedules }: { reg: any; schedules: any[] }) {
  // null = masih loading; [] = kosong / gagal (tampilkan placeholder, jangan crash)
  const [skills, setSkills] = useState<any[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from('student_skills')
        .select('skill, score, notes, updated_at')
        .eq('registration_id', reg.id);
      if (!alive) return;
      if (error) {
        // Policy/tabel belum siap → tampilkan bagian timeline saja.
        console.warn('[kelas-progress] gagal load student_skills:', error.message);
        setSkills([]);
        return;
      }
      setSkills(data || []);
    })();
    return () => { alive = false; };
  }, [reg.id]);

  const skillMap: Record<string, any> = {};
  (skills || []).forEach((r) => { skillMap[r.skill] = r; });
  const rated = SKILLS.filter((s) => skillMap[s.key]?.score);
  const avg = rated.length ? rated.reduce((a, s) => a + skillMap[s.key].score, 0) / rated.length : 0;
  const latestUpdate = (skills || []).reduce<string | null>(
    (acc, r) => (r.updated_at && (!acc || r.updated_at > acc) ? r.updated_at : acc), null);

  // Timeline: sesi completed, nomor urut kronologis, tampil terbaru dulu.
  const completedChrono = schedules
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const timeline = completedChrono
    .map((s, i) => ({ ...s, sessionNo: i + 1 }))
    .reverse();

  return (
    <div className="space-y-8">
      {/* ── Skill CEFR ── */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Kemampuan 4 Skill · CEFR</h2>
          {latestUpdate && (
            <span className="text-[11px] text-gray-400">
              Dinilai pengajar · {new Date(latestUpdate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {skills === null ? (
          <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-400">Memuat…</div>
        ) : rated.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-6 text-center">
            <TrendingUp className="mx-auto mb-2 h-7 w-7 text-gray-300" strokeWidth={1.5} />
            <div className="text-sm text-gray-500">Pengajar belum mengisi penilaian skill</div>
            <div className="mt-1 text-xs text-gray-400">Penilaian muncul di sini setelah pengajar mengisi Catatan Progress</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
              {SKILLS.map(({ key, label, Icon }) => {
                const row = skillMap[key];
                const score = row?.score || 0;
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-800">
                        <Icon className="h-4 w-4 text-[#16796E]" strokeWidth={2} /> {label}
                      </span>
                      {score ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#16796E]">
                          <span className="rounded bg-[#16796E]/10 px-1.5 py-0.5 text-xs">{cefr(score).band}</span>
                          {cefr(score).name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">belum dinilai</span>
                      )}
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#16796E] to-emerald-500 transition-all" style={{ width: `${(score / 5) * 100}%` }} />
                    </div>
                    {row?.notes && <div className="mt-1 text-[11px] text-gray-500">💬 {row.notes}</div>}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#16796E] to-emerald-600 p-4 text-center text-white">
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Rata-rata</div>
              <div className="text-4xl font-extrabold">{avg ? avg.toFixed(1) : '-'}</div>
              <div className="text-[11px] opacity-80">dari 5.0</div>
              {avg > 0 && (
                <div className="mt-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                  ≈ {cefr(avg).band} · {cefr(avg).name}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Timeline sesi ── */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Perjalanan Belajar ({timeline.length} sesi)</h2>
        {timeline.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-6 text-center">
            <ClipboardList className="mx-auto mb-2 h-7 w-7 text-gray-300" strokeWidth={1.5} />
            <div className="text-sm text-gray-500">Belum ada sesi yang selesai</div>
            <div className="mt-1 text-xs text-gray-400">Setiap sesi selesai, laporan pengajar (topik, PR, recording) tampil di sini</div>
          </div>
        ) : (
          <div className="relative space-y-3 pl-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-gray-200">
            {timeline.map((s) => {
              const parsed = parseSessionNotes(s.notes);
              const att = ATTENDANCE_BADGE[s.attendance_status] || null;
              return (
                <div key={s.id} className="relative rounded-2xl border border-gray-200 bg-white p-4">
                  <span className="absolute -left-[19px] top-5 h-3 w-3 rounded-full border-2 border-white bg-[#16796E]" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#16796E]">Sesi {s.sessionNo}</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(s.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    {att && <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${att.cls}`}>{att.label}</span>}
                  </div>

                  {(parsed.topic || parsed.homework || parsed.message || parsed.extras.length > 0) && (
                    <div className="mt-2.5 space-y-1.5 border-t border-gray-100 pt-2.5 text-[13px]">
                      {parsed.topic && <div><span className="font-semibold text-gray-700">📚 Topik:</span> <span className="text-gray-600">{parsed.topic}</span></div>}
                      {parsed.homework && <div><span className="font-semibold text-gray-700">📝 PR:</span> <span className="text-gray-600">{parsed.homework}</span></div>}
                      {parsed.message && (
                        <div className="flex items-start gap-1.5 rounded-xl bg-[#F0FAF8] px-3 py-2 text-gray-700">
                          <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#16796E]" strokeWidth={2} />
                          <span>{parsed.message}</span>
                        </div>
                      )}
                      {parsed.extras.map((line, i) => <div key={i} className="text-gray-500">{line}</div>)}
                    </div>
                  )}

                  {s.recording_url && (
                    <a
                      href={s.recording_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                    >
                      <Video className="h-3.5 w-3.5" strokeWidth={2.5} /> Tonton Recording
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
