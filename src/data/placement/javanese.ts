import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// JAVANESE PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Fokus: unggah-ungguh basa — ngoko vs krama vs krama inggil
// ─────────────────────────────────────────────────────────────────────────────
export const javanesePlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Sugeng enjing' adalah:",
    options: ["Selamat malam", "Selamat pagi", "Selamat tinggal", "Terima kasih"],
    correct: 1,
    explanation: "'Sugeng enjing' = selamat pagi. 'Sugeng dalu' = selamat malam, 'Sugeng tindak' = selamat jalan, 'Matur nuwun' = terima kasih.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Jawa (ngoko) dengan artinya:",
    pairs: [
      { left: "siji", right: "1" },
      { left: "telu", right: "3" },
      { left: "lima", right: "5" },
      { left: "sepuluh", right: "10" },
    ],
    explanation: "Angka dasar siji~sepuluh penting untuk transaksi harian. Dalam krama: setunggal, tiga, gangsal, sedasa.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi (ngoko, bicara ke teman): 'Aku ___ sega.' (Saya makan nasi.)",
    context: "Kata 'makan' dalam ngoko.",
    options: ["mangan", "dhahar", "nedha", "ngombe"],
    correct: "mangan",
    explanation: "'mangan' = makan (ngoko, ke teman sebaya). 'nedha' = krama, 'dhahar' = krama inggil (untuk menghormati orang lain), 'ngombe' = minum.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat ngoko yang benar:",
    translation: "Saya akan pergi ke pasar.",
    tokens: ["menyang", "Aku", "pasar", "arep"],
    correct: ["Aku", "arep", "menyang", "pasar"],
    explanation: "Struktur: Subjek (Aku) + arep (akan) + menyang (ke/pergi ke) + tujuan. Dalam krama: 'Kula badhe dhateng peken.'",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Kata 'makan' dalam krama inggil (untuk menghormati orang lain) adalah:",
    options: ["mangan", "maem", "dhahar", "ngunjuk"],
    correct: 2,
    explanation: "'dhahar' = krama inggil, dipakai untuk orang yang dihormati ('Bapak sampun dhahar'). 'mangan' = ngoko, 'maem' = bahasa anak-anak, 'ngunjuk' = minum (krama inggil).",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun menjadi kalimat krama yang benar:",
    translation: "Saya sedang belajar bahasa Jawa.",
    tokens: ["basa Jawi", "Kula", "sinau", "saweg"],
    correct: ["Kula", "saweg", "sinau", "basa Jawi"],
    explanation: "'Kula' = saya (krama), 'saweg' = sedang (krama dari 'lagi'), 'sinau' = belajar. Versi ngoko: 'Aku lagi sinau basa Jawa.'",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat krama dengan kata yang tepat:",
    template: "Bapak ___ ___ saking kantor. (Bapak sudah pulang dari kantor.)",
    blanks: ["sampun", "kondur"],
    options: ["sampun", "kondur", "wis", "mulih", "badhe", "tindak"],
    explanation: "'sampun' = sudah (krama dari 'wis'), 'kondur' = pulang (krama inggil dari 'mulih') — dipakai karena Bapak dihormati. 'badhe' = akan, 'tindak' = pergi (krama inggil).",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Panjenengan ___ saking pundi?' (Anda datang dari mana?)",
    context: "Kata 'datang' yang menghormati lawan bicara.",
    options: ["rawuh", "teka", "dugi", "mulih"],
    correct: "rawuh",
    explanation: "'rawuh' = datang (krama inggil) — wajib untuk 'panjenengan' (Anda, hormat). 'teka' = ngoko, 'dugi' = sampai (krama), 'mulih' = pulang (ngoko).",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Kalimat yang paling tepat diucapkan murid kepada guru:",
    options: [
      "Pak, aku arep takon.",
      "Pak, kula badhe nyuwun pirsa.",
      "Pak, aku pengin ngerti.",
      "Pak, kowe ngerti ora?",
    ],
    correct: 1,
    explanation: "'Kula badhe nyuwun pirsa' = saya mau bertanya (krama alus). Kepada guru wajib krama; 'aku/kowe' (ngoko) terdengar tidak sopan — apalagi 'kowe' kepada guru sangat kasar.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata ngoko dengan krama inggil-nya:",
    pairs: [
      { left: "turu", right: "sare" },
      { left: "lunga", right: "tindak" },
      { left: "adus", right: "siram" },
      { left: "ngomong", right: "ngendika" },
    ],
    explanation: "Pasangan ngoko–krama inggil inti unggah-ungguh: turu/sare (tidur), lunga/tindak (pergi), adus/siram (mandi), ngomong/ngendika (berbicara). Krama inggil hanya untuk orang yang dihormati, bukan diri sendiri.",
  },
  {
    id: "q11", difficulty: "B1", type: "multiple",
    question: "Arti kalimat 'Senajan udan deres, dheweke tetep mangkat.' adalah:",
    options: [
      "Karena hujan deras, dia berangkat",
      "Meskipun hujan deras, dia tetap berangkat",
      "Kalau hujan deras, dia berangkat",
      "Setelah hujan deras, dia berangkat",
    ],
    correct: 1,
    explanation: "'senajan' = meskipun (konsesif), 'tetep' = tetap, 'mangkat' = berangkat. Bandingkan: 'amarga' = karena, 'yen' = kalau, 'sawise' = setelah.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat ngoko alus dengan kata yang tepat:",
    template: "Simbah ___ sare, ___ aja rame-rame. (Kakek sedang tidur, makanya jangan berisik.)",
    blanks: ["lagi", "mula"],
    options: ["lagi", "mula", "arep", "nanging", "wis", "supaya"],
    explanation: "'lagi' = sedang, 'mula' = makanya/oleh karena itu. Ini contoh ngoko alus: kerangka ngoko tapi kata 'sare' (krama inggil) tetap dipakai untuk menghormati Simbah. 'nanging' = tetapi, 'supaya' = agar.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat yang TIDAK sesuai unggah-ungguh adalah:",
    options: [
      "Bapak sampun dhahar.",
      "Kula badhe dhahar rumiyin.",
      "Kula badhe nedha rumiyin.",
      "Ibu saweg sare.",
    ],
    correct: 1,
    explanation: "Krama inggil ('dhahar', 'sare') hanya untuk menghormati ORANG LAIN, tidak boleh untuk diri sendiri. Untuk diri sendiri pakai krama andhap/krama: 'Kula badhe nedha rumiyin' (saya mau makan dulu).",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Panjenengan ___ dhateng Surabaya kaliyan sinten?' (Anda pergi ke Surabaya dengan siapa?)",
    context: "Kata 'pergi' untuk orang yang dihormati.",
    options: ["tindak", "kesah", "lunga", "mlampah"],
    correct: "tindak",
    explanation: "'tindak' = pergi (krama inggil) untuk lawan bicara yang dihormati. 'kesah' = pergi (krama, untuk diri sendiri: 'kula kesah'), 'lunga' = ngoko, 'mlampah' = berjalan (krama).",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Paribasan 'Becik ketitik, ala ketara' paling dekat maknanya dengan:",
    options: [
      "Air susu dibalas air tuba",
      "Sepandai-pandai membungkus, yang busuk berbau juga",
      "Besar pasak daripada tiang",
      "Bagai air di daun talas",
    ],
    correct: 1,
    explanation: "'Becik ketitik, ala ketara' = perbuatan baik akan terbukti, perbuatan buruk pasti kelihatan — sepintar apa pun disembunyikan, kebenaran akhirnya terungkap. Pengecoh: air susu dibalas air tuba = kebaikan dibalas kejahatan; besar pasak = boros; air di daun talas = tidak berpendirian.",
  },
];
