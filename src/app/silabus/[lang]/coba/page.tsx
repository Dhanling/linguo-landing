import { getCurriculum, getLanguageBySlug, resolveLanguageSlug } from "@/data/curriculum";
import { CEFR_QUESTIONS } from "./cefrQuestions";
import CobaClient from "./CobaClient";

type Props = { params: Promise<{ lang: string }> };

// linguo-patch:placement-bundle-ramping-v1 — pilih bank soal + meta bahasa di server,
// kirim ke klien cuma data bahasa yang dibuka.
export default async function PlacementTestPage({ params }: Props) {
  const { lang: raw } = await params;
  // linguo-patch:silabus-alias-redirect-v1 — /silabus/melayu/coba dulu diam-diam
  // jatuh ke placement TOEFL ITP karena "melayu" bukan slug. Samakan dulu ke kanonik.
  const lang = resolveLanguageSlug(raw) ?? raw;
  const questions = CEFR_QUESTIONS[lang] ?? null;
  // linguo-patch:placement-all-v1 — <PlacementTest/> cuma pakai curriculum.meta,
  // jadi kirim stub (overview/levels kosong) — bukan seluruh silabus.
  const meta = questions ? getCurriculum(lang)?.meta ?? getLanguageBySlug(lang) : undefined;
  const curriculum = meta ? { meta, overview: "", levels: [] } : null;
  return <CobaClient curriculum={curriculum} questions={curriculum ? questions : null} />;
}
