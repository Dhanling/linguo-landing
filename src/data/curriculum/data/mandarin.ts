import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

// ============================================================================
// A1 — Elementary Foundation (3 sublevels × 16 = 48 sesi)
// Pedagogy: Pinyin + tones mastery FIRST → Hanzi gradual (frequency-based)
// ============================================================================

const a1_1 = toSessions([
  [1, "Pinyin system overview", ["Pinyin = sistem romanisasi Mandarin (resmi 1958)", "21 initial konsonan + 6 vokal dasar + tones", "Tujuan: read Mandarin pakai alfabet Latin sebelum Hanzi", "Hanzi pengenalan dari sesi 6 — fokus Pinyin + tones dulu"]],
  [2, "4 tones + neutral — drill", ["1st tone (¯): mā 妈 (mother) — flat high", "2nd tone (´): má 麻 (hemp) — rising", "3rd tone (ˇ): mǎ 马 (horse) — dipping", "4th tone (`): mà 骂 (scold) — falling | Neutral: ma 吗 (question) | Same syllable, 4+ meanings!"]],
  [3, "Tone pairs + sandhi", ["3+3 → 2+3 (sandhi rule): nǐ hǎo → ní hǎo", "bù 不 + 4th tone → bú (bú shì 不是)", "yī 一 + tone change rules", "Drill: minimum pairs xī xí xǐ xì (mengangkat-membersihkan-suka-sistem)"]],
  [4, "Greetings basics", ["你好 nǐ hǎo — hello (3+3 sandhi → ní hǎo)", "早上好 zǎoshang hǎo — selamat pagi", "晚上好 wǎnshang hǎo — selamat malam", "再见 zàijiàn — sampai jumpa"]],
  [5, "Perkenalan diri", ["我是___ wǒ shì ___ — saya adalah ___", "我叫___ wǒ jiào ___ — saya bernama ___", "Mandarin pronoun: 我 wǒ (I), 你 nǐ (you), 他/她 tā (he/she — same Pinyin!)", "您 nín — 'you' polite (vs 你 informal)"]],
  [6, "Hanzi intro 1 — 5 most common", ["我 wǒ (I), 你 nǐ (you), 好 hǎo (good)", "是 shì (to be), 不 bù (not)", "Stroke order — kiri-atas → kanan-bawah pattern", "Linguo target: ~150 hanzi by end A1"]],
  [7, "Angka 1-10", ["一二三四五六七八九十 (yī èr sān sì wǔ liù qī bā jiǔ shí)", "Hanzi: simple → complex strokes", "Daily use: phone numbers, ages, prices", "Note 二 èr vs 两 liǎng — different uses (lihat sesi 14)"]],
  [8, "Nama + asal", ["你叫什么名字? nǐ jiào shénme míngzi? — what's your name?", "Jawab: 我叫___ wǒ jiào ___", "你是哪国人? nǐ shì nǎ guó rén? — what nationality?", "我是印尼人 wǒ shì yìnní rén — saya orang Indonesia"]],
  [9, "Negara + bahasa", ["中国 Zhōngguó (China), 美国 Měiguó (USA), 印尼 Yìnní (Indo), 日本 Rìběn (Japan)", "Patterns: ___ 国 (-guó = country), ___ 人 (-rén = person), ___ 语 (-yǔ = language)", "我会说中文 wǒ huì shuō zhōngwén — saya bisa bicara Chinese", "汉语 hànyǔ vs 中文 zhōngwén vs 普通话 pǔtōnghuà — semua = Mandarin (subtle differences)"]],
  [10, "Particle 吗 + question", ["吗 ma di akhir kalimat = pertanyaan ya/tidak", "你是学生吗? nǐ shì xuésheng ma? — Apakah kamu siswa?", "Mandarin questions = NO inversion (kata urut sama)", "Question words: 什么 shénme (apa), 谁 shéi (siapa), 哪儿 nǎr (dimana)"]],
  [11, "Hanzi intro 2 — countries", ["中 zhōng (middle/China), 国 guó (country), 人 rén (person)", "美 měi (beautiful/America), 日 rì (sun/Japan), 本 běn (book/root)", "Compound: 中国 = middle kingdom (etimologi China)", "美国 = beautiful country (transliteration America)"]],
  [12, "Angka 11-100 + umur", ["11 = 十一 shí yī (10+1), 20 = 二十 èr shí (2×10)", "100 = 一百 yī bǎi", "你多大? nǐ duō dà? — berapa umurmu?", "我二十五岁 wǒ èr shí wǔ suì — saya 25 tahun"]],
  [13, "Keluarga", ["爸爸 bàba (papa), 妈妈 māma (mama)", "哥哥 gēge (kakak L), 姐姐 jiějie (kakak P), 弟弟 dìdi (adik L), 妹妹 mèimei (adik P)", "Reduplication = affectionate (Mandarin family terms)", "Tip: Chinese family terms ranked by birth order — kompleks!"]],
  [14, "Measure words (量词) intro", ["Mandarin WAJIB pakai measure word antara angka + noun", "一个人 yī gè rén (1 [generic] person)", "一本书 yī běn shū (1 [book MW] book)", "Common MW: 个 gè (generic), 本 běn (book), 张 zhāng (flat: paper, ticket), 只 zhī (animal)"]],
  [15, "Measure words drill", ["两 liǎng vs 二 èr — both = 2 but DIFFERENT contexts", "二 èr untuk ordinal/digits (二月 February, 第二 2nd)", "两 liǎng untuk quantity + MW (两个人 = 2 people)", "Common pattern: number + MW + noun (rigid order)"]],
  [16, "Review A1.1 + Beijing intro", ["Recap Pinyin + tones + greetings + 50 hanzi", "北京 Běijīng — capital sejak Yuan Dynasty (Kublai Khan)", "故宫 Gùgōng (Forbidden City) — 600 years, 9999 rooms legend", "天安门 Tiān'ānmén — Gate of Heavenly Peace"]],
]);

const a1_2 = toSessions([
  [17, "Pronouns + plural", ["Singular: 我 wǒ, 你 nǐ, 他/她/它 tā", "Plural: + 们 men — 我们 wǒmen (we), 你们 nǐmen (you all), 他们 tāmen (they)", "您 nín — 'you' polite (formal, elderly, customers)", "咱们 zánmen — inclusive 'we' (you + me) — Northern usage"]],
  [18, "Verb 是 shì — identity", ["是 shì = 'to be' HANYA untuk identitas (X is Y)", "我是老师 wǒ shì lǎoshī — saya adalah guru", "Tidak digunakan untuk adjective! (我累 = I'm tired, NO 是)", "Negation: 不是 bú shì (NOT — note 不 + 4th tone = bú)"]],
  [19, "Verb 有 yǒu — have/exist", ["有 yǒu = have / there is/are", "我有一个哥哥 wǒ yǒu yí gè gēge — saya punya 1 kakak", "Negation: 没有 méiyǒu (NOT 不有!)", "Existence: 桌子上有书 — di meja ada buku"]],
  [20, "Negation 不 vs 没", ["不 bù — general negation (present/future, habit, characteristic)", "没 méi — negation 有 only, OR 'didn't' (past completed)", "我不喜欢 (I don't like) vs 我没去 (I didn't go)", "Easy rule: 没 + verb-完成, 不 + everything else"]],
  [21, "Makanan Tionghoa dasar", ["米饭 mǐfàn (rice), 面条 miàntiáo (noodles)", "饺子 jiǎozi (dumplings), 包子 bāozi (steamed buns)", "炒饭 chǎofàn (fried rice), 春卷 chūnjuǎn (spring rolls)", "Tea heritage: 绿茶 lǜchá, 红茶 hóngchá, 乌龙茶 wūlóngchá"]],
  [22, "Di restoran", ["服务员 fúwùyuán — waiter (politik 'comrade' literal)", "菜单 càidān — menu", "点菜 diǎn cài — order food", "买单 mǎidān / 结账 jiézhàng — bill please"]],
  [23, "Rutinitas harian", ["起床 qǐchuáng (bangun tidur), 吃饭 chīfàn (makan)", "上班 shàngbān (kerja), 上学 shàngxué (sekolah)", "下班 xiàbān (pulang kerja), 睡觉 shuìjiào (tidur)", "Pattern: 上/下 + activity = start/end of activity"]],
  [24, "Jam + waktu", ["现在几点? xiànzài jǐ diǎn? — sekarang jam berapa?", "三点 sān diǎn (3 o'clock), 三点半 sān diǎn bàn (3:30)", "三点一刻 (3:15), 三点三刻 (3:45)", "Time-of-day: 上午 shàngwǔ (morning), 下午 xiàwǔ (afternoon), 晚上 wǎnshang (evening)"]],
  [25, "Hari + bulan", ["星期一 xīngqī yī (Monday), 星期二, ... 星期日/天 (Sunday)", "Logic: 星期 + number (1-6) + 日/天 for Sunday", "一月 yīyuè (January)... 十二月 (December) — just month-number-月", "号 hào — date: 五月十七号 (May 17th)"]],
  [26, "Today / besok / kemarin", ["今天 jīntiān (today), 明天 míngtiān (tomorrow), 昨天 zuótiān (yesterday)", "上 / 下 + 星期/月 — last/next week/month", "前天 qiántiān (day before yesterday), 后天 hòutiān (day after tomorrow)", "Pattern: 上 (previous) / 下 (next) — directional metaphor"]],
  [27, "Hanzi 100 milestone", ["Recap most-common chars: pronouns, verbs essential, numbers, family", "Strategy: high-frequency chars first (Top 100 covers ~40% of texts)", "Practice: write 5 chars/day, review with SRS (Anki)", "Hanzi components — radicals: 人 (person), 口 (mouth), 水 (water), 木 (tree)"]],
  [28, "Tones review + minimal pairs", ["mā/má/mǎ/mà — drilling discipline", "Critical pairs: shí (10) vs shì (is/yes), mǎi (buy) vs mài (sell)", "Indonesian speakers — tones biggest challenge", "Practice technique: shadowing native speakers slow"]],
  [29, "Anggota tubuh + sakit", ["头 tóu (kepala), 眼睛 yǎnjing (mata), 嘴 zuǐ (mulut)", "手 shǒu (tangan), 脚 jiǎo (kaki)", "心脏 xīnzàng (jantung), 胃 wèi (perut)", "我头疼 wǒ tóu téng — kepala saya sakit"]],
  [30, "Ke dokter", ["医生 yīshēng (dokter), 医院 yīyuàn (RS)", "看病 kànbìng — visit doctor (literally 'look at illness')", "感冒 gǎnmào (flu), 发烧 fāshāo (fever)", "药 yào (obat), 处方 chǔfāng (resep)"]],
  [31, "Belanja basics", ["这个多少钱? zhège duōshao qián? — ini berapa?", "便宜 piányi (murah), 贵 guì (mahal)", "块 kuài (RMB unit informal) vs 元 yuán (formal)", "支付宝 zhīfùbǎo (Alipay), 微信支付 wēixìn zhīfù (WeChat Pay) — cash dying in China"]],
  [32, "Review A1.2 + sarapan culture", ["Recap pronouns + verbs essential + food", "中式早餐 — Chinese breakfast typical", "豆浆 dòujiāng (soy milk) + 油条 yóutiáo (fried dough stick)", "Variations: 包子, 粥 zhōu (congee), 煎饺 (potstickers)"]],
]);

