// [linguo-patch:watch-level-badge-v1] Estimasi level CEFR (A1–C1) sebuah video dari
// TRANSKRIP-nya — dipakai badge level di tab "Siap" Watch & Learn. Murni heuristik
// leksikal (tanpa biaya AI): panjang kalimat, panjang kata rata-rata, dan proporsi
// kata panjang. Bukan penilaian pasti — hanya perkiraan cepat biar pelajar tahu kira-
// kira video ini seberat apa. Dihitung SERVER dari cues yang sudah tersimpan, lalu
// disimpan (kolom `level`) supaya tak dihitung ulang tiap buka tab.

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

// Skrip tanpa spasi antar kata (CJK, Thai, dsb.) — tokenisasi kata tak andal, jadi
// dinilai lewat panjang kalimat dalam karakter alih-alih jumlah kata.
const NO_SPACE_LANGS = new Set(["ja", "zh", "th", "lo", "km", "my"]);

interface CueLike {
  target?: unknown;
}

// Cari indeks bucket: berapa banyak ambang yang dilewati nilai `v`. 0..edges.length.
function bucket(v: number, edges: number[]): number {
  let i = 0;
  while (i < edges.length && v >= edges[i]) i++;
  return i;
}

/**
 * Perkirakan level CEFR dari daftar cue transkrip (pakai teks bahasa target).
 * Balikin null kalau datanya terlalu sedikit buat dinilai (badge tak ditampilkan).
 */
export function estimateCefrLevel(cues: CueLike[], langCode: string): CefrLevel | null {
  if (!Array.isArray(cues) || cues.length < 3) return null;
  const sentences = cues
    .map((c) => (typeof c?.target === "string" ? c.target.trim() : ""))
    .filter(Boolean);
  if (sentences.length < 3) return null;

  // Skrip tanpa spasi → panjang kalimat dalam karakter jadi proksi kesulitan.
  if (NO_SPACE_LANGS.has(langCode)) {
    const totalChars = sentences.reduce((n, s) => n + [...s].length, 0);
    const perSentence = totalChars / sentences.length;
    if (perSentence < 10) return "A1";
    if (perSentence < 18) return "A2";
    if (perSentence < 28) return "B1";
    if (perSentence < 40) return "B2";
    return "C1";
  }

  const text = sentences.join(" ");
  const words = text.match(/\p{L}[\p{L}\p{M}'’-]*/gu) ?? [];
  if (words.length < 20) return null; // terlalu pendek buat menilai

  const avgWordsPerSentence = words.length / sentences.length;
  const avgWordLen = words.reduce((n, w) => n + [...w].length, 0) / words.length;
  const longRatio = words.filter((w) => [...w].length >= 8).length / words.length;

  // Tiga sinyal, masing-masing dipetakan ke 0–4, lalu dirata-rata.
  const composite =
    (bucket(avgWordsPerSentence, [6, 9, 13, 18]) +
      bucket(avgWordLen, [4, 4.6, 5.2, 5.8]) +
      bucket(longRatio, [0.08, 0.14, 0.2, 0.28])) /
    3;

  if (composite < 0.8) return "A1";
  if (composite < 1.6) return "A2";
  if (composite < 2.4) return "B1";
  if (composite < 3.2) return "B2";
  return "C1";
}

// Validasi nilai level dari sumber luar (DB) — buang yang bukan level sah.
export function asCefrLevel(v: unknown): CefrLevel | null {
  return v === "A1" || v === "A2" || v === "B1" || v === "B2" || v === "C1" ? v : null;
}

// Warna badge per level: hijau (pemula A) → emas (menengah B) → merah (mahir C1).
export const CEFR_STYLE: Record<CefrLevel, { bg: string; fg: string }> = {
  A1: { bg: "#34C759", fg: "#04240F" },
  A2: { bg: "#2BB673", fg: "#03231A" },
  B1: { bg: "#F4B740", fg: "#241804" },
  B2: { bg: "#F0912E", fg: "#2A1602" },
  C1: { bg: "#FF4D6A", fg: "#2A0710" },
};
