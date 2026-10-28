// Urutan adegan pada atlas Imagegen: 5 kolom × 4 baris untuk setiap bahasa.
export const SILABUS_SCENES = ["hero", "alphabet", "greetings", "introducing", "numbers", "calendar", "colors", "family", "articles", "pronouns", "tobe-positive", "tobe-questions", "prices", "time", "food", "classroom", "review", "travel", "work", "health"] as const;
export type SilabusScene = typeof SILABUS_SCENES[number];

const THEMES: [RegExp, SilabusScene][] = [
  [/orientasi|orientation|peta dunia|overview/, "hero"],
  [/review|ulasan|rangkuman|mini.?test|evaluasi/, "review"],
  [/health|doctor|hospital|sakit|kesehatan/, "health"],
  [/travel|airport|hotel|transport|wisata|perjalanan|liburan/, "travel"],
  [/business|career|profession|office|workplace|pekerjaan|bisnis/, "work"],
  [/number|count|angka|bilangan/, "numbers"],
  [/price|money|shop|market|harga|belanja/, "prices"],
  [/alphabet|pronunciation|spell|hiragana|katakana|hangul|pinyin|aksara|huruf|bunyi|pelafalan|vokal|vowel|consonant|konsonan/, "alphabet"],
  [/greet|hello|goodbye|sapaan|salam/, "greetings"],
  [/introduc|personal|identity|perkenal|memperkenalkan/, "introducing"],
  [/time|routine|frequency|jam|rutinitas/, "time"],
  [/day|month|calendar|plan|future|hari|bulan|kalender/, "calendar"],
  [/pronoun|possessive|kata ganti|kata tunjuk/, "pronouns"],
  [/classroom|school|education|kelas|sekolah/, "classroom"],
  [/color|adjective|compar|superlat|clothes|fashion|warna|sifat/, "colors"],
  [/family|friend|relationship|keluarga|teman/, "family"],
  [/article|noun|object|artikel|benda/, "articles"],
  [/question|negative|modal|advice|tanya|negasi/, "tobe-questions"],
  [/verb|tense|past|present|conditional|passive|grammar|to\s*be|tobe|hebben|zijn|tata bahasa|kerja/, "tobe-positive"],
  [/food|drink|cook|restaurant|meal|makan|minum|dapur/, "food"],
  [/class|school|study|education|learn|kelas|sekolah|belajar/, "classroom"],
];

/** Judul diutamakan; topik menjadi cadangan untuk judul berbahasa lokal. */
export function sceneForSession(session: { title: string; topics?: string[] }): SilabusScene {
  const title = session.title.toLowerCase();
  const all = [title, ...(session.topics || [])].join(" ").toLowerCase();
  return THEMES.find(([pattern]) => pattern.test(title))?.[1]
    || THEMES.find(([pattern]) => pattern.test(all))?.[1] || "review";
}
