// ─────────────────────────────────────────────────────────────────────────────
// NORWEGIAN (Norsk/Bokmål) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const norwegianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "no1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'halo' dalam bahasa Norwegia?",
    options: ["Ha det", "Hei", "God natt", "Takk"],
    correct: 1,
    explanation: "'Hei' = halo. 'Ha det' = sampai jumpa, 'Takk' = terima kasih.",
  },
  {
    id: "no2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "huset", right: "rumah (itu)" },
      { left: "vannet", right: "air (itu)" },
      { left: "brødet", right: "roti (itu)" },
      { left: "katten", right: "kucing (itu)" },
    ],
    explanation: "Bentuk tentu di Norwegia melekat sbg akhiran: -et (intetkjønn) / -en (hankjønn).",
  },
  {
    id: "no3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Jeg ___ student.' (Saya seorang mahasiswa.)",
    context: "Verba 'være' (menjadi) — sama untuk semua subjek.",
    options: ["er", "være", "har", "blir"],
    correct: "er",
    explanation: "'være' → 'er' untuk semua subjek (jeg er, du er, han er). Tanpa konjugasi orang.",
  },
  {
    id: "no4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["drikker", "Jeg", "kaffe"],
    correct: ["Jeg", "drikker", "kaffe"],
    explanation: "Verba di posisi ke-2 (V2-regelen): 'Jeg drikker kaffe'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "no5", difficulty: "A2", type: "multiple",
    question: "'I går ___ jeg fotball.' (spille, preteritum)",
    options: ["spiller", "spilte", "spilt", "skal spille"],
    correct: 1,
    explanation: "Preteritum (past): 'spille' → 'spilte'. Setelah 'I går', verba tetap di posisi 2.",
  },
  {
    id: "no6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan V2-regelen (mulai dgn keterangan waktu):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["gikk", "I går", "jeg", "skolen", "til"],
    correct: ["I går", "gikk", "jeg", "til", "skolen"],
    explanation: "V2-regelen: verba 'gikk' harus di posisi ke-2, jadi subjek 'jeg' pindah ke belakang verba.",
  },
  {
    id: "no7", difficulty: "A2", type: "missing",
    question: "Perfektum (har + perfektum partisipp) — lengkapi:",
    template: "Jeg ___ allerede ___ maten.",
    blanks: ["har", "spist"],
    options: ["har", "spist", "er", "spiste", "spise", "spiser"],
    explanation: "Perfektum: 'har' + partisipp. Dari 'spise' (makan) = 'spist'. 'Jeg har allerede spist maten'.",
  },
  {
    id: "no8", difficulty: "A2", type: "fillChoice",
    question: "'Dette huset er ___ enn det der.' (perbandingan: lebih besar)",
    context: "Pilih bentuk komparatif dari 'stor'.",
    options: ["stor", "større", "størst", "store"],
    correct: "større",
    explanation: "Komparatif 'stor' (besar) → 'større'. Superlatif → 'størst'.",
  },
  {
    id: "no9", difficulty: "A2", type: "multiple",
    question: "'Du ___ gå til legen.' (kamu sebaiknya — saran)",
    options: ["må", "burde", "kan", "vil"],
    correct: 1,
    explanation: "'burde' menyatakan saran, mirip 'should'. 'Du burde gå til legen'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "no10", difficulty: "B1", type: "multiple",
    question: "'Hvis jeg ___ tid, ville jeg reise mer.' (irrealis)",
    options: ["har", "hadde", "hatt", "ha"],
    correct: 1,
    explanation: "Pengandaian tidak nyata pakai preteritum: 'Hvis jeg hadde tid, ville jeg reise'.",
  },
  {
    id: "no11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun anak kalimat (leddsetning — 'ikke' sebelum verba):",
    translation: "Saya tahu bahwa dia tidak kommer.",
    tokens: ["ikke", "Jeg", "at", "kommer", "han", "vet"],
    correct: ["Jeg", "vet", "at", "han", "ikke", "kommer"],
    explanation: "Di leddsetning (setelah 'at'), 'ikke' datang SEBELUM verba: 'at han ikke kommer'.",
  },
  {
    id: "no12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konjungsi dengan artinya:",
    pairs: [
      { left: "fordi", right: "karena" },
      { left: "selv om", right: "meskipun" },
      { left: "slik at", right: "supaya" },
      { left: "mens", right: "sementara" },
    ],
    explanation: "Konjungsi subordinat B1 — memicu urutan kata leddsetning.",
  },
  {
    id: "no13", difficulty: "B1", type: "missing",
    question: "Preposisi — lengkapi:",
    template: "Jeg tenker ofte ___ fremtiden og jeg er interessert ___ musikk.",
    blanks: ["på", "i"],
    options: ["på", "i", "av", "om", "med", "for"],
    explanation: "'tenke på' (memikirkan), 'interessert i' (tertarik pada). Kombinasi dihafal.",
  },
  {
    id: "no14", difficulty: "B1", type: "fillChoice",
    question: "'Mannen ___ jeg så i går, er naboen min.' (relatif)",
    context: "Pilih kata ganti relatif Norwegia yang paling umum.",
    options: ["som", "hvilken", "hvis", "hva"],
    correct: "som",
    explanation: "'som' adalah relatif universal Norwegia: 'mannen som jeg så'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "no15", difficulty: "B2", type: "multiple",
    question: "'Hvis jeg hadde visst det, ___.' (irrealis fortid)",
    options: [
      "ville jeg handle annerledes",
      "ville jeg ha handlet annerledes",
      "handlet jeg annerledes",
      "har jeg handlet annerledes",
    ],
    correct: 1,
    explanation: "Pengandaian lampau tidak nyata: 'ville ... ha handlet'. 'Hvis jeg hadde visst det, ville jeg ha handlet annerledes'.",
  },
  {
    id: "no16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat pasif (s-passiv):",
    translation: "Buku itu dibaca oleh banyak orang.",
    tokens: ["leses", "Boka", "mange", "av"],
    correct: ["Boka", "leses", "av", "mange"],
    explanation: "S-passiv: tambahkan -s ke verba. 'leser' → 'leses' (dibaca). 'Boka leses av mange'.",
  },
  {
    id: "no17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Den nye politikken vil ___ konsekvensene, mens den gamle bare ville ___ dem.",
    blanks: ["dempe", "forverre"],
    options: ["dempe", "forverre", "skape", "forsterke", "stabilisere", "forhindre"],
    explanation: "'dempe' = meredakan, 'forverre' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "no18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalisering (gaya formal)?",
    options: [
      "Hun bestemte seg raskt.",
      "Beslutningen hennes var rask.",
      "Hun bestemmer raskt.",
      "Raskt bestemte hun seg.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'beslutte' → nomina 'beslutning'. Ciri gaya tulisan formal.",
  },
];
