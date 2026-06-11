// =============================================================================
// /api/verify-trial-payment
// [linguo-patch:trial-class-v1]
// Fitur Trial Class — cek status pembayaran trial langsung ke Xendit API
// (source of truth) dan update trial_registrations kalau sudah lunas.
//
// Dipakai oleh halaman /kelas-trial/success setelah siswa diarahkan balik
// dari checkout Xendit. Pola redirect-verify (bukan webhook) — biar self-
// contained di repo landing, tidak bergantung Edge Function.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Status invoice Xendit yang dianggap lunas.
const PAID_STATUSES = ["PAID", "SETTLED"];

// Skema komisi per tier — selaras dgn ELEARNING_RATES di edge function
// xendit-webhook. standard/bronze/silver/gold = 15/20/25/30%.
const ELEARNING_RATES: Record<string, number> = {
  standard: 0.15,
  lingfluencer_bronze: 0.2,
  lingfluencer_silver: 0.25,
  lingfluencer_gold: 0.3,
};

type SupaHeaders = Record<string, string>;

// Normalisasi nomor HP Indonesia ke bentuk "08xxxx" supaya 08xx/+62xx/62xx
// dibandingkan sama. Null kalau kosong.
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) digits = "0" + digits.slice(2);
  else if (digits.startsWith("8")) digits = "0" + digits;
  return digits;
}

type TrialRow = {
  id: string;
  payment_status: string | null;
  affiliate_id?: string | null;
  amount?: number | string | null;
  wa_number?: string | null;
  language?: string | null;
  program?: string | null;
};

// Catat komisi affiliate untuk trial yang LUNAS. TIDAK PERNAH throw — semua
// error di-log saja supaya verifikasi pembayaran tetap sukses. Idempoten:
// dedup via trial_registration_id, jadi aman dipanggil berkali-kali.
async function recordTrialConversion(
  trial: TrialRow,
  supaHeaders: SupaHeaders
): Promise<void> {
  try {
    if (!trial.affiliate_id) return; // tanpa kode referral — skip

    // 1. Dedup — verify bisa dipanggil berkali-kali (polling/refresh)
    const dedupRes = await fetch(
      `${SUPABASE_URL}/rest/v1/affiliate_conversions` +
        `?trial_registration_id=eq.${trial.id}&select=id&limit=1`,
      { headers: supaHeaders }
    );
    if (dedupRes.ok) {
      const existing = await dedupRes.json();
      if (Array.isArray(existing) && existing.length > 0) return;
    }

    // 2. Lookup affiliate (re-validasi active + ambil tier & whatsapp)
    const affRes = await fetch(
      `${SUPABASE_URL}/rest/v1/affiliates` +
        `?id=eq.${encodeURIComponent(String(trial.affiliate_id))}` +
        `&status=eq.active&select=id,tier,whatsapp&limit=1`,
      { headers: supaHeaders }
    );
    const affRows = affRes.ok ? await affRes.json() : [];
    const affiliate =
      Array.isArray(affRows) && affRows[0]?.id ? affRows[0] : null;
    if (!affiliate) {
      console.warn(
        "Trial commission skip: affiliate tidak valid/active:",
        trial.affiliate_id
      );
      return;
    }

    // 3. Self-referral check — cocokkan WhatsApp (bukan email)
    const studentPhone = normalizePhone(trial.wa_number);
    const affPhone = normalizePhone(affiliate.whatsapp);
    if (studentPhone && affPhone && studentPhone === affPhone) {
      console.warn(
        "Trial commission skip: self-referral (phone match) trial",
        trial.id
      );
      return;
    }

    // 4. Hitung komisi by tier
    const rate = ELEARNING_RATES[affiliate.tier] ?? ELEARNING_RATES.standard;
    const gross = Number(trial.amount) || 0;
    if (gross <= 0) {
      console.warn("Trial commission skip: gross invalid for trial", trial.id);
      return;
    }
    const commissionAmount = Math.round(gross * rate);

    // 5. Insert konversi (pending) — semua kolom NOT NULL terisi
    const insRes = await fetch(
      `${SUPABASE_URL}/rest/v1/affiliate_conversions`,
      {
        method: "POST",
        headers: supaHeaders,
        body: JSON.stringify({
          // product harus lolos check constraint (private/kids/...). Trial
          // dibedakan dari kelas asli lewat kolom `source`='trial_class'.
          affiliate_id: affiliate.id,
          trial_registration_id: trial.id,
          product: trial.program === "kids" ? "kids" : "private",
          language: trial.language || null,
          gross_amount: gross,
          commission_rate: rate,
          commission_amount: commissionAmount,
          status: "pending",
          attribution_type: "cookie",
          billing_period_number: 1,
          source: "trial_class",
        }),
      }
    );
    if (!insRes.ok) {
      console.warn(
        "Trial commission insert non-fatal error:",
        await insRes.text()
      );
      return;
    }
    console.log(
      `Trial commission recorded: affiliate=${affiliate.id} trial=${trial.id} ` +
        `gross=${gross} rate=${rate} commission=${commissionAmount}`
    );
  } catch (e) {
    console.warn("recordTrialConversion threw (non-fatal):", e);
  }
}

