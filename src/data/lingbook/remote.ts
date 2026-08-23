"use client";

// [lingbook-cms] Sumber data reader: coba Supabase dulu (CMS admin), FALLBACK ke
// file TS (src/data/lingbook/*) bila tabel kosong / error / baris belum published.
// Skema tabel: sql/20260720_lingbook_cms.sql. Kolom JSONB PERSIS mengikuti tipe
// `Book`/`Chapter` di types.ts → nyaris tanpa transformasi (hanya snake→camel).
import { supabase } from "@/lib/supabase-client";
import { BOOKS, getChapter as getFileChapter } from "./index";
import type {
  Book,
  Chapter,
  ChapterSummary,
  ContentBlock,
  Exercise,
  GrammarPointBlock,
  Objective,
  RoleplayTurn,
  TestQuestion,
  UnitStep,
  Word,
} from "./types";

type BookRow = {
  slug: string;
  title: string;
  language: Book["language"];
  level: string | null;
  description: string | null;
  accent: string | null;
  cover_glyph: string | null;
  chapter_count: number | null;
  toc: ChapterSummary[] | null;
};

type ChapterRow = {
  slug: string;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  meta: string | null;
  glossary: Record<string, Word> | null;
  blocks: ContentBlock[] | null;
  steps: UnitStep[] | null;
  objectives: Objective[] | null;
  vocab_refs: string[] | null;
  grammar_points: GrammarPointBlock[] | null;
  exercises: Exercise[] | null;
  test: TestQuestion[] | null;
  roleplay: RoleplayTurn[] | null;
};

function mapBook(row: BookRow): Book {
  const toc = (row.toc ?? []) as ChapterSummary[];
  return {
    slug: row.slug,
    title: row.title,
    language: row.language,
    level: row.level ?? "",
    description: row.description ?? undefined,
    accent: row.accent ?? undefined,
    coverGlyph: row.cover_glyph ?? undefined,
    chapterCount: row.chapter_count ?? toc.length,
    toc,
    chapters: [], // reader memuat bab satu per satu via loadChapter
  };
}

function mapChapter(row: ChapterRow): Chapter {
  const steps = (row.steps ?? []) as UnitStep[];
  return {
    slug: row.slug,
    label: row.label ?? "",
    title: row.title ?? "",
    subtitle: row.subtitle ?? undefined,
    meta: row.meta ?? undefined,
    glossary: row.glossary ?? {},
    blocks: (row.blocks ?? []) as ContentBlock[],
    steps: steps.length ? steps : undefined,
    objectives: (row.objectives ?? undefined) as Objective[] | undefined,
    vocabRefs: (row.vocab_refs ?? undefined) as string[] | undefined,
    grammarPoints: (row.grammar_points ?? undefined) as GrammarPointBlock[] | undefined,
    exercises: (row.exercises ?? undefined) as Exercise[] | undefined,
    test: (row.test ?? undefined) as TestQuestion[] | undefined,
    roleplay: (row.roleplay ?? undefined) as RoleplayTurn[] | undefined,
  };
}

/** Daftar buku untuk library. DB (published) diprioritaskan per-slug, sisanya file. */
export async function loadBooks(): Promise<Book[]> {
  try {
    const { data, error } = await supabase
      .from("lingbook_books")
      .select("slug,title,language,level,description,accent,cover_glyph,chapter_count,toc,sort")
      .eq("published", true)
      .order("sort", { ascending: true });
    if (error || !data || data.length === 0) return BOOKS;

    const remote = data.map((r) => mapBook(r as BookRow));
    const remoteSlugs = new Set(remote.map((b) => b.slug));
    // Buku file yang belum ada di DB tetap ditampilkan (fallback).
    const fileOnly = BOOKS.filter((b) => !remoteSlugs.has(b.slug));
    return [...remote, ...fileOnly];
  } catch {
    return BOOKS;
  }
}

