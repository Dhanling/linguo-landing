import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// MANDARIN PLACEMENT TEST (20 soal, tipe campuran — 5 di antaranya listening)
// A1: 5 soal · A2: 5 soal · B1: 6 soal · B2: 4 soal
// Level selaras HSK: A1 ≈ HSK 1, A2 ≈ HSK 2, B1 ≈ HSK 3, B2 ≈ HSK 4
// [placement-listening-v1] Soal ber-`audio` dibunyikan Chirp zh lewat /api/tts;
// transkrip sengaja cuma ada di `audio.text` + pembahasan, tidak di layar soal.
// ─────────────────────────────────────────────────────────────────────────────
export const mandarinPlacementTest: Question[] = [
  // ═══════════════════════ A1 (HSK 1) ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Sapaan paling umum dalam bahasa Mandarin adalah:",
    options: [
      "再见 (zàijiàn)",
      "你好 (nǐ hǎo)",
      "谢谢 (xièxie)",
      "对不起 (duìbuqǐ)",
    ],
    correct: 1,
    explanation: "'你好' = halo. '再见' = sampai jumpa, '谢谢' = terima kasih, '对不起' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Mandarin dengan artinya:",
    pairs: [
      { left: "一 (yī)", right: "1" },
      { left: "三 (sān)", right: "3" },
      { left: "五 (wǔ)", right: "5" },
      { left: "十 (shí)", right: "10" },
    ],
    explanation: "Angka dasar 一~十 adalah fondasi untuk harga, tanggal, dan usia.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: '我 ___ 学生。' (Saya adalah murid.)",
    context: "Kata kerja 'adalah'.",
    options: ["是", "在", "有", "会"],
    correct: "是",
    explanation: "'是' (shì) = adalah, menghubungkan dua kata benda. '在' = berada, '有' = punya, '会' = bisa.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["米饭", "我", "吃"],
    correct: ["我", "吃", "米饭"],
    explanation: "Struktur dasar SVO Mandarin: Subjek (我) + Kata kerja (吃) + Objek (米饭).",
  },

  // [placement-listening-v1] Listening A1 — melengkapi (pasangan nada 睡觉/水饺)
  {
    id: "l1", difficulty: "A1", type: "fillChoice",
    audio: { lang: "zh", text: "你好！我叫王小明，我是学生。我很喜欢睡觉。" },
    question: "Dengarkan audio, lalu lengkapi: '我很喜欢___。'",
    context: "Pilih kata yang kamu dengar.",
    options: ["水饺 (shuǐjiǎo)", "睡觉 (shuìjiào)", "水果 (shuǐguǒ)", "学校 (xuéxiào)"],
    correct: "睡觉 (shuìjiào)",
    explanation: "Transkrip: '你好！我叫王小明，我是学生。我很喜欢睡觉。' (Halo! Nama saya Wang Xiaoming, saya pelajar. Saya sangat suka tidur.) Awas pasangan nada: '睡觉 (shuìjiào)' = tidur (nada 4-4), '水饺 (shuǐjiǎo)' = pangsit rebus (nada 3-3) — suku katanya hampir sama, bedanya cuma nada. '水果 (shuǐguǒ)' = buah, '学校 (xuéxiào)' = sekolah.",
  },

  // ═══════════════════════ A2 (HSK 2) ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'sudah makan', partikel yang tepat adalah:",
    options: [
      "我吃饭 (wǒ chī fàn)",
      "我吃了饭 (wǒ chī le fàn)",
      "我要吃饭 (wǒ yào chī fàn)",
      "我在吃饭 (wǒ zài chī fàn)",
    ],
    correct: 1,
    explanation: "'了' (le) menandai aksi selesai/lampau. '要' = akan/mau, '在' = sedang.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan waktu:",
    translation: "Saya belajar bahasa Mandarin di sekolah.",
    tokens: ["中文", "在学校", "我", "学"],
    correct: ["我", "在学校", "学", "中文"],
    explanation: "Keterangan tempat '在学校' diletakkan SEBELUM kata kerja. Struktur: Subjek + tempat + kerja + objek.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat perbandingan dan kepemilikan:",
    template: "这 ___ 书是我 ___ 。 (Buku ini milik saya.)",
    blanks: ["本", "的"],
    options: ["本", "个", "的", "了", "在", "很"],
    explanation: "'本' = kata bantu bilangan (量词) untuk buku. '的' menandai kepemilikan (我的 = milikku).",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: '你 ___ 说中文？' (Apakah kamu bisa berbahasa Mandarin?)",
    context: "Modalitas 'bisa (kemampuan yang dipelajari)'.",
    options: ["会", "能", "可以", "要"],
    correct: "会",
    explanation: "'会' = bisa karena sudah belajar (skill). '能' = mampu (kondisi), '可以' = boleh (izin).",
  },

  // [placement-listening-v1] Listening A2 — detail informasi (jam + tempat)
  {
    id: "l2", difficulty: "A2", type: "multiple",
    audio: { lang: "zh", text: "我们明天早上八点半在火车站见面吧。火车九点十分开，别忘了！" },
    question: "Dengarkan audio. Jam berapa dan di mana mereka akan bertemu?",
    options: [
      "Jam 09.10, di stasiun kereta",
      "Jam 08.30, di stasiun kereta",
      "Jam 08.30, di bandara",
      "Jam 09.30, di sekolah",
    ],
    correct: 1,
    explanation: "Transkrip: '我们明天早上八点半在火车站见面吧。火车九点十分开，别忘了！' (Besok pagi kita ketemu jam setengah sembilan di stasiun kereta ya. Keretanya berangkat jam sembilan lewat sepuluh, jangan lupa!) '八点半 (bā diǎn bàn)' = 08.30 = waktu BERTEMU; '九点十分 (jiǔ diǎn shí fēn)' = 09.10 = jam kereta BERANGKAT (pengecoh). '火车站 (huǒchēzhàn)' = stasiun kereta, bukan '机场 (jīchǎng)' = bandara.",
  },

  // ═══════════════════════ B1 (HSK 3) ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti kalimat '虽然下雨，但是我还是去了。' :",
    options: [
      "Karena hujan, saya pergi",
      "Meskipun hujan, saya tetap pergi",
      "Kalau hujan, saya pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "Pasangan '虽然…但是…' = meskipun…tetapi…. '还是' = tetap/masih. Konjungsi berpasangan khas HSK 3.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat dengan komplemen hasil '得':",
    translation: "Dia berbicara bahasa Mandarin dengan sangat baik.",
    tokens: ["很好", "说", "他", "得", "中文"],
    correct: ["他", "中文", "说", "得", "很好"],
    explanation: "Struktur komplemen derajat: (objek) + 说 + 得 + 很好. '得' menghubungkan kerja dengan penilaiannya.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "因为…所以…", right: "karena … maka …" },
      { left: "如果…就…", right: "kalau … maka …" },
      { left: "一边…一边…", right: "sambil … sambil …" },
      { left: "越来越…", right: "semakin lama semakin …" },
    ],
    explanation: "Struktur berpasangan ini adalah inti tata bahasa menengah (HSK 3).",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat dengan aspek dan arah:",
    template: "他 ___ 从北京回 ___ 了。 (Dia baru saja pulang dari Beijing.)",
    blanks: ["刚", "来"],
    options: ["刚", "来", "去", "就", "在", "过"],
    explanation: "'刚' = baru saja. '回来' = pulang (kembali ke sini) — 来 menunjukkan arah menuju pembicara.",
  },

  // [placement-listening-v1] Listening B1 — menerjemahkan (pengandaian 要不是…就…)
  {
    id: "l3", difficulty: "B1", type: "multiple",
    audio: { lang: "zh", text: "要不是你昨天提醒我，我就把护照忘在家里了。" },
    question: "Dengarkan audio. Pilih terjemahan yang paling tepat:",
    options: [
      "Kamu tidak mengingatkanku kemarin, jadi pasporku ketinggalan di rumah.",
      "Kalau bukan karena kamu mengingatkanku kemarin, pasporku pasti sudah ketinggalan di rumah.",
      "Kemarin kamu lupa membawa paspor, jadi aku mengingatkanmu.",
      "Kalau besok kamu mengingatkanku, aku tidak akan lupa membawa paspor.",
    ],
    correct: 1,
    explanation: "Transkrip: '要不是你昨天提醒我，我就把护照忘在家里了。' Pola '要不是 (yàobúshì) …，就… 了' = 'kalau bukan karena …, pasti sudah …' — pengandaian yang TIDAK terjadi: nyatanya dia DIINGATKAN, jadi paspornya tidak ketinggalan. Opsi 'kamu tidak mengingatkanku…' membalik fakta; '把护照忘在家里 (bǎ hùzhào wàng zài jiā li)' = meninggalkan paspor di rumah (struktur 把).",
  },
  // [placement-listening-v1] Listening B1 — dikte 2 kata (pengecoh nada 联系/练习)
  {
    id: "l4", difficulty: "B1", type: "missing",
    audio: { lang: "zh", text: "我们周末再联系吧，一起去图书馆练习口语。" },
    question: "Dengarkan audio, lalu isi dua kata yang hilang:",
    template: "我们周末再 ___ 吧，一起去图书馆 ___ 口语。",
    blanks: ["联系 (liánxì)", "练习 (liànxí)"],
    options: ["练习 (liànxí)", "连续 (liánxù)", "联系 (liánxì)", "学习 (xuéxí)", "历史 (lìshǐ)", "联合 (liánhé)"],
    explanation: "Transkrip: '我们周末再联系吧，一起去图书馆练习口语。' (Akhir pekan kita kontakan lagi ya, lalu sama-sama ke perpustakaan latihan berbicara.) '联系 (liánxì, nada 2-4)' = menghubungi/kontak, '练习 (liànxí, nada 4-2)' = berlatih — suku katanya sama, urutan nadanya terbalik. '连续 (liánxù)' = berturut-turut, '学习 (xuéxí)' = belajar (bunyi beda), '历史 (lìshǐ)' = sejarah, '联合 (liánhé)' = bersatu/gabungan.",
  },

  // ═══════════════════════ B2 (HSK 4) ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif '我的手机被偷了。' berarti:",
    options: [
      "Saya mencuri HP",
      "HP saya dicuri (orang)",
      "Saya kehilangan HP",
      "HP saya rusak",
    ],
    correct: 1,
    explanation: "'被' menandai kalimat pasif: subjek dikenai tindakan. '被偷了' = dicuri. Struktur 被字句 khas HSK 4.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi kalimat '把': '请你 ___ 门关上。' (Tolong tutup pintunya.)",
    context: "Struktur 把字句 (memindah objek ke depan kerja).",
    options: ["把", "被", "让", "给"],
    correct: "把",
    explanation: "'把' memindahkan objek (门) ke depan kata kerja untuk menekankan penanganan objek: 把门关上 = menutup pintu.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa '入乡随俗' paling dekat maknanya dengan:",
    options: [
      "Sekali dayung dua pulau terlampaui",
      "Di mana bumi dipijak, di situ langit dijunjung",
      "Air tenang menghanyutkan",
      "Besar pasak daripada tiang",
    ],
    correct: 1,
    explanation: "'入乡随俗' (harfiah 'masuk desa ikuti adatnya') = menyesuaikan diri dengan adat setempat. Chengyu penting di level lanjutan.",
  },
  // [placement-listening-v1] Listening B2 — HOTS: menyimpulkan maksud berita
  {
    id: "l5", difficulty: "B2", type: "multiple",
    audio: { lang: "zh", text: "据报道，今年去云南旅游的人比去年增加了百分之三十。然而，当地酒店的收入却没有明显增长，因为越来越多的游客选择住民宿。" },
    question: "Dengarkan potongan berita ini. Kesimpulan yang PALING masuk akal adalah:",
    options: [
      "Jumlah wisatawan ke Yunnan turun 30 persen tahun ini.",
      "Hotel di Yunnan untung besar karena wisatawan naik 30 persen.",
      "Kenaikan wisatawan tidak otomatis menguntungkan hotel, karena banyak yang beralih menginap di homestay.",
      "Pemerintah melarang wisatawan menginap di homestay.",
    ],
    correct: 2,
    explanation: "Transkrip: '据报道，今年去云南旅游的人比去年增加了百分之三十。然而，当地酒店的收入却没有明显增长，因为越来越多的游客选择住民宿。' (Menurut laporan, jumlah orang yang berwisata ke Yunnan tahun ini naik 30% dibanding tahun lalu. Namun, pendapatan hotel setempat tidak naik signifikan, karena makin banyak wisatawan memilih menginap di homestay.) Kuncinya '然而 (rán'ér)' = namun dan '却 (què)' = justru: wisatawan NAIK tapi pendapatan hotel TIDAK ikut naik → wisatawan pindah ke '民宿 (mínsù)' = homestay. '增加 (zēngjiā)' = bertambah (bukan turun); tidak ada larangan pemerintah.",
  },
];
