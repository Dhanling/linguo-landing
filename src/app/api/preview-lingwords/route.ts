import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { previewStudentId, serviceRest } from "@/lib/previewSession";

// ── [lingwords-pratinjau-v1] Lingwords untuk mode pratinjau POV siswa ─────────
// Pratinjau tidak punya sesi login, sedangkan student_words / student_word_activity
// dikunci RLS ke auth.uid() pemiliknya dan Lingnote ke current_student_id() → dari
// klien halaman Lingwords selalu "masih kosong" walau siswanya punya kata.
// Diambil service role di sini, dikunci ke SATU siswa oleh cookie pratinjau, dan
// hanya-baca (tak ada route tulis). Polanya sama dengan /api/preview-notes.
//
// student_words dikunci per akun login (auth.users), bukan per baris students —
// dicocokkan lewat email siswa, sama dengan RPC teacher_lingwords_siswa.

export const dynamic = "force-dynamic";
export const maxDuration = 20;

const EMAIL_AMAN = /^[^\s,()"'\\%*]+@[^\s,()"'\\%*]+$/;

async function akunDariEmail(email: string): Promise<string[]> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return [];
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const cari = email.toLowerCase();
  const ids: string[] = [];
  // Admin API tak punya saring email yang pasti → telusuri per halaman (jumlah akun
  // masih ribuan, cukup beberapa halaman), berhenti di halaman terakhir.
  for (let page = 1; page <= 30; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data) break;
    data.users.forEach((u) => { if ((u.email || "").toLowerCase() === cari) ids.push(u.id); });
    if (data.users.length < 1000) break;
  }
  return ids;
}

export async function GET(req: NextRequest) {
  const student = req.nextUrl.searchParams.get("student");
  if (!student || !/^[0-9a-f-]{36}$/i.test(student)) {
    return NextResponse.json({ error: "invalid student" }, { status: 400 });
  }
  const allowed = await previewStudentId(req);
  if (!allowed || allowed !== student) {
    return NextResponse.json({ error: "preview session required" }, { status: 403 });
  }

  const row = ((await serviceRest(`students?id=eq.${student}&select=id,email`)) || [])[0];
  const email = String(row?.email || "").trim();
  // Satu email bisa punya beberapa baris students (lihat akun-student-kembar).
  let idSiswa = [student];
  if (EMAIL_AMAN.test(email)) {
    const kembar = (await serviceRest(`students?email=ilike.${encodeURIComponent(email)}&select=id`)) || [];
    idSiswa = Array.from(new Set([student, ...kembar.map((s: { id: string }) => s.id)]));
  }
  const inSiswa = `in.(${idSiswa.join(",")})`;

  const [regs, notes, users] = await Promise.all([
    serviceRest(`registrations?student_id=${inSiswa}&archived_at=is.null&select=language,level,pipeline_status`),
    serviceRest(`student_notes?student_id=${inSiswa}&archived_at=is.null&tags=cs.{dari-pengajar}&select=content,tags,created_at&order=created_at.asc&limit=1000`),
    EMAIL_AMAN.test(email) ? akunDariEmail(email) : Promise.resolve([] as string[]),
  ]);

  // Kata server berhalaman (plafon 1.000 baris PostgREST).
  const words: unknown[] = [];
  let activity: unknown[] = [];
  if (users.length) {
    const inUser = `in.(${users.join(",")})`;
    for (let from = 0; from < 20_000; from += 1000) {
      const page = (await serviceRest(
        `student_words?user_id=${inUser}&select=lang,word,word_key,meaning,translit,source,stage,first_seen,mastered_at,last_active&order=first_seen.asc`,
        { headers: { Range: `${from}-${from + 999}` } }
      )) || [];
      words.push(...page);
      if (page.length < 1000) break;
    }
    const since = new Date(Date.now() - 140 * 86_400_000).toISOString().slice(0, 10);
    activity = (await serviceRest(`student_word_activity?user_id=${inUser}&day=gte.${since}&select=day,lang,n`)) || [];
  }

  // Tema kata yang sudah diketahui (cache bersama) — pratinjau tak memanggil AI.
  const themes: Record<string, string> = {};
  const byLang = new Map<string, string[]>();
  (words as { lang: string; word_key: string }[]).forEach((w) => byLang.set(w.lang, (byLang.get(w.lang) || []).concat(w.word_key)));
  for (const [lang, keys] of byLang) {
    for (let i = 0; i < keys.length; i += 150) {
      const q = keys.slice(i, i + 150).map((k) => `"${k.replace(/"/g, '\\"')}"`).join(",");
      const rows = (await serviceRest(`word_themes?lang=eq.${encodeURIComponent(lang)}&word_key=in.(${encodeURIComponent(q)})&select=word_key,theme`)) || [];
      rows.forEach((r: { word_key: string; theme: string }) => (themes[`${lang}::${r.word_key}`] = r.theme));
    }
  }

  return NextResponse.json({
    regs: (regs || []).filter((r: { pipeline_status?: string }) => r.pipeline_status !== "Batal"),
    notes: notes || [],
    words,
    activity,
    themes,
    akun: users.length > 0,
  });
}
