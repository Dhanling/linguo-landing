import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { previewStudentId } from "@/lib/previewSession";
import { muatAksesRekamanMap, ADDON_REG_COLUMNS } from "@/lib/addonAccess";

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

async function rpc(fn: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST", headers: H, body: JSON.stringify(body), cache: "no-store",
  });
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

  // [akun-student-kembar-v2] Satu email bisa punya >1 baris `students` (pindah kelas,
  // tagihan manual, dan insert balapan melahirkan kembaran). Kelasnya tersebar di
  // kembaran itu — Shafa: French A1.2 di satu baris, Arabic A1.2 di baris lain;
  // Anisa: pratinjau dibuka di kembaran kosong padahal Private Jerman ada di baris
  // lama. Registrasi semua kembaran ikut ditarik, sama dengan klien /akun.
  const emailKembar = String(student.email || "").trim();
  let idSiswa: string[] = [id];
  if (/^[^\s,()"'\\%*]+@[^\s,()"'\\%*]+$/.test(emailKembar)) {
    const kembar = await rest(`students?email=ilike.${encodeURIComponent(emailKembar)}&select=id`);
    const ids = (Array.isArray(kembar) ? kembar : []).map((s: any) => s.id).filter(Boolean);
    idSiswa = Array.from(new Set([id, ...ids]));
  }
  const inSiswa = `in.(${idSiswa.join(",")})`;

  const regs =
    (await rest(
      `registrations?student_id=${inSiswa}` +
        `&select=id,product,language,level,status,sessions_total,sessions_used,` +
        `duration,total_amount,payment_status,registration_date,teacher_id,batch_id,test_prep_batch_id,` +
        // [akun-tagihan-real-v1] kolom billing buat tab Tagihan & Paket di preview
        `installment_paid,payment_due_date,payment_date,created_at,` +
        // [teacher-avatar-sync-v1] ikutkan avatar_url biar foto pengajar tampil di preview
        `pipeline_status,archived_at,${ADDON_REG_COLUMNS},teachers(name,whatsapp,avatar_url)` +
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
  // [siswa-pengajar-batch-v1] Pengajar kelas grup (Reguler/ETP) menempel di batch —
  // RPC yang sama dengan klien siswa, supaya gerbang "batch sudah jalan" tak punya
  // dua salinan. Gagal = kartu tampil tanpa nama pengajar, bukan error.
  const batchTeacherMap: Record<string, any> = {};
  await Promise.all(idSiswa.map(async (sid) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/my_batch_teachers`, {
        method: "POST", headers: H, cache: "no-store", body: JSON.stringify({ p_student_id: sid }),
      });
      const rows = res.ok ? await res.json() : [];
      (Array.isArray(rows) ? rows : []).forEach((t: any) => {
        if (t?.registration_id && t?.teacher_id) {
          batchTeacherMap[t.registration_id] = { id: t.teacher_id, name: t.name, title: t.title, avatar_url: t.avatar_url };
        }
      });
    } catch {}
  }));

  const registrations = regs.map((r: any) => ({
    ...r,
    batch: r.batch_id ? batchMap[r.batch_id] || null : null,
    testPrepBatch: r.test_prep_batch_id ? tpBatchMap[r.test_prep_batch_id] || null : null,
    batch_teacher: batchTeacherMap[r.id] || null,
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
          `session_title,material_notes,material_links,attendance_status,recording_url,notes` +
          `&order=scheduled_at.asc`
      )) || [];
  }

  // [sertifikat-rapor-2hal-v1] Rapor terbit per registrasi — halaman 2 sertifikat.
  // Klien siswa membacanya lewat RLS; POV staf tak punya sesi, jadi ikut dikirim di sini.
  if (regIds.length > 0) {
    const reps =
      (await rest(
        `class_reports?registration_id=in.(${regIds.join(",")})&published_at=not.is.null` +
          `&select=id,registration_id,report_type,skills,attendance,teacher_comment,recommendation,published_at`
      )) || [];
    registrations.forEach((r: any) => { r.class_reports = reps.filter((x: any) => x.registration_id === r.id); });
  }

  // [kuis-kelas-pov-v1] Kuis live tersimpan (live_quiz_log) — RLS cuma untuk siswa
  // yang login, jadi POV staf dulu tak pernah melihat bagian "Kuis di Kelas".
  if (regIds.length > 0) {
    const kuis =
      (await rest(
        `live_quiz_log?registration_id=in.(${regIds.join(",")})` +
          `&select=id,registration_id,schedule_id,session_number,language,question,options,correct,naskah,arti,explanation,votes,created_at` +
          `&order=created_at.asc`
      )) || [];
    registrations.forEach((r: any) => { r.kuis_kelas = kuis.filter((x: any) => x.registration_id === r.id); });
  }

  // [rekaman-pov-akses-v1] Hak tonton rekaman per registrasi. Klien siswa membacanya
  // lewat RLS `registration_addons` (butuh email sesi); POV staf tanpa login cuma
  // dapat baris kosong → peta "belum-didata"/"memuat" → tombol "Tonton rekaman"
  // tak pernah muncul di pratinjau, padahal siswanya beli Recording (Davin, Spanish
  // A2.2, 19 Okt 2026). Dihitung di sini dengan helper yang sama.
  if (regIds.length > 0) {
    try {
      const admin = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
      const akses = await muatAksesRekamanMap(admin, registrations);
      registrations.forEach((r: any) => { r.akses_rekaman = akses.get(r.id) ?? "memuat"; });
    } catch { /* tanpa peta → klien tetap "memuat" */ }
  }

  // `upcomingSchedules` tetap dikirim buat klien versi lama yang belum tahu `schedules`.
  const now = Date.now();
  const upcomingSchedules = schedules.filter(
    (s: any) => (s.status === "scheduled" || s.status === "pending") && new Date(s.scheduled_at).getTime() > now
  );

  // [saldo-beranda-v1] Saldo Linguo — RLS saldo butuh sesi siswa, jadi pratinjau
  // (tanpa login) menghitungnya di sini.
  const saldoRows = (await rest(
    `student_wallet_entries?student_id=${inSiswa}&status=eq.success&select=amount`
  )) || [];
  const saldo_linguo = saldoRows.reduce((a: number, r: any) => a + (Number(r.amount) || 0), 0);

  // [beranda-produk-digital-v1] E-book / e-learning milik siswa — di klien query-nya
  // bergantung sesi (auth_user_id / email sesi), yang tak ada di POV staf. Cocokkan
  // lewat student_id, registrasi yang dilahirkan pembelian, ATAU email siswa (banyak
  // baris lama ber-auth_user_id & student_id NULL — kasus Abdul Aziz 16 Okt 2026).
  // Kolom select WAJIB sama dengan query klien di akun/page.tsx.
  let digitalPurchases: any[] = [];
  try {
    const email = String(student.email || "").trim();
    const emailAman = /^[^\s,()"'\\%*]+@[^\s,()"'\\%*]+$/.test(email) ? email : "";
    const syarat = [`student_id.${inSiswa}`];
    if (regIds.length > 0) syarat.push(`registration_id.in.(${regIds.join(",")})`);
    if (emailAman) syarat.push(`buyer_email.ilike.${emailAman}`);
    digitalPurchases =
      (await rest(
        `digital_purchases?payment_status=eq.Lunas&or=(${syarat.join(",")})` +
          `&select=id,registration_id,digital_products(id,type,title,language,cover_url,file_url,video_playlist_url)` +
          `&order=created_at.desc`
      )) || [];
  } catch { digitalPurchases = []; }

  // [kelas-b2b-pratinjau-v1] Kelas B2B dicocokkan lewat email peserta korporat — di klien
  // RPC-nya memakai email sesi, yang tak ada di POV staf. Fungsi *_by_email khusus service_role.
  let corporateClasses: any[] = [];
  let corporateSessions: any[] = [];
  const emailSiswa = String(student.email || "").trim();
  if (emailSiswa) {
    const [k, s] = await Promise.all([
      rpc("corporate_classes_by_email", { p_email: emailSiswa }),
      rpc("corporate_class_sessions_by_email", { p_email: emailSiswa }),
    ]);
    corporateClasses = Array.isArray(k) ? k : [];
    corporateSessions = Array.isArray(s) ? s : [];
  }

  return NextResponse.json({ student: { ...student, registrations, saldo_linguo }, schedules, upcomingSchedules, digitalPurchases, corporateClasses, corporateSessions });
}
