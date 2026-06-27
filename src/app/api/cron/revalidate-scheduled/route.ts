// ============================================================================
// API: /api/cron/revalidate-scheduled
// Ping revalidasi untuk post blog TERJADWAL (Vercel Cron).
// ----------------------------------------------------------------------------
// Scheduling blog pakai pola "time-gate": post terjadwal tetap status=published
// tapi published_at-nya di masa depan, dan query landing menyaring
// `published_at <= now`. Jadi post otomatis tayang saat waktunya tiba.
//
// Endpoint ini TIDAK menyentuh database sama sekali — cuma memanggil
// revalidatePath('/blog') + revalidatePath('/blog/sitemap.xml') secara berkala
// supaya post terjadwal tayang TEPAT WAKTU walau trafik sepi (tanpa ini, ISR
// nunggu ada pengunjung dulu baru rebuild). Stateless, idempoten, tanpa
// kredensial tulis → aman dijalankan sesering apa pun.
//
// SECURITY: Vercel ngirim `Authorization: Bearer ${CRON_SECRET}` saat manggil
// cron. Request tanpa header yang cocok ditolak 401.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath("/blog");
  revalidatePath("/blog/sitemap.xml");

  return NextResponse.json({
    revalidated: true,
    paths: ["/blog", "/blog/sitemap.xml"],
    timestamp: new Date().toISOString(),
  });
}
