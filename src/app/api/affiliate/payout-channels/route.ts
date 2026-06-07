// ============================================================================
// API: /api/affiliate/payout-channels
// Affiliate Program — Phase 3B (dropdown bank)
// linguo-patch:afiliator-bank-dropdown-v1
// ----------------------------------------------------------------------------
// Ngembaliin daftar bank Indonesia yang didukung Xendit untuk payout, langsung
// dari Get Payout Channels (https://api.xendit.co/payouts_channels). Dipakai
// RekeningForm buat ngisi dropdown bank — channel_code-nya selalu yang valid &
// sesuai mode (test/live) akun. Pakai key payout yang sama (XENDIT_PAYOUT_
// SECRET_KEY, fallback XENDIT_SECRET_KEY). Kalau gagal → balikin { banks: [] }
// biar form pakai fallback list-nya sendiri.
// ============================================================================

import { NextResponse } from "next/server";

const XENDIT_SECRET =
  process.env.XENDIT_PAYOUT_SECRET_KEY || process.env.XENDIT_SECRET_KEY || "";

// daftar bank jarang berubah — cache 6 jam
export const revalidate = 21600;

export async function GET() {
  try {
    if (!XENDIT_SECRET) {
      return NextResponse.json({ banks: [] }, { status: 200 });
    }

    const res = await fetch("https://api.xendit.co/payouts_channels", {
      headers: {
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET + ":").toString(
          "base64"
        )}`,
      },
      next: { revalidate: 21600 },
    });

    if (!res.ok) {
      return NextResponse.json({ banks: [] }, { status: 200 });
    }

    const data = await res.json().catch(() => null);
    const arr: any[] = Array.isArray(data) ? data : [];

    const banks = arr
      .filter(
        (c) =>
          String(c?.channel_category).toUpperCase() === "BANK" &&
          String(c?.channel_code).startsWith("ID_")
      )
      .map((c) => ({
        code: String(c.channel_code),
        name: String(c.channel_name || c.channel_code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ banks }, { status: 200 });
  } catch {
    return NextResponse.json({ banks: [] }, { status: 200 });
  }
}
