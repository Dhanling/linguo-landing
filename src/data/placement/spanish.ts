// ─────────────────────────────────────────────────────────────────────────────
// SPANISH (Español) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const spanishPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "es1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara menyapa di pagi hari dalam bahasa Spanyol?",
    options: ["Buenas noches", "Buenos días", "Buenas tardes", "Adiós"],
    correct: 1,
    explanation: "'Buenos días' = selamat pagi. 'Buenas tardes' = selamat sore, 'Buenas noches' = selamat malam.",
  },
  {
    id: "es2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "la casa", right: "rumah" },
      { left: "el agua", right: "air" },
      { left: "el pan", right: "roti" },
      { left: "el gato", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Nomina bergender: el (maskulin) / la (feminin).",
  },
  {
    id: "es3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Yo ___ estudiante.' (Saya seorang mahasiswa.)",
    context: "Konjugasi verba 'ser' untuk 'yo'.",
    options: ["soy", "eres", "es", "ser"],
    correct: "soy",
    explanation: "Verba 'ser': yo soy, tú eres, él/ella es. Untuk 'yo' → 'soy'.",
  },
  {
    id: "es4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya suka kopi.",
    tokens: ["gusta", "el", "Me", "café"],
    correct: ["Me", "gusta", "el", "café"],
    explanation: "'Me gusta el café'. Struktur 'gustar' unik: 'me gusta' + benda tunggal.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "es5", difficulty: "A2", type: "multiple",
    question: "'Ayer ___ en un restaurante.' (comer, pretérito untuk 'yo')",
    options: ["como", "comí", "comía", "comeré"],
    correct: 1,
    explanation: "Pretérito indefinido 'comer' untuk 'yo' → 'comí' (aksi selesai di masa lampau).",
  },
  {
    id: "es6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat pretérito:",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["fui", "Ayer", "la", "a", "escuela"],
    correct: ["Ayer", "fui", "a", "la", "escuela"],
    explanation: "'ir' di pretérito untuk 'yo' → 'fui' (bentuknya sama dgn 'ser'). 'Ayer fui a la escuela'.",
  },
  {
    id: "es7", difficulty: "A2", type: "missing",
    question: "Ser vs Estar — lengkapi:",
    template: "Mi hermana ___ médica y ahora ___ en el hospital.",
    blanks: ["es", "está"],
    options: ["es", "está", "son", "están", "ser", "estar"],
    explanation: "'ser' untuk profesi/identitas ('es médica'), 'estar' untuk lokasi ('está en el hospital').",
  },
  {
    id: "es8", difficulty: "A2", type: "fillChoice",
    question: "'He vivido aquí ___ cinco años.' (Saya sudah tinggal di sini selama 5 tahun.)",
    context: "Pilih preposisi durasi.",
    options: ["desde", "hace", "durante", "por"],
    correct: "durante",
    explanation: "'durante' menyatakan durasi. 'desde' = sejak (titik waktu), 'hace' = ... yang lalu.",
  },
  {
    id: "es9", difficulty: "A2", type: "multiple",
    question: "'Deberías ___ al médico.' (Kamu sebaiknya pergi ke dokter.)",
    options: ["vas", "ir", "irás", "fuiste"],
    correct: 1,
    explanation: "Setelah 'deberías' pakai infinitif → 'ir'. 'Deberías ir al médico' = saran.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "es10", difficulty: "B1", type: "multiple",
    question: "'Si tuviera dinero, ___ por el mundo.' (2º condicional)",
    options: ["viajo", "viajaré", "viajaría", "viajaba"],
    correct: 2,
    explanation: "Kondisional tipe 2: 'Si + imperfecto de subjuntivo (tuviera), + condicional' → 'viajaría'.",
  },
  {
    id: "es11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pretérito perfecto:",
    translation: "Saya belum pernah melihat film itu.",
    tokens: ["he", "Nunca", "visto", "esa", "película"],
    correct: ["Nunca", "he", "visto", "esa", "película"],
    explanation: "Pretérito perfecto: haber (he) + participio (visto). 'Nunca he visto esa película'.",
  },
  {
    id: "es12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konektor dengan artinya:",
    pairs: [
      { left: "aunque", right: "meskipun" },
      { left: "por lo tanto", right: "oleh karena itu" },
      { left: "sin embargo", right: "namun" },
      { left: "por eso", right: "karena itu" },
    ],
    explanation: "Konektor wacana penting di B1 untuk menghubungkan ide.",
  },
  {
    id: "es13", difficulty: "B1", type: "missing",
    question: "Subjuntivo — lengkapi:",
    template: "Espero que ___ bien y que ___ pronto.",
    blanks: ["estés", "vengas"],
    options: ["estés", "vengas", "estás", "vienes", "estar", "venir"],
    explanation: "Setelah 'espero que' (harapan) pakai subjuntivo: 'estés', 'vengas'.",
  },
  {
    id: "es14", difficulty: "B1", type: "fillChoice",
    question: "'Es la persona ___ me ayudó ayer.' (Relativo)",
    context: "Pilih kata ganti relatif.",
    options: ["que", "quien", "cual", "cuyo"],
    correct: "que",
    explanation: "'que' adalah relatif paling umum untuk orang & benda. 'la persona que me ayudó'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "es15", difficulty: "B2", type: "multiple",
    question: "'Si lo hubiera sabido, ___.' (3er condicional)",
    options: [
      "actuaría diferente",
      "habría actuado diferente",
      "actué diferente",
      "actuaba diferente",
    ],
    correct: 1,
    explanation: "Kondisional tipe 3: 'Si + pluscuamperfecto de subjuntivo, + condicional compuesto' → 'habría actuado'.",
  },
  {
    id: "es16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan pronombres (le/lo):",
    translation: "Saya sudah memberikannya (buku) kepadanya.",
    tokens: ["lo", "Se", "dado", "he"],
    correct: ["Se", "lo", "he", "dado"],
    explanation: "Ketika 'le' + 'lo' bertemu, 'le' berubah jadi 'se': 'Se lo he dado'.",
  },
  {
    id: "es17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "La nueva política va a ___ las consecuencias, mientras que la antigua solo las ___.",
    blanks: ["mitigar", "agravaría"],
    options: ["mitigar", "agravaría", "generar", "reforzar", "estabilizar", "impedir"],
    explanation: "'mitigar' = meredakan, 'agravar' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "es18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalización (gaya formal)?",
    options: [
      "Decidió rápidamente.",
      "Su decisión fue rápida.",
      "Ella decide rápido.",
      "Rápidamente, decidió.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'decidir' → nomina 'decisión'. Ciri gaya tulisan formal/akademis.",
  },
];
