// [sr-kuis-spaced-repetition-v1] Penjaga pintu route kuis harian.
//
// Tiga jenis pemanggil, tiga secret berbeda supaya satu bocor tidak membuka
// semuanya:
//   * Vercel Cron        → CRON_SECRET      (Authorization: Bearer …)
//   * linguo-wa-bot      → QUIZ_BOT_SECRET  (Authorization: Bearer …)
//   * siswa lewat link   → tanpa secret, yang jadi kunci adalah token sesi
//
// Route yang dipakai siswa (session/[token], submit) TIDAK lewat sini: token di
// URL yang berfungsi sebagai kredensial.

import { NextResponse } from "next/server";

function bearer(req: Request): string {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

// Perbandingan konstan-waktu — jangan pakai === untuk rahasia.
function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** `null` = lolos. Selain itu: respons 401 yang tinggal dikembalikan. */
export function guardCron(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET || "";
  if (!secret || !safeEqual(secret, bearer(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Endpoint yang dipanggil linguo-wa-bot. Cron juga diterima (buat uji manual). */
export function guardBot(req: Request): NextResponse | null {
  const token = bearer(req);
  const botSecret = process.env.QUIZ_BOT_SECRET || "";
  const cronSecret = process.env.CRON_SECRET || "";
  if (safeEqual(botSecret, token) || safeEqual(cronSecret, token)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