const a1_3 = toSessions([
  [33, "Particle 了 le — intro", ["了 le = completed action OR new situation", "Action complete: 我吃了饭 wǒ chī le fàn (I ate)", "New situation: 我饿了 wǒ è le (I'm hungry NOW)", "Different positions — different meanings (complex topic later A2)"]],
  [34, "Past time markers", ["昨天 (yesterday), 上个星期 (last week), 上个月 (last month), 去年 (last year)", "以前 yǐqián — before (general past)", "Mandarin tense — no verb conjugation, just time markers + 了", "我去年去了北京 (last year I went to Beijing)"]],
  [35, "Hobby + 喜欢", ["喜欢 xǐhuan — like/love (both noun + verb after)", "我喜欢音乐 (I like music)", "我喜欢看电影 (I like watching movies)", "爱 ài — love (stronger), 讨厌 tǎoyàn — dislike"]],
  [36, "Olahraga", ["篮球 lánqiú (basketball), 足球 zúqiú (soccer)", "乒乓球 pīngpāngqiú (table tennis — invented by Chinese name!)", "羽毛球 yǔmáoqiú (badminton)", "Pattern: 打 dǎ (use hands) + sport, 踢 tī (kick) + soccer"]],
  [37, "Musik + C-pop", ["流行音乐 liúxíng yīnyuè (pop music)", "周杰伦 Zhōu Jiélún (Jay Chou) — Mando-pop legend", "JJ Lin 林俊杰 — Singapore-Chinese star", "Mayday 五月天 — Taiwan rock band"]],
  [38, "Film Tionghoa", ["张艺谋 Zhāng Yìmóu — Hero, House of Flying Daggers, Curse of Golden Flower", "陈凯歌 Chén Kǎigē — Farewell My Concubine", "李安 Lǐ Ān (Ang Lee) — Crouching Tiger, Lust Caution", "王家卫 Wáng Jiāwèi (Wong Kar-wai HK) — In the Mood for Love"]],
  [39, "Kalimat dengan 了", ["Pattern: Subject + Verb + 了 + Object", "他买了一本书 tā mǎi le yì běn shū (he bought a book)", "Note 了 placement varies — complex topic", "Negation: 没 + verb (NO 了 needed): 我没去 (I didn't go)"]],
  [40, "Kata tanya", ["什么 shénme — what (general)", "谁 shéi/shuí — who", "哪儿/哪里 nǎr/nǎli — where", "什么时候 shénme shíhou — when, 为什么 wèi shénme — why, 怎么 zěnme — how, 多少/几 duōshao/jǐ — how many"]],
  [41, "Lokasi — 在", ["在 zài + place = at/in/on", "我在家 wǒ zài jiā — saya di rumah", "在 also = progressive (sesi nanti)", "Position: 上 shàng (atas), 下 xià (bawah), 里 lǐ (dalam), 外 wài (luar)"]],
  [42, "Bertanya arah", ["怎么走? zěnme zǒu? — how to go?", "直走 zhí zǒu (lurus), 左转 zuǒ zhuǎn (belok kiri), 右转 yòu zhuǎn (belok kanan)", "Distance: 远 yuǎn (jauh), 近 jìn (dekat)", "请问 qǐng wèn — 'excuse me, may I ask' polite opener"]],
  [43, "Transportasi", ["地铁 dìtiě (subway), 公交车 gōngjiāo chē (bus), 出租车 chūzū chē (taxi)", "高铁 gāotiě (HSR), 飞机 fēijī (pesawat)", "共享单车 gòngxiǎng dānchē — shared bikes (uniquely China explosion)", "DiDi 滴滴 — Chinese Uber, dominant"]],
  [44, "4 kota Tier 1", ["北京 Běijīng — capital, politik + budaya", "上海 Shànghǎi — finance + global", "深圳 Shēnzhèn — tech (Huawei, Tencent), Shenzhen Speed", "广州 Guǎngzhōu — Cantonese trade port heritage"]],
  [45, "Verba gerakan", ["来 lái (come), 去 qù (go)", "走 zǒu (walk/leave), 跑 pǎo (run)", "回 huí (return), 到 dào (arrive)", "Combine with direction: 上来 (come up), 下去 (go down) — directional complements intro"]],
  [46, "Modal verbs", ["想 xiǎng — want to (desire)", "可以 kěyǐ — can (permission)", "会 huì — can (skill) / will (future)", "应该 yīnggāi — should, 要 yào — want/will/must"]],
  [47, "在 + V — progressive", ["在 + verb = sedang melakukan", "我在吃饭 wǒ zài chī fàn (I'm eating)", "Adverb 正 zhèng + 在 + V — emphasis 'right now'", "Beda dari English progressive — Mandarin no -ing"]],
  [48, "Review A1.3 + Konfusius", ["Recap aspect 了 intro + question words + modals", "孔子 Kǒngzǐ (551-479 BCE) — guru Konfusianisme", "论语 Lúnyǔ (Analects) — ajaran moral + sosial", "Influence: family hierarchy, education reverence, harmony"]],
]);

// ============================================================================
// A2 — Pre-Intermediate (4 sublevels × 16 = 64 sesi)
// Pedagogy: Aspect markers mastery → Comparative structures → 把 construction
// ============================================================================

const a2_1 = toSessions([
  [49, "了 le — placement deep", ["Verbal 了 (after verb): 我吃了饭 — action completed", "Sentence-final 了 (end): 我吃饭了 — situation changed", "Both: 我吃了三碗饭了 — completed AND noting amount", "Common mistake: overusing 了 — only when needed"]],
  [50, "过 guo — experiential", ["过 guo (neutral tone) = have ever done before", "我去过中国 wǒ qù guo Zhōngguó — I've been to China", "Different from 了 (completed) — past EXPERIENCE", "Negation: 没 + V + 过 (没去过 — never been)"]],
  [51, "着 zhe — durative state", ["着 zhe = ongoing state (not action)", "门开着 mén kāi zhe — door is open (state)", "她戴着帽子 — she's wearing a hat (state, not action)", "Different from 在 (progressive): 在写 (writing now) vs 写着 (state of being written)"]],
  [52, "了/过/着 comparison", ["了 = completed/changed", "过 = experiential ever-done", "着 = ongoing state", "Drill: 我吃了 (ate), 我吃过 (have eaten before), 我吃着 (in state of eating — rare)"]],
  [53, "Comparison — 比 bǐ", ["A 比 B + adjective", "他比我高 tā bǐ wǒ gāo — he's taller than me", "Degree: 高得多 gāo de duō (much taller), 高一点 gāo yìdiǎn (a bit taller)", "Mandarin signature pattern — VERY different from English"]],
  [54, "Equality — 跟...一样", ["A 跟 B 一样 — A is same as B", "我跟你一样高 — I'm as tall as you", "Differ: 不一样 bù yíyàng (different)", "Equality + adjective often more natural than 比"]],
  [55, "Superlative — 最", ["最 zuì — most/-est", "他最高 tā zuì gāo — he's tallest", "我最喜欢 — I like most", "Combine: 最大的 (the biggest one) — 的 nominalizer"]],
  [56, "Hanzi 300 milestone", ["Recap 300 most-common chars covers ~70% texts", "Strategy continues: high-frequency first", "Radicals expanding: 火 (fire), 心 (heart), 言 (speech), 食 (food)", "Compound creation: 飞机 (flying-machine = airplane)"]],
  [57, "Adjectives — predicative vs attributive", ["Predicative: 他很高 (he is tall) — NO 是, no 的", "Attributive: 高的人 — tall person — uses 的", "Adjective + 很 hěn (very) — often required even without 'very' meaning", "Common adjectives: 好 hǎo, 大 dà, 小 xiǎo, 多 duō, 少 shǎo, 长 cháng, 短 duǎn"]],
  [58, "Topic-comment structure", ["Chinese signature: topic FIRST, comment after", "这本书我看过 zhè běn shū wǒ kàn guo — this book, I've read", "中国我去过两次 — China, I've been twice", "Differs from SVO — pragmatic emphasis pattern"]],
  [59, "把 bǎ construction — intro", ["把 bǎ = move object BEFORE verb (for action+result emphasis)", "Subject + 把 + Object + Verb (+ complement)", "我把饭吃完了 — I ate the rice all up", "Action must affect/dispose of object — specific meaning"]],
  [60, "把 — disposal pattern", ["把 + specific object + V + result/direction", "把书拿来 bǎ shū ná lai — bring the book over", "把字写错 bǎ zì xiě cuò — wrote the character wrong", "Cannot use 把 with: cognitive verbs (爱, 喜欢), result-less verbs"]],
  [61, "Resultative complements", ["Verb + result morpheme combinations", "看见 kànjiàn — see (look + perceive)", "听到 tīngdào — hear (listen + reach)", "找到 zhǎodào — find (look-for + reach)"]],
  [62, "Directional complements", ["Verb + direction word", "走出来 zǒu chūlai — walk out (toward speaker)", "跑回去 pǎo huíqu — run back (away from speaker)", "Lai/qu deictic — toward/away from speaker"]],
  [63, "Potential complements", ["Verb + 得/不 + result/direction = can/cannot do", "看得见 kàn de jiàn (can see) vs 看不见 kàn bú jiàn (cannot see)", "听得懂 (can understand) vs 听不懂 (cannot understand)", "Important: NOT same as 能/不能 modal — specific potential"]],
  [64, "Review A2.1 + Hutong culture", ["Recap aspect markers + 把 + complements", "胡同 hútòng — Beijing's old narrow alleys", "Yuan-Ming-Qing Dynasty heritage residential", "Modern: gentrification + preservation tension"]],
]);

