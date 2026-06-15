import { NextRequest, NextResponse, after } from "next/server";

// ── enrollment-server-flow-v1 ────────────────────────────────────────────
// Pendaftaran "Daftar Kelas Baru" (akun dashboard) dipindah ke server route.
// ALASAN: insert client-side ke `registrations`/`students` ketolak RLS untuk
// role authenticated (gejala: "Gagal menyimpan pendaftaran"). Route ini pakai
// SERVICE_ROLE_KEY (bypass RLS) + XENDIT_SECRET_KEY (server-side, bukan edge
// function eksternal) jadi insert pasti jalan & invoice dibuat dengan benar.
//
// external_id invoice = `LINGUO-REG-<registration_id>-<ts>` → dipakai
// /api/xendit-webhook buat rekonsiliasi balik ke baris registrations saat PAID.
//
// [enroll-async-invoice-v1] Pembuatan invoice Xendit (lambat ±1-3 dtk) TIDAK
// di-await di jalur response. Begitu INSERT registrations sukses, route langsung
// balikin { registration, registrationId } biar client bisa nutup modal & nampilin
// kartu pending seketika (tanpa spinner). Invoice Xendit + lead CRM dikerjain di
// background via `after()` (tetap jalan setelah response terkirim), lalu URL invoice
// di-PATCH ke baris registrations secara async. PaymentCard ("Lanjutkan Pembayaran")
// yang nantinya redirect ke invoice_url begitu kolomnya terisi.

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://linguo.id";

const sbHeaders = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

// [enroll-async-invoice-v1] Catat CRM lead. Non-fatal — dipanggil di background.
async function captureLead(p: {
  email: string; name?: string; wa_number?: string | null;
  product: string; language?: string | null; level?: string | null; amount?: number;
}): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: sbHeaders,
      body: JSON.stringify({
        name: p.name || p.email,
        email: p.email,
        wa_number: p.wa_number || null,
        program: p.product,
        language: p.language || null,
        level: p.level || null,
        source: "self-register",
        amount: p.amount || 0,
      }),
    });
  } catch (e) {
    console.warn("enroll: lead insert threw (non-fatal):", e);
  }
}

