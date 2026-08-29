// [life-dashboard-v1] Tukar PIN dengan cookie sesi /life.
// PIN dicocokkan di server; yang balik ke browser cuma HMAC-nya.
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_LIFE, UMUR_COOKIE, pinBenar, tokenSah } from "../../lib/pin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let pin = "";
  try {
    const body = await req.json();
    pin = String(body?.pin ?? "");
  } catch {
    return NextResponse.json({ ok: false, pesan: "Format permintaan salah." }, { status: 400 });
  }

  if (!pin.trim()) {
    return NextResponse.json({ ok: false, pesan: "PIN belum diisi." }, { status: 400 });
  }
  if (!pinBenar(pin)) {
    // Jeda kecil supaya percobaan tebak beruntun tidak gratis.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ ok: false, pesan: "PIN salah." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_LIFE, tokenSah(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/life",
    maxAge: UMUR_COOKIE,
  });
  return res;
}

/** Keluar — dipakai tombol di header dashboard. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_LIFE, "", { path: "/life", maxAge: 0 });
  return res;
}
