"use client";

// [lingbook-cms] Route reader immersive → /akun/lingbook/[bookSlug]/[chapterSlug].
// Konten dari Supabase (CMS admin) dgn FALLBACK ke file TS (lihat data/lingbook/remote).
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { loadChapter } from "@/data/lingbook/remote";
import type { Book, Chapter } from "@/data/lingbook";
import LingbookReader from "@/components/lingbook/LingbookReader";
import ChapterUnavailable from "@/components/lingbook/ChapterUnavailable";

export default function LingbookReaderPage() {
  const params = useParams();
  const bookSlug = String(params.bookSlug ?? "");
  const chapterSlug = String(params.chapterSlug ?? "");

  const [state, setState] = useState<
    { status: "loading" } | { status: "ok"; book: Book; chapter: Chapter } | { status: "missing" }
  >({ status: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    loadChapter(bookSlug, chapterSlug).then((found) => {
      if (!alive) return;
      setState(found ? { status: "ok", ...found } : { status: "missing" });
    });
    return () => { alive = false; };
  }, [bookSlug, chapterSlug]);

  if (state.status === "loading") {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100dvh", background: "#F6FAF9" }}>
        <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
      </div>
    );
  }
  if (state.status === "missing") return <ChapterUnavailable bookSlug={bookSlug} chapterSlug={chapterSlug} />;
  return <LingbookReader book={state.book} chapter={state.chapter} />;
}