const a2_2 = toSessions([
  [65, "Future + intentions", ["要 yào — want/will/must (context-dependent)", "打算 dǎsuan — plan to", "计划 jìhuà — plan", "明天我要去上海 míngtiān wǒ yào qù Shànghǎi — tomorrow I'll go to Shanghai"]],
  [66, "Travel basics", ["旅行 lǚxíng — travel (general)", "旅游 lǚyóu — tourism", "护照 hùzhào (passport), 签证 qiānzhèng (visa)", "China visa: 144-hour transit + business + tourist categories"]],
  [67, "Hotel reservation", ["酒店 jiǔdiàn — hotel (formal), 宾馆 bīnguǎn — inn", "标间 biāojiān — standard double room", "单人间 dānrénjiān — single, 大床房 dàchuáng fáng — king bed", "携程 Xié Chéng (Ctrip) — major booking app"]],
  [68, "At airport", ["机场 jīchǎng (airport), 飞机 fēijī (plane)", "登机牌 dēngjī pái — boarding pass, 行李 xíngli — luggage", "Major airports: PEK (Beijing Capital), PKX (Daxing), PVG (Shanghai Pudong), CAN (Guangzhou)", "中国国航 Air China (national carrier), 东航 (China Eastern), 南航 (China Southern)"]],
  [69, "Tier 1 cities deep", ["北京 — political capital, 21M population", "上海 — financial center, 24M, Pudong skyline", "深圳 — tech capital, 17M, since 1980 SEZ", "广州 — Cantonese heritage, 18M"]],
  [70, "长城 — Great Wall", ["长城 chángchéng — Great Wall, UNESCO since 1987", "Total length ~21,196 km (current measurement)", "Famous sections: 八达岭 Bādálǐng, 慕田峪 Mùtiányù, 司马台 Sīmǎtái", "Built across 2000+ years, mostly Ming Dynasty reconstruction"]],
  [71, "故宫 — Forbidden City", ["故宫 Gùgōng — Forbidden City, 'Palace Museum'", "Built 1406-1420 (Ming Yongle Emperor)", "9999 rooms (legend; actual ~8700)", "UNESCO 1987, largest preserved palace world"]],
  [72, "Profesi", ["老师 lǎoshī (guru), 医生 yīshēng (dokter), 工程师 gōngchéngshī (engineer)", "程序员 chéngxù yuán (programmer), 设计师 shèjì shī (designer)", "公务员 gōngwù yuán (civil servant) — Iron rice bowl 铁饭碗", "Most prestigious traditionally: doctor, teacher, civil servant"]],
  [73, "Wawancara kerja", ["面试 miànshì — interview", "简历 jiǎnlì — resume", "工作经验 gōngzuò jīngyàn — work experience", "Salary expectation: 期望薪资 qīwàng xīnzī"]],
  [74, "CV — Chinese resume format", ["Photo required (Asian convention)", "Personal info (age, gender, hometown ok)", "Education + work experience reverse chronological", "References optional, certifications listed"]],
  [75, "Kantor vocab", ["公司 gōngsī — company, 同事 tóngshì — colleague", "老板 lǎobǎn — boss, 经理 jīnglǐ — manager", "加班 jiābān — overtime (sayang China heavy)", "996 — Jack Ma's controversial 9am-9pm-6days/week culture"]],
  [76, "关系 guānxi — Chinese business", ["关系 guānxi — relationships/connections (untranslatable in full)", "Business in China DEPENDS on guanxi", "面子 miànzi (face) — public reputation, must preserve", "送礼 sòng lǐ (gift-giving) — formalized cultural protocol"]],
  [77, "Business email", ["您好 nín hǎo — formal opener (vs informal 你好)", "敬启者 jìngqǐ zhě — Dear Sir/Madam (very formal)", "此致敬礼 cǐ zhì jìnglǐ — formal closing", "WeChat (微信) primary business comm — email secondary in China"]],
  [78, "Tech giants Chinese", ["阿里巴巴 Ālǐbābā (Alibaba) — Jack Ma, e-commerce empire", "腾讯 Téngxùn (Tencent) — WeChat + gaming", "字节跳动 Zìjié Tiàodòng (ByteDance) — TikTok/Douyin", "华为 Huáwéi (Huawei) — telecom + smartphones", "百度 Bǎidù (Baidu) — search + AI"]],
  [79, "Negosiasi style", ["讨价还价 tǎojià-huánjià — bargaining (markets ONLY, not malls)", "关系-first negotiation — relationship before deal", "Indirect 'no' culture — preserves face", "Long-term focus — not deal-by-deal Western style"]],
  [80, "Review A2.2 + Shanghai modern", ["Recap travel + work vocab", "上海 — Bund (外滩 Wàitān) historic", "Pudong (浦东) modern skyline — Shanghai Tower world #3 tallest", "Magnetic levitation train (Maglev) — Pudong to airport"]],
]);

const a2_3 = toSessions([
  [81, "觉得 juéde — feel/think", ["我觉得 wǒ juéde — I think/feel (subjective)", "Used both for opinions + sensations", "我觉得这个不对 — I think this is wrong", "你觉得呢? — what do you think?"]],
  [82, "认为 rènwéi — formal think", ["认为 rènwéi — believe/maintain (more formal, considered)", "我认为... — official-sounding opinion", "Used in academic + business contexts", "我觉得 (felt opinion) vs 我认为 (considered judgment)"]],
  [83, "因为...所以... — cause/effect", ["因为 yīnwèi — because (often before reason)", "所以 suǒyǐ — therefore (before result)", "Pattern: 因为___, 所以___", "Both halves often used — Chinese loves redundant connectors"]],
  [84, "虽然...但是... — although/but", ["虽然 suīrán — although (concession)", "但是 dànshì — but (contrast)", "Pattern: 虽然___, 但是___", "可是 kěshì — alternative to 但是, slightly softer"]],
  [85, "如果...就... — if/then", ["如果 rúguǒ — if (conditional)", "就 jiù — then (often after subject in main clause)", "如果你来, 我就高兴 — if you come, I'll be happy", "要是 yàoshi — alternative to 如果, casual"]],
  [86, "Emosi vocab", ["高兴 gāoxìng — happy, 难过 nánguò — sad", "生气 shēngqì — angry, 害怕 hàipà — afraid", "紧张 jǐnzhāng — nervous, 担心 dānxīn — worried", "Note: emosi often expressed via verbs not adjectives"]],
  [87, "Politeness 请", ["请 qǐng — please (verb 'invite')", "请坐 qǐng zuò — please sit", "请问 qǐng wèn — may I ask (excuse me opener)", "谢谢 xièxie (thanks), 不客气 búkèqi (you're welcome)"]],
  [88, "Apologizing", ["对不起 duìbuqǐ — I'm sorry (apology direct)", "不好意思 bù hǎoyìsi — sorry/embarrassed (lighter)", "抱歉 bàoqiàn — apologize (formal)", "没关系 méi guānxi — it's OK / no problem"]],
  [89, "Politik China modern", ["中华人民共和国 Zhōnghuá Rénmín Gònghéguó — PRC (People's Republic of China)", "1949 — Founded by Mao Zedong", "国家主席 — President: 习近平 Xí Jìnpíng (since 2013)", "中国共产党 — CCP, founded 1921"]],
  [90, "Koran + media", ["人民日报 Rénmín Rìbào — People's Daily (CCP organ)", "新华社 Xīnhuá Shè — Xinhua News Agency", "央视 CCTV — China Central Television", "微博 Wēibó (Twitter-like), 抖音 Dǒuyīn (Douyin/TikTok)"]],
  [91, "Verbs of cognition", ["知道 zhīdao — know (fact)", "认识 rènshi — know (recognize, person/place)", "了解 liǎojiě — understand (deep knowledge)", "懂 dǒng — understand/get it"]],
  [92, "还/也 — still/also", ["还 hái — still / also (additional)", "也 yě — also (similar action)", "我还想要 — I still want / I also want", "我也喜欢 — I also like"]],
  [93, "都 dōu — all", ["都 dōu — all (REQUIRES specific subjects)", "我们都是学生 — we're all students", "他都吃完了 — he ate everything (all gone)", "Position: subject + 都 + verb (rigid)"]],
  [94, "才/就 — only/just nuance", ["才 cái — only/just/not until (negative implication)", "就 jiù — already/just/then (positive)", "他才来 — he just/finally came (with implication 'late')", "他就来了 — he came right away (eagerly)"]],
  [95, "Complex sentences", ["Combining multiple clauses with connectors", "Time sequence: 先...然后...最后...", "Conditional + result chains", "Practice with diary entry"]],
  [96, "Review A2.3 + tea culture", ["Recap opinions + connectors + connectors", "六大茶类 — 6 great tea classifications: 绿(green), 红(red/black), 白(white), 黑(dark/Pu'er), 黄(yellow), 青(oolong)", "Chinese tea heritage 5000+ years", "Tea ceremony 工夫茶 gōngfū chá — meditative practice"]],
]);

const a2_4 = toSessions([
  [97, "Dinasti Cina overview", ["朝代 cháodài — dynasty", "5000 years recorded history", "Major: 夏商周→秦汉→隋唐→宋元→明清→民国→共和国", "Each dynasty 100-300 years typical"]],
  [98, "Confucius — 孔子", ["孔子 Kǒngzǐ (551-479 BCE), Lu State (modern Shandong)", "论语 Lúnyǔ — Analects, 20 chapters", "Core: 仁 rén (humaneness), 礼 lǐ (ritual propriety), 义 yì (righteousness)", "Confucian heritage — defining East Asian culture"]],
  [99, "Daoism — 道家", ["老子 Lǎozǐ (6th-5th c. BCE)", "道德经 Dàodéjīng — Tao Te Ching, 81 chapters", "Core: 道 dào (way), 无为 wúwéi (effortless action)", "Influence: Chinese aesthetics, martial arts, medicine"]],
  [100, "Buddhism arrival", ["佛教 fójiào — Buddhism, arrived 1st century CE from India", "Silk Road transmission", "Major schools: Chan (Zen origin), Pure Land, Tiantai", "Iconic: White Horse Temple (Luoyang), Shaolin Temple"]],
  [101, "Han Dynasty — 汉朝", ["汉朝 Hàn Cháo (206 BCE-220 CE)", "Founded 刘邦 Liú Bāng — first peasant emperor", "Silk Road 丝绸之路 expansion", "Han identity — 汉人 huárén, 汉字 hànzì (Chinese characters)"]],
  [102, "Tang Dynasty — 唐朝", ["唐朝 Táng Cháo (618-907)", "Golden age — cosmopolitan, multicultural", "Tang poetry — 李白 Li Bai, 杜甫 Du Fu", "Chang'an (Xi'an) — world's largest city ~1M"]],
  [103, "Song Dynasty — 宋朝", ["宋朝 Sòng Cháo (960-1279)", "Cultural peak — printing, gunpowder, compass invented", "Neo-Confucianism rises — 朱熹 Zhu Xi", "Painting + ceramics + cuisine sophisticated"]],
  [104, "Ming Dynasty — 明朝", ["明朝 Míng Cháo (1368-1644)", "Founded 朱元璋 Zhu Yuanzhang (peasant rebel)", "Forbidden City built — 永乐 Yongle Emperor", "Zheng He voyages — Indian Ocean exploration 1405-1433"]],
  [105, "Qing Dynasty — 清朝", ["清朝 Qīng Cháo (1644-1912) — last dynasty", "Manchu rulers, Han majority", "Late: Opium Wars, foreign concessions, Boxer Rebellion", "Fell 1912 — Sun Yat-sen 孙中山 Republican Revolution"]],
  [106, "Republic + PRC 1949", ["民国 Mínguó (1912-1949) — Republic of China", "Sun Yat-sen → Chiang Kai-shek 蒋介石", "WWII anti-Japanese war 1937-1945", "1949 — Mao Zedong founds PRC, Chiang flees Taiwan"]],
  [107, "Deng Xiaoping reforms 1978", ["邓小平 Dèng Xiǎopíng — paramount leader 1978-1992", "改革开放 gǎigé kāifàng — Reform and Opening Up", "SEZs created: Shenzhen first", "Famous: 'It doesn't matter if the cat is black or white, as long as it catches mice'"]],
  [108, "Modern China rise", ["Economic miracle 1980s-now", "GDP 2nd globally (1st by PPP)", "Belt and Road Initiative 一带一路 (since 2013)", "Modern challenges: aging population, US tensions, climate"]],
  [109, "Beijing — heritage + modern", ["北京 Běijīng — 'northern capital'", "Yuan-Ming-Qing capital + modern PRC capital", "Forbidden City + Summer Palace + Temple of Heaven UNESCO", "Modern: CBD, 798 Art District, Olympics 2008 + 2022"]],
  [110, "Shanghai — Pearl of the East", ["上海 Shànghǎi — historical concession port", "Bund (外滩) — colonial architecture heritage", "Pudong skyscrapers — Shanghai Tower, Jin Mao, World Financial", "Modern: finance capital, fashion capital"]],
  [111, "Hong Kong heritage", ["香港 Xiānggǎng — 'fragrant harbor'", "British colony 1842-1997 → SAR (special admin region)", "One Country Two Systems framework", "Modern: tensions post-2020 National Security Law"]],
  [112, "Review A2.4 + 8 cuisines", ["Recap dynasties + modern China", "八大菜系: 川 (Sichuan), 粤 (Cantonese), 鲁 (Shandong), 苏 (Jiangsu)", "湘 (Hunan), 闽 (Fujian), 浙 (Zhejiang), 徽 (Anhui)", "Famous globally: 川菜 spicy, 粤菜 dim sum"]],
]);

