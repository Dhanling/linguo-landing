// [seo-blog-bisa-dirayapi-v1] Blok tautan tetap di bawah daftar artikel /blog.
// Tujuannya satu: memberi Googlebot jalur masuk ke arsip & kategori langsung
// dari HTML /blog, tanpa mengubah infinite scroll yang sudah ada.
//
// Catatan penting soal kenapa ini bekerja: yang membuat /blog cuma memuat 8
// tautan di HTML BUKAN karena BlogContent "use client" — komponen klien tetap
// dirender di server. Penyebabnya state `feedN` yang memotong daftar jadi 8.
// Blok ini berdiri di luar state itu, jadi isinya selalu utuh di HTML pertama.

import Link from "next/link";
import { BLOG_KATEGORI } from "./arsipData";

export function JelajahiNav({ dm = false }: { dm?: boolean }) {
  return (
    <nav
      aria-label="Jelajahi blog"
      className={`mx-auto mt-4 max-w-[1200px] border-t px-6 py-10 ${dm ? "border-slate-800" : "border-slate-100"}`}
    >
      <h2 className={`text-[15px] font-extrabold ${dm ? "text-slate-100" : "text-[#0f172a]"}`}>
        Jelajahi Semua Artikel
      </h2>
      <p className={`mt-1.5 text-[13px] ${dm ? "text-slate-500" : "text-slate-500"}`}>
        Daftar lengkap artikel Linguo.id, tersusun per kategori dan per bulan terbit.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/blog/arsip"
          className="rounded-full bg-[#1A9E9E] px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#178585]"
        >
          Arsip Lengkap
        </Link>
        {BLOG_KATEGORI.map((k) => (
          <Link
            key={k.slug}
            href={`/blog/kategori/${k.slug}`}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              dm
                ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-[#1A9E9E]/40 hover:text-[#1A9E9E]"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#1A9E9E]/40 hover:text-[#1A9E9E]"
            }`}
          >
            Artikel {k.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
