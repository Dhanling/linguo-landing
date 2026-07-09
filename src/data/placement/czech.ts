// ─────────────────────────────────────────────────────────────────────────────
// CZECH (Čeština) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const czechPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "cs1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'hai' (informal) dalam bahasa Ceko?",
    options: ["Na shledanou", "Ahoj", "Dobrou noc", "Děkuji"],
    correct: 1,
    explanation: "'Ahoj' = hai. 'Na shledanou' = sampai jumpa, 'Děkuji' = terima kasih.",
  },
  {
    id: "cs2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "dům", right: "rumah" },
      { left: "voda", right: "air" },
      { left: "chléb", right: "roti" },
      { left: "kočka", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Ceko tidak punya artikel, tapi punya 7 kasus.",
  },
  {
    id: "cs3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Já ___ student.' (Saya seorang mahasiswa.)",
    context: "Verba 'být' (menjadi) untuk 'já'.",
    options: ["jsem", "jsi", "je", "být"],
    correct: "jsem",
    explanation: "Verba 'být': já jsem, ty jsi, on je. Untuk 'já' → 'jsem'.",
  },
  {
    id: "cs4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["piju", "Já", "kávu"],
    correct: ["Já", "piju", "kávu"],
    explanation: "'Já piju kávu'. Verba 'pít' untuk 'já' → 'piju'. 'káva' → akusatif 'kávu'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "cs5", difficulty: "A2", type: "multiple",
    question: "'Včera jsem ___ fotbal.' (hrát, past — subjek laki-laki)",
    options: ["hraju", "hrál", "budu hrát", "hrát"],
    correct: 1,
    explanation: "Past = partisip-l + auxiliary 'jsem'. Laki-laki 'hrál' → 'Včera jsem hrál fotbal'.",
  },
  {
    id: "cs6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat lampau (perfektif):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["šel", "Včera", "školy", "jsem", "do"],
    correct: ["Včera", "jsem", "šel", "do", "školy"],
    explanation: "Auxiliary 'jsem' selalu di posisi kedua. 'jít' → 'šel'. 'do školy' (genitif).",
  },
  {
    id: "cs7", difficulty: "A2", type: "missing",
    question: "Aspek verba (nedok. vs dok.) — lengkapi:",
    template: "Obvykle ___ knihy, ale včera jsem ___ tuto knihu.",
    blanks: ["čtu", "přečetl"],
    options: ["čtu", "přečetl", "četl", "přečtu", "číst", "přečíst"],
    explanation: "Imperfektif 'čtu' (rutinitas), perfektif 'přečetl' (selesai tuntas).",
  },
  {
    id: "cs8", difficulty: "A2", type: "fillChoice",
    question: "'Jedu ___ Prahy.' (Saya sedang pergi ke Praha.)",
    context: "Pilih preposisi tujuan.",
    options: ["do", "na", "v", "od"],
    correct: "do",
    explanation: "Tujuan ke kota pakai 'do' + genitif: 'do Prahy'.",
  },
  {
    id: "cs9", difficulty: "A2", type: "multiple",
    question: "'Měl bys ___ k lékaři.' (Kamu sebaiknya ke dokter.)",
    options: ["jdeš", "jít", "šel", "půjdeš"],
    correct: 1,
    explanation: "Setelah 'měl bys' (sebaiknya) pakai infinitif → 'jít'. 'Měl bys jít k lékaři'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "cs10", difficulty: "B1", type: "multiple",
    question: "'Kdybych ___ čas, cestoval bych.' (podmiňovací způsob)",
    options: ["mám", "měl", "budu mít", "mít"],
    correct: 1,
    explanation: "Pengandaian pakai 'bych' + past: 'Kdybych měl čas, cestoval bych'.",
  },
  {
    id: "cs11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif lampau:",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["napsán", "Dopis", "včera", "byl"],
    correct: ["Dopis", "byl", "napsán", "včera"],
    explanation: "Pasif: 'být' (byl) + partisip pasif pendek 'napsán'. 'Dopis byl napsán včera'.",
  },
  {
    id: "cs12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konektor dengan artinya:",
    pairs: [
      { left: "protože", right: "karena" },
      { left: "i když", right: "meskipun" },
      { left: "aby", right: "supaya" },
      { left: "zatímco", right: "sementara" },
    ],
    explanation: "Konektor wacana penting di B1 untuk menghubungkan klausa.",
  },
  {
    id: "cs13", difficulty: "B1", type: "missing",
    question: "Genitiv setelah 'nemám' — lengkapi:",
    template: "Nemám dost ___ (čas) ani ___ (peníze).",
    blanks: ["času", "peněz"],
    options: ["času", "peněz", "čas", "peníze", "časem", "penězi"],
    explanation: "Setelah 'dost' (cukup) & dalam gaya baku setelah negasi dipakai genitif: 'čas' → 'času', 'peníze' → 'peněz'.",
  },
  {
    id: "cs14", difficulty: "B1", type: "fillChoice",
    question: "'Muž, ___ jsem viděl včera, je můj soused.' (vztažné zájmeno)",
    context: "Pilih bentuk 'který' yang tepat (objek, mask. bernyawa).",
    options: ["který", "kterého", "kterému", "kterým"],
    correct: "kterého",
    explanation: "Objek langsung mask. bernyawa → akusatif 'kterého'. 'muž, kterého jsem viděl'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "cs15", difficulty: "B2", type: "multiple",
    question: "'Kdybych to věděl, ___.' (minulý podmiňovací způsob)",
    options: [
      "jednal bych jinak",
      "byl bych jednal jinak",
      "jednal jsem jinak",
      "jednám jinak",
    ],
    correct: 1,
    explanation: "Kondisional lampau: 'byl bych + jednal'. 'Kdybych to věděl, byl bych jednal jinak'.",
  },
  {
    id: "cs16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan urutan klitik (2. pozice):",
    translation: "Saya sudah memberikannya (buku) kepadanya.",
    tokens: ["jsem", "Dal", "knihu", "mu", "tu"],
    correct: ["Dal", "jsem", "mu", "tu", "knihu"],
    explanation: "Klitik ('jsem', 'mu') menempel di posisi kedua kalimat (aturan Wackernagel). 'Dal jsem mu tu knihu'.",
  },
  {
    id: "cs17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Nová politika ___ následky, zatímco stará by je jen ___.",
    blanks: ["zmírní", "zhoršila"],
    options: ["zmírní", "zhoršila", "vytvoří", "posílí", "stabilizuje", "zabrání"],
    explanation: "'zmírnit' = meredakan, 'zhoršit' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "cs18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalizace (nominalisasi/gaya formal)?",
    options: [
      "Rozhodla se rychle.",
      "Její rozhodnutí bylo rychlé.",
      "Rozhoduje se rychle.",
      "Rychle se rozhodla.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'rozhodnout' → nomina 'rozhodnutí'. Ciri gaya tulisan formal.",
  },
];