// ============================================================================
// B1 — Intermediate (5 sublevels × 16 = 80 sesi)
// ============================================================================

const b1_1 = toSessions([
  [113, "Complex 把 constructions", ["把 + multiple complements integration", "把书放在桌子上 bǎ shū fàng zài zhuōzi shang — put book on table", "把字写大一点 — write characters bigger", "Common ditransitive: 把 X 给 Y — give X to Y"]],
  [114, "被 bèi — passive voice", ["被 bèi — by (passive marker)", "我被他打了 — I was hit by him", "Often + negative/unfortunate result", "被动 bèidòng — passive (vs Western literal translation)"]],
  [115, "Topic prominence deep", ["Topic + comment vs Subject + predicate", "Chinese signature pragmatic emphasis", "他这本书写得很好 — He, this book, wrote very well", "Translation: 'As for this book of his, it's well-written'"]],
  [116, "Tense aspects deep", ["Mandarin: NO verb conjugation for tense", "Time markers + aspect particles (了/着/过) + adverbs", "Context determines time reference", "Concept reverse from Indo-European tense systems"]],
  [117, "给 gěi — give/for/by", ["给 gěi multifunction:", "1. Give: 我给你一本书 — I give you a book", "2. For/to: 给我妈妈打电话 — call my mother", "3. Passive (rare): 被给... informal"]],
  [118, "让 ràng — causative", ["让 ràng — let/make/cause", "妈妈让我学习 — mom makes me study", "Different from 把 — focuses on indirect action", "Polite: 让我想想 — let me think"]],
  [119, "Conditional structures", ["如果 / 要是 / 假如 — if (various registers)", "Result clause often with 就 jiù", "如果你有时间 + 就来 — if you have time, come", "Most flexible: 如果 + clause + 就 + result"]],
  [120, "Hypothetical present", ["要是我有钱, 我就买 — if I had money, I'd buy", "Hypothetical = real + conditional structure", "Mandarin: NO subjunctive form (vs European languages)", "Context + conditional + 就 = hypothetical"]],
  [121, "Counterfactual past", ["早知道 zǎo zhīdao — if I had known earlier", "Pattern: 如果 ___ 了, 就 ___ 了", "如果早知道下雨, 就带伞了 — had I known it'd rain, would've brought umbrella", "Common drama queens construction"]],
  [122, "是...的 emphasis", ["是 + emphasized element + ___ + 的", "我是昨天来的 — it WAS yesterday I came (emphasizing TIME)", "他是坐飞机来的 — he came BY PLANE (emphasizing method)", "Past events emphasis — uniquely Mandarin"]],
  [123, "连...都/也 — even", ["连 lián + element + 都/也 + verb", "连小孩都知道 — even a child knows", "连我也不行 — even I can't", "Extreme/unexpected emphasis"]],
  [124, "越...越... — the more...the more", ["越 yuè...越 yuè... pattern", "越快越好 — the faster the better", "他越说越大声 — the more he talks the louder", "Progressive comparison structure"]],
  [125, "一...就... — as soon as", ["一 yī + verb1 + 就 jiù + verb2", "我一回家就睡觉 — as soon as I get home I sleep", "Immediate sequential action", "Very natural Chinese flow"]],
  [126, "Rhetorical questions", ["难道...吗? nándào...ma? — surely (not)...?", "难道你不知道吗? — Could it be you don't know?", "Implied opposite of stated", "Native + literary style"]],
  [127, "Chengyu 成语 — intro", ["成语 chéngyǔ — 4-character idioms", "Classical literary origin", "Thousands exist; ~500 in active use", "Examples: 马马虎虎 (so-so), 一举两得 (kill 2 birds 1 stone), 心想事成 (wishes come true)"]],
  [128, "Review B1.1 + humor Cina", ["Recap aspect + passive + topic-comment + connectors", "Humor: wordplay, puns (Mandarin tone-based humor unique)", "Modern: 脱口秀 tuōkǒu xiù — Chinese stand-up comedy", "网络 memes — Chinese internet culture rapid + creative"]],
]);

const b1_2 = toSessions([
  [129, "Cinema heritage Tionghoa", ["华语电影 huáyǔ diànyǐng — Sinophone cinema", "5 generations 5代 categorized by film historians", "Shanghai 1930s — Asia's Hollywood pre-PRC", "Modern: mainland + HK + Taiwan + diaspora"]],
  [130, "张艺谋 — Zhang Yimou", ["1950 Xi'an — 5th generation Chinese cinema", "红高粱 Red Sorghum (1987) — international breakthrough", "英雄 Hero (2002), 十面埋伏 House of Flying Daggers", "Beijing Olympics 2008 + 2022 — opening ceremonies"]],
  [131, "王家卫 — Wong Kar-wai", ["1958 Shanghai → HK", "重庆森林 Chungking Express (1994)", "花样年华 In the Mood for Love (2000) — most beautiful film?", "Aesthetic: slow-motion, neon, longing, jazz"]],
  [132, "李安 — Ang Lee", ["1954 Taiwan — global crossover director", "卧虎藏龙 Crouching Tiger Hidden Dragon (2000) — Oscar best foreign", "Brokeback Mountain, Life of Pi — Hollywood masterpieces", "Bridge East-West sensibility"]],
  [133, "贾樟柯 — Jia Zhangke", ["1970 Shanxi — 6th generation", "Indie modern China chronicler", "三峡好人 Still Life (2006), 山河故人 Mountains May Depart", "Realism + globalization themes"]],
  [134, "C-pop heritage", ["周杰伦 Jay Chou — Mando-pop king, R&B + Chinese style fusion", "JJ Lin 林俊杰 — Singaporean ballad master", "邓丽君 Teresa Teng — original heritage star (1953-1995)", "蔡依林 Jolin Tsai — pop queen"]],
  [135, "Mandopop vs Cantopop", ["Mandopop — Mandarin pop, dominant", "Cantopop — Cantonese, HK-based, declined since 2000s", "Heritage: Leslie Cheung 张国荣, Anita Mui 梅艳芳, Faye Wong 王菲", "Crossover: many sing both"]],
  [136, "Peking opera — 京剧", ["京剧 Jīngjù — Peking/Beijing Opera, 200+ years heritage", "Stylized makeup (脸谱), costumes, gestures", "Roles: 生 (male), 旦 (female), 净 (painted face), 丑 (clown)", "梅兰芳 Mei Lanfang — most famous performer 20th c."]],
  [137, "Calligraphy — 书法", ["书法 shūfǎ — way of writing", "5 styles: 篆 seal, 隶 clerical, 楷 regular, 行 running, 草 cursive", "Tools: 笔 (brush), 墨 (ink), 纸 (paper), 砚 (inkstone) — 文房四宝", "王羲之 Wang Xizhi (303-361) — Sage of Calligraphy"]],
  [138, "Chinese painting — 国画", ["国画 guóhuà — traditional Chinese painting", "Genres: 山水 (landscape), 花鸟 (bird-flower), 人物 (figure)", "Tools: ink + brush + xuan paper", "Masters: 张大千 Zhang Daqian, 齐白石 Qi Baishi"]],
  [139, "Tea ceremony — 工夫茶", ["工夫茶 gōngfū chá — 'kung fu tea' detailed prep", "Originated Fujian + Guangdong (Chaoshan area)", "Small Yixing teapot + tiny cups", "Multiple infusions of single batch — extract nuance"]],
  [140, "8 cuisines deep", ["川 Sichuan — 麻辣 málà (numbing spicy): hotpot, mapo tofu", "粤 Cantonese — dim sum, light flavors, freshness", "鲁 Shandong — court food, big portions", "苏 Jiangsu — refined, Suzhou style"]],
  [141, "Sichuan cuisine — 川菜", ["川菜 Chuān Cài — Sichuan cuisine", "Signature: 麻 má (Sichuan peppercorn numbing) + 辣 là (chili)", "Famous: 火锅 hotpot, 麻婆豆腐 mapo tofu, 担担面 dan dan noodles", "Cultural: spice as life essence Sichuan philosophy"]],
  [142, "Cantonese cuisine — 粤菜", ["粤菜 Yuè Cài — Cantonese", "Signature: 鲜 xiān (freshness)", "Dim sum 点心 — 'touch the heart' small plates", "Famous: 烧鹅 roast goose, 白切鸡 white-cut chicken, 叉烧 char siu"]],
  [143, "North vs South China food", ["North: wheat-based (面条, 饺子, 馒头)", "South: rice-based (米饭, 粥, 米粉)", "Climate determined — north drier wheat, south wetter rice", "Cultural identity expressed via food"]],
  [144, "Review B1.2 + Mid-Autumn", ["Recap culture + cinema + music + cuisine", "中秋节 Zhōngqiū Jié — Mid-Autumn Festival, 15 day 8 lunar month", "月饼 yuèbǐng — mooncakes (heavy + sweet)", "Family reunion + moon-viewing tradition"]],
]);

