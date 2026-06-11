// =============================================================================
// /api/create-trial-invoice
// [linguo-patch:trial-class-v1]
// Fitur Trial Class — terima pendaftaran trial, hitung harga server-side,
// soft dedup, insert trial_registrations + leads, buat invoice Xendit.
// Model: src/app/api/create-invoice/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  computePrivateTrialPrice,
  computeKidsTrialPrice,
  KIDS_DURATION,
  TRIAL_DURATIONS,
} from "@/lib/trial-pricing";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://linguo.id";

const PROGRAM_LABEL: Record<string, string> = {
  private: "Kelas Private",
  kids: "Kelas Kids",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      wa_number,
      program,
      language,
      kids_type,
      duration_minutes,
      preferred_schedule,
      affiliate_id, // referral-code-trial-v1 — hasil validasi di client (opsional)
    } = body || {};

    // ── 1. Validasi minimal ────────────────────────────────────────────────
    if (!name || !email || !wa_number || !program || !language) {
      return NextResponse.json(
        { error: "Data belum lengkap. Mohon isi semua kolom wajib." },
        { status: 400 }
      );
    }
    if (program !== "private" && program !== "kids") {
      return NextResponse.json(
        { error: "Program tidak valid." },
        { status: 400 }
      );
    }

    // ── 2. Hitung harga SERVER-SIDE (jangan percaya amount dari client) ────
    let amount: number | null = null;
    let durationMin = 0;

    if (program === "private") {
      durationMin = Number(duration_minutes) || 0;
      if (!TRIAL_DURATIONS.includes(durationMin)) {
        return NextResponse.json(
          { error: "Durasi sesi tidak valid." },
          { status: 400 }
        );
      }
      amount = computePrivateTrialPrice(language, durationMin);
      if (amount == null) {
        return NextResponse.json(
          {
            error:
              "Bahasa ini belum tersedia untuk trial. Hubungi admin via WhatsApp ya.",
          },
          { status: 400 }
        );
      }
    } else {
      if (kids_type !== "little-learner" && kids_type !== "young-explorer") {
        return NextResponse.json(
          { error: "Tipe kelas Kids tidak valid." },
          { status: 400 }
        );
      }
      amount = computeKidsTrialPrice(kids_type);
      durationMin = KIDS_DURATION[kids_type];
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Gagal menghitung harga trial." },
        { status: 500 }
      );
    }

    const supaHeaders = {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    // ── 3. Soft dedup — 1 email boleh trial lagi, asal beda bahasa ─────────
    try {
      const dupRes = await fetch(
        `${SUPABASE_URL}/rest/v1/trial_registrations` +
          `?email=ilike.${encodeURIComponent(email)}` +
          `&language=eq.${encodeURIComponent(language)}` +
          `&archived_at=is.null&status=neq.dropped&select=id&limit=1`,
        { headers: supaHeaders }
      );
      if (dupRes.ok) {
        const dup = await dupRes.json();
        if (Array.isArray(dup) && dup.length > 0) {
          return NextResponse.json(
            {
              error:
                `Email ini sudah pernah daftar trial ${language}. ` +
                `Satu siswa boleh trial lagi untuk bahasa yang berbeda. ` +
                `Kalau ada kendala, hubungi admin via WhatsApp ya.`,
            },
            { status: 409 }
          );
        }
      }
    } catch (e) {
      console.warn("Trial dedup check failed (non-fatal):", e);
    }

    const externalId = `LINGUO-TRIAL-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    const programLabel = PROGRAM_LABEL[program];

    // ── 4. Insert trial_registrations (WAJIB sukses) ───────────────────────
    const trialRes = await fetch(
      `${SUPABASE_URL}/rest/v1/trial_registrations`,
      {
        method: "POST",
        headers: { ...supaHeaders, Prefer: "return=representation" },
        body: JSON.stringify({
          name,
          email,
          wa_number,
          program,
          language,
          kids_type: program === "kids" ? kids_type : null,
          duration_minutes: durationMin,
          preferred_schedule: preferred_schedule || null,
          status: "registered",
          payment_status: "PENDING",
          amount,
          xendit_external_id: externalId,
          source: "landing-kelas-trial",
        }),
      }
    );

    if (!trialRes.ok) {
      const err = await trialRes.text();
      console.error("trial_registrations insert error:", err);
      return NextResponse.json(
        { error: "Gagal menyimpan pendaftaran. Coba lagi atau hubungi admin." },
        { status: 500 }
      );
    }
    const trialRows = await trialRes.json();
    const trialId: string | null =
      Array.isArray(trialRows) && trialRows[0]?.id ? trialRows[0].id : null;

    // ── 4b. Catat konversi affiliate (referral-code-trial-v1) — non-fatal ──
    // Kalau pendaftar pakai kode referral valid, simpan baris konversi
    // berstatus 'pending'. Tidak ada diskon / perubahan harga — komisi
    // ditanggung internal. Re-validasi affiliate_id (harus ada & active) biar
    // client tidak bisa attribusi ke affiliate sembarangan.
    if (affiliate_id && trialId) {
      try {
        const affRes = await fetch(
          `${SUPABASE_URL}/rest/v1/affiliates` +
            `?id=eq.${encodeURIComponent(String(affiliate_id))}` +
            `&status=eq.active&select=id&limit=1`,
          { headers: supaHeaders }
        );
        const affRows = affRes.ok ? await affRes.json() : [];
        if (Array.isArray(affRows) && affRows[0]?.id) {
          const baseRow = {
            affiliate_id: affRows[0].id,
            registration_id: trialId,
            status: "pending",
          };
          let convRes = await fetch(
            `${SUPABASE_URL}/rest/v1/affiliate_conversions`,
            {
              method: "POST",
              headers: supaHeaders,
              body: JSON.stringify({ ...baseRow, source: "trial_class" }),
            }
          );
          // Fallback: kalau kolom `source` belum ada di schema, ulangi tanpa
          // kolom itu supaya attribusi inti (affiliate + registrasi) tetap ada.
          if (!convRes.ok) {
            const errTxt = await convRes.text();
            if (/source/i.test(errTxt)) {
              console.warn(
                "affiliate_conversions: retry tanpa kolom 'source':",
                errTxt
              );
              convRes = await fetch(
                `${SUPABASE_URL}/rest/v1/affiliate_conversions`,
                {
                  method: "POST",
                  headers: supaHeaders,
                  body: JSON.stringify(baseRow),
                }
              );
            }
            if (!convRes.ok) {
              console.warn(
                "affiliate_conversions insert non-fatal error:",
                await convRes.text()
              );
            }
          }
        } else {
          console.warn(
            "affiliate_conversions skip: affiliate_id tidak valid/active:",
            affiliate_id
          );
        }
      } catch (e) {
        console.warn("affiliate_conversions insert threw (non-fatal):", e);
      }
    }

    // ── 5. Insert ke leads juga (CRM funnel) — non-fatal ───────────────────
    let leadId: string | null = null;
    try {
      const leadRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: { ...supaHeaders, Prefer: "return=representation" },
        body: JSON.stringify({
          name,
          email,
          wa_number,
          language,
          program: programLabel,
          source: "Trial Class",
          payment_status: "PENDING",
          xendit_external_id: externalId,
          amount,
          schedule_preference: preferred_schedule || null,
        }),
      });
      if (leadRes.ok) {
        const leadRows = await leadRes.json();
        if (Array.isArray(leadRows) && leadRows[0]?.id) {
          leadId = leadRows[0].id;
        }
      } else {
        console.warn(
          "Lead insert (trial) non-fatal error:",
          await leadRes.text()
        );
      }
    } catch (e) {
      console.warn("Lead insert (trial) threw (non-fatal):", e);
    }

    // ── 6. Buat invoice Xendit ─────────────────────────────────────────────
    const desc =
      `Trial ${programLabel} — ${language}` +
      (program === "kids"
        ? ` (${kids_type})`
        : ` (${durationMin} menit/sesi)`);

    const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          XENDIT_SECRET_KEY + ":"
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        external_id: externalId,
        amount,
        payer_email: email,
        description: desc,
        currency: "IDR",
        invoice_duration: 86400,
        customer: {
          given_names: name,
          email,
          mobile_number: String(wa_number).startsWith("+")
            ? wa_number
            : `+62${wa_number}`,
        },
        success_redirect_url: `${BASE_URL}/kelas-trial/success?ext=${externalId}`,
        failure_redirect_url: `${BASE_URL}/kelas-trial?gagal=1`,
        items: [{ name: desc, quantity: 1, price: amount }],
      }),
    });

    if (!xenditRes.ok) {
      const err = await xenditRes.text();
      console.error("Xendit error (trial):", err);
      let detail = err;
      try {
        const xj = JSON.parse(err);
        detail = xj.message || xj.error_code || err;
      } catch {}
      return NextResponse.json(
        { error: `Gagal membuat invoice: ${detail}` },
        { status: 500 }
      );
    }
    const invoice = await xenditRes.json();

    // ── 7. Patch trial_registrations dengan data invoice + lead_id ─────────
    if (trialId) {
      try {
        await fetch(
          `${SUPABASE_URL}/rest/v1/trial_registrations?id=eq.${trialId}`,
          {
            method: "PATCH",
            headers: supaHeaders,
            body: JSON.stringify({
              xendit_invoice_id: invoice.id,
              xendit_invoice_url: invoice.invoice_url,
              lead_id: leadId,
            }),
          }
        );
      } catch (e) {
        console.warn("Trial patch (invoice) non-fatal:", e);
      }
    }

    return NextResponse.json({
      invoice_url: invoice.invoice_url,
      invoice_id: invoice.id,
      external_id: externalId,
      trial_id: trialId,
    });
  } catch (error) {
    console.error("create-trial-invoice error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
