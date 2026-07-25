// landing-analytics-v1 — endpoint pencatatan analytics landing (page view + durasi).
// Menerima beacon dari <AnalyticsTracker /> lalu insert ke Supabase pakai
// service_role (bypass RLS) — pola sama dgn /api/save-lead. Sengaja tak pakai
// anon INSERT supaya tabel tak bisa di-spam & sendBeacon tetap jalan saat unload.
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Analytics tak boleh ganggu UX: apa pun error, balas 204 (No Content).
const ok = () => new NextResponse(null, { status: 204 });

function clampStr(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const path = clampStr(body.path, 300);
    const session_id = clampStr(body.session_id, 64);
    if (!path || !session_id) return ok(); // payload tak valid → diamkan

    // duration_ms: angka wajar 0..6 jam (buang NaN/negatif/keterlaluan).
    let duration_ms = Number(body.duration_ms);
    if (!Number.isFinite(duration_ms) || duration_ms < 0) duration_ms = 0;
    duration_ms = Math.min(Math.round(duration_ms), 6 * 60 * 60 * 1000);

    const device = body.device === "mobile" ? "mobile" : "desktop";

    const row = {
      session_id,
      path,
      title: clampStr(body.title, 300),
      referrer: clampStr(body.referrer, 500),
      duration_ms,
      device,
    };

    await fetch(`${SUPABASE_URL}/rest/v1/landing_page_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });

    return ok();
  } catch {
    return ok();
  }
}
