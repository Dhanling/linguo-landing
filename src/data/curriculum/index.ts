import type { LanguageCurriculum } from "./types";
import english from "./data/english";
import japanese from "./data/japanese";
import greek from "./data/greek";
import spanish from "./data/spanish";
import french from "./data/french";
import german from "./data/german";
import danish from "./data/danish"; // __PATCH_DANISH_REGISTRY__
import ielts from "./data/ielts";
import toeflItp from "./data/toefl-itp";
import finnish from "./data/finnish"; // __PATCH_FINNISH_BUNDLE__
import swedish from "./data/swedish"; // __PATCH_SWEDISH_BUNDLE__
import norwegian from "./data/norwegian"; // __PATCH_NORWEGIAN_BUNDLE__

const registry: Record<string, LanguageCurriculum> = {
  english,
  japanese,
  greek,
  spanish,
  french,
  german,
  danish,
  ielts,
  "toefl-itp": toeflItp,
  finnish,
  swedish,
  norwegian,
};

export function getCurriculum(slug: string): LanguageCurriculum | null {
  return registry[slug] ?? null;
}

export { languages, regionLabels, featuredLanguages, getLanguageBySlug } from "./languages";
export type * from "./types";
