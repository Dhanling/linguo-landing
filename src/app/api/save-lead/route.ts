import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { name, email, program, language, level } = await req.json();

    // First check if student exists, if not create
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/students?email=eq.${encodeURIComponent(email)}&select=id`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const existing = await checkRes.json();
    
    let studentId;
    if (existing && existing.length > 0) {
      studentId = existing[0].id;
    } else {
      // Create student
      const createRes = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=representation" },
        body: JSON.stringify({ name, email, phone: "", source: "google_oauth" }),
      });
      const created = await createRes.json();
      studentId = created?.[0]?.id;
    }

    if (studentId) {
      // Create registration
      await fetch(`${SUPABASE_URL}/rest/v1/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
        body: JSON.stringify({
          student_id: studentId,
          product: program || "Kelas Private",
          language: language || "English",
          level: level || "A1",
          status: "Aktif",
          pipeline_status: "New",
          payment_status: "Belum Bayar",
          total_amount: 0,
          notes: "Daftar via Google OAuth",
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Save lead error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
