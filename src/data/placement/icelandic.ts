// ─────────────────────────────────────────────────────────────────────────────
// ICELANDIC (Íslenska) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const icelandicPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "is1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'halo' dalam bahasa Islandia?",
    options: ["Bless", "Halló", "Góða nótt", "Takk"],
    correct: 1,
    explanation: "'Halló' = halo (juga 'Hæ'). 'Bless' = sampai jumpa, 'Takk' = terima kasih.",
  },
  {
    id: "is2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "húsið", right: "rumah (itu)" },
      { left: "vatnið", right: "air (itu)" },
      { left: "brauðið", right: "roti (itu)" },
      { left: "kötturinn", right: "kucing (itu)" },
    ],
    explanation: "Bentuk tentu di Islandia melekat sbg akhiran: -ið (netral) / -inn (maskulin).",
  },
  {
    id: "is3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Ég ___ nemandi.' (Saya seorang murid.)",
    context: "Verba 'vera' (menjadi) untuk 'ég'.",
    options: ["er", "ert", "vera", "á"],
    correct: "er",
    explanation: "Verba 'vera': ég er, þú ert, hann er. Untuk 'ég' → 'er'.",
  },
  {
    id: "is4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["drekk", "Ég", "kaffi"],
    correct: ["Ég", "drekk", "kaffi"],
    explanation: "Verba di posisi ke-2 (V2-regla): 'Ég drekk kaffi'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "is5", difficulty: "A2", type: "multiple",
    question: "'Í gær ___ ég fótbolta.' (spila, þátíð/past)",
    options: ["spila", "spilaði", "spilað", "mun spila"],
    correct: 1,
    explanation: "Þátíð (past) 'spila' → 'spilaði'. Setelah 'Í gær', verba tetap di posisi 2.",
  },
  {
    id: "is6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan V2-regla (mulai dgn keterangan waktu):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["fór", "Í gær", "ég", "skólann", "í"],
    correct: ["Í gær", "fór", "ég", "í", "skólann"],
    explanation: "V2-regla: verba 'fór' harus di posisi ke-2, jadi subjek 'ég' pindah ke belakang verba.",
  },
  {
    id: "is7", difficulty: "A2", type: "missing",
    question: "Núliðin tíð (hafa + lýsingarháttur) — lengkapi:",
    template: "Ég ___ þegar ___ matinn.",
    blanks: ["hef", "borðað"],
    options: ["hef", "borðað", "er", "borðaði", "borða", "borðar"],
    explanation: "Present perfect: 'hafa' (hef) + partisip. Dari 'borða' (makan) = 'borðað'.",
  },
  {
    id: "is8", difficulty: "A2", type: "fillChoice",
    question: "'Þetta hús er ___ en hitt.' (perbandingan: lebih besar)",
    context: "Pilih bentuk komparatif dari 'stór'.",
    options: ["stór", "stærra", "stærst", "stóra"],
    correct: "stærra",
    explanation: "Komparatif 'stór' (besar, netral) → 'stærra'. Superlatif → 'stærst'.",
  },
  {
    id: "is9", difficulty: "A2", type: "multiple",
    question: "'Þú ___ að fara til læknis.' (kamu sebaiknya — saran)",
    options: ["verður", "ættir", "getur", "vilt"],
    correct: 1,
    explanation: "'ættir' (dari 'eiga að') menyatakan saran, mirip 'should'. 'Þú ættir að fara til læknis'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "is10", difficulty: "B1", type: "multiple",
    question: "'Ef ég ___ tíma, myndi ég ferðast meira.' (viðtengingarháttur/irrealis)",
    options: ["hef", "hefði", "hafa", "hafði"],
    correct: 1,
    explanation: "Pengandaian tidak nyata pakai viðtengingarháttur þátíðar: 'Ef ég hefði tíma, myndi ég ferðast'.",
  },
  {
    id: "is11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat dengan aukasetning (anak kalimat):",
    translation: "Saya tahu bahwa dia tidak datang.",
    tokens: ["ekki", "Ég", "að", "kemur", "hann", "veit"],
    correct: ["Ég", "veit", "að", "hann", "kemur", "ekki"],
    explanation: "Di aukasetning setelah 'að', urutan subjek-verba tetap, 'ekki' menyusul: 'að hann kemur ekki'.",
  },
  {
    id: "is12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konjungsi dengan artinya:",
    pairs: [
      { left: "af því að", right: "karena" },
      { left: "þótt", right: "meskipun" },
      { left: "svo að", right: "supaya" },
      { left: "á meðan", right: "sementara" },
    ],
    explanation: "Konjungsi subordinat B1 — memicu aukasetning.",
  },
  {
    id: "is13", difficulty: "B1", type: "missing",
    question: "Kasus (fall) setelah preposisi — lengkapi:",
    template: "Ég hugsa oft ___ framtíðina og ég hef áhuga ___ tónlist.",
    blanks: ["um", "á"],
    options: ["um", "á", "af", "í", "með", "fyrir"],
    explanation: "'hugsa um' (memikirkan) + þolfall, 'hafa áhuga á' (tertarik pada) + þágufall.",
  },
  {
    id: "is14", difficulty: "B1", type: "fillChoice",
    question: "'Maðurinn ___ ég sá í gær er nágranni minn.' (relatif)",
    context: "Pilih partikel relatif Islandia yang paling umum.",
    options: ["sem", "hver", "hvers", "hvað"],
    correct: "sem",
    explanation: "'sem' adalah partikel relatif universal Islandia: 'maðurinn sem ég sá'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "is15", difficulty: "B2", type: "multiple",
    question: "'Ef ég hefði vitað það, ___.' (irrealis fortíð)",
    options: [
      "myndi ég bregðast öðruvísi við",
      "hefði ég brugðist öðruvísi við",
      "brást ég öðruvísi við",
      "bregst ég öðruvísi við",
    ],
    correct: 1,
    explanation: "Pengandaian lampau tidak nyata: 'hefði ... brugðist við'. 'Ef ég hefði vitað það, hefði ég brugðist öðruvísi við'.",
  },
  {
    id: "is16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat pasif (þolmynd):",
    translation: "Buku itu ditulis tahun lalu.",
    tokens: ["var", "Bókin", "skrifuð", "í fyrra"],
    correct: ["Bókin", "var", "skrifuð", "í fyrra"],
    explanation: "Þolmynd: 'vera' (var) + lýsingarháttur þátíðar. 'skrifuð' setuju feminin dgn 'bókin'.",
  },
  {
    id: "is17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Nýja stefnan mun ___ afleiðingarnar, en sú gamla myndi aðeins ___ þær.",
    blanks: ["milda", "versna"],
    options: ["milda", "versna", "skapa", "styrkja", "koma á jafnvægi", "hindra"],
    explanation: "'milda' = meredakan, 'versna/gera verri' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "is18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nafnorðavæðingu (nominalisasi/gaya formal)?",
    options: [
      "Hún ákvað hratt.",
      "Ákvörðun hennar var hröð.",
      "Hún ákveður hratt.",
      "Hratt ákvað hún.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'ákveða' → nomina 'ákvörðun'. Ciri gaya tulisan formal.",
  },
];
