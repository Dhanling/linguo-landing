// [enroll-wajib-sesi-v1] Header untuk POST /api/enroll: JSON + JWT sesi siswa.
// Sejak audit 9 Nov 2026 route itu menolak panggilan tanpa sesi dan memakai email
// dari token (bukan dari body) — dulu siapa pun yang tahu email siswa bisa
// mengganti nama/nomor WA-nya atau membuat tagihan atas namanya.
import { supabase } from "@/lib/supabase-client";

export async function enrollHeaders(): Promise<Record<string, string>> {
  let token = "";
  try { token = (await supabase.auth.getSession()).data.session?.access_token ?? ""; } catch { /* tanpa sesi */ }
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
