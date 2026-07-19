import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// [akun-oauth-error-surface-v2] Snapshot pesan error OAuth dari URL SEBELUM GoTrue
// sempat membersihkan hash — useEffect React sering kalah cepat dari SDK, jadi error
// "hilang tanpa jejak" kalau dibaca belakangan. Dibaca sinkron di sini (module load,
// sebelum createClient) supaya pasti kebaca.
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "implicit",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
