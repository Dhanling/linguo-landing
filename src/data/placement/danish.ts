// ─────────────────────────────────────────────────────────────────────────────
// DANISH (Dansk) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const danishPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "da1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'halo' dalam bahasa Denmark?",
    options: ["Farvel", "Hej", "God nat", "Tak"],
    correct: 1,
    explanation: "'Hej' = halo. 'Farvel' = selamat tinggal, 'Tak' = terima kasih.",
  },
  {
    id: "da2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "huset", right: "rumah (itu)" },
      { left: "vandet", right: "air (itu)" },
      { left: "brødet", right: "roti (itu)" },
      { left: "katten", right: "kucing (itu)" },
    ],
    explanation: "Bentuk tentu di Denmark melekat sbg akhiran: -et (intetkøn) / -en (fælleskøn).",
  },
  {
    id: "da3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Jeg ___ studerende.' (Saya seorang mahasiswa.)",
    context: "Verba 'være' (menjadi) — sama untuk semua subjek.",
    options: ["er", "være", "har", "bliver"],
    correct: "er",
    explanation: "'være' → 'er' untuk semua subjek (jeg er, du er, han er). Tanpa konjugasi orang.",
  },
  {
    id: "da4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["drikker", "Jeg", "kaffe"],
    correct: ["Jeg", "drikker", "kaffe"],
    explanation: "Verba di posisi ke-2 (V2-regel): 'Jeg drikker kaffe'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "da5", difficulty: "A2", type: "multiple",
    question: "'I går ___ jeg fodbold.' (spille, datid)",
    options: ["spiller", "spillede", "spillet", "skal spille"],
    correct: 1,
    explanation: "Datid (past): 'spille' → 'spillede'. Setelah 'I går', verba tetap di posisi 2.",
  },
  {
    id: "da6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan V2-regel (mulai dgn keterangan waktu):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["gik", "I går", "jeg", "skole", "i"],
    correct: ["I går", "gik", "jeg", "i", "skole"],
    explanation: "V2-regel: verba 'gik' harus di posisi ke-2, jadi subjek 'jeg' pindah ke belakang. 'gå i skole'.",
  },
  {
    id: "da7", difficulty: "A2", type: "missing",
    question: "Førnutid (har + kort tillægsform) — lengkapi:",
    template: "Jeg ___ allerede ___ maden.",
    blanks: ["har", "spist"],
    options: ["har", "spist", "er", "spiste", "spise", "spiser"],
    explanation: "Førnutid: 'har' + tillægsform. Dari 'spise' (makan) = 'spist'. 'Jeg har allerede spist maden'.",
  },
  {
    id: "da8", difficulty: "A2", type: "fillChoice",
    question: "'Dette hus er ___ end det der.' (perbandingan: lebih besar)",
    context: "Pilih bentuk komparatif dari 'stor'.",
    options: ["stor", "større", "størst", "store"],
    correct: "større",
    explanation: "Komparatif 'stor' (besar) → 'større'. Superlatif → 'størst'.",
  },
  {
    id: "da9", difficulty: "A2", type: "multiple",
    question: "'Du ___ gå til lægen.' (kamu sebaiknya — saran)",
    options: ["skal", "burde", "kan", "vil"],
    correct: 1,
    explanation: "'burde' menyatakan saran, mirip 'should'. 'Du burde gå til lægen'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "da10", difficulty: "B1", type: "multiple",
    question: "'Hvis jeg ___ tid, ville jeg rejse mere.' (irrealis)",
    options: ["har", "havde", "haft", "have"],
    correct: 1,
    explanation: "Pengandaian tidak nyata pakai datid: 'Hvis jeg havde tid, ville jeg rejse'.",
  },
  {
    id: "da11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun ledsætning (anak kalimat — 'ikke' sebelum verba):",
    translation: "Saya tahu bahwa dia tidak kommer.",
    tokens: ["ikke", "Jeg", "at", "kommer", "han", "ved"],
    correct: ["Jeg", "ved", "at", "han", "ikke", "kommer"],
    explanation: "Di ledsætning (setelah 'at'), 'ikke' datang SEBELUM verba: 'at han ikke kommer'.",
  },
  {
    id: "da12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konjungsi dengan artinya:",
    pairs: [
      { left: "fordi", right: "karena" },
      { left: "selvom", right: "meskipun" },
      { left: "så at", right: "supaya" },
      { left: "mens", right: "sementara" },
    ],
    explanation: "Konjungsi subordinat B1 — memicu urutan kata ledsætning.",
  },
  {
    id: "da13", difficulty: "B1", type: "missing",
    question: "Preposisi — lengkapi:",
    template: "Jeg tænker ofte ___ fremtiden og jeg er interesseret ___ musik.",
    blanks: ["på", "i"],
    options: ["på", "i", "af", "om", "med", "for"],
    explanation: "'tænke på' (memikirkan), 'interesseret i' (tertarik pada). Kombinasi dihafal.",
  },
  {
    id: "da14", difficulty: "B1", type: "fillChoice",
    question: "'Manden ___ jeg så i går, er min nabo.' (relatif)",
    context: "Pilih kata ganti relatif Denmark yang paling umum.",
    options: ["som", "hvilken", "hvis", "hvad"],
    correct: "som",
    explanation: "'som' (atau 'der') adalah relatif umum Denmark: 'manden som jeg så'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "da15", difficulty: "B2", type: "multiple",
    question: "'Hvis jeg havde vidst det, ___.' (irrealis datid)",
    options: [
      "ville jeg handle anderledes",
      "ville jeg have handlet anderledes",
      "handlede jeg anderledes",
      "har jeg handlet anderledes",
    ],
    correct: 1,
    explanation: "Pengandaian lampau tidak nyata: 'ville ... have handlet'. 'Hvis jeg havde vidst det, ville jeg have handlet anderledes'.",
  },
  {
    id: "da16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat pasif (s-passiv):",
    translation: "Buku itu dibaca oleh banyak orang.",
    tokens: ["læses", "Bogen", "mange", "af"],
    correct: ["Bogen", "læses", "af", "mange"],
    explanation: "S-passiv: tambahkan -s ke verba. 'læser' → 'læses' (dibaca). 'Bogen læses af mange'.",
  },
  {
    id: "da17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Den nye politik vil ___ konsekvenserne, mens den gamle kun ville ___ dem.",
    blanks: ["mildne", "forværre"],
    options: ["mildne", "forværre", "skabe", "forstærke", "stabilisere", "forhindre"],
    explanation: "'mildne' = meredakan, 'forværre' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "da18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalisering (gaya formal)?",
    options: [
      "Hun besluttede hurtigt.",
      "Hendes beslutning var hurtig.",
      "Hun beslutter hurtigt.",
      "Hurtigt besluttede hun.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'beslutte' → nomina 'beslutning'. Ciri gaya tulisan formal.",
  },
];
