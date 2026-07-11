import { NextRequest, NextResponse } from "next/server";

// ── preview-student-v1 ───────────────────────────────────────────────────
// Endpoint READ-ONLY buat "POV siswa" tanpa login. Dashboard /akun bisa
// dibuka via /akun?preview=<student_id>. Karena RLS memblok anon baca
// registrations, data real di-fetch di server pakai SERVICE_ROLE_KEY.
//
// Keamanan: <student_id> adalah UUID (praktis tidak bisa ditebak) & endpoint
// ini cuma mengembalikan data belajar (bukan data sensitif pembayaran mentah).
// Dipakai internal buat preview tampilan; jangan disebar publik.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function rest(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: H, cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  // Validasi bentuk UUID biar ga dipakai buat enumerasi sembarangan.
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const students = await rest(
    `students?id=eq.${id}&select=id,name,email,whatsapp,avatar_url&limit=1`
  );
  const student = students?.[0];
  if (!student) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const regs =
    (await rest(
      `registrations?student_id=eq.${id}` +
        `&select=id,product,language,level,status,sessions_total,sessions_used,` +
        `duration,total_amount,payment_status,registration_date,teacher_id,batch_id,` +
        // [akun-tagihan-real-v1] kolom billing buat tab Tagihan & Paket di preview
        `installment_paid,payment_due_date,payment_date,created_at,` +
        // [teacher-avatar-sync-v1] ikutkan avatar_url biar foto pengajar tampil di preview
        `pipeline_status,archived_at,teachers(name,whatsapp,avatar_url)` +
        `&order=registration_date.desc`
    )) || [];

  // Batch data buat kelas reguler
  const batchIds = regs.filter((r: any) => r.batch_id).map((r: any) => r.batch_id);
  let batchMap: Record<string, any> = {};
  if (batchIds.length > 0) {
    const batches = await rest(
      `regular_class_batches?id=in.(${batchIds.join(",")})` +
        `&select=id,batch_code,schedule_day,schedule_time,start_date,end_date,zoom_link,sessions_total`
    );
    (batches || []).forEach((b: any) => { batchMap[b.id] = b; });
  }
  const registrations = regs.map((r: any) => ({
    ...r,
    batch: r.batch_id ? batchMap[r.batch_id] || null : null,
  }));

  // Jadwal mendatang
  const regIds = registrations.map((r: any) => r.id);
  let upcomingSchedules: any[] = [];
  if (regIds.length > 0) {
    upcomingSchedules =
      (await rest(
        `schedules?registration_id=in.(${regIds.join(",")})` +
          `&status=in.(scheduled,pending)&scheduled_at=gt.${encodeURIComponent(new Date().toISOString())}` +
          `&select=id,registration_id,scheduled_at,duration_minutes,status&order=scheduled_at.asc`
      )) || [];
  }

  return NextResponse.json({ student: { ...student, registrations }, upcomingSchedules });
}
