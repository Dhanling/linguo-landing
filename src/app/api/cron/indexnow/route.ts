// [aeo-indexnow-v1] Cron harian: kirim ke IndexNow semua URL yang BENAR-BENAR
// berubah dalam 48 jam terakhir — artikel blog yang baru terbit, plus halaman
// statis/silabus yang tanggal lastmod-nya dinaikkan manual.
//
// Sumbernya fungsi sitemap yang sama dengan /sitemap.xml dkk, jadi tidak ada
// daftar URL kedua yang bisa basi. Entri hub yang lastmod-nya dicap "sekarang"
// setiap kali sitemap dibangkitkan (/blog, arsip, kategori) dibuang — kalau
// ikut, tiap hari kita mengaku halaman itu berubah padahal belum tentu, dan
// Bing berhenti mempercayai ping dari domain ini.
//
// Kirim seluruh URL sekaligus (sekali jalan, mis. sesudah domain baru didaftar):
//   node scripts/indexnow-submit.mjs
import { NextResponse } from "next/server";
import rootSitemap from "@/app/sitemap";
import blogSitemap from "@/app/blog/sitemap";
import silabusSitemap from "@/app/silabus/sitemap";
import { submitIndexNow } from "@/lib/indexnow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET || "";
const WINDOW_MS = 48 * 3600 * 1000;

export async function GET(req: Request) {
  if (!CRON_SECRET || req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Apa pun yang lastmod-nya >= t0 dicap saat dibangkitkan, bukan perubahan nyata.
  const t0 = Date.now() - 1000;
  const entries = [
    ...(await rootSitemap()),
    ...(await blogSitemap()),
    ...(await silabusSitemap()),
  ];

  const urls = entries
    .filter((e) => {
      if (!e.lastModified) return false;
      const t = new Date(e.lastModified).getTime();
      return t < t0 && Date.now() - t <= WINDOW_MS;
    })
    .map((e) => e.url);

  if (urls.length === 0) return NextResponse.json({ submitted: 0, urls: [] });

  try {
    const result = await submitIndexNow(urls);
    return NextResponse.json({ ...result, urls });
  } catch (e) {
    console.error("[indexnow]", e);
    return NextResponse.json({ error: String(e), urls }, { status: 502 });
  }
}
