// =============================================================================
// /api/create-funnel-invoice
// [linguo-patch:funnel-xendit-v1]
// Checkout funnel "Mulai Belajar" (FunnelModal) — bikin invoice Xendit untuk
// pendaftaran kelas. Total dihitung ULANG di server (anti-tamper): JANGAN
// pernah percaya `amount` dari client.
//
// Model harga:
//   - Kelas Private : harga/sesi (kategori bahasa × durasi × pengajar) × jumlah sesi
//   - Kelas Kids    : harga/sesi (tier × durasi) × jumlah sesi
//   - Kelas Reguler : flat Rp 150.000 (paket 2 bulan)
//   - IELTS/TOEFL   : flat Rp 300.000 (16 sesi @90 menit)
// Formula per-sesi WAJIB identik dengan FunnelModal biar total yang tampil =
// total yang ditagih.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  PRICE_A1_60MIN,
  getLanguageCategory,
  KIDS_PRICE,
  KIDS_DURATION,
} from "@/lib/trial-pricing";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://linguo.id";

// Konstanta harus sinkron dengan FunnelModal.tsx
const NATIVE_MULTIPLIER = 2;
const REGULER_PRICE = 150000;
const IELTS_PRICE = 300000;
const SESSION_OPTS = [4, 8, 12, 16, 24];
const PRIVATE_DURATIONS = [30, 45, 60, 75, 90];
const KIDS_DURATIONS = [30, 45, 60];

type PriceResult = { amount: number; perSession: number; description: string };

