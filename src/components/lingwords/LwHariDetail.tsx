'use client';

// [lingwords-harian-v1] Rincian satu batang grafik aktivitas kartu Lingwords: kata BARU
// pada rentang itu (hari / pekan / bulan) per kelas kata dan per asal (kelas · sesi N,
// Watch & Learn, e-book, …). "Baru" = pertama kali muncul di rentang ini — firstSeen
// sudah yang paling awal lintas sumber (mergeWords), jadi kata yang sudah didapat di
// sesi sebelumnya otomatis tidak dihitung lagi, cukup masuk hitungan "diulang".

import { useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import type { LwSource, LwWord } from '@/lib/lingwords';
import { LW_POS, posOf, type LwPosId } from '@/lib/lingwordsTema';
import { LW_POS_COLORS, type LwBucket } from './LwCharts';

const ASAL: Record<LwSource, string> = {
  kelas: 'Kelas',
  materi: 'Materi kelas',
  lingnote: 'Lingnote dari pengajar',
  simpanan: 'Watch & Learn',
  ebook: 'E-book',
  server: 'Perangkat lain',
};
// Kelas dulu — itu yang paling ingin dilihat siswa sesudah sesi.
const URUT_ASAL: LwSource[] = ['kelas', 'materi', 'lingnote', 'simpanan', 'ebook', 'server'];

export default function LwHariDetail({ words, lang, bucket, t, onClose }: {
  words: LwWord[];
  lang: string;
  bucket: LwBucket;
  t: (s: string) => string;
  onClose: () => void;
}) {
  const { baru, diulang, perPos, perAsal } = useMemo(() => {
    const masuk = (ms: number | null) => ms != null && ms >= bucket.from && ms < bucket.to;
    const baru = words.filter((w) => w.lang === lang && masuk(w.firstSeen)).sort((a, b) => a.firstSeen - b.firstSeen);
    const diulang = words.filter((w) => w.lang === lang && w.firstSeen < bucket.from && masuk(w.lastActive)).length;
    const perPos = new Map<LwPosId | 'pending', number>();
    baru.forEach((w) => { const k = posOf(lang, w.word) || 'pending'; perPos.set(k, (perPos.get(k) || 0) + 1); });
    const grup = new Map<string, { src: LwSource; label: string; words: LwWord[] }>();
    baru.forEach((w) => {
      // Kata kelas dikelompokkan per sesi ("Sesi 5 · Kak Dhani"), sisanya per asal.
      const label = w.source === 'kelas' && w.note ? w.note : ASAL[w.source];
      const k = `${w.source}|${label}`;
      const g = grup.get(k) || { src: w.source, label, words: [] };
      g.words.push(w);
      grup.set(k, g);
    });
    const perAsal = Array.from(grup.values()).sort((a, b) => URUT_ASAL.indexOf(a.src) - URUT_ASAL.indexOf(b.src));
    return { baru, diulang, perPos, perAsal };
  }, [words, lang, bucket]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const chips = [
    ...LW_POS.map((p) => ({ id: p.id as string, label: t(p.label), color: LW_POS_COLORS[p.id], n: perPos.get(p.id) || 0 })),
    { id: 'pending', label: t('Belum dikelompokkan'), color: '#CBD5E1', n: perPos.get('pending') || 0 },
  ].filter((c) => c.n > 0);

  return (
    // Pop-up: dirender DI LUAR div @container kartu — container-type ikut membuat
    // containing block untuk position:fixed, jadi di dalamnya overlay tak menutup layar.
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose} role="dialog" aria-modal="true" aria-label={bucket.title}>
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-5"
        onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold text-[#12172B]">{bucket.title}</p>
          <p className="mt-0.5 text-[12px] font-semibold text-gray-500">
            <b className="text-[#16796E]">{baru.length} {t('kata baru')}</b>
            {diulang > 0 && <> · {diulang} {t('kata lama diulang')}</>}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label={t('Tutup')}
          className="rounded-full p-1 text-gray-400 hover:text-[#12172B]">
          <X className="h-4 w-4" />
        </button>
      </div>

      {baru.length === 0 ? (
        <p className="mt-2.5 text-[12.5px] text-gray-500">
          {diulang > 0
            ? t('Tidak ada kata baru — kamu mengulang kata yang sudah dipelajari sebelumnya.')
            : t('Belum ada kata baru di rentang ini.')}
        </p>
      ) : (
        <>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-semibold text-gray-500">
                <i className="inline-block h-2 w-2 rounded-full" style={{ background: c.color }} />
                <b className="text-[#12172B]">{c.n}</b> {c.label.toLowerCase()}
              </span>
            ))}
          </div>
          <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {perAsal.map((g) => (
              <div key={`${g.src}|${g.label}`}>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  {g.src === 'kelas' && g.label !== ASAL.kelas ? `${t('Kelas')} · ${g.label}` : t(g.label)} · {g.words.length}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {g.words.map((w) => {
                    const pos = posOf(lang, w.word);
                    return (
                      <span key={w.word} title={w.meaning || undefined}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[12px] text-[#12172B]">
                        <i className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: pos ? LW_POS_COLORS[pos] : '#CBD5E1' }} />
                        <b className="font-bold">{w.word}</b>
                        {w.meaning && <span className="max-w-[160px] truncate text-gray-500">{w.meaning}</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-gray-400">
            {t('Kata yang sudah kamu dapat di sesi sebelumnya tidak dihitung lagi sebagai kata baru.')}
          </p>
        </>
      )}
      </div>
    </div>
  );
}
