import { NextRequest, NextResponse } from "next/server";

// ── enrollment-server-flow-v1 ────────────────────────────────────────────
// Pendaftaran "Daftar Kelas Baru" (akun dashboard) dipindah ke server route.
// ALASAN: insert client-side ke `registrations`/`students` ketolak RLS untuk
// role authenticated (gejala: "Gagal menyimpan pendaftaran"). Route ini pakai
// SERVICE_ROLE_KEY (bypass RLS) + XENDIT_SECRET_KEY (server-side, bukan edge
// function eksternal) jadi insert pasti jalan & invoice dibuat dengan benar.
//
// external_id invoice = `LINGUO-REG-<registration_id>-<ts>` → dipakai
// /api/xendit-webhook buat rekonsiliasi balik ke baris registrations saat PAID.

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://linguo.id";

const sbHeaders = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

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

    // 2b. Catat CRM lead (non-fatal). Tabel leads ga punya kolom notes → note
    //     dititipkan di `source`.
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: sbHeaders,
        body: JSON.stringify({
          name: name || email,
          email,
          wa_number: wa_number || null,
          program: product,
          language: language || null,
          level: level || null,
          source: "self-register",
          amount: amount || 0,
        }),
      });
    } catch (e) {
      console.warn("enroll: lead insert threw (non-fatal):", e);
    }

    // 3. Kalau ga minta invoice (jalur WA / simpan dulu) → selesai.
    if (!with_invoice) {
      return NextResponse.json({ registration });
    }

    // 4. Buat invoice Xendit (server-side secret key).
    const externalId = `LINGUO-REG-${registration.id}-${Date.now()}`;
    const desc = `${product}${language ? ` — ${language}` : ""}${duration ? ` (${duration} min/sesi)` : ""}`;
    const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: amount || 0,
        payer_email: email,
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
          given_names: name || email,
          email,
          ...(wa_number ? { mobile_number: wa_number.startsWith("+") ? wa_number : `+62${wa_number.replace(/^0/, "")}` } : {}),
        },
        success_redirect_url: `${BASE_URL}/akun/success`,
        failure_redirect_url: `${BASE_URL}/akun?xendit_failed=1`,
        items: [{ name: desc, quantity: 1, price: amount || 0 }],
      }),
    });

    if (!xenditRes.ok) {
      const err = await xenditRes.text();
      console.error("enroll: Xendit error:", err);
      let xfDetail = err;
      try { const xj = JSON.parse(err); xfDetail = xj.message || xj.error_code || err; } catch {}
      // registration tetap ada (status Menunggu Pembayaran) — user bisa retry / bayar manual.
      return NextResponse.json({ registration, error: `Gagal membuat invoice: ${xfDetail}` }, { status: 502 });
    }

    const invoice = await xenditRes.json();

    // 5. Simpan invoice url + external id ke registration.
    await fetch(`${SUPABASE_URL}/rest/v1/registrations?id=eq.${registration.id}`, {
      method: "PATCH",
      headers: sbHeaders,
      body: JSON.stringify({ xendit_invoice_url: invoice.invoice_url }),
    });

    return NextResponse.json({
      registration: { ...registration, xendit_invoice_url: invoice.invoice_url },
      invoice_url: invoice.invoice_url,
      invoice_id: invoice.id,
      external_id: externalId,
    });
  } catch (error) {
    console.error("enroll route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