function computeFunnelAmount(input: {
  program: string;
  language: string;
  level: string;
  duration: number;
  teacherType: string;
  sessions: number;
}): PriceResult | null {
  const { program, language, level, duration, teacherType, sessions } = input;

  if (program === "Kelas Private") {
    if (!PRIVATE_DURATIONS.includes(duration)) return null;
    if (!SESSION_OPTS.includes(sessions)) return null;
    const cat = getLanguageCategory(language) || "C";
    const base60 = PRICE_A1_60MIN[cat] ?? 100000;
    const perSession =
      Math.round((base60 * duration) / 60) *
      (teacherType === "native" ? NATIVE_MULTIPLIER : 1);
    return {
      amount: perSession * sessions,
      perSession,
      description:
        `Kelas Private ${language} — ${sessions} sesi @${duration} menit` +
        (teacherType === "native" ? " (Pengajar Native)" : ""),
    };
  }

  if (program === "Kelas Kids") {
    if (!KIDS_DURATIONS.includes(duration)) return null;
    if (!SESSION_OPTS.includes(sessions)) return null;
    const key =
      level === "Little Learner"
        ? "little-learner"
        : level === "Young Explorer"
        ? "young-explorer"
        : null;
    if (!key) return null;
    const perSession =
      Math.round(((KIDS_PRICE[key] / KIDS_DURATION[key]) * duration) / 5000) *
      5000;
    return {
      amount: perSession * sessions,
      perSession,
      description: `Kelas Kids ${level} — ${sessions} sesi @${duration} menit`,
    };
  }

  if (program === "Kelas Reguler") {
    return {
      amount: REGULER_PRICE,
      perSession: 0,
      description: `Kelas Reguler ${language} — Level A1 (2 bulan)`,
    };
  }

  if (program === "IELTS/TOEFL Prep") {
    return {
      amount: IELTS_PRICE,
      perSession: 0,
      description: `IELTS/TOEFL Prep ${language} (16 sesi @90 menit)`,
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      wa_number,
      program,
      language,
      level,
      duration,
      teacher_type,
      sessions,
      ref_code,
    } = body || {};

    // ── 1. Validasi minimal ────────────────────────────────────────────────
    if (!name || !email || !wa_number || !program || !language) {
      return NextResponse.json(
        { error: "Data belum lengkap. Mohon isi semua kolom wajib." },
        { status: 400 }
      );
    }

    // ── 2. Hitung harga SERVER-SIDE (anti-tamper) ──────────────────────────
    const priced = computeFunnelAmount({
      program,
      language,
      level: level || "",
      duration: Number(duration) || 0,
      teacherType: teacher_type === "native" ? "native" : "lokal",
      sessions: Number(sessions) || 0,
    });
    if (!priced || priced.amount <= 0) {
      return NextResponse.json(
        { error: "Kombinasi kelas tidak valid. Cek pilihanmu ya." },
        { status: 400 }
      );
    }
    const { amount, description } = priced;

    const supaHeaders = {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    // ── 3. Resolusi referral → affiliate_id (last-touch: input > cookie) ────
    let affiliateRefCode: string | null = null;
    let affiliateId: string | null = null;
    const refCookie = req.cookies.get("linguo_ref")?.value;
    const refValue =
      (typeof ref_code === "string" && ref_code.trim()) || refCookie || null;
    if (refValue) {
      try {
        const affRes = await fetch(
          `${SUPABASE_URL}/rest/v1/affiliates?referral_code=ilike.${encodeURIComponent(
            refValue
          )}&select=id&limit=1`,
          { headers: supaHeaders }
        );
        if (affRes.ok) {
          const rows = await affRes.json();
          if (Array.isArray(rows) && rows[0]?.id) {
            affiliateRefCode = refValue;
            affiliateId = rows[0].id as string;
          }
        }
      } catch (e) {
        console.warn("Affiliate lookup failed (non-fatal):", e);
      }
    }

    const externalId = `LINGUO-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    // ── 4. Insert lead (CRM funnel) ────────────────────────────────────────
    const leadRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: { ...supaHeaders, Prefer: "return=representation" },
      body: JSON.stringify({
        name,
        email,
        wa_number,
        language,
        program,
        level: level || null,
        source: "landing-page",
        payment_status: "PENDING",
        xendit_external_id: externalId,
        amount,
        affiliate_ref_code: affiliateRefCode,
        affiliate_id: affiliateId,
      }),
    });
    if (!leadRes.ok) {
      const err = await leadRes.text();
      console.error("Lead insert error (funnel):", err);
      return NextResponse.json(
        { error: `Gagal menyimpan data: ${err}` },
        { status: 500 }
      );
    }

    // ── 5. Buat invoice Xendit ─────────────────────────────────────────────
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
        description,
        currency: "IDR",
        invoice_duration: 86400,
        should_send_email: true,
        customer_notification_preference: {
          invoice_created: ["email", "whatsapp"],
          invoice_reminder: ["email", "whatsapp"],
          invoice_paid: ["email", "whatsapp"],
        },
        customer: {
          given_names: name,
          email,
          mobile_number: String(wa_number).startsWith("+")
            ? wa_number
            : `+62${wa_number}`,
        },
        success_redirect_url: `${BASE_URL}/payment/success?id=${externalId}`,
        failure_redirect_url: `${BASE_URL}/payment/failed?id=${externalId}`,
        items: [{ name: description, quantity: 1, price: amount }],
      }),
    });

    if (!xenditRes.ok) {
      const err = await xenditRes.text();
      console.error("Xendit error (funnel):", err);
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

    // ── 6. Patch lead dengan data invoice ──────────────────────────────────
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${externalId}`,
        {
          method: "PATCH",
          headers: supaHeaders,
          body: JSON.stringify({
            xendit_invoice_id: invoice.id,
            xendit_invoice_url: invoice.invoice_url,
            payment_deadline: invoice.expiry_date,
          }),
        }
      );
    } catch (e) {
      console.warn("Lead patch (invoice) non-fatal:", e);
    }

    return NextResponse.json({
      invoice_url: invoice.invoice_url,
      invoice_id: invoice.id,
      external_id: externalId,
    });
  } catch (error) {
    console.error("create-funnel-invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
