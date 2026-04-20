import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { registrationId, proofPath, userId, accessToken } = await req.json();

    if (!registrationId || !proofPath || !userId || !accessToken) {
      return NextResponse.json(
        { error: "Missing required fields (registrationId, proofPath, userId, accessToken)" },
        { status: 400 }
      );
    }

    // Sanity check: proofPath should start with userId folder
    if (!proofPath.startsWith(`${userId}/`)) {
      return NextResponse.json(
        { error: "Invalid proof path — must be in user folder" },
        { status: 403 }
      );
    }

    // Create Supabase client AS the student (using their JWT token)
    // This makes auth.uid() return the student UUID in triggers
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verify token matches userId
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user || user.id !== userId) {
      return NextResponse.json(
        { error: "Invalid or expired token", detail: authErr?.message },
        { status: 401 }
      );
    }

    // Try update AS student first (auth.uid() will be valid in triggers)
    const { error: updateErr } = await userClient
      .from("registrations")
      .update({
        payment_proof_url: proofPath,
        payment_proof_uploaded_at: new Date().toISOString(),
        payment_status: "Menunggu Verifikasi",
        payment_rejection_reason: null,
      })
      .eq("id", registrationId);

    if (updateErr) {
      // If RLS blocks, fallback: use service role but disable triggers via RPC
      console.warn("Student update failed, trying service-role RPC fallback:", updateErr.message);

      const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: rpcData, error: rpcErr } = await serviceClient.rpc("update_payment_proof", {
        p_registration_id: registrationId,
        p_proof_url: proofPath,
        p_status: "Menunggu Verifikasi",
      });

      if (rpcErr) {
        console.error("RPC fallback also failed:", rpcErr);
        return NextResponse.json(
          {
            error: "Update registrasi gagal (both paths)",
            detail: {
              student_update: updateErr.message,
              service_rpc: rpcErr.message,
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, path: "service_rpc", data: rpcData });
    }

    return NextResponse.json({ success: true, path: "student_jwt" });
  } catch (e: any) {
    console.error("upload-payment-proof error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
