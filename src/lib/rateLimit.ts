// [rate-limit-v1] Pembatas laju bersama untuk API route landing.
//
// Vercel menjalankan banyak kontainer sekaligus, jadi hitungan di memori tidak
// berarti apa-apa. Hitungan disimpan di Postgres (tabel api_rate_limits lewat RPC
// rate_limit_hit — hanya service role). Gagal menghubungi DB / fungsi belum ada
// = DIIZINKAN (fail-open): pembatas ini rem biaya & penyalahgunaan, bukan gerbang
// login, jadi jangan sampai gangguan DB mematikan fitur.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** true = boleh lanjut; false = jatah `max` per `windowSec` detik untuk `bucket` sudah habis. */
export async function batasLaju(bucket: string, windowSec: number, max: number): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return true;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2500);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/rate_limit_hit`, {
      method: "POST",
      signal: ctl.signal,
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_bucket: bucket.slice(0, 200), p_window_sec: windowSec, p_max: max }),
    }).finally(() => clearTimeout(t));
    if (!res.ok) return true;
    return (await res.json()) !== false;
  } catch {
    return true;
  }
}

/** IP pemanggil di belakang proxy Vercel. */
export function ipPemanggil(headers: Headers): string {
  return (headers.get("x-forwarded-for") || "").split(",")[0].trim() || headers.get("x-real-ip") || "tanpa-ip";
}