const b1_3 = toSessions([
  [145, "Ekonomi modern Cina", ["GDP 2nd globally, 1st PPP since 2014", "Manufacturing — 'world's factory'", "Services + tech rising rapidly", "Currency 人民币 (RMB / 元 yuán) — managed exchange"]],
  [146, "One Child Policy heritage", ["独生子女 dúshēng zǐnǚ — one-child policy 1979-2015", "Demographic legacy: gender imbalance, aging", "Replaced: 2-child (2015), 3-child (2021)", "Population decline 2022 first time post-Mao era"]],
  [147, "Aging society + 421 structure", ["421 structure — 4 grandparents, 2 parents, 1 child", "Burden on only children supporting elderly", "养老 yǎnglǎo — eldercare crisis", "Modern: aged-friendly cities + tech responses"]],
  [148, "Urbanization + migrants", ["农民工 nóngmín gōng — migrant workers", "~290M migrants — largest internal migration history", "户口 hùkǒu — household registration system (rural vs urban)", "Tier 1-5 city hierarchy economic"]],
  [149, "Education — 高考", ["高考 gāokǎo — National College Entrance Exam", "Annual June 7-8, single most-stressful exam", "Determines university placement decisively", "Cram culture intense — 补习班 bǔxí bān"]],
  [150, "Top universities", ["清华大学 Qīnghuá Dàxué (Tsinghua) — engineering/tech", "北京大学 Běijīng Dàxué (PKU) — humanities/sciences", "复旦大学 Fùdàn Dàxué (Fudan, Shanghai) — comprehensive", "C9 League — China's Ivy League equivalent"]],
  [151, "Healthcare system", ["医保 yībǎo — medical insurance system", "公立医院 gōnglì yīyuàn — public hospitals (overcrowded)", "私立 sīlì — private hospitals (growing)", "Traditional Chinese Medicine 中医 — official recognition"]],
  [152, "Welfare evolution", ["Iron rice bowl 铁饭碗 — Mao era guaranteed employment", "Reform era: gradual welfare state development", "养老保险 yǎnglǎo bǎoxiǎn — pension insurance", "Modern: aging society pressure intense"]],
  [153, "Politics — CCP", ["中国共产党 — CCP, founded July 1921", "~99M members (largest political party world)", "Xi Jinping General Secretary since 2012", "Two Sessions annual: NPC + CPPCC"]],
  [154, "Constitution + structure", ["NPC 全国人民代表大会 — National People's Congress", "Highest organ of state power", "State Council — government", "Hierarchical Party-State integration"]],
  [155, "Foreign relations — Belt and Road", ["一带一路 yídài yílù — Belt and Road Initiative 2013", "Trade routes 60+ countries, $1T+ investment", "BRICS membership — alternative to West", "Tensions: US, EU, India, neighbors"]],
  [156, "Diaspora — 华人", ["华人 huárén — Chinese diaspora globally", "50M+ overseas Chinese", "Major communities: SE Asia, North America, Australia, Europe", "Chinatowns 唐人街 — heritage worldwide"]],
  [157, "Taiwan question", ["Taiwan — separate de facto state since 1949", "Beijing claims as renegade province", "Cross-strait relations complex", "Linguistically: traditional characters 繁体字 used"]],
  [158, "Hong Kong post-2020", ["国安法 Guó'ān Fǎ — National Security Law 2020", "Major political changes Hong Kong", "Emigration wave — UK BNO scheme", "Linguistically: Cantonese + traditional characters"]],
  [159, "Environment", ["Air pollution — major past challenge, improving", "Climate goals: Carbon peak 2030, neutrality 2060", "Solar + wind capacity world #1", "Tensions: development vs environmental"]],
  [160, "Review B1.3 + reading", ["Recap society + economy + politics", "Reading 人民日报 + 财新 headlines", "Vocabulary: 政府 (government), 政策 (policy), 改革 (reform)", "Following Chinese current affairs"]],
]);

const b1_4 = toSessions([
  [161, "Confucius — Analects 论语", ["论语 Lúnyǔ — Analects, 20 chapters", "Recorded by disciples after Confucius death", "Famous: 学而时习之, 不亦说乎 — learn and timely practice, isn't it joyful?", "Core texts: 论语 + 大学 + 中庸 + 孟子 (Four Books)"]],
  [162, "Laozi — Tao Te Ching", ["道德经 Dàodéjīng — 81 chapters, ~5000 characters", "道可道, 非常道 — Tao that can be told isn't eternal Tao", "无为 wúwéi — non-action, effortless action", "Most-translated book after Bible globally"]],
  [163, "Three Kingdoms — 三国演义", ["三国演义 Sānguó Yǎnyì — Romance of Three Kingdoms", "罗贯中 Luo Guanzhong, 14th century", "Three kingdoms 220-280 CE: 魏蜀吴 Wei-Shu-Wu", "Heroes: 诸葛亮 Zhuge Liang, 关羽 Guan Yu, 曹操 Cao Cao"]],
  [164, "Journey to West — 西游记", ["西游记 Xīyóu Jì — Journey to the West", "吴承恩 Wu Cheng'en, 16th century", "唐僧 Tang Sanzang + 孙悟空 (Monkey King) + 猪八戒 + 沙僧 → India for sutras", "Monkey King — Chinese cultural icon globally"]],
  [165, "Dream of Red Chamber — 红楼梦", ["红楼梦 Hónglóumèng — Dream of the Red Chamber", "曹雪芹 Cao Xueqin, 18th century, 120 chapters", "Decline of Jia family — aristocratic life detail", "Considered greatest Chinese novel — 红学 'Redology' scholarly field"]],
  [166, "Lu Xun — 鲁迅", ["鲁迅 Lǔ Xùn (1881-1936) — father modern Chinese literature", "阿Q正传 The True Story of Ah Q — national psychology critique", "狂人日记 Diary of a Madman — first modern Chinese vernacular fiction", "'拿来主义' borrowing-ism — cultural exchange concept"]],
  [167, "Lao She — 老舍", ["老舍 Lǎo Shě (1899-1966) — Beijing voice", "骆驼祥子 Rickshaw Boy", "茶馆 Teahouse (play) — Beijing decline portrait", "Suicide 1966 Cultural Revolution"]],
  [168, "Mao Dun — 茅盾", ["茅盾 Máo Dùn (1896-1981) — modernist novelist", "子夜 Midnight — Shanghai 1930s capitalism", "Mao Dun Literature Prize — top literary award named after him", "Realist tradition"]],
  [169, "Mo Yan — Nobel 2012", ["莫言 Mò Yán (1955-) — Nobel Literature 2012", "红高粱家族 Red Sorghum Family (basis of Zhang Yimou film)", "Magical realism + Shandong rural life", "Hallucinatory style 'modern Garcia Marquez'"]],
  [170, "Yu Hua + modern", ["余华 Yú Huá — To Live, Brothers, Chronicle of Blood Merchant", "Realism + dark humor", "余华 globally translated", "Other modern: 苏童 Su Tong, 阎连科 Yan Lianke"]],
  [171, "Gao Xingjian — Nobel 2000", ["高行健 Gāo Xíngjiàn (1940-) — Nobel Literature 2000", "灵山 Soul Mountain — autobiographical journey", "In exile (France) since 1987 — first Chinese-language Nobel", "Mainland: works banned"]],
  [172, "Chengyu deep dive", ["50+ chengyu mastery target", "卧薪尝胆 — sleep on firewood + taste gall (perseverance)", "画蛇添足 — paint snake add feet (overdoing it)", "守株待兔 — wait by stump for hare (passive expectation)"]],
  [173, "Tang poetry — Li Bai", ["李白 Lǐ Bái (701-762) — 诗仙 'Poet Immortal'", "静夜思 Quiet Night Thoughts: 床前明月光...", "将进酒 Bring in the Wine — drinking celebration", "Romantic, free-spirited, mountain-and-water themes"]],
  [174, "Tang shi form", ["唐诗 Tángshī — Tang Dynasty poetry", "Forms: 五言 (5-char lines), 七言 (7-char lines)", "Forms: 绝句 jué jù (4 lines), 律诗 lǜ shī (8 lines)", "Rhyme + tonal patterns — strict structure"]],
  [175, "Modern poetry", ["北岛 Bei Dao — Misty Poetry movement", "顾城 Gu Cheng — child-like surreal", "舒婷 Shu Ting — feminist voice", "Modern: 西川 Xi Chuan, 翟永明 Zhai Yongming"]],
  [176, "Review B1.4 + your line", ["Recap literature classical + modern", "Try writing 5-character Tang-style line", "Topic: nature observation + emotion", "Workshop peer review"]],
]);

const b1_5 = toSessions([
  [177, "Formal — 您 vs 你", ["您 nín — formal 'you' (respectful)", "Used: elders, customers, business, strangers", "你 nǐ — informal (friends, family, peers)", "Wrong register = social faux pas"]],
  [178, "Business email Chinese", ["尊敬的___ zūnjìng de — Respected ___", "您好 — Hello (formal)", "此致敬礼 — sincerely yours", "Modern: WeChat business comm dominant"]],
  [179, "Resume Chinese", ["个人简历 gèrén jiǎnlì — personal resume", "Photo + ID details (Chinese convention)", "Education + work + skills + certifications", "Specifically formatted A4"]],
  [180, "Job application", ["求职信 qiúzhí xìn — cover letter", "应聘 yìngpìn — apply for position", "招聘 zhāopìn — recruit (employer side)", "智联招聘 + 前程无忧 — top job sites"]],
  [181, "Business meetings", ["会议 huìyì — meeting", "议程 yìchéng — agenda", "讨论 tǎolùn — discuss", "Hierarchy seating + speaking order strict"]],
  [182, "Negotiation — guanxi-driven", ["Relationship FIRST, deal second", "Long-term focus — patient", "Gift exchange ritual + meals", "Never lose face (面子)"]],
  [183, "Presentations", ["演讲 yǎnjiǎng — speech/presentation", "幻灯片 huàndēng piān — slides (PPT)", "结构 jiégòu — structure clear", "Q&A: 问答 wèndá"]],
  [184, "Marketing", ["营销 yíngxiāo — marketing", "品牌 pǐnpái — brand", "目标 mùbiāo — target", "Social media: Weibo + Douyin + Xiaohongshu (Little Red Book)"]],
  [185, "E-commerce China", ["淘宝 Táobǎo (Alibaba's C2C)", "天猫 Tiānmāo (Tmall B2C premium)", "京东 Jīngdōng (JD.com — Amazon equivalent)", "拼多多 Pīnduōduō (Pinduoduo — group buying)"]],
  [186, "Banking", ["中国银行 BOC, 工商银行 ICBC, 建设银行 CCB, 农业银行 ABC", "支付宝 Alipay, 微信支付 WeChat Pay — dominant", "Cash dying — even beggars accept QR codes", "Forex restrictions — capital controls"]],
  [187, "WeChat Pay + Alipay", ["移动支付 yídòng zhīfù — mobile payment", "QR code ubiquitous", "Tipping uncommon — service charge automatic in better places", "Cashless culture entrenched since 2015"]],
  [188, "Real estate", ["房地产 fángdìchǎn — real estate", "Price boom 2000-2020, correction since 2021", "Tier-1 cities: extreme prices", "Modern: Evergrande crisis 2021 — real estate restructuring"]],
  [189, "Tax basics", ["个人所得税 gèrén suǒdéshuì — personal income tax", "Progressive 3-45%", "Tax residency: 183 days/year", "Modern: digital tax filing 个税APP"]],
  [190, "Legal basics", ["法律 fǎlǜ — law", "民法 mín fǎ (civil), 刑法 xíng fǎ (criminal)", "律师 lǜshī — lawyer", "Court system hierarchical"]],
  [191, "Remote work", ["远程办公 yuǎnchéng bàngōng — remote work", "996 culture still dominant tech sector", "Modern flexible work growing post-COVID", "Cross-border digital nomads — Bali popular for Chinese"]],
  [192, "Review B1.5 + sim", ["Recap business Chinese", "Simulate 20-min interview Chinese style", "Self-intro + experience + guanxi awareness", "Feedback register + cultural cues"]],
]);

