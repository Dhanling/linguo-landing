// ─────────────────────────────────────────────────────────────────────────────
// SWEDISH (Svenska) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const swedishPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "sv1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'halo' dalam bahasa Swedia?",
    options: ["Hej då", "Hej", "God natt", "Tack"],
    correct: 1,
    explanation: "'Hej' = halo. 'Hej då' = sampai jumpa, 'Tack' = terima kasih.",
  },
  {
    id: "sv2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "huset", right: "rumah (itu)" },
      { left: "vattnet", right: "air (itu)" },
      { left: "brödet", right: "roti (itu)" },
      { left: "katten", right: "kucing (itu)" },
    ],
    explanation: "Bentuk tentu (definite) di Swedia melekat sbg akhiran: -et (ett-word) / -en (en-word).",
  },
  {
    id: "sv3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Jag ___ student.' (Saya seorang mahasiswa.)",
    context: "Verba 'vara' (menjadi) — bentuknya sama untuk semua subjek.",
    options: ["är", "vara", "har", "blir"],
    correct: "är",
    explanation: "'vara' → 'är' untuk semua subjek (jag är, du är, han är). Tidak ada konjugasi orang.",
  },
  {
    id: "sv4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["dricker", "Jag", "kaffe"],
    correct: ["Jag", "dricker", "kaffe"],
    explanation: "Verba di posisi ke-2 (V2-rule): 'Jag dricker kaffe'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "sv5", difficulty: "A2", type: "multiple",
    question: "'Igår ___ jag fotboll.' (spela, preteritum)",
    options: ["spelar", "spelade", "spelat", "ska spela"],
    correct: 1,
    explanation: "Preteritum (past) verba -ar → -ade: 'spelade'. Perhatikan V2: setelah 'Igår', verba di posisi 2.",
  },
  {
    id: "sv6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan V2-rule (mulai dgn keterangan waktu):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["gick", "Igår", "jag", "skolan", "till"],
    correct: ["Igår", "gick", "jag", "till", "skolan"],
    explanation: "V2-rule: verba 'gick' HARUS di posisi ke-2, jadi subjek 'jag' pindah ke belakang verba.",
  },
  {
    id: "sv7", difficulty: "A2", type: "missing",
    question: "Perfekt (har + supinum) — lengkapi:",
    template: "Jag ___ redan ___ maten.",
    blanks: ["har", "ätit"],
    options: ["har", "ätit", "är", "åt", "äta", "äter"],
    explanation: "Perfekt: 'har' + supinum. Supinum dari 'äta' (makan) = 'ätit'. 'Jag har redan ätit maten'.",
  },
  {
    id: "sv8", difficulty: "A2", type: "fillChoice",
    question: "'Det här huset är ___ än det där.' (perbandingan: lebih besar)",
    context: "Pilih bentuk komparatif dari 'stor'.",
    options: ["stor", "större", "störst", "stora"],
    correct: "större",
    explanation: "Komparatif 'stor' (besar) → 'större'. Superlatif → 'störst'.",
  },
  {
    id: "sv9", difficulty: "A2", type: "multiple",
    question: "'Du ___ gå till läkaren.' (kamu sebaiknya — saran)",
    options: ["måste", "borde", "kan", "vill"],
    correct: 1,
    explanation: "'borde' menyatakan saran, mirip 'should'. 'Du borde gå till läkaren'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "sv10", difficulty: "B1", type: "multiple",
    question: "'Om jag ___ tid, skulle jag resa mer.' (irrealis)",
    options: ["har", "hade", "haft", "ha"],
    correct: 1,
    explanation: "Pengandaian tidak nyata pakai preteritum: 'Om jag hade tid, skulle jag resa'.",
  },
  {
    id: "sv11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat dengan bisats (anak kalimat — urutan BIFF):",
    translation: "Saya tahu bahwa dia tidak datang.",
    tokens: ["inte", "Jag", "att", "kommer", "han", "vet"],
    correct: ["Jag", "vet", "att", "han", "inte", "kommer"],
    explanation: "Di anak kalimat (setelah 'att'), 'inte' datang SEBELUM verba (BIFF-regeln): 'att han inte kommer'.",
  },
  {
    id: "sv12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konjungsi dengan artinya:",
    pairs: [
      { left: "eftersom", right: "karena" },
      { left: "fastän", right: "meskipun" },
      { left: "så att", right: "supaya" },
      { left: "medan", right: "sementara" },
    ],
    explanation: "Konjungsi subordinat B1 — memicu urutan kata anak kalimat (BIFF).",
  },
  {
    id: "sv13", difficulty: "B1", type: "missing",
    question: "Preposisi — lengkapi:",
    template: "Jag tänker ofta ___ framtiden och jag är intresserad ___ musik.",
    blanks: ["på", "av"],
    options: ["på", "av", "i", "om", "med", "för"],
    explanation: "'tänka på' (memikirkan), 'intresserad av' (tertarik pada). Kombinasi verba+preposisi dihafal.",
  },
  {
    id: "sv14", difficulty: "B1", type: "fillChoice",
    question: "'Mannen ___ jag såg igår är min granne.' (relatif)",
    context: "Pilih kata ganti relatif Swedia yang paling umum.",
    options: ["som", "vilken", "vars", "vad"],
    correct: "som",
    explanation: "'som' adalah relatif universal Swedia untuk subjek & objek: 'mannen som jag såg'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "sv15", difficulty: "B2", type: "multiple",
    question: "'Om jag hade vetat det, ___.' (irrealis dåtid)",
    options: [
      "skulle jag agera annorlunda",
      "skulle jag ha agerat annorlunda",
      "agerade jag annorlunda",
      "har jag agerat annorlunda",
    ],
    correct: 1,
    explanation: "Pengandaian lampau tidak nyata: 'skulle ... ha agerat'. 'Om jag hade vetat det, skulle jag ha agerat annorlunda'.",
  },
  {
    id: "sv16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat pasif (s-passiv):",
    translation: "Buku itu dibaca oleh banyak orang.",
    tokens: ["läses", "Boken", "många", "av"],
    correct: ["Boken", "läses", "av", "många"],
    explanation: "S-passiv: tambahkan -s ke verba. 'läser' → 'läses' (dibaca). 'Boken läses av många'.",
  },
  {
    id: "sv17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Den nya politiken kommer att ___ konsekvenserna, medan den gamla bara skulle ___ dem.",
    blanks: ["mildra", "förvärra"],
    options: ["mildra", "förvärra", "skapa", "förstärka", "stabilisera", "förhindra"],
    explanation: "'mildra' = meredakan, 'förvärra' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "sv18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalisering (gaya formal)?",
    options: [
      "Hon beslutade snabbt.",
      "Hennes beslut var snabbt.",
      "Hon beslutar snabbt.",
      "Snabbt beslutade hon.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'besluta' → nomina 'beslut'. Ciri gaya tulisan formal.",
  },
];
