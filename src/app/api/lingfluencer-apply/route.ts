import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const VALID_PLATFORMS = ["ig_reels", "ig_story", "ig_feeds", "twitter", "tiktok"] as const;

const PLATFORM_LABELS: Record<string, string> = {
  ig_reels: "IG Reels",
  ig_story: "IG Story (min. 5 story)",
  ig_feeds: "IG Feeds",
  twitter: "X (Twitter) Thread",
  tiktok: "TikTok",
};

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
 * Accepts: `628xxx`, `+628xxx`, `08xxx`, `8xxx`.
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
 * Pick primary `platform` value (singular text column in lingfluencers).
 * Priority: IG > TikTok > Twitter. Matches existing dashboard data convention.
 */
function pickPrimaryPlatform(platforms: string[]): string {
  if (platforms.some((p) => p.startsWith("ig_"))) return "instagram";
  if (platforms.includes("tiktok")) return "tiktok";
  if (platforms.includes("twitter")) return "twitter";
  return "instagram";
}

/**
 * Build structured `notes` content — captures data yang gak punya kolom dedicated
 * (PIC, consents, full platform list).
 */
function buildNotes(opts: {
  pic_name: string;
  content_platforms: string[];
  socmed_username: string;
  socmed_review_consent: boolean;
  gbusiness_review_consent: boolean;
}): string {
  const labels = opts.content_platforms
    .map((p) => PLATFORM_LABELS[p] || p)
    .join(", ");
  const today = new Date().toISOString().slice(0, 10);
  return [
    `[Auto] Daftar via form publik linguo.id/lingfluencer (${today})`,
    `PIC outreach: ${opts.pic_name}`,
    `Platforms terpilih: ${labels}`,
    `Username sosmed (raw): ${opts.socmed_username}`,
    `Setuju review sosmed (max 14h): ${opts.socmed_review_consent ? "Ya" : "Tidak"}`,
    `Setuju review Google Business (max 14h): ${opts.gbusiness_review_consent ? "Ya" : "Tidak"}`,
  ].join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// GET — proactive dup check by gmail
// ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const gmail = url.searchParams.get("gmail")?.toLowerCase().trim();
  if (!gmail) {
    return NextResponse.json({ error: "gmail param required" }, { status: 400 });
  }
  const res = await supaFetch(
    `lingfluencers?email=eq.${encodeURIComponent(gmail)}&select=id,status,created_at`
  );
  const rows = res.ok ? await res.json() : [];
  return NextResponse.json({
    exists: rows.length > 0,
    status: rows[0]?.status || null,
  });
}

// ─────────────────────────────────────────────────────────────────────
// POST — submit form
// ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      whatsapp,
      gmail,
      content_platforms,
      socmed_username,
      pic_name,
      socmed_review_consent,
      gbusiness_review_consent,
    } = body;

    // ── Required field checks ────────────────────────────────────────
    if (
      !name?.trim() ||
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

    // ── Gmail validation (@gmail.com required) ───────────────────────
    const gmailLower = gmail.trim().toLowerCase();
    if (!gmailLower.endsWith("@gmail.com") || !gmailLower.includes("@")) {
      return NextResponse.json(
        { error: "Email wajib menggunakan alamat @gmail.com (buat akses paket e-learning)" },
        { status: 400 }
      );
    }

    // ── Content platforms validation ─────────────────────────────────
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

    // ── WhatsApp normalize & validate ────────────────────────────────
    const normalizedWA = normalizeWhatsApp(whatsapp);
    if (!normalizedWA) {
      return NextResponse.json(
        { error: "Format WhatsApp tidak valid. Gunakan format 628xxxxxxxxxx" },
        { status: 400 }
      );
    }

    // ── Consent boolean ──────────────────────────────────────────────
    if (socmed_review_consent !== true || gbusiness_review_consent !== true) {
      return NextResponse.json(
        {
          error:
            "Kamu wajib menyetujui memberikan review di sosmed dan Google Business",
        },
        { status: 400 }
      );
    }

    // ── Dup check on email (lingfluencers.email = our gmail) ─────────
    const dupRes = await supaFetch(
      `lingfluencers?email=eq.${encodeURIComponent(gmailLower)}&select=id,status`
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

    // ── Build payload sesuai schema `lingfluencers` ──────────────────
    const username = socmed_username.trim().replace(/^@/, "");
    const usesIg = content_platforms.some((p: string) => p.startsWith("ig_"));
    const usesTiktok = content_platforms.includes("tiktok");
    const primaryPlatform = pickPrimaryPlatform(content_platforms);

    const insertRes = await supaFetch("lingfluencers", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        name: name.trim(),
        email: gmailLower,
        whatsapp: normalizedWA,
        ig_handle: usesIg ? username : null,
        tiktok_handle: usesTiktok ? username : null,
        platform: primaryPlatform,
        status: "registered", // valid per CHECK constraint (default new submission)
        type: "e_learning",   // valid per CHECK constraint (e_learning | private)
        followers: 0,         // belum tau, Intan isi belakangan via dashboard
        notes: buildNotes({
          pic_name: pic_name.trim(),
          content_platforms,
          socmed_username: username,
          socmed_review_consent,
          gbusiness_review_consent,
        }),
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      console.error("Lingfluencer insert error:", insertRes.status, err);

      if (insertRes.status === 409 || err.toLowerCase().includes("duplicate")) {
        return NextResponse.json(
          { error: "Email ini sudah terdaftar." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: `DB error (${insertRes.status}): ${err.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const data = await insertRes.json();
    return NextResponse.json({ success: true, id: data[0]?.id });
  } catch (e: any) {
    console.error("Lingfluencer apply error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
