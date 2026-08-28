import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { displayLangTitle, getCurriculum, languages, resolveLanguageSlug } from "@/data/curriculum";
import CurriculumViewer from "./CurriculumViewer";

type Props = { params: Promise<{ lang: string }> };

const totalSessions = (c: { levels: { sublevels: { sessions: unknown[] }[] }[] }) =>
  c.levels.reduce((n, l) => n + l.sublevels.reduce((m, s) => m + s.sessions.length, 0), 0);

export async function generateStaticParams() {
  return languages.filter((l) => l.available).map((l) => ({ lang: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  // linguo-patch:silabus-alias-redirect-v1 — alias dilayani dengan kanonik di canonical-nya
  const slug = resolveLanguageSlug(lang) ?? lang;
  const c = getCurriculum(slug);
  if (!c) return { title: "Silabus tidak ditemukan | Linguo.id" };
  const title = displayLangTitle(c.meta);
  return {
    title: `Silabus ${title} — A1 sampai B2 | Linguo.id`,
    // linguo-patch:silabus-jumlah-sesi-v1 — dulu "192 sesi" ditulis tetap, padahal
    // tiap bahasa beda jumlah sublevelnya (ada yang 192, ada yang 304). Hitung saja.
    description: `Kurikulum lengkap ${title} di Linguo.id: ${totalSessions(c)} sesi, 4 level CEFR. ${c.overview}`,
    alternates: { canonical: `https://linguo.id/silabus/${slug}` },
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
  if (!curriculum) {
    // linguo-patch:silabus-alias-redirect-v1 — "melayu" → "malay", "tagalog" → "filipino".
    // Sengaja redirect sementara (307), bukan 308: 308 nempel di cache browser dan
    // susah dicabut kalau suatu saat alias-nya jadi slug beneran.
    const slug = resolveLanguageSlug(lang);
    if (slug && slug !== lang) redirect(`/silabus/${slug}`);
    notFound();
  }
  return <CurriculumViewer curriculum={curriculum} />;
}
