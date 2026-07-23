// [watch-lang-guard-v1] Penjaga bahasa transkrip Watch & Learn.
//
// MASALAH yang ditangani: video berbahasa LAIN bisa nyelonong masuk katalog satu
// bahasa. Contoh nyata: "Learn the Basics: Georgian" (audio Inggris) tersimpan
// sebagai bahasa Denmark → muncul di tab "Terjemahan Siap" Denmark, dan di antrian
// admin tertulis kolom bahasa "Denmark". Rantainya:
//   1. yt-search cuma MEMBIAS ke bahasa target (`relevanceLanguage`), bukan
//      menyaring — judul Latin yang ambigu lolos filter judul.
//   2. Siswa membukanya → job masuk `yt_transcript_jobs` dgn lang='da'.
//   3. Whisper DIPAKSA `language=da` pada audio Inggris → keluar teks Inggris
//      bercampur "Denmark" halusinasi ("Vi vil vise en vikter...").
//   4. Hasilnya disimpan ke `yt_transcripts` sebagai Denmark → jadi kartu "Siap".
//
// Sinyal paling kuat & GRATIS untuk memutus rantai ini bukan judul, melainkan
// TRANSKRIPNYA SENDIRI: ratusan kata teks asli. Modul ini menilai teks itu dan
// hanya menolak kalau buktinya TEGAS — ambigu/terlalu pendek selalu diloloskan,
// supaya bahasa berkonten sedikit tak ikut terbuang.
//
// Dipakai di dua gerbang:
//   • worker (`transcript-worker`) — sebelum menulis ke `yt_transcripts`.
//   • API `/api/yt-transcript-cache` (POST) — jalur simpan dari player web.
//
// Salinan Deno-nya ada di linguo-app/supabase/functions/_shared/langGuard.ts —
// UBAH KEDUANYA kalau logikanya berganti.

/** Hasil penilaian. `ok:false` = yakin beda bahasa (boleh ditolak). */
export interface LangVerdict {
  ok: boolean;
  /** Tebakan bahasa asli teks (kode ISO) saat ok=false; null kalau tak yakin. */
  detected: string | null;
  /** Alasan singkat berbahasa Indonesia — dipakai jadi pesan error job. */
  reason: string | null;
}

const OK: LangVerdict = { ok: true, detected: null, reason: null };

// ── Aksara ───────────────────────────────────────────────────────────────────
// Regex per keluarga aksara. Cukup blok utamanya; tanda baca & angka diabaikan
// karena kita hanya menghitung HURUF (\p{L}).
const SCRIPT_RE: Record<string, RegExp> = {
  latin: /[A-Za-zÀ-ÖØ-öø-ÿĀ-ɏ]/u,
  cyrillic: /[Ѐ-ӿԀ-ԯ]/u,
  greek: /[Ͱ-Ͽἀ-῿]/u,
  arabic: /[؀-ۿݐ-ݿﭐ-﷿]/u,
  hebrew: /[֐-׿]/u,
  devanagari: /[ऀ-ॿ]/u,
  bengali: /[ঀ-৿]/u,
  gurmukhi: /[਀-੿]/u,
  gujarati: /[઀-૿]/u,
  tamil: /[஀-௿]/u,
  telugu: /[ఀ-౿]/u,
  kannada: /[ಀ-೿]/u,
  malayalam: /[ഀ-ൿ]/u,
  sinhala: /[඀-෿]/u,
  thai: /[฀-๿]/u,
  lao: /[຀-໿]/u,
  khmer: /[ក-៿]/u,
  myanmar: /[က-႟]/u,
  georgian: /[Ⴀ-ჿⴀ-⴯]/u,
  armenian: /[԰-֏]/u,
  ethiopic: /[ሀ-፿]/u,
  hangul: /[가-힯ᄀ-ᇿ㄰-㆏]/u,
  kana: /[぀-ゟ゠-ヿ]/u,
  han: /[一-鿿㐀-䶿]/u,
};

