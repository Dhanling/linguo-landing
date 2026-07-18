// [lingbook-phase1-v1] Registri buku + helper resolusi. Phase 1: data mock,
// nanti diganti fetch dari Supabase tanpa mengubah tipe.
import type { Book, Chapter, Token, Word } from "./types";
import { jaHajime } from "./ja-hajime";
import { esPaso } from "./es-paso";

export * from "./types";

export const BOOKS: Book[] = [jaHajime, esPaso];

export function getBook(slug: string): Book | undefined {
  return BOOKS.find((b) => b.slug === slug);
}

export function getChapter(bookSlug: string, chapterSlug: string): { book: Book; chapter: Chapter } | undefined {
  const book = getBook(bookSlug);
  if (!book) return undefined;
  const chapter = book.chapters.find((c) => c.slug === chapterSlug);
  if (!chapter) return undefined;
  return { book, chapter };
}

/** Resolusi token jadi kata (bila `ref`) atau null (bila tanda baca/literal). */
export function resolveWord(token: Token, glossary: Record<string, Word>): Word | null {
  if ("ref" in token) return glossary[token.ref] ?? null;
  return null;
}

/** Teks apa adanya dari token (untuk TTS / plain text). */
export function tokenSurface(token: Token, glossary: Record<string, Word>): string {
  if ("ref" in token) return glossary[token.ref]?.surface ?? token.ref;
  return token.text;
}

/** Gabung token jadi kalimat mentah — spasi untuk skrip Latin, tanpa spasi untuk CJK. */
export function tokensToText(tokens: Token[], glossary: Record<string, Word>, script: string): string {
  const sep = script === "latin" || script === "cyrillic" ? " " : "";
  return tokens
    .map((tk) => tokenSurface(tk, glossary))
    .join(sep)
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([¡¿])\s+/g, "$1")
    .trim();
}
