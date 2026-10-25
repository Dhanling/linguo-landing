// Satu latar Imagegen per bahasa, khusus slide isi A1.1.
export const BAHASA_LATAR_A11: readonly string[] = [
  "japanese",
  "korean",
  "cantonese",
  "hindi",
  "thai",
  "vietnamese",
  "filipino",
  "khmer",
  "urdu",
  "malay",
  "arabic",
  "hebrew",
  "persian",
  "french",
  "georgian",
  "greek",
  "russian",
  "swedish",
  "norwegian",
  "danish",
  "finnish",
  "polish",
  "hungarian",
  "romanian",
  "turkish",
  "bulgarian",
  "ukrainian",
  "icelandic",
  "bosnian",
  "portuguese-br",
  "bipa",
  "javanese",
  "sundanese",
  "batak",
  "bugis",
  "swahili"
];
const ADA = new Set(BAHASA_LATAR_A11);

export function imagegenA11BodyBackground(deckKey: string): string | null {
  const cocok = /^([a-z-]+)-a1-1$/.exec(deckKey);
  return cocok && ADA.has(cocok[1]) ? `/slide-cover/${cocok[1]}-a1-1-latar-imagegen-v1.jpg` : null;
}
