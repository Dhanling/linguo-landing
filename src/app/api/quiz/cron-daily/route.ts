// ============================================================================
// API: /api/quiz/cron-daily
// [sr-kuis-spaced-repetition-v1] Bikin sesi kuis harian untuk SEMUA siswa aktif.
// ----------------------------------------------------------------------------
// Dipanggil Vercel Cron tiap pagi (lihat vercel.json). Hasilnya adalah daftar
// { student_id, name, phone, url, language_code } yang tinggal diambil
// linguo-wa-bot lewat /api/quiz/pending-dispatch — route ini SENGAJA tidak
// mengirim WhatsApp sendiri: pengirimannya milik bot, dan memisahkannya bikin
// cron bisa diulang tanpa risiko pesan dobel.
//
// Siswa dilewati (bukan gagal) kalau:
//   * bahasanya tidak terbaca dari nama kelas,
//   * bahasa itu belum punya konsep/bank soal,
//   * sesi sebelumnya masih pending / dikerjakan dan belum hangus.
//
// Auth: Authorization: Bearer <CRON_SECRET>
// ============================================================================

import { NextResponse } from "next/server";
import { quizAdmin } from "@/lib/quiz/db";
import { guardCron } from "@/lib/quiz/auth";
import { createQuizSession, findOpenSession, sessionUrl } from "@/lib/quiz/session";
import { toLangCode } from "@/lib/quiz/language";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Ratusan siswa × beberapa query per siswa — jangan sampai kepotong batas default.
export const maxDuration = 300;

interface Dispatch {
  student_id: string;
  name: string | null;
  phone: string | null;
  url: string;
  language_code: string;
  session_id: string;
  reused: boolean;
}

async function run(req: Request) {
  const denied = guardCron(req);
  if (denied) return denied;

  const admin = quizAdmin();
  const now = new Date();

  // Sumber "siswa aktif" = registrasi berstatus Aktif & belum diarsipkan.
  // Satu siswa bisa punya lebih dari satu registrasi (dua bahasa) — di sini
  // sengaja satu kuis per SISWA per hari, memakai registrasi terbaru, supaya
  // siswa dua kelas tidak menerima dua link tiap pagi.
  const { data: regs, error } = await admin
    .from("registrations")
    .select("student_id, language, registration_date, students!inner(id, name, whatsapp, is_archived)")
    .eq("status", "Aktif")
    .is("archived_at", null)
    .order("registration_date", { ascending: false });
  if (error) {
    return NextResponse.json({ error: `Gagal ambil siswa aktif: ${error.message}` }, { status: 500 });
  }

  type Row = {
    student_id: string | null;
    language: string | null;
    students: { id: string; name: string | null; whatsapp: string | null; is_archived: boolean | null }
      | { id: string; name: string | null; whatsapp: string | null; is_archived: boolean | null }[];
  };

  const seen = new Set<string>();
  const targets: { studentId: string; name: string | null; phone: string | null; lang: string }[] = [];
  const skipped: { student_id: string; reason: string }[] = [];

  for (const row of (regs ?? []) as Row[]) {
    const s = Array.isArray(row.students) ? row.students[0] : row.students;
    if (!row.student_id || !s || s.is_archived) continue;
    if (seen.has(row.student_id)) continue; // registrasi terbaru sudah diambil
    seen.add(row.student_id);

    const lang = toLangCode(row.language);
    if (!lang) {
      skipped.push({ student_id: row.student_id, reason: `bahasa tidak dikenali: ${row.language}` });
      continue;
    }
    targets.push({ studentId: row.student_id, name: s.name, phone: s.whatsapp, lang });
  }

  const dispatches: Dispatch[] = [];
  const failed: { student_id: string; error: string }[] = [];

  for (const t of targets) {
    try {
      const open = await findOpenSession(admin, t.studentId, now);
      if (open) {
        // Sesi kemarin belum dikerjakan → jangan bikin yang baru. Kalau belum
        // sempat terkirim, biarkan tetap masuk antrean dispatch.
        if (!open.dispatched_at) {
          dispatches.push({
            student_id: t.studentId,
            name: t.name,
            phone: t.phone,
            url: sessionUrl(open.token),
            language_code: open.language_code,
            session_id: open.id,
            reused: true,
          });
        } else {
          skipped.push({ student_id: t.studentId, reason: "sesi sebelumnya masih terbuka" });
        }
        continue;
      }

      const built = await createQuizSession(admin, t.studentId, t.lang, now);
      dispatches.push({
        student_id: t.studentId,
        name: t.name,
        phone: t.phone,
        url: built.url,
        language_code: t.lang,
        session_id: built.session.id,
        reused: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Bahasa yang belum punya bank soal adalah keadaan NORMAL selama katalog
      // konsep belum lengkap — catat sebagai dilewati, bukan sebagai kegagalan.
      if (/Belum ada konsep aktif|Tidak ada materi jatuh tempo|Bank soal kosong/.test(msg)) {
        skipped.push({ student_id: t.studentId, reason: msg });
      } else {
        failed.push({ student_id: t.studentId, error: msg });
        console.error("[kuis] cron gagal untuk siswa", t.studentId, msg);
      }
    }
  }

  // Sekalian bersih-bersih: sesi yang lewat 48 jam ditandai hangus supaya tidak
  // terus muncul sebagai "masih terbuka" dan memblokir kuis besok.
  await admin
    .from("sr_quiz_sessions")
    .update({ status: "expired" })
    .in("status", ["pending", "in_progress"])
    .lt("expires_at", now.toISOString());

  // Rekap alasan, bukan daftar mentah: yang perlu dilihat dari log cron adalah
  // "berapa siswa terlewat karena katalog konsepnya belum dibuat" — itu antrean
  // kerja tim kurikulum, bukan bug.
  const byReason: Record<string, number> = {};
  for (const s of skipped) {
    const key = s.reason.startsWith("bahasa tidak dikenali")
      ? "bahasa tidak dikenali"
      : s.reason.replace(/"[^"]*"/, "…");
    byReason[key] = (byReason[key] ?? 0) + 1;
  }

  return NextResponse.json({
    ok: true,
    created: dispatches.filter((d) => !d.reused).length,
    reused: dispatches.filter((d) => d.reused).length,
    skipped: skipped.length,
    failed: failed.length,
    dispatches,
    skipped_by_reason: byReason,
    // Ringkas saja — cron log tidak perlu ratusan baris alasan.
    skipped_sample: skipped.slice(0, 20),
    failed_sample: failed.slice(0, 20),
  });
}

// Vercel Cron memanggil dengan GET; POST disediakan untuk pemicu manual.
export const GET = run;
export const POST = run;
