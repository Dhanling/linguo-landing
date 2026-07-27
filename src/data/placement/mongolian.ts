import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// MONGOLIAN (KHALKHA, KIRIL) PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const mongolianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Сайн байна уу (sain baina uu)' adalah:",
    options: ["Selamat tinggal", "Halo / Apa kabar", "Terima kasih", "Maaf"],
    correct: 1,
    explanation: "'Сайн байна уу (sain baina uu)' = halo/apa kabar (harfiah: 'apakah baik-baik?'). 'Баярлалаа (bayarlalaa)' = terima kasih, 'Баяртай (bayartai)' = selamat tinggal, 'Уучлаарай (uuchlaarai)' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Mongol dengan artinya:",
    pairs: [
      { left: "нэг (neg)", right: "1" },
      { left: "гурав (gurav)", right: "3" },
      { left: "тав (tav)", right: "5" },
      { left: "арав (arav)", right: "10" },
    ],
    explanation: "Angka dasar нэг (neg) sampai арав (arav) wajib dikuasai untuk harga dan transaksi sehari-hari di Mongolia.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: '___ оюутан. (___ oyutan.)' (Saya seorang mahasiswa.)",
    context: "Pilih kata ganti yang tepat.",
    options: ["Би (bi)", "Чи (chi)", "Тэр (ter)", "Бид (bid)"],
    correct: "Би (bi)",
    explanation: "'Би (bi)' = saya. Kalimat identitas Mongol tak butuh kopula: 'Би оюутан' harfiah 'saya mahasiswa'. 'Чи (chi)' = kamu, 'Тэр (ter)' = dia, 'Бид (bid)' = kami/kita.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["иддэг (iddeg)", "Би (bi)", "будаа (budaa)"],
    correct: ["Би (bi)", "будаа (budaa)", "иддэг (iddeg)"],
    explanation: "Bahasa Mongol berpola SOV: Subjek Би (bi) + Objek будаа (budaa) + Kata kerja иддэг (iddeg). Kata kerja selalu di akhir; akhiran -даг/-дэг menandai kebiasaan (habitual).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'kemarin saya pergi ke sekolah' (lampau), kalimat yang tepat:",
    options: [
      "Би сургуульд явдаг (bi surguuli-d yavdag)",
      "Би өчигдөр сургуульд явсан (bi öchigdör surguuli-d yavsan)",
      "Би сургуульд явна (bi surguuli-d yavna)",
      "Би сургуульд явж байна (bi surguuli-d yavj baina)",
    ],
    correct: 1,
    explanation: "Akhiran '-сан/-сэн (-san/-sen)' = penanda lampau: 'явсан (yavsan)' = telah pergi. 'явдаг (yavdag)' = pergi (kebiasaan), 'явна (yavna)' = akan pergi, 'явж байна (yavj baina)' = sedang pergi. 'өчигдөр (öchigdör)' = kemarin.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Mongol di sekolah.",
    tokens: ["монгол хэл (mongol khel)", "Би (bi)", "сурдаг (surdag)", "сургуульд (surguuli-d)"],
    correct: ["Би (bi)", "сургуульд (surguuli-d)", "монгол хэл (mongol khel)", "сурдаг (surdag)"],
    explanation: "Keterangan tempat 'сургуульд (surguuli-d)' = di sekolah memakai akhiran kasus datif-lokatif -д (-d) dan diletakkan sebelum objek; kata kerja 'сурдаг (surdag)' = belajar tetap di akhir (SOV).",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "Дэлгүүр ___ 7 цагт ___. (delguur … 7 tsagt … — Toko buka pukul 7 pagi.)",
    blanks: ["өглөө (öglöö)", "нээгддэг (neegddeg)"],
    options: ["өглөө (öglöö)", "орой (oroi)", "нээгддэг (neegddeg)", "хаагддаг (khaagddag)", "явдаг (yavdag)", "шөнө (shönö)"],
    explanation: "'өглөө (öglöö)' = pagi, 'нээгддэг (neegddeg)' = buka. Pengecoh: 'орой (oroi)' = malam/sore, 'шөнө (shönö)' = tengah malam, 'хаагддаг (khaagddag)' = tutup, 'явдаг (yavdag)' = pergi.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Ширээн ___ ном байна. (shireen ___ nom baina.)' (Ada buku di atas meja.)",
    context: "Kata penunjuk posisi (postposisi).",
    options: ["дээр (deer)", "доор (door)", "дотор (dotor)", "дэргэд (derged)"],
    correct: "дээр (deer)",
    explanation: "'дээр (deer)' = di atas, diletakkan SETELAH kata benda (postposisi) — kebalikan preposisi Indonesia. 'доор (door)' = di bawah, 'дотор (dotor)' = di dalam, 'дэргэд (derged)' = di samping/dekat.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Бороо орсон ч би явна. (boroo orson ch bi yavna.)':",
    options: [
      "Karena hujan, saya akan pergi",
      "Meskipun hujan turun, saya akan tetap pergi",
      "Kalau hujan, saya tidak pergi",
      "Setelah hujan, saya akan pergi",
    ],
    correct: 1,
    explanation: "Partikel 'ч (ch)' setelah kata kerja lampau = meskipun/pun: 'орсон ч (orson ch)' = meskipun turun. 'Бороо орох (boroo orokh)' = hujan turun, 'явна (yavna)' = akan pergi.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Mongol dengan artinya:",
    pairs: [
      { left: "яагаад гэвэл (yaagaad gevel)", right: "karena" },
      { left: "хэрэв (kherev)", right: "kalau" },
      { left: "гэхдээ (gekhdee)", right: "tetapi" },
      { left: "тиймээс (tiimees)", right: "oleh karena itu" },
    ],
    explanation: "Konjungsi inti kalimat kompleks: яагаад гэвэл (sebab), хэрэв (syarat), гэхдээ (pertentangan), тиймээс (akibat/kesimpulan).",
  },
  {
    id: "q11", difficulty: "B1", type: "multiple",
    question: "Kalimat 'Хэрэв цаг байвал би очно. (kherev tsag baival bi ochno.)' berarti:",
    options: [
      "Karena ada waktu, saya datang",
      "Kalau ada waktu, saya akan datang",
      "Meskipun ada waktu, saya tidak datang",
      "Ketika waktunya habis, saya pulang",
    ],
    correct: 1,
    explanation: "'Хэрэв (kherev)' = kalau, berpasangan dengan akhiran kondisional '-вал/-вэл (-val/-vel)': 'байвал (baival)' = kalau ada. 'очно (ochno)' = akan datang (ke sana).",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat dengan kata bandingan:",
    template: "Өнөөдөр өчигдрөөс ___ халуун байна. Энэ бол долоо хоногийн ___ халуун өдөр. (önöödör öchigdröös … khaluun baina. ene bol doloo khonogiin … khaluun ödör — Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["илүү (ilüü)", "хамгийн (khamgiin)"],
    options: ["илүү (ilüü)", "хамгийн (khamgiin)", "шиг (shig)", "адил (adil)", "маш (mash)", "бас (bas)"],
    explanation: "'X-ээс илүү (ilüü)' = lebih … daripada X (komparatif, dengan kasus ablatif -өөс), 'хамгийн (khamgiin)' = paling (superlatif). Pengecoh: 'шиг (shig)' = seperti, 'адил (adil)' = sama, 'маш (mash)' = sangat, 'бас (bas)' = juga.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'Миний утас хулгайлагдсан. (minii utas khulgailagdsan.)' berarti:",
    options: [
      "Saya mencuri HP",
      "HP saya dicuri",
      "Saya menjual HP",
      "HP saya rusak sendiri",
    ],
    correct: 1,
    explanation: "Pasif Mongol dibentuk dengan sisipan '-гд- (-gd-)': хулгайлах (khulgailakh, mencuri) → хулгайлагдсан (khulgailagdsan, dicuri — lampau). 'Миний (minii)' = milik saya, 'утас (utas)' = telepon/HP.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'Тэр монгол хүн ___ монголоор ярьдаг. (ter mongol khün ___ mongoloor yaridag.)' (Dia berbahasa Mongol seperti orang Mongolia asli.)",
    context: "Partikel perbandingan 'seperti'.",
    options: ["шиг (shig)", "илүү (ilüü)", "тул (tul)", "хүртэл (khürtel)"],
    correct: "шиг (shig)",
    explanation: "'X шиг (shig)' = seperti X (penyerupaan): 'монгол хүн шиг (mongol khün shig)' = seperti orang Mongolia. 'монголоор (mongoloor)' = dalam bahasa Mongol (kasus instrumental). 'илүү (ilüü)' = lebih, 'тул (tul)' = karena, 'хүртэл (khürtel)' = sampai.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa Mongol 'Долоо хэмжиж нэг огтол (doloo khemjij neg ogtol)' — 'ukur tujuh kali, potong sekali' — paling dekat maknanya dengan:",
    options: [
      "Tong kosong nyaring bunyinya",
      "Pikir dahulu pendapatan, sesal kemudian tidak berguna",
      "Air tenang menghanyutkan",
      "Besar pasak daripada tiang",
    ],
    correct: 1,
    explanation: "Maknanya: pertimbangkan matang-matang sebelum bertindak agar tak menyesal — padanannya 'Pikir dahulu pendapatan, sesal kemudian tidak berguna'. 'хэмжих (khemjikh)' = mengukur, 'огтлох (ogtlokh)' = memotong. Pengecoh: tong kosong = omong besar, air tenang = orang pendiam berilmu, besar pasak = boros.",
  },
];
