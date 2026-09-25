import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// ARABIC PLACEMENT TEST (20 soal, tipe campuran — 5 di antaranya listening)
// A1: 5 soal · A2: 5 soal · B1: 6 soal · B2: 4 soal
// [placement-listening-v1] Soal ber-`audio` dibunyikan Chirp ar-XA lewat /api/tts;
// transkrip sengaja cuma ada di `audio.text` + pembahasan, tidak di layar soal.
// Fokus: Fusha (Modern Standard Arabic / MSA)
// ─────────────────────────────────────────────────────────────────────────────
export const arabicPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'مرحباً (marhaban)' adalah:",
    options: ["Selamat tinggal", "Halo / Selamat datang", "Terima kasih", "Maaf"],
    correct: 1,
    explanation: "'مرحباً (marhaban)' = halo/selamat datang. 'مع السلامة (maʿa as-salāma)' = selamat tinggal, 'شكراً (shukran)' = terima kasih, 'آسف (āsif)' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Arab dengan artinya:",
    pairs: [
      { left: "واحد (wāhid)", right: "1" },
      { left: "ثلاثة (thalātha)", right: "3" },
      { left: "خمسة (khamsa)", right: "5" },
      { left: "عشرة (ʿashara)", right: "10" },
    ],
    explanation: "Angka dasar wāhid~ʿashara penting untuk harga, jam, dan transaksi sehari-hari.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: '___ طالبٌ. (___ ṭālibun.)' (Dia [laki-laki] seorang pelajar.)",
    context: "Pilih kata ganti yang tepat.",
    options: ["هو (huwa)", "هي (hiya)", "أنتَ (anta)", "نحن (nahnu)"],
    correct: "هو (huwa)",
    explanation: "Kalimat nominal Arab tidak butuh kata 'adalah'. 'هو (huwa)' = dia (lk), 'هي (hiya)' = dia (pr), 'أنتَ (anta)' = kamu (lk), 'نحن (nahnu)' = kami/kita.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan roti.",
    tokens: ["الخبز (al-khubz)", "أنا (ana)", "آكل (ākulu)"],
    correct: ["أنا (ana)", "آكل (ākulu)", "الخبز (al-khubz)"],
    explanation: "Struktur: Subjek (أنا/ana) + Kata kerja (آكل/ākulu = makan) + Objek (الخبز/al-khubz = roti). Awalan ال (al-) = kata sandang 'itu/the'.",
  },

  // [placement-listening-v1] Listening A1 — melengkapi (pasangan minimal jāmiʿa/jāmiʿ)
  {
    id: "l1", difficulty: "A1", type: "fillChoice",
    audio: { lang: "ar", text: "صَبَاحَ الْخَيْرِ! اِسْمِي أَحْمَدُ، أَنَا طَالِبٌ فِي الْجَامِعَةِ." },
    question: "Dengarkan audio, lalu lengkapi: 'أنا طالب في ___.'",
    context: "Pilih kata yang kamu dengar.",
    options: ["الجامعة (al-jāmiʿa)", "الجامع (al-jāmiʿ)", "المدرسة (al-madrasa)", "المكتبة (al-maktaba)"],
    correct: "الجامعة (al-jāmiʿa)",
    explanation: "Transkrip: 'صباح الخير! اسمي أحمد، أنا طالب في الجامعة.' (Selamat pagi! Nama saya Ahmad, saya mahasiswa di universitas.) Awas pasangan mirip: 'الجامعة (al-jāmiʿa)' = universitas, 'الجامع (al-jāmiʿ)' = masjid jami' — bedanya cuma ta marbūṭa di akhir.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Kalimat mana yang bermakna lampau 'Dia sudah menulis surat'?",
    options: [
      "هو يكتب رسالة (huwa yaktubu risāla)",
      "هو كتب رسالة (huwa kataba risāla)",
      "هو سيكتب رسالة (huwa sa-yaktubu risāla)",
      "هو يكتب الآن (huwa yaktubu al-ān)",
    ],
    correct: 1,
    explanation: "'كتب (kataba)' = bentuk māḍī (lampau). 'يكتب (yaktubu)' = muḍāriʿ (sedang/biasa), awalan 'سـ (sa-)' = akan (futur), 'الآن (al-ān)' = sekarang.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat lampau dengan keterangan waktu:",
    translation: "Saya pergi ke pasar kemarin.",
    tokens: ["السوق (as-sūq)", "أمس (amsi)", "ذهبتُ (dhahabtu)", "إلى (ilā)"],
    correct: ["ذهبتُ (dhahabtu)", "إلى (ilā)", "السوق (as-sūq)", "أمس (amsi)"],
    explanation: "Kalimat verbal Arab boleh diawali verba: ذهبتُ (dhahabtu = saya pergi, akhiran -tu = 'saya') + إلى (ilā = ke) + tempat + keterangan waktu di akhir.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi dengan preposisi (harf jarr) yang tepat:",
    template: "أذهب ___ المدرسة ___ الصباح. (Saya pergi ke sekolah pada pagi hari.)",
    blanks: ["إلى (ilā)", "في (fī)"],
    options: ["إلى (ilā)", "في (fī)", "من (min)", "على (ʿalā)", "عن (ʿan)", "مع (maʿa)"],
    explanation: "'إلى (ilā)' = ke (arah), 'في (fī)' = di/pada (tempat & waktu). Pengecoh: 'من (min)' = dari, 'على (ʿalā)' = di atas, 'مع (maʿa)' = bersama.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'هل ___ أن تساعدني؟ (hal ___ an tusāʿidanī?)' (Bisakah kamu membantuku?)",
    context: "Modalitas 'bisa'.",
    options: ["يمكنك (yumkinuka)", "يجب (yajibu)", "تريد (turīdu)", "عندك (ʿindaka)"],
    correct: "يمكنك (yumkinuka)",
    explanation: "'يمكنك (yumkinuka)' = kamu bisa. 'يجب (yajibu)' = harus, 'تريد (turīdu)' = kamu ingin, 'عندك (ʿindaka)' = kamu punya.",
  },

  // [placement-listening-v1] Listening A2 — detail informasi (jam + kendaraan)
  {
    id: "l2", difficulty: "A2", type: "multiple",
    audio: { lang: "ar", text: "أَسْتَيْقِظُ كُلَّ يَوْمٍ فِي السَّاعَةِ السَّادِسَةِ، ثُمَّ أَذْهَبُ إِلَى الْعَمَلِ بِالْحَافِلَةِ فِي السَّاعَةِ السَّابِعَةِ وَالنِّصْفِ." },
    question: "Dengarkan audio. Jam berapa dia berangkat kerja, dan naik apa?",
    options: [
      "Jam 06.00, naik bus",
      "Jam 07.30, naik bus",
      "Jam 07.30, naik mobil",
      "Jam 06.30, naik kereta",
    ],
    correct: 1,
    explanation: "Transkrip: 'أستيقظ كل يوم في الساعة السادسة، ثم أذهب إلى العمل بالحافلة في الساعة السابعة والنصف.' (Saya bangun tiap hari jam enam, lalu berangkat kerja naik bus jam setengah delapan.) Jam 06.00 = waktu BANGUN (pengecoh). 'السابعة والنصف (as-sābiʿa wa-n-niṣf)' = 07.30, 'الحافلة (al-ḥāfila)' = bus.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'رغم أن الجو ممطر، خرجتُ. (raghma anna al-jaww mumṭir, kharajtu.)' :",
    options: [
      "Karena hujan, saya keluar",
      "Meskipun hujan, saya tetap keluar",
      "Kalau hujan, saya keluar",
      "Setelah hujan, saya keluar",
    ],
    correct: 1,
    explanation: "'رغم أن (raghma anna)' = meskipun. Bandingkan: 'لأن (li'anna)' = karena, 'إذا (idhā)' = kalau, 'بعد (baʿda)' = setelah.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "لأن (li'anna)", right: "karena" },
      { left: "لكن (lākin)", right: "tetapi" },
      { left: "إذا (idhā)", right: "jika / kalau" },
      { left: "لكي (li-kay)", right: "supaya / agar" },
    ],
    explanation: "Konjungsi ini inti tata bahasa menengah — kunci merangkai kalimat kompleks dalam MSA.",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'القاهرة ___ من الإسكندرية. (al-Qāhira ___ min al-Iskandariyya.)' (Kairo lebih besar dari Alexandria.)",
    context: "Bentuk perbandingan (ism tafḍīl).",
    options: ["أكبر (akbar)", "كبير (kabīr)", "الأكبر (al-akbar)", "جداً (jiddan)"],
    correct: "أكبر (akbar)",
    explanation: "Komparatif Arab pakai pola afʿal + من (min = dari): 'أكبر من (akbar min)' = lebih besar dari. 'كبير (kabīr)' = besar (positif), 'الأكبر (al-akbar)' dengan al- = superlatif 'terbesar', 'جداً (jiddan)' = sangat.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Kalimat pengandaian — lengkapi dengan bentuk yang tepat:",
    template: "إذا ___ بجدٍّ، ___ في الامتحان. (Kalau kamu belajar sungguh-sungguh, kamu akan lulus ujian.)",
    blanks: ["درستَ (darasta)", "ستنجح (sa-tanjaḥ)"],
    options: ["درستَ (darasta)", "ستنجح (sa-tanjaḥ)", "تدرس (tadrusu)", "نجحتَ (najaḥta)", "يدرس (yadrusu)", "فشلتَ (fashilta)"],
    explanation: "Setelah 'إذا (idhā)' lazim dipakai bentuk māḍī: 'درستَ (darasta)'. Klausa hasil pakai futur 'ستنجح (sa-tanjaḥ)' = kamu akan lulus. Pengecoh: 'نجحتَ (najaḥta)' = kamu lulus (lampau), 'فشلتَ (fashilta)' = kamu gagal.",
  },

  // [placement-listening-v1] Listening B1 — menerjemahkan (pengandaian lau … la-)
  {
    id: "l3", difficulty: "B1", type: "multiple",
    audio: { lang: "ar", text: "لَوْ كُنْتُ أَعْرِفُ أَنَّكَ مَرِيضٌ، لَزُرْتُكَ فِي الْمُسْتَشْفَى." },
    question: "Dengarkan audio. Pilih terjemahan yang paling tepat:",
    options: [
      "Kalau saja aku tahu kamu sakit, aku pasti sudah menjengukmu di rumah sakit.",
      "Aku tahu kamu sakit, jadi aku menjengukmu di rumah sakit.",
      "Kalau kamu sakit, aku akan menjengukmu di rumah sakit.",
      "Aku tidak tahu kamu sakit, tapi dokter sudah menjengukmu.",
    ],
    correct: 0,
    explanation: "Transkrip: 'لو كنت أعرف أنك مريض، لزرتك في المستشفى.' Pola 'لَوْ (law) + māḍī …، لَـ (la-) + māḍī' = pengandaian yang TIDAK terjadi (nyatanya dia tidak tahu, jadi tidak menjenguk). Opsi 'kalau kamu sakit, aku akan…' pakai إذا (idhā) — pengandaian yang masih mungkin.",
  },
  // [placement-listening-v1] Listening B1 — dikte 2 kata (pengecoh bunyi mirip)
  {
    id: "l4", difficulty: "B1", type: "missing",
    audio: { lang: "ar", text: "يَجِبُ عَلَيْنَا أَنْ نُحَافِظَ عَلَى الْبِيئَةِ، لِأَنَّ التَّلَوُّثَ يُؤَثِّرُ عَلَى صِحَّةِ الْإِنْسَانِ." },
    question: "Dengarkan audio, lalu isi dua kata yang hilang:",
    template: "يجب علينا أن ___ على البيئة، لأن ___ يؤثر على صحة الإنسان.",
    blanks: ["نحافظ (nuḥāfiẓa)", "التلوث (at-talawwuth)"],
    options: ["نحفظ (naḥfaẓa)", "التلوث (at-talawwuth)", "يحافظ (yuḥāfiẓu)", "نحافظ (nuḥāfiẓa)", "التطور (at-taṭawwur)", "التلون (at-talawwun)"],
    explanation: "Transkrip: 'يجب علينا أن نحافظ على البيئة، لأن التلوث يؤثر على صحة الإنسان.' (Kita wajib menjaga lingkungan, karena polusi memengaruhi kesehatan manusia.) 'نُحافظ على (nuḥāfiẓu ʿalā)' = menjaga/melestarikan (awalan nu- = kita); 'نَحفظ (naḥfaẓu)' = menghafal. 'التلوّث (at-talawwuth)' = polusi, beda dengan 'التلوّن (at-talawwun)' = perubahan warna dan 'التطوّر (at-taṭawwur)' = perkembangan.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'سُرِقَت سيارتي. (suriqat sayyāratī.)' berarti:",
    options: [
      "Saya mencuri mobil",
      "Mobil saya dicuri",
      "Saya menjual mobil",
      "Mobil saya rusak",
    ],
    correct: 1,
    explanation: "Bentuk pasif Arab (mabnī li-l-majhūl) pola fuʿila: سرق (saraqa = mencuri) → سُرِق (suriqa = dicuri). Akhiran -at menyesuaikan 'سيارة (sayyāra)' yang feminin.",
  },
  {
    id: "q14", difficulty: "B2", type: "matching",
    prompt: "Jodohkan idiom Arab dengan maknanya:",
    pairs: [
      { left: "بين نارين (bayna nārayn)", right: "serba salah, terjepit dua pilihan" },
      { left: "يضرب عصفورين بحجر (yaḍrib ʿuṣfūrayn bi-ḥajar)", right: "sekali dayung dua pulau terlampaui" },
      { left: "على أحرّ من الجمر (ʿalā aḥarr min al-jamr)", right: "menunggu dengan sangat tidak sabar" },
      { left: "رفع الراية البيضاء (rafaʿa ar-rāya al-bayḍā')", right: "menyerah" },
    ],
    explanation: "Idiom tak bisa diterjemahkan kata-per-kata: 'bayna nārayn' harfiah 'di antara dua api', 'ʿalā aḥarr min al-jamr' harfiah 'lebih panas dari bara', 'ar-rāya al-bayḍā'' = bendera putih.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'من جدّ وجد (man jadda wajada)' paling dekat maknanya dengan:",
    options: [
      "Berakit-rakit ke hulu, berenang-renang ke tepian",
      "Air beriak tanda tak dalam",
      "Tong kosong nyaring bunyinya",
      "Bagai katak dalam tempurung",
    ],
    correct: 0,
    explanation: "'Man jadda wajada' = siapa yang bersungguh-sungguh pasti berhasil — bersusah payah dahulu, menikmati hasil kemudian. Pengecoh menggambarkan orang dangkal/banyak bicara/berwawasan sempit.",
  },

  // [placement-listening-v1] Listening B2 — HOTS: menyimpulkan maksud berita
  {
    id: "l5", difficulty: "B2", type: "multiple",
    audio: { lang: "ar", text: "أَعْلَنَتِ الشَّرِكَةُ أَنَّ أَرْبَاحَهَا ارْتَفَعَتْ هَذَا الْعَامَ بِنِسْبَةِ عِشْرِينَ فِي الْمِئَةِ، وَمَعَ ذَلِكَ قَرَّرَتْ إِغْلَاقَ ثَلَاثَةٍ مِنْ فُرُوعِهَا، وَتَحْوِيلَ خِدْمَاتِهَا إِلَى الْإِنْتَرْنِتِ." },
    question: "Dengarkan potongan berita ini. Kesimpulan yang PALING masuk akal adalah:",
    options: [
      "Perusahaan menutup cabang karena sedang merugi.",
      "Penutupan cabang adalah strategi pindah ke layanan online, bukan karena bisnisnya memburuk.",
      "Keuntungan perusahaan turun 20 persen tahun ini.",
      "Perusahaan membuka tiga cabang baru dan layanan online.",
    ],
    correct: 1,
    explanation: "Transkrip: 'أعلنت الشركة أن أرباحها ارتفعت هذا العام بنسبة عشرين في المئة، ومع ذلك قررت إغلاق ثلاثة من فروعها، وتحويل خدماتها إلى الإنترنت.' (Perusahaan mengumumkan labanya naik 20% tahun ini, namun demikian memutuskan menutup tiga cabangnya dan memindahkan layanannya ke internet.) Kuncinya 'ومع ذلك (wa-maʿa dhālika)' = namun demikian: laba NAIK tapi cabang tetap ditutup → itu strategi digital, bukan karena rugi. 'ارتفعت (irtafaʿat)' = naik, 'إغلاق (ighlāq)' = penutupan.",
  },
];
