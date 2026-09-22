// [reg-hapus-butuh-pemilik-v1] Pagar kepemilikan untuk endpoint yang MENGHAPUS
// registrasi (/api/cancel-enrollment, /api/expire-enrollment).
//
// Dulu keduanya cukup diberi `registrationId` di body — tanpa sesi, tanpa cek
// siapa pun — lalu menghapus barisnya memakai service role. Siapa saja yang
// pernah melihat sebuah id registrasi (id-nya muncul di URL /akun/kelas/<id>,
// di tautan, di layar yang di-share) bisa menghapus pendaftaran orang lain, dan
// tak ada jejak siapa yang melakukannya.
//
// Keduanya cuma dipanggil dari dashboard siswa yang SUDAH login, jadi syaratnya
// murah: bawa access token Supabase-nya, lalu cocokkan email token dengan email
// siswa pemilik registrasi itu. Staf Linguo (profiles.role) tetap diizinkan —
// admin memang kadang membatalkan atas nama siswa.
import { NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const PERAN_STAF = new Set(["owner", "admin", "teacher", "curriculum", "sales", "social_media"]);

const svcHeaders = {
  "Content-Type": "application/json",
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

export type HasilPagar =
  | { ok: true; email: string; staf: boolean }
  | { ok: false; status: number; error: string };

/** Email pemilik sesi (terverifikasi ke GoTrue), atau null. */
async function emailDariToken(req: NextRequest): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: ANON_KEY },
    });
    if (!res.ok) return null;
    const user = await res.json();
    if (!user?.id || user?.is_anonymous === true) return null;
    return { id: String(user.id), email: String(user.email ?? "").trim().toLowerCase() };
  } catch {
    return null;
  }
}

async function apakahStaf(userId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role`,
      { headers: svcHeaders },
    );
    if (!res.ok) return false;
    const rows = await res.json();
    return PERAN_STAF.has(String(rows?.[0]?.role ?? "").trim());
  } catch {
    return false;
  }
}

/**
 * Pastikan pemanggil berhak menyentuh registrasi ini.
 * `emailSiswa` = email siswa pemilik registrasi (sudah diambil pemanggil).
 */
export async function pastikanPemilikRegistrasi(
  req: NextRequest,
  emailSiswa: string | null | undefined,
): Promise<HasilPagar> {
  const sesi = await emailDariToken(req);
  if (!sesi) {
    return { ok: false, status: 401, error: "Masuk dulu ke akunmu untuk melakukan ini." };
  }
  if (emailSiswa && sesi.email && sesi.email === String(emailSiswa).trim().toLowerCase()) {
    return { ok: true, email: sesi.email, staf: false };
  }
  if (await apakahStaf(sesi.id)) {
    return { ok: true, email: sesi.email, staf: true };
  }
  return { ok: false, status: 403, error: "Pendaftaran ini bukan milik akunmu." };
}
