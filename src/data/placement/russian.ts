// ─────────────────────────────────────────────────────────────────────────────
// RUSSIAN (Русский) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const russianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "ru1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'hai' (informal) dalam bahasa Rusia?",
    options: ["До свидания", "Привет", "Спокойной ночи", "Спасибо"],
    correct: 1,
    explanation: "'Привет' (privyet) = hai. 'До свидания' = sampai jumpa, 'Спасибо' = terima kasih.",
  },
  {
    id: "ru2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "дом", right: "rumah" },
      { left: "вода", right: "air" },
      { left: "хлеб", right: "roti" },
      { left: "кошка", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Rusia tidak punya artikel.",
  },
  {
    id: "ru3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Я ___ по-русски.' (Saya berbicara bahasa Rusia.)",
    context: "Konjugasi 'говорить' untuk 'я'.",
    options: ["говорю", "говоришь", "говорит", "говорить"],
    correct: "говорю",
    explanation: "'говорить': я говорю, ты говоришь, он говорит. Untuk 'я' → 'говорю'. (Catatan: 'to be' di present tidak dipakai.)",
  },
  {
    id: "ru4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["пью", "Я", "кофе"],
    correct: ["Я", "пью", "кофе"],
    explanation: "'Я пью кофе'. Verba 'пить' (minum) untuk 'я' → 'пью'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "ru5", difficulty: "A2", type: "multiple",
    question: "'Вчера я ___ в футбол.' (играть, past — subjek laki-laki)",
    options: ["играю", "играл", "буду играть", "играть"],
    correct: 1,
    explanation: "Past tense ditandai gender: laki-laki '-л' → 'играл'. (Perempuan: 'играла'.)",
  },
  {
    id: "ru6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat lampau (perfektif):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["пошёл", "Вчера", "школу", "в", "я"],
    correct: ["Вчера", "я", "пошёл", "в", "школу"],
    explanation: "'пойти' (perfektif) → 'пошёл'. Gerakan 'в + akusatif': 'в школу'.",
  },
  {
    id: "ru7", difficulty: "A2", type: "missing",
    question: "Aspek verba (несов. vs сов.) — lengkapi:",
    template: "Я обычно ___ книги, но вчера я ___ эту книгу до конца.",
    blanks: ["читаю", "прочитал"],
    options: ["читаю", "прочитал", "читал", "прочитаю", "читать", "прочитать"],
    explanation: "Imperfektif 'читаю' (rutinitas), perfektif 'прочитал' (selesai tuntas). Ini inti sistem aspek.",
  },
  {
    id: "ru8", difficulty: "A2", type: "fillChoice",
    question: "'Я еду ___ Москву.' (Saya sedang pergi ke Moskow.)",
    context: "Pilih preposisi gerakan (ke kota).",
    options: ["в", "на", "из", "от"],
    correct: "в",
    explanation: "Gerakan ke tempat tertutup/kota pakai 'в' + akusatif: 'в Москву'.",
  },
  {
    id: "ru9", difficulty: "A2", type: "multiple",
    question: "'Тебе ___ пойти к врачу.' (Kamu perlu ke dokter — saran)",
    options: ["надо", "можно", "нельзя", "будешь"],
    correct: 0,
    explanation: "'надо' + infinitif = perlu/harus (saran). 'Тебе надо пойти к врачу'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "ru10", difficulty: "B1", type: "multiple",
    question: "'Если бы у меня ___ время, я бы путешествовал.' (сослагательное)",
    options: ["есть", "было", "будет", "быть"],
    correct: 1,
    explanation: "Pengandaian pakai 'бы' + past: 'Если бы у меня было время, я бы путешествовал'.",
  },
  {
    id: "ru11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif lampau:",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["написано", "Письмо", "вчера", "было"],
    correct: ["Письмо", "было", "написано", "вчера"],
    explanation: "Pasif lampau: 'было' + partisip pasif pendek 'написано'. 'Письмо было написано вчера'.",
  },
  {
    id: "ru12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konjungsi dengan artinya:",
    pairs: [
      { left: "потому что", right: "karena" },
      { left: "хотя", right: "meskipun" },
      { left: "чтобы", right: "supaya" },
      { left: "пока", right: "selama/sementara" },
    ],
    explanation: "Konjungsi subordinat B1 untuk menghubungkan klausa.",
  },
  {
    id: "ru13", difficulty: "B1", type: "missing",
    question: "Родительный падеж setelah 'нет' — lengkapi:",
    template: "У меня нет ___ (время) и нет ___ (деньги).",
    blanks: ["времени", "денег"],
    options: ["времени", "денег", "время", "деньги", "временем", "деньгами"],
    explanation: "Setelah 'нет' pakai genitif: 'время' → 'времени', 'деньги' → 'денег'.",
  },
  {
    id: "ru14", difficulty: "B1", type: "fillChoice",
    question: "'Человек, ___ я видел вчера, — мой сосед.' (относительное)",
    context: "Pilih bentuk 'который' yang tepat (objek, mask. bernyawa).",
    options: ["который", "которого", "которому", "которым"],
    correct: "которого",
    explanation: "Objek langsung mask. bernyawa → akusatif = genitif 'которого'. 'человек, которого я видел'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "ru15", difficulty: "B2", type: "multiple",
    question: "'Если бы я знал, ___.' (сослагательное о прошлом)",
    options: [
      "я поступлю иначе",
      "я бы поступил иначе",
      "я поступил иначе",
      "я поступаю иначе",
    ],
    correct: 1,
    explanation: "Pengandaian (masa lalu maupun sekarang) selalu pakai 'бы' + past: 'я бы поступил иначе'.",
  },
  {
    id: "ru16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan деепричастие (adverbial participle):",
    translation: "Setelah membaca buku, saya pergi tidur.",
    tokens: ["книгу", "Прочитав", "спать", "я", "лёг"],
    correct: ["Прочитав", "книгу", "я", "лёг", "спать"],
    explanation: "Деепричастие 'прочитав' (setelah membaca) menyatakan aksi yang mendahului. 'Прочитав книгу, я лёг спать'.",
  },
  {
    id: "ru17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Новая политика ___ последствия, тогда как старая только ___ бы их.",
    blanks: ["смягчит", "усугубила"],
    options: ["смягчит", "усугубила", "создаст", "усилит", "стабилизирует", "предотвратит"],
    explanation: "'смягчить' = meredakan, 'усугубить' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "ru18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan номинализация (nominalisasi/gaya formal)?",
    options: [
      "Она быстро решила.",
      "Её решение было быстрым.",
      "Она решает быстро.",
      "Быстро она решила.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'решить' → nomina 'решение'. Ciri gaya tulisan formal.",
  },
];