/** Aksara yang WAJIB dominan untuk tiap bahasa target. Tak terdaftar → latin. */
const LANG_SCRIPT: Record<string, string> = {
  ru: "cyrillic", uk: "cyrillic", bg: "cyrillic", sr: "cyrillic", mk: "cyrillic",
  be: "cyrillic", kk: "cyrillic", ky: "cyrillic", tg: "cyrillic", mn: "cyrillic",
  el: "greek",
  ar: "arabic", fa: "arabic", ur: "arabic", ps: "arabic", sd: "arabic", ckb: "arabic",
  he: "hebrew", yi: "hebrew",
  hi: "devanagari", mr: "devanagari", ne: "devanagari", sa: "devanagari",
  bn: "bengali", as: "bengali",
  pa: "gurmukhi", gu: "gujarati", ta: "tamil", te: "telugu", kn: "kannada",
  ml: "malayalam", si: "sinhala",
  th: "thai", lo: "lao", km: "khmer", my: "myanmar",
  ka: "georgian", hy: "armenian", am: "ethiopic", ti: "ethiopic",
  ko: "hangul", ja: "kana", zh: "han", yue: "han", "zh-TW": "han",
};

/** Aksara yang dipakai bareng beberapa bahasa → deteksi aksara saja tak cukup. */
function scriptOf(code: string): string {
  const base = (code || "").split("-")[0].toLowerCase();
  return LANG_SCRIPT[code] ?? LANG_SCRIPT[base] ?? "latin";
}

