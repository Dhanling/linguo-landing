import type { LanguageCurriculum } from "./types";
import english from "./data/english";
import japanese from "./data/japanese";
import greek from "./data/greek";

const registry: Record<string, LanguageCurriculum> = {
  english,
  japanese,
  greek,
};

export function getCurriculum(slug: string): LanguageCurriculum | null {
  return registry[slug] ?? null;
}

export { languages, regionLabels, featuredLanguages, getLanguageBySlug } from "./languages";
export type * from "./types";
