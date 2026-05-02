import type { LanguageCurriculum } from "./types";
import english from "./data/english";
import japanese from "./data/japanese";
import greek from "./data/greek";
import spanish from "./data/spanish";
import french from "./data/french";
import german from "./data/german";
import ielts from "./data/ielts";
import toeflItp from "./data/toefl-itp";

const registry: Record<string, LanguageCurriculum> = {
  english,
  japanese,
  greek,
  spanish,
  french,
  german,
  ielts,
  "toefl-itp": toeflItp,
};

export function getCurriculum(slug: string): LanguageCurriculum | null {
  return registry[slug] ?? null;
}

export { languages, regionLabels, featuredLanguages, getLanguageBySlug } from "./languages";
export type * from "./types";
