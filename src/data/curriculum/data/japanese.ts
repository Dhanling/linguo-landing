import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

// ============================================================================
// A1 — Elementary Foundation (3 sublevels × 16 = 48 sesi)
// Hiragana mastery → Katakana → Kanji intro
// ============================================================================

const a1_1 = toSessions([
  [1, "Hiragana — vokal あいうえお", ["5 vokal dasar: あ(a), い(i), う(u), え(e), お(o)", "Sistem tulis fonetik — 1 huruf = 1 suku kata", "Hiragana = native Japanese words + grammar particles", "Stroke order penting — tulis dari kiri atas, urut tertentu"]],
  [2, "Hiragana — baris か & さ", ["か き く け こ (ka ki ku ke ko)", "さ し す せ そ (sa SHI su se so — し dibaca 'shi' bukan 'si')", "Dakuten (゛): か→が, さ→ざ — voiced versions", "Pronunciation: vokal pendek, no diftong"]],
  [3, "Hiragana — baris た & な", ["た ち つ て と (ta CHI tsu te to — ち='chi', つ='tsu')", "な に ぬ ね の (na ni nu ne no)", "Dakuten: た→だ (da row)", "Yang aneh: つ(tsu) dan ち(chi) — irregular romanization"]],
  [4, "Hiragana — baris は & ま", ["は ひ ふ へ ほ (ha hi FU he ho — ふ='fu', bilabial)", "ま み む め も (ma mi mu me mo)", "Dakuten/handakuten: は→ば(ba)/ぱ(pa)", "Particle は dibaca 'wa' (NOT 'ha') saat sebagai topic marker"]],
  [5, "Hiragana — baris や ら わ + ん", ["や ゆ よ (ya yu yo — hanya 3 huruf!)", "ら り る れ ろ (ra ri ru re ro — Japanese R: tap-flap, antara r dan l)", "わ を ん (wa wo n) — を particle objek (read 'o' or 'wo')", "ん = satu-satunya konsonan tunggal — selalu di akhir suku kata"]],
  [6, "Hiragana — voiced + yoon", ["Dakuten (゛): が ぎ ぐ げ ご (ga-gi-gu-ge-go), ざ じ ず ぜ ぞ (じ='ji')", "Handakuten (゜): ぱ ぴ ぷ ぺ ぽ (pa-pi-pu-pe-po)", "Yoon (small や ゆ よ): きゃ(kya), しゅ(shu), ちょ(cho) — 33 combinations", "Sokuon っ (small tsu): doubles consonant — がっこう (gakkou) school"]],
  [7, "Salam & sapaan", ["おはようございます (ohayou gozaimasu — pagi formal)", "こんにちは (konnichiwa — siang/halo umum)", "こんばんは (konbanwa — malam)", "さようなら (sayounara — selamat tinggal formal) / じゃあね (jaa ne — bye casual)"]],
  [8, "Perkenalan diri", ["はじめまして (hajimemashite — first meeting)", "わたしは___です (watashi wa ___ desu — I am ___)", "よろしくおねがいします (yoroshiku onegaishimasu — please be kind/work well with me)", "Bow when greeting — 15° (casual), 30° (formal), 45° (deep respect)"]],
  [9, "Angka 1-10", ["いち, に, さん, し/よん, ご, ろく, しち/なな, はち, きゅう, じゅう", "Number 4 = し OR よん (し avoided — homonym dengan death 死)", "Number 7 = しち OR なな", "Number 9 = きゅう (avoid く — homonym dengan suffering 苦)"]],
  [10, "Copula です/だ", ["です (desu) = polite copula 'is/am/are'", "わたしはインドネシアじんです (Watashi wa Indonesia-jin desu)", "Plain form: だ (da) — informal", "Negative: じゃありません (jya arimasen) OR ではありません (formal)"]],
  [11, "Particle は (wa) — topic marker", ["は WHEN as particle = read 'wa' (NOT 'ha')", "Marks topic of sentence (apa yang dibicarakan)", "___ は ___ です = ___ adalah ___", "Topic ≠ subject — concept unik Japanese"]],
  [12, "Particle か — question marker", ["か at end = question (no inversion needed)", "あなたはがくせいですか (Anata wa gakusei desu ka — apakah kamu siswa?)", "Yes/no questions natural pattern", "Question intonation tetap pakai か"]],
  [13, "Asal usul + kebangsaan", ["___ から来ました (___ kara kimashita — saya datang dari ___)", "Negara: 日本(Nihon-Japan), インドネシア, アメリカ, 中国(Chuugoku-China)", "Bahasa: 日本語(Nihongo), インドネシア語(Indoneshia-go)", "私は___人です (___ jin desu — saya orang ___)"]],
  [14, "Angka 11-100", ["11 = じゅういち (juu+ichi = 10+1)", "20 = にじゅう (ni+juu = 2×10)", "100 = ひゃく (hyaku) — irregular reading", "Combinations: 31 = さんじゅういち, 99 = きゅうじゅうきゅう"]],
  [15, "Nomor telepon + alamat", ["Nomor telepon: 0 dibaca ぜろ/れい (zero/rei)", "Hyphens: の (no) — 090-1234-5678 = ぜろきゅうぜろのいちにさんよんの…", "Alamat Japanese: prefecture → city → district → block", "Postal code 〒XXX-XXXX"]],
  [16, "Review A1.1 + Jepang 4 pulau", ["Recap hiragana + greetings + copula + particles", "4 pulau utama: 本州(Honshu), 北海道(Hokkaido), 九州(Kyushu), 四国(Shikoku)", "+ 沖縄(Okinawa) — south islands", "47 prefektur, Tokyo capital, populasi ~125M"]],
]);

const a1_2 = toSessions([
  [17, "Katakana — vokal + baris ka, sa", ["ア イ ウ エ オ (a i u e o)", "カ キ ク ケ コ (ka ki ku ke ko)", "サ シ ス セ ソ (sa shi su se so)", "Katakana = loanwords + onomatopoeia + emphasis"]],
  [18, "Katakana — baris ta, na, ha", ["タ チ ツ テ ト (ta chi tsu te to)", "ナ ニ ヌ ネ ノ (na ni nu ne no)", "ハ ヒ フ ヘ ホ (ha hi fu he ho)", "Loanwords: タクシー (takushii=taxi), コーヒー (koohii=coffee)"]],
  [19, "Katakana — sisanya + dakuten", ["マ ミ ム メ モ, ヤ ユ ヨ, ラ リ ル レ ロ, ワ ヲ ン", "Long vowel mark ー (only katakana): コーラ (koora=cola)", "Dakuten + yoon same as hiragana", "Foreign sound combinations: ティ(ti), トゥ(tu), ファ(fa), ヴ(vu)"]],
  [20, "Hari + bulan + tahun", ["Hari: 月(Mon),火(Tue),水(Wed),木(Thu),金(Fri),土(Sat),日(Sun) +曜日", "Bulan: 1月(ichi-gatsu), 2月(ni-gatsu)... 12月", "Tahun: 2026年 (ni-sen-niju-roku nen)", "Era Reiwa 8 = 2026 (Japanese era system parallel)"]],
  [21, "Jam + waktu", ["何時ですか (Nan-ji desu ka — jam berapa?)", "___ 時 (-ji): 1時(ichi-ji)... 12時. Note 4時=yo-ji, 7時=shichi-ji, 9時=ku-ji", "___ 分 (-fun/-pun): irregular pronunciations", "Pagi: 午前 (gozen), siang: 午後 (gogo)"]],
  [22, "Makanan Jepang dasar", ["ごはん (gohan) = nasi/meal, パン (pan) = roti, おにぎり (onigiri) = nasi kepal", "すし (sushi), さしみ (sashimi), ラーメン (raamen), てんぷら (tempura)", "Soup: みそしる (miso shiru)", "Bumbu: しょうゆ (shouyu=soy), わさび (wasabi), しょうが (shouga=ginger)"]],
  [23, "Verba ます-form (polite)", ["たべます (tabemasu=eat), のみます (nomimasu=drink), いきます (ikimasu=go)", "Negative: ません (masen) — たべません = not eat", "Past: ました (mashita) — たべました = ate", "Past negative: ませんでした (masen deshita)"]],
  [24, "Particle を, に, へ", ["を (o) = direct object marker — おすしをたべます (eat sushi)", "に (ni) = direction/time — 7時に行きます (go at 7)", "へ (e — read 'e' as particle!) = direction emphasis", "Particles essential — wrong particle = different meaning"]],
  [25, "Keluarga (my family vs your)", ["MINE: ちち (chichi=ayah), はは (haha=ibu), あに (ani=kakak laki), あね (ane=kakak perempuan)", "OTHERS': おとうさん, おかあさん, おにいさん, おねえさん (with お and さん)", "Sister/brother younger: いもうと/おとうと vs いもうとさん/おとうとさん", "Politeness asymmetry — keluarga sendiri direndahkan, orang lain ditinggikan"]],
  [26, "Anggota tubuh", ["あたま (atama=kepala), め (me=mata), はな (hana=hidung), くち (kuchi=mulut)", "て (te=tangan), あし (ashi=kaki), おなか (onaka=perut)", "Kanji intro: 目, 口, 手, 足", "あたまがいたい (atama ga itai = sakit kepala)"]],
  [27, "Warna + bentuk", ["あか (aka=merah), あお (ao=biru), きいろ (kiiro=kuning), みどり (midori=hijau)", "しろ (shiro=putih), くろ (kuro=hitam)", "い-adjective version: あかい, あおい, くろい, しろい", "Bendera Jepang: 日の丸 (hi no maru) — red circle on white"]],
  [28, "Lokasi — あります vs います", ["あります (arimasu) = ada (untuk benda mati)", "います (imasu) = ada (untuk makhluk hidup)", "___ に ___ があります (di ___ ada ___)", "うえ (atas), した (bawah), なか (dalam), そと (luar)"]],
  [29, "これ/それ/あれ + この/その/あの", ["これ/それ/あれ = ini/itu/itu(jauh) — stand alone", "この/その/あの + nama = this/that/that book", "Kosoado system — fundamental Japanese deixis", "どれ/どの = which? どこ = where?"]],
  [30, "Perkenalan diri expanded", ["Nama, asal, pekerjaan, hobi, umur", "___ さい (sai) = umur, 25 さい = 25 tahun", "___ にすんでいます (sun-de imasu) = tinggal di ___", "Politeness markers throughout"]],
  [31, "Di restoran", ["すみません! (sumimasen! — excuse me / panggil pelayan)", "___ をください (___ o kudasai) = saya minta ___", "おすすめは何ですか (osusume wa nan desu ka — apa rekomendasinya?)", "おかんじょうおねがいします (o-kanjou onegai shimasu — bill please)"]],
  [32, "Review A1.2 + sarapan Jepang", ["Recap katakana + verbs + particles", "Sarapan tradisional: gohan + miso shiru + ikan asin + sayur tsukemono", "Sarapan modern: pan + kopi (western)", "Pola makan ichiju-sansai (1 soup + 3 sides) heritage"]],
]);

