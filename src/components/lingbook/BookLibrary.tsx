"use client";

// [lingbook-phase1-v1] Library Lingbook — grid buku. Klik buku → bab "sekarang"
// (status "now") atau bab pertama. Dipakai di dalam StudentShell (/akun/lingbook).

import Link from "next/link";
import { BOOKS, type Book } from "@/data/lingbook";
import { BookOpen } from "lucide-react";

function firstChapterSlug(book: Book): string {
  const now = book.toc.find((c) => c.status === "now");
  return (now ?? book.toc[0])?.slug ?? "";
}

function progressOf(book: Book): { done: number; total: number } {
  const done = book.toc.filter((c) => c.status === "done").length;
  return { done, total: book.chapterCount };
}

export default function BookLibrary() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#11313A]">Lingbook</h1>
        <p className="mt-1 text-sm text-[#5A7A78]">
          Ebook interaktif — tap tiap kata untuk cara baca, arti, dan analisa tata bahasanya.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {BOOKS.map((book) => {
          const slug = firstChapterSlug(book);
          const { done, total } = progressOf(book);
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <Link
              key={book.slug}
              href={`/akun/lingbook/${book.slug}/${slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#E3EEEC] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(17,49,58,.12)]"
            >
              {/* kover */}
              <div className="relative flex h-36 items-center justify-center" style={{ background: `linear-gradient(135deg, ${book.accent || "#1A9E9E"}, ${book.accent || "#1A9E9E"}CC)` }}>
                <span className="select-none text-6xl font-black text-white/90">{book.coverGlyph || book.title.charAt(0)}</span>
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-[#11313A]">{book.level}</span>
              </div>

              {/* isi */}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1A9E9E]">
                  <BookOpen className="h-3.5 w-3.5" />
                  {book.language.nativeName ? `${book.language.name} · ${book.language.nativeName}` : book.language.name}
                </div>
                <div className="mt-1 text-base font-extrabold text-[#11313A]">{book.title}</div>
                {book.description && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#5A7A78]">{book.description}</p>}

                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#5A7A78]">
                    <span>{done} / {total} bab</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E9F2F0]">
                    <div className="h-full rounded-full bg-[#1A9E9E] transition-all" style={{ width: `${Math.max(4, pct)}%` }} />
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-[13px] font-extrabold text-[#0B7570] group-hover:gap-2 transition-all">
                    {done > 0 ? "Lanjutkan membaca" : "Mulai membaca"} →
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
