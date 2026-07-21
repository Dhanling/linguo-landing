// [lingbook-cms] Ekspor buku file bawaan (src/data/lingbook/*) sebagai baris
// siap-DB, agar CMS admin bisa "Impor dari file" → konten awal (Jepang & Spanyol)
// muncul di dashboard & tersinkron ke tabel. Snake_case mengikuti kolom DB.
import { NextResponse } from "next/server";
import { BOOKS } from "@/data/lingbook";
import { corsHeaders } from "../_cors";

export const runtime = "nodejs";

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function GET(req: Request) {
  const books = BOOKS.map((b, bi) => ({
    slug: b.slug,
    title: b.title,
    language: b.language,
    level: b.level ?? "",
    description: b.description ?? null,
    accent: b.accent ?? null,
    cover_glyph: b.coverGlyph ?? null,
    chapter_count: b.chapterCount ?? (b.toc?.length ?? 0),
    toc: b.toc ?? [],
    sort: bi,
    published: true,
    chapters: (b.chapters ?? []).map((c, ci) => ({
      slug: c.slug,
      label: c.label ?? "",
      title: c.title ?? "",
      subtitle: c.subtitle ?? null,
      meta: c.meta ?? null,
      glossary: c.glossary ?? {},
      blocks: c.blocks ?? [],
      steps: c.steps ?? [],
      objectives: c.objectives ?? [],
      vocab_refs: c.vocabRefs ?? [],
      grammar_points: c.grammarPoints ?? [],
      exercises: c.exercises ?? [],
      test: c.test ?? [],
      roleplay: c.roleplay ?? [],
      sort: ci,
      published: true,
    })),
  }));

  return NextResponse.json({ books }, { headers: corsHeaders(req.headers.get("origin")) });
}
