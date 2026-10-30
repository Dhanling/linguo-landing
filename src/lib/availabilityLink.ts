// [availability-masih-sama-v1] Link sekali ketuk "Jadwal saya masih sama" untuk pengajar.
//
// Pencocokan jadwal (lib/cocokJadwal → jadwalPublikServer) hanya menghitung pengajar yang
// Availability-nya disentuh ≤ 30 hari. Pola mingguan jarang berubah, jadi pengajar tidak
// perlu mengisi ulang — cukup mengonfirmasi. Cron /api/cron/availability-reminder mengirim
// link ini lewat WA nomor Kurikulum; mengetuk "Ya, masih sama" memperbarui created_at baris
// teacher_availability-nya (sama dengan efek tombol Simpan di dashboard: hapus lalu isi ulang).
//
// Link ditandatangani dengan kunci server (pola ebookToken): tanpa login, tapi tidak bisa
// dipalsukan untuk pengajar lain. Berlaku 21 hari — pengingat berikutnya membawa link baru.
import crypto from "node:crypto";

const KUNCI = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const UMUR_MS = 21 * 86_400_000;

/** Batas "segar" yang sama dengan SEGAR_HARI di jadwalPublikServer. */
export const AVAIL_SEGAR_HARI = 30;

function tandaTangan(muatan: string): string {
  return crypto.createHmac("sha256", KUNCI).update(`avail-masih-sama.${muatan}`).digest("base64url");
}

export type TiketAvail = { t: string; exp: string; sig: string };

export function buatTiketAvail(teacherId: string): TiketAvail {
  const exp = String(Date.now() + UMUR_MS);
  return { t: teacherId, exp, sig: tandaTangan(`${teacherId}.${exp}`) };
}

export function linkMasihSama(baseUrl: string, teacherId: string): string {
  const { t, exp, sig } = buatTiketAvail(teacherId);
  return `${baseUrl}/availability/masih-sama?t=${encodeURIComponent(t)}&exp=${exp}&sig=${sig}`;
}

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const DAY_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const titik = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}.${String(m % 60).padStart(2, "0")}`;

/** Baris teacher_availability (day_of_week 0=Senin, time_slot "HH:mm" per 30 menit)
 *  → ["Senin 19.00–21.00", "Kamis 08.00–09.30"]. */
export function ringkasAvailability(rows: { day_of_week: number; time_slot: string }[], english = false): string[] {
  const perHari = new Map<number, number[]>();
  for (const r of rows) {
    const m = /^(\d{1,2}):(\d{2})/.exec(r.time_slot || "");
    if (!m || r.day_of_week < 0 || r.day_of_week > 6) continue;
    const arr = perHari.get(r.day_of_week) ?? [];
    arr.push(Number(m[1]) * 60 + Number(m[2]));
    perHari.set(r.day_of_week, arr);
  }
  const hasil: string[] = [];
  for (const d of [...perHari.keys()].sort((a, b) => a - b)) {
    const menit = [...new Set(perHari.get(d))].sort((a, b) => a - b);
    const rentang: string[] = [];
    let dari = menit[0];
    let akhir = dari + 30;
    for (const x of menit.slice(1)) {
      if (x === akhir) { akhir += 30; continue; }
      rentang.push(`${titik(dari)}–${titik(akhir)}`);
      dari = x;
      akhir = x + 30;
    }
    rentang.push(`${titik(dari)}–${titik(akhir)}`);
    hasil.push(`${(english ? DAY_EN : HARI)[d]} ${rentang.join(", ")}`);
  }
  return hasil;
}

/** Tiket → teacher id. null = tanda tangan palsu atau sudah kedaluwarsa. */
export function bacaTiketAvail(t: string | null, exp: string | null, sig: string | null): string | null {
  if (!KUNCI || !t || !exp || !sig) return null;
  const benar = tandaTangan(`${t}.${exp}`);
  if (sig.length !== benar.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(benar))) return null;
  const batas = Number(exp);
  if (!Number.isFinite(batas) || batas < Date.now()) return null;
  return /^[0-9a-f-]{36}$/i.test(t) ? t : null;
}
