import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

// ============================================================================
// A1 — Elementary Foundation (3 sublevels × 16 = 48 sesi)
// Pedagogy: Hangul mastery FAST (King Sejong scientific design) → honorifics EARLY
// ============================================================================

const a1_1 = toSessions([
  [1, "Hangul (한글) — invention story", ["Hangul invented 1443 by 세종대왕 (King Sejong the Great)", "Scientific phonetic design — consonants shape vocal organs, vowels based on sky/earth/human", "Designed to be learnable in DAYS, not months (UNIQUE writing system globally)", "Linguo's edge: Korean writing fastest mastery vs Japanese (3 systems) or Mandarin (Hanzi)"]],
  [2, "Hangul vowels (모음)", ["10 basic vowels: ㅏ(a) ㅑ(ya) ㅓ(eo) ㅕ(yeo) ㅗ(o) ㅛ(yo) ㅜ(u) ㅠ(yu) ㅡ(eu) ㅣ(i)", "Compound vowels: ㅐ(ae) ㅔ(e) ㅚ(oe) ㅙ(wae) ㅟ(wi) etc", "Vowel rules: bright (ㅏㅗ) vs dark (ㅓㅜ) — affects conjugation later", "Drill: read 아 야 어 여 오 요 우 유 으 이 — bisa hafal sesi 1!"]],
  [3, "Hangul consonants (자음)", ["14 basic: ㄱ(g/k) ㄴ(n) ㄷ(d/t) ㄹ(r/l) ㅁ(m) ㅂ(b/p) ㅅ(s) ㅇ(silent/ng) ㅈ(j) ㅊ(ch) ㅋ(k) ㅌ(t) ㅍ(p) ㅎ(h)", "Tense (쌍자음): ㄲ ㄸ ㅃ ㅆ ㅉ — doubled, harder/sharper", "Position determines sound: ㄱ at start = 'g', at final = 'k'", "ㅇ silent at syllable start, 'ng' at final position"]],
  [4, "Syllable blocks (음절)", ["Korean writes in SYLLABLE BLOCKS, not linear letters", "Structure: (Consonant) + Vowel + (받침 final consonant)", "한 = ㅎ + ㅏ + ㄴ (h + a + n)", "Block always reads top-to-bottom, left-to-right within"]],
  [5, "Salam — greetings", ["안녕하세요 (annyeonghaseyo) — formal hello (default for learners)", "안녕히 가세요 (annyeonghi gaseyo) — goodbye to person LEAVING", "안녕히 계세요 (annyeonghi gyeseyo) — goodbye SAID BY person leaving", "감사합니다 (gamsahamnida) — thank you formal"]],
  [6, "Perkenalan diri", ["저는 ___ 입니다 (jeo-neun ___ imnida) — formal: I am ___", "저는 ___ 예요/이에요 — polite informal: I am ___", "Use 예요 after vowel, 이에요 after consonant — phonetic rule", "이름이 뭐예요? (ireumi mwoyeyo?) — what's your name? casual"]],
  [7, "Honorific system — 존댓말 vs 반말", ["Korean has 5+ politeness levels — EARLIEST in language learning", "반말 (banmal) = casual (close friends, family younger)", "해요체 (haeyoche) = polite informal (DEFAULT FOR LEARNERS)", "합쇼체/하십시오체 = formal (business, public)"]],
  [8, "Polite informal ~아/어요", ["Most common register: ~아요/어요/여요 ending", "가다 (go) → 가요, 먹다 (eat) → 먹어요, 하다 (do) → 해요", "Vowel rule: ㅏㅗ stems → ~아요, others → ~어요, 하 → 해", "Question: same form + ↗ rising intonation: 가요?"]],
  [9, "Kebangsaan", ["인도네시아 사람이에요 (Indonesia saram iyeyo) — saya orang Indonesia", "Korea 한국 hanguk, USA 미국 miguk, Japan 일본 ilbon, China 중국 jungguk", "+ 사람 (saram=person) untuk nationality", "어느 나라 사람이에요? (eoneu nara saram iyeyo?) — orang mana?"]],
  [10, "Sino-Korean numbers (Hanja-derived)", ["일 (1), 이 (2), 삼 (3), 사 (4), 오 (5), 육 (6), 칠 (7), 팔 (8), 구 (9), 십 (10)", "USED FOR: dates, money, phone numbers, minutes, 분", "예: 1500원 (천오백 원), 2026년 (이천이십육년)", "Identical to Chinese 一二三四五 origin — Sino-Korean heritage"]],
  [11, "Native Korean numbers", ["하나 (1), 둘 (2), 셋 (3), 넷 (4), 다섯 (5), 여섯 (6), 일곱 (7), 여덟 (8), 아홉 (9), 열 (10)", "USED FOR: counting things, age, hours (시), people", "예: 한 시 (1 o'clock), 두 사람 (2 people), 스무 살 (20 years old)", "Pre-noun shortening: 하나 → 한, 둘 → 두, 셋 → 세, 넷 → 네"]],
  [12, "Numbers drill — when to use which", ["TIME: 시 (hour) = native, 분 (minute) = Sino — 두 시 삼십 분 (2:30)", "AGE: native — 저는 스물다섯 살이에요 (I'm 25)", "MONEY: always Sino — 오천 원 (5000 won)", "Indo speakers: drill drill drill — Korean's biggest hurdle daily"]],
  [13, "Keluarga (with respect)", ["아버지 (abeoji=ayah formal) / 아빠 (appa=papa casual)", "어머니 (eomeoni=ibu formal) / 엄마 (eomma=mama)", "Older sibling depends on speaker gender!", "형 (hyung — older brother spoken by male), 누나 (older sister by male)", "오빠 (oppa — older brother by female), 언니 (older sister by female)"]],
  [14, "Pronouns + topic particle 은/는", ["저 (jeo=I formal) vs 나 (na=I casual)", "당신 (dangsin=you) — careful! cold/formal; use name + 씨 instead", "은 (after consonant) / 는 (after vowel) = topic marker", "저는 학생이에요 (I am student)"]],
  [15, "Object particle 을/를", ["을 (after consonant) / 를 (after vowel) = direct object marker", "밥을 먹어요 (bab-eul meogeoyo) — eat rice", "물을 마셔요 (mul-eul masyeoyo) — drink water", "Particle attachment based on 받침 (final consonant) — Korean signature pattern"]],
  [16, "Review A1.1 + Seoul + Sejong", ["Recap Hangul + numbers + greetings + particles", "서울 Seoul — capital sejak Joseon 1392, populasi 10M", "세종대왕 (King Sejong) — invented Hangul, on 10,000 won note", "광화문 Gwanghwamun + 경복궁 Gyeongbokgung — Joseon palace"]],
]);

const a1_2 = toSessions([
  [17, "Verb 이다 — to be", ["___ 이에요 (after consonant) / ___ 예요 (after vowel)", "학생이에요 (I'm student), 의사예요 (I'm doctor)", "Negative: ~이/가 아니에요 — NOT (note ~이/가 subject particle)", "Formal version: ~입니다 / ~이/가 아닙니다"]],
  [18, "있다 vs 없다 — exist/not exist", ["있어요 (issoyo) = there is/have", "없어요 (eopsoyo) = there isn't/don't have", "친구 있어요 (chingu issoyo) = I have friends", "Honorific: 계시다 (gyesida) — when subject is respected person"]],
  [19, "Negation: 안 vs 못", ["안 + verb = don't (choice negation)", "안 가요 (don't go), 안 먹어요 (don't eat)", "못 + verb = cannot (inability negation)", "못 가요 (can't go — physical/circumstantial), 못 먹어요 (can't eat — allergy)"]],
  [20, "Korean food essentials", ["김치 (kimchi) — fermented cabbage, national identity dish", "비빔밥 (bibimbap) — mixed rice bowl with veggies + egg", "불고기 (bulgogi) — marinated grilled beef", "떡볶이 (tteokbokki) — spicy rice cakes, street food star"]],
  [21, "Di restoran", ["주세요 (juseyo) — please give me (universal order word)", "메뉴 (menu) — same as English loanword", "여기요! / 저기요! (yeogiyo/jeogiyo) — excuse me, call waiter", "계산해 주세요 (gyesanhae juseyo) — bill please"]],
  [22, "Particle 에 — location/time", ["에 (e) = at/in (static location) / at (time)", "학교에 있어요 (haggyo-e issoyo) — at school", "3시에 만나요 (3 si-e mannayo) — meet at 3", "Direction: 학교에 가요 (go to school)"]],
  [23, "Particle 에서 — location of action", ["에서 (eseo) = at/in (action happens here)", "학교에서 공부해요 — study AT school", "Vs 에 = static location only", "Korean particles strict — memorize via context"]],
  [24, "Time — 시 + 분 + 초", ["시 (hour) = native numbers — 한 시, 두 시, 세 시 (1, 2, 3 o'clock)", "분 (minute) = Sino — 삼십 분 (30 min)", "지금 몇 시예요? (jigeum myeot siyeyo?) — what time now?", "오전 (am), 오후 (pm), 아침 (morning), 저녁 (evening), 밤 (night)"]],
  [25, "Days + months", ["월요일 (Monday), 화요일 (Tuesday), ..., 일요일 (Sunday)", "월 (month): 일월 (Jan), 이월 (Feb), ..., 십이월 (Dec)", "일 (day): 일일 (1st), 이일 (2nd) — Sino", "오늘 (today), 내일 (tomorrow), 어제 (yesterday)"]],
  [26, "Daily routine verbs", ["일어나다 (wake up), 자다 (sleep)", "밥을 먹다 (eat rice/meal), 물을 마시다 (drink water)", "출근하다 (go to work), 퇴근하다 (leave work)", "Hagwon (학원) — cram school culture pervasive"]],
  [27, "Hobbies — 좋아하다", ["좋아하다 (johahada) = like + object particle", "음악을 좋아해요 (I like music)", "Combine verb-기 (nominalizer): 보기 (watching) → 영화 보기 좋아해요", "싫어하다 (sirohada) = dislike"]],
  [28, "Hangul mastery review", ["By now: fluent reading any Korean text", "Practice: read K-pop song titles + lyrics phonetically", "Speed-reading: signs, menus, subtitles", "Hangul advantage realized — vs Japanese still struggling kanji"]],
  [29, "Body parts + sakit", ["머리 (head), 눈 (eye), 코 (nose), 입 (mouth)", "손 (hand), 발 (foot), 배 (stomach)", "아프다 (apeuda) = hurts", "머리가 아파요 (meoriga apayo) — head hurts"]],
  [30, "Ke dokter", ["병원 (byeongwon) = hospital, 의사 (uisa) = doctor", "감기 (gamgi) = cold, 열 (yeol) = fever", "약 (yak) = medicine, 약국 (yakguk) = pharmacy", "괜찮아요 (gwaenchanayo) = it's okay / are you OK?"]],
  [31, "Belanja basics", ["얼마예요? (eolmayeyo?) = how much?", "비싸다 (expensive), 싸다 (cheap)", "원 (won) — Korean currency: 1000원 (천 원), 10000원 (만 원)", "카카오페이 (KakaoPay), 토스 (Toss) — Korean payment apps"]],
  [32, "Review A1.2 + Korean breakfast", ["Recap verbs + particles + food + time", "한식 아침 (Korean breakfast) — rice + soup + banchan (side dishes)", "밥 + 국 + 김치 + 반찬 — universal pattern", "Modern: 커피 + 토스트 western influence growing"]],
]);

