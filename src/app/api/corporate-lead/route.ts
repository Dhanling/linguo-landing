import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/corporate_leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        company_name: body.company_name,
        industry: body.industry,
        company_size: body.company_size,
        pic_name: body.pic_name,
        pic_title: body.pic_title,
        pic_email: body.pic_email,
        pic_phone: body.pic_phone,
        languages: body.languages,
        participant_count: body.participant_count,
        training_goal: body.training_goal,
        budget_range: body.budget_range,
        timeline: body.timeline,
        notes: body.notes,
        status: "new",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Corporate lead error:", err);
      return NextResponse.json({ error: err }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Corporate lead error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
