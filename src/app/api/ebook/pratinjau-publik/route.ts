// [ebook-pratinjau-publik-v1] Unit 1 sebuah Lingbook untuk SIAPA SAJA — tanpa
// akun, tanpa login.
//
// Kenapa jalur sendiri, terpisah dari /api/ebook: yang di sana melayani PEMILIK
// (byte modul utuh + gembok digambar di browser). Untuk tamu, cara itu berarti
// mengirim seluruh modul 5 MB ke orang yang belum membeli apa pun dan berharap
// dia tidak membuka tab Network. Di sini yang keluar dari server memang cuma
// halaman 1..N — sisanya tidak pernah meninggalkan bucket.
//
// Potongannya dirakit SEKALI lalu disimpan balik ke bucket sebagai
// `<nama>.pratinjau.pdf`. Permintaan berikutnya tinggal menyalurkan berkas kecil
// itu: merakit ulang PDF tiap kali ada yang mengklik "Baca Gratis Unit 1" berarti
// mengunduh + mengurai 5 MB di fungsi serverless untuk hasil yang selalu sama.
//
// Berkas ini memang gratis dan boleh disebar — jadi boleh di-cache CDN, tak
// perlu no-store seperti modul berbayar.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";
import { isStoragePath } from "@/lib/digitalAccess";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "ebook-files";

/** Halaman terakhir yang ikut kalau modulnya tak punya berkas soal. */
const CADANGAN = 14;

const enc = (jalur: string) => jalur.split("/").map(encodeURIComponent).join("/");

/** Sama persis dengan batasPratinjau() di /api/ebook — dua jalur, satu aturan. */
function batasUnitSatu(soal: unknown): number {
  const unit = (soal as { unit?: Array<{ hal?: number | null; sampai?: number | null; halLatihan?: number | null }> } | null)?.unit;
  if (!Array.isArray(unit) || unit.length === 0) return CADANGAN;
  const u1 = unit[0];
  const akhir =
    u1?.sampai ??
    (u1?.halLatihan ? u1.halLatihan + 1 : null) ??
    (unit[1]?.hal ? unit[1].hal! - 1 : null) ??
    CADANGAN;
  return Math.max(1, Number(akhir) || CADANGAN);
}

function tolak(pesan: string, status: number) {
  return NextResponse.json({ error: pesan }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("slug") || "").trim();
  if (!slug) return tolak("slug wajib diisi", 400);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: prod, error } = await admin
    .from("digital_products")
    .select("id, type, title, slug, is_active, file_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) return tolak("Gagal membaca produk", 500);
  if (!prod || prod.type !== "ebook") return tolak("Modul tidak ditemukan", 404);
  if (!isStoragePath(prod.file_url)) return tolak("Modul ini tidak punya pratinjau", 404);

  const jalurPdf = prod.file_url!;
  const dasar = jalurPdf.replace(/\.pdf$/i, "");
  const jalurCicip = `${dasar}.pratinjau.pdf`;

  const tarik = (jalur: string) =>
    fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${enc(jalur)}`, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
      cache: "no-store",
    }).catch(() => null);

  const kirim = (isi: ArrayBuffer | Uint8Array, halaman: number | null) =>
    new NextResponse(isi as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${slug}-unit1.pdf"`,
        // Gratis & sama untuk semua orang → boleh nginap di CDN sehari.
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        ...(halaman ? { "X-Halaman": String(halaman) } : {}),
      },
    });

  // ── Sudah pernah dirakit? ────────────────────────────────────────────────
  const jadi = await tarik(jalurCicip);
  if (jadi?.ok) return kirim(await jadi.arrayBuffer(), null);

  // ── Rakit sekali ─────────────────────────────────────────────────────────
  const soalRes = await tarik(`${dasar}.latihan.json`);
  const soal = soalRes?.ok ? await soalRes.json().catch(() => null) : null;
  const batas = batasUnitSatu(soal);

  const penuh = await tarik(jalurPdf);
  if (!penuh?.ok) return tolak("Berkas modul belum diunggah", 404);

  let potong: Uint8Array;
  try {
    const src = await PDFDocument.load(await penuh.arrayBuffer());
    const ambil = Math.min(batas, src.getPageCount());
    const out = await PDFDocument.create();
    const hal = await out.copyPages(src, Array.from({ length: ambil }, (_, i) => i));
    hal.forEach((h) => out.addPage(h));
    // Judul dokumen ikut terbaca di bilah pemirsa PDF bawaan browser.
    out.setTitle(`${prod.title} — Pratinjau Unit 1`);
    potong = await out.save();
  } catch (e) {
    console.error("[ebook-pratinjau-publik] gagal memotong:", e);
    return tolak("Pratinjau modul ini belum bisa dibuat", 500);
  }

  // Simpanan best-effort: gagal mengunggah tak boleh membatalkan pratinjau yang
  // sudah jadi di tangan — paling-paling permintaan berikutnya merakit lagi.
  admin.storage
    .from(BUCKET)
    .upload(jalurCicip, potong, { contentType: "application/pdf", upsert: true })
    .then(undefined, () => {});

  return kirim(potong, batas);
}
