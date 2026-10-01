// [latihan-menulis-v1] Katalog aksara untuk menu "Latihan Menulis" (dashboard siswa
// & pengajar). Berkas ini KEMBAR dengan linguo-admin-dashboard/src/lib/writingScripts.ts
// — ubah dua-duanya sekaligus.
//
// Format ringkas: "aksara cara-baca;arti" dipisah "|". Arti/nama boleh kosong.
// Urutan goresan TIDAK disimpan di sini: aksara Jepang diambil dari KanjiVG dan
// Hanzi dari hanzi-writer-data saat dibuka (lihat `strokes`). Aksara lain belum
// punya data goresan terbuka, jadi latihannya menjiplak bentuk huruf.

export type Glyph = { c: string; r: string; n?: string };

export type ScriptSet = {
  id: string;
  label: string;
  /** Sumber urutan goresan; kosong = jiplak bentuk huruf saja. */
  strokes?: "kanjivg" | "hanzi";
  /** `c` berisi huruf besar + kecil (Аа) — yang dibunyikan huruf kecilnya. */
  pair?: boolean;
  glyphs: Glyph[];
};

export type ScriptLang = {
  key: string;
  label: string;
  /** Kode bahasa untuk TTS & atribut lang. */
  code: string;
  /** Pencocok nama bahasa kelas ("Japanese", "Bahasa Jepang", …). */
  match: RegExp;
  rtl?: boolean;
  sets: ScriptSet[];
};

const g = (s: string): Glyph[] =>
  s.split("|").map((x) => {
    const [kiri, n] = x.split(";");
    const i = kiri.indexOf(" ");
    return { c: kiri.slice(0, i), r: kiri.slice(i + 1), ...(n ? { n } : {}) };
  });

const HIRAGANA =
  "あ a|い i|う u|え e|お o|か ka|き ki|く ku|け ke|こ ko|さ sa|し shi|す su|せ se|そ so|た ta|ち chi|つ tsu|て te|と to|な na|に ni|ぬ nu|ね ne|の no|は ha|ひ hi|ふ fu|へ he|ほ ho|ま ma|み mi|む mu|め me|も mo|や ya|ゆ yu|よ yo|ら ra|り ri|る ru|れ re|ろ ro|わ wa|を wo|ん n";

const KATAKANA =
  "ア a|イ i|ウ u|エ e|オ o|カ ka|キ ki|ク ku|ケ ke|コ ko|サ sa|シ shi|ス su|セ se|ソ so|タ ta|チ chi|ツ tsu|テ te|ト to|ナ na|ニ ni|ヌ nu|ネ ne|ノ no|ハ ha|ヒ hi|フ fu|ヘ he|ホ ho|マ ma|ミ mi|ム mu|メ me|モ mo|ヤ ya|ユ yu|ヨ yo|ラ ra|リ ri|ル ru|レ re|ロ ro|ワ wa|ヲ wo|ン n";

