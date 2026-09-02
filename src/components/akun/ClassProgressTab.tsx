'use client';

// [kelas-tab-v1] Tab Progress di detail kelas siswa.
// Dua bagian, semua datanya SUDAH diisi pengajar dari dashboard-nya:
//   1. Skill CEFR — 4 skill (student_skills, skor 1–5 → band A1–C1, skala &
//      konversi sama persis dgn TeacherDashboard catatan-progress-v1).
//   2. Timeline sesi — laporan tiap sesi completed dari schedules (topik/PR/
//      catatan diparse dari notes via class-notes.ts, presensi & recording
//      dari kolomnya sendiri). Terbaru di atas.
//
// [progress-delta-v1] Skor sekarang saja tidak menjawab "aku maju berapa".
// Pembanding diambil dari rapor terbit terakhir (class_reports) lewat
// fetchSkillProgressFor, lalu ditampilkan sebagai bar bayangan + panah naik/turun
// dengan rentang periodenya. Progres juga bisa dibagikan / dicetak.

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { parseSessionNotes, ATTENDANCE_BADGE } from '@/components/akun/class-notes';
import { isPlayableRecording, studentRecordingHref } from '@/lib/classRoom';
import RecordingModal from './RecordingModal';
import { fetchSkillProgressFor, type SkillProgress } from '@/lib/studentInsights';
import { shareProgress, printProgressCard, periodLabel } from '@/lib/shareProgress';
import { SkillRow } from '@/components/akun/SkillBar';
import { useT, useUiLang } from '@/lib/uiLang'; // [ui-lang-switcher-v1]
// [nilai-per-pertemuan-v1] nilai kuis tiap pertemuan (schedules.quiz_*)
import { quizPct } from '@/components/akun/ClassQuizScores';
import { Mic, Headphones, BookOpen, PenLine, TrendingUp, Video, ClipboardList, MessageCircle, Share2, Printer, Check, type LucideIcon } from 'lucide-react';

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

// [presensi-blocks-v1] Warna solid blok presensi — samakan dgn ATT_META di admin
// Registrations (reg-attendance-blocks-v1) & ATTENDANCE_BADGE di class-notes.
const ATT_SOLID: Record<string, { label: string; solid: string; dot: string }> = {
  hadir: { label: 'Hadir', solid: 'bg-emerald-500', dot: 'bg-emerald-500' },
  izin:  { label: 'Izin',  solid: 'bg-amber-500',   dot: 'bg-amber-500' },
  sakit: { label: 'Sakit', solid: 'bg-sky-500',     dot: 'bg-sky-500' },
  alpa:  { label: 'Alpa',  solid: 'bg-red-500',     dot: 'bg-red-500' },
};
const ATT_ORDER = ['hadir', 'izin', 'sakit', 'alpa'] as const;

