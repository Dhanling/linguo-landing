import { NextRequest, NextResponse } from "next/server";

// ── enrollment-24h-autoexpire-v1 ─────────────────────────────────────────
// Dipanggil client saat dashboard load untuk tiap registration yang masih
// "Menunggu Pembayaran" & umurnya > 24 jam. Server (service role → bypass RLS):
//   1. Re-cek umur & status (anti-race / anti-spoof; client cuma kirim id).
//   2. INSERT lead follow-up (source = "self-register" + note auto-expired) —
//      kolom `leads` ga punya `notes`/`phone`, jadi note dititip di `source`
//      dan nomor HP pakai `wa_number`.
//   3. DELETE baris registration.
// Idempns: kalau status udah bukan Menunggu Pembayaran / umur < 24h → no-op.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;

const sbHeaders = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

export async function POST(req: NextRequest) {
  try {
    const { registration_id } = await req.json();
    if (!registration_id) {
      return NextResponse.json({ error: "registration_id wajib." }, { status: 400 });
    }

    // 1. Ambil registration + data siswa (buat isi lead).
    const selectCols =
      "id,status,created_at,registration_date,product,language,level,total_amount,students(name,email,whatsapp)";
    const getRes = await fetch(
      `${SUPABASE_URL}/rest/v1/registrations?id=eq.${registration_id}&select=${encodeURIComponent(selectCols)}&limit=1`,
      { headers: sbHeaders }
    );
    if (!getRes.ok) {
      const err = await getRes.text();
      console.error("expire: fetch reg error:", err);
      return NextResponse.json({ error: "Gagal membaca registrasi." }, { status: 500 });
    }
    const rows = await getRes.json();
    const reg = Array.isArray(rows) ? rows[0] : rows;
    if (!reg) return NextResponse.json({ expired: false, reason: "not-found" });

    // 2. Validasi: harus masih Menunggu Pembayaran & umur > 24 jam.
    if (reg.status !== "Menunggu Pembayaran") {
      return NextResponse.json({ expired: false, reason: "status-changed" });
    }
    const createdMs = new Date(reg.created_at || reg.registration_date || Date.now()).getTime();
    if (Date.now() - createdMs < TWENTY_FOUR_H) {
      return NextResponse.json({ expired: false, reason: "not-old-enough" });
    }

    // 3. Insert lead follow-up (non-fatal kalau gagal — tetap lanjut delete).
    const student = reg.students || {};
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: sbHeaders,
        body: JSON.stringify({
          name: student.name || student.email || "Calon Siswa",
          email: student.email || null,
          wa_number: student.whatsapp || null,
          language: reg.language || null,
          level: reg.level || null,
          program: reg.product || "Private",
          source: "self-register (auto-expired)",
          amount: reg.total_amount || 0,
        }),
      });
    } catch (e) {
      console.warn("expire: lead insert threw (non-fatal):", e);
    }

    // 4. Delete registration — guard ulang via filter status biar aman dari race.
    const delRes = await fetch(
      `${SUPABASE_URL}/rest/v1/registrations?id=eq.${registration_id}&status=eq.Menunggu%20Pembayaran`,
      { method: "DELETE", headers: sbHeaders }
    );
    if (!delRes.ok) {
      const err = await delRes.text();
      console.error("expire: delete error:", err);
      return NextResponse.json({ error: "Gagal menghapus registrasi." }, { status: 500 });
    }

    return NextResponse.json({ expired: true });
  } catch (error) {
    console.error("expire-enrollment route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