// ============================================================================
// B2 — Upper Intermediate (7 sublevels × 16 = 112 sesi)
// ============================================================================

const b2_1 = toSessions([
  [193, "Classical influence — 文言文", ["文言文 wényánwén — classical Chinese literary language", "Used until 1919 May 4th Movement modernization", "Modern Mandarin retains traces — 之, 乎, 者, 也", "Reading classical opens 3000+ years texts"]],
  [194, "Chengyu mastery", ["50+ chengyu active vocab target", "Categories: nature (山清水秀), animals (画龙点睛), history (卧薪尝胆)", "Daily speech sprinkled — sophistication marker", "Reading literary: chengyu density high"]],
  [195, "Rhetorical patterns", ["排比 páibǐ — parallelism (3+ similar structures)", "对偶 duì'ǒu — couplet symmetry", "反复 fǎnfù — repetition for emphasis", "Chinese rhetoric — symmetry + balance prized"]],
  [196, "Academic register", ["书面语 shūmiàn yǔ — written register", "Latin-esque loanwords: 哲学 (philosophy), 经济 (economy)", "Passive impersonal: 据说 jùshuō (it is said)", "Differing from spoken — heavy + formal"]],
  [197, "Argumentative essay", ["议论文 yìlùnwén — argumentative essay", "Structure: 论点 (thesis) + 论据 (evidence) + 论证 (argument)", "Connectives: 首先, 其次, 再次, 最后", "Gaokao-style writing"]],
  [198, "Stylistic devices", ["比喻 bǐyù — metaphor", "拟人 nǐrén — personification", "夸张 kuāzhāng — exaggeration", "Classical heritage modern essay retains"]],
  [199, "Onomatopoeia + reduplication", ["叠词 diécí — reduplication for emphasis/diminution", "高高 (very tall), 慢慢 (slowly)", "Onomatopoeia: 哗哗 (water flowing), 砰砰 (knock knock)", "Chinese poetry + colloquial both"]],
  [200, "Dialects awareness", ["7 major dialect groups: 官话 Mandarin, 吴 Wu, 粤 Yue (Cantonese), 闽 Min, 客家 Hakka, 湘 Xiang, 赣 Gan", "Mutually unintelligible spoken!", "All write same Hanzi — written unity", "Modern: Putonghua promoted as standard"]],
  [201, "Beijing accent + 儿化", ["儿化音 érhuà yīn — 'r-ization' Beijing feature", "好玩儿 hǎo wánr (fun), 这儿 zhèr (here)", "Adds er ending to nouns + adverbs", "Heavily Beijing accent — varies regionally"]],
  [202, "Shanghai dialect — 上海话", ["上海话 Shànghǎi huà / 沪语 Hùyǔ", "Wu dialect group", "Threatened language — declining usage", "Cultural preservation efforts modern"]],
  [203, "Cantonese basics", ["粤语 Yuèyǔ — Cantonese", "HK + Macau + Guangdong + diaspora", "Different tones (9 tones!), different vocab", "Traditional characters typically"]],
  [204, "Hokkien + Hakka brief", ["闽南语 Mǐnnányǔ — Hokkien (Taiwan, Fujian, SE Asia)", "客家话 Kèjiā huà — Hakka (scattered globally)", "Both threatened but cultural revival", "Important for SE Asian diaspora Chinese"]],
  [205, "Internet slang — 网络用语", ["YYDS — 永远的神 'forever the god' (GOAT)", "996 + 007 — work culture critique", "破防 pò fáng — overwhelmed emotionally", "Modern rapid neologism Internet generation"]],
  [206, "Modern neologisms", ["内卷 nèijuǎn — involution (rat race)", "躺平 tǎngpíng — lying flat (opt-out generation)", "佛系 fóxì — Buddha-style (apathetic)", "Generation Z language critique"]],
  [207, "Code-switching", ["English mixed with Chinese — urban professional", "中英混搭 Zhōng-Yīng hùn dā", "Tech industry: bug, deadline, brief, meeting common", "Acceptance gradual mainstream"]],
  [208, "Review B2.1 + classical-style essay", ["Recap classical + dialects + style", "Write argumentative essay 800 chars", "Include chengyu + rhetorical devices", "Self-assessment Gaokao rubric"]],
]);

const b2_2 = toSessions([
  [209, "Chinese for tourism", ["旅游业 — tourism industry", "Inbound visa-free 144-hour transit major hub cities", "Domestic tourism — Golden Weeks crowded", "UNESCO sites China: 56 (most globally tied with Italy)"]],
  [210, "Chinese for fashion", ["时尚 shíshàng — fashion", "Modern: NE-TIGER, Mary Ma, Shang Xia (Hermès subsidiary)", "Shanghai Fashion Week — twice yearly", "Streetwear: Li-Ning, ANTA — domestic rise"]],
  [211, "Chinese for food industry", ["餐饮业 cānyǐn yè — F&B industry", "美团 Měituán — food delivery + lifestyle dominant", "Famous chefs: 朱长升, 林述巍, 张安然", "Michelin Guide China — 6 cities covered"]],
  [212, "Chinese for design", ["设计 shèjì — design", "Heritage: Bauhaus influence via Wassily Lin Huiyin", "Modern: 王澍 Wang Shu Pritzker 2012, MAD Architects", "Chinese contemporary design global presence"]],
  [213, "Chinese for diplomacy", ["外交部 wàijiāo bù — Foreign Ministry", "Diplomatic style — 'wolf warrior' recent + tradition pragmatic", "BRI + South-South cooperation pillars", "Tensions: US, EU, India, neighbors"]],
  [214, "Chinese for journalism", ["新闻业 xīnwén yè — journalism", "State media dominant — Xinhua, Renmin, CCTV", "Private commercial: 财新 Caixin (most respected business)", "Restrictions tight — investigative journalism limited"]],
  [215, "Chinese for academia", ["学术界 — academic world", "C9 universities + 985/211 tiers", "学位 xuéwèi — degrees: 学士, 硕士, 博士", "International publishing race — SCI/SSCI metrics"]],
  [216, "Chinese for law", ["法律体系 — legal system", "Civil law tradition (Continental influence)", "Reformed 1979+ after Cultural Revolution disruption", "Lawyer's exam (司法考试) — intense"]],
  [217, "Chinese for medicine", ["西医 xīyī (Western medicine) + 中医 zhōngyī (TCM)", "TCM official recognition — coexistence", "针灸 zhēnjiǔ (acupuncture), 推拿 tuīná (massage)", "PLA hospitals + private chains expanding"]],
  [218, "Chinese for engineering", ["工程 gōngchéng — engineering", "Infrastructure scale: HSR (40000+ km), bridges, dams", "Chang'e moon missions, Tiangong space station", "Made in China 2025 — strategic industries"]],
  [219, "Chinese for IT + tech", ["互联网 hùliánwǎng — internet", "BAT: Baidu+Alibaba+Tencent — old guard", "TMD: ByteDance+Meituan+Didi — new generation", "AI: SenseTime, iFlytek, Megvii"]],
  [220, "Chinese for finance", ["金融 jīnróng — finance", "Shanghai + Shenzhen stock exchanges (HK separate)", "RMB internationalization gradual", "Modern: e-CNY (Digital RMB) pioneer CBDC"]],
  [221, "Chinese for art", ["艺术 yìshù — art", "Modern: 798 Art District Beijing, M50 Shanghai", "Artists global: Ai Weiwei (politically sensitive), Cai Guoqiang", "Sotheby's + Christie's HK auctions — Chinese art market"]],
  [222, "Chinese for translation", ["翻译 fānyì — translation", "Chinese-English — high demand both directions", "CATTI certification — official Chinese translator exam", "Literature translation: Howard Goldblatt, Eileen Cheng-yin Chow"]],
  [223, "Chinese for teaching", ["对外汉语 — Chinese as Foreign Language", "汉办 / Hanban — Confucius Institutes worldwide (~500)", "HSK test promotion", "Cool China — soft power push"]],
  [224, "Review B2.2 + portfolio", ["Recap industry verticals", "Build professional Chinese portfolio chosen sector", "50+ specialized terms glossary", "Case study real China business"]],
]);

const b2_3 = toSessions([
  [225, "Tone modulation Chinese", ["Formal vs informal — register switching", "Within formal: 您 layers", "Cultural intuition — read situation", "Mastering Chinese subtlety = core fluency"]],
  [226, "Reading between lines", ["含蓄 hánxù — implicit/reserved expression", "Indirect refusals (考虑一下 'I'll think about it' = often 'no')", "Saving face for both parties", "Decoding requires cultural fluency depth"]],
  [227, "Small talk Chinese", ["Weather, food, family — safe topics", "Career inquiry — culturally appropriate", "Compliments + ritual exchange", "Politics — avoid mostly"]],
  [228, "Tabu kultural", ["Direct income inquiry — avoid", "Death numbers (4 = 死 si homophone)", "Political opinions on Taiwan, HK, Xinjiang — sensitive", "Religion — generally avoid with strangers"]],
  [229, "Sensitivitas religi", ["Buddhism + Daoism + Confucianism — culturally integrated", "Christianity ~5% — minority", "Islam ~2% — Hui, Uyghur populations", "Atheist majority — but cultural practices common"]],
  [230, "Humor decoded", ["Wordplay — heavy use due tones", "Self-deprecating + irony", "Stand-up modern emerging", "Heritage: 相声 xiàngsheng — comic dialogue art form"]],
  [231, "Politik conversation", ["Avoid with strangers/workplace", "Friends close — careful", "Internet self-censoring instinct strong", "Topics: economy, education, society OK; political reform sensitive"]],
  [232, "Dinamika keluarga", ["Filial piety 孝 xiào — defining virtue", "Marriage + child pressure intense", "Spring Festival — mandatory return home", "Modern: city singletons resisting traditional norms"]],
  [233, "Friendship Chinese", ["Slow to build deeply — formal initial", "Once friends — for life loyalty", "Banquet culture builds bonds", "Gift exchanges + favors — guanxi maintenance"]],
  [234, "Romance language", ["我爱你 wǒ ài nǐ — strong, rarely casual", "喜欢你 xǐhuan nǐ — like you (lighter)", "Modern: pet names 宝贝, 亲爱的", "Wedding traditions: red dress, 喜糖 candy, red envelopes"]],
  [235, "Conflict resolution", ["Indirect — preserve face both sides", "Mediation common — 中间人 zhōngjiānrén", "Apology + accept gracefully", "Avoid direct confrontation"]],
  [236, "Reading newspaper fluent", ["Skim headlines + lead", "Identify state vs private media bias", "Reading 财新 (most professional), 人民日报 (Party line)", "WeChat public accounts — modern news source"]],
  [237, "Watching TV without subs", ["Major: CCTV + provincial stations", "Streaming: 爱奇艺 iQiyi + 腾讯视频 + 优酷 Youku", "Modern dramas (现代剧), historical (古装剧), variety (综艺)", "Modern hit: 狂飙 The Knockout (anti-mafia drama)"]],
  [238, "Chinese podcasts", ["小宇宙 Xiǎo Yǔzhòu — podcast app dominant", "故事FM — true stories", "声动早咖啡 — daily news", "Chinese podcasts late but exploding"]],
  [239, "Chinese radio", ["央广 (Central People's Radio)", "FM stations regional", "Decline due podcasts + streaming", "Talk shows + music + news"]],
  [240, "Review B2.3 + real conversation", ["Recap pragmatics + cultural decoding", "Simulate 30-min native conversation", "Topics free: politics, food, art, work", "Self-assessment fluency + cultural sensitivity"]],
]);