const KANJI_N5 =
  "一 ichi;satu|二 ni;dua|三 san;tiga|四 yon;empat|五 go;lima|六 roku;enam|七 nana;tujuh|八 hachi;delapan|九 kyuu;sembilan|十 juu;sepuluh|百 hyaku;seratus|千 sen;seribu|万 man;sepuluh ribu|円 en;yen|日 hi / nichi;hari, matahari|月 tsuki;bulan|火 hi;api|水 mizu;air|木 ki;pohon|金 kane;emas, uang|土 tsuchi;tanah|人 hito;orang|口 kuchi;mulut|目 me;mata|耳 mimi;telinga|手 te;tangan|足 ashi;kaki|山 yama;gunung|川 kawa;sungai|田 ta;sawah|上 ue;atas|下 shita;bawah|中 naka;dalam, tengah|左 hidari;kiri|右 migi;kanan|大 ookii;besar|小 chiisai;kecil|男 otoko;laki-laki|女 onna;perempuan|子 ko;anak|父 chichi;ayah|母 haha;ibu|友 tomo;teman|先 saki;dahulu|生 sei;hidup, lahir|学 gaku;belajar|校 kou;sekolah|本 hon;buku|名 na;nama|年 toshi;tahun|時 toki;waktu, jam|分 fun;menit|今 ima;sekarang|何 nani;apa|行 iku;pergi|来 kuru;datang|食 taberu;makan|飲 nomu;minum|見 miru;melihat|聞 kiku;mendengar|読 yomu;membaca|書 kaku;menulis|話 hanasu;berbicara|語 go;bahasa|国 kuni;negara|外 soto;luar|天 ten;langit|気 ki;semangat, udara|雨 ame;hujan|花 hana;bunga|車 kuruma;mobil|電 den;listrik|駅 eki;stasiun|店 mise;toko|白 shiro;putih|高 takai;tinggi, mahal|安 yasui;murah|新 atarashii;baru|古 furui;lama|長 nagai;panjang";

const HANZI_HSK1 =
  "一 yī;satu|二 èr;dua|三 sān;tiga|四 sì;empat|五 wǔ;lima|六 liù;enam|七 qī;tujuh|八 bā;delapan|九 jiǔ;sembilan|十 shí;sepuluh|人 rén;orang|大 dà;besar|小 xiǎo;kecil|中 zhōng;tengah|国 guó;negara|我 wǒ;saya|你 nǐ;kamu|他 tā;dia (laki-laki)|她 tā;dia (perempuan)|们 men;penanda jamak|好 hǎo;baik|是 shì;adalah|不 bù;tidak|的 de;partikel kepunyaan|了 le;partikel selesai|在 zài;di, sedang|有 yǒu;punya, ada|这 zhè;ini|那 nà;itu|什 shén;apa (什么)|么 me;akhiran tanya (什么)|吗 ma;partikel tanya|呢 ne;partikel tanya balik|和 hé;dan|很 hěn;sangat|吃 chī;makan|喝 hē;minum|看 kàn;melihat|听 tīng;mendengar|说 shuō;berbicara|读 dú;membaca|写 xiě;menulis|学 xué;belajar|生 shēng;lahir, murid|老 lǎo;tua|师 shī;guru|朋 péng;teman (朋友)|友 yǒu;teman|爸 bà;ayah|妈 mā;ibu|儿 ér;anak|子 zǐ;anak|女 nǚ;perempuan|家 jiā;rumah, keluarga|水 shuǐ;air|茶 chá;teh|饭 fàn;nasi|书 shū;buku|字 zì;huruf|天 tiān;hari, langit|月 yuè;bulan|日 rì;hari, matahari|年 nián;tahun|上 shàng;atas|下 xià;bawah|来 lái;datang|去 qù;pergi|爱 ài;cinta|谢 xiè;terima kasih|再 zài;lagi|见 jiàn;bertemu|多 duō;banyak|少 shǎo;sedikit|钱 qián;uang|买 mǎi;membeli|想 xiǎng;ingin, berpikir|叫 jiào;dipanggil|名 míng;nama|语 yǔ;bahasa|汉 hàn;Han (Tionghoa)";

const HANGUL_KONSONAN =
  "ㄱ g / k;giyeok|ㄴ n;nieun|ㄷ d / t;digeut|ㄹ r / l;rieul|ㅁ m;mieum|ㅂ b / p;bieup|ㅅ s;siot|ㅇ ng;ieung|ㅈ j;jieut|ㅊ ch;chieut|ㅋ k;kieuk|ㅌ t;tieut|ㅍ p;pieup|ㅎ h;hieut|ㄲ kk;ssanggiyeok|ㄸ tt;ssangdigeut|ㅃ pp;ssangbieup|ㅆ ss;ssangsiot|ㅉ jj;ssangjieut";

