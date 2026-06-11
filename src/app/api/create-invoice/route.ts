import { NextRequest, NextResponse } from "next/server";
import { getPlan, hargaFinal, type LmsPlanId } from "../../../data/lms-pricing";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://linguo-landing.vercel.app";

const PRODUCT_PRICES: Record<string, { amount: number; description: string }> = {
  "private-a1": { amount: 1440000, description: "Kelas Private - Level A1 (16 sesi)" },
  "private-a2": { amount: 1440000, description: "Kelas Private - Level A2 (16 sesi)" },
  "private-b1": { amount: 1440000, description: "Kelas Private - Level B1 (16 sesi)" },
  "private-b2": { amount: 1440000, description: "Kelas Private - Level B2 (16 sesi)" },
  "reguler-a1": { amount: 150000, description: "Kelas Reguler - Level A1 (2 bulan)" },
  "ielts-toefl": { amount: 300000, description: "IELTS/TOEFL Prep (16 sesi @90min)" },
  "kids-little-learner": { amount: 900000, description: "Kelas Kids Little Learner (12 sesi @30min, usia 5-8 thn)" },
  "kids-young-explorer": { amount: 1020000, description: "Kelas Kids Young Explorer (12 sesi @45min, usia 9-12 thn)" },
  "e-learning": { amount: 29000, description: "E-Learning 1 Bulan" },
    "e-learning-6": { amount: 99000, description: "E-Learning 6 Bulan" },
    "e-learning-12": { amount: 179000, description: "E-Learning 12 Bulan" },
  "e-book": { amount: 29000, description: "E-Book Digital" },
  // ── ebook-xendit-v3: SKU bundle e-book per-edisi (id=Bahasa Indonesia, en=English) ──
  "ebook-satuan-id":  { amount: 99000,  description: "E-Book Satuan - 1 bahasa (Edisi Bahasa Indonesia)" },
  "ebook-hemat-id":   { amount: 239000, description: "E-Book Bundle Hemat - 3 bahasa (Edisi Bahasa Indonesia)" },
  "ebook-populer-id": { amount: 349000, description: "E-Book Bundle Populer - 5 bahasa (Edisi Bahasa Indonesia)" },
  "ebook-all-id":     { amount: 749000, description: "E-Book All-Access - 20 bahasa (Edisi Bahasa Indonesia)" },
  "ebook-satuan-en":  { amount: 79000,  description: "E-Book Satuan - 1 bahasa (Edisi English)" },
  "ebook-hemat-en":   { amount: 189000, description: "E-Book Bundle Hemat - 3 bahasa (Edisi English)" },
  "ebook-populer-en": { amount: 279000, description: "E-Book Bundle Populer - 5 bahasa (Edisi English)" },
  "ebook-all-en":     { amount: 599000, description: "E-Book All-Access - 20 bahasa (Edisi English)" },
};

