// langAlias — nama Indonesia / kata cari untuk bahasa yang di daftar harga &
// wizard trial ditulis dengan nama Inggris.
//
// [linguo-patch:lang-alias-search-v1] Pemicunya: calon siswa bertanya "kelas
// mesir kuno ada kak?", padahal kelasnya ADA — di daftar tertulis "Ancient
// Egyptian", jadi mengetik "mesir" di kolom cari tidak memunculkan apa pun dan
// bahasanya terlihat seolah tidak dijual. Alias di sini hanya dipakai untuk
// PENCARIAN; label yang tampil di kartu tidak berubah.
export const LANG_SEARCH_ALIAS: Record<string, string[]> = {
  "Ancient Egyptian": ["mesir kuno", "mesir", "hieroglif", "hieroglyph", "egypt"],
  Latin: ["latin", "bahasa latin", "klasik"],
  Esperanto: ["esperanto", "bahasa buatan"],
  "Sign Language": ["bahasa isyarat", "isyarat", "bisindo", "tuli"],
  "BIPA (Indonesian for Foreigners)": ["bipa", "indonesia", "indonesian"],
  English: ["inggris"],
  "English British": ["inggris british", "british"],
  Korean: ["korea"],
  Japanese: ["jepang"],
  Mandarin: ["mandarin", "china", "cina", "tiongkok"],
  "Traditional Chinese": ["mandarin tradisional", "china tradisional", "taiwan"],
  Cantonese: ["kanton", "hongkong", "hong kong"],
  French: ["prancis", "perancis"],
  German: ["jerman"],
  Arabic: ["arab"],
  Spanish: ["spanyol"],
  Italian: ["italia"],
  Russian: ["rusia"],
  Dutch: ["belanda"],
  Thai: ["thailand"],
  Portuguese: ["portugis", "brasil", "brazil"],
  Vietnamese: ["vietnam"],
  Turkish: ["turki"],
  Polish: ["polandia"],
  Swedish: ["swedia"],
  Czech: ["ceko"],
  Finnish: ["finlandia"],
  Greek: ["yunani"],
  Romanian: ["rumania"],
  Tagalog: ["filipina", "filipino"],
  Norwegian: ["norwegia"],
  Danish: ["denmark"],
  Hebrew: ["ibrani", "israel"],
  Hungarian: ["hungaria"],
  Malay: ["melayu", "malaysia"],
  Urdu: ["pakistan"],
  Khmer: ["kamboja"],
  Farsi: ["persia", "iran", "farsi"],
  Uzbek: ["uzbekistan"],
  Serbian: ["serbia"],
  Estonian: ["estonia"],
  Swahili: ["swahili", "kenya"],
  Georgian: ["georgia"],
  Irish: ["irlandia"],
  Kurdish: ["kurdi"],
  Javanese: ["jawa"],
  Sundanese: ["sunda"],
  Balinese: ["bali"],
  Madurese: ["madura"],
  Hindi: ["india"],
};

/** Cocokkan query pencarian ke nama bahasa ATAU alias Indonesianya. */
export function matchesLangQuery(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (name.toLowerCase().includes(q)) return true;
  return (LANG_SEARCH_ALIAS[name] || []).some((a) => a.includes(q));
}
