// [kelas-video-siswa-v1] Satu sumber untuk semua tautan Kelas Video Linguo.
//
// Dulu `CLASS_ROOM_ORIGIN` + `classRoomUrl` + `isJoinable` disalin di dua tempat
// (akun/page.tsx dan JadwalCalendar.tsx) — gampang lepas sinkron begitu salah
// satu diubah. Semua sekarang di sini.
//
// Kelas videonya sendiri hidup di dashboard (aplikasi terpisah), tapi room id-nya
// diturunkan dari id jadwal (`sched-<schedule.id>`) sehingga siswa tidak perlu
// menunggu pengajar mengirim link apa pun.

export const CLASS_ROOM_ORIGIN = "https://dashboard.linguo.id";

export interface ClassRoomLinkOpts {
  title?: string;
  teacher?: string;
  /** Nama siswa — biar dia tidak perlu mengetik namanya lagi di halaman masuk. */
  name?: string;
}

export function classRoomUrl(scheduleId: string, opts: ClassRoomLinkOpts = {}): string {
  const q = new URLSearchParams({ guest: "1" });
  if (opts.title) q.set("title", opts.title);
  if (opts.teacher) q.set("teacher", opts.teacher);
  if (opts.name) q.set("name", opts.name);
  return `${CLASS_ROOM_ORIGIN}/kelas/sched-${scheduleId}?${q.toString()}`;
}

/** Tombol masuk kelas muncul 30 menit sebelum jam mulai s/d 3 jam sesudahnya —
 *  di luar jendela itu siswa cuma akan masuk room kosong. */
export function isJoinable(scheduledAt: string | Date): boolean {
  const start = (scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt)).getTime();
  const now = Date.now();
  return now >= start - 30 * 60_000 && now <= start + 3 * 60 * 60_000;
}

// ── Rekaman kelas ──────────────────────────────────────────────────────────
// `schedules.recording_url` diisi dashboard sebagai deep link ke Riwayat Kelas
// (`https://dashboard.linguo.id/kelas?tab=riwayat&room=<roomId>`). Halaman itu
// KHUSUS TIM — siswa yang mengkliknya cuma mentok di layar login dashboard.
// Di sisi siswa, tautan itu kita alihkan ke pemutar sendiri di linguo.id yang
// memverifikasi kepemilikan lalu membuat signed URL (bucket rekaman privat).

/** Ambil roomId dari nilai `schedules.recording_url` apa pun bentuknya. */
export function roomIdFromRecordingUrl(recordingUrl: string): string | null {
  if (!recordingUrl) return null;
  try {
    const u = new URL(recordingUrl, CLASS_ROOM_ORIGIN);
    const fromQuery = u.searchParams.get("room");
    if (fromQuery) return fromQuery;
    // Bentuk lain yang pernah dipakai: .../kelas/<roomId>
    const m = u.pathname.match(/\/kelas\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Tautan "Tonton Recording" yang benar untuk siswa.
 * - Deep link Riwayat dashboard → pemutar internal `/akun/rekaman/<roomId>`.
 * - URL lain (mis. link Zoom/Drive yang ditempel pengajar manual) dibiarkan apa
 *   adanya — itu memang tautan eksternal yang sengaja dibagikan.
 */
export function studentRecordingHref(recordingUrl: string): string {
  const isDashboardDeepLink =
    recordingUrl.includes("dashboard.linguo.id") && recordingUrl.includes("room=");
  if (!isDashboardDeepLink) return recordingUrl;
  const roomId = roomIdFromRecordingUrl(recordingUrl);
  return roomId ? `/akun/rekaman/${encodeURIComponent(roomId)}` : recordingUrl;
}

/** Tautan internal (buka di tab yang sama) atau eksternal (tab baru)? */
export const isInternalRecordingHref = (href: string) => href.startsWith("/akun/rekaman/");
