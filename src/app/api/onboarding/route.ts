import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${encodeURIComponent(token)}&select=name,email,wa_number,language,program,level,onboarding_completed,converted_registration_id`,
    { headers, cache: "no-store" }
  );
  const data = await res.json();
  if (!data || data.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { converted_registration_id, ...lead } = data[0];

  // [onboarding-ke-pendataan-v1] Private/Semi/Kids punya form pendataan sendiri
  // (student_intake_forms) — itu yang ditunggu pencarian pengajar & notif grup
  // Kurikulum. Form onboarding ini cuma menulis ke `leads`, jadi siswa yang
  // mengisinya tetap tercatat "belum isi form". Begitu registrasinya ada,
  // halaman diarahkan ke form pendataan milik registrasi itu.
  let pendataan_token: string | null = null;
  if (converted_registration_id) {
    try {
      const f = await fetch(
        `${SUPABASE_URL}/rest/v1/student_intake_forms?registration_id=eq.${converted_registration_id}&select=token&order=created_at.desc&limit=1`,
        { headers, cache: "no-store" }
      );
      const rows = f.ok ? await f.json() : [];
      pendataan_token = rows?.[0]?.token ?? null;
    } catch {
      /* form pendataan tak terbaca → pakai form onboarding seperti biasa */
    }
  }
  return NextResponse.json({ ...lead, pendataan_token });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, birthdate, domicile, reason, experience, schedule_preference, learning_goal } = body;

    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${token}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          birthdate,
          domicile,
          reason,
          experience,
          schedule_preference,
          learning_goal,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Onboarding update error:", err);
      return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
