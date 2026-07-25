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

// ── funnel-autoconvert-v1: PAID funnel lead → registrations otomatis ─────────
// MASALAH: checkout funnel landing (create-funnel-invoice) cuma bikin baris di
// `leads`. Overview admin (line chart, "Pendaftaran Terbaru", omzet) baca dari
// `registrations`. Jadi pembayaran ETP/Test Prep/Private dari landing yang sudah
// LUNAS di Xendit TAK PERNAH nongol di Overview sampai admin klik "Convert"
// manual. Fungsi ini mereplikasi logika Convert (Leads.tsx handleConvertToRegistration)
// di sisi server: upsert student → insert registration (Lunas) → tandai lead
// CONVERTED + archived + converted_registration_id.
//
// Anti double-count / idempoten: skip kalau lead sudah punya converted_registration_id
// atau sudah diarsip (webhook Xendit bisa dikirim berkali-kali). Digital (E-Learning/
// E-Book) SENGAJA di-skip — punya pipeline sendiri (digital_purchases) biar tak dobel.
function mapFunnelProgramToProduct(program: string | null): string | null {
  const p = (program || "").toLowerCase().trim();
  if (!p) return null;
  if (p === "kelas private" || p === "private") return "Kelas Private";
  if (p === "kelas reguler" || p === "reguler") return "Kelas Reguler";
  if (p === "kelas kids" || p === "kids") return "Kelas Kids";
  if (p === "semi private" || p === "kelas semi private") return "Kelas Semi Private";
  if (
    p === "ielts/toefl prep" ||
    p === "ielts-toefl" ||
    p === "english test preparation (ielts/toefl)"
  )
    return "English Test Preparation (IELTS/TOEFL)";
  // Test Prep (HSK/JLPT/TOPIK/Goethe): tak ada enum khusus → default format grup kecil.
  if (p === "test prep") return "Kelas Semi Private";
  // "digital"/"e-learning"/"e-book"/"simulasi" → skip (pipeline sendiri).
  return null;
}

