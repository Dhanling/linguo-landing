import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// KURDISH PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Fokus: Kurmanji (Kurdi Utara), aksara Latin
// ─────────────────────────────────────────────────────────────────────────────
export const kurdishPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Silav' adalah:",
    options: ["Selamat tinggal", "Halo / Salam", "Terima kasih", "Maaf"],
    correct: 1,
    explanation: "'Silav' = halo/salam. 'Bi xatirê te' = selamat tinggal, 'Spas' = terima kasih, 'Bibore' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Kurmanji dengan artinya:",
    pairs: [
      { left: "yek", right: "1" },
      { left: "sê", right: "3" },
      { left: "pênc", right: "5" },
      { left: "deh", right: "10" },
    ],
    explanation: "Angka dasar yek~deh penting untuk harga, jam, dan transaksi sehari-hari.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Ez xwendekar ___.' (Saya seorang pelajar.)",
    context: "Kopula 'adalah' menyesuaikan subjek.",
    options: ["im", "î", "e", "in"],
    correct: "im",
    explanation: "Kopula Kurmanji berubah per subjek: ez…im (saya), tu…î (kamu), ew…e (dia), em/hûn/ew…in (jamak).",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar (perhatikan: verba di akhir!):",
    translation: "Saya minum air.",
    tokens: ["vedixwim", "Ez", "avê"],
    correct: ["Ez", "avê", "vedixwim"],
    explanation: "Kurmanji berpola SOV: Subjek (Ez) + Objek dalam kasus oblik (av → avê = air) + Verba di akhir (vedixwim = saya minum).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Kalimat mana yang bermakna lampau 'Saya (sudah) pergi'?",
    options: [
      "Ez diçim",
      "Ez çûm",
      "Ez ê biçim",
      "Ez diçûm",
    ],
    correct: 1,
    explanation: "'Çûm' = past simple (saya pergi, selesai). 'Diçim' = kala kini, 'Ez ê biçim' = akan pergi (futur), 'Diçûm' = dulu biasa pergi (imperfek).",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat lampau dengan keterangan waktu:",
    translation: "Kemarin saya pergi ke pasar.",
    tokens: ["çûm", "Duh", "bazarê", "ez"],
    correct: ["Duh", "ez", "çûm", "bazarê"],
    explanation: "'Duh' = kemarin. Dengan verba gerak 'çûn' (pergi), tujuan dalam kasus oblik (bazar → bazarê) lazim diletakkan SETELAH verba — pengecualian pola SOV.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi dengan preposisi yang tepat:",
    template: "Ez ___ Amedê dijîm û ___ otobusê diçim dibistanê. (Saya tinggal di Amed dan pergi ke sekolah naik bus.)",
    blanks: ["li", "bi"],
    options: ["li", "bi", "ji", "di", "bo", "ber"],
    explanation: "'li' = di (lokasi), 'bi' = dengan/naik (alat). Pengecoh: 'ji' = dari, 'di … de' = di dalam, 'bo' = untuk, 'ber' = depan/arah.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Tu ___ bi kurdî biaxivî?' (Apakah kamu bisa berbahasa Kurdi?)",
    context: "Modalitas 'bisa'.",
    options: ["dikarî", "divê", "dixwazî", "hez dikî"],
    correct: "dikarî",
    explanation: "'Dikarî' = kamu bisa (dari karîn), diikuti verba subjunctive 'biaxivî'. 'Divê' = harus, 'dixwazî' = kamu ingin, 'hez dikî' = kamu suka.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Her çend baran dibariya jî, ez derketim.' :",
    options: [
      "Karena hujan, saya keluar",
      "Meskipun hujan, saya tetap keluar",
      "Kalau hujan, saya keluar",
      "Setelah hujan, saya keluar",
    ],
    correct: 1,
    explanation: "Pasangan 'her çend … jî' = meskipun … tetap. Bandingkan: 'ji ber ku' = karena, 'eger' = kalau, 'piştî ku' = setelah.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "ji ber ku", right: "karena" },
      { left: "lê", right: "tetapi" },
      { left: "eger", right: "jika / kalau" },
      { left: "da ku", right: "supaya / agar" },
    ],
    explanation: "Konjungsi ini inti tata bahasa menengah — kunci merangkai kalimat kompleks dalam Kurmanji.",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'Stenbol ji Amedê ___ e.' (Istanbul lebih besar dari Amed.)",
    context: "Bentuk perbandingan.",
    options: ["mezintir", "mezin", "herî mezin", "pir"],
    correct: "mezintir",
    explanation: "Komparatif Kurmanji: 'ji …' (dari) + adjektiva + '-tir' = lebih …. 'Mezin' = besar (positif), 'herî mezin' = paling besar (superlatif), 'pir' = sangat.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Kalimat pengandaian — lengkapi dengan bentuk yang tepat:",
    template: "Eger sibê wextê min ___, ez ê ___ behrê. (Kalau besok saya punya waktu, saya akan pergi ke pantai.)",
    blanks: ["hebe", "herim"],
    options: ["hebe", "herim", "heye", "çûm", "hebû", "diçim"],
    explanation: "Setelah 'eger' dipakai subjunctive 'hebe' (dari hebûn = ada/punya); futur 'ez ê + herim' = saya akan pergi. Pengecoh: 'heye' = ada (indikatif), 'çûm' = pergi (lampau), 'hebû' = ada (lampau).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Dalam kalimat lampau 'Min nan xwar.' (Saya makan roti.), mengapa subjeknya 'min' dan bukan 'ez'?",
    options: [
      "Karena 'min' bentuk sopan dari 'ez'",
      "Karena kalimat lampau transitif memakai konstruksi ergatif: subjek berkasus oblik",
      "Karena 'ez' hanya dipakai penutur perempuan",
      "Keduanya salah, seharusnya 'ez'",
    ],
    correct: 1,
    explanation: "Kurmanji berpola ergatif di kala lampau: subjek verba transitif memakai kasus oblik (ez → min) dan verba menyesuaikan objek. Ini ciri khas paling menantang di level lanjut.",
  },
  {
    id: "q14", difficulty: "B2", type: "matching",
    prompt: "Jodohkan idiom Kurmanji dengan maknanya:",
    pairs: [
      { left: "ser çavan", right: "dengan senang hati" },
      { left: "destê te sax be", right: "ucapan apresiasi hasil kerja seseorang" },
      { left: "dil ketin", right: "jatuh cinta" },
      { left: "kêfa min tê", right: "saya senang / saya suka" },
    ],
    explanation: "Harfiahnya unik: 'ser çavan' = 'di atas mata(ku)' = siap melayani dengan senang hati; 'destê te sax be' = 'semoga tanganmu sehat'; 'dil ketin' = 'hati jatuh'.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'Dilop bi dilop dibe gol.' paling dekat maknanya dengan:",
    options: [
      "Sedikit demi sedikit, lama-lama menjadi bukit",
      "Besar pasak daripada tiang",
      "Air susu dibalas air tuba",
      "Nasi sudah menjadi bubur",
    ],
    correct: 0,
    explanation: "Harfiah: 'tetes demi tetes menjadi danau' — hal kecil yang dikumpulkan terus-menerus akan menjadi besar. Pengecoh: boros, kebaikan dibalas kejahatan, penyesalan yang terlambat.",
  },
];
