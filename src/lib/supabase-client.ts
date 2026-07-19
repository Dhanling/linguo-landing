import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// [akun-oauth-error-surface-v2] Snapshot pesan error OAuth dari URL SEBELUM GoTrue
// sempat membersihkan hash — useEffect React sering kalah cepat dari SDK, jadi error
// "hilang tanpa jejak" kalau dibaca belakangan. Dibaca sinkron di sini (module load,
// sebelum createBrowserClient) supaya pasti kebaca.
export const initialAuthError: { code: string; description: string } | null = (() => {
  if (typeof window === "undefined") return null;
  try {
    const hp = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const qp = new URLSearchParams(window.location.search);
    const code = hp.get("error") || qp.get("error") || "";
    const description = hp.get("error_description") || qp.get("error_description") || "";
    return code ? { code, description } : null;
  } catch {
    return null;
  }
})();

// [auth-cookie-session-v1] Sesi disimpan di COOKIE (bukan localStorage).
// Kenapa: di Safari, localStorage yang ditulis saat landing balik dari OAuth
// gampang disapu/di-cap ITP → user "keluar sendiri" begitu di-refresh, padahal
// login sukses. `createBrowserClient` dari @supabase/ssr nyimpen sesi di cookie,
// dan `middleware.ts` nge-refresh + set-ulang cookie itu SERVER-SIDE tiap navigasi
// (cookie yang di-set server tak kena cap script-writable ITP) → sesi awet.
//
// Flow OAuth otomatis jadi PKCE (default @supabase/ssr): code_verifier ikut
// disimpan di cookie, jadi pertukaran ?code→session tetap jalan walau Safari.
// Semua komponen tetap `import { supabase } from "@/lib/supabase-client"` — tak berubah.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
