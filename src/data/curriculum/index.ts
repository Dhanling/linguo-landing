import type { LanguageCurriculum } from "./types";
import english from "./data/english";

const registry: Record<string, LanguageCurriculum> = {
  english,
};

export function getCurriculum(slug: string): LanguageCurriculum | null {
  return registry[slug] ?? null;
}

export { languages, regionLabels, featuredLanguages, getLanguageBySlug } from "./languages";
export type * from "./types";
