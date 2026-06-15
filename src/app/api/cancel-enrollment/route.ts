import { NextRequest, NextResponse } from "next/server";

// ── enrollment-student-cancel-v1 ─────────────────────────────────────────
// Dipanggil saat siswa klik "Batalkan pendaftaran" di kartu Belum Bayar
// (dashboard akun). Server (service role → bypass RLS):
//   1. Ambil registration + data siswa (buat isi lead follow-up).
//   2. INSERT lead (source = "student_cancel") biar tetap ke-track di CRM —
//      kolom `leads` ga punya `notes`/`phone`/`status`, jadi konteks dititip
//      di `source` & nomor HP pakai `wa_number` (lihat [[akun-enrollment-flow]]).
//      `leads.email` BUKAN unique → plain insert (bukan upsert on-conflict).
//   3. DELETE baris registration.
// Non-fatal di langkah lead: walau gagal nyatet lead, delete tetap jalan.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sbHeaders = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

export async function POST(req: NextRequest) {
  try {
    const { registrationId } = await req.json();
    if (!registrationId) {
      return NextResponse.json({ error: "registrationId wajib." }, { status: 400 });
    }

    // 1. Ambil registration + data siswa (buat isi lead).
    const selectCols =
      "id,product,language,level,total_amount,students(name,email,whatsapp)";
    const getRes = await fetch(
      `${SUPABASE_URL}/rest/v1/registrations?id=eq.${registrationId}&select=${encodeURIComponent(selectCols)}&limit=1`,
      { headers: sbHeaders }
    );
    if (!getRes.ok) {
      const err = await getRes.text();
      console.error("cancel: fetch reg error:", err);
      return NextResponse.json({ error: "Gagal membaca registrasi." }, { status: 500 });
    }
    const rows = await getRes.json();
    const reg = Array.isArray(rows) ? rows[0] : rows;
    if (!reg) return NextResponse.json({ error: "Registrasi tidak ditemukan." }, { status: 404 });

    // 2. Insert lead follow-up (non-fatal kalau gagal — tetap lanjut delete).
    const student = reg.students || {};
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: "POST",
        headers: sbHeaders,
        body: JSON.stringify({
          name: student.name || student.email || "Calon Siswa",
          email: student.email || null,
          wa_number: student.whatsapp || null,
          program: reg.product || "Private",
          language: reg.language || null,
          level: reg.level || null,
          source: "student_cancel",
          amount: reg.total_amount || 0,
        }),
      });
    } catch (e) {
      console.warn("cancel: lead insert threw (non-fatal):", e);
    }

    // 3. Delete registration.
    const delRes = await fetch(
      `${SUPABASE_URL}/rest/v1/registrations?id=eq.${registrationId}`,
      { method: "DELETE", headers: sbHeaders }
    );
    if (!delRes.ok) {
      const err = await delRes.text();
      console.error("cancel: delete error:", err);
      return NextResponse.json({ error: "Gagal menghapus registrasi." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("cancel-enrollment route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