// ── Kata fungsi ──────────────────────────────────────────────────────────────
// Sidik jari bahasa paling andal di teks bebas: kata fungsi (artikel, kata ganti,
// preposisi, kata kerja bantu) — sangat sering muncul dan jarang dipinjam
// antarbahasa. Untuk transkrip (ratusan kata) rasio kemunculannya stabil.
//
// Sengaja memuat SEMUA bahasa Latin yang berdekatan di katalog (skandinavia,
// slavia barat, iberia) supaya pasangan yang gampang tertukar — da/no/sv,
// es/pt, cs/sk, id/ms — saling mengoreksi, bukan cuma "bukan Inggris".
const STOPWORDS: Record<string, string[]> = {
  en: ["the", "and", "you", "that", "with", "this", "for", "are", "have", "not", "but", "what", "was", "they", "just", "like", "your", "from", "can", "about", "there", "were", "would", "know", "how"],
  da: ["og", "er", "det", "ikke", "til", "som", "med", "for", "der", "en", "et", "på", "jeg", "vi", "de", "han", "hun", "har", "kan", "skal", "men", "hvad", "hvor", "meget", "være"],
  no: ["og", "er", "det", "ikke", "til", "som", "med", "for", "der", "en", "et", "på", "jeg", "vi", "de", "han", "hun", "har", "kan", "skal", "men", "hva", "hvor", "mye", "være"],
  sv: ["och", "är", "det", "inte", "till", "som", "med", "för", "att", "en", "ett", "på", "jag", "vi", "de", "han", "hon", "har", "kan", "ska", "men", "vad", "var", "mycket", "vara"],
  nl: ["de", "het", "een", "van", "en", "is", "dat", "die", "met", "voor", "niet", "op", "ik", "we", "je", "zijn", "maar", "wat", "hoe", "ook", "aan", "als", "heeft", "kan", "naar"],
  de: ["der", "die", "das", "und", "ist", "ein", "eine", "nicht", "mit", "für", "auf", "ich", "wir", "sie", "aber", "auch", "was", "wie", "den", "dem", "sich", "haben", "kann", "noch", "von"],
  es: ["que", "de", "la", "el", "los", "las", "en", "con", "para", "por", "una", "como", "del", "más", "pero", "esto", "está", "muy", "se", "no", "es", "son", "hay", "cuando", "porque"],
  pt: ["de", "que", "não", "com", "para", "uma", "você", "como", "mais", "este", "esta", "são", "por", "os", "as", "em", "muito", "quando", "porque", "isso", "aqui", "está", "tem", "vai", "então"],
  fr: ["le", "la", "les", "des", "que", "de", "et", "un", "une", "pour", "avec", "dans", "sur", "est", "vous", "je", "nous", "pas", "ce", "qui", "mais", "comme", "plus", "tout", "être"],
  it: ["il", "lo", "la", "che", "di", "un", "una", "per", "con", "come", "più", "sono", "questo", "perché", "del", "non", "ma", "anche", "gli", "nel", "alla", "molto", "quando", "essere", "cosa"],
  ro: ["și", "nu", "este", "cu", "pentru", "care", "ce", "cum", "dar", "sau", "mai", "această", "acest", "din", "la", "un", "o", "să", "am", "ai", "foarte", "când", "pentru", "așa", "aici"],
  ca: ["que", "de", "el", "la", "els", "les", "amb", "per", "una", "com", "més", "però", "això", "molt", "són", "no", "és", "hi", "al", "del"],
  pl: ["nie", "się", "jest", "jak", "dla", "czy", "ale", "tak", "dlaczego", "przez", "tego", "oraz", "albo", "to", "na", "do", "za", "co", "już", "bardzo", "tylko", "jeszcze", "może", "gdy", "który"],
  cs: ["se", "je", "že", "jak", "pro", "ale", "jako", "jsem", "není", "proč", "tento", "tato", "na", "do", "to", "co", "už", "také", "jsou", "být", "když", "můžeme", "velmi", "ještě", "tady"],
  sk: ["sa", "je", "že", "ako", "pre", "ale", "som", "nie", "prečo", "tento", "táto", "na", "do", "to", "čo", "už", "aj", "sú", "byť", "keď", "veľmi", "ešte", "tu", "môže", "tak"],
  hr: ["je", "se", "da", "ne", "na", "za", "što", "ali", "kao", "koji", "ovo", "su", "sam", "smo", "ima", "vrlo", "kada", "ovdje", "samo", "još"],
  sl: ["je", "se", "da", "ne", "na", "za", "kaj", "ampak", "kot", "ki", "to", "so", "sem", "smo", "ima", "zelo", "ko", "tukaj", "samo", "še"],
  hu: ["és", "van", "nem", "hogy", "egy", "meg", "ez", "az", "de", "mint", "vagy", "mit", "hogyan", "miért", "csak", "már", "még", "nagyon", "itt", "amikor", "kell", "lehet", "volt", "ha", "is"],
  fi: ["ja", "on", "ei", "että", "se", "tämä", "mitä", "miten", "miksi", "kanssa", "mutta", "niin", "joka", "kun", "myös", "vain", "sitten", "hyvin", "olla", "voi", "nyt", "täällä", "he", "me", "sinä"],
  et: ["ja", "on", "ei", "et", "see", "mis", "kuidas", "aga", "ka", "siis", "väga", "siin", "kui", "või", "ma", "sa", "me", "nad", "oli", "saab"],
  lv: ["un", "ir", "nav", "ka", "tas", "kas", "bet", "arī", "tad", "ļoti", "šeit", "kad", "vai", "es", "tu", "mēs", "viņi", "bija", "var", "no"],
  lt: ["ir", "yra", "ne", "kad", "tai", "kas", "bet", "taip", "tada", "labai", "čia", "kai", "ar", "aš", "tu", "mes", "jie", "buvo", "gali", "iš"],
  tr: ["ve", "bir", "bu", "için", "ile", "ne", "nasıl", "neden", "ama", "çok", "daha", "gibi", "değil", "yeni", "şu", "da", "de", "var", "yok", "olarak", "kadar", "sonra", "şey", "beni", "biz"],
  id: ["yang", "dan", "dengan", "untuk", "tidak", "ini", "itu", "apa", "dari", "kamu", "saya", "bagaimana", "kenapa", "akan", "adalah", "bisa", "sudah", "juga", "ada", "kita", "jadi", "atau", "pada", "ke", "di"],
  ms: ["yang", "dan", "dengan", "untuk", "tidak", "ini", "itu", "apa", "dari", "awak", "saya", "bagaimana", "kenapa", "akan", "adalah", "boleh", "sudah", "juga", "ada", "kita", "jadi", "atau", "pada", "ke", "di"],
  vi: ["và", "của", "là", "có", "không", "được", "trong", "cho", "này", "một", "những", "với", "để", "người", "khi", "thì", "rất", "đã", "sẽ", "bạn"],
  tl: ["ang", "ng", "sa", "na", "ay", "mga", "hindi", "ako", "ikaw", "siya", "kami", "tayo", "para", "kung", "pero", "kasi", "yung", "dito", "lang", "naman"],
  sw: ["na", "ya", "wa", "kwa", "ni", "katika", "hii", "hiyo", "kama", "lakini", "sana", "hapa", "sasa", "tu", "yake", "kuwa", "watu", "sisi", "wewe", "mimi"],
  fil: ["ang", "ng", "sa", "na", "ay", "mga", "hindi", "ako", "ikaw", "siya", "kami", "tayo", "para", "kung", "pero", "kasi", "yung", "dito", "lang", "naman"],
  af: ["die", "en", "is", "nie", "wat", "vir", "met", "van", "ek", "ons", "hulle", "maar", "ook", "baie", "hier", "kan", "het", "om", "as", "dit"],
  // Bahasa non-Latin: kata fungsi dalam aksara aslinya — memisahkan bahasa
  // SESAMA aksara (ru vs uk vs bg, hi vs mr, ar vs fa).
  ru: ["и", "в", "не", "что", "это", "на", "как", "мы", "вы", "они", "но", "уже", "очень", "здесь", "когда", "потому", "быть", "есть", "для", "так"],
  uk: ["і", "в", "не", "що", "це", "на", "як", "ми", "ви", "вони", "але", "вже", "дуже", "тут", "коли", "тому", "бути", "є", "для", "так"],
  bg: ["и", "в", "не", "че", "това", "на", "как", "ние", "вие", "те", "но", "вече", "много", "тук", "когато", "защото", "да", "е", "за", "така"],
  sr: ["и", "у", "не", "да", "то", "на", "како", "ми", "ви", "они", "али", "већ", "врло", "овде", "када", "зато", "је", "су", "за", "тако"],
  el: ["και", "να", "το", "της", "του", "για", "με", "δεν", "είναι", "που", "στο", "μια", "ένα", "αυτό", "αλλά", "πολύ", "εδώ", "όταν", "γιατί", "θα"],
  ar: ["في", "من", "على", "هذا", "هذه", "التي", "الذي", "أن", "لا", "ما", "مع", "عن", "كان", "هو", "هي", "هنا", "لكن", "كل", "أو", "إلى"],
  fa: ["که", "را", "این", "با", "برای", "از", "در", "است", "می", "هم", "اما", "خیلی", "اینجا", "وقتی", "چون", "یا", "به", "ما", "شما", "آن"],
  he: ["של", "את", "לא", "זה", "עם", "אני", "אתה", "הוא", "היא", "אנחנו", "אבל", "מאוד", "כאן", "כאשר", "כי", "או", "יש", "אין", "על", "גם"],
  hi: ["और", "है", "में", "यह", "वह", "नहीं", "हम", "आप", "लेकिन", "बहुत", "यहाँ", "जब", "क्योंकि", "या", "को", "से", "का", "की", "के", "हैं"],
  th: ["และ", "ที่", "ไม่", "นี้", "กับ", "แต่", "มาก", "ที่นี่", "เมื่อ", "เพราะ", "หรือ", "ใน", "เป็น", "ของ", "ให้", "ได้", "จะ", "แล้ว", "ก็", "คือ"],
  ko: ["그리고", "하지만", "그래서", "여기", "너무", "정말", "이거", "저는", "우리", "있는", "있어요", "합니다", "해요", "에서", "으로", "니다", "는데", "습니다", "그런", "같은"],
  ja: ["です", "ます", "これ", "それ", "この", "その", "して", "から", "けど", "でも", "ちょっと", "という", "ない", "ある", "いる", "など", "とか", "たち", "って", "した"],
};