const a1_3 = toSessions([
  [33, "Kanji 1 — angka 一二三四五", ["一(ichi=1), 二(ni=2), 三(san=3), 四(shi/yon=4), 五(go=5)", "Stroke order matters — kanji punya urutan", "Onyomi (Chinese reading) vs Kunyomi (Japanese reading)", "Linguo target: ~100 kanji by end A1, ~500 by B1"]],
  [34, "Kanji 2 — angka & hari 六七八九十", ["六(roku=6), 七(shichi/nana=7), 八(hachi=8), 九(kyuu/ku=9), 十(juu=10)", "百(hyaku=100), 千(sen=1000), 万(man=10,000)", "Money: 円(en/yen) — ¥1000 = せんえん", "Cek harga: いくらですか (ikura desu ka — berapa harga?)"]],
  [35, "Kanji 3 — hari & alam 月日年", ["月 (gatsu/tsuki = bulan/moon), 日 (nichi/hi = hari/sun)", "年 (nen/toshi = tahun/year)", "Combinations: 月曜日 (getsu-youbi = Senin), 日曜日 (nichi-youbi = Minggu)", "今日 (kyou = hari ini), 明日 (ashita = besok), 昨日 (kinou = kemarin)"]],
  [36, "Past tense recap", ["でした = was/were (copula past)", "ました = did (verb past)", "Kemarin = 昨日 (kinou) — signal word past", "昨日東京へ行きました (Kinou Tokyo e ikimashita = kemarin pergi ke Tokyo)"]],
  [37, "Hari, bulan, tahun expressions", ["Today's date: 今日は5月17日です (Kyou wa go-gatsu juu-shichi-nichi desu)", "Special: 1日(tsuitachi), 2日(futsuka), 3日(mikka) — irregular!", "20日 = はつか (hatsuka), 14日 = じゅうよっか (juu-yokka)", "Days 1-10 + 14, 20, 24 — irregular memorize"]],
  [38, "Time expressions — kemarin/besok", ["今日(kyou), 明日(ashita), 昨日(kinou)", "今週(konshuu=minggu ini), 来週(raishuu=minggu depan), 先週(senshuu=minggu lalu)", "今月, 来月, 先月", "今年, 来年, 去年(kyonen=tahun lalu)"]],
  [39, "Verba negative ません", ["たべません (tabemasen=not eat)", "Past negative: ませんでした", "今日学校へ行きません (Kyou gakkou e ikimasen = today not going to school)", "Negation pattern consistent across all -masu verbs"]],
  [40, "Hobby + 好きです", ["___ がすきです (___ ga suki desu = saya suka ___)", "好き (suki = like) — na-adjective", "Pattern: subject + が + suki desu", "Hobbies: 読書 (dokusho=reading), 旅行 (ryokou=travel), 音楽 (ongaku=music)"]],
  [41, "Anime + manga intro", ["アニメ (anime) — global cultural export", "漫画 (manga) — pioneer Tezuka Osamu (Astro Boy 1952)", "Modern: One Piece, Naruto, Demon Slayer, Jujutsu Kaisen", "Anime film: Spirited Away (2001) Oscar 2003"]],
  [42, "Studio Ghibli", ["Founded 1985 — Miyazaki Hayao + Takahata Isao + Suzuki Toshio", "Films: となりのトトロ (Totoro 1988), 千と千尋 (Spirited Away)", "ハウルの動く城 (Howl's Moving Castle), 風の谷のナウシカ", "Watercolor + cel animation legacy global"]],
  [43, "J-pop intro", ["X Japan (1980s rock), Mr. Children, Spitz — modern classics", "Hikaru Utada — First Love (1999) heritage", "Yumi Matsutoya 'Yuming' — singer-songwriter legend", "Modern: YOASOBI, Aimer, Vaundy, Yorushika"]],
  [44, "Olahraga Jepang", ["相撲 (sumou) — national sport heritage", "野球 (yakyuu=baseball) — most popular professional", "サッカー (sakkaa=soccer) — J League since 1993", "武道 (budou=martial arts): 柔道, 剣道, 空手, 合気道"]],
  [45, "Membaca + buku", ["読みます (yomimasu = membaca), 書きます (kakimasu = menulis)", "本 (hon = buku), 新聞 (shinbun = koran), 雑誌 (zasshi = majalah)", "図書館 (toshokan = perpustakaan), 本屋 (honya = toko buku)", "Famous bookshops: Kinokuniya, Tsutaya, Maruzen"]],
  [46, "Verba irregular comon", ["来ます (kimasu = come) — irregular", "します (shimasu = do) — irregular: べんきょうします (study)", "Combine: かいものします (shopping), りょこうします (travel)", "あります vs います vs です vs だ — kapan pakai apa"]],
  [47, "Modal expressions", ["___ ことができます (koto ga dekimasu = can do)", "___ たいです (tai desu = want to)", "日本語をはなすことができます (can speak Japanese)", "Politeness: ___ てもいいですか (may I?)"]],
  [48, "Review A1.3 + omotenashi", ["Recap kanji + past + hobbies + irregular verbs", "おもてなし (omotenashi) — hospitality without expectation reward", "Heritage tea ceremony — anticipating guest needs", "Olympics 2020 Tokyo bid slogan — global awareness"]],
]);

// ============================================================================
// A2 — Pre-Intermediate (4 sublevels × 16 = 64 sesi)
// te-form mastery → dictionary form → opinion forms → cultural foundations
// ============================================================================

const a2_1 = toSessions([
  [49, "Te-form intro", ["Te-form = swiss army knife conjugation", "Group 1 (-u verbs): く→いて, ぐ→いで, す→して, つ/う/る→って", "Group 2 (-iru/-eru): る→て (tabe-ru → tabe-te)", "Irregular: する→して, 来る→来て (kite)"]],
  [50, "Te-form requests — ください", ["___ てください (___ te kudasai = tolong ___ kan)", "ちょっとまってください (chotto matte kudasai = please wait a moment)", "すみません, ___ てくださいませんか (more polite request)", "Negative request: ___ ないでください (don't please)"]],
  [51, "Te-form continuous — ています", ["___ ています (te imasu) = sedang melakukan (present continuous)", "OR habit/state: 結婚しています (kekkon shite imasu = married)", "今食べています (now eating) vs 毎日食べています (eat every day habit)", "Context disambiguates"]],
  [52, "Te-form connecting actions", ["Connect verbs sequentially with te-form", "あさおきて, あさごはんをたべて, がっこうへいきます (wake up, eat breakfast, go to school)", "Te = and (action sequence) or because (causation)", "Multiple te-forms in chain natural Japanese"]],
  [53, "Te-form permission — てもいい", ["___ てもいいです (te mo ii desu = boleh ___)", "Question: ___ てもいいですか (may I ___?)", "Casual: ___ てもいい?", "Polite refusal pattern needed"]],
  [54, "Te-form prohibition — てはいけない", ["___ てはいけません (formal prohibition)", "Casual: ___ ちゃだめ", "Examples: ここでたばこをすってはいけません (no smoking here)", "Public signs full of these patterns"]],
  [55, "Adjektif i-form", ["い-adjektif: あつい(hot), さむい(cold), あたらしい(new), たかい(expensive/tall)", "Conjugation: あつい → あつくない (negative), あつかった (past), あつくなかった", "Adverb: あつく (atsuku) — combines like te-form: あつくて (hot and...)", "Predicate position: 暑いです NOT 暑いだ"]],
  [56, "Adjektif na-form", ["な-adjektif: きれい(pretty/clean), しずか(quiet), にぎやか(lively), ゆうめい(famous)", "Predicate: きれいです (NOT きれいです with な)", "Modifier: きれい な ところ (pretty place — needs な)", "Negative: きれいじゃない, past: きれいだった"]],
  [57, "Perbandingan ___のほうが", ["A のほうが B より + adjective", "東京のほうが大阪より大きいです (Tokyo is bigger than Osaka)", "Question: A と B とどちらが ___ ですか (which is more ___?)", "Same: ___ とおなじです (same as)"]],
  [58, "Paling — 一番", ["___ のなかで一番 ___ (___ no naka de ichiban ___ = among ___, most ___)", "日本でいちばんたかいやまはふじさんです (highest mountain in Japan is Fuji)", "Question word: なんですか / どれですか", "Superlative pattern essential"]],
  [59, "Want — たいです", ["Verb stem (no ます) + たいです", "食べる→食べたい (want to eat)", "Negative: ___ たくない", "Note: たい conjugates like i-adjective: 食べたかった (wanted to eat)"]],
  [60, "Reasons — から & ので", ["___ から (kara) = because (subjective/personal)", "___ ので (node) = because (objective/explanatory, polite)", "あついから, アイスを食べたいです (because hot, want ice cream)", "Reason ALWAYS first in Japanese (vs English last)"]],
  [61, "Kondisional — たら & ば", ["___ たら = if/when (past form + ら)", "Hareru-tara hashi ni iku (if weather clears, go to bridge)", "___ ば = if (more formal, conditional)", "Different conditionals — context-dependent choice"]],
  [62, "Have to — なければなりません", ["Long: ___ なければなりません", "Casual: ___ なきゃ / ___ ないと", "勉強しなければなりません (have to study)", "Variant: ___ なくてはいけない (similar)"]],
  [63, "Need not — なくてもいい", ["___ なくてもいい (do not need to)", "Today no work = 今日は仕事しなくてもいい", "Question: ___ なくてもいいですか (don't I need to?)", "Polite vs casual variations"]],
  [64, "Review A2.1 + Tea ceremony", ["Recap te-form + adjectives + comparisons", "茶道 (sadou/chanoyu) — way of tea, 16th century formalized by Sen no Rikyū", "和敬清寂 (wa-kei-sei-jaku) — harmony, respect, purity, tranquility", "Matcha + wagashi confectionery — ritual mindfulness"]],
]);

