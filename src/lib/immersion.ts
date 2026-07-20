// Watch & Learn (immersion) — versi web dari fitur mobile Linguo.
// Katalog video YouTube per bahasa + kategori, dipakai buat belajar bahasa lewat
// konten yang disukai. Search jalan lewat Edge Function `yt-search` (project
// Supabase yang sama dengan app mobile), jadi gak butuh API key di client.

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Batas durasi katalog Watch & Learn: video pendek (≤5 mnt) biar transkrip AI
// (ASR ~1 mnt/video) murah + video pendek memang lebih pas buat belajar. Dipakai
// sebagai `maxDurationSec` saat search & saring ganda di client.
export const WATCH_MAX_DURATION_SEC = 300;

// Batas durasi untuk daftar REKOMENDASI di player (bukan search katalog): 20 mnt,
// sama dengan katalog. Sengaja TIDAK memakai 300 (5 mnt) — bucket `videoDuration=
// short` (<4 mnt) YouTube didominasi Shorts/portrait, jadi setelah Shorts dibuang
// daftar jadi nyaris kosong. Rentang 20 mnt mengambil dari video landscape normal
// (yang memang ditonton user) sehingga rekomendasi tetap penuh & tanpa portrait.
export const WATCH_REC_MAX_DURATION_SEC = 20 * 60;