const LATIN_TOKEN_RE = /[^\p{L}\p{M}'’]+/u;

function tokenize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .normalize("NFC")
    .split(LATIN_TOKEN_RE)
    .filter((w) => w.length >= 1);
}

/** Rasio huruf yang berada di aksara `script` (0..1). Huruf saja, tanpa angka. */
function scriptRatio(text: string, script: string): number {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (!letters.length) return 0;
  const re = SCRIPT_RE[script];
  if (!re) return 1;
  let hit = 0;
  for (const ch of letters) if (re.test(ch)) hit++;
  return hit / letters.length;
}

/** Aksara paling dominan di teks — dipakai menamai bahasa tebakan saat menolak. */
function dominantScript(text: string): string {
  let best = "latin";
  let bestRatio = 0;
  for (const name of Object.keys(SCRIPT_RE)) {
    const r = scriptRatio(text, name);
    if (r > bestRatio) {
      bestRatio = r;
      best = name;
    }
  }
  return best;
}

interface Score {
  /** Fraksi token yang termasuk kata fungsi bahasa itu (0..1). */
  ratio: number;
  /** Berapa kata fungsi BERBEDA yang muncul — penangkal lagu/refrain. */
  distinct: number;
}

// Satu kata yang diulang-ulang (refrain "na na na", "da da da") tak boleh
// mengangkat skor sebuah bahasa sendirian. Tiap kata dihitung maksimal segini.
const MAX_REPEAT = 3;

