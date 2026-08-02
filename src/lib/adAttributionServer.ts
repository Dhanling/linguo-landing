// ============================================================================
// ads-conversion-sync — Fase 1: sisi server
// ============================================================================
// Satu pemanggilan `recordAdAttribution()` di tiap titik submit yang punya
// email/HP. Dua sumber attribution, berurutan:
//   1. `attribution` di body request (kalau form-nya sudah pakai
//      withAdAttribution() dari @/lib/adAttribution), lalu
//   2. cookie `linguo_attr` — fallback yang bikin SEMUA form ikut terekam
//      tanpa perlu diubah satu-satu.
// IP & user-agent diambil dari header request, bukan dari klien.
//
// Ditulis lewat `after()` (Next 16): request iklan tidak pernah menambah
// latensi ke respons checkout, dan tidak balapan dengan redirect ke Xendit.
// Kegagalan apa pun di sini TIDAK boleh menggagalkan pendaftaran.
// ============================================================================

import { after } from "next/server";
import type { NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ATTR_COOKIE = "linguo_attr";
const RPC_TIMEOUT_MS = 4000;

type AttrShape = {
  fbclid?: unknown;
  gclid?: unknown;
  fbp?: unknown;
  fbc?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
  landing_path?: unknown;
  referrer?: unknown;
};

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s.slice(0, 512) : null;
}

// Kebalikan toBase64Url() di @/lib/adAttribution.
function decodeCookie(raw: string): AttrShape | null {
  try {
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? (parsed as AttrShape) : null;
  } catch {
    return null;
  }
}

/** Body menang atas cookie; field kosong di body diisi dari cookie. */
export function readAdAttribution(
  req: NextRequest,
  bodyAttribution?: unknown,
): AttrShape {
  const fromCookie =
    decodeCookie(req.cookies.get(ATTR_COOKIE)?.value ?? "") ?? {};
  const fromBody =
    bodyAttribution && typeof bodyAttribution === "object"
      ? (bodyAttribution as AttrShape)
      : {};
  const merged: Record<string, unknown> = { ...fromCookie };
  for (const [k, v] of Object.entries(fromBody)) {
    if (typeof v === "string" && v.trim()) merged[k] = v;
  }
  return merged as AttrShape;
}

async function callRpc(payload: Record<string, string | null>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/record_ad_attribution`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
  });
  if (!res.ok) {
    console.warn("[ad-attribution] RPC gagal:", res.status, await res.text());
  }
}

/**
 * Catat/perbarui attribution untuk satu identitas. Non-fatal & non-blocking.
 *
 * @param identity minimal salah satu dari email / phone harus ada — kalau
 *                 dua-duanya kosong, baris itu tidak akan pernah bisa
 *                 dicocokkan ke registrasi, jadi langsung dilewat.
 */
export function recordAdAttribution(
  req: NextRequest,
  identity: { email?: string | null; phone?: string | null },
  bodyAttribution?: unknown,
): void {
  try {
    const email = str(identity.email);
    const phone = str(identity.phone);
    if (!email && !phone) return;
    if (!SUPABASE_URL || !SERVICE_KEY) return;

    const a = readAdAttribution(req, bodyAttribution);
    const ip =
      (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;

    const payload: Record<string, string | null> = {
      p_email: email,
      p_phone: phone,
      p_fbclid: str(a.fbclid),
      p_gclid: str(a.gclid),
      p_fbp: str(a.fbp),
      p_fbc: str(a.fbc),
      p_utm_source: str(a.utm_source),
      p_utm_medium: str(a.utm_medium),
      p_utm_campaign: str(a.utm_campaign),
      p_utm_content: str(a.utm_content),
      p_utm_term: str(a.utm_term),
      p_landing_path: str(a.landing_path),
      p_referrer: str(a.referrer),
      p_ip: ip,
      p_user_agent: str(req.headers.get("user-agent")),
    };

    after(async () => {
      try {
        await callRpc(payload);
      } catch (e) {
        console.warn("[ad-attribution] gagal (diabaikan):", e);
      }
    });
  } catch (e) {
    console.warn("[ad-attribution] gagal (diabaikan):", e);
  }
}
