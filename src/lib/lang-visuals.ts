// [kelas-detail-page-v1] Helper visual bahasa (bendera, foto stok, glyph) — diekstrak
// dari src/app/akun/page.tsx supaya bisa dipakai bersama oleh beranda akun DAN halaman
// detail kelas /akun/kelas/[id]. Satu sumber: nambah bahasa cukup di sini.
//
// [reguler-english-conversation-v1] registrations.language kelas reguler isinya nama
// KELAS ("English - Conversation", kadang plus level & kode batch), bukan nama bahasa.
// Semua lookup di bawah dinormalkan dulu lewat baseLanguage() — tanpa itu bendera
// jatuh ke "un" & foto stok hilang untuk siswa reguler.
import { baseLanguage } from "./classLanguage";

export const LANG_FLAGS: Record<string, string> = {
  Arabic:"sa",Arab:"sa",Dutch:"nl",Belanda:"nl",English:"gb",Inggris:"gb",
  Hebrew:"il",Ibrani:"il",Italian:"it",Italia:"it",Japanese:"jp",Jepang:"jp",
  German:"de",Jerman:"de",Korean:"kr",Korea:"kr",Mandarin:"cn",Chinese:"cn",
  French:"fr",Prancis:"fr",Russian:"ru",Rusia:"ru",Spanish:"es",Spanyol:"es",
  Turkish:"tr",Turki:"tr",Thai:"th",Vietnamese:"vn",Hindi:"in",
  Portuguese:"br",Danish:"dk",Swedish:"se",Finnish:"fi",Polish:"pl",Czech:"cz",
  Greek:"gr",Yunani:"gr",Persian:"ir",Persia:"ir",Georgian:"ge",Norwegian:"no",
  Javanese:"id",Jawa:"id",Sundanese:"id",Sunda:"id",BIPA:"id",
  // [linguo-patch:onboarding-lang-catalog-v1] flag bahasa tambahan (lengkapi katalog Kelas Private)
  Hungarian:"hu",Romanian:"ro",Bulgarian:"bg",Ukrainian:"ua",Icelandic:"is",
  Cantonese:"hk",Filipino:"ph",Khmer:"kh",Lao:"la",Burmese:"mm",Urdu:"pk",
  Balinese:"id",Batak:"id",Bugis:"id",Madurese:"id",
  Uzbek:"uz",
};
export const getFlagUrl = (lang: string) => `https://flagcdn.com/w40/${LANG_FLAGS[baseLanguage(lang)] || "un"}.png`;

// Foto stok bahasa (drop file ke public/lang/<slug>.jpg). Alias ID & EN, case-insensitive.
// Kalau bahasa ga ke-map / file belum ada -> getLangPhoto balikin null -> kartu pakai fallback glyph.
export const LANG_PHOTO_SLUG: Record<string, string> = {
  inggris: "english-convo", english: "english-convo", "english conversation": "english-convo",
  jepang: "japanese", japanese: "japanese",
  prancis: "french", perancis: "french", french: "french",
  spanyol: "spanish", spanish: "spanish",
  korea: "korean", korean: "korean",
  jerman: "german", german: "german",
  arab: "arabic", "bahasa arab": "arabic", arabic: "arabic",
  italia: "italian", italian: "italian",
  vietnam: "vietnamese", vietnamese: "vietnamese",
  swahili: "swahili",
  rusia: "russian", russian: "russian",
  portugis: "portuguese", portuguese: "portuguese",
  hungaria: "hungarian", hungarian: "hungarian",
  mandarin: "mandarin", "mandarin (china)": "mandarin", china: "mandarin", chinese: "mandarin",
  hindi: "hindi",
  indonesia: "indonesian", indonesian: "indonesian", "bahasa indonesia": "indonesian",
  sunda: "sundanese", sundanese: "sundanese", "bahasa sunda": "sundanese",
  ibrani: "hebrew", hebrew: "hebrew",
  "mesir kuno": "ancient-egypt", "ancient egypt": "ancient-egypt", hieroglif: "ancient-egypt",
  // [kelas-card-foto-v2] Bahasa yang tadinya jatuh ke glyph "Aa" di kartu beranda
  // (kasus nyata: kelas Private Wendy/Michael — Bulgarian, Polish, Georgian).
  bulgaria: "bulgarian", bulgarian: "bulgarian",
  polandia: "polish", polish: "polish",
  georgia: "georgian", georgian: "georgian",
  kanton: "cantonese", kantonis: "cantonese", cantonese: "cantonese", "hong kong": "cantonese",
  uzbekistan: "uzbek", uzbek: "uzbek",
  // [kelas-card-foto-v3] Islandia — kartu beranda siswa masih jatuh ke glyph "Aa"
  islandia: "icelandic", icelandic: "icelandic", "bahasa islandia": "icelandic",
  // [pustaka-foto-bahasa-v1] Katalog Perpustakaan (digital_products) punya 28 bahasa,
  // 11 di antaranya masih jatuh ke gradien + glyph karena belum ada foto stoknya.
  // Foto baru masuk ke public/lang/<slug>.jpg dengan ukuran seragam 900x900.
  turki: "turkish", turkish: "turkish", turkey: "turkish",
  ukraina: "ukrainian", ukraine: "ukrainian", ukrainian: "ukrainian",
  belanda: "dutch", dutch: "dutch",
  estonia: "estonian", estonian: "estonian",
  norwegia: "norwegian", norway: "norwegian", norwegian: "norwegian",
  swedia: "swedish", swedish: "swedish",
  finlandia: "finnish", finland: "finnish", finnish: "finnish",
  serbia: "serbian", serbian: "serbian",
  yunani: "greek", greek: "greek", greece: "greek",
  thai: "thai", thailand: "thai",
  tagalog: "filipino", filipina: "filipino", filipino: "filipino",
};
export const getLangPhoto = (lang?: string | null): string | null => {
  if (!lang) return null;
  const slug = LANG_PHOTO_SLUG[baseLanguage(lang).toLowerCase()];
  return slug ? `/lang/${slug}.jpg` : null;
};

// Glyph aksara buat kartu bahasa yang belum punya foto stok.
export const langGlyph = (lang: string): string => {
  const g: Record<string, string> = {
    Jepang: "あ", Japanese: "あ", Korea: "한", Korean: "한",
    Mandarin: "中", Chinese: "中", Arab: "ع", Arabic: "ع",
    Rusia: "Я", Russian: "Я", Thai: "ก", Ibrani: "א", Hebrew: "א",
    Yunani: "Ω", Greek: "Ω", Hindi: "ह", Persia: "ف", Persian: "ف",
  };
  return g[baseLanguage(lang)] || "Aa";
};
