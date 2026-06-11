// =============================================================================
// /api/affiliate/validate
// [referral-code-trial-v1]
// Validasi kode referral untuk form (Trial Class). Tabel `affiliates` ditutup
// RLS untuk anon (lihat /api/affiliate/me), jadi lookup-nya WAJIB lewat server
// route ber-service-role, bukan supabase client di browser.
//   GET /api/affiliate/validate?code=KODE
//   → { valid: true, id, name }  bila ada affiliate active dengan kode itu
//   → { valid: false }           bila tidak ada
// Hanya mengembalikan id + name (bukan data sensitif lain) supaya aman dipakai
// dari browser.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") || "").trim();
  if (!code) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/affiliates` +
        `?referral_code=eq.${encodeURIComponent(code)}` +
        `&status=eq.active&select=id,name&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (!res.ok) {
      console.warn("affiliate validate lookup failed:", await res.text());
      return NextResponse.json({ valid: false });
    }
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0]?.id) {
      return NextResponse.json({
        valid: true,
        id: rows[0].id as string,
        name: (rows[0].name as string | null) ?? null,
      });
    }
    return NextResponse.json({ valid: false });
  } catch (e) {
    console.warn("affiliate validate threw:", e);
    return NextResponse.json({ valid: false });
  }
}
