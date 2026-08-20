import { NextRequest, NextResponse } from "next/server";
import { PREVIEW_COOKIE, PREVIEW_COOKIE_MAX_AGE, lookupPreviewCode, serviceRest } from "@/lib/previewSession";

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

/* [preview-reopen-v1] "Sekali pakai" dulu diartikan harfiah: tukar pertama
   membakar kodenya, tukar kedua ditolak — padahal tukar kedua nyaris selalu
   BROWSER YANG SAMA, bukan orang lain: tab yang gagal muat lalu di-reload,
   tombol Back, "Buka lagi"/"Salin tautan" di dialog, atau Safari yang membuka
   ulang tab pratinjau saat dipulihkan. Gejalanya: staf klik "Lihat sebagai
   Siswa" dan yang muncul "Kode ini sudah dipakai".

   Sekarang yang dijaga tetap sama — link yang tersalin ke chat orang lain tak
   membuka apa-apa — lewat dua pagar yang lebih tepat sasaran:
     1. browser yang cookie sesinya SUDAH memegang kode itu boleh menukar lagi
        (dia memang sudah punya sesinya; menolaknya tidak menutup apa pun);
     2. selebihnya masih boleh dalam GRACE_MS setelah pemakaian pertama, untuk
        kasus cookie-nya belum sempat nyangkut (tab gagal muat).
   Di luar itu kodenya mati, dan `expires_at` (30 menit, sliding) tetap batas
   atasnya. */
const GRACE_MS = 10 * 60 * 1000;

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
  const cookieCode = req.cookies.get(PREVIEW_COOKIE)?.value || null;
  const row = await lookupPreviewCode(code);
  if (!row) return fail("Kodenya sudah kedaluwarsa. Buka lagi dari menu avatar di dashboard admin.");

  if (row.used_at) {
    const sameBrowser = cookieCode === row.code;
    const sinceUsed = Date.now() - new Date(row.used_at).getTime();
    if (!sameBrowser && !(sinceUsed >= 0 && sinceUsed < GRACE_MS)) {
      return fail("Kode ini sudah dipakai. Terbitkan link pratinjau baru dari dashboard admin.");
    }
  } else {
    await serviceRest(`staff_preview_codes?code=eq.${encodeURIComponent(row.code)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ used_at: new Date().toISOString() }),
    });
  }

  const to = DEST[req.nextUrl.searchParams.get("to") || "akun"] || DEST.akun;
  const res = NextResponse.redirect(
    new URL(`${to}?preview=${encodeURIComponent(row.student_id)}`, req.nextUrl.origin),
  );
  res.cookies.set(PREVIEW_COOKIE, row.code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // [preview-idle-session-v1] cookie tak lagi ikut kedaluwarsa kodenya. Dulu
    // umurnya dipatok ke `expires_at` yang tetap (30 menit sejak diterbitkan),
    // jadi sesi staf mati di tengah penelusuran. Sekarang cookie sekadar
    // pembawa kode; yang menentukan sah/tidaknya tetap baris `staff_preview_codes`
    // yang diperpanjang tiap dipakai (lihat lookupPreviewCode).
    maxAge: PREVIEW_COOKIE_MAX_AGE,
  });
  return res;
}
