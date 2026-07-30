import { NextRequest, NextResponse } from "next/server";
import { previewStudentId, serviceHeaders, serviceRest } from "@/lib/previewSession";

// ── preview-session-v1 ───────────────────────────────────────────────────
// Sisi server menu "Grup Kelas" untuk mode pratinjau POV siswa. Di mode ini
// tidak ada sesi login sama sekali, jadi RPC student_group_list() (yang
// bersandar pada email JWT) mustahil dipakai — datanya diambil service role,
// dibatasi ke SATU siswa oleh cookie pratinjau.
//
// Read-only sepenuhnya: tidak ada jalur kirim/reaksi di sini. Pratinjau ini
// alat lihat tampilan, bukan cara staf ikut bicara atas nama siswa.
//
// Dua bentuk:
//   GET ?student=<id>            → { identity, groups }
//   GET ?student=<id>&jid=<jid>  → { messages, media }

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const MSG_COLS =
  "id,direction,body,contact_name,participant,created_at,media_path,media_type,media_mime," +
  "deleted_at,edited_at,participant_jid,reaction,reaction_by";

/** Tanda tangan batch untuk lampiran — anon tak punya akses bucket wa-media. */
async function signMedia(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/wa-media`, {
      method: "POST",
      headers: serviceHeaders,
      body: JSON.stringify({ expiresIn: 3600, paths }),
      cache: "no-store",
    });
    if (!res.ok) return {};
    const rows = (await res.json()) as { path?: string; signedURL?: string }[];
    const out: Record<string, string> = {};
    for (const r of rows) {
      if (r.path && r.signedURL) out[r.path] = `${SUPABASE_URL}/storage/v1${r.signedURL}`;
    }
    return out;
  } catch {
    return {}; // lampiran gagal ditandatangani → bubble teksnya tetap tampil
  }
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

  const preview = (await serviceRest(`rpc/student_group_preview?p_student_id=${student}`)) as
    | { identity: unknown; groups: { jid: string }[] }
    | null;
  const groups = preview?.groups ?? [];

  const jid = req.nextUrl.searchParams.get("jid");
  if (!jid) {
    return NextResponse.json({ identity: preview?.identity ?? null, groups });
  }

  // Grup yang bukan kelasnya tak pernah dibuka, biar cookie pratinjau tak bisa
  // dipakai memancing transkrip grup lain.
  if (!groups.some((g) => g.jid === jid)) {
    return NextResponse.json({ error: "not your group" }, { status: 403 });
  }

  const rows =
    ((await serviceRest(
      `wa_messages?phone=eq.${encodeURIComponent(jid)}&select=${MSG_COLS}` +
        `&order=created_at.desc&limit=300`,
    )) as { media_path: string | null }[] | null) || [];

  const media = await signMedia(
    Array.from(new Set(rows.map((r) => r.media_path).filter((p): p is string => !!p))),
  );

  // Klien menampilkan kronologis; urutan descending cuma untuk "300 terbaru".
  return NextResponse.json({ messages: rows.slice().reverse(), media });
}
