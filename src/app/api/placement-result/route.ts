import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language, level, score, timeElapsedSec, source, name, whatsapp, student_id } = body;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ success: false, error: "Missing Supabase config" }, { status: 500 });
    }

    const payload: Record<string, any> = {
      language, level, score,
      time_elapsed_sec: timeElapsedSec,
      source,
    };
    if (name) payload.name = name;
    if (whatsapp) payload.whatsapp = whatsapp;
    if (student_id) payload.student_id = student_id;

    const res = await fetch(SUPABASE_URL + "/rest/v1/placement_results", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ success: false, error: err }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
