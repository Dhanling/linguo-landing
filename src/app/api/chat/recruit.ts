// [ling-chat-pelamar-bukan-lead-v1] Pengunjung chat Minling yang sedang melamar
// (pengajar, penerjemah, interpreter, magang, staf, lingfluencer/afiliator) BUKAN
// calon siswa. Dulu kontak pre-chat mereka ikut masuk tabel `leads`, jadi admin
// mem-follow-up pelamar seolah calon siswa (laporan Faujiah 455ebe75, 5 Nov 2026),
// dan Minling menawari kelas ke calon pengajar (laporan Syifa 66f7a153).
import type { SupabaseClient } from "@supabase/supabase-js";

const RECRUIT_PAGE_RE =
  /\/(jadi-pengajar|karir|lowongan|loker|lamar|magang|internship|penerjemah|interpreter|lingfluencer|afiliator)(\/|\?|#|$)/i;

/** Halaman tempat chat dibuka adalah halaman rekrutmen/kemitraan, bukan halaman kelas. */
export function isRecruitPage(page: string | null | undefined): boolean {
  return !!page && RECRUIT_PAGE_RE.test(page);
}

/** Nomor/email ini sudah tercatat sebagai pelamar atau pengajar Linguo. */
export async function isKnownApplicant(
  db: SupabaseClient,
  wa: string | null,
  email: string | null,
): Promise<boolean> {
  try {
    const checks: PromiseLike<{ data: unknown[] | null }>[] = [];
    if (wa) {
      checks.push(db.from("teacher_applications").select("id").eq("phone", wa).limit(1));
      checks.push(db.from("teachers").select("id").eq("whatsapp", wa).limit(1));
    }
    if (email) {
      checks.push(db.from("teacher_applications").select("id").ilike("email", email).limit(1));
      checks.push(db.from("teachers").select("id").ilike("email", email).limit(1));
    }
    const res = await Promise.all(checks);
    return res.some((r) => (r.data?.length ?? 0) > 0);
  } catch {
    return false;
  }
}

/** Blok konteks prompt untuk pengunjung di halaman rekrutmen. */
export function recruitContextBlock(page: string | null | undefined): string {
  if (!isRecruitPage(page)) return "";
  if (/\/jadi-pengajar/i.test(page || "")) {
    return `KONTEKS HALAMAN: pengunjung sedang membuka ${page} = halaman PENDAFTARAN PENGAJAR. Anggap dia CALON PENGAJAR, bukan calon siswa — JANGAN menawarkan kelas, harga kelas, trial, atau placement test kecuali dia sendiri bertanya soal belajar. Kalau dia sudah mengisi form: sampaikan data pendaftaran pengajar masuk ke tim rekrutmen, prosesnya seleksi berkas → microteaching (video mengajar singkat, link dikirim lewat email/WA) → onboarding; kabar tiap tahap dikirim lewat WhatsApp/email. Akses Teacher Dashboard (teach.linguo.id) baru dibuka sesudah dia lolos & di-onboarding — sebelum itu wajar kalau emailnya "belum terdaftar sebagai pengajar". Jangan menjanjikan diterima atau tanggal pasti.`;
  }
  return `KONTEKS HALAMAN: pengunjung sedang membuka ${page} (halaman rekrutmen/kemitraan, bukan halaman kelas). Anggap dia pelamar/calon mitra, bukan calon siswa — jangan menawarkan kelas kecuali dia sendiri bertanya soal belajar.`;
}
