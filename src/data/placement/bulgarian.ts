// ─────────────────────────────────────────────────────────────────────────────
// BULGARIAN (Български) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const bulgarianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "bg1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'hai' (informal) dalam bahasa Bulgaria?",
    options: ["Довиждане", "Здравей", "Лека нощ", "Благодаря"],
    correct: 1,
    explanation: "'Здравей' (zdravey) = hai. 'Довиждане' = sampai jumpa, 'Благодаря' = terima kasih.",
  },
  {
    id: "bg2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "къща", right: "rumah" },
      { left: "вода", right: "air" },
      { left: "хляб", right: "roti" },
      { left: "котка", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Bulgaria unik di antara bahasa Slavia: TIDAK ada kasus.",
  },
  {
    id: "bg3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Аз ___ студент.' (Saya seorang mahasiswa.)",
    context: "Verba 'съм' (menjadi) untuk 'аз'.",
    options: ["съм", "си", "е", "сме"],
    correct: "съм",
    explanation: "Verba 'съм': аз съм, ти си, той е. Untuk 'аз' → 'съм'. (Beda dari Rusia, Bulgaria tetap pakai 'to be'.)",
  },
  {
    id: "bg4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["пия", "Аз", "кафе"],
    correct: ["Аз", "пия", "кафе"],
    explanation: "'Аз пия кафе'. Verba 'пия' (minum). Tanpa kasus, urutan katanya penting.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "bg5", difficulty: "A2", type: "multiple",
    question: "'Вчера ___ футбол.' (играя, минало/past untuk 'аз')",
    options: ["играя", "играх", "ще играя", "играл"],
    correct: 1,
    explanation: "Аорист (past selesai) 'играя' untuk 'аз' → 'играх'.",
  },
  {
    id: "bg6", difficulty: "A2", type: "missing",
    question: "Определителен член (artikel tentu = akhiran) — lengkapi:",
    template: "Виждам ___ (котка, опред.) и ___ (куче, опред.).",
    blanks: ["котката", "кучето"],
    options: ["котката", "кучето", "котка", "куче", "котки", "кучета"],
    explanation: "Artikel tentu Bulgaria melekat sbg akhiran: 'котка' → 'котката', 'куче' → 'кучето'.",
  },
  {
    id: "bg7", difficulty: "A2", type: "fillChoice",
    question: "'___ отида на училище утре.' (Saya akan ke sekolah besok.)",
    context: "Pilih penanda masa depan.",
    options: ["Ще", "Съм", "Бях", "Да"],
    correct: "Ще",
    explanation: "Masa depan Bulgaria = 'ще' + present. 'Ще отида на училище'.",
  },
  {
    id: "bg8", difficulty: "A2", type: "multiple",
    question: "'Трябва да ___ на лекар.' (Kamu harus/sebaiknya ke dokter.)",
    options: ["отиваш", "отидеш", "отиде", "ще отидеш"],
    correct: 1,
    explanation: "Bulgaria tidak punya infinitif; setelah 'трябва да' pakai present perfektif → 'отидеш'.",
  },
  {
    id: "bg9", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan artikel tentu di posisi subjek:",
    translation: "Rumah besar itu ada di sana.",
    tokens: ["къща", "Голямата", "там", "е"],
    correct: ["Голямата", "къща", "е", "там"],
    explanation: "Bila ada kata sifat, artikel pindah ke kata sifat: 'голямата къща' = rumah besar itu.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "bg10", difficulty: "B1", type: "multiple",
    question: "'Ако ___ време, щях да пътувам.' (условно наклонение)",
    options: ["имам", "имах", "ще имам", "имал"],
    correct: 1,
    explanation: "Pengandaian tak nyata: 'Ако имах време, щях да пътувам' (imperfekt + щях да).",
  },
  {
    id: "bg11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif lampau:",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["написано", "Писмото", "вчера", "беше"],
    correct: ["Писмото", "беше", "написано", "вчера"],
    explanation: "Pasif lampau: 'беше' + partisip pasif 'написано'. 'Писмото беше написано вчера'.",
  },
  {
    id: "bg12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konektor dengan artinya:",
    pairs: [
      { left: "защото", right: "karena" },
      { left: "въпреки че", right: "meskipun" },
      { left: "за да", right: "supaya" },
      { left: "докато", right: "selama/sementara" },
    ],
    explanation: "Konektor wacana penting di B1 untuk menghubungkan klausa.",
  },
  {
    id: "bg13", difficulty: "B1", type: "missing",
    question: "Конструкция с 'да' — lengkapi:",
    template: "Надявам се да ___ добре и да ___ скоро.",
    blanks: ["си", "дойдеш"],
    options: ["си", "дойдеш", "съм", "дойда", "е", "идваш"],
    explanation: "Setelah 'надявам се да' pakai present (untuk 'ти'): 'да си добре', 'да дойдеш скоро'.",
  },
  {
    id: "bg14", difficulty: "B1", type: "fillChoice",
    question: "'Мъжът, ___ видях вчера, е мой съсед.' (относително)",
    context: "Pilih bentuk relatif untuk objek (mask., orang).",
    options: ["който", "когото", "на когото", "чийто"],
    correct: "когото",
    explanation: "Untuk objek langsung yang berupa orang (mask.) pakai 'когото': 'мъжът, когото видях'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "bg15", difficulty: "B2", type: "multiple",
    question: "'Ако знаех, ___.' (условно за минало)",
    options: [
      "ще постъпя различно",
      "щях да постъпя различно",
      "постъпих различно",
      "постъпвам различно",
    ],
    correct: 1,
    explanation: "Pengandaian lampau tak nyata: 'щях да постъпя различно'. 'Ако знаех, щях да постъпя различно'.",
  },
  {
    id: "bg16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan клитики (urutan pronomina):",
    translation: "Saya sudah memberikannya (itu) kepadanya.",
    tokens: ["го", "Аз", "дадох", "му"],
    correct: ["Аз", "му", "го", "дадох"],
    explanation: "Urutan klitik ketat: датив (му) sebelum акузатив (го). 'Аз му го дадох'.",
  },
  {
    id: "bg17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Новата политика ще ___ последиците, докато старата само би ги ___.",
    blanks: ["смекчи", "влошила"],
    options: ["смекчи", "влошила", "създаде", "засили", "стабилизира", "предотврати"],
    explanation: "'смекча' = meredakan, 'влоша' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "bg18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan номинализация (nominalisasi/gaya formal)?",
    options: [
      "Тя реши бързо.",
      "Нейното решение беше бързо.",
      "Тя решава бързо.",
      "Бързо тя реши.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'реша' → nomina 'решение'. Ciri gaya tulisan formal.",
  },
];
