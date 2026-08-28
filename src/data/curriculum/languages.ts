// __PATCH_KOREAN_BUNDLE__
// __PATCH_MANDARIN_BUNDLE__
// __PATCH_JAPANESE_BUNDLE__
import type { LanguageMeta } from "./types";

export const languages: LanguageMeta[] = [
  // === FEATURED / Priority ===
  { slug: "english",    name: "Inggris",   nativeName: "English",     flag: "🇬🇧", region: "european",       featured: true, available: true,  description: "Bahasa internasional — dari A1 sampai B2, TOEFL & IELTS ready.", aliases: ["inggris","english","british"] },
  { slug: "ielts",      name: "IELTS",     nativeName: "IELTS",       flag: "🎓", region: "european",       featured: true, available: true,  description: "Persiapan IELTS Academic intensif — target Band 6.5–7.0 dalam 64 sesi." },
  { slug: "toefl-itp",  name: "TOEFL ITP", nativeName: "TOEFL ITP",   flag: "📝", region: "european",       featured: true, available: true,  description: "Persiapan TOEFL ITP intensif — target skor 500–550+ dalam 64 sesi." },
  { slug: "japanese",   name: "Jepang",    nativeName: "日本語",       flag: "🇯🇵", region: "asian",          featured: true, available: true, description: "Hiragana, Katakana, Kanji — dari nol sampai JLPT.", aliases: ["jepang","nihongo","jlpt"] },
  { slug: "korean",     name: "Korea",     nativeName: "한국어",       flag: "🇰🇷", region: "asian",          featured: true, available: true, description: "Hangul, tata bahasa Korea, TOPIK ready.", aliases: ["korea","hangul","topik"] },
  { slug: "mandarin",   name: "Mandarin",  nativeName: "中文",         flag: "🇨🇳", region: "asian",          featured: true, available: true, description: "Pinyin, Hanzi, HSK — metode Linguo untuk pemula.", aliases: ["china","cina","tionghoa","chinese","hsk","pinyin"] },
  { slug: "spanish",    name: "Spanyol",   nativeName: "Español",     flag: "🇪🇸", region: "european",       featured: true, available: true,  description: "Bahasa 500 juta penutur di Eropa & Amerika Latin." },
  { slug: "french",     name: "Prancis",   nativeName: "Français",    flag: "🇫🇷", region: "european",       featured: true, available: true,  description: "DELF/DALF prep, budaya Prancis, percakapan sehari-hari." },
  { slug: "german",     name: "Jerman",    nativeName: "Deutsch",     flag: "🇩🇪", region: "european",       featured: true, available: true,  description: "Goethe A1–B2, persiapan studi di Jerman.", aliases: ["jerman","deutsch","goethe"] },
  { slug: "italian",    name: "Italia",    nativeName: "Italiano",    flag: "🇮🇹", region: "european",       featured: true, available: true, description: "Dari ciao sampai conversazione — CILS ready." }, // __PATCH_ITALIAN_BUNDLE__
  { slug: "arabic",     name: "Arab",      nativeName: "العربية",      flag: "🇸🇦", region: "middle-eastern", featured: true, available: true,  description: "Fusha & Ammiyah, untuk agama, studi, atau karier.", aliases: ["arab","fusha","ammiyah"] },
  { slug: "hebrew",     name: "Ibrani",    nativeName: "עברית",        flag: "🇮🇱", region: "middle-eastern", featured: true, available: true,  description: "Modern Hebrew dengan fokus percakapan & literasi.", aliases: ["israel","ivrit"] },
  { slug: "persian",    name: "Persia",    nativeName: "فارسی",        flag: "🇮🇷", region: "middle-eastern", featured: true, available: true,  description: "Farsi — bahasa sastra Rumi, puisi klasik & modern.", aliases: ["farsi","iran","parsi"] },
  { slug: "javanese",   name: "Jawa",      nativeName: "Basa Jawa",   flag: "🇮🇩", region: "nusantara",      featured: true, available: true, description: "Ngoko, Krama, Krama Inggil — filosofi Jawa lengkap.", aliases: ["jawa","hanacaraka"] },
  { slug: "sundanese",  name: "Sunda",     nativeName: "Basa Sunda",  flag: "🇮🇩", region: "nusantara",      featured: true, available: true, description: "Loma, Lemes — bahasa Pasundan autentik.", aliases: ["sunda","pasundan"] },
  { slug: "betawi",     name: "Betawi",    nativeName: "Basa Betawi", flag: "🇮🇩", region: "nusantara",      featured: true, available: true, description: "Dialek Jakarta autentik — logat, kosakata & budaya Betawi.", aliases: ["jakarta","batavia","betawi"] },
  { slug: "bipa",       name: "BIPA",      nativeName: "Bahasa Indonesia", flag: "🇮🇩", region: "nusantara", featured: true, available: true, description: "Bahasa Indonesia untuk Penutur Asing — BIPA resmi.", aliases: ["indonesia","bahasa indonesia","indonesian"] },
  { slug: "georgian",   name: "Georgia",   nativeName: "ქართული",      flag: "🇬🇪", region: "other",          featured: true, available: true, description: "Kartuli — bahasa unik dengan aksara sendiri." },
  { slug: "greek",      name: "Yunani",    nativeName: "Ελληνικά",     flag: "🇬🇷", region: "european",       featured: true, available: true,  description: "Aksara Yunani 24 huruf, dari nol sampai sastra Καβάφης & filsafat klasik.", aliases: ["yunani","greece"] },

  // === European ===
  { slug: "portuguese-pt", name: "Portugis (Portugal)", nativeName: "Português Europeu", flag: "🇵🇹", region: "european", available: true, description: "Fado, Lisboa, Camões, Pessoa, Saramago — Português Europeu com CAPLE prep (DIPLE B2 / DAPLE C1).", aliases: ["portugal","portugis","lisbon"] }, // __PATCH_PORTUGUESE_PT_BUNDLE__
  { slug: "portuguese-br", name: "Portugis (Brasil)", nativeName: "Português Brasileiro", flag: "🇧🇷", region: "european", available: true, description: "Bossa nova, samba, futebol, telenovela — Português brasileiro com Celpe-Bras ready.", aliases: ["brasil","brazil","portugis"] }, // __PATCH_PORTUGUESE_BR_BUNDLE__
  { slug: "dutch",      name: "Belanda",   nativeName: "Nederlands",  flag: "🇳🇱", region: "european", available: true, aliases: ["belanda","nederland","holland"] },
  { slug: "russian",    name: "Rusia",     nativeName: "Русский",     flag: "🇷🇺", region: "european", available: true },
  { slug: "swedish",    name: "Swedia",    nativeName: "Svenska",     flag: "🇸🇪", region: "european", available: true,  description: "Bahasa Skandinavia (Svenska) — alfabet å ä ö, notorious sj-sound, pitch accent, hen pronoun (resmi 2015), 2 gender en/ett, supinum unik. Tisus, SFI A-D, Swedex ready." }, // __PATCH_SWEDISH_BUNDLE__
  { slug: "norwegian",  name: "Norwegia",  nativeName: "Norsk",       flag: "🇳🇴", region: "european", available: true,  description: "Bahasa Skandinavia (Bokmål) — pitch accent Tone 1/2, decimal counting, tata bahasa mirip Denmark dengan ortografi lebih intuitif. Norskprøven & Bergenstest ready." }, // __PATCH_NORWEGIAN_BUNDLE__
  { slug: "danish",     name: "Denmark",   nativeName: "Dansk",       flag: "🇩🇰", region: "european", available: true,  description: "Dari nol sampai Prøve i Dansk 3 — alfabet 29 huruf (æ ø å), stød, hygge & janteloven." }, // __PATCH_DANISH_AVAILABLE__
  { slug: "finnish",    name: "Finlandia", nativeName: "Suomi",       flag: "🇫🇮", region: "european", available: true,  description: "Bahasa Uralic (Finno-Ugric) — BUKAN Indo-European! 15 grammatical cases, vowel harmony, agglutinative morphology, no articles, no gender pronouns (hän = he/she). YKI levels 1-6, level 3 = kewarganegaraan." }, // __PATCH_FINNISH_BUNDLE__
  { slug: "polish",     name: "Polandia",  nativeName: "Polski",      flag: "🇵🇱", region: "european", available: true },
  { slug: "czech",      name: "Ceko",      nativeName: "Čeština",     flag: "🇨🇿", region: "european", available: true },
  { slug: "hungarian",  name: "Hungaria",  nativeName: "Magyar",      flag: "🇭🇺", region: "european", available: true },
  { slug: "romanian",   name: "Rumania",   nativeName: "Română",      flag: "🇷🇴", region: "european", available: true },
  { slug: "turkish",    name: "Turki",     nativeName: "Türkçe",      flag: "🇹🇷", region: "european", available: true },
  { slug: "bulgarian",  name: "Bulgaria",  nativeName: "Български",   flag: "🇧🇬", region: "european", available: true },
  { slug: "ukrainian",  name: "Ukraina",   nativeName: "Українська",  flag: "🇺🇦", region: "european", available: true },
  { slug: "icelandic",  name: "Islandia",  nativeName: "Íslenska",    flag: "🇮🇸", region: "european", available: true,  description: "Bahasa Skandinavia paling archaic — preserve Old Norse paling lengkap (native bisa BACA Sagas abad ke-13!). 32 huruf incl þ thorn + ð eth, 4 cases, 3 genders, subjunctive preserved, patronymic naming (no surnames), language purism aggressive. Próf í íslensku + citizenship track ready." }, // __PATCH_ICELANDIC_BUNDLE__

  // === Asian ===
  { slug: "cantonese",  name: "Kanton",    nativeName: "廣東話",       flag: "🇭🇰", region: "asian", available: true, aliases: ["kanton","cantonese","hongkong","hong kong","macau","guangzhou","jyutping"] },
  { slug: "vietnamese", name: "Vietnam",   nativeName: "Tiếng Việt",  flag: "🇻🇳", region: "asian", available: true },
  { slug: "thai",       name: "Thailand",  nativeName: "ภาษาไทย",     flag: "🇹🇭", region: "asian", available: true },
  { slug: "filipino",   name: "Filipina",  nativeName: "Tagalog",     flag: "🇵🇭", region: "asian", available: true, aliases: ["tagalog","filipina","philippines","pinoy"] },
  { slug: "malay",      name: "Melayu",    nativeName: "Bahasa Melayu", flag: "🇲🇾", region: "asian", available: true, description: "Bahasa rasmi Malaysia, Brunei & Singapura — sebutan baku, imbuhan, Jawi & MUET ready.", aliases: ["malaysia","melayu","bahasa malaysia","brunei","singapura","muet"] }, // linguo-patch:silabus-melayu-v1
  { slug: "khmer",      name: "Khmer",     nativeName: "ខ្មែរ",         flag: "🇰🇭", region: "asian", available: true, aliases: ["kamboja","cambodia"] },
  { slug: "lao",        name: "Laos",      nativeName: "ລາວ",          flag: "🇱🇦", region: "asian", available: true },
  { slug: "burmese",    name: "Myanmar",   nativeName: "မြန်မာ",        flag: "🇲🇲", region: "asian", available: true, aliases: ["myanmar","burma"] },
  { slug: "hindi",      name: "Hindi",     nativeName: "हिन्दी",         flag: "🇮🇳", region: "asian", available: true },
  { slug: "urdu",       name: "Urdu",      nativeName: "اردو",         flag: "🇵🇰", region: "asian", available: true },
  { slug: "bengali",    name: "Bengali",   nativeName: "বাংলা",         flag: "🇧🇩", region: "asian", available: true,  description: "Bahasa ke-5 terbesar dunia — aksara Bangla, Tagore & Bhasha Andolon 1952.", aliases: ["bangla","bangladesh","benggala","dhaka","kolkata"] }, // linguo-patch:silabus-bengali-v1
  { slug: "tamil",      name: "Tamil",     nativeName: "தமிழ்",         flag: "🇮🇳", region: "asian", available: false },
  { slug: "punjabi",    name: "Punjabi",   nativeName: "ਪੰਜਾਬੀ",        flag: "🇮🇳", region: "asian", available: false },
  { slug: "nepali",     name: "Nepal",     nativeName: "नेपाली",         flag: "🇳🇵", region: "asian", available: false },
  { slug: "mongolian",  name: "Mongol",    nativeName: "Монгол",      flag: "🇲🇳", region: "asian", available: false },

  // === Middle Eastern ===
  { slug: "kurdish",    name: "Kurdi",     nativeName: "Kurdî",       flag: "☀️", region: "middle-eastern", available: false },

  // === Nusantara ===
  { slug: "balinese",    name: "Bali",      nativeName: "Basa Bali",   flag: "🇮🇩", region: "nusantara", available: true },
  { slug: "minangkabau", name: "Minang",    nativeName: "Minangkabau", flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "batak",       name: "Batak",     nativeName: "Hata Batak",  flag: "🇮🇩", region: "nusantara", available: true },
  { slug: "bugis",       name: "Bugis",     nativeName: "Ugi",         flag: "🇮🇩", region: "nusantara", available: true },
  { slug: "acehnese",    name: "Aceh",      nativeName: "Bahsa Acèh",  flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "banjar",      name: "Banjar",    nativeName: "Bahasa Banjar", flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "madurese",    name: "Madura",    nativeName: "Bhâsa Madhurâ", flag: "🇮🇩", region: "nusantara", available: true },
  // linguo-patch:placement-all-v1 — entri "betawi" kedua dihapus: duplikat slug bikin
  // Betawi muncul 2x di PlacementPicker (entri utama featured ada di blok atas).

  // === African ===
  { slug: "swahili",     name: "Swahili",   nativeName: "Kiswahili",   flag: "🇰🇪", region: "african", available: true,  description: "Bahasa Bantu 200 juta penutur — ejaan fonetis, tanpa tone, sistem ngeli 18 kelas.", aliases: ["kiswahili","kenya","tanzania","afrika timur"] }, // linguo-patch:silabus-swahili-v1
  { slug: "zulu",        name: "Zulu",      nativeName: "isiZulu",     flag: "🇿🇦", region: "african", available: false },
  { slug: "yoruba",      name: "Yoruba",    nativeName: "Yorùbá",      flag: "🇳🇬", region: "african", available: false },
  { slug: "amharic",     name: "Amhar",     nativeName: "አማርኛ",        flag: "🇪🇹", region: "african", available: false },

  // === Other / Classical ===
  { slug: "latin",       name: "Latin",     nativeName: "Latinum",     flag: "📜", region: "other", available: false },
  { slug: "esperanto",   name: "Esperanto", nativeName: "Esperanto",   flag: "🟢", region: "other", available: false },
  { slug: "armenian",    name: "Armenia",   nativeName: "Հայերեն",      flag: "🇦🇲", region: "other", available: false },
];