// [enroll-async-invoice-v1] Buat invoice Xendit lalu PATCH url-nya ke registrations.
// Dijalanin di background (after) — gagal di sini tidak mempengaruhi response client;
// user tetap bisa retry lewat tombol "Lanjutkan Pembayaran" (regenerate invoice).
async function createXenditInvoiceAndSave(p: {
  registrationId: string; email: string; name?: string; wa_number?: string | null;
  product: string; language?: string | null; duration?: string | null; amount?: number;
}): Promise<void> {
  try {
    const externalId = `LINGUO-REG-${p.registrationId}-${Date.now()}`;
    const desc = `${p.product}${p.language ? ` — ${p.language}` : ""}${p.duration ? ` (${p.duration} min/sesi)` : ""}`;
    const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: p.amount || 0,
        payer_email: p.email,
        description: desc,
        currency: "IDR",
        invoice_duration: 86400, // 24 jam
        should_send_email: true,
        customer_notification_preference: {
          invoice_created: ["email", "whatsapp"],
          invoice_reminder: ["email", "whatsapp"],
          invoice_paid: ["email", "whatsapp"],
        },
        customer: {
          given_names: p.name || p.email,
          email: p.email,
          ...(p.wa_number ? { mobile_number: p.wa_number.startsWith("+") ? p.wa_number : `+62${p.wa_number.replace(/^0/, "")}` } : {}),
        },
        success_redirect_url: `${BASE_URL}/akun/success`,
        failure_redirect_url: `${BASE_URL}/akun?xendit_failed=1`,
        items: [{ name: desc, quantity: 1, price: p.amount || 0 }],
      }),
    });

    if (!xenditRes.ok) {
      console.error("enroll(bg): Xendit error:", await xenditRes.text());
      return;
    }
    const invoice = await xenditRes.json();

    await fetch(`${SUPABASE_URL}/rest/v1/registrations?id=eq.${p.registrationId}`, {
      method: "PATCH",
      headers: sbHeaders,
      body: JSON.stringify({ xendit_invoice_url: invoice.invoice_url }),
    });
    console.log(`enroll(bg): invoice ready for ${p.registrationId}`);
  } catch (e) {
    console.error("enroll(bg): createXenditInvoiceAndSave threw (non-fatal):", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      name,
      wa_number,
      avatar_url,
      product,           // "Kelas Private" | "Kelas Reguler" | ...
      language,          // mis. "Spanish" / "IELTS/TOEFL"
      level,
      duration,          // string menit/sesi
      amount,            // total_amount (rupiah)
      ref_code,
      with_invoice,      // true → langsung buat invoice Xendit & balikin invoice_url
    } = body || {};

    if (!email || !product) {
      return NextResponse.json({ error: "email & product wajib." }, { status: 400 });
    }

    // 1. Select-or-insert student by email (service role → bypass RLS).
    //    NB: tabel students TIDAK punya unique constraint di `email`, jadi
    //    upsert ON CONFLICT=email gagal dgn 42P10. Pakai SELECT dulu, baru
    //    INSERT kalau belum ada. Update data (nama/wa/avatar) saat sudah ada
    //    biar tetap fresh tanpa butuh constraint.
    let studentId: string | undefined;
    const findRes = await fetch(
      `${SUPABASE_URL}/rest/v1/students?email=eq.${encodeURIComponent(email)}&select=id&limit=1`,
      { headers: sbHeaders }
    );
    if (!findRes.ok) {
      const err = await findRes.text();
      console.error("enroll: student lookup error:", err);
      return NextResponse.json({ error: `Gagal mencari data siswa: ${err}` }, { status: 500 });
    }
    const foundRows = await findRes.json();
    studentId = Array.isArray(foundRows) ? foundRows[0]?.id : undefined;

    if (studentId) {
      // Sudah ada — refresh nama/wa/avatar (non-fatal kalau gagal).
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}`, {
          method: "PATCH",
          headers: sbHeaders,
          body: JSON.stringify({
            name: name || email,
            ...(wa_number ? { whatsapp: wa_number } : {}),
            ...(avatar_url ? { avatar_url } : {}),
          }),
        });
      } catch (e) {
        console.warn("enroll: student update threw (non-fatal):", e);
      }
    } else {
      // Belum ada — INSERT & ambil id baru.
      const insRes = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
        method: "POST",
        headers: { ...sbHeaders, Prefer: "return=representation" },
        body: JSON.stringify({
          email,
          name: name || email,
          ...(wa_number ? { whatsapp: wa_number } : {}),
          ...(avatar_url ? { avatar_url } : {}),
        }),
      });
      if (!insRes.ok) {
        const err = await insRes.text();
        console.error("enroll: student insert error:", err);
        return NextResponse.json({ error: `Gagal menyimpan data siswa: ${err}` }, { status: 500 });
      }
      const insRows = await insRes.json();
      studentId = Array.isArray(insRows) ? insRows[0]?.id : insRows?.id;
    }
    if (!studentId) {
      return NextResponse.json({ error: "Gagal membaca id siswa." }, { status: 500 });
    }

    // 2. Insert registration (status Menunggu Pembayaran). Service role bypass RLS.
    const regRes = await fetch(`${SUPABASE_URL}/rest/v1/registrations`, {
      method: "POST",
      headers: { ...sbHeaders, Prefer: "return=representation" },
      body: JSON.stringify({
        student_id: studentId,
        affiliate_ref_code: ref_code || null,
        product,
        language: language || null,
        level: level || "A1.1",
        status: "Menunggu Pembayaran",
        sessions_total: 0,
        sessions_used: 0,
        duration: duration || null,
        total_amount: amount || 0,
        payment_status: "Belum Bayar",
        enrollment_source: "self_service",
        registration_date: new Date().toISOString(),
      }),
    });
    if (!regRes.ok) {
      const err = await regRes.text();
      console.error("enroll: registration insert error:", err);
      return NextResponse.json({ error: `Gagal menyimpan pendaftaran: ${err}` }, { status: 500 });
    }
    const regRows = await regRes.json();
    const registration = Array.isArray(regRows) ? regRows[0] : regRows;

    // 3. [enroll-async-invoice-v1] Kerjaan lambat (lead CRM + invoice Xendit)
    //    dipindah ke background lewat `after()` — jalan SETELAH response terkirim,
    //    jadi client dapat balasan seketika (tanpa nunggu Xendit ±1-3 dtk).
    after(async () => {
      // Lead CRM (non-fatal). Tabel leads ga punya kolom notes → note di `source`.
      await captureLead({ email, name, wa_number, product, language, level, amount });
      // Invoice Xendit hanya kalau diminta (jalur "Bayar Otomatis"). Url di-PATCH
      // ke baris registrations begitu jadi; PaymentCard yang redirect-in.
      if (with_invoice) {
        await createXenditInvoiceAndSave({
          registrationId: registration.id, email, name, wa_number, product, language, duration, amount,
        });
      }
    });

    // 4. Balikin cepat — client langsung nutup modal & nampilin kartu pending.
    //    invoice_url menyusul async di kolom xendit_invoice_url.
    return NextResponse.json({
      success: true,
      registration,
      registrationId: registration.id,
      invoice_pending: !!with_invoice, // true → url Xendit lagi disiapin di background
    });
  } catch (error) {
    console.error("enroll route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
