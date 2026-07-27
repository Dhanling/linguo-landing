import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// PERSIAN PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Fokus: Farsi standar Iran
// ─────────────────────────────────────────────────────────────────────────────
export const persianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'سلام (salām)' adalah:",
    options: ["Selamat tinggal", "Halo / Salam", "Terima kasih", "Maaf"],
    correct: 1,
    explanation: "'سلام (salām)' = halo (sapaan paling umum). 'خداحافظ (khodāhāfez)' = selamat tinggal, 'ممنون (mamnun)' = terima kasih, 'ببخشید (bebakhshid)' = maaf/permisi.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Persia dengan artinya:",
    pairs: [
      { left: "یک (yek)", right: "1" },
      { left: "سه (se)", right: "3" },
      { left: "پنج (panj)", right: "5" },
      { left: "ده (dah)", right: "10" },
    ],
    explanation: "Angka dasar yek~dah penting untuk harga, jam, dan transaksi sehari-hari.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'من دانشجو ___. (man dāneshju ___.)' (Saya seorang mahasiswa.)",
    context: "Konjugasi kata kerja 'adalah' (budan).",
    options: ["هستم (hastam)", "هستی (hasti)", "است (ast)", "هستند (hastand)"],
    correct: "هستم (hastam)",
    explanation: "Kopula Persia berubah per subjek: man…hastam (saya), to…hasti (kamu), u…ast (dia), ānhā…hastand (mereka).",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar (perhatikan: verba di akhir!):",
    translation: "Saya makan nasi.",
    tokens: ["می‌خورم (mikhoram)", "من (man)", "برنج (berenj)"],
    correct: ["من (man)", "برنج (berenj)", "می‌خورم (mikhoram)"],
    explanation: "Persia berpola SOV: Subjek (من/man) + Objek (برنج/berenj = nasi) + Verba di akhir (می‌خورم/mikhoram = saya makan).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Kalimat mana yang bermakna lampau 'Saya sudah menulis surat'?",
    options: [
      "من نامه می‌نویسم (man nāme minevisam)",
      "من نامه نوشتم (man nāme neveshtam)",
      "من نامه خواهم نوشت (man nāme khāham nevesht)",
      "من دارم نامه می‌نویسم (man dāram nāme minevisam)",
    ],
    correct: 1,
    explanation: "'نوشتم (neveshtam)' = past simple (akhiran -am = 'saya'). 'می‌نویسم (minevisam)' = kala kini, 'خواهم نوشت (khāham nevesht)' = akan menulis, 'دارم … می‌نویسم (dāram … minevisam)' = sedang menulis.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat lampau dengan keterangan waktu:",
    translation: "Kemarin saya pergi ke pasar.",
    tokens: ["رفتم (raftam)", "دیروز (diruz)", "به بازار (be bāzār)", "من (man)"],
    correct: ["دیروز (diruz)", "من (man)", "به بازار (be bāzār)", "رفتم (raftam)"],
    explanation: "'دیروز (diruz)' = kemarin di awal, 'به (be)' = ke, verba lampau 'رفتم (raftam)' = saya pergi tetap di posisi akhir (SOV).",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi dengan preposisi yang tepat:",
    template: "من ___ تهران زندگی می‌کنم و ___ اتوبوس به کار می‌روم. (Saya tinggal di Teheran dan pergi kerja naik bus.)",
    blanks: ["در (dar)", "با (bā)"],
    options: ["در (dar)", "با (bā)", "به (be)", "از (az)", "تا (tā)", "برای (barāye)"],
    explanation: "'در (dar)' = di (lokasi), 'با (bā)' = dengan/naik (alat/kendaraan). Pengecoh: 'به (be)' = ke, 'از (az)' = dari, 'تا (tā)' = sampai, 'برای (barāye)' = untuk.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: '___ فارسی صحبت کنی؟ (___ fārsi sohbat koni?)' (Apakah kamu bisa berbahasa Persia?)",
    context: "Modalitas 'bisa'.",
    options: ["می‌توانی (mitavāni)", "باید (bāyad)", "می‌خواهی (mikhāhi)", "دوست داری (dust dāri)"],
    correct: "می‌توانی (mitavāni)",
    explanation: "'می‌توانی (mitavāni)' = kamu bisa (dari تونستن/tavānestan), diikuti subjunctive 'صحبت کنی (sohbat koni)'. 'باید (bāyad)' = harus, 'می‌خواهی (mikhāhi)' = kamu ingin, 'دوست داری (dust dāri)' = kamu suka.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'با اینکه باران می‌بارید، بیرون رفتم. (bā inke bārān mibārid, birun raftam.)' :",
    options: [
      "Karena hujan, saya keluar",
      "Meskipun hujan, saya tetap keluar",
      "Kalau hujan, saya keluar",
      "Setelah hujan, saya keluar",
    ],
    correct: 1,
    explanation: "'با اینکه (bā inke)' = meskipun. Bandingkan: 'چون (chon)' = karena, 'اگر (agar)' = kalau, 'بعد از اینکه (baʿd az inke)' = setelah.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "چون (chon)", right: "karena" },
      { left: "اما (ammā)", right: "tetapi" },
      { left: "اگر (agar)", right: "jika / kalau" },
      { left: "وقتی که (vaghti ke)", right: "ketika" },
    ],
    explanation: "Konjungsi ini inti tata bahasa menengah — kunci merangkai kalimat kompleks dalam Farsi.",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'تهران ___ از اصفهان است. (Tehrān ___ az Esfahān ast.)' (Teheran lebih besar dari Isfahan.)",
    context: "Bentuk perbandingan.",
    options: ["بزرگ‌تر (bozorg-tar)", "بزرگ (bozorg)", "بزرگ‌ترین (bozorg-tarin)", "خیلی (kheyli)"],
    correct: "بزرگ‌تر (bozorg-tar)",
    explanation: "Komparatif Persia: adjektiva + '-تر (-tar)' + 'از (az)' = lebih … dari. 'بزرگ (bozorg)' = besar (positif), '-ترین (-tarin)' = superlatif 'terbesar', 'خیلی (kheyli)' = sangat.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Kalimat pengandaian — lengkapi dengan bentuk yang tepat:",
    template: "اگر وقت ___، به سینما ___. (Kalau saya punya waktu, saya akan pergi ke bioskop.)",
    blanks: ["داشته باشم (dāshte bāsham)", "می‌روم (miravam)"],
    options: ["داشته باشم (dāshte bāsham)", "می‌روم (miravam)", "دارم (dāram)", "رفتم (raftam)", "بروم (beravam)", "داشتم (dāshtam)"],
    explanation: "Setelah 'اگر (agar)' untuk pengandaian dipakai subjunctive 'داشته باشم (dāshte bāsham)'; klausa hasil pakai kala kini 'می‌روم (miravam)'. Pengecoh: 'دارم (dāram)' = punya (indikatif), 'رفتم (raftam)' = pergi (lampau), 'داشتم (dāshtam)' = punya (lampau).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'ماشین من دزدیده شد. (māshin-e man dozdide shod.)' berarti:",
    options: [
      "Saya mencuri mobil",
      "Mobil saya dicuri",
      "Saya menjual mobil",
      "Mobil saya hilang sendiri",
    ],
    correct: 1,
    explanation: "Pasif Persia dibentuk dari past participle + شدن (shodan = menjadi): دزدیدن (dozdidan = mencuri) → دزدیده شد (dozdide shod = dicuri). Partikel 'ـِ (-e)' pada 'māshin-e man' = ezāfe (penghubung milik).",
  },
  {
    id: "q14", difficulty: "B2", type: "matching",
    prompt: "Jodohkan idiom Persia dengan maknanya:",
    pairs: [
      { left: "دست و پا گم کردن (dast o pā gom kardan)", right: "gugup / panik" },
      { left: "با یک تیر دو نشان زدن (bā yek tir do neshān zadan)", right: "sekali dayung dua pulau terlampaui" },
      { left: "دلم برایت تنگ شده (delam barāyat tang shode)", right: "aku rindu kamu" },
      { left: "خسته نباشید (khaste nabāshid)", right: "sapaan menghargai orang yang sedang bekerja" },
    ],
    explanation: "Harfiahnya unik: 'kehilangan tangan dan kaki' = gugup; 'satu anak panah dua sasaran'; 'hatiku menjadi sempit untukmu' = rindu; 'semoga tidak lelah' = apresiasi kerja (sangat khas budaya Iran).",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'هر که بامش بیش، برفش بیشتر (har ke bāmash bish, barfash bishtar)' paling dekat maknanya dengan:",
    options: [
      "Semakin tinggi pohon, semakin kencang angin menerpanya",
      "Tong kosong nyaring bunyinya",
      "Sambil menyelam minum air",
      "Bagai pungguk merindukan bulan",
    ],
    correct: 0,
    explanation: "Harfiah: 'siapa atapnya lebih luas, saljunya lebih banyak' — makin tinggi kedudukan/harta, makin besar beban dan tanggung jawabnya. Pengecoh: banyak bicara tanpa isi, dua hal sekaligus, mengharap yang mustahil.",
  },
];