type VerifyResult = {
  status: number;
  body: Record<string, unknown>;
};

async function verify(externalId: string): Promise<VerifyResult> {
  if (!externalId) {
    return { status: 400, body: { error: "Parameter ext wajib." } };
  }

  const supaHeaders = {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  // 1. Ambil row trial dari DB
  const trialRes = await fetch(
    `${SUPABASE_URL}/rest/v1/trial_registrations` +
      `?xendit_external_id=eq.${encodeURIComponent(externalId)}` +
      `&select=id,payment_status,affiliate_id,amount,wa_number,language,program&limit=1`,
    { headers: supaHeaders }
  );
  if (!trialRes.ok) {
    return { status: 500, body: { error: "Gagal mengambil data trial." } };
  }
  const trialRows = await trialRes.json();
  const trial: TrialRow | null = Array.isArray(trialRows) ? trialRows[0] : null;
  if (!trial) {
    return { status: 404, body: { error: "Data trial tidak ditemukan." } };
  }

  // Sudah PAID dari sebelumnya -> pastikan komisi tercatat (idempoten), balikin
  if (trial.payment_status === "PAID") {
    await recordTrialConversion(trial, supaHeaders);
    return { status: 200, body: { paid: true, payment_status: "PAID" } };
  }

  // 2. Tanya Xendit status invoice (source of truth)
  let inv: any = null;
  try {
    const xRes = await fetch(
      `https://api.xendit.co/v2/invoices?external_id=${encodeURIComponent(
        externalId
      )}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            XENDIT_SECRET_KEY + ":"
          ).toString("base64")}`,
        },
      }
    );
    if (xRes.ok) {
      const invoices = await xRes.json();
      inv = Array.isArray(invoices) ? invoices[0] : invoices;
    }
  } catch (e) {
    console.warn("Xendit invoice lookup failed (non-fatal):", e);
  }

  if (!inv) {
    return {
      status: 200,
      body: {
        paid: false,
        payment_status: "PENDING",
        note: "Belum bisa konfirmasi ke Xendit.",
      },
    };
  }

  const invStatus = String(inv.status || "").toUpperCase();
  const isPaid = PAID_STATUSES.includes(invStatus);

  // 3. Kalau lunas -> update trial_registrations
  if (isPaid) {
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/trial_registrations?id=eq.${trial.id}`,
        {
          method: "PATCH",
          headers: supaHeaders,
          body: JSON.stringify({
            payment_status: "PAID",
            paid_at: inv.paid_at || new Date().toISOString(),
            payment_method: inv.payment_method || null,
            payment_channel: inv.payment_channel || null,
          }),
        }
      );
    } catch (e) {
      console.warn("verify-trial-payment patch non-fatal:", e);
    }
    // Catat komisi affiliate sekarang invoice LUNAS (non-fatal, idempoten)
    await recordTrialConversion(trial, supaHeaders);
    return { status: 200, body: { paid: true, payment_status: "PAID" } };
  }

  return { status: 200, body: { paid: false, payment_status: "PENDING" } };
}

export async function GET(req: NextRequest) {
  try {
    const ext = req.nextUrl.searchParams.get("ext") || "";
    const r = await verify(ext);
    return NextResponse.json(r.body, { status: r.status });
  } catch (e) {
    console.error("verify-trial-payment GET error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ext =
      (body && body.ext) || req.nextUrl.searchParams.get("ext") || "";
    const r = await verify(ext);
    return NextResponse.json(r.body, { status: r.status });
  } catch (e) {
    console.error("verify-trial-payment POST error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
