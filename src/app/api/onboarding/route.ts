import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${token}&select=name,email,wa_number,language,program,level,onboarding_completed`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  if (!data || data.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data[0]);
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
