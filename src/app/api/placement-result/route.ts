import { NextRequest, NextResponse } from "next/server";

// Log placement test results — fire & forget from client
// Writes to leads table (or creates lightweight record) with placement_level + source

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language, level, score, timeElapsedSec, source } = body;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ success: false, error: "Missing Supabase config" }, { status: 500 });
    }

    // Insert into placement_results table (lightweight log)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/placement_results`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        language,
        level,
        score,
        time_elapsed_sec: timeElapsedSec,
        source,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("placement-result insert failed:", err);
      return NextResponse.json({ success: false, error: err }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("placement-result error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
