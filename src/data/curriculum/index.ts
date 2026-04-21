import type { LanguageCurriculum } from "./types";
import english from "./data/english";
import japanese from "./data/japanese";

const registry: Record<string, LanguageCurriculum> = {
  english,
  japanese,
};

export function getCurriculum(slug: string): LanguageCurriculum | null {
  return registry[slug] ?? null;
}

export { languages, regionLabels, featuredLanguages, getLanguageBySlug } from "./languages";
export type * from "./types";
