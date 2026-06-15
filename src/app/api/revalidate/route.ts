import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * Generic on-demand revalidation endpoint.
 *
 * POST body: { path: string, secret: string }
 * Dipanggil dari dashboard admin setiap kali produk/konten berubah supaya
 * halaman ISR (mis. /toko) langsung di-regenerate tanpa nunggu window revalidate.
 *
 * Catatan: secret-nya sama dengan yang dipakai /api/revalidate-blog
 * (env REVALIDATE_SECRET).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, path } = body;

    const expected = process.env.REVALIDATE_SECRET;
    if (!expected) {
      return NextResponse.json({ error: "REVALIDATE_SECRET not configured" }, { status: 500 });
    }
    if (secret !== expected) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }
    if (!path || typeof path !== "string" || !path.startsWith("/")) {
      return NextResponse.json(
        { error: "Body 'path' wajib diisi dan harus diawali '/'" },
        { status: 400 }
      );
    }

    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Revalidation error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

// Allow GET for simple health check
export async function GET() {
  return NextResponse.json({ status: "ready", endpoint: "/api/revalidate" });
}