export const regionLabels: Record<string, string> = {
  "european": "Eropa",
  "asian": "Asia",
  "middle-eastern": "Timur Tengah",
  "nusantara": "Nusantara",
  "african": "Afrika",
  "other": "Klasik & Lainnya",
};

// linguo-patch:silabus-exam-title-v1 — IELTS & TOEFL ITP itu NAMA UJIAN, bukan nama
// bahasa. "Bahasa IELTS" salah secara harfiah, jadi prefiks "Bahasa" dilepas khusus
// buat slug di sini. Tambah slug baru ke set ini kalau nanti ada entri ujian lain
// (mis. JLPT/TOPIK) yang masuk katalog silabus.
export const examSlugs = new Set(["ielts", "toefl-itp"]);

/** Judul tampilan sebuah entri silabus: "Bahasa Jepang", tapi "IELTS" (tanpa prefiks). */
export function displayLangTitle(l: { slug: string; name: string }) {
  return examSlugs.has(l.slug) ? l.name : `Bahasa ${l.name}`;
}

export const featuredLanguages = languages.filter((l) => l.featured);
export function getLanguageBySlug(slug: string) {
  return languages.find((l) => l.slug === slug);
}

// linguo-patch:silabus-alias-redirect-v1 — /silabus/melayu dulu 404 padahal silabusnya
// ada: slug kanoniknya "malay". Orang (termasuk tim sendiri) mengetik nama yang mereka
// tahu — melayu, tagalog, bangla, kamboja, myanmar — bukan slug internal Inggrisnya.
// Peta di bawah dipakai route [lang] buat mengalihkan alias ke slug kanonik.
// Alias yang diklaim lebih dari satu bahasa ("portugis" → pt & br) sengaja dibuang:
// menebak salah satu lebih buruk daripada membiarkan orang mendarat di hub.
const normalizeLangKey = (s: string) =>
  s.toLowerCase().trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ");

