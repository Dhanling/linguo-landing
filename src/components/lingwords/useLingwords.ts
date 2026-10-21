'use client';

// [lingwords-v1] Hook bersama kartu Beranda & halaman Lingwords: muat kata dari
// semua sumber, ikut berubah saat siswa menyimpan/mereview kata di tab lain.

import { useEffect, useMemo, useState } from 'react';
import { getSavedWords, onSavedWordsChanged, type SavedWord } from '@/lib/immersionLearn';
import { langsOf, loadLingwords, loadPreviewLingwords, type LwActivity, type LwWord, type RegLike } from '@/lib/lingwords';
import { primeThemes } from '@/lib/lingwordsTema';

// Hasil terakhir ditahan di memori modul → balik ke Beranda tak bikin kartu kedip.
const memo = new Map<string, { words: LwWord[]; activity: LwActivity[]; server: boolean; regs?: RegLike[] }>();

export function useLingwords(
  userId: string | null | undefined,
  regs: RegLike[],
  opts: { sync?: boolean; previewStudentId?: string | null } = {}
) {
  // [lingwords-pratinjau-v1] Pratinjau POV: data asli siswa dari server, bukan simpanan browser staf.
  const preview = opts.previewStudentId || null;
  const key = preview ? `preview:${preview}` : userId || '';
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
      const res = preview
        ? await loadPreviewLingwords(preview).then((r) => { primeThemes(r.themes); return r; })
        : await loadLingwords(userId, saved, opts);
      if (!alive) return;
      memo.set(key, res);
      setData(res);
    }, data ? 600 : 0); // perubahan beruntun (review flashcard) digabung
    return () => { alive = false; clearTimeout(h); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved, key]);

  // Pratinjau tanpa daftar kelas dari halaman → pakai kelas siswa dari server.
  const effRegs = regs.length ? regs : data?.regs || [];
  const regKey = effRegs.map((r) => `${r.language}|${r.level}`).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const langs = useMemo(() => (data ? langsOf(data.words, effRegs) : []), [data, regKey]);
  return { loading: !data, words: data?.words || [], activity: data?.activity || [], server: !!data?.server, langs, regs: effRegs };
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
