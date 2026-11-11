// [elearning-promo-afiliator-v1] Cek kode afiliator untuk pratinjau harga promo
// E-Learning 6 bulan (Rp29.000) di etalase. Read-only; harga yang DITAGIH tetap
// dihitung ulang oleh /api/create-cart-invoice. Lihat lib/elearningPromoAfiliator.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  HARGA_PROMO_AFILIATOR_ELEARNING,
  PROMO_AFILIATOR_ELEARNING_SAMPAI,
  kodeAfiliatorSah,
  promoAfiliatorElearningAktif,
} from "@/lib/elearningPromoAfiliator";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  const aktif = promoAfiliatorElearningAktif();
  let sah = false;
  if (aktif && code) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    sah = await kodeAfiliatorSah(admin, code);
  }
  return NextResponse.json(
    { ok: sah, aktif, harga: HARGA_PROMO_AFILIATOR_ELEARNING, sampai: new Date(PROMO_AFILIATOR_ELEARNING_SAMPAI).toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
