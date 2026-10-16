// [jadwal-publik-v1] GET /api/jadwal-publik?bahasa=korea&durasi=60
// → { bahasa, durasi, slot: [epoch ms], adaPengajar, diperbarui }
// Publik (tanpa login), tanpa identitas pengajar. Di-cache CDN 5 menit: Availability
// jarang berubah, dan halaman ini bisa ramai kalau dipasang di iklan.

import { NextRequest, NextResponse } from "next/server";
import { langFromSlug } from "@/lib/funnelRouting";
import { DURASI_PUBLIK, jadwalPublik } from "@/lib/jadwalPublikServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const langEn = langFromSlug(String(q.get("bahasa") || ""));
  if (!langEn) return NextResponse.json({ error: "Bahasa tidak dikenal" }, { status: 404 });
  const d = Number(q.get("durasi"));
  const durasi = (DURASI_PUBLIK as readonly number[]).includes(d) ? d : 60;
  try {
    const hasil = await jadwalPublik(langEn, durasi);
    return NextResponse.json(hasil, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    console.error("[jadwal-publik] gagal:", e);
    return NextResponse.json({ error: "Gagal memuat jadwal" }, { status: 500 });
  }
}
