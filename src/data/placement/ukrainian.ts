// ─────────────────────────────────────────────────────────────────────────────
// UKRAINIAN (Українська) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const ukrainianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "uk1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'hai' (informal) dalam bahasa Ukraina?",
    options: ["До побачення", "Привіт", "Добраніч", "Дякую"],
    correct: 1,
    explanation: "'Привіт' (pryvit) = hai. 'До побачення' = sampai jumpa, 'Дякую' = terima kasih.",
  },
  {
    id: "uk2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "дім", right: "rumah" },
      { left: "вода", right: "air" },
      { left: "хліб", right: "roti" },
      { left: "кіт", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Ukraina tidak punya artikel.",
  },
  {
    id: "uk3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Я ___ українською.' (Saya berbicara bahasa Ukraina.)",
    context: "Konjugasi 'говорити' untuk 'я'.",
    options: ["говорю", "говориш", "говорить", "говорити"],
    correct: "говорю",
    explanation: "'говорити': я говорю, ти говориш, він говорить. Untuk 'я' → 'говорю'.",
  },
  {
    id: "uk4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["п'ю", "Я", "каву"],
    correct: ["Я", "п'ю", "каву"],
    explanation: "'Я п'ю каву'. Verba 'пити' untuk 'я' → 'п'ю'. 'кава' → akusatif 'каву'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "uk5", difficulty: "A2", type: "multiple",
    question: "'Вчора я ___ у футбол.' (грати, past — subjek laki-laki)",
    options: ["граю", "грав", "буду грати", "грати"],
    correct: 1,
    explanation: "Past tense ditandai gender: laki-laki '-в' → 'грав'. (Perempuan: 'грала'.)",
  },
  {
    id: "uk6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat lampau (perfektif):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["пішов", "Вчора", "школи", "до", "я"],
    correct: ["Вчора", "я", "пішов", "до", "школи"],
    explanation: "'піти' (perfektif) → 'пішов'. 'до + genitif': 'до школи'.",
  },
  {
    id: "uk7", difficulty: "A2", type: "missing",
    question: "Aspek verba (недок. vs док.) — lengkapi:",
    template: "Я зазвичай ___ книги, але вчора я ___ цю книгу до кінця.",
    blanks: ["читаю", "прочитав"],
    options: ["читаю", "прочитав", "читав", "прочитаю", "читати", "прочитати"],
    explanation: "Imperfektif 'читаю' (rutinitas), perfektif 'прочитав' (selesai tuntas). Inti sistem aspek.",
  },
  {
    id: "uk8", difficulty: "A2", type: "fillChoice",
    question: "'Я їду ___ Київ.' (Saya sedang pergi ke Kyiv.)",
    context: "Pilih preposisi gerakan (ke kota).",
    options: ["в", "на", "з", "від"],
    correct: "в",
    explanation: "Gerakan ke kota pakai 'в/у' + akusatif: 'в Київ' (у Київ).",
  },
  {
    id: "uk9", difficulty: "A2", type: "multiple",
    question: "'Тобі ___ піти до лікаря.' (Kamu perlu ke dokter — saran)",
    options: ["треба", "можна", "не можна", "будеш"],
    correct: 0,
    explanation: "'треба' + infinitif = perlu/harus (saran). 'Тобі треба піти до лікаря'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "uk10", difficulty: "B1", type: "multiple",
    question: "'Якби я ___ час, я б подорожував.' (умовний спосіб)",
    options: ["маю", "мав", "матиму", "мати"],
    correct: 1,
    explanation: "Pengandaian pakai 'би/б' + past: 'Якби я мав час, я б подорожував'.",
  },
  {
    id: "uk11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif lampau:",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["написаний", "Лист", "вчора", "був"],
    correct: ["Лист", "був", "написаний", "вчора"],
    explanation: "Pasif lampau: 'був' + partisip pasif 'написаний'. 'Лист був написаний вчора'.",
  },
  {
    id: "uk12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konjungsi dengan artinya:",
    pairs: [
      { left: "тому що", right: "karena" },
      { left: "хоча", right: "meskipun" },
      { left: "щоб", right: "supaya" },
      { left: "поки", right: "selama/sementara" },
    ],
    explanation: "Konjungsi subordinat B1 untuk menghubungkan klausa.",
  },
  {
    id: "uk13", difficulty: "B1", type: "missing",
    question: "Родовий відмінок setelah 'немає' — lengkapi:",
    template: "У мене немає ___ (час) і немає ___ (гроші).",
    blanks: ["часу", "грошей"],
    options: ["часу", "грошей", "час", "гроші", "часом", "грошима"],
    explanation: "Setelah 'немає' pakai genitif: 'час' → 'часу', 'гроші' → 'грошей'.",
  },
  {
    id: "uk14", difficulty: "B1", type: "fillChoice",
    question: "'Чоловік, ___ я бачив учора, — мій сусід.' (відносний)",
    context: "Pilih bentuk 'який' yang tepat (objek, mask. bernyawa).",
    options: ["який", "якого", "якому", "яким"],
    correct: "якого",
    explanation: "Objek langsung mask. bernyawa → akusatif = genitif 'якого'. 'чоловік, якого я бачив'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "uk15", difficulty: "B2", type: "multiple",
    question: "'Якби я знав, ___.' (умовний спосіб про минуле)",
    options: [
      "я вчиню інакше",
      "я б вчинив інакше",
      "я вчинив інакше",
      "я вчиняю інакше",
    ],
    correct: 1,
    explanation: "Pengandaian selalu pakai 'би/б' + past: 'я б вчинив інакше'.",
  },
  {
    id: "uk16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan дієприслівник (adverbial participle):",
    translation: "Setelah membaca buku, saya пішов tidur.",
    tokens: ["книгу", "Прочитавши", "спати", "я", "пішов"],
    correct: ["Прочитавши", "книгу", "я", "пішов", "спати"],
    explanation: "Дієприслівник 'прочитавши' (setelah membaca) menandai aksi mendahului. 'Прочитавши книгу, я пішов спати'.",
  },
  {
    id: "uk17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Нова політика ___ наслідки, тоді як стара лише ___ би їх.",
    blanks: ["пом'якшить", "погіршила"],
    options: ["пом'якшить", "погіршила", "створить", "посилить", "стабілізує", "запобігне"],
    explanation: "'пом'якшити' = meredakan, 'погіршити' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "uk18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan номіналізація (nominalisasi/gaya formal)?",
    options: [
      "Вона швидко вирішила.",
      "Її рішення було швидким.",
      "Вона вирішує швидко.",
      "Швидко вона вирішила.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'вирішити' → nomina 'рішення'. Ciri gaya tulisan formal.",
  },
];
