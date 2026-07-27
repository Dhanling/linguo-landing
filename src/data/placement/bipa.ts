import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// BIPA PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// BIPA = Bahasa Indonesia untuk Penutur Asing — test takers are foreigners,
// so ALL instructions, translations, and explanations are in ENGLISH.
// ─────────────────────────────────────────────────────────────────────────────
export const bipaPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "What does 'Selamat pagi' mean?",
    options: ["Good night", "Good morning", "Good afternoon", "Goodbye"],
    correct: 1,
    explanation: "'Selamat pagi' = good morning (until ~11 a.m.). 'Selamat siang' = good afternoon, 'Selamat malam' = good evening/night, 'Selamat tinggal' = goodbye.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Match the Indonesian verbs with their English meanings:",
    pairs: [
      { left: "makan", right: "to eat" },
      { left: "minum", right: "to drink" },
      { left: "tidur", right: "to sleep" },
      { left: "pergi", right: "to go" },
    ],
    explanation: "These are core daily verbs. Good news: Indonesian verbs never conjugate — 'makan' stays the same for I/you/she, past or future.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Complete: 'Nama ___ Sarah.' (My name is Sarah.)",
    context: "Choose the correct pronoun.",
    options: ["saya", "kamu", "dia", "mereka"],
    correct: "saya",
    explanation: "Possession follows the noun in Indonesian: 'nama saya' = literally 'name my'. 'kamu' = you (informal), 'dia' = he/she, 'mereka' = they.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Arrange the words into a correct sentence:",
    translation: "I eat fried rice.",
    tokens: ["nasi goreng", "Saya", "makan"],
    correct: ["Saya", "makan", "nasi goreng"],
    explanation: "Indonesian is SVO like English: Saya (I) + makan (eat) + nasi goreng. Note the modifier comes AFTER the noun: 'nasi goreng' = rice fried.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Which sentence means 'I have already eaten'?",
    options: [
      "Saya akan makan.",
      "Saya sudah makan.",
      "Saya sedang makan.",
      "Saya belum makan.",
    ],
    correct: 1,
    explanation: "Indonesian marks time with particles, not conjugation: 'sudah' = already (completed), 'akan' = will (future), 'sedang' = in the middle of (progressive), 'belum' = not yet.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Arrange the words into a correct sentence:",
    translation: "Yesterday I went to the market.",
    tokens: ["ke pasar", "Kemarin", "saya", "pergi"],
    correct: ["Kemarin", "saya", "pergi", "ke pasar"],
    explanation: "There is no past tense form — time words like 'kemarin' (yesterday) do the job. 'ke' = to (direction), 'pasar' = market.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Complete the sentence with the correct words:",
    template: "Toko itu ___ pukul 9 pagi dan ___ pukul 9 malam. (That shop opens at 9 a.m. and closes at 9 p.m.)",
    blanks: ["buka", "tutup"],
    options: ["buka", "tutup", "pergi", "datang", "mulai", "selesai"],
    explanation: "'buka' = open, 'tutup' = closed/to close — essential shop vocabulary. Distractors: 'pergi' = to go, 'datang' = to come, 'mulai' = to start, 'selesai' = finished.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Complete: 'Buku itu ___ mahal, saya tidak jadi beli.' (That book is too expensive, I didn't buy it.)",
    context: "Choose the correct degree word.",
    options: ["terlalu", "sangat", "agak", "kurang"],
    correct: "terlalu",
    explanation: "'terlalu' = too (excessively — with a negative result). 'sangat' = very, 'agak' = rather/somewhat, 'kurang' = not enough / insufficiently.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "From the root 'ajar' (teach/learn), which form means 'to teach (something)'?",
    options: ["belajar", "mengajar", "pelajar", "pelajaran"],
    correct: 1,
    explanation: "The meN- prefix creates active transitive verbs: 'mengajar' = to teach. 'belajar' (ber-) = to study, 'pelajar' (pe-) = student (person), 'pelajaran' (pe-...-an) = lesson/subject.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Match each affixed word (root: 'ajar') with its meaning:",
    pairs: [
      { left: "belajar", right: "to study" },
      { left: "mengajar", right: "to teach" },
      { left: "pelajar", right: "student" },
      { left: "pelajaran", right: "lesson / subject" },
    ],
    explanation: "Affixation is the heart of Indonesian grammar: one root ('ajar') generates a whole word family. Recognizing affix patterns lets you guess meanings of new words.",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Complete: 'Rumah itu sedang ___ oleh mereka.' (The house is being built by them.)",
    context: "Choose the correct passive form.",
    options: ["dibangun", "membangun", "bangunan", "terbangun"],
    correct: "dibangun",
    explanation: "The di- prefix marks the passive voice: 'dibangun' = is (being) built. 'membangun' = active (to build), 'bangunan' = a building (noun), 'terbangun' = accidentally woken up / suddenly built.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Complete the sentence with the correct words:",
    template: "___ hujan deras, kami ___ berangkat ke kantor. (Although it rained heavily, we still left for the office.)",
    blanks: ["Meskipun", "tetap"],
    options: ["Meskipun", "tetap", "Karena", "supaya", "akan", "sudah"],
    explanation: "'meskipun' = although (concessive conjunction), paired with 'tetap' = still/nevertheless. Distractors: 'karena' = because, 'supaya' = so that, 'akan' = will, 'sudah' = already.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "The sentence 'Saya kehujanan kemarin.' means:",
    options: [
      "I watched the rain yesterday",
      "I got caught in the rain yesterday",
      "I like the rain",
      "It will rain tomorrow",
    ],
    correct: 1,
    explanation: "The ke-...-an circumfix on a noun creates an 'adversative passive' — something unpleasant happened to you: 'kehujanan' = caught in the rain, 'kecopetan' = got pickpocketed, 'ketiduran' = fell asleep unintentionally.",
  },
  {
    id: "q14", difficulty: "B2", type: "multiple",
    question: "In a formal business letter, which word is appropriate for 'to inform'?",
    options: ["memberitahukan", "kasih tau", "ngomongin", "bilangin"],
    correct: 0,
    explanation: "'memberitahukan' is the formal register ('Dengan ini kami memberitahukan bahwa...'). 'kasih tau', 'ngomongin', and 'bilangin' are colloquial Jakarta-style forms — natural in chat, wrong in formal writing. Register control is a key B2 skill.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "The Indonesian proverb 'Sedikit demi sedikit, lama-lama menjadi bukit' is closest in meaning to:",
    options: [
      "Little by little, small things add up to something great",
      "The early bird catches the worm",
      "Don't judge a book by its cover",
      "Actions speak louder than words",
    ],
    correct: 0,
    explanation: "Literally 'little by little, over time it becomes a hill' — small consistent efforts (or savings) accumulate into something big, like English 'many a little makes a mickle'. Often used about saving money or steady learning.",
  },
];
