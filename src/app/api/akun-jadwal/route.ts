// [akun-jadwal-server-v1] Jadwal siswa untuk /akun, ditarik di server.
//
// Kasus nyata (26 Sep 2026, Davin — Spanish A1.3): kalender /akun "0 sesi
// mendatang", minggu 21–27 Sep kosong, padahal di `schedules` ada 7 sesi.
// Query langsung dari browser lewat RLS makan ±4 detik untuk 33 baris — tiap
// subquery `students` di policy memanggil `is_staff()` PER BARIS (845 baris
// ≈ 0,9 detik, dan itu terjadi 4×). /akun menembak dua query schedules
// sekaligus; begitu salah satu lewat `statement_timeout` 8 detik milik
// `authenticated`, errornya ditelan dan kalender tampil kosong.
//
// Route ini memverifikasi token si pemanggil, lalu membaca dengan service role
// hanya untuk registrasi yang memang milik baris `students` ber-email sama.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Kolom SAMA dengan query langsung di /akun (loadStudentData) — tab Kuis,
// linimasa sesi, dan kalender membaca baris yang sama.
const KOLOM =
  "id, registration_id, scheduled_at, duration_minutes, status, session_number, session_title, material_notes, material_links, attendance_status, recording_url, notes, quiz_score, quiz_max, quiz_source, quiz_submission_id, homework";

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();
    if (!accessToken) return NextResponse.json({ error: "Perlu masuk dulu" }, { status: 401 });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user?.email) {
      return NextResponse.json({ error: "Sesi tidak valid atau sudah habis" }, { status: 401 });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // Satu email bisa punya >1 baris students (lihat [akun-student-kembar-v1]).
    const { data: students, error: sErr } = await admin
      .from("students")
      .select("id")
      .eq("email", user.email);
    if (sErr) throw sErr;
    const studentIds = (students ?? []).map((s: { id: string }) => s.id);
    if (!studentIds.length) return NextResponse.json({ schedules: [] });

    const { data: regs, error: rErr } = await admin
      .from("registrations")
      .select("id")
      .in("student_id", studentIds);
    if (rErr) throw rErr;
    const regIds = (regs ?? []).map((r: { id: string }) => r.id);
    if (!regIds.length) return NextResponse.json({ schedules: [] });

    const { data: schedules, error: jErr } = await admin
      .from("schedules")
      .select(KOLOM)
      .in("registration_id", regIds)
      .order("scheduled_at", { ascending: true });
    if (jErr) throw jErr;

    return NextResponse.json({ schedules: schedules ?? [] });
  } catch (e) {
    console.error("[akun-jadwal]", e);
    return NextResponse.json({ error: "Gagal memuat jadwal" }, { status: 500 });
  }
}