const a1_3 = toSessions([
  [33, "Past tense ~았/었어요", ["Vowel rule: ㅏㅗ → ~았어요, others → ~었어요, 하 → 했어요", "가다 (go) → 갔어요 (went)", "먹다 (eat) → 먹었어요 (ate)", "하다 (do) → 했어요 (did)"]],
  [34, "Future ~을 거예요", ["~을/ㄹ 거예요 (eul/l geoyeyo) — will/intend to", "갈 거예요 (will go), 먹을 거예요 (will eat)", "Speaker certainty + plan", "Polite formal: ~을/ㄹ 겁니다"]],
  [35, "K-pop intro", ["K-pop = Korean pop, global cultural phenomenon since 2010s", "BTS (방탄소년단) — biggest globally, Grammy nominated", "BLACKPINK — Coachella headliner 2023", "NewJeans + IVE + aespa + LE SSERAFIM — 4th gen leaders"]],
  [36, "K-drama intro", ["오징어 게임 Squid Game (2021) — Netflix global phenomenon", "사랑의 불시착 Crash Landing on You — romance classic", "킹덤 Kingdom — zombie sageuk", "Modern: tvN + JTBC + Netflix Korea producing"]],
  [37, "K-cinema heritage", ["기생충 Parasite (Bong Joon-ho) — Oscar 2020 Best Picture FIRST non-English", "올드보이 Old Boy (Park Chan-wook) — vengeance trilogy", "버닝 Burning (Lee Chang-dong) — literary noir", "헤어질 결심 Decision to Leave (Park Chan-wook) Cannes 2022"]],
  [38, "Days/months past", ["어제 (yesterday), 그저께 (day before)", "지난 주 (last week), 지난 달 (last month), 작년 (last year)", "Combine with past tense: 어제 학교에 갔어요 — went to school yesterday", "Time expressions ALWAYS precede verbs"]],
  [39, "Question words", ["누구 (who), 무엇/뭐 (what), 어디 (where), 언제 (when)", "왜 (why), 어떻게 (how), 얼마 (how much/many)", "무슨 + noun (what kind of), 어떤 + noun (which/what)", "Korean: NO subject-verb inversion for questions"]],
  [40, "Polite vs formal — 합쇼체", ["~아/어요 = polite informal (default learners)", "~ㅂ니다/습니다 = formal polite (business, news, formal speech)", "Formal: 갑니다 (go), 먹습니다 (eat), 합니다 (do)", "When to switch: customer service, business, presentations, news anchors"]],
  [41, "Lokasi — 에 있다", ["~에 있다 (e itda) = be at place", "어디에 있어요? (where are you?)", "친구가 카페에 있어요 (friend is at cafe)", "Position words: 위 (up), 아래 (down), 안 (inside), 밖 (outside), 옆 (next to)"]],
  [42, "Asking directions", ["어떻게 가요? (eotteohge gayo?) — how do I go?", "직진 (jikjin = straight), 좌회전 (left turn), 우회전 (right turn)", "Distance: 멀어요 (far), 가까워요 (close)", "지하철역이 어디예요? (where is subway station?)"]],
  [43, "Transportasi", ["지하철 (jihacheol=subway), 버스 (beoseu=bus), 택시 (taeksi=taxi)", "KTX (Korea Train Express) — high-speed Seoul-Busan 2.5 hrs", "T-money — universal transit card", "카카오 T (KakaoT) — Korea's Uber dominant"]],
  [44, "Korean cities", ["서울 (Seoul) — capital, 10M, surrounded mountains + Han River", "부산 (Busan) — port city, 3.4M, beaches + Gyeongsang dialect", "제주 (Jeju Island) — UNESCO, volcanic, distinct language", "인천 (Incheon) — main international airport gateway"]],
  [45, "Verbs of motion", ["가다 (gada=go), 오다 (oda=come)", "걷다 (geotda=walk), 뛰다 (ttwida=run)", "돌아오다 (return), 떠나다 (leave)", "Direction particles: ~에 (to), ~에서 (from)"]],
  [46, "Want — ~고 싶다", ["~고 싶다 (~go sipda) = want to do verb", "가고 싶어요 (want to go), 먹고 싶어요 (want to eat)", "Subject change to 3rd person → ~고 싶어하다 (different verb!)", "Negative: ~고 싶지 않아요 (don't want to)"]],
  [47, "Can — ~ㄹ/을 수 있다", ["~ㄹ/을 수 있다 (l/eul su itda) = can do", "갈 수 있어요 (can go), 먹을 수 있어요 (can eat)", "Negative: ~ㄹ/을 수 없다 = cannot", "Different from 못 (cannot due to inability) — context-based"]],
  [48, "Review A1.3 + hallyu context", ["Recap past/future + K-content + can/want", "한류 (Hallyu) — Korean Wave globally since 2000s", "Soft power: K-pop, K-drama, K-beauty, K-food", "South Korea world's 6th biggest soft power index"]],
]);

// ============================================================================
// A2 — Pre-Intermediate (4 sublevels × 16 = 64 sesi)
// Pedagogy: Connectors → modifiers → honorifics deep → cultural foundation
// ============================================================================

const a2_1 = toSessions([
  [49, "~고 connector — and/then", ["~고 (~go) connects verbs/clauses (and/then)", "밥을 먹고 학교에 가요 — eat rice AND go to school", "Sequence neutral — doesn't imply cause", "Multiple ~고 chains possible: 일어나고, 밥 먹고, 학교 가요"]],
  [50, "~지만 — but", ["~지만 (~jiman) = but/although", "비싸지만 좋아요 — expensive but good", "Conjunction position: end of first clause", "Vs 그렇지만 (geureohjiman) sentence-initial 'however'"]],
  [51, "~아/어서 — because/and then", ["~아/어서 (~aseo/eoseo) = because OR sequential 'and then'", "비가 와서 안 가요 — because raining, won't go", "Sequential meaning: 일어나서 밥을 먹어요 — wake up THEN eat", "Context decides — Korean signature ambiguity"]],
  [52, "Adjective modifier ~ㄴ/은/는", ["Adjective + noun: needs modifier ending", "예쁜 꽃 (pretty flower) — 예쁘다 → 예쁜", "큰 집 (big house) — 크다 → 큰", "맛있는 음식 (delicious food) — 맛있다 → 맛있는 (specific verbs use 는)"]],
  [53, "Honorific subject — 께서", ["께서 (kkeseo) replaces 이/가 when subject is respected person", "할아버지께서 오세요 (grandfather is coming)", "Plus verb conjugates honorific too — combined respect", "Use: parents, grandparents, teachers, bosses, customers"]],
  [54, "Honorific verb — ~시-", ["~시- infix elevates verb to respect subject", "가다 → 가시다 → 가세요 (~siyo polite informal)", "먹다 → 잡수시다 (special — irregular honorific)", "주무시다 (sleep), 계시다 (be) — irregular honorifics"]],
  [55, "Special honorific verbs", ["먹다 → 잡수시다 (eat — for respected person)", "자다 → 주무시다 (sleep — for respected person)", "있다 → 계시다 (be at — for respected person)", "말하다 → 말씀하시다 (speak — for respected person)"]],
  [56, "Hangul 100% fluency", ["By now: read any text fluently", "Reading speed approaching native", "Practice: K-drama subtitles in Korean", "Comparison: Mandarin learners still ~300 chars at this stage"]],
  [57, "Adjective conjugation ~ㄴ/은", ["Adjectives conjugate similarly to verbs", "Polite: 예뻐요 (pretty), 좋아요 (good)", "Past: 예뻤어요 (was pretty)", "Negative: 안 예뻐요 (not pretty)"]],
  [58, "Comparisons — ~보다", ["A 보다 B + adjective = A more than B", "동생보다 형이 키가 커요 — brother is taller than younger sibling", "더 (deo) = more, 덜 (deol) = less", "훨씬 (hwolsin) = much more"]],
  [59, "Superlative — 제일/가장", ["제일 (jeil) = most/-est (colloquial)", "가장 (gajang) = most (formal)", "이 영화가 제일 재미있어요 — this movie is most fun", "Combined with adjective directly"]],
  [60, "Polite request ~아/어 주세요", ["~아/어 주세요 (~a/eo juseyo) = please do for me", "도와 주세요 (please help me)", "Different from ~으세요 (do please) — adds 'for benefit'", "Korean politeness multilayer pragmatic"]],
  [61, "Permission ~아/어도 돼요", ["~아/어도 돼요 (~a/eo do dwaeyo) = it's okay to do", "여기 앉아도 돼요? — can I sit here?", "Question form for asking permission", "Polite informal default"]],
  [62, "Prohibition ~으면 안 돼요", ["~으면 안 돼요 (~eumyeon an dwaeyo) = cannot/shouldn't", "여기서 담배 피우면 안 돼요 — cannot smoke here", "Public signs full of these patterns", "Strong prohibition: 절대 ~으면 안 돼요"]],
  [63, "Obligation ~아/어야 돼요", ["~아/어야 돼요 (~a/eo ya dwaeyo) = have to / must", "공부해야 돼요 — have to study", "Alternative: ~아/어야 해요 (more formal)", "Stress on social/practical obligation"]],
  [64, "Review A2.1 + 효 Confucian filial piety", ["Recap connectors + modifiers + honorifics + permissions", "효 (hyo) = filial piety — defining Korean cultural value", "Confucian heritage 600+ years (Joseon dynasty)", "Modern Korean society still hierarchical age-respect"]],
]);

