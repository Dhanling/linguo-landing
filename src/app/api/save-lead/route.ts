import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function supaFetch(path: string, options?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options?.headers || {}),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, program, language, level } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanLang = language || "English";
    const cleanProgram = program || "Kelas Private";
    const cleanLevel = level || "A1";

    // Step 1: Check if student exists
    const checkRes = await supaFetch(`students?email=eq.${encodeURIComponent(email)}&select=id,student_token`);
    const existing = checkRes.ok ? await checkRes.json() : [];
    let studentId: string | undefined;
    let studentToken: string | undefined;
    let isExisting = false;

    if (existing.length > 0) {
      studentId = existing[0].id;
      studentToken = existing[0].student_token;
      isExisting = true;
      // Ensure token exists for old students
      if (!studentToken) {
        studentToken = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
        await supaFetch(`students?id=eq.${studentId}`, {
          method: "PATCH",
          body: JSON.stringify({ student_token: studentToken }),
        });
      }
    }

    // Step 2: Create student if not exists
    if (!studentId) {
      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      const createRes = await supaFetch("students", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          name: name || "Student",
          email,
          whatsapp: "",
          student_token: token,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.text();
        return NextResponse.json({ error: "Failed to create student", detail: err }, { status: 500 });
      }
      const created = await createRes.json();
      studentId = created?.[0]?.id;
      studentToken = token;
    }

    if (!studentId) {
      return NextResponse.json({ error: "No student ID" }, { status: 500 });
    }

    // Step 3: Check for DUPLICATE registration (same student + same language + pending/active)
    const dupCheckRes = await supaFetch(
      `registrations?student_id=eq.${studentId}&language=eq.${encodeURIComponent(cleanLang)}&status=in.(Aktif,Menunggu Pembayaran)&select=id,status`
    );
    const dupRegs = dupCheckRes.ok ? await dupCheckRes.json() : [];

    if (dupRegs.length > 0) {
      // Already has this class — don't create duplicate
      return NextResponse.json({
        success: true,
        studentId,
        studentToken,
        isExisting: true,
        duplicate: true,
        existingStatus: dupRegs[0].status,
        message: `Kamu sudah terdaftar di kelas ${cleanLang} (${dupRegs[0].status})`,
      });
    }

    // Step 4: Create registration with "Menunggu Pembayaran"
    const regRes = await supaFetch("registrations", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        student_id: studentId,
        product: cleanProgram,
        language: cleanLang,
        level: cleanLevel,
        status: "Menunggu Pembayaran",
        pipeline_status: "New",
        total_amount: 0,
        notes: "Daftar via Google OAuth — menunggu pembayaran",
      }),
    });

    if (!regRes.ok) {
      // Fallback: minimal insert
      const regRes2 = await supaFetch("registrations", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          student_id: studentId,
          product: cleanProgram,
          language: cleanLang,
          level: cleanLevel,
          status: "Menunggu Pembayaran",
          notes: "Daftar via Google OAuth — menunggu pembayaran",
        }),
      });
      if (!regRes2.ok) {
        const err = await regRes2.text();
        return NextResponse.json({ error: "Failed to create registration", detail: err }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      studentId,
      studentToken,
      isExisting,
      duplicate: false,
    });
  } catch (e: any) {
    console.error("Save lead error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