const a2_2 = toSessions([
  [65, "Dictionary form (plain)", ["Plain form = base form (no ます)", "Casual conversation among friends/family", "Group 1: いく, のむ, よむ. Group 2: たべる, みる. Irregular: する, くる", "Used as connector + with grammar patterns"]],
  [66, "Intentions — つもりです", ["Plain form + つもりです (intend to)", "Negative: ___ ないつもりです (intend not to)", "明日東京へ行くつもりです (tomorrow plan to Tokyo)", "Different from ___ たい (want)"]],
  [67, "Probably — でしょう", ["Plain form + でしょう (probably, will)", "Polite: ___ でしょう / Casual: ___ だろう", "明日雨が降るでしょう (tomorrow rain probably)", "Weather forecasts ALWAYS use でしょう"]],
  [68, "Try — てみる", ["Te-form + みる (try doing)", "食べてみる (try eating), 行ってみる (try going)", "Often + たい (want to try): 食べてみたい", "Different from suceed/manage — just attempt"]],
  [69, "Rencana perjalanan", ["旅行 (ryokou=travel), 計画 (keikaku=plan), 予約 (yoyaku=reservation)", "ホテル (hoteru), 旅館 (ryokan=traditional inn), 民宿 (minshuku=family stay)", "ビザ (biza=visa), パスポート (pasupooto)", "Japan visa policy — most Asian + Western countries visa-free short stay"]],
  [70, "Sistem kereta", ["JR — Japan Railways (privatized 1987)", "新幹線 (shinkansen) — bullet train, since 1964 Olympics", "Tokyo Station hub — Tokaido (south), Tohoku (north) shinkansen", "Apps: Hyperdia, NaviTime, Google Maps essential"]],
  [71, "Reservasi hotel/ryokan", ["シングル (single), ダブル (double), ツイン (twin)", "和室 (washitsu=tatami room) vs 洋室 (youshitsu=western room)", "朝食付き (choushoku-tsuki=with breakfast)", "Ryokan = traditional: yukata + onsen + kaiseki meal"]],
  [72, "Onsen culture", ["温泉 (onsen=hot spring) — volcanic Japan blessing", "Etiquette: wash BEFORE entering, no swimsuits, tattoos restrictions historic", "Famous: Beppu (Kyushu), Hakone (near Tokyo), Kusatsu (Gunma)", "Mixed bathing 混浴 (konyoku) rare modern"]],
  [73, "Profesi", ["会社員 (kaisha-in=company employee), 公務員 (koumuin=civil servant)", "医者 (isha=doctor), 先生 (sensei=teacher), 弁護士 (bengoshi=lawyer)", "エンジニア (enjinia=engineer), プログラマー (puroguramaa=programmer)", "サラリーマン (sarariiman) — salaryman, Japanese-coined English"]],
  [74, "Pertukaran kartu nama", ["名刺 (meishi) — business card exchange ritual", "Hand over with two hands, bow slight, study card before pocketing", "Never write on someone's meishi", "Order of greeting hierarchical — most senior first"]],
  [75, "Vocab kantor", ["部長 (buchou=department head), 課長 (kachou=section chief)", "先輩 (senpai=senior), 後輩 (kouhai=junior)", "会議 (kaigi=meeting), プレゼン (purezen=presentation), 残業 (zangyou=overtime)", "Hierarchy fundamental Japanese workplace"]],
  [76, "Honorifik — さん, さま, くん, ちゃん", ["___ さん (san) = default polite Mr/Ms (use with EVERYONE — even friends + family in formal)", "___ さま (sama) = ultra-polite (customers, royalty)", "___ くん (kun) = junior male / close male friend / subordinate", "___ ちゃん (chan) = endearment (children, close female friends, pets)"]],
  [77, "Budaya kerja Jepang", ["改善 (kaizen) — continuous improvement, Toyota Production System heritage", "根回し (nemawashi) — pre-meeting consensus building", "5S: seiri-seiton-seisou-seiketsu-shitsuke", "Karoshi 過労死 — death from overwork (dark side)"]],
  [78, "Perusahaan besar", ["Toyota — Toyoda Sakichi 1937 founder, hybrid pioneer", "Sony — Morita Akio, walkman + PlayStation heritage", "Nintendo — playing cards 1889 → gaming giant", "SoftBank, Rakuten, Honda — modern global brands"]],
  [79, "Email bisnis", ["お疲れ様です (otsukaresama desu = thanks for hard work - standard email greeting!)", "いつもお世話になっております (always under your care - formal)", "よろしくお願いいたします (yoroshiku onegai itashimasu = appreciate cooperation - email closer)", "Japanese business email — extremely formulaic + ritual"]],
  [80, "Review A2.2 + Tokyo business", ["Recap dictionary form + work culture", "Tokyo districts: Marunouchi (banking), Shinjuku (corporate HQs)", "Roppongi (international), Shibuya (tech startups)", "Tokyo Station + Shinjuku Station — busiest globally"]],
]);

const a2_3 = toSessions([
  [81, "Think — と思います", ["Plain form + と思います (to omoimasu = I think that ___)", "そう思います (sou omoimasu = I think so)", "Negative opinion: ___ ないと思います (think that not)", "Tentative tone — Japanese culture prefers indirect"]],
  [82, "Said — と言いました", ["Plain form + と言いました (to iimashita = said that)", "Quotation marker と", "Direct: 「」を言う (say in quotes)", "Indirect speech — common in narratives"]],
  [83, "Hearsay — そうです", ["Plain form + そうです (sou desu = I heard that)", "雨が降るそうです (heard it'll rain)", "Reporting other people's words", "Different from そう (looks like) below"]],
  [84, "Looks like — そうです (form 2)", ["___ そう (visual judgment): おいしそう (looks delicious)", "Verbs stem + そう: 雨が降りそう (looks like rain coming)", "Adjectives: おいし-そう, 暑そう (hot looking)", "Negative looking: 来なさそう (looks like not coming)"]],
  [85, "Tabun + kamoshiremasen", ["たぶん (tabun) = probably/maybe", "___ かもしれません (kamoshiremasen) = might/could be", "雨が降るかもしれません (might rain)", "Less certain than でしょう"]],
  [86, "Tingkat kesopanan intro", ["普通形 (futsuukei) = plain form (casual)", "丁寧形 (teineikei) = polite form (です/ます)", "尊敬語 (sonkeigo) = exalting other's actions (B2)", "謙譲語 (kenjougo) = humbling self's actions (B2)"]],
  [87, "Polite vs casual", ["Friends/family/peers: plain form OK", "Strangers/older/customers: polite (です/ます) required", "Business: keigo (B2 advanced)", "Wrong register = social faux pas"]],
  [88, "Politik Jepang", ["Constitutional monarchy + parliamentary democracy", "Emperor (天皇 Tennou): Naruhito (Reiwa era from 2019)", "Prime Minister: Ishiba Shigeru (LDP, from October 2024)", "Diet: 衆議院 (Shuugiin=Lower) + 参議院 (Sangiin=Upper)"]],
  [89, "Koran Jepang", ["朝日新聞 (Asahi) — center-left", "読売新聞 (Yomiuri) — center-right, largest circulation", "毎日新聞 (Mainichi) — moderate", "日経 (Nikkei) — business, Financial Times-equivalent"]],
  [90, "Verba berpikir + speaking", ["思う (omou=think), 考える (kangaeru=consider)", "言う (iu=say), 話す (hanasu=speak), 伝える (tsutaeru=convey)", "信じる (shinjiru=believe), 知る (shiru=know)", "Honorific equivalents at B2 keigo level"]],
  [91, "Verba refleksif emosi", ["怒る (okoru=get angry), 喜ぶ (yorokobu=rejoice), 悲しむ (kanashimu=grieve)", "驚く (odoroku=be surprised), 心配する (shinpai suru=worry)", "感動する (kandou suru=be moved/touched)", "Japanese emotions often expressed via verbs not adjectives"]],
  [92, "Mengeluh sopan", ["ちょっと困っています (chotto komatte imasu = I'm a bit troubled)", "Indirect expression — DIRECT complaints rare in Japanese", "ご迷惑ですが (gomeiwaku desu ga = it's an inconvenience but...)", "Cushion phrases (kushion kotoba) — Japanese conversational lubricant"]],
  [93, "Minta maaf", ["すみません (sumimasen) — multipurpose: sorry/excuse me/thank you (yes!)", "ごめんなさい (gomen nasai) — informal personal apology", "申し訳ありません (moushiwake arimasen) — deeply apologize (very formal)", "Apology fundamental Japanese culture — frequency surprises foreigners"]],
  [94, "Sumimasen multifungsi", ["1. Apology — Sumimasen, okurete (sorry I'm late)", "2. Get attention — Sumimasen! (excuse me to waiter)", "3. Thanks for trouble — Sumimasen, arigatou", "Most-used word in Japanese?  Probably."]],
  [95, "Budaya minum — izakaya", ["居酒屋 (izakaya) — casual after-work drinking spot", "飲み会 (nomikai) — drinking party with colleagues", "Etiquette: pour for others NOT yourself, never refill own glass", "とりあえずビール (toriaezu biiru — beer first as default)"]],
  [96, "Review A2.3 + ryokai culture", ["Recap opinion + hearsay + politeness", "了解 (ryoukai = understood, casual confirmation)", "Common in workplace + military origin", "了解しました (formal) vs 了解です (casual)"]],
]);

const a2_4 = toSessions([
  [97, "Edo period 1603-1868", ["徳川家康 (Tokugawa Ieyasu) — shogun founder 1603", "Sakoku (鎖国) isolation policy — closed country 200+ years", "Cultural flowering: kabuki, ukiyo-e, haiku Bashō", "Edo (now Tokyo) becomes world's largest city ~1M"]],
  [98, "Meiji Restoration 1868", ["明治維新 (Meiji Ishin) — emperor restored political power", "Modernization rapid: trains, factories, Western dress, military", "明治天皇 (Emperor Meiji) — Mutsuhito", "Slogan: 富国強兵 (fukoku kyouhei=rich country, strong army)"]],
  [99, "WWII context", ["1937 — China invasion, Nanjing Massacre", "1941-1945 — Pacific War, Pearl Harbor", "1945 — atomic bombs Hiroshima Aug 6, Nagasaki Aug 9", "Postwar Constitution 1947 — Article 9 pacifism"]],
  [100, "Postwar miracle 1945-1990", ["MacArthur reforms — democratic constitution, land reform, zaibatsu break-up", "1964 Tokyo Olympics — postwar comeback symbol", "Bubble economy 1980s — Japan as #2 world economy", "1990s 'Lost Decade' — bubble burst, deflation"]],
  [101, "Heisei → Reiwa", ["Heisei era 1989-2019 — Emperor Akihito reign", "2011 — Tohoku earthquake + tsunami + Fukushima nuclear", "2019 — Emperor Naruhito ascends, Reiwa era begins (令和)", "Reiwa = 'beautiful harmony', kanji from Manyoshu poetry"]],
  [102, "Konstitusi + parlemen", ["Constitution 1947 — drafted under US occupation", "Article 9 — renounces war (pacifism clause)", "Diet bicameral: 衆議院 (House Representatives 465) + 参議院 (House Councillors 248)", "LDP dominant 1955-now (rare interruptions)"]],
  [103, "47 prefektur overview", ["都 (to): Tokyo-to only", "道 (dou): Hokkaido only", "府 (fu): Osaka-fu, Kyoto-fu", "県 (ken): 43 others (e.g., Aichi-ken, Fukuoka-ken)"]],
  [104, "Kanto region", ["関東 — east Japan, Tokyo metropolis center", "Tokyo, Kanagawa (Yokohama+Kamakura), Saitama, Chiba", "Gunma, Tochigi, Ibaraki — semi-rural prefectures", "Akihabara, Asakusa, Ginza, Shibuya — Tokyo districts iconic"]],
  [105, "Kansai region", ["関西 — west Japan, historical capital region", "Kyoto — capital 794-1869, 2000+ temples", "Osaka — commercial, food capital, Dotonbori", "Nara (older capital), Kobe (port + beef), Wakayama"]],
  [106, "Tohoku + Hokkaido", ["Tohoku 東北 — northeast, 2011 earthquake region", "Sendai, Fukushima, Aomori — major cities", "Hokkaido 北海道 — north island, Sapporo capital", "Skiing, snow festivals, indigenous Ainu heritage"]],
  [107, "Kyushu + Shikoku + Okinawa", ["Kyushu 九州 — south island, Fukuoka largest city", "Shikoku 四国 — smallest of 4 main, 88 temple pilgrimage", "Okinawa — southern islands, distinct Ryukyuan culture", "Okinawan language separate from Japanese"]],
  [108, "Masakan regional", ["Kanto: soba, tempura, monjayaki", "Kansai: okonomiyaki (Osaka), takoyaki (Osaka), kaiseki (Kyoto)", "Kyushu: tonkotsu ramen (Fukuoka), motsunabe", "Hokkaido: miso ramen, jingisukan (mutton)"]],
  [109, "Festival musiman", ["お盆 (Obon) — August, ancestor spirits return", "七夕 (Tanabata) — July 7, star festival", "花見 (Hanami) — late March/April, cherry blossom viewing", "夏祭り (natsumatsuri) — summer festivals town/shrine"]],
  [110, "Oshogatsu — Tahun Baru", ["お正月 (Oshougatsu) — biggest holiday, Jan 1-3", "おせち料理 (osechi ryouri) — special new year food", "初詣 (hatsumoude) — first shrine visit of year", "お年玉 (otoshidama) — money envelopes for kids"]],
  [111, "Shinto + Buddhism", ["神道 (Shintou) — native animist religion, kami (spirits)", "仏教 (Bukkyou=Buddhism) — arrived 6th century", "Syncretism — most Japanese practice both (Shinto for life events, Buddhism for death)", "Famous: Ise Shrine (Shinto), Todaiji Temple Nara (Buddhist)"]],
  [112, "Review A2.4 + samurai heritage", ["Recap history + regions + religion", "侍 (samurai) heritage — Bushidou code", "Famous: Miyamoto Musashi, Oda Nobunaga, Tokugawa Ieyasu", "Modern: salaryman culture inherits some samurai loyalty values"]],
]);

