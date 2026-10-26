// [latihan-menulis-v1] [latihan-menulis-v2] Katalog aksara untuk menu "Latihan Menulis" (dashboard siswa
// & pengajar). Berkas ini KEMBAR dengan linguo-admin-dashboard/src/lib/writingScripts.ts
// — ubah dua-duanya sekaligus.
//
// Format ringkas: "aksara cara-baca;arti" dipisah "|". Arti/nama boleh kosong.
// Urutan goresan TIDAK disimpan di sini: aksara Jepang diambil dari KanjiVG dan
// Hanzi dari hanzi-writer-data saat dibuka (lihat `strokes`).
// [latihan-menulis-v3] Aksara lain tak punya data goresan terbuka, jadi datanya
// digambar sendiri di `./goresan/<modul>.ts` (strokes "linguo:<modul>"), dimuat
// lazy hanya saat aksaranya dibuka.

/** `n` = arti/nama (Indonesia), `e` = arti dalam bahasa Inggris (kalau ada). */
export type Glyph = { c: string; r: string; n?: string; e?: string };

export type ScriptSet = {
  id: string;
  label: string;
  /** Sumber urutan goresan; kosong = jiplak bentuk huruf saja. */
  strokes?: SumberGoresan;
  /** `c` berisi huruf besar + kecil (Аа) — yang dibunyikan huruf kecilnya. */
  pair?: boolean;
  /** [latihan-menulis-v2] Tahap belajar: 1 = huruf, 2 = kata, 3 = kalimat. Kosong = 1. */
  stage?: 1 | 2 | 3;
  /** `c` berupa kata/kalimat — ditulis bagian demi bagian (lihat `pecahBagian`). */
  frasa?: boolean;
  glyphs: Glyph[];
};

/** "linguo:<modul>" = data goresan buatan sendiri di ./goresan/<modul>.ts. */
export type SumberGoresan = "kanjivg" | "hanzi" | `linguo:${string}`;

export type ScriptLang = {
  key: string;
  label: string;
  /** [latihan-menulis-v3] Keluarga Google Fonts untuk aksaranya (dimuat saat dipilih);
   *  data goresan "linguo:*" dijiplak dari font ini, jadi bayangannya sama. */
  font?: string;
  /** Kode bahasa untuk TTS & atribut lang. */
  code: string;
  /** Pencocok nama bahasa kelas ("Japanese", "Bahasa Jepang", …). */
  match: RegExp;
  rtl?: boolean;
  /** Satuan menulis kata/kalimat: per aksara (kana, Hanzi, blok Hangul) atau per kata. Kosong = per kata. */
  unit?: "char" | "word";
  /** Bahasa yang kalimatnya ditulis tanpa spasi (Thai): spasi di data cuma pemisah bagian. */
  tanpaSpasi?: boolean;
  sets: ScriptSet[];
};

const g = (s: string): Glyph[] =>
  s.split("|").map((x) => {
    const [kiri, n] = x.split(";");
    const i = kiri.indexOf(" ");
    return { c: kiri.slice(0, i), r: kiri.slice(i + 1), ...(n ? { n } : {}) };
  });

