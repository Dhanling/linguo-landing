import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client khusus Server Component / Route Handler.
 *
 * Beda dari `supabase-client.ts` (browser):
 * - Tidak menyimpan/persist session (server tidak punya browser storage).
 * - fetch dibungkus dengan opsi Next.js `{ next: { revalidate } }` supaya hasil
 *   query di-cache oleh Next.js Data Cache, bukan di-fetch ulang tiap request.
 *
 * Pakai SERVICE_ROLE_KEY kalau ada (server-only, tidak pernah sampai ke browser),
 * fallback ke ANON_KEY. URL hanya tersedia sebagai NEXT_PUBLIC di project ini.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Bikin server client dengan window revalidate tertentu (detik).
 * Default 3600 (1 jam).
 */
export function createServerClient(revalidateSeconds = 3600) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      // Suntik opsi cache Next.js ke setiap request supabase-js.
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate: revalidateSeconds } }),
    },
  });
}
