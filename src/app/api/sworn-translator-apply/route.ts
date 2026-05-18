// PATCH_SWORN_TRANSLATOR_LANDING_V1
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const VALID_SPECIALIZATIONS = [
  "legal",
  "imigrasi",
  "bisnis",
  "akademik",
  "medis",
  "teknis",
] as const;

const VALID_AREAS = [
  "jakarta",
  "bandung",
  "surabaya",
  "yogyakarta",
  "bali",
  "remote",
  "nationwide",
] as const;

// Status yang menghalangi re-apply. `rejected` BOLEH apply ulang (mungkin udah upgrade SK).
const BLOCKING_STATUSES = ["registered", "reviewed", "approved"];

// Normalize nomor WA ke format E.164 tanpa "+"
// Contoh: "0812-3456-7890" → "62812345678", "+62812345678" → "62812345678"
function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

type ExistingRow = { email: string; phone: string; status: string };

// Query Supabase untuk row yang match email atau phone (OR)
async function findExisting(
  email?: string | null,
  phone?: string | null
): Promise<ExistingRow[] | null> {
  const filters: string[] = [];
  if (email) filters.push(`email.eq.${encodeURIComponent(email)}`);
  if (phone) filters.push(`phone.eq.${encodeURIComponent(phone)}`);
  if (filters.length === 0) return [];

  const url = `${SUPABASE_URL}/rest/v1/sworn_translator_applications?select=email,phone,status&or=(${filters.join(
    ","
  )})&limit=10`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    console.error("findExisting query failed:", res.status, await res.text());
    return null;
  }
  return (await res.json()) as ExistingRow[];
}

// ============================================================================
// GET — real-time duplicate check (dipake oleh form blur handler di Step 1)
// Usage: GET /api/sworn-translator-apply?email=foo@bar.com  atau  ?phone=08123456789
// Response: { email: {exists, status, blocking} | null, phone: {...} | null }
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawEmail = searchParams.get("email")?.trim().toLowerCase() || null;
    const rawPhone = searchParams.get("phone");
    const normalizedPhone = rawPhone ? normalizePhone(rawPhone) : null;

    if (!rawEmail && !normalizedPhone) {
      return NextResponse.json(
        { error: "email atau phone wajib" },
        { status: 400 }
      );
    }

    const matches = await findExisting(rawEmail, normalizedPhone);
    if (matches === null) {
      // DB query gagal — return null instead of error supaya form tetap bisa lanjut
      return NextResponse.json({ email: null, phone: null });
    }

    const emailMatch = rawEmail
      ? matches.find((m) => m.email?.toLowerCase() === rawEmail)
      : null;
    const phoneMatch = normalizedPhone
      ? matches.find((m) => m.phone === normalizedPhone)
      : null;

    return NextResponse.json({
      email: emailMatch
        ? {
            exists: true,
            status: emailMatch.status,
            blocking: BLOCKING_STATUSES.includes(emailMatch.status),
          }
        : null,
      phone: phoneMatch
        ? {
            exists: true,
            status: phoneMatch.status,
            blocking: BLOCKING_STATUSES.includes(phoneMatch.status),
          }
        : null,
    });
  } catch (e: any) {
    console.error("Sworn translator check error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ============================================================================
// POST — submit pendaftaran (dengan server-side dup guard)
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      sk_menkumham_number,
      sk_menkumham_date,
      language_pairs,
      specialization,
      area,
      years_experience,
      sk_document_url,
      cv_url,
      sample_translation_url,
      portfolio_url,
      note,
    } = body;

    // ---- Validasi field wajib ----
    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !sk_menkumham_number?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Nama, email, nomor WhatsApp, dan nomor SK Menkumham wajib diisi",
        },
        { status: 400 }
      );
    }

    // ---- Validasi language_pairs ----
    if (!Array.isArray(language_pairs) || language_pairs.length === 0) {
      return NextResponse.json(
        { error: "Minimal 1 pasangan bahasa wajib diisi" },
        { status: 400 }
      );
    }
    const normalizedPairs = language_pairs.filter(
      (p: any) =>
        p?.source?.trim() && p?.target?.trim() && p.source !== p.target
    );
    if (normalizedPairs.length === 0) {
      return NextResponse.json(
        { error: "Pasangan bahasa tidak valid (source dan target harus beda)" },
        { status: 400 }
      );
    }

    // ---- Validasi spesialisasi ----
    const normalizedSpec = Array.isArray(specialization)
      ? specialization.filter((s: any) =>
          (VALID_SPECIALIZATIONS as readonly string[]).includes(s)
        )
      : [];
    if (normalizedSpec.length === 0) {
      return NextResponse.json(
        { error: "Minimal 1 spesialisasi wajib dipilih" },
        { status: 400 }
      );
    }

    // ---- Validasi area ----
    const normalizedArea = Array.isArray(area)
      ? area.filter((a: any) => (VALID_AREAS as readonly string[]).includes(a))
      : [];
    if (normalizedArea.length === 0) {
      return NextResponse.json(
        { error: "Minimal 1 area kerja wajib dipilih" },
        { status: 400 }
      );
    }

    // ---- Normalize ----
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    // Years experience: coerce to int, allow null
    let yearsExpInt: number | null = null;
    if (years_experience !== null && years_experience !== undefined && years_experience !== "") {
      const parsed = parseInt(String(years_experience), 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 80) {
        yearsExpInt = parsed;
      }
    }

    // SK date: validate ISO date format if provided
    let skDateValue: string | null = null;
    if (sk_menkumham_date && typeof sk_menkumham_date === "string") {
      // Expect YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(sk_menkumham_date)) {
        skDateValue = sk_menkumham_date;
      }
    }

    // ---- Server-side dup check (defense kalau client dilewatin) ----
    const matches = await findExisting(normalizedEmail, normalizedPhone);
    if (matches && matches.length > 0) {
      const blocker = matches.find((m) =>
        BLOCKING_STATUSES.includes(m.status)
      );
      if (blocker) {
        const field =
          blocker.email?.toLowerCase() === normalizedEmail ? "email" : "phone";
        return NextResponse.json(
          {
            error: "duplicate",
            field,
            status: blocker.status,
            message: "Email atau nomor WhatsApp kamu sudah terdaftar.",
          },
          { status: 409 }
        );
      }
    }

    // ---- Insert ----
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/sworn_translator_applications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          sk_menkumham_number: sk_menkumham_number.trim(),
          sk_menkumham_date: skDateValue,
          language_pairs: normalizedPairs,
          specialization: normalizedSpec,
          area: normalizedArea,
          years_experience: yearsExpInt,
          sk_document_url: sk_document_url?.trim() || null,
          cv_url: cv_url?.trim() || null,
          sample_translation_url: sample_translation_url?.trim() || null,
          portfolio_url: portfolio_url?.trim() || null,
          note: note?.trim() || null,
          status: "registered", // initial state
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase error:", res.status, err);
      return NextResponse.json(
        { error: `DB error (${res.status}): ${err.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, id: data[0]?.id });
  } catch (e: any) {
    console.error("Sworn translator apply error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
