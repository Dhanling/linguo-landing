// ============================================================================
// API: /api/affiliate/me
// Affiliate Program — Phase 2A · Phase 2C (daily time-series added)
// ----------------------------------------------------------------------------
// Returns the logged-in user's affiliate profile + aggregate stats + a
// 30-day daily time-series (clicks + conversions per WIB calendar day) used
// by the dashboard bar chart.
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
//
// TIMEZONE:
//   - Daily buckets use the WIB (UTC+7) calendar day, not UTC, so a click at
//     06:00 WIB lands on the correct local date.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Number of days included in the daily time-series.
const DAILY_WINDOW_DAYS = 30;

// ── WIB date helpers ─────────────────────────────────────────────────────────
// WIB = UTC+7. Shifting the instant by +7h then taking the ISO date part
// yields the WIB calendar date for that instant.
function wibDateStr(d: Date): string {
  return new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

// The last N WIB calendar dates, oldest → newest, as 'YYYY-MM-DD' strings.
function lastWibDates(n: number): string[] {
  const todayWib = wibDateStr(new Date());
  // UTC-midnight anchor — used purely for safe day arithmetic.
  const base = new Date(todayWib + "T00:00:00Z");
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(
      new Date(base.getTime() - i * 86400000).toISOString().slice(0, 10)
    );
  }
  return out;
}

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
      bank_name: string | null;
      bank_account_no: string | null;
      bank_account_name: string | null;
    };
    let aff: AffRow | null = null;

    {
      const { data, error } = await admin
        .from("affiliates")
        .select("id, referral_code, tier, status, name, bank_name, bank_account_no, bank_account_name")
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
        .select("id, referral_code, tier, status, name, bank_name, bank_account_no, bank_account_name")
        .ilike("email", authEmail.replace(/[%_]/g, "\\$&"))
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

    // ── 3. Daily window bounds (WIB) ─────────────────────────────────────
    const days = lastWibDates(DAILY_WINDOW_DAYS);
    // UTC instant of 00:00 WIB on the earliest day → query lower bound.
    const windowStartIso = new Date(
      days[0] + "T00:00:00+07:00"
    ).toISOString();

    // ── 4. Click count (all-time) ────────────────────────────────────────
    const { count: clickCount } = await admin
      .from("affiliate_clicks")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", aff.id);

    // ── 5. Clicks within the daily window (timestamps only) ──────────────
    const { data: clickRows } = await admin
      .from("affiliate_clicks")
      .select("created_at")
      .eq("affiliate_id", aff.id)
      .gte("created_at", windowStartIso);

    // ── 6. Conversions + commission sums per status ──────────────────────
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

    // ── 7. Build the 30-day daily time-series (zero-filled, WIB days) ────
    const clickByDay: Record<string, number> = {};
    for (const r of clickRows || []) {
      const ds = wibDateStr(new Date(r.created_at as string));
      clickByDay[ds] = (clickByDay[ds] || 0) + 1;
    }
    const convByDay: Record<string, number> = {};
    for (const c of conversions) {
      const ds = wibDateStr(new Date(c.created_at as string));
      convByDay[ds] = (convByDay[ds] || 0) + 1;
    }
    const daily = days.map((date) => ({
      date,
      clicks: clickByDay[date] || 0,
      conversions: convByDay[date] || 0,
    }));

    return NextResponse.json({
      affiliate: {
        referral_code: aff.referral_code,
        tier: aff.tier,
        status: aff.status,
        name: aff.name,
        bank_name: aff.bank_name,
        bank_account_no: aff.bank_account_no,
        bank_account_name: aff.bank_account_name,
      },
      stats: {
        clicks: clickCount || 0,
        conversions_total: conversions.length,
        commission_pending: sumByStatus("pending"),
        commission_approved: sumByStatus("approved"),
        commission_paid: sumByStatus("paid"),
      },
      daily,
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