// ============================================================================
// B1 — Intermediate (5 sublevels × 16 = 80 sesi)
// ============================================================================

const b1_1 = toSessions([
  [113, "Plain form mastery", ["All verbs in plain form: ru-form, ta-form, nai-form", "Plain form essential — quotation, conditional, modifiers", "Friends + family — plain form ONLY (polite would be cold)", "Switching registers — cultural sensitivity"]],
  [114, "Aspek tense", ["Habitual: 食べる (eat) vs 食べている (eating/has eaten state)", "Resultative: 結婚している (married state)", "Perfect: 食べたことがある (have eaten = experience)", "Japanese aspect ≠ English tense — concept rework"]],
  [115, "Conjunctions kara, kedo, shi, ga", ["___ から (because, reason — subjective)", "___ けど (but, casual)", "___ し (and, listing reasons)", "___ が (but, formal/written)"]],
  [116, "Storytelling", ["昔々 (mukashi mukashi = long long ago) — folktale opener", "そして (soshite=then), でも (demo=but), 結局 (kekkyoku=finally)", "Past narrative: ました/た", "Children's story patterns"]],
  [117, "Folktales — Momotaro", ["桃太郎 (Momotaro) — peach boy hero", "Tale: old couple find peach with baby, raise as son, defeat demons", "Companions: dog, monkey, pheasant", "National identity tale heritage"]],
  [118, "Soseki Natsume", ["夏目漱石 (Natsume Sōseki) 1867-1916", "Father of modern Japanese novel", "坊っちゃん (Botchan), 吾輩は猫である (I am a Cat), こころ (Kokoro)", "Studied English in London — bridges East-West"]],
  [119, "Akutagawa Ryūnosuke", ["芥川龍之介 (Akutagawa Ryūnosuke) 1892-1927", "羅生門 (Rashomon), 蜘蛛の糸 (Spider's Thread)", "Short story master", "Akutagawa Prize — top literary award named after him"]],
  [120, "Plain negative", ["___ ない (nai) = plain negative", "食べる→食べない (don't eat), 行く→行かない (don't go)", "Adjectives: 暑い→暑くない (not hot)", "Past negative: ___ なかった"]],
  [121, "Conditional ば vs たら", ["___ ば — if (more formal, hypothetical)", "___ たら — if/when (covers many uses, common spoken)", "雨が降れば (if rain falls — ba conditional)", "雨が降ったら (when/if rain falls — tara conditional)"]],
  [122, "Past hypothetical", ["___ ていたら + ___ ていた (had ___, would have ___)", "勉強していたら, 合格していた (if I had studied, would have passed)", "Counterfactual past — regret pattern", "Drama queens tense par excellence"]],
  [123, "Pasif form", ["___ れる/られる = passive", "私は先生に叱られた (I was scolded by teacher)", "Suffering passive: 雨に降られた (got rained on — unfortunate)", "Japanese passive includes adversative nuance unique"]],
  [124, "Kausatif form", ["___ せる/させる = make/let someone do", "母は私に勉強させる (mother makes me study)", "Permission causative: 食べさせてください (please let me eat)", "Combination passive+causative = passive-causative ___ せられる"]],
  [125, "Kausatif-pasif", ["___ させられる = was made to do (combination)", "私は宿題をやらせられた (I was made to do homework)", "Adversative meaning — was forced to", "Common in workplace stories"]],
  [126, "Pronomina advanced", ["私 (watashi=I, neutral) vs 僕 (boku=I, male casual) vs 俺 (ore=I, male rough)", "あなた (anata=you, careful — can sound cold)", "彼 (kare=he), 彼女 (kanojo=she) — also boyfriend/girlfriend", "Avoid pronouns when possible — Japanese omits often"]],
  [127, "Idiom expressions", ["猫の手も借りたい (cat's paw needed) — extremely busy", "石の上にも三年 (three years on a stone) — perseverance pays", "猿も木から落ちる (even monkeys fall from trees) — anyone errs", "Yojijukugo 四字熟語 (4-character idioms) — classical heritage"]],
  [128, "Review B1.1 + Japanese humor", ["Recap plain form + conditional + passive", "Humor: manzai (boke + tsukkomi duo)", "Modern: Downtown, Sanma, M-1 Grand Prix", "Anime humor — absurdity + pun based"]],
]);

const b1_2 = toSessions([
  [129, "Anime golden age — Miyazaki", ["Miyazaki Hayao 1941 — co-founded Studio Ghibli 1985", "風の谷のナウシカ 1984, 千と千尋の神隠し 2001 (Oscar)", "Themes: environmentalism, pacifism, strong female protagonists", "Retired+returned multiple times — final film The Boy and the Heron"]],
  [130, "Modern anime — Shinkai", ["Shinkai Makoto — 君の名は (Your Name 2016), 天気の子 (Weathering With You 2019), 鈴芽の戸締まり (Suzume 2022)", "Hosoda Mamoru — Wolf Children, Mirai", "Style: hyperreal animation, romance, body-swap narratives", "Anime film as art form globally accepted"]],
  [131, "Manga history — Tezuka", ["Tezuka Osamu (1928-1989) — God of Manga", "鉄腕アトム (Astro Boy 1952), ジャングル大帝 (Kimba)", "Modern: One Piece (Oda Eiichiro), Dragon Ball (Toriyama), Demon Slayer", "Manga industry — 100+ billion yen annual"]],
  [132, "J-pop heritage", ["Yumi Matsutoya (Yuming) — singer-songwriter legend since 1972", "Mr. Children, Spitz — Heisei era anthems", "Hikaru Utada — First Love (1999) — 7.65M copies sold", "Modern: YOASOBI, Ado, Kenshi Yonezu — anime tie-in stars"]],
  [133, "K-pop influence (different)", ["K-pop wave Korea-to-Japan strong 2010s-now", "BTS, BLACKPINK — Japanese versions of songs", "Japanese pop responding with idol culture (AKB48, Nogizaka46)", "Cultural exchange — both ways"]],
  [134, "Kabuki + Noh theater", ["歌舞伎 (Kabuki) — popular theater since 1603, all-male cast", "能 (Noh) — masked classical theater 14th century", "Famous theaters: Kabuki-za Tokyo, Minami-za Kyoto", "UNESCO Intangible Cultural Heritage both"]],
  [135, "Sumo national sport", ["相撲 (sumou) — origins 1500 years ago, Shinto ritual roots", "6 grand tournaments yearly: Tokyo (3x), Osaka, Nagoya, Fukuoka", "Yokozuna — highest rank, extremely rare", "Decline modern — Mongolian wrestlers dominant recent decades"]],
  [136, "Baseball — Ichiro heritage", ["野球 (yakyuu) — most popular professional sport since Meiji", "12 NPB teams, 2 leagues (Central + Pacific)", "Ichiro Suzuki (Mariners legend), Shohei Ohtani (modern global star)", "High school baseball (Koshien) — national obsession August"]],
  [137, "Wabi-sabi philosophy", ["侘寂 — beauty in imperfection, impermanence, incompletion", "Aesthetic: rough texture, asymmetry, simplicity, weathering", "Tea ceremony manifests wabi-sabi", "Kintsugi — gold-repaired pottery embodies"]],
  [138, "Ikigai konsep", ["生き甲斐 (ikigai) — reason for being, life's purpose", "Venn diagram: love + good at + world needs + paid for", "Okinawan longevity heritage", "Western pop concept now — origin Japanese subtle"]],
  [139, "Mottainai — anti-waste", ["もったいない (mottainai) — wasteful, regrettable", "Cultural respect for resources/objects", "Wangari Maathai (Kenyan Nobel laureate) globalized term", "Modern: zero-waste lifestyle Japan trend"]],
  [140, "Tea ceremony deep", ["茶道 (sadou) — formalized by Sen no Rikyū 16th century", "Wabi-cha aesthetic — small room, rustic utensils", "Schools: Urasenke, Omotesenke, Mushakojisenke", "Multi-hour ritual — meditation in motion"]],
  [141, "Ikebana — flower arrangement", ["生け花 (ikebana) — Buddhist origins, 7th century", "Schools: Ikenobō (oldest), Ohara, Sogetsu (modern)", "Asymmetry + space + harmony principles", "Ikenobō Sen'ei — 45th generation master"]],
  [142, "Calligraphy — shodo", ["書道 (shodou) — way of writing", "4 styles: 楷書 (kaisho), 行書 (gyousho), 草書 (sousho), 篆書 (tensho)", "Tools: brush (fude), ink stick (sumi), ink stone (suzuri), paper (washi)", "Heart through brush — meditation practice"]],
  [143, "Karate, judo, kendo, aikido", ["空手 (Karate) — Okinawan origin, striking arts", "柔道 (Judo) — Kano Jigoro 1882, Olympic sport since 1964", "剣道 (Kendo) — sword art, bamboo sword (shinai)", "合気道 (Aikido) — Ueshiba Morihei, defensive art using opponent's energy"]],
  [144, "Review B1.2 + Japanese aesthetics", ["Recap culture + arts + martial arts", "Iki, miyabi, yugen — other aesthetic concepts", "Ma 間 — space/silence as positive presence", "Japanese aesthetics — minimalism + suggestion"]],
]);

