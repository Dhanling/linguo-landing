// =============================================================================
// /api/create-wl-invoice
// Checkout langganan Watch & Learn (WatchSubscribeModal) — bikin invoice Xendit
// untuk 1 bln / 6 bln / 1 thn. Harga dihitung ULANG di server dari WATCH_PLANS
// (anti-tamper): JANGAN pernah percaya `amount` dari client.
//
// TODO(entitlement): sekarang unlock per-perangkat setelah bayar (flag lokal via
//   setWatchPremium di halaman redirect). Untuk langganan lintas-perangkat +
//   auto-expire, sambungkan ke identitas (login) + webhook Xendit + tabel
//   wl_subscriptions. Kode promo juga masih placeholder (validasi server TODO).
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { WATCH_PLANS } from "@/lib/immersionLearn";
import { resolveWatchCode } from "@/lib/watchPromo";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://linguo.id";

// [watch-learn-inbox-v1] Tab Pembayaran WA Inbox (dashboard.linguo.id) memakai
// route ini untuk menagih langganan atas nama siswa, supaya nominal & jalurnya
// sama persis dengan checkout mandiri. Beda origin → butuh CORS; yang diizinkan
// cuma subdomain internal Linguo (sama dengan create-cart-invoice).
const ORIGIN_INTERNAL = /^https:\/\/(dashboard|teach|meet)\.linguo\.id$|^http:\/\/localhost:\d+$/;
function corsUntuk(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  if (!ORIGIN_INTERNAL.test(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    Vary: "Origin",
  };
}

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsUntuk(req) });
}

export async function POST(req: NextRequest) {
  const res = await buatInvoice(req);
  for (const [k, v] of Object.entries(corsUntuk(req))) res.headers.set(k, v);
  return res;
}

async function buatInvoice(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { plan: planId, email, promo } = body || {};
    // Nama & nomor WA cuma diisi dari WA Inbox (CS) — checkout mandiri tak punya.
    const nama = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
    const wa = typeof body?.phone === "string" ? body.phone.replace(/\D/g, "").slice(0, 16) : "";

    // ── 1. Validasi ────────────────────────────────────────────────────────
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    }
    const plan = WATCH_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Paket tidak valid." }, { status: 400 });
    }

    // ── 2. Harga SERVER-SIDE + kode (promo/afiliator, evaluasi ulang anti-tamper) ──
    let amount = plan.price;
    let code: string | null = null;
    let affiliateId: string | null = null;
    if (typeof promo === "string" && promo.trim()) {
      const ev = await resolveWatchCode(promo, plan.id);
      if (ev.ok && typeof ev.discountedAmount === "number") {
        amount = ev.discountedAmount;
        code = ev.code ?? null;
        affiliateId = ev.affiliateId ?? null; // hanya terisi kalau kode afiliator
      }
      // Kode tak valid → abaikan diam-diam, tagih harga penuh (modal sudah kasih
      // feedback validasi sebelum checkout).
    }
    if (amount <= 0) {
      // Diskon 100% → aktifkan tanpa invoice (belum didukung di jalur ini).
      return NextResponse.json({ error: "Kode tidak berlaku untuk paket ini." }, { status: 400 });
    }
    const description = `Langganan Watch & Learn — ${plan.label}`;

    const externalId = `WL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const supaHeaders = {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    // ── 3. Catat pesanan (best-effort; tabel dipakai webhook utk aktivasi) ──
    // Reuse tabel `leads` sebagai jejak CRM (konsisten dgn funnel). Kalau nanti
    // ada tabel khusus wl_subscriptions, pindahkan ke sana.
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: supaHeaders,
        body: JSON.stringify({
          name: nama || String(email).split("@")[0],
          email,
          ...(wa.length >= 8 ? { wa_number: wa } : {}),
          program: "Watch & Learn",
          language: "-",
          source: "watch-and-learn",
          payment_status: "PENDING",
          xendit_external_id: externalId,
          amount,
          // Atribusi afiliator kalau kode yang dipakai = referral_code valid.
          affiliate_id: affiliateId,
          affiliate_ref_code: affiliateId ? code : null,
        }),
      });
    } catch (e) {
      console.warn("WL lead insert non-fatal:", e);
    }

    // ── 4. Invoice Xendit ──────────────────────────────────────────────────
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
        description: code ? `${description} (promo ${code})` : description,
        currency: "IDR",
        invoice_duration: 86400,
        should_send_email: true,
        success_redirect_url: `${BASE_URL}/watch?wl=${externalId}`,
        failure_redirect_url: `${BASE_URL}/watch?wl=gagal`,
        items: [{ name: description, quantity: 1, price: amount }],
      }),
    });

    if (!xenditRes.ok) {
      const err = await xenditRes.text();
      console.error("Xendit error (WL):", err);
      let detail = err;
      try {
        const xj = JSON.parse(err);
        detail = xj.message || xj.error_code || err;
      } catch {}
      return NextResponse.json({ error: `Gagal membuat invoice: ${detail}` }, { status: 500 });
    }
    const invoice = await xenditRes.json();

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${externalId}`, {
        method: "PATCH",
        headers: supaHeaders,
        body: JSON.stringify({
          xendit_invoice_id: invoice.id,
          xendit_invoice_url: invoice.invoice_url,
          payment_deadline: invoice.expiry_date,
        }),
      });
    } catch (e) {
      console.warn("WL lead patch non-fatal:", e);
    }

    return NextResponse.json({
      invoice_url: invoice.invoice_url,
      invoice_id: invoice.id,
      external_id: externalId,
      amount,
    });
  } catch (error) {
    console.error("create-wl-invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