const b2_4 = toSessions([
  [241, "Academic register advanced", ["学术语言 — academic language", "Sentence patterns: 鉴于___ (in view of), 综上所述 (in conclusion)", "Latinate equivalents: 范式 (paradigm), 范畴 (category)", "Reading: 哲学研究, 历史研究 academic journals"]],
  [242, "Paper structure", ["摘要 abstract, 关键词 keywords, 引言 introduction", "方法 methodology, 结果 results, 讨论 discussion", "结论 conclusion, 参考文献 references", "Chinese academic style — discursive less data-heavy"]],
  [243, "Citing sources", ["GB/T 7714 — Chinese standard", "Author-date system common modern", "Footnotes (脚注) classical research", "CNKI database — biggest Chinese academic resource"]],
  [244, "Academic conferences", ["学术会议 — academic conferences", "报告 — presentation, 讨论 — discussion", "Chinese conferences: hierarchy emphasized", "International: CSC (China Scholarship Council) sponsorship"]],
  [245, "Thesis writing", ["毕业论文 — graduation thesis", "学士论文 (bachelor's, ~50pp), 硕士 (master's, ~150pp), 博士 (PhD, 200-300pp)", "答辩 dábiàn — defense", "Plagiarism (抄袭 chāoxí) — increasingly enforced"]],
  [246, "Universities deep", ["C9: Tsinghua, PKU, Fudan, Shanghai Jiao Tong, Zhejiang, USTC, Nanjing, Xi'an Jiao Tong, Harbin Institute Tech", "985 (39 univs), 211 (~115) — old tiers", "Double First Class — newer designation", "Liberal arts: PKU + Fudan + Nanjing + Renmin"]],
  [247, "Intellectuals", ["梁启超 Liang Qichao — late Qing reformer", "胡适 Hu Shi — May 4th vernacular advocate", "钱钟书 Qian Zhongshu — Fortress Besieged author + scholar", "Modern: 王力 Wang Li (linguistics), 季羡林 Ji Xianlin (Indology)"]],
  [248, "Filosofi Cina", ["儒家 Confucian — Mencius, Xunzi, Zhu Xi (Neo-Confucian)", "道家 Daoist — Laozi, Zhuangzi", "墨家 Mohist — Mozi (universal love)", "Modern: 冯友兰 Feng Youlan — A Short History of Chinese Philosophy"]],
  [249, "Sociology", ["费孝通 Fei Xiaotong — From the Soil (rural China)", "Modern: 李银河 Li Yinhe — gender + sexuality", "Quantitative + qualitative", "Government data + private surveys both"]],
  [250, "History approach", ["史 shǐ — history (one of most ancient disciplines)", "陈寅恪 Chen Yinke, 范文澜 Fan Wenlan — modern masters", "24 Histories — official dynastic histories", "Modern: 葛剑雄, 钱穆 — different approaches"]],
  [251, "Linguistics", ["语言学 yǔyán xué — linguistics", "赵元任 Yuen Ren Chao — pioneer (US scholarship)", "Modern: 王力 Wang Li, 朱德熙 Zhu Dexi", "Chinese linguistics globally respected"]],
  [252, "Text analysis", ["古文 gǔwén — classical Chinese", "现代文 xiàndàiwén — modern Chinese", "Analysis: structure, theme, style, context", "Gaokao + Civil Service exam — analysis core"]],
  [253, "Reviews + criticism", ["书评 shūpíng — book review", "影评 yǐngpíng — film review", "Critic tradition: 鲁迅 essays, modern 王晓渔", "Online: 豆瓣 Douban — major review platform"]],
  [254, "Academic debate", ["论辩 lùnbiàn — debate", "Polite disagreement structures", "Citing authorities essential", "Chinese style: less adversarial, more synthesis"]],
  [255, "Defending thesis", ["答辩 dábiàn — public defense", "Committee + advisors", "Formal Q&A", "Chinese viva — earnest, respectful"]],
  [256, "Review B2.4 + paper", ["Recap academic mastery", "Write 2000-char paper + bibliography", "Topic: Chinese culture aspect", "Peer review feedback"]],
]);

const b2_5 = toSessions([
  [257, "Diplomatic register", ["外交辞令 wàijiāo cílìng — diplomatic language", "Formal forms of address", "中方 (Chinese side) vs 美方 — bilateral statements", "Heritage: Zhou Enlai diplomatic style"]],
  [258, "Diplomatic history", ["Qing late: unequal treaties + Opium Wars", "Republic: Sun Yat-sen Pan-Asianism", "Mao: Bandung Conference 1955 Non-Aligned", "Modern: BRI + RCEP + global ambitions"]],
  [259, "BRICS + South-South", ["BRICS expanded: + Egypt, Ethiopia, Iran, UAE 2024", "South-South cooperation pillar", "Counter-balance to West", "Yuan internationalization push"]],
  [260, "ASEAN + China", ["RCEP — Regional Comprehensive Economic Partnership", "China + ASEAN largest trading partners", "Bilateral: territorial disputes South China Sea", "Belt & Road financing major"]],
  [261, "UN role", ["Permanent Security Council seat", "Largest peacekeeping troop contributor among P5", "Increasing UN executive positions", "WTO membership 2001 — transformative"]],
  [262, "Leadership culture", ["Hierarchical Confucian heritage", "Decision-making top-down + consultative", "Mentorship + seniority", "Modern: technocratic + Party tracks"]],
  [263, "Management style", ["关系 guānxi central — relationship building", "面子 miànzi — face preservation", "Indirect communication preferred", "Modern hybrid Western + Chinese"]],
  [264, "Public speaking", ["Formal speech traditions classical", "Modern: state ceremonies + business launches", "Mao + Deng + Xi — different styles", "Audience: orchestrated + ritualized"]],
  [265, "Rhetoric Confucian", ["Classical rhetoric: 比兴 (allusion), 对偶 (parallelism)", "Quoting classics — sophistication marker", "Modern speech: classical phrases + Marxist", "Xi Jinping characteristic style"]],
  [266, "Famous speeches", ["Mao Zedong — Tian'anmen Oct 1 1949 founding", "Deng Xiaoping — South Tour 1992", "Modern: Xi Jinping policy speeches", "Cultural Revolution era — propaganda heritage"]],
  [267, "Modern speeches", ["Xi Jinping Two Sessions reports", "Premier work reports", "International forums: Davos, BRICS, UN", "Style: literary references + Marxist framework"]],
  [268, "Press conferences", ["发布会 fābù huì — press conference", "Spokesperson system: 华春莹, 毛宁 — Foreign Ministry", "Questions submitted/screened", "Wolf Warrior tone recent — more assertive"]],
  [269, "Political debates", ["NPC + CPPCC discussions", "Party discussions internal — less public", "Modern: televised Party Congress sessions", "Heritage: limited live spontaneity"]],
  [270, "Etiquette internasional", ["Bow + handshake mixed (Western + Chinese)", "Business card exchange — two hands", "Gift-giving protocol", "Banquet: seating + toasting hierarchy"]],
  [271, "Diplomacy challenges", ["US-China tensions: trade + tech + Taiwan", "EU complex: economic + values tension", "Russia partnership 'no limits'", "Global South leadership push"]],
  [272, "Review B2.5 + speech", ["Recap leadership + diplomacy", "Prepare 5-min public speech", "Topic choice + formal tone + chengyu", "Delivery + Q&A simulated"]],
]);

const b2_6 = toSessions([
  [273, "Tang poetry deep — Li Bai", ["李白 deeper: 月下独酌 Drinking Alone Under Moon", "蜀道难 Hard Roads to Shu — epic", "Daoist influence + romantic spirit", "1000+ poems survived"]],
  [274, "Du Fu — Sage of Poetry", ["杜甫 Dù Fǔ (712-770) — 诗圣 'Poet Sage'", "茅屋为秋风所破歌 — political-social commentary", "登高 Climbing High — autumnal melancholy", "Realist contrast to Li Bai's romanticism"]],
  [275, "Song ci 宋词", ["Song ci 宋词 — Song Dynasty lyrical poetry (set to music)", "苏轼 Su Shi (Su Dongpo) — 大江东去 'Eastward Yangzi'", "李清照 Li Qingzhao — female master, 声声慢 Slow Tune", "Different from Tang shi — more flexible form"]],
  [276, "Four Great Classical Novels", ["四大名著: 三国 + 水浒 + 西游 + 红楼", "Water Margin 水浒传 — Song outlaw heroes", "Romance of Three Kingdoms — historical fiction", "Journey to West + Dream of Red Chamber"]],
  [277, "Lu Xun's stories", ["Diary of a Madman — feudalism critique", "Ah Q True Story — Chinese national character", "Hometown 故乡 — childhood revisited", "Wandering 彷徨 — collection"]],
  [278, "Modern women writers", ["张爱玲 Eileen Chang (1920-1995) — Lust Caution, Half Lifelong Romance", "丁玲 Ding Ling — earlier feminist", "Modern: 王安忆, 残雪 Can Xue (avant-garde)", "Bestseller: 三毛 San Mao (Sahara Stories)"]],
  [279, "Science fiction — Liu Cixin", ["刘慈欣 Liú Cíxīn — Three-Body Problem 三体 trilogy", "Hugo Award 2015 — first Asian win", "Hard science fiction + cosmic scale", "Netflix adaptation 2024 global"]],
  [280, "Children's literature", ["杨红樱 Yang Hongying — Mo's Mischief series", "Modern: 沈石溪 Shen Shixi (animal stories), 曹文轩 Cao Wenxuan", "Heritage: 童话 — fairy tales", "Picture books rising"]],
  [281, "Manhua 漫画", ["漫画 mànhuà — Chinese manga/comics", "Web comics dominant — 漫画岛, 快看", "Heritage: 张乐平 Three-Hairs (1935)", "Modern: 知音漫客, 一人之下 Under One Person"]],
  [282, "Songwriting analysis", ["Mando-pop lyrics — poetic sophistication", "周杰伦 lyrics by Vincent Fang 方文山", "Chinese-style 中国风 lyrics: 青花瓷, 菊花台", "Modern: 五月天 Mayday lyricism Chinese diaspora"]],
  [283, "Theater modern", ["话剧 huàjù — spoken drama (modern)", "曹禺 Cao Yu — Thunderstorm 雷雨", "Modern: 林兆华, 孟京辉 — experimental", "Beijing People's Art Theatre — heritage venue"]],
  [284, "Film analysis", ["5 generations + 6th generation directors", "Film theory: 北京电影学院 Beijing Film Academy", "Modern blockbusters: 战狼 Wolf Warrior, 长津湖 Battle of Lake Changjin", "Independent: Jia Zhangke, Diao Yinan"]],
  [285, "Translation challenges", ["Chinese → English fundamental differences", "Topic-comment vs SVO restructuring", "Chengyu untranslatable directly", "Modern: AI translation + human refinement"]],
  [286, "Classical poetry composition", ["Try writing 5-char or 7-char line", "Tonal pattern + rhyme rules basic", "Subject + verb + object Tang style", "Reflection of cultural depth attempted"]],
  [287, "Literary criticism", ["文学批评 — literary criticism", "Heritage: 鲁迅 essays critical", "Modern: 王晓明 Wang Xiaoming, 戴锦华 Dai Jinhua", "Schools: socialist realism vs avant-garde"]],
  [288, "Review B2.6 + analysis", ["Recap Chinese literature tradition", "Write 2000-word literary analysis", "Context + structure + themes + style", "Chinese scholarship demonstration"]],
]);

