import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const VALID_PLATFORMS = ["ig_reels", "ig_story", "ig_feeds", "twitter", "tiktok"] as const;

async function supaFetch(path: string, options?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options?.headers || {}),
    },
  });
}

/**
 * Normalize WhatsApp input to Indonesia format `628xxxxxxxxxx` (no + prefix).
 * Accepts: `628xxx`, `+628xxx`, `08xxx`, `8xxx`. Strips all non-digits first.
 * Returns null if input doesn't yield a valid 11-15 digit Indonesia number.
 */
function normalizeWhatsApp(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  let normalized: string;
  if (digits.startsWith("62")) normalized = digits;
  else if (digits.startsWith("08")) normalized = "62" + digits.slice(1);
  else if (digits.startsWith("8")) normalized = "62" + digits;
  else return null;
  if (normalized.length < 11 || normalized.length > 15) return null;
  return normalized;
}

/**
 * Generate referral code: `LING-XXXXXX` where X is alphanumeric excluding
 * easily-confused chars (0/O, 1/I/L). 6 chars from 32-char alphabet = ~10^9 combos.
 */
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `LING-${code}`;
}

// ---------- GET: proactive dup check (called from form onBlur of Gmail field) ----------
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const gmail = url.searchParams.get("gmail")?.toLowerCase().trim();

  if (!gmail) {
    return NextResponse.json({ error: "gmail param required" }, { status: 400 });
  }

  const res = await supaFetch(
    `linguo_influencers?gmail=eq.${encodeURIComponent(gmail)}&select=id,status,created_at`
  );
  const rows = res.ok ? await res.json() : [];

  return NextResponse.json({
    exists: rows.length > 0,
    status: rows[0]?.status || null,
  });
}

// ---------- POST: submit form ----------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      contact_email,
      whatsapp,
      gmail,
      content_platforms,
      socmed_username,
      pic_name,
      socmed_review_consent,
      gbusiness_review_consent,
    } = body;

    // ----- Required fields -----
    if (
      !name?.trim() ||
      !contact_email?.trim() ||
      !whatsapp?.trim() ||
      !gmail?.trim() ||
      !socmed_username?.trim() ||
      !pic_name?.trim()
    ) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // ----- Gmail must be @gmail.com -----
    const gmailLower = gmail.trim().toLowerCase();
    if (!gmailLower.endsWith("@gmail.com") || !gmailLower.includes("@")) {
      return NextResponse.json(
        { error: "Field Gmail wajib menggunakan alamat @gmail.com" },
        { status: 400 }
      );
    }

    // ----- Contact email basic format -----
    const contactEmailLower = contact_email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmailLower)) {
      return NextResponse.json(
        { error: "Format email kontak tidak valid" },
        { status: 400 }
      );
    }

    // ----- Content platforms -----
    if (!Array.isArray(content_platforms) || content_platforms.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal 1 platform untuk konten review" },
        { status: 400 }
      );
    }
    const invalidPlatforms = content_platforms.filter(
      (p: string) => !VALID_PLATFORMS.includes(p as any)
    );
    if (invalidPlatforms.length > 0) {
      return NextResponse.json(
        { error: `Platform tidak valid: ${invalidPlatforms.join(", ")}` },
        { status: 400 }
      );
    }

    // ----- WhatsApp normalize & validate -----
    const normalizedWA = normalizeWhatsApp(whatsapp);
    if (!normalizedWA) {
      return NextResponse.json(
        { error: "Format WhatsApp tidak valid. Gunakan format 628xxxxxxxxxx" },
        { status: 400 }
      );
    }

    // ----- Consent boolean -----
    if (socmed_review_consent !== true || gbusiness_review_consent !== true) {
      return NextResponse.json(
        {
          error:
            "Kamu wajib menyetujui memberikan review di sosmed dan Google Business",
        },
        { status: 400 }
      );
    }

    // ----- Dup check on Gmail (friendly error before DB unique violation) -----
    const dupRes = await supaFetch(
      `linguo_influencers?gmail=eq.${encodeURIComponent(gmailLower)}&select=id,status`
    );
    const dupRows = dupRes.ok ? await dupRes.json() : [];
    if (dupRows.length > 0) {
      return NextResponse.json(
        {
          error: `Gmail ini sudah pernah daftar Lingfluencer (status: ${dupRows[0].status}). Hubungi tim Linguo via WhatsApp kalau ada pertanyaan.`,
          duplicate: true,
        },
        { status: 409 }
      );
    }

    // ----- Generate unique referral code (retry on collision, max 5 attempts) -----
    let referralCode = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateReferralCode();
      const codeRes = await supaFetch(
        `linguo_influencers?referral_code=eq.${candidate}&select=id`
      );
      const exists = codeRes.ok ? await codeRes.json() : [];
      if (exists.length === 0) {
        referralCode = candidate;
        break;
      }
    }
    if (!referralCode) {
      // Statistical fallback (1B+ combos make this near-impossible, but be safe)
      referralCode = `LING-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    }

    // ----- Insert -----
    const insertRes = await supaFetch("linguo_influencers", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        name: name.trim(),
        contact_email: contactEmailLower,
        whatsapp: normalizedWA,
        gmail: gmailLower,
        content_platforms,
        socmed_username: socmed_username.trim().replace(/^@/, ""),
        pic_name: pic_name.trim(),
        socmed_review_consent: true,
        gbusiness_review_consent: true,
        status: "submitted",
        referral_code: referralCode,
        source: "website_form",
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      console.error("Lingfluencer insert error:", insertRes.status, err);

      // Race-condition fallback for unique violation
      if (insertRes.status === 409 || err.toLowerCase().includes("duplicate")) {
        return NextResponse.json(
          { error: "Gmail ini sudah terdaftar." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: `DB error (${insertRes.status}): ${err.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const data = await insertRes.json();
    return NextResponse.json({
      success: true,
      id: data[0]?.id,
      referral_code: referralCode,
    });
  } catch (e: any) {
    console.error("Lingfluencer apply error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
