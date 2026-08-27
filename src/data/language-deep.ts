// =============================================================================
// src/data/language-deep.ts
// [aeo-language-deep-v1]
//
// Konten mendalam per bahasa untuk /kursus/bahasa-*. Isinya menjawab pertanyaan
// yang benar-benar diketik orang sebelum memutuskan belajar sebuah bahasa —
// "susah nggak sih?", "berapa lama sampai bisa ngobrol?" — yang tidak terjawab
// oleh bagian pemasaran di halaman itu.
//
// KENAPA TERPISAH DARI languages-detail.ts
// Berkas itu sudah 7.000+ baris dan strukturnya seragam untuk 45 bahasa. Konten
// di sini sengaja OPSIONAL: hanya bahasa yang benar-benar digarap dalam yang
// punya entri. Halaman bahasa tanpa entri tetap tampil apa adanya.
//
// KENAPA BAHASA-BAHASA INI DULU
// Georgia, Swahili, dan Khmer nyaris tidak punya konten berbahasa Indonesia
// yang serius di internet. Untuk kueri seperti "belajar bahasa Georgia" atau
// "bahasa Swahili susah tidak", tidak ada halaman Indonesia yang layak dikutip
// mesin jawaban — jadi halaman yang benar-benar menjawabnya punya peluang
// dikutip jauh lebih besar daripada bersaing di "kursus bahasa inggris".
//
// ATURAN ISI
// - Estimasi waktu WAJIB disertai asumsinya (berapa sesi/minggu, latihan
//   mandiri berapa lama). Angka tanpa asumsi tidak bisa diverifikasi pembaca
//   dan gampang dianggap klaim kosong.
// - Tingkat kesulitan ditulis dari sudut PENUTUR INDONESIA, bukan penutur
//   Inggris. Ini pembeda yang tidak dimiliki sumber berbahasa Inggris.
// - Jangan menaruh angka harga di sini. Harga dirender dari pricelist.
// =============================================================================

export type DeepFaq = { question: string; answer: string };

export type DeepSilabus = {
  level: string;
  fokus: string;
  hasil: string;
};

export type LanguageDeep = {
  /** urlSlug di languages-detail.ts. */
  urlSlug: string;

  /** Kenapa orang Indonesia belajar bahasa ini. 2–3 paragraf. */
  kenapa: string[];

  kesulitan: {
    /** Label singkat, mis. "Menengah — aksara baru, tata bahasa ramah". */
    ringkas: string;
    /** 1–5. Dipakai untuk bilah visual, bukan klaim ilmiah. */
    skor: number;
    /** Hal yang JUSTRU mudah buat penutur Indonesia. Wajib diisi jujur. */
    mudah: string[];
    /** Hal yang memang sulit. Wajib diisi jujur, jangan diperhalus. */
    sulit: string[];
  };

  /** Estimasi waktu tempuh. `asumsi` wajib. */
  estimasi: {
    asumsi: string;
    tahap: Array<{ target: string; durasi: string; bisaApa: string }>;
  };

  silabus: DeepSilabus[];

  faq: DeepFaq[];
};

