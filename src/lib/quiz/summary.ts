// [sr-kuis-spaced-repetition-v1] Ringkasan hasil kuis dalam teks polos untuk WhatsApp.
//
// PENTING: tanpa markdown sama sekali — tanpa **tebal**, tanpa `kode`, tanpa
// tautan berkurung. WhatsApp merender *bintang* dan _garis bawah_ dengan
// aturannya sendiri, dan tanda bintang dari markdown bikin kalimat terpotong
// aneh di HP siswa. Penanda benar/salah cukup ✅ / ❌.

import { langLabel } from "./language";
import type { SessionResult } from "./result";

function tanggalWib(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  });
}

function jadwalBerikutnya(iso: string | null): string {
  if (!iso) return "";
  const hari = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (hari <= 0) return "besok";
  if (hari === 1) return "besok";
  if (hari <= 6) return `${hari} hari lagi`;
  return tanggalWib(iso);
}

/**
 * Ringkasan siap kirim. Soal yang BENAR ditulis satu baris saja; yang salah
 * ditambah jawaban benar + penjelasan — bagian itu yang sebenarnya dibaca ulang
 * siswa, dan pesan WA yang kepanjangan malah tidak dibaca sama sekali.
 */
export function renderWaSummary(result: SessionResult, studentName?: string | null): string {
  const lines: string[] = [];
  const sapaan = studentName ? `Halo ${studentName}!` : "Halo!";
  lines.push(`${sapaan} Ini hasil kuis harian bahasa ${langLabel(result.language_code)} kamu.`);
  lines.push("");
  lines.push(`Skor: ${result.score_total}/${result.total_questions}`);
  if (result.total_mc && result.total_translation) {
    lines.push(
      `Pilihan ganda ${result.score_mc}/${result.total_mc} · Terjemahan ${result.score_translation}/${result.total_translation}`
    );
  }
  lines.push("");

  for (const item of result.items) {
    const tanda = item.is_correct ? "✅" : "❌";
    lines.push(`${tanda} ${item.no}. ${item.prompt}`);
    if (item.prompt_translit) lines.push(`   (${item.prompt_translit})`);
    lines.push(`   Jawabanmu: ${item.student_answer_text?.trim() || "(kosong)"}`);
    if (!item.is_correct) {
      const benar = item.correct_answer_translit
        ? `${item.correct_answer_text} (${item.correct_answer_translit})`
        : item.correct_answer_text;
      lines.push(`   Jawaban benar: ${benar}`);
      const alasan = item.ai_feedback?.trim() || item.explanation.trim();
      if (alasan) lines.push(`   ${alasan}`);
    }
    lines.push("");
  }

  const perluDiulang = result.concepts.filter((c) => c.correct < c.total);
  const solid = result.concepts.filter((c) => c.correct === c.total);

  lines.push("Ringkasan materi:");
  for (const c of solid) {
    lines.push(`✅ ${c.name} — ${c.mastery_label}, muncul lagi ${jadwalBerikutnya(c.next_review_at)}`);
  }
  for (const c of perluDiulang) {
    lines.push(`🔁 ${c.name} — ${c.correct}/${c.total} benar, diulang ${jadwalBerikutnya(c.next_review_at)}`);
  }

  lines.push("");
  lines.push(
    perluDiulang.length
      ? "Materi yang belum kuat otomatis muncul lagi di kuis berikutnya. Sampai besok!"
      : "Mantap, semua materi hari ini kamu kuasai. Sampai besok!"
  );

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
