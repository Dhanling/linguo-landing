/* [kuis-ielts-section-v1] Soal IELTS menyimpan stimulus panjang (bacaan Reading,
   tabel data Writing Task 1) di dalam `prompt`, dipisah dari pertanyaannya oleh
   satu baris "———". Penanda ini dibuat edge fn generate-quiz (dashboard). Soal
   tanpa penanda tidak berubah sama sekali. */
const PISAH = "\n———\n";

export function pisahStimulus(prompt: string | null | undefined): { stimulus: string | null; soal: string } {
  const p = String(prompt ?? "");
  const i = p.lastIndexOf(PISAH);
  if (i < 0) return { stimulus: null, soal: p };
  const stimulus = p.slice(0, i).trim();
  const soal = p.slice(i + PISAH.length).trim();
  return stimulus && soal ? { stimulus, soal } : { stimulus: null, soal: p };
}

/** Baris pertama stimulus ("READING PASSAGE 1") — label ringkas di halaman hasil. */
export function judulStimulus(stimulus: string | null): string {
  return (stimulus ?? "").split("\n")[0]?.trim().slice(0, 60) ?? "";
}
