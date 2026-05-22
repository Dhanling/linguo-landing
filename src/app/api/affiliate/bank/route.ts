// ============================================================================
// API: /api/affiliate/bank
// Affiliate Program — Phase 3B (B1 — payout bank details)
// ----------------------------------------------------------------------------
// Lets a logged-in affiliate save/update their payout bank account:
// affiliates.bank_name / bank_account_no / bank_account_name.
//
// Auth + affiliate-matching logic mirrors /api/affiliate/me:
//   - identify the user from a cryptographically verified access token,
//   - match the affiliate row by user_id OR (fallback) email — the migrated
//     affiliates have user_id = NULL.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    // ── 1. Verify the caller's access token ──────────────────────────────
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    const authUserId = userData.user.id;
    const authEmail = (userData.user.email || "").toLowerCase();

    // ── 2. Read + validate body ──────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }
    const bankName = String(body.bank_name || "").trim();
    const accountName = String(body.bank_account_name || "").trim();
    const accountNo = String(body.bank_account_no || "").replace(/[\s-]/g, "");

    if (bankName.length < 2) {
      return NextResponse.json(
        { error: "Nama bank wajib diisi." },
        { status: 400 }
      );
    }
    if (!/^\d{6,20}$/.test(accountNo)) {
      return NextResponse.json(
        { error: "Nomor rekening tidak valid (6-20 digit angka)." },
        { status: 400 }
      );
    }
    if (accountName.length < 2) {
      return NextResponse.json(
        { error: "Nama pemilik rekening wajib diisi." },
        { status: 400 }
      );
    }

    // ── 3. Find the affiliate row (user_id, fallback to email) ───────────
    let affId: string | null = null;
    {
      const { data, error } = await admin
        .from("affiliates")
        .select("id")
        .eq("user_id", authUserId)
        .limit(1);
      if (error) {
        console.error("affiliate bank lookup (user_id) error:", error);
        return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
      }
      if (data && data.length) affId = data[0].id as string;
    }
    if (!affId && authEmail) {
      const { data, error } = await admin
        .from("affiliates")
        .select("id")
        .ilike("email", authEmail)
        .limit(1);
      if (error) {
        console.error("affiliate bank lookup (email) error:", error);
        return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
      }
      if (data && data.length) affId = data[0].id as string;
    }
    if (!affId) {
      return NextResponse.json(
        { error: "Akun ini bukan afiliator." },
        { status: 403 }
      );
    }

    // ── 4. Update bank details ───────────────────────────────────────────
    const { error: updErr } = await admin
      .from("affiliates")
      .update({
        bank_name: bankName,
        bank_account_no: accountNo,
        bank_account_name: accountName,
      })
      .eq("id", affId);

    if (updErr) {
      console.error("affiliate bank update error:", updErr);
      return NextResponse.json(
        { error: "Gagal menyimpan rekening. Coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        bank: {
          bank_name: bankName,
          bank_account_no: accountNo,
          bank_account_name: accountName,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("affiliate/bank error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Coba lagi." },
      { status: 500 }
    );
  }
}