// ── lms-subscription-v1 ──────────────────────────────────────────────────
// Checkout akses LMS (access-pass sekali bayar). SKU GENERIK: 1 endpoint, tanpa
// row produk per kombinasi bahasa×plan. Harga DIHITUNG server-side dari
// lms-pricing.ts → client tidak boleh kirim `amount` (anti-tamper).
// Scope: SAAT INI hanya `single_language`. `all_access` belum dijual (harga
// belum diputuskan di lms-pricing.ts) → ditolak 400. Untuk mengaktifkan nanti:
// tambah harga all_access di lms-pricing.ts lalu lepas guard scope di bawah.
async function handleLmsSubscription(body: Record<string, unknown>): Promise<NextResponse> {
  const scope = body.scope as string | undefined;
  const language = (body.language as string | undefined) ?? null;
  const planRaw = body.plan as string | undefined;
  const userId = body.user_id as string | undefined;
  const email = (body.email as string | undefined) || undefined;

  if (!userId) {
    return NextResponse.json({ error: "user_id wajib (harus login)" }, { status: 400 });
  }

  // GUARD: all_access belum tersedia — hanya single_language.
  if (scope !== "single_language") {
    return NextResponse.json(
      { error: "Saat ini hanya tersedia akses per-bahasa." },
      { status: 400 }
    );
  }
  if (!language) {
    return NextResponse.json(
      { error: "language wajib untuk akses per-bahasa." },
      { status: 400 }
    );
  }

  const plan = getPlan(planRaw as LmsPlanId);
  if (!plan) {
    return NextResponse.json({ error: "Paket tidak valid." }, { status: 400 });
  }

  // Harga final dihitung server-side (anti-tamper).
  const amount = hargaFinal(plan);

  // 1. INSERT lms_subscriptions status=pending (started_at/expires_at NULL dulu;
  //    diisi saat webhook PAID).
  const subRes = await fetch(`${SUPABASE_URL}/rest/v1/lms_subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: userId,
      scope: "single_language",
      language,
      plan: plan.plan,
      amount,
      status: "pending",
    }),
  });

  if (!subRes.ok) {
    const err = await subRes.text();
    console.error("Subscription insert error:", err);
    return NextResponse.json({ error: `Gagal membuat langganan: ${err}` }, { status: 500 });
  }

  const subRows = await subRes.json();
  const subId = Array.isArray(subRows) ? subRows[0]?.id : subRows?.id;
  if (!subId) {
    return NextResponse.json({ error: "Gagal membaca id langganan." }, { status: 500 });
  }

  // external_id LOWERCASE + embed subId — supaya Edge Function webhook bisa route
  // ke handleLmsSubscription (regex /^linguo-sub-([a-f0-9-]{36})-\d+$/).
  // WAJIB dibuat SETELAH subId ada (dipakai sbg sumber id-nya).
  const externalId = `linguo-sub-${subId}-${Date.now()}`;

  // 2. Buat invoice Xendit.
  const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
    },
    body: JSON.stringify({
      external_id: externalId,
      amount,
      ...(email ? { payer_email: email } : {}),
      description: `Linguo LMS — Akses ${plan.label} (Bahasa ${language})`,
      currency: "IDR",
      invoice_duration: 86400,
      success_redirect_url: `${BASE_URL}/akun`,
      failure_redirect_url: `${BASE_URL}/akun`,
      items: [
        { name: `Akses LMS ${plan.label} — Bahasa ${language}`, quantity: 1, price: amount },
      ],
    }),
  });

  if (!xenditRes.ok) {
    const err = await xenditRes.text();
    console.error("Xendit error (subscription):", err);
    let xfDetail = err;
    try { const xj = JSON.parse(err); xfDetail = xj.message || xj.error_code || err; } catch {}
    // Rollback row pending biar ga nyangkut tanpa invoice.
    await fetch(`${SUPABASE_URL}/rest/v1/lms_subscriptions?id=eq.${subId}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    return NextResponse.json({ error: `Gagal membuat invoice: ${xfDetail}` }, { status: 500 });
  }

  const invoice = await xenditRes.json();

  // 3. Simpan invoice id ke row subscription. Webhook nanti match by xendit_invoice_id.
  await fetch(`${SUPABASE_URL}/rest/v1/lms_subscriptions?id=eq.${subId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ xendit_invoice_id: invoice.id }),
  });

  return NextResponse.json({
    invoice_url: invoice.invoice_url,
    invoice_id: invoice.id,
    external_id: externalId,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── lms-subscription-v1: branch checkout akses LMS (sebelum PRODUCT_PRICES) ──
    if (body?.kind === "lms_subscription") {
      return await handleLmsSubscription(body);
    }

    const { name, email, wa_number, language, program, level, productKey: directKey, addon, ref_code } = body;

    const productKey = directKey || (program && level ? `${program}-${level.toLowerCase()}` : program);
    const product = PRODUCT_PRICES[productKey || ""];
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 400 });
    }

    const externalId = `LINGUO-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // ── addon-ebook-recording-v1: cross-sell bundle e-book + recording (Reguler) ──
    const ADDON_PRICE = 150000;
    const ADDON_DESC = "Bundle E-Book + Recording Kelas (akses selamanya)";
    const wantsAddon = addon === true;
    const totalAmount = product.amount + (wantsAddon ? ADDON_PRICE : 0);

    // ── affiliate-attribution-v1 ─────────────────────────────────────────
    // Last-touch referral: middleware drops a `linguo_ref` cookie when a
    // visitor lands with ?ref=CODE. Resolve it to an affiliate_id here so the
    // lead carries attribution into the xendit-webhook commission engine.
    // Non-fatal: a missing cookie or unknown code just means no attribution.
    // referral-code-field-v1 — a code the user typed into the funnel/checkout
    // form wins over the cookie (explicit intent > last-touch). TODO: ensure
    // ref_code column exists in leads table if you want to persist the raw code.
    let affiliateRefCode: string | null = null;
    let affiliateId: string | null = null;
    const refCookie = req.cookies.get("linguo_ref")?.value;
    const refValue = (typeof ref_code === "string" && ref_code.trim()) || refCookie || null;
    if (refValue) {
      try {
        const affRes = await fetch(
          `${SUPABASE_URL}/rest/v1/affiliates?referral_code=eq.${encodeURIComponent(
            refValue
          )}&select=id&limit=1`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          }
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

    const leadRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        name, email, wa_number, language, program, level,
        source: "landing-page",
        payment_status: "PENDING",
        xendit_external_id: externalId,
        amount: totalAmount,
        affiliate_ref_code: affiliateRefCode,
        affiliate_id: affiliateId,
        // addon fields cuma dikirim kalau opt-in -> pendaftaran normal ga nyentuh kolom baru
        ...(wantsAddon
          ? { addon_ebook_recording: true, addon_amount: ADDON_PRICE, addon_type: "reguler_bundle" }
          : {}),
      }),
    });

    if (!leadRes.ok) {
      const err = await leadRes.text();
      console.error("Supabase error:", err);
      return NextResponse.json({ error: `Gagal menyimpan data: ${err}` }, { status: 500 });
    }

    const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: totalAmount,
        payer_email: email,
        description: `${product.description}${wantsAddon ? " + Bundle E-Book & Recording" : ""}${language ? ` — ${language}` : ""}`,
        currency: "IDR",
        invoice_duration: 86400,
        customer: {
          given_names: name,
          email: email,
          mobile_number: wa_number?.startsWith("+") ? wa_number : `+62${wa_number}`,
        },
        success_redirect_url: `${BASE_URL}/payment/success?id=${externalId}`,
        failure_redirect_url: `${BASE_URL}/payment/failed?id=${externalId}`,
        items: [
          { name: product.description, quantity: 1, price: product.amount },
          ...(wantsAddon ? [{ name: ADDON_DESC, quantity: 1, price: ADDON_PRICE }] : []),
        ],
      }),
    });

    if (!xenditRes.ok) {
      const err = await xenditRes.text();
      console.error("Xendit error:", err);
      let xfDetail = err; // invoice-error-detail-v1
      try { const xj = JSON.parse(err); xfDetail = xj.message || xj.error_code || err; } catch {}
      return NextResponse.json({ error: `Gagal membuat invoice: ${xfDetail}` }, { status: 500 });
    }

    const invoice = await xenditRes.json();

    await fetch(
      `${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${externalId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          xendit_invoice_id: invoice.id,
          xendit_invoice_url: invoice.invoice_url,
        }),
      }
    );

    return NextResponse.json({
      invoice_url: invoice.invoice_url,
      invoice_id: invoice.id,
      external_id: externalId,
    });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
