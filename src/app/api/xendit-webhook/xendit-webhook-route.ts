import { NextRequest, NextResponse } from "next/server";

const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    // 1. Verify webhook token
    const callbackToken = req.headers.get("x-callback-token");
    if (callbackToken !== XENDIT_WEBHOOK_TOKEN) {
      console.error("Invalid webhook token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, external_id, status, paid_amount, paid_at, payment_method, payment_channel } = body;

    console.log(`Webhook received: ${external_id} → ${status}`);

    // 2. Update lead in Supabase
    const updateData: Record<string, unknown> = {
      payment_status: status, // PAID, EXPIRED, etc.
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

    // 3. TODO: Send confirmation email (Resend) — next session

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
