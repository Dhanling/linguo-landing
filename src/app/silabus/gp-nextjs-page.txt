'use client'
import { useState } from 'react'

const LEVELS = [
  { id:'a1', label:'A1 Elementary', short:'A1', sub:'Session 1–16', count:16, color:'#27AE60', desc:'Fondasi bahasa Inggris dari nol — grammar dasar, kosakata sehari-hari & kerja, percakapan sederhana' },
  { id:'a2', label:'A2 Pre-Intermediate', short:'A2', sub:'Session 17–30', count:14, color:'#F39C12', desc:'Mulai konteks kerja — email, telepon, safety, deskripsi alat, laporan sederhana' },
  { id:'b1', label:'B1 Intermediate', short:'B1', sub:'Session 31–40', count:10, color:'#E74C3C', desc:'Profesional & teknikal — presentasi, meeting, laporan teknis, komunikasi klien' },
]
const PhaseColors: Record<string,string> = { Foundation:'#27AE60','Daily Life':'#2ECC71','Work Context':'#3498DB',Communication:'#F39C12',Technical:'#E67E22',Business:'#9B59B6',Professional:'#E74C3C' }

const DATA = [
  {m:1,level:'a1',phase:'Foundation',title:'Hello! Who Are You?',focus:'Perkenalan diri — nama, asal, pekerjaan',topics:['Greeting & introducing yourself','Saying your name, nationality, job title','Alphabet & spelling your name'],vocab:['Hello, Hi, Good morning/afternoon','My name is…, I\'m from…, I work at…','Engineer, technician, manager, operator, admin'],grammar:['Subject pronouns (I, you, he, she, we, they)','Verb BE — am/is/are (I am an engineer)','Simple questions: What is your name?'],speaking:'Perkenalan diri ke rekan kerja baru: nama, asal, posisi',activity:'Pair practice: interview teman & perkenalkan ke kelas',homework:'Tulis 5 kalimat tentang diri sendiri'},
  {m:2,level:'a1',phase:'Foundation',title:'Numbers, Days & Time',focus:'Angka, hari, waktu — dasar untuk jadwal kerja',topics:['Numbers 1–1000 & decimals','Days of the week, months','Telling time (analog & digital)'],vocab:['Monday–Sunday, January–December','O\'clock, half past, quarter to/past','Schedule, shift, meeting, deadline'],grammar:['What time is it? It\'s 3 o\'clock','On Monday, In January, At 9 AM','Plural nouns (-s, -es, irregular)'],speaking:'Ceritakan jadwal shift kerja kamu minggu ini',activity:'Time bingo game + reading work schedules',homework:'Tulis jadwal harian kamu dalam bahasa Inggris'},
  {m:3,level:'a1',phase:'Foundation',title:'My Family & Personal Life',focus:'Kosakata keluarga, angka umur, possessive',topics:['Family members vocabulary','Describing people (age, appearance)','Possessive adjectives & \'s'],vocab:['Father, mother, brother, sister, husband, wife','Tall, short, young, old','My, your, his, her, our, their'],grammar:['Possessive adjectives (my wife, his brother)','Possessive \'s (Ahmad\'s daughter)','How old are you? I am 34 years old.'],speaking:'Ceritakan tentang keluarga kamu (3-4 kalimat)',activity:'Show a family photo & describe to partner',homework:'Bawa foto keluarga, tulis deskripsinya'},
  {m:4,level:'a1',phase:'Foundation',title:'Things Around Me',focus:'Benda-benda di kantor & site, kata tunjuk',topics:['Office objects & equipment','Demonstratives: this, that, these, those','Singular vs plural nouns'],vocab:['Desk, chair, computer, printer, phone','Pen, folder, document, ID card, helmet','This is a…, These are…'],grammar:['This/That (singular), These/Those (plural)','a/an vs the','There is / There are'],speaking:'Tunjukkan & sebutkan 10 benda di ruangan ini',activity:'Classroom scavenger hunt — find & name objects',homework:'Gambar denah kantor, labeli 10 benda dalam bahasa Inggris'},
  {m:5,level:'a1',phase:'Foundation',title:'Where Is It? Places & Directions',focus:'Lokasi, preposisi tempat, bertanya arah sederhana',topics:['Prepositions of place (in, on, at, under, next to)','Rooms & locations at office/site','Asking & giving simple directions'],vocab:['Office, warehouse, parking lot, canteen','Left, right, straight, upstairs, downstairs','Where is the…? It\'s next to the…'],grammar:['Prepositions of place','Imperative for directions (Go straight, Turn left)','Where + is/are questions'],speaking:'Jelaskan lokasi meeting room dari pintu masuk',activity:'Draw a simple map & give directions to partner',homework:'Tulis arah dari rumah ke kantor (5 kalimat)'},
  {m:6,level:'a1',phase:'Daily Life',title:'My Daily Routine',focus:'Aktivitas harian, Present Simple, adverbs of frequency',topics:['Daily activities (wake up, go to work, have lunch)','Present Simple for routines','Always, usually, sometimes, never'],vocab:['Wake up, get dressed, commute, arrive, start work','Have breakfast/lunch, finish work, go home','Usually, always, sometimes, often, never'],grammar:['Present Simple (+/-/?) — I work, He works','Do/Does questions — Do you drive to work?','Adverbs of frequency placement'],speaking:'Ceritakan rutinitas harian kamu dari bangun tidur sampai pulang',activity:'Interview partner tentang rutinitas, cari 3 kesamaan',homework:'Tulis paragraf My Typical Workday (8 kalimat)'},
  {m:7,level:'a1',phase:'Daily Life',title:'Food, Drinks & Ordering',focus:'Makanan, minuman, memesan di kantin/restoran',topics:['Food & drink vocabulary','Countable vs uncountable nouns','Ordering at a canteen/restaurant'],vocab:['Rice, chicken, coffee, tea, water, juice','Some, any, a lot of, a little, a few','Can I have…? I\'d like…, How much is…?'],grammar:['Countable vs uncountable nouns','Some/any','How much / How many'],speaking:'Role-play: pesan makan siang di kantin site',activity:'Menu role-play — waiter & customer rotation',homework:'Tulis menu makan siang favoritmu & harganya'},
  {m:8,level:'a1',phase:'Daily Life',title:'Can You…? Abilities & Requests',focus:'Kemampuan, izin, permintaan sederhana dengan can/can\'t',topics:['Talking about abilities (can/can\'t)','Making polite requests','Asking for permission'],vocab:['Drive, swim, speak English, use Excel, operate','Can I…? Can you…? Sure / Sorry, I can\'t','Help, borrow, open, close, turn on/off'],grammar:['Can/Can\'t for ability — I can drive a truck','Can/Could for requests — Can you help me?','Can I…? for permission'],speaking:'Ceritakan 5 hal yang bisa & tidak bisa kamu lakukan di tempat kerja',activity:'Ability survey — tanya 5 teman, isi tabel',homework:'Tulis email pendek: minta tolong ke rekan kerja'},
  {m:9,level:'a1',phase:'Daily Life',title:'I Like / I Don\'t Like',focus:'Suka, tidak suka, hobi, preferensi',topics:['Expressing likes, dislikes, preferences','Hobbies & free time activities','Verb + -ing (gerund after like/enjoy/hate)'],vocab:['Like, love, enjoy, don\'t mind, dislike, hate','Reading, cooking, traveling, exercising, gaming','Prefer, favorite, hobby, interest'],grammar:['Like + -ing (I like reading)','Prefer A to B','What do you like doing?'],speaking:'Ceritakan hobi & apa yang kamu suka/tidak suka',activity:'Find someone who… bingo',homework:'Tulis 8 kalimat tentang preferensimu'},
  {m:10,level:'a1',phase:'Foundation',title:'Review & Mini Test 1',focus:'Konsolidasi materi Session 1–9',topics:['Grammar review: BE, Present Simple, Can, There is/are','Vocabulary review: all topics','Speaking practice: combined role-plays'],vocab:['Review all vocabulary from Sessions 1–9'],grammar:['Review all grammar from Sessions 1–9'],speaking:'Mini oral test: perkenalan + rutinitas + permintaan',activity:'Team quiz competition + error correction game',homework:'Refleksi tertulis: apa yang sudah dikuasai & masih sulit'},
  {m:11,level:'a1',phase:'Work Context',title:'My Job & My Company',focus:'Mendeskripsikan pekerjaan & perusahaan dalam kalimat sederhana',topics:['Describing your job responsibilities','Describing GroundProbe simply','Departments & company structure'],vocab:['Department, team, manager, colleague, headquarters','Monitor, install, maintain, support, check','GroundProbe: mining, monitoring, radar, slope, safety'],grammar:['Present Simple for job descriptions — I check equipment','Prepositions with work — work at/in/for/with','Simple relative clause — a company that monitors slopes'],speaking:'Jelaskan pekerjaanmu ke orang yang tidak tahu GroundProbe',activity:'Company profile poster — buat poster sederhana tentang GroundProbe',homework:'Tulis paragraf: What I Do at GroundProbe (10 kalimat)'},
  {m:12,level:'a1',phase:'Work Context',title:'What Are You Doing Now?',focus:'Present Continuous — aktivitas yang sedang terjadi',topics:['Present Continuous tense','Present Simple vs Present Continuous','Action verbs vs stative verbs'],vocab:['Working, writing, reading, fixing, checking, waiting','Right now, at the moment, currently, today','Look, hear, know, understand, want (stative)'],grammar:['Present Continuous: am/is/are + -ing','Questions: What are you doing? Is he working?','Simple vs Continuous: I work here vs I\'m working now'],speaking:'Telepon rekan kerja: tanya & ceritakan apa yang sedang dilakukan',activity:'Mime game — act out work activities, others guess',homework:'Tulis 5 kalimat Present Simple & 5 Present Continuous'},
  {m:13,level:'a1',phase:'Work Context',title:'What Happened? — Past Simple',focus:'Past Simple — menceritakan kejadian yang sudah lewat',topics:['Regular past verbs (-ed)','Common irregular past verbs','Yesterday, last week, ago'],vocab:['Worked, finished, arrived, started, helped','Went, had, was/were, did, made, came, saw, got','Yesterday, last Monday, two days ago, in 2023'],grammar:['Past Simple regular: worked, checked, installed','Past Simple irregular: went, had, was, did','Negative & questions: didn\'t + base form, Did you…?'],speaking:'Ceritakan apa yang kamu lakukan kemarin di kantor',activity:'Storytelling chain — each person adds 1 past tense sentence',homework:'Tulis My Last Weekend (8 kalimat past tense)'},
  {m:14,level:'a1',phase:'Work Context',title:'Plans & Intentions — Future',focus:'Rencana dan niat — going to & will sederhana',topics:['Going to for plans','Will for spontaneous decisions & promises','Time expressions for future'],vocab:['Tomorrow, next week, next month, soon, later','Plan, schedule, meeting, deadline, appointment','I\'m going to…, I\'ll…, I won\'t…'],grammar:['Going to: I\'m going to visit the site tomorrow','Will: I\'ll call you back, I\'ll help you','Questions: Are you going to…? Will you…?'],speaking:'Ceritakan rencana kerja kamu minggu depan',activity:'Planning game — schedule a team event using future tenses',homework:'Tulis rencana kerja minggu depan (8 kalimat)'},
  {m:15,level:'a1',phase:'Work Context',title:'Comparing Things',focus:'Perbandingan — comparative & superlative sederhana',topics:['Comparative adjectives (-er, more)','Superlative adjectives (-est, most)','Comparing things at work'],vocab:['Bigger, smaller, faster, slower, cheaper, more expensive','The biggest, the best, the most important','Than, as…as, the same as'],grammar:['Comparative: -er (bigger) / more + adj','Superlative: -est (fastest) / most + adj','As…as: This sensor is as accurate as that one'],speaking:'Bandingkan 2 alat/produk/lokasi kerja',activity:'Debate: Which is better — Site A or Site B?',homework:'Tulis 8 kalimat perbandingan tentang pekerjaan/alat kerja'},
  {m:16,level:'a1',phase:'Foundation',title:'A1 Final Assessment',focus:'Tes akhir level A1 — written & oral',topics:['Written test: grammar, vocabulary, reading comprehension','Oral test: self-introduction, daily routine, past & future','Portfolio review & progress discussion'],vocab:['All A1 vocabulary (Sessions 1–15)'],grammar:['All A1 grammar: BE, Present Simple/Continuous, Past Simple, Going to/Will, Comparatives'],speaking:'Oral exam: 5-minute talk about yourself, your job, & your plans',activity:'Written exam + oral exam + individual feedback session',homework:'Self-assessment reflection & goal-setting for A2'},
  {m:17,level:'a2',phase:'Communication',title:'Professional Emails — The Basics',focus:'Menulis & membalas email kerja sederhana',topics:['Email structure (subject, greeting, body, closing)','Common email phrases','Requesting & replying'],vocab:['Dear…, Hi…, Best regards, Kind regards','Please find attached, As per our discussion','FYI, ASAP, CC, BCC, Re:, Fwd:'],grammar:['Could you…? / Would you mind…? (polite requests)','I\'m writing to… (purpose)','Please + imperative (Please send, Please confirm)'],speaking:'Role-play: balas email dari klien yang minta update',activity:'Email correction — fix 5 poorly written emails',homework:'Tulis 3 email: request, reply, dan forwarding'},
  {m:18,level:'a2',phase:'Communication',title:'Phone Calls & Virtual Meetings',focus:'Telepon & video call — frasa standar',topics:['Answering & making phone calls','Leaving & taking messages','Virtual meeting basics (Zoom/Teams)'],vocab:['Hold on, Speaking, Who\'s calling?','Could you repeat that? You\'re breaking up','Mute, unmute, share screen, chat box'],grammar:['Can I speak to…? / May I ask who\'s calling?','Could you spell that? / Let me read that back','I\'ll transfer you / I\'ll get back to you'],speaking:'Simulasi: telepon ke HQ Australia, minta bicara dengan manajer',activity:'Phone chain relay — pass a message through 4 people',homework:'Tulis script telepon untuk 2 situasi kerja'},
  {m:19,level:'a2',phase:'Technical',title:'Tools, Equipment & PPE',focus:'Alat kerja, peralatan, APD — kosakata teknis dasar',topics:['Mining equipment vocabulary','PPE (Personal Protective Equipment)','Describing function: used for + -ing'],vocab:['Helmet, boots, goggles, gloves, vest, harness','Drill, sensor, cable, probe, antenna, monitor','Portable, waterproof, rechargeable, durable'],grammar:['Used for + -ing (It\'s used for measuring…)','Made of/from (It\'s made of steel)','Adjective order review'],speaking:'Deskripsikan 3 alat kerja GroundProbe ke pengunjung baru',activity:'Equipment matching game — photo + description',homework:'Buat kartu deskripsi untuk 5 alat kerja'},
  {m:20,level:'a2',phase:'Technical',title:'Safety First — Toolbox Talk',focus:'Safety meeting, hazard, prosedur keselamatan',topics:['Workplace hazards vocabulary','Safety rules & procedures','Must/Must not, Have to, Don\'t have to'],vocab:['Hazard, risk, danger, caution, warning','Slippery, falling rocks, electrical, confined space','Must wear, must not enter, have to report'],grammar:['Must / Must not (strong obligation)','Have to / Don\'t have to (necessity)','Should / Shouldn\'t (advice)'],speaking:'Berikan toolbox talk 3 menit tentang safety di site',activity:'Hazard hunt — identify hazards in site photos & report',homework:'Tulis safety briefing untuk karyawan baru'},
  {m:21,level:'a2',phase:'Technical',title:'Reporting Problems & Incidents',focus:'Melaporkan masalah, insiden, kerusakan alat',topics:['Describing problems & malfunctions','Simple incident reporting','Cause & effect (because, so)'],vocab:['Broken, damaged, stuck, leaking, overheating','Malfunction, error, failure, downtime','Because, so, due to, as a result'],grammar:['Past Simple for incident reports','Because / So (cause & effect)','Passive voice introduction: was damaged, was reported'],speaking:'Laporkan insiden kecil ke supervisor: apa yang terjadi & tindakan',activity:'Incident report form — fill in based on scenario cards',homework:'Tulis incident report pendek (1 paragraf)'},
  {m:22,level:'a2',phase:'Communication',title:'Giving Instructions & Procedures',focus:'Memberikan instruksi langkah demi langkah',topics:['Step-by-step instructions','Sequence markers','Warning & caution language'],vocab:['First, next, then, after that, finally','Make sure, be careful, don\'t forget','Plug in, switch on/off, connect, disconnect'],grammar:['Imperative for instructions','Sequence connectors','Before/After + -ing'],speaking:'Jelaskan cara memasang sensor dalam 6 langkah',activity:'Instruction relay — explain a process, partner draws it',homework:'Tulis SOP sederhana untuk 1 prosedur kerja'},
  {m:23,level:'a2',phase:'Communication',title:'Meetings — Joining & Contributing',focus:'Ikut meeting, menyampaikan pendapat, agree/disagree',topics:['Meeting participation phrases','Agreeing, disagreeing, asking for clarification','Action items & follow-up'],vocab:['Agenda, minutes, AOB (any other business)','I agree, I disagree, I\'m not sure about that','Action item, deadline, responsible person'],grammar:['I think / I believe / In my opinion','How about…? / Why don\'t we…? (suggestions)','Let\'s + verb (Let\'s move on, Let\'s summarize)'],speaking:'Role-play meeting: diskusikan jadwal pemasangan alat di 3 site',activity:'Mock meeting — each person has a role & agenda item',homework:'Tulis meeting minutes dari role-play tadi'},
  {m:24,level:'a2',phase:'Technical',title:'Reading Data & Simple Reports',focus:'Membaca data, grafik, dan laporan sederhana',topics:['Understanding charts & graphs','Data vocabulary (increase, decrease, stable)','Writing simple data summaries'],vocab:['Increase, decrease, rise, fall, remain stable','Peak, lowest point, average, total','Graph, chart, table, figure, axis'],grammar:['Past Simple for data description (increased by 20%)','Prepositions with data (from…to, by, at)','Present Perfect intro: has increased since January'],speaking:'Presentasikan tren data dari grafik sederhana',activity:'Graph interpretation — describe 3 charts to partner',homework:'Tulis summary 1 paragraf dari grafik yang diberikan'},
  {m:25,level:'a2',phase:'Communication',title:'Apologizing, Explaining & Solving',focus:'Minta maaf, menjelaskan masalah, menawarkan solusi',topics:['Apologizing professionally','Explaining delays & issues','Offering solutions & alternatives'],vocab:['I\'m sorry for…, I apologize for the delay','Unfortunately, due to, the reason is','I suggest…, How about…, We could…'],grammar:['Conditional Type 1: If we do X, we will Y','First conditional for solutions','Gerund as subject: Delaying the project will…'],speaking:'Role-play: jelaskan keterlambatan pengiriman ke klien & tawarkan solusi',activity:'Problem-solution matching cards',homework:'Tulis email: apologize for delay + offer solution'},
  {m:26,level:'a2',phase:'Business',title:'GroundProbe Products & Services',focus:'Mendeskripsikan produk & layanan GroundProbe dalam bahasa Inggris',topics:['Slope monitoring technology overview','Describing products & features','Client benefit language'],vocab:['Slope Stability Radar (SSR), GeoExplorer, prism','Real-time, continuous, automated, remote','Reliable, accurate, cost-effective, innovative'],grammar:['Relative clauses: which/that (a system that monitors…)','Passive voice: is designed to, is used by','Present Simple for product descriptions'],speaking:'Elevator pitch: jelaskan produk GroundProbe ke calon klien baru (3 menit)',activity:'Product brochure — create a simple English brochure',homework:'Tulis deskripsi 1 produk GroundProbe (10 kalimat)'},
  {m:27,level:'a2',phase:'Business',title:'Visitors, Site Tours & Hosting',focus:'Menyambut tamu, tur site, hospitality bahasa Inggris',topics:['Welcoming visitors & introductions','Conducting a site tour','Offering refreshments & assistance'],vocab:['Welcome to…, Let me show you around','On your left/right you can see…','Would you like some coffee? Can I get you anything?'],grammar:['Would you like…? (offers)','Let me + verb (Let me introduce…)','Present Continuous for tour narration'],speaking:'Pandu tamu dari Australia berkeliling site GroundProbe',activity:'Full site tour simulation — 3 stops with Q&A',homework:'Tulis script site tour untuk tamu VIP'},
  {m:28,level:'a2',phase:'Business',title:'Schedules, Plans & Deadlines',focus:'Penjadwalan, koordinasi, deadline',topics:['Making & changing appointments','Project timeline vocabulary','Coordinating across time zones'],vocab:['Reschedule, postpone, bring forward, confirm','Milestone, deliverable, on track, behind schedule','AEST, WIB, GMT — time zone conversion'],grammar:['Present Continuous for arrangements (I\'m meeting John at 3)','By + deadline (by Friday, by end of Q3)','Need to / Have to for obligations'],speaking:'Koordinasikan jadwal meeting dengan HQ Australia via email & call',activity:'Calendar puzzle — schedule 5 meetings across 3 time zones',homework:'Tulis email konfirmasi meeting + agenda'},
  {m:29,level:'a2',phase:'Communication',title:'A2 Review & Practice Day',focus:'Konsolidasi semua materi A2',topics:['Grammar marathon: all A2 structures','Vocabulary recall: technical, business, communication','Integrated role-plays: email → call → meeting → report'],vocab:['Review all A2 vocabulary'],grammar:['Review all A2 grammar'],speaking:'Chain scenario: terima email → telepon klien → meeting tim → tulis laporan',activity:'Team competition: quiz, role-play, & writing challenge',homework:'Preparation for A2 final assessment'},
  {m:30,level:'a2',phase:'Communication',title:'A2 Final Assessment',focus:'Tes akhir level A2 — written, listening & oral',topics:['Written: email writing, incident report, data summary','Listening: phone call & meeting comprehension','Oral: site tour + product presentation'],vocab:['All A2 vocabulary (Sessions 17–29)'],grammar:['All A2 grammar structures'],speaking:'Oral exam: 8-minute presentation — Site tour + product overview',activity:'Full assessment day + individual feedback + goal-setting for B1',homework:'Portfolio submission: emails, reports, meeting minutes, brochure'},
  {m:31,level:'b1',phase:'Professional',title:'Writing Professional Reports',focus:'Laporan profesional — struktur, bahasa formal, data commentary',topics:['Report structure: intro, findings, conclusion, recommendation','Formal vs informal register','Data commentary & hedging language'],vocab:['Furthermore, nevertheless, consequently, regarding','It appears that…, The data suggests…','Significant, substantial, considerable, marginal'],grammar:['Passive voice (full control)','Complex sentences: although, whereas, despite','Hedging: may, might, tend to, it seems'],speaking:'Presentasikan executive summary dari monitoring report',activity:'Report makeover — rewrite informal report into formal',homework:'Tulis site monitoring report (1 halaman)'},
  {m:32,level:'b1',phase:'Professional',title:'Presentations to Stakeholders',focus:'Presentasi ke level manajemen & stakeholder eksternal',topics:['Structuring a persuasive presentation','Handling Q&A confidently','Using data to support arguments'],vocab:['Stakeholder, ROI, KPI, value proposition','The key takeaway is…, To put this in perspective…','Signposting: Moving on to…, To summarize…'],grammar:['Discourse markers for presentations','Conditional Type 2: If we invested in…, we would…','Emphasis: What we need is… / It is X that…'],speaking:'Deliver 10-minute presentation: GroundProbe quarterly update ke manajemen',activity:'Shark tank style — pitch a new service/product idea',homework:'Buat slide deck + speaker notes untuk presentasi'},
  {m:33,level:'b1',phase:'Professional',title:'Negotiation & Persuasion',focus:'Negosiasi kontrak, harga, timeline — bahasa diplomatik',topics:['Negotiation strategies in English','Making & responding to proposals','Diplomatic language & softening'],vocab:['Proposal, counter-offer, compromise, deal-breaker','I\'d like to suggest…, Would you consider…?','Non-negotiable, flexible, win-win, bottom line'],grammar:['Conditional structures for negotiation','Would/Could for softening','I was wondering if… / What if we were to…'],speaking:'Role-play: negosiasi perpanjangan kontrak service dengan klien mining',activity:'Negotiation simulation — buyer vs seller with hidden goals',homework:'Tulis proposal email hasil negosiasi'},
  {m:34,level:'b1',phase:'Technical',title:'Explaining Complex Technical Processes',focus:'Menjelaskan proses teknis yang kompleks dalam bahasa Inggris',topics:['Process description: how radar monitoring works','Cause-effect chains in technical contexts','Simplifying technical language for non-experts'],vocab:['Displacement, velocity, threshold, alarm trigger','Transmit, reflect, calculate, analyze, alert','In other words…, Simply put…, Basically…'],grammar:['Passive voice in process descriptions','Present Simple for processes (The radar transmits…)','Relative clauses: which, that, where'],speaking:'Jelaskan cara kerja SSR ke klien non-teknis dalam 5 menit',activity:'Jigsaw: tiap tim jelaskan 1 bagian proses, lalu gabungkan',homework:'Tulis process description: How Slope Monitoring Works'},
  {m:35,level:'b1',phase:'Professional',title:'Leading Meetings & Decision-Making',focus:'Memimpin meeting, membuat keputusan, assign action items',topics:['Chairing a meeting effectively','Decision-making language','Summarizing & assigning action items'],vocab:['Chair, facilitate, table, adjourn, consensus','Let\'s put it to a vote, We\'ve agreed that…','Action item, owner, due date, follow-up'],grammar:['Reported speech: He said that…, She suggested that…','Let\'s / Shall we / How about (suggestions)','Need to / Should / Must (degrees of urgency)'],speaking:'Pimpin project review meeting 15 menit dengan 4 peserta',activity:'Full meeting simulation — agenda, roles, minutes',homework:'Tulis meeting minutes formal + action item tracker'},
  {m:36,level:'b1',phase:'Professional',title:'Cross-Cultural & Australian English',focus:'Komunikasi lintas budaya, terutama dengan HQ Australia',topics:['Australian English characteristics','Direct vs indirect communication styles','Managing cross-cultural misunderstandings'],vocab:['Arvo, reckon, mate, no worries, heaps','Formal vs casual register switching','Idioms: touch base, on the same page, get the ball rolling'],grammar:['Indirect questions: Could you tell me…, I was wondering…','Tag questions: isn\'t it?, don\'t you?','Softening devices: kind of, sort of, a bit'],speaking:'Role-play: navigasi miscommunication dengan manajer Australia',activity:'Accent & idiom listening exercise + discussion',homework:'Tulis refleksi: tantangan komunikasi lintas budaya di tempat kerjamu'},
  {m:37,level:'b1',phase:'Technical',title:'Risk Assessment & Safety Communication',focus:'Risk assessment dalam bahasa Inggris, komunikasi safety tingkat lanjut',topics:['Risk matrix: likelihood × severity','HAZOP & risk documentation','Communicating risk to non-technical audience'],vocab:['Likelihood, severity, mitigation, residual risk','ALARP, HAZOP, SOP, JSA','Unacceptable, tolerable, negligible, critical'],grammar:['Modal perfects: should have, could have, might have','Third conditional: If we had installed…, the failure wouldn\'t have…','Advanced cause-effect: owing to, attributable to'],speaking:'Presentasikan risk assessment ke safety committee',activity:'Risk assessment workshop — analyze case study & present findings',homework:'Tulis risk assessment summary untuk 1 hazard scenario'},
  {m:38,level:'b1',phase:'Professional',title:'Client Relations & Problem Resolution',focus:'Hubungan klien, menangani keluhan, resolusi masalah',topics:['Handling client complaints professionally','Escalation & de-escalation language','Building long-term client relationships'],vocab:['Escalate, de-escalate, compensate, rectify','We take this seriously…, Rest assured…','Follow-up, resolution, satisfaction, retention'],grammar:['Conditionals for problem-solving','Subjunctive: We recommend that…be','Perfect tenses: have been working on, had already informed'],speaking:'Role-play: handle a serious client complaint about monitoring system downtime',activity:'Case study: analyze & resolve 3 real-world client scenarios',homework:'Tulis formal response letter ke client complaint'},
  {m:39,level:'b1',phase:'Professional',title:'B1 Review & Full Simulation',focus:'Simulasi lengkap — hari kerja penuh dalam bahasa Inggris',topics:['Full-day work simulation in English','Integrated skills: email → call → meeting → report → presentation','Peer feedback & self-assessment'],vocab:['All B1 vocabulary'],grammar:['All B1 grammar structures'],speaking:'Full simulation: terima email klien → telepon HQ → pimpin meeting → tulis report → presentasi ke manajemen',activity:'Immersion day — English only, all activities in sequence',homework:'Preparation for final assessment'},
  {m:40,level:'b1',phase:'Professional',title:'Final Assessment & Certification',focus:'Tes akhir komprehensif + sertifikat kelulusan',topics:['Comprehensive written exam (report, email, grammar)','Professional oral exam (presentation + Q&A + meeting)','Certificate ceremony & continuing learning plan'],vocab:['All course vocabulary (Sessions 1–39)'],grammar:['All course grammar (A1–B1)'],speaking:'Final presentation: GroundProbe Indonesia — Monitoring Excellence (12 min + Q&A)',activity:'Written exam + oral exam + portfolio review + certificate ceremony',homework:'Complete portfolio: semua tugas, refleksi, & rencana belajar lanjutan'},
]