const b1_3 = toSessions([
  [145, "Ekonomi Jepang", ["3rd-4th largest economy globally (overtaken by Germany 2023)", "Manufacturing strength: auto (Toyota), electronics (Sony), robotics", "Service: 70%+ GDP", "Aging society impact — labor force decline"]],
  [146, "Aging society", ["少子高齢化 (shoushi-koureika) — low birth + high aging", "Population peaked 2008 (~128M), declining since", "By 2060 projected ~88M", "Workforce shortage — immigration debate, automation push"]],
  [147, "Birthrate crisis", ["TFR — 1.20 in 2023 (lowest record)", "Causes: cost living, work culture, gender role rigidity", "Government incentives — limited success", "Tokyo concentration — provinces emptying"]],
  [148, "Karoshi — overwork culture", ["過労死 (karoshi) — death from overwork (recognized legally 1987)", "Black companies (ブラック企業) — exploitative employers", "Tokyo women's suicide tied to overwork high-profile cases", "Reform efforts — 'work style reform' law 2019"]],
  [149, "Sistem pendidikan", ["小学校 (shougakkou=elementary 6yr), 中学校 (chuugakkou=middle 3yr), 高校 (kouko=high 3yr)", "義務教育 (gimu kyouiku) = compulsory 9 years", "Cram schools (juku) — pressure intense", "Entrance exams (受験 jiken) — life-defining"]],
  [150, "Universitas top", ["東京大学 (Tokyo University = Todai) — most prestigious", "京都大学 (Kyoto University = Kyoudai) — research excellence", "早稲田大学 (Waseda), 慶應義塾大学 (Keio) — top private", "Imperial Universities heritage — 7 historic + Hokkaido + Tsukuba"]],
  [151, "Sistem kesehatan", ["Universal healthcare via insurance system", "Employees: company insurance; self-employed: national insurance", "30% co-pay typical, ceilings for high costs", "Longest life expectancy globally — 84 years average"]],
  [152, "Welfare state", ["年金 (nenkin=pension) — public + private layers", "介護保険 (kaigo hoken=care insurance) — for elderly", "Sustainability concerns — aging demographics", "Reform ongoing — raising retirement age, immigration"]],
  [153, "Politik — LDP dominance", ["自民党 (Jimintou=LDP) — Liberal Democratic Party", "In power 1955-1993, 1996-2009, 2012-now", "Factions internal — power dynamics complex", "Opposition: Constitutional Democratic Party (立憲民主党)"]],
  [154, "Constitutional Article 9", ["憲法第9条 — renounces war, prohibits armed forces", "JSDF (自衛隊) — Self-Defense Force only", "Recent reinterpretation — collective self-defense allowed 2014", "Constitutional revision debate — Abe legacy"]],
  [155, "EU + Japan + ASEAN", ["EU-Japan Economic Partnership Agreement 2019", "ASEAN-Japan cooperation 50+ years", "G7 founding member (Japan's only Asian seat)", "Quad alliance: US-Japan-Australia-India (anti-China)"]],
  [156, "Zainichi Korean diaspora", ["在日 — Korean residents in Japan, mostly descended from colonial migration 1910-1945", "Discrimination historic — gradual improvement", "Famous Zainichi: musicians, athletes, businesspeople", "Yakiniku culture — Zainichi heritage food"]],
  [157, "Imigrasi recent debates", ["~3M foreign residents — relatively low globally", "Major groups: Chinese, Korean, Vietnamese, Filipino, Brazilian", "Aging society — labor shortage drives policy", "Technical Intern Training Program — controversial"]],
  [158, "Otonomi regional", ["都道府県 (todoufuken) = 47 prefectures self-government", "Mayors + governors elected", "Tokyo Metropolitan Government — unique status", "Devolution gradual — Tokyo concentration challenged"]],
  [159, "Lingkungan + Kyoto Protocol", ["Kyoto Protocol 1997 — climate change milestone", "Japan as climate leader heritage", "2050 carbon neutrality goal", "Nuclear ambivalence post-Fukushima 2011"]],
  [160, "Review B1.3 + reading newspaper", ["Recap society + economy + politics", "Reading Asahi/Yomiuri editorials", "Newspaper kanji + vocab: 内閣 (cabinet), 法案 (bill), 与党 (ruling party)", "Following Japan current affairs"]],
]);

const b1_4 = toSessions([
  [161, "Murasaki Shikibu", ["紫式部 (Murasaki Shikibu) c.973-1014/1025", "源氏物語 (Genji Monogatari) — world's first novel", "Heian court life, prose-poetry mix", "Tale of Genji — 54 chapters, ~750,000 words"]],
  [162, "Sei Shonagon — Pillow Book", ["清少納言 — court lady Heian period", "枕草子 (Makura no Sōshi) — Pillow Book", "Zuihitsu genre — essay/list/observation", "Witty, sharp social commentary"]],
  [163, "Bashō — haiku master", ["松尾芭蕉 (Matsuo Bashō) 1644-1694", "Haiku 俳句 — 5-7-5 syllable structure", "奥の細道 (Oku no Hosomichi) — Narrow Road to Deep North", "Famous: 古池や (furu-ike ya) old pond, frog jumps in, sound of water"]],
  [164, "Edo literature", ["井原西鶴 (Saikaku) — ukiyo-zoshi 'floating world' tales", "近松門左衛門 (Chikamatsu Monzaemon) — kabuki + puppet plays", "Kabuki playwriting golden age", "Genre fiction explosion Edo period"]],
  [165, "Soseki — Kokoro deeper", ["こころ (Kokoro 1914) — 3-part novel, 'Sensei and I'", "Themes: isolation, ego, Meiji man dilemma", "Sensei's suicide letter — masterpiece psychological prose", "Required reading Japanese high school"]],
  [166, "Akutagawa short stories", ["羅生門 (Rashomon 1915) — Heian setting, moral ambiguity", "藪の中 (Yabu no Naka) — different perspectives on crime", "Kurosawa Akira film Rashomon (1950) — Western intro Akutagawa", "Akutagawa suicide 1927 — depression"]],
  [167, "Kawabata — Nobel 1968", ["川端康成 (Kawabata Yasunari) 1899-1972", "雪国 (Yukiguni — Snow Country), 古都 (Ancient Capital), 千羽鶴 (Thousand Cranes)", "First Japanese Nobel literature laureate", "Style: delicate, lyrical, traditional aesthetic"]],
  [168, "Mishima — controversial", ["三島由紀夫 (Mishima Yukio) 1925-1970", "金閣寺 (Temple of Golden Pavilion), 仮面の告白 (Confessions of a Mask)", "Tetralogy: Sea of Fertility", "Ritual suicide 1970 — political dramatic act"]],
  [169, "Murakami Haruki global", ["村上春樹 (Murakami Haruki) 1949-", "ノルウェイの森 (Norwegian Wood 1987), 海辺のカフカ (Kafka on Shore), 1Q84", "Global bestseller — translated 50+ languages", "Style: dreamy, jazz, American pop culture infused"]],
  [170, "Yoshimoto Banana", ["よしもとばなな (Yoshimoto Banana) 1964-", "キッチン (Kitchen 1988) — debut sensation", "TUGUMI, アムリタ", "Themes: grief, family, food, healing"]],
  [171, "Modern Japanese women", ["川上未映子 (Kawakami Mieko) — Breasts and Eggs", "村田沙耶香 (Murata Sayaka) — Convenience Store Woman", "小川糸 (Ogawa Ito), 川上弘美 (Kawakami Hiromi)", "Diverse modern voices — global translation surge"]],
  [172, "Komposisi haiku", ["5-7-5 syllable structure (Japanese mora count)", "Kigo (season word) required traditional", "Cutting word (kireji) — や, かな, けり", "Modern haiku — looser rules"]],
  [173, "Komposisi tanka", ["短歌 (tanka) — 5-7-5-7-7 (31 syllables)", "Older than haiku, classical court poetry", "Modern: Tawara Machi — Salad Anniversary", "Personal emotion + nature observation"]],
  [174, "Manga as literature", ["Recognition gradual — manga in libraries + universities", "Naoki Urasawa (Monster, 20th Century Boys) — literary thriller", "Mishima manga adaptations exist", "Manga = Japanese national literature?"]],
  [175, "Calligraphy + poetry intersection", ["Brush strokes + character + word inseparable", "Calligraphy as artistic medium for poetry", "Famous calligrapher-poets heritage", "Modern: Kohama Shinpei, Inoue Yuichi"]],
  [176, "Review B1.4 + your haiku", ["Recap literature classical + modern", "Compose your own 5-7-5 haiku in Japanese", "Topic: season + observation", "Workshop peer review preferred"]],
]);

const b1_5 = toSessions([
  [177, "Keigo intro — formal language", ["敬語 (keigo) — respect language, B2 mastery target", "3 types: 丁寧語 (teineigo=polite), 尊敬語 (sonkeigo=exalting), 謙譲語 (kenjougo=humbling)", "Used in business, customer service, formal occasions", "Wrong keigo = social embarrassment"]],
  [178, "Sonkeigo — exalting other", ["他人の動作を高める — elevate other person's actions", "見る → ご覧になる (goran ni naru = honorable see)", "言う → おっしゃる (ossharu = honorable say)", "Use when speaking ABOUT customer/superior to them"]],
  [179, "Kenjogo — humbling self", ["自分の動作を低める — humble own actions", "見る → 拝見する (haiken suru = humbly see)", "行く → 参る (mairu = humbly go)", "Use when speaking ABOUT own actions to customer/superior"]],
  [180, "Bisnis email Japanese", ["お疲れ様です (otsukaresama desu) — universal email opener", "標題の件 (hyoudai no ken=regarding the title) — formal", "ご確認のほどよろしくお願いいたします (please kindly confirm)", "Closing: よろしくお願いいたします (=thank you in advance)"]],
  [181, "Resume — rirekisho", ["履歴書 (rirekisho) — handwritten traditionally!", "Photo required (3x4 cm), formal smile", "Education + work chronological", "Modern: digital acceptance growing, handwritten still many places"]],
  [182, "Wawancara kerja", ["面接 (mensetsu) — formal interview", "Bow at entrance, sit when invited", "Self-introduction (自己紹介 jiko shoukai) memorized", "Express deep respect + enthusiasm + commitment"]],
  [183, "Reuni bisnis — kaigi", ["会議 (kaigi) — meeting structure formal", "Seating by hierarchy (kamiza/shimoza)", "Senior speaks first, others wait", "Decisions pre-discussed (nemawashi) — meeting confirms consensus"]],
  [184, "Negosiasi Japanese", ["Relationship-first, long-term focus", "Direct refusal — taboo, use indirect ('chotto muzukashii desu')", "Patience essential — fast = pressure rude", "Wining/dining — informal trust-building"]],
  [185, "Presentasi", ["スライド (suraido=slides), 図表 (zuhyou=charts/graphs)", "Structure: introduction, sections, conclusion", "Questions: dōzo o-yobikake kudasai (please call out)", "Visual heavy + scripted — less impromptu than Western"]],
  [186, "Marketing Japanese", ["広告 (koukoku=ad), 宣伝 (senden=publicity), ブランド (burando=brand)", "ターゲット (taagetto=target), マーケットリサーチ (market research)", "Japanese ad style — emotional + narrative over facts", "Famous: Kanebo, Shiseido — cosmetic ads cinematic"]],
  [187, "Banking + finance", ["銀行 (ginkou=bank), 口座 (kouza=account), 振込 (furikomi=transfer)", "Banks: Mizuho, MUFG (Mitsubishi UFJ), SMBC — megabanks", "Postal Bank (Yucho) — historic state-affiliated", "Convenience stores ATMs — 24/7 universal"]],
  [188, "Real estate", ["賃貸 (chintai=rent) vs 持ち家 (mochiie=owned)", "敷金 (shikikin=deposit), 礼金 (reikin=key money), 保証人 (guarantor)", "Apartment sizes: 1K, 1LDK, 2LDK — Western-style notation", "Tokyo rent — Shibuya 1K ~¥150k/month"]],
  [189, "Pajak basics", ["所得税 (shotokuzei=income tax), 住民税 (juuminzei=residence tax)", "消費税 (shouhizei=consumption tax) — 10% standard since 2019", "Tax return: 確定申告 (kakutei shinkoku) — Feb 16-Mar 15 annually", "Most employees — automatic withholding"]],
  [190, "Hukum basic", ["民法 (minpou=civil), 刑法 (keihou=criminal), 商法 (shouhou=commercial)", "裁判 (saiban=trial), 弁護士 (bengoshi=lawyer)", "Lay judge system (saiban-in) — since 2009", "Lawyer scarcity Japan — bar exam ~25% pass rate"]],
  [191, "Remote work Japan", ["テレワーク (telework) — exploded during COVID", "在宅勤務 (zaitaku kinmu=at-home work) — official term", "Hanko (印鑑) seal culture — friction for remote", "Recent: hybrid models, digital signature laws relaxed"]],
  [192, "Review B1.5 + business sim", ["Recap business Japanese", "Simulate 20-min job interview", "Self-introduction + experience + commitment", "Feedback register + keigo + cultural cues"]],
]);

