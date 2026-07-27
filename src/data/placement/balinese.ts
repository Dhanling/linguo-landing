import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// BALINESE PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Fokus: anggah-ungguhing basa — basa andap (akrab) vs basa alus (halus)
// ─────────────────────────────────────────────────────────────────────────────
export const balinesePlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Ucapan 'Om Swastiastu' digunakan untuk:",
    options: [
      "Mengucapkan selamat tinggal",
      "Salam pembuka saat bertemu/menyapa",
      "Meminta maaf",
      "Mengucapkan terima kasih",
    ],
    correct: 1,
    explanation: "'Om Swastiastu' = salam pembuka khas Bali (semoga selamat atas karunia Tuhan). 'Suksma' = terima kasih, 'ampura' = maaf, penutup salam = 'Om Santih, Santih, Santih, Om'.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Bali (andap) dengan artinya:",
    pairs: [
      { left: "besik", right: "1" },
      { left: "telu", right: "3" },
      { left: "lima", right: "5" },
      { left: "dasa", right: "10" },
    ],
    explanation: "Angka dasar penting untuk transaksi harian. Dalam basa alus, 'besik' menjadi 'siki' dan 'telu' menjadi 'tiga'.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi (alus): '___ saking Denpasar.' (Saya dari Denpasar.)",
    context: "Kata ganti 'saya' yang halus.",
    options: ["Titiang", "Icang", "Ipun", "Ida"],
    correct: "Titiang",
    explanation: "'titiang' = saya (alus, merendahkan diri). 'icang' = saya (andap, hanya ke teman akrab), 'ipun' = dia (alus), 'ida' = beliau (untuk orang yang sangat dihormati).",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat alus yang benar:",
    translation: "Saya belajar bahasa Bali.",
    tokens: ["basa Bali", "Titiang", "malajah"],
    correct: ["Titiang", "malajah", "basa Bali"],
    explanation: "Struktur SVO: Titiang (saya, alus) + malajah (belajar) + basa Bali. Versi andap: 'Icang malajah basa Bali.'",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Kata 'makan' dalam alus singgih (untuk menghormati orang lain) adalah:",
    options: ["madaar", "nunas", "ngrayunang", "nginem"],
    correct: 2,
    explanation: "'ngrayunang' = makan (alus singgih, untuk orang yang dihormati: 'Ida sampun ngrayunang'). 'nunas' = makan (alus sor, untuk diri sendiri), 'madaar' = andap, 'nginem' = minum.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun menjadi kalimat alus yang benar:",
    translation: "Saya akan membeli kue di pasar.",
    tokens: ["ring peken", "Titiang", "numbas jaja", "jagi"],
    correct: ["Titiang", "jagi", "numbas jaja", "ring peken"],
    explanation: "'jagi' = akan (alus dari 'lakar'), 'numbas' = membeli (alus dari 'meli'), 'ring' = di (alus dari 'di'), 'peken' = pasar, 'jaja' = kue/jajan.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat alus dengan kata yang tepat:",
    template: "Bapak ___ ___ saking kantor. (Bapak sudah pulang dari kantor.)",
    blanks: ["sampun", "budal"],
    options: ["sampun", "budal", "suba", "mulih", "jagi", "kari"],
    explanation: "'sampun' = sudah (alus dari 'suba'), 'budal' = pulang (alus dari 'mulih') — dipakai karena Bapak dihormati. 'jagi' = akan, 'kari' = masih (alus).",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi (bertanya sopan kepada tamu): 'Sampun ___?' (Sudah makan?)",
    context: "Kata 'makan' yang pantas untuk tamu.",
    options: ["ngajeng", "madaar", "nunas", "nginem"],
    correct: "ngajeng",
    explanation: "'Sampun ngajeng?' = sapaan sopan untuk tamu ('ngajeng' = makan, alus). 'madaar' terlalu kasual untuk tamu, 'nunas' dipakai untuk diri sendiri, 'nginem' = minum.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Kalimat yang paling tepat diucapkan murid kepada guru:",
    options: [
      "Pak, titiang jagi mataken.",
      "Pak, icang lakar matakon.",
      "Pak, cai nawang sing?",
      "Pak, aku matakon nah.",
    ],
    correct: 0,
    explanation: "'Titiang jagi mataken' = saya mau bertanya (alus). Kepada guru wajib basa alus; 'icang/lakar/matakon' terlalu andap, sedangkan 'cai' (kamu, kasar) kepada guru sangat tidak sopan.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata andap dengan padanan alus-nya:",
    pairs: [
      { left: "suba", right: "sampun" },
      { left: "mulih", right: "budal" },
      { left: "teka", right: "rauh" },
      { left: "madaar", right: "ngajeng" },
    ],
    explanation: "Pasangan andap–alus inti anggah-ungguh: suba/sampun (sudah), mulih/budal (pulang), teka/rauh (datang), madaar/ngajeng (makan). Salah tingkat bisa terkesan kasar.",
  },
  {
    id: "q11", difficulty: "B1", type: "multiple",
    question: "Arti kalimat 'Yadiastun ujan bales, ipun tetep rauh.' adalah:",
    options: [
      "Karena hujan deras, dia datang",
      "Meskipun hujan deras, dia tetap datang",
      "Kalau hujan deras, dia datang",
      "Setelah hujan deras, dia pulang",
    ],
    correct: 1,
    explanation: "'yadiastun' = meskipun (konsesif), 'bales' = deras, 'rauh' = datang (alus). Bandingkan: 'santukan' = karena, 'yening' = kalau, 'sasampune' = setelah.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat alus dengan kata yang tepat:",
    template: "___ sampun wengi, titiang ___ mapamit dumun. (Karena sudah malam, saya akan mohon pamit dulu.)",
    blanks: ["Santukan", "jagi"],
    options: ["Santukan", "jagi", "Yadiastun", "kari", "mangda", "sampun"],
    explanation: "'santukan' = karena (alus dari 'krana'), 'jagi' = akan, 'wengi' = malam (alus), 'mapamit' = berpamitan, 'dumun' = dulu (alus dari 'malu'). Pengecoh: 'yadiastun' = meskipun, 'mangda' = supaya.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat yang TIDAK sesuai anggah-ungguhing basa adalah:",
    options: [
      "Ida sampun ngrayunang.",
      "Titiang jagi ngrayunang dumun.",
      "Titiang jagi nunas dumun.",
      "Ibu sampun rauh.",
    ],
    correct: 1,
    explanation: "Alus singgih ('ngrayunang') hanya untuk meninggikan ORANG LAIN, tidak boleh untuk diri sendiri. Untuk diri sendiri pakai alus sor: 'Titiang jagi nunas dumun' (saya mau makan dulu).",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Ida sampun ___ saking pura.' (Beliau sudah pulang dari pura.)",
    context: "Kata 'pulang' untuk orang yang sangat dihormati (Ida).",
    options: ["mantuk", "mulih", "magedi", "malaib"],
    correct: "mantuk",
    explanation: "'mantuk' = pulang (alus singgih) untuk 'Ida' (beliau yang sangat dihormati, mis. pendeta/pejabat). 'mulih' = andap, 'magedi' = pergi (andap), 'malaib' = berlari.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Sesenggakan Bali 'Gedé ombak gedé angin' paling dekat maknanya dengan:",
    options: [
      "Semakin tinggi kedudukan, semakin besar pula tantangan dan pengeluarannya",
      "Air tenang menghanyutkan",
      "Sambil menyelam minum air",
      "Nasi sudah menjadi bubur",
    ],
    correct: 0,
    explanation: "'Gedé ombak gedé angin' (besar ombak, besar angin) = makin besar penghasilan/kedudukan seseorang, makin besar pula kebutuhan, godaan, dan risikonya. Pengecoh: air tenang menghanyutkan = orang pendiam bisa berbahaya; sambil menyelam = dua tujuan sekaligus; nasi jadi bubur = terlanjur.",
  },
];
