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
import persian from "./data/persian";
import arabic from "./data/arabic";
import hebrew from "./data/hebrew";
import vietnamese from "./data/vietnamese";
import thai from "./data/thai";
import filipino from "./data/filipino";
import russian from "./data/russian";
import polish from "./data/polish";
import czech from "./data/czech";
import javanese from "./data/javanese";
import sundanese from "./data/sundanese";
import bipa from "./data/bipa";
import korean from "./data/korean"; // __PATCH_KOREAN_BUNDLE__
import mandarin from "./data/mandarin"; // __PATCH_MANDARIN_BUNDLE__
import portuguesePt from "./data/portuguese-pt"; // __PATCH_PORTUGUESE_PT_BUNDLE__
import portugueseBr from "./data/portuguese-br"; // __PATCH_PORTUGUESE_BR_BUNDLE__
import italian from "./data/italian"; // __PATCH_ITALIAN_BUNDLE__
import icelandic from "./data/icelandic"; // __PATCH_ICELANDIC_BUNDLE__
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
  persian,
  arabic,
  hebrew,
  vietnamese,
  thai,
  filipino,
  korean,
  mandarin,
  "portuguese-pt": portuguesePt,
  "portuguese-br": portugueseBr,
  italian,
  icelandic,
  finnish,
  swedish,
  norwegian,
  russian,
  polish,
  czech,
  javanese,
  sundanese,
  bipa,
};

export function getCurriculum(slug: string): LanguageCurriculum | null {
  return registry[slug] ?? null;
}

export { languages, regionLabels, featuredLanguages, getLanguageBySlug } from "./languages";
export type * from "./types";
