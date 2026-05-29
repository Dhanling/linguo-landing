// ============================================================================
// API: /api/affiliate/signup
// Affiliate Program — Phase 3A (public self-signup)
// ----------------------------------------------------------------------------
// Backs the public /afiliator signup form. INSERTs a new row into `affiliates`
// with status='pending_review' so the team reviews before activating.
//
// WHY SERVICE ROLE (same as /api/affiliate/me):
//   - The signup form is PUBLIC — the visitor is not logged in, so there is
//     no auth.uid(). A client-SDK insert would be blocked by RLS.
//   - We use SUPABASE_SERVICE_ROLE_KEY, exactly like /api/affiliate/me.
//
// NOTES:
//   - user_id stays NULL. When the person later logs into /akun with the same
//     email, /api/affiliate/me matches them by email (see that route).
//   - referral_code is generated HERE so the row is complete from day one.
//     The affiliate still cannot earn commission until status = 'active'.
//   - Duplicate email is rejected with a friendly 409 (no double rows).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Referral code: 8 chars, uppercase. Ambiguous chars (0/O, 1/I) excluded so
// codes are easy to read and dictate over the phone.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function makeCode(): string {
  let s = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return s;
}

// Normalize an Indonesian WhatsApp number to +62 E.164 form.
// Accepts 08xxx / 8xxx / 62xxx / +62xxx with spaces or dashes.
function normalizeWa(raw: string): string {
  let d = (raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return "+" + d;
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }

    // ── 1. Read + sanitize input ─────────────────────────────────────────
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const igHandle = String(body.ig_handle || "").trim().replace(/^@/, "");
    const tiktokHandle = String(body.tiktok_handle || "")
      .trim()
      .replace(/^@/, "");
    const motivation = String(body.motivation || "").trim();

    // ── 2. Validate required fields ──────────────────────────────────────
    if (name.length < 2) {
      return NextResponse.json(
        { error: "Nama lengkap wajib diisi." },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Email tidak valid." },
        { status: 400 }
      );
    }
    const whatsapp = normalizeWa(String(body.whatsapp || ""));
    if (!/^\+62\d{8,13}$/.test(whatsapp)) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tidak valid. Contoh: 08123456789" },
        { status: 400 }
      );
    }

    // followers: optional → non-negative integer or null.
    let followers: number | null = null;
    const fRaw = body.followers;
    if (fRaw !== undefined && fRaw !== null && String(fRaw).trim() !== "") {
      const n = Math.floor(Number(fRaw));
      followers = Number.isFinite(n) && n >= 0 ? n : null;
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 3. Duplicate guard — same email already registered ──────────────
    {
      const { data, error } = await admin
        .from("affiliates")
        .select("id")
        .ilike("email", email.replace(/[%_]/g, "\\$&"))
        .limit(1);
      if (error) {
        console.error("affiliate signup dup-check error:", error);
        return NextResponse.json(
          { error: "Gagal memproses pendaftaran. Coba lagi." },
          { status: 500 }
        );
      }
      if (data && data.length) {
        return NextResponse.json(
          {
            error:
              "Email ini sudah terdaftar sebagai afiliator. Kalau ini kamu, langsung masuk ke dashboard ya.",
          },
          { status: 409 }
        );
      }
    }

    // ── 4. Insert — retry on referral_code collision (unique constraint) ─
    let inserted: { id: string; referral_code: string } | null = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const code = makeCode();
      const { data, error } = await admin
        .from("affiliates")
        .insert({
          referral_code: code,
          name,
          email,
          whatsapp,
          ig_handle: igHandle || null,
          tiktok_handle: tiktokHandle || null,
          followers,
          motivation: motivation || null,
          tier: "standard",
          status: "pending_review",
          source: "self_signup",
          user_id: null,
        })
        .select("id, referral_code")
        .single();

      if (!error && data) {
        inserted = data as { id: string; referral_code: string };
        break;
      }
      // 23505 = unique_violation → most likely the referral_code → retry.
      if (error && error.code === "23505") continue;

      console.error("affiliate signup insert error:", error);
      return NextResponse.json(
        { error: "Gagal menyimpan pendaftaran. Coba lagi." },
        { status: 500 }
      );
    }

    if (!inserted) {
      return NextResponse.json(
        { error: "Gagal membuat kode referral. Coba lagi sebentar." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("affiliate/signup error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Coba lagi." },
      { status: 500 }
    );
  }
}
