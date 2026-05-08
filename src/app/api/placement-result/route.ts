import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { language, level, score, timeElapsedSec, source, name, email, whatsapp, student_id } = body;

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
    if (email) payload.email = email;
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
    // Upsert ke leads table kalau ada email atau whatsapp
    if (email || whatsapp) {
      const leadPayload: Record<string, any> = {
        status: "Baru",
        program: "Placement Test",
        language: language || null,
        level: level || null,
        referral_source: source || "placement-test",
      };
      if (name) leadPayload.name = name;
      if (email) leadPayload.email = email;
      if (whatsapp) leadPayload.wa_number = whatsapp;

      // Upsert by email kalau ada, kalau tidak insert baru
      if (email) {
        await fetch(SUPABASE_URL + "/rest/v1/leads?on_conflict=email", {
          method: "POST",
          headers: {
            "apikey": SUPABASE_KEY!,
            "Authorization": "Bearer " + SUPABASE_KEY,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(leadPayload),
        }).catch(() => {});
      } else {
        await fetch(SUPABASE_URL + "/rest/v1/leads", {
          method: "POST",
          headers: {
            "apikey": SUPABASE_KEY!,
            "Authorization": "Bearer " + SUPABASE_KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify(leadPayload),
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
