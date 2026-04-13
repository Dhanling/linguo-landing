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
    logs.push("Check URL: " + checkUrl);
    
    const checkRes = await fetch(checkUrl, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const checkText = await checkRes.text();
    logs.push("Check response: " + checkRes.status + " " + checkText);

    let studentId: string | undefined;
    
    if (checkRes.ok) {
      const existing = JSON.parse(checkText);
      if (existing && existing.length > 0) {
        studentId = existing[0].id;
        logs.push("Existing student found: " + studentId);
      }
    } else {
      logs.push("Check student failed: " + checkRes.status);
    }

    // Step 2: Create student if not exists
    if (!studentId) {
      const createBody = { name: name || "Student", email, whatsapp: "" };
      logs.push("Creating student: " + JSON.stringify(createBody));
      
      const createRes = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(createBody),
      });
      const createText = await createRes.text();
      logs.push("Create response: " + createRes.status + " " + createText);

      if (createRes.ok) {
        const created = JSON.parse(createText);
        studentId = created?.[0]?.id;
        logs.push("Created student ID: " + studentId);
      } else {
        return NextResponse.json({ error: "Failed to create student", status: createRes.status, detail: createText, logs }, { status: 500 });
      }
    }

    if (!studentId) {
      return NextResponse.json({ error: "No student ID available", logs }, { status: 500 });
    }

    // Step 3: Create registration
    const regBody = {
      student_id: studentId,
      product: program || "Kelas Private",
      language: language || "English",
      level: level || "A1",
      status: "Aktif",
      pipeline_status: "New",
      payment_status: "Belum Bayar",
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
    logs.push("Registration response: " + regRes.status + " " + regText);

    if (!regRes.ok) {
      return NextResponse.json({ error: "Failed to create registration", status: regRes.status, detail: regText, logs }, { status: 500 });
    }

    return NextResponse.json({ success: true, studentId, logs });
  } catch (e: any) {
    console.error("Save lead error:", e);
    return NextResponse.json({ error: e.message, logs }, { status: 500 });
  }
}