/** Skor kata fungsi per bahasa. Diekspor untuk audit/uji ambang. */
export function stopwordScores(text: string): Record<string, Score> {
  const tokens = tokenize(text);
  const out: Record<string, Score> = {};
  if (!tokens.length) return out;
  const bag = new Map<string, number>();
  for (const t of tokens) bag.set(t, (bag.get(t) ?? 0) + 1);
  for (const [lang, words] of Object.entries(STOPWORDS)) {
    let hit = 0;
    let distinct = 0;
    for (const w of words) {
      const n = bag.get(w) ?? 0;
      if (!n) continue;
      distinct++;
      hit += Math.min(n, MAX_REPEAT);
    }
    out[lang] = { ratio: hit / tokens.length, distinct };
  }
  // Bahasa tanpa spasi (ja/th/ko) tak terpotong jadi token → hitung lewat
  // kemunculan substring supaya skornya sebanding dengan bahasa berspasi.
  const lower = (text || "").toLowerCase();
  const charCount = (lower.match(/\p{L}/gu) ?? []).length || 1;
  for (const lang of ["ja", "th", "ko"]) {
    let hit = 0;
    let distinct = 0;
    for (const w of STOPWORDS[lang] ?? []) {
      let idx = lower.indexOf(w);
      let n = 0;
      while (idx !== -1) {
        n++;
        idx = lower.indexOf(w, idx + w.length);
      }
      if (!n) continue;
      distinct++;
      hit += Math.min(n, MAX_REPEAT) * w.length;
    }
    const ratio = hit / charCount;
    if (ratio > (out[lang]?.ratio ?? 0)) out[lang] = { ratio, distinct };
  }
  return out;
}

// Ambang penolakan. Sengaja KONSERVATIF — transkrip pendek/ambigu selalu lolos;
// kita hanya menolak saat bahasa lain menang telak.
const MIN_LETTERS = 120;        // di bawah ini tak cukup bukti untuk menghakimi
const MIN_WINNER_SCORE = 0.05;  // pemenang harus benar-benar padat kata fungsi
const MIN_WINNER_DISTINCT = 6;  // ≥6 kata fungsi BERBEDA — lagu/refrain tak cukup
const WINNER_MARGIN = 3;        // pemenang ≥ 3× skor target → tolak tanpa syarat
const SOFT_MARGIN = 1.25;       // menang tipis → tolak HANYA bila judul sependapat
const SCRIPT_FLOOR = 0.25;      // aksara target minimal 25% huruf

// Bahasa yang kata fungsinya nyaris identik — pembeda antar-mereka tak bisa
// dipercaya, jadi mereka TAK PERNAH saling menuduh. (Video Denmark asli kerap
// skor Norwegia-nya cuma selisih 0,003; menolaknya = katalog sah ikut terbuang.)
const CLOSE_GROUPS: string[][] = [
  ["da", "no", "nb", "nn"],
  ["id", "ms"],
  ["cs", "sk"],
  ["hr", "sr", "bs", "sl"],
  ["tl", "fil"],
  ["nl", "af"],
  ["hi", "ur", "mr"],
  ["fa", "tg"],
  ["ru", "be"],
];

