import { NextRequest, NextResponse } from "next/server";
import { previewStudentId } from "@/lib/previewSession";

// ── preview-student-v1 ───────────────────────────────────────────────────
// Endpoint READ-ONLY buat "POV siswa". Dashboard /akun dibuka via
// /akun?preview=<student_id>. Karena RLS memblok anon baca registrations, data
// real di-fetch di server pakai SERVICE_ROLE_KEY.
//
// [preview-session-v1] Dulu penjaganya cuma "UUID susah ditebak" — padahal yang
// dikembalikan nama, email, WhatsApp, dan riwayat tagihan siswa. Sekarang wajib
// ada cookie sesi pratinjau yang lahir dari kode sekali-pakai terbitan
// owner/admin (/api/preview-start), dan cookie itu mengunci SATU siswa: id di
// query harus sama dengan yang tercatat di kodenya.

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
  const allowed = await previewStudentId(req);
  if (!allowed || allowed !== id) {
    return NextResponse.json({ error: "preview session required" }, { status: 403 });
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
        `duration,total_amount,payment_status,registration_date,teacher_id,batch_id,test_prep_batch_id,` +
        // [akun-tagihan-real-v1] kolom billing buat tab Tagihan & Paket di preview
        `installment_paid,payment_due_date,payment_date,created_at,` +
        // [teacher-avatar-sync-v1] ikutkan avatar_url biar foto pengajar tampil di preview
        `pipeline_status,archived_at,teachers(name,whatsapp,avatar_url)` +
        `&order=registration_date.desc`
    )) || [];

  // Batch kelas grup — Reguler & English Test Preparation.
  // [jadwal-batch-kalender-v1] tabelnya `regular_batches` (yang lama, `regular_class_batches`,
  // tidak pernah ada di DB) dan `test_prep_batches`. Kolomnya WAJIB sama dengan query klien
  // di akun/page.tsx, kalau tidak kalender POV pratinjau beda isi dengan yang siswa lihat.
  const batchIds = regs.filter((r: any) => r.batch_id).map((r: any) => r.batch_id);
  const tpBatchIds = regs.filter((r: any) => r.test_prep_batch_id).map((r: any) => r.test_prep_batch_id);
  const batchMap: Record<string, any> = {};
  const tpBatchMap: Record<string, any> = {};
  if (batchIds.length > 0) {
    const batches = await rest(
      `regular_batches?id=in.(${batchIds.join(",")})` +
        `&select=id,batch_code,language,level,session_day,session_start_time,session_duration_min,start_date,end_date,total_sessions,status,zoom_link`
    );
    (batches || []).forEach((b: any) => { batchMap[b.id] = b; });
  }
  if (tpBatchIds.length > 0) {
    const batches = await rest(
      `test_prep_batches?id=in.(${tpBatchIds.join(",")})` +
        `&select=id,name,test_type,level,schedule_days,schedule_time,duration_minutes,start_date,end_date,sessions_total,cancelled_at`
    );
    (batches || []).forEach((b: any) => { tpBatchMap[b.id] = b; });
  }
  const registrations = regs.map((r: any) => ({
    ...r,
    batch: r.batch_id ? batchMap[r.batch_id] || null : null,
    testPrepBatch: r.test_prep_batch_id ? tpBatchMap[r.test_prep_batch_id] || null : null,
  }));

  // Jadwal — jadwal-riwayat-v1: riwayat + sesi mendatang (dulu cuma mendatang,
  // jadi kalender di POV pratinjau selalu tampak kosong). Kolom & saringannya
  // WAJIB sama dengan query klien di akun/page.tsx.
  // [materi-sesi-semua-kelas-v1] batas riwayat 12 bulan dicabut — linimasa sesi
  // berlaku buat semua kelas termasuk level terdahulu.
  const regIds = registrations.map((r: any) => r.id);
  let schedules: any[] = [];
  if (regIds.length > 0) {
    schedules =
      (await rest(
        `schedules?registration_id=in.(${regIds.join(",")})` +
          `&select=id,registration_id,scheduled_at,duration_minutes,status,session_number,` +
          `session_title,material_notes,material_links,attendance_status,recording_url` +
          `&order=scheduled_at.asc`
      )) || [];
  }

  // `upcomingSchedules` tetap dikirim buat klien versi lama yang belum tahu `schedules`.
  const now = Date.now();
  const upcomingSchedules = schedules.filter(
    (s: any) => (s.status === "scheduled" || s.status === "pending") && new Date(s.scheduled_at).getTime() > now
  );

  return NextResponse.json({ student: { ...student, registrations }, schedules, upcomingSchedules });
}
