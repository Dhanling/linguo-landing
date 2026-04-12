import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, languages, level, experience, note } = body;

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !languages?.trim()) {
      return NextResponse.json({ error: "Nama, email, telepon, dan bahasa wajib diisi" }, { status: 400 });
    }

    // Insert into Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/teacher_applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        languages: languages.trim(),
        level: level || null,
        experience: experience || null,
        note: note || null,
        status: "submitted",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase error:", err);
      return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, id: data[0]?.id });
  } catch (e: any) {
    console.error("Teacher apply error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
