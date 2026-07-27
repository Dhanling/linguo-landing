import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// ACEHNESE (BAHSA ACÈH) PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const acehnesePlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Peue haba?' adalah:",
    options: ["Siapa namamu?", "Apa kabar?", "Mau ke mana?", "Sudah makan?"],
    correct: 1,
    explanation: "'peue' = apa, 'haba' = kabar. Jawaban umumnya 'Haba gèt' (kabar baik). 'Soe nan' = siapa nama, 'Ho jak' = mau ke mana.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Aceh dengan artinya:",
    pairs: [
      { left: "sa", right: "1" },
      { left: "lhèe", right: "3" },
      { left: "limöng", right: "5" },
      { left: "siplôh", right: "10" },
    ],
    explanation: "Angka dasar: sa, duwa, lhèe, peuet, limöng … siplôh. Penting untuk harga dan hitungan di keude (pasar/warung).",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Lôn ___ bu.' (Saya makan nasi.)",
    context: "Kata kerja 'makan'.",
    options: ["pajôh", "jak", "jép", "éh"],
    correct: "pajôh",
    explanation: "'pajôh' = makan, 'bu' = nasi, 'lôn' = saya (sopan). Pengecoh: 'jak' = pergi, 'jép' = minum, 'éh' = tidur.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya pergi ke pasar.",
    tokens: ["u keude", "Lôn", "jak"],
    correct: ["Lôn", "jak", "u keude"],
    explanation: "Struktur SVO: 'lôn' = saya, 'jak' = pergi, 'u' = ke, 'keude' = kedai/pasar.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'saya SUDAH makan nasi', kalimat yang tepat:",
    options: [
      "Lôn pajôh bu",
      "Ka lôn pajôh bu",
      "Teungöh lôn pajôh bu",
      "Gohlom lôn pajôh bu",
    ],
    correct: 1,
    explanation: "'ka' = sudah (penanda perfektif, di depan). Pengecoh: 'teungöh' = sedang, 'gohlom' = belum.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Aceh di rumah.",
    tokens: ["bahsa Acèh", "Lôn", "meurunoe", "di rumoh"],
    correct: ["Lôn", "meurunoe", "bahsa Acèh", "di rumoh"],
    explanation: "'meurunoe' = belajar, 'rumoh' = rumah. Keterangan tempat 'di rumoh' diletakkan di akhir kalimat.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "Baroe lôn ___ u keude ___ eungkôt. (Kemarin saya pergi ke pasar membeli ikan.)",
    blanks: ["jak", "bloe"],
    options: ["jak", "woe", "bloe", "publoe", "pajôh", "jép"],
    explanation: "'baroe' = kemarin, 'jak' = pergi, 'bloe' = membeli, 'eungkôt' = ikan. Pengecoh: 'woe' = pulang, 'publoe' = menjual, 'jép' = minum.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Peue gata ___ meututô bahsa Acèh?' (Apakah kamu bisa berbicara bahasa Aceh?)",
    context: "Kata untuk 'bisa/boleh'.",
    options: ["jeuet", "harôh", "ka", "keuneuk"],
    correct: "jeuet",
    explanation: "'jeuet' = bisa/boleh, 'meututô' = berbicara, 'gata' = kamu (sopan). Pengecoh: 'harôh' = harus, 'ka' = sudah, 'keuneuk' = ingin/akan.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Bah pih ujeuen, lôn teutap jak.' :",
    options: [
      "Karena hujan, saya tidak pergi",
      "Meskipun hujan, saya tetap pergi",
      "Kalau hujan, saya pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "'bah pih' = meskipun/biarpun (konsesif), 'ujeuen' = hujan, 'teutap' = tetap. Bandingkan: 'kareuna' = karena, 'meunyo' = kalau.",
  },
  {
    id: "q10", difficulty: "B1", type: "multiple",
    question: "Arti 'Meunyo na péng, lôn keuneuk bloe motô.' :",
    options: [
      "Karena punya uang, saya membeli mobil",
      "Kalau ada uang, saya ingin membeli mobil",
      "Meskipun ada uang, saya tidak membeli mobil",
      "Uang saya habis membeli mobil",
    ],
    correct: 1,
    explanation: "'meunyo' = kalau, 'na' = ada, 'péng' = uang, 'keuneuk' = ingin/akan, 'bloe' = membeli, 'motô' = mobil.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Aceh dengan artinya:",
    pairs: [
      { left: "kareuna", right: "karena" },
      { left: "meunyo", right: "kalau" },
      { left: "mangat", right: "supaya" },
      { left: "bah pih", right: "meskipun" },
    ],
    explanation: "Konjungsi ini pondasi kalimat majemuk. Catatan: 'mangat' juga berarti 'enak' — maknanya ditentukan konteks.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi dengan bentuk kata kerja berawalan persona yang tepat:",
    template: "Gopnyan ___ u keude, jih ___ u blang. (Beliau pergi ke pasar, dia pergi ke sawah.)",
    blanks: ["geujak", "jijak"],
    options: ["geujak", "jijak", "neujak", "tajak", "jak", "kajak"],
    explanation: "Ciri khas Aceh: kata kerja berawalan sesuai pelaku. 'geu-' = beliau (orang ketiga hormat), 'ji-' = dia (biasa), 'neu-' = Anda (hormat), 'ta-' = kita, 'ka-' = kamu (kasar). 'blang' = sawah.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kata ganti PALING hormat untuk 'Anda' (misalnya kepada guru atau orang tua) adalah:",
    options: ["kah", "gata", "droeneuh", "jih"],
    correct: 2,
    explanation: "Tingkat tutur Aceh: 'droeneuh' = Anda (sangat hormat), 'gata' = kamu (netral/sopan), 'kah' = kamu (kasar, sesama akrab), 'jih' = dia (bukan kata sapaan).",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Jih meututô bahsa Acèh ___ ureueng Acèh aslî.' (Dia berbicara bahasa Aceh seperti orang Aceh asli.)",
    context: "Kata perbandingan 'seperti'.",
    options: ["lagèe", "ngon", "sabab", "bak"],
    correct: "lagèe",
    explanation: "'lagèe' = seperti/bagaikan, 'ureueng' = orang. Pengecoh: 'ngon' = dengan/dan, 'sabab' = sebab/karena, 'bak' = di/pada.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Hadih maja (petuah Aceh) 'Matée aneuk meupat jeurat, gadôh adat pat tamita' paling dekat maknanya dengan:",
    options: [
      "Adat harus dijaga — sekali hilang, tak tahu ke mana mencarinya",
      "Anak yang meninggal harus dimakamkan sesuai adat",
      "Orang tua wajib mewariskan harta kepada anak",
      "Kuburan leluhur harus selalu dirawat",
    ],
    correct: 0,
    explanation: "Harfiah: 'mati anak jelas di mana kuburnya, hilang adat ke mana hendak dicari'. Kehilangan adat dianggap lebih berat karena tak bisa ditemukan kembali — pentingnya menjaga tradisi.",
  },
];