async function autoConvertPaidLeadToRegistration(externalId: string): Promise<void> {
  try {
    const supaHeaders = {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    // 1. Ambil lead lengkap by external_id.
    const leadRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${externalId}&select=id,name,email,wa_number,language,program,level,amount,paid_amount,paid_at,birthdate,learning_goal,schedule_preference,sessions,converted_registration_id,archived_at&limit=1`,
      { headers: supaHeaders }
    );
    if (!leadRes.ok) {
      console.error("Autoconvert lead lookup failed:", await leadRes.text());
      return;
    }
    const leadRows = await leadRes.json();
    const lead = Array.isArray(leadRows) ? leadRows[0] : null;
    if (!lead) return; // bukan lead funnel (subscription/enroll/simulasi) — skip diam-diam
    // Idempoten: sudah dikonversi atau diarsip → jangan dobel.
    if (lead.converted_registration_id || lead.archived_at) {
      console.log(`Autoconvert skip: lead ${lead.id} sudah dikonversi/diarsip`);
      return;
    }
    if (!lead.name) {
      console.log(`Autoconvert skip: lead ${lead.id} tanpa nama`);
      return;
    }
    const product = mapFunnelProgramToProduct(lead.program);
    if (!product) {
      console.log(`Autoconvert skip: program "${lead.program}" tak dipetakan (digital/simulasi/unknown)`);
      return;
    }

    // 2. Upsert student (match by nama, mirror admin Convert).
    let studentId: string | null = null;
    const stuRes = await fetch(
      `${SUPABASE_URL}/rest/v1/students?name=ilike.${encodeURIComponent(lead.name)}&select=id&limit=1`,
      { headers: supaHeaders }
    );
    if (stuRes.ok) {
      const stuRows = await stuRes.json();
      if (Array.isArray(stuRows) && stuRows[0]?.id) studentId = stuRows[0].id;
    }
    if (studentId) {
      await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}`, {
        method: "PATCH",
        headers: supaHeaders,
        body: JSON.stringify({
          whatsapp: lead.wa_number || null,
          email: lead.email || null,
          birth_date: lead.birthdate || null,
        }),
      });
    } else {
      // source dibiarkan null (CHECK students_source_check cuma terima enum channel).
      const insStu = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
        method: "POST",
        headers: { ...supaHeaders, Prefer: "return=representation" },
        body: JSON.stringify({
          name: lead.name,
          whatsapp: lead.wa_number || null,
          email: lead.email || null,
          birth_date: lead.birthdate || null,
          learning_objective: lead.learning_goal || null,
        }),
      });
      if (!insStu.ok) {
        console.error("Autoconvert student insert failed:", await insStu.text());
        return;
      }
      const stuJson = await insStu.json();
      studentId = Array.isArray(stuJson) ? stuJson[0]?.id : stuJson?.id;
    }
    if (!studentId) {
      console.error("Autoconvert: student_id tak ketemu setelah upsert");
      return;
    }

    // 3. Reguler: resolusi kode batch dari lead.language (mirror admin).
    const isReguler = product === "Kelas Reguler";
    let resolvedBatchId: string | null = null;
    let resolvedLevel: string | null = null;
    const batchCode =
      (lead.language || "").match(/([A-Z]{2,4}-[A-Za-z0-9.]+-[A-Z]{3}\d{2}(?:-[A-Z])?)/)?.[1] ||
      null;
    if (batchCode) {
      resolvedLevel = batchCode.split("-")[1] || null;
      const bRes = await fetch(
        `${SUPABASE_URL}/rest/v1/regular_batches?batch_code=ilike.${encodeURIComponent(batchCode)}&select=id&limit=1`,
        { headers: supaHeaders }
      );
      if (bRes.ok) {
        const bRows = await bRes.json();
        if (Array.isArray(bRows) && bRows[0]?.id) resolvedBatchId = bRows[0].id;
      }
    }

    // 4. Insert registration (Lunas). payment_date WAJIB diisi biar masuk grafik
    //    Pendapatan (di-bucket by payment_date, lihat omzet-payment-date-invariant).
    const paidDate = lead.paid_at
      ? new Date(lead.paid_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    const isDigital = product === "E-Learning" || product === "E-Book";
    const regPayload: Record<string, unknown> = {
      student_id: studentId,
      product,
      language: lead.language || null,
      batch_id: resolvedBatchId,
      level: resolvedLevel || (lead.level ? `${lead.level}.1` : null),
      status: "Aktif",
      pipeline_status: "Aktif",
      total_amount: lead.paid_amount || lead.amount || 0,
      payment_status: "Lunas",
      registration_date: paidDate,
      payment_date: paidDate,
      sessions_total: isDigital || isReguler ? null : Number(lead.sessions) || 16,
      preferred_schedule: isDigital ? null : lead.schedule_preference || null,
    };
    if (isReguler) regPayload.product_type = "Reguler";

    const insReg = await fetch(`${SUPABASE_URL}/rest/v1/registrations`, {
      method: "POST",
      headers: { ...supaHeaders, Prefer: "return=representation" },
      body: JSON.stringify(regPayload),
    });
    if (!insReg.ok) {
      console.error("Autoconvert registration insert failed:", await insReg.text());
      return;
    }
    const regJson = await insReg.json();
    const regId = Array.isArray(regJson) ? regJson[0]?.id : regJson?.id;

    // 5. Tandai lead CONVERTED + link ke registration (idempotensi berikutnya).
    //    SENGAJA TAK diarsip: beda dari Convert manual admin — lead tetap tampil
    //    di daftar Leads aktif dengan badge "Converted" biar customer yang sudah
    //    bayar tetap kelihatan di CRM. `converted_registration_id` jadi kunci
    //    idempotensi + penanda "jangan convert ulang".
    await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
      method: "PATCH",
      headers: supaHeaders,
      body: JSON.stringify({
        payment_status: "CONVERTED",
        converted_registration_id: regId || null,
      }),
    });
    console.log(`Autoconvert OK: lead ${lead.id} (${lead.name}) → registration ${regId} [${product}]`);
  } catch (e) {
    console.error("autoConvertPaidLeadToRegistration error (non-fatal):", e);
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
      // funnel-autoconvert-v1: lead funnel landing yang LUNAS → registrations otomatis
      // biar langsung nongol di Overview (line chart, Pendaftaran Terbaru, omzet).
      // Skip diam-diam kalau bukan lead funnel / digital / sudah dikonversi.
      await autoConvertPaidLeadToRegistration(external_id);
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
