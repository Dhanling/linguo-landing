import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { displayLangTitle, getCurriculum, languages } from "@/data/curriculum";
import CurriculumViewer from "./CurriculumViewer";

type Props = { params: Promise<{ lang: string }> };

export async function generateStaticParams() {
  return languages.filter((l) => l.available).map((l) => ({ lang: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const c = getCurriculum(lang);
  if (!c) return { title: "Silabus tidak ditemukan | Linguo.id" };
  const title = displayLangTitle(c.meta);
  return {
    title: `Silabus ${title} — A1 sampai B2 | Linguo.id`,
    description: `Kurikulum lengkap ${title} di Linguo.id: 192 sesi, 4 level CEFR. ${c.overview}`,
    alternates: { canonical: `https://linguo.id/silabus/${lang}` },
    openGraph: {
      title: `Silabus ${title} — Linguo.id`,
      description: c.overview,
      type: "website",
    },
  };
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  const curriculum = getCurriculum(lang);
  if (!curriculum) notFound();
  return <CurriculumViewer curriculum={curriculum} />;
}
