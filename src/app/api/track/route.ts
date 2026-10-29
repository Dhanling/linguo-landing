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

function affiliateRef(req: NextRequest, fromBody: unknown): string | null {
  const raw = req.cookies.get("linguo_ref")?.value || clampStr(fromBody, 32);
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9]{4,16}$/.test(code) ? code : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // [wa-lead-ref-v1] Kode [LG-XXXX] yang ditempel ke tombol WA + asal
    // pengunjung. Ditulis lewat RPC (upsert: halaman pertama tetap, halaman
    // terakhir & jumlah klik diperbarui) — lihat sql/20261016_wa_lead_ref.sql
    // di repo admin dashboard.
    if (body.type === "wa_ref") {
      const code = clampStr(body.code, 16);
      if (!/^LG-[2-9A-HJKMNP-Z]{4}$/.test(code)) return ok();
      const a = body.attribution && typeof body.attribution === "object" ? body.attribution : {};
      const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/landing_wa_ref_touch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          p_code: code,
          p_session_id: clampStr(body.session_id, 64) || null,
          p_path: clampStr(body.path, 300) || null,
          p_title: clampStr(body.title, 200) || null,
          p_label: clampStr(body.label, 120) || null,
          p_fbclid: clampStr(a.fbclid, 512) || null,
          p_gclid: clampStr(a.gclid, 512) || null,
          p_fbp: clampStr(a.fbp, 512) || null,
          p_fbc: clampStr(a.fbc, 512) || null,
          p_utm_source: clampStr(a.utm_source, 200) || null,
          p_utm_medium: clampStr(a.utm_medium, 200) || null,
          p_utm_campaign: clampStr(a.utm_campaign, 300) || null,
          p_utm_content: clampStr(a.utm_content, 300) || null,
          p_utm_term: clampStr(a.utm_term, 300) || null,
          p_landing_path: clampStr(a.landing_path, 300) || null,
          p_referrer: clampStr(a.referrer, 500) || null,
          p_ip: ip || null,
          p_user_agent: clampStr(req.headers.get("user-agent"), 400) || null,
          // [afiliator-wa-ref-v1] Kode afiliator pengunjung ini (cookie dari
          // middleware ?ref=, cadangan localStorage) → chat WA-nya tertaut ke
          // afiliator, registrasinya terisi otomatis. sql/20261022_afiliator_wa_ref.sql.
          p_affiliate_ref: affiliateRef(req, body.affiliate_ref),
        }),
        signal: AbortSignal.timeout(4000),
      });
      return ok();
    }

    const path = clampStr(body.path, 300);
    const session_id = clampStr(body.session_id, 64);
    if (!path || !session_id) return ok(); // payload tak valid → diamkan

    // landing-klik-v1 — klik tombol/link masuk tabel terpisah, bukan dihitung view.
    if (body.type === "click") {
      // [landing-konversi-v1] form/invoice = konversi dari trackConversion().
      const KINDS = ["whatsapp", "cta", "nav", "outbound", "button", "form", "invoice"];
      const click = {
        session_id,
        path,
        label: clampStr(body.label, 120),
        href: clampStr(body.href, 500),
        kind: KINDS.includes(body.kind) ? body.kind : "button",
        device: body.device === "mobile" ? "mobile" : "desktop",
      };
      await fetch(`${SUPABASE_URL}/rest/v1/landing_click_events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(click),
      });
      return ok();
    }

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

    // [link-bio-utm-v1] Kolom sumber hanya dikirim kalau ada isinya. Kalau
    // ditolak (kolom belum ada: sql/20261029_landing_page_events_utm.sql belum
    // dijalankan) baris dicatat ulang tanpa kolom itu — view tak boleh hilang.
    const sumber: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const v = clampStr(body[k], 120).trim().toLowerCase();
      if (v) sumber[k] = v;
    }
    if (["gclid", "ttclid", "msclkid", "fbclid"].includes(body.click_id)) sumber.click_id = body.click_id;

    const insertView = (r: Record<string, unknown>) =>
      fetch(`${SUPABASE_URL}/rest/v1/landing_page_events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(r),
      });
    const res = await insertView({ ...row, ...sumber });
    if (!res.ok && Object.keys(sumber).length) await insertView(row);

    return ok();
  } catch {
    return ok();
  }
}
