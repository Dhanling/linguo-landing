import { NextRequest, NextResponse } from "next/server";
import { PREVIEW_COOKIE, lookupPreviewCode, serviceRest } from "@/lib/previewSession";

// ── preview-session-v1 ───────────────────────────────────────────────────
// Pintu masuk "lihat sebagai siswa" dari avatar dashboard admin.
// Dashboard menerbitkan kode lewat RPC staff_preview_issue() (owner/admin saja),
// lalu membuka tab ke sini. Di sini kodenya ditukar cookie httpOnly, kodenya
// ditandai terpakai (link tak bisa diteruskan ke orang lain), lalu pengunjung
// dilempar ke dashboard siswa dalam mode pratinjau.
//
// Kenapa lewat redirect + cookie, bukan token di URL: URL nyangkut di riwayat
// browser & log server, sedangkan cookie httpOnly ikut otomatis ke seluruh
// endpoint pratinjau tanpa perlu ditempel ulang tiap navigasi.

export const dynamic = "force-dynamic";

const DEST: Record<string, string> = {
  akun: "/akun",
  grup: "/akun/grup",
};

function fail(reason: string) {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Pratinjau tidak berlaku</title>` +
      `<body style="font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f8fafc;color:#0f172a">` +
      `<div style="text-align:center;padding:24px"><p style="font-weight:700;font-size:18px;margin:0">Link pratinjau tidak berlaku</p>` +
      `<p style="color:#64748b;font-size:14px;margin:6px 0 0">${reason}</p></div></body>`,
    { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const row = await lookupPreviewCode(code);
  if (!row) return fail("Kodenya sudah kedaluwarsa. Buka lagi dari menu avatar di dashboard admin.");
  if (row.used_at) return fail("Kode ini sudah dipakai. Terbitkan link pratinjau baru.");

  await serviceRest(`staff_preview_codes?code=eq.${encodeURIComponent(row.code)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ used_at: new Date().toISOString() }),
  });

  const to = DEST[req.nextUrl.searchParams.get("to") || "akun"] || DEST.akun;
  const res = NextResponse.redirect(
    new URL(`${to}?preview=${encodeURIComponent(row.student_id)}`, req.nextUrl.origin),
  );
  res.cookies.set(PREVIEW_COOKIE, row.code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(60, Math.floor((new Date(row.expires_at).getTime() - Date.now()) / 1000)),
  });
  return res;
}