type Session = typeof DATA[0]

function Tag({ text, bg, color }: { text: string; bg: string; color: string }) {
  return <span style={{ fontSize:11, background:bg, color, padding:'3px 9px', borderRadius:7, lineHeight:1.4, display:'inline-block' }}>{text}</span>
}
function Block({ title, items, bg, color }: { title:string; items:string[]; bg:string; color:string }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:12, fontWeight:700, marginBottom:6 }}>{title}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
        {items.map((t,i) => <Tag key={i} text={t} bg={bg} color={color} />)}
      </div>
    </div>
  )
}
function DetailBox({ icon, title, text, bg, border }: { icon:string; title:string; text:string; bg:string; border:string }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:12, fontWeight:700, marginBottom:5 }}>{icon} {title}</div>
      <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:9, padding:10, fontSize:12, lineHeight:1.5 }}>{text}</div>
    </div>
  )
}

export default function EnglishB2BPage() {
  const [sel, setSel] = useState<number|null>(null)
  const [done, setDone] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  const toggle = (m: number) => setDone(p => { const n = new Set(p); n.has(m)?n.delete(m):n.add(m); return n })

  const filtered = DATA.filter(s => {
    if (filter !== 'all' && s.level !== filter) return false
    if (q) { const ql = q.toLowerCase(); return s.title.toLowerCase().includes(ql)||s.focus.toLowerCase().includes(ql)||s.topics.some(t=>t.toLowerCase().includes(ql)) }
    return true
  })

  const detail = sel !== null ? DATA.find(s => s.m === sel) as Session : null
  const lc = detail ? LEVELS.find(l => l.id === detail.level)! : null

  return (
    <div style={{ fontFamily:'-apple-system,"Segoe UI",sans-serif', background:'#F4F7FA', minHeight:'100vh', color:'#0F2B3C' }}>

      {/* HEADER */}
      <div style={{ background:'linear-gradient(135deg,#0F2B3C 0%,#1D4E6A 100%)', padding:'24px 20px 18px', color:'#fff' }}>
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:6 }}>
          <div style={{ background:'#2ABFBF', borderRadius:10, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:15 }}>L</div>
          <div>
            <div style={{ fontSize:10, letterSpacing:'2.5px', textTransform:'uppercase', opacity:.6 }}>Linguo.id Corporate Program</div>
            <div style={{ fontSize:18, fontWeight:700 }}>English for GroundProbe Indonesia</div>
          </div>
        </div>
        <div style={{ fontSize:12, opacity:.75, marginTop:4 }}>40 Sessions • 90 min each • 60 Total Hours • A1 → B1</div>
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          {LEVELS.map(l => {
            const cnt = DATA.filter(s=>s.level===l.id&&done.has(s.m)).length
            return (
              <div key={l.id} style={{ flex:1, background:'rgba(255,255,255,.08)', borderRadius:10, padding:'8px 10px' }}>
                <div style={{ fontSize:10, opacity:.6 }}>{l.label}</div>
                <div style={{ fontSize:15, fontWeight:700, color:l.color }}>{cnt}/{l.count}</div>
                <div style={{ marginTop:4, height:4, background:'rgba(255,255,255,.15)', borderRadius:2 }}>
                  <div style={{ height:'100%', width:`${(cnt/l.count)*100}%`, background:l.color, borderRadius:2, transition:'width .4s' }}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ padding:'10px 16px', display:'flex', gap:6, flexWrap:'wrap', borderBottom:'1px solid #E2E8F0', background:'#fff', alignItems:'center' }}>
        {[{id:'all',label:'All 40'},...LEVELS.map(l=>({id:l.id,label:`${l.short} (${l.count})`}))].map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); setSel(null) }}
            style={{ padding:'5px 12px', borderRadius:16, fontSize:11, fontWeight:600, cursor:'pointer', border: filter===f.id?'none':'1px solid #CBD5E1', background: filter===f.id?'#2ABFBF':'transparent', color: filter===f.id?'#fff':'#64748B' }}>
            {f.label}
          </button>
        ))}
        <input placeholder="🔍 Cari topik..." value={q} onChange={e=>setQ(e.target.value)}
          style={{ marginLeft:'auto', padding:'5px 10px', borderRadius:16, border:'1px solid #CBD5E1', fontSize:11, width:140, outline:'none' }}/>
      </div>

      {detail && lc ? (
        <div style={{ padding:16, maxWidth:620, margin:'0 auto' }}>
          <button onClick={() => setSel(null)} style={{ background:'none', border:'none', color:'#2ABFBF', fontSize:12, fontWeight:600, cursor:'pointer', marginBottom:10, padding:0 }}>← Kembali</button>
          <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,.07)' }}>
            <div style={{ background:lc.color, padding:'18px 18px 14px', color:'#fff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, opacity:.85, textTransform:'uppercase', letterSpacing:1 }}>
                <span>Session {detail.m}/40</span>
                <span style={{ background:'rgba(255,255,255,.2)', padding:'2px 10px', borderRadius:10 }}>{detail.phase}</span>
              </div>
              <div style={{ fontSize:18, fontWeight:700, marginTop:6 }}>{detail.title}</div>
              <div style={{ fontSize:12, opacity:.85, marginTop:3 }}>90 menit • {lc.label}</div>
              <div style={{ fontSize:12, marginTop:6, background:'rgba(255,255,255,.15)', padding:'6px 10px', borderRadius:8, lineHeight:1.4 }}>🎯 {detail.focus}</div>
            </div>
            <div style={{ padding:18 }}>
              <Block title="📚 Topics" items={detail.topics} bg="#EFF6FF" color="#1D4ED8"/>
              <Block title="📖 Vocabulary & Phrases" items={detail.vocab} bg="#FFF8E7" color="#92400E"/>
              <Block title="✏️ Grammar Focus" items={detail.grammar} bg="#F3E8FF" color="#7C3AED"/>
              <DetailBox icon="🎤" title="Speaking Practice" text={detail.speaking} bg="#F0FDF4" border="#BBF7D0"/>
              <DetailBox icon="🎮" title="Class Activity" text={detail.activity} bg="#EFF6FF" border="#BFDBFE"/>
              <DetailBox icon="📝" title="Homework" text={detail.homework} bg="#FFF7ED" border="#FED7AA"/>
              <button onClick={() => toggle(detail.m)}
                style={{ marginTop:14, width:'100%', padding:11, borderRadius:10, border:'none', fontSize:13, fontWeight:700, cursor:'pointer', background:done.has(detail.m)?'#E2E8F0':'#2ABFBF', color:done.has(detail.m)?'#64748B':'#fff' }}>
                {done.has(detail.m) ? '✓ Selesai — Batalkan' : 'Tandai Selesai ✓'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding:16 }}>
          {LEVELS.filter(l=>filter==='all'||l.id===filter).map(level => {
            const items = filtered.filter(s=>s.level===level.id)
            if (!items.length) return null
            return (
              <div key={level.id} style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <div style={{ width:4, height:18, borderRadius:2, background:level.color }}/>
                  <span style={{ fontSize:14, fontWeight:700 }}>{level.label}</span>
                  <span style={{ fontSize:11, color:'#64748B' }}>{level.sub}</span>
                </div>
                <div style={{ fontSize:11, color:'#64748B', marginBottom:8, marginLeft:12, lineHeight:1.5 }}>{level.desc}</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:8 }}>
                  {items.map(s => {
                    const isDone = done.has(s.m)
                    const pc = PhaseColors[s.phase]||'#888'
                    return (
                      <div key={s.m} onClick={() => setSel(s.m)}
                        style={{ background:'#fff', borderRadius:10, padding:'12px 14px', cursor:'pointer', border:`1px solid ${isDone?'#2ABFBF99':'#E8ECF0'}`, position:'relative' }}>
                        {isDone && <div style={{ position:'absolute', top:8, right:10, background:'#2ABFBF', color:'#fff', borderRadius:8, width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>✓</div>}
                        <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                          <div style={{ background:level.color, color:'#fff', borderRadius:7, minWidth:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{s.m}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12.5, fontWeight:600, lineHeight:1.3 }}>{s.title}</div>
                            <div style={{ fontSize:10.5, color:'#64748B', marginTop:2 }}>
                              <span style={{ display:'inline-block', background:`${pc}18`, color:pc, padding:'1px 6px', borderRadius:6, fontSize:10, fontWeight:600 }}>{s.phase}</span>
                              <span style={{ marginLeft:6 }}>{s.focus.length>50?s.focus.slice(0,50)+'…':s.focus}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ textAlign:'center', padding:'16px 16px 28px', fontSize:10, color:'#64748B' }}>
        <div style={{ fontWeight:700, color:'#2ABFBF', fontSize:12 }}>Linguo.id</div>
        <div style={{ marginTop:3 }}>Corporate English Training for GroundProbe Indonesia</div>
        <div>40 Sessions × 90 min = 60 Hours | A1 → B1</div>
      </div>
    </div>
  )
}
