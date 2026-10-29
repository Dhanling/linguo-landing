import { NextResponse } from "next/server";
import { BRAND_FACTS } from "@/lib/brand-facts";

// [ulasan-google-v1] Link pendek ulasan Google untuk WA "sertifikat terbit"
// (job DB job_review_ask_notify). Redirect sementara (307) supaya tujuannya
// bisa diganti tanpa mengubah pesan yang sudah terkirim.
export const dynamic = "force-static";

export function GET() {
  return NextResponse.redirect(BRAND_FACTS.googleReviews.writeReviewUrl, 307);
}