const a2_2 = toSessions([
  [65, "Future intentions ~으려고 하다", ["~으려고 하다 (~euryogo hada) = intend to / plan to", "내일 가려고 해요 — plan to go tomorrow", "Difference from ~을 거예요 — more deliberate intention", "Common in planning conversation"]],
  [66, "Travel basics", ["여행 (yeohaeng) = travel", "여권 (yeokwon) = passport, 비자 (visa)", "관광 (gwangwang) = sightseeing", "Korea visa policy: visa-free 30 days many countries (Indo too)"]],
  [67, "Hotel booking", ["호텔 (hotel) + 모텔 (motel) + 펜션 (pension)", "예약하다 (yeyakhada) = reserve", "체크인/체크아웃 (check-in/out)", "Korean tradition: 한옥 스테이 (hanok stay) — traditional house"]],
  [68, "Airport — Incheon (ICN)", ["인천국제공항 (Incheon International) — main gateway, 4th best airport globally", "김포공항 (Gimpo) — domestic + nearby Asia", "부산 김해 (Busan Gimhae) — south", "Modern: 자동 출입국 (auto immigration) tech"]],
  [69, "Seoul districts", ["강남 (Gangnam) — Gangnam Style PSY fame, upscale", "홍대 (Hongdae) — university nightlife", "이태원 (Itaewon) — international, foreigner-friendly", "명동 (Myeongdong) — shopping + tourists, K-beauty haven"]],
  [70, "DMZ + division", ["DMZ (비무장 지대) — Demilitarized Zone, 4km wide", "Created 1953 armistice (not peace treaty!)", "JSA (Joint Security Area) — Panmunjom", "Tour: must book ahead, ID required, dress code"]],
  [71, "Jeju Island", ["제주도 (Jeju-do) — volcanic island UNESCO", "한라산 Hallasan — highest mountain Korea 1947m", "Honeymoon island heritage + tourism", "Jeju language (제주어) — distinct, UNESCO endangered"]],
  [72, "Profesi", ["선생님 (seonsaengnim=teacher — honorific built-in)", "의사 (uisa=doctor), 간호사 (ganhosa=nurse)", "회사원 (hoesawon=company employee)", "프로그래머 (peurogeuraemeo=programmer), 디자이너 (designer)"]],
  [73, "Wawancara kerja", ["면접 (myeonjeop) = interview", "이력서 (iryeokso) = resume", "자기소개 (jagi sogae) = self-introduction (rehearsed important)", "Korean interview: deep bows + formal language critical"]],
  [74, "CV — Korean format", ["Photo required (formal headshot)", "Personal info detailed (Korean convention)", "Education + work reverse chronological", "Cover letter (자기소개서) often longer than CV"]],
  [75, "Office Korean", ["회사 (hoesa) = company, 동료 (dongryo) = colleague", "사장님 (sajangnim=boss/owner — honorific)", "과장님 (gwajangnim=manager — honorific)", "Korean workplace: extreme hierarchy + age respect"]],
  [76, "Chaebol culture", ["재벌 (chaebol) — family-controlled conglomerates", "삼성 Samsung — biggest, electronics + everything", "현대 Hyundai — autos + heavy industry", "LG, SK, 롯데 Lotte — major chaebols"]],
  [77, "Nunchi (눈치) — read the room", ["눈치 (nunchi) — Korean cultural skill: sense others' feelings + situation", "Literally: 'eye measure'", "Successful Korean = high nunchi", "Western analogue: emotional intelligence + social awareness combo"]],
  [78, "Bisnis etiquette", ["Bow at greetings (15-30°)", "Two hands for business card exchange", "Pour for others — never self", "Don't refuse drink from senior — politely accept"]],
  [79, "회식 (hoesik) — work drinking", ["회식 (hoesik) — mandatory work dinner-drinking", "1차 (1st round dinner), 2차 (2nd round drinks), 3차 (karaoke 노래방)", "Soju 소주 + beer 맥주 mixing — 폭탄주 'bomb drink'", "Modern: declining but still strong, especially traditional companies"]],
  [80, "Review A2.2 + Busan culture", ["Recap business Korean + chaebol + nunchi", "부산 Busan — Korea's 2nd city, 3.4M population", "Beaches (해운대 Haeundae), seafood, BIFF film festival", "Gyeongsang dialect 사투리 distinct + assertive"]],
]);

const a2_3 = toSessions([
  [81, "~다고 생각하다 — I think", ["~다고/라고 생각하다 (dago saenggakhada) = I think that ___", "한국어가 어렵다고 생각해요 — I think Korean is hard", "Reported clause + 생각하다 reporting verb", "Most common opinion expression"]],
  [82, "~다고 말하다 — said that", ["~다고 / ~라고 말하다 = said that", "친구가 온다고 말했어요 — friend said they're coming", "Indirect speech essential daily", "Multiple variants: 했다, 그랬어요"]],
  [83, "~다고 하다 — hearsay", ["~다고 한다 / ~다고 해요 = (I heard/it is said) that", "비가 온다고 해요 — they say it's raining", "Indirect information source", "TV/news framing common"]],
  [84, "~을 것 같다 — looks like / probably", ["~을 것 같다 (eul geot gata) = seems like / probably", "비가 올 것 같아요 — looks like it'll rain", "Uncertainty + visual judgment combined", "Hedge marker — Korean prefers indirect"]],
  [85, "~을지도 모르다 — might", ["~을지도 모르다 (euljido moreuda) = might / who knows", "갈지도 몰라요 — I might go", "Stronger uncertainty than ~을 것 같다", "Negation: ~을지 모르겠어요 — I don't know if"]],
  [86, "Emotions vocab", ["기쁘다 (gippeuda=happy), 슬프다 (seulpeuda=sad)", "화나다 (hwanada=angry), 무섭다 (museopda=scared)", "긴장하다 (긴장 nervous), 행복하다 (haengbokhada=blessed/happy)", "Emotions ~아/어요: 기뻐요, 슬퍼요, 화나요"]],
  [87, "Apologizing", ["죄송합니다 (joesonghamnida) = I'm sorry FORMAL", "미안해요 (mianhaeyo) = sorry CASUAL", "미안 (mian) = sorry BANMAL (close friends)", "Korean apology layered by relationship + severity"]],
  [88, "Thanks register", ["감사합니다 (gamsahamnida) = thank you FORMAL", "고맙습니다 (gomapseumnida) = thank you FORMAL (native-derived)", "고마워요 (gomawoyo) = thanks POLITE INFORMAL", "고마워 (gomawo) = thanks BANMAL"]],
  [89, "Politik Korea modern", ["대한민국 (Daehan Minguk) — Republic of Korea formal", "대통령 (President): 5-year SINGLE term (no re-election)", "Current: Lee Jae-myung (since June 2025, Democratic Party)", "Conservative: 국민의힘 vs Progressive: 더불어민주당"]],
  [90, "Koran + media", ["조선일보 (Chosun) — conservative leader", "중앙일보 (JoongAng) — center-right", "한겨레 (Hankyoreh) — progressive", "KBS (public), MBC, SBS — major broadcasters"]],
  [91, "알다 vs 모르다", ["알다 (alda) = know — irregular conjugation", "알아요 (know), 알았어요 (knew/understood)", "모르다 (moreuda) = don't know — different irregular", "몰라요 (don't know), 몰랐어요 (didn't know)"]],
  [92, "Particles 도/만", ["도 (do) = also (replaces 은/는, 이/가, 을/를)", "저도 가요 — I also go", "만 (man) = only", "이것만 주세요 — only this please"]],
  [93, "Particles 밖에", ["밖에 (bakke) = only (with NEGATIVE verb!)", "이것밖에 없어요 — only this exists (literally: outside of this, nothing)", "Negative verb obligatory — Korean unique pattern", "Strong limitation emphasis"]],
  [94, "까지/부터 — until/from", ["까지 (kkaji) = until/to", "부터 (buteo) = from", "9시부터 5시까지 일해요 — work from 9 to 5", "Range expressions essential daily"]],
  [95, "Complex sentences", ["Combining ~고, ~지만, ~아서, ~으면 etc", "Korean loves chained clauses (literary heritage)", "Practice: write 1 paragraph daily journal", "Reading boost: K-drama subtitles target"]],
  [96, "Review A2.3 + cafe culture", ["Recap opinions + connectors + register", "Korean cafe culture extreme — Seoul highest cafe density globally", "스타벅스 + local chains (이디야, 투썸플레이스, 메가커피, 컴포즈)", "Cafe = study/work space (study cafe phenomenon)"]],
]);

const a2_4 = toSessions([
  [97, "Korean prehistoric — Gojoseon", ["고조선 (Gojoseon) — first Korean kingdom (2333 BCE legend)", "Dangun (단군) — mythical founder", "Bronze Age civilization peninsula", "Korean ethnogenesis heritage"]],
  [98, "삼국시대 — Three Kingdoms", ["고구려 (Goguryeo) — north, largest territory", "백제 (Baekje) — southwest, cultural exporter to Japan", "신라 (Silla) — southeast, eventual unifier 668 CE", "Korean heritage rooted in this era"]],
  [99, "Goryeo Dynasty 918-1392", ["고려 (Goryeo) — gives modern name 'Korea'", "Buddhism state religion, celadon ceramics heritage", "Mongol invasions 13th c. — vassal state", "Tripitaka Koreana — 80000 wood blocks Buddhist scripture"]],
  [100, "Joseon Dynasty 1392-1897", ["조선 (Joseon) — 500+ year dynasty", "Founded 이성계 (Yi Seong-gye) — Taejo", "Confucianism replaces Buddhism as state philosophy", "Yangban aristocracy + civil service exam system"]],
  [101, "Sejong + Hangul 1443", ["세종대왕 (King Sejong the Great, 1397-1450)", "Created Hangul to literate commoners (1443, published 1446)", "훈민정음 (Hunminjeongeum) — original Hangul document UNESCO", "Sejong Cultural Center + 10000 won note honor"]],
  [102, "Imjin War 1592-1598", ["임진왜란 — Hideyoshi's Japanese invasions", "이순신 (Yi Sun-shin) — turtle ship admiral, naval hero", "Ming China assistance — anti-Japanese coalition", "Sets up later Korean wariness of Japan"]],
  [103, "Japanese colonization 1910-1945", ["일제강점기 (Ilje Gangjeomgi) — Japanese occupation", "Cultural suppression: Hangul banned, Japanese names enforced", "Comfort women + forced labor — historical wounds", "Independence movement: 3.1 운동 (March 1, 1919)"]],
  [104, "Korean War 1950-1953", ["6.25 전쟁 (Yug-i-o War) — June 25 start", "North invades South, UN forces (US-led) intervene", "China enters, push-back to current line", "ARMISTICE not peace treaty — still technically at war"]],
  [105, "Division consequences", ["DMZ separation 1953", "Family separation — millions divided", "Cold War proxy state both sides", "Different writing systems gradually emerging"]],
  [106, "Park Chung-hee + Miracle", ["박정희 (Park Chung-hee) — military dictator 1961-1979", "Economic 'Miracle on the Han River' — rapid industrialization", "Saemaul Undong (New Village Movement)", "Authoritarian + economic — controversial legacy"]],
  [107, "Democratization 1987", ["6월 항쟁 (June Uprising 1987) — pro-democracy protests", "Direct presidential elections instituted", "End of military rule", "Korea transitions to democracy + sophistication"]],
  [108, "IMF Crisis 1997", ["IMF 외환위기 — Asian Financial Crisis", "Korean won collapses, IMF bailout", "Chaebol restructuring", "National humiliation memory — gold-collection campaign citizens"]],
  [109, "Sunshine Policy", ["햇볕정책 (Haetbyeot Jeongchaek) — Kim Dae-jung 1998-2008", "Engagement approach toward North Korea", "Mt. Kumgang + Kaesong joint projects", "Nobel Peace Prize 2000 — Kim Dae-jung"]],
  [110, "Modern Korea rise", ["Soft power explosion 2010s-now", "K-pop, K-drama, K-cinema global", "Industrial: Samsung, Hyundai, LG global brands", "Population aging + low birthrate crisis — fertility 0.72 (lowest globally 2023)"]],
  [111, "5 major cities", ["서울 Seoul (10M capital)", "부산 Busan (3.4M port + 2nd city)", "인천 Incheon (3M + airport)", "대구 Daegu (2.4M) + 광주 Gwangju (1.5M progressive heritage)"]],
  [112, "Review A2.4 + 설날 Lunar New Year", ["Recap history + cities", "설날 (Seollal) — Lunar New Year, biggest holiday", "세배 (sebae) — deep bow to elders", "떡국 (tteokguk) — rice cake soup eaten = +1 age (until 2023 reform)"]],
]);

