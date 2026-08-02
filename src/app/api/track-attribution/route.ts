// ads-conversion-sync — Fase 1. Endpoint eksplisit buat form yang mau mencatat
// attribution di luar alur checkout (mis. lead magnet, form tanpa invoice).
//
// Titik submit yang SUDAH punya email/HP tidak perlu memanggil ini: route-nya
// masing-masing sudah memanggil recordAdAttribution() sendiri, jadi tidak ada
// roundtrip tambahan dan tidak ada balapan dengan redirect Xendit.
//
// Body: { email?, phone?, attribution? }  — minimal salah satu email/phone.

import { NextRequest, NextResponse } from "next/server";
import { recordAdAttribution } from "@/lib/adAttributionServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : null;
    const phone =
      typeof body?.phone === "string"
        ? body.phone
        : typeof body?.wa_number === "string"
          ? body.wa_number
          : null;

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Butuh email atau nomor HP" },
        { status: 400 },
      );
    }

    recordAdAttribution(req, { email, phone }, body?.attribution);
    return NextResponse.json({ ok: true });
  } catch {
    // Pelacakan tidak boleh pernah terlihat gagal oleh pengunjung.
    return NextResponse.json({ ok: false });
  }
}
