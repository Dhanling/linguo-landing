// [life-dashboard-v1] Sumber angka dashboard /life.
// Selalu dihitung ulang saat diminta (tanpa cache) — gunanya memang melihat
// posisi terkini, bukan foto lama.
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_LIFE, tokenBenar } from "../../lib/pin";
import { rakitRingkasan } from "../../lib/agregasi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store, private, max-age=0" };

export async function GET(req: NextRequest) {
  if (!tokenBenar(req.cookies.get(COOKIE_LIFE)?.value)) {
    return NextResponse.json({ ok: false, pesan: "Sesi habis." }, { status: 401, headers: NO_STORE });
  }
  try {
    const data = await rakitRingkasan();
    return NextResponse.json({ ok: true, data }, { headers: NO_STORE });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, pesan: e?.message || "Gagal merakit ringkasan." },
      { status: 500, headers: NO_STORE },
    );
  }
}
