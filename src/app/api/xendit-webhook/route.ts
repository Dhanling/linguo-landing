// ============================================================================
// API: /api/affiliate/me
// Affiliate Program — Phase 2A
// ----------------------------------------------------------------------------
// Returns the logged-in user's affiliate profile + aggregate stats.
//
// WHY SERVICE ROLE (not client SDK + RLS):
//   - The 20 affiliates migrated from `lingfluencers` have user_id = NULL, so
//     the RLS policy `user_id = auth.uid()` would block them entirely.
//   - The seed affiliate HAS a user_id but its email differs from the
//     Google-login email.
//   => We match on BOTH: user_id = authUserId  OR  email = authEmail.
//
// SECURITY:
//   - The user is identified ONLY from a cryptographically verified access
//     token (admin.auth.getUser(token)). The client's claimed id/email are
//     NEVER trusted.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
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

    // ── 2. Find the affiliate row (match user_id, fallback to email) ─────
    type AffRow = {
      id: string;
      referral_code: string;
      tier: string;
      status: string;
      name: string;
    };
    let aff: AffRow | null = null;

    {
      const { data, error } = await admin
        .from("affiliates")
        .select("id, referral_code, tier, status, name")
        .eq("user_id", authUserId)
        .limit(1);
      if (error) {
        console.error("affiliate lookup (user_id) error:", error);
        return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
      }
      if (data && data.length) aff = data[0] as AffRow;
    }

    // Fallback: migrated affiliates have user_id = NULL → match by email.
    if (!aff && authEmail) {
      const { data, error } = await admin
        .from("affiliates")
        .select("id, referral_code, tier, status, name")
        .ilike("email", authEmail)
        .limit(1);
      if (error) {
        console.error("affiliate lookup (email) error:", error);
        return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
      }
      if (data && data.length) aff = data[0] as AffRow;
    }

    if (!aff) {
      // Logged-in user is simply not an affiliate yet — not an error.
      return NextResponse.json({ affiliate: null }, { status: 200 });
    }

    // ── 3. Click count ───────────────────────────────────────────────────
    const { count: clickCount } = await admin
      .from("affiliate_clicks")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", aff.id);

    // ── 4. Conversions + commission sums per status ──────────────────────
    const { data: convData } = await admin
      .from("affiliate_conversions")
      .select(
        "id, product, language, level, gross_amount, commission_amount, status, created_at"
      )
      .eq("affiliate_id", aff.id)
      .order("created_at", { ascending: false });

    const conversions = convData || [];
    const sumByStatus = (s: string) =>
      conversions
        .filter((c) => c.status === s)
        .reduce((t, c) => t + Number(c.commission_amount || 0), 0);

    return NextResponse.json({
      affiliate: {
        referral_code: aff.referral_code,
        tier: aff.tier,
        status: aff.status,
        name: aff.name,
      },
      stats: {
        clicks: clickCount || 0,
        conversions_total: conversions.length,
        commission_pending: sumByStatus("pending"),
        commission_approved: sumByStatus("approved"),
        commission_paid: sumByStatus("paid"),
      },
      conversions: conversions.slice(0, 20),
    });
  } catch (err) {
    console.error("affiliate/me error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
