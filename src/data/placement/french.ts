// ─────────────────────────────────────────────────────────────────────────────
// FRENCH (Français) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const frenchPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "fr1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'selamat pagi/halo (siang hari)' dalam bahasa Prancis?",
    options: ["Bonne nuit", "Bonjour", "Au revoir", "Merci"],
    correct: 1,
    explanation: "'Bonjour' = halo/selamat pagi. 'Au revoir' = sampai jumpa, 'Merci' = terima kasih.",
  },
  {
    id: "fr2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "la maison", right: "rumah" },
      { left: "l'eau", right: "air" },
      { left: "le pain", right: "roti" },
      { left: "le chat", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Setiap nomina punya gender: le (maskulin) / la (feminin).",
  },
  {
    id: "fr3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Je ___ étudiant.' (Saya seorang mahasiswa.)",
    context: "Konjugasi verba 'être' (menjadi) untuk 'je'.",
    options: ["suis", "es", "est", "être"],
    correct: "suis",
    explanation: "Verba 'être': je suis, tu es, il/elle est. Untuk 'je' → 'suis'.",
  },
  {
    id: "fr4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya suka kopi.",
    tokens: ["aime", "le", "J'", "café"],
    correct: ["J'", "aime", "le", "café"],
    explanation: "'J'aime le café'. Verba 'aimer' + artikel tentu 'le' untuk menyatakan suka secara umum.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "fr5", difficulty: "A2", type: "multiple",
    question: "'Hier, j'___ mangé au restaurant.' (Passé composé)",
    options: ["ai", "suis", "as", "est"],
    correct: 0,
    explanation: "Passé composé 'manger' pakai auxiliary 'avoir' → 'j'ai mangé'. Untuk 'je' = 'ai'.",
  },
  {
    id: "fr6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat Passé composé (dgn 'être'):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["suis", "Je", "hier", "allé", "à", "l'école"],
    correct: ["Je", "suis", "allé", "hier", "à", "l'école"],
    explanation: "Verba gerak 'aller' pakai 'être' di passé composé: 'je suis allé(e)'.",
  },
  {
    id: "fr7", difficulty: "A2", type: "missing",
    question: "Lengkapi dengan verba yang tepat:",
    template: "Elle ___ du café le matin, mais aujourd'hui elle ___ du thé.",
    blanks: ["boit", "boit"],
    options: ["boit", "bois", "boivent", "buvait", "a bu", "boire"],
    explanation: "Verba 'boire' untuk il/elle → 'boit' (present untuk rutinitas & aksi sekarang).",
  },
  {
    id: "fr8", difficulty: "A2", type: "fillChoice",
    question: "'Je vais ___ Paris demain.' (Saya akan ke Paris besok.)",
    context: "Pilih preposisi untuk nama kota.",
    options: ["à", "en", "au", "dans"],
    correct: "à",
    explanation: "Untuk nama kota pakai 'à' → 'à Paris'. 'en' untuk negara feminin, 'au' untuk negara maskulin.",
  },
  {
    id: "fr9", difficulty: "A2", type: "multiple",
    question: "'Tu ___ voir un médecin.' (kamu sebaiknya menemui dokter — saran)",
    options: ["dois", "devrais", "peux", "veux"],
    correct: 1,
    explanation: "'devrais' (conditionnel dari devoir) menyatakan saran, mirip 'should'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "fr10", difficulty: "B1", type: "multiple",
    question: "'Si j'avais le temps, je ___ plus.' (2ème conditionnel)",
    options: ["voyage", "voyagerai", "voyagerais", "voyageais"],
    correct: 2,
    explanation: "Kondisional tipe 2: 'Si + imparfait, ... conditionnel présent' → 'voyagerais'.",
  },
  {
    id: "fr11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif (voix passive):",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["a", "été", "La", "écrite", "lettre", "hier"],
    correct: ["La", "lettre", "a", "été", "écrite", "hier"],
    explanation: "Passif: sujet + être (terkonjugasi) + participe passé. 'écrite' setuju gender feminin dgn 'lettre'.",
  },
  {
    id: "fr12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan ungkapan dengan artinya:",
    pairs: [
      { left: "tout de suite", right: "segera" },
      { left: "d'habitude", right: "biasanya" },
      { left: "en même temps", right: "pada saat yang sama" },
      { left: "de temps en temps", right: "kadang-kadang" },
    ],
    explanation: "Ekspresi keterangan waktu yang umum di level B1.",
  },
  {
    id: "fr13", difficulty: "B1", type: "missing",
    question: "Kata ganti relatif — lengkapi:",
    template: "C'est le livre ___ j'ai acheté et ___ est très intéressant.",
    blanks: ["que", "qui"],
    options: ["que", "qui", "dont", "où", "quoi", "lequel"],
    explanation: "'que' = objek langsung, 'qui' = subjek. 'le livre que j'ai acheté / qui est intéressant'.",
  },
  {
    id: "fr14", difficulty: "B1", type: "fillChoice",
    question: "'Il faut que tu ___ à l'heure.' (Subjonctif)",
    context: "Verba 'être' dalam subjonctif untuk 'tu'.",
    options: ["es", "sois", "seras", "étais"],
    correct: "sois",
    explanation: "Setelah 'il faut que' pakai subjonctif. 'être' → que tu sois.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "fr15", difficulty: "B2", type: "multiple",
    question: "'Si j'avais su, je ___.' (conditionnel passé)",
    options: [
      "serais venu",
      "aurais agi différemment",
      "agirais différemment",
      "avais agi différemment",
    ],
    correct: 1,
    explanation: "Kondisional tipe 3: 'Si + plus-que-parfait, conditionnel passé' → 'aurais agi'.",
  },
  {
    id: "fr16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan pronom (ordre des pronoms):",
    translation: "Saya sudah memberikannya (buku) kepadanya.",
    tokens: ["le", "Je", "donné", "lui", "ai"],
    correct: ["Je", "le", "lui", "ai", "donné"],
    explanation: "Urutan pronom: COD (le) sebelum COI (lui) di depan auxiliary. 'Je le lui ai donné.'",
  },
  {
    id: "fr17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "La nouvelle mesure va ___ les conséquences, alors que l'ancienne ne ferait que les ___.",
    blanks: ["atténuer", "aggraver"],
    options: ["atténuer", "aggraver", "générer", "renforcer", "stabiliser", "empêcher"],
    explanation: "'atténuer' = meredakan, 'aggraver' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "fr18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan gaya formal (nominalisation)?",
    options: [
      "Elle a décidé rapidement.",
      "Sa décision a été rapide.",
      "Elle décide vite.",
      "Rapidement, elle a décidé.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'décider' → nomina 'décision'. Ciri gaya tulisan formal/akademis.",
  },
];
