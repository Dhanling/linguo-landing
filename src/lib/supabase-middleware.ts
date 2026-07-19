// ============================================================================
// [auth-cookie-session-v1] Refresh sesi Supabase di middleware
// ----------------------------------------------------------------------------
// Baca sesi dari cookie request, panggil getUser() (memvalidasi + me-refresh
// token bila perlu), lalu SET-ULANG cookie sesi lewat response. Cookie yang
// di-set dari server (Set-Cookie) tak kena cap "script-writable storage" ITP
// Safari — inilah kunci sesi tetap awet saat halaman di-refresh.
//
// Mengembalikan { response } supaya middleware bisa menempelkan logika lain
// (mis. cookie referral affiliate) ke response yang SAMA sebelum dikirim.
// ============================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function updateSupabaseSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // WAJIB: getUser() memicu refresh + setAll() di atas. Jangan pakai getSession()
  // di server (tidak memvalidasi ke Auth server).
  await supabase.auth.getUser();

  return response;
}
