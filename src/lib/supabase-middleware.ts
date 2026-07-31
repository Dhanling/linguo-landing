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
//
// [auth-no-prefetch-rotate-v1] "Klik Beranda malah keluar akun" — akarnya:
//   • Sidebar LMS (StudentShell) punya 5 <Link prefetch> (Lingbook, Watch,
//     Kosakata, Grup, Perpustakaan). Begitu halaman ber-shell dibuka, Next
//     menembak 5 request prefetch BARENGAN, dan middleware ini jalan di
//     tiap-tiapnya → 5 getUser() serentak memakai refresh token YANG SAMA.
//   • Refresh token Supabase itu rotating: yang pertama menukar dapat token
//     baru, sisanya di luar jendela reuse ditolak "Already Used". Klien server
//     yang ditolak lalu MENGHAPUS cookie sesi lewat response prefetch itu.
//   • User tak melihat apa-apa saat itu (halaman detail kelas masih tampil
//     dari handoff sessionStorage) — barulah pas pindah ke /akun ketahuan
//     sesinya sudah kosong, jadi terasa "diklik Beranda = ke-logout".
// Dua penawarnya di file ini: (1) request prefetch tidak ikut merotasi token,
// (2) middleware tidak pernah menghapus cookie sesi — logout hanya boleh dari
// aksi user (signOut di klien) yang memang menghapus cookie sendiri.
// ============================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Request spekulatif (prefetch <Link>) — bukan navigasi sungguhan. */
function isPrefetch(request: NextRequest): boolean {
  const h = request.headers;
  return (
    h.get("next-router-prefetch") === "1" ||
    h.get("purpose") === "prefetch" ||
    h.get("x-purpose") === "prefetch" ||
    h.get("x-moz") === "prefetch"
  );
}

export async function updateSupabaseSession(
  request: NextRequest,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // Prefetch tak boleh menyentuh sesi: tak ada yang dirender ke user, tapi
  // rotasi tokennya nyata dan bisa saling menginjak (lihat catatan di atas).
  if (isPrefetch(request)) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Penghapusan murni (semua nilai kosong) = klien server memutuskan sesi
        // mati — biasanya karena refresh ditolak (token kadung dirotasi request
        // lain, atau Auth server lagi kedip). Middleware TIDAK ikut menghapus:
        // biarkan klien browser yang memutuskan, dia punya konteksnya. Kalau
        // sesinya memang benar-benar mati, gate login tetap muncul dari sana.
        if (cookiesToSet.every(({ value }) => !value)) return;

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
