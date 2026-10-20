'use client';

// [lingwords-v1] Hook bersama kartu Beranda & halaman Lingwords: muat kata dari
// semua sumber, ikut berubah saat siswa menyimpan/mereview kata di tab lain.

import { useEffect, useMemo, useState } from 'react';
import { getSavedWords, onSavedWordsChanged, type SavedWord } from '@/lib/immersionLearn';
import { langsOf, loadLingwords, type LwActivity, type LwWord, type RegLike } from '@/lib/lingwords';

// Hasil terakhir ditahan di memori modul → balik ke Beranda tak bikin kartu kedip.
const memo = new Map<string, { words: LwWord[]; activity: LwActivity[]; server: boolean }>();

export function useLingwords(userId: string | null | undefined, regs: RegLike[], opts: { sync?: boolean } = {}) {
  const key = userId || '';
  const [saved, setSaved] = useState<SavedWord[] | null>(null);
  const [data, setData] = useState(memo.get(key) || null);

  useEffect(() => {
    const refresh = () => setSaved(getSavedWords());
    refresh();
    return onSavedWordsChanged(refresh);
  }, []);

  useEffect(() => {
    if (!saved) return;
    let alive = true;
    const h = setTimeout(async () => {
      const res = await loadLingwords(userId, saved, opts);
      if (!alive) return;
      memo.set(key, res);
      setData(res);
    }, data ? 600 : 0); // perubahan beruntun (review flashcard) digabung
    return () => { alive = false; clearTimeout(h); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved, key]);

  const regKey = regs.map((r) => `${r.language}|${r.level}`).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const langs = useMemo(() => (data ? langsOf(data.words, regs) : []), [data, regKey]);
  return { loading: !data, words: data?.words || [], activity: data?.activity || [], server: !!data?.server, langs };
}

const LANG_PICK_KEY = 'linguo:lingwords:lang:v1';

export function useLangPick(langs: string[]): [string | null, (l: string) => void] {
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => {
    try { setPick(localStorage.getItem(LANG_PICK_KEY)); } catch { /* abaikan */ }
  }, []);
  const lang = pick && langs.includes(pick) ? pick : langs[0] || null;
  const set = (l: string) => {
    setPick(l);
    try { localStorage.setItem(LANG_PICK_KEY, l); } catch { /* abaikan */ }
  };
  return [lang, set];
}