// ============================================================================
// B2 — Upper Intermediate (7 sublevels × 16 = 112 sesi)
// ============================================================================

const b2_1 = toSessions([
  [193, "Keigo full mastery", ["3 systems integration: teineigo + sonkeigo + kenjogo", "Speech levels switch by context — same person different levels different times", "Self/in-group humble, other/out-group elevated", "Asymmetry consistent — keigo cultural mirror"]],
  [194, "Sonkeigo irregulars", ["いらっしゃる (irassharu) = いる/行く/来る honorific", "おっしゃる (ossharu) = 言う honorific", "なさる (nasaru) = する honorific", "召し上がる (meshiagaru) = 食べる/飲む honorific"]],
  [195, "Kenjogo irregulars", ["参る (mairu) = 行く/来る humble", "申し上げる (moushiageru) = 言う humble", "いたす (itasu) = する humble", "いただく (itadaku) = もらう/食べる humble"]],
  [196, "Bikago — beautiful language", ["美化語 (bikago) — o/go prefix beautifies", "お茶, お酒, お時間, ご飯 (rice), ご家族", "Customer service ubiquitous", "Over-use marks Tokyo refined speech"]],
  [197, "Indirect expression", ["察し (sasshi) culture — read between lines expected", "ちょっと... (chotto... = a little...) — negative softening", "考えておきます (kangaete okimasu = will think about) often = 'no'", "Vague responses preserve harmony (wa 和)"]],
  [198, "Rhetorical devices", ["枕詞 (makurakotoba) — pillow words, fixed epithets", "縁語 (engo) — related words for resonance", "掛詞 (kakekotoba) — pivot words/puns", "Classical heritage modern essay/speech retains"]],
  [199, "Academic register", ["論文 (ronbun=paper), 文献 (bunken=literature)", "Passive impersonal: と考えられる (it is thought)", "Latinate equivalents: アプリオリ (a priori), ダイアレクティック", "Japanese academic — formal indirect"]],
  [200, "Argumentative writing", ["序論+本論+結論 (introduction+body+conclusion)", "Logical connectors: しかしながら, したがって, ゆえに", "Cite sources: 〜によると (according to)", "Japanese exam writing — structure obvious"]],
  [201, "Stylistic devices", ["比喩 (hiyu=metaphor), 擬人法 (gijinhou=personification)", "対句 (taiku=parallelism), 倒置 (touchi=inversion)", "Repetition for emphasis cultural", "Japanese poetics rich heritage"]],
  [202, "Onomatopoeia mastery", ["擬声語 (giseigo) — actual sounds (animals, things)", "擬態語 (gitaigo) — manner/state mimicry (UNIQUE Japanese feature)", "Examples: ピカピカ (pika pika=sparkling), キラキラ (kira kira=glittering), どきどき (doki doki=heart pounding)", "Manga + everyday use rich"]],
  [203, "Dialek Kansai-ben", ["関西弁 — Osaka/Kyoto/Kobe area dialect", "Copula: や instead of だ (元気や!)", "ええ instead of いい, あかん instead of だめ", "Comedy heritage — manzai Osaka-rooted"]],
  [204, "Tohoku-ben + Kyushu-ben", ["Tohoku — slow, gentle, 'zuuzuu-ben'", "Kyushu — direct, masculine, distinct intonation", "Hakata-ben (Fukuoka) — friendly", "Endangered preservation efforts"]],
  [205, "Okinawan distinct language", ["うちなーぐち (Uchinaaguchi) — separately classified language", "Ryukyu Kingdom heritage (until 1879)", "UNESCO endangered language", "Different phonology + grammar from mainland"]],
  [206, "Hokkaido + new dialects", ["Hokkaido — settlers from mainland late 19th century, mixed dialect", "Recent: zenseidai (young generation) standard", "Tokyo standard dominance via media", "Regional pride preservation movements"]],
  [207, "Slang + youth language", ["ヤバい (yabai) — originally 'dangerous', now 'awesome/terrible' (context)", "マジ (maji) = seriously", "草 (kusa=lol, from www looking like grass)", "TikTok/Twitter generation rapid neologisms"]],
  [208, "Review B2.1 + argumentative essay", ["Recap keigo + style + dialects", "Write 600-word argumentative essay current topic", "Structure: jo+hon+ketsu", "Apply rhetorical devices"]],
]);

const b2_2 = toSessions([
  [209, "Japanese for tourism", ["観光 (kankou=tourism), 観光地 (tourist site), ガイドブック", "Inbound tourism — pre-pandemic peak 30M+ visitors", "ホテル + 旅館 + 民宿 + ゲストハウス options", "Tourist info — 観光案内所 (kankou annaisho) everywhere"]],
  [210, "Japanese for fashion", ["着物 (kimono) — traditional dress, formal occasions", "浴衣 (yukata=summer kimono), 帯 (obi=belt)", "Modern: Uniqlo (fast fashion global), Issey Miyake, Yohji Yamamoto", "Tokyo Fashion Week — March + October"]],
  [211, "Japanese for food industry", ["板前 (itamae=sushi chef), 料理人 (ryourinin=chef)", "和食 (washoku) — UNESCO Intangible Heritage 2013", "ミシュラン (Michelin) — Tokyo most starred city globally", "三つ星 (mitsuboshi=3 stars) — culinary peak"]],
  [212, "Japanese for design", ["デザイン界 — Issey Miyake (fashion), Tadao Ando (architecture)", "MUJI — minimalism + functionality global", "Toyo Ito, Kengo Kuma — Pritzker Prize architects", "Industrial design heritage — Sony Walkman aesthetic"]],
  [213, "Japanese for diplomacy", ["外務省 (Gaimushou) = MOFA", "大使館 (taishikan=embassy), 領事館 (ryouji-kan=consulate)", "Diplomatic tradition: multilateral + ASEAN-focused", "G7 + UN member, no Security Council permanent seat"]],
  [214, "Japanese for journalism", ["新聞 (shinbun=newspaper), 雑誌 (zasshi=magazine), 放送 (housou=broadcast)", "Kisha club system — exclusive press club access", "5 major papers + NHK (public broadcaster)", "Manga journalism — informative + entertaining"]],
  [215, "Japanese for academia", ["大学 (daigaku=university), 大学院 (daigakuin=grad school)", "Bachelor (学士), Master (修士), Doctorate (博士)", "Sensei (先生) — respected title for teacher/doctor/lawyer", "Honorific keigo essential academia"]],
  [216, "Japanese for law", ["民法 (civil), 刑法 (criminal), 商法 (commercial)", "Bengoshi (弁護士) — lawyer, exam ~25% pass rate", "Tribunal: shimin saiban (jury system from 2009)", "Heavy Confucian + Continental European influence"]],
  [217, "Japanese for medicine", ["診療 (shinryou=examination), 診断 (shindan=diagnosis), 治療 (chiryou=treatment)", "Specialties: 内科 (naika=internal), 外科 (geka=surgery), 小児科 (paediatric)", "Universal healthcare via insurance", "Famous: Nagasaki Medical School heritage"]],
  [218, "Japanese for engineering", ["技術 (gijutsu=technology), 工学 (kougaku=engineering)", "Strengths: robotics, automotive, electronics, precision manufacturing", "Famous makers: Honda, Toyota, Mitsubishi", "Kaizen philosophy applied universally"]],
  [219, "Japanese for IT", ["プログラマー (puroguramaa), 開発者 (kaihatsusha=developer)", "コード, フレームワーク, データベース", "Japanese tech companies: NTT, SoftBank, Rakuten", "Mercari, LINE, Smart News — modern startups"]],
  [220, "Japanese for finance", ["金融 (kinyuu=finance), 株式 (kabushiki=stocks)", "東証 (Toushou=Tokyo Stock Exchange), 日経平均 (Nikkei 225)", "BOJ — Bank of Japan, 0% interest rate decades", "Yen carry trade — global financial phenomenon"]],
  [221, "Japanese for art", ["美術 (bijutsu=fine art), 工芸 (kougei=craft)", "Museums: Tokyo National, Nezu, Mori Art, teamLab", "Ukiyo-e (woodblock prints) — Hokusai, Hiroshige world famous", "Modern: Murakami Takashi (Superflat), Kusama Yayoi"]],
  [222, "Japanese for translation", ["翻訳 (honyaku=translation), 通訳 (tsuuyaku=interpretation)", "Japanese-English translation — high demand", "Literary translation tradition strong", "Manga + anime localization industry massive"]],
  [223, "Japanese for teaching JLT", ["日本語教師 (Nihongo kyoushi) — Japanese teacher abroad", "JLPT preparation — main market", "JET Programme — government Japanese teaching scheme", "Cool Japan initiative — soft power export"]],
  [224, "Review B2.2 + portfolio", ["Recap industry verticals", "Build professional portfolio sector chosen", "Glossary 50+ specialized terms", "Case study real Japan business"]],
]);

const b2_3 = toSessions([
  [225, "Tone modulation", ["Plain → polite → keigo — 3-tier minimum", "Within keigo — sonkeigo vs kenjogo selection", "Gender-marked speech still exists (boku/atashi)", "Reading audience reading critical"]],
  [226, "Honne vs tatemae", ["本音 (honne) = true feeling, inner self", "建前 (tatemae) = public face, expected façade", "Cultural FUNDAMENT — both legitimate, not hypocrisy", "Reading honne requires cultural fluency depth"]],
  [227, "Small talk Japanese", ["Weather perfect topic always", "Health/wellness moderate", "Avoid personal probing", "Comments about food, scenery, work safe"]],
  [228, "Tabu kultur", ["Money direct — avoid asking salary", "Age/weight — generally avoid", "Religion — handle with care", "Politics — avoid generally"]],
  [229, "Sensitivitas agama", ["Shinto + Buddhist syncretism (~85% Japanese)", "New religions (Soka Gakkai etc) — handle carefully", "Christianity ~1% — minority", "Cult issues (Aum Shinrikyo legacy) — sensitive"]],
  [230, "Humor decoded", ["Manzai — boke (fool) + tsukkomi (straight man) duo", "Word play (dajare) — beloved", "Self-deprecating + situational", "Sarcasm subtle — high context dependent"]],
  [231, "Politik conversation", ["Avoid in workplace/with strangers", "Among friends — careful", "Japanese politics — less polarized than West", "Older generations more political, younger apolitical"]],
  [232, "Dinamika keluarga", ["Filial piety inheritance Confucian", "Mother — center of household", "Father — provider role traditional", "Hierarchical age-respect")]],
  [233, "Friendship Japanese", ["友達 (tomodachi) vs 親友 (shinyuu=close friend)", "Slow to deepen but lasting", "Drinking culture builds bonds (nomikai)", "Formality between friends — uniquely Japanese"]],
  [234, "Romance language", ["愛してる (aishiteru=I love you) — POWERFUL, rarely said!", "好き (suki) = like/love (broader use)", "大好き (daisuki) = really love", "Confessions (kokuhaku 告白) — relationship-initiating ritual"]],
  [235, "Resolusi konflik", ["Indirect — avoid direct confrontation", "Apology even if not at fault — frequent", "Mediator (chukaisha) role", "Surface harmony (wa) preserved"]],
  [236, "Reading newspaper fluent", ["Daily news habit valuable", "Asahi vs Yomiuri vs Mainichi — political angles", "Online: Nikkei + Japan Times English supplement", "Kanji density high — vocabulary expanding"]],
  [237, "Watch TV without subs", ["NHK (public), TBS, Fuji, NTV, TV Asahi", "Bangumi: dramas + variety + news", "Anime — natural language exposure", "Streaming: Netflix Japan + Hulu Japan"]],
  [238, "Anime as language learning", ["Slice-of-life (Nichijou, Shirokuma Cafe) — natural speech", "Avoid samurai/fantasy initially (anachronistic speech)", "Subtitles → no subtitles gradual", "Pause/replay for shadowing practice"]],
  [239, "Podcasts Jepang", ["NHK Radio app — news + variety", "Bilingual News — current affairs", "Japanese with Noriko — learner-friendly", "Speed 0.75-0.85x initially recommended"]],
  [240, "Review B2.3 + real conversation", ["Recap pragmatics + cultural", "Simulate 30-min conversation native", "Topics free: politics, food, art, work", "Self-assessment honne vs tatemae reading"]],
]);

