// [rekaman-batch-siswa-v1] Daftar pertemuan batch (Reguler/ETP) yang sudah punya
// rekaman, untuk linimasa kelas di /akun. Siswa tak bisa membaca `class_recordings`
// ruang batch lewat RLS (schedule_id-nya NULL), jadi dibaca di sini pakai service role
// sesudah kepemilikan registrasinya dipastikan. Memutar rekamannya tetap lewat
// /api/class-recording (gerbang add-on Recording ada di sana).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { previewStudentId } from "@/lib/previewSession";
import { amanIlike } from "@/lib/amanIlike"; // [audit9-ilike-escape-v1]

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const { registrationId, accessToken } = await req.json();
    if (!registrationId || !UUID_RE.test(String(registrationId))) {
      return NextResponse.json({ error: "registrationId wajib diisi" }, { status: 400 });
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Siapa yang meminta — sesi siswa sendiri, atau POV pratinjau staf (sama dgn class-recording).
    const ownedIds = new Set<string>();
    if (accessToken) {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user?.email) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
      const { data: students } = await admin.from("students").select("id").ilike("email", amanIlike(user.email));
      (students ?? []).forEach((s: { id: string }) => ownedIds.add(s.id));
    } else {
      const previewId = await previewStudentId(req);
      if (!previewId) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
      ownedIds.add(previewId);
      const { data: stu } = await admin.from("students").select("email").eq("id", previewId).maybeSingle();
      if (stu?.email) {
        const { data: kembar } = await admin.from("students").select("id").ilike("email", amanIlike(stu.email));
        (kembar ?? []).forEach((s: { id: string }) => ownedIds.add(s.id));
      }
    }

    const { data: reg } = await admin
      .from("registrations")
      .select("id, student_id, batch_id, test_prep_batch_id")
      .eq("id", registrationId)
      .maybeSingle();
    if (!reg || !reg.student_id || !ownedIds.has(reg.student_id)) {
      return NextResponse.json({ error: "Kelas ini bukan milik akun kamu" }, { status: 403 });
    }
    const prefix = reg.batch_id
      ? `batch-reguler-${reg.batch_id}-`
      : reg.test_prep_batch_id
        ? `batch-etp-${reg.test_prep_batch_id}-`
        : null;
    if (!prefix) return NextResponse.json({ meetings: [] });

    const { data: recs, error } = await admin
      .from("class_recordings")
      .select("room_id, key, recorded_at, duration_sec, title")
      .like("room_id", `${prefix}%`)
      .is("deleted_at", null)
      .order("recorded_at", { ascending: true })
      .limit(200);
    if (error) return NextResponse.json({ error: "Gagal membaca rekaman" }, { status: 503 });

    // Satu pertemuan = satu ruang; rekaman pertama di ruang itu jadi waktunya.
    const perRuang = new Map<string, { roomId: string; meetingNo: number; recordedAt: string; durationSec: number; title: string | null }>();
    for (const r of (recs || []) as { room_id: string; recorded_at: string; duration_sec: number | null; title: string | null }[]) {
      const no = Number(r.room_id.slice(prefix.length));
      if (!Number.isFinite(no) || perRuang.has(r.room_id)) continue;
      perRuang.set(r.room_id, { roomId: r.room_id, meetingNo: no, recordedAt: r.recorded_at, durationSec: Number(r.duration_sec) || 0, title: r.title });
    }
    return NextResponse.json({ meetings: [...perRuang.values()].sort((a, b) => a.meetingNo - b.meetingNo) });
  } catch (e) {
    console.error("[batch-recordings] error", e);
    return NextResponse.json({ error: "Gagal memuat rekaman" }, { status: 500 });
  }
}
