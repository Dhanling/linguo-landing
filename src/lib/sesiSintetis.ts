// [jadwal-hantu-hidden-v1] Baris `schedules` sintetis hasil auto-presensi.
//
// Waktu pengajar menaikkan angka "sesi terpakai" lewat blok presensi 1-klik,
// dashboard pengajar ikut menambal baris `schedules` berstatus completed supaya fee
// di Pencairan Pengajar terhitung. Tanggal asli sesinya TIDAK diketahui dari angka
// itu, jadi barisnya ditaruh di hari pencatatan jam 12.00 (detiknya digeser biar
// tidak tabrakan). Baris itu catatan pembukuan — BUKAN kelas yang benar-benar
// dijadwalkan pada jam tersebut.
//
// Dashboard pengajar sudah lama membuangnya dari kalender; dashboard siswa belum,
// sehingga muncul tumpukan blok palsu jam 12.00 (kasus Moh. Zayyan, Rabu 2 Sep 2026:
// tiga blok jam 12.00 padahal kelasnya jam 07.00–09.00). Barisnya tetap dibiarkan
// hidup di database supaya perhitungan presensi & pencairan tidak berubah — yang
// disembunyikan hanya tampilannya di kalender/linimasa.
export const AUTO_PRESENSI_NOTE = "Dicatat otomatis dari blok sesi";

export function isSesiSintetis(s?: { notes?: string | null } | null): boolean {
  return (s?.notes || "") === AUTO_PRESENSI_NOTE;
}

/** Buang baris presensi sintetis dari sederet baris `schedules`. */
export function tanpaSesiSintetis<T extends { notes?: string | null }>(rows: T[]): T[] {
  return (rows || []).filter((r) => !isSesiSintetis(r));
}
