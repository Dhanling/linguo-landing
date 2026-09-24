// Peta slug -> bank soal CEFR placement test. HANYA diimpor dari server (page.tsx)
// supaya bank soal semua bahasa tidak ikut ke bundle browser.
import type { Question as PlacementQuestion } from "@/data/placement/english";
import { englishPlacementTest } from "@/data/placement/english";
import { japanesePlacementTest } from "@/data/placement/japanese";
// linguo-patch:placement-asia-v1 — 10 bahasa Asia "SEGERA" dapat placement test CEFR
import { koreanPlacementTest } from "@/data/placement/korean";
import { mandarinPlacementTest } from "@/data/placement/mandarin";
import { cantonesePlacementTest } from "@/data/placement/cantonese";
import { vietnamesePlacementTest } from "@/data/placement/vietnamese";
import { thaiPlacementTest } from "@/data/placement/thai";
import { filipinoPlacementTest } from "@/data/placement/filipino";
import { khmerPlacementTest } from "@/data/placement/khmer";
import { burmesePlacementTest } from "@/data/placement/burmese";
import { hindiPlacementTest } from "@/data/placement/hindi";
import { urduPlacementTest } from "@/data/placement/urdu";
// linguo-patch:placement-europe-v1 — 21 bahasa Eropa "SEGERA" dapat placement test CEFR
import { germanPlacementTest } from "@/data/placement/german";
import { frenchPlacementTest } from "@/data/placement/french";
import { spanishPlacementTest } from "@/data/placement/spanish";
import { italianPlacementTest } from "@/data/placement/italian";
import { dutchPlacementTest } from "@/data/placement/dutch";
import { greekPlacementTest } from "@/data/placement/greek";
import { portugueseBrPlacementTest } from "@/data/placement/portuguese-br";
import { portuguesePtPlacementTest } from "@/data/placement/portuguese-pt";
import { swedishPlacementTest } from "@/data/placement/swedish";
import { norwegianPlacementTest } from "@/data/placement/norwegian";
import { danishPlacementTest } from "@/data/placement/danish";
import { icelandicPlacementTest } from "@/data/placement/icelandic";
import { irishPlacementTest } from "@/data/placement/irish"; // linguo-patch:placement-irish-v1
import { bosnianPlacementTest } from "@/data/placement/bosnian"; // linguo-patch:placement-bosnian-v1
import { finnishPlacementTest } from "@/data/placement/finnish";
import { hungarianPlacementTest } from "@/data/placement/hungarian";
import { turkishPlacementTest } from "@/data/placement/turkish";
import { romanianPlacementTest } from "@/data/placement/romanian";
import { russianPlacementTest } from "@/data/placement/russian";
import { ukrainianPlacementTest } from "@/data/placement/ukrainian";
import { bulgarianPlacementTest } from "@/data/placement/bulgarian";
import { polishPlacementTest } from "@/data/placement/polish";
import { czechPlacementTest } from "@/data/placement/czech";
// linguo-patch:placement-all-v1 — sisa bahasa "SEGERA" (Timur Tengah, Nusantara, Asia Selatan,
// Afrika, Klasik/Lainnya) dapat placement test CEFR — picker gak punya "Segera" lagi
import { arabicPlacementTest } from "@/data/placement/arabic";
import { hebrewPlacementTest } from "@/data/placement/hebrew";
import { persianPlacementTest } from "@/data/placement/persian";
import { kurdishPlacementTest } from "@/data/placement/kurdish";
import { armenianPlacementTest } from "@/data/placement/armenian";
import { javanesePlacementTest } from "@/data/placement/javanese";
import { sundanesePlacementTest } from "@/data/placement/sundanese";
import { betawiPlacementTest } from "@/data/placement/betawi";
import { bipaPlacementTest } from "@/data/placement/bipa";
import { balinesePlacementTest } from "@/data/placement/balinese";
import { minangkabauPlacementTest } from "@/data/placement/minangkabau";
import { batakPlacementTest } from "@/data/placement/batak";
import { bugisPlacementTest } from "@/data/placement/bugis";
import { acehnesePlacementTest } from "@/data/placement/acehnese";
import { banjarPlacementTest } from "@/data/placement/banjar";
import { maduresePlacementTest } from "@/data/placement/madurese";
import { laoPlacementTest } from "@/data/placement/lao";
import { bengaliPlacementTest } from "@/data/placement/bengali";
import { tamilPlacementTest } from "@/data/placement/tamil";
import { punjabiPlacementTest } from "@/data/placement/punjabi";
import { nepaliPlacementTest } from "@/data/placement/nepali";
import { mongolianPlacementTest } from "@/data/placement/mongolian";
import { swahiliPlacementTest } from "@/data/placement/swahili";
import { zuluPlacementTest } from "@/data/placement/zulu";
import { yorubaPlacementTest } from "@/data/placement/yoruba";
import { amharicPlacementTest } from "@/data/placement/amharic";
import { georgianPlacementTest } from "@/data/placement/georgian";
import { latinPlacementTest } from "@/data/placement/latin";
import { esperantoPlacementTest } from "@/data/placement/esperanto";

