import { NextRequest, NextResponse } from "next/server";

/*
 * /api/placement-result
 * ------------------------------------------------------------------
 * Dua mode dalam satu endpoint POST:
 *
 *  MODE INSERT  (body TANPA `id`)
 *    Bikin baris baru di `placement_results`. Dipakai auto-log pas
 *    layar hasil muncul (biasanya belum ada kontak). Balikin `id`
 *    baris yang baru dibuat -> PlacementTest simpen buat update nanti.
 *
 *  MODE UPDATE  (body DENGAN `id`)
 *    Enrich baris yang udah ada dengan name/email/whatsapp. Dipakai
 *    submitGate pas user isi form kontak. Nggak bikin baris baru ->
 *    nggak ada duplikat.
 *
 * Di kedua mode, kalau ada email/whatsapp, lead juga di-upsert ke
 * tabel `leads` (kolom WA = wa_number).
 */

// Upsert lead ke tabel `leads`. Kolom WA pakai `wa_number`.
async function upsertLead(
  url: string,
  key: string,
  d: {
    name?: string;
    email?: string;
    whatsapp?: string;
    language?: string;
    level?: string;
    source?: string;
  }
) {
  if (!d.email && !d.whatsapp) return;

  const leadPayload: Record<string, any> = {
    status: "Baru",
    program: "Placement Test",
    language: d.language || null,
    level: d.level || null,
    referral_source: d.source || "placement-test",
  };
  if (d.name) leadPayload.name = d.name;
  if (d.email) leadPayload.email = d.email;
  if (d.whatsapp) leadPayload.wa_number = d.whatsapp;

  const headers: Record<string, string> = {
    apikey: key,
    Authorization: "Bearer " + key,
    "Content-Type": "application/json",
  };

  try {
    if (d.email) {
      // Upsert by email biar nggak dobel lead-nya.
      await fetch(url + "/rest/v1/leads?on_conflict=email", {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(leadPayload),
      });
    } else {
      await fetch(url + "/rest/v1/leads", {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(leadPayload),
      });
    }
  } catch {
    // Lead upsert bersifat best-effort; jangan gagalin request utama.
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      language,
      level,
      score,
      timeElapsedSec,
      source,
      name,
      email,
      whatsapp,
      student_id,
    } = body;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json(
        { success: false, error: "Missing Supabase config" },
        { status: 500 }
      );
    }

    const baseHeaders: Record<string, string> = {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
    };

    // ───────────────────────────────────────────────────────────────
    // MODE UPDATE — enrich baris yang udah ada dengan kontak.
    // ───────────────────────────────────────────────────────────────
    if (id) {
      const updatePayload: Record<string, any> = {};
      if (name) updatePayload.name = name;
      if (email) updatePayload.email = email;
      if (whatsapp) updatePayload.whatsapp = whatsapp;

      if (Object.keys(updatePayload).length > 0) {
        const res = await fetch(
          SUPABASE_URL + "/rest/v1/placement_results?id=eq." + encodeURIComponent(id),
          {
            method: "PATCH",
            headers: { ...baseHeaders, Prefer: "return=minimal" },
            body: JSON.stringify(updatePayload),
          }
        );
        if (!res.ok) {
          const err = await res.text();
          return NextResponse.json({ success: false, error: err }, { status: 500 });
        }
      }

      await upsertLead(SUPABASE_URL, SUPABASE_KEY, {
        name,
        email,
        whatsapp,
        language,
        level,
        source,
      });

      return NextResponse.json({ success: true, id });
    }

    // ───────────────────────────────────────────────────────────────
    // MODE INSERT — baris baru di placement_results.
    // ───────────────────────────────────────────────────────────────
    const payload: Record<string, any> = {
      language,
      level,
      score,
      time_elapsed_sec: timeElapsedSec,
      source,
    };
    if (name) payload.name = name;
    if (email) payload.email = email;
    if (whatsapp) payload.whatsapp = whatsapp;
    if (student_id) payload.student_id = student_id;

    const res = await fetch(SUPABASE_URL + "/rest/v1/placement_results", {
      method: "POST",
      // return=representation biar dapet `id` baris yang baru dibuat.
      headers: { ...baseHeaders, Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ success: false, error: err }, { status: 500 });
    }

    // Ambil id baris baru -> dipakai PlacementTest buat update nanti.
    let insertedId: string | null = null;
    try {
      const rows = await res.json();
      insertedId = Array.isArray(rows) ? rows[0]?.id ?? null : rows?.id ?? null;
    } catch {
      // return=representation gagal di-parse -> id tetap null (nggak fatal).
    }

    await upsertLead(SUPABASE_URL, SUPABASE_KEY, {
      name,
      email,
      whatsapp,
      language,
      level,
      source,
    });

    return NextResponse.json({ success: true, id: insertedId });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
