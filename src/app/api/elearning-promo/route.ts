// [elearning-promo-afiliator-v1] Cek kode afiliator untuk pratinjau harga promo
// E-Learning 6 bulan (Rp29.000) di etalase. Read-only; harga yang DITAGIH tetap
// dihitung ulang oleh /api/create-cart-invoice. Lihat lib/elearningPromoAfiliator.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  DISKON_AFILIATOR_EBOOK,
  HARGA_PROMO_AFILIATOR_ELEARNING,
  PROMO_AFILIATOR_ELEARNING_SAMPAI,
  kodeAfiliatorSah,
  promoAfiliatorElearningAktif,
} from "@/lib/elearningPromoAfiliator";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  const aktif = promoAfiliatorElearningAktif();
  let sah = false;
  // [ebook-diskon-afiliator-v1] Kode dicek walau promo E-Learning sudah lewat tanggal:
  // potongan Rp10rb E-Book tidak berbatas waktu. `ok` = promo E-Learning, `sah` = kodenya aktif.
  if (code) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    sah = await kodeAfiliatorSah(admin, code);
  }
  return NextResponse.json(
    { ok: sah && aktif, sah, aktif, diskonEbook: DISKON_AFILIATOR_EBOOK, harga: HARGA_PROMO_AFILIATOR_ELEARNING, sampai: new Date(PROMO_AFILIATOR_ELEARNING_SAMPAI).toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
