// [audit9-ai-pagar-v1] Pagar login/peran untuk API route landing yang memanggil
// AI berbayar. Token = access token Supabase di header Authorization: Bearer,
// diverifikasi ke GoTrue (bukan sekadar decode JWT). Peran dibaca dari
// profiles.role memakai service role.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type PenggunaApi = { id: string; email: string };

/** Pengguna login (bukan anonim) dari header Authorization, atau null. */
export async function penggunaDariBearer(headers: Headers): Promise<PenggunaApi | null> {
  const auth = headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token || !SUPABASE_URL || !ANON_KEY) return null;
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

/** Peran profiles.role pengguna (string kosong bila tak ada / gagal dibaca). */
export async function peranPengguna(userId: string): Promise<string> {
  if (!SUPABASE_URL || !SERVICE_KEY) return "";
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    if (!res.ok) return "";
    const rows = await res.json();
    return String(rows?.[0]?.role ?? "").trim();
  } catch {
    return "";
  }
}
