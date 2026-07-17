// =============================================================================
// /api/validate-wl-promo
// Validasi kode langganan Watch & Learn untuk preview instan di modal. Satu kolom
// menerima promo statis (mis. HEMAT10) ATAU kode afiliator (→ 10%). Sumber tunggal
// = watchPromo.resolveWatchCode (sama dgn checkout), jadi diskon yang ditampilkan
// = diskon yang ditagih. Read-only.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { resolveWatchCode } from "@/lib/watchPromo";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  const plan = req.nextUrl.searchParams.get("plan") || "";
  const r = await resolveWatchCode(code, plan);
  // JANGAN bocorkan affiliateId ke client.
  const { affiliateId: _drop, ...safe } = r;
  void _drop;
  return NextResponse.json(safe, { status: r.ok ? 200 : 400 });
}
