// [kelas-tab-v1] Util parsing catatan sesi dari laporan pengajar.
//
// Pengajar menyimpan laporan ke schedules.notes sebagai teks berformat emoji
// ("📚 Topik: ...", "📝 PR: ...", "💬 ...") dan menempelkan catatan PRIBADI
// setelah separator "---PRIVATE---" (lihat handleSubmitReport TeacherDashboard).
// SISI SISWA WAJIB lewat publicNotes() — jangan render schedules.notes mentah,
// bagian privat pengajar ikut kebawa.

const PRIVATE_SEP = '---PRIVATE---';

/** Bagian notes yang boleh dilihat siswa (buang catatan pribadi pengajar). */
export function publicNotes(notes?: string | null): string {
  if (!notes) return '';
  return notes.split(PRIVATE_SEP)[0].trim();
}

export interface ParsedSessionNotes {
  topic: string;
  homework: string;
  message: string;
  /** Baris lain di luar format standar (laporan lama / tulisan bebas). */
  extras: string[];
}

/** Pecah notes publik jadi topik / PR / pesan. Baris status & recording dilewati
 *  karena sudah ada kolomnya sendiri (attendance_status, recording_url). */
export function parseSessionNotes(notes?: string | null): ParsedSessionNotes {
  const out: ParsedSessionNotes = { topic: '', homework: '', message: '', extras: [] };
  for (const raw of publicNotes(notes).split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('📚 Topik:')) out.topic = line.slice('📚 Topik:'.length).trim();
    else if (line.startsWith('📝 PR:')) out.homework = line.slice('📝 PR:'.length).trim();
    else if (line.startsWith('💬')) out.message = line.slice('💬'.length).trim();
    else if (line.startsWith('🎥')) continue;
    else if (line.startsWith('Status:')) continue;
    else if (line === 'Sesi selesai') continue;
    else out.extras.push(line);
  }
  return out;
}

/** Label + warna badge presensi (samakan dgn HISA di dashboard pengajar). */
export const ATTENDANCE_BADGE: Record<string, { label: string; cls: string }> = {
  hadir: { label: 'Hadir', cls: 'bg-emerald-100 text-emerald-700' },
  izin: { label: 'Izin', cls: 'bg-amber-100 text-amber-700' },
  sakit: { label: 'Sakit', cls: 'bg-sky-100 text-sky-700' },
  alpa: { label: 'Alpa', cls: 'bg-red-100 text-red-700' },
};