const b2_4 = toSessions([
  [241, "Academic register advanced", ["論理的 (logical), 客観的 (objective), 主観的 (subjective)", "Citations: 〜と述べている (it is stated that)", "Conditional academic: ならば, とすれば, 〜限り", "Latinate-equivalent loanwords: パラダイム, アプリオリ"]],
  [242, "Paper structure", ["要旨 (youshi=abstract), 序論 (introduction), 本論 (body), 結論 (conclusion)", "参考文献 (sankou bunken=references), 注 (chuu=footnotes)", "Japanese academic — discursive less data-heavy than Anglo-American", "APA-like + native styles"]],
  [243, "Citing sources", ["著者名 (chosha-mei) + year + page", "脚注 (kyakuchuu=footnote) common", "出典 (shutten=source)", "Plagiarism (剽窃 hyousetsu) — increasingly enforced"]],
  [244, "Academic conferences", ["学会 (gakkai=academic society)", "発表 (happyou=presentation), 質疑応答 (Q&A)", "Major societies: 日本学術会議 (Science Council of Japan)", "International conference culture growing"]],
  [245, "Thesis writing", ["卒業論文 (sotsugyou ronbun) — graduation thesis (bachelor)", "修士論文 (shuushi ronbun) — master's thesis", "博士論文 (hakushi ronbun) — doctoral dissertation", "Public defense (口頭試問 koutou shimon) — formal"]],
  [246, "Universities deep", ["Imperial Universities heritage: Todai (Tokyo), Kyodai (Kyoto), Tohoku, Nagoya, Osaka, Kyushu, Hokkaido", "Research universities: AIST, RIKEN — government labs", "Private elites: Waseda, Keio, Sophia, Doshisha, Ritsumeikan", "International branches expansion recent"]],
  [247, "Intellectuals Jepang", ["丸山眞男 (Maruyama Masao) — political theorist", "梅棹忠夫 (Umesao Tadao) — anthropologist, civilization theory", "中根千枝 (Nakane Chie) — vertical society", "Modern: 上野千鶴子 (Ueno Chizuko) feminism, 内田樹 (Uchida Tatsuru)"]],
  [248, "Philosophy — Nishida + Watsuji", ["西田幾多郎 (Nishida Kitarō) — Kyoto School founder", "Nothingness (絶対無 zettai mu) — Eastern-Western philosophy bridge", "和辻哲郎 (Watsuji Tetsurō) — ethics + climate theory (Fudoron)", "Modern: Asakura Tomomi, Akira Sakuma"]],
  [249, "Sociology Jepang", ["集団主義 vs 個人主義 (group vs individual)", "Vertical society (Nakane) — hierarchy primacy", "Ie 家 institution — family/household", "Modern: precarity, hikikomori, otaku phenomena"]],
  [250, "Historiography", ["Marxist heritage strong postwar (Tōyama Shigeki)", "Tokyo School vs Kyoto School", "Modern: Andrew Gordon, John Dower — Western Japanologists impact", "Microhistory + global history trends"]],
  [251, "Linguistics", ["Imperial Tokyo school", "Japanese linguistics heritage: Yamada Yoshio, Tokieda Motoki", "Sociolinguistics — keigo + politeness theory", "Cognitive linguistics — Ikegami Yoshihiko"]],
  [252, "Text analysis", ["国語 (kokugo=Japanese language) — secondary school analysis tradition", "現代文 (gendaibun) — modern prose", "古典 (koten) — classical", "Maturity exam (kokugo) — analysis core"]],
  [253, "Reviews + criticism", ["書評 (shohyou=book review), 映画評 (eiga-hyou=film review)", "Critic tradition: Kobayashi Hideo, Karatani Kojin", "Modern: Higashiyama Akira, Shono Yoriko critics", "Book Brigade groups in newspapers"]],
  [254, "Academic debate", ["論争 (ronsou=debate)", "Polite disagreement structures", "Citing authorities essential", "Japanese academic — less confrontational than Western"]],
  [255, "Defending thesis", ["口頭試問 (koutou shimon) — oral exam", "Committee: advisor + 2-3 external/internal", "Formal but not adversarial", "Japanese viva — earnest, respectful"]],
  [256, "Review B2.4 + paper", ["Recap academic mastery", "Write 2000-word paper + bibliography", "Topic: Japanese culture aspect", "Peer review feedback"]],
]);

const b2_5 = toSessions([
  [257, "Diplomatic register", ["御閣下 (gokakka=Your Excellency)", "Communique, declaration, protocol — formal vocabulary", "Verbalization formal — heavy keigo", "Japanese diplomatic tradition — indirection prized"]],
  [258, "Diplomatic history", ["明治維新 — opened to West 1853 (Perry Black Ships)", "Anglo-Japanese Alliance 1902-1923", "League of Nations exit 1933", "Postwar: US alliance pillar"]],
  [259, "UN role", ["UN member since 1956", "Major financial contributor (long #2 after US)", "Permanent SC seat aspiration — unrealized", "UN University Tokyo headquartered"]],
  [260, "Foreign policy", ["3 pillars: US alliance, multilateralism, ASEAN focus", "Yoshida Doctrine — economic over military focus heritage", "Recent: Kishida-Biden then Ishiba-Trump alignment", "China-Japan complicated — territory + history"]],
  [261, "ASEAN + Japan", ["50+ years cooperation", "Major investor + aid donor", "Trade partnerships extensive", "Cool Japan soft power Asia-wide"]],
  [262, "NGOs Japanese", ["NPO法 (NPO law) 1998 — formalized sector", "Peace Boat — Hibakusha awareness global", "JICA — Japan International Cooperation Agency", "Disaster relief expertise (3.11 heritage)"]],
  [263, "Leadership culture", ["集団的合議制 (consensus-based group decision)", "Top-down formal but consultative practice", "Mentorship + senpai-kohai vertical", "Modern: change-resistant historically"]],
  [264, "Management style", ["改善 (kaizen) — continuous improvement bottom-up", "ホウ・レン・ソウ (hou-ren-sou: report-contact-consult) — 3-pillar protocol", "Lifetime employment heritage declining", "Toyota Production System global benchmark"]],
  [265, "Public speaking", ["Formal speech tradition", "Structure: opening (枕 makura) + body + closing", "Bow at start + end", "Less impromptu emotion than Western"]],
  [266, "Rhetoric tradition", ["和歌 (waka) — classical poetry rhetoric", "中国古典の影響 — Chinese classical influence", "西洋修辞学 (Western rhetoric) — modern integration", "Japanese rhetorical heritage — indirection + suggestion"]],
  [267, "Famous speeches", ["Meiji Emperor 1868 — Charter Oath", "Yoshida Shigeru postwar speeches", "Akihito retirement abdication 2019 — emotional", "Modern: PM speeches conservative tradition"]],
  [268, "Modern speeches", ["Abe Shinzo — assassinated 2022, divisive figure", "Koizumi Junichiro — populist communicator", "Ishiba (current PM) — earnest, geek policy nerd", "Press conferences ritualistic"]],
  [269, "Press conferences", ["記者会見 (kisha kaiken)", "Question slips submitted in advance often", "Off-record vs on-record distinction", "Limited live spontaneity"]],
  [270, "Political debates", ["国会答弁 (kokkai touben=Diet debate) — answer-respond format", "TV debate election season", "Less adversarial than Western", "Media coverage extensive"]],
  [271, "International etiquette", ["Bow + handshake (Western style with internationals)", "Meishi exchange essential", "Gift-giving culture — wrapping matters", "Punctuality absolute"]],
  [272, "Review B2.5 + speech", ["Recap leadership + diplomacy", "Prepare 5-min public speech", "Topic choice + formal tone", "Delivery + Q&A simulated"]],
]);

const b2_6 = toSessions([
  [273, "Genji Monogatari deep", ["Murasaki Shikibu c.1008 — world's first novel", "54 chapters, ~750k words", "Hikaru Genji 'shining prince' — Heian court intrigue", "Translations: Waley, Seidensticker, Tyler, Washburn — different styles"]],
  [274, "Heian period literature", ["Court ladies wrote in vernacular Japanese (men wrote Chinese)", "Sei Shōnagon — Pillow Book", "Lady Sarashina — As I Crossed the Bridge of Dreams", "Tales of Ise — poetry-prose miscellany"]],
  [275, "Edo period literature", ["浮世草子 (ukiyo-zōshi) — floating world tales", "Saikaku — Life of an Amorous Man, Tales of Townsmen Honor", "Chikamatsu — kabuki + bunraku puppet plays", "Bashō — Narrow Road to Deep North"]],
  [276, "Meiji modernism", ["Soseki, Mori Ōgai — Meiji modernity in fiction", "Higuchi Ichiyō — early woman novelist", "Naturalism school — Shimazaki Tōson Hakai", "Translation flood — Russian + French + English"]],
  [277, "Showa literature", ["Akutagawa, Tanizaki Junichirō — In Praise of Shadows essay", "Kawabata + Mishima + Ōe Kenzaburō (Nobel 1994)", "Postwar trauma + reconstruction themes", "Dazai Osamu — No Longer Human (1948)"]],
  [278, "Postwar literature", ["Abe Kōbō — Woman in the Dunes", "Inoue Yasushi — historical fiction", "Endō Shūsaku — Silence (Christianity persecution)", "Kojima Nobuo, Tsuji Kunio"]],
  [279, "Modern women writers", ["Yoshimoto Banana — Kitchen pioneer 1988", "Ogawa Yōko — Housekeeper and the Professor", "Kawakami Hiromi, Kawakami Mieko", "Murata Sayaka — Convenience Store Woman, Earthlings"]],
  [280, "Murakami phenomenon", ["Most translated Japanese author globally", "Norwegian Wood breakthrough 1987", "1Q84, Kafka, Wind-Up Bird, Killing Commendatore", "Style: jazz + American pop + magical realism + isolation"]],
  [281, "Children's literature", ["Miyazawa Kenji — Night on Galactic Railroad", "Anno Mitsumasa — picture books", "Modern: Higuchi Yūko, Shinkai picture book adaptations", "Kids manga — entry point literacy"]],
  [282, "Manga deep — Urasawa + CLAMP", ["Urasawa Naoki — Monster, 20th Century Boys, Pluto — literary thriller manga", "CLAMP — 4-woman collective: Card Captor Sakura, xxxHolic", "Tezuka legacy + diversification", "Manga as serious literature recognition growing"]],
  [283, "Songwriting analysis", ["Yumi Matsutoya — lyrical complexity", "Hikaru Utada — bilingual + emotional depth", "Vocaloid culture (Hatsune Miku) — youth language", "Anime songs literary often"]],
  [284, "Modern theater", ["Suzuki Tadashi — physical theater training method", "Noda Hideki — playwright + director", "Hirata Oriza — quiet theater", "Modern + classical (kabuki, noh) coexistence"]],
  [285, "Film analysis", ["Kurosawa Akira — Seven Samurai, Rashomon, Ran", "Ozu Yasujirō — Tokyo Story, family dramas", "Mizoguchi Kenji, Naruse Mikio — postwar masters", "Modern: Koreeda Hirokazu (Shoplifters), Hamaguchi Ryusuke (Drive My Car)"]],
  [286, "Onomatopoeia in literature", ["Manga + literature both use heavily", "Conveys subtle emotion + atmosphere", "Translation challenge famous", "ニコニコ (smiling), しんしん (silently snowing), ぽつぽつ (one by one)"]],
  [287, "Translation challenges", ["Honne/tatemae untranslatable", "Wabi-sabi, mono no aware — concepts not just words", "Murakami translations Birnbaum vs Rubin vs Gabriel — style debates", "Manga localization: cultural notes vs adaptation"]],
  [288, "Review B2.6 + literary analysis", ["Recap Japanese literature tradition", "Write 2000-word analysis chosen work", "Context + structure + themes + style", "Japanese literary scholarship demonstration"]],
]);

