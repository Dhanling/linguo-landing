// ─────────────────────────────────────────────────────────────────────────────
// HUNGARIAN (Magyar) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const hungarianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "hu1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'halo' (informal) dalam bahasa Hungaria?",
    options: ["Viszlát", "Szia", "Jó éjszakát", "Köszönöm"],
    correct: 1,
    explanation: "'Szia' = halo/dah (informal). 'Viszlát' = sampai jumpa, 'Köszönöm' = terima kasih.",
  },
  {
    id: "hu2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "ház", right: "rumah" },
      { left: "víz", right: "air" },
      { left: "kenyér", right: "roti" },
      { left: "macska", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Hungaria tidak punya gender gramatikal.",
  },
  {
    id: "hu3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Én ___ diák.' (Saya seorang murid.)",
    context: "Verba 'lenni' (menjadi) untuk 'én'.",
    options: ["vagyok", "vagy", "van", "lenni"],
    correct: "vagyok",
    explanation: "Verba 'lenni': én vagyok, te vagy, ő van. Untuk 'én' → 'vagyok'.",
  },
  {
    id: "hu4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya kávét iszom. (Saya minum kopi.)",
    tokens: ["iszom", "Én", "kávét"],
    correct: ["Én", "kávét", "iszom"],
    explanation: "'Én kávét iszom'. Objek 'kávé' → 'kávét' (akhiran akusatif -t). Verba di akhir lazim.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "hu5", difficulty: "A2", type: "multiple",
    question: "'Tegnap ___ (futballozni, past).' (Kemarin saya bermain bola.)",
    options: ["futballozom", "futballoztam", "futballozni", "futballozik"],
    correct: 1,
    explanation: "Past tense untuk 'én': tambahkan -tam/-tem. 'futballoztam' = saya (telah) bermain bola.",
  },
  {
    id: "hu6", difficulty: "A2", type: "missing",
    question: "Rag helyhatározó (arah) — lengkapi:",
    template: "Az iskolá___ megyek, és a ház___ vagyok.",
    blanks: ["ba", "ban"],
    options: ["ba", "ban", "ból", "hoz", "on", "ra"],
    explanation: "'-ba/-be' = ke dalam (iskolába), '-ban/-ben' = di dalam (házban). Vowel harmony menentukan bentuk.",
  },
  {
    id: "hu7", difficulty: "A2", type: "fillChoice",
    question: "'Nekem ___ egy autóm.' (Saya punya sebuah mobil.)",
    context: "Struktur kepemilikan Hungaria.",
    options: ["van", "vagyok", "vagy", "lenni"],
    correct: "van",
    explanation: "Kepemilikan: 'Nekem van ...' (harfiah: 'pada saya ada ...'). Benda dpt akhiran posesif -m.",
  },
  {
    id: "hu8", difficulty: "A2", type: "multiple",
    question: "'Ez a ház ___, mint az.' (rumah ini lebih besar)",
    options: ["nagy", "nagyobb", "legnagyobb", "nagyon"],
    correct: 1,
    explanation: "Komparatif 'nagy' (besar) → 'nagyobb' (-bb). Superlatif → 'legnagyobb'.",
  },
  {
    id: "hu9", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat konjugasi tentu (határozott ragozás):",
    translation: "Saya melihat rumah itu.",
    tokens: ["látom", "Én", "házat", "a"],
    correct: ["Én", "látom", "a", "házat"],
    explanation: "Objek tentu ('a házat') → konjugasi tentu 'látom' (bukan 'látok'). 'Én látom a házat'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "hu10", difficulty: "B1", type: "multiple",
    question: "'Ha ___ időm, többet utaznék.' (feltételes mód/kondisional)",
    options: ["van", "lenne", "volt", "legyen"],
    correct: 1,
    explanation: "Pengandaian: 'Ha lenne időm, többet utaznék' (kondisional 'lenne' + 'utaznék').",
  },
  {
    id: "hu11", difficulty: "B1", type: "missing",
    question: "Igekötő (preverb terpisah) — lengkapi:",
    template: "___ szeretném hívni, de most nem tudom ___ hívni.",
    blanks: ["Fel", "fel"],
    options: ["Fel", "fel", "le", "meg", "ki", "be"],
    explanation: "'felhívni' (menelepon) — igekötő 'fel' bisa terpisah dari verba tergantung penekanan.",
  },
  {
    id: "hu12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konjungsi dengan artinya:",
    pairs: [
      { left: "mert", right: "karena" },
      { left: "bár", right: "meskipun" },
      { left: "hogy", right: "bahwa/agar" },
      { left: "amíg", right: "selama" },
    ],
    explanation: "Konjungsi subordinat B1 untuk menghubungkan klausa.",
  },
  {
    id: "hu13", difficulty: "B1", type: "fillChoice",
    question: "'Az a férfi, ___ tegnap láttam, a szomszédom.' (relatif)",
    context: "Pilih pronomina relatif untuk objek.",
    options: ["aki", "akit", "ami", "amely"],
    correct: "akit",
    explanation: "Untuk orang sebagai objek: 'aki' → 'akit' (akusatif). 'a férfi, akit láttam'.",
  },
  {
    id: "hu14", difficulty: "B1", type: "multiple",
    question: "'Muszáj ___ az orvoshoz.' (Kamu harus ke dokter.)",
    options: ["mész", "menni", "megy", "mentem"],
    correct: 1,
    explanation: "Setelah 'muszáj/kell' pakai infinitif → 'menni'. 'Muszáj menni az orvoshoz'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "hu15", difficulty: "B2", type: "multiple",
    question: "'Ha tudtam volna, ___.' (múlt idejű feltételes)",
    options: [
      "másképp cselekszem",
      "másképp cselekedtem volna",
      "másképp cselekedtem",
      "másképp fogok cselekedni",
    ],
    correct: 1,
    explanation: "Pengandaian lampau: 'past + volna'. 'Ha tudtam volna, másképp cselekedtem volna'.",
  },
  {
    id: "hu16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan struktur -va/-ve (keterangan):",
    translation: "Pintunya terbuka. (Pintu itu dalam keadaan terbuka.)",
    tokens: ["van", "Az", "ki", "nyitva", "ajtó"],
    correct: ["Az", "ajtó", "ki", "van", "nyitva"],
    explanation: "Struktur keadaan: '-va/-ve' + 'van'. 'Az ajtó ki van nyitva' = pintu (dalam keadaan) terbuka.",
  },
  {
    id: "hu17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Az új politika ___ a következményeket, míg a régi csak ___ azokat.",
    blanks: ["enyhíti", "súlyosbítaná"],
    options: ["enyhíti", "súlyosbítaná", "létrehozza", "erősíti", "stabilizálja", "megakadályozza"],
    explanation: "'enyhíteni' = meredakan, 'súlyosbítani' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "hu18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan főnevesítés (nominalisasi/gaya formal)?",
    options: [
      "Gyorsan döntött.",
      "A döntése gyors volt.",
      "Gyorsan hoz döntést.",
      "Ő gyorsan dönt.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'dönteni' → nomina 'döntés'. Ciri gaya tulisan formal.",
  },
];
