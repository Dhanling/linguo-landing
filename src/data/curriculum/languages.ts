// __PATCH_KOREAN_BUNDLE__
// __PATCH_MANDARIN_BUNDLE__
// __PATCH_JAPANESE_BUNDLE__
import type { LanguageMeta } from "./types";

export const languages: LanguageMeta[] = [
  // === FEATURED / Priority ===
  { slug: "english",    name: "Inggris",   nativeName: "English",     flag: "🇬🇧", region: "european",       featured: true, available: true,  description: "Bahasa internasional — dari A1 sampai B2, TOEFL & IELTS ready." },
  { slug: "ielts",      name: "IELTS",     nativeName: "IELTS",       flag: "🎓", region: "european",       featured: true, available: true,  description: "Persiapan IELTS Academic intensif — target Band 6.5–7.0 dalam 64 sesi." },
  { slug: "toefl-itp",  name: "TOEFL ITP", nativeName: "TOEFL ITP",   flag: "📝", region: "european",       featured: true, available: true,  description: "Persiapan TOEFL ITP intensif — target skor 500–550+ dalam 64 sesi." },
  { slug: "japanese",   name: "Jepang",    nativeName: "日本語",       flag: "🇯🇵", region: "asian",          featured: true, available: true, description: "Hiragana, Katakana, Kanji — dari nol sampai JLPT." },
  { slug: "korean",     name: "Korea",     nativeName: "한국어",       flag: "🇰🇷", region: "asian",          featured: true, available: true, description: "Hangul, tata bahasa Korea, TOPIK ready." },
  { slug: "mandarin",   name: "Mandarin",  nativeName: "中文",         flag: "🇨🇳", region: "asian",          featured: true, available: true, description: "Pinyin, Hanzi, HSK — metode Linguo untuk pemula." },
  { slug: "spanish",    name: "Spanyol",   nativeName: "Español",     flag: "🇪🇸", region: "european",       featured: true, available: true,  description: "Bahasa 500 juta penutur di Eropa & Amerika Latin." },
  { slug: "french",     name: "Prancis",   nativeName: "Français",    flag: "🇫🇷", region: "european",       featured: true, available: true,  description: "DELF/DALF prep, budaya Prancis, percakapan sehari-hari." },
  { slug: "german",     name: "Jerman",    nativeName: "Deutsch",     flag: "🇩🇪", region: "european",       featured: true, available: true,  description: "Goethe A1–B2, persiapan studi di Jerman." },
  { slug: "italian",    name: "Italia",    nativeName: "Italiano",    flag: "🇮🇹", region: "european",       featured: true, available: true, description: "Dari ciao sampai conversazione — CILS ready." }, // __PATCH_ITALIAN_BUNDLE__
  { slug: "arabic",     name: "Arab",      nativeName: "العربية",      flag: "🇸🇦", region: "middle-eastern", featured: true, available: true,  description: "Fusha & Ammiyah, untuk agama, studi, atau karier." },
  { slug: "hebrew",     name: "Ibrani",    nativeName: "עברית",        flag: "🇮🇱", region: "middle-eastern", featured: true, available: true,  description: "Modern Hebrew dengan fokus percakapan & literasi." },
  { slug: "persian",    name: "Persia",    nativeName: "فارسی",        flag: "🇮🇷", region: "middle-eastern", featured: true, available: true,  description: "Farsi — bahasa sastra Rumi, puisi klasik & modern." },
  { slug: "javanese",   name: "Jawa",      nativeName: "Basa Jawa",   flag: "🇮🇩", region: "nusantara",      featured: true, available: true, description: "Ngoko, Krama, Krama Inggil — filosofi Jawa lengkap." },
  { slug: "sundanese",  name: "Sunda",     nativeName: "Basa Sunda",  flag: "🇮🇩", region: "nusantara",      featured: true, available: true, description: "Loma, Lemes — bahasa Pasundan autentik." },
  { slug: "bipa",       name: "BIPA",      nativeName: "Bahasa Indonesia", flag: "🇮🇩", region: "nusantara", featured: true, available: true, description: "Bahasa Indonesia untuk Penutur Asing — BIPA resmi." },
  { slug: "georgian",   name: "Georgia",   nativeName: "ქართული",      flag: "🇬🇪", region: "other",          featured: true, available: true, description: "Kartuli — bahasa unik dengan aksara sendiri." },
  { slug: "greek",      name: "Yunani",    nativeName: "Ελληνικά",     flag: "🇬🇷", region: "european",       featured: true, available: true,  description: "Aksara Yunani 24 huruf, dari nol sampai sastra Καβάφης & filsafat klasik." },

  // === European ===
  { slug: "portuguese-pt", name: "Portugis (Portugal)", nativeName: "Português Europeu", flag: "🇵🇹", region: "european", available: true, description: "Fado, Lisboa, Camões, Pessoa, Saramago — Português Europeu com CAPLE prep (DIPLE B2 / DAPLE C1)." }, // __PATCH_PORTUGUESE_PT_BUNDLE__
  { slug: "portuguese-br", name: "Portugis (Brasil)", nativeName: "Português Brasileiro", flag: "🇧🇷", region: "european", available: true, description: "Bossa nova, samba, futebol, telenovela — Português brasileiro com Celpe-Bras ready." }, // __PATCH_PORTUGUESE_BR_BUNDLE__
  { slug: "dutch",      name: "Belanda",   nativeName: "Nederlands",  flag: "🇳🇱", region: "european", available: true },
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
  { slug: "cantonese",  name: "Kanton",    nativeName: "廣東話",       flag: "🇭🇰", region: "asian", available: false },
  { slug: "vietnamese", name: "Vietnam",   nativeName: "Tiếng Việt",  flag: "🇻🇳", region: "asian", available: true },
  { slug: "thai",       name: "Thailand",  nativeName: "ภาษาไทย",     flag: "🇹🇭", region: "asian", available: true },
  { slug: "filipino",   name: "Filipina",  nativeName: "Tagalog",     flag: "🇵🇭", region: "asian", available: true },
  { slug: "khmer",      name: "Khmer",     nativeName: "ខ្មែរ",         flag: "🇰🇭", region: "asian", available: true },
  { slug: "lao",        name: "Laos",      nativeName: "ລາວ",          flag: "🇱🇦", region: "asian", available: true },
  { slug: "burmese",    name: "Myanmar",   nativeName: "မြန်မာ",        flag: "🇲🇲", region: "asian", available: true },
  { slug: "hindi",      name: "Hindi",     nativeName: "हिन्दी",         flag: "🇮🇳", region: "asian", available: false },
  { slug: "urdu",       name: "Urdu",      nativeName: "اردو",         flag: "🇵🇰", region: "asian", available: false },
  { slug: "bengali",    name: "Bengali",   nativeName: "বাংলা",         flag: "🇧🇩", region: "asian", available: false },
  { slug: "tamil",      name: "Tamil",     nativeName: "தமிழ்",         flag: "🇮🇳", region: "asian", available: false },
  { slug: "punjabi",    name: "Punjabi",   nativeName: "ਪੰਜਾਬੀ",        flag: "🇮🇳", region: "asian", available: false },
  { slug: "nepali",     name: "Nepal",     nativeName: "नेपाली",         flag: "🇳🇵", region: "asian", available: false },
  { slug: "mongolian",  name: "Mongol",    nativeName: "Монгол",      flag: "🇲🇳", region: "asian", available: false },

  // === Middle Eastern ===
  { slug: "kurdish",    name: "Kurdi",     nativeName: "Kurdî",       flag: "☀️", region: "middle-eastern", available: false },

  // === Nusantara ===
  { slug: "balinese",    name: "Bali",      nativeName: "Basa Bali",   flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "minangkabau", name: "Minang",    nativeName: "Minangkabau", flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "batak",       name: "Batak",     nativeName: "Hata Batak",  flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "bugis",       name: "Bugis",     nativeName: "Ugi",         flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "acehnese",    name: "Aceh",      nativeName: "Bahsa Acèh",  flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "banjar",      name: "Banjar",    nativeName: "Bahasa Banjar", flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "madurese",    name: "Madura",    nativeName: "Bhâsa Madhurâ", flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "betawi",      name: "Betawi",    nativeName: "Bahasa Betawi", flag: "🇮🇩", region: "nusantara", available: false },

  // === African ===
  { slug: "swahili",     name: "Swahili",   nativeName: "Kiswahili",   flag: "🇰🇪", region: "african", available: false },
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

export const featuredLanguages = languages.filter((l) => l.featured);
export function getLanguageBySlug(slug: string) {
  return languages.find((l) => l.slug === slug);
}
