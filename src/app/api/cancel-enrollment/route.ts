import { NextRequest, NextResponse } from "next/server";
import { pastikanPemilikRegistrasi, PERAN_STAF_HAPUS } from "@/lib/pemilikRegistrasi";

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
      "id,product,language,level,total_amount,status,payment_status,students(name,email,whatsapp)";
    const getRes = await fetch(
      `${SUPABASE_URL}/rest/v1/registrations?id=eq.${encodeURIComponent(String(registrationId))}&select=${encodeURIComponent(selectCols)}&limit=1`,
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

    /* [reg-hapus-butuh-pemilik-v1] Endpoint ini MENGHAPUS baris registrasi dengan
       service role. Dulu modalnya cuma `registrationId` di body — tanpa sesi,
       tanpa cek pemilik — jadi siapa pun yang pernah melihat sebuah id (id-nya
       muncul di URL /akun/kelas/<id>) bisa membatalkan pendaftaran orang lain. */
    // [audit9-batal-reg-v1] staf yang boleh hanya owner/admin (bukan teacher/sales).
    const pagar = await pastikanPemilikRegistrasi(req, reg.students?.email, PERAN_STAF_HAPUS);
    if (!pagar.ok) {
      return NextResponse.json({ error: pagar.error }, { status: pagar.status });
    }

    // [audit9-batal-reg-v1] Hanya registrasi yang BELUM dibayar yang boleh dihapus
    // — sama dengan syarat kartu "Belum Bayar" di /akun (pendingRegs). Dulu route
    // ini menghapus registrasi Aktif/Lunas juga, tinggal tahu id-nya.
    const ps = String(reg.payment_status ?? "").trim();
    if (reg.status !== "Menunggu Pembayaran" || (ps && ps !== "Belum Bayar")) {
      return NextResponse.json(
        { error: "Pendaftaran yang sudah dibayar atau sudah berjalan tidak bisa dibatalkan dari sini. Hubungi admin Linguo." },
        { status: 409 }
      );
    }

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
      // [audit9-batal-reg-v1] filter status diulang di DELETE supaya aman dari balapan
      // (mis. webhook Xendit menandai Lunas di antara cek dan hapus).
      `${SUPABASE_URL}/rest/v1/registrations?id=eq.${encodeURIComponent(String(registrationId))}&status=eq.Menunggu%20Pembayaran&or=(payment_status.is.null,payment_status.eq.Belum%20Bayar,payment_status.eq.)`,
      { method: "DELETE", headers: { ...sbHeaders, Prefer: "return=representation" } }
    );
    if (!delRes.ok) {
      const err = await delRes.text();
      console.error("cancel: delete error:", err);
      return NextResponse.json({ error: "Gagal menghapus registrasi." }, { status: 500 });
    }
    const terhapus = await delRes.json().catch(() => []);
    if (!Array.isArray(terhapus) || terhapus.length === 0) {
      return NextResponse.json(
        { error: "Status pendaftaran berubah (mungkin baru dibayar). Muat ulang halaman." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("cancel-enrollment route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