// ============================================================================
// B1 — Intermediate (5 sublevels × 16 = 80 sesi)
// ============================================================================

const b1_1 = toSessions([
  [113, "Complex conjugation review", ["All verbs + adjectives polite/formal/casual", "~아/어요, ~ㅂ니다/습니다, ~ㄴ다/는다", "Hierarchy of formality clear", "Switch based on audience"]],
  [114, "~는데 / ~ㄴ데 / ~은데", ["Versatile contextual connector — multiple meanings!", "1. Contrast (but): 비싸지만 좋은데... — expensive but good", "2. Background: 한국에 갔는데 만났어요 — went to Korea AND met", "3. Soft objection: 좀 그런데... — well, that's a bit..."]],
  [115, "Reported speech ~라고/다고", ["~다고 (declarative), ~라고 (~이라고 after consonant - copula)", "~냐고 (question), ~자고 (suggestion), ~라고/으라고 (command)", "Mastery sign of intermediate Korean", "Indirect speech heavy in K-drama dialogue"]],
  [116, "Quotation marks usage", ["「」 vs '' vs \"\" — Korean uses both styles", "Direct quote: \"안녕\" 했어요 — said 'hi'", "Indirect: 안녕이라고 했어요 — said hi (reported)", "Newspaper convention 「」"]],
  [117, "~게 되다 — come to be", ["~게 되다 (ge doeda) = come to / end up", "한국에 가게 됐어요 — ended up going to Korea", "Passive change of circumstance", "Slight randomness/external cause"]],
  [118, "Causative ~게 하다", ["~게 하다 (ge hada) = make (someone) do", "어머니가 저를 공부하게 하셨어요 — mom made me study", "Direct causative form", "Different from passive — actor + recipient distinct"]],
  [119, "Nominalizer ~기", ["~기 (gi) = nominalize verb (less common)", "수영하기 좋아해요 — like swimming (nominal)", "공부하기 어려워요 — studying is hard", "More common in titles, instructions"]],
  [120, "Nominalizer ~는 것", ["~는 것 (neun geot) = thing (more common nominalizer)", "공부하는 것이 중요해요 — studying is important", "Vs ~기 — context determines preference", "Korean prefers ~는 것 in formal/written"]],
  [121, "~ㄹ/을 줄 알다", ["~ㄹ/을 줄 알다/모르다 = know/don't know HOW to do", "운전할 줄 알아요 — know how to drive", "Different from ~ㄹ/을 수 있다 (can) — skill specifically", "Idiomatic Korean expression"]],
  [122, "~ㄹ/을 뻔하다 — almost did", ["~ㄹ/을 뻔하다 (l/eul ppeonhada) = almost did", "넘어질 뻔했어요 — almost fell", "Used with past tense — narrow escape", "Drama queens love this construction"]],
  [123, "~을 정도로 — to extent that", ["~을/ㄹ 정도로 (eul/l jeongdoro) = to the extent that", "죽을 정도로 피곤해요 — tired to extent of dying", "Hyperbolic measurement", "Korean loves intensifiers"]],
  [124, "~을수록 — the more", ["~을수록 (eulsurok) = the more...", "공부할수록 어려워요 — the more I study, harder it gets", "Progressive correlation", "Common proverbial usage"]],
  [125, "~자마자 — as soon as", ["~자마자 (jamaja) = as soon as", "도착하자마자 전화하세요 — call as soon as you arrive", "Immediate sequence", "Different from ~아서 (which is gentler sequence)"]],
  [126, "Korean proverbs 속담", ["속담 (sokdam) — proverbs", "가는 말이 고와야 오는 말이 곱다 — kind speech invites kind response", "티끌 모아 태산 — small dust forms big mountain (saving)", "Heritage classical literature passed via oral"]],
  [127, "Korean humor — wordplay", ["Korean humor: wordplay, situational, self-deprecating", "Aegyo (애교) — cute behavior — drama trope", "Modern stand-up: Lee Yong-jin, Park Na-rae", "Variety show humor — Running Man heritage"]],
  [128, "Review B1.1 + joke culture", ["Recap reported speech + connectors", "유머 코드 — Korean humor codes", "K-drama comedy + K-variety", "Translation challenge: aegyo, nunchi humor doesn't translate"]],
]);

const b1_2 = toSessions([
  [129, "K-pop industry — Big 4", ["SM Entertainment — H.O.T pioneer, EXO, NCT, aespa, RIIZE", "JYP — Wonder Girls, TWICE, Stray Kids, ITZY, NMIXX", "YG — BIGBANG, BLACKPINK, BABYMONSTER", "HYBE — BTS, NewJeans (formerly), SEVENTEEN, ENHYPEN"]],
  [130, "BTS phenomenon", ["방탄소년단 (Bangtan Sonyeondan) — BTS debut 2013", "Members: RM, Jin, Suga, J-Hope, Jimin, V, Jungkook", "Global first: Grammy nominations, UN speeches", "Hiatus 2022 — military service, return announced"]],
  [131, "BLACKPINK + 4th gen", ["BLACKPINK — Jisoo, Jennie, Rosé, Lisa — 2016 debut", "First K-pop group Coachella headlining 2023", "4th gen pioneers: aespa (SM), IVE (Starship), LE SSERAFIM (HYBE)", "NewJeans phenomenon 2022 — minimalism aesthetic"]],
  [132, "K-drama industry", ["Major channels: tvN, JTBC (cable premium)", "Public: KBS, MBC, SBS", "Streaming: Netflix Korea, Disney+, Coupang Play", "Production companies: Studio Dragon, JTBC Studios"]],
  [133, "Squid Game phenomenon", ["오징어 게임 Ojingeo Game — Netflix global hit Sept 2021", "Director: Hwang Dong-hyuk, written 2009 unable to find producer", "Emmy 2022 — first non-English Best Actor (Lee Jung-jae)", "Season 2 + 3 — final season 2025-2026"]],
  [134, "K-cinema directors", ["봉준호 Bong Joon-ho — Parasite, Memories of Murder, Mother", "박찬욱 Park Chan-wook — Old Boy, Decision to Leave, Handmaiden", "이창동 Lee Chang-dong — Burning, Poetry, Secret Sunshine", "홍상수 Hong Sang-soo — prolific indie auteur"]],
  [135, "Parasite 2020", ["기생충 — Bong Joon-ho 2019/2020", "Cannes Palme d'Or 2019 — first Korean", "Oscar 2020: Best Picture (FIRST non-English) + Director + Original Screenplay + International Feature", "Class consciousness + dark humor + thriller"]],
  [136, "8 regional cuisines", ["Seoul: refined royal cuisine heritage", "Jeolla (Gwangju): elaborate banchan tradition", "Gyeongsang (Busan): seafood + bold flavors", "Jeju: pork-heavy, distinct island specialties"]],
  [137, "Korean BBQ deep", ["삼겹살 samgyeopsal — pork belly grilled", "갈비 galbi — marinated short rib", "불고기 bulgogi — sliced marinated beef", "Eat with: ssam (lettuce wrap), sangchu, perilla leaves"]],
  [138, "Banchan (반찬) culture", ["반찬 banchan — side dishes served with rice", "Typical meal: 3-12 banchan depending occasion", "Most served free at restaurants", "Heritage: 김치, 깍두기, 콩나물, 시금치, 멸치"]],
  [139, "Kimchi varieties", ["김치 — 200+ varieties documented", "Most common: 배추 김치 (napa cabbage)", "Others: 깍두기 (radish), 오이김치 (cucumber), 동치미 (water)", "UNESCO Intangible Heritage 2013 — kimjang making tradition"]],
  [140, "Buddhism + temples", ["불교 (Bulgyo=Buddhism) — arrived 4th century from China", "Major schools: Jogye Order dominant", "Temples: 해인사 (Haein-sa — Tripitaka Koreana), 통도사, 송광사", "Temple stay 템플스테이 — meditation experience"]],
  [141, "Confucian heritage", ["유교 (Yugyo=Confucianism) — defining Joseon dynasty", "Hierarchy + filial piety + education reverence", "Modern Korea: still permeates social structure", "Birthplace: Korea preserved Confucianism more strictly than China"]],
  [142, "Christianity in Korea", ["기독교 (Gidokgyo) — Christianity ~30% (highest East Asia)", "Catholic + Protestant blend", "Late 18th century arrival, persecution then growth", "Modern megachurches: Yoido Full Gospel Church — largest globally"]],
  [143, "Korean traditional arts", ["판소리 (pansori) — narrative singing, UNESCO", "사물놀이 (samulnori) — 4-instrument percussion", "탈춤 (talchum) — mask dance heritage", "한복 (hanbok) — traditional dress, modernized renaissance"]],
  [144, "Review B1.2 + hallyu impact", ["Recap K-content industry", "Hallyu impact: tourism, language learning, food, beauty industries", "Korea soft power index 11th globally 2024", "Future: K-pop 5th gen + K-cinema evolution"]],
]);

const b1_3 = toSessions([
  [145, "Ekonomi Korea", ["G20 member, 10th largest economy globally", "Manufacturing: semiconductors (Samsung, SK Hynix), autos (Hyundai)", "Tech: Naver, Kakao, Coupang dominant domestic", "Soft power exports: K-pop, K-drama, K-beauty"]],
  [146, "Chaebol structure", ["재벌 chaebol — family conglomerates dominate economy", "Top 5: Samsung, Hyundai, SK, LG, Lotte", "Cross-shareholdings + dynasty succession", "Reform efforts vs entrenched power tension"]],
  [147, "Aging + birthrate crisis", ["출산율 (chulsanyul=fertility) 0.72 in 2023 — LOWEST GLOBALLY", "Causes: housing, education costs, gender role rigidity, jobs", "Aging society 2017+ — replacement issue", "Government incentives — limited success"]],
  [148, "Suneung — 수능", ["수능 (Suneung) = College Scholastic Ability Test", "Single most-stressful exam — national flights delayed", "Determines university placement", "수험생 (suheomsaeng=test-taker) — special status"]],
  [149, "SKY universities", ["SKY — top 3: Seoul National (서울대), Korea (고려대), Yonsei (연세대)", "Hierarchy critical for career", "Like Ivy League — admission ~1-2%", "Other top: KAIST, POSTECH (tech)"]],
  [150, "Hagwon (학원) industry", ["학원 hagwon — cram school", "Multi-billion dollar industry", "Subject-specific: English, math, code", "Government regulation — caps on hours but enforcement weak"]],
  [151, "Healthcare system", ["국민건강보험 (NHIS) — universal coverage", "Affordable, comprehensive", "Specialty: plastic surgery global destination", "Telemedicine + AI integration growing"]],
  [152, "Welfare evolution", ["국민연금 (National Pension), 고용보험, 산재보험", "Comprehensive but aging crisis straining", "Modern: 기본소득 universal basic income debates", "Mom-and-pop business safety net weak"]],
  [153, "Politik — presidential system", ["대통령 (President) — 5-year SINGLE term (no re-election)", "Unicameral 국회 National Assembly — 300 seats", "Major parties: 더불어민주당 (Democratic, progressive) vs 국민의힘 (People Power, conservative)", "Polarization extreme since 2010s"]],
  [154, "Politik dynamics", ["Conservative + progressive alternating power", "Park Geun-hye impeachment 2017 — first president removed", "Yoon Suk-yeol martial law fiasco Dec 2024 → impeachment", "Lee Jae-myung wins snap election June 2025"]],
  [155, "Six-Party Talks heritage", ["6자회담 — Six-Party Talks: US, NK, SK, China, Russia, Japan", "Nuclear denuclearization negotiations 2003-2009", "Largely defunct now", "Modern: bilateral US-NK-SK + China role"]],
  [156, "South-North relations", ["남북관계 — alternating thaws + freezes", "Family separation issue ongoing", "Kaesong industrial complex closed 2016", "Both sides legally still at war (1953 armistice only)"]],
  [157, "Diaspora — Korean global", ["Korean Americans — 2M, oldest Asian American group", "Korean Chinese — Jilin Yanbian", "Koryo-saram — CIS (Soviet deportees descendants)", "Zainichi Korean — Japan (Japanese colonization legacy)"]],
  [158, "Comfort women issue", ["위안부 (Wianbu) — sexual slavery WWII Japanese army", "Survivor advocacy — \"Wednesday Demonstrations\" since 1992", "Comfort woman statue 평화의 소녀상 — diplomatic flashpoint", "Apology + reparations debates ongoing"]],
  [159, "Environment", ["Han River restoration model — 1980s clean-up success", "Air pollution — yellow dust from China seasonal", "Renewable transition + green new deal", "Carbon neutrality 2050 goal"]],
  [160, "Review B1.3 + newspaper", ["Recap society + economy + politics", "Read Chosun/JoongAng/Hankyoreh editorials", "Vocabulary: 정부 (government), 정책 (policy), 개혁 (reform)", "Korean current affairs daily following"]],
]);