const HANGUL_VOKAL =
  "ㅏ a|ㅑ ya|ㅓ eo|ㅕ yeo|ㅗ o|ㅛ yo|ㅜ u|ㅠ yu|ㅡ eu|ㅣ i|ㅐ ae|ㅒ yae|ㅔ e|ㅖ ye|ㅘ wa|ㅙ wae|ㅚ oe|ㅝ wo|ㅞ we|ㅟ wi|ㅢ ui";

const HANGUL_SUKU =
  "가 ga|나 na|다 da|라 ra|마 ma|바 ba|사 sa|아 a|자 ja|차 cha|카 ka|타 ta|파 pa|하 ha|한 han|글 geul|안 an|녕 nyeong|감 gam|요 yo";

const THAI_KONSONAN =
  "ก ko kai;ayam|ข kho khai;telur|ฃ kho khuat;botol (sudah tidak dipakai)|ค kho khwai;kerbau|ฅ kho khon;orang (sudah tidak dipakai)|ฆ kho rakhang;lonceng|ง ngo ngu;ular|จ cho chan;piring|ฉ cho ching;simbal|ช cho chang;gajah|ซ so so;rantai|ฌ cho choe;pohon|ญ yo ying;perempuan|ฎ do chada;mahkota|ฏ to patak;tombak|ฐ tho than;alas|ฑ tho montho;Montho (tokoh)|ฒ tho phuthao;orang tua|ณ no nen;samanera|ด do dek;anak|ต to tao;kura-kura|ถ tho thung;kantong|ท tho thahan;tentara|ธ tho thong;bendera|น no nu;tikus|บ bo baimai;daun|ป po pla;ikan|ผ pho phueng;lebah|ฝ fo fa;tutup|พ pho phan;nampan|ฟ fo fan;gigi|ภ pho samphao;kapal layar|ม mo ma;kuda|ย yo yak;raksasa|ร ro ruea;perahu|ล lo ling;monyet|ว wo waen;cincin|ศ so sala;paviliun|ษ so ruesi;pertapa|ส so suea;harimau|ห ho hip;peti|ฬ lo chula;layang-layang|อ o ang;baskom|ฮ ho nokhuk;burung hantu";

// Vokal Thai tidak berdiri sendiri — ditulis menempel pada konsonan อ (o ang).
const THAI_VOKAL =
  "อะ a;pendek|อา aa;panjang|อิ i;pendek|อี ii;panjang|อึ ue;pendek|อือ uee;panjang|อุ u;pendek|อู uu;panjang|เอะ e;pendek|เอ ee;panjang|แอะ ae;pendek|แอ aae;panjang|โอะ o;pendek|โอ oo;panjang|เอาะ o;terbuka, pendek|ออ oo;terbuka, panjang|เออ oe;panjang|เอีย ia|เอือ uea|อัว ua|อำ am|ไอ ai|ใอ ai|เอา ao";

const THAI_ANGKA =
  "๐ sun;0|๑ nueng;1|๒ song;2|๓ sam;3|๔ si;4|๕ ha;5|๖ hok;6|๗ chet;7|๘ paet;8|๙ kao;9";

const ARAB_HIJAIYAH =
  "ا alif|ب ba|ت ta|ث tsa|ج jim|ح ha|خ kha|د dal|ذ dzal|ر ra|ز zai|س sin|ش syin|ص shad|ض dhad|ط tha|ظ zha|ع 'ain|غ ghain|ف fa|ق qaf|ك kaf|ل lam|م mim|ن nun|ه ha|و wau|ي ya";

const ARAB_ANGKA =
  "٠ shifr;0|١ wahid;1|٢ itsnan;2|٣ tsalatsah;3|٤ arba'ah;4|٥ khamsah;5|٦ sittah;6|٧ sab'ah;7|٨ tsamaniyah;8|٩ tis'ah;9";

