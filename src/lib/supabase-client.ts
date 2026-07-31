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
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, { auth: { debug: true } });

/**
 * [perf:session-cookie-peek-v1] Identitas sesi dibaca LANGSUNG dari cookie, sinkron.
 *
 * `supabase.auth.getSession()` itu async: dia antre di Web Locks (bentrok antar tab)
 * dan bisa menembak refresh token ke jaringan dulu. Halaman /akun menahan seluruh
 * layar di balik spinner sampai janji itu selesai — jadi tiap balik dari Watch &
 * Learn (atau menu lain yang route-nya terpisah) dashboard terasa "loading lama"
 * padahal datanya sudah ada di cache localStorage.
 *
 * Fungsi ini cuma untuk MEMULAI render lebih awal (optimistis). getSession() tetap
 * dijalankan sesudahnya dan jawabannya yang berlaku — kalau ternyata sesi mati,
 * halaman balik ke gate login sendiri.
 *
 * @supabase/ssr menyimpan sesi di cookie `sb-<ref>-auth-token`, isinya
 * `base64-<json>` dan dipecah jadi `.0`, `.1`, … kalau kepanjangan.
 */
export function peekSessionUser(): { id: string; email: string | null } | null {
  if (typeof document === "undefined") return null;
  try {
    const jar: Record<string, string> = {};
    for (const part of document.cookie.split("; ")) {
      const i = part.indexOf("=");
      if (i > 0) jar[part.slice(0, i)] = part.slice(i + 1);
    }
    const keys = Object.keys(jar)
      .filter((k) => /^sb-.+-auth-token(\.\d+)?$/.test(k))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (!keys.length) return null;
    let raw = keys.map((k) => decodeURIComponent(jar[k])).join("");
    if (raw.startsWith("base64-")) {
      const bin = atob(raw.slice(7));
      raw = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    }
    const s = JSON.parse(raw);
    const id = s?.user?.id;
    if (!id) return null;
    // Token kadaluarsa → jangan optimistis; biarkan alur normal yang memutuskan.
    if (typeof s.expires_at === "number" && s.expires_at * 1000 <= Date.now()) return null;
    return { id, email: s.user.email ?? null };
  } catch {
    return null;
  }
}
