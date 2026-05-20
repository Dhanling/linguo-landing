// ============================================================================
// Middleware — Affiliate referral capture
// Affiliate Program — Phase 2A
// ============================================================================
// On any page hit carrying ?ref=CODE:
//   1. Stores the code in an httpOnly cookie `linguo_ref` (60-day window).
//      create-invoice/route.ts will read this cookie to attribute the lead (2B).
//   2. Fires a fire-and-forget POST to the track-affiliate-click Edge Function
//      to log the click. Uses event.waitUntil so the request completes
//      WITHOUT blocking navigation.
//
// Last-touch attribution: a newer ?ref overwrites the cookie.
// ============================================================================

import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";

const EF_URL =
  "https://jbtgciepdmqxxcjflrxz.supabase.co/functions/v1/track-affiliate-click";
const REF_COOKIE = "linguo_ref";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 days, in seconds

export function middleware(req: NextRequest, event: NextFetchEvent) {
  const res = NextResponse.next();

  const rawRef = req.nextUrl.searchParams.get("ref");
  if (!rawRef) return res;

  const code = rawRef.trim().toUpperCase();
  // Referral codes are 8-char alphanumeric; allow slack, reject obvious junk.
  if (!/^[A-Z0-9]{4,16}$/.test(code)) return res;

  // 1. Store / refresh the attribution cookie (last-touch wins).
  res.cookies.set(REF_COOKIE, code, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  // 2. Fire-and-forget click tracking. waitUntil keeps the request alive
  //    past the response without blocking the visitor.
  const ip = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")[0]
    .trim();
  const sp = req.nextUrl.searchParams;

  event.waitUntil(
    fetch(EF_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: code,
        ip,
        user_agent: req.headers.get("user-agent") ?? "",
        referrer: req.headers.get("referer") ?? "",
        landing_url: req.nextUrl.href,
        utm_source: sp.get("utm_source") ?? "",
        utm_medium: sp.get("utm_medium") ?? "",
        utm_campaign: sp.get("utm_campaign") ?? "",
        session_id: req.cookies.get("linguo_sid")?.value ?? "",
      }),
    }).catch(() => {}), // tracking failure must never surface to the visitor
  );

  return res;
}

export const config = {
  // Run on all routes except static assets, image optimizer, and API routes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
