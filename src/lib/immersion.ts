// Watch & Learn (immersion) — versi web dari fitur mobile Linguo.
// Katalog video YouTube per bahasa + kategori, dipakai buat belajar bahasa lewat
// konten yang disukai. Search jalan lewat Edge Function `yt-search` (project
// Supabase yang sama dengan app mobile), jadi gak butuh API key di client.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export interface ImmersionVideo {
  videoId: string;
  title: string;
  thumbnail: string | null;
  channel?: string | null;
}

export interface ImmersionSearchPage {
  results: ImmersionVideo[];
  nextPageToken?: string;
}

// Bahasa yang tersedia buat immersion. `code` = kode ISO untuk relevanceLanguage
// di YouTube, `tag` = kata native yang dijahit ke query biar hasilnya beneran
// dalam bahasa target (mis. "cartoon Español", bukan versi Inggris-nya).
export interface ImmersionLang {
  code: string;
  name: string; // label Indonesia
  native: string; // nama native (dipakai sebagai tag pembias query)
  flag: string; // emoji bendera (fallback)
  country: string; // kode negara ISO-2 buat bendera rounded-rect (RectFlag)
  searchCode?: string; // relevanceLanguage YouTube kalau `code` tak didukung (mis. jv/su → id)
}

// Daftar bahasa immersion — diperluas menyamai katalog app Linguo. `code` = kode
// ISO-639 untuk relevanceLanguage YouTube (unik per entri), `native` = tag pembias
// query, `country` = ISO-2 buat bendera rounded-rectangle.
export const IMMERSION_LANGS: ImmersionLang[] = [
  { code: "en", name: "Inggris", native: "English", flag: "🇬🇧", country: "gb" },
  { code: "ja", name: "Jepang", native: "日本語", flag: "🇯🇵", country: "jp" },
  { code: "ko", name: "Korea", native: "한국어", flag: "🇰🇷", country: "kr" },
  { code: "zh", name: "Mandarin", native: "中文", flag: "🇨🇳", country: "cn" },
  { code: "es", name: "Spanyol", native: "Español", flag: "🇪🇸", country: "es" },
  { code: "fr", name: "Prancis", native: "Français", flag: "🇫🇷", country: "fr" },
  { code: "de", name: "Jerman", native: "Deutsch", flag: "🇩🇪", country: "de" },
  { code: "it", name: "Italia", native: "Italiano", flag: "🇮🇹", country: "it" },
  { code: "pt", name: "Portugis", native: "Português", flag: "🇵🇹", country: "pt" },
  { code: "nl", name: "Belanda", native: "Nederlands", flag: "🇳🇱", country: "nl" },
  { code: "ru", name: "Rusia", native: "Русский", flag: "🇷🇺", country: "ru" },
  { code: "ar", name: "Arab", native: "العربية", flag: "🇸🇦", country: "sa" },
  { code: "tr", name: "Turki", native: "Türkçe", flag: "🇹🇷", country: "tr" },
  { code: "th", name: "Thailand", native: "ภาษาไทย", flag: "🇹🇭", country: "th" },
  { code: "vi", name: "Vietnam", native: "Tiếng Việt", flag: "🇻🇳", country: "vn" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳", country: "in" },
  { code: "he", name: "Ibrani", native: "עברית", flag: "🇮🇱", country: "il" },
  { code: "fa", name: "Persia", native: "فارسی", flag: "🇮🇷", country: "ir" },
  { code: "el", name: "Yunani", native: "Ελληνικά", flag: "🇬🇷", country: "gr" },
  { code: "ka", name: "Georgia", native: "ქართული", flag: "🇬🇪", country: "ge" },
  { code: "sv", name: "Swedia", native: "Svenska", flag: "🇸🇪", country: "se" },
  { code: "no", name: "Norwegia", native: "Norsk", flag: "🇳🇴", country: "no" },
  { code: "da", name: "Denmark", native: "Dansk", flag: "🇩🇰", country: "dk" },
  { code: "fi", name: "Finlandia", native: "Suomi", flag: "🇫🇮", country: "fi" },
  { code: "pl", name: "Polandia", native: "Polski", flag: "🇵🇱", country: "pl" },
  { code: "cs", name: "Ceko", native: "Čeština", flag: "🇨🇿", country: "cz" },
  { code: "hu", name: "Hungaria", native: "Magyar", flag: "🇭🇺", country: "hu" },
  { code: "ro", name: "Rumania", native: "Română", flag: "🇷🇴", country: "ro" },
  { code: "bg", name: "Bulgaria", native: "Български", flag: "🇧🇬", country: "bg" },
  { code: "uk", name: "Ukraina", native: "Українська", flag: "🇺🇦", country: "ua" },
  { code: "is", name: "Islandia", native: "Íslenska", flag: "🇮🇸", country: "is" },
  { code: "id", name: "Indonesia", native: "Bahasa Indonesia", flag: "🇮🇩", country: "id" },
  { code: "jv", name: "Jawa", native: "Basa Jawa", flag: "🇮🇩", country: "id", searchCode: "id" },
  { code: "su", name: "Sunda", native: "Basa Sunda", flag: "🇮🇩", country: "id", searchCode: "id" },
  { code: "fil", name: "Filipina", native: "Tagalog", flag: "🇵🇭", country: "ph" },
  { code: "km", name: "Khmer", native: "ខ្មែរ", flag: "🇰🇭", country: "kh" },
  { code: "lo", name: "Laos", native: "ລາວ", flag: "🇱🇦", country: "la" },
  { code: "my", name: "Myanmar", native: "မြန်မာ", flag: "🇲🇲", country: "mm" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇵🇰", country: "pk" },
  { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇰🇪", country: "ke" },
  { code: "am", name: "Amharik", native: "አማርኛ", flag: "🇪🇹", country: "et" },
  { code: "hy", name: "Armenia", native: "Հայերեն", flag: "🇦🇲", country: "am" },
];

export function getImmersionLang(code: string): ImmersionLang | undefined {
  return IMMERSION_LANGS.find((l) => l.code === code);
}

// Kata native untuk "berita" per bahasa — biar rail Berita nyari channel berita
// negara itu sendiri, bukan hasil bahasa Inggris. Fallback ke "news".
const NEWS_WORD: Record<string, string> = {
  en: "news", es: "noticias", fr: "actualités", de: "Nachrichten", it: "notizie",
  pt: "notícias", nl: "nieuws", ru: "новости", ar: "أخبار", tr: "haberler",
  ja: "ニュース", ko: "뉴스", zh: "新闻", hi: "समाचार", th: "ข่าว", vi: "tin tức",
};

// Chip kategori/minat — sama semangatnya dengan versi mobile. `q` = topik search
// (bahasa Inggris, dibias ke bahasa target lewat relevanceLanguage + tag native).
// `news: true` menandai kategori berita (pakai kata native "berita").
export interface ImmersionCategory {
  id: string;
  label: string;
  emoji: string;
  q: string;
  news?: boolean;
  fresh?: boolean; // urutkan by tanggal (konten terbaru) — berita, vlog
  perLang?: Record<string, string>; // override query per bahasa (mis. nama franchise lokal)
}

// Query kartun DILOKALKAN per bahasa: nama franchise dubbing lokal (mis. "Peppa
// Wutz" utk Jerman, "Bob Esponja" utk Spanyol) ATAU channel/acara anak lokal yang
// berbahasa target (Bamse-Swedia, Muumi-Finlandia, Rafadan Tayfa-Turki, Ubongo-
// Swahili, طم طم-Arab, dll). Tujuannya mengangkat kartun terkenal DALAM bahasa
// target, bukan versi Inggris. Tiap entri terverifikasi empiris lewat yt-search —
// yang di sini terbukti mengembalikan konten in-language. Bahasa non-Latin tetap
// dibekingi filter aksara; bahasa yang tak cocok query lokalnya dibiarkan generik.
const KARTUN_FRANCHISE: Record<string, string> = {
  en: "Peppa Pig Bluey SpongeBob Paw Patrol cartoon",
  es: "Peppa Pig Bob Esponja Bluey La Patrulla Canina",
  pt: "Peppa Pig Bob Esponja Patrulha Canina Bluey",
  fr: "Peppa Pig Bob l'éponge Pat Patrouille Bluey",
  de: "Peppa Wutz SpongeBob Schwammkopf Paw Patrol Bluey",
  it: "Peppa Pig cartoni animati per bambini",
  nl: "Bumba Nijntje tekenfilm voor kinderen",
  pl: "Świnka Peppa SpongeBob Psi Patrol",
  ru: "Свинка Пеппа Губка Боб Щенячий патруль",
  uk: "Свинка Пеппа Щенячий патруль мультфільм",
  el: "παιδικά κινούμενα σχέδια για παιδιά",
  ro: "desene animate pentru copii",
  bg: "детски анимационни филми на български",
  cs: "Krtek pohádky pro děti Modrý Traktor",
  sv: "Bamse Babblarna barnprogram tecknat",
  no: "tegnefilm for barn norsk barne-tv",
  da: "tegnefilm for børn Bamse Ramasjang",
  fi: "Muumi lasten piirretty ohjelma",
  is: "teiknimyndir fyrir börn barnaefni",
  id: "Upin Ipin Nussa BoBoiBoy kartun anak",
  jv: "dongeng basa jawa cerita rakyat jawa",
  su: "dongeng sunda kartun basa sunda",
  fil: "awiting pambata palabas na pambata Tagalog",
  ja: "ペッパピッグ アンパンマン アニメ 子供",
  ko: "페파피그 뽀로로 타요 만화",
  zh: "小猪佩奇 海绵宝宝 汪汪队 动画片",
  ar: "كرتون اطفال طم طم رسوم متحركة",
  tr: "Rafadan Tayfa Kukuli Pepee Niloya çizgi film",
  th: "การ์ตูน เด็ก นิทาน",
  vi: "hoạt hình cho trẻ em",
  hi: "कार्टून बच्चों के लिए ChuChu TV",
  he: "סרטים מצוירים לילדים",
  fa: "کارتون کودکانه",
  ka: "მულტფილმები ბავშვებისთვის",
  km: "តុក្កតា កុមារ",
  lo: "ກາຕູນ ສຳລັບເດັກ",
  my: "ကလေး ကာတွန်း",
  ur: "کارٹون بچوں کے لیے اردو کہانیاں",
  sw: "Ubongo Kids Akili Kids katuni za watoto",
  am: "የልጆች ካርቱን",
  hy: "մուլտֆիլմեր երեխաների համար",
};

// PENTING: `q` sengaja TANPA nama franchise global (Peppa Pig, Cocomelon, dll).
// Nama franchise Inggris jadi sinyal ranking yang terlalu kuat — dia menindih
// relevanceLanguage sehingga hasilnya kebanjiran video Inggris walau bahasa target
// lain (mis. pilih Hungaria tapi keluar Peppa Pig Inggris). Dengan kata kategori
// generik saja + tag native + relevanceLanguage, YouTube mengembalikan konten
// beneran dalam bahasa target (terbukti: "cartoon Magyar" → rajzfilm/mese magyarul).
export const IMMERSION_CATEGORIES: ImmersionCategory[] = [
  { id: "populer", label: "Populer", emoji: "✨", q: "popular trending" },
  { id: "hiburan", label: "Hiburan", emoji: "🎬", q: "entertainment funny" },
  {
    id: "kartun",
    label: "Kartun",
    emoji: "🧸",
    q: "cartoon animation for kids",
    perLang: KARTUN_FRANCHISE,
  },
  { id: "berita", label: "Berita", emoji: "📰", q: "news", news: true, fresh: true },
  { id: "musik", label: "Musik", emoji: "🎵", q: "official music video" },
  { id: "film", label: "Film & TV", emoji: "🎥", q: "movie clip trailer scene" },
  { id: "olahraga", label: "Olahraga", emoji: "⚽", q: "sports highlights" },
  { id: "teknologi", label: "Teknologi", emoji: "💡", q: "technology review gadget" },
  { id: "vlog", label: "Vlog", emoji: "📹", q: "daily vlog", fresh: true },
  { id: "anak", label: "Lagu Anak", emoji: "🎈", q: "kids songs nursery rhymes" },
];

// Bangun query final buat sebuah kategori pada bahasa tertentu: topik + tag native
// (berita pakai kata native-nya). Kalau ada free-text search, itu yang dipakai.
export function buildQuery(
  cat: ImmersionCategory,
  lang: ImmersionLang,
  freeText?: string
): string {
  if (freeText && freeText.trim()) return `${freeText.trim()} ${lang.native}`.trim();
  // Prioritas topik: berita → kata native; kalau kategori punya override per bahasa
  // (mis. nama franchise kartun lokal) pakai itu; kalau tak ada, kata generik `q`.
  const topic = cat.news
    ? NEWS_WORD[lang.code] ?? "news"
    : cat.perLang?.[lang.code] ?? cat.q;
  return `${topic} ${lang.native}`.trim();
}

// Blok aksara Unicode non-Latin: [awal, akhir, ...kode bahasa yang memakainya].
// Dipakai buat mencocokkan judul — dan lewat itu audio + subtitle — ke bahasa
// target, membuang versi Inggris yang bocor lewat nama franchise (Peppa Pig dll)
// maupun konten bahasa lain yang nyelonong ke hasil.
const SCRIPT_BLOCKS: Array<[number, number, string[]]> = [
  [0x0370, 0x03ff, ["el"]], // yunani
  [0x0400, 0x04ff, ["ru", "uk", "bg"]], // sirilik
  [0x0530, 0x058f, ["hy"]], // armenia
  [0x0590, 0x05ff, ["he"]], // ibrani
  [0x0600, 0x06ff, ["ar", "ur", "fa"]], // arab
  [0x0900, 0x097f, ["hi"]], // devanagari
  [0x0e00, 0x0e7f, ["th"]], // thai
  [0x0e80, 0x0eff, ["lo"]], // lao
  [0x1000, 0x109f, ["my"]], // myanmar
  [0x10a0, 0x10ff, ["ka"]], // georgia
  [0x1200, 0x137f, ["am"]], // ethiopic (amharik)
  [0x1780, 0x17ff, ["km"]], // khmer
  [0x3040, 0x30ff, ["ja"]], // hiragana / katakana
  [0x3400, 0x9fff, ["ja", "zh"]], // han (kanji / hanzi)
  [0xac00, 0xd7af, ["ko"]], // hangul
];

function rangeRegex(a: number, b: number): RegExp {
  return new RegExp(`[\\u{${a.toString(16)}}-\\u{${b.toString(16)}}]`, "u");
}

// Regex aksara target per bahasa (non-Latin), digabung dari semua blok yang
// dipakai bahasa itu. Undefined = bahasa beraksara Latin.
const TARGET_SCRIPT: Record<string, RegExp> = {};
// Regex "aksara non-Latin apa pun" — gabungan tepat blok-blok di atas (BUKAN satu
// rentang lebar, biar huruf Latin beraksen spt Vietnam/Prancis tak salah tangkap).
// Dipakai buat mendeteksi bocoran bahasa lain ke target beraksara Latin.
const ANY_NON_LATIN = new RegExp(
  SCRIPT_BLOCKS.map(([a, b]) => rangeRegex(a, b).source).join("|"),
  "u"
);

for (const [a, b, codes] of SCRIPT_BLOCKS) {
  for (const code of codes) {
    const re = rangeRegex(a, b);
    const prev = TARGET_SCRIPT[code];
    TARGET_SCRIPT[code] = prev
      ? new RegExp(`${prev.source}|${re.source}`, "u")
      : re;
  }
}

// Apakah judul cocok dengan bahasa target? Non-Latin: judul wajib memuat aksara
// bahasa itu. Latin: judul tak boleh memuat aksara non-Latin (kalau ada, itu
// konten bahasa lain). Indikasi kuat audio & subtitle-nya juga bahasa target.
export function titleMatchesLanguage(title: string, langCode: string): boolean {
  const t = title || "";
  const target = TARGET_SCRIPT[langCode];
  if (target) return target.test(t);
  return !ANY_NON_LATIN.test(t);
}

// Saring daftar video ke yang cocok bahasa target. Kalau semua kebuang (mis. hasil
// bahasa lain semua), balikin daftar asli biar rail tak kosong — user tetap dapat
// sesuatu ketimbang empty state; filter tetap mengangkat yang cocok saat ada.
export function filterVideosByLanguage(
  videos: ImmersionVideo[],
  langCode: string
): ImmersionVideo[] {
  const matched = videos.filter((v) => titleMatchesLanguage(v.title, langCode));
  return matched.length ? matched : videos;
}

// Thumbnail YouTube dari videoId (fallback kalau API gak kasih thumbnail).
export function youtubeThumb(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

// Search YouTube lewat Edge Function `yt-search`. Dibias ke bahasa target dan
// (default) dibatasi ke video bercaption biar subtitle-nya ada saat ditonton.
// Return [] kalau gagal (quota/network) biar UI turun ke empty state, bukan error.
export async function searchImmersionVideos(params: {
  query: string;
  language?: string;
  withCaptions?: boolean;
  order?: "date" | "rating" | "viewCount" | "relevance";
  max?: number;
  pageToken?: string;
}): Promise<ImmersionSearchPage> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return { results: [] };
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/yt-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        query: params.query,
        language: params.language,
        withCaptions: params.withCaptions ?? true,
        order: params.order,
        max: params.max ?? 18,
        pageToken: params.pageToken,
      }),
    });
    if (!res.ok) return { results: [] };
    const data = (await res.json()) as {
      results?: unknown;
      nextPageToken?: string | null;
    };
    const results = Array.isArray(data.results)
      ? (data.results as ImmersionVideo[]).filter(
          (v) => v && typeof v.videoId === "string" && v.videoId.length > 0
        )
      : [];
    return { results, nextPageToken: data.nextPageToken ?? undefined };
  } catch {
    return { results: [] };
  }
}

// ── Riwayat tonton (localStorage) — buat rail "Lanjut Menonton" ──────────────
export interface WatchHistoryItem {
  videoId: string;
  title: string;
  thumbnail: string | null;
  channel?: string | null;
  lang: string;
  ts: number;
}

const HISTORY_KEY = "linguo:watch:history:v1";
const HISTORY_MAX = 24;

export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as WatchHistoryItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function pushWatchHistory(item: WatchHistoryItem): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  const list = getWatchHistory().filter((h) => h.videoId !== item.videoId);
  const next = [item, ...list].slice(0, HISTORY_MAX);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* storage penuh/diblokir — abaikan */
  }
  return next;
}

export function clearWatchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* abaikan */
  }
}
