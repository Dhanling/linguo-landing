// =============================================================================
// src/lib/placementBank.ts
// [placement-bank-acak-v1]
//
// Menyusun soal placement test dari bank soal (tabel placement_question_bank).
// Soal tetap di kode (src/data/placement/<bahasa>.ts) jadi CETAKAN: tiap soalnya
// satu "slot" (level + listening/bukan). Slot itu diisi soal bank yang setara,
// jadi jumlah soal, urutan level, dan skor maksimum tidak berubah — skor tes
// pertama dan tes ulang tetap bisa dibandingkan di grafik Cek Level.
//
// Urutan pilih per slot: belum pernah dikerjakan orang ini → paling lama tidak
// keluar; di antara yang setara, tipe soal yang sama dengan cetakan didahulukan.
// Slot yang tak punya soal bank memakai soal cetakannya sendiri.
// =============================================================================

import type { Question } from "@/data/placement/english";

export type BarisBank = {
  qkey: string;
  difficulty: string;
  is_listening: boolean;
  payload: unknown;
  last_seen: string | null;
};

const LEVEL = new Set(["A1", "A2", "B1", "B2"]);
const teks = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const daftarTeks = (v: unknown, min: number): v is string[] =>
  Array.isArray(v) && v.length >= min && v.every(teks);

/** Baris bank → soal siap pakai, atau null kalau bentuknya tidak utuh (soal yang
 *  salah isi tidak boleh sampai ke layar tes). */
export function soalDariBank(b: BarisBank): Question | null {
  const p = b.payload as Record<string, any> | null;
  if (!p || typeof p !== "object" || !LEVEL.has(b.difficulty) || !teks(p.explanation)) return null;
  if (b.is_listening !== !!p.audio) return null;
  if (p.audio && !(teks(p.audio.text) && p.audio.text.length <= 400 && teks(p.audio.lang))) return null;
  let utuh = false;
  switch (p.type) {
    case "multiple":
      utuh = teks(p.question) && daftarTeks(p.options, 2) && Number.isInteger(p.correct) && p.correct >= 0 && p.correct < p.options.length;
      break;
    case "fillChoice":
      utuh = teks(p.question) && daftarTeks(p.options, 2) && teks(p.correct) && p.options.includes(p.correct);
      break;
    case "fill":
      utuh = teks(p.question) && teks(p.correct);
      break;
    case "dragDrop":
      utuh = teks(p.prompt) && teks(p.translation) && daftarTeks(p.tokens, 2) && daftarTeks(p.correct, 2) &&
        [...p.tokens].sort().join("\u0001") === [...p.correct].sort().join("\u0001");
      break;
    case "missing":
      utuh = teks(p.question) && teks(p.template) && daftarTeks(p.blanks, 1) && daftarTeks(p.options, 2) &&
        p.template.split("___").length - 1 === p.blanks.length && p.blanks.every((x: string) => p.options.includes(x));
      break;
    case "matching":
      utuh = teks(p.prompt) && Array.isArray(p.pairs) && p.pairs.length >= 2 &&
        p.pairs.every((x: any) => x && teks(x.left) && teks(x.right));
      break;
  }
  if (!utuh) return null;
  return { ...p, id: b.qkey, difficulty: b.difficulty } as Question;
}

function kocok<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Opsi yang merujuk posisi opsi lain ("semua benar", "A dan B") rusak kalau diacak.
const OPSI_BERPOSISI = /\b(all|none|both) of|\bsemua (jawaban )?(benar|salah)|\b[a-d] (dan|and|&) [a-d]\b/i;

/** Acak urutan pilihan jawaban supaya "jawabannya B" tidak bisa dihafal. */
export function acakOpsi(q: Question, rand: () => number = Math.random): Question {
  if (q.type === "multiple") {
    if (q.options.some((o) => OPSI_BERPOSISI.test(o))) return q;
    const urut = kocok(q.options.map((_, i) => i), rand);
    return { ...q, options: urut.map((i) => q.options[i]), correct: urut.indexOf(q.correct) };
  }
  if (q.type === "fillChoice" || q.type === "missing") return { ...q, options: kocok(q.options, rand) };
  return q;
}

/** Susun satu set soal: cetakan `statik` diisi dari `bank`. */
export function susunSoal(statik: Question[], bank: BarisBank[], rand: () => number = Math.random): Question[] {
  const stok = kocok(bank, rand)
    .map((b) => ({ soal: soalDariBank(b), listening: b.is_listening, terakhir: b.last_seen ? Date.parse(b.last_seen) || 0 : 0 }))
    .filter((x): x is { soal: Question; listening: boolean; terakhir: number } => !!x.soal);
  const terpakai = new Set<string>();
  return statik.map((cetakan) => {
    const calon = stok
      .filter((x) => !terpakai.has(x.soal.id) && x.soal.difficulty === cetakan.difficulty && x.listening === !!cetakan.audio)
      // sort stabil: urutan acak dari kocok() bertahan di antara calon yang setara
      .sort((a, b) =>
        a.terakhir - b.terakhir ||
        Number(b.soal.type === cetakan.type) - Number(a.soal.type === cetakan.type));
    const pilih = calon[0]?.soal ?? cetakan;
    terpakai.add(pilih.id);
    return acakOpsi(pilih, rand);
  });
}
