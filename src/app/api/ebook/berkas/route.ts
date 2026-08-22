// [ebook-buka-cepat-v3] Penyalur POTONGAN berkas e-book — inilah yang membuat
// modul terasa langsung terbuka.
//
// Masalahnya: satu modul 3,5–5,5 MB, dan di koneksi rumahan transfernya 5–17
// detik. Selama itu siswa cuma melihat "Menyiapkan modul…" walau yang ingin
// dibacanya cuma halaman 1–2. pdf.js sebenarnya sanggup meminta bagian yang
// dibutuhkan saja (HTTP Range) — tapi cuma kalau ia bisa MEMBACA kepala
// `Accept-Ranges`/`Content-Range` dari jawabannya. Tarikan langsung ke Supabase
// itu lintas-domain dan kepala tersebut tak ikut dibuka untuk JavaScript, jadi
// pdf.js menyerah dan mengunduh bulat-bulat.
//
// Route ini duduk di domain kita sendiri, jadi seluruh kepalanya terbaca:
// bentangan pertama tampil setelah beberapa ratus KB, bukan setelah 3,5 MB.
//
// Haknya sudah diperiksa di /api/ebook waktu tiketnya diterbitkan (lihat
// lib/ebookToken.ts) — di sini tinggal tanda tangannya yang dicocokkan, tanpa
// perjalanan jaringan tambahan per potongan.
import { NextRequest, NextResponse } from "next/server";
import { bacaTiket } from "@/lib/ebookToken";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "ebook-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* `private` = boleh disimpan browsernya sendiri, tidak boleh oleh CDN/proxy
   bersama. Potongan yang sama sering diminta ulang waktu siswa bolak-balik
   halaman; membiarkan browser menyimpannya menghemat perjalanan. */
const CACHE = "private, max-age=3600";

async function salurkan(req: NextRequest, kirimBadan: boolean) {
  const q = req.nextUrl.searchParams;
  const jalur = bacaTiket(q.get("p") ?? "", q.get("exp") ?? "", q.get("sig") ?? "");
  if (!jalur) {
    return NextResponse.json(
      { error: "Tautan modul sudah kedaluwarsa. Muat ulang halamannya ya." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rentang = req.headers.get("range");
  const alamat = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${jalur.split("/").map(encodeURIComponent).join("/")}`;
  const res = await fetch(alamat, {
    method: kirimBadan ? "GET" : "HEAD",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      ...(rentang ? { Range: rentang } : {}),
    },
    cache: "no-store",
  }).catch(() => null);

  if (!res || !res.ok) {
    return NextResponse.json(
      { error: "Berkas modul belum diunggah tim Linguo. Hubungi CS ya." },
      { status: res?.status === 416 ? 416 : 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Kepala yang WAJIB diteruskan apa adanya: tanpa Accept-Ranges/Content-Range
  // pdf.js kembali menyimpulkan servernya tak bisa dipotong.
  const kepala = new Headers({
    "Content-Type": "application/pdf",
    "Accept-Ranges": "bytes",
    "Cache-Control": CACHE,
  });
  for (const nama of ["content-length", "content-range", "etag", "last-modified"]) {
    const v = res.headers.get(nama);
    if (v) kepala.set(nama, v);
  }

  return new NextResponse(kirimBadan ? res.body : null, { status: res.status, headers: kepala });
}

export async function GET(req: NextRequest) {
  return salurkan(req, true);
}

export async function HEAD(req: NextRequest) {
  return salurkan(req, false);
}
