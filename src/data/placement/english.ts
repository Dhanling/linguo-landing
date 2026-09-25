// ─────────────────────────────────────────────────────────────────────────────
// Extended placement test data types + English questions
// v2: added dragDrop, missing, matching question types for gamification
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionType = "multiple" | "fill" | "fillChoice" | "dragDrop" | "missing" | "matching";
export type Difficulty = "A1" | "A2" | "B1" | "B2";

// ── Audio soal listening [placement-listening-v1] ───────────────────────────
// Dibunyikan lewat /api/tts (Chirp). `text` = transkrip bahasa target (TIDAK
// ditampilkan saat tes — taruh transkrip + artinya di `explanation`),
// `lang` = kode bahasa /api/tts (mis. "ar"). Maks 400 karakter.
export interface ListeningAudio {
  text: string;
  lang: string;
}

// ── Base interface (common fields) ──────────────────────────────────────────
interface BaseQuestion {
  id: string;
  difficulty: Difficulty;
  explanation: string;
  tip?: string;
  audio?: ListeningAudio; // ada = soal listening, tipe soalnya tetap salah satu di bawah
}

// ── Multiple choice (existing) ──────────────────────────────────────────────
export interface MultipleQuestion extends BaseQuestion {
  type: "multiple";
  question: string;
  options: string[];
  correct: number;
}

// ── Fill in the blank (existing) ────────────────────────────────────────────
export interface FillQuestion extends BaseQuestion {
  type: "fill";
  question: string;
  context?: string;
  correct: string;
}

// ── Fill in the blank via button options (NEW — like fill but click instead of type) ──
export interface FillChoiceQuestion extends BaseQuestion {
  type: "fillChoice";
  question: string;
  context?: string;
  options: string[];
  correct: string;
}

// ── Drag-drop: susun token jadi kalimat benar (Duolingo-style) ──────────────
export interface DragDropQuestion extends BaseQuestion {
  type: "dragDrop";
  prompt: string;               // instruksi untuk siswa
  translation: string;          // kalimat dalam bahasa asal (misal Indonesia)
  tokens: string[];             // token acak yang harus disusun (sudah di-shuffle di component)
  correct: string[];            // urutan benar
}

// ── Missing: kalimat dengan multiple blanks, pilih dari word bank ───────────
export interface MissingQuestion extends BaseQuestion {
  type: "missing";
  question: string;             // instruksi
  template: string;             // kalimat dengan ___ sebagai placeholder tiap blank
  blanks: string[];             // jawaban benar per blank, in order
  options: string[];            // word bank (berisi blanks + distractors)
}

// ── Matching: jodohkan kata dengan artinya ──────────────────────────────────
export interface MatchingPair {
  left: string;
  right: string;
}
export interface MatchingQuestion extends BaseQuestion {
  type: "matching";
  prompt: string;
  pairs: MatchingPair[];
}

// ── Discriminated union ─────────────────────────────────────────────────────
export type Question =
  | MultipleQuestion
  | FillQuestion
  | FillChoiceQuestion
  | DragDropQuestion
  | MissingQuestion
  | MatchingQuestion;


// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH PLACEMENT TEST (v2 — 23 soal, tipe campuran — 5 di antaranya listening)
// A1: 5 soal · A2: 6 soal · B1: 7 soal · B2: 5 soal
// [placement-listening-v1] Soal ber-`audio` dibunyikan Chirp (lang "en") lewat /api/tts;
// transkrip sengaja cuma ada di `audio.text` + pembahasan, tidak di layar soal.
// ─────────────────────────────────────────────────────────────────────────────
export const englishPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "What is the correct greeting for the morning?",
    options: ["Good night", "Good morning", "Good evening", "Goodbye"],
    correct: 1,
    explanation: "'Good morning' is used until about noon.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Match the words with their Indonesian meanings:",
    pairs: [
      { left: "happy", right: "bahagia" },
      { left: "sad", right: "sedih" },
      { left: "angry", right: "marah" },
      { left: "tired", right: "lelah" },
    ],
    explanation: "Kosakata emosi dasar level A1 — paling penting untuk daily conversation.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Complete: 'I have ___ apple.'",
    context: "Pilih artikel yang tepat.",
    options: ["a", "an", "the", "some"],
    correct: "an",
    explanation: "'Apple' starts with a vowel sound, so use 'an'.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat lengkap:",
    translation: "Dia adalah seorang guru.",
    tokens: ["is", "She", "teacher", "a"],
    correct: ["She", "is", "a", "teacher"],
    explanation: "Struktur dasar: Subject + be (is/am/are) + a/an + noun.",
  },

  // [placement-listening-v1] Listening A1 — melengkapi (pasangan bunyi mirip sheep/ship)
  {
    id: "l1", difficulty: "A1", type: "fillChoice",
    audio: { lang: "en", text: "Good morning! My name is Lisa. I live on a farm with my family, and we have three sheep and a big brown dog." },
    question: "Dengarkan audio, lalu lengkapi: 'We have three ___ and a big brown dog.'",
    context: "Pilih kata yang kamu dengar.",
    options: ["ship", "sheep", "shop", "chips"],
    correct: "sheep",
    explanation: "Transkrip: 'Good morning! My name is Lisa. I live on a farm with my family, and we have three sheep and a big brown dog.' (Selamat pagi! Nama saya Lisa. Saya tinggal di peternakan bersama keluarga, dan kami punya tiga ekor domba dan seekor anjing cokelat besar.) Awas pasangan bunyi mirip: 'sheep' /ʃiːp/ = domba (vokal panjang 'ii'), 'ship' /ʃɪp/ = kapal (vokal pendek). 'Shop' = toko, 'chips' = keripik — bunyinya mirip tapi tidak cocok dengan konteks peternakan.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Which sentence is in the past tense?",
    options: [
      "I go to school every day.",
      "I am going to school now.",
      "I went to school yesterday.",
      "I will go to school tomorrow.",
    ],
    correct: 2,
    explanation: "'Went' is the past simple form of 'go'.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun menjadi kalimat past simple:",
    translation: "Kemarin saya pergi ke pasar.",
    tokens: ["went", "market", "I", "yesterday", "the", "to"],
    correct: ["I", "went", "to", "the", "market", "yesterday"],
    explanation: "Past simple: Subject + verb-2 + object + time marker.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "She ___ coffee every morning, but today she ___ tea.",
    blanks: ["drinks", "is drinking"],
    options: ["drinks", "drink", "drinking", "is drinking", "drank", "has drunk"],
    explanation: "Present simple untuk rutinitas, present continuous untuk aktivitas sekarang.",
  },
  {
    id: "q8", difficulty: "A2", type: "multiple",
    question: "'You ___ see a doctor if you feel sick.'",
    options: ["must", "can", "should", "will"],
    correct: 2,
    explanation: "'Should' is used for advice.",
  },
  {
    id: "q9", difficulty: "A2", type: "fillChoice",
    question: "'I have lived here ___ five years.'",
    context: "Pilih preposisi yang tepat.",
    options: ["for", "since", "from", "during"],
    correct: "for",
    explanation: "Use 'for' with a duration, 'since' with a point in time.",
  },

  // [placement-listening-v1] Listening A2 — detail informasi (jam + tempat)
  {
    id: "l2", difficulty: "A2", type: "multiple",
    audio: { lang: "en", text: "Hi Sam, it's Mia. The film starts at a quarter past seven, so let's meet at seven o'clock in front of the cinema. The tickets are twelve dollars each. See you later!" },
    question: "Dengarkan audio. Jam berapa dan di mana mereka akan bertemu?",
    options: [
      "Jam 07.15, di depan bioskop",
      "Jam 07.00, di depan bioskop",
      "Jam 07.00, di dalam kafe",
      "Jam 12.00, di depan bioskop",
    ],
    correct: 1,
    explanation: "Transkrip: 'Hi Sam, it's Mia. The film starts at a quarter past seven, so let's meet at seven o'clock in front of the cinema. The tickets are twelve dollars each. See you later!' (Hai Sam, ini Mia. Filmnya mulai jam tujuh lewat seperempat, jadi ayo ketemu jam tujuh tepat di depan bioskop. Tiketnya dua belas dolar per orang. Sampai nanti!) Jam 07.15 ('a quarter past seven') = waktu FILM MULAI, bukan waktu bertemu (pengecoh). 'Twelve' = harga tiket, bukan jam. 'In front of the cinema' = di depan bioskop.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q10", difficulty: "B1", type: "multiple",
    question: "Which sentence uses Present Perfect correctly?",
    options: [
      "I have seen that movie last week.",
      "I saw that movie already.",
      "I have already seen that movie.",
      "I am seeing that movie already.",
    ],
    correct: 2,
    explanation: "Present Perfect with 'already' for recent past. Don't mix with specific past time markers.",
  },
  {
    id: "q11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat passive voice:",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["written", "was", "The", "yesterday", "letter"],
    correct: ["The", "letter", "was", "written", "yesterday"],
    explanation: "Passive past: The + object + was/were + past participle + time.",
  },
  {
    id: "q12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan phrasal verb dengan artinya:",
    pairs: [
      { left: "give up", right: "menyerah" },
      { left: "look after", right: "menjaga" },
      { left: "run out of", right: "kehabisan" },
      { left: "put off", right: "menunda" },
    ],
    explanation: "Phrasal verbs adalah ciri khas level B1. Sering tidak bisa diterjemahkan kata-per-kata.",
  },
  {
    id: "q13", difficulty: "B1", type: "missing",
    question: "Second conditional — lengkapi dengan kata yang tepat:",
    template: "If I ___ rich, I ___ travel the world.",
    blanks: ["were", "would"],
    options: ["was", "were", "am", "would", "will", "had"],
    explanation: "Second conditional: If + past simple (were untuk semua subjek di formal English), would + verb.",
  },
  {
    id: "q14", difficulty: "B1", type: "fillChoice",
    question: "Reported: She said, 'I am tired.' = She said she ___ tired.",
    context: "Shift tense untuk reported speech.",
    options: ["am", "was", "is", "were"],
    correct: "was",
    explanation: "Present simple 'am' shifts to past simple 'was' in reported speech.",
  },

  // [placement-listening-v1] Listening B1 — menerjemahkan (present perfect continuous + still)
  {
    id: "l3", difficulty: "B1", type: "multiple",
    audio: { lang: "en", text: "I've been learning English for three years, but I still get nervous when I have to speak in front of a lot of people." },
    question: "Dengarkan audio. Pilih terjemahan yang paling tepat:",
    options: [
      "Saya belajar bahasa Inggris tiga tahun lalu, dan sekarang saya tidak gugup lagi berbicara di depan banyak orang.",
      "Saya akan belajar bahasa Inggris selama tiga tahun supaya tidak gugup berbicara di depan banyak orang.",
      "Saya sudah belajar bahasa Inggris selama tiga tahun, tapi saya masih gugup kalau harus berbicara di depan banyak orang.",
      "Sudah tiga tahun saya tidak belajar bahasa Inggris, jadi saya gugup berbicara di depan banyak orang.",
    ],
    correct: 2,
    explanation: "Transkrip: 'I've been learning English for three years, but I still get nervous when I have to speak in front of a lot of people.' Pola present perfect continuous 'have been + -ing' + 'for' = kegiatan yang dimulai di masa lalu dan MASIH berlangsung sampai sekarang (sudah belajar selama tiga tahun, dan masih belajar). 'Still' = masih. Opsi 'tiga tahun lalu' salah karena itu past simple ('three years ago'); opsi 'akan belajar' = future; opsi 'tidak belajar' membalik makna.",
  },
  // [placement-listening-v1] Listening B1 — dikte 2 kata (pengecoh bunyi mirip)
  {
    id: "l4", difficulty: "B1", type: "missing",
    audio: { lang: "en", text: "If you want to improve your English, you should listen to podcasts every day, even if it's only for ten minutes." },
    question: "Dengarkan audio, lalu isi dua kata yang hilang:",
    template: "If you want to ___ your English, you should ___ to podcasts every day, even if it's only for ten minutes.",
    blanks: ["improve", "listen"],
    options: ["approve", "listen", "improve", "lesson", "prove", "lessen"],
    explanation: "Transkrip: 'If you want to improve your English, you should listen to podcasts every day, even if it's only for ten minutes.' (Kalau kamu ingin meningkatkan bahasa Inggrismu, kamu sebaiknya mendengarkan podcast setiap hari, meskipun cuma sepuluh menit.) 'Improve' = meningkatkan; 'approve' = menyetujui dan 'prove' = membuktikan bunyinya mirip tapi maknanya tidak cocok. 'Listen to' = mendengarkan (huruf t tidak dibaca: /ˈlɪsən/); 'lesson' = pelajaran dan 'lessen' = mengurangi berbunyi /ˈlesən/ — mirip, tapi keduanya tidak bisa diikuti 'to podcasts' setelah 'should'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Which is the correct third conditional?",
    options: [
      "If I knew, I would have told you.",
      "If I had known, I would have told you.",
      "If I have known, I would tell you.",
      "If I would know, I had told you.",
    ],
    correct: 1,
    explanation: "Third conditional: If + past perfect, would have + past participle.",
  },
  {
    id: "q16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan inversi formal (untuk penekanan):",
    translation: "Belum pernah saya melihat pemandangan seperti itu.",
    tokens: ["I", "seen", "a", "such", "Never", "have", "view"],
    correct: ["Never", "have", "I", "seen", "such", "a", "view"],
    explanation: "Setelah adverb negatif ('never') di awal kalimat, invert subject dan auxiliary verb.",
  },
  {
    id: "q17", difficulty: "B2", type: "missing",
    question: "Lengkapi kalimat dengan kata akademis yang tepat:",
    template: "The new policy will ___ the impact, while the old one would only ___ it.",
    blanks: ["mitigate", "exacerbate"],
    options: ["intensify", "amplify", "mitigate", "exacerbate", "generate", "stabilize"],
    explanation: "'Mitigate' = mengurangi. 'Exacerbate' = memperparah. Pair antonim penting di B2 academic English.",
  },
  {
    id: "q18", difficulty: "B2", type: "multiple",
    question: "Which demonstrates nominalization?",
    options: [
      "She decided quickly.",
      "Her decision was quick.",
      "She quickly made a choice.",
      "Quickly, she decided.",
    ],
    correct: 1,
    explanation: "Nominalization: verb 'decided' → noun 'decision'. Important for formal/academic writing.",
  },

  // [placement-listening-v1] Listening B2 — HOTS: menyimpulkan maksud pengumuman
  {
    id: "l5", difficulty: "B2", type: "multiple",
    audio: { lang: "en", text: "Attention, passengers. Due to engineering work, there will be no trains between Riverside and Central Station this weekend. However, replacement buses will run every ten minutes, so please allow an extra thirty minutes for your journey." },
    question: "Dengarkan pengumuman ini. Kesimpulan yang PALING masuk akal adalah:",
    options: [
      "Semua perjalanan antara Riverside dan Central Station dibatalkan, jadi penumpang sebaiknya tidak bepergian akhir pekan ini.",
      "Penumpang tetap bisa bepergian dengan bus pengganti, tapi perjalanannya akan memakan waktu lebih lama.",
      "Kereta tetap berjalan seperti biasa, hanya terlambat sekitar tiga puluh menit.",
      "Bus pengganti hanya datang setiap tiga puluh menit karena ada perbaikan rel.",
    ],
    correct: 1,
    explanation: "Transkrip: 'Attention, passengers. Due to engineering work, there will be no trains between Riverside and Central Station this weekend. However, replacement buses will run every ten minutes, so please allow an extra thirty minutes for your journey.' (Perhatian, para penumpang. Karena ada pekerjaan perbaikan teknis, tidak ada kereta antara Riverside dan Central Station akhir pekan ini. Namun, bus pengganti akan beroperasi setiap sepuluh menit, jadi mohon sediakan waktu tambahan tiga puluh menit untuk perjalanan Anda.) Kuncinya 'However' = namun: kereta memang tidak ada, TAPI perjalanan tetap bisa dilakukan dengan bus, dan 'allow an extra thirty minutes' menyiratkan waktu tempuh lebih lama. Opsi 'dibatalkan' mengabaikan kalimat setelah 'however'; opsi 'kereta berjalan biasa' bertentangan dengan 'no trains'; 'setiap tiga puluh menit' mencampur angka — busnya tiap SEPULUH menit, tiga puluh menit adalah waktu tambahan.",
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────────────────────────────────────────
export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  A1: 1, A2: 2, B1: 3, B2: 4,
};

