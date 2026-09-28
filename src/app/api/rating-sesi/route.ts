// [rating-sesi-akun-v1] Pengingat rating sesi di /akun siswa.
//
// Rating sesi utama diisi di layar "Kelas selesai" Kelas Video
// ([rating-sesi-live-v1], repo admin-dashboard). Siswa yang menutup tab tanpa
// menekan Keluar tak pernah melihat form itu — route ini menyodorkannya lagi
// di /akun untuk sesi 7 hari terakhir yang sudah berlangsung tapi belum dinilai.
//
//   { accessToken, aksi: "daftar" }                     → { sesi: [...] } (maks 3)
//   { accessToken, aksi: "kirim", scheduleId, nilai... } → { ok: true }
//
// Token si pemanggil diverifikasi dulu, lalu semua baca/tulis memakai service
// role HANYA untuk sesi milik baris `students` ber-email sama — kelas & pengajar
// diturunkan dari jadwal di database, bukan dari klien.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const HARI = 86_400_000;
const JENDELA_HARI = 7;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = ReturnType<typeof createClient<any>>;

async function siswaDariToken(accessToken: string) {
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user?.email) return null;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Satu email bisa punya >1 baris students (lihat [akun-student-kembar-v1]).
  const { data: students } = await admin.from("students").select("id").eq("email", user.email);
  const studentIds = ((students ?? []) as { id: string }[]).map((s) => s.id);
  return { admin, studentIds };
}

/** Sesi yang sudah berlangsung (hadir / selesai tanpa catatan absen) dalam 7 hari terakhir. */
async function sesiTertunda(admin: Admin, studentIds: string[]) {
  const { data: regs } = await admin
    .from("registrations")
    .select("id, student_id, language, level, teacher_id")
    .in("student_id", studentIds);
  const regList = (regs ?? []) as { id: string; student_id: string; language: string | null; level: string | null; teacher_id: string | null }[];
  if (!regList.length) return [];

  const dari = new Date(Date.now() - JENDELA_HARI * HARI).toISOString();
  const { data: jadwal } = await admin
    .from("schedules")
    .select("id, registration_id, teacher_id, scheduled_at, duration_minutes, status, attendance_status, session_number")
    .in("registration_id", regList.map((r) => r.id))
    .gte("scheduled_at", dari)
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: false });
  const berlangsung = ((jadwal ?? []) as {
    id: string; registration_id: string; teacher_id: string | null; scheduled_at: string;
    duration_minutes: number | null; status: string | null; attendance_status: string | null; session_number: number | null;
  }[]).filter((s) => {
    const selesai = new Date(s.scheduled_at).getTime() + (s.duration_minutes || 60) * 60_000 <= Date.now();
    const hadir = s.attendance_status === "hadir" || (s.status === "completed" && !s.attendance_status);
    return selesai && hadir;
  });
  if (!berlangsung.length) return [];

  const { data: sudah } = await admin
    .from("session_ratings")
    .select("schedule_id")
    .in("schedule_id", berlangsung.map((s) => s.id))
    .in("student_id", studentIds);
  const sudahSet = new Set(((sudah ?? []) as { schedule_id: string }[]).map((r) => r.schedule_id));
  const belum = berlangsung.filter((s) => !sudahSet.has(s.id)).slice(0, 3);
  if (!belum.length) return [];

  const regById = new Map(regList.map((r) => [r.id, r]));
  const teacherIds = Array.from(new Set(belum.map((s) => s.teacher_id || regById.get(s.registration_id)?.teacher_id).filter(Boolean))) as string[];
  const { data: guru } = teacherIds.length
    ? await admin.from("teachers").select("id, name").in("id", teacherIds)
    : { data: [] };
  const namaGuru = new Map(((guru ?? []) as { id: string; name: string | null }[]).map((t) => [t.id, t.name]));

  return belum.map((s) => {
    const r = regById.get(s.registration_id);
    const tid = s.teacher_id || r?.teacher_id || null;
    return {
      scheduleId: s.id,
      waktu: s.scheduled_at,
      sesi: s.session_number,
      kelas: [r?.language, r?.level].filter(Boolean).join(" · "),
      pengajar: tid ? namaGuru.get(tid) || null : null,
    };
  });
}

const bintangSah = (n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.accessToken) return NextResponse.json({ error: "Perlu masuk dulu" }, { status: 401 });
    const ctx = await siswaDariToken(body.accessToken);
    if (!ctx) return NextResponse.json({ error: "Sesi tidak valid atau sudah habis" }, { status: 401 });
    const { admin, studentIds } = ctx;
    if (!studentIds.length) return NextResponse.json({ sesi: [] });

    if (body.aksi === "daftar") {
      return NextResponse.json({ sesi: await sesiTertunda(admin, studentIds) });
    }

    if (body.aksi === "kirim") {
      const { scheduleId, keseluruhan, pengajar, materi, koneksi } = body;
      if (![keseluruhan, pengajar, materi, koneksi].every(bintangSah)) {
        return NextResponse.json({ error: "Semua bintang wajib diisi (1–5)" }, { status: 400 });
      }
      // Hanya sesi yang memang sedang menunggu penilaian dari siswa ini.
      const tertunda = await sesiTertunda(admin, studentIds);
      if (!tertunda.some((s) => s.scheduleId === scheduleId)) {
        return NextResponse.json({ error: "Sesi ini tidak bisa dinilai lagi" }, { status: 400 });
      }
      const { data: s } = await admin
        .from("schedules")
        .select("id, registration_id, teacher_id, session_number, registrations(student_id, teacher_id)")
        .eq("id", scheduleId)
        .single();
      const row = s as unknown as {
        id: string; registration_id: string; teacher_id: string | null; session_number: number | null;
        registrations: { student_id: string; teacher_id: string | null } | null;
      } | null;
      const studentId = row?.registrations?.student_id;
      if (!row || !studentId || !studentIds.includes(studentId)) {
        return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
      }
      const saran = typeof body.saran === "string" ? body.saran.trim().slice(0, 2000) : "";
      const { error } = await admin.from("session_ratings").upsert(
        {
          schedule_id: row.id,
          registration_id: row.registration_id,
          student_id: studentId,
          teacher_id: row.teacher_id || row.registrations?.teacher_id || null,
          session_number: row.session_number,
          rating: keseluruhan,
          rating_pengajar: pengajar,
          rating_materi: materi,
          rating_koneksi: koneksi,
          comment: saran || null,
          client_key: `akun:${studentId}`,
          room_id: "akun",
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "schedule_id,client_key" },
      );
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (e) {
    console.error("[rating-sesi]", e);
    return NextResponse.json({ error: "Gagal memproses penilaian" }, { status: 500 });
  }
}
