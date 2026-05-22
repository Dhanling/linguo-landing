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
      `&select=id,payment_status&limit=1`,
    { headers: supaHeaders }
  );
  if (!trialRes.ok) {
    return { status: 500, body: { error: "Gagal mengambil data trial." } };
  }
  const trialRows = await trialRes.json();
  const trial = Array.isArray(trialRows) ? trialRows[0] : null;
  if (!trial) {
    return { status: 404, body: { error: "Data trial tidak ditemukan." } };
  }

  // Sudah PAID dari sebelumnya -> langsung balikin
  if (trial.payment_status === "PAID") {
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
