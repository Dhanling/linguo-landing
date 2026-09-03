// [jadwal-hantu-hidden-v1] Baris `schedules` sintetis hasil auto-presensi.
//
// Waktu pengajar menaikkan angka "sesi terpakai" lewat blok presensi 1-klik,
// dashboard pengajar ikut menambal baris `schedules` berstatus completed supaya fee
// di Pencairan Pengajar terhitung. Tanggal asli sesinya TIDAK diketahui dari angka
// itu, jadi barisnya ditaruh di hari pencatatan jam 12.00 — dan kalau sekali klik
// menambah beberapa sesi, DETIK-nya digeser 0,1,2,… biar tidak saling menimpa.
//
// Baris itu catatan pembukuan, BUKAN kelas yang benar-benar dijadwalkan jam segitu.
// Dashboard pengajar sudah lama membuangnya dari kalender; dashboard siswa belum,
// sehingga muncul tumpukan blok palsu jam 12.00 (kasus Moh. Zayyan, Rabu 2 Sep 2026:
// tiga blok jam 12.00 padahal kelasnya jam 07.00–09.00). Barisnya tetap dibiarkan
// hidup di database supaya perhitungan presensi & pencairan tidak berubah — yang
// disembunyikan hanya tampilannya di kalender/linimasa.
export const AUTO_PRESENSI_NOTE = "Dicatat otomatis dari blok sesi";

/** Baris jadwal apa adanya — terima bentuk DB (snake_case) & bentuk kalender (camelCase). */
export type BarisSesi = {
  id?: string | null;
  status?: string | null;
  notes?: string | null;
  scheduled_at?: string | null;
  scheduledAt?: string | null;
  session_number?: number | null;
  sessionNumber?: number | null;
  registration_id?: string | null;
  registrationId?: string | null;
};

const waktuSesi = (s: BarisSesi) => s.scheduled_at || s.scheduledAt || "";
const nomorSesi = (s: BarisSesi) => s.session_number ?? s.sessionNumber ?? null;
const regSesi = (s: BarisSesi) => String(s.registration_id || s.registrationId || "");

/** Penanda pasti: kolom `notes` bilang baris ini penambal otomatis. */
export function isSesiSintetis(s?: BarisSesi | null): boolean {
  return (s?.notes || "") === AUTO_PRESENSI_NOTE;
}

/**
 * Tebakan cadangan buat payload yang TIDAK membawa kolom `notes` — mis. tab yang
 * masih memakai salinan lama (POV pratinjau kedaluwarsa, cache sesi browser), atau
 * endpoint lawas. Tanpa ini blok hantunya balik lagi sampai datanya ditarik ulang.
 *
 * Yang dipakai cuma tanda yang TIDAK BISA salah: `scheduled_at` berdetik bukan nol.
 * Semua pintu penjadwalan (form pengajar, admin, batch) selalu menulis detik 00 —
 * satu-satunya penulis detik 1,2,3… adalah penambal otomatis. Baris penambal lain
 * dari klik yang sama (yang kebagian detik 00) ikut dikenali lewat menit + registrasi
 * yang sama, asal sama-sama `completed` dan tanpa nomor sesi.
 */
function tebakanSintetis(rows: BarisSesi[]): Set<string> {
  const out = new Set<string>();
  const menitKotor = new Set<string>();
  const kandidat = (s: BarisSesi) =>
    s.status === "completed" && !nomorSesi(s) && !s.notes;

  const kunciMenit = (s: BarisSesi) => `${regSesi(s)}|${waktuSesi(s).slice(0, 16)}`;
  for (const s of rows) {
    const t = waktuSesi(s);
    if (!t || !kandidat(s)) continue;
    const detik = new Date(t).getSeconds();
    if (detik !== 0) menitKotor.add(kunciMenit(s));
  }
  if (!menitKotor.size) return out;
  for (const s of rows) {
    if (!s.id || !kandidat(s)) continue;
    if (menitKotor.has(kunciMenit(s))) out.add(String(s.id));
  }
  return out;
}

/** Kumpulan id baris yang tak boleh digambar (penanda pasti + tebakan cadangan). */
export function idSesiSintetis(rows: BarisSesi[]): Set<string> {
  const daftar = rows || [];
  const out = tebakanSintetis(daftar);
  for (const s of daftar) if (s?.id && isSesiSintetis(s)) out.add(String(s.id));
  return out;
}

/** Buang baris presensi sintetis dari sederet baris `schedules`. */
export function tanpaSesiSintetis<T extends BarisSesi>(rows: T[]): T[] {
  const daftar = rows || [];
  const buang = idSesiSintetis(daftar);
  if (!buang.size) return daftar;
  return daftar.filter((r) => !r?.id || !buang.has(String(r.id)));
}