/** Kata/kalimat: "teks=cara baca;arti;arti Inggris" dipisah "|" — teksnya boleh berspasi. */
const k = (s: string): Glyph[] =>
  s.split("|").map((x) => {
    const [kiri, n, e] = x.split(";");
    const i = kiri.indexOf("=");
    return { c: kiri.slice(0, i), r: kiri.slice(i + 1), ...(n ? { n } : {}), ...(e ? { e } : {}) };
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

/* ── [latihan-menulis-v2] Tahap 2 (kata) & Tahap 3 (kalimat sederhana, A1) ─────
   Saran review tim: latihan berjenjang huruf → kata → kalimat, lengkap dengan
   arti supaya siswa sekaligus menambah kosakata. Kalimat dipilih dari ungkapan
   A1 yang paling awal diajarkan. */

const JA_KATA =
  "ねこ=neko;kucing;cat|いぬ=inu;anjing;dog|みず=mizu;air;water|やま=yama;gunung;mountain|さかな=sakana;ikan;fish|くるま=kuruma;mobil;car|ともだち=tomodachi;teman;friend|せんせい=sensei;guru;teacher|ありがとう=arigatou;terima kasih;thank you|こんにちは=konnichiwa;halo, selamat siang;hello|日本=nihon;Jepang;Japan|学校=gakkou;sekolah;school|名前=namae;nama;name|今日=kyou;hari ini;today|電車=densha;kereta listrik;train";

const JA_KALIMAT =
  "おはよう。=ohayou;Selamat pagi.;Good morning.|わたしは学生です。=watashi wa gakusei desu;Saya pelajar.;I am a student.|これは本です。=kore wa hon desu;Ini buku.;This is a book.|水を飲みます。=mizu o nomimasu;Saya minum air.;I drink water.|学校へ行きます。=gakkou e ikimasu;Saya pergi ke sekolah.;I go to school.|日本語を話します。=nihongo o hanashimasu;Saya berbicara bahasa Jepang.;I speak Japanese.|名前は何ですか。=namae wa nan desu ka;Siapa namamu?;What is your name?|ありがとうございます。=arigatou gozaimasu;Terima kasih banyak.;Thank you very much.";

const ZH_KATA =
  "你好=nǐ hǎo;halo;hello|谢谢=xièxie;terima kasih;thank you|再见=zàijiàn;sampai jumpa;goodbye|老师=lǎoshī;guru;teacher|学生=xuésheng;murid;student|朋友=péngyou;teman;friend|中国=Zhōngguó;Tiongkok;China|汉语=Hànyǔ;bahasa Mandarin;Chinese (language)|爸爸=bàba;ayah;father|妈妈=māma;ibu;mother|喝水=hē shuǐ;minum air;to drink water|吃饭=chī fàn;makan;to eat (a meal)|名字=míngzi;nama;name|今天=jīntiān;hari ini;today";

const ZH_KALIMAT =
  "你好吗？=nǐ hǎo ma;Apa kabar?;How are you?|我很好。=wǒ hěn hǎo;Saya baik-baik saja.;I am fine.|我是学生。=wǒ shì xuésheng;Saya murid.;I am a student.|你叫什么名字？=nǐ jiào shénme míngzi;Siapa namamu?;What is your name?|他是我的朋友。=tā shì wǒ de péngyou;Dia teman saya.;He is my friend.|我想喝茶。=wǒ xiǎng hē chá;Saya ingin minum teh.;I would like to drink tea.|我学汉语。=wǒ xué Hànyǔ;Saya belajar bahasa Mandarin.;I study Chinese.|我爱你。=wǒ ài nǐ;Aku cinta kamu.;I love you.";

const KO_KATA =
  "물=mul;air;water|밥=bap;nasi;rice, meal|사람=saram;orang;person|친구=chingu;teman;friend|학교=hakgyo;sekolah;school|사랑=sarang;cinta;love|한국=hanguk;Korea;Korea|이름=ireum;nama;name|가족=gajok;keluarga;family|학생=haksaeng;pelajar;student|선생님=seonsaengnim;guru;teacher|고마워요=gomawoyo;terima kasih;thank you";

const KO_KALIMAT =
  "안녕하세요.=annyeonghaseyo;Halo.;Hello.|감사합니다.=gamsahamnida;Terima kasih.;Thank you.|저는 학생입니다.=jeoneun haksaengimnida;Saya pelajar.;I am a student.|이것은 책입니다.=igeoseun chaegimnida;Ini buku.;This is a book.|물을 마셔요.=mureul masyeoyo;Saya minum air.;I drink water.|이름이 뭐예요?=ireumi mwoyeyo;Siapa namamu?;What is your name?|한국어를 공부해요.=hangugeoreul gongbuhaeyo;Saya belajar bahasa Korea.;I study Korean.|만나서 반갑습니다.=mannaseo bangapseumnida;Senang bertemu denganmu.;Nice to meet you.";

const TH_KATA =
  "น้ำ=nam;air;water|ข้าว=khao;nasi;rice|บ้าน=ban;rumah;house|แมว=maeo;kucing;cat|หมา=ma;anjing;dog|ปลา=pla;ikan;fish|ครู=khru;guru;teacher|รัก=rak;cinta;love|เพื่อน=phuean;teman;friend|ไทย=thai;Thailand;Thai|สวัสดี=sawatdi;halo;hello|ขอบคุณ=khop khun;terima kasih;thank you";

// Thai ditulis tanpa spasi — spasi di sini cuma pemisah kata untuk latihan per bagian.
const TH_KALIMAT =
  "สวัสดี ครับ=sawatdi khrap;Halo. (penutur laki-laki);Hello. (male speaker)|ขอบคุณ ค่ะ=khop khun kha;Terima kasih. (penutur perempuan);Thank you. (female speaker)|ฉัน รัก คุณ=chan rak khun;Aku cinta kamu.;I love you.|ฉัน กิน ข้าว=chan kin khao;Saya makan nasi.;I eat rice.|ฉัน ชื่อ มานี=chan chue Mani;Nama saya Mani.;My name is Mani.|คุณ สบายดี ไหม=khun sabai di mai;Apa kabar?;How are you?|ฉัน เรียน ภาษาไทย=chan rian phasa thai;Saya belajar bahasa Thai.;I study Thai.";

const AR_KATA =
  "بَاب=bab;pintu;door|مَاء=ma';air;water|أَب=ab;ayah;father|أُمّ=umm;ibu;mother|بَيْت=bait;rumah;house|قَلَم=qalam;pena;pen|كِتَاب=kitab;buku;book|وَلَد=walad;anak laki-laki;boy|بِنْت=bint;anak perempuan;girl|سَلَام=salam;salam, damai;peace|شُكْرًا=syukran;terima kasih;thank you|مَدْرَسَة=madrasah;sekolah;school";

const AR_KALIMAT =
  "السَّلَامُ عَلَيْكُمْ=assalamu 'alaikum;Semoga keselamatan atasmu.;Peace be upon you.|هَذَا كِتَابٌ=hadza kitabun;Ini buku.;This is a book.|أَنَا طَالِبٌ=ana thalibun;Saya pelajar.;I am a student.|مَا اسْمُكَ؟=masmuka;Siapa namamu?;What is your name?|كَيْفَ حَالُكَ؟=kaifa haluka;Apa kabar?;How are you?|أَنَا بِخَيْرٍ=ana bikhair;Saya baik-baik saja.;I am fine.|شُكْرًا جَزِيلًا=syukran jazilan;Terima kasih banyak.;Thank you very much.|أُحِبُّ اللُّغَةَ الْعَرَبِيَّةَ=uhibbul-lughatal-'arabiyyah;Saya menyukai bahasa Arab.;I love the Arabic language.";

const RU_KATA =
  "да=da;ya;yes|нет=nyet;tidak;no|дом=dom;rumah;house|кот=kot;kucing;cat|мама=mama;ibu;mom|папа=papa;ayah;dad|вода=voda;air;water|друг=drug;teman;friend|книга=kniga;buku;book|школа=shkola;sekolah;school|привет=privet;hai;hi|спасибо=spasibo;terima kasih;thank you";

const RU_KALIMAT =
  "Доброе утро!=dobroye utro;Selamat pagi!;Good morning!|Как дела?=kak dela;Apa kabar?;How are you?|Меня зовут Анна.=menya zovut Anna;Nama saya Anna.;My name is Anna.|Я студент.=ya student;Saya mahasiswa.;I am a student.|Это мой дом.=eto moy dom;Ini rumah saya.;This is my house.|Я люблю тебя.=ya lyublyu tebya;Aku cinta kamu.;I love you.|Большое спасибо!=bol'shoye spasibo;Terima kasih banyak!;Thank you very much!|Я говорю по-русски.=ya govoryu po-russki;Saya berbicara bahasa Rusia.;I speak Russian.";

const HI_KATA =
  "घर=ghar;rumah;house|नाम=naam;nama;name|माँ=maan;ibu;mother|पिता=pitaa;ayah;father|पानी=paani;air;water|दोस्त=dost;teman;friend|किताब=kitaab;buku;book|खाना=khaanaa;makanan;food|प्यार=pyaar;cinta;love|भारत=bhaarat;India;India|नमस्ते=namaste;halo;hello|धन्यवाद=dhanyavaad;terima kasih;thank you";

const HI_KALIMAT =
  "आप कैसे हैं?=aap kaise hain;Apa kabar?;How are you?|मैं ठीक हूँ।=main theek hoon;Saya baik-baik saja.;I am fine.|मेरा नाम राज है।=meraa naam Raaj hai;Nama saya Raj.;My name is Raj.|आपका नाम क्या है?=aapkaa naam kyaa hai;Siapa nama Anda?;What is your name?|यह किताब है।=yah kitaab hai;Ini buku.;This is a book.|मैं पानी पीता हूँ।=main paani peetaa hoon;Saya minum air. (penutur laki-laki);I drink water. (male speaker)|मैं हिंदी सीखता हूँ।=main hindi seekhtaa hoon;Saya belajar bahasa Hindi. (penutur laki-laki);I am learning Hindi. (male speaker)|बहुत धन्यवाद।=bahut dhanyavaad;Terima kasih banyak.;Thank you very much.";

const EL_KATA =
  "ναι=ne;ya;yes|όχι=óchi;tidak;no|μαμά=mamá;ibu;mom|νερό=neró;air;water|σπίτι=spíti;rumah;house|γάτα=gáta;kucing;cat|φίλος=fílos;teman;friend|βιβλίο=vivlío;buku;book|σχολείο=scholío;sekolah;school|αγάπη=agápi;cinta;love|καλημέρα=kaliméra;selamat pagi;good morning|ευχαριστώ=efcharistó;terima kasih;thank you";

// Tanda tanya Yunani ditulis ; (bukan ";" biasa) supaya tidak dibaca sebagai pemisah kolom.
const EL_KALIMAT =
  "Γεια σου!=ya su;Hai!;Hi!|Τι κάνεις;=ti kánis;Apa kabar?;How are you?|Με λένε Άννα.=me léne Ánna;Nama saya Anna.;My name is Anna.|Είμαι μαθητής.=íme mathitís;Saya pelajar.;I am a student.|Αυτό είναι βιβλίο.=aftó íne vivlío;Ini buku.;This is a book.|Πίνω νερό.=píno neró;Saya minum air.;I drink water.|Μιλάω ελληνικά.=miláo elliniká;Saya berbicara bahasa Yunani.;I speak Greek.|Ευχαριστώ πολύ!=efcharistó polí;Terima kasih banyak!;Thank you very much!";

const IBRANI_SOFIT =
  "ך kaf sofit;kaf akhir|ם mem sofit;mem akhir|ן nun sofit;nun akhir|ף fe sofit;pe akhir|ץ tsadi sofit;tsadi akhir";

const HE_KATA =
  "כן=ken;ya;yes|לא=lo;tidak;no|בית=bayit;rumah;house|מים=mayim;air;water|ספר=sefer;buku;book|אמא=ima;ibu;mom|אבא=aba;ayah;dad|חבר=chaver;teman;friend|כלב=kelev;anjing;dog|חתול=chatul;kucing;cat|שלום=shalom;halo, damai;hello, peace|תודה=toda;terima kasih;thank you";

const HE_KALIMAT =
  "בוקר טוב=boker tov;Selamat pagi.;Good morning.|מה שלומך?=ma shlomkha;Apa kabar?;How are you?|קוראים לי דני=kor'im li Dani;Nama saya Dani.;My name is Dani.|אני תלמיד=ani talmid;Saya pelajar.;I am a student.|זה ספר=ze sefer;Ini buku.;This is a book.|אני לומד עברית=ani lomed ivrit;Saya belajar bahasa Ibrani. (penutur laki-laki);I am learning Hebrew. (male speaker)|תודה רבה=toda raba;Terima kasih banyak.;Thank you very much.";

/* ── [latihan-menulis-v3] Bahasa beraksara non-Latin lain dari daftar bahasa landing ── */

/* ── kanton ── */
const HANZI_KANTON =
  "一 jat1;satu|二 ji6;dua|三 saam1;tiga|四 sei3;empat|五 ng5;lima|六 luk6;enam|七 cat1;tujuh|八 baat3;delapan|九 gau2;sembilan|十 sap6;sepuluh|我 ngo5;saya|你 nei5;kamu|係 hai6;adalah|唔 m4;tidak|好 hou2;baik, sangat|人 jan4;orang|大 daai6;besar|小 siu2;kecil|中 zung1;tengah|國 gwok3;negara|食 sik6;makan|飲 jam2;minum|水 seoi2;air|茶 caa4;teh|飯 faan6;nasi|書 syu1;buku|字 zi6;huruf|天 tin1;hari, langit|日 jat6;hari, matahari|月 jyut6;bulan|年 nin4;tahun|上 soeng6;atas|下 haa6;bawah|去 heoi3;pergi|愛 oi3;cinta|多 do1;banyak|少 siu2;sedikit|錢 cin2;uang|買 maai5;membeli|想 soeng2;ingin|叫 giu3;dipanggil|名 meng2;nama|學 hok6;belajar|生 saang1;lahir, murid|老 lou5;tua|師 si1;guru|朋 pang4;teman (朋友)|友 jau5;teman|家 gaa1;rumah, keluarga|香 hoeng1;harum|港 gong2;pelabuhan|廣 gwong2;luas|東 dung1;timur|話 waa2;bahasa, ucapan|嘅 ge3;partikel kepunyaan|咩 me1;apa|謝 ze6;terima kasih|見 gin3;melihat, bertemu";

const KANTON_KATA =
  "你好=nei5 hou2;halo;hello|多謝=do1 ze6;terima kasih (atas pemberian);thank you (for a gift)|唔該=m4 goi1;terima kasih (atas bantuan), permisi;thank you (for help), excuse me|再見=zoi3 gin3;sampai jumpa;goodbye|早晨=zou2 san4;selamat pagi;good morning|老師=lou5 si1;guru;teacher|學生=hok6 saang1;murid;student|朋友=pang4 jau5;teman;friend|香港=hoeng1 gong2;Hong Kong;Hong Kong|廣東話=gwong2 dung1 waa2;bahasa Kanton;Cantonese|飲茶=jam2 caa4;minum teh (makan dim sum);to have dim sum|食飯=sik6 faan6;makan;to eat (a meal)";

const KANTON_KALIMAT =
  "你好嗎？=nei5 hou2 maa3;Apa kabar?;How are you?|我好好。=ngo5 hou2 hou2;Saya baik sekali.;I am very well.|我係學生。=ngo5 hai6 hok6 saang1;Saya murid.;I am a student.|你叫咩名？=nei5 giu3 me1 meng2;Siapa namamu?;What is your name?|我想飲茶。=ngo5 soeng2 jam2 caa4;Saya ingin minum teh.;I would like to have tea.|我學廣東話。=ngo5 hok6 gwong2 dung1 waa2;Saya belajar bahasa Kanton.;I study Cantonese.|多謝你！=do1 ze6 nei5;Terima kasih!;Thank you!";

/* ── persia ── */
// ── Persia (Farsi) — [latihan-menulis-v3] ─────────────────────────────────────
// Goresan memakai modul bersama goresan/arab.ts ("linguo:arab"); font "Noto Naskh Arabic".
// Persia memakai ک (kaf tanpa hamzah kecil) dan ی (ye tanpa titik) — bukan ك / ي versi Arab.

const PERSIA =
  "ا alef|ب be|پ pe|ت te|ث se;bunyi s|ج jim|چ che|ح he;bunyi h|خ khe|د dal|ذ zal;bunyi z|ر re|ز ze|ژ zhe|س sin|ش shin|ص sad;bunyi s|ض zad;bunyi z|ط ta;bunyi t|ظ za;bunyi z|ع eyn|غ gheyn|ف fe|ق qaf;bunyi gh|ک kaf|گ gaf|ل lam|م mim|ن nun|و vav|ه he;bunyi h|ی ye";

// Angka Persia: ۴ ۵ ۶ bentuknya beda dari angka Arab; ۰ ۱ ۲ ۳ ۷ ۸ ۹ bentuknya sama dengan
// ٠ ١ ٢ ٣ ٧ ٨ ٩ tetapi titik kodenya lain (U+06F0…) — perlu dipetakan ke kunci angka Arab
// di arab.ts (lihat arab-catatan.txt) supaya ada data goresannya.
const PERSIA_ANGKA =
  "۰ sefr;0|۱ yek;1|۲ do;2|۳ se;3|۴ chahar;4|۵ panj;5|۶ shesh;6|۷ haft;7|۸ hasht;8|۹ noh;9";

const FA_KATA =
  "سلام=salâm;halo, salam;hello|مرسی=mersi;terima kasih;thank you|بله=bale;ya;yes|نه=na;tidak;no|آب=âb;air;water|نان=nân;roti;bread|خانه=khâne;rumah;house|کتاب=ketâb;buku;book|مادر=mâdar;ibu;mother|پدر=pedar;ayah;father|دوست=dust;teman;friend|گربه=gorbe;kucing;cat";

const FA_KALIMAT =
  "صبح بخیر=sobh bekheyr;Selamat pagi.;Good morning.|حال شما چطور است؟=hâl-e shomâ chetor ast;Apa kabar Anda?;How are you?|من خوبم، ممنون=man khubam, mamnun;Saya baik, terima kasih.;I am fine, thank you.|اسم من علی است=esm-e man Ali ast;Nama saya Ali.;My name is Ali.|اسم شما چیست؟=esm-e shomâ chist;Siapa nama Anda?;What is your name?|من دانشجو هستم=man dâneshju hastam;Saya mahasiswa.;I am a university student.|این کتاب است=in ketâb ast;Ini buku.;This is a book.|من فارسی یاد می‌گیرم=man fârsi yâd migiram;Saya belajar bahasa Persia.;I am learning Persian.";

// Entri SCRIPT_LANGS:

/* ── urdu ── */
// ── Urdu — [latihan-menulis-v3] ───────────────────────────────────────────────
// Goresan memakai modul bersama goresan/arab.ts ("linguo:arab"); font "Noto Naskh Arabic"
// (Urdu lazimnya ditulis Nastaliq, tetapi papan latihan memakai bentuk Naskh terpisah).
// Hamzah (ء) sengaja tidak dimasukkan: belum ada data goresannya.
// Kalimat tanpa tanda titik Urdu (۔) karena tanda itu belum dikenali pemecah kata.

const URDU =
  "ا alif|ب be|پ pe|ت te|ٹ ṭe;t retrofleks|ث se;bunyi s|ج jim|چ che|ح baṛi he;bunyi h|خ khe|د dal|ڈ ḍal;d retrofleks|ذ zal;bunyi z|ر re|ڑ ṛe;r retrofleks|ز ze|ژ zhe|س sin|ش shin|ص su'ad;bunyi s|ض zu'ad;bunyi z|ط to'e;bunyi t|ظ zo'e;bunyi z|ع ain|غ ghain|ف fe|ق qaf|ک kaf|گ gaf|ل lam|م mim|ن nun|ں nun ghunnah;n sengau|و wao|ہ choṭi he;bunyi h|ھ do-chashmi he;penanda aspirasi (bh, ph, kh…)|ی choṭi ye|ے baṛi ye;bunyi e/ai di akhir kata";

const UR_KATA =
  "سلام=salaam;halo, salam;hello|شکریہ=shukriyaa;terima kasih;thank you|ہاں=haan;ya;yes|نہیں=nahin;tidak;no|پانی=paani;air;water|گھر=ghar;rumah;house|کتاب=kitaab;buku;book|ماں=maan;ibu;mother|باپ=baap;ayah;father|دوست=dost;teman;friend|کھانا=khaanaa;makanan;food|اردو=urdu;bahasa Urdu;Urdu";

const UR_KALIMAT =
  "آپ کیسے ہیں؟=aap kaise hain;Apa kabar?;How are you?|میں ٹھیک ہوں=main theek hoon;Saya baik-baik saja.;I am fine.|میرا نام علی ہے=meraa naam Ali hai;Nama saya Ali.;My name is Ali.|آپ کا نام کیا ہے؟=aap kaa naam kyaa hai;Siapa nama Anda?;What is your name?|یہ کتاب ہے=yah kitaab hai;Ini buku.;This is a book.|میں پانی پیتا ہوں=main paani peetaa hoon;Saya minum air. (penutur laki-laki);I drink water. (male speaker)|میں اردو سیکھ رہا ہوں=main urdu seekh rahaa hoon;Saya sedang belajar bahasa Urdu. (penutur laki-laki);I am learning Urdu. (male speaker)|بہت شکریہ=bahut shukriyaa;Terima kasih banyak.;Thank you very much.";

// Entri SCRIPT_LANGS:

/* ── jawi ── */
// ── Melayu (Jawi) — [latihan-menulis-v3] ─────────────────────────────────────
// Goresan memakai modul bersama goresan/arab.ts ("linguo:arab"); font "Noto Naskh Arabic".
// 28 huruf hijaiyah + 6 huruf tambahan Jawi (چ ڠ ڤ ݢ ۏ ڽ), urut seperti abjad Jawi baku.
// Kaf ditulis ک (bentuk yang lazim di Jawi), bukan ك. Cara baca = ejaan Rumi.

const JAWI =
  "ا alif|ب ba|ت ta|ث sa;bunyi s|ج jim|چ ca|ح ha;bunyi h|خ kha|د dal|ذ zal;bunyi z|ر ra|ز zai|س sin|ش syin|ص sad;bunyi s|ض dad;bunyi d|ط ta;bunyi t|ظ za;bunyi z|ع ain|غ ghain|ڠ nga|ف fa|ڤ pa|ق qaf|ک kaf|ݢ ga|ل lam|م mim|ن nun|و wau|ۏ va|ه ha|ي ya|ڽ nya";

const MS_KATA =
  "ساي=saya;saya;I|رومه=rumah;rumah;house|ماکن=makan;makan;to eat|مينوم=minum;minum;to drink|بوکو=buku;buku;book|سکوله=sekolah;sekolah;school|ايبو=ibu;ibu;mother|باڤ=bapa;ayah, bapak;father|کاون=kawan;kawan, teman;friend|اورڠ=orang;orang;person|ڤاݢي=pagi;pagi;morning|باڽق=banyak;banyak;many";

const MS_KALIMAT =
  "سلامت ڤاݢي=Selamat pagi;Selamat pagi.;Good morning.|اڤ خبر؟=Apa khabar?;Apa kabar?;How are you?|خبر باءيق=Khabar baik;Kabar baik.;I am fine.|نام ساي علي=Nama saya Ali;Nama saya Ali.;My name is Ali.|سياڤ نام اند؟=Siapa nama anda?;Siapa nama Anda?;What is your name?|اين بوکو ساي=Ini buku saya;Ini buku saya.;This is my book.|ساي بلاجر بهاس ملايو=Saya belajar bahasa Melayu;Saya belajar bahasa Melayu.;I am learning Malay.|تريما کاسيه=Terima kasih;Terima kasih.;Thank you.";

// Entri SCRIPT_LANGS:

/* ── armenia ── */
// [latihan-menulis-v3] Katalog aksara Armenia — tempel ke writingScripts.ts.
// Data goresan: src/lib/goresan/armenia.ts (kunci = 38 huruf kecil).
// Romanisasi: Armenia Timur (dialek Yerevan). Huruf ber-apostrof (t', ch', ts', p', k') = konsonan beraspirasi (berembus).

const ARMENIA =
  "Աա a;ayb|Բբ b;ben|Գգ g;gim|Դդ d;da|Եե ye / e;yech (ye di awal kata)|Զզ z;za|Էէ e;e|Ըը ë;ët (e pepet)|Թթ t';t'o|Ժժ zh;zhe|Իի i;ini|Լլ l;liun|Խխ kh;khe|Ծծ ts;tsa|Կկ k;ken|Հհ h;ho|Ձձ dz;dza|Ղղ gh;ghat|Ճճ ch;che|Մմ m;men|Յյ y;hi|Նն n;nu|Շշ sh;sha|Ոո vo / o;vo (vo di awal kata)|Չչ ch';ch'a|Պպ p;pe|Ջջ j;je|Ռռ rr;ra (r getar)|Սս s;se|Վվ v;vev|Տտ t;tiun|Րր r;re|Ցց ts';ts'o|Ււ u (dalam ու);hiun|Փփ p';p'iur|Քք k';k'e|Օօ o;o|Ֆֆ f;fe";

const HY_KATA =
  "այո=ayo;ya;yes|ոչ=voch';tidak;no|մայր=mayr;ibu;mother|հայր=hayr;ayah;father|տուն=tun;rumah;house|ջուր=jur;air;water|գիրք=girk';buku;book|ընկեր=ënker;teman;friend|շուն=shun;anjing;dog|կատու=katu;kucing;cat|բարև=barev;halo;hello|շնորհակալություն=shnorhakalut'yun;terima kasih;thank you";

// Tanda baca Armenia: ։ (titik, U+0589), ՞ (tanda tanya di atas vokal, U+055E), , (koma).
const HY_KALIMAT =
  "Բարև ձեզ։=barev dzez;Halo. (sopan);Hello. (polite)|Ինչպե՞ս եք։=inch'pes ek';Apa kabar? (sopan);How are you? (polite)|Լավ եմ, շնորհակալություն։=lav em, shnorhakalut'yun;Saya baik, terima kasih.;I am fine, thank you.|Իմ անունը Աննա է։=im anunë Anna e;Nama saya Anna.;My name is Anna.|Ես ուսանող եմ։=yes usanogh em;Saya mahasiswa.;I am a student.|Սա գիրք է։=sa girk' e;Ini buku.;This is a book.|Ես ջուր եմ խմում։=yes jur em khmum;Saya minum air.;I drink water.|Ես հայերեն եմ սովորում։=yes hayeren em sovorum;Saya belajar bahasa Armenia.;I am learning Armenian.";

// Entri SCRIPT_LANGS:

/* ── georgia ── */
// [latihan-menulis-v3] Katalog aksara Georgia (Mkhedruli) — tempel ke writingScripts.ts.
// Data goresan: src/lib/goresan/georgia.ts (kunci = 33 huruf Mkhedruli).
// Romanisasi: sistem nasional Georgia. Huruf ber-apostrof (k', p', t', q', ts', ch') = konsonan ejektif
// (ditekan tanpa embusan); tanpa apostrof (k, p, t, ts, ch) = beraspirasi. Mkhedruli tak punya huruf besar.

const GEORGIA =
  "ა a;ani|ბ b;bani|გ g;gani|დ d;doni|ე e;eni|ვ v;vini|ზ z;zeni|თ t;tani|ი i;ini|კ k';k'ani|ლ l;lasi|მ m;mani|ნ n;nari|ო o;oni|პ p';p'ari|ჟ zh;zhani|რ r;rae|ს s;sani|ტ t';t'ari|უ u;uni|ფ p;pari|ქ k;kani|ღ gh;ghani|ყ q';q'ari|შ sh;shini|ჩ ch;chini|ც ts;tsani|ძ dz;dzili|წ ts';ts'ili|ჭ ch';ch'ari|ხ kh;khani|ჯ j;jani|ჰ h;hae";

const KA_KATA =
  "კი=k'i;ya;yes|არა=ara;tidak;no|დედა=deda;ibu;mother|მამა=mama;ayah;father|სახლი=sakhli;rumah;house|წყალი=ts'q'ali;air;water|წიგნი=ts'igni;buku;book|მეგობარი=megobari;teman;friend|ძაღლი=dzaghli;anjing;dog|კატა=k'at'a;kucing;cat|გამარჯობა=gamarjoba;halo;hello|მადლობა=madloba;terima kasih;thank you";

const KA_KALIMAT =
  "გამარჯობა!=gamarjoba;Halo!;Hello!|როგორ ხარ?=rogor khar;Apa kabar?;How are you?|კარგად ვარ, მადლობა.=k'argad var, madloba;Saya baik, terima kasih.;I am fine, thank you.|მე მქვია ნინო.=me mkvia Nino;Nama saya Nino.;My name is Nino.|მე სტუდენტი ვარ.=me st'udent'i var;Saya mahasiswa.;I am a student.|ეს წიგნია.=es ts'ignia;Ini buku.;This is a book.|მე წყალს ვსვამ.=me ts'q'als vsvam;Saya minum air.;I drink water.|მე ქართულს ვსწავლობ.=me kartuls vsts'avlob;Saya belajar bahasa Georgia.;I am learning Georgian.";

// Catatan: "მამა" (mama) dalam bahasa Georgia = AYAH, "დედა" (deda) = ibu.

// Entri SCRIPT_LANGS:

/* ── bulgaria ── */
// [latihan-menulis-v3] Bulgaria — 30 huruf; goresan = bentuk cetak tegak "linguo:kiril" (bukan gaya miring
// Bulgaria yang bentuk kecilnya mirip Latin).
const KIRIL_BULGARIA =
  "Аа a|Бб b|Вв v|Гг g|Дд d|Ее e|Жж zh|Зз z|Ии i|Йй y;i kratko|Кк k|Лл l|Мм m|Нн n|Оо o|Пп p|Рр r|Сс s|Тт t|Уу u|Фф f|Хх h|Цц ts|Чч ch|Шш sh|Щщ sht|Ъъ ă;er golyam (vokal seperti e pepet)|Ьь y;er malak (hanya sebelum o)|Юю yu|Яя ya";

const BG_KATA =
  "да=da;ya;yes|не=ne;tidak;no|къща=kashta;rumah;house|вода=voda;air;water|хляб=hlyab;roti;bread|котка=kotka;kucing;cat|куче=kuche;anjing;dog|майка=mayka;ibu;mother|баща=bashta;ayah;father|приятел=priyatel;teman;friend|книга=kniga;buku;book|училище=uchilishte;sekolah;school";

const BG_KALIMAT =
  "Здравей!=zdravey;Halo!;Hello!|Добро утро!=dobro utro;Selamat pagi!;Good morning!|Как си?=kak si;Apa kabar?;How are you?|Добре съм.=dobre sam;Saya baik-baik saja.;I am fine.|Казвам се Мария.=kazvam se Mariya;Nama saya Maria.;My name is Maria.|Аз съм студент.=az sam student;Saya mahasiswa.;I am a student.|Това е книга.=tova e kniga;Ini buku.;This is a book.|Благодаря много!=blagodarya mnogo;Terima kasih banyak!;Thank you very much!";

/* ── ukraina ── */
// [latihan-menulis-v3] Ukraina — 33 huruf abjad resmi (apostrof bukan huruf). Goresan "linguo:kiril"
// (modul kiril.ts punya ґ є і ї).
const KIRIL_UKRAINA =
  "Аа a|Бб b|Вв v|Гг h|Ґґ g|Дд d|Ее e|Єє ye|Жж zh|Зз z|Ии y|Іі i|Її yi|Йй y;i pendek|Кк k|Лл l|Мм m|Нн n|Оо o|Пп p|Рр r|Сс s|Тт t|Уу u|Фф f|Хх kh|Цц ts|Чч ch|Шш sh|Щщ shch|Ьь -;tanda lunak|Юю yu|Яя ya";

const UK_KATA =
  "так=tak;ya;yes|ні=ni;tidak;no|дім=dim;rumah;house|вода=voda;air;water|хліб=khlib;roti;bread|кіт=kit;kucing;cat|мама=mama;ibu;mom|тато=tato;ayah;dad|друг=druh;teman;friend|книга=knyha;buku;book|школа=shkola;sekolah;school|дякую=dyakuyu;terima kasih;thank you";

const UK_KALIMAT =
  "Привіт!=pryvit;Hai!;Hi!|Добрий ранок!=dobryi ranok;Selamat pagi!;Good morning!|Як справи?=yak spravy;Apa kabar?;How are you?|Мене звати Оксана.=mene zvaty Oksana;Nama saya Oksana.;My name is Oksana.|Я студент.=ya student;Saya mahasiswa.;I am a student.|Це моя книга.=tse moya knyha;Ini buku saya.;This is my book.|Я вивчаю українську мову.=ya vyvchayu ukrainsku movu;Saya belajar bahasa Ukraina.;I am learning Ukrainian.|Дуже дякую!=duzhe dyakuyu;Terima kasih banyak!;Thank you very much!";

/* ── mongol ── */
// [latihan-menulis-v3] Mongol (Kiril) — 35 huruf: 33 huruf Rusia + Өө dan Үү (sesudah Оо dan Уу).
// Goresan "linguo:kiril" (modul kiril.ts punya ө ү). Ж di Mongol dibaca "j", Ь menandai i samar.
const KIRIL_MONGOL =
  "Аа a|Бб b|Вв v|Гг g|Дд d|Ее ye|Ёё yo|Жж j|Зз dz|Ии i|Йй i;i pendek|Кк k|Лл l|Мм m|Нн n|Оо o|Өө ö|Пп p|Рр r|Сс s|Тт t|Уу u|Үү ü|Фф f|Хх kh|Цц ts|Чч ch|Шш sh|Щщ shch|Ъъ -;tanda keras|Ыы y|Ьь i;tanda lunak|Ээ e|Юю yu|Яя ya";

const MN_KATA =
  "тийм=tiim;ya;yes|үгүй=ügüi;tidak;no|гэр=ger;rumah, ger;home, yurt|ус=us;air;water|талх=talkh;roti;bread|муур=muur;kucing;cat|нохой=nokhoi;anjing;dog|ээж=eej;ibu;mother|аав=aav;ayah;father|найз=naiz;teman;friend|ном=nom;buku;book|сургууль=surguul;sekolah;school";

const MN_KALIMAT =
  "Сайн байна уу?=sain baina uu;Halo, apa kabar?;Hello, how are you?|Сайн байна.=sain baina;Baik.;I am fine.|Таны нэр хэн бэ?=tany ner khen be;Siapa nama Anda?;What is your name?|Миний нэр Болд.=minii ner Bold;Nama saya Bold.;My name is Bold.|Би оюутан.=bi oyuutan;Saya mahasiswa.;I am a student.|Энэ ном.=ene nom;Ini buku.;This is a book.|Би монгол хэл сурч байна.=bi mongol khel surch baina;Saya sedang belajar bahasa Mongol.;I am learning Mongolian.|Баярлалаа!=bayarlalaa;Terima kasih!;Thank you!";

/* ── amhar ── */
// [latihan-menulis-v3] Amhar (aksara Ge'ez/fidel) — goresan: src/lib/goresan/etiopia.ts ("linguo:etiopia").
// Cara baca orde ke-1 memakai vokal "e" (ä) seperti lazimnya romanisasi Amharik populer; ሀ ሐ ኀ dibaca sama
// ("ha"), begitu juga ሰ/ሠ, አ/ዐ, ጸ/ፀ — namanya dicantumkan supaya siswa bisa membedakan.
const AMHAR_DASAR =
  "ሀ ha;hoy|ለ le;lawe|ሐ ha;hawt (h berat)|መ me;may|ሠ se;sawt (s lama)|ረ re;ris|ሰ se;sat|ሸ she;sh (turunan ሰ)|ቀ qe;qaf|በ be;bet|ተ te;tawe|ቸ che;ch (turunan ተ)|ኀ ha;harm (h lama)|ነ ne;nahas|ኘ nye;ny (turunan ነ)|አ a;alf|ከ ke;kaf|ኸ he;kh (turunan ከ)|ወ we;wawe|ዐ a;ayn|ዘ ze;zay|ዠ zhe;zh (turunan ዘ)|የ ye;yaman|ደ de;dant|ጀ je;j (turunan ደ)|ገ ge;gaml|ጠ t'e;tayt (t ejektif)|ጨ ch'e;ch ejektif (turunan ጠ)|ጰ p'e;payt (p ejektif)|ጸ ts'e;tsaday|ፀ ts'e;tsappa (ts lama)|ፈ fe;af|ፐ pe;psa";

// Tujuh orde (bentuk vokal) baris ለ dan በ — nama orde Ge'ez di kolom nama.
const AMHAR_ORDE =
  "ለ le;orde 1 (ge'ez)|ሉ lu;orde 2 (ka'ib)|ሊ li;orde 3 (salis)|ላ la;orde 4 (rabi')|ሌ lé;orde 5 (hamis)|ል l / li;orde 6 (sadis)|ሎ lo;orde 7 (sabi')|በ be;orde 1 (ge'ez)|ቡ bu;orde 2 (ka'ib)|ቢ bi;orde 3 (salis)|ባ ba;orde 4 (rabi')|ቤ bé;orde 5 (hamis)|ብ b / bi;orde 6 (sadis)|ቦ bo;orde 7 (sabi')";

const AM_KATA =
  "ሰላም=selam;halo, damai;hello, peace|አዎ=awo;ya;yes|ቤት=bet;rumah;house|ውሃ=wiha;air;water|ዳቦ=dabo;roti;bread|ቡና=buna;kopi;coffee|እናት=inat;ibu;mother|አባት=abat;ayah;father|ጓደኛ=gwadegna;teman;friend|መጽሐፍ=metsihaf;buku;book|ድመት=dimet;kucing;cat|አመሰግናለሁ=amesegnalehu;terima kasih;thank you";

// Amharik modern memakai spasi antarkata; titik = ። (U+1362). Lihat catatan TANDA_BACA di bawah.
const AM_KALIMAT =
  "ሰላም ነህ?=selam neh;Apa kabar? (kepada laki-laki);How are you? (to a man)|ደህና ነኝ።=dehna negn;Saya baik-baik saja.;I am fine.|ስሜ ሳራ ነው።=sime Sara new;Nama saya Sara.;My name is Sara.|ስምህ ማን ነው?=simih man new;Siapa namamu? (kepada laki-laki);What is your name? (to a man)|እኔ ተማሪ ነኝ።=ine temari negn;Saya pelajar.;I am a student.|ይህ መጽሐፍ ነው።=yih metsihaf new;Ini buku.;This is a book.|አማርኛ እማራለሁ።=amarigna imaralehu;Saya belajar bahasa Amhar.;I am learning Amharic.|በጣም አመሰግናለሁ።=betam amesegnalehu;Terima kasih banyak.;Thank you very much.";

/* ── bengali ── */
// [latihan-menulis-v3] Bengali (Bangla) — potongan siap tempel ke writingScripts.ts.
// Data goresan: src/lib/goresan/bengali.ts (font acuan "Noto Sans Bengali").
// Kunci ড় ঢ় য় ditulis dalam bentuk NFC (huruf dasar + nukta ় terpisah) — sama dengan kunci di bengali.ts.
// Cara baca: vokal bawaan Bengali dibaca "ô" (seperti o pada "pohon"), mis. ক = kô.

const BENGALI_VOKAL =
  "অ ô;vokal bawaan|আ a|ই i;i pendek|ঈ ii;i panjang|উ u;u pendek|ঊ uu;u panjang|ঋ ri|এ e|ঐ oi|ও o|ঔ ou";

const BENGALI_KONSONAN =
  "ক kô|খ khô|গ gô|ঘ ghô|ঙ ngô|চ cô|ছ chô|জ jô|ঝ jhô|ঞ nyô|ট ṭô|ঠ ṭhô|ড ḍô|ঢ ḍhô|ণ nô;murdhonno nô (n retrofleks)|ত tô|থ thô|দ dô|ধ dhô|ন nô;dontyo nô (n gigi)|প pô|ফ phô|ব bô|ভ bhô|ম mô|য jô;ontostho jô|র rô|ল lô|শ shô;talobyo shô|ষ shô;murdhonno shô|স sô;dontyo sô|হ hô|ড় ṛô|ঢ় ṛhô|য় yô;ontostho yô|ৎ t;khondo tô (t mati)";

const BENGALI_ANGKA =
  "০ shunno;0|১ ek;1|২ dui;2|৩ tin;3|৪ char;4|৫ pach;5|৬ chhoy;6|৭ shat;7|৮ at;8|৯ noy;9";

const BN_KATA =
  "জল=jol;air;water|ভাত=bhat;nasi;rice|মা=ma;ibu;mother|বাবা=baba;ayah;father|বাড়ি=bari;rumah;house|বই=boi;buku;book|বন্ধু=bondhu;teman;friend|বিড়াল=biral;kucing;cat|মাছ=machh;ikan;fish|ভালোবাসা=bhalobasha;cinta;love|নমস্কার=nomoshkar;halo, salam;hello|ধন্যবাদ=dhonnobad;terima kasih;thank you";

const BN_KALIMAT =
  "আপনি কেমন আছেন?=apni kemon achhen;Apa kabar? (sopan);How are you? (formal)|আমি ভালো আছি।=ami bhalo achhi;Saya baik-baik saja.;I am fine.|আমার নাম রাহুল।=amar nam Rahul;Nama saya Rahul.;My name is Rahul.|আপনার নাম কী?=apnar nam ki;Siapa nama Anda?;What is your name?|আমি ছাত্র।=ami chhatro;Saya pelajar. (laki-laki);I am a student. (male)|এটা একটা বই।=eta ekta boi;Ini sebuah buku.;This is a book.|আমি বাংলা শিখছি।=ami bangla shikhchhi;Saya sedang belajar bahasa Bengali.;I am learning Bengali.|অনেক ধন্যবাদ।=onek dhonnobad;Terima kasih banyak.;Thank you very much.";

// Entri SCRIPT_LANGS:

/* ── tamil ── */
// ── Tamil — [latihan-menulis-v3] ────────────────────────────────────────────
// Data goresan: src/lib/goresan/tamil.ts (strokes "linguo:tamil").
// ஃ (āytam) lazim didaftar sesudah 12 vokal (uyir) di tabel huruf Tamil.
const TAMIL_VOKAL =
  "அ a|ஆ aa|இ i|ஈ ii|உ u|ஊ uu|எ e;pendek|ஏ ee;panjang|ஐ ai|ஒ o;pendek|ஓ oo;panjang|ஔ au|ஃ ak;āytam (tanda khusus)";

// Konsonan dalam bentuk dasar (berinheren a, tanpa pulli).
const TAMIL_KONSONAN =
  "க ka|ங nga|ச ca / sa|ஞ nya|ட ṭa;t retrofleks|ண ṇa;n retrofleks|த ta;t gigi|ந na;n gigi|ப pa|ம ma|ய ya|ர ra|ல la|வ va|ழ zha;l khas Tamil|ள ḷa;l retrofleks|ற ṟa;r getar|ன ṉa;n gusi";

const TA_KATA =
  "அம்மா=amma;ibu;mother|அப்பா=appa;ayah;father|தண்ணீர்=thanneer;air;water|சோறு=soru;nasi;rice|வீடு=veedu;rumah;house|பூனை=poonai;kucing;cat|நாய்=naai;anjing;dog|மீன்=meen;ikan;fish|புத்தகம்=puththagam;buku;book|ஆசிரியர்=aasiriyar;guru;teacher|நண்பன்=nanban;teman (laki-laki);friend (male)|வணக்கம்=vanakkam;halo, salam;hello";

const TA_KALIMAT =
  "வணக்கம்!=vanakkam;Halo!;Hello!|எப்படி இருக்கிறீர்கள்?=eppadi irukkireergal;Apa kabar? (sopan);How are you? (polite)|என் பெயர் ராஜா.=en peyar Raja;Nama saya Raja.;My name is Raja.|நான் மாணவன்.=naan maanavan;Saya pelajar. (laki-laki);I am a student. (male)|இது புத்தகம்.=idhu puththagam;Ini buku.;This is a book.|நான் தண்ணீர் குடிக்கிறேன்.=naan thanneer kudikkiren;Saya minum air.;I drink water.|நான் தமிழ் படிக்கிறேன்.=naan thamizh padikkiren;Saya belajar bahasa Tamil.;I study Tamil.|நன்றி!=nandri;Terima kasih!;Thank you!";

// Entri SCRIPT_LANGS:

/* ── punjabi ── */
// [latihan-menulis-v3] Katalog aksara Punjabi (Gurmukhi) — tempel ke writingScripts.ts.
// Data goresan: src/lib/goresan/gurmukhi.ts (kunci = 35 huruf + 10 angka).
// Urutan huruf = urutan baku "painti akhar" (ੳ ਅ ੲ ਸ ਹ, lalu ਕ … ੜ). Nama huruf ditulis sesudah ";".
// ੳ ਅ ੲ = pembawa vokal (tidak dibaca sendiri; vokalnya ditentukan tanda vokal yang menempel).
// Titik bawah (ṭ ḍ ṇ ṛ) = bunyi retrofleks (ujung lidah ditekuk ke belakang).

const GURMUKHI =
  "ੳ u / o;ura (pembawa vokal)|ਅ a;aira (pembawa vokal)|ੲ i / e;iri (pembawa vokal)|ਸ sa;sassa|ਹ ha;haha|ਕ ka;kakka|ਖ kha;khakha|ਗ ga;gagga|ਘ gha;ghagga|ਙ nga;ngangga|ਚ cha;chachcha|ਛ chha;chhachha|ਜ ja;jajja|ਝ jha;jhajja|ਞ nya;nyanya|ਟ ṭa;tainka|ਠ ṭha;ṭhaṭṭha|ਡ ḍa;ḍaḍḍa|ਢ ḍha;ḍhaḍḍa|ਣ ṇa;ṇaṇa|ਤ ta;tatta|ਥ tha;thattha|ਦ da;dadda|ਧ dha;dhadda|ਨ na;nanna|ਪ pa;pappa|ਫ pha;phaphpha|ਬ ba;babba|ਭ bha;bhabba|ਮ ma;mamma|ਯ ya;yayya|ਰ ra;rara|ਲ la;lalla|ਵ va;vava|ੜ ṛa;ṛaṛa";

const GURMUKHI_ANGKA =
  "੦ sifar;0|੧ ikk;1|੨ do;2|੩ tinn;3|੪ chaar;4|੫ panj;5|੬ chhe;6|੭ satt;7|੮ atth;8|੯ nau;9";

const PA_KATA =
  "ਘਰ=ghar;rumah;house|ਨਾਮ=naam;nama;name|ਮਾਂ=maan;ibu;mother|ਪਿਤਾ=pitaa;ayah;father|ਪਾਣੀ=paani;air;water|ਦੋਸਤ=dost;teman;friend|ਕਿਤਾਬ=kitaab;buku;book|ਖਾਣਾ=khaanaa;makanan;food|ਪਿਆਰ=pyaar;cinta;love|ਪੰਜਾਬ=panjaab;Punjab;Punjab|ਹਾਂ=haan;ya;yes|ਧੰਨਵਾਦ=dhannvaad;terima kasih;thank you";

const PA_KALIMAT =
  "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ।=sat sri akaal;Halo. (salam khas Punjabi);Hello. (Punjabi greeting)|ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?=tusiin kiven ho;Apa kabar?;How are you?|ਮੈਂ ਠੀਕ ਹਾਂ।=main theek haan;Saya baik-baik saja.;I am fine.|ਮੇਰਾ ਨਾਮ ਸਿਮਰਨ ਹੈ।=meraa naam Simran hai;Nama saya Simran.;My name is Simran.|ਤੁਹਾਡਾ ਨਾਮ ਕੀ ਹੈ?=tuhaadaa naam kii hai;Siapa nama Anda?;What is your name?|ਮੈਂ ਪਾਣੀ ਪੀਂਦਾ ਹਾਂ।=main paani peendaa haan;Saya minum air. (penutur laki-laki);I drink water. (male speaker)|ਮੈਂ ਪੰਜਾਬੀ ਸਿੱਖ ਰਿਹਾ ਹਾਂ।=main panjaabi sikkh rihaa haan;Saya sedang belajar bahasa Punjabi. (penutur laki-laki);I am learning Punjabi. (male speaker)|ਬਹੁਤ ਧੰਨਵਾਦ।=bahut dhannvaad;Terima kasih banyak.;Thank you very much.";

// Entri SCRIPT_LANGS:

/* ── nepal ── */
// [latihan-menulis-v3] Katalog aksara Nepal — tempel ke writingScripts.ts.
// Data goresan: src/lib/goresan/devanagari.ts (dipakai bersama Hindi; kunci = 13 vokal termasuk "अं" "अः" + 33 konsonan).
// Huruf memakai konstanta yang SUDAH ADA (DEVANAGARI_VOKAL, DEVANAGARI_KONSONAN) — tidak perlu konstanta huruf baru.
// Romanisasi Nepal: "aa" = a panjang, "chh" = c beraspirasi; व dalam bahasa Nepal umumnya dibaca "b"/"w" (धन्यवाद = dhanyabaad).

const NE_KATA =
  "घर=ghar;rumah;house|नाम=naam;nama;name|आमा=aamaa;ibu;mother|बुबा=bubaa;ayah;father|पानी=paani;air;water|साथी=saathi;teman;friend|किताब=kitaab;buku;book|खाना=khaanaa;makanan;food|माया=maayaa;cinta, kasih sayang;love|नेपाल=nepaal;Nepal;Nepal|नमस्ते=namaste;halo;hello|धन्यवाद=dhanyabaad;terima kasih;thank you";

const NE_KALIMAT =
  "तपाईंलाई कस्तो छ?=tapaailaai kasto chha;Apa kabar?;How are you?|मलाई सन्चै छ।=malaai sanchai chha;Saya baik-baik saja.;I am fine.|मेरो नाम राम हो।=mero naam Raam ho;Nama saya Ram.;My name is Ram.|तपाईंको नाम के हो?=tapaaiko naam ke ho;Siapa nama Anda?;What is your name?|यो किताब हो।=yo kitaab ho;Ini buku.;This is a book.|म पानी पिउँछु।=ma paani piunchhu;Saya minum air.;I drink water.|म नेपाली सिक्दै छु।=ma nepaali sikdai chhu;Saya sedang belajar bahasa Nepal.;I am learning Nepali.|धेरै धन्यवाद।=dherai dhanyabaad;Terima kasih banyak.;Thank you very much.";

// Entri SCRIPT_LANGS:

/* ── myanmar ── */
// ── Myanmar (Burma) — [latihan-menulis-v3] ──────────────────────────────────
// Data goresan: src/lib/goresan/myanmar.ts (strokes "linguo:myanmar").
const MYANMAR_KONSONAN =
  "က ka;ka gyi|ခ kha;kha gwe|ဂ ga;ga nge|ဃ ga;ga gyi|င nga;nga|စ sa;sa lone|ဆ hsa;hsa lein|ဇ za;za gwe|ဈ za;za myin zwe|ည nya;nya gyi|ဋ ta;ta talin gyaik|ဌ hta;hta won be|ဍ da;da yin gauk|ဎ da;da ye hmote|ဏ na;na gyi|တ ta;ta wun pu|ထ hta;hta hsin htu|ဒ da;da dwe|ဓ da;da auk chaik|န na;na nge|ပ pa;pa zauk|ဖ pha;pha u htote|ဗ ba;ba hte chaik|ဘ ba;ba gone|မ ma;ma|ယ ya;ya pet let|ရ ya;ya gauk (ra pada kata serapan)|လ la;la|ဝ wa;wa|သ tha;tha|ဟ ha;ha|ဠ la;la gyi|အ a;a";

// Vokal Myanmar tidak berdiri sendiri — ditulis menempel pada pembawa အ (a). ေ ditulis lebih dulu (di kiri).
const MYANMAR_VOKAL =
  "အာ aa;a panjang|အိ i;pendek|အီ ii;panjang|အု u;pendek|အူ uu;panjang|အေ e;e tertutup|အဲ e;e terbuka (è)|အော aw;o terbuka, nada tinggi|အော် aw;o terbuka, nada rendah|အံ an;sengau";

const MYANMAR_ANGKA =
  "၀ thoun nya;0|၁ tit;1|၂ hnit;2|၃ thoun;3|၄ lei;4|၅ nga;5|၆ chauk;6|၇ khun nit;7|၈ shit;8|၉ kou;9";

const MY_KATA =
  "ရေ=ye;air;water|ထမင်း=htamin;nasi;rice|အိမ်=ein;rumah;house|ကြောင်=kyaung;kucing;cat|ခွေး=khwe;anjing;dog|ငါး=nga;ikan;fish|ဆရာ=saya;guru;teacher|စာအုပ်=sa-ouk;buku;book|သူငယ်ချင်း=thange-gyin;teman;friend|အမေ=a-me;ibu;mother|အဖေ=a-hpe;ayah;father|မြန်မာ=myanma;Myanmar;Myanmar";

// Bahasa Myanmar ditulis tanpa spasi antarkata: spasi di sini cuma pemisah bagian latihan (tanpaSpasi: true).
const MY_KALIMAT =
  "မင်္ဂလာပါ=mingalaba;Halo.;Hello.|နေကောင်း လား=ne kaung la;Apa kabar?;How are you?|ကျေးဇူးတင် ပါတယ်=kye zu tin ba de;Terima kasih.;Thank you.|ကျွန်တော့် နာမည် မောင်မောင် ပါ=kya-naw nan-me Maung Maung ba;Nama saya Maung Maung. (penutur laki-laki);My name is Maung Maung. (male speaker)|ကျွန်မ ကျောင်းသူ ပါ=kya-ma kyaung-thu ba;Saya pelajar. (penutur perempuan);I am a student. (female speaker)|ဒါ စာအုပ် ပါ=da sa-ouk ba;Ini buku.;This is a book.|ကျွန်တော် ထမင်း စား တယ်=kya-naw htamin sa de;Saya makan nasi. (penutur laki-laki);I eat rice. (male speaker)|ကျွန်တော် မြန်မာစာ သင် နေတယ်=kya-naw myanma-sa thin ne de;Saya sedang belajar bahasa Myanmar. (penutur laki-laki);I am learning Burmese. (male speaker)";

// Entri SCRIPT_LANGS:

/* ── khmer ── */
// [latihan-menulis-v3] Katalog aksara Khmer — tempel ke writingScripts.ts.
// Konsonan Khmer terbagi dua seri: seri a (vokal bawaan "a") dan seri o (vokal bawaan "o").

const KHMER_KONSONAN =
  "ក ka;seri a|ខ kha;seri a|គ ko;seri o|ឃ kho;seri o|ង ngo;seri o|ច cha;seri a|ឆ chha;seri a|ជ co;seri o|ឈ chho;seri o|ញ nho;seri o|ដ da;seri a|ឋ tha;seri a|ឌ do;seri o|ឍ tho;seri o|ណ na;seri a|ត ta;seri a|ថ tha;seri a|ទ to;seri o|ធ tho;seri o|ន no;seri o|ប ba;seri a|ផ pha;seri a|ព po;seri o|ភ pho;seri o|ម mo;seri o|យ yo;seri o|រ ro;seri o|ល lo;seri o|វ vo;seri o|ស sa;seri a|ហ ha;seri a|ឡ la;seri a|អ a;seri a";

// Vokal dependen Khmer ditulis menempel pada konsonan អ. Cara baca = dengan konsonan seri a; bacaan seri o di arti.
const KHMER_VOKAL =
  "អា a;seri o: ea|អិ e;seri o: i|អី ei;seri o: i (panjang)|អឹ oe;seri o: ue|អឺ eu;seri o: ue (panjang)|អុ o;seri o: u|អូ ou;seri o: u (panjang)|អួ uo;seri o: uo|អេ e;seri o: e|អែ ae;seri o: ae|អៃ ai;seri o: ey|អោ ao;seri o: o|អៅ au;seri o: ov";

const KHMER_ANGKA =
  "០ son;0|១ muoy;1|២ pir;2|៣ bei;3|៤ buon;4|៥ pram;5|៦ prammuoy;6|៧ prampir;7|៨ prambei;8|៩ prambuon;9";

const KM_KATA =
  "ទឹក=tuek;air;water|បាយ=bay;nasi;rice|ផ្ទះ=phteah;rumah;house|ឆ្មា=chhma;kucing;cat|ឆ្កែ=chhkae;anjing;dog|ត្រី=trei;ikan;fish|គ្រូ=kru;guru;teacher|ស្រឡាញ់=sralanh;cinta, sayang;to love|មិត្ត=mitt;teman;friend|ខ្មែរ=khmae;Khmer;Khmer|សួស្តី=suosdei;halo;hello|អរគុណ=arkun;terima kasih;thank you";

// Khmer ditulis tanpa spasi — spasi di sini cuma pemisah kata untuk latihan per bagian.
const KM_KALIMAT =
  "អ្នក សុខសប្បាយ ទេ=neak sok sabay te;Apa kabar?;How are you?|ខ្ញុំ សុខសប្បាយ=khnhom sok sabay;Saya baik-baik saja.;I am fine.|ខ្ញុំ ឈ្មោះ សុភា=khnhom chhmuoh Sophea;Nama saya Sophea.;My name is Sophea.|អ្នក ឈ្មោះ អ្វី=neak chhmuoh avei;Siapa namamu?;What is your name?|ខ្ញុំ ស្រឡាញ់ អ្នក=khnhom sralanh neak;Aku cinta kamu.;I love you.|ខ្ញុំ ញ៉ាំ បាយ=khnhom nham bay;Saya makan nasi.;I eat rice.|ខ្ញុំ រៀន ភាសាខ្មែរ=khnhom rien phiesa khmae;Saya belajar bahasa Khmer.;I study Khmer.|អរគុណ ច្រើន=arkun chraen;Terima kasih banyak.;Thank you very much.";

/* ── laos ── */
// [latihan-menulis-v3] Katalog aksara Laos — tempel ke writingScripts.ts.
// Nama konsonan mengikuti kata contoh yang diajarkan di sekolah Laos (ກ = ກໍ ໄກ່ "ko kai" = ayam).

const LAOS_KONSONAN =
  "ກ ko kai;ayam|ຂ kho khai;telur|ຄ kho khuay;kerbau|ງ ngo ngua;sapi|ຈ cho chok;gelas|ສ so suea;harimau|ຊ xo xang;gajah|ຍ nyo nyung;nyamuk|ດ do dek;anak|ຕ to ta;mata|ຖ tho thong;kantong|ທ tho thung;bendera|ນ no nok;burung|ບ bo bae;kambing|ປ po pa;ikan|ຜ pho phueng;lebah|ຝ fo fon;hujan|ພ pho phu;gunung|ຟ fo fai;api|ມ mo maeo;kucing|ຢ yo ya;obat|ຣ ro rot;mobil|ລ lo ling;monyet|ວ wo vi;kipas|ຫ ho han;angsa|ອ o o;mangkuk|ຮ ho huean;rumah";

// Vokal Laos tidak berdiri sendiri — ditulis menempel pada konsonan ອ (o).
const LAOS_VOKAL =
  "ອະ a;pendek|ອາ aa;panjang|ອິ i;pendek|ອີ ii;panjang|ອຶ ue;pendek|ອື uee;panjang|ອຸ u;pendek|ອູ uu;panjang|ເອ ee;panjang|ແອ ae;panjang|ໂອ oo;panjang|ໄອ ai|ໃອ ai|ອຳ am|ເອົາ ao";

const LAOS_ANGKA =
  "໐ soun;0|໑ nueng;1|໒ song;2|໓ sam;3|໔ si;4|໕ ha;5|໖ hok;6|໗ chet;7|໘ paet;8|໙ kao;9";

const LO_KATA =
  "ນ້ຳ=nam;air;water|ເຂົ້າ=khao;nasi;rice|ເຮືອນ=huean;rumah;house|ແມວ=maeo;kucing;cat|ໝາ=ma;anjing;dog|ປາ=pa;ikan;fish|ຄູ=khu;guru;teacher|ຮັກ=hak;cinta;love|ເພື່ອນ=phuean;teman;friend|ລາວ=lao;Laos;Lao|ສະບາຍດີ=sabaidi;halo;hello|ຂອບໃຈ=khop chai;terima kasih;thank you";

// Laos ditulis tanpa spasi — spasi di sini cuma pemisah kata untuk latihan per bagian.
const LO_KALIMAT =
  "ສະບາຍດີ ບໍ່=sabaidi bo;Apa kabar?;How are you?|ຂ້ອຍ ສະບາຍດີ=khoy sabaidi;Saya baik-baik saja.;I am fine.|ຂ້ອຍ ຊື່ ມາລີ=khoy xue Mali;Nama saya Mali.;My name is Mali.|ເຈົ້າ ຊື່ ຫຍັງ=chao xue nyang;Siapa namamu?;What is your name?|ຂ້ອຍ ຮັກ ເຈົ້າ=khoy hak chao;Aku cinta kamu.;I love you.|ຂ້ອຍ ກິນ ເຂົ້າ=khoy kin khao;Saya makan nasi.;I eat rice.|ຂ້ອຍ ຮຽນ ພາສາລາວ=khoy hian phasa lao;Saya belajar bahasa Laos.;I study Lao.|ຂອບໃຈ ຫຼາຍ=khop chai lai;Terima kasih banyak.;Thank you very much.";

/* ── jawa ── */
// [latihan-menulis-v3] Aksara Jawa (hanacaraka). Data goresan: src/lib/goresan/jawa.ts.
// 20 aksara nglegena, urut ha-na-ca-ra-ka.
const JAWA_NGLEGENA =
  "ꦲ ha|ꦤ na|ꦕ ca|ꦫ ra|ꦏ ka|ꦢ da|ꦠ ta|ꦱ sa|ꦮ wa|ꦭ la|ꦥ pa|ꦣ dha|ꦗ ja|ꦪ ya|ꦚ nya|ꦩ ma|ꦒ ga|ꦧ ba|ꦛ tha|ꦔ nga";

// Sandhangan ditulis menempel pada ꦲ (ha) — kuncinya string utuh.
const JAWA_SANDHANGAN =
  "ꦲꦶ hi;wulu (i)|ꦲꦸ hu;suku (u)|ꦲꦺ hé;taling (é)|ꦲꦺꦴ ho;taling tarung (o)|ꦲꦼ hê;pepet (e pepet)|ꦲꦂ har;layar (-r)|ꦲꦃ hah;wignyan (-h)|ꦲꦁ hang;cecak (-ng)|ꦲ꧀ h;pangkon (mematikan vokal)";

const JV_KATA =
  "ꦧꦚꦸ=banyu;air;water|ꦲꦺꦴꦩꦃ=omah;rumah;house|ꦱꦼꦒ=sega;nasi;cooked rice|ꦏꦸꦕꦶꦁ=kucing;kucing;cat|ꦥꦶꦠꦶꦏ꧀=pitik;ayam;chicken|ꦧꦸꦏꦸ=buku;buku;book|ꦧꦥꦏ꧀=bapak;ayah;father|ꦲꦶꦧꦸ=ibu;ibu;mother|ꦏꦚ꧀ꦕ=kanca;teman;friend|ꦒꦸꦫꦸ=guru;guru;teacher|ꦱꦼꦏꦺꦴꦭꦃ=sekolah;sekolah;school|ꦩꦠꦸꦂ ꦤꦸꦮꦸꦤ꧀=matur nuwun;terima kasih;thank you";

// Aksara Jawa ditulis tanpa spasi — spasi di sini cuma pemisah kata untuk latihan per bagian.
// (Saat digabung, pangkon di akhir kata otomatis tampil sebagai pasangan — memang begitu ejaannya.)
const JV_KALIMAT =
  "ꦱꦸꦒꦼꦁ ꦲꦺꦚ꧀ꦗꦶꦁ=sugeng enjing;Selamat pagi.;Good morning.|ꦱꦸꦒꦼꦁ ꦫꦮꦸꦃ=sugeng rawuh;Selamat datang.;Welcome.|ꦥꦶꦪꦺ ꦏꦧꦫꦺ=piye kabare;Apa kabar? (ngoko);How are you? (informal)|ꦤꦩꦶ ꦏꦸꦭ ꦧꦸꦢꦶ=nami kula Budi;Nama saya Budi. (krama);My name is Budi. (polite)|ꦥꦚ꧀ꦗꦼꦤꦼꦔꦤ꧀ ꦱꦏꦶꦁ ꦥꦸꦤ꧀ꦢꦶ=panjenengan saking pundi;Anda dari mana? (krama);Where are you from? (polite)|ꦏꦸꦭ ꦱꦏꦶꦁ ꦗꦏꦂꦠ=kula saking Jakarta;Saya dari Jakarta. (krama);I am from Jakarta. (polite)|ꦲꦏꦸ ꦱꦶꦤꦲꦸ ꦧꦱ ꦗꦮ=aku sinau basa Jawa;Saya belajar bahasa Jawa. (ngoko);I am learning Javanese. (informal)|ꦩꦠꦸꦂ ꦤꦸꦮꦸꦤ꧀ ꦱꦔꦼꦠ꧀=matur nuwun sanget;Terima kasih banyak.;Thank you very much.";

/* ── sunda ── */
// [latihan-menulis-v3] Aksara Sunda (Aksara Sunda Baku). Data goresan: src/lib/goresan/sunda.ts.
// 18 ngalagena asli + 5 serapan (fa, va, qa, xa, za).
const SUNDA_NGALAGENA =
  "ᮊ ka|ᮌ ga|ᮍ nga|ᮎ ca|ᮏ ja|ᮑ nya|ᮒ ta|ᮓ da|ᮔ na|ᮕ pa|ᮘ ba|ᮙ ma|ᮚ ya|ᮛ ra|ᮜ la|ᮝ wa|ᮞ sa|ᮠ ha|ᮖ fa;serapan|ᮗ va;serapan|ᮋ qa;serapan|ᮟ xa;serapan|ᮐ za;serapan";

// Aksara swara = vokal yang berdiri sendiri (awal kata / sesudah vokal lain).
const SUNDA_SWARA =
  "ᮃ a|ᮄ i|ᮅ u|ᮆ é;taling|ᮇ o|ᮈ e;pepet|ᮉ eu";

// Rarangkén ditulis menempel pada ᮊ (ka) — kuncinya string utuh.
const SUNDA_RARANGKEN =
  "ᮊᮤ ki;panghulu (i)|ᮊᮥ ku;panyuku (u)|ᮊᮦ ké;panéléng (é)|ᮊᮧ ko;panolong (o)|ᮊᮨ ke;pamepet (e pepet)|ᮊᮩ keu;paneuleung (eu)|ᮊᮀ kang;panyecek (-ng)|ᮊᮁ kar;panglayar (-r)|ᮊᮂ kah;pangwisad (-h)|ᮊᮡ kya;pamingkal (-y-)|ᮊᮢ kra;panyakra (-r-)|ᮊᮣ kla;panyiku (-l-)|ᮊ᮪ k;pamaéh (mematikan vokal)";

const SU_KATA =
  "ᮎᮄ=cai;air;water|ᮄᮙᮂ=imah;rumah;house|ᮞᮀᮌᮥ=sangu;nasi;cooked rice|ᮄᮔ᮪ᮓᮥᮀ=indung;ibu;mother|ᮘᮕ=bapa;ayah;father|ᮘᮥᮓᮊ᮪=budak;anak;child|ᮞᮊᮧᮜ=sakola;sekolah;school|ᮘᮥᮊᮥ=buku;buku;book|ᮘᮒᮥᮁ=batur;teman;friend|ᮌᮥᮛᮥ=guru;guru;teacher|ᮜᮅᮊ᮪=lauk;ikan;fish|ᮅᮎᮤᮀ=ucing;kucing;cat";

// Aksara Sunda ditulis tanpa spasi — spasi di sini cuma pemisah kata untuk latihan per bagian.
const SU_KALIMAT =
  "ᮝᮤᮜᮥᮏᮨᮀ ᮈᮔ᮪ᮏᮤᮀ=wilujeng enjing;Selamat pagi.;Good morning.|ᮊᮥᮙᮠ ᮓᮙᮀ=kumaha damang;Apa kabar?;How are you?|ᮃᮘ᮪ᮓᮤ ᮓᮙᮀ=abdi damang;Saya baik-baik saja.;I am fine.|ᮔᮙᮤ ᮃᮘ᮪ᮓᮤ ᮃᮞᮨᮕ᮪=nami abdi Asep;Nama saya Asep.;My name is Asep.|ᮠᮒᮥᮁ ᮔᮥᮠᮥᮔ᮪=hatur nuhun;Terima kasih.;Thank you.|ᮃᮘ᮪ᮓᮤ ᮓᮤᮃᮏᮁ ᮘᮞ ᮞᮥᮔ᮪ᮓ=abdi diajar basa Sunda;Saya belajar bahasa Sunda.;I am learning Sundanese.|ᮃᮘ᮪ᮓᮤ ᮔᮨᮓ ᮞᮀᮌᮥ=abdi neda sangu;Saya makan nasi.;I eat rice.|ᮝᮤᮜᮥᮏᮨᮀ ᮞᮥᮙ᮪ᮕᮤᮀ=wilujeng sumping;Selamat datang.;Welcome.";

/* ── bali ── */
// [latihan-menulis-v3] Aksara Bali — 18 aksara wreastra + pangangge (ditempel pada ᬳ).
const BALI_WREASTRA =
  "ᬳ ha|ᬦ na|ᬘ ca|ᬭ ra|ᬓ ka|ᬤ da|ᬢ ta|ᬲ sa|ᬯ wa|ᬮ la|ᬫ ma|ᬕ ga|ᬩ ba|ᬗ nga|ᬧ pa|ᬚ ja|ᬬ ya|ᬜ nya";

// Pangangge tidak berdiri sendiri — ditulis menempel pada ᬳ (ha).
const BALI_PANGANGGE_SUARA =
  "ᬳᬵ hā;tedung (a panjang)|ᬳᬶ hi;ulu|ᬳᬸ hu;suku|ᬳᬾ hé;taleng|ᬳᭀ ho;taleng tedung|ᬳᭂ hě;pepet";

const BALI_PANGANGGE_TENGENAN =
  "ᬳᬂ hang;cecek|ᬳᬃ har;surang|ᬳᬄ hah;bisah|ᬳ᭄ h;adeg-adeg (mematikan vokal)";

const BAN_KATA =
  "ᬩᬮᬶ=Bali;Bali;Bali|ᬬᬾᬄ=yéh;air;water|ᬦᬲᬶ=nasi;nasi;rice|ᬫᬾᬫᬾ=mémé;ibu;mother|ᬩᬧ=bapa;ayah;father|ᬳᬸᬫᬄ=umah;rumah;house|ᬘᬶᬘᬶᬂ=cicing;anjing;dog|ᬩᬸᬓᬸ=buku;buku;book|ᬢᬶᬬᬂ=tiang;saya (halus);I (polite)|ᬕᭂᬤᬾ=gedé;besar;big|ᬧᬸᬭ=pura;pura;temple|ᬤᬤᭀᬂ=dadong;nenek;grandmother";

// Aksara Bali ditulis tanpa spasi — spasi di sini cuma pemisah kata untuk latihan per bagian.
const BAN_KALIMAT =
  "ᬭᬳᬚᭂᬂ ᬲᭂᬫᭂᬂ=rahajeng semeng;Selamat pagi.;Good morning.|ᬓᬾᬦ᭄ᬓᬾᬦ᭄ ᬓᬩᬭᬾ=kénkén kabaré;Apa kabar?;How are you?|ᬯᬲ᭄ᬢᬦ᭄ ᬢᬶᬬᬂ ᬯᬬᬦ᭄=wastan tiang Wayan;Nama saya Wayan.;My name is Wayan.|ᬦᬶᬓᬶ ᬩᬸᬓᬸ=niki buku;Ini buku.;This is a book.|ᬢᬶᬬᬂ ᬗᬚᭂᬂ ᬦᬲᬶ=tiang ngajeng nasi;Saya makan nasi.;I eat rice.|ᬢᬶᬬᬂ ᬗᬶᬦᭂᬫ᭄ ᬬᬾᬄ=tiang nginem yéh;Saya minum air.;I drink water.|ᬢᬶᬬᬂ ᬮᬸᬗ ᬓ ᬧᬸᬭ=tiang lunga ka pura;Saya pergi ke pura.;I am going to the temple.|ᬢᬶᬬᬂ ᬫᬮᬚᬄ ᬩᬲ ᬩᬮᬶ=tiang malajah basa Bali;Saya belajar bahasa Bali.;I am learning Balinese.";

/* ── batak ── */
// ── [latihan-menulis-v3] Batak (Toba) — surat Batak ─────────────────────────────
// Ina ni surat (huruf induk) urutan baku Toba. Bunyi "ka" ditulis dengan ᯂ (ha).
const BATAK_INA =
  "ᯀ a|ᯂ ha / ka|ᯔ ma|ᯉ na|ᯒ ra|ᯖ ta|ᯘ sa|ᯇ pa|ᯞ la|ᯎ ga|ᯐ ja|ᯑ da|ᯝ nga|ᯅ ba|ᯋ wa|ᯛ ya|ᯠ nya|ᯤ i|ᯥ u";

// Anak ni surat ditulis menempel pada ᯀ (a); pangolat dilatih pada ᯉ (na → n).
const BATAK_ANAK =
  "ᯀᯧ e;hatadingan|ᯀᯪ i;hauluan|ᯀᯬ o;sihora|ᯀᯮ u;haboruan|ᯀᯰ ang;paninggil (ng)|ᯀᯱ ah;hamisaran (h)|ᯉ᯲ n;pangolat (mematikan vokal)";

const BBC_KATA =
  "ᯂᯬᯒᯘ᯲=horas;salam sejahtera;greetings (hello)|ᯔᯥᯞᯪᯀᯖᯧ=mauliate;terima kasih;thank you|ᯀᯀᯧᯂ᯲=aek;air;water|ᯤᯉᯰ=inang;ibu;mother|ᯀᯔᯰ=amang;ayah;father|ᯐᯅᯮ=jabu;rumah;house|ᯑᯬᯝᯉ᯲=dongan;teman;friend|ᯤᯉ᯲ᯑᯂᯉ᯲=indahan;nasi;rice|ᯑᯧᯰᯂᯧ=dengke;ikan;fish|ᯅᯬᯒᯮ=boru;anak perempuan;daughter|ᯀᯉᯂ᯲=anak;anak (laki-laki);son, child|ᯂᯮᯖ=huta;kampung;village";

// Surat Batak ditulis tanpa spasi — spasi di sini cuma pemisah kata untuk latihan per bagian.
const BBC_KALIMAT =
  "ᯂᯬᯒᯘ᯲ ᯐᯞ ᯎᯅᯧ=horas jala gabe;Salam sejahtera dan berhasil.;Greetings, may you prosper.|ᯔᯥᯞᯪᯀᯖᯧ ᯎᯬᯑᯰ=mauliate godang;Terima kasih banyak.;Thank you very much.|ᯘᯬᯝᯬᯉ᯲ ᯑᯪᯀ ᯂᯅᯒ᯲ᯔᯮ=songon dia kabarmu;Apa kabar?;How are you?|ᯘᯧᯂᯖ᯲ ᯑᯬ ᯀᯂᯮ=sehat do ahu;Saya sehat.;I am well.|ᯀᯂ ᯑᯬ ᯎᯬᯀᯒ᯲ᯔᯮ=aha do goarmu;Siapa namamu?;What is your name?|ᯎᯬᯀᯒ᯲ᯂᯮ ᯖᯬᯎᯒ᯲=goarhu Togar;Nama saya Togar.;My name is Togar.|ᯀᯂᯮ ᯔᯒ᯲ᯘᯪᯀᯐᯒ᯲ ᯂᯖ ᯅᯖᯂ᯲=ahu marsiajar hata Batak;Saya belajar bahasa Batak.;I am learning the Batak language.|ᯀᯂᯮ ᯔᯝᯉ᯲ ᯤᯉ᯲ᯑᯂᯉ᯲=ahu mangan indahan;Saya makan nasi.;I eat rice.";

// Entri ScriptLang:

/* ── bugis ── */
// [latihan-menulis-v3] Bugis — aksara Lontara (font "Noto Sans Buginese").
// Lontara tidak menulis konsonan penutup (-ng, -', geminasi), jadi ejaan aksara = suku kata terbuka;
// cara baca tetap ditulis lengkap. Ana' surek ditempel pada ᨀ (ka); ᨙ (é) tampil di kiri huruf.
const LONTARA =
  "ᨀ ka|ᨁ ga|ᨂ nga|ᨃ ngka|ᨄ pa|ᨅ ba|ᨆ ma|ᨇ mpa|ᨈ ta|ᨉ da|ᨊ na|ᨋ nra|ᨌ ca|ᨍ ja|ᨎ nya|ᨏ nca|ᨐ ya|ᨑ ra|ᨒ la|ᨓ wa|ᨔ sa|ᨕ a|ᨖ ha";

const LONTARA_VOKAL =
  "ᨀᨗ ki;tetti' riase (titik di atas)|ᨀᨘ ku;tetti' riawa (titik di bawah)|ᨀᨙ ké;kecce' riolo (di depan)|ᨀᨚ ko;kecce' rimunri (di belakang)|ᨀᨛ kə;kecce' riase (e pepet)";

const BUG_KATA =
  "ᨅᨚᨒ=bola;rumah;house|ᨓᨕᨙ=wae;air;water|ᨕᨗᨊᨋᨙ=inanre;nasi;rice|ᨕᨗᨉᨚ=indo';ibu;mother|ᨕᨅᨚ=ambo';ayah;father|ᨕᨊ=ana';anak;child|ᨈᨕᨘ=tau;orang;person|ᨅᨒᨙ=bale;ikan;fish|ᨆᨊᨘ=manu';ayam;chicken|ᨈᨙᨉᨚ=tedong;kerbau;water buffalo|ᨒᨚᨄᨗ=lopi;perahu;boat|ᨕᨍᨘ=aju;kayu;wood";

// Lontara ditulis tanpa spasi — spasi di sini cuma pemisah kata untuk latihan per bagian.
const BUG_KALIMAT =
  "ᨕᨁ ᨀᨑᨙᨅ=aga kareba;Apa kabar?;How are you?|ᨀᨑᨙᨅ ᨆᨉᨙᨌᨙ=kareba madéceng;Kabar baik.;I am fine.|ᨕᨗᨁ ᨕᨔᨛᨆᨘ=iga asemmu;Siapa namamu?;What is your name?|ᨕᨔᨛᨀᨘ ᨕᨒᨗ=asekku Ali;Nama saya Ali.;My name is Ali.|ᨈᨕᨘ ᨕᨘᨁᨗᨀ=tau Ugi-ka';Saya orang Bugis.;I am Buginese.|ᨒᨕᨚᨀ ᨑᨗ ᨄᨔ=laoka' ri pasa';Saya pergi ke pasar.;I am going to the market.|ᨆᨙᨒᨚᨀ ᨆᨋᨙ=méloka' manré;Saya mau makan.;I want to eat.|ᨀᨘᨑᨘ ᨔᨘᨆᨂᨙ=kurru sumange';Terima kasih.;Thank you.";

const LABEL_KATA = "Kata dasar";
const LABEL_KALIMAT = "Kalimat sederhana (A1)";

export const SCRIPT_LANGS: ScriptLang[] = [
  {
    key: "ja", label: "Jepang", code: "ja", unit: "char", match: /jepang|japan|nihon/i,
    sets: [
      { id: "ja-hiragana", label: "Hiragana", strokes: "kanjivg", glyphs: g(HIRAGANA) },
      { id: "ja-katakana", label: "Katakana", strokes: "kanjivg", glyphs: g(KATAKANA) },
      { id: "ja-kanji-n5", label: "Kanji dasar (N5)", strokes: "kanjivg", glyphs: g(KANJI_N5) },
      { id: "ja-kata", label: LABEL_KATA, stage: 2, frasa: true, strokes: "kanjivg", glyphs: k(JA_KATA) },
      { id: "ja-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, strokes: "kanjivg", glyphs: k(JA_KALIMAT) },
    ],
  },
  {
    key: "zh", label: "Mandarin", code: "zh", unit: "char", match: /mandarin|chinese|china|cina|tiongkok|hanyu/i,
    sets: [
      { id: "zh-hanzi-hsk1", label: "Hanzi dasar (HSK 1)", strokes: "hanzi", glyphs: g(HANZI_HSK1) },
      { id: "zh-kata", label: LABEL_KATA, stage: 2, frasa: true, strokes: "hanzi", glyphs: k(ZH_KATA) },
      { id: "zh-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, strokes: "hanzi", glyphs: k(ZH_KALIMAT) },
    ],
  },
  {
    key: "ko", label: "Korea", code: "ko", font: "Noto Sans KR", unit: "char", match: /korea/i,
    sets: [
      { id: "ko-konsonan", label: "Konsonan", strokes: "linguo:hangul", glyphs: g(HANGUL_KONSONAN) },
      { id: "ko-vokal", label: "Vokal", strokes: "linguo:hangul", glyphs: g(HANGUL_VOKAL) },
      { id: "ko-suku", label: "Suku kata", strokes: "linguo:hangul", glyphs: g(HANGUL_SUKU) },
      { id: "ko-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(KO_KATA) },
      { id: "ko-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(KO_KALIMAT) },
    ],
  },
  {
    key: "th", label: "Thailand", code: "th", font: "Noto Sans Thai Looped", tanpaSpasi: true, match: /thai/i,
    sets: [
      { id: "th-konsonan", label: "Konsonan", strokes: "linguo:thai", glyphs: g(THAI_KONSONAN) },
      { id: "th-vokal", label: "Vokal", strokes: "linguo:thai", glyphs: g(THAI_VOKAL) },
      { id: "th-angka", label: "Angka", strokes: "linguo:thai", glyphs: g(THAI_ANGKA) },
      { id: "th-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(TH_KATA) },
      { id: "th-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(TH_KALIMAT) },
    ],
  },
  {
    key: "ar", label: "Arab", code: "ar", font: "Noto Naskh Arabic", match: /arab/i, rtl: true,
    sets: [
      { id: "ar-hijaiyah", label: "Huruf hijaiyah", strokes: "linguo:arab", glyphs: g(ARAB_HIJAIYAH) },
      { id: "ar-angka", label: "Angka", strokes: "linguo:arab", glyphs: g(ARAB_ANGKA) },
      { id: "ar-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(AR_KATA) },
      { id: "ar-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(AR_KALIMAT) },
    ],
  },
  {
    key: "ru", label: "Rusia", code: "ru", match: /rusia|russia/i,
    sets: [
      { id: "ru-kiril", label: "Alfabet Kiril", pair: true, strokes: "linguo:kiril", glyphs: g(KIRIL_RUSIA) },
      { id: "ru-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(RU_KATA) },
      { id: "ru-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(RU_KALIMAT) },
    ],
  },
  {
    key: "hi", label: "Hindi", code: "hi", font: "Noto Sans Devanagari", match: /hindi|india/i,
    sets: [
      { id: "hi-vokal", label: "Vokal", strokes: "linguo:devanagari", glyphs: g(DEVANAGARI_VOKAL) },
      { id: "hi-konsonan", label: "Konsonan", strokes: "linguo:devanagari", glyphs: g(DEVANAGARI_KONSONAN) },
      { id: "hi-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(HI_KATA) },
      { id: "hi-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(HI_KALIMAT) },
    ],
  },
  {
    key: "el", label: "Yunani", code: "el", match: /yunani|greek/i,
    sets: [
      { id: "el-alfabet", label: "Alfabet", pair: true, strokes: "linguo:yunani", glyphs: g(YUNANI) },
      { id: "el-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(EL_KATA) },
      { id: "el-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(EL_KALIMAT) },
    ],
  },
  {
    key: "he", label: "Ibrani", code: "he", font: "Noto Sans Hebrew", match: /ibrani|hebrew/i, rtl: true,
    sets: [
      { id: "he-alefbet", label: "Alef-bet", strokes: "linguo:ibrani", glyphs: g(IBRANI) },
      { id: "he-sofit", label: "Huruf akhir (sofit)", strokes: "linguo:ibrani", glyphs: g(IBRANI_SOFIT) },
      { id: "he-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(HE_KATA) },
      { id: "he-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(HE_KALIMAT) },
    ],
  },
  {
    key: "yue", label: "Kanton", code: "zh-HK", unit: "char", match: /kanton|cantonese|hong ?kong|jyutping|guangdong/i,
    sets: [
      { id: "yue-hanzi", label: "Hanzi tradisional", strokes: "hanzi", glyphs: g(HANZI_KANTON) },
      { id: "yue-kata", label: LABEL_KATA, stage: 2, frasa: true, strokes: "hanzi", glyphs: k(KANTON_KATA) },
      { id: "yue-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, strokes: "hanzi", glyphs: k(KANTON_KALIMAT) },
    ],
  },
  {
    key: "fa", label: "Persia", code: "fa", rtl: true, font: "Noto Naskh Arabic", match: /persia|persian|farsi|parsi|iran/i,
    sets: [
      { id: "fa-alfabet", label: "Alfabet", strokes: "linguo:arab", glyphs: g(PERSIA) },
      { id: "fa-angka", label: "Angka", strokes: "linguo:arab", glyphs: g(PERSIA_ANGKA) },
      { id: "fa-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(FA_KATA) },
      { id: "fa-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(FA_KALIMAT) },
    ],
  },
  {
    key: "ur", label: "Urdu", code: "ur", rtl: true, font: "Noto Naskh Arabic", match: /urdu/i,
    sets: [
      { id: "ur-alfabet", label: "Alfabet", strokes: "linguo:arab", glyphs: g(URDU) },
      { id: "ur-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(UR_KATA) },
      { id: "ur-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(UR_KALIMAT) },
    ],
  },
  {
    key: "ms", label: "Melayu (Jawi)", code: "ms", rtl: true, font: "Noto Naskh Arabic", match: /melayu|malay|jawi/i,
    sets: [
      { id: "ms-jawi", label: "Huruf Jawi", strokes: "linguo:arab", glyphs: g(JAWI) },
      { id: "ms-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(MS_KATA) },
      { id: "ms-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(MS_KALIMAT) },
    ],
  },
  {
    key: "hy", label: "Armenia", code: "hy", font: "Noto Sans Armenian", match: /armenia|armenian|hayeren/i,
    sets: [
      { id: "hy-alfabet", label: "Alfabet", pair: true, strokes: "linguo:armenia", glyphs: g(ARMENIA) },
      { id: "hy-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(HY_KATA) },
      { id: "hy-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(HY_KALIMAT) },
    ],
  },
  {
    key: "ka", label: "Georgia", code: "ka", font: "Noto Sans Georgian", match: /georgia|georgian|kartuli|ქართ/i,
    sets: [
      { id: "ka-alfabet", label: "Alfabet", strokes: "linguo:georgia", glyphs: g(GEORGIA) },
      { id: "ka-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(KA_KATA) },
      { id: "ka-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(KA_KALIMAT) },
    ],
  },
  {
    key: "bg", label: "Bulgaria", code: "bg", match: /bulgari/i,
    sets: [
      { id: "bg-alfabet", label: "Alfabet", pair: true, strokes: "linguo:kiril", glyphs: g(KIRIL_BULGARIA) },
      { id: "bg-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(BG_KATA) },
      { id: "bg-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(BG_KALIMAT) },
    ],
  },
  {
    key: "uk", label: "Ukraina", code: "uk", match: /ukrain/i,
    sets: [
      { id: "uk-alfabet", label: "Alfabet", pair: true, strokes: "linguo:kiril", glyphs: g(KIRIL_UKRAINA) },
      { id: "uk-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(UK_KATA) },
      { id: "uk-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(UK_KALIMAT) },
    ],
  },
  {
    key: "mn", label: "Mongol", code: "mn", match: /mongol/i,
    sets: [
      { id: "mn-alfabet", label: "Alfabet", pair: true, strokes: "linguo:kiril", glyphs: g(KIRIL_MONGOL) },
      { id: "mn-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(MN_KATA) },
      { id: "mn-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(MN_KALIMAT) },
    ],
  },
  {
    key: "am", label: "Amhar", code: "am", font: "Noto Sans Ethiopic", match: /amhar|amharic|ethiopia|etiopia/i,
    sets: [
      { id: "am-dasar", label: "Huruf dasar", strokes: "linguo:etiopia", glyphs: g(AMHAR_DASAR) },
      { id: "am-orde", label: "Bentuk vokal", strokes: "linguo:etiopia", glyphs: g(AMHAR_ORDE) },
      { id: "am-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(AM_KATA) },
      { id: "am-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(AM_KALIMAT) },
    ],
  },
  {
    key: "bn", label: "Bengali", code: "bn", font: "Noto Sans Bengali", match: /bengali|bangla|benggala/i,
    sets: [
      { id: "bn-vokal", label: "Vokal", strokes: "linguo:bengali", glyphs: g(BENGALI_VOKAL) },
      { id: "bn-konsonan", label: "Konsonan", strokes: "linguo:bengali", glyphs: g(BENGALI_KONSONAN) },
      { id: "bn-angka", label: "Angka", strokes: "linguo:bengali", glyphs: g(BENGALI_ANGKA) },
      { id: "bn-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(BN_KATA) },
      { id: "bn-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(BN_KALIMAT) },
    ],
  },
  {
    key: "ta", label: "Tamil", code: "ta", font: "Noto Sans Tamil", match: /tamil/i,
    sets: [
      { id: "ta-vokal", label: "Vokal", strokes: "linguo:tamil", glyphs: g(TAMIL_VOKAL) },
      { id: "ta-konsonan", label: "Konsonan", strokes: "linguo:tamil", glyphs: g(TAMIL_KONSONAN) },
      { id: "ta-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(TA_KATA) },
      { id: "ta-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(TA_KALIMAT) },
    ],
  },
  {
    key: "pa", label: "Punjabi", code: "pa", font: "Noto Sans Gurmukhi", match: /punjab|panjabi/i,
    sets: [
      { id: "pa-huruf", label: "Huruf Gurmukhi", strokes: "linguo:gurmukhi", glyphs: g(GURMUKHI) },
      { id: "pa-angka", label: "Angka", strokes: "linguo:gurmukhi", glyphs: g(GURMUKHI_ANGKA) },
      { id: "pa-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(PA_KATA) },
      { id: "pa-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(PA_KALIMAT) },
    ],
  },
  {
    key: "ne", label: "Nepal", code: "ne", font: "Noto Sans Devanagari", match: /nepal/i,
    sets: [
      { id: "ne-vokal", label: "Vokal", strokes: "linguo:devanagari", glyphs: g(DEVANAGARI_VOKAL) },
      { id: "ne-konsonan", label: "Konsonan", strokes: "linguo:devanagari", glyphs: g(DEVANAGARI_KONSONAN) },
      { id: "ne-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(NE_KATA) },
      { id: "ne-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(NE_KALIMAT) },
    ],
  },
  {
    key: "my", label: "Myanmar", code: "my", tanpaSpasi: true, font: "Noto Sans Myanmar", match: /myanmar|burmese|burma/i,
    sets: [
      { id: "my-konsonan", label: "Konsonan", strokes: "linguo:myanmar", glyphs: g(MYANMAR_KONSONAN) },
      { id: "my-vokal", label: "Vokal", strokes: "linguo:myanmar", glyphs: g(MYANMAR_VOKAL) },
      { id: "my-angka", label: "Angka", strokes: "linguo:myanmar", glyphs: g(MYANMAR_ANGKA) },
      { id: "my-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(MY_KATA) },
      { id: "my-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(MY_KALIMAT) },
    ],
  },
  {
    key: "km", label: "Khmer", code: "km", tanpaSpasi: true, font: "Noto Sans Khmer", match: /khmer|kamboja|cambodia/i,
    sets: [
      { id: "km-konsonan", label: "Konsonan", strokes: "linguo:khmer", glyphs: g(KHMER_KONSONAN) },
      { id: "km-vokal", label: "Vokal", strokes: "linguo:khmer", glyphs: g(KHMER_VOKAL) },
      { id: "km-angka", label: "Angka", strokes: "linguo:khmer", glyphs: g(KHMER_ANGKA) },
      { id: "km-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(KM_KATA) },
      { id: "km-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(KM_KALIMAT) },
    ],
  },
  {
    key: "lo", label: "Laos", code: "lo", tanpaSpasi: true, font: "Noto Sans Lao Looped", match: /\blao\b|laos/i,
    sets: [
      { id: "lo-konsonan", label: "Konsonan", strokes: "linguo:laos", glyphs: g(LAOS_KONSONAN) },
      { id: "lo-vokal", label: "Vokal", strokes: "linguo:laos", glyphs: g(LAOS_VOKAL) },
      { id: "lo-angka", label: "Angka", strokes: "linguo:laos", glyphs: g(LAOS_ANGKA) },
      { id: "lo-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(LO_KATA) },
      { id: "lo-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(LO_KALIMAT) },
    ],
  },
  {
    key: "jv", label: "Jawa", code: "jv", font: "Noto Sans Javanese", tanpaSpasi: true, match: /jawa|javanese|hanacaraka/i,
    sets: [
      { id: "jv-nglegena", label: "Aksara nglegena", strokes: "linguo:jawa", glyphs: g(JAWA_NGLEGENA) },
      { id: "jv-sandhangan", label: "Sandhangan", strokes: "linguo:jawa", glyphs: g(JAWA_SANDHANGAN) },
      { id: "jv-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(JV_KATA) },
      { id: "jv-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(JV_KALIMAT) },
    ],
  },
  {
    key: "su", label: "Sunda", code: "su", font: "Noto Sans Sundanese", tanpaSpasi: true, match: /sunda|pasundan/i,
    sets: [
      { id: "su-ngalagena", label: "Aksara ngalagena", strokes: "linguo:sunda", glyphs: g(SUNDA_NGALAGENA) },
      { id: "su-swara", label: "Aksara swara", strokes: "linguo:sunda", glyphs: g(SUNDA_SWARA) },
      { id: "su-rarangken", label: "Rarangkén", strokes: "linguo:sunda", glyphs: g(SUNDA_RARANGKEN) },
      { id: "su-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(SU_KATA) },
      { id: "su-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(SU_KALIMAT) },
    ],
  },
  {
    key: "ban", label: "Bali", code: "ban", font: "Noto Sans Balinese", tanpaSpasi: true, match: /\bbali/i,
    sets: [
      { id: "ban-wreastra", label: "Aksara wreastra", strokes: "linguo:bali", glyphs: g(BALI_WREASTRA) },
      { id: "ban-pangangge", label: "Pangangge suara", strokes: "linguo:bali", glyphs: g(BALI_PANGANGGE_SUARA) },
      { id: "ban-tengenan", label: "Pangangge tengenan", strokes: "linguo:bali", glyphs: g(BALI_PANGANGGE_TENGENAN) },
      { id: "ban-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(BAN_KATA) },
      { id: "ban-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(BAN_KALIMAT) },
    ],
  },
  {
    key: "bbc", label: "Batak", code: "bbc", tanpaSpasi: true, font: "Noto Sans Batak", match: /batak/i,
    sets: [
      { id: "bbc-ina", label: "Ina ni surat (huruf induk)", strokes: "linguo:batak", glyphs: g(BATAK_INA) },
      { id: "bbc-anak", label: "Anak ni surat (tanda vokal)", strokes: "linguo:batak", glyphs: g(BATAK_ANAK) },
      { id: "bbc-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(BBC_KATA) },
      { id: "bbc-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(BBC_KALIMAT) },
    ],
  },
  {
    key: "bug", label: "Bugis", code: "bug", font: "Noto Sans Buginese", tanpaSpasi: true, match: /bugis|lontara|ugi\b/i,
    sets: [
      { id: "bug-induk", label: "Ina' surek", strokes: "linguo:bugis", glyphs: g(LONTARA) },
      { id: "bug-vokal", label: "Ana' surek", strokes: "linguo:bugis", glyphs: g(LONTARA_VOKAL) },
      { id: "bug-kata", label: LABEL_KATA, stage: 2, frasa: true, glyphs: k(BUG_KATA) },
      { id: "bug-kalimat", label: LABEL_KALIMAT, stage: 3, frasa: true, glyphs: k(BUG_KALIMAT) },
    ],
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

/* ── Kata & kalimat ───────────────────────────────────────────────────────── */

const TANDA_BACA = /[\s。、．，,.!?！？:;\u037E؛،؟।॥"«»()։՞՜՝፡-፨၊။។៕꧈꧉᭞᭟۔]/u;

/** Teks kata/kalimat seperti yang dibaca orang (Thai: spasi pemisah bagian dibuang). */
export function teksFrasa(l: ScriptLang, c: string): string {
  return l.tanpaSpasi ? c.replace(/ /g, "") : c;
}

/** Pecah kata/kalimat jadi bagian yang ditulis satu per satu di papan. */
export function pecahBagian(c: string, unit: "char" | "word"): string[] {
  if (unit === "char") return Array.from(c).filter((x) => !TANDA_BACA.test(x));
  return c
    .split(/\s+/)
    .map((kata) => {
      const a = Array.from(kata);
      while (a.length && TANDA_BACA.test(a[0])) a.shift();
      while (a.length && TANDA_BACA.test(a[a.length - 1])) a.pop();
      return a.join("");
    })
    .filter(Boolean);
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

/* [latihan-menulis-v3] Peta modul tertulis lengkap (bukan import berpola) supaya
   Next (webpack) dan Vite sama-sama memecahnya jadi chunk kecil per aksara. */
type ModulGoresan = { default: Record<string, string[]> };
const MODUL_GORESAN: Record<string, () => Promise<ModulGoresan>> = {
  arab: () => import("./goresan/arab"),
  armenia: () => import("./goresan/armenia"),
  bali: () => import("./goresan/bali"),
  batak: () => import("./goresan/batak"),
  bengali: () => import("./goresan/bengali"),
  bugis: () => import("./goresan/bugis"),
  devanagari: () => import("./goresan/devanagari"),
  etiopia: () => import("./goresan/etiopia"),
  georgia: () => import("./goresan/georgia"),
  gurmukhi: () => import("./goresan/gurmukhi"),
  hangul: () => import("./goresan/hangul"),
  ibrani: () => import("./goresan/ibrani"),
  jawa: () => import("./goresan/jawa"),
  khmer: () => import("./goresan/khmer"),
  kiril: () => import("./goresan/kiril"),
  laos: () => import("./goresan/laos"),
  myanmar: () => import("./goresan/myanmar"),
  sunda: () => import("./goresan/sunda"),
  tamil: () => import("./goresan/tamil"),
  thai: () => import("./goresan/thai"),
  yunani: () => import("./goresan/yunani"),
};

async function ambilLinguo(modul: string, c: string): Promise<string[] | null> {
  const muat = MODUL_GORESAN[modul];
  if (!muat) return null;
  const data = (await muat()).default;
  // Angka Persia (U+06F0…) yang bentuknya sama dengan angka Arab-Indik memakai data angka Arab.
  const arab = c.replace(/[\u06F0-\u06F9]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 0x0660));
  return data[c] ?? data[c.normalize("NFC")] ?? data[arab] ?? null;
}

/** Path goresan (urut) untuk satu aksara; null kalau datanya tak ada / jaringan gagal. */
export function muatGoresan(c: string, sumber: SumberGoresan): Promise<string[] | null> {
  const kunci = `${sumber}:${c}`;
  let janji = cacheGoresan.get(kunci);
  if (!janji) {
    janji = (sumber === "kanjivg" ? ambilKanjiVg(c)
      : sumber === "hanzi" ? ambilHanzi(c)
      : ambilLinguo(sumber.slice("linguo:".length), c)).catch(() => null);
    cacheGoresan.set(kunci, janji);
    // Gagal jaringan jangan dikenang selamanya — percobaan berikutnya boleh mengulang.
    janji.then((hasil) => { if (!hasil) cacheGoresan.delete(kunci); });
  }
  return janji;
}