export default function ClassProgressTab({ reg, schedules }: { reg: any; schedules: any[] }) {
  const t = useT(); // [ui-lang-switcher-v1]
  const uiLang = useUiLang();
  const dateLocale = uiLang === 'en' ? 'en-GB' : 'id-ID';
  // undefined = masih loading; null = kosong / gagal (tampilkan placeholder, jangan crash)
  const [prog, setProg] = useState<SkillProgress | null | undefined>(undefined);
  const [studentName, setStudentName] = useState('Siswa');
  // [progress-delta-v1] status tombol bagikan: '' | 'copied' | 'failed'
  const [shareState, setShareState] = useState('');
  // [vc-recmodal-v1] Rekaman yang sedang ditonton di pop-up halaman ini.
  const [rekaman, setRekaman] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [p, stu] = await Promise.all([
        fetchSkillProgressFor(reg.id),
        reg.student_id
          ? supabase.from('students').select('name').eq('id', reg.student_id).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      if (!alive) return;
      setProg(p);
      if (stu?.data?.name) setStudentName(stu.data.name);
    })();
    return () => { alive = false; };
  }, [reg.id, reg.student_id]);

  const skillMap: Record<string, any> = {};
  (prog?.skills || []).forEach((s) => { skillMap[s.key] = s; });
  const rated = SKILLS.filter((s) => skillMap[s.key]?.score);
  const avg = prog?.avg || 0;
  const avgBefore = prog?.avgBefore ?? null;
  const periode = periodLabel(prog?.periodStart ?? null, prog?.periodEnd ?? null);

  const shareData = {
    studentName,
    language: reg.language || 'Bahasa',
    level: reg.level || null,
    skills: prog?.skills || [],
    avg,
    avgBefore,
    periodStart: prog?.periodStart ?? null,
    periodEnd: prog?.periodEnd ?? null,
  };

  const onShare = async () => {
    const r = await shareProgress(shareData);
    if (r === 'copied') setShareState('copied');
    else if (r === 'failed') setShareState('failed');
    window.setTimeout(() => setShareState(''), 2200);
  };

  // Timeline: sesi completed, nomor urut kronologis, tampil terbaru dulu.
  const completedChrono = schedules
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const bernomor = completedChrono.map((s, i) => ({ ...s, sessionNo: i + 1 }));

  // [sesi-sehari-gabung-v1] Kelas 2 sesi sekaligus (blok 2 jam) itu SATU kali
  // datang buat siswa — dulu linimasanya menampilkan dua kartu dengan tanggal
  // yang sama persis, terbaca seolah dia kelas dua hari. Sesi selesai di HARI
  // yang sama sekarang dilebur jadi satu kartu bernomor rentang (mis. "Sesi 5–6"),
  // isinya (topik/PR/catatan/rekaman) tetap lengkap per sesi di dalamnya.
  // Hitungan di judul tetap SESI, bukan kartu — lihat [[sesi-beruntun-kartu-gabung]].
  const hariKey = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };
  type Blok = { key: string; hari: string; items: typeof bernomor };
  const blokChrono: Blok[] = [];
  for (const s of bernomor) {
    const hari = hariKey(s.scheduled_at);
    const last = blokChrono[blokChrono.length - 1];
    if (last && last.hari === hari) last.items.push(s);
    else blokChrono.push({ key: s.id, hari, items: [s] });
  }
  const timeline = blokChrono.slice().reverse();

  // [presensi-blocks-v1] Grid presensi read-only — jumlah blok dari sessions_total
  // (bukan dari baris `schedules`, sama seperti admin Registrations), jadi tetap
  // tampil walau sesi belum tercatat. Sesi yg SUDAH jalan (i < used): warna sesuai
  // attendance_status baris schedules yg session_number-nya cocok, default 'hadir'
  // (samakan default admin). Sesi belum jalan: abu-abu. Siswa TIDAK bisa mengubah.
  const total = reg.sessions_total || 0;
  // [blok-sync-v2] kolom sessions_used bisa tertinggal dari presensi yang benar-benar
  // tercatat di `schedules` (sesi ditandai selesai lewat menu Jadwal / konfirmasi siswa
  // hanya menyentuh baris schedule). Dashboard pengajar memakai yang terbesar, jadi tanpa
  // ini siswa bisa melihat 5/16 untuk kelas yang di sisi pengajar sudah 15/16.
  const rawUsed = Math.max(reg.sessions_used || 0, completedChrono.length);
  const used = total > 0 ? Math.min(rawUsed, total) : rawUsed;
  const rowBySession: Record<number, any> = {};
  schedules.forEach((s) => { if (s.session_number) rowBySession[s.session_number] = s; });
  const attStatus = (i: number): string => {
    const st = rowBySession[i + 1]?.attendance_status;
    return st && ATT_SOLID[st] ? st : 'hadir';
  };
  const attCounts = { hadir: 0, izin: 0, sakit: 0, alpa: 0 } as Record<string, number>;
  for (let i = 0; i < used; i++) attCounts[attStatus(i)]++;
  const hadirRate = used ? Math.round((attCounts.hadir / used) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* ── Presensi ── */}
      {total > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('Presensi')}</h2>
            <span className="text-[11px] text-gray-400">{used}/{total} {t('sesi berjalan')}</span>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-gray-700">{t('Kehadiran')}</span>
              <span className="inline-flex items-baseline gap-1 text-[13px] font-bold text-[#16796E]">
                <span className="text-xl">{hadirRate}%</span>
                <span className="text-[11px] font-medium text-gray-400">({attCounts.hadir}/{used || 0})</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: total }).map((_, i) => {
                if (i >= used) {
                  return (
                    <div
                      key={i}
                      title={`${t('Sesi')} ${i + 1} — ${t('belum berjalan')}`}
                      className="flex h-8 w-8 select-none items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-[10px] text-gray-300"
                    >
                      {i + 1}
                    </div>
                  );
                }
                const meta = ATT_SOLID[attStatus(i)];
                return (
                  <div
                    key={i}
                    title={`${t('Sesi')} ${i + 1} — ${t(meta.label)}`}
                    className={`flex h-8 w-8 select-none items-center justify-center rounded-md text-[10px] font-semibold text-white ${meta.solid}`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-3 text-[11px] text-gray-500">
              {ATT_ORDER.map((k) => (
                <span key={k} className="inline-flex items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-sm ${ATT_SOLID[k].dot}`} />
                  {t(ATT_SOLID[k].label)}{attCounts[k] ? ` ${attCounts[k]}` : ''}
                </span>
              ))}
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-gray-300 bg-gray-50" />
                {t('Belum jalan')}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Skill CEFR ── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">{t('Kemampuan 4 Skill · CEFR')}</h2>
            {/* [progress-delta-v1] rentang periode: dari rapor pembanding sampai
                penilaian terakhir. Tanpa ini angka progres kehilangan konteks. */}
            {periode && <p className="mt-0.5 text-[11px] font-semibold text-gray-400">{periode}</p>}
          </div>
          {rated.length > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={onShare}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#16796E]/10 px-3 py-2 text-xs font-bold text-[#16796E] transition hover:bg-[#16796E]/15"
              >
                {shareState === 'copied' ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Share2 className="h-3.5 w-3.5" strokeWidth={2.5} />}
                {shareState === 'copied' ? t('Tersalin') : shareState === 'failed' ? t('Gagal') : t('Bagikan')}
              </button>
              <button
                onClick={() => printProgressCard(shareData)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                <Printer className="h-3.5 w-3.5" strokeWidth={2.5} /> {t('Cetak')}
              </button>
            </div>
          )}
        </div>

        {prog === undefined ? (
          <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-400">{t('Memuat…')}</div>
        ) : rated.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-6 text-center">
            <TrendingUp className="mx-auto mb-2 h-7 w-7 text-gray-300" strokeWidth={1.5} />
            <div className="text-sm text-gray-500">{t('Pengajar belum mengisi penilaian skill')}</div>
            <div className="mt-1 text-xs text-gray-400">{t('Penilaian muncul di sini setelah pengajar mengisi Catatan Progress')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
            <div className="space-y-3 rounded-2xl bg-white p-4">
              {SKILLS.map(({ key, label, Icon }) => (
                <SkillRow
                  key={key}
                  skill={skillMap[key] || { key, score: 0, before: null, delta: null, note: null }}
                  label={label}
                  Icon={Icon}
                />
              ))}
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#16796E] to-emerald-600 p-4 text-center text-white">
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{t('Rata-rata')}</div>
              <div className="text-4xl font-extrabold">{avg ? avg.toFixed(1) : '-'}</div>
              <div className="text-[11px] opacity-80">{t('dari 5.0')}</div>
              {avg > 0 && (
                <div className="mt-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                  ≈ {cefr(avg).band} · {t(cefr(avg).name)}
                </div>
              )}
              {/* [progress-delta-v1] rata-rata lama biar kenaikannya kebaca sekali lihat */}
              {avgBefore !== null && (
                <div className="mt-2 text-[11px] font-semibold opacity-85">
                  {t('sebelumnya')} {avgBefore.toFixed(1)} · {cefr(avgBefore).band}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* [kelas-tab-kuis-v1] Nilai kuis pindah ke tabnya sendiri (tab Kuis) —
          di sini dulu cuma sepotong grafik tanpa rincian benar/salah. */}

      {/* ── Timeline sesi ── */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">{t('Perjalanan Belajar')} ({completedChrono.length} {t('sesi')})</h2>
        {timeline.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-6 text-center">
            <ClipboardList className="mx-auto mb-2 h-7 w-7 text-gray-300" strokeWidth={1.5} />
            <div className="text-sm text-gray-500">{t('Belum ada sesi yang selesai')}</div>
            <div className="mt-1 text-xs text-gray-400">{t('Setiap sesi selesai, laporan pengajar (topik, PR, recording) tampil di sini')}</div>
          </div>
        ) : (
          <div className="relative space-y-3 pl-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-gray-200">
            {timeline.map((blok) => {
              const head = blok.items[0];
              const ekor = blok.items[blok.items.length - 1];
              const label = blok.items.length > 1
                ? `${t('Sesi')} ${head.sessionNo}–${ekor.sessionNo}`
                : `${t('Sesi')} ${head.sessionNo}`;
              // Laporan pengajar bisa berbeda tiap sesi dalam satu blok — tiap
              // sesi yang punya isi tetap tampil terpisah, cuma di dalam SATU kartu.
              const isi = blok.items
                .map((s) => ({ s, p: parseSessionNotes(s.notes) }))
                .filter(({ p }) => p.topic || p.homework || p.message || p.extras.length > 0);
              // Rekaman kembar (satu tautan dipakai dua sesi) cukup sekali.
              const rekamanSesi = blok.items.filter((s) => s.recording_url);
              const rekamanUnik = rekamanSesi.filter(
                (s, i) => rekamanSesi.findIndex((x) => x.recording_url === s.recording_url) === i,
              );
              // Presensi: status sama di seluruh blok cukup satu chip (+ jumlahnya).
              const presensi: { status: string; n: number }[] = [];
              blok.items.forEach((s) => {
                if (!s.attendance_status || !ATTENDANCE_BADGE[s.attendance_status]) return;
                const found = presensi.find((x) => x.status === s.attendance_status);
                if (found) found.n += 1;
                else presensi.push({ status: s.attendance_status, n: 1 });
              });
              return (
                <div key={blok.key} className="relative rounded-2xl bg-white p-4">
                  <span className="absolute -left-[19px] top-5 h-3 w-3 rounded-full border-2 border-white bg-[#16796E]" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#16796E]">
                        {label}
                        {blok.items.length > 1 && (
                          <span className="ml-1.5 rounded-full bg-[#16796E]/10 px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal">
                            {blok.items.length} {t('sesi')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(head.scheduled_at).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      {/* [nilai-per-pertemuan-v1] nilai kuis sesi ini — angkanya ditulis
                          penuh (bukan warna saja) supaya kebaca tanpa membedakan warna */}
                      {blok.items.map((s) => {
                        const pct = quizPct(s.quiz_score, s.quiz_max);
                        return pct === null ? null : (
                          <span
                            key={`q-${s.id}`}
                            title={`${t('Nilai kuis')} ${s.quiz_score}/${s.quiz_max} — ${t('Sesi')} ${s.sessionNo}`}
                            className="rounded-full bg-[#16796E]/10 px-2 py-1 text-xs font-bold text-[#16796E]"
                          >
                            {t('Kuis')} {pct}%
                          </span>
                        );
                      })}
                      {presensi.map(({ status, n }) => {
                        const att = ATTENDANCE_BADGE[status];
                        return (
                          <span key={`a-${status}`} className={`rounded-full px-2 py-1 text-xs font-semibold ${att.cls}`}>
                            {t(att.label)}{n > 1 ? ` ×${n}` : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {isi.length > 0 && (
                    <div className="mt-2.5 space-y-2.5 border-t border-gray-100 pt-2.5 text-[13px]">
                      {isi.map(({ s, p: parsed }) => (
                        <div key={`n-${s.id}`} className="space-y-1.5">
                          {isi.length > 1 && (
                            <div className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400">{t('Sesi')} {s.sessionNo}</div>
                          )}
                          {parsed.topic && <div><span className="font-semibold text-gray-700">📚 {t('Topik')}:</span> <span className="text-gray-600">{parsed.topic}</span></div>}
                          {parsed.homework && <div><span className="font-semibold text-gray-700">📝 {t('PR')}:</span> <span className="text-gray-600">{parsed.homework}</span></div>}
                          {parsed.message && (
                            <div className="flex items-start gap-1.5 rounded-xl bg-[#F0FAF8] px-3 py-2 text-gray-700">
                              <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#16796E]" strokeWidth={2} />
                              <span>{parsed.message}</span>
                            </div>
                          )}
                          {parsed.extras.map((line, i) => <div key={i} className="text-gray-500">{line}</div>)}
                        </div>
                      ))}
                    </div>
                  )}

                  {rekamanUnik.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {rekamanUnik.map((s) => {
                        const url = s.recording_url as string;
                        const suffix = rekamanUnik.length > 1 ? ` · ${t('Sesi')} ${s.sessionNo}` : '';
                        const judul = `${t('Tonton Recording')}${suffix}`;
                        // [vc-recmodal-v2] Rekaman SELALU dibuka sebagai pop-up di
                        // halaman ini. Tautan luar (Drive/Zoom) pun lewat pop-up dulu,
                        // supaya tidak ada lagi tombol yang diam-diam melempar siswa
                        // ke layar login dashboard admin.
                        return isPlayableRecording(url) ? (
                          <button
                            key={`r-${s.id}`}
                            type="button"
                            onClick={() => setRekaman({ url, title: judul })}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                          >
                            <Video className="h-3.5 w-3.5" strokeWidth={2.5} /> {judul}
                          </button>
                        ) : (
                          <a
                            key={`r-${s.id}`}
                            href={studentRecordingHref(url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                          >
                            <Video className="h-3.5 w-3.5" strokeWidth={2.5} /> {judul}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
      {rekaman && (
        <RecordingModal recordingUrl={rekaman.url} title={rekaman.title} onClose={() => setRekaman(null)} />
      )}
    </div>
  );
}
