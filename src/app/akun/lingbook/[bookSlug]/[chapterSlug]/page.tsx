"use client";

// [lingbook-phase1-v1] Route reader immersive → /akun/lingbook/[bookSlug]/[chapterSlug].
// Full-screen (own header + back ke library). Phase 1: data mock via getChapter.
import { useParams } from "next/navigation";
import { getChapter } from "@/data/lingbook";
import LingbookReader from "@/components/lingbook/LingbookReader";
import ChapterUnavailable from "@/components/lingbook/ChapterUnavailable";

export default function LingbookReaderPage() {
  const params = useParams();
  const bookSlug = String(params.bookSlug ?? "");
  const chapterSlug = String(params.chapterSlug ?? "");
  const found = getChapter(bookSlug, chapterSlug);

  if (!found) return <ChapterUnavailable bookSlug={bookSlug} chapterSlug={chapterSlug} />;
  return <LingbookReader book={found.book} chapter={found.chapter} />;
}
