// ─────────────────────────────────────────────────────────────────────────────
// POLISH (Polski) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const polishPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "pl1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'hai' (informal) dalam bahasa Polandia?",
    options: ["Do widzenia", "Cześć", "Dobranoc", "Dziękuję"],
    correct: 1,
    explanation: "'Cześć' (czeszcz) = hai. 'Do widzenia' = sampai jumpa, 'Dziękuję' = terima kasih.",
  },
  {
    id: "pl2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "dom", right: "rumah" },
      { left: "woda", right: "air" },
      { left: "chleb", right: "roti" },
      { left: "kot", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Polandia tidak punya artikel, tapi punya 7 kasus.",
  },
  {
    id: "pl3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Ja ___ studentem.' (Saya seorang mahasiswa.)",
    context: "Verba 'być' (menjadi) untuk 'ja'.",
    options: ["jestem", "jesteś", "jest", "być"],
    correct: "jestem",
    explanation: "Verba 'być': ja jestem, ty jesteś, on jest. Untuk 'ja' → 'jestem'. ('studentem' = instrumental.)",
  },
  {
    id: "pl4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["piję", "Ja", "kawę"],
    correct: ["Ja", "piję", "kawę"],
    explanation: "'Ja piję kawę'. Verba 'pić' untuk 'ja' → 'piję'. 'kawa' → akusatif 'kawę'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "pl5", difficulty: "A2", type: "multiple",
    question: "'Wczoraj ___ w piłkę.' (grać, past — subjek laki-laki)",
    options: ["gram", "grałem", "będę grać", "grać"],
    correct: 1,
    explanation: "Past tense ditandai gender: laki-laki '-łem' → 'grałem'. (Perempuan: 'grałam'.)",
  },
  {
    id: "pl6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat lampau (perfektif):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["poszedłem", "Wczoraj", "szkoły", "do"],
    correct: ["Wczoraj", "poszedłem", "do", "szkoły"],
    explanation: "'pójść' (perfektif) → 'poszedłem'. 'do + genitif': 'do szkoły'.",
  },
  {
    id: "pl7", difficulty: "A2", type: "missing",
    question: "Aspek verba (niedok. vs dok.) — lengkapi:",
    template: "Zwykle ___ książki, ale wczoraj ___ tę książkę do końca.",
    blanks: ["czytam", "przeczytałem"],
    options: ["czytam", "przeczytałem", "czytałem", "przeczytam", "czytać", "przeczytać"],
    explanation: "Imperfektif 'czytam' (rutinitas), perfektif 'przeczytałem' (selesai tuntas).",
  },
  {
    id: "pl8", difficulty: "A2", type: "fillChoice",
    question: "'Jadę ___ Warszawy.' (Saya sedang pergi ke Warsawa.)",
    context: "Pilih preposisi tujuan.",
    options: ["do", "na", "w", "od"],
    correct: "do",
    explanation: "Tujuan ke kota pakai 'do' + genitif: 'do Warszawy'.",
  },
  {
    id: "pl9", difficulty: "A2", type: "multiple",
    question: "'Powinieneś ___ do lekarza.' (Kamu sebaiknya ke dokter.)",
    options: ["idziesz", "pójść", "poszedłeś", "pójdziesz"],
    correct: 1,
    explanation: "Setelah 'powinieneś' pakai infinitif → 'pójść'. 'Powinieneś pójść do lekarza'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "pl10", difficulty: "B1", type: "multiple",
    question: "'Gdybym ___ czas, podróżowałbym.' (tryb przypuszczający)",
    options: ["mam", "miał", "będę miał", "mieć"],
    correct: 1,
    explanation: "Pengandaian pakai 'by' + past: 'Gdybym miał czas, podróżowałbym'.",
  },
  {
    id: "pl11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif lampau:",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["napisany", "List", "wczoraj", "został"],
    correct: ["List", "został", "napisany", "wczoraj"],
    explanation: "Pasif: 'zostać' (został) + partisip 'napisany'. 'List został napisany wczoraj'.",
  },
  {
    id: "pl12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konektor dengan artinya:",
    pairs: [
      { left: "ponieważ", right: "karena" },
      { left: "chociaż", right: "meskipun" },
      { left: "żeby", right: "supaya" },
      { left: "podczas gdy", right: "sementara" },
    ],
    explanation: "Konektor wacana penting di B1 untuk menghubungkan klausa.",
  },
  {
    id: "pl13", difficulty: "B1", type: "missing",
    question: "Dopełniacz (genitif) setelah 'nie ma' — lengkapi:",
    template: "Nie mam ___ (czas) ani ___ (pieniądze).",
    blanks: ["czasu", "pieniędzy"],
    options: ["czasu", "pieniędzy", "czas", "pieniądze", "czasem", "pieniędzmi"],
    explanation: "Setelah negasi 'nie ma/nie mam' pakai genitif: 'czas' → 'czasu', 'pieniądze' → 'pieniędzy'.",
  },
  {
    id: "pl14", difficulty: "B1", type: "fillChoice",
    question: "'Mężczyzna, ___ widziałem wczoraj, to mój sąsiad.' (zaimek względny)",
    context: "Pilih bentuk 'który' yang tepat (objek, mask. bernyawa).",
    options: ["który", "którego", "któremu", "którym"],
    correct: "którego",
    explanation: "Objek langsung mask. bernyawa → akusatif = genitif 'którego'. 'mężczyzna, którego widziałem'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "pl15", difficulty: "B2", type: "multiple",
    question: "'Gdybym wiedział, ___.' (tryb przypuszczający o przeszłości)",
    options: [
      "postąpię inaczej",
      "postąpiłbym inaczej",
      "postąpiłem inaczej",
      "postępuję inaczej",
    ],
    correct: 1,
    explanation: "Pengandaian pakai 'by' + past: 'Gdybym wiedział, postąpiłbym inaczej'.",
  },
  {
    id: "pl16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan imiesłów współczesny (adverbial participle):",
    translation: "Sambil membaca buku, saya minum kopi.",
    tokens: ["książkę", "Czytając", "kawę", "piłem"],
    correct: ["Czytając", "książkę", "piłem", "kawę"],
    explanation: "Imiesłów 'czytając' (sambil membaca) menyatakan aksi bersamaan. 'Czytając książkę, piłem kawę'.",
  },
  {
    id: "pl17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Nowa polityka ___ konsekwencje, podczas gdy stara tylko by je ___.",
    blanks: ["złagodzi", "pogorszyła"],
    options: ["złagodzi", "pogorszyła", "stworzy", "wzmocni", "ustabilizuje", "zapobiegnie"],
    explanation: "'złagodzić' = meredakan, 'pogorszyć' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "pl18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalizacja (nominalisasi/gaya formal)?",
    options: [
      "Zdecydowała szybko.",
      "Jej decyzja była szybka.",
      "Ona decyduje szybko.",
      "Szybko zdecydowała.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'zdecydować' → nomina 'decyzja'. Ciri gaya tulisan formal.",
  },
];
