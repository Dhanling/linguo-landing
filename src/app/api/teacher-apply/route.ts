import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const VALID_MODES = ["online", "offline", "both"] as const;
const VALID_KIDS_TIERS = ["little_learner", "young_explorer"] as const;

// Status yang menghalangi re-apply. `rejected` BOLEH apply ulang (mungkin udah upgrade skill).
const BLOCKING_STATUSES = ["submitted", "reviewed", "interview", "accepted", "onboarded"];

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
async function findExisting(email?: string | null, phone?: string | null): Promise<ExistingRow[] | null> {
  const filters: string[] = [];
  if (email) filters.push(`email.eq.${encodeURIComponent(email)}`);
  if (phone) filters.push(`phone.eq.${encodeURIComponent(phone)}`);
  if (filters.length === 0) return [];

  const url = `${SUPABASE_URL}/rest/v1/teacher_applications?select=email,phone,status&or=(${filters.join(",")})&limit=10`;
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
// Usage: GET /api/teacher-apply?email=foo@bar.com  atau  ?phone=08123456789
// Response: { email: {exists, status, blocking} | null, phone: {...} | null }
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawEmail = searchParams.get("email")?.trim().toLowerCase() || null;
    const rawPhone = searchParams.get("phone");
    const normalizedPhone = rawPhone ? normalizePhone(rawPhone) : null;

    if (!rawEmail && !normalizedPhone) {
      return NextResponse.json({ error: "email atau phone wajib" }, { status: 400 });
    }

    const matches = await findExisting(rawEmail, normalizedPhone);
    if (matches === null) {
      // DB query gagal — return null instead of error supaya form tetap bisa lanjut
      return NextResponse.json({ email: null, phone: null });
    }

    const emailMatch = rawEmail
      ? matches.find(m => m.email?.toLowerCase() === rawEmail)
      : null;
    const phoneMatch = normalizedPhone
      ? matches.find(m => m.phone === normalizedPhone)
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
    console.error("Teacher check error:", e);
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
      name, email, phone, province, city, languages, level, experience, note,
      teaching_mode, can_teach_kids, kids_tiers,
    } = body;

    // ---- Validasi field wajib ----
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !province?.trim() || !city?.trim() || !languages?.trim()) {
      return NextResponse.json(
        { error: "Nama, email, telepon, provinsi, kab/kota, dan bahasa wajib diisi" },
        { status: 400 }
      );
    }

    // ---- Validasi mode ----
    if (teaching_mode && !VALID_MODES.includes(teaching_mode)) {
      return NextResponse.json({ error: "Mode mengajar tidak valid" }, { status: 400 });
    }

    // ---- Validasi kids ----
    let normalizedKidsTiers: string[] | null = null;
    if (can_teach_kids === true) {
      if (!Array.isArray(kids_tiers) || kids_tiers.length === 0) {
        return NextResponse.json({ error: "Pilih minimal 1 tier kids (Little Learner / Young Explorer)" }, { status: 400 });
      }
      normalizedKidsTiers = kids_tiers.filter((t: any) =>
        (VALID_KIDS_TIERS as readonly string[]).includes(t)
      );
      if (normalizedKidsTiers.length === 0) {
        return NextResponse.json({ error: "Tier kids tidak valid" }, { status: 400 });
      }
    }

    // ---- Normalize ----
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);

    // ---- Server-side dup check (defense kalau client dilewatin) ----
    const matches = await findExisting(normalizedEmail, normalizedPhone);
    if (matches && matches.length > 0) {
      const blocker = matches.find(m => BLOCKING_STATUSES.includes(m.status));
      if (blocker) {
        const field = blocker.email?.toLowerCase() === normalizedEmail ? "email" : "phone";
        return NextResponse.json({
          error: "duplicate",
          field,
          status: blocker.status,
          message: "Email atau nomor WhatsApp kamu sudah terdaftar.",
        }, { status: 409 });
      }
    }

    // ---- Insert ----
    const res = await fetch(`${SUPABASE_URL}/rest/v1/teacher_applications`, {
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
        province: province.trim(),
        city: city.trim(),
        languages: languages.trim(),
        level: level || null,
        experience: experience || null,
        note: note || null,
        teaching_mode: teaching_mode || null,
        can_teach_kids: can_teach_kids === true,
        kids_tiers: normalizedKidsTiers,
        status: "submitted", // initial state — valid per teacher_applications_status_check
      }),
    });

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
    console.error("Teacher apply error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