/** Apakah dua kode bahasa terlalu mirip untuk saling dijadikan bukti? */
function isCloseLang(a: string, b: string): boolean {
  const x = (a || "").split("-")[0].toLowerCase();
  const y = (b || "").split("-")[0].toLowerCase();
  if (x === y) return true;
  return CLOSE_GROUPS.some((g) => g.includes(x) && g.includes(y));
}

/**
 * Tebakan bahasa dari teks PENDEK (judul + nama channel). Terlalu lemah untuk
 * memvonis sendirian — dipakai cuma sebagai SAKSI KEDUA saat skor transkrip
 * menang tipis. Balikin null kalau tak ada kata fungsi yang kena sama sekali.
 */
function hintLang(text: string, script: string): string | null {
  const scores = stopwordScores(text || "");
  let best = "";
  let bestScore = 0;
  for (const [lang, s] of Object.entries(scores)) {
    if (scriptOf(lang) !== script || !s.distinct) continue;
    if (s.ratio > bestScore) {
      bestScore = s.ratio;
      best = lang;
    }
  }
  return best || null;
}

const LANG_NAME: Record<string, string> = {
  en: "Inggris", da: "Denmark", no: "Norwegia", sv: "Swedia", nl: "Belanda",
  de: "Jerman", es: "Spanyol", pt: "Portugis", fr: "Prancis", it: "Italia",
  ro: "Rumania", ca: "Katalan", pl: "Polandia", cs: "Ceko", sk: "Slovakia",
  hr: "Kroasia", sl: "Slovenia", hu: "Hungaria", fi: "Finlandia", et: "Estonia",
  lv: "Latvia", lt: "Lituania", tr: "Turki", id: "Indonesia", ms: "Melayu",
  vi: "Vietnam", tl: "Tagalog", fil: "Filipino", sw: "Swahili", af: "Afrikaans",
  ru: "Rusia", uk: "Ukraina", bg: "Bulgaria", sr: "Serbia", el: "Yunani",
  ar: "Arab", fa: "Persia", he: "Ibrani", hi: "Hindi", th: "Thai",
  ko: "Korea", ja: "Jepang", zh: "Mandarin", ka: "Georgia",
};

function nameOf(code: string): string {
  return LANG_NAME[code] ?? code.toUpperCase();
}

/**
 * Nilai apakah `text` (gabungan baris target transkrip) memang berbahasa
 * `target`. Balikin ok=false HANYA saat buktinya tegas:
 *
 *  1. AKSARA — target beraksara khusus (ka/ru/th/ja/…) tapi teksnya nyaris tak
 *     memuat aksara itu, atau target beraksara Latin tapi teksnya didominasi
 *     aksara lain. Ini sinyal terkuat dan hampir tak pernah salah.
 *  2. KATA FUNGSI — bahasa lain menang telak (≥3× skor target dan cukup padat).
 *     Inilah yang menangkap kasus "audio Inggris disimpan sebagai Denmark",
 *     di mana aksaranya sama-sama Latin sehingga aksara tak menolong.
 *
 * Teks pendek, skor tipis, atau bahasa yang tak punya daftar kata fungsi →
 * selalu ok=true (lebih baik meloloskan daripada membuang katalog yang sah).
 */
