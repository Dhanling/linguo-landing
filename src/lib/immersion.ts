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
  { code: "jv", name: "Jawa", native: "Basa Jawa", flag: "🇮🇩", country: "id" },
  { code: "su", name: "Sunda", native: "Basa Sunda", flag: "🇮🇩", country: "id" },
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
}

// Kartun & Lagu Anak dibumbui nama franchise global yang lazim dijuluki/di-sub
// ke banyak bahasa (SpongeBob, Peppa, Bluey, Cocomelon, dll). YouTube menilai kata
// di `q` sebagai ranking lunak — franchise-nya naik ke atas tanpa mematikan recall
// untuk bahasa yang tak punya dub-nya (relevanceLanguage tetap membias ke target).
export const IMMERSION_CATEGORIES: ImmersionCategory[] = [
  { id: "populer", label: "Populer", emoji: "✨", q: "popular trending" },
  { id: "hiburan", label: "Hiburan", emoji: "🎬", q: "entertainment funny" },
  {
    id: "kartun",
    label: "Kartun",
    emoji: "🧸",
    q: "cartoon animation Peppa Pig SpongeBob Bluey Paw Patrol Pocoyo Tom and Jerry",
  },
  { id: "berita", label: "Berita", emoji: "📰", q: "news", news: true, fresh: true },
  { id: "musik", label: "Musik", emoji: "🎵", q: "official music video" },
  { id: "film", label: "Film & TV", emoji: "🎥", q: "movie clip trailer scene" },
  { id: "olahraga", label: "Olahraga", emoji: "⚽", q: "sports highlights" },
  { id: "teknologi", label: "Teknologi", emoji: "💡", q: "technology review gadget" },
  { id: "vlog", label: "Vlog", emoji: "📹", q: "daily vlog", fresh: true },
  {
    id: "anak",
    label: "Lagu Anak",
    emoji: "🎈",
    q: "kids songs nursery rhymes Cocomelon Pinkfong Baby Shark Super Simple Songs",
  },
];

// Bangun query final buat sebuah kategori pada bahasa tertentu: topik + tag native
// (berita pakai kata native-nya). Kalau ada free-text search, itu yang dipakai.
export function buildQuery(
  cat: ImmersionCategory,
  lang: ImmersionLang,
  freeText?: string
): string {
  if (freeText && freeText.trim()) return `${freeText.trim()} ${lang.native}`.trim();
  const topic = cat.news ? NEWS_WORD[lang.code] ?? "news" : cat.q;
  return `${topic} ${lang.native}`.trim();
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