const b1_4 = toSessions([
  [161, "Classical Korean literature", ["삼국유사 (Samguk Yusa) — Memorabilia of Three Kingdoms", "삼국사기 (Samguk Sagi) — historical chronicle", "향가 (Hyangga) — Silla era poetry, Hangul predecessor verse forms", "Korean literary heritage 1500+ years"]],
  [162, "Sijo (시조) — Korean classical poetry", ["시조 sijo — 3-line, 14-16 syllable lines, Korean signature", "Joseon dynasty literati tradition", "Modern revival: sijo composition contests", "Famous: 이황 Yi Hwang, 정철 Jeong Cheol heritage"]],
  [163, "Pansori — narrative singing", ["판소리 (pansori) — solo narrative singing + drum", "5 surviving repertoires: 춘향가 Chunhyangga, 심청가 Simcheongga, etc", "UNESCO Intangible Heritage 2003", "Modern revival: festival circuit"]],
  [164, "Han Yong-un — independence poet", ["한용운 (Han Yong-un) 1879-1944", "Buddhist monk + independence movement leader", "님의 침묵 (Nim-ui Chimmuk) — Silence of My Beloved (1926)", "Mystical poetry + national resistance"]],
  [165, "Yi Sang — modernist", ["이상 (Yi Sang) 1910-1937", "Modernist + surrealist pioneer", "오감도 (Ogamdo) — Crow's-Eye View — radical experiment", "Died of TB age 27 — tragic genius heritage"]],
  [166, "Han Kang — Nobel 2024", ["한강 (Han Kang) — Nobel Literature 2024 (FIRST Korean!)", "채식주의자 The Vegetarian — International Booker 2016", "소년이 온다 Human Acts (Gwangju Uprising 1980)", "작별하지 않는다 We Do Not Part — 4.3 Jeju massacre"]],
  [167, "Hwang Sok-yong", ["황석영 (Hwang Sok-yong) 1943-", "장길산 Jang Gil-san — historical epic", "오래된 정원 The Old Garden — democracy movement memory", "Modern realist Korean master"]],
  [168, "Park Min-gyu — surrealist", ["박민규 (Park Min-gyu) 1968-", "삼미 슈퍼스타즈의 마지막 팬클럽 Sammi Superstars' Last Fanclub", "Surrealist + fantastic modern Korean voice", "International translation growing"]],
  [169, "Modern women writers", ["조남주 Cho Nam-joo — Kim Ji-young Born 1982 (feminist sensation)", "김혜진 Kim Hye-jin, 배수아 Bae Suah — international", "전성태 Jeon Seong-tae, 백수린 Baek Sou-rin", "Translation boom Korean women writers 2010s-now"]],
  [170, "Webtoon — Korean digital comics", ["웹툰 (webtoon) — vertically scrolling digital comics", "Pioneer: Naver Webtoon, KakaoPage", "Adaptations: Sweet Home, All of Us Are Dead, Itaewon Class", "Global expansion: Webtoon (US), Tappytoon"]],
  [171, "사자성어 (Sasaja seongeo)", ["사자성어 — 4-character idioms from Hanja classical", "고진감래 (gojin gamnae) — bitter ends, sweet comes (perseverance)", "동고동락 (donggo dongnak) — share joys and sorrows", "Classical sophistication marker in Korean"]],
  [172, "Hanja (한자) heritage", ["한자 — Chinese characters used in Korean", "60-70% Korean vocabulary Sino-Korean origin", "Replaced by Hangul mainstream but knowledge gives word origins", "Important: legal documents + name origins"]],
  [173, "Sijo composition", ["Compose your own sijo (3 lines, classical Korean poetry)", "Themes: nature observation, personal feeling, philosophical reflection", "Modern sijo: free Hangul-only", "Workshop peer review"]],
  [174, "Modern Korean poetry", ["김수영 Kim Su-yeong — postwar modernist", "고은 Ko Un — Buddhist poet, longtime Nobel candidate", "김혜순 Kim Hyesoon — radical female voice", "황지우 Hwang Ji-u — minimalist heritage"]],
  [175, "K-drama as literature", ["K-drama scripts: high literary quality", "Famous writers: Kim Eun-hee (Kingdom), Park Hae-young (My Mister)", "Studio Dragon writing room culture", "Drama screenwriter prestige equivalent novelist"]],
  [176, "Review B1.4 + your sijo", ["Recap literature heritage", "Try composing 3-line sijo", "Topic: seasonal observation + emotion", "Class workshop feedback"]],
]);

const b1_5 = toSessions([
  [177, "Formal — 합쇼체 mastery", ["~ㅂ니다/습니다 — formal polite register", "~ㅂ니까?/습니까? — formal questions", "Used: business, news, presentations, customer service", "Wrong register = unprofessional impression"]],
  [178, "Business email Korean", ["존경하는 ___ 님께 (jongyeonghaneun ___ nimkke) — to respected ___", "안녕하세요 (universal greeting)", "감사합니다 / 잘 부탁드립니다 — closing formulas", "KakaoTalk + email both — Korean comm modern"]],
  [179, "Resume — Korean format", ["이력서 (iryeokseo) = resume", "Photo required (formal, recent)", "Personal info detailed (Korean convention)", "Cover letter (자기소개서) often longer + more important"]],
  [180, "Job application", ["채용 (chaeyong) = hiring", "공채 (gongchae) = open recruitment season", "Sites: 사람인, 잡코리아, 잡플래닛 major Korean job platforms", "Application volume insane — Suneung-level competitive"]],
  [181, "Business meetings", ["회의 (hoeui) = meeting", "Hierarchy seating strict — senior at head of table", "Speaking order — senior first", "Silence + nodding common ≠ disagreement"]],
  [182, "Negotiation Korean style", ["Relationship + trust building first", "Indirect refusal: 검토해 보겠습니다 (will consider) often = no", "Heavy 회식 socializing pre-deal", "Long-term focus + face preservation"]],
  [183, "Presentations", ["프레젠테이션 / 발표 (palpyo)", "PPT-heavy presentations (Korean signature)", "Senior allowed to interrupt", "Tone: formal, scripted, less impromptu"]],
  [184, "Marketing Korean", ["마케팅 (marketing) — same loanword", "Social media: KakaoTalk Channels, Instagram, YouTube", "Naver advertising — Korean's Google", "K-beauty + K-fashion direct-to-Asia marketing models"]],
  [185, "E-commerce Korea", ["쿠팡 Coupang — Amazon equivalent, leading", "11번가 11street, G마켓 Gmarket — older players", "Naver Shopping + Kakao Shopping — portal-integrated", "Live commerce 라이브커머스 — growing influencer model"]],
  [186, "Banking Korean", ["KB국민은행, 신한은행, 우리은행, 하나은행, 농협은행 — major 5", "Internet banks: 카카오뱅크 KakaoBank, 토스뱅크 TossBank, K뱅크", "Modern: 100% digital onboarding standard", "Foreign transfer regulations strict"]],
  [187, "Payment Korea", ["카카오페이 KakaoPay, 토스 Toss — top mobile payment", "네이버페이 Naver Pay, 페이코 Payco — alternatives", "QR code + NFC + barcode acceptance widespread", "Cash declining but not as extreme as China"]],
  [188, "Real estate — Jeonse system", ["전세 (jeonse) — UNIQUE Korean rental system", "Pay LARGE deposit (50-80% of property value), no monthly rent", "After 2 years, deposit returned in full", "Modern: declining due interest rates + house price changes"]],
  [189, "Tax basics", ["소득세 (sodeukse=income tax) progressive 6-45%", "주민세 (resident tax) — local", "부가가치세 (VAT) 10% standard", "연말정산 (yeonmal jeongsan) — year-end tax adjustment automatic"]],
  [190, "Legal basics", ["법 (beop) = law", "민법 (civil), 형법 (criminal), 상법 (commercial)", "변호사 (byeonhosa) = lawyer — sa-shi exam pass ~3%", "Litigation gradually rising"]],
  [191, "Remote work", ["재택근무 (jaetaek geunmu) = remote work", "COVID accelerated, then largely reversed (return to office strong)", "Big tech companies hybrid", "Traditional companies — physical presence valued"]],
  [192, "Review B1.5 + business sim", ["Recap business Korean", "Simulate 20-min job interview", "Self-intro + experience + nunchi awareness", "Feedback register + cultural cues"]],
]);

// ============================================================================
// B2 — Upper Intermediate (7 sublevels × 16 = 112 sesi)
// ============================================================================

