"use client";

// [lingbook-cms] Route reader immersive → /akun/lingbook/[bookSlug]/[chapterSlug].
// Konten dari Supabase (CMS admin) dgn FALLBACK ke file TS (lihat data/lingbook/remote).
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client"; // [dev-gate-lingbook-v1]
import { canAccessLingbook } from "@/lib/materiGate"; // [dev-gate-lingbook-v1]
import { loadChapter } from "@/data/lingbook/remote";
import type { Book, Chapter } from "@/data/lingbook";
import LingbookReader from "@/components/lingbook/LingbookReader";
import ChapterUnavailable from "@/components/lingbook/ChapterUnavailable";

export default function LingbookReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookSlug = String(params.bookSlug ?? "");
  const chapterSlug = String(params.chapterSlug ?? "");

  const [state, setState] = useState<
    { status: "loading" } | { status: "ok"; book: Book; chapter: Chapter } | { status: "missing" }
  >({ status: "loading" });
  // [dev-gate-lingbook-v1] Lingbook masih development → hanya email allowlist yang boleh
  // buka reader; sisanya dilempar ke /akun sebelum konten sempat dirender.
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return;
      if (!session?.user?.id || !canAccessLingbook(session.user.email)) router.replace("/akun");
      else setAllowed(true);
    });
    return () => { alive = false; };
  }, [router]);

  useEffect(() => {
    if (!allowed) return;
    let alive = true;
    setState({ status: "loading" });
    loadChapter(bookSlug, chapterSlug).then((found) => {
      if (!alive) return;
      setState(found ? { status: "ok", ...found } : { status: "missing" });
    });
    return () => { alive = false; };
  }, [allowed, bookSlug, chapterSlug]);

  if (!allowed || state.status === "loading") {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100dvh", background: "#F6FAF9" }}>
        <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
      </div>
    );
  }
  if (state.status === "missing") return <ChapterUnavailable bookSlug={bookSlug} chapterSlug={chapterSlug} />;
  return <LingbookReader book={state.book} chapter={state.chapter} />;
}
