// ============================================================================
// [openai-ads-lead-v1] Event `lead_created` ke OpenAI Ads (Conversions API)
// ============================================================================
// Dipanggil dari recordAdAttribution(), jadi SEMUA titik submit yang punya
// email/HP (checkout, trial, promo, save-lead, wa-quick-lead, …) ikut terkirim
// tanpa tiap route diubah satu-satu.
//
// `id` event dibentuk dari identitas (email, kalau kosong HP) — bukan acak —
// supaya orang yang mengisi dua form berturut-turut tetap dihitung SATU lead:
// OpenAI membuang event kedua dengan pixel + nama event + id yang sama.
//
// PII di-hash SHA-256 dari bentuk ternormalisasi; field kosong DI-OMIT, bukan
// di-hash sebagai string kosong. `oppref` (click ID dari ?oppref= di URL
// pendaratan) dikirim apa adanya — itu yang menyambungkan lead ke iklannya.
//
// Tanpa OPENAI_ADS_PIXEL_ID / OPENAI_ADS_CONVERSION_KEY fungsi ini diam.
// ============================================================================

import { createHash } from "node:crypto";

const PIXEL_ID = process.env.OPENAI_ADS_PIXEL_ID ?? "";
const API_KEY = process.env.OPENAI_ADS_CONVERSION_KEY ?? "";
const ENDPOINT = "https://bzr.openai.com/v1/events";
const TIMEOUT_MS = 4000;
const FALLBACK_SOURCE_URL = "https://linguo.id/";

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function normEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? v : null;
}

/** Digit polos internasional tanpa "+": 0812… → 62812…, 812… → 62812…. */
function normPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/[^0-9]/g, "");
  if (!d) return null;
  if (d.startsWith("0")) d = "62" + d.replace(/^0+/, "");
  else if (d.startsWith("8")) d = "62" + d;
  return d.length >= 8 && d.length <= 15 ? d : null;
}

function validUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export type OpenAiLeadInput = {
  email?: string | null;
  phone?: string | null;
  oppref?: string | null;
  obref?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  sourceUrl?: string | null;
};

/**
 * Siapkan event lead; kembalikan fungsi pengirimnya (untuk dijalankan di
 * after()). Tidak pernah melempar — pelacakan tidak boleh menggagalkan
 * pendaftaran.
 */
export function sendOpenAiAdsLead(input: OpenAiLeadInput): () => Promise<void> {
  const noop = async () => {};
  if (!PIXEL_ID || !API_KEY) return noop;

  const email = normEmail(input.email);
  const phone = normPhone(input.phone);
  const identity = email ?? phone;
  if (!identity) return noop;

  const user: Record<string, unknown> = {};
  if (email) user.emails_sha256 = [sha256(email)];
  if (phone) user.phone_numbers_sha256 = [sha256(phone)];
  if (input.obref) user.obref = input.obref;
  if (input.ip) user.ip_address = input.ip;
  if (input.userAgent) user.user_agent = input.userAgent;

  const event: Record<string, unknown> = {
    id: `lead_${sha256(identity).slice(0, 32)}`,
    type: "lead_created",
    timestamp_ms: Date.now(),
    action_source: "web",
    source_url: validUrl(input.sourceUrl) ?? FALLBACK_SOURCE_URL,
    user,
    data: { type: "customer_action" },
  };
  if (input.oppref) event.oppref = input.oppref;

  return async () => {
    try {
      const res = await fetch(`${ENDPOINT}?pid=${encodeURIComponent(PIXEL_ID)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ integration_source: "linguo-landing", events: [event] }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        console.warn("[openai-ads] lead gagal:", res.status, await res.text());
      }
    } catch (e) {
      console.warn("[openai-ads] lead gagal (diabaikan):", e);
    }
  };
}