export const CEFR_QUESTIONS: Record<string, PlacementQuestion[]> = {
  english: englishPlacementTest,
  japanese: japanesePlacementTest,
  korean: koreanPlacementTest,
  mandarin: mandarinPlacementTest,
  cantonese: cantonesePlacementTest,
  vietnamese: vietnamesePlacementTest,
  thai: thaiPlacementTest,
  filipino: filipinoPlacementTest,
  khmer: khmerPlacementTest,
  burmese: burmesePlacementTest,
  hindi: hindiPlacementTest,
  urdu: urduPlacementTest,
  // linguo-patch:placement-europe-v1
  german: germanPlacementTest,
  french: frenchPlacementTest,
  spanish: spanishPlacementTest,
  italian: italianPlacementTest,
  dutch: dutchPlacementTest,
  greek: greekPlacementTest,
  "portuguese-br": portugueseBrPlacementTest,
  "portuguese-pt": portuguesePtPlacementTest,
  swedish: swedishPlacementTest,
  norwegian: norwegianPlacementTest,
  danish: danishPlacementTest,
  icelandic: icelandicPlacementTest,
  irish: irishPlacementTest,
  bosnian: bosnianPlacementTest,
  finnish: finnishPlacementTest,
  hungarian: hungarianPlacementTest,
  turkish: turkishPlacementTest,
  romanian: romanianPlacementTest,
  russian: russianPlacementTest,
  ukrainian: ukrainianPlacementTest,
  bulgarian: bulgarianPlacementTest,
  polish: polishPlacementTest,
  czech: czechPlacementTest,
  // linguo-patch:placement-all-v1
  arabic: arabicPlacementTest,
  hebrew: hebrewPlacementTest,
  persian: persianPlacementTest,
  kurdish: kurdishPlacementTest,
  armenian: armenianPlacementTest,
  javanese: javanesePlacementTest,
  sundanese: sundanesePlacementTest,
  betawi: betawiPlacementTest,
  bipa: bipaPlacementTest,
  balinese: balinesePlacementTest,
  minangkabau: minangkabauPlacementTest,
  batak: batakPlacementTest,
  bugis: bugisPlacementTest,
  acehnese: acehnesePlacementTest,
  banjar: banjarPlacementTest,
  madurese: maduresePlacementTest,
  lao: laoPlacementTest,
  bengali: bengaliPlacementTest,
  tamil: tamilPlacementTest,
  punjabi: punjabiPlacementTest,
  nepali: nepaliPlacementTest,
  mongolian: mongolianPlacementTest,
  swahili: swahiliPlacementTest,
  zulu: zuluPlacementTest,
  yoruba: yorubaPlacementTest,
  amharic: amharicPlacementTest,
  georgian: georgianPlacementTest,
  latin: latinPlacementTest,
  esperanto: esperantoPlacementTest,
};
