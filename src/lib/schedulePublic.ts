/* [konfirmasi-domain-linguo-v1] Klien halaman konfirmasi jadwal kelas
 * (/kelas/konfirmasi/<token>).
 *
 * Halaman ini pindah dari dashboard staf (teach.linguo.id/confirm/<token>).
 * Alasannya bukan cuma alamat yang lebih enak dibaca: link-nya dikirim ke grup
 * WhatsApp kelas, dan siswa yang membukanya mendarat di aplikasi staf — bundel
 * penuh dashboard beserta klien auth yang menunggu sesi login yang tidak akan
 * pernah ada. Rute lama sengaja dibiarkan hidup di sana supaya link yang sudah
 * tersebar di grup tidak mati.
 *
 * Semua data lewat edge function `schedule-public` (deployed --no-verify-jwt),
 * BUKAN query langsung: tabel `schedules` tidak punya policy SELECT untuk anon,
 * jadi versi lama yang membaca tabelnya langsung selalu berakhir "Jadwal tidak
 * ditemukan" bagi siswa yang belum login.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export type ScheduleStatus = "scheduled" | "pending" | "completed" | "cancelled" | "hangus";

export interface PublicSchedule {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: ScheduleStatus;
  notes: string | null;
  student_confirmed: boolean;
  session_number: number | null;
  session_title: string | null;
  zoom_join_url: string | null;
  language: string;
  level: string | null;
  hours_until: number;
  is_hangus: boolean;
  can_reschedule: boolean;
}

export interface PublicPerson {
  name: string;
  avatar_url: string | null;
}

export interface ScheduleConfirmData {
  schedule: PublicSchedule;
  student: (PublicPerson & { student_token: string | null }) | null;
  teacher: (PublicPerson & { title: string }) | null;
  ics_token: string | null;
}

export type ConfirmAction = "confirm" | "attend" | "cancel" | "reschedule";
export type ActionResult = "confirmed" | "attended" | "cancelled" | "hangus" | "rescheduled";

async function call(payload: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/schedule-public`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  let body: any = null;
  try { body = await res.json(); } catch { /* respons bukan JSON — ditangani di bawah */ }
  if (!body) throw new Error("Server tidak merespons. Coba lagi sebentar lagi.");
  if (!body.ok) throw new Error(body.error || "Terjadi kesalahan.");
  return body;
}

export async function loadSchedule(token: string): Promise<ScheduleConfirmData> {
  const b = await call({ action: "load", token });
  return { schedule: b.schedule, student: b.student, teacher: b.teacher, ics_token: b.ics_token ?? null };
}

export async function actSchedule(
  token: string,
  action: ConfirmAction,
  reason?: string,
): Promise<ActionResult> {
  const b = await call({ action, token, reason });
  return b.result as ActionResult;
}

/* ── Nama sapaan ────────────────────────────────────────────────────────────
   Kolom `name` di database berisi nama lengkap apa adanya, kadang lengkap
   dengan gelar ("Ayu Shinta Yuliani, S.Pd.,Gr"). Yang dipakai di halaman ini
   nama panggilan + sapaan: "Kak Ayu". Sebagian data pengajar menuliskan nama
   panggilannya di dalam kurung ("Ataya Syakira Azmi (aya)") — itu yang paling
   benar kalau ada, karena panggilan tidak selalu berasal dari kata pertama. */
const GELAR = /^(mr|mrs|ms|miss|dr|drs|ir|prof|kak|bu|pak|mba|mbak|mas)\.?$/i;

export function callName(fullName?: string | null): string {
  const raw = (fullName ?? "").trim();
  if (!raw) return "";

  const dalamKurung = raw.match(/\(([^)]{2,})\)/)?.[1]?.trim();
  const dasar = dalamKurung || raw.split(",")[0];

  const kata = dasar.replace(/\(.*?\)/g, " ").split(/\s+/).filter(Boolean);
  const pertama = kata.find((k) => !GELAR.test(k)) || kata[0] || "";
  return pertama.charAt(0).toUpperCase() + pertama.slice(1);
}

/** "Kak Ayu". `title` diambil dari data pengajar (nyaris selalu "Kak"). */
export function sapaan(fullName?: string | null, title = "Kak"): string {
  const nama = callName(fullName);
  if (!nama) return "";
  return `${(title || "Kak").trim()} ${nama}`;
}

/** Inisial untuk avatar tanpa foto — satu huruf, dari nama panggilan. */
export function initial(fullName?: string | null): string {
  return callName(fullName).charAt(0).toUpperCase() || "?";
}

/** URL feed langganan kalender. Kosong kalau siswa belum punya token. */
export function subscribeUrl(icsToken?: string | null): string {
  if (!icsToken || !SUPABASE_URL) return "";
  return `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/student-ics?t=${icsToken}`;
}
