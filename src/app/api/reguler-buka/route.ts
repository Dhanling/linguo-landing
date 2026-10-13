// [reguler-buka-dari-batch-v1] Daftar bahasa Kelas Reguler yang sedang dibuka,
// untuk menyaring pilihan bahasa/program di wizard /akun, funnel /daftar, dan
// form di beranda. Gerbang yang mengikat tetap di rute bayar (regulerClosedRejection);
// rute ini cuma supaya pilihan yang tertutup tidak ditawarkan sejak awal.
import { NextResponse } from "next/server";
import { fetchOpenRegulerLangs } from "@/lib/regulerOpen";

export const dynamic = "force-dynamic";

export async function GET() {
  const langs = await fetchOpenRegulerLangs();
  return NextResponse.json(
    { langs },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  );
}
