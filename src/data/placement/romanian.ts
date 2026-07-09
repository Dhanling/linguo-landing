// ─────────────────────────────────────────────────────────────────────────────
// ROMANIAN (Română) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const romanianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "ro1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'halo/hai' dalam bahasa Rumania?",
    options: ["La revedere", "Bună", "Noapte bună", "Mulțumesc"],
    correct: 1,
    explanation: "'Bună' = halo/hai. 'La revedere' = sampai jumpa, 'Mulțumesc' = terima kasih.",
  },
  {
    id: "ro2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "casa", right: "rumah" },
      { left: "apa", right: "air" },
      { left: "pâinea", right: "roti" },
      { left: "pisica", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Di Rumania, artikel tentu melekat di akhir kata (casă → casa).",
  },
  {
    id: "ro3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Eu ___ student.' (Saya seorang mahasiswa.)",
    context: "Konjugasi verba 'a fi' untuk 'eu'.",
    options: ["sunt", "ești", "este", "a fi"],
    correct: "sunt",
    explanation: "Verba 'a fi': eu sunt, tu ești, el/ea este. Untuk 'eu' → 'sunt'.",
  },
  {
    id: "ro4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["beau", "Eu", "cafea"],
    correct: ["Eu", "beau", "cafea"],
    explanation: "'Eu beau cafea'. Verba 'a bea' untuk 'eu' → 'beau'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "ro5", difficulty: "A2", type: "multiple",
    question: "'Ieri ___ mâncat la restaurant.' (perfect compus untuk 'eu')",
    options: ["am", "ai", "a", "au"],
    correct: 0,
    explanation: "Perfect compus: auxiliary 'a avea' + participiu. Untuk 'eu' → 'am mâncat'.",
  },
  {
    id: "ro6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat perfect compus:",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["am", "Ieri", "la", "mers", "școală"],
    correct: ["Ieri", "am", "mers", "la", "școală"],
    explanation: "Perfect compus 'a merge': 'am mers'. 'Ieri am mers la școală'.",
  },
  {
    id: "ro7", difficulty: "A2", type: "missing",
    question: "A fi vs a avea — lengkapi:",
    template: "Sora mea ___ medic și acum ___ o mașină nouă.",
    blanks: ["este", "are"],
    options: ["este", "are", "sunt", "au", "a fi", "a avea"],
    explanation: "'este' (a fi, profesi), 'are' (a avea, kepemilikan). 'este medic' / 'are o mașină'.",
  },
  {
    id: "ro8", difficulty: "A2", type: "fillChoice",
    question: "'Merg ___ București mâine.' (Saya pergi ke Bucharest besok.)",
    context: "Pilih preposisi tujuan untuk kota.",
    options: ["la", "în", "pe", "de"],
    correct: "la",
    explanation: "Untuk tujuan/kota lazim pakai 'la': 'merg la București'.",
  },
  {
    id: "ro9", difficulty: "A2", type: "multiple",
    question: "'Ar trebui ___ la doctor.' (Kamu sebaiknya ke dokter.)",
    options: ["mergi", "să mergi", "ai mers", "vei merge"],
    correct: 1,
    explanation: "Setelah 'ar trebui' pakai conjunctiv 'să': 'ar trebui să mergi' = sebaiknya kamu pergi.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "ro10", difficulty: "B1", type: "multiple",
    question: "'Dacă ___ timp, aș călători mai mult.' (condițional)",
    options: ["am", "aș avea", "aveam", "voi avea"],
    correct: 1,
    explanation: "Pengandaian: 'Dacă aș avea timp, aș călători' (condițional prezent di dua sisi).",
  },
  {
    id: "ro11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif:",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["fost", "Scrisoarea", "scrisă", "a", "ieri"],
    correct: ["Scrisoarea", "a", "fost", "scrisă", "ieri"],
    explanation: "Pasif: 'a fi' + participiu. 'a fost scrisă' — participiu setuju feminin dgn 'scrisoarea'.",
  },
  {
    id: "ro12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konektor dengan artinya:",
    pairs: [
      { left: "deoarece", right: "karena" },
      { left: "deși", right: "meskipun" },
      { left: "astfel încât", right: "sehingga" },
      { left: "în timp ce", right: "sementara" },
    ],
    explanation: "Konektor wacana penting di B1.",
  },
  {
    id: "ro13", difficulty: "B1", type: "missing",
    question: "Conjunctiv — lengkapi:",
    template: "Sper să ___ bine și să ___ curând.",
    blanks: ["fii", "vii"],
    options: ["fii", "vii", "ești", "vezi", "a fi", "a veni"],
    explanation: "Setelah 'sper să' pakai conjunctiv (untuk 'tu'): 'fii' (a fi), 'vii' (a veni).",
  },
  {
    id: "ro14", difficulty: "B1", type: "fillChoice",
    question: "'Este persoana ___ m-a ajutat ieri.' (relativ)",
    context: "Pilih pronomina relatif subjek.",
    options: ["care", "pe care", "cui", "ce"],
    correct: "care",
    explanation: "'care' relatif untuk subjek. 'persoana care m-a ajutat' (yang menolong saya).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "ro15", difficulty: "B2", type: "multiple",
    question: "'Dacă aș fi știut, ___.' (condițional perfect)",
    options: [
      "aș acționa diferit",
      "aș fi acționat diferit",
      "am acționat diferit",
      "acționam diferit",
    ],
    correct: 1,
    explanation: "Pengandaian lampau: 'Dacă aș fi știut, aș fi acționat diferit' (condițional perfect).",
  },
  {
    id: "ro16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan pronume (dativ + acuzativ):",
    translation: "Saya sudah memberikannya (buku) kepadanya.",
    tokens: ["I", "l-", "dat", "am"],
    correct: ["I", "l-", "am", "dat"],
    explanation: "Klitik: dativ 'i' + acuzativ 'l' + auxiliary. 'I l-am dat' = saya sudah memberikannya kepadanya.",
  },
  {
    id: "ro17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Noua politică va ___ consecințele, în timp ce cea veche doar le-ar ___.",
    blanks: ["atenua", "agrava"],
    options: ["atenua", "agrava", "genera", "consolida", "stabiliza", "împiedica"],
    explanation: "'a atenua' = meredakan, 'a agrava' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "ro18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalizare (gaya formal)?",
    options: [
      "A decis rapid.",
      "Decizia ei a fost rapidă.",
      "Ea decide repede.",
      "Rapid, a decis.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'a decide' → nomina 'decizie'. Ciri gaya tulisan formal/akademis.",
  },
];
