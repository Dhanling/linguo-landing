/** Tema ilustrasi ditentukan per sesi, bukan satu latar alfabet untuk semua dek.
 * Sesi dengan tema yang berulang memakai ilustrasi yang sama. */
export const SPANISH_SLIDE_THEMES: Record<string, readonly string[]> = {
  "a1-1": ["alphabet", "greetings", "identity", "politeness", "people", "identity", "city", "people", "numbers", "objects", "objects", "people", "family", "world", "conversation", "conversation"],
  "a1-2": ["calendar", "clock", "daily", "daily", "work", "food", "restaurant", "family", "city", "future", "objects", "objects", "health", "clothes", "daily", "conversation"],
  "a1-3": ["home", "city", "city", "transport", "weather", "hobbies", "sports", "music", "daily", "daily", "people", "objects", "quantity", "instructions", "objects", "past"],
  "a2-1": ["past", "past", "past", "people", "objects", "instructions", "instructions", "objects", "people", "city", "travel", "airport", "hotel", "restaurant", "help", "travel"],
  "a2-2": ["past", "past", "story", "future", "future", "writing", "conversation", "conversation", "work", "work", "work", "writing", "work", "conversation", "past", "work"],
  "a2-3": ["daily", "past", "clock", "people", "daily", "writing", "debate", "debate", "story", "cinema", "health", "health", "sports", "art", "technology", "debate"],
  "a2-4": ["daily", "past", "daily", "conversation", "quantity", "quantity", "people", "hobbies", "planning", "help", "instructions", "instructions", "festivals", "food", "world", "world"],
  "b1-1": ["past", "conversation", "conversation", "instructions", "conversation", "conversation", "planning", "finance", "politeness", "writing", "people", "world", "literature", "cinema", "literature", "conversation"],
  "b1-2": ["planning", "planning", "planning", "planning", "debate", "news", "debate", "world", "environment", "technology", "technology", "work", "work", "business", "business", "debate"],
  "b1-3": ["planning", "future", "planning", "people", "writing", "planning", "writing", "writing", "literature", "art", "past", "science", "literature", "business", "business", "writing"],
  "b1-4": ["daily", "daily", "objects", "objects", "conversation", "conversation", "travel", "technology", "debate", "debate", "writing", "art", "cinema", "music", "politeness", "art"],
  "b1-5": ["conversation", "planning", "planning", "past", "instructions", "instructions", "festivals", "festivals", "help", "planning", "help", "business", "business", "conversation", "clock", "business"],
  "b2-1": ["past", "past", "planning", "past", "planning", "conversation", "conversation", "conversation", "literature", "politeness", "debate", "writing", "writing", "business", "literature", "debate"],
  "b2-2": ["business", "writing", "planning", "business", "finance", "business", "work", "legal", "technology", "help", "politeness", "world", "business", "business", "writing", "business"],
  "b2-3": ["conversation", "world", "conversation", "conversation", "world", "listening", "listening", "world", "writing", "news", "literature", "debate", "story", "debate", "identity", "conversation"],
  "b2-4": ["literature", "literature", "literature", "cinema", "cinema", "cinema", "music", "music", "art", "art", "literature", "art", "news", "cinema", "cinema", "art"],
  "b2-5": ["conversation", "politeness", "debate", "debate", "politeness", "help", "writing", "legal", "business", "debate", "business", "business", "help", "news", "news", "business"],
  "b2-6": ["world", "world", "world", "world", "world", "world", "world", "world", "world", "listening", "conversation", "conversation", "listening", "world", "world", "world"],
  "b2-7": ["politeness", "politeness", "writing", "literature", "debate", "story", "health", "technology", "business", "world", "translation", "translation", "writing", "business", "debate", "certification"],
};

/** Diisi hanya setelah 32 gambar sublevel tersedia dan lulus review. */
export const SPANISH_ARTWORK_V2_READY: ReadonlySet<string> = new Set(["spanish-a1-1", "spanish-a1-2", "spanish-a1-3", "spanish-a2-1", "spanish-a2-2"]);

/** Pasangan cover/tujuan yang sudah lengkap dan ditinjau pada sublevel lain. */
export const SPANISH_ARTWORK_V2_SESSIONS: Readonly<Record<string, readonly number[]>> = {
  "spanish-a2-3": [1, 2, 3, 4, 5, 6],
  "spanish-b2-4": [11, 13, 14, 15, 16],
  "spanish-b2-5": [1, 2, 3, 4],
};

/** Tidak ada fallback ke alfabet: pemetaan yang terlewat harus terlihat saat validasi. */
export function spanishSlideArtwork(deckKey: string, session: number): { cover: string; objectives: string } | null {
  if (!deckKey.startsWith("spanish-") || !Number.isInteger(session) || session < 1 || session > 16) return null;
  if (SPANISH_ARTWORK_V2_READY.has(deckKey) || SPANISH_ARTWORK_V2_SESSIONS[deckKey]?.includes(session)) return {
    cover: `/slide-cover/spanish-v2/${deckKey}-sesi-${session}.jpg`,
    objectives: `/slide-cover/spanish-v2/${deckKey}-sesi-${session}-tujuan.jpg`,
  };
  const theme = SPANISH_SLIDE_THEMES[deckKey.slice("spanish-".length)]?.[session - 1];
  if (!theme) return null;
  const base = `/slide-cover/spanish-themes/${deckKey}-sesi-${session}`;
  return { cover: `${base}-vector.svg`, objectives: `${base}-tujuan-vector.svg` };
}
