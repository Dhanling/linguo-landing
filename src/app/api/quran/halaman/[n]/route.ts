// [quran-reader-v1] Satu halaman mushaf (1–604) dalam bentuk padat untuk pembaca
// /alquran. Isinya tak pernah berubah → di-cache CDN setahun per URL, jadi
// Quran.com cukup diketuk sekali per halaman per region.
import { NextResponse } from "next/server";
import { ambilHalaman, JUMLAH_HALAMAN } from "@/lib/quran/sumber";

export const revalidate = 2592000;

export async function GET(_req: Request, ctx: { params: Promise<{ n: string }> }) {
  const n = Number((await ctx.params).n);
  if (!Number.isInteger(n) || n < 1 || n > JUMLAH_HALAMAN) {
    return NextResponse.json({ error: "halaman tidak valid" }, { status: 400 });
  }
  try {
    const data = await ambilHalaman(n);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ error: "gagal memuat halaman" }, { status: 502 });
  }
}
