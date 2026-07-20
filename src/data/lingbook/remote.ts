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
