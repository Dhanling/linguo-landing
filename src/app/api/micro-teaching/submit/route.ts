import { NextRequest, NextResponse } from "next/server";

// ── micro-teaching form: write-back link video (service-role) ──
// Validasi token + URL drive.google.com → set video_url + submitted_at + status='submitted'.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isDriveUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return (
      (u.protocol === "https:" || u.protocol === "http:") &&
      /(^|\.)drive\.google\.com$/i.test(u.hostname)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = (body?.token as string | undefined)?.trim();
    const videoUrl = (body?.videoUrl as string | undefined)?.trim();

    if (!token || !UUID_RE.test(token)) {
      return NextResponse.json({ error: "Token tidak valid." }, { status: 400 });
    }
    if (!videoUrl || !isDriveUrl(videoUrl)) {
      return NextResponse.json(
        { error: "Link harus berupa URL Google Drive (drive.google.com)." },
        { status: 400 }
      );
    }

    // Lookup applicant + status terkini. Decision: tidak bisa kirim ulang kalau
    // sudah dinilai (passed/failed). Selama sent/submitted → boleh ganti link.
    const lookup = await fetch(
      `${SUPABASE_URL}/rest/v1/teacher_applications` +
        `?microteaching_token=eq.${token}&select=id,microteaching_status&limit=1`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    if (!lookup.ok) {
      const err = await lookup.text();
      console.error("micro-teaching submit lookup error:", err);
      return NextResponse.json({ error: "Gagal memverifikasi token." }, { status: 500 });
    }
    const rows = await lookup.json();
    const a = Array.isArray(rows) ? rows[0] : null;
    if (!a) {
      return NextResponse.json({ error: "Pelamar tidak ditemukan." }, { status: 404 });
    }
    if (a.microteaching_status === "passed" || a.microteaching_status === "failed") {
      return NextResponse.json(
        { error: "Penilaian micro-teaching kamu sudah final, tidak bisa kirim ulang." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const patch = await fetch(
      `${SUPABASE_URL}/rest/v1/teacher_applications?id=eq.${a.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          microteaching_video_url: videoUrl,
          microteaching_submitted_at: now,
          microteaching_status: "submitted",
          updated_at: now,
        }),
      }
    );
    if (!patch.ok) {
      const err = await patch.text();
      console.error("micro-teaching submit patch error:", err);
      return NextResponse.json({ error: "Gagal menyimpan link." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("micro-teaching submit route error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
