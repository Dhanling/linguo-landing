import type { LanguageMeta } from "./types";

export const languages: LanguageMeta[] = [
  // === FEATURED / Priority ===
  { slug: "english",    name: "Inggris",   nativeName: "English",     flag: "🇬🇧", region: "european",       featured: true, available: true,  description: "Bahasa internasional — dari A1 sampai B2, TOEFL & IELTS ready." },
  { slug: "japanese",   name: "Jepang",    nativeName: "日本語",       flag: "🇯🇵", region: "asian",          featured: true, available: false, description: "Hiragana, Katakana, Kanji — dari nol sampai JLPT." },
  { slug: "korean",     name: "Korea",     nativeName: "한국어",       flag: "🇰🇷", region: "asian",          featured: true, available: false, description: "Hangul, tata bahasa Korea, TOPIK ready." },
  { slug: "mandarin",   name: "Mandarin",  nativeName: "中文",         flag: "🇨🇳", region: "asian",          featured: true, available: false, description: "Pinyin, Hanzi, HSK — metode Linguo untuk pemula." },
  { slug: "spanish",    name: "Spanyol",   nativeName: "Español",     flag: "🇪🇸", region: "european",       featured: true, available: false, description: "Bahasa 500 juta penutur di Eropa & Amerika Latin." },
  { slug: "french",     name: "Prancis",   nativeName: "Français",    flag: "🇫🇷", region: "european",       featured: true, available: false, description: "DELF/DALF prep, budaya Prancis, percakapan sehari-hari." },
  { slug: "german",     name: "Jerman",    nativeName: "Deutsch",     flag: "🇩🇪", region: "european",       featured: true, available: false, description: "Goethe A1–B2, persiapan studi di Jerman." },
  { slug: "italian",    name: "Italia",    nativeName: "Italiano",    flag: "🇮🇹", region: "european",       featured: true, available: false, description: "Dari ciao sampai conversazione — CILS ready." },
  { slug: "arabic",     name: "Arab",      nativeName: "العربية",      flag: "🇸🇦", region: "middle-eastern", featured: true, available: false, description: "Fusha & Ammiyah, untuk agama, studi, atau karier." },
  { slug: "hebrew",     name: "Ibrani",    nativeName: "עברית",        flag: "🇮🇱", region: "middle-eastern", featured: true, available: false, description: "Modern Hebrew dengan fokus percakapan & literasi." },
  { slug: "persian",    name: "Persia",    nativeName: "فارسی",        flag: "🇮🇷", region: "middle-eastern", featured: true, available: false, description: "Farsi — bahasa sastra Rumi, puisi klasik & modern." },
  { slug: "javanese",   name: "Jawa",      nativeName: "Basa Jawa",   flag: "🇮🇩", region: "nusantara",      featured: true, available: false, description: "Ngoko, Krama, Krama Inggil — filosofi Jawa lengkap." },
  { slug: "sundanese",  name: "Sunda",     nativeName: "Basa Sunda",  flag: "🇮🇩", region: "nusantara",      featured: true, available: false, description: "Loma, Lemes — bahasa Pasundan autentik." },
  { slug: "bipa",       name: "BIPA",      nativeName: "Bahasa Indonesia", flag: "🇮🇩", region: "nusantara", featured: true, available: false, description: "Bahasa Indonesia untuk Penutur Asing — BIPA resmi." },
  { slug: "georgian",   name: "Georgia",   nativeName: "ქართული",      flag: "🇬🇪", region: "other",          featured: true, available: false, description: "Kartuli — bahasa unik dengan aksara sendiri." },
  { slug: "greek",      name: "Yunani",    nativeName: "Ελληνικά",     flag: "🇬🇷", region: "european",       featured: true, available: true,  description: "Aksara Yunani 24 huruf, dari nol sampai sastra Καβάφης & filsafat klasik." },

  // === European ===
  { slug: "portuguese", name: "Portugis",  nativeName: "Português",   flag: "🇵🇹", region: "european", available: false },
  { slug: "dutch",      name: "Belanda",   nativeName: "Nederlands",  flag: "🇳🇱", region: "european", available: false },
  { slug: "russian",    name: "Rusia",     nativeName: "Русский",     flag: "🇷🇺", region: "european", available: false },
  { slug: "swedish",    name: "Swedia",    nativeName: "Svenska",     flag: "🇸🇪", region: "european", available: false },
  { slug: "norwegian",  name: "Norwegia",  nativeName: "Norsk",       flag: "🇳🇴", region: "european", available: false },
  { slug: "danish",     name: "Denmark",   nativeName: "Dansk",       flag: "🇩🇰", region: "european", available: false },
  { slug: "finnish",    name: "Finlandia", nativeName: "Suomi",       flag: "🇫🇮", region: "european", available: false },
  { slug: "polish",     name: "Polandia",  nativeName: "Polski",      flag: "🇵🇱", region: "european", available: false },
  { slug: "czech",      name: "Ceko",      nativeName: "Čeština",     flag: "🇨🇿", region: "european", available: false },
  { slug: "hungarian",  name: "Hungaria",  nativeName: "Magyar",      flag: "🇭🇺", region: "european", available: false },
  { slug: "romanian",   name: "Rumania",   nativeName: "Română",      flag: "🇷🇴", region: "european", available: false },
  { slug: "turkish",    name: "Turki",     nativeName: "Türkçe",      flag: "🇹🇷", region: "european", available: false },
  { slug: "bulgarian",  name: "Bulgaria",  nativeName: "Български",   flag: "🇧🇬", region: "european", available: false },
  { slug: "ukrainian",  name: "Ukraina",   nativeName: "Українська",  flag: "🇺🇦", region: "european", available: false },
  { slug: "icelandic",  name: "Islandia",  nativeName: "Íslenska",    flag: "🇮🇸", region: "european", available: false },

  // === Asian ===
  { slug: "cantonese",  name: "Kanton",    nativeName: "廣東話",       flag: "🇭🇰", region: "asian", available: false },
  { slug: "vietnamese", name: "Vietnam",   nativeName: "Tiếng Việt",  flag: "🇻🇳", region: "asian", available: false },
  { slug: "thai",       name: "Thailand",  nativeName: "ภาษาไทย",     flag: "🇹🇭", region: "asian", available: false },
  { slug: "filipino",   name: "Filipina",  nativeName: "Tagalog",     flag: "🇵🇭", region: "asian", available: false },
  { slug: "khmer",      name: "Khmer",     nativeName: "ខ្មែរ",         flag: "🇰🇭", region: "asian", available: false },
  { slug: "lao",        name: "Laos",      nativeName: "ລາວ",          flag: "🇱🇦", region: "asian", available: false },
  { slug: "burmese",    name: "Myanmar",   nativeName: "မြန်မာ",        flag: "🇲🇲", region: "asian", available: false },
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
