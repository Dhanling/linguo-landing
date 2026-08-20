'use client';

// [beranda-kosakata-v1] Kartu "Kosakata Saya" di Beranda siswa.
//
// Menjawab tiga pertanyaan yang sebelumnya tak terjawab di mana pun di dashboard:
// kata apa saja yang sudah dikuasai, berapa jumlahnya, dan targetnya berapa.
// Hitungannya di src/lib/vocabProgress.ts (materi + kuis yang sudah dikerjakan,
// digabung kata simpanan Watch & Learn).
//
// Sengaja SATU kartu ramping (bukan blok bertingkat): beranda sudah padat, dan
// yang dicari siswa cuma angka + bar + contoh katanya.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Layers, ChevronRight, Sparkles } from 'lucide-react';
import { useT } from '@/lib/uiLang'; // [ui-lang-switcher-v1]
import { getSavedWords, onSavedWordsChanged, type SavedWord } from '@/lib/immersionLearn';
import {
  buildVocabSummary, fetchMateriVocab, type VocabItem, type VocabSummary,
} from '@/lib/vocabProgress';

// Sama seperti BerandaInsights: hasil terakhir ditahan di memori modul supaya
// balik ke Beranda dari menu lain tak bikin kartunya hilang-muncul.
const materiCache = new Map<string, { mastered: VocabItem[]; learning: VocabItem[] }>();

const CHIP_LIMIT = 12;

export default function KosakataCard({
  userId,
  levels,
  previewMode = false,
}: {
  userId?: string | null;
  levels: (string | null | undefined)[];
  /** POV siswa (staf): kata simpanan ikut perangkat ini, bukan milik siswanya. */
  previewMode?: boolean;
}) {
  const t = useT(); // [ui-lang-switcher-v1]
  const [saved, setSaved] = useState<SavedWord[]>([]);
  const [fetched, setFetched] = useState<{ key: string; data: { mastered: VocabItem[]; learning: VocabItem[] } } | null>(null);

  // Kata simpanan hidup di localStorage → baca setelah mount, lalu ikut berubah
  // saat siswa menyimpan/mereview kata di tab lain.
  useEffect(() => {
    const refresh = () => setSaved(getSavedWords());
    refresh();
    return onSavedWordsChanged(refresh);
  }, []);

  const key = userId || '';
  const materi = (fetched?.key === key ? fetched.data : materiCache.get(key)) || { mastered: [], learning: [] };

  useEffect(() => {
    if (!key) return;
    let alive = true;
    (async () => {
      const res = await fetchMateriVocab(key);
      if (!alive) return;
      materiCache.set(key, res);
      setFetched({ key, data: res });
    })();
    return () => { alive = false; };
  }, [key]);

  const levelKey = levels.filter(Boolean).join('|');
  const sum: VocabSummary = useMemo(
    () => buildVocabSummary(saved, materi, levels),
    // levelKey & panjang daftar cukup jadi penanda perubahan — objeknya baru terus tiap render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saved, materi.mastered.length, materi.learning.length, levelKey]
  );

  const dikuasai = sum.mastered.length;
  const pct = Math.min(100, Math.round((dikuasai / sum.target) * 100));

  // Belum punya kosakata sama sekali → satu baris ajakan, bukan kartu kosong besar.
  if (sum.total === 0) {
    return (
      <Link
        href="/watch-learn"
        className="group flex items-center gap-3 rounded-3xl bg-white p-4 ring-1 ring-slate-200/70 transition hover:ring-[#16796E]/40"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16796E]/10 text-[#16796E]">
          <Layers className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-extrabold text-[#12172B]">{t("Kosakata Saya masih kosong")}</span>
          <span className="block text-[12px] font-medium text-gray-500">
            {t("Simpan kata sambil nonton di Watch & Learn, atau selesaikan materi kelas — hitungannya muncul di sini.")}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#16796E]" />
      </Link>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200/70 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-[15px] font-extrabold text-[#12172B]">
          <Layers className="h-[18px] w-[18px] text-[#16796E]" strokeWidth={2.4} />
          {t("Kosakata Saya")}
        </h3>
        <Link
          href="/kosakata"
          className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#16796E] hover:text-[#0F5A52]"
        >
          {t("Latihan flashcard")} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2 sm:flex-nowrap">
        <div className="shrink-0">
          <div className="flex items-end gap-1.5">
            <span className="text-[28px] font-extrabold leading-none text-[#12172B]">{dikuasai}</span>
            <span className="pb-0.5 text-[12.5px] font-bold text-gray-400">/ {sum.target}</span>
          </div>
          <p className="mt-1 text-[12px] font-semibold text-gray-600">{t("kata dikuasai")}</p>
        </div>
        <div className="min-w-[180px] flex-1">
          <div className="flex items-center justify-between text-[11.5px] font-bold">
            <span className="text-gray-500">{t("Target level")} {sum.targetLevel}</span>
            <span className="text-[#16796E]">{pct}%</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#E8EAEE]">
            <div className="h-full rounded-full bg-[#16796E] transition-all" style={{ width: `${Math.max(pct, dikuasai ? 2 : 0)}%` }} />
          </div>
          <p className="mt-1.5 text-[11.5px] font-medium text-gray-500">
            {sum.learning.length > 0
              ? `${sum.learning.length} ${t("kata lagi dipelajari — tinggal")} ${Math.max(0, sum.target - dikuasai)} ${t("kata menuju target.")}`
              : `${t("Tinggal")} ${Math.max(0, sum.target - dikuasai)} ${t("kata lagi menuju target level")} ${sum.targetLevel}.`}
          </p>
        </div>
      </div>

      {/* Kata apa saja — yang terakhir dikuasai duluan. `title` menampilkan artinya
          supaya chip tetap ringkas tapi tak jadi tebak-tebakan. */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {sum.mastered.slice(0, CHIP_LIMIT).map((w, i) => (
          <span
            key={`${w.word}-${i}`}
            title={w.meaning || undefined}
            className="inline-flex max-w-[190px] items-center gap-1.5 rounded-full bg-[#16796E]/8 px-2.5 py-1 text-[12px] font-bold text-[#0F5A52]"
          >
            <span className="truncate">{w.word}</span>
            {w.meaning && <span className="truncate text-[11px] font-medium text-gray-500">{w.meaning}</span>}
          </span>
        ))}
        {dikuasai > CHIP_LIMIT && (
          <Link
            href="/kosakata"
            className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-bold text-gray-500 transition hover:text-[#16796E]"
          >
            +{dikuasai - CHIP_LIMIT} {t("lagi")}
          </Link>
        )}
        {dikuasai === 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-semibold text-amber-700">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
            {t("Belum ada yang dikuasai — review")} {sum.learning.length} {t("kata biar naik status")}
          </span>
        )}
      </div>

      <p className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] font-medium leading-relaxed text-gray-400">
        {t("Dihitung dari materi & kuis yang sudah kamu selesaikan")} ({sum.fromMateri} {t("kata")}) + {t("kata tersimpan di Watch & Learn")} ({sum.fromSimpanan} {t("kata")}).
        {previewMode && ` ${t("Di mode pratinjau, kata tersimpan mengikuti perangkat ini — bukan milik siswanya.")}`}
      </p>
    </div>
  );
}