export function verifyTranscriptLang(text: string, target: string, hint = ""): LangVerdict {
  const raw = (text || "").trim();
  const base = (target || "").split("-")[0].toLowerCase();
  if (!raw || !base) return OK;

  const letters = (raw.match(/\p{L}/gu) ?? []).length;
  if (letters < MIN_LETTERS) return OK; // terlalu pendek untuk dinilai

  // ── 1. Aksara ──────────────────────────────────────────────────────────────
  const want = scriptOf(target);
  const ratio = scriptRatio(raw, want);
  if (want === "han") {
    // Mandarin: Han wajib dominan DAN kana tak boleh banyak (itu Jepang).
    if (scriptRatio(raw, "kana") > 0.15) {
      return { ok: false, detected: "ja", reason: `transkrip beraksara kana (Jepang), bukan ${nameOf(base)}` };
    }
  }
  if (want === "kana") {
    // Jepang: kana ATAU han (teks kanji-berat tetap sah).
    if (ratio < 0.1 && scriptRatio(raw, "han") < 0.3) {
      const dom = dominantScript(raw);
      return { ok: false, detected: null, reason: `transkrip beraksara ${dom}, bukan ${nameOf(base)}` };
    }
  } else if (ratio < SCRIPT_FLOOR) {
    const dom = dominantScript(raw);
    return {
      ok: false,
      detected: null,
      reason: `transkrip beraksara ${dom} (hanya ${Math.round(ratio * 100)}% aksara ${want}), bukan ${nameOf(base)}`,
    };
  }

  // ── 2. Kata fungsi ─────────────────────────────────────────────────────────
  if (!(base in STOPWORDS)) return OK; // tak punya sidik jari → jangan menghakimi
  const scores = stopwordScores(raw);
  const targetScore = scores[base]?.ratio ?? 0;
  let bestLang = "";
  let bestScore = 0;
  let bestDistinct = 0;
  for (const [lang, score] of Object.entries(scores)) {
    // Hanya bandingkan dengan bahasa SE-AKSARA — skor lintas-aksara tak setara
    // (mis. "и" Rusia takkan pernah muncul di teks Latin, jadi 0 palsu).
    if (scriptOf(lang) !== want) continue;
    if (score.ratio > bestScore) {
      bestScore = score.ratio;
      bestDistinct = score.distinct;
      bestLang = lang;
    }
  }
  // Kandidat pemenang tak layak dinilai → lolos.
  if (
    !bestLang ||
    bestLang === base ||
    isCloseLang(bestLang, base) || // bahasa kembar (da/no, id/ms) tak jadi bukti
    bestScore < MIN_WINNER_SCORE ||
    bestDistinct < MIN_WINNER_DISTINCT
  ) {
    return OK;
  }

  const verdict = (extra: string): LangVerdict => ({
    ok: false,
    detected: bestLang,
    reason: `transkrip terdeteksi bahasa ${nameOf(bestLang)} (skor ${bestScore.toFixed(3)} vs ${nameOf(base)} ${targetScore.toFixed(3)}${extra}), bukan ${nameOf(base)}`,
  });

  // Menang TELAK → tolak langsung.
  if (bestScore >= targetScore * WINNER_MARGIN) return verdict("");

  // Menang TIPIS → butuh saksi kedua. Ini kasus transkrip CAMPUR: Whisper yang
  // dipaksa ke bahasa target pada audio asing menghasilkan separuh teks asli +
  // separuh "bahasa target" halusinasi, jadi skornya berdekatan. Judul/nama
  // channel yang menunjuk bahasa yang SAMA dengan pemenang = konfirmasi cukup.
  // (Contoh: "Learn the Basics: Georgian" — transkrip en 0,073 vs da 0,051,
  // judul juga en → tolak. Sebaliknya "New Year in Denmark | Easy Danish 10"
  // berjudul Inggris tapi transkripnya menang di da → tetap lolos.)
  if (hint && bestScore >= targetScore * SOFT_MARGIN) {
    const witness = hintLang(hint, want);
    if (witness && witness === bestLang) return verdict(", judul sependapat");
  }
  return OK;
}

/**
 * Versi praktis untuk pemanggil yang memegang cues: ambil contoh baris target
 * (dibatasi supaya murah) lalu nilai.
 *
 * `hint` = judul + nama channel video kalau ada — dipakai sebagai saksi kedua
 * saat skor transkrip menang tipis (lihat verifyTranscriptLang).
 */
export function verifyCuesLang(
  cues: { target?: unknown }[],
  target: string,
  hint = "",
  sampleChars = 6000
): LangVerdict {
  let text = "";
  for (const c of cues) {
    const t = c?.target;
    if (typeof t !== "string" || !t) continue;
    text += (text ? " " : "") + t;
    if (text.length >= sampleChars) break;
  }
  return verifyTranscriptLang(text, target, hint);
}
