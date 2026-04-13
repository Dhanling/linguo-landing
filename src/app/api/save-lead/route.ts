import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  const logs: string[] = [];
  try {
    const body = await req.json();
    const { name, email, program, language, level } = body;
    logs.push("Input: " + JSON.stringify({ name, email, program, language, level }));

    if (!email) {
      return NextResponse.json({ error: "Email is required", logs }, { status: 400 });
    }

    // Step 1: Check if student exists
    const checkUrl = `${SUPABASE_URL}/rest/v1/students?email=eq.${encodeURIComponent(email)}&select=id`;
    const checkRes = await fetch(checkUrl, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const checkText = await checkRes.text();
    logs.push("Check student: " + checkRes.status);

    let studentId: string | undefined;
    
    if (checkRes.ok) {
      const existing = JSON.parse(checkText);
      if (existing && existing.length > 0) {
        studentId = existing[0].id;
        logs.push("Existing student: " + studentId);
      }
    }

    // Step 2: Create student if not exists
    if (!studentId) {
      const createRes = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({ name: name || "Student", email, whatsapp: "" }),
      });
      const createText = await createRes.text();
      logs.push("Create student: " + createRes.status);

      if (createRes.ok) {
        const created = JSON.parse(createText);
        studentId = created?.[0]?.id;
      } else {
        return NextResponse.json({ error: "Failed to create student", detail: createText, logs }, { status: 500 });
      }
    }

    if (!studentId) {
      return NextResponse.json({ error: "No student ID", logs }, { status: 500 });
    }

    // Step 3: Create registration — minimal fields only, let DB defaults handle the rest
    const regBody = {
      student_id: studentId,
      product: program || "Kelas Private",
      language: language || "English",
      level: level || "A1",
      status: "Aktif",
      pipeline_status: "New",
      total_amount: 0,
      notes: "Daftar via Google OAuth",
    };
    logs.push("Creating registration: " + JSON.stringify(regBody));

    const regRes = await fetch(`${SUPABASE_URL}/rest/v1/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(regBody),
    });
    const regText = await regRes.text();
    logs.push("Registration: " + regRes.status);

    if (!regRes.ok) {
      // If still failing, try with absolute minimal fields
      logs.push("First attempt failed: " + regText);
      logs.push("Trying minimal insert...");
      
      const minBody = {
        student_id: studentId,
        product: program || "Kelas Private",
        language: language || "English",
        level: level || "A1",
        notes: "Daftar via Google OAuth",
      };
      
      const regRes2 = await fetch(`${SUPABASE_URL}/rest/v1/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(minBody),
      });
      const regText2 = await regRes2.text();
      logs.push("Minimal registration: " + regRes2.status);

      if (!regRes2.ok) {
        return NextResponse.json({ error: "Failed to create registration", detail: regText2, logs }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, studentId, logs });
  } catch (e: any) {
    console.error("Save lead error:", e);
    return NextResponse.json({ error: e.message, logs }, { status: 500 });
  }
}
