import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function supaFetch(path: string, options?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      ...(options?.headers || {}),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { registrationId, proofPath, userId } = await req.json();

    if (!registrationId || !proofPath || !userId) {
      return NextResponse.json(
        { error: "Missing required fields (registrationId, proofPath, userId)" },
        { status: 400 }
      );
    }

    // Sanity check: proofPath should start with userId folder (prevent path injection)
    if (!proofPath.startsWith(`${userId}/`)) {
      return NextResponse.json(
        { error: "Invalid proof path — must be in user folder" },
        { status: 403 }
      );
    }

    // Update registration with payment proof info (service role bypasses RLS)
    const updateRes = await supaFetch(
      `registrations?id=eq.${encodeURIComponent(registrationId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          payment_proof_url: proofPath,
          payment_proof_uploaded_at: new Date().toISOString(),
          payment_status: "Menunggu Verifikasi",
          payment_rejection_reason: null,
        }),
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error("Registration update failed:", errText);
      return NextResponse.json(
        { error: "Update registrasi gagal", detail: errText },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("upload-payment-proof error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
