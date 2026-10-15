// [sertifikat-nama-pengajar-v1] Nama/title/foto pengajar untuk dashboard siswa.
//
// Kenapa lewat route ini: RLS tabel `teachers` cuma membuka SELECT untuk role
// `anon` (kolom publik saja: name, title, avatar_url, dst.). Siswa yang SUDAH
// login berjalan sebagai `authenticated` → embed `teachers(name)` dan query
// langsung dari /akun pulang kosong, jadi sertifikat jatuh ke "Pengajar Linguo".
// Route ini membaca pakai ANON key (bukan service role), jadi yang keluar persis
// data yang memang sudah publik — tidak membuka kolom baru.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const ids = Array.from(
    new Set((req.nextUrl.searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter((s) => UUID.test(s))),
  ).slice(0, 50);
  if (ids.length === 0) return NextResponse.json({ teachers: [] });
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.from("teachers").select("id, name, title, avatar_url").in("id", ids);
    if (error) return NextResponse.json({ teachers: [] }, { status: 200 });
    return NextResponse.json(
      { teachers: data || [] },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } },
    );
  } catch {
    return NextResponse.json({ teachers: [] });
  }
}
