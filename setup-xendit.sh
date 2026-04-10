#!/bin/bash
cd ~/linguo-landing

# 1. Create API route: create-invoice
mkdir -p src/app/api/create-invoice
cat > src/app/api/create-invoice/route.ts << 'ENDFILE'
import { NextRequest, NextResponse } from "next/server";

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
  "e-learning": { amount: 29000, description: "E-Learning Access" },
  "e-book": { amount: 29000, description: "E-Book Digital" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, wa_number, language, program, level, productKey: directKey } = body;

    const productKey = directKey || (program && level ? `${program}-${level.toLowerCase()}` : program);
    const product = PRODUCT_PRICES[productKey || ""];
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 400 });
    }

    const externalId = `LINGUO-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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
        amount: product.amount,
      }),
    });

    if (!leadRes.ok) {
      const err = await leadRes.text();
      console.error("Supabase error:", err);
      return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
    }

    const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: product.amount,
        payer_email: email,
        description: `${product.description}${language ? ` — ${language}` : ""}`,
        currency: "IDR",
        invoice_duration: 86400,
        customer: {
          given_names: name,
          email: email,
          mobile_number: wa_number?.startsWith("+") ? wa_number : `+62${wa_number}`,
        },
        success_redirect_url: `${BASE_URL}/payment/success?id=${externalId}`,
        failure_redirect_url: `${BASE_URL}/payment/failed?id=${externalId}`,
        items: [{ name: product.description, quantity: 1, price: product.amount }],
      }),
    });

    if (!xenditRes.ok) {
      const err = await xenditRes.text();
      console.error("Xendit error:", err);
      return NextResponse.json({ error: "Gagal membuat invoice" }, { status: 500 });
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
ENDFILE

# 2. Create API route: xendit-webhook
mkdir -p src/app/api/xendit-webhook
cat > src/app/api/xendit-webhook/route.ts << 'ENDFILE'
import { NextRequest, NextResponse } from "next/server";

const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const callbackToken = req.headers.get("x-callback-token");
    if (callbackToken !== XENDIT_WEBHOOK_TOKEN) {
      console.error("Invalid webhook token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, external_id, status, paid_amount, paid_at, payment_method, payment_channel } = body;
    console.log(`Webhook received: ${external_id} -> ${status}`);

    const updateData: Record<string, unknown> = {
      payment_status: status,
      xendit_invoice_id: id,
    };

    if (status === "PAID") {
      updateData.paid_at = paid_at;
      updateData.paid_amount = paid_amount;
      updateData.payment_method = payment_method;
      updateData.payment_channel = payment_channel;
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${external_id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase update error:", err);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
ENDFILE

# 3. Create payment success page
mkdir -p src/app/payment/success
cat > src/app/payment/success/page.tsx << 'ENDFILE'
"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const id = params.get("id");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
        <p className="text-gray-600 mb-6">Terima kasih sudah mendaftar di Linguo! Kami akan menghubungi kamu via WhatsApp dalam 1x24 jam untuk jadwal kelas.</p>
        <p className="text-sm text-gray-400 mb-8">Order ID: {id}</p>
        <div className="flex flex-col gap-3">
          <a href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20sudah%20bayar" target="_blank"
            className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition">Chat WhatsApp</a>
          <a href="/" className="text-teal-600 hover:underline text-sm">Kembali ke halaman utama</a>
        </div>
      </div>
    </div>
  );
}
export default function PaymentSuccess() {
  return (<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}><SuccessContent /></Suspense>);
}
ENDFILE

# 4. Create payment failed page
mkdir -p src/app/payment/failed
cat > src/app/payment/failed/page.tsx << 'ENDFILE'
"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailedContent() {
  const params = useSearchParams();
  const id = params.get("id");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Gagal</h1>
        <p className="text-gray-600 mb-6">Sepertinya ada kendala pada pembayaranmu. Jangan khawatir, kamu bisa coba lagi atau hubungi kami.</p>
        <p className="text-sm text-gray-400 mb-8">Order ID: {id}</p>
        <div className="flex flex-col gap-3">
          <a href="/" className="bg-[#1A9E9E] text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition">Coba Lagi</a>
          <a href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20pembayaran%20saya%20gagal" target="_blank"
            className="text-teal-600 hover:underline text-sm">Butuh bantuan? Chat WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
export default function PaymentFailed() {
  return (<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}><FailedContent /></Suspense>);
}
ENDFILE

echo ""
echo "✅ Semua 4 file berhasil dibuat!"
echo "   - src/app/api/create-invoice/route.ts"
echo "   - src/app/api/xendit-webhook/route.ts"
echo "   - src/app/payment/success/page.tsx"
echo "   - src/app/payment/failed/page.tsx"
echo ""
echo "Sekarang tinggal update page.tsx..."
