import { NextRequest, NextResponse } from "next/server";

const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ── lms-subscription-v1: aktivasi access-pass saat invoice PAID ──────────────
// Dipanggil hanya saat status === "PAID". Match by invoice id (subscription
// tidak punya row di `leads`). Non-fatal: kalau invoice ini bukan subscription
// (mis. lead biasa), lookup balik kosong → skip diam-diam.
async function activateLmsSubscription(invoiceId: string): Promise<void> {
  try {
    // Ambil row pending buat tau plan-nya (durasi dihitung dari plan).
    const getRes = await fetch(
      `${SUPABASE_URL}/rest/v1/lms_subscriptions?xendit_invoice_id=eq.${invoiceId}&status=eq.pending&select=id,plan&limit=1`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      }
    );
    if (!getRes.ok) {
      console.error("Sub lookup failed:", await getRes.text());
      return;
    }
    const rows = await getRes.json();
    const sub = Array.isArray(rows) ? rows[0] : null;
    if (!sub?.id) return; // bukan invoice subscription — skip

    const now = new Date();
    const addMonths = (m: number) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() + m);
      return d.toISOString();
    };
    let expiresAt: string | null = null;
    if (sub.plan === "1m") expiresAt = addMonths(1);
    else if (sub.plan === "6m") expiresAt = addMonths(6);
    else if (sub.plan === "12m") expiresAt = addMonths(12);
    else if (sub.plan === "lifetime") expiresAt = null; // akses selamanya

    const patchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/lms_subscriptions?id=eq.${sub.id}&status=eq.pending`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          status: "active",
          started_at: now.toISOString(),
          expires_at: expiresAt,
        }),
      }
    );
    if (!patchRes.ok) {
      console.error("Sub activation failed:", await patchRes.text());
    } else {
      console.log(`LMS subscription activated: ${sub.id} (plan=${sub.plan})`);
    }
  } catch (e) {
    console.error("activateLmsSubscription error (non-fatal):", e);
  }
}

// ── simulasi-paywall-v1: grant akses simulasi saat invoice PAID ──────────────
// Invoice simulasi punya external_id `LINGUO-SIM-<toefl|ielts>-<ts>`. Email
// pembeli diambil dari row lead (sudah di-update di handler utama). Idempoten:
// cek dulu apakah entitlement aktif sudah ada (juga dijaga unique index DB).
async function grantSimulationEntitlement(externalId: string): Promise<void> {
  try {
    const m = /^LINGUO-SIM-(toefl|ielts)-/.exec(externalId || "");
    if (!m) return; // bukan invoice simulasi — skip
    const testType = m[1];

    // Ambil email + amount dari lead.
    const leadRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${externalId}&select=email,amount&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!leadRes.ok) { console.error("Sim lead lookup failed:", await leadRes.text()); return; }
    const leadRows = await leadRes.json();
    const email = Array.isArray(leadRows) ? leadRows[0]?.email : null;
    if (!email) { console.error("Sim entitlement: email tidak ditemukan utk", externalId); return; }

    // Idempotensi: skip kalau sudah ada entitlement aktif utk email+test_type.
    const existRes = await fetch(
      `${SUPABASE_URL}/rest/v1/simulation_entitlements?email=ilike.${encodeURIComponent(email)}&test_type=eq.${testType}&status=eq.active&select=id&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (existRes.ok) {
      const exist = await existRes.json();
      if (Array.isArray(exist) && exist[0]?.id) {
        console.log(`Sim entitlement sudah ada: ${email} (${testType}) — skip`);
        return;
      }
    }

    const insRes = await fetch(`${SUPABASE_URL}/rest/v1/simulation_entitlements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        email,
        test_type: testType,
        status: "active",
        source_external_id: externalId,
        amount: Array.isArray(leadRows) ? leadRows[0]?.amount ?? null : null,
      }),
    });
    if (!insRes.ok) console.error("Sim entitlement insert failed:", await insRes.text());
    else console.log(`Sim entitlement granted: ${email} (${testType})`);
  } catch (e) {
    console.error("grantSimulationEntitlement error (non-fatal):", e);
  }
}

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

    // 2. Update lead in Supabase (subscription tidak punya lead → 0 rows, aman)
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

    // 2b. [SUBSCRIPTION] Aktivasi access-pass LMS kalau invoice ini subscription.
    if (status === "PAID") {
      await activateLmsSubscription(id);
      // simulasi-paywall-v1: grant entitlement simulasi (external_id LINGUO-SIM-*).
      await grantSimulationEntitlement(external_id);
    }

    // 2c. [REGISTRATION] enrollment-server-flow-v1 — invoice dari /api/enroll
    //     punya external_id `LINGUO-REG-<registration_id>-<ts>`. Rekonsiliasi
    //     balik ke baris registrations. Non-fatal (invoice lain → no match).
    const regMatch = /^LINGUO-REG-([0-9a-fA-F-]{36})-/.exec(external_id || "");
    if (regMatch) {
      const regId = regMatch[1];
      // registrations.status punya CHECK constraint — JANGAN set status di sini.
      // Cukup update payment_status: 'Lunas' saat PAID, else status mentah webhook.
      const regUpdate: Record<string, unknown> =
        status === "PAID"
          ? { payment_status: "Lunas" }
          : { payment_status: status }; // EXPIRED / dll
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/registrations?id=eq.${regId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify(regUpdate),
        });
      } catch (e) {
        console.error("Webhook registration update error (non-fatal):", e);
      }
    }

    // 3. TODO: Send confirmation email (Resend) — next session

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
