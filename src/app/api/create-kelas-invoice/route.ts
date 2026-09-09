// =============================================================================
// /api/create-kelas-invoice
// [harga-keranjang-kelas-v1]
// Checkout keranjang kalkulator /harga (Kelas Private 1:1 & Semi Private):
// N paket → SATU invoice Xendit. Tiap paket tetap SATU baris `leads` sendiri,
// supaya auto-convert webhook melahirkan satu registrasi per kelas (Korean A1
// private dan Japanese A2 semi tidak boleh dilebur jadi satu registrasi).
//
// Kenapa bukan /api/create-funnel-invoice: route itu satu lead = satu invoice
// sampai ke akarnya. Pola external_id di sini menyalin keranjang Persiapan
// Ujian:
//   - external_id invoice = `LINGUO-KLS-<ts>-<rand>` (baris pertama);
//   - baris ke-2 dst pakai sufiks `-2`, `-3` (kolom itu kunci 1:1 di banyak
//     tempat, jangan sampai dua baris berbagi satu external_id);
//   - webhook mengenali prefix LINGUO-KLS- lalu memperlakukan semua baris
//     seawalan itu sebagai satu tagihan (lihat xendit-webhook).
// Total dihitung ULANG di server lewat quoteKelasItem — `amount` dari client
// tidak pernah dipakai.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { recordAdAttribution } from "@/lib/adAttributionServer";
import {
  normalizeKelasItem, quoteKelasItem, cartItemKey, CART_MAX_ITEMS, SESSION_MINUTES,
} from "@/lib/kelasCart";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://linguo.id";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    recordAdAttribution(req, { email: body?.email, phone: body?.wa_number }, body?.attribution);

    const { name, email, wa_number, ref_code } = body || {};
    if (!name || !email || !String(email).includes("@") || !wa_number) {
      return NextResponse.json({ error: "Lengkapi nama, email, dan WhatsApp yang valid." }, { status: 400 });
    }

    // ── 1. Normalisasi item (buang duplikat & kombinasi tak sah) ───────────
    const rawItems: unknown[] = Array.isArray(body?.items) ? body.items : [];
    const seen = new Set<string>();
    const items = [];
    for (const raw of rawItems) {
      const it = normalizeKelasItem(raw);
      if (!it) continue;
      const k = cartItemKey(it);
      if (seen.has(k)) continue;
      seen.add(k);
      const quote = quoteKelasItem(it);
      if (!quote) continue;
      items.push({ ...it, quote });
    }
    if (!items.length) {
      return NextResponse.json({ error: "Keranjang kosong atau paketnya tidak valid." }, { status: 400 });
    }
    if (items.length > CART_MAX_ITEMS) {
      return NextResponse.json({ error: `Maksimal ${CART_MAX_ITEMS} paket per pembayaran.` }, { status: 400 });
    }
    const amount = items.reduce((s, it) => s + it.quote.amount, 0);

    const supaHeaders = {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    // ── 2. Referral → affiliate (input menang atas cookie) ─────────────────
    let affiliateRefCode: string | null = null;
    let affiliateId: string | null = null;
    const refValue = (typeof ref_code === "string" && ref_code.trim()) || req.cookies.get("linguo_ref")?.value || null;
    if (refValue) {
      try {
        const affRes = await fetch(
          `${SUPABASE_URL}/rest/v1/affiliates?referral_code=ilike.${encodeURIComponent(refValue)}&select=id&limit=1`,
          { headers: supaHeaders },
        );
        if (affRes.ok) {
          const rows = await affRes.json();
          if (Array.isArray(rows) && rows[0]?.id) { affiliateRefCode = refValue; affiliateId = rows[0].id as string; }
        }
      } catch (e) { console.warn("Affiliate lookup failed (non-fatal):", e); }
    }

    const externalId = `LINGUO-KLS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // ── 3. Satu baris lead per paket ───────────────────────────────────────
    // Kolom sengaja dibuat mirror /api/create-funnel-invoice: itu yang dibaca
    // autoConvertPaidLeadToRegistration untuk mengisi registrations. Ukuran
    // grup Semi Private tidak punya kolom di `leads` (funnel pun begitu) —
    // angkanya hidup di deskripsi invoice & item Xendit.
    const leadRows = items.map((it, i) => ({
      name, email, wa_number,
      language: it.language,
      program: it.quote.program,
      level: it.level,
      duration: SESSION_MINUTES,
      sessions: it.quote.sessions,
      teacher_type: it.classType === "private" ? it.teacherType : null,
      class_mode: "online",
      class_city: null,
      source: "landing-page",
      payment_status: "PENDING",
      xendit_external_id: i === 0 ? externalId : `${externalId}-${i + 1}`,
      amount: it.quote.amount,
      affiliate_ref_code: affiliateRefCode,
      affiliate_id: affiliateId,
    }));
    const leadRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: { ...supaHeaders, Prefer: "return=minimal" },
      body: JSON.stringify(leadRows),
    });
    if (!leadRes.ok) {
      const err = await leadRes.text();
      console.error("Lead insert error (kelas cart):", err);
      return NextResponse.json({ error: `Gagal menyimpan data: ${err}` }, { status: 500 });
    }

    // ── 4. Satu invoice Xendit berisi semua paket ──────────────────────────
    const description = items.length === 1
      ? items[0].quote.description
      : `Kelas Linguo — ${items.length} paket: ${items.map((it) => `${it.language} ${it.level} (${it.classType === "semi" ? `semi grup ${it.classSize}` : "private"}, ${it.sessions} sesi)`).join(", ")}`;
    const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
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
          mobile_number: String(wa_number).startsWith("+") ? wa_number : `+62${String(wa_number).replace(/^0/, "")}`,
        },
        success_redirect_url: `${BASE_URL}/payment/success?id=${externalId}`,
        failure_redirect_url: `${BASE_URL}/payment/failed?id=${externalId}`,
        items: items.map((it) => ({ name: it.quote.description, quantity: 1, price: it.quote.amount })),
      }),
    });
    if (!xenditRes.ok) {
      const err = await xenditRes.text();
      console.error("Xendit error (kelas cart):", err);
      let detail = err;
      try { const xj = JSON.parse(err); detail = xj.message || xj.error_code || err; } catch {}
      return NextResponse.json({ error: `Gagal membuat invoice: ${detail}` }, { status: 500 });
    }
    const invoice = await xenditRes.json();

    // ── 5. Tempel data invoice ke SEMUA baris tagihan ini ──────────────────
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leads?xendit_external_id=like.${encodeURIComponent(externalId)}*`, {
        method: "PATCH",
        headers: supaHeaders,
        body: JSON.stringify({
          xendit_invoice_id: invoice.id,
          xendit_invoice_url: invoice.invoice_url,
          payment_deadline: invoice.expiry_date,
        }),
      });
    } catch (e) { console.warn("Lead patch (invoice) non-fatal:", e); }

    return NextResponse.json({
      invoice_url: invoice.invoice_url,
      invoice_id: invoice.id,
      external_id: externalId,
      amount,
      items: items.length,
    });
  } catch (error) {
    console.error("create-kelas-invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