const b2_7 = toSessions([
  [289, "JLPT structure", ["JLPT — Japanese Language Proficiency Test", "5 levels: N5 (easiest), N4, N3, N2, N1 (hardest)", "Linguo B2 target: N2 (intermediate-advanced)", "Sections: vocabulary + grammar + reading + listening (NO speaking/writing)"]],
  [290, "JLPT N5/N4 review", ["N5: ~100 kanji, ~800 vocab — A1-A2 equivalent", "N4: ~300 kanji, ~1500 vocab — A2-B1 equivalent", "Hiragana/katakana mastery foundational", "Basic grammar + everyday conversation"]],
  [291, "JLPT N3 strategies", ["N3: ~650 kanji, ~3700 vocab — B1 equivalent", "Bridge level — intermediate complexity", "Reading + listening — longer passages", "Grammar — keigo intro, complex sentences"]],
  [292, "JLPT N2 target", ["N2: ~1000 kanji, ~6000 vocab — B2 equivalent", "Reading: editorials + critiques + newspaper articles", "Listening: native speed conversations", "Grammar: nuance + advanced patterns"]],
  [293, "Vocabulary section", ["文字 (moji=characters) — reading hiragana given kanji", "語彙 (goi=vocabulary) — context-appropriate word selection", "Memorize via SRS (Anki) — flashcards", "Read native materials extensively"]],
  [294, "Grammar section", ["Grammar points patterns + meanings", "Common N2 patterns: ~ものか, ~まい, ~ばかりに", "Practice with mock tests official", "Try Shin-Kanzen-Master + Sou-Matome series"]],
  [295, "Reading comprehension", ["短文 (tanbun=short passages) — quick", "中文 + 長文 (medium + long passages)", "Strategies: skim first, locate, infer", "Time management critical N2 — 105 min for vocab+grammar+reading"]],
  [296, "Listening comprehension", ["Section: dialogue + monologue + situation responses", "Native speed unavoidable", "Note-taking selective", "Anime/drama listening practice"]],
  [297, "JLPT practice 1", ["Full mock vocabulary + grammar section", "Time: 50 min strict", "Identify weak grammar points", "Review study materials"]],
  [298, "JLPT practice 2", ["Full mock reading section", "Time: 75 min", "Read fast, infer carefully", "Time management"]],
  [299, "JLPT practice 3", ["Full mock listening section", "Time: 50 min", "Audio attention discipline", "Auto-correct preview during listening"]],
  [300, "JLPT practice 4", ["Combined sections — mini full test", "Identify cumulative weaknesses", "Targeted review by section", "Mental endurance training"]],
  [301, "Full mock N2", ["3+ hours full simulation", "Real exam conditions", "Final calibration", "Confidence + endurance check"]],
  [302, "Scoring + analysis", ["Scaled scoring system — section minimums required", "180-point total scale", "Identify gaps + final review priorities", "When to retake — biannual exam"]],
  [303, "Test day strategies", ["JLPT held July + December annually", "Bring: HB pencil, eraser, watch (no smart!), ID", "Sleep + nutrition prep", "Calm + focus management"]],
  [304, "Review final + sayonara", ["Recap 304 sessions complete", "Japanese language journey reflection", "Next steps: N1, immersion Japan, professional", "さようなら! Ganbatte for JLPT!"]],
]);

// ============================================================================
// Curriculum Assembly
// ============================================================================

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("japanese")!,
  overview:
    "Program 304 sesi yang mengantar lo dari nol sampai percakapan near-native dalam Bahasa Jepang (日本語 Nihongo). Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Mulai dari sistem tulis 3 layer: hiragana (46 huruf, mastered A1.1), katakana (loanwords, A1.2), kanji gradual intro A1.3 → ~1000 kanji by B2 (JLPT N2 target). Grammar SOV unik dengan particles wa/ga/wo/ni/de/to/mo, copula desu/da, verb conjugation 5-stem system, te-form swiss army knife, politeness layers (plain → polite → keigo dengan sonkeigo+kenjogo+bikago at B2). Imersi kultur Jepang: Genji Monogatari Murasaki Shikibu (novel pertama dunia), Bashō haiku, Sōseki Kokoro, Akutagawa Rashomon, Kawabata Nobel 1968, Mishima, Murakami Haruki global phenomenon, Yoshimoto Banana, women writers modern (Kawakami Mieko, Murata Sayaka), Studio Ghibli Miyazaki → Shinkai Makoto, manga heritage Tezuka → Urasawa, J-pop heritage Yuming → YOASOBI, kabuki + noh + sumo + baseball, wabi-sabi + ikigai + omotenashi philosophy, tea ceremony + ikebana + shodo + 4 martial arts, Edo → Meiji Restoration 1868 → WWII → postwar miracle → Heisei → Reiwa, 47 prefektur, regional dialects (Kansai-ben, Tohoku-ben, Okinawan). Test prep B2.7: JLPT N2 (intermediate-advanced, ~6000 vocab + ~1000 kanji), diakui untuk study + work + visa Jepang.",
  levels: [
    {
      code: "A1",
      name: "Elementary Foundation",
      description:
        "Fondasi Elementer. Mulai dari hiragana mastery (46 huruf, dasar tulis Jepang), katakana (loanwords + emphasis), kanji intro (numbers + basic), present tense verbs ます-form (-masu/-masen/-mashita/-masen deshita), copula です/だ, particles wa/ga/wo/ni/de/to/mo essential, kosoado deixis system (kore/sore/are), counter words intro. Cultural: 4 pulau Jepang, omotenashi philosophy, Studio Ghibli intro. Akhir A1: introduce diri sendiri, order di restoran, navigate routine harian, kuasai ~800 kata + 50 kanji.",
      sublevels: [
        { code: "A1.1", name: "First Steps", sessions: a1_1, preview: true },
        { code: "A1.2", name: "Daily Life", sessions: a1_2, preview: true },
        { code: "A1.3", name: "Social Basics", sessions: a1_3, preview: true },
      ],
    },
    {
      code: "A2",
      name: "Pre-Intermediate",
      description:
        "Pre-Intermediate. Te-form swiss army knife mastery (requests/continuous/permission/prohibition/connecting). Dictionary form (plain) intro, intentions (tsumori), probably (deshou), try (te miru), conditional (tara/ba). Adjektif i-form vs na-form distinction. Comparisons + superlatives (no hou ga, ichiban). Honorific intro (san/sama/kun/chan). Cultural: tea ceremony, kaisha culture, Toyota/Sony/Nintendo, Edo→Meiji→postwar history, 47 prefektur. Vocab grow ~2000 kata + ~200 kanji.",
      sublevels: [
        { code: "A2.1", name: "Beyond Basics", sessions: a2_1, preview: true },
        { code: "A2.2", name: "Travel & Work", sessions: a2_2, preview: true },
        { code: "A2.3", name: "Self-Expression", sessions: a2_3, preview: true },
        { code: "A2.4", name: "Cultural Foundations", sessions: a2_4, preview: true },
      ],
    },
    {
      code: "B1",
      name: "Intermediate",
      description:
        "Intermediate. Plain form mastery, tense aspects (habitual/resultative/perfect), passive + causative + causative-passive forms, conditional ば vs たら, past hypothetical. Deep dive literatura: Murasaki Shikibu Genji Monogatari, Bashō haiku, Sōseki Kokoro, Akutagawa Rashomon, Kawabata Nobel, Murakami global, Yoshimoto Banana, modern women writers. Cinema: Miyazaki + Shinkai + Kurosawa. Anime+manga history Tezuka → Urasawa. Society + politics: aging society + birthrate crisis, karoshi, LDP dominance, Article 9 pacifism. Professional Japanese: keigo intro (sonkeigo + kenjogo), business email, kaigi structure. Vocab ~3500 + ~500 kanji.",
      sublevels: [
        { code: "B1.1", name: "Fluency Foundations", sessions: b1_1, preview: true },
        { code: "B1.2", name: "Cultural Fluency", sessions: b1_2, preview: true },
        { code: "B1.3", name: "Complex Topics", sessions: b1_3, preview: true },
        { code: "B1.4", name: "Creative Expression", sessions: b1_4, preview: true },
        { code: "B1.5", name: "Professional Bridge", sessions: b1_5, preview: true },
      ],
    },
    {
      code: "B2",
      name: "Upper Intermediate",
      description:
        "Upper Intermediate. Near-native expression: keigo full mastery (sonkeigo + kenjogo + bikago irregulars), honne vs tatemae cultural decode, onomatopoeia masterful (giseigo + gitaigo Japanese signature). Academic Japanese: ronbun structure, intellectuals (Maruyama, Nakane, Ueno), Nishida philosophy + Watsuji ethics. Professional industry-specific: tourism, fashion (Issey Miyake), food (washoku UNESCO), design (Tadao Ando + MUJI), diplomatic (Gaimushou), journalism kisha clubs, IT (Mercari + LINE + Rakuten). Literary mastery: Genji deep, Heian → Edo → Meiji → Showa → postwar → modern women writers, Murakami phenomenon, Urasawa + CLAMP manga literary. Regional dialects (Kansai-ben, Tohoku-ben, Okinawan distinct). Persiapan JLPT N2: ~6000 vocab + ~1000 kanji, reading editorials + critiques, native-speed listening, complex grammar patterns. Vocab 5000+ + ~1000 kanji.",
      sublevels: [
        { code: "B2.1", name: "Advanced Expression", sessions: b2_1, preview: true },
        { code: "B2.2", name: "Professional Japanese", sessions: b2_2, preview: true },
        { code: "B2.3", name: "Near-Native Communication", sessions: b2_3, preview: true },
        { code: "B2.4", name: "Academic Mastery", sessions: b2_4, preview: true },
        { code: "B2.5", name: "Leadership & Diplomacy", sessions: b2_5, preview: true },
        { code: "B2.6", name: "Creative & Literary", sessions: b2_6, preview: true },
        { code: "B2.7", name: "Test Prep (JLPT N2)", sessions: b2_7, preview: true },
      ],
    },
  ],
};

export default curriculum;