/** Satu bab untuk reader. DB dulu; bila bab tak ada di DB, fallback ke file. */
export async function loadChapter(
  bookSlug: string,
  chapterSlug: string,
): Promise<{ book: Book; chapter: Chapter } | undefined> {
  try {
    const { data: bookRow } = await supabase
      .from("lingbook_books")
      .select("id,slug,title,language,level,description,accent,cover_glyph,chapter_count,toc")
      .eq("slug", bookSlug)
      .eq("published", true)
      .maybeSingle();

    if (bookRow) {
      const book = mapBook(bookRow as BookRow);
      const { data: chapterRow } = await supabase
        .from("lingbook_chapters")
        .select(
          "slug,label,title,subtitle,meta,glossary,blocks,steps,objectives,vocab_refs,grammar_points,exercises,test,roleplay",
        )
        .eq("book_id", (bookRow as { id: string }).id)
        .eq("slug", chapterSlug)
        .eq("published", true)
        .maybeSingle();

      if (chapterRow) return { book, chapter: mapChapter(chapterRow as ChapterRow) };
      // Buku ada di DB tapi babnya belum → pakai bab dari file (kalau ada).
      const fileChapter = getFileChapter(bookSlug, chapterSlug);
      if (fileChapter) return { book, chapter: fileChapter.chapter };
      return undefined;
    }
  } catch {
    /* jatuh ke file */
  }
  return getFileChapter(bookSlug, chapterSlug);
}

/* [lanjutkan-lingbook-kartu-v1] Metadata ringkas "terakhir dibaca" untuk kartu
   Lanjutkan Belajar di Beranda. Sengaja TIDAK memakai loadChapter(): kartu itu
   cuma butuh judul + kover + jumlah langkah, sedangkan loadChapter menarik
   seluruh blok & glosarium bab — muatan berat untuk satu baris di beranda.
   Berlapis seperti sumber Lingbook lainnya: DB (published) → file TS → null. */
export interface LastReadMeta {
  bookTitle: string;
  /** Warna kover — sama dengan kartu di rak Lingbook, supaya saling menunjuk. */
  accent: string;
  /** Glyph kover (emoji/aksara); kosong → huruf pertama judul. */
  glyph: string;
  /** Label bab seperti tertulis di buku, mis. "Bab 3 — カフェで". */
  chapterLabel: string;
  /** Jumlah langkah unit bab itu — penyebut persentase. 0 = tak diketahui. */
  stepCount: number;
}

export async function loadLastReadMeta(
  bookSlug: string,
  chapterSlug: string,
): Promise<LastReadMeta | null> {
  const rapikan = (s: string) => s.replace(/-/g, " ");

  // Lapisan file dulu — dipakai apa adanya bila DB kosong/gagal.
  const fileBook = BOOKS.find((b) => b.slug === bookSlug);
  const fileChapter = getFileChapter(bookSlug, chapterSlug)?.chapter;
  let meta: LastReadMeta | null = fileBook
    ? {
        bookTitle: fileBook.title,
        accent: fileBook.accent || "#1A9E9E",
        glyph: fileBook.coverGlyph || fileBook.title.charAt(0),
        chapterLabel:
          fileChapter?.label ||
          fileChapter?.title ||
          fileBook.toc.find((c) => c.slug === chapterSlug)?.title ||
          rapikan(chapterSlug),
        stepCount: fileChapter?.steps?.length ?? 0,
      }
    : null;

  try {
    const { data: bookRow } = await supabase
      .from("lingbook_books")
      .select("id,slug,title,accent,cover_glyph,toc")
      .eq("slug", bookSlug)
      .eq("published", true)
      .maybeSingle();
    if (bookRow) {
      const b = bookRow as {
        id: string;
        title: string;
        accent: string | null;
        cover_glyph: string | null;
        toc: ChapterSummary[] | null;
      };
      const dariToc = (b.toc ?? []).find((c) => c.slug === chapterSlug);
      const { data: chRow } = await supabase
        .from("lingbook_chapters")
        .select("label,title,steps")
        .eq("book_id", b.id)
        .eq("slug", chapterSlug)
        .eq("published", true)
        .maybeSingle();
      const ch = chRow as { label: string | null; title: string | null; steps: UnitStep[] | null } | null;
      meta = {
        bookTitle: b.title,
        accent: b.accent || "#1A9E9E",
        glyph: b.cover_glyph || b.title.charAt(0),
        chapterLabel:
          ch?.label || ch?.title || dariToc?.title || meta?.chapterLabel || rapikan(chapterSlug),
        stepCount: ch?.steps?.length ?? meta?.stepCount ?? 0,
      };
    }
  } catch {
    /* tabel CMS belum ada / offline — pakai lapisan file */
  }

  if (!meta) {
    // Buku hanya ada di DB yang gagal dibaca → tetap tampilkan sesuatu yang benar.
    return {
      bookTitle: rapikan(bookSlug),
      accent: "#1A9E9E",
      glyph: bookSlug.charAt(0).toUpperCase(),
      chapterLabel: rapikan(chapterSlug),
      stepCount: 0,
    };
  }
  return meta;
}