const KIRIL_RUSIA =
  "Аа a|Бб b|Вв v|Гг g|Дд d|Ее ye|Ёё yo|Жж zh|Зз z|Ии i|Йй y;i pendek|Кк k|Лл l|Мм m|Нн n|Оо o|Пп p|Рр r|Сс s|Тт t|Уу u|Фф f|Хх kh|Цц ts|Чч ch|Шш sh|Щщ shch|Ъъ -;tanda keras|Ыы y|Ьь -;tanda lunak|Ээ e|Юю yu|Яя ya";

const DEVANAGARI_VOKAL =
  "अ a|आ aa|इ i|ई ii|उ u|ऊ uu|ऋ ri|ए e|ऐ ai|ओ o|औ au|अं am|अः ah";

const DEVANAGARI_KONSONAN =
  "क ka|ख kha|ग ga|घ gha|ङ nga|च cha|छ chha|ज ja|झ jha|ञ nya|ट ṭa|ठ ṭha|ड ḍa|ढ ḍha|ण ṇa|त ta|थ tha|द da|ध dha|न na|प pa|फ pha|ब ba|भ bha|म ma|य ya|र ra|ल la|व va|श sha|ष ṣha|स sa|ह ha";

const YUNANI =
  "Αα a;alfa|Ββ v;vita|Γγ g;gama|Δδ d;delta|Εε e;epsilon|Ζζ z;zita|Ηη i;ita|Θθ th;thita|Ιι i;iota|Κκ k;kapa|Λλ l;lamda|Μμ m;mi|Νν n;ni|Ξξ ks;ksi|Οο o;omikron|Ππ p;pi|Ρρ r;ro|Σσ s;sigma|Ττ t;taf|Υυ i;ipsilon|Φφ f;fi|Χχ kh;khi|Ψψ ps;psi|Ωω o;omega";

const IBRANI =
  "א alef|ב bet|ג gimel|ד dalet|ה he|ו vav|ז zayin|ח chet|ט tet|י yod|כ kaf|ל lamed|מ mem|נ nun|ס samekh|ע ayin|פ pe|צ tsadi|ק qof|ר resh|ש shin|ת tav";

export const SCRIPT_LANGS: ScriptLang[] = [
  {
    key: "ja", label: "Jepang", code: "ja", match: /jepang|japan|nihon/i,
    sets: [
      { id: "ja-hiragana", label: "Hiragana", strokes: "kanjivg", glyphs: g(HIRAGANA) },
      { id: "ja-katakana", label: "Katakana", strokes: "kanjivg", glyphs: g(KATAKANA) },
      { id: "ja-kanji-n5", label: "Kanji dasar (N5)", strokes: "kanjivg", glyphs: g(KANJI_N5) },
    ],
  },
  {
    key: "zh", label: "Mandarin", code: "zh", match: /mandarin|chinese|china|cina|tiongkok|hanyu/i,
    sets: [{ id: "zh-hanzi-hsk1", label: "Hanzi dasar (HSK 1)", strokes: "hanzi", glyphs: g(HANZI_HSK1) }],
  },
  {
    key: "ko", label: "Korea", code: "ko", match: /korea/i,
    sets: [
      { id: "ko-konsonan", label: "Konsonan", glyphs: g(HANGUL_KONSONAN) },
      { id: "ko-vokal", label: "Vokal", glyphs: g(HANGUL_VOKAL) },
      { id: "ko-suku", label: "Suku kata", glyphs: g(HANGUL_SUKU) },
    ],
  },
  {
    key: "th", label: "Thailand", code: "th", match: /thai/i,
    sets: [
      { id: "th-konsonan", label: "Konsonan", glyphs: g(THAI_KONSONAN) },
      { id: "th-vokal", label: "Vokal", glyphs: g(THAI_VOKAL) },
      { id: "th-angka", label: "Angka", glyphs: g(THAI_ANGKA) },
    ],
  },
  {
    key: "ar", label: "Arab", code: "ar", match: /arab/i, rtl: true,
    sets: [
      { id: "ar-hijaiyah", label: "Huruf hijaiyah", glyphs: g(ARAB_HIJAIYAH) },
      { id: "ar-angka", label: "Angka", glyphs: g(ARAB_ANGKA) },
    ],
  },
  {
    key: "ru", label: "Rusia", code: "ru", match: /rusia|russia/i,
    sets: [{ id: "ru-kiril", label: "Alfabet Kiril", pair: true, glyphs: g(KIRIL_RUSIA) }],
  },
  {
    key: "hi", label: "Hindi", code: "hi", match: /hindi|india/i,
    sets: [
      { id: "hi-vokal", label: "Vokal", glyphs: g(DEVANAGARI_VOKAL) },
      { id: "hi-konsonan", label: "Konsonan", glyphs: g(DEVANAGARI_KONSONAN) },
    ],
  },
  {
    key: "el", label: "Yunani", code: "el", match: /yunani|greek/i,
    sets: [{ id: "el-alfabet", label: "Alfabet", pair: true, glyphs: g(YUNANI) }],
  },
  {
    key: "he", label: "Ibrani", code: "he", match: /ibrani|hebrew/i, rtl: true,
    sets: [{ id: "he-alefbet", label: "Alef-bet", glyphs: g(IBRANI) }],
  },
];