const b2_1 = toSessions([
  [193, "Sino-Korean heritage deep", ["60-70% Korean vocab Sino-Korean", "Recognizing Hanja roots — vocabulary expansion shortcut", "Academic + legal heavy Hanja", "Modern: Hanja awareness optional but enriching"]],
  [194, "Sasaja seongeo mastery", ["50+ 사자성어 active vocab", "고진감래 (good after suffering), 진퇴양난 (caught between)", "Daily speech sprinkled — sophistication marker", "Reading literary: 사자성어 density high"]],
  [195, "Rhetorical patterns", ["대구법 (parallelism)", "반복 (repetition)", "은유 + 직유 (metaphor + simile)", "Korean rhetorical heritage classical + modern integration"]],
  [196, "Academic register", ["학술적 글쓰기 — academic writing", "Latinate-derived: 패러다임 (paradigm), 카테고리 (category)", "Passive impersonal: ~다고 한다 (it is said)", "Differing from spoken — formal + indirect"]],
  [197, "Argumentative essay", ["논증문 (nonjeungmun) — argumentative", "Structure: 서론 + 본론 + 결론", "Connectives: 첫째, 둘째, 셋째, 따라서, 결론적으로", "Suneung-style writing"]],
  [198, "Stylistic devices", ["비유 (biyu=metaphor), 의인화 (uijinhwa=personification)", "과장 (gwajang=exaggeration)", "반복 + 점층 — repetition + escalation", "Korean prose: emotional + indirect"]],
  [199, "Onomatopoeia + mimesis", ["의성어 (uiseongeo=onomatopoeia)", "의태어 (uitaeeo=mimesis — manner words)", "Korean SIGNATURE feature: 두근두근 (heart pounding), 반짝반짝 (sparkling), 졸졸 (water flowing)", "Korean richest globally in mimesis"]],
  [200, "Regional dialects 사투리", ["사투리 (saturi) — regional dialects", "표준어 (standard Korean) = Seoul-based", "Major regions: Gyeongsang, Jeolla, Chungcheong, Gangwon, Jeju", "Modern: media + education erosion but cultural pride"]],
  [201, "Gyeongsang dialect", ["경상도 사투리 — Busan + Daegu area", "Intonation: rising emphatic", "Vocabulary differences + assertive tone", "Famous: K-drama Busan + Yeongnam University setting"]],
  [202, "Jeolla dialect", ["전라도 사투리 — Gwangju + Jeonju area", "Distinctive intonation + vocabulary", "Heritage: more rural, food culture (Jeolla cuisine best)", "Famous: Cinema heritage many Jeolla settings"]],
  [203, "Chungcheong + Gangwon", ["충청도 — central, slow + drawn-out speech", "강원도 — east coast, mountainous, slower pace", "Subtle differences from Standard Seoul Korean", "Local pride preservation movements"]],
  [204, "Jeju language — distinct", ["제주어 — Jejueo, distinct from Korean (UNESCO endangered)", "Mutually unintelligible with standard Korean", "Speakers ~5000 fluent native", "Tourist Korean integration but core language threatened"]],
  [205, "North Korean variant", ["문화어 (Munhwa-eo) — North Korean standard", "Vocabulary differences (purification of Sino-Korean)", "Spelling + pronunciation conservative", "Mutually intelligible South + North"]],
  [206, "Slang + Gen Z language", ["존맛 (joenmas) — extremely delicious (slang)", "헐 (heol) — OMG/seriously?", "ㅋㅋㅋㅋ (kkk) — lol (online)", "Modern: TikTok-driven neologisms rapid"]],
  [207, "Modern neologisms", ["혼밥 (honbap=eating alone) — solo dining boom", "혼술 (honsul=drinking alone)", "N포 세대 — N-give-up generation (gave up multiple things)", "워라밸 (work-life balance) — Korean priorities shifting"]],
  [208, "Review B2.1 + classical-style essay", ["Recap formal + dialects + style", "Write argumentative essay 1000 chars", "Include 사자성어 + rhetorical devices", "Self-assessment Suneung rubric"]],
]);

const b2_2 = toSessions([
  [209, "Korean for tourism", ["관광 산업 — tourism industry", "K-content + K-beauty + K-food driving inbound", "30M+ inbound tourists pre-pandemic", "Major: Seoul, Busan, Jeju + temple stay, hanok stay experiences"]],
  [210, "K-fashion + K-beauty", ["K-패션 + K-뷰티 — global influence", "Brands: Gentle Monster (sunglasses), Mardi Mercredi", "K-beauty: Innisfree, Laneige, COSRX, Sulwhasoo (Amorepacific)", "Seoul Fashion Week — twice yearly"]],
  [211, "Korean for F&B", ["요식업 (yosigeop) = F&B industry", "Famous chefs: Edward Lee, Seungho Lee, Jeong Kwan (temple food)", "Michelin Seoul Guide growing", "BHC, BBQ, Kyochon — Korean fried chicken chains globally"]],
  [212, "Korean for design", ["디자인 (design)", "Heritage: Hanok architecture, modern: David Chipperfield amazing Korean buildings", "Design firms: SM Entertainment design + cosmetic packaging", "Seoul Design Foundation events"]],
  [213, "Korean for diplomacy", ["외교부 (Foreign Ministry)", "Heritage: Six-Party Talks, ASEAN+3, peacekeeping contributions", "Major partners: US (alliance), China (trade), Japan (complicated)", "Soft power leverage growing"]],
  [214, "Korean for journalism", ["언론업 (eonron eop) — journalism industry", "Public broadcasters: KBS, MBC, EBS", "Private: SBS, JTBC, channel A", "Press freedom mixed — declining recent years"]],
  [215, "Korean for academia", ["대학원 (graduate school) — competitive entry", "학위 (degrees): 학사 (bachelor's), 석사 (master's), 박사 (PhD)", "Top universities + research institutes", "Publishing race — SCI/SCOPUS prestige"]],
  [216, "Korean for law", ["법조계 — legal industry", "사법시험 (Sasi exam) replaced by 변호사 시험 (Byeonhosa exam)", "Lawyer scarcity but growing", "Constitutional Court active modern"]],
  [217, "Korean for medicine", ["의료계 — medical field", "Specialty: plastic surgery global destination", "Universal healthcare — accessible", "Modern: telemedicine + AI integration"]],
  [218, "Korean for engineering", ["엔지니어링", "Semiconductors: Samsung, SK Hynix global dominance", "Autos: Hyundai, Kia", "Shipbuilding: Hyundai Heavy, Daewoo, Samsung Heavy"]],
  [219, "Korean for IT", ["IT 업계 — tech industry", "Major: Naver (search), Kakao (messaging+more), Coupang (e-commerce)", "Startups: Toss, Krafton (PUBG), Hyperconnect", "Game industry: Nexon, NCSoft, Smilegate globally competitive"]],
  [220, "Korean for finance", ["금융계 — finance industry", "KOSPI + KOSDAQ stock exchanges", "Won (원) — Korean currency, currency controls present", "Modern: ETF growth + retail investing boom"]],
  [221, "Korean for art", ["예술계 — art industry", "Modern: KIAF (Korea International Art Fair)", "Artists global: Lee Bul, Do Ho Suh, Yang Haegue", "K-art crossover with K-content soft power"]],
  [222, "Korean for translation", ["번역 (beonyeok=translation) + 통역 (tongyeok=interpretation)", "Korean-English high demand both directions", "K-content translation booming (Netflix Korea, etc)", "Literary translation: Deborah Smith (Han Kang translator)"]],
  [223, "Korean for KSL teaching", ["KSL — Korean as Second Language", "한국어 교사 (hangugeo gyosa=Korean teacher)", "King Sejong Institute — global Korean education", "Cool Korea — soft power export, growing institutes"]],
  [224, "Review B2.2 + portfolio", ["Recap industry verticals", "Build professional Korean portfolio chosen sector", "50+ specialized terms glossary", "Case study real Korean business"]],
]);

const b2_3 = toSessions([
  [225, "Tone modulation Korean", ["5-level register switching mastery", "Within formal: customer service vs presentations", "Cultural intuition — read situation precisely", "Mastering Korean register = core fluency"]],
  [226, "Nunchi (눈치) mastery", ["눈치 빠르다 — fast at reading the room", "눈치 없다 — clueless socially", "Reading subtext: tone, pace, body language, silence", "Korean's high-context culture fundamental"]],
  [227, "Small talk Korean", ["Weather, food, family — safe topics", "Drama recommendations + K-content excellent ice-breaker", "Age inquiry — culturally normal (determines hierarchy)", "Politics — avoid initially"]],
  [228, "Tabu kultur", ["Direct age + salary inquiry — actually NORMAL Korean (age determines speech)", "Religion — handle carefully", "Politics — polarized, avoid with strangers", "Comments about appearance — Korean directness varies"]],
  [229, "Sensitivitas religi", ["Christianity ~30% (Catholic + Protestant)", "Buddhism ~16%", "Non-religious ~50%", "Shamanism + folk religion subsurface"]],
  [230, "Humor decoded", ["Korean humor: wordplay, self-deprecation, situational", "K-variety: Running Man, 무한도전 Infinite Challenge heritage", "Korean stand-up rising: Park Na-rae, Lee Yong-jin", "Aegyo (애교) — cute behavior comedy"]],
  [231, "Politik conversation", ["Polarized — avoid initially with new contacts", "Among trusted friends — careful approach", "Topics: chaebol reform, NK, gender, education hot", "Strong opinions both progressive + conservative"]],
  [232, "Dinamika keluarga", ["효 filial piety — defining virtue", "Hierarchy by age + role intense", "Spring Festival + Chuseok — mandatory family", "Modern: city singletons resisting traditional norms"]],
  [233, "Friendship Korean", ["Slow to build deeply — formal initial period", "Once friends — for life, hierarchical (age-based)", "Drinking culture builds bonds 회식", "Same-age friendship 친구 most cherished"]],
  [234, "Romance language", ["사랑해 (saranghae) = I love you — strong, special", "좋아해 (joahae) = I like you (lighter, often romantic)", "Heart symbols common (애교)", "Wedding traditions: hanbok, pyebaek ceremony"]],
  [235, "Conflict resolution", ["Indirect — preserve face both sides", "Senior mediation common", "Apology + accept gracefully", "Avoid direct confrontation — nunchi essential"]],
  [236, "Reading newspaper fluent", ["Daily news habit valuable", "Chosun/JoongAng (conservative) vs Hankyoreh/Kyunghyang (progressive)", "Online: Naver News aggregation dominant", "Vocabulary: 정부, 정책, 개혁"]],
  [237, "Watching TV no subs", ["KBS, MBC, SBS, JTBC, tvN", "K-drama natural language exposure", "Variety shows — challenging but pay off", "Streaming: Netflix Korea, Tving, Coupang Play"]],
  [238, "Korean podcasts", ["팟빵 (Podbbang) — Korean podcast app", "Major podcasts: 김어준의 뉴스공장 (politics), 책읽아웃 (literature)", "Korean podcasts mature ecosystem", "Audio drama 오디오 드라마 growing"]],
  [239, "Korean radio", ["라디오 — major stations FM/AM", "MBC + KBS + SBS radio heritage", "Music + talk + news mix", "Modern: streaming on apps"]],
  [240, "Review B2.3 + real conversation", ["Recap pragmatics + cultural decoding", "Simulate 30-min native conversation", "Topics free: politics, food, art, work, K-content", "Self-assessment fluency + cultural sensitivity"]],
]);

