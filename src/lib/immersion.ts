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
  flag: string; // emoji bendera
}

export const IMMERSION_LANGS: ImmersionLang[] = [
  { code: "en", name: "Inggris", native: "English", flag: "🇬🇧" },
  { code: "ja", name: "Jepang", native: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korea", native: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "Mandarin", native: "中文", flag: "🇨🇳" },
  { code: "es", name: "Spanyol", native: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Prancis", native: "Français", flag: "🇫🇷" },
  { code: "de", name: "Jerman", native: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italia", native: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portugis", native: "Português", flag: "🇵🇹" },
  { code: "nl", name: "Belanda", native: "Nederlands", flag: "🇳🇱" },
  { code: "ru", name: "Rusia", native: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "Arab", native: "العربية", flag: "🇸🇦" },
  { code: "tr", name: "Turki", native: "Türkçe", flag: "🇹🇷" },
  { code: "th", name: "Thailand", native: "ภาษาไทย", flag: "🇹🇭" },
  { code: "vi", name: "Vietnam", native: "Tiếng Việt", flag: "🇻🇳" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
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
}

export const IMMERSION_CATEGORIES: ImmersionCategory[] = [
  { id: "populer", label: "Populer", emoji: "✨", q: "popular trending" },
  { id: "hiburan", label: "Hiburan", emoji: "🎬", q: "entertainment" },
  { id: "kartun", label: "Kartun", emoji: "🧸", q: "cartoon animation" },
  { id: "berita", label: "Berita", emoji: "📰", q: "news", news: true },
  { id: "musik", label: "Musik", emoji: "🎵", q: "official music video" },
  { id: "film", label: "Film & TV", emoji: "🎥", q: "movie clip scene" },
  { id: "olahraga", label: "Olahraga", emoji: "⚽", q: "sports highlights" },
  { id: "teknologi", label: "Teknologi", emoji: "💡", q: "technology review" },
  { id: "vlog", label: "Vlog", emoji: "📹", q: "daily vlog" },
  { id: "anak", label: "Anak", emoji: "🎈", q: "kids learning song" },
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
