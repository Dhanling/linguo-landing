// Progres simulasi yang sedang berjalan (localStorage) — dibaca di dua tempat:
//  • runner /akun/simulasi/[id] → lanjutkan sisa waktu & jawaban saat masuk lagi
//  • katalog (SimulasiKatalog) → tampilkan progress bar "sedang dikerjakan" di kartu
// Di-key per simulasi + user (tamu = "guest"). Audio (blob) tak ikut disimpan —
// hanya pilihan/teks/URL rekaman yang sudah terunggah.
export type SavedProgress = {
  v: 1;
  attemptId: string;
  deadline: number | null; // timestamp absolut → sisa waktu dihitung ulang saat lanjut
  answers: Record<string, { selected_index: number | null; text: string; audioUrl: string | null }>;
  secIdx: number;
  maxSecIdx: number;
  introDone: number[];
  qPage: number;
  savedAt: number;
};

export function progressKey(id: string, uid: string | null | undefined) {
  return `sim-progress:v1:${id}:${uid ?? "guest"}`;
}

export function saveProgress(id: string, uid: string | null | undefined, data: SavedProgress) {
  try { localStorage.setItem(progressKey(id, uid), JSON.stringify(data)); } catch { /* ignore */ }
}

export function readProgress(id: string, uid: string | null | undefined): SavedProgress | null {
  try {
    const raw = localStorage.getItem(progressKey(id, uid));
    const p = raw ? JSON.parse(raw) : null;
    return p && p.attemptId ? (p as SavedProgress) : null;
  } catch { return null; }
}

// Cari progres simulasi TANPA bergantung pada uid — pindai semua key
// `sim-progress:v1:${id}:*` lalu ambil yang paling baru disimpan. Dipakai katalog
// supaya progres tetap kebaca walau tersimpan di bawah identitas berbeda (mis.
// race GoTrue bikin getStudentInfo sesaat null → tersimpan sebagai "guest",
// atau sesi tamu anonim) dari uid yang dipakai katalog saat membaca.
export function readAnyProgress(id: string): SavedProgress | null {
  try {
    const prefix = `sim-progress:v1:${id}:`;
    let best: SavedProgress | null = null;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const raw = localStorage.getItem(k);
      const p = raw ? JSON.parse(raw) : null;
      if (p && p.attemptId && (!best || (p.savedAt ?? 0) > (best.savedAt ?? 0))) best = p as SavedProgress;
    }
    return best;
  } catch { return null; }
}

export function clearProgress(id: string, uid: string | null | undefined) {
  try { localStorage.removeItem(progressKey(id, uid)); } catch { /* ignore */ }
}

// Jumlah soal terjawab dari snapshot (heuristik lintas-tipe: ada pilihan / teks /
// rekaman). Dipakai untuk progress bar di kartu katalog.
export function answeredCount(p: SavedProgress): number {
  return Object.values(p.answers || {}).filter(
    (a) => a.selected_index != null || (!!a.text && a.text.trim() !== "") || !!a.audioUrl,
  ).length;
}