const aliasToSlug: Map<string, string | null> = (() => {
  const m = new Map<string, string | null>();
  const claim = (key: string, slug: string) => {
    const k = normalizeLangKey(key);
    // slug asli selalu menang; jangan sampai alias bahasa lain membajaknya
    if (!k || languages.some((l) => l.slug === k)) return;
    m.set(k, m.has(k) && m.get(k) !== slug ? null : slug);
  };
  for (const l of languages) {
    if (!l.available) continue;
    claim(l.name, l.slug);
    claim(l.nativeName, l.slug);
    for (const a of l.aliases ?? []) claim(a, l.slug);
  }
  return m;
})();

/**
 * Slug kanonik untuk input bebas: "melayu" → "malay", "Bahasa Melayu" → "malay".
 * null kalau tak dikenal, belum available, atau ambigu (dipakai >1 bahasa).
 */
export function resolveLanguageSlug(input: string): string | null {
  let key = normalizeLangKey(input ?? "");
  if (!key) return null;
  const bySlug = (k: string) => languages.find((l) => l.slug === k && l.available)?.slug ?? null;
  const hit = bySlug(key) ?? aliasToSlug.get(key) ?? null;
  if (hit) return hit;
  key = key.replace(/^bahasa\s+/, "");
  return bySlug(key) ?? aliasToSlug.get(key) ?? null;
}