/** Bahasa aksara pertama yang cocok dengan salah satu nama bahasa kelas. */
export function pilihBahasaAksara(namaBahasa: (string | null | undefined)[]): ScriptLang | null {
  for (const nama of namaBahasa) {
    if (!nama) continue;
    const kena = SCRIPT_LANGS.find((l) => l.match.test(nama));
    if (kena) return kena;
  }
  return null;
}

/* ── Urutan goresan ───────────────────────────────────────────────────────────
   Semua goresan dinormalkan ke kotak 109×109 (ukuran asli KanjiVG) berupa path
   GARIS TENGAH, jadi satu perender melayani kana, kanji, dan Hanzi sekaligus. */

export const KOTAK_GORESAN = 109;
const cacheGoresan = new Map<string, Promise<string[] | null>>();

async function ambilKanjiVg(c: string): Promise<string[] | null> {
  const hex = (c.codePointAt(0) ?? 0).toString(16).padStart(5, "0");
  const res = await fetch(`https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@r20240807/kanji/${hex}.svg`);
  if (!res.ok) return null;
  const svg = await res.text();
  const jalur = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  return jalur.length ? jalur : null;
}

async function ambilHanzi(c: string): Promise<string[] | null> {
  const res = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(c)}.json`);
  if (!res.ok) return null;
  const data = (await res.json()) as { medians?: number[][][] };
  if (!Array.isArray(data.medians) || !data.medians.length) return null;
  // hanzi-writer-data: kotak 1024, sumbu y terbalik dengan garis dasar di 900.
  const k = KOTAK_GORESAN / 1024;
  return data.medians.map((titik) =>
    titik
      .map(([x, y], i) => `${i ? "L" : "M"}${(x * k).toFixed(2)},${((900 - y) * k).toFixed(2)}`)
      .join(""),
  );
}

/** Path goresan (urut) untuk satu aksara; null kalau datanya tak ada / jaringan gagal. */
export function muatGoresan(c: string, sumber: "kanjivg" | "hanzi"): Promise<string[] | null> {
  const kunci = `${sumber}:${c}`;
  let janji = cacheGoresan.get(kunci);
  if (!janji) {
    janji = (sumber === "kanjivg" ? ambilKanjiVg(c) : ambilHanzi(c)).catch(() => null);
    cacheGoresan.set(kunci, janji);
    // Gagal jaringan jangan dikenang selamanya — percobaan berikutnya boleh mengulang.
    janji.then((hasil) => { if (!hasil) cacheGoresan.delete(kunci); });
  }
  return janji;
}
