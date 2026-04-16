import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurriculum, languages } from "@/data/curriculum";
import PlacementTest from "./PlacementTest";
import { englishPlacementTest } from "@/data/placement/english";

type Props = { params: Promise<{ lang: string }> };

export async function generateStaticParams() {
  // Only english has test data for now
  return [{ lang: "english" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const c = getCurriculum(lang);
  const name = c?.meta.name || "Bahasa";
  return {
    title: `Placement Test Bahasa ${name} Gratis — Linguo.id`,
    description: `Tes level Bahasa ${name} kamu secara GRATIS. 15 soal, 2 menit. Dapatkan hasil personal + rekomendasi chapter.`,
  };
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  const curriculum = getCurriculum(lang);
  if (!curriculum || lang !== "english") {
    notFound();
  }
  return <PlacementTest curriculum={curriculum} questions={englishPlacementTest} />;
}
