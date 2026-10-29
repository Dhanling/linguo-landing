import { NextRequest, NextResponse } from "next/server";

// [funnel-naik-v2] Calon siswa yang sudah menyerahkan data diri di /daftar (menekan
// "Lanjut ke Konfirmasi") tapi belum membuat tagihan. Dicatat di funnel_drafts supaya
// cron job_funnel_draft_nudge (repo dashboard, sql/20261029_funnel_draft_nudge.sql)
// bisa menanyakan kabarnya lewat WA CS 2 jam kemudian. Tidak pernah memblokir wizard:
// tabel belum ada / gagal tulis = tetap 200, alur bayar jalan terus.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}));
    const name = str(b.name, 120);
    const email = str(b.email, 200).toLowerCase();
    const wa = str(b.wa, 20).replace(/\D/g, "");
    if (!name || !email.includes("@") || wa.length < 9) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const total = Number(b.total);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/funnel_drafts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name,
        email,
        wa,
        program: str(b.program, 60) || null,
        language: str(b.language, 60) || null,
        level: str(b.level, 30) || null,
        total_amount: Number.isFinite(total) && total > 0 ? Math.round(total) : null,
        path: str(b.path, 500) || null,
      }),
    });
    return NextResponse.json({ ok: res.ok });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
