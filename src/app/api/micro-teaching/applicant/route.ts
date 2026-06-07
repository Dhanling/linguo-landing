import { NextRequest, NextResponse } from "next/server";

// ── micro-teaching form: lookup data pelamar via token (service-role) ──
// Client TIDAK PERNAH baca tabel langsung (hindari enumerasi). Semua server-side.
// Pola contek dari api/create-invoice/route.ts (raw fetch PostgREST).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token || !UUID_RE.test(token)) {
      return NextResponse.json({ error: "Token tidak valid." }, { status: 400 });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/teacher_applications` +
        `?microteaching_token=eq.${token}` +
        `&select=name,microteaching_status,microteaching_deadline,microteaching_submitted_at,microteaching_video_url` +
        `&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("micro-teaching applicant lookup error:", err);
      return NextResponse.json({ error: "Gagal mengambil data." }, { status: 500 });
    }

    const rows = await res.json();
    const a = Array.isArray(rows) ? rows[0] : null;
    if (!a) {
      return NextResponse.json({ error: "Pelamar tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      name: a.name ?? null,
      deadline: a.microteaching_deadline ?? null,
      status: a.microteaching_status ?? null,
      alreadySubmitted: !!a.microteaching_submitted_at,
      videoUrl: a.microteaching_video_url ?? null,
    });
  } catch (e) {
    console.error("micro-teaching applicant route error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
