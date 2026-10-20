'use client';

// [vc-kuis-simpan-materi-v1] 20 Okt 2026 — "Kuis di kelas" di drawer sesi tab
// Materi. Sumbernya `live_quiz_log`: tiap soal kuis live yang ditutup pengajar
// di Kelas Video tersimpan otomatis (dashboard: src/lib/videoClass/liveQuizLog.ts).
// Siswa bisa mengulang audio listening (biasa / pelan), membaca transkrip +
// artinya, kunci jawaban, pembahasan, dan jawabannya sendiri waktu di kelas.

import { useState } from 'react';
import { Check, X, Headphones, Turtle, ClipboardCheck, Volume2 } from 'lucide-react';
import { bisaDibunyikan, kodeBahasaEbook, ucapkanEbook } from '@/lib/ebookTts';
import { useT } from '@/lib/uiLang';

export interface KuisKelasBaris {
  id: string;
  schedule_id: string | null;
  session_number: number | null;
  language: string | null;
  question: string;
  options: string[];
  correct: number | null;
  naskah: string | null;
  arti: { kalimat?: string; opts?: string[]; naskah?: string } | null;
  explanation: string | null;
  votes: { nama: string; pilihan: number; benar: boolean; pengajar?: boolean }[];
  created_at: string;
}

const HURUF = ['A', 'B', 'C', 'D', 'E', 'F'];

/** "Instruksi: kalimat" → dipisah supaya kalimat bahasa targetnya menonjol (sama dengan di kelas). */
function pisahSoal(q: string): { instruksi: string | null; kalimat: string } {
  const baris = q.split('\n')[0] ?? q;
  const i = baris.lastIndexOf(':');
  if (i > 0 && i < baris.length - 1) return { instruksi: baris.slice(0, i + 1).trim(), kalimat: baris.slice(i + 1).trim() };
  return { instruksi: null, kalimat: baris.trim() };
}

function SoalKartu({ s, no }: { s: KuisKelasBaris; no: number }) {
  const t = useT();
  const kode = kodeBahasaEbook(s.language);
  const bisaSuara = !!kode && bisaDibunyikan(kode);
  const [artiBuka, setArtiBuka] = useState(false);
  const putar = (teks: string, laju = 1) => { if (kode) void ucapkanEbook(teks, kode, laju); };
  const { instruksi, kalimat } = pisahSoal(s.question);
  const siswa = (s.votes || []).filter((v) => !v.pengajar);
  // Kelas privat: satu-satunya penjawab non-pengajar = siswanya sendiri.
  const jawabanku = siswa.length === 1 ? siswa[0] : null;

  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-3.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t('Soal')} {no}</span>
        {jawabanku && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${jawabanku.benar ? 'bg-teal-50 text-[#16796E]' : 'bg-rose-50 text-rose-600'}`}>
            {jawabanku.benar ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
            {t('Jawabanmu')} {HURUF[jawabanku.pilihan] ?? '?'}
          </span>
        )}
      </div>

      {s.naskah && (
        <div className="mb-2.5 rounded-xl bg-amber-50 px-3 py-2.5">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {bisaSuara && (
              <>
                <button type="button" onClick={() => putar(s.naskah!, 1)} className="inline-flex items-center gap-1.5 rounded-full bg-[#F5B940] px-3 py-1.5 text-xs font-extrabold text-[#1B1405]">
                  <Headphones className="h-3.5 w-3.5" strokeWidth={2.4} /> {t('Putar audio')}
                </button>
                <button type="button" onClick={() => putar(s.naskah!, 0.75)} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-amber-700 ring-1 ring-amber-300">
                  <Turtle className="h-3.5 w-3.5" strokeWidth={2.4} /> {t('Pelan')}
                </button>
              </>
            )}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">{t('Transkrip')}</div>
          <p className="text-sm font-semibold text-[#12172B]">{s.naskah}</p>
          {s.arti?.naskah && <p className="mt-0.5 text-sm text-amber-800">{s.arti.naskah}</p>}
        </div>
      )}

      {instruksi && <p className="text-xs font-semibold text-gray-500">{instruksi}</p>}
      <p className="flex items-start gap-1.5 text-[15px] font-extrabold text-[#12172B]">
        <span className="min-w-0 flex-1 whitespace-pre-line">{kalimat}</span>
        {bisaSuara && (
          <button type="button" onClick={() => putar(kalimat)} aria-label={t('Dengar')} className="mt-0.5 shrink-0 rounded-full bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200">
            <Volume2 className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        )}
      </p>
      {s.arti?.kalimat && artiBuka && <p className="mt-0.5 text-sm text-amber-700">{s.arti.kalimat}</p>}

      <ul className="mt-2 space-y-1.5">
        {s.options.map((o, i) => {
          const kunci = s.correct === i;
          const salahku = jawabanku && !jawabanku.benar && jawabanku.pilihan === i;
          return (
            <li key={i} className={`flex items-start gap-2 rounded-xl px-2.5 py-2 text-sm ${kunci ? 'bg-teal-50 ring-1 ring-teal-300' : salahku ? 'bg-rose-50 ring-1 ring-rose-200' : 'bg-gray-50'}`}>
              <span className={`mt-px w-4 shrink-0 text-xs font-extrabold ${kunci ? 'text-[#16796E]' : 'text-gray-400'}`}>{HURUF[i]}</span>
              <span className="min-w-0 flex-1">
                <span className="whitespace-pre-line font-semibold text-[#12172B]">{o}</span>
                {artiBuka && s.arti?.opts?.[i] && <span className="block text-xs text-amber-700">{s.arti.opts[i]}</span>}
              </span>
              {kunci && <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16796E]" strokeWidth={3} />}
            </li>
          );
        })}
      </ul>

      {(s.arti?.kalimat || s.arti?.opts?.some(Boolean)) && (
        <button type="button" onClick={() => setArtiBuka((x) => !x)} className="mt-2 text-xs font-bold text-[#16796E] hover:underline">
          {artiBuka ? t('Sembunyikan arti') : t('Tampilkan arti')}
        </button>
      )}

      {s.explanation && (
        <div className="mt-2 rounded-xl bg-teal-50/60 px-3 py-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#16796E]">{t('Pembahasan')}</div>
          <p className="text-sm text-gray-700">{s.explanation}</p>
        </div>
      )}

      {siswa.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {siswa.map((v, i) => (
            <span key={i} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${v.benar ? 'bg-teal-50 text-[#16796E]' : 'bg-rose-50 text-rose-600'}`}>
              {v.nama}: {HURUF[v.pilihan] ?? '?'}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

export default function KuisKelasSesi({ soal }: { soal: KuisKelasBaris[] }) {
  const t = useT();
  if (!soal.length) return null;
  const siswaVotes = soal.map((s) => (s.votes || []).filter((v) => !v.pengajar));
  const privat = siswaVotes.every((v) => v.length <= 1);
  const benar = siswaVotes.filter((v) => v.length === 1 && v[0].benar).length;
  const dijawab = siswaVotes.filter((v) => v.length === 1).length;
  return (
    <section>
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
        <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={2.4} /> {t('Kuis di Kelas')} ({soal.length})
        {privat && dijawab > 0 && <span className="ml-auto normal-case tracking-normal text-[#16796E]">{benar}/{dijawab} {t('benar')}</span>}
      </h4>
      <ul className="space-y-2">
        {soal.map((s, i) => <SoalKartu key={s.id} s={s} no={i + 1} />)}
      </ul>
    </section>
  );
}
