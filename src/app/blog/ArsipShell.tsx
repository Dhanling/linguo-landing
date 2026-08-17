// [seo-blog-bisa-dirayapi-v1] Kerangka bersama halaman /blog/arsip dan
// /blog/kategori/*. Komponen SERVER — tidak ada "use client" dan itu disengaja:
// seluruh daftar tautan harus sudah ada di HTML pertama yang diterima Googlebot,
// bukan dirakit belakangan oleh JavaScript seperti di BlogContent.tsx.

import Link from "next/link";
import type { ReactNode } from "react";
import { BLOG_KATEGORI, formatTanggal, type ArsipPost } from "./arsipData";

export function ArsipShell({
  judul,
  intro,
  jumlah,
  kategoriAktif,
  children,
}: {
  judul: string;
  intro: string;
  jumlah: number;
  /** Slug kategori yang sedang dibuka, supaya chip-nya ditandai. */
  kategoriAktif?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-jakarta),-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <nav className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex h-14 max-w-[1000px] items-center justify-between px-6">
          <Link href="/" className="flex shrink-0 items-center">
            <img src="/images/logo-color.png" alt="Linguo" width={644} height={228} className="h-7 object-contain sm:h-9" />
          </Link>
          <Link href="/" className="hidden rounded-full bg-[#1A9E9E] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#178585] sm:block">
            Mulai Belajar
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-[1000px] px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-5 text-[13px] text-slate-500">
          <Link href="/" className="transition hover:text-[#1A9E9E]">Beranda</Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <Link href="/blog" className="transition hover:text-[#1A9E9E]">Blog</Link>
          {kategoriAktif && (
            <>
              <span className="mx-1.5 text-slate-300">/</span>
              <Link href="/blog/arsip" className="transition hover:text-[#1A9E9E]">Arsip</Link>
            </>
          )}
        </nav>

        <h1 className="text-[26px] font-extrabold leading-tight text-[#0f172a] sm:text-[32px]">{judul}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">{intro}</p>
        <p className="mt-2 text-[13px] text-slate-400">{jumlah} artikel</p>

        {/* Tautan silang antar kategori — tiap halaman arsip saling menyambung,
            jadi Googlebot bisa berpindah tanpa harus kembali ke /blog dulu. */}
        <div className="mt-7 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
          <Link
            href="/blog/arsip"
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              kategoriAktif
                ? "border-slate-200 bg-white text-slate-600 hover:border-[#1A9E9E]/40 hover:text-[#1A9E9E]"
                : "border-transparent bg-[#1A9E9E] text-white"
            }`}
          >
            Semua Artikel
          </Link>
          {BLOG_KATEGORI.map((k) => (
            <Link
              key={k.slug}
              href={`/blog/kategori/${k.slug}`}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                kategoriAktif === k.slug
                  ? "border-transparent bg-[#1A9E9E] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#1A9E9E]/40 hover:text-[#1A9E9E]"
              }`}
            >
              {k.label}
            </Link>
          ))}
        </div>

        {children}

        <div className="mt-12 rounded-2xl bg-[#1A9E9E] px-6 py-8 text-white sm:px-8">
          <h2 className="text-lg font-extrabold sm:text-xl">Belajar langsung dengan pengajar?</h2>
          <p className="mt-1.5 max-w-xl text-sm text-white/85">
            Artikel membantu, tapi bicara langsung jauh lebih cepat. Linguo punya kelas live 1-on-1 untuk 60+ bahasa.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/kursus" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#1A9E9E] transition-colors hover:bg-white/90">
              Lihat Semua Kursus
            </Link>
            <Link href="/kelas-trial" className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              Coba Kelas Trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Satu baris artikel. `<a href>` biasa — inilah yang dicari perayap. */
export function ArsipItem({ post }: { post: ArsipPost }) {
  return (
    <li className="border-b border-slate-100 py-3.5 last:border-0">
      <Link href={`/blog/${post.slug}`} className="group block">
        <h3 className="text-[15px] font-semibold leading-snug text-[#0f172a] transition-colors group-hover:text-[#1A9E9E]">
          {post.title}
        </h3>
        <p className="mt-1 text-[12px] text-slate-400">
          {formatTanggal(post.published_at)}
          {post.category ? ` · ${post.category}` : ""}
        </p>
      </Link>
    </li>
  );
}