const b2_4 = toSessions([
  [241, "Academic register advanced", ["학술적 글 — academic writing", "Sentence patterns: ~에 따르면 (according to), ~을 고려할 때 (considering)", "Latinate equivalents: 패러다임, 컨센서스", "Reading: 사회과학 + 인문학 journals"]],
  [242, "Paper structure", ["초록 (chorok=abstract), 키워드, 서론 (introduction)", "본론 (body), 결론 (conclusion), 참고문헌 (references)", "Korean academic — discursive + data-balanced", "APA + Korean conventions"]],
  [243, "Citing sources", ["KSCI — Korean Citation Index", "Author-date system", "각주 (footnotes) classical", "Plagiarism (표절 pyojeol) — increasingly enforced"]],
  [244, "Academic conferences", ["학회 (hakhoe) = academic society + conference", "발표 (palpyo) = presentation", "Hierarchy emphasized", "International: NRF (National Research Foundation) sponsorship"]],
  [245, "Thesis writing", ["학위논문 (hakwi nonmun) = thesis", "학사논문 (~30pp), 석사 (~80-120pp), 박사 (200-400pp)", "공개심사 (open defense)", "Plagiarism cases scandalous — increased scrutiny"]],
  [246, "Universities deep", ["SKY top 3: Seoul Nat'l, Korea, Yonsei", "Other top: KAIST + POSTECH (science), Sungkyunkwan (Samsung-backed)", "Regional flagship: Pusan Nat'l, Kyungpook Nat'l", "Liberal arts: Sogang, Ewha (women's)"]],
  [247, "Intellectuals", ["함석헌 Ham Seok-heon — postwar thinker", "최인훈 Choe In-hun — novelist + critic", "박노자 Vladimir Tikhonov — modern public intellectual (Russian-Korean)", "Modern: 김누리 Kim Nuri (German studies critique Korean society)"]],
  [248, "Korean philosophy", ["퇴계 이황 Yi Hwang (1501-1570) — Neo-Confucian master", "율곡 이이 Yi I (1536-1584) — counterpart", "Joseon Neo-Confucianism debate heritage", "Modern: Korean philosophy emerging — postcolonial + East-West"]],
  [249, "Sociology", ["김덕영 Kim Duk-yong — modernization theory", "한국사회학 — Korean sociology mature field", "Hot topics: gender, generation conflict, inequality", "Quantitative + qualitative research"]],
  [250, "Historiography", ["한국사 (Hanguksa) — Korean history field", "Modern figures: 이기백, 한영우, 백낙청", "Colonial period historiography debates intense", "New approaches: women's history, microhistory"]],
  [251, "Linguistics", ["국어학 (Gugeohak) — Korean linguistics", "Heritage: 주시경 Ju Si-gyeong (Hangul reform)", "Modern: 김방한, 송재목", "Korean linguistics globally respected"]],
  [252, "Text analysis", ["문학 비평 (literary criticism)", "Korean prose analysis tradition strong", "Suneung literary analysis structured", "Modern: cultural studies expanding"]],
  [253, "Reviews + criticism", ["서평 (seopyeong=book review)", "Critic tradition: 백낙청 Paik Nak-chung (modernist heritage)", "Modern: 신형철 Shin Hyeong-cheol (most active modern critic)", "Online: 알라딘 + 예스24 review platforms"]],
  [254, "Academic debate", ["논쟁 (nonjaeng) = debate", "Polite disagreement structures", "Hierarchy + position considered", "Korean style: synthesis-oriented, not adversarial"]],
  [255, "Defending thesis", ["논문 심사 — thesis review", "Committee + advisors panel", "Formal Q&A", "Korean viva — earnest, respectful, hierarchical"]],
  [256, "Review B2.4 + paper", ["Recap academic mastery", "Write 2000-word paper + bibliography", "Topic: Korean culture aspect", "Peer review feedback"]],
]);

const b2_5 = toSessions([
  [257, "Diplomatic register", ["외교 언어 — diplomatic language", "Formal forms of address — 각하 (His/Her Excellency)", "Ministry style: indirect + careful", "Korean diplomatic style: pragmatic + balance"]],
  [258, "Diplomatic history", ["Late Joseon: opening to West + Japan late 19th c.", "Colonial 1910-1945 disrupted independence", "Postwar: US alliance pillar", "Modern: balancing US-China, normalization Japan 1965"]],
  [259, "UN role", ["UN member since 1991 (with North Korea)", "Ban Ki-moon — UN Secretary General 2007-2016", "Peacekeeping: troops Lebanon + South Sudan", "Modern: middle power initiative"]],
  [260, "ASEAN + Korea", ["ASEAN+3 (Korea, Japan, China)", "New Southern Policy — outreach SE Asia", "Cultural exports + business expansion", "Indonesia + Vietnam + Thailand key partners"]],
  [261, "Leadership culture", ["Hierarchical Confucian heritage", "Decision: top-down + face-saving consultation", "Mentorship 사수-부사수 (senior-junior)", "Modern: change-resistant traditional, agile newer companies"]],
  [262, "Management style", ["빨리빨리 (palli-palli) — fast-fast culture", "Long working hours + drinking + group cohesion", "Modern Korean management: hybrid East-West", "Chaebol management still hierarchical"]],
  [263, "Public speaking", ["연설 (yeonseol=speech)", "Formal tradition + scripted style", "Bowing + measured pace", "Less Western-style impromptu"]],
  [264, "Rhetoric Confucian", ["Classical rhetoric: 4-character idioms, parallelism", "Quoting classics — sophistication", "Modern speech: classical references + populist", "Korean speech: emotional + indirect"]],
  [265, "Famous speeches", ["김구 Kim Gu — independence-era speeches", "박정희 Park Chung-hee — economic development", "김대중 Kim Dae-jung — Nobel speech 2000", "노무현 Roh Moo-hyun — populist heritage"]],
  [266, "Modern speeches", ["문재인 Moon Jae-in — DMZ inauguration", "Yoon Suk-yeol martial law speech (notorious)", "Lee Jae-myung — current president", "International forums: G20, UN GA"]],
  [267, "Press conferences", ["기자회견 (gija hoegyeon=press conference)", "Heritage: tradition of senior Q&A", "Modern: more frequent + scripted", "Tensions: Korean press freedom mixed"]],
  [268, "Political debates", ["TV debates election season", "Conservative vs progressive sharp", "Moderator-controlled format", "Modern: YouTube + alternative channels growing"]],
  [269, "Etiquette internasional", ["Bow + handshake mixed", "Business card 2 hands exchange", "Gift culture moderate (not as intense as Japan)", "Banquet: seating + toasting hierarchy"]],
  [270, "Diplomacy challenges", ["US alliance vs China economic ties", "Japan: history + economy tension", "North Korea: ongoing nuclear + missile issues", "Middle power identity: balance + autonomy"]],
  [271, "Modern global Korea", ["G20 + middle power initiatives", "Climate + development assistance", "Cultural diplomacy via hallyu", "Diaspora engagement"]],
  [272, "Review B2.5 + speech", ["Recap leadership + diplomacy", "Prepare 5-min public speech", "Topic + formal tone + 사자성어", "Delivery + Q&A simulated"]],
]);

const b2_6 = toSessions([
  [273, "Sijo deep", ["3 lines, 14-16 syllables each, Korean classical signature", "Joseon literati tradition — Yi Hwang, Jeong Cheol", "Modern revival: Sijo Society of America (English sijo)", "Composition: nature + emotion + philosophical turn"]],
  [274, "Pansori repertoires", ["5 remaining: 춘향가, 심청가, 흥보가, 적벽가, 수궁가", "Famous singers: 박동진, 김소희 heritage", "Modern revivalists: Lee Ja-ram, Park Ae-ri", "UNESCO Intangible Heritage 2003"]],
  [275, "Classical literature heritage", ["삼국유사 (Memorabilia of Three Kingdoms)", "구운몽 (Cloud Dream of the Nine) — Kim Man-jung 17th c.", "Heritage: oral + written transitioning Joseon", "Pansori novels — fictional epics"]],
  [276, "Han Yong-un deep", ["승려 (monk) + 독립운동가 (independence activist)", "Manhae Foundation — modern preservation", "님의 침묵 — multilayered: lover + nation + Buddha", "Translation: 'Silence of My Beloved'"]],
  [277, "Yi Sang's experiments", ["오감도 — radical 1930s modernism", "Architectural training + literature crossover", "Tuberculosis + early death — tragic", "Influence: postwar Korean modernism"]],
  [278, "Han Kang phenomenon", ["채식주의자 Vegetarian — International Booker 2016 Deborah Smith trans", "소년이 온다 Human Acts — Gwangju Uprising 1980", "작별하지 않는다 We Do Not Part — Jeju 4.3 1948", "Nobel 2024 — Korean literature global moment"]],
  [279, "Hwang Sok-yong", ["장길산 — historical bandit epic", "오래된 정원 — democracy movement memory", "Long PEN activism, North Korea visits controversy", "Korean realist master"]],
  [280, "Modern women writers", ["김혜진 Kim Hye-jin — translated globally", "배수아 Bae Suah — experimental fiction", "조남주 Cho Nam-joo — 82년생 김지영 (Kim Ji-young Born 1982)", "Translation boom 2010s — Deborah Smith catalyst"]],
  [281, "Webtoon as literature", ["Webtoon storytelling sophisticated — film adaptations frequent", "Naver Webtoon + Kakao + Lezhin major platforms", "Genres: romance, fantasy, slice-of-life, thriller", "Award category recognition growing"]],
  [282, "Songwriting analysis", ["K-pop lyrics: increasingly literary modern", "BTS lyrics layered + meaningful (often Suga / RM written)", "Indie K-pop: Jaurim, Crying Nut", "Modern: lyricists prized creators"]],
  [283, "Theater modern", ["국립극단 — National Theater Company", "Modern playwrights: Oh Tae-suk, Lee Hyun-hwa", "한국 연극 — Korean theater scene Daehakro hub", "Experimental + commercial both thriving"]],
  [284, "Film analysis", ["6 generations Korean cinema", "Modern: Bong Joon-ho, Park Chan-wook + young (Bora Kim, Jeong Ga-young)", "Film theory: Korean Film Archive heritage", "Independent: Yeonghwasa Bohemian scene"]],
  [285, "Translation challenges", ["Korean → English fundamental difference", "Honorifics impossible direct translation", "Nunchi, han, jeong — cultural concepts", "Deborah Smith's debate — fidelity vs adaptation"]],
  [286, "Sijo composition advanced", ["Write classical sijo with cultural depth", "Subject + reflection + turn structure", "Modern revival possible with Hangul innovation", "Workshop refinement"]],
  [287, "Literary criticism", ["문학 비평 — literary criticism", "Heritage: 백낙청 Paik Nak-chung", "Modern: 신형철 Shin Hyeong-cheol active critic", "Schools: minjung literature heritage vs aesthetic"]],
  [288, "Review B2.6 + analysis", ["Recap Korean literature tradition", "Write 2000-word literary analysis", "Context + structure + themes + style", "Korean scholarship demonstration"]],
]);