const b2_7 = toSessions([
  [289, "HSK structure overview", ["HSK = 汉语水平考试 Hànyǔ Shuǐpíng Kǎoshì", "Old levels: HSK 1-6 (since 2010)", "New HSK 3.0 (rolling out 2021+): levels 1-9 (1-3 elementary, 4-6 intermediate, 7-9 advanced)", "Linguo B2 target: HSK 5 (old) / HSK 6 (new)"]],
  [290, "HSK 5 (B2) target", ["HSK 5: ~2500 chars, ~5000 vocab", "Listening 听力 — native speed", "Reading 阅读 — articles + narrative", "Writing 书写 — compose paragraphs from prompts"]],
  [291, "Vocabulary section", ["Core HSK 5 vocab list (~5000)", "Strategy: Anki SRS daily", "Beyond list: read native materials extensively", "Chinese podcasts + dramas for context"]],
  [292, "Hanzi mastery section", ["~2500 chars total HSK 5", "Most-frequent characters cover 80%+ texts", "Practice writing daily (motor memory)", "Recognition vs production — both needed"]],
  [293, "Listening section", ["Multiple speaker dialogues", "News + lectures + announcements", "Strategies: skim questions first, native speed unavoidable", "Practice with HSK Standard Course audios"]],
  [294, "Reading section", ["Articles, advertisements, narratives, opinion pieces", "Quick skim → close read targeted", "Inference from context", "Time management critical (45 questions in 45 min)"]],
  [295, "Writing section", ["Part 1: word ordering (sentence construction)", "Part 2: write paragraph from picture + word prompt", "~80 chars minimum per response", "Grammar + vocab + handwriting evaluated"]],
  [296, "HSK practice 1", ["Full mock vocab + listening section", "Time strict", "Identify weak areas", "Review study materials"]],
  [297, "HSK practice 2", ["Full mock reading + writing section", "Time: 45 + 40 min", "Strategy: efficient scanning + composition", "Time management"]],
  [298, "HSK practice 3", ["Combined sections — mini full test", "Cumulative weaknesses", "Targeted review by section", "Mental endurance training"]],
  [299, "Full mock HSK 5", ["~2 hours full simulation", "Real exam conditions", "Final calibration", "Confidence + endurance check"]],
  [300, "Scoring + analysis", ["Scoring: 100 each section, 300 total", "Pass: 180+ (60%+)", "Identify gaps + final review priorities", "When to retake — bi/triannual exam"]],
  [301, "Test day strategies", ["HSK held multiple times yearly", "Bring: ID + admission ticket + 2B pencil", "Sleep + nutrition prep", "Calm + focus management"]],
  [302, "Next steps post-HSK 5", ["HSK 6 (new levels 7-9) — advanced", "University in China — HSK 5 minimum many programs", "Career: business Chinese + cultural competency", "Continued immersion + travel"]],
  [303, "Beyond HSK", ["BCT — Business Chinese Test", "TOCFL — Test of Chinese as Foreign Language (Taiwan)", "TCSOL — Teaching Chinese certifications", "Academic Chinese — specialized fields"]],
  [304, "Final review + 再见", ["Recap 304 sessions complete", "Mandarin learning journey reflection", "Next steps: HSK 6, immersion China, professional", "再见 zàijiàn! Jiā yóu 加油 for HSK!"]],
]);

// ============================================================================
// Curriculum Assembly
// ============================================================================

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("mandarin")!,
  overview:
    "Program 304 sesi yang mengantar lo dari nol sampai percakapan near-native dalam Bahasa Mandarin (中文 Zhōngwén / 普通话 Pǔtōnghuà). Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Pedagogically structured untuk tonal language + 2 writing systems: Pinyin mastery + 4 tones drilled relentlessly A1.1 (Indo speakers' biggest hurdle), Hanzi gradual frequency-based intro A1.1 sesi 6 → ~150 A1, ~400 A2, ~1200 B1, ~2500 B2 (HSK 5 target). Grammar SVO + topic-comment structure unik, NO verb conjugation (time markers + aspect particles 了/着/过 instead, di A2.1 mastery), measure words obligatory dari A1.1 sesi 14, 把 disposal construction + 被 passive + complements (resultative/directional/potential) A2 onwards, classical influence + chengyu mastery B2. Imersi kultur Tionghoa 5000 tahun: Confucius 论语 + Laozi 道德经 + Buddhism arrival, dinasti Han→Tang→Song→Ming→Qing → Republic → PRC 1949 → Deng Xiaoping reforms 1978 → modern rise, Four Great Novels (Three Kingdoms + Water Margin + Journey to West + Dream of Red Chamber), Lu Xun → Mo Yan Nobel 2012 → Liu Cixin Three-Body Problem, Zhang Yimou + Wong Kar-wai + Ang Lee cinema, Jay Chou + C-pop, Peking opera + 京剧 + calligraphy 书法 + 国画, 8 great cuisines (Sichuan málà + Cantonese dim sum + heritage), tea culture 6 classifications, 关系 guanxi + 面子 face concept, Beijing Forbidden City + Great Wall + Shanghai modern, Tier-1 cities + tech giants (Alibaba, Tencent, ByteDance, Huawei), WeChat Pay + Alipay cashless revolution, Belt and Road, modern challenges (aging, 内卷 involution, 躺平 lying flat). Test prep B2.7: HSK 5 (Hànyǔ Shuǐpíng Kǎoshì, official Hanban/MOE) — diakui untuk study + work + visa China.",
  levels: [
    {
      code: "A1",
      name: "Elementary Foundation",
      description:
        "Fondasi Elementer. Pedagogically structured untuk tonal language Mandarin: Pinyin system mastery (21 initials + 6 finals), 4 tones + neutral drilled (mā/má/mǎ/mà minimal pairs critical untuk Indo speakers), tone pairs + sandhi rules (3+3→2+3), Hanzi gradual intro sesi 6 (frequency-based: 我/你/好/是/不 first). Grammar SVO basic: 是 shì (identity) + 有 yǒu (possession) + negation 不/没, modal verbs (想/可以/会/应该), measure words (个/本/张) integrated dari sesi 14 (essential Mandarin signature). Akhir A1: introduce diri sendiri, order di restoran, navigate routine, kuasai ~800 kata + ~150 hanzi.",
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
        "Pre-Intermediate. Aspect markers mastery (了 completed + 过 experiential + 着 durative state) — Mandarin signature tense system. Comparative structures (比 + adjective, 跟...一样, 最 superlative). Topic-comment structure introduced naturally (Mandarin pragmatic emphasis). 把 disposal construction (object before verb + result). Resultative + directional + potential complements (看见/走出来/看得见). Imersi: 8 great cuisines + dynasties (Han→Tang→Song→Ming→Qing) + Confucius/Laozi/Buddhism + 关系 guanxi + Tier-1 cities + tech giants. Vocab grow ~2000 kata + ~400 hanzi.",
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
        "Intermediate. Complex 把 + 被 passive + topic prominence deep, hypothetical (要是 + 就) + counterfactual (早知道) + 是...的 emphasis, 连...都 even + 越...越 progressive + 一...就 sequential, rhetorical questions (难道...吗), chengyu 成语 intro (4-char idioms classical heritage). Deep dive literatura: Confucius 论语 + Laozi 道德经 + Four Great Novels (三国/水浒/西游/红楼) + Lu Xun + Mo Yan Nobel 2012 + Yu Hua + Tang poetry (Li Bai + Du Fu). Cinema: Zhang Yimou + Wong Kar-wai + Ang Lee. C-pop heritage Jay Chou. Society: economy + One Child Policy heritage + 高考 Gaokao + healthcare + CCP + Belt and Road. Professional: 您 formal + business email + guanxi-driven negotiation + Alipay + WeChat Pay + tech giants. Vocab ~3500 + ~1200 hanzi.",
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
        "Upper Intermediate. Near-native expression: classical 文言文 traces + chengyu mastery (50+ active) + rhetorical patterns (排比 parallelism + 对偶 couplet) + reduplication + onomatopoeia. Academic Mandarin: 议论文 argumentative essay structure + intellectuals (Liang Qichao, Hu Shi, Qian Zhongshu, Fei Xiaotong, Feng Youlan) + philosophy (Confucian/Daoist/Mohist) + sociology + history + linguistics. Professional industry-specific: tourism, fashion, F&B 美团, design 王澍 Pritzker, diplomatic, journalism 财新, IT (BAT + TMD + AI giants), finance, art (Ai Weiwei + 798), translation, teaching CSL. Diplomatic register + Confucian rhetoric heritage + Xi Jinping era policies. Literary mastery: Tang poetry deep (Li Bai + Du Fu) + Song ci (Su Shi + Li Qingzhao) + Four Classics deep + Lu Xun's stories + modern women writers (Eileen Chang + Wang Anyi) + Liu Cixin Three-Body Problem + classical poetry composition attempt + literary criticism. Regional dialects awareness (Beijing 儿化 + Shanghai 沪语 + Cantonese + Hokkien + Hakka). Modern internet slang + 内卷 + 躺平 + 996 + 佛系 generational language. Persiapan HSK 5: ~2500 chars + ~5000 vocab, listening + reading + writing native speed. Vocab 5000+ + ~2500 hanzi.",
      sublevels: [
        { code: "B2.1", name: "Advanced Expression", sessions: b2_1, preview: true },
        { code: "B2.2", name: "Professional Mandarin", sessions: b2_2, preview: true },
        { code: "B2.3", name: "Near-Native Communication", sessions: b2_3, preview: true },
        { code: "B2.4", name: "Academic Mastery", sessions: b2_4, preview: true },
        { code: "B2.5", name: "Leadership & Diplomacy", sessions: b2_5, preview: true },
        { code: "B2.6", name: "Creative & Literary", sessions: b2_6, preview: true },
        { code: "B2.7", name: "Test Prep (HSK 5)", sessions: b2_7, preview: true },
      ],
    },
  ],
};

export default curriculum;