/** Format durasi detik → "m:ss" (mis. 245 → "4:05"). null/0 → "". */
export function formatDuration(sec?: number | null): string {
  if (!sec || sec <= 0) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Format jumlah penonton → ringkas ala YouTube (1200 → "1,2 rb", 3_400_000 →
 *  "3,4 jt"). null/0 → "". Dipakai buat badge "views" di kartu Watch & Learn. */
export function formatViews(views?: number | null): string {
  if (views == null || views < 0) return "";
  if (views < 1000) return `${views}`;
  if (views < 1_000_000) {
    const n = views / 1000;
    return `${n >= 100 ? Math.round(n) : n.toFixed(1).replace(/\.0$/, "").replace(".", ",")} rb`;
  }
  const n = views / 1_000_000;
  return `${n >= 100 ? Math.round(n) : n.toFixed(1).replace(/\.0$/, "").replace(".", ",")} jt`;
}

export interface ImmersionVideo {
  videoId: string;
  title: string;
  thumbnail: string | null;
  channel?: string | null;
  /** Durasi video dalam detik (dari yt-search). Dipakai badge & filter durasi. */
  duration?: number | null;
  /** Jumlah penonton (viewCount YouTube). Dipakai badge "views" di kartu. */
  views?: number | null;
  /** Estimasi level CEFR dari transkrip — hanya diisi untuk video tab "Siap". */
  level?: import("./cefr").CefrLevel | null;
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
  region?: string; // regionCode YouTube (ISO-3166, mis. BR/PT) — memisah varian satu bahasa
}

// Daftar bahasa immersion — diperluas menyamai katalog app Linguo. `code` = kode
// ISO-639 untuk relevanceLanguage YouTube (unik per entri), `native` = tag pembias
// query, `country` = ISO-2 buat bendera rounded-rectangle.
export const IMMERSION_LANGS: ImmersionLang[] = [
  { code: "en", name: "Inggris", native: "English", flag: "🇬🇧", country: "gb" },
  { code: "ja", name: "Jepang", native: "日本語", flag: "🇯🇵", country: "jp" },
  { code: "ko", name: "Korea", native: "한국어", flag: "🇰🇷", country: "kr" },
  { code: "zh", name: "Mandarin", native: "中文", flag: "🇨🇳", country: "cn" },
  // Spanyol dipisah per varian — Eropa (Kastilia) vs Amerika Latin punya beda
  // aksen, kosakata & "seseo". Base tetap `code: "es"` (default relevanceLanguage,
  // sesi & cache lama tetap valid) kini dibias ke Spanyol lewat regionCode ES;
  // varian Amerika Latin pakai regionCode MX (pasar penutur terbesar).
  { code: "es", name: "Spanyol (Eropa)", native: "Español", flag: "🇪🇸", country: "es", region: "ES" },
  { code: "es-419", name: "Spanyol (Amerika Latin)", native: "Español", flag: "🇲🇽", country: "mx", searchCode: "es", region: "MX" },
  { code: "fr", name: "Prancis", native: "Français", flag: "🇫🇷", country: "fr" },
  { code: "de", name: "Jerman", native: "Deutsch", flag: "🇩🇪", country: "de" },
  { code: "it", name: "Italia", native: "Italiano", flag: "🇮🇹", country: "it" },
  { code: "pt-BR", name: "Portugis (Brasil)", native: "Português", flag: "🇧🇷", country: "br", searchCode: "pt", region: "BR" },
  { code: "pt-PT", name: "Portugis (Portugal)", native: "Português", flag: "🇵🇹", country: "pt", searchCode: "pt", region: "PT" },
  { code: "nl", name: "Belanda", native: "Nederlands", flag: "🇳🇱", country: "nl" },
  { code: "ru", name: "Rusia", native: "Русский", flag: "🇷🇺", country: "ru" },
  // Arab dipisah per dialek — jaraknya jauh (Maroko vs Teluk vs Mesir bisa saling
  // tak paham), jadi kurasi video dibedakan lewat regionCode + tag native dialek.
  // MSA tetap `code: "ar"` (default, pan-Arab, sesi & cache lama tetap valid);
  // transkripsi/terjemahan/transliterasi otomatis ikut dialek yg benar-benar diucap.
  { code: "ar", name: "Arab (MSA)", native: "العربية", flag: "🇸🇦", country: "sa" },
  { code: "ar-EG", name: "Arab (Mesir)", native: "العربية المصرية", flag: "🇪🇬", country: "eg", searchCode: "ar", region: "EG" },
  { code: "ar-LB", name: "Arab (Levantine)", native: "اللهجة الشامية", flag: "🇱🇧", country: "lb", searchCode: "ar", region: "LB" },
  { code: "ar-AE", name: "Arab (Teluk)", native: "اللهجة الخليجية", flag: "🇦🇪", country: "ae", searchCode: "ar", region: "AE" },
  { code: "ar-MA", name: "Arab (Maroko)", native: "الدارجة المغربية", flag: "🇲🇦", country: "ma", searchCode: "ar", region: "MA" },
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
  pt: "Peppa Pig Bob Esponja Patrulha Canina Bluey", // Brasil (pt-BR)
  "pt-PT": "Peppa Pig Português Patrulha Pata Bluey desenhos animados", // Portugal (dublagem PT-PT)
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

// Kreator ASLI dari negara asal bahasa (bukan MrBeast yang di-dub). Tujuannya:
// belajar Prancis → dapat YouTuber Prancis beneran (Squeezie, Cyprien, dll), bukan
// versi terjemahan konten Amerika. Tiap entri = beberapa nama kreator top &
// mapan negara itu, dijahit jadi satu query — YouTube mengangkat channel-channel
// tsb yang kontennya memang dalam bahasa target. Bahasa non-Latin tetap dibekingi
// filter aksara. Bahasa tanpa daftar kurasi jatuh ke `q` generik yang dilokalkan
// (kata "youtuber/vlog" + nama native bahasa, mis. "youtuber vlog Ελληνικά").
const CREATOR_NATIVE: Record<string, string> = {
  en: "MrBeast Sidemen KSI Dude Perfect",
  id: "Windah Basudara Atta Halilintar Deddy Corbuzier Ria Ricis",
  es: "elrubius AuronPlay Ibai TheGrefg Luisito Comunica",
  pt: "Whindersson Nunes Felipe Neto Luccas Neto Você Sabia", // Brasil (pt-BR)
  "pt-PT": "Wuant SirKazzio Windoh Tiagovski youtuber português Portugal", // Portugal (pt-PT)
  fr: "Squeezie Cyprien Norman McFly et Carlito Amixem",
  de: "Julien Bam Gronkh BibisBeautyPalace Freekickerz",
  it: "Favij Me contro Te iPantellas St3pNy",
  nl: "Enzo Knol StukTV Kwebbelkop Dylan Haegens",
  ru: "A4 Влад Бумага Литвин EeOneGuy",
  uk: "влогер українською блог відео",
  pl: "Blowek Stuu Sylwester Wardęga Reżyser",
  tr: "Enes Batur Orkun Işıtmak Ruhi Çenet Danla Bilic",
  ar: "AboFlah أحمد حسن وزينب يوتيوبر عربي",
  hi: "CarryMinati Ashish Chanchlani BB Ki Vines Techno Gamerz",
  ja: "ヒカキン はじめしゃちょー 東海オンエア",
  ko: "쯔양 보겸 허팝",
  zh: "李子柒 華農兄弟 老高與小茉",
  th: "zbing z. บี้เดอะสกา ยูทูปเบอร์",
  vi: "Cris Devil Gamer Bà Tân Vlog Ẩm Thực Mẹ Làm",
  fil: "Cong TV Lloyd Cafe Cadena Zeinab Harake",
  fa: "یوتیوبر ایرانی ولاگ ویدیو",
  el: "youtuber βλογκ βίντεο",
};

// PENTING: `q` sengaja TANPA nama franchise global (Peppa Pig, Cocomelon, dll).
// Nama franchise Inggris jadi sinyal ranking yang terlalu kuat — dia menindih
// relevanceLanguage sehingga hasilnya kebanjiran video Inggris walau bahasa target
// lain (mis. pilih Hungaria tapi keluar Peppa Pig Inggris). Dengan kata kategori
// generik saja + tag native + relevanceLanguage, YouTube mengembalikan konten
// beneran dalam bahasa target (terbukti: "cartoon Magyar" → rajzfilm/mese magyarul).
export const IMMERSION_CATEGORIES: ImmersionCategory[] = [
  { id: "populer", label: "Populer", emoji: "✨", q: "popular trending" },
  {
    id: "kreator",
    label: "Kreator",
    emoji: "🔥",
    // Fallback generik utk bahasa tanpa daftar kurasi: kata "youtuber/vlog" +
    // nama native bahasa (dijahit di buildQuery) → kreator lokal, bukan Inggris.
    q: "youtuber vlog",
    perLang: CREATOR_NATIVE,
  },
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
  // [linguo-patch:watch-vlog-relevance-v1] TANPA fresh:true. `fresh` memaksa
  // order=date (upload terbaru), dan utk keyword generik "daily vlog" itu membanjiri
  // hasil dgn vlog global paling baru — mayoritas India (judul Inggris/latin tak
  // ber-tag audio, jadi lolos filter bahasa) → bocor ke rail bahasa lain (mis.
  // Spanyol keluar Hindi). order=relevance bikin relevanceLanguage + tag native
  // ("Español") menang → hasilnya beneran bahasa target. (Terverifikasi via yt-search.)
  { id: "vlog", label: "Vlog", emoji: "📹", q: "daily vlog" },
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
  // Cari override per bahasa pakai `code` dulu (mis. "pt-PT" khusus Portugal), lalu
  // jatuh ke `searchCode` (varian tanpa daftar sendiri, mis. "pt-BR" → "pt") biar
  // varian regional tetap dapat query terkurasi bahasanya.
  const cfg = <T,>(m: Record<string, T>): T | undefined => m[lang.code] ?? (lang.searchCode ? m[lang.searchCode] : undefined);
  const topic = cat.news
    ? cfg(NEWS_WORD) ?? "news"
    : (cat.perLang ? cfg(cat.perLang) : undefined) ?? cat.q;
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
  // Varian regional (mis. "ar-EG") tak punya regex sendiri → pakai aksara base
  // ("ar") biar filter aksara Arab tetap jalan untuk semua dialek.
  const target = TARGET_SCRIPT[langCode] ?? TARGET_SCRIPT[langCode.split("-")[0]];
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

// Thumbnail resolusi tinggi (1280×720) — untuk tampilan besar/fullscreen seperti
// layar diam ala Netflix. maxresdefault kadang tak tersedia (404) → pemakainya
// WAJIB pasang onError fallback ke youtubeThumb (hqdefault) biar tak blank.
export function youtubeThumbMax(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

// Search YouTube lewat Edge Function `yt-search`. Dibias ke bahasa target.
// [linguo-patch:watch-caption-agnostic-v1] TIDAK lagi mensyaratkan caption manual
// (dulu default withCaptions=true → videoCaption=closedCaption). YouTube hanya
// menghitung caption yang DIUNGGAH MANUAL, bukan auto-caption — jadi filter itu
// mengosongkan katalog bahasa minim konten (mis. Georgia: kategori Vlog/Kartun +
// durasi jadi nihil). Player sudah punya fallback ASR (yt-asr Gemini) saat video
// tak bercaption, jadi katalog aman tanpa syarat caption. Caller boleh tetap kirim
// withCaptions:true kalau memang perlu track manual.
// Return [] kalau gagal (quota/network) biar UI turun ke empty state, bukan error.
export async function searchImmersionVideos(params: {
  query: string;
  language?: string;
  withCaptions?: boolean;
  order?: "date" | "rating" | "viewCount" | "relevance";
  max?: number;
  pageToken?: string;
  /** Batas durasi (detik). Diteruskan ke yt-search buat mode video pendek. */
  maxDurationSec?: number;
  /** Batas bawah durasi (detik). Membias hasil ke bucket `medium` YouTube +
   *  saring >= nilai ini — dipakai tab filter durasi "5–10" / "10–20 mnt". */
  minDurationSec?: number;
  /** Kode negara ISO-3166 (mis. BR/PT) → YouTube regionCode; memisah varian bahasa. */
  regionCode?: string;
  /** Buang video portrait/YouTube Shorts dari hasil. Default true untuk web —
   *  Watch & Learn hanya menampilkan video landscape (katalog + rekomendasi). */
  excludeShorts?: boolean;
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
        withCaptions: params.withCaptions ?? false,
        order: params.order,
        max: params.max ?? 18,
        pageToken: params.pageToken,
        maxDurationSec: params.maxDurationSec,
        minDurationSec: params.minDurationSec,
        regionCode: params.regionCode,
        excludeShorts: params.excludeShorts ?? true,
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

/** Ambil jumlah penonton (dan durasi) untuk sekumpulan videoId lewat mode `ids`
 *  di yt-search. Dipakai tab "Terjemahan Siap" yang kartunya lahir dari cache
 *  transkrip DB (tanpa viewCount) → di-enrich supaya badge views ikut muncul.
 *  Balikin Map videoId → { views, duration }. Best-effort: gagal → Map kosong. */
export async function fetchVideoStats(
  ids: string[]
): Promise<Map<string, { views: number | null; duration: number | null }>> {
  const out = new Map<string, { views: number | null; duration: number | null }>();
  const clean = ids.filter((v) => typeof v === "string" && v.length === 11).slice(0, 50);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !clean.length) return out;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/yt-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ ids: clean }),
    });
    if (!res.ok) return out;
    const data = (await res.json()) as {
      stats?: { videoId?: string; views?: number | null; duration?: number | null }[];
    };
    for (const s of data.stats ?? []) {
      if (s && typeof s.videoId === "string") {
        out.set(s.videoId, {
          views: typeof s.views === "number" ? s.views : null,
          duration: typeof s.duration === "number" ? s.duration : null,
        });
      }
    }
    return out;
  } catch {
    return out;
  }
}

// ── Riwayat tonton (localStorage) — buat rail "Lanjut Menonton" ──────────────
export interface WatchHistoryItem {
  videoId: string;
  title: string;
  thumbnail: string | null;
  channel?: string | null;
  /** Durasi detik — buat badge durasi di kartu "Lanjut Menonton". Entri lama: undefined. */
  duration?: number | null;
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

// Hapus riwayat tonton. Tanpa argumen → bersihkan semua. Dengan `lang` →
// hanya buang riwayat bahasa itu (dipakai tombol "Hapus" yang cuma menampilkan
// video bahasa aktif, biar riwayat bahasa lain tak ikut terhapus). Balikin sisa.
export function clearWatchHistory(lang?: string): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    if (!lang) {
      window.localStorage.removeItem(HISTORY_KEY);
      return [];
    }
    const next = getWatchHistory().filter((h) => h.lang !== lang);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    /* abaikan */
    return getWatchHistory();
  }
}
