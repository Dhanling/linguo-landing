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
  "e-learning": { amount: 29000, description: "E-Learning 1 Bulan" },
    "e-learning-6": { amount: 99000, description: "E-Learning 6 Bulan" },
    "e-learning-12": { amount: 179000, description: "E-Learning 12 Bulan" },
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