export const languageDeep: Record<string, LanguageDeep> = {
  // ==========================================================================
  // GEORGIA (ქართული)
  // ==========================================================================
  georgia: {
    urlSlug: "georgia",
    kenapa: [
      "Bahasa Georgia dipakai sekitar 4 juta orang dan tidak punya kerabat dekat di antara bahasa-bahasa besar dunia. Georgia bukan rumpun Indo-Eropa, bukan Turkik, bukan Semit — ia berdiri sendiri di rumpun Kartveli bersama beberapa bahasa tetangganya. Artinya, kosakatanya nyaris tidak bisa ditebak dari bahasa lain yang mungkin sudah kamu kuasai.",
      "Alasan paling umum orang Indonesia belajar bahasa Georgia adalah kuliah kedokteran. Universitas di Tbilisi dan Batumi membuka program berbahasa Inggris dengan biaya yang jauh lebih ringan dibanding Eropa Barat, dan mahasiswa Indonesia di sana bertambah tiap tahun. Kuliahnya memang berbahasa Inggris, tapi hidup sehari-hari, urusan izin tinggal, apotek, pasar, dan rumah sakit tempat koas berjalan dalam bahasa Georgia.",
      "Alasan kedua adalah pariwisata dan kerja. Georgia membebaskan visa untuk banyak paspor dan menjadi tujuan digital nomad yang tumbuh cepat. Di luar Tbilisi, bahasa Inggris cepat menipis. Kemampuan membaca aksara Georgia saja sudah mengubah perjalanan secara drastis — dari menebak-nebak papan nama menjadi bisa membaca menu, jadwal marshrutka, dan nama jalan.",
    ],
    kesulitan: {
      ringkas: "Sulit — aksara baru, gugus konsonan, dan sistem kata kerja yang rumit",
      skor: 4,
      mudah: [
        "Tidak ada gender gramatikal. Kata benda tidak dibagi maskulin-feminin seperti bahasa Jerman atau Prancis.",
        "Tidak ada artikel. Tidak perlu memikirkan padanan 'a', 'an', atau 'the'.",
        "Ejaannya konsisten: satu huruf satu bunyi, tanpa huruf bisu. Begitu hafal aksaranya, kamu bisa membaca kata apa pun dengan benar.",
        "Aksara Georgia hanya 33 huruf dan tidak punya huruf besar-kecil, jadi yang perlu dihafal separuh dari beban aksara Arab atau Devanagari.",
      ],
      sulit: [
        "Gugus konsonan panjang tanpa vokal di antaranya. Kata seperti 'gvprtskvni' nyata dan butuh latihan lidah berminggu-minggu bagi penutur Indonesia yang terbiasa pola konsonan-vokal.",
        "Konsonan ejektif — bunyi 'k', 'p', 't', 'ts', 'ch' versi 'meletup' yang tidak ada padanannya dalam bahasa Indonesia dan membedakan arti kata.",
        "Kata kerjanya polipersonal: satu kata kerja menandai pelaku DAN sasaran sekaligus, dengan imbuhan yang berubah menurut kala. Ini bagian tersulit dan biasanya baru terasa di level A2 ke atas.",
        "Sistem kasus dengan tujuh kasus, termasuk kasus ergatif yang mengubah penanda subjek tergantung jenis kata kerja dan kalanya.",
      ],
    },
    estimasi: {
      asumsi:
        "Asumsi: 2 sesi privat 60 menit per minggu bersama pengajar, ditambah 3–4 jam latihan mandiri per minggu, mulai dari nol tanpa latar belakang bahasa Kaukasus.",
      tahap: [
        {
          target: "Membaca aksara Georgia",
          durasi: "2–3 minggu",
          bisaApa: "Membaca papan nama, menu, dan nama stasiun dengan lancar walau belum paham artinya.",
        },
        {
          target: "A1 — Basic",
          durasi: "4–6 bulan",
          bisaApa: "Memperkenalkan diri, membeli sesuatu, menyebut angka dan waktu, bertanya arah, bertahan dalam percakapan yang sudah bisa ditebak.",
        },
        {
          target: "A2 — Upper Basic",
          durasi: "10–14 bulan",
          bisaApa: "Mengurus keperluan sehari-hari sendiri: apotek, kantor imigrasi, sewa apartemen, menjelaskan keluhan sederhana ke dokter.",
        },
        {
          target: "B1 — Intermediate",
          durasi: "20–26 bulan",
          bisaApa: "Mengikuti percakapan panjang antar penutur asli, menjelaskan pendapat, dan bekerja dalam tim berbahasa Georgia dengan bantuan sesekali.",
        },
      ],
    },
    silabus: [
      { level: "A1", fokus: "Aksara Mkhedruli, pelafalan ejektif, sapaan, angka, keluarga, kata kerja dasar kala kini", hasil: "Membaca dan menulis aksara Georgia, memperkenalkan diri, transaksi sederhana" },
      { level: "A2", fokus: "Kasus nominatif–ergatif–datif, kala lampau, arah dan lokasi, makanan dan kesehatan", hasil: "Mengurus keperluan harian sendiri tanpa penerjemah" },
      { level: "B1", fokus: "Sistem kata kerja polipersonal, aspek dan preverb, kalimat majemuk, ragam formal", hasil: "Berdiskusi, menulis surat resmi, memahami berita sederhana" },
      { level: "B2", fokus: "Nuansa preverb, ragam sastra dan media, idiom, register akademik", hasil: "Mengikuti kuliah, membaca teks panjang, berargumen dengan lancar" },
    ],
    faq: [
      {
        question: "Apakah bahasa Georgia sulit untuk orang Indonesia?",
        answer:
          "Bahasa Georgia termasuk sulit, terutama karena gugus konsonan panjang dan konsonan ejektif yang tidak ada dalam bahasa Indonesia. Namun ada dua hal yang justru meringankan: tidak ada gender gramatikal dan ejaannya konsisten satu huruf satu bunyi. Bagian tersulit bukan membaca, melainkan sistem kata kerjanya yang muncul di level A2 ke atas.",
      },
      {
        question: "Berapa lama belajar bahasa Georgia sampai bisa percakapan sehari-hari?",
        answer:
          "Dengan 2 sesi privat per minggu ditambah 3–4 jam latihan mandiri, level A2 — cukup untuk mengurus keperluan harian sendiri — umumnya tercapai dalam 10–14 bulan. Aksaranya sendiri jauh lebih cepat: kebanyakan siswa sudah bisa membaca tulisan Georgia dalam 2–3 minggu.",
      },
      {
        question: "Apakah perlu belajar bahasa Georgia kalau kuliah kedokteran di Georgia?",
        answer:
          "Program kedokteran untuk mahasiswa internasional di Georgia memang berbahasa Inggris. Tapi kehidupan di luar kampus, urusan izin tinggal, apotek, dan terutama tahap klinis di rumah sakit berjalan dalam bahasa Georgia. Kemampuan setingkat A2 membuat urusan sehari-hari jauh lebih ringan dan mengurangi ketergantungan pada penerjemah.",
      },
      {
        question: "Apakah bahasa Georgia sama dengan bahasa Rusia?",
        answer:
          "Berbeda sama sekali. Bahasa Georgia berasal dari rumpun Kartveli yang tidak punya hubungan kekerabatan dengan bahasa Rusia, dan memakai aksaranya sendiri, bukan Kiril. Generasi tua di Georgia banyak yang menguasai bahasa Rusia karena sejarah, tetapi generasi mudanya cenderung memilih bahasa Inggris sebagai bahasa kedua.",
      },
      {
        question: "Aksara Georgia yang dipelajari yang mana?",
        answer:
          "Yang dipakai sehari-hari dan diajarkan di kelas adalah Mkhedruli, terdiri dari 33 huruf tanpa pembedaan huruf besar dan kecil. Dua aksara Georgia lainnya, Asomtavruli dan Nuskhuri, hanya muncul di naskah gereja dan teks bersejarah, jadi tidak dipelajari kecuali kamu memang menekuni bidang itu.",
      },
    ],
  },

  // ==========================================================================
  // SWAHILI (Kiswahili)
  // ==========================================================================
  swahili: {
    urlSlug: "swahili",
    kenapa: [
      "Bahasa Swahili adalah bahasa Afrika dengan penutur terbanyak, dipakai lebih dari 200 juta orang di Tanzania, Kenya, Uganda, Rwanda, Burundi, dan sebagian Republik Demokratik Kongo. Statusnya bahasa resmi Uni Afrika dan Komunitas Afrika Timur, dan menjadi bahasa penghubung antar suku yang bahasa ibunya berbeda-beda.",
      "Untuk orang Indonesia, alasan yang paling sering muncul adalah kerja dan misi kemanusiaan. Afrika Timur adalah wilayah dengan kehadiran perusahaan konstruksi, energi, dan perdagangan Indonesia yang terus bertambah, dan banyak lembaga kemanusiaan Indonesia menjalankan program di Somalia, Kenya, dan Tanzania. Di lapangan, bahasa Inggris hanya menjangkau sebagian orang; Swahili menjangkau hampir semuanya.",
      "Alasan lain yang lebih ringan tapi nyata: safari dan pendakian Kilimanjaro. Pemandu, porter, dan penduduk desa di jalur pendakian berbicara Swahili sehari-hari. Bahkan kemampuan setingkat A1 mengubah hubungan dengan tim pendakian dari sekadar transaksi menjadi percakapan.",
    ],
    kesulitan: {
      ringkas: "Relatif mudah — pelafalan nyaris seperti bahasa Indonesia",
      skor: 2,
      mudah: [
        "Aksara Latin, tanpa huruf tambahan dan tanpa tanda diakritik. Tidak ada aksara baru yang perlu dihafal.",
        "Pelafalannya sangat dekat dengan bahasa Indonesia: vokal a-i-u-e-o dibaca sama, dan setiap huruf dibaca konsisten.",
        "Tidak ada nada, berbeda dari bahasa Mandarin, Thailand, atau Vietnam.",
        "Tekanan kata hampir selalu jatuh di suku kata kedua dari belakang — satu aturan, tanpa pengecualian yang perlu dihafal.",
        "Tidak ada gender gramatikal dan kata kerjanya tidak berubah menurut jenis kelamin pelaku.",
      ],
      sulit: [
        "Sistem kelas kata benda (ngeli) dengan 18 kelas. Setiap kelas menuntut awalan berbeda pada kata sifat, kata kerja, dan kata tunjuk yang mengikutinya — ini beban hafalan terbesar dan pengganti konsep gender.",
        "Kosakatanya asing. Sebagai bahasa Bantu, akar katanya tidak mirip apa pun yang dikenal penutur Indonesia, kecuali serapan Arab yang jumlahnya cukup banyak.",
        "Kata kerja dibangun dari rangkaian imbuhan yang dipadatkan jadi satu kata, sehingga satu kata Swahili sering setara satu kalimat pendek bahasa Indonesia.",
        "Ragam Swahili di Kenya, Tanzania, dan Kongo cukup berbeda dalam kosakata sehari-hari.",
      ],
    },
    estimasi: {
      asumsi:
        "Asumsi: 2 sesi privat 60 menit per minggu bersama pengajar, ditambah 3 jam latihan mandiri per minggu, mulai dari nol.",
      tahap: [
        {
          target: "Pelafalan & sapaan",
          durasi: "1–2 minggu",
          bisaApa: "Membaca teks Swahili dengan pelafalan benar dan bertukar sapaan sesuai waktu dan tingkat kesopanan.",
        },
        {
          target: "A1 — Basic",
          durasi: "3–4 bulan",
          bisaApa: "Memperkenalkan diri, menawar harga di pasar, menyebut angka, waktu, dan arah, memesan makanan.",
        },
        {
          target: "A2 — Upper Basic",
          durasi: "7–10 bulan",
          bisaApa: "Bercerita tentang kejadian lampau, mengurus keperluan sehari-hari, dan berkoordinasi dengan tim lokal di lapangan.",
        },
        {
          target: "B1 — Intermediate",
          durasi: "14–18 bulan",
          bisaApa: "Mengikuti rapat kerja, memahami siaran radio, dan menjelaskan hal teknis dengan penjelasan tambahan seperlunya.",
        },
      ],
    },
    silabus: [
      { level: "A1", fokus: "Pelafalan, salam bertingkat, kelas ngeli M-/WA- dan KI-/VI-, angka, kata kerja kala kini", hasil: "Percakapan perkenalan, transaksi pasar, menyebut waktu" },
      { level: "A2", fokus: "Kelas ngeli lanjutan, kala lampau dan depan, kepemilikan, arah dan lokasi", hasil: "Bercerita kejadian lampau, mengurus keperluan harian" },
      { level: "B1", fokus: "Bentuk pasif dan kausatif, kalimat bersyarat, ragam formal, kosakata kerja", hasil: "Rapat kerja, memahami berita, menulis surat resmi" },
      { level: "B2", fokus: "Peribahasa (methali), ragam sastra, perbedaan ragam Kenya–Tanzania, register akademik", hasil: "Berargumen lancar, membaca teks panjang, memahami humor dan idiom" },
    ],
    faq: [
      {
        question: "Apakah bahasa Swahili sulit untuk orang Indonesia?",
        answer:
          "Bahasa Swahili termasuk salah satu bahasa yang paling ramah bagi penutur Indonesia. Aksaranya Latin, tidak ada nada, dan pelafalan vokalnya nyaris sama dengan bahasa Indonesia. Bagian yang benar-benar menantang hanya satu: sistem kelas kata benda dengan 18 kelas, yang menentukan bentuk kata sifat dan kata kerja di sekitarnya.",
      },
      {
        question: "Berapa lama belajar bahasa Swahili sampai bisa percakapan sehari-hari?",
        answer:
          "Dengan 2 sesi privat per minggu ditambah 3 jam latihan mandiri, level A1 umumnya tercapai dalam 3–4 bulan dan A2 dalam 7–10 bulan. Ini lebih cepat daripada kebanyakan bahasa lain karena tidak ada aksara baru dan tidak ada nada yang perlu dikuasai lebih dulu.",
      },
      {
        question: "Bahasa Swahili dipakai di negara mana saja?",
        answer:
          "Bahasa Swahili menjadi bahasa resmi di Tanzania, Kenya, Uganda, dan Rwanda, serta dipakai luas di Burundi dan bagian timur Republik Demokratik Kongo. Statusnya juga bahasa resmi Uni Afrika. Total penuturnya melebihi 200 juta orang, sebagian besar sebagai bahasa kedua.",
      },
      {
        question: "Apa itu ngeli dalam bahasa Swahili?",
        answer:
          "Ngeli adalah sistem kelas kata benda, ciri khas bahasa-bahasa Bantu. Setiap kata benda masuk salah satu dari 18 kelas, dan kelas itu menentukan awalan yang harus dipakai kata sifat, kata kerja, dan kata tunjuk yang menyertainya. Fungsinya mirip gender dalam bahasa Eropa, hanya saja kelasnya jauh lebih banyak dan lebih tertebak dari bentuk katanya.",
      },
      {
        question: "Apakah Swahili di Kenya dan Tanzania berbeda?",
        answer:
          "Tata bahasanya sama dan saling dipahami sepenuhnya. Perbedaannya ada di kosakata sehari-hari dan aksen. Swahili Tanzania, khususnya ragam Zanzibar, dianggap paling baku dan itu yang menjadi acuan pengajaran, sementara ragam Kenya menyerap lebih banyak kata Inggris dalam percakapan santai.",
      },
    ],
  },

  // ==========================================================================
  // KHMER (ខ្មែរ)
  // ==========================================================================
  khmer: {
    urlSlug: "khmer",
    kenapa: [
      "Bahasa Khmer adalah bahasa resmi Kamboja dengan sekitar 17 juta penutur. Sebagai sesama anggota ASEAN yang bertetangga dekat, hubungan dagang dan investasi Indonesia dengan Kamboja terus tumbuh, terutama di sektor manufaktur, garmen, pertanian, dan properti di Phnom Penh serta Sihanoukville.",
      "Bahasa Khmer juga punya kaitan sejarah yang jarang disadari orang Indonesia. Aksara Khmer dan aksara Jawa sama-sama turunan aksara Pallawa dari India Selatan, dan keduanya menyerap banyak kosakata Sanskerta dan Pali. Kata seperti 'guru', 'bahasa', 'kerja', dan 'dunia' punya padanan yang terdengar akrab. Bagi yang pernah belajar aksara Jawa atau Bali, logika aksara Khmer terasa familiar.",
      "Alasan praktis lainnya adalah kerja sama pembangunan dan pariwisata. Angkor Wat menjadikan Siem Reap tujuan wisata utama kawasan, dan di luar area wisata, bahasa Inggris cepat menghilang. Untuk pekerja lapangan, peneliti, maupun staf lembaga kemanusiaan, kemampuan berbahasa Khmer menentukan seberapa dalam mereka bisa bekerja dengan masyarakat setempat.",
    ],
    kesulitan: {
      ringkas: "Menengah — aksaranya berat, tata bahasanya justru ringan",
      skor: 3,
      mudah: [
        "Kata kerja tidak berubah bentuk sama sekali. Tidak ada konjugasi menurut pelaku maupun kala — kala ditandai kata keterangan, persis seperti 'sudah' dan 'akan' dalam bahasa Indonesia.",
        "Tidak ada nada, tidak seperti bahasa Thailand, Vietnam, atau Mandarin. Ini keunggulan besar dibanding tetangganya.",
        "Tidak ada gender gramatikal, tidak ada artikel, dan tidak ada bentuk jamak wajib.",
        "Urutan kata subjek-predikat-objek sama dengan bahasa Indonesia, dan kata sifat mengikuti kata benda — juga sama.",
        "Banyak kosakata serapan Sanskerta dan Pali yang bunyinya mirip bahasa Indonesia.",
      ],
      sulit: [
        "Aksaranya berat: 33 konsonan yang masing-masing punya bentuk kaki untuk ditumpuk, ditambah puluhan tanda vokal yang bisa muncul di atas, bawah, kiri, atau kanan konsonan.",
        "Setiap konsonan punya dua seri, dan seri itu mengubah cara tanda vokal yang sama dibaca. Satu simbol vokal bisa berbunyi berbeda tergantung konsonan yang mengikutinya.",
        "Kalimat ditulis tanpa spasi antar kata, sehingga memenggal kata jadi keterampilan tersendiri yang perlu dilatih.",
        "Ada beberapa vokal yang tidak dibedakan dalam bahasa Indonesia sehingga sulit didengar bedanya pada tahap awal.",
        "Sistem sapaan berjenjang menurut usia dan status yang perlu dipilih dengan tepat agar tidak terdengar kasar.",
      ],
    },
    estimasi: {
      asumsi:
        "Asumsi: 2 sesi privat 60 menit per minggu bersama pengajar, ditambah 3–4 jam latihan mandiri per minggu, mulai dari nol.",
      tahap: [
        {
          target: "Percakapan dasar (tanpa aksara)",
          durasi: "1–2 bulan",
          bisaApa: "Menyapa, memperkenalkan diri, dan menawar harga menggunakan transliterasi Latin.",
        },
        {
          target: "Membaca aksara Khmer",
          durasi: "3–5 bulan",
          bisaApa: "Membaca papan nama, menu, dan teks pendek dengan bantuan kamus.",
        },
        {
          target: "A1 — Basic",
          durasi: "4–6 bulan",
          bisaApa: "Percakapan sehari-hari yang sudah bisa ditebak: pasar, transportasi, memesan makanan, menyebut waktu.",
        },
        {
          target: "A2 — Upper Basic",
          durasi: "9–12 bulan",
          bisaApa: "Mengurus keperluan sendiri, bercerita kejadian lampau, dan berkoordinasi dengan rekan kerja setempat.",
        },
        {
          target: "B1 — Intermediate",
          durasi: "18–24 bulan",
          bisaApa: "Mengikuti rapat, memahami siaran berita, dan menjelaskan hal teknis dalam bahasa Khmer.",
        },
      ],
    },
    silabus: [
      { level: "A1", fokus: "Pelafalan, sapaan berjenjang, angka, konsonan seri pertama dan kedua, tanda vokal dasar", hasil: "Percakapan pasar dan perkenalan, mulai membaca kata sederhana" },
      { level: "A2", fokus: "Bentuk kaki konsonan, penanda kala, klasifikator, arah dan lokasi, keluarga dan pekerjaan", hasil: "Membaca teks pendek, bercerita kejadian lampau, mengurus keperluan harian" },
      { level: "B1", fokus: "Ragam formal dan sopan, kalimat majemuk, kosakata kerja dan administrasi, membaca tanpa spasi", hasil: "Rapat kerja, membaca dokumen, memahami berita" },
      { level: "B2", fokus: "Kosakata Sanskerta-Pali, ragam sastra dan media, idiom, ragam kerajaan", hasil: "Berargumen lancar, membaca teks panjang, memahami nuansa formal" },
    ],
    faq: [
      {
        question: "Apakah bahasa Khmer sulit untuk orang Indonesia?",
        answer:
          "Tata bahasa Khmer justru mudah bagi penutur Indonesia: tidak ada nada, tidak ada konjugasi kata kerja, dan urutan katanya sama dengan bahasa Indonesia. Yang berat adalah aksaranya — 33 konsonan dengan bentuk kaki bertumpuk dan tanda vokal yang bunyinya berubah menurut seri konsonan. Banyak siswa memulai percakapan lebih dulu, baru masuk ke aksara.",
      },
      {
        question: "Berapa lama belajar bahasa Khmer sampai bisa percakapan sehari-hari?",
        answer:
          "Dengan 2 sesi privat per minggu ditambah 3–4 jam latihan mandiri, percakapan dasar bisa dicapai dalam 1–2 bulan bila memakai transliterasi Latin. Level A1 penuh umumnya 4–6 bulan, dan A2 — cukup untuk mengurus keperluan sendiri — sekitar 9–12 bulan. Membaca aksaranya perlu tambahan 3–5 bulan.",
      },
      {
        question: "Apakah bahasa Khmer punya nada seperti bahasa Thailand?",
        answer:
          "Tidak. Bahasa Khmer bukan bahasa bernada, berbeda dari bahasa Thailand, Vietnam, Laos, dan Mandarin. Ini membuatnya jauh lebih ringan bagi penutur Indonesia pada tahap awal, karena satu kata tidak berubah arti hanya karena perbedaan tinggi rendah suara.",
      },
      {
        question: "Apakah aksara Khmer mirip aksara Thai?",
        answer:
          "Keduanya bersaudara — aksara Thai justru dikembangkan dari aksara Khmer pada abad ke-13, dan keduanya berakar pada aksara Pallawa dari India Selatan seperti aksara Jawa dan Bali. Bentuk hurufnya berbeda dan tidak bisa saling dibaca, tetapi logika penulisannya serupa: konsonan sebagai dasar, vokal sebagai tanda di sekelilingnya.",
      },
      {
        question: "Apakah perlu belajar aksara Khmer, atau cukup percakapan?",
        answer:
          "Tergantung tujuan. Untuk perjalanan singkat atau percakapan lapangan, transliterasi Latin sudah memadai dan jauh lebih cepat dikuasai. Untuk kerja jangka panjang, membaca dokumen, atau penelitian, aksara Khmer wajib — nyaris tidak ada teks resmi di Kamboja yang tersedia dalam huruf Latin.",
      },
    ],
  },
};

export function getLanguageDeep(urlSlug: string): LanguageDeep | null {
  return languageDeep[urlSlug] ?? null;
}
