"use client";

import type { LanguageCurriculum } from "@/data/curriculum";
import IllustratedCurriculum from "./IllustratedCurriculum";

export default function CurriculumViewer({ curriculum }: { curriculum: LanguageCurriculum }) {
  return <IllustratedCurriculum key={curriculum.meta.slug} curriculum={curriculum} />;
}
