import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// BETAWI PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Fokus: kosakata khas (gue/lu/kagak/aje), akhiran -e/-nye, partikel dah/deh/dong
// ─────────────────────────────────────────────────────────────────────────────
export const betawiPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti kata 'gue' dalam dialek Betawi adalah:",
    options: ["kamu", "saya", "dia", "kita"],
    correct: 1,
    explanation: "'gue' (dari bahasa Hokkien) = saya. Pasangannya 'lu' = kamu. 'die' = dia, 'kite' = kita.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata Betawi dengan artinya:",
    pairs: [
      { left: "gue", right: "saya" },
      { left: "lu", right: "kamu" },
      { left: "kagak", right: "tidak" },
      { left: "aje", right: "saja" },
    ],
    explanation: "Empat kata paling khas Betawi. Perhatikan pola bunyi akhir -a menjadi -e: aja → aje, apa → ape, siapa → siape.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Gue ___ tau soal itu.' (Saya tidak tahu soal itu.)",
    context: "Kata penyangkal 'tidak' khas Betawi.",
    options: ["kagak", "belon", "bukan", "jangan"],
    correct: "kagak",
    explanation: "'kagak' (atau 'ngga'/'kaga') = tidak, menyangkal kata kerja/sifat. 'belon' = belum, 'bukan' menyangkal kata benda, 'jangan' = larangan.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat Betawi yang benar:",
    translation: "Saya mau pergi ke pasar.",
    tokens: ["ke pasar", "Gue", "pegi", "mau"],
    correct: ["Gue", "mau", "pegi", "ke pasar"],
    explanation: "Urutan sama dengan bahasa Indonesia: Subjek + mau + kata kerja + tujuan. 'pegi' = pergi (bunyi r sering luruh: pergi → pegi, kerja → kerje).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Kata 'belon' dalam dialek Betawi artinya:",
    options: ["bukan", "belum", "jangan", "sudah"],
    correct: 1,
    explanation: "'belon' = belum ('Gue belon makan'). Lawannya 'udeh' = sudah. 'kagak' = tidak, 'jangan' = larangan.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun menjadi kalimat Betawi yang benar:",
    translation: "Dia sedang tidur di kamar.",
    tokens: ["lagi", "Die", "di kamar", "tidur"],
    correct: ["Die", "lagi", "tidur", "di kamar"],
    explanation: "'die' = dia (pola -a → -e), 'lagi' = sedang. Keterangan tempat di akhir kalimat, sama seperti bahasa Indonesia.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "___ udeh gede, masa nangis ___? (Kamu sudah besar, masa menangis terus?)",
    blanks: ["Lu", "mulu"],
    options: ["Lu", "mulu", "Gue", "aje", "dong", "kagak"],
    explanation: "'lu' = kamu, 'mulu' (dari 'melulu') = terus-menerus — kata khas Betawi yang kini menyebar ke bahasa gaul nasional. 'aje' = saja, 'dong' = partikel penekan.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Nasinye tinggal dikit ___.' (Nasinya tinggal sedikit saja.)",
    context: "Kata 'saja' khas Betawi.",
    options: ["aje", "dong", "deh", "kek"],
    correct: "aje",
    explanation: "'aje' = saja. Perhatikan juga 'nasinye': akhiran -nya menjadi -nye. 'dong' = menuntut/membujuk, 'deh' = penegas keputusan, 'kek' = misalnya/lah.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Kata 'ngenyek' dalam dialek Betawi artinya:",
    options: ["memuji", "mengejek", "menipu", "memarahi"],
    correct: 1,
    explanation: "'ngenyek' = mengejek/meremehkan ('Jangan suka ngenyek orang!'). Bandingkan: 'ngeboongin' = menipu, 'ngomelin' = memarahi.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata Betawi dengan artinya:",
    pairs: [
      { left: "doyan", right: "suka/gemar" },
      { left: "sohib", right: "sahabat" },
      { left: "ngibrit", right: "lari terbirit-birit" },
      { left: "ngedumel", right: "menggerutu" },
    ],
    explanation: "Kosakata khas Betawi level menengah: 'doyan' biasanya untuk makanan, 'sohib' dari bahasa Arab (shahib), 'ngibrit' = kabur cepat-cepat, 'ngedumel' = mengomel pelan.",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'Yaudeh, gue pulang duluan ___.' (Ya sudah, saya pulang duluan ya.)",
    context: "Pilih partikel yang menandai kepasrahan/keputusan.",
    options: ["deh", "dong", "kek", "sih"],
    correct: "deh",
    explanation: "'deh' menegaskan keputusan/kepasrahan ('yaudeh deh'). 'dong' = menuntut/membujuk ('bagi dong'), 'kek' = misalnya/kata seru menyarankan ('diem kek'), 'sih' = penekan dalam pertanyaan ('ngapain sih?').",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "___ ujan gede, die ___ dateng ke kondangan. (Meskipun hujan besar, dia tetap datang ke hajatan.)",
    blanks: ["Biar", "tetep"],
    options: ["Biar", "tetep", "Kalo", "kagak", "udeh", "aje"],
    explanation: "'biar' (biarpun) = meskipun, 'tetep' = tetap. 'kondangan' = menghadiri hajatan/undangan. Pengecoh: 'kalo' = kalau (pengandaian), 'udeh' = sudah.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Ungkapan 'kagak ade ujan kagak ade angin' dipakai untuk menggambarkan:",
    options: [
      "Cuaca yang sedang cerah",
      "Sesuatu terjadi tiba-tiba tanpa sebab",
      "Musim kemarau yang panjang",
      "Suasana kampung yang tenang",
    ],
    correct: 1,
    explanation: "'Kagak ade ujan kagak ade angin' (tidak ada hujan tidak ada angin) = sesuatu terjadi mendadak tanpa tanda-tanda atau alasan, sama dengan idiom Indonesia 'tiada hujan tiada angin'.",
  },
  {
    id: "q14", difficulty: "B2", type: "multiple",
    question: "Kata 'bengal' dalam kalimat 'Anak itu emang bengal, susah dibilangin' artinya:",
    options: ["rajin", "bandel/keras kepala", "pelit", "ceroboh"],
    correct: 1,
    explanation: "'bengal' = bandel, tidak mempan dinasihati. Kosakata sifat khas Betawi lainnya: 'jail' = usil, 'songong' = sombong/lancang, 'kagok' = canggung/tanggung.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Ungkapan Betawi 'Ente jual, ane beli' paling dekat maknanya dengan:",
    options: [
      "Siapa menantang pasti diladeni",
      "Membeli kucing dalam karung",
      "Rezeki tidak akan ke mana",
      "Utang harus dibayar lunas",
    ],
    correct: 0,
    explanation: "'Ente jual, ane beli' (kamu jual, saya beli) = kalau kamu menantang, saya siap meladeni — ungkapan keberanian menjawab tantangan. 'Ente' dan 'ane' adalah kata ganti dari bahasa Arab yang lazim di Betawi.",
  },
];