// Max score: 4×1 + 5×2 + 5×3 + 4×4 = 4 + 10 + 15 + 16 = 45

export function determineLevel(score: number): {
  level: string; sublevel: string; label: string;
  description: string; startChapter: string; estimationMonths: number;
} {
  if (score <= 5)  return { level: "A1", sublevel: "A1.1", label: "Pemula Awal", description: "Kamu masih di tahap fondasi. Mulai dari dasar akan bangun trust-mu dengan bahasa barumu.", startChapter: "Chapter 1: First Steps", estimationMonths: 10 };
  if (score <= 10) return { level: "A1", sublevel: "A1.2", label: "Pemula Berkembang", description: "Kamu sudah tau dasar. Siap lanjut ke daily life vocabulary.", startChapter: "Chapter 2: Daily Life", estimationMonths: 9 };
  if (score <= 14) return { level: "A1", sublevel: "A1.3", label: "Pemula Lanjutan", description: "Fondasi A1 sudah baik. Tinggal polish ke percakapan sosial.", startChapter: "Chapter 3: Social Basics", estimationMonths: 8 };
  if (score <= 19) return { level: "A2", sublevel: "A2.1", label: "Pra-Menengah Awal", description: "Kamu punya dasar kuat. Saatnya naik ke past tense.", startChapter: "A2 Chapter 1: Beyond Basics", estimationMonths: 7 };
  if (score <= 23) return { level: "A2", sublevel: "A2.2", label: "Pra-Menengah Berkembang", description: "Past tense sudah lumayan. Fokus: travel, work, ekspresi diri.", startChapter: "A2 Chapter 2: Travel & Work", estimationMonths: 6 };
  if (score <= 28) return { level: "B1", sublevel: "B1.1", label: "Menengah Awal", description: "Impressive! Kamu di ambang fluency.", startChapter: "B1 Chapter 1: Fluency Foundations", estimationMonths: 5 };
  if (score <= 33) return { level: "B1", sublevel: "B1.2", label: "Menengah Berkembang", description: "Level B1 menengah. Tinggal polish akurasi.", startChapter: "B1 Chapter 2: Cultural Fluency", estimationMonths: 4 };
  if (score <= 37) return { level: "B1", sublevel: "B1.5", label: "Menengah Mahir", description: "Nyaris upper intermediate.", startChapter: "B1 Chapter 5: Professional Bridge", estimationMonths: 3 };
  if (score <= 42) return { level: "B2", sublevel: "B2.1", label: "Menengah Atas", description: "Upper intermediate. Fokus ke ekspresi advanced, academic, business.", startChapter: "B2 Chapter 1: Advanced Expression", estimationMonths: 3 };
  return             { level: "B2", sublevel: "B2.7", label: "Menengah Atas Mahir", description: "Level mendekati C1! Langsung target score tinggi IELTS/TOEFL.", startChapter: "B2 Chapter 7: Test Prep (IELTS/TOEFL)", estimationMonths: 2 };
}
