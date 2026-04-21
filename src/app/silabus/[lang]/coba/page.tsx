import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurriculum } from "@/data/curriculum";
import PlacementTest from "./PlacementTest";
import { englishPlacementTest } from "@/data/placement/english";
import { japanesePlacementTest } from "@/data/placement/japanese";

type Props = { params: Promise<{ lang: string }> };

// ─── Registry: bahasa yang sudah punya placement test ────────────────────────
const PLACEMENT_TESTS: Record<string, typeof englishPlacementTest> = {
  english: englishPlacementTest,
  japanese: japanesePlacementTest,
};

export async function generateStaticParams() {
  return Object.keys(PLACEMENT_TESTS).map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const c = getCurriculum(lang);
  const name = c?.meta.name || "Bahasa";
  return {
    title: "Placement Test Bahasa " + name + " Gratis | Linguo.id",
    description: "Tes level Bahasa " + name + " kamu GRATIS. 15+ soal interaktif (multiple choice, drag-drop, matching). Hasil personal + rekomendasi chapter.",
  };
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  const curriculum = getCurriculum(lang);
  const questions = PLACEMENT_TESTS[lang];
  if (!curriculum || !questions) notFound();
  return <PlacementTest curriculum={curriculum} questions={questions} />;
}
