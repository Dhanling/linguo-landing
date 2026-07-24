// [kelas-video-rekaman-siswa-v1] Rekaman kelas untuk SISWA.
//
// Masalah yang diselesaikan: dashboard menulis `schedules.recording_url` sebagai
// deep link ke Riwayat Kelas — halaman khusus tim. Siswa yang mengklik "Tonton
// Recording" di /akun cuma mentok di layar login dashboard, jadi praktis tidak
// ada satu pun rekaman yang bisa mereka tonton.
//
// Rekaman disimpan di bucket PRIVAT `class-recordings` (berisi wajah siswa,
// banyak anak-anak) — tidak boleh dibuka siapa pun yang kebetulan pegang URL.
// Route ini:
//   1. memverifikasi sesi Supabase si pemanggil,
//   2. memastikan roomId itu memang jadwal MILIK siswa tersebut,
//   3. baru membuat signed URL berumur pendek.
//
// Rekaman lama masih ada di bucket publik `class-materials` — tetap dibaca
// supaya tidak hilang dari riwayat siswa.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BUCKET = "class-recordings"; // privat — tujuan rekaman baru
const LEGACY_BUCKET = "class-materials"; // publik — rekaman lama (read-only)
const PREFIX = "video-recordings";
const SIGNED_TTL_SEC = 60 * 60; // 1 jam, cukup untuk menonton satu sesi
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RecordingItem {
  key: string;
  url: string;
  recordedAt: string;
  sizeBytes: number;
}

export async function POST(req: NextRequest) {
  try {
    const { roomId, accessToken } = await req.json();
    if (!roomId || !accessToken) {
      return NextResponse.json({ error: "roomId dan accessToken wajib diisi" }, { status: 400 });
    }

    // ── 1. Siapa yang meminta? ───────────────────────────────────────────────
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

    // ── 2. Rekaman ini memang milik dia? ─────────────────────────────────────
    // Room id kelas terjadwal deterministik: `sched-<schedule.id>`. Room instan
    // (tanpa jadwal) tidak bisa dipetakan ke siswa mana pun → tolak.
    const scheduleId = String(roomId).startsWith("sched-") ? String(roomId).slice(6) : null;
    if (!scheduleId || !UUID_RE.test(scheduleId)) {
      return NextResponse.json({ error: "Rekaman ini tidak terhubung ke jadwal kelas" }, { status: 403 });
    }

    const { data: sched } = await admin
      .from("schedules")
      .select("id, scheduled_at, student_id, registration_id")
      .eq("id", scheduleId)
      .maybeSingle();
    if (!sched) {
      return NextResponse.json({ error: "Sesi kelas tidak ditemukan" }, { status: 404 });
    }

    // Semua baris `students` dengan email ini — satu orang kadang punya lebih
    // dari satu baris (registrasi lama dibuat manual admin, lihat /akun).
    const { data: students } = await admin
      .from("students")
      .select("id")
      .ilike("email", user.email);
    const ownedIds = new Set((students ?? []).map((s: { id: string }) => s.id));
    if (!ownedIds.size) {
      return NextResponse.json({ error: "Akun ini belum terhubung ke data siswa" }, { status: 403 });
    }

    let owns = !!sched.student_id && ownedIds.has(sched.student_id);
    // Jadwal lama kadang hanya punya registration_id — telusuri lewat registrasi.
    if (!owns && sched.registration_id) {
      const { data: reg } = await admin
        .from("registrations")
        .select("student_id")
        .eq("id", sched.registration_id)
        .maybeSingle();
      owns = !!reg?.student_id && ownedIds.has(reg.student_id);
    }
    if (!owns) {
      return NextResponse.json({ error: "Rekaman ini bukan milik akun kamu" }, { status: 403 });
    }

    // ── 3. Ambil filenya ─────────────────────────────────────────────────────
    const items: RecordingItem[] = [];
    const folder = `${PREFIX}/${roomId}`;

    const { data: privateFiles } = await admin.storage.from(BUCKET).list(folder, {
      limit: 100,
      sortBy: { column: "name", order: "desc" },
    });
    for (const f of privateFiles ?? []) {
      if (!/\.(mp4|webm)$/i.test(f.name)) continue;
      const key = `${folder}/${f.name}`;
      const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(key, SIGNED_TTL_SEC);
      if (!signed?.signedUrl) continue;
      items.push({
        key,
        url: signed.signedUrl,
        recordedAt: stampOf(f.name, sched.scheduled_at),
        sizeBytes: Number((f.metadata as { size?: number } | null)?.size ?? 0),
      });
    }

    // Rekaman lama di bucket publik — hanya kalau bucket privat kosong.
    if (!items.length) {
      const { data: legacyFiles } = await admin.storage.from(LEGACY_BUCKET).list(folder, {
        limit: 100,
        sortBy: { column: "name", order: "desc" },
      });
      for (const f of legacyFiles ?? []) {
        if (!/\.(mp4|webm)$/i.test(f.name)) continue;
        const key = `${folder}/${f.name}`;
        items.push({
          key,
          url: admin.storage.from(LEGACY_BUCKET).getPublicUrl(key).data.publicUrl,
          recordedAt: stampOf(f.name, sched.scheduled_at),
          sizeBytes: Number((f.metadata as { size?: number } | null)?.size ?? 0),
        });
      }
    }

    items.sort((a, b) => +new Date(b.recordedAt) - +new Date(a.recordedAt));
    return NextResponse.json({ recordings: items, scheduledAt: sched.scheduled_at });
  } catch (e) {
    console.error("[class-recording] error", e);
    return NextResponse.json({ error: "Gagal memuat rekaman" }, { status: 500 });
  }
}

/** Nama file rekaman = epoch ms (`1721800000000.mp4`). Jadwal jadi cadangan
 *  kalau penamaannya berbeda (mis. file yang pernah dipindah manual). */
function stampOf(fileName: string, fallbackIso: string): string {
  const ms = Number(fileName.replace(/\.(mp4|webm)$/i, ""));
  return Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : fallbackIso;
}
