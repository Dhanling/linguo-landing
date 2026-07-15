// =============================================================================
// /api/validate-wl-promo
// Validasi kode promo langganan Watch & Learn untuk preview instan di modal.
// Sumber tunggal = watchPromo.evaluatePromo (sama dgn yang dipakai checkout), jadi
// diskon yang ditampilkan = diskon yang ditagih. Endpoint ini read-only.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { evaluatePromo } from "@/lib/watchPromo";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  const plan = req.nextUrl.searchParams.get("plan") || "";
  const result = evaluatePromo(code, plan);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
