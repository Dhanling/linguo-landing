import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// SUNDANESE PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Fokus: undak usuk basa — loma (akrab) vs lemes (halus)
// ─────────────────────────────────────────────────────────────────────────────
export const sundanesePlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Wilujeng énjing' adalah:",
    options: ["Selamat malam", "Selamat pagi", "Selamat tinggal", "Terima kasih"],
    correct: 1,
    explanation: "'Wilujeng énjing' = selamat pagi. 'Wilujeng wengi' = selamat malam, 'Wilujeng angkat' = selamat jalan, 'Hatur nuhun' = terima kasih.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Sunda dengan artinya:",
    pairs: [
      { left: "hiji", right: "1" },
      { left: "tilu", right: "3" },
      { left: "lima", right: "5" },
      { left: "sapuluh", right: "10" },
    ],
    explanation: "Angka dasar hiji~sapuluh penting untuk harga dan transaksi sehari-hari di pasar.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi (lemes): '___ abdi Asep.' (Nama saya Asep.)",
    context: "Kata 'nama' yang halus untuk diri sendiri.",
    options: ["Nami", "Ngaran", "Jenengan", "Bumi"],
    correct: "Nami",
    explanation: "'nami' = nama (lemes, untuk diri sendiri). 'ngaran' = loma/akrab, 'jenengan' = nama (lemes untuk menghormati orang lain), 'bumi' = rumah (lemes).",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat loma yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["sangu", "Kuring", "dahar"],
    correct: ["Kuring", "dahar", "sangu"],
    explanation: "Struktur SVO: Kuring (saya, loma) + dahar (makan, loma) + sangu (nasi). Versi lemes: 'Abdi neda sangu.'",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Kata 'makan' yang lemes untuk menghormati orang lain adalah:",
    options: ["dahar", "neda", "tuang", "emam"],
    correct: 2,
    explanation: "'tuang' = makan (lemes untuk orang lain: 'Bapa parantos tuang'). 'neda' = lemes untuk diri sendiri, 'dahar' = loma, 'emam' = bahasa anak-anak.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun menjadi kalimat lemes yang benar:",
    translation: "Saya sedang belajar bahasa Sunda.",
    tokens: ["basa Sunda", "Abdi", "diajar", "nuju"],
    correct: ["Abdi", "nuju", "diajar", "basa Sunda"],
    explanation: "'Abdi' = saya (lemes), 'nuju' = sedang (lemes dari 'keur'), 'diajar' = belajar. Versi loma: 'Kuring keur diajar basa Sunda.'",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat lemes dengan kata yang tepat:",
    template: "Bapa ___ ___ ti kantor. (Bapak sudah pulang dari kantor.)",
    blanks: ["parantos", "mulih"],
    options: ["parantos", "mulih", "geus", "balik", "badé", "angkat"],
    explanation: "'parantos' = sudah (lemes dari 'geus'), 'mulih' = pulang (lemes dari 'balik') — dipakai karena Bapa dihormati. 'badé' = akan (lemes), 'angkat' = pergi (lemes).",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: '___ badé angkat ka mana?' (Anda mau pergi ke mana?)",
    context: "Kata ganti 'kamu/Anda' yang sopan.",
    options: ["Anjeun", "Manéh", "Sia", "Kuring"],
    correct: "Anjeun",
    explanation: "'anjeun' = Anda (halus/sopan). 'manéh' = kamu (loma, hanya ke teman akrab), 'sia' = kamu (kasar, bisa menyinggung), 'kuring' = saya (loma).",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Kalimat yang paling tepat diucapkan murid kepada guru:",
    options: [
      "Pak, abdi badé naros.",
      "Pak, kuring rék nanya.",
      "Pak, manéh terang teu?",
      "Pak, sia kudu nyaho.",
    ],
    correct: 0,
    explanation: "'Abdi badé naros' = saya mau bertanya (lemes). Kepada guru wajib lemes; 'kuring/rék/nanya' terlalu loma, sedangkan 'manéh' dan apalagi 'sia' kepada guru sangat tidak sopan.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata loma dengan padanan lemes-nya:",
    pairs: [
      { left: "saré", right: "kulem" },
      { left: "indit", right: "angkat" },
      { left: "imah", right: "bumi" },
      { left: "ngomong", right: "nyarios" },
    ],
    explanation: "Pasangan loma–lemes inti undak usuk: saré/kulem (tidur), indit/angkat (pergi), imah/bumi (rumah), ngomong/nyarios (berbicara). Salah pilih tingkat bisa terkesan kasar atau kaku.",
  },
  {
    id: "q11", difficulty: "B1", type: "multiple",
    question: "Arti kalimat 'Sanajan capé, manéhna tetep digawé.' adalah:",
    options: [
      "Karena capek, dia bekerja",
      "Meskipun capek, dia tetap bekerja",
      "Kalau capek, dia bekerja",
      "Setelah capek, dia berhenti bekerja",
    ],
    correct: 1,
    explanation: "'sanajan' = meskipun (konsesif), 'tetep' = tetap, 'digawé' = bekerja. Bandingkan: 'lantaran/sabab' = karena, 'lamun' = kalau, 'sanggeus' = setelah.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat lemes dengan kata yang tepat:",
    template: "___ hujan ageung, anjeunna ___ sumping ka pasamoan. (Meskipun hujan besar, beliau tetap datang ke pertemuan.)",
    blanks: ["Sanaos", "tetep"],
    options: ["Sanaos", "tetep", "Sanajan", "badé", "parantos", "supados"],
    explanation: "'sanaos' = meskipun (lemes; 'sanajan' bentuk loma-nya — kalimat ini lemes karena ada 'anjeunna' dan 'sumping'), 'tetep' = tetap, 'sumping' = datang (lemes). 'supados' = supaya (lemes).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat yang TIDAK sesuai undak usuk basa adalah:",
    options: [
      "Ibu nuju kulem di kamar.",
      "Abdi badé wangsul ti payun.",
      "Abdi badé tuang heula.",
      "Pa guru parantos sumping.",
    ],
    correct: 2,
    explanation: "'tuang' adalah lemes untuk ORANG LAIN, tidak boleh dipakai untuk diri sendiri. Yang benar: 'Abdi badé neda heula' (saya mau makan dulu). 'wangsul' (pulang) dan 'neda' adalah lemes khusus diri sendiri.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Bapa kapala sakola badé ___ dina acara éta.' (Bapak kepala sekolah akan berbicara di acara itu.)",
    context: "Kata 'berbicara' untuk orang yang dihormati.",
    options: ["nyarios", "ngomong", "nyanggem", "cacarita"],
    correct: "nyarios",
    explanation: "'nyarios' = berbicara (lemes untuk orang yang dihormati). 'nyanggem' = berbicara (lemes untuk diri sendiri), 'ngomong' = loma, 'cacarita' = bercerita (loma).",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Paribasa 'Ka cai jadi saleuwi, ka darat jadi salebak' paling dekat maknanya dengan:",
    options: [
      "Ringan sama dijinjing, berat sama dipikul",
      "Air beriak tanda tak dalam",
      "Besar pasak daripada tiang",
      "Tong kosong nyaring bunyinya",
    ],
    correct: 0,
    explanation: "'Ka cai jadi saleuwi, ka darat jadi salebak' = ke air sama-sama satu lubuk, ke darat sama-sama satu lembah — hidup rukun, seia sekata, kompak dalam susah dan senang. Pengecoh: air beriak = banyak bicara tanda tak berilmu; besar pasak = boros; tong kosong = sesumbar tanpa isi.",
  },
];
