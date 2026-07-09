// ─────────────────────────────────────────────────────────────────────────────
// DUTCH (Nederlands) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const dutchPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "nl1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara menyapa di pagi hari dalam bahasa Belanda?",
    options: ["Goedenacht", "Goedemorgen", "Goedenavond", "Dag"],
    correct: 1,
    explanation: "'Goedemorgen' = selamat pagi. 'Goedenavond' = selamat malam (sore).",
  },
  {
    id: "nl2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "het huis", right: "rumah" },
      { left: "het water", right: "air" },
      { left: "het brood", right: "roti" },
      { left: "de kat", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Artikel Belanda: 'de' atau 'het' tergantung kata.",
  },
  {
    id: "nl3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Ik ___ student.' (Saya seorang mahasiswa.)",
    context: "Konjugasi verba 'zijn' (menjadi) untuk 'ik'.",
    options: ["ben", "bent", "is", "zijn"],
    correct: "ben",
    explanation: "Verba 'zijn': ik ben, jij bent, hij is. Untuk 'ik' → 'ben'.",
  },
  {
    id: "nl4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["drink", "Ik", "koffie"],
    correct: ["Ik", "drink", "koffie"],
    explanation: "Verba selalu di posisi ke-2: 'Ik drink koffie'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "nl5", difficulty: "A2", type: "multiple",
    question: "'Ik ___ gisteren voetbal gespeeld.' (Perfectum)",
    options: ["heb", "ben", "had", "was"],
    correct: 0,
    explanation: "Perfectum 'spelen' pakai 'hebben' → 'heb gespeeld'. 'zijn' untuk verba gerak/perubahan.",
  },
  {
    id: "nl6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat perfectum (met 'zijn'):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["ben", "Ik", "gisteren", "gegaan", "naar", "school"],
    correct: ["Ik", "ben", "gisteren", "naar", "school", "gegaan"],
    explanation: "Verba gerak 'gaan' pakai 'zijn'. Partisip 'gegaan' selalu di akhir kalimat.",
  },
  {
    id: "nl7", difficulty: "A2", type: "missing",
    question: "Verba terpisah (scheidbare werkwoorden) — lengkapi:",
    template: "Ik ___ elke ochtend om 7 uur ___.",
    blanks: ["sta", "op"],
    options: ["sta", "op", "ga", "aan", "kom", "uit"],
    explanation: "'opstaan' (bangun) itu verba terpisah: 'sta ... op'. Prefix 'op' pindah ke akhir.",
  },
  {
    id: "nl8", difficulty: "A2", type: "fillChoice",
    question: "'Dit boek is interessanter ___ dat boek.' (perbandingan)",
    context: "Pilih kata pembanding.",
    options: ["dan", "als", "dat", "zoals"],
    correct: "dan",
    explanation: "Untuk komparatif (-er) pakai 'dan': 'interessanter dan'.",
  },
  {
    id: "nl9", difficulty: "A2", type: "multiple",
    question: "'Je ___ naar de dokter gaan.' (kamu sebaiknya — saran)",
    options: ["moet", "kunt", "zou moeten", "wilt"],
    correct: 2,
    explanation: "'zou moeten' menyatakan saran, mirip 'should'. 'Je zou naar de dokter moeten gaan'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "nl10", difficulty: "B1", type: "multiple",
    question: "'Als ik tijd ___, zou ik meer reizen.' (irrealis)",
    options: ["heb", "had", "hebt", "heeft"],
    correct: 1,
    explanation: "Pengandaian tidak nyata pakai bentuk lampau: 'Als ik tijd had, zou ik reizen'.",
  },
  {
    id: "nl11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif (met 'worden'):",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["werd", "De", "geschreven", "brief", "gisteren"],
    correct: ["De", "brief", "werd", "gisteren", "geschreven"],
    explanation: "Passief lampau: 'worden' (werd) + voltooid deelwoord ('geschreven') di akhir.",
  },
  {
    id: "nl12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konjungsi dengan artinya:",
    pairs: [
      { left: "omdat", right: "karena" },
      { left: "hoewel", right: "meskipun" },
      { left: "zodat", right: "supaya" },
      { left: "terwijl", right: "sementara" },
    ],
    explanation: "Konjungsi subordinat B1 — membuat verba pindah ke akhir anak kalimat.",
  },
  {
    id: "nl13", difficulty: "B1", type: "missing",
    question: "Preposisi tetap — lengkapi:",
    template: "Ik denk vaak ___ mijn toekomst en ik hou ___ muziek.",
    blanks: ["aan", "van"],
    options: ["aan", "van", "op", "over", "met", "voor"],
    explanation: "'denken aan' (memikirkan), 'houden van' (menyukai). Kombinasi verba+preposisi harus dihafal.",
  },
  {
    id: "nl14", difficulty: "B1", type: "fillChoice",
    question: "'De man ___ ik gisteren zag, is mijn buurman.' (relatief)",
    context: "Pilih kata ganti relatif untuk 'de'-woord.",
    options: ["die", "dat", "wie", "welke"],
    correct: "die",
    explanation: "Kata benda 'de' pakai relatif 'die'; kata benda 'het' pakai 'dat'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "nl15", difficulty: "B2", type: "multiple",
    question: "'Als ik het had geweten, ___.' (irrealis verleden)",
    options: [
      "zou ik anders handelen",
      "zou ik anders hebben gehandeld",
      "handelde ik anders",
      "heb ik anders gehandeld",
    ],
    correct: 1,
    explanation: "Pengandaian lampau tidak nyata: 'zou ... hebben gehandeld'.",
  },
  {
    id: "nl16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat met 'te' + infinitief:",
    translation: "Saya berharap bisa segera pergi.",
    tokens: ["te", "Ik", "hoop", "snel", "gaan"],
    correct: ["Ik", "hoop", "snel", "te", "gaan"],
    explanation: "Konstruksi 'hopen te + infinitief': 'Ik hoop snel te gaan'.",
  },
  {
    id: "nl17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Het nieuwe beleid zal de gevolgen ___, terwijl het oude ze alleen zou ___.",
    blanks: ["verzachten", "verergeren"],
    options: ["verzachten", "verergeren", "genereren", "versterken", "stabiliseren", "voorkomen"],
    explanation: "'verzachten' = meredakan, 'verergeren' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "nl18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalisasi (gaya formal)?",
    options: [
      "Ze besloot snel.",
      "Haar beslissing was snel.",
      "Ze beslist snel.",
      "Snel besloot ze.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'besluiten' → nomina 'beslissing'. Ciri gaya tulisan formal.",
  },
];
