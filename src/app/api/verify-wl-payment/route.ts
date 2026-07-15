// =============================================================================
// /api/verify-wl-payment
// Cek status invoice langganan Watch & Learn langsung ke Xendit (source of truth)
// via external_id. Dipakai halaman /watch setelah redirect balik dari checkout —
// pola redirect-verify (bukan webhook), jadi aktivasi premium hanya terjadi kalau
// invoice benar-benar LUNAS (bukan sekadar buka URL ?wl=...).
//
// TODO(entitlement): unlock ini masih per-perangkat (client set flag lokal).
// Untuk langganan lintas-perangkat + auto-expire, sambungkan ke login + tabel
// wl_subscriptions yang di-set oleh xendit-webhook.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const PAID_STATUSES = ["PAID", "SETTLED"];

export async function GET(req: NextRequest) {
  const externalId = req.nextUrl.searchParams.get("external_id");
  if (!externalId || !/^WL-/.test(externalId)) {
    return NextResponse.json({ paid: false, error: "external_id tidak valid" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.xendit.co/v2/invoices?external_id=${encodeURIComponent(externalId)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
        },
      }
    );
    if (!res.ok) {
      return NextResponse.json({ paid: false, error: "Gagal cek status" }, { status: 502 });
    }
    const rows = await res.json();
    const inv = Array.isArray(rows) ? rows[0] : rows;
    const paid = !!inv && PAID_STATUSES.includes(inv.status);
    return NextResponse.json({ paid, status: inv?.status ?? null });
  } catch (e) {
    console.error("verify-wl-payment error:", e);
    return NextResponse.json({ paid: false, error: "Internal error" }, { status: 500 });
  }
}
