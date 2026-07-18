"use client";

// [lingbook-phase1-v1] Layar bab belum tersedia (phase 1 hanya sebagian bab
// punya konten). Frame immersive sama seperti reader.
import Link from "next/link";
import { getBook } from "@/data/lingbook";

export default function ChapterUnavailable({ bookSlug }: { bookSlug: string; chapterSlug: string }) {
  const book = getBook(bookSlug);
  const demo = book?.chapters[0];
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-[#F6FAF9] px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#E4F2F1] text-3xl">📖</div>
        <h1 className="text-xl font-extrabold text-[#11313A]">Bab ini belum tersedia</h1>
        <p className="mt-1.5 text-sm text-[#5A7A78]">
          Konten bab ini sedang disiapkan. Untuk demo, coba bab yang sudah siap dibaca.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {book && demo && (
            <Link href={`/akun/lingbook/${book.slug}/${demo.slug}`} className="rounded-xl bg-[#1A9E9E] px-5 py-3 text-sm font-extrabold text-white">
              Buka bab demo: {demo.title}
            </Link>
          )}
          <Link href="/akun/lingbook" className="rounded-xl border border-[#D5E6E3] px-5 py-3 text-sm font-bold text-[#33565C]">
            ← Kembali ke Library
          </Link>
        </div>
      </div>
    </div>
  );
}