const b2_7 = toSessions([
  [289, "TOPIK structure", ["TOPIK = 한국어 능력시험 (Test of Proficiency in Korean)", "TOPIK I (Beginner) — Levels 1-2", "TOPIK II (Intermediate-Advanced) — Levels 3-6", "Linguo B2 target: TOPIK II Level 4 (intermediate-advanced)"]],
  [290, "TOPIK levels", ["Level 1 (~80 hrs study) — survival Korean", "Level 2 (~200 hrs) — basic daily", "Levels 3-4 (~400-1000 hrs) — intermediate (university entry)", "Levels 5-6 (~1500+ hrs) — advanced (graduate study, professional)"]],
  [291, "TOPIK II target", ["TOPIK II Level 4: intermediate-advanced", "Vocabulary ~4000+ words", "Reading: editorials, articles, narrative", "Listening: native speed dialogues"]],
  [292, "Vocabulary section", ["TOPIK II vocab list — comprehensive", "Strategy: SRS (Anki) daily", "Hanja roots accelerate vocab acquisition", "Native materials reading essential"]],
  [293, "Grammar section", ["Grammar patterns TOPIK II — 200+ key patterns", "Common: ~는 김에, ~던, ~았/었더라면", "Practice: TOPIK Kim Eun-Kyong textbook + 한국어 교재 official", "Mock tests Korean Education Foundation"]],
  [294, "Reading section", ["Articles, opinion pieces, narratives, instructions", "Skim → close read targeted", "Inference from context — Korean indirectness", "Time management critical (60 questions in 70 min)"]],
  [295, "Listening section", ["Multiple speakers, dialogue + monologue + announcements + lectures", "Native speed unavoidable", "Note-taking selective + key vocab", "Practice: TOPIK II past papers + K-content"]],
  [296, "Writing section", ["TOPIK II writing section: 4 questions", "Short answer (Q1-2) + longer (Q3-4 — 200-300 chars)", "Q54 (longest) — 600-700 chars essay", "Grammar + vocabulary + handwriting + structure"]],
  [297, "TOPIK practice 1", ["Full mock listening + reading 1st half", "Time: 110 min", "Identify weak areas", "Targeted review"]],
  [298, "TOPIK practice 2", ["Full mock writing section", "Time: 50 min", "Strategy: efficient composition", "Time management"]],
  [299, "TOPIK practice 3", ["Combined mini-test", "Cumulative weaknesses", "Targeted review by section", "Mental endurance training"]],
  [300, "Full mock TOPIK II", ["~3 hours full simulation", "Real exam conditions", "Final calibration", "Confidence + endurance check"]],
  [301, "Scoring + analysis", ["TOPIK II total: 300 points", "Level 3 = 120-149, Level 4 = 150-189, Level 5 = 190-229, Level 6 = 230+", "Identify gaps + final review priorities", "Retake: held 6x yearly Korea, less abroad"]],
  [302, "Test day strategies", ["TOPIK held July, October, November (and more in Korea)", "Bring: ID + admission ticket + computer pencil", "Sleep + nutrition prep", "Calm + focus management"]],
  [303, "Beyond TOPIK", ["Level 5-6 — graduate study, professional Korean", "KIIP — Korean Immigration Integration Program (residency)", "TOPIK Speaking (CBT-S) — new oral component", "Academic Korean — specialized"]],
  [304, "Final review + 안녕히", ["Recap 304 sessions complete", "Korean learning journey reflection", "Next steps: TOPIK 5-6, immersion Korea, professional", "수고하셨습니다! 화이팅! Annyeonghi gaseyo!"]],
]);

// ============================================================================
// Curriculum Assembly
// ============================================================================

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("korean")!,
  overview:
    "Program 304 sesi yang mengantar lo dari nol sampai percakapan near-native dalam Bahasa Korea (한국어 Hangugeo). Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Pedagogically structured untuk Korean's UNIQUE advantages: Hangul mastery FAST A1.1 sesi 1-4 (King Sejong 1443 designed sistem fonetik scientific — learnable in DAYS, bukan months seperti Hanzi/Kanji), 14 consonants + 10 vowels + syllable block (받침) construction. Honorific system 5-tier integrated EARLY A1.1 sesi 7 (반말/해체/해요체/합쇼체/하십시오체) — Confucian hierarchy = bedrock culture, gak bisa delayed seperti Japanese keigo. Sino-Korean (일이삼) vs Native Korean (하나둘셋) numbers context-drilled A1.1 sesi 10-12 — kedua dipakai daily (시 native, 분 Sino, 살 native age, 원 Sino money). Grammar SOV (similar Japanese) tapi particles distinct: 은/는 topic, 이/가 subject, 을/를 object, 에/에서 location — attached based on 받침 (final consonant). Verb conjugation rich: ~아/어요 polite informal (DEFAULT learner), ~ㅂ니다/습니다 formal, ~았/었어요 past, ~을 거예요 future, negation 안 vs 못, modal ~고 싶다 + ~을 수 있다. Imersi kultur Korea: Hangul invention 1443 + Joseon Dynasty (1392-1897) + Imjin War 1592 + Japanese colonization 1910-1945 + Korean War 1950-53 + division + Park Chung-hee Miracle on Han River + 1987 democratization + IMF Crisis 1997, hallyu wave global (K-pop BTS/BLACKPINK/NewJeans/IVE/aespa, K-drama Squid Game/Crash Landing on You/Kingdom, K-cinema Parasite Oscar 2020 + Decision to Leave + Burning), Han Kang Nobel 2024 (FIRST Korean), Hwang Sok-yong + modern women writers, webtoon literary recognition, kimchi/bulgogi/bibimbap/Korean BBQ samgyeopsal + banchan culture + 8 regional cuisines, Buddhism + Confucianism + Christianity ~30% (unique East Asia), 효 filial piety + 눈치 nunchi + 정 jeong + 한 han cultural concepts, Samsung + Hyundai + LG + chaebol structure, KakaoTalk + Naver + Coupang tech, 회식 hoesik mandatory drinking, Suneung exam + SKY universities + hagwon culture, 출산율 0.72 birthrate crisis lowest globally. Test prep B2.7: TOPIK II Level 4 (한국어능력시험, official Korean Education Foundation) — diakui untuk study + work + visa Korea.",
  levels: [
    {
      code: "A1",
      name: "Elementary Foundation",
      description:
        "Fondasi Elementer. Pedagogically structured untuk Korean's unique scientific writing system: Hangul mastery FAST A1.1 sesi 1-4 (King Sejong 1443 phonetic design — learnable in days), 14 consonants + 10 vowels + syllable blocks. Honorific awareness 5-tier system EARLY (Confucian bedrock), polite informal ~아/어요 default. Sino vs Native numbers context-drilled (kedua dipakai daily: 시 native, 분 Sino, 살 native age, 원 Sino money). Particles 은/는, 이/가, 을/를, 에/에서 attached based on 받침. Grammar SOV basic: 이다 (to be) + 있다/없다 (exist/not exist) + negation 안/못 + modal verbs (~고 싶다, ~을 수 있다). Akhir A1: introduce diri sendiri (with appropriate honorifics), order di restoran, navigate routine, mastery Hangul fluent reading (vs Japanese-Mandarin learners still struggling characters!).",
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
        "Pre-Intermediate. Complex connectors mastery: ~고 (and/then) + ~지만 (but) + ~아/어서 (because/sequence) + adjective modifier ~ㄴ/은/는. Honorific deep dive: subject marker 께서, verb ~시- infix, special honorific verbs (잡수시다 eat, 주무시다 sleep, 계시다 be). Comparison (~보다 + adjective), superlative (제일/가장). Modal extended: polite request ~아/어 주세요, permission ~아/어도 돼요, prohibition ~으면 안 돼요, obligation ~아/어야 돼요. Imersi: 효 filial piety + chaebol structure + nunchi (눈치 reading the room) + 회식 hoesik drinking culture + Korean history (Three Kingdoms → Goryeo → Joseon → colonization → war → democratization). Vocab grow ~2000 kata.",
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
        "Intermediate. Versatile connector ~는데/~ㄴ데/~은데 (multi-meaning Korean signature), reported speech mastery (~다고/라고/냐고/자고), passive ~게 되다 + causative ~게 하다, nominalizers (~기 vs ~는 것), ~ㄹ/을 줄 알다 (know how to), ~ㄹ/을 뻔하다 (almost did), ~을수록 (the more), ~자마자 (as soon as), Korean proverbs (속담) + idioms (사자성어). Deep dive: K-pop industry (Big 4 SM/JYP/YG/HYBE, BTS, BLACKPINK, NewJeans), K-drama (Squid Game phenomenon, tvN/JTBC/Netflix), K-cinema (Bong Joon-ho, Park Chan-wook + Parasite Oscar 2020), Buddhism + Confucianism + Christianity ~30% (East Asia unique), Korean BBQ + banchan + kimchi varieties. Society: 출산율 0.72 birthrate crisis + Suneung exam + SKY universities + hagwon industry + chaebol critique + Korean War heritage + division + Sunshine Policy + comfort women. Literature: Han Yong-un + Yi Sang + Han Kang Nobel 2024 (FIRST Korean) + Hwang Sok-yong + modern women writers (Cho Nam-joo Kim Ji-young Born 1982) + webtoon literary. Professional: 합쇼체 mastery + business email + chaebol culture + 회식 + Jeonse rental system + KakaoPay/Toss payment. Vocab ~3500+.",
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
        "Upper Intermediate. Near-native expression: Sino-Korean (한자) heritage deep (60-70% Korean vocab) + 사자성어 mastery (50+ active 4-char idioms) + rhetorical patterns (parallelism, repetition, escalation) + onomatopoeia + mimesis (Korean richest globally — 두근두근, 반짝반짝, 졸졸). Academic Korean: 학술적 글쓰기 + intellectuals (Ham Seok-heon, Paik Nak-chung, Shin Hyeong-cheol) + Neo-Confucian philosophy (Yi Hwang Toegye, Yi I Yulgok) + modern Korean studies. Professional industry-specific: tourism, K-fashion + K-beauty (Innisfree, Laneige, Sulwhasoo), F&B (Michelin Seoul, BHC/Kyochon fried chicken global), design, diplomatic, journalism (KBS/JoongAng/Hankyoreh), IT (Naver, Kakao, Coupang, Krafton PUBG, Nexon games), finance (KOSPI), art (Lee Bul, Do Ho Suh), translation (Deborah Smith Han Kang translator), KSL teaching (King Sejong Institute). Diplomatic register + Confucian rhetoric + modern Korean speeches (Kim Dae-jung Nobel 2000, Moon Jae-in DMZ, Yoon martial law, Lee Jae-myung). Literary mastery: Sijo deep (3-line classical Korean signature) + Pansori 5 repertoires + Han Yong-un independence poet + Yi Sang modernist + Han Kang phenomenon Nobel 2024 + Hwang Sok-yong + modern women writers + webtoon as literature + translation challenges (honne/han/jeong untranslatable). Regional dialects awareness (Gyeongsang Busan + Jeolla Gwangju + Chungcheong + Gangwon + Jeju language UNESCO endangered) + North Korean variant + modern slang/neologisms (혼밥 solo dining, 혼술 solo drinking, N포 generation, 워라밸 work-life balance). Persiapan TOPIK II Level 4: ~4000+ vocab, reading editorials + critiques, native-speed listening, writing 600-700 char essay. Vocab 5000+.",
      sublevels: [
        { code: "B2.1", name: "Advanced Expression", sessions: b2_1, preview: true },
        { code: "B2.2", name: "Professional Korean", sessions: b2_2, preview: true },
        { code: "B2.3", name: "Near-Native Communication", sessions: b2_3, preview: true },
        { code: "B2.4", name: "Academic Mastery", sessions: b2_4, preview: true },
        { code: "B2.5", name: "Leadership & Diplomacy", sessions: b2_5, preview: true },
        { code: "B2.6", name: "Creative & Literary", sessions: b2_6, preview: true },
        { code: "B2.7", name: "Test Prep (TOPIK II)", sessions: b2_7, preview: true },
      ],
    },
  ],
};

export default curriculum;
