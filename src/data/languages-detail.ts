// src/data/languages-detail.ts
// Konten landing page per bahasa untuk /kelas/bahasa-[lang]
// Keyed by URL slug (lowercase Indonesian name) — match existing blog CTA convention.

import { languages } from "./curriculum/languages";

// ============================================================================
// TYPES
// ============================================================================

export type WhyLearnPoint = {
  icon: string; // emoji
  title: string;
  description: string;
};

export type AudiencePersona = {
  emoji: string;
  persona: string;
  benefit: string;
};

export type CurriculumLevel = {
  level: string; // "A1", "A2", "B1", "B2"
  title: string;
  sessionCount: number;
  description: string;
  topics: string[];
};

export type PricingTier = {
  name: string;
  pricePerSession: number; // IDR per sesi
  sessionDuration: string; // e.g. "60 menit"
  classSize: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel?: string;
};

export type FAQ = {
  question: string;
  answer: string;
};

export type LanguageDetail = {
  /** URL slug, lowercase Indonesian name. Used in /kelas/bahasa-{urlSlug} */
  urlSlug: string;
  /** Cross-reference to `languages.ts` slug (e.g. "korean", "japanese") */
  languageSlug: string;

  // Hero
  tagline: string;
  heroDescription: string;

  // Sections
  whyLearn: WhyLearnPoint[];
  targetAudience: AudiencePersona[];
  curriculum: CurriculumLevel[];
  pricing: PricingTier[];
  faq: FAQ[];

  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
};

// ============================================================================
// SHARED PRICING
// Default tier structure — sama untuk semua bahasa di v1.
// Kalau nanti mau differential pricing per bahasa (misal Mandarin lebih mahal),
// tinggal override di entry per bahasa.
// ============================================================================

const defaultPricing: PricingTier[] = [
  {
    name: "Privat 1:1",
    pricePerSession: 100000,
    sessionDuration: "60 menit",
    classSize: "1 siswa",
    features: [
      "Jadwal fleksibel sesuai kesibukan",
      "Materi disesuaikan target (akademik / drama / kerja)",
      "Pengajar bersertifikat / native speaker",
      "Akses LMS Linguo & rekaman sesi",
    ],
    highlighted: true,
    ctaLabel: "Daftar Privat",
  },
  {
    name: "Semi Privat",
    pricePerSession: 75000,
    sessionDuration: "60 menit",
    classSize: "2 siswa",
    features: [
      "Belajar bareng teman / pasangan",
      "Tetap personal, lebih hemat",
      "Pengajar bersertifikat",
      "Akses LMS Linguo",
    ],
  },
  {
    name: "Reguler (Grup)",
    pricePerSession: 50000,
    sessionDuration: "60 menit",
    classSize: "8–15 siswa",
    features: [
      "Belajar bareng komunitas",
      "Jadwal fix mingguan",
      "Materi terstruktur per batch",
      "Cocok yang suka group dynamic",
    ],
  },
];

// ============================================================================
// LANGUAGE DETAILS — keyed by URL slug
// ============================================================================

export const languageDetails: Record<string, LanguageDetail> = {
  // ==========================================================================
  // KOREA
  // ==========================================================================
  korea: {
    urlSlug: "korea",
    languageSlug: "korean",
    tagline: "Dari Hangul sampai TOPIK — kuasai Bahasa Korea seperti penutur asli.",
    heroDescription:
      "Kursus Bahasa Korea online intensif untuk pemula sampai mahir. Kurikulum CEFR A1–B2, pengajar bersertifikat, jadwal fleksibel, materi disesuaikan target kamu — drama, K-pop, akademik, atau karier.",

    whyLearn: [
      {
        icon: "🎬",
        title: "Hallyu (Korean Wave)",
        description:
          "Nonton K-drama tanpa subtitle, nikmati lirik K-pop secara langsung, ikuti V-Live idolmu. Bahasa Korea bikin pengalaman fandom jauh lebih hidup dan personal.",
      },
      {
        icon: "🎓",
        title: "Beasiswa & Studi di Korea",
        description:
          "GKS (Global Korea Scholarship) full-funded ke Seoul National, Yonsei, Korea University. Universitas top Korea wajibkan TOPIK level 3+ untuk program internasional.",
      },
      {
        icon: "💼",
        title: "Karier di Perusahaan Korea",
        description:
          "Samsung, LG, Hyundai, Kakao, Coupang — perusahaan Korea aktif rekrut talenta bilingual di Indonesia. Premium 30–50% untuk kandidat fasih Bahasa Korea.",
      },
    ],

    targetAudience: [
      {
        emoji: "🎵",
        persona: "K-pop & K-drama Enthusiast",
        benefit: "Mau ngerti lirik favorit, baca tweet idol, nonton tanpa nunggu sub Indonesia.",
      },
      {
        emoji: "🎓",
        persona: "Calon Mahasiswa Korea",
        benefit: "Persiapan TOPIK & dokumen aplikasi GKS, KGSP, atau program exchange.",
      },
      {
        emoji: "💼",
        persona: "Profesional di Perusahaan Korea",
        benefit: "Komunikasi dengan tim HQ Seoul, dokumen bisnis, business etiquette.",
      },
      {
        emoji: "✈️",
        persona: "Traveler ke Korea",
        benefit: "Survival Korean — pesan makanan, naik subway, ngobrol dengan orang lokal.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula Total",
        sessionCount: 48,
        description:
          "Mulai dari nol. Hangul (한글), pelafalan, kosakata dasar, pola kalimat sederhana untuk situasi sehari-hari.",
        topics: [
          "Hangul: 14 konsonan, 10 vokal, dan batchim",
          "Sapaan formal vs informal (안녕하세요 vs 안녕)",
          "Partikel dasar 은/는, 이/가, 을/를",
          "Angka Sino-Korea & Korea Asli",
          "Kalimat sehari-hari: makanan, transportasi, waktu",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar",
        sessionCount: 64,
        description: "Bisa percakapan sehari-hari dengan struktur dasar. Setara TOPIK 1 (level 1–2).",
        topics: [
          "Konjugasi kata kerja: 해요체 vs 합니다체",
          "Bentuk lampau (-았/었어요) dan masa depan (-ㄹ 거예요)",
          "Penghubung: 그리고, 그래서, 하지만, -고, -아서",
          "Honorific dasar (-시-, 께서, 드리다)",
          "Topik: keluarga, hobi, perjalanan, pekerjaan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah",
        sessionCount: 80,
        description:
          "Diskusi topik kompleks, baca artikel ringan, nonton drama dengan subtitle Korea. Persiapan TOPIK 2 (level 3–4).",
        topics: [
          "Tata bahasa kondisional: -면, -았/었더라면, -ㄴ다면",
          "Pasif & kausatif: -이/히/리/기-, -게 하다",
          "Idiom & ekspresi K-drama populer",
          "Membaca artikel berita Naver level menengah",
          "Diskusi: budaya, sosial, pendidikan",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas",
        sessionCount: 112,
        description:
          "Mahir untuk konteks akademik, profesional, dan literatur. Persiapan TOPIK 2 level 5–6.",
        topics: [
          "Tata bahasa formal akademik & laporan",
          "Hanja (漢字) dasar untuk istilah teknis & berita",
          "Sastra Korea modern: Han Kang, Kim Young-ha",
          "Business Korean: presentasi, email formal, meeting",
          "Persiapan TOPIK 쓰기 (writing) & 읽기 (reading)",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Hangul (aksara Korea) susah ga sih buat dipelajari?",
        answer:
          "Justru sebaliknya — Hangul didesain Raja Sejong tahun 1443 supaya gampang dipelajari rakyat awam. Mayoritas siswa Linguo bisa baca Hangul dalam 2–3 sesi pertama. Sisanya tinggal nambah kosakata dan tata bahasa.",
      },
      {
        question: "Berapa lama sampai bisa nonton K-drama tanpa subtitle?",
        answer:
          "Untuk dialog drama umum (rom-com, slice-of-life), rata-rata siswa Linguo sampai di level B1 dalam 8–12 bulan rutin (2–3x seminggu). Drama dengan tema spesifik seperti sageuk, hukum, atau medis butuh sampai B2.",
      },
      {
        question: "Apa itu TOPIK dan apakah Linguo nyiapin TOPIK prep?",
        answer:
          "TOPIK (Test of Proficiency in Korean) adalah ujian resmi pemerintah Korea, syarat untuk studi & kerja di sana. Linguo punya track TOPIK 1 (level 1–2) dan TOPIK 2 (level 3–6) dengan latihan soal mock test setiap minggu menjelang ujian.",
      },
      {
        question: "Pengajarnya native Korea atau orang Indonesia?",
        answer:
          "Mix. Untuk pemula (A1–A2) kami biasanya pasangkan dengan pengajar Indonesia yang fasih Korea — supaya bisa jelaskan grammar pakai Bahasa Indonesia. Mulai B1 ke atas, opsi pengajar native Korea tersedia untuk imersi penuh.",
      },
      {
        question: "Bisa belajar Bahasa Korea pakai lirik K-pop?",
        answer:
          "Bisa banget. Setiap pengajar Linguo punya kebebasan menyesuaikan materi. Banyak siswa request lirik BTS, NewJeans, atau IU sebagai materi reading & vocabulary — efektif karena kontennya familiar dan emosional.",
      },
    ],

    metaTitle: "Kursus Bahasa Korea Online | Linguo.id — A1 sampai TOPIK",
    metaDescription:
      "Belajar Bahasa Korea online bersama pengajar bersertifikat. Kelas privat, semi privat & grup. Hangul, K-drama, persiapan TOPIK. Semi privat mulai Rp 80.000/sesi.",
    metaKeywords: [
      "kursus bahasa korea",
      "les bahasa korea online",
      "belajar bahasa korea",
      "TOPIK prep Indonesia",
      "kursus korea jakarta",
      "kursus korea online",
      "belajar hangul",
      "bahasa korea pemula",
      "les korea murah",
      "kursus korea privat",
    ],
  },

  // ==========================================================================
  // JEPANG
  // ==========================================================================
  jepang: {
    urlSlug: "jepang",
    languageSlug: "japanese",
    tagline: "Dari Hiragana sampai Kanji — siapkan diri untuk JLPT, kerja, atau studi di Jepang.",
    heroDescription:
      "Kursus Bahasa Jepang online dengan kurikulum CEFR A1–B2 dan persiapan JLPT N5–N1. Pengajar bersertifikat, jadwal fleksibel, materi yang relevan untuk karier, akademik, atau hobi anime & manga.",

    whyLearn: [
      {
        icon: "💼",
        title: "Karier di Jepang",
        description:
          "Tokutei Ginou (SSW) untuk industri manufaktur, hospitality, perawat (EPA), pertanian. Visa kerja Jepang sedang dibuka lebar — minimal JLPT N4 untuk masuk.",
      },
      {
        icon: "🎌",
        title: "Anime, Manga, Dorama",
        description:
          "Nikmati anime tanpa nunggu sub, baca manga raw lebih cepat dari rilis Indonesia, ikut event seiyuu, ngobrol di komunitas Jepang. Pengalaman fandom yang nggak ternilai.",
      },
      {
        icon: "🎓",
        title: "Beasiswa MEXT / Monbukagakusho",
        description:
          "Beasiswa pemerintah Jepang full-funded ke universitas top seperti Tokyo, Kyoto, Osaka. Wajib lulus JLPT N3+ untuk program research student & gakubu (S1).",
      },
    ],

    targetAudience: [
      {
        emoji: "🛂",
        persona: "Calon Pekerja Tokutei Ginou / EPA",
        benefit: "Persiapan JLPT N4 dan JFT-Basic, materi vocational sesuai industri target.",
      },
      {
        emoji: "🎨",
        persona: "Otaku & Penggemar Anime",
        benefit: "Belajar dari materi yang kamu suka — anime klasik, manga shounen, lagu OST.",
      },
      {
        emoji: "🎓",
        persona: "Pelajar Persiapan JLPT",
        benefit: "Track khusus N5 → N1 dengan latihan soal mock test setiap level.",
      },
      {
        emoji: "💻",
        persona: "IT Engineer ke Jepang",
        benefit: "Business Japanese, ngobrol meeting, dokumen teknis, etiket kerja Jepang.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula (Setara JLPT N5)",
        sessionCount: 48,
        description:
          "Mulai dari nol. Hiragana, Katakana, ~100 Kanji dasar, pola kalimat sederhana, percakapan harian.",
        topics: [
          "Hiragana (46) & Katakana (46) — baca tulis fasih",
          "Pola kalimat dasar: です/ます, は/が partikel",
          "Angka, waktu, tanggal, harga",
          "~100 Kanji JLPT N5 (人, 日, 本, 学, 生, dll)",
          "Percakapan: salam, perkenalan, belanja, makan",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar (Setara JLPT N4)",
        sessionCount: 64,
        description: "Sehari-hari lancar dengan struktur dasar lengkap. Setara JLPT N4 — syarat Tokutei Ginou.",
        topics: [
          "Konjugasi verba: te-form, ta-form, nai-form, potential",
          "~300 Kanji JLPT N4 kumulatif",
          "Tata bahasa pembanding: より, ほど, 一番",
          "Bentuk volisional & permintaan: ましょう, てください",
          "Topik: pekerjaan, hobi, perjalanan, pengalaman",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah (Setara JLPT N3)",
        sessionCount: 80,
        description:
          "Bisa diskusi topik kompleks, baca artikel ringan, nonton dorama dengan subtitle Jepang.",
        topics: [
          "~650 Kanji JLPT N3 kumulatif",
          "Keigo (敬語) dasar: sonkeigo, kenjougo, teineigo",
          "Tata bahasa kondisional: ば, たら, なら, と",
          "Pasif (受身), kausatif (使役), kausatif-pasif",
          "Reading: artikel berita NHK Easy, manga remaja",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas (Setara JLPT N2)",
        sessionCount: 112,
        description:
          "Mahir untuk akademik, kerja, sastra. Persiapan JLPT N2 — syarat banyak pekerjaan profesional di Jepang.",
        topics: [
          "~1000 Kanji JLPT N2 kumulatif",
          "Keigo lanjutan untuk lingkungan kerja Jepang",
          "Business Japanese: meeting, email, presentasi",
          "Sastra: Murakami, Kawabata, Yoshimoto",
          "Persiapan JLPT N2 reading & listening intensif",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Hiragana, Katakana, Kanji — bedanya apa? Belajar mana dulu?",
        answer:
          "Hiragana untuk kata asli Jepang, Katakana untuk kata serapan asing, Kanji untuk akar makna. Linguo selalu mulai dari Hiragana → Katakana (~3–4 sesi pertama), baru pelan-pelan masuk Kanji. Nggak perlu langsung hafal 2000 Kanji.",
      },
      {
        question: "Berapa lama sampai lulus JLPT N5?",
        answer:
          "Rata-rata siswa Linguo lulus N5 dalam 4–6 bulan dengan ritme 2–3 sesi seminggu plus self-study. JLPT N5 syarat dasarnya 100 Kanji + 800 kosakata + grammar dasar — semua dicover di kurikulum A1.",
      },
      {
        question: "Bisa langsung kerja di Jepang setelah JLPT N3?",
        answer:
          "Bisa untuk industri Tokutei Ginou (manufaktur, hospitality, pertanian) — syarat minimum N4. Untuk pekerjaan kantoran (office, IT, finance) di Jepang, mayoritas perusahaan minta minimum N2.",
      },
      {
        question: "Pengajarnya native Jepang atau orang Indonesia?",
        answer:
          "Mix. Pemula (A1–A2) sebaiknya dengan pengajar Indonesia yang fasih Jepang biar grammar bisa dijelaskan jelas. Mulai B1, banyak siswa pilih pengajar native untuk imersi pelafalan dan keigo.",
      },
      {
        question: "Belajar Kanji susah banget. Ada metode khusus?",
        answer:
          "Linguo pakai pendekatan radical-first — kamu pelajari komponen kecil (radikal) yang membentuk Kanji, jadi 2000 Kanji jadi gabungan dari ~200 radikal aja. Plus mnemonics & spaced repetition di LMS.",
      },
    ],

    metaTitle: "Kursus Bahasa Jepang Online | Linguo.id — JLPT N5 sampai N1",
    metaDescription:
      "Belajar Bahasa Jepang online dari nol. Hiragana, Katakana, Kanji, persiapan JLPT N5–N1, business Japanese. Pengajar bersertifikat, semi privat mulai Rp 80.000/sesi.",
    metaKeywords: [
      "kursus bahasa jepang",
      "les bahasa jepang online",
      "belajar bahasa jepang",
      "JLPT prep Indonesia",
      "kursus jepang jakarta",
      "kursus jepang online",
      "belajar hiragana katakana",
      "kursus N5 N4 N3",
      "tokutei ginou",
      "MEXT Monbukagakusho",
    ],
  },

  // ==========================================================================
  // MANDARIN
  // ==========================================================================
  mandarin: {
    urlSlug: "mandarin",
    languageSlug: "mandarin",
    tagline: "Bahasa #1 dunia — kuasai Pinyin, Hanzi, dan HSK untuk karier global.",
    heroDescription:
      "Kursus Bahasa Mandarin online dengan kurikulum CEFR A1–B2 dan persiapan HSK 1–6. Pengajar bersertifikat, materi yang relevan untuk bisnis, studi, atau ekspansi karier ke perusahaan Tiongkok.",

    whyLearn: [
      {
        icon: "🌏",
        title: "Bahasa #1 di Dunia",
        description:
          "1,1 miliar penutur, bahasa kerja PBB, dominan di bisnis global. Mandarin makin dicari di mana-mana — bukan cuma di Tiongkok, tapi di Singapura, Malaysia, Taiwan, dan diaspora Tionghoa global.",
      },
      {
        icon: "💼",
        title: "Indonesia–China Trade #1",
        description:
          "Tiongkok partner dagang #1 Indonesia. Huawei, Xiaomi, Alibaba, BYD, Tencent buka kantor besar di Jakarta — premium gaji 40–60% untuk kandidat fasih Mandarin + Inggris.",
      },
      {
        icon: "🎓",
        title: "Beasiswa CSC ke Tiongkok",
        description:
          "Chinese Government Scholarship full-funded ke Tsinghua, Peking University, Fudan, Shanghai Jiao Tong. Syarat HSK 4–5 untuk mayoritas program berbahasa Mandarin.",
      },
    ],

    targetAudience: [
      {
        emoji: "💼",
        persona: "Profesional di Perusahaan Tiongkok",
        benefit: "Komunikasi dengan HQ Beijing/Shenzhen, dokumen kontrak, business meeting.",
      },
      {
        emoji: "📦",
        persona: "Pebisnis Trade & Import-Export",
        benefit: "Negosiasi langsung dengan supplier Yiwu, Guangzhou, Shenzhen — potong margin agen.",
      },
      {
        emoji: "🎓",
        persona: "Pelajar HSK 3–6",
        benefit: "Latihan soal mock test, vocabulary booster, practice writing untuk HSK 高级.",
      },
      {
        emoji: "🏛️",
        persona: "Investor & Trader Saham China",
        benefit: "Baca laporan keuangan dalam Hanzi, ikuti berita Caixin & Sina Finance langsung.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula (Setara HSK 1–2)",
        sessionCount: 48,
        description: "Pinyin, 4 nada, ~150 Hanzi dasar, pola kalimat sederhana, percakapan harian.",
        topics: [
          "Pinyin lengkap & 4 nada (mā má mǎ mà)",
          "~150 Hanzi HSK 1–2 (你, 好, 我, 是, dll)",
          "Pola kalimat: 是, 有, 在, 的",
          "Angka, waktu, tanggal, mata uang Yuan",
          "Percakapan: salam, perkenalan, belanja, ojek online",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar (Setara HSK 3)",
        sessionCount: 64,
        description: "Sehari-hari lancar, ~600 Hanzi kumulatif. Setara HSK 3 — syarat banyak universitas China.",
        topics: [
          "~600 Hanzi HSK 3 kumulatif",
          "Pengukur (量词): 个, 只, 张, 本, 件",
          "Pelengkap arah & hasil: 来/去, 完, 到, 好",
          "Tata bahasa pembanding: 比, 没有, 跟…一样",
          "Topik: keluarga, perjalanan, makanan, pekerjaan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah (Setara HSK 4)",
        sessionCount: 80,
        description: "Diskusi topik kompleks, baca artikel ringan, nonton C-drama dengan subtitle Mandarin.",
        topics: [
          "~1200 Hanzi HSK 4 kumulatif",
          "Tata bahasa kondisional: 如果, 要是, 即使",
          "Konjungsi kompleks: 不但…而且, 虽然…但是",
          "Idiom (成语 chéngyǔ) populer 50–100",
          "Reading: artikel ringan, weibo trending",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas (Setara HSK 5)",
        sessionCount: 112,
        description:
          "Mahir untuk bisnis, akademik, dan media. Persiapan HSK 5 — syarat kerja profesional di perusahaan Tiongkok.",
        topics: [
          "~2500 Hanzi HSK 5 kumulatif",
          "Business Mandarin: meeting, kontrak, email formal",
          "Membaca berita Xinhua, Caixin, People's Daily",
          "Sastra modern: Mo Yan, Yu Hua, Liu Cixin",
          "Persiapan HSK 5 writing (作文) intensif",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "4 nada Mandarin susah banget. Bisa dipelajari ga sih?",
        answer:
          "Bisa, dan justru ini yang paling penting dikuasai di awal. Linguo punya metode tone-pair drill — latihan kombinasi nada 2 suku kata sampai otomatis. Mayoritas siswa stabil 4 nadanya dalam 2–3 bulan.",
      },
      {
        question: "Hanzi tradisional vs simplified — belajar yang mana?",
        answer:
          "Linguo pakai simplified (汉字) sebagai default — ini standar di Tiongkok daratan, Singapura, dan HSK. Tradisional (漢字) opsional, biasanya kami bahas mulai B1 untuk siswa yang fokus Taiwan, Hong Kong, atau sastra klasik.",
      },
      {
        question: "Berapa Hanzi minimum supaya bisa baca koran Tiongkok?",
        answer:
          "Untuk koran umum kayak Sina atau People's Daily, minimum ~3000 Hanzi. Untuk topik teknis (finance, hukum, medis) bisa sampai 5000+. Linguo cover ~2500 Hanzi sampai B2 — cukup buat 90% bacaan harian.",
      },
      {
        question: "HSK level berapa yang cukup buat kerja di perusahaan China?",
        answer:
          "Tergantung posisi. HSK 4 cukup untuk role customer-facing (sales, account manager). HSK 5 standar minimum untuk middle management. HSK 6 dibutuhkan untuk role yang banyak liaison dengan HQ China atau translator profesional.",
      },
      {
        question: "Pengajarnya native dari China atau orang Indonesia?",
        answer:
          "Mix. Pemula (A1–A2) biasanya dengan pengajar Indonesia keturunan Tionghoa atau yang fasih Mandarin — supaya grammar bisa dijelaskan dengan Bahasa Indonesia. B1 ke atas, opsi pengajar native dari China atau Taiwan tersedia.",
      },
    ],

    metaTitle: "Kursus Bahasa Mandarin Online | Linguo.id — HSK 1 sampai HSK 6",
    metaDescription:
      "Belajar Bahasa Mandarin online dari Pinyin sampai mahir. Persiapan HSK 1–6, business Mandarin, Hanzi simplified. Pengajar bersertifikat, semi privat mulai Rp 80.000/sesi.",
    metaKeywords: [
      "kursus bahasa mandarin",
      "les bahasa mandarin online",
      "belajar bahasa mandarin",
      "HSK prep Indonesia",
      "kursus mandarin jakarta",
      "kursus mandarin online",
      "belajar pinyin hanzi",
      "kursus HSK 4 HSK 5",
      "business mandarin",
      "beasiswa CSC China",
    ],
  },

  // ==========================================================================
  // INGGRIS
  // ==========================================================================
  inggris: {
    urlSlug: "inggris",
    languageSlug: "english",
    tagline: "Dari A1 sampai IELTS 7.0 — Bahasa Inggris yang benar-benar bisa dipakai.",
    heroDescription:
      "Kursus Bahasa Inggris online untuk semua level. Conversation, IELTS, TOEFL, business English. Pengajar bersertifikat (TESOL/CELTA), kurikulum CEFR A1–B2, jadwal fleksibel sesuai kesibukan kamu.",

    whyLearn: [
      {
        icon: "🌐",
        title: "Lingua Franca Dunia",
        description:
          "Inggris bahasa #1 di internet, sains, bisnis global, aviation, IT. Hampir semua peluang karier internasional, beasiswa, dan platform digital butuh Bahasa Inggris di atas rata-rata.",
      },
      {
        icon: "🎓",
        title: "IELTS / TOEFL untuk Studi Luar",
        description:
          "Beasiswa LPDP, Chevening, Australia Awards, Fulbright, DAAD — semua butuh skor IELTS 6.5+ atau TOEFL iBT 80+. Track khusus IELTS Academic & TOEFL ITP/iBT tersedia.",
      },
      {
        icon: "💻",
        title: "Remote Work USD Income",
        description:
          "Perusahaan global rekrut talenta Indonesia untuk role remote dengan gaji USD. Syarat utamanya: Bahasa Inggris fluent, terutama writing dan async meeting communication.",
      },
    ],

    targetAudience: [
      {
        emoji: "💼",
        persona: "Profesional Multinational Company",
        benefit: "Meeting dengan klien internasional, presentasi, email korporat, pitching ke C-level.",
      },
      {
        emoji: "🎓",
        persona: "Calon Mahasiswa Luar Negeri",
        benefit: "IELTS Academic / TOEFL prep, essay statement of purpose, interview beasiswa.",
      },
      {
        emoji: "💰",
        persona: "Pelamar LPDP & Beasiswa Pemerintah",
        benefit: "Persiapan IELTS 6.5+ minimum, mock test mingguan, simulasi wawancara LoA.",
      },
      {
        emoji: "🌐",
        persona: "Job Seeker Remote / Freelance",
        benefit: "Communication async, business writing, async meeting, negotiation untuk klien internasional.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Beginner",
        sessionCount: 48,
        description: "Untuk yang masih bingung tenses dasar. Mulai dari foundation — bukan dari hafalan grammar.",
        topics: [
          "Present, Past, Future Simple — tense paling penting",
          "Sentence structure: SVO, question, negative",
          "1000 kosakata dasar paling sering dipakai",
          "Survival English: ordering, directions, asking",
          "Pronunciation dasar: silent letters, stress",
        ],
      },
      {
        level: "A2",
        title: "A2 — Elementary",
        sessionCount: 64,
        description: "Sudah bisa percakapan sehari-hari dengan struktur dasar. Setara TOEIC 250–550.",
        topics: [
          "Perfect tenses (have done, had done)",
          "Modal verbs: can, could, must, should, might",
          "Phrasal verbs paling sering: pick up, look for, etc.",
          "Conditional tipe 1 (if + present, will)",
          "Topik: travel, work, hobbies, daily routine",
        ],
      },
      {
        level: "B1",
        title: "B1 — Intermediate",
        sessionCount: 80,
        description:
          "Bisa diskusi topik kompleks, baca artikel umum, nonton TV series Amerika tanpa subtitle. Setara IELTS 4.5–5.5.",
        topics: [
          "Conditional tipe 2 & 3 (would have done)",
          "Reported speech, passive voice",
          "Idioms & collocations level menengah",
          "Reading comprehension: artikel BBC, Guardian",
          "Writing: opinion essay, formal email",
        ],
      },
      {
        level: "B2",
        title: "B2 — Upper-Intermediate (IELTS 6.0+ Ready)",
        sessionCount: 112,
        description:
          "Mahir untuk akademik, profesional, dan media. Setara IELTS 6.0–7.0, TOEFL iBT 80–100.",
        topics: [
          "Advanced grammar: subjunctive, inversion, cleft sentences",
          "Academic writing: argumentative & analytical essay",
          "IELTS strategy: 4 skills (R/L/W/S) latihan intensif",
          "Business English: presentation, negotiation, report writing",
          "Critical thinking: debate, op-ed analysis",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Bedanya kelas Inggris reguler sama IELTS / TOEFL prep?",
        answer:
          "Reguler fokus 4 skills seimbang (speaking/listening/reading/writing) dengan topik umum. IELTS/TOEFL prep fokus strategi tes — time management, soal-soal khas, scoring criteria, mock test mingguan. Untuk persiapan beasiswa, ambil yang prep.",
      },
      {
        question: "Pengajarnya native speaker atau orang Indonesia?",
        answer:
          "Kedua opsi tersedia. Pengajar Indonesia bersertifikat TESOL/TEFL/CELTA bagus untuk yang masih A1–A2 — grammar dijelaskan dengan Bahasa Indonesia. Pengajar native (UK, US, Australia) cocok mulai B1 untuk imersi aksen dan pronunciation.",
      },
      {
        question: "Berapa lama dari A1 ke B2 (IELTS 6.5)?",
        answer:
          "Rata-rata siswa Linguo: 12–18 bulan dengan ritme 2–3 sesi seminggu plus self-study konsisten. Tergantung dedikasi — yang serius bisa 9 bulan, yang santai bisa 24 bulan. Kunci utamanya konsistensi, bukan jumlah jam.",
      },
      {
        question: "Cocoknya buat akademik atau buat kerja?",
        answer:
          "Tergantung target kamu. Saat enrollment, Linguo tanya dulu tujuannya — IELTS Academic, business English, conversational, atau campuran. Kurikulumnya disesuaikan biar materi yang dilatih relevan langsung sama kebutuhan kamu.",
      },
      {
        question: "Ada placement test buat tau level saya di mana?",
        answer:
          "Ada — gratis. Placement test Linguo online (~20 menit) menentukan level CEFR kamu (A1/A2/B1/B2) plus rekomendasi track yang cocok. Bisa langsung ambil di linguo.id/placement-test.",
      },
    ],

    metaTitle: "Kursus Bahasa Inggris Online | Linguo.id — IELTS, TOEFL, Conversation",
    metaDescription:
      "Kursus Bahasa Inggris online untuk semua level. Conversation, IELTS, TOEFL, business English. Pengajar bersertifikat TESOL/CELTA, semi privat mulai Rp 80.000/sesi.",
    metaKeywords: [
      "kursus bahasa inggris",
      "les bahasa inggris online",
      "belajar bahasa inggris",
      "IELTS prep Indonesia",
      "TOEFL prep Indonesia",
      "kursus inggris jakarta",
      "kursus inggris online",
      "business english",
      "kursus IELTS murah",
      "english conversation",
    ],
  },
  // ==========================================================================
  // JERMAN
  // ==========================================================================
  jerman: {
    urlSlug: "jerman",
    languageSlug: "german",
    tagline: "Dari A1 sampai Goethe-Zertifikat — gerbang studi & kerja di Jerman.",
    heroDescription:
      "Kursus Bahasa Jerman online dengan kurikulum CEFR A1–B2, selaras Goethe-Zertifikat & telc. Persiapan Ausbildung, studi kuliah gratis, au pair, FSJ, sampai karier perawat di Jerman.",

    whyLearn: [
      {
        icon: "🎓",
        title: "Kuliah Nyaris Gratis di Jerman",
        description:
          "Universitas negeri Jerman bebas biaya kuliah (cuma semester fee). Syarat masuk Studienkolleg & banyak program S1 adalah sertifikat B1–B2 — bahasa Jerman adalah tiketnya, bukan uang.",
      },
      {
        icon: "🧑‍⚕️",
        title: "Ausbildung & Karier Perawat",
        description:
          "Jerman kekurangan jutaan tenaga kerja. Program Ausbildung (sekolah sambil digaji) dan perekrutan perawat lewat Triple Win terbuka lebar untuk orang Indonesia — syarat minimum B1.",
      },
      {
        icon: "✈️",
        title: "Au Pair, FSJ, & Working Holiday",
        description:
          "Jalur berangkat paling cepat: au pair dan FSJ (kerja sosial sukarela) hanya butuh sertifikat A1–A2. Setahun di Jerman, bahasa terasah, jaringan terbentuk, lanjut Ausbildung atau kuliah.",
      },
    ],

    targetAudience: [
      {
        emoji: "🧑‍⚕️",
        persona: "Calon Peserta Ausbildung / Perawat",
        benefit: "Target B1–B2 + kosakata vokasional Pflege (keperawatan) dan gastronomi.",
      },
      {
        emoji: "🎓",
        persona: "Calon Mahasiswa Jerman",
        benefit: "Persiapan Goethe B1/B2, TestDaF, dan dokumen aplikasi Studienkolleg.",
      },
      {
        emoji: "👶",
        persona: "Calon Au Pair / FSJ",
        benefit: "Kejar Goethe A1–A2 cepat, fokus percakapan keluarga & kehidupan sehari-hari.",
      },
      {
        emoji: "💼",
        persona: "Profesional Perusahaan Jerman",
        benefit: "Siemens, Bosch, Mercedes, DHL — komunikasi tim, email formal, meeting.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula (Start Deutsch 1)",
        sessionCount: 48,
        description:
          "Mulai dari nol. Pelafalan, perkenalan, kalimat sederhana — setara Goethe-Zertifikat A1 (syarat visa au pair & pasangan).",
        topics: [
          "Alfabet, umlaut (ä ö ü) & ß, aturan baca",
          "Konjugasi verba dasar: sein, haben, verba reguler",
          "Artikel der/die/das & kata benda plural",
          "Angka, jam, tanggal, belanja, restoran",
          "W-Fragen & kalimat perkenalan diri",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar dengan struktur dasar. Setara Goethe-Zertifikat A2.",
        topics: [
          "Kasus Akkusativ & Dativ + preposisi",
          "Perfekt & Präteritum (sein/haben)",
          "Modalverben: können, müssen, dürfen, wollen",
          "Trennbare Verben (verba terpisah)",
          "Topik: pekerjaan, kesehatan, tempat tinggal",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah (Syarat Ausbildung)",
        sessionCount: 80,
        description:
          "Level kunci: syarat umum Ausbildung, perawat, dan kewarganegaraan. Persiapan Goethe/telc B1.",
        topics: [
          "Nebensätze: weil, dass, wenn, obwohl, relativ",
          "Konjunktiv II: höflichkeit & pengandaian",
          "Passiv (werden + Partizip II)",
          "Genitiv & deklinasi adjektiva lengkap",
          "Simulasi ujian B1: Lesen, Hören, Schreiben, Sprechen",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas (Studi & Kerja Profesional)",
        sessionCount: 112,
        description:
          "Mahir untuk kuliah & kerja profesional. Persiapan Goethe B2 / TestDaF / telc B2 — syarat mayoritas kampus & rumah sakit.",
        topics: [
          "Nominalisierung & bahasa akademik tulis",
          "Konnektoren lanjutan & struktur argumen",
          "Fachsprache: medis (Pflege) / teknik / bisnis",
          "Membaca artikel Spiegel, Zeit, Deutsche Welle",
          "TestDaF & DSH: strategi 4 keterampilan",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Der, die, das susah dihafal. Ada triknya?",
        answer:
          "Ada polanya — sekitar 80% gender kata benda bisa ditebak dari akhirannya (-ung selalu die, -chen selalu das, -er kebanyakan der). Linguo ajarkan pola ini sejak A1 supaya kamu nggak menghafal satu-satu.",
      },
      {
        question: "Berapa lama sampai B1 untuk syarat Ausbildung?",
        answer:
          "Rata-rata siswa Linguo mencapai B1 dalam 10–14 bulan dengan ritme 2–3 sesi seminggu. Kalau dikejar intensif (4–5 sesi seminggu + self-study), 7–9 bulan realistis. A1 dan A2 masing-masing biasanya 3–4 bulan.",
      },
      {
        question: "Goethe, telc, ÖSD — sertifikat mana yang harus diambil?",
        answer:
          "Ketiganya diakui pemerintah Jerman. Goethe-Zertifikat paling dikenal & tersedia di Jakarta (Goethe-Institut). telc sering dipakai jalur perawat/Ausbildung. ÖSD untuk Austria. Materi ujiannya mirip — kurikulum Linguo menyiapkan ketiganya.",
      },
      {
        question: "Bahasa Jerman mirip Inggris nggak? Lebih susah?",
        answer:
          "Serumpun (Germanik), jadi banyak kosakata mirip: Haus–house, trinken–drink. Yang baru adalah sistem kasus (Akkusativ/Dativ/Genitiv) dan gender. Kalau kamu sudah bisa Inggris, itu modal besar — reading Jerman terasa jauh lebih cepat.",
      },
      {
        question: "Pengajarnya orang Indonesia atau native Jerman?",
        answer:
          "Mix. Untuk A1–B1 kami sarankan pengajar Indonesia lulusan Jerman/Germanistik supaya grammar dijelaskan dalam Bahasa Indonesia. Untuk B2 dan persiapan TestDaF, tersedia opsi pengajar native atau yang lama tinggal di Jerman.",
      },
    ],

    metaTitle: "Kursus Bahasa Jerman Online | Linguo.id — A1 sampai Goethe B2",
    metaDescription:
      "Belajar Bahasa Jerman online dari nol. Persiapan Goethe-Zertifikat, Ausbildung, au pair, studi di Jerman. Pengajar bersertifikat, semi privat mulai Rp 80.000/sesi.",
    metaKeywords: [
      "kursus bahasa jerman",
      "les bahasa jerman online",
      "belajar bahasa jerman",
      "kursus jerman jakarta",
      "goethe zertifikat prep",
      "persiapan ausbildung",
      "kursus jerman a1",
      "les jerman murah",
      "kuliah di jerman",
      "au pair jerman",
    ],
  },

  // ==========================================================================
  // PRANCIS
  // ==========================================================================
  prancis: {
    urlSlug: "prancis",
    languageSlug: "french",
    tagline: "Dari bonjour sampai DELF B2 — bahasa 300 juta penutur di 5 benua.",
    heroDescription:
      "Kursus Bahasa Prancis online dengan kurikulum CEFR A1–B2 selaras DELF/DALF. Untuk studi ke Prancis lewat Campus France, karier diplomasi & hospitality, atau cinta pada budayanya.",

    whyLearn: [
      {
        icon: "🎓",
        title: "Studi di Prancis — Biaya Ringan",
        description:
          "Kampus negeri Prancis biayanya jauh di bawah negara Barat lain, plus beasiswa Eiffel & IFI. Program berbahasa Prancis butuh DELF B2 — dan seleksi Campus France menilai kemampuan bahasamu.",
      },
      {
        icon: "🌍",
        title: "Bahasa Resmi 29 Negara",
        description:
          "Bahasa kerja PBB, Uni Eropa, Uni Afrika, dan organisasi internasional. Karier diplomasi, NGO, dan lembaga internasional hampir selalu menempatkan Prancis sebagai nilai plus besar.",
      },
      {
        icon: "🥐",
        title: "Hospitality, Kuliner & Fashion",
        description:
          "Dunia kuliner, patiseri, perhotelan, dan fashion berbahasa Prancis — dari istilah dapur sampai sekolah top seperti Le Cordon Bleu. Kru kapal pesiar & hotel berbintang bergaji lebih dengan bahasa Prancis.",
      },
    ],

    targetAudience: [
      {
        emoji: "🎓",
        persona: "Calon Mahasiswa via Campus France",
        benefit: "Persiapan DELF B1–B2, wawancara Campus France, motivasi & dokumen aplikasi.",
      },
      {
        emoji: "🏨",
        persona: "Profesional Hospitality & Kuliner",
        benefit: "French for hospitality: istilah dapur, layanan tamu, kapal pesiar, fine dining.",
      },
      {
        emoji: "🕊️",
        persona: "Pemburu Karier Internasional",
        benefit: "Diplomasi, NGO, PBB — Prancis bahasa kerja resmi organisasi internasional.",
      },
      {
        emoji: "🎬",
        persona: "Penikmat Budaya Prancis",
        benefit: "Film Prancis tanpa subtitle, chanson, sastra, dan percakapan saat traveling.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Débutant",
        sessionCount: 48,
        description:
          "Mulai dari nol. Pelafalan Prancis yang benar sejak awal — liaison, nasal, huruf mati — plus kalimat sehari-hari.",
        topics: [
          "Pelafalan: nasal (on/an/in), liaison, huruf tak dibaca",
          "Artikel le/la/les, un/une & gender kata benda",
          "Konjugasi -er, -ir, -re + être, avoir, aller",
          "Angka, jam, belanja, kafe & restoran",
          "Perkenalan diri & pertanyaan dasar",
        ],
      },
      {
        level: "A2",
        title: "A2 — Élémentaire",
        sessionCount: 64,
        description: "Percakapan sehari-hari dengan struktur dasar lengkap. Setara DELF A2.",
        topics: [
          "Passé composé vs imparfait",
          "Futur proche & futur simple",
          "Pronomina objek: le/la/lui/y/en",
          "Adjektiva: posisi, kesesuaian, pembanding",
          "Topik: perjalanan, pekerjaan, rutinitas, cuaca",
        ],
      },
      {
        level: "B1",
        title: "B1 — Intermédiaire",
        sessionCount: 80,
        description:
          "Diskusi topik kompleks, baca artikel ringan, nonton film dengan subtitle Prancis. Persiapan DELF B1.",
        topics: [
          "Subjonctif présent: kapan wajib dipakai",
          "Conditionnel: pengandaian & kesopanan",
          "Discours indirect & concordance des temps",
          "Membaca artikel Le Monde level ringan, RFI Savoirs",
          "Produksi tulis & lisan format DELF B1",
        ],
      },
      {
        level: "B2",
        title: "B2 — Avancé (Syarat Kuliah)",
        sessionCount: 112,
        description:
          "Level syarat mayoritas kampus Prancis. Argumentasi, akademik, profesional — persiapan DELF B2/DALF C1.",
        topics: [
          "Argumentasi & essai argumentatif ala DELF B2",
          "Subjonctif passé & struktur kompleks",
          "Français professionnel: email, presentasi, meeting",
          "Sastra & media: Camus, Le Petit Prince, France 24",
          "Simulasi DELF B2: 4 keterampilan + strategi waktu",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Pelafalan Prancis terkenal susah. Gimana cara Linguo ngajarinnya?",
        answer:
          "Kami habiskan porsi besar A1 khusus untuk fonetik: bunyi nasal, r Prancis, liaison, dan pola huruf yang tak dibaca. Begitu polanya nempel, membaca kata baru jadi otomatis — jauh lebih konsisten daripada Inggris.",
      },
      {
        question: "DELF itu apa dan level berapa yang dibutuhkan untuk kuliah?",
        answer:
          "DELF (Diplôme d'études en langue française) adalah sertifikat resmi Kemendikbud Prancis, berlaku seumur hidup. Program S1/S2 berbahasa Prancis umumnya minta DELF B2. Jalur Campus France juga mewajibkan tes bahasa (TCF/DELF).",
      },
      {
        question: "Berapa lama dari nol sampai DELF B2?",
        answer:
          "Rata-rata 18–24 bulan dengan 2–3 sesi seminggu. Untuk target Campus France tahun depan, kami biasanya susun jalur intensif: A1–A2 dalam 6–8 bulan, lalu fokus B1–B2 dengan simulasi ujian rutin.",
      },
      {
        question: "Bahasa Prancis mirip bahasa Inggris?",
        answer:
          "Sekitar 30% kosakata Inggris berasal dari Prancis (restaurant, menu, journal, art). Reading jadi cepat nyambung. Bedanya di pelafalan dan konjugasi verba yang lebih kaya — dua hal itu yang kami latih paling intens.",
      },
      {
        question: "Pengajarnya native atau orang Indonesia?",
        answer:
          "Mix. A1–A2 dengan pengajar Indonesia lulusan Sastra Prancis / alumni Prancis supaya penjelasan grammar jelas. Mulai B1 tersedia opsi pengajar native atau penutur frankofon untuk imersi.",
      },
    ],

    metaTitle: "Kursus Bahasa Prancis Online | Linguo.id — A1 sampai DELF B2",
    metaDescription:
      "Belajar Bahasa Prancis online dari nol. Persiapan DELF/DALF, Campus France, French for hospitality. Pengajar bersertifikat, semi privat mulai Rp 80.000/sesi.",
    metaKeywords: [
      "kursus bahasa prancis",
      "les bahasa prancis online",
      "belajar bahasa prancis",
      "kursus prancis jakarta",
      "DELF prep Indonesia",
      "campus france persiapan",
      "kursus prancis online",
      "les prancis murah",
      "belajar bahasa perancis",
      "kursus bahasa perancis online",
    ],
  },

  // ==========================================================================
  // SPANYOL
  // ==========================================================================
  spanyol: {
    urlSlug: "spanyol",
    languageSlug: "spanish",
    tagline: "Bahasa 500 juta penutur — dari hola sampai DELE, Eropa sampai Amerika Latin.",
    heroDescription:
      "Kursus Bahasa Spanyol online dengan kurikulum CEFR A1–B2 selaras DELE/SIELE. Bahasa paling ramah untuk pemula Indonesia: ejaan konsisten, pelafalan mirip — progres terasa cepat.",

    whyLearn: [
      {
        icon: "🌎",
        title: "Bahasa Resmi 21 Negara",
        description:
          "Spanyol, Meksiko, Argentina, Kolombia, Chile — bahasa ibu ~500 juta orang dan bahasa kedua paling dipelajari di dunia. Satu bahasa membuka dua benua sekaligus.",
      },
      {
        icon: "⚡",
        title: "Paling Cepat Dikuasai Orang Indonesia",
        description:
          "Ejaan Spanyol konsisten dan vokalnya lima, persis a-i-u-e-o Indonesia. Dibanding Mandarin atau Jepang, jarak ke level percakapan jauh lebih pendek — motivasi tetap terjaga.",
      },
      {
        icon: "🎬",
        title: "Musik, Serial & Sepak Bola",
        description:
          "Reggaeton, Money Heist (La Casa de Papel), telenovela, La Liga — konten berbahasa Spanyol membanjiri dunia. Belajar dari materi yang memang kamu nikmati tiap hari.",
      },
    ],

    targetAudience: [
      {
        emoji: "✈️",
        persona: "Traveler & Digital Nomad",
        benefit: "Amerika Latin ramah backpacker tapi minim yang bisa Inggris — Spanyol wajib.",
      },
      {
        emoji: "🎓",
        persona: "Pelajar Persiapan DELE / SIELE",
        benefit: "Track ujian resmi Instituto Cervantes dengan mock test per level.",
      },
      {
        emoji: "💼",
        persona: "Profesional Ekspor-Impor & Pariwisata",
        benefit: "Negosiasi dengan pasar Amerika Latin & Spanyol, guiding turis hispanik.",
      },
      {
        emoji: "🎵",
        persona: "Penikmat Musik & Serial Spanyol",
        benefit: "Paham lirik Bad Bunny & Rosalía, nonton Netflix Spanyol tanpa subtitle.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Principiante",
        sessionCount: 48,
        description:
          "Mulai dari nol. Pelafalan (hampir persis ejaan!), kalimat dasar, percakapan sehari-hari sejak sesi pertama.",
        topics: [
          "Pelafalan: ñ, ll, rr, j — sisanya seperti Indonesia",
          "Ser vs estar — dua kata 'adalah' yang beda fungsi",
          "Artikel el/la & gender, plural, adjektiva",
          "Konjugasi present: -ar, -er, -ir + refleksif",
          "Angka, jam, belanja, restoran, arah jalan",
        ],
      },
      {
        level: "A2",
        title: "A2 — Elemental",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar. Setara DELE A2 — syarat residensi Spanyol.",
        topics: [
          "Pretérito indefinido vs imperfecto",
          "Futuro & ir a + infinitivo",
          "Pronomina objek langsung & tak langsung",
          "Gustar dan verba sejenis (encantar, doler)",
          "Topik: perjalanan, pekerjaan, makanan, kesehatan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Intermedio",
        sessionCount: 80,
        description:
          "Diskusi topik kompleks, baca artikel, nonton serial dengan subtitle Spanyol. Persiapan DELE B1.",
        topics: [
          "Subjuntivo presente: kapan & kenapa",
          "Condicional & pengandaian",
          "Perintah (imperativo) afirmatif & negatif",
          "Perbedaan Spanyol Eropa vs Amerika Latin (vosotros/ustedes)",
          "Membaca El País level ringan, podcast intermedio",
        ],
      },
      {
        level: "B2",
        title: "B2 — Avanzado",
        sessionCount: 112,
        description:
          "Mahir untuk kerja, akademik, dan media. Persiapan DELE B2 — syarat kuliah di Spanyol & Amerika Latin.",
        topics: [
          "Subjuntivo imperfecto & pluscuamperfecto",
          "Estilo indirecto & struktur kompleks",
          "Español profesional: email, presentasi, negosiasi",
          "Sastra: García Márquez, Neruda, Cervantes adaptasi",
          "Simulasi DELE B2: 4 keterampilan + strategi",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Katanya Spanyol bahasa paling gampang buat orang Indonesia. Benar?",
        answer:
          "Untuk pelafalan dan membaca — ya. Vokalnya lima dan ejaannya konsisten, jadi dari sesi pertama kamu sudah bisa membaca kalimat dengan benar. Tantangannya di konjugasi verba, dan itu yang kami drill dengan pola, bukan hafalan.",
      },
      {
        question: "Belajar Spanyol Eropa atau Amerika Latin?",
        answer:
          "Dasarnya sama dan saling paham. Linguo mengajarkan Spanyol standar netral, lalu mulai B1 kami tunjukkan perbedaan utama (vosotros vs ustedes, pelafalan c/z, kosakata). Kamu bebas pilih fokus sesuai tujuan — Spanyol atau Latam.",
      },
      {
        question: "Apa itu DELE dan SIELE?",
        answer:
          "Keduanya sertifikat resmi dari Instituto Cervantes. DELE berbasis level (A1–C2), berlaku seumur hidup, ujian tatap muka. SIELE berbasis skor, online, hasil cepat. Untuk kuliah atau residensi, cek mana yang diminta institusi tujuanmu — materi persiapannya sama.",
      },
      {
        question: "Berapa lama sampai bisa ngobrol lancar?",
        answer:
          "Percakapan dasar (A2) rata-rata 6–9 bulan dengan 2–3 sesi seminggu — lebih cepat dari mayoritas bahasa lain. Diskusi nyaman topik luas (B1–B2) sekitar 15–20 bulan.",
      },
      {
        question: "Pengajarnya native atau orang Indonesia?",
        answer:
          "Mix. A1–A2 bersama pengajar Indonesia yang fasih supaya grammar dijelaskan gamblang. Mulai B1 tersedia opsi pengajar native (Spanyol / Amerika Latin) untuk imersi aksen dan budaya.",
      },
    ],

    metaTitle: "Kursus Bahasa Spanyol Online | Linguo.id — A1 sampai DELE B2",
    metaDescription:
      "Belajar Bahasa Spanyol online dari nol. Persiapan DELE/SIELE, percakapan cepat lancar, Spanyol Eropa & Amerika Latin. Semi privat mulai Rp 95.000/sesi.",
    metaKeywords: [
      "kursus bahasa spanyol",
      "les bahasa spanyol online",
      "belajar bahasa spanyol",
      "kursus spanyol jakarta",
      "DELE prep Indonesia",
      "kursus spanyol online",
      "les spanyol murah",
      "belajar spanyol pemula",
      "bahasa spanyol percakapan",
      "kursus spanyol privat",
    ],
  },

  // ==========================================================================
  // ITALIA
  // ==========================================================================
  italia: {
    urlSlug: "italia",
    languageSlug: "italian",
    tagline: "Dari ciao sampai CILS — bahasa seni, kuliner, dan desain dunia.",
    heroDescription:
      "Kursus Bahasa Italia online dengan kurikulum CEFR A1–B2 selaras CILS/CELI. Untuk studi seni & desain di Italia, beasiswa MAECI, karier kuliner-fashion, atau sekadar jatuh cinta pada la dolce vita.",

    whyLearn: [
      {
        icon: "🎨",
        title: "Kiblat Seni, Desain & Arsitektur",
        description:
          "Politecnico di Milano, NABA, IED, Accademia di Belle Arti — sekolah seni & desain top dunia ada di Italia. Program berbahasa Italia biayanya jauh lebih murah dan butuh sertifikat B1–B2.",
      },
      {
        icon: "🎓",
        title: "Beasiswa MAECI & Kuliah Murah",
        description:
          "Beasiswa pemerintah Italia (MAECI) plus uang kuliah kampus negeri yang dihitung dari penghasilan keluarga — bisa nyaris gratis. Nilai plus besar untuk pendaftar yang bisa berbahasa Italia.",
      },
      {
        icon: "🍝",
        title: "Kuliner, Fashion & Otomotif",
        description:
          "Dunia kuliner (pasta, barista, gelato), fashion (Milan!), dan otomotif (Ferrari, Ducati) berbahasa Italia. Chef & barista dengan bahasa Italia punya nilai jual lebih di industri hospitality.",
      },
    ],

    targetAudience: [
      {
        emoji: "🎨",
        persona: "Calon Mahasiswa Seni & Desain",
        benefit: "Persiapan CILS B1/B2 untuk aplikasi kampus + kosakata dunia seni.",
      },
      {
        emoji: "👨‍🍳",
        persona: "Chef, Barista & Pelaku Kuliner",
        benefit: "Italiano per la cucina: istilah dapur, menu, supplier, sertifikasi barista.",
      },
      {
        emoji: "🎓",
        persona: "Pemburu Beasiswa MAECI",
        benefit: "Syarat bahasa program MAECI berbahasa Italia + dokumen aplikasi.",
      },
      {
        emoji: "🏛️",
        persona: "Penikmat Budaya & Traveler",
        benefit: "Opera, sejarah Romawi, Serie A, dan ngobrol santai saat keliling Italia.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Principiante",
        sessionCount: 48,
        description:
          "Mulai dari nol. Pelafalan Italia yang musikal, kalimat dasar, percakapan kafe & perkenalan.",
        topics: [
          "Pelafalan: c/g keras-lembut, gli, gn, dobel konsonan",
          "Artikel il/la/lo & gender, plural -i/-e",
          "Konjugasi present: -are, -ere, -ire + essere, avere",
          "Angka, jam, ordina al bar, belanja",
          "Perkenalan diri & basa-basi khas Italia",
        ],
      },
      {
        level: "A2",
        title: "A2 — Elementare",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar dengan struktur dasar. Setara CILS A2.",
        topics: [
          "Passato prossimo: essere vs avere",
          "Imperfetto & perbedaannya dengan passato prossimo",
          "Pronomina objek & partikel ci/ne",
          "Futuro semplice & preposisi artikulasi",
          "Topik: perjalanan, makanan, keluarga, pekerjaan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Intermedio",
        sessionCount: 80,
        description:
          "Diskusi topik kompleks, baca artikel ringan, nonton film Italia dengan subtitle. Persiapan CILS B1 (syarat kewarganegaraan).",
        topics: [
          "Congiuntivo presente: kapan wajib",
          "Condizionale & pengandaian",
          "Imperativo & pronomina gabungan",
          "Membaca Corriere della Sera level ringan",
          "Produksi tulis & lisan format CILS B1",
        ],
      },
      {
        level: "B2",
        title: "B2 — Avanzato (Syarat Kuliah)",
        sessionCount: 112,
        description:
          "Level syarat mayoritas program kampus Italia. Akademik & profesional — persiapan CILS/CELI B2.",
        topics: [
          "Congiuntivo imperfetto & periodo ipotetico lengkap",
          "Bahasa akademik & saggio breve (esai pendek)",
          "Italiano professionale: email, presentasi, kolokium",
          "Sastra & film: Calvino, Ferrante, neorealismo",
          "Simulasi CILS B2: 4 keterampilan + strategi",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "CILS dan CELI itu apa bedanya?",
        answer:
          "Keduanya sertifikat resmi yang diakui pemerintah Italia — CILS dari Università per Stranieri di Siena, CELI dari Perugia. Untuk kuliah dan kewarganegaraan keduanya berlaku. Materi persiapannya hampir identik; pilih yang jadwal ujiannya cocok di IIC Jakarta.",
      },
      {
        question: "Saya sudah bisa Spanyol/pernah belajar Prancis. Kepotong berapa lama?",
        answer:
          "Banyak. Italia satu rumpun Romance — struktur dan kosakatanya beririsan 70–80% dengan Spanyol. Siswa dengan dasar Spanyol biasanya bisa lompat materi A1 dalam separuh waktu normal.",
      },
      {
        question: "Level berapa yang dibutuhkan untuk kuliah di Italia?",
        answer:
          "Program berbahasa Italia umumnya minta B2 (beberapa menerima B1 dengan syarat). Beasiswa MAECI untuk program berbahasa Italia juga minta minimal A2–B1 saat mendaftar. Kami susun jalurnya mundur dari deadline aplikasimu.",
      },
      {
        question: "Berapa lama dari nol sampai B2?",
        answer:
          "Rata-rata 18–24 bulan dengan 2–3 sesi seminggu. Jalur intensif untuk kejar intake September bisa dipadatkan — konsultasikan target tanggalmu, kami hitung ritme sesinya.",
      },
      {
        question: "Pengajarnya native atau orang Indonesia?",
        answer:
          "Mix. A1–A2 bersama pengajar Indonesia yang fasih Italia supaya grammar gamblang. Mulai B1 tersedia opsi pengajar native untuk imersi pelafalan dan budaya.",
      },
    ],

    metaTitle: "Kursus Bahasa Italia Online | Linguo.id — A1 sampai CILS B2",
    metaDescription:
      "Belajar Bahasa Italia online dari nol. Persiapan CILS/CELI, studi seni & desain di Italia, beasiswa MAECI. Pengajar bersertifikat, semi privat mulai Rp 95.000/sesi.",
    metaKeywords: [
      "kursus bahasa italia",
      "les bahasa italia online",
      "belajar bahasa italia",
      "kursus italia jakarta",
      "CILS prep Indonesia",
      "beasiswa MAECI",
      "kuliah di italia",
      "kursus italia online",
      "les italia murah",
      "bahasa italia pemula",
    ],
  },

  // ==========================================================================
  // BELANDA
  // ==========================================================================
  belanda: {
    urlSlug: "belanda",
    languageSlug: "dutch",
    tagline: "Dari hallo sampai NT2 — bahasa sejarah Indonesia dan masa depan di Negeri Kincir.",
    heroDescription:
      "Kursus Bahasa Belanda online dengan kurikulum CEFR A1–B2. Persiapan Basisexamen Inburgering untuk pasangan, ujian NT2 untuk studi & kerja, sampai membaca arsip sejarah dan dokumen hukum berbahasa Belanda.",

    whyLearn: [
      {
        icon: "💍",
        title: "Inburgering — Menyusul Pasangan",
        description:
          "Visa MVV untuk pasangan mensyaratkan lulus Basisexamen Inburgering (level A1) di kedutaan: baca, dengar, dan bicara. Ini alasan #1 orang Indonesia belajar Belanda — dan paling butuh persiapan terarah.",
      },
      {
        icon: "📜",
        title: "Kunci Arsip Sejarah & Hukum Indonesia",
        description:
          "Ratusan tahun arsip Nusantara, dokumen tanah (eigendom), dan kitab hukum warisan (BW/KUHPerdata aslinya) berbahasa Belanda. Sejarawan, notaris, dan praktisi hukum sangat diuntungkan.",
      },
      {
        icon: "🎓",
        title: "Studi & Karier di Belanda",
        description:
          "Belanda rumah beasiswa (dulu StuNed, kini Orange Knowledge/NL Scholarship) dan perusahaan seperti Shell, Philips, Unilever, ASML. Bahasa lokal membuka integrasi sosial & peluang kerja non-internasional.",
      },
    ],

    targetAudience: [
      {
        emoji: "💍",
        persona: "Pasangan WN Belanda (MVV)",
        benefit: "Fokus lulus Basisexamen Inburgering A1: spreken, luisteren, lezen (KNM).",
      },
      {
        emoji: "⚖️",
        persona: "Praktisi Hukum & Notaris",
        benefit: "Membaca BW, dokumen eigendom, akta lama — kosakata hukum Belanda klasik.",
      },
      {
        emoji: "📚",
        persona: "Sejarawan & Peneliti Arsip",
        benefit: "Membaca arsip VOC/Hindia Belanda, koran lama, korespondensi kolonial.",
      },
      {
        emoji: "🎓",
        persona: "Calon Mahasiswa / Pekerja di Belanda",
        benefit: "NT2 Programma I/II untuk studi & kerja, plus percakapan integrasi sosial.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Beginner (Level Inburgering)",
        sessionCount: 48,
        description:
          "Mulai dari nol sampai level Basisexamen Inburgering. Pelafalan, kalimat dasar, percakapan sehari-hari.",
        topics: [
          "Pelafalan: g/ch khas Belanda, ui, ij, oe, eu",
          "De/het & kata benda, plural, diminutif -je",
          "Konjugasi present + zijn, hebben, gaan",
          "Angka, jam, belanja, transportasi, cuaca",
          "Simulasi soal Basisexamen: spreken & luisteren",
        ],
      },
      {
        level: "A2",
        title: "A2 — Elementair",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar. Level ujian Inburgering di Belanda (untuk yang sudah tiba).",
        topics: [
          "Perfectum (heb gedaan) vs imperfectum",
          "Modale werkwoorden: kunnen, moeten, mogen, willen",
          "Urutan kata: inversi & posisi verba kedua",
          "Separable verbs (opbellen, meenemen)",
          "Topik: pekerjaan, kesehatan, tempat tinggal, janji",
        ],
      },
      {
        level: "B1",
        title: "B1 — Intermediair (NT2 Programma I)",
        sessionCount: 80,
        description:
          "Level ujian NT2 Programma I — syarat kerja vokasional & MBO. Diskusi topik luas dengan nyaman.",
        topics: [
          "Bijzinnen: omdat, dat, als, terwijl + urutan kata",
          "Passief (worden + voltooid deelwoord)",
          "Er dalam segala fungsinya (er is, er ... van)",
          "Membaca NOS Nieuws & surat resmi (brieven)",
          "Simulasi NT2-I: 4 keterampilan",
        ],
      },
      {
        level: "B2",
        title: "B2 — Gevorderd (NT2 Programma II)",
        sessionCount: 112,
        description:
          "Level NT2 Programma II — syarat kuliah & kerja profesional di Belanda. Termasuk pengantar Belanda klasik untuk arsip.",
        topics: [
          "Struktur kompleks & conjunctief sisa-sisa formal",
          "Zakelijk Nederlands: email, rapat, presentasi",
          "Membaca de Volkskrant, NRC & teks akademik",
          "Pengantar Belanda klasik: ejaan lama arsip & akta",
          "Simulasi NT2-II: schrijven & spreken intensif",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Apa itu Basisexamen Inburgering dan seberapa susah?",
        answer:
          "Ujian integrasi level A1 yang wajib lulus di Kedubes Belanda sebelum visa MVV (menyusul pasangan) terbit: membaca, mendengar, bicara, plus pengetahuan masyarakat Belanda (KNM). Levelnya dasar tapi formatnya khas — siswa Linguo berlatih langsung dengan simulasi soal aslinya, rata-rata siap dalam 3–5 bulan.",
      },
      {
        question: "Bahasa Belanda mirip Inggris atau Jerman?",
        answer:
          "Persis di tengah-tengah. Kosakata dan struktur dekat dengan Jerman tapi tanpa sistem kasus yang rumit, sementara banyak kata juga mirip Inggris. Bonus untuk orang Indonesia: ratusan kata serapan (kantor, handuk, gratis, bekleding → bekleding) terasa familiar.",
      },
      {
        question: "Banyak kata Indonesia dari Belanda ya?",
        answer:
          "Betul — knalpot, rekening, gorden, kulkas (koelkast), wortel, spanduk, verboden. Ini modal psikologis besar: kosakata terasa 'sudah setengah kenal', jadi progres awal cepat.",
      },
      {
        question: "Saya perlu baca dokumen tanah / arsip lama. Bisa diajarkan?",
        answer:
          "Bisa. Untuk kebutuhan arsip & hukum kami arahkan kurikulum ke membaca: ejaan Belanda lama (oe → u, sch), kosakata notariat & hukum (eigendom, erfpacht), dan struktur kalimat formal era kolonial. Ini track yang cukup sering diminta notaris & peneliti.",
      },
      {
        question: "Pengajarnya native atau orang Indonesia?",
        answer:
          "Mix. Mayoritas pengajar Indonesia lulusan Sastra Belanda (UI satu-satunya di Asia Tenggara!) atau alumni Belanda — grammar dijelaskan gamblang. Opsi pengajar native tersedia untuk level B1 ke atas.",
      },
    ],

    metaTitle: "Kursus Bahasa Belanda Online | Linguo.id — A1 sampai NT2",
    metaDescription:
      "Belajar Bahasa Belanda online dari nol. Persiapan Basisexamen Inburgering (MVV), ujian NT2, baca arsip & dokumen hukum. Semi privat mulai Rp 95.000/sesi.",
    metaKeywords: [
      "kursus bahasa belanda",
      "les bahasa belanda online",
      "belajar bahasa belanda",
      "kursus belanda jakarta",
      "basisexamen inburgering",
      "persiapan MVV belanda",
      "ujian NT2",
      "kursus belanda online",
      "les belanda murah",
      "bahasa belanda pemula",
    ],
  },
  // ==========================================================================
  // ARAB
  // ==========================================================================
  arab: {
    urlSlug: "arab",
    languageSlug: "arabic",
    tagline: "Fusha & Amiyah — untuk memahami Al-Qur'an, studi, dan karier Timur Tengah.",
    heroDescription:
      "Kursus Bahasa Arab online dengan kurikulum A1–B2. Dari nol huruf hijaiyah sampai membaca teks gundul: nahwu-sharaf yang runtut, percakapan Amiyah praktis, persiapan studi Timur Tengah.",

    whyLearn: [
      {
        icon: "🕌",
        title: "Memahami Al-Qur'an & Kajian Langsung",
        description:
          "Membaca sudah bisa, tapi memahami maknanya beda cerita. Dengan nahwu-sharaf yang runtut, kamu bisa memahami Al-Qur'an, hadits, dan kitab kuning tanpa bergantung penuh pada terjemahan.",
      },
      {
        icon: "🎓",
        title: "Beasiswa Al-Azhar, Madinah & Timur Tengah",
        description:
          "Al-Azhar Mesir, Universitas Islam Madinah, Qatar, Yordania — beasiswa full-funded terbuka tiap tahun untuk pelajar Indonesia. Tes masuknya menguji kemampuan bahasa Arab aktif, bukan cuma pasif.",
      },
      {
        icon: "💼",
        title: "Karier Haji-Umrah & Perusahaan Teluk",
        description:
          "Muthawif (pembimbing umrah), TKI profesional Teluk, dan perusahaan Saudi-UAE yang ekspansi ke Indonesia (Aramco, Emirates) menghargai tinggi kandidat yang fasih Arab percakapan.",
      },
    ],

    targetAudience: [
      {
        emoji: "📖",
        persona: "Pembelajar Al-Qur'an & Kitab",
        benefit: "Nahwu-sharaf terstruktur sampai bisa baca teks gundul & kitab kuning.",
      },
      {
        emoji: "🎓",
        persona: "Calon Mahasiswa Timur Tengah",
        benefit: "Persiapan tes masuk Al-Azhar/Madinah + bahasa Arab akademik.",
      },
      {
        emoji: "🕋",
        persona: "Muthawif & Petugas Haji-Umrah",
        benefit: "Amiyah Hijaz praktis: percakapan lapangan, negosiasi, situasi darurat.",
      },
      {
        emoji: "💼",
        persona: "Profesional di Perusahaan Teluk",
        benefit: "Business Arabic: email, meeting, etiket bisnis Saudi-UAE.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula (Huruf & Kalimat Dasar)",
        sessionCount: 48,
        description:
          "Mulai dari nol atau dari 'bisa baca tapi tak paham arti'. Hijaiyah, harakat, kosakata inti, kalimat sederhana.",
        topics: [
          "Hijaiyah tersambung, harakat, tanwin, mad dasar",
          "Isim, fi'il, huruf — tiga jenis kata Arab",
          "Kalimat ismiyah (mubtada' khabar) sederhana",
          "Dhamir (kata ganti) & kepemilikan idhafah dasar",
          "Percakapan: salam, perkenalan, angka, belanja",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar",
        sessionCount: 64,
        description: "Percakapan sehari-hari dan dasar nahwu-sharaf yang kokoh.",
        topics: [
          "Fi'il madhi, mudhari', amr + tashrif dasar",
          "Kalimat fi'liyah & struktur fa'il-maf'ul",
          "Jamak taksir vs jamak salim, mutsanna",
          "I'rab dasar: rafa', nashab, jar",
          "Topik: keluarga, perjalanan, makanan, ibadah",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah (Mulai Teks Gundul)",
        sessionCount: 80,
        description:
          "Membaca teks tanpa harakat, diskusi topik luas, plus pilihan track Amiyah (Mesir/Hijaz) untuk percakapan.",
        topics: [
          "Membaca teks gundul dengan analisis i'rab",
          "Sharaf lanjutan: wazan tsulatsi mazid & maknanya",
          "Na't, hal, tamyiz, istitsna'",
          "Amiyah praktis: dialek Mesir / Hijaz sehari-hari",
          "Membaca berita Al Jazeera Learning & teks sastra ringan",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas (Akademik & Kitab)",
        sessionCount: 112,
        description:
          "Mahir untuk studi Timur Tengah, kajian kitab, dan profesional. Balaghah dasar & bahasa Arab jurnalistik.",
        topics: [
          "Kitab kuning: membaca matan & syarah mandiri",
          "Balaghah dasar: bayan, ma'ani, badi'",
          "Bahasa Arab jurnalistik: Al Jazeera, Asharq Al-Awsat",
          "Insya' (menulis esai) & muhadatsah akademik",
          "Persiapan tes masuk universitas Timur Tengah",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Saya sudah bisa baca Al-Qur'an tapi nggak paham artinya. Mulai dari level mana?",
        answer:
          "Ini profil siswa Arab paling umum di Linguo. Kamu tidak mulai dari nol — hijaiyah sudah di tangan. Lewat placement test kami biasanya menempatkan di A1 akhir/A2 dengan fokus langsung ke kosakata, nahwu-sharaf, dan pola kalimat.",
      },
      {
        question: "Fusha atau Amiyah — belajar yang mana dulu?",
        answer:
          "Fusha (Arab baku) dulu — dia kunci Al-Qur'an, kitab, berita, dan dipahami di semua negara Arab. Amiyah (dialek percakapan) kami masukkan mulai B1 sesuai kebutuhanmu: dialek Mesir untuk studi, Hijaz untuk haji-umrah & kerja Saudi.",
      },
      {
        question: "Nahwu-sharaf itu menakutkan. Apa harus hafal ratusan kaidah?",
        answer:
          "Tidak. Kurikulum Linguo mengajarkan nahwu-sharaf secara fungsional — kaidah muncul saat dibutuhkan teks, bukan dihafal terpisah seperti di pesantren klasik. Targetnya bisa membaca dan berbicara, bukan lulus ujian hafalan.",
      },
      {
        question: "Berapa lama sampai bisa memahami Al-Qur'an tanpa terjemahan?",
        answer:
          "Untuk ayat-ayat naratif dan pendek, rata-rata siswa mulai 'nyambung' di akhir A2 (sekitar 8–12 bulan). Pemahaman yang lebih dalam — termasuk struktur kompleks dan balaghah — dibangun di B1–B2.",
      },
      {
        question: "Pengajarnya lulusan mana?",
        answer:
          "Mayoritas alumni Timur Tengah (Al-Azhar, Madinah, Yordania) dan LIPIA. Untuk track Amiyah, kami pasangkan dengan pengajar yang pernah tinggal lama di negara dialek tersebut.",
      },
    ],

    metaTitle: "Kursus Bahasa Arab Online | Linguo.id — dari Hijaiyah sampai Kitab",
    metaDescription:
      "Belajar Bahasa Arab online dari nol. Nahwu-sharaf runtut, memahami Al-Qur'an, Amiyah percakapan, persiapan studi Timur Tengah. Semi privat mulai Rp 80.000/sesi.",
    metaKeywords: [
      "kursus bahasa arab",
      "les bahasa arab online",
      "belajar bahasa arab",
      "kursus arab jakarta",
      "belajar nahwu sharaf",
      "bahasa arab al quran",
      "kursus arab online",
      "les arab murah",
      "beasiswa al azhar",
      "bahasa arab percakapan",
    ],
  },

  // ==========================================================================
  // RUSIA
  // ==========================================================================
  rusia: {
    urlSlug: "rusia",
    languageSlug: "russian",
    tagline: "Dari Sirilik sampai TORFL — bahasa 250 juta penutur di Eurasia.",
    heroDescription:
      "Kursus Bahasa Rusia online dengan kurikulum CEFR A1–B2 selaras TORFL (ТРКИ). Untuk beasiswa pemerintah Rusia, karier energi & migas, atau menyelami sastra terbesar dunia.",

    whyLearn: [
      {
        icon: "🎓",
        title: "Beasiswa Pemerintah Rusia Tiap Tahun",
        description:
          "Ratusan kuota beasiswa penuh (Open Doors & kuota pemerintah) untuk pelajar Indonesia ke kampus seperti MGU, MIPT, Bauman. Mayoritas program berbahasa Rusia — bahasa adalah tiket masuknya.",
      },
      {
        icon: "🛢️",
        title: "Energi, Migas & Teknik",
        description:
          "Rusia raksasa energi dan teknik nuklir (Rosatom membangun kemitraan di Asia Tenggara). Insinyur & profesional migas berbahasa Rusia adalah kombinasi langka yang dibayar mahal.",
      },
      {
        icon: "📚",
        title: "Sastra & Budaya Kelas Dunia",
        description:
          "Dostoevsky, Tolstoy, Chekhov dalam bahasa aslinya — pengalaman yang tak tergantikan terjemahan. Plus balet, film Tarkovsky, dan musik klasik Rusia.",
      },
    ],

    targetAudience: [
      {
        emoji: "🎓",
        persona: "Pemburu Beasiswa Open Doors",
        benefit: "Persiapan bahasa pra-keberangkatan + TORFL untuk program berbahasa Rusia.",
      },
      {
        emoji: "🛢️",
        persona: "Profesional Migas & Teknik",
        benefit: "Kosakata teknis energi, dokumen proyek, komunikasi tim lapangan.",
      },
      {
        emoji: "📚",
        persona: "Penikmat Sastra Rusia",
        benefit: "Membaca Dostoevsky & Tolstoy asli, dipandu dari teks adaptasi ke original.",
      },
      {
        emoji: "✈️",
        persona: "Traveler Rute Eurasia",
        benefit: "Rusia + Asia Tengah (Kazakhstan, Uzbekistan) — Sirilik & Rusia jadi kunci.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula (Элементарный)",
        sessionCount: 48,
        description:
          "Mulai dari nol. Alfabet Sirilik tuntas dalam beberapa sesi, lalu langsung kalimat dan percakapan dasar.",
        topics: [
          "Sirilik 33 huruf: baca-tulis cetak & sambung",
          "Pelafalan: reduksi vokal, konsonan keras-lembut",
          "Gender kata benda & kata ganti dasar",
          "Kalimat tanpa 'to be' — struktur khas Rusia",
          "Perkenalan, angka, belanja, transportasi",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar (Базовый)",
        sessionCount: 64,
        description: "Percakapan sehari-hari dengan 6 kasus dasar. Setara TORFL Basic (ТБУ).",
        topics: [
          "6 kasus: fungsi inti & pola akhiran",
          "Aspek verba: imperfektif vs perfektif (kunci Rusia!)",
          "Verba gerak: идти/ходить, ехать/ездить",
          "Waktu lampau & masa depan",
          "Topik: keluarga, pekerjaan, cuaca, perjalanan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah (TORFL-1)",
        sessionCount: 80,
        description:
          "Level syarat masuk universitas Rusia (TORFL-1/ТРКИ-1). Diskusi topik luas, baca artikel ringan.",
        topics: [
          "Kasus lengkap dengan adjektiva & angka",
          "Verba gerak berprefiks (при-, у-, вы-, за-)",
          "Kalimat kompleks: который, чтобы, если",
          "Participle & gerund pengenalan",
          "Simulasi TORFL-1: 5 subtes",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas (TORFL-2)",
        sessionCount: 112,
        description:
          "Mahir untuk akademik & profesional. TORFL-2 — syarat program magister & pekerjaan profesional.",
        topics: [
          "Participle & gerund aktif-pasif lengkap",
          "Bahasa akademik & ilmiah (научный стиль)",
          "Business Russian: email, presentasi, negosiasi",
          "Sastra: Chekhov & Dostoevsky (teks asli berpanduan)",
          "Membaca berita RBC, Kommersant",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Alfabet Sirilik susah nggak?",
        answer:
          "Bagian paling gampang dari bahasa Rusia — 33 huruf, banyak yang mirip Latin, dan mayoritas siswa Linguo sudah lancar baca dalam 3–4 sesi. Tantangan sebenarnya di sistem kasus dan aspek verba, dan kurikulum kami memang dirancang menaklukkan dua itu pelan-pelan.",
      },
      {
        question: "Katanya grammar Rusia paling susah. Beneran?",
        answer:
          "Rusia punya 6 kasus dan sistem aspek verba — memang lebih kompleks dari bahasa Eropa Barat. Tapi juga ada bonusnya: tanpa artikel (a/the), tanpa 'to be' di present, dan ejaannya jauh lebih konsisten dari Inggris. Dengan urutan materi yang benar, sangat bisa ditaklukkan.",
      },
      {
        question: "TORFL itu apa dan level berapa untuk kuliah di Rusia?",
        answer:
          "TORFL (ТРКИ) adalah ujian resmi pemerintah Rusia. TORFL-1 (setara B1) syarat masuk program S1, TORFL-2 (B2) untuk magister & pekerjaan profesional. Penerima beasiswa biasanya dapat 1 tahun podfak (persiapan bahasa) di Rusia — belajar duluan di sini membuat tahun itu jauh lebih ringan.",
      },
      {
        question: "Berapa lama sampai level percakapan nyaman?",
        answer:
          "A2 (percakapan sehari-hari) rata-rata 8–12 bulan dengan 2–3 sesi seminggu. B1 — level syarat kuliah — sekitar 16–20 bulan. Lebih lama dari bahasa Eropa Barat, tapi itu sudah termasuk menaklukkan kasus dan aspek.",
      },
      {
        question: "Pengajarnya native atau orang Indonesia?",
        answer:
          "Mix. Pengajar Indonesia alumni Rusia (penerima beasiswa yang sudah pulang) untuk A1–B1 — mereka paham persis kesulitan orang Indonesia. Opsi native tersedia untuk B1 ke atas.",
      },
    ],

    metaTitle: "Kursus Bahasa Rusia Online | Linguo.id — Sirilik sampai TORFL",
    metaDescription:
      "Belajar Bahasa Rusia online dari nol. Alfabet Sirilik, persiapan TORFL, beasiswa Open Doors, business Russian. Semi privat mulai Rp 95.000/sesi.",
    metaKeywords: [
      "kursus bahasa rusia",
      "les bahasa rusia online",
      "belajar bahasa rusia",
      "kursus rusia jakarta",
      "TORFL prep Indonesia",
      "beasiswa rusia open doors",
      "belajar sirilik",
      "kursus rusia online",
      "les rusia murah",
      "bahasa rusia pemula",
    ],
  },

  // ==========================================================================
  // TURKI
  // ==========================================================================
  turki: {
    urlSlug: "turki",
    languageSlug: "turkish",
    tagline: "Dari merhaba sampai TÖMER — kunci beasiswa Türkiye Bursları & drama Turki.",
    heroDescription:
      "Kursus Bahasa Turki online dengan kurikulum CEFR A1–B2 selaras TÖMER/TYS. Untuk pemburu beasiswa Türkiye Bursları, penggemar drama Turki, dan pebisnis rute Istanbul.",

    whyLearn: [
      {
        icon: "🎓",
        title: "Türkiye Bursları — Beasiswa Paling Royal",
        description:
          "Beasiswa pemerintah Turki menanggung SEMUANYA: kuliah, asrama, tiket, uang saku, plus 1 tahun kursus bahasa. Ribuan pelajar Indonesia mendaftar tiap tahun — kemampuan bahasa Turki membuat aplikasimu menonjol.",
      },
      {
        icon: "📺",
        title: "Drama Turki (Dizi) Mendunia",
        description:
          "Ertuğrul, Kurulus Osman, Yargı — dizi Turki membanjiri layar Indonesia. Nonton tanpa subtitle, paham nuansa yang hilang di terjemahan, dan belajar dari konten yang kamu tonton tiap malam.",
      },
      {
        icon: "🕌",
        title: "Bisnis, Wisata & Jembatan Dua Benua",
        description:
          "Turki hub dagang Eropa-Asia dan destinasi favorit orang Indonesia (Istanbul, Cappadocia). Importir tekstil-furnitur dan agen travel berbahasa Turki memotong perantara.",
      },
    ],

    targetAudience: [
      {
        emoji: "🎓",
        persona: "Pemburu Türkiye Bursları",
        benefit: "Nilai plus aplikasi + bekal sebelum TÖMER wajib 1 tahun di sana.",
      },
      {
        emoji: "📺",
        persona: "Penggemar Dizi Turki",
        benefit: "Belajar dari serial favorit — kosakata, budaya, dan ekspresi khas dizi.",
      },
      {
        emoji: "🛍️",
        persona: "Importir & Pebisnis Rute Turki",
        benefit: "Negosiasi dengan supplier Istanbul & Bursa: tekstil, furnitur, kosmetik.",
      },
      {
        emoji: "✈️",
        persona: "Traveler & Calon Penduduk",
        benefit: "Percakapan pasar, transportasi, birokrasi ikamet (izin tinggal).",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula (Temel 1)",
        sessionCount: 48,
        description:
          "Mulai dari nol. Alfabet Latin Turki, vokal harmoni, kalimat dasar — struktur SOV yang ternyata mirip logika bahasa daerah Indonesia.",
        topics: [
          "Alfabet: ı, ğ, ş, ç, ö, ü & pelafalannya",
          "Vokal harmoni — kunci semua akhiran Turki",
          "Kalimat SOV & kepemilikan (benim evim)",
          "Var/yok, angka, jam, belanja",
          "Perkenalan & sapaan khas Turki",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar (Temel 2)",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar dengan sistem akhiran dasar. Setara TÖMER Temel.",
        topics: [
          "Kasus: -de/-da, -e/-a, -den/-dan, -i/-ı",
          "Waktu: şimdiki, geçmiş (-di), gelecek (-ecek)",
          "Akhiran kepemilikan & rantai isim tamlaması",
          "-ki, -li, -siz dan pembentukan kata",
          "Topik: keluarga, pekerjaan, perjalanan, makanan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah (Orta)",
        sessionCount: 80,
        description:
          "Diskusi topik luas, nonton dizi dengan subtitle Turki, baca berita ringan. Setara TÖMER Orta.",
        topics: [
          "-miş: masa lampau tak langsung (kunci dizi!)",
          "Klausa relatif: -en/-an, -diği",
          "Kondisional -se/-sa & pengandaian",
          "Verba gabungan & ekspresi idiomatik",
          "Membaca berita TRT & Hürriyet ringan",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas (Yüksek)",
        sessionCount: 112,
        description:
          "Mahir untuk akademik & profesional. Persiapan TYS (Türkçe Yeterlik Sınavı) — sertifikat resmi Yunus Emre.",
        topics: [
          "Nominalisasi kompleks: -ma/-me, -iş, -dik + kasus",
          "Bahasa akademik & resmi (dilekçe, laporan)",
          "İş Türkçesi: email bisnis, presentasi, negosiasi",
          "Sastra: Orhan Pamuk & cerpen modern berpanduan",
          "Simulasi TYS: 4 keterampilan",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Bahasa Turki susah nggak buat orang Indonesia?",
        answer:
          "Lebih ramah dari yang dikira. Alfabetnya Latin, pelafalannya konsisten, tanpa gender, dan struktur akhiran-menempel (aglutinatif) mirip logika imbuhan bahasa Indonesia. Yang perlu dijinakkan cuma vokal harmoni — dan itu selesai di A1.",
      },
      {
        question: "Saya mau daftar Türkiye Bursları. Perlu bisa bahasa Turki dulu?",
        answer:
          "Tidak wajib — penerima beasiswa dapat 1 tahun TÖMER gratis di Turki. Tapi kemampuan dasar bahasa Turki membuat esai & wawancara aplikasimu jauh lebih menonjol, dan tahun TÖMER-mu di sana jadi jauh lebih ringan. Banyak siswa Linguo mulai dari A1–A2 sebelum berangkat.",
      },
      {
        question: "TÖMER dan TYS itu apa?",
        answer:
          "TÖMER adalah lembaga bahasa universitas (Ankara Üniversitesi) yang jadi standar level di Turki: Temel (A1–A2), Orta (B1), Yüksek (B2–C1). TYS adalah ujian sertifikasi resmi dari Yunus Emre Enstitüsü. Kurikulum Linguo selaras dengan keduanya.",
      },
      {
        question: "Bisa belajar dari drama Turki?",
        answer:
          "Bisa dan efektif — dizi adalah materi listening autentik dengan bahasa sehari-hari. Mulai A2 pengajar bisa memakai potongan dizi favoritmu untuk kosakata & ekspresi. Bonus: bentuk -miş yang membingungkan di buku jadi masuk akal setelah sering dengar di dizi.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Mayoritas alumni Turki — penerima Türkiye Bursları yang sudah kembali — plus opsi pengajar native. Mereka paham persis jalur beasiswa dan kehidupan di sana, jadi sekalian bisa tanya-tanya soal aplikasi.",
      },
    ],

    metaTitle: "Kursus Bahasa Turki Online | Linguo.id — A1 sampai TÖMER/TYS",
    metaDescription:
      "Belajar Bahasa Turki online dari nol. Persiapan Türkiye Bursları, TÖMER, nonton dizi tanpa subtitle. Pengajar alumni Turki, semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa turki",
      "les bahasa turki online",
      "belajar bahasa turki",
      "kursus turki jakarta",
      "turkiye burslari persiapan",
      "beasiswa turki",
      "TOMER prep",
      "kursus turki online",
      "les turki murah",
      "bahasa turki pemula",
    ],
  },

  // ==========================================================================
  // YUNANI
  // ==========================================================================
  yunani: {
    urlSlug: "yunani",
    languageSlug: "greek",
    tagline: "Dari alfa sampai omega — bahasa filsafat, pelayaran, dan Mediterania.",
    heroDescription:
      "Kursus Bahasa Yunani (Modern) online dengan kurikulum CEFR A1–B2. Untuk pelaut rute kapal Yunani, pasangan WN Yunani, studi klasik, atau cinta pada Mediterania.",

    whyLearn: [
      {
        icon: "⚓",
        title: "Armada Kapal Terbesar Dunia",
        description:
          "Yunani menguasai armada pelayaran niaga terbesar di dunia, dan ribuan pelaut Indonesia bekerja di kapal-kapal Yunani. Bahasa Yunani dasar membedakanmu di mata perwira & agen crewing.",
      },
      {
        icon: "🏛️",
        title: "Akar Ilmu & Filsafat Barat",
        description:
          "Filsafat, teologi, kedokteran, matematika — istilahnya lahir dari Yunani. Menguasainya membuka teks klasik & Perjanjian Baru, plus memperkaya pemahaman istilah akademik apa pun.",
      },
      {
        icon: "🏝️",
        title: "Hidup & Kerja di Mediterania",
        description:
          "Santorini, Athena, Thessaloniki — pariwisata Yunani haus pekerja musiman, dan komunitas pasangan Indonesia-Yunani terus tumbuh. Bahasa lokal kunci integrasi & izin tinggal.",
      },
    ],

    targetAudience: [
      {
        emoji: "⚓",
        persona: "Pelaut di Kapal Yunani",
        benefit: "Kosakata maritim, perintah dek & mesin, percakapan dengan perwira Yunani.",
      },
      {
        emoji: "💍",
        persona: "Pasangan WN Yunani",
        benefit: "Percakapan keluarga, integrasi sosial, persiapan ujian kewarganegaraan.",
      },
      {
        emoji: "📜",
        persona: "Mahasiswa Teologi & Studi Klasik",
        benefit: "Jembatan dari Yunani Modern ke Koine (Perjanjian Baru) & klasik.",
      },
      {
        emoji: "✈️",
        persona: "Traveler & Pekerja Musiman",
        benefit: "Percakapan taverna, transportasi antar-pulau, hospitality musim panas.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula (Αρχάριος)",
        sessionCount: 48,
        description:
          "Mulai dari nol. Alfabet Yunani 24 huruf tuntas cepat — separuhnya sudah kamu kenal dari matematika.",
        topics: [
          "Alfabet α–ω, diftong & aturan tekanan (τόνος)",
          "Artikel ο/η/το & tiga gender",
          "Verba dasar: είμαι, έχω, konjugasi -ω",
          "Angka, jam, belanja, taverna & kafe",
          "Perkenalan & sapaan (γεια σου, καλημέρα)",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar (Βασικός)",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar dengan kasus dasar. Setara sertifikat Ελληνομάθεια A2.",
        topics: [
          "Kasus: nominatif, akusatif, genitif praktis",
          "Aorist (lampau) & masa depan (θα)",
          "Kata kerja medio-pasif dasar (-ομαι)",
          "Pronomina objek & kepemilikan",
          "Topik: keluarga, pekerjaan, perjalanan, cuaca",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah (Μέτριος)",
        sessionCount: 80,
        description:
          "Diskusi topik luas, baca artikel ringan. Level ujian kewarganegaraan & Ελληνομάθεια B1.",
        topics: [
          "Aspek verba: imperfektif vs perfektif (kunci Yunani!)",
          "Subjunktif (να + verba) di kalimat kompleks",
          "Imperatif & permintaan sopan",
          "Membaca berita Καθημερινή ringan",
          "Simulasi Ελληνομάθεια B1",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas (Προχωρημένος)",
        sessionCount: 112,
        description:
          "Mahir untuk kerja & akademik. Persiapan Ελληνομάθεια B2 — syarat kuliah & profesi di Yunani.",
        topics: [
          "Struktur kompleks & bahasa formal (καθαρεύουσα sisa)",
          "Bahasa profesional: email, telepon, birokrasi",
          "Pengantar Koine untuk pembaca Perjanjian Baru",
          "Sastra: Kavafis, Kazantzakis berpanduan",
          "Simulasi Ελληνομάθεια B2: 4 keterampilan",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Alfabet Yunani susah?",
        answer:
          "Cuma 24 huruf, dan kamu sudah kenal separuhnya dari pelajaran matematika-fisika (α, β, π, Δ, Σ, Ω). Mayoritas siswa lancar baca dalam 2–3 sesi. Sisanya bahasa Eropa biasa — bukan aksara asing seperti Mandarin atau Arab.",
      },
      {
        question: "Yunani Modern sama Yunani kuno/Alkitab beda jauh?",
        answer:
          "Beda tapi satu garis keturunan. Kami mengajarkan Yunani Modern (yang dipakai 13 juta orang sekarang). Untuk yang tujuannya teologi, mulai B1 kami buka jembatan ke Koine — banyak kosakata & struktur Perjanjian Baru jadi terbaca setelah Modern-mu kuat.",
      },
      {
        question: "Saya pelaut, cuma butuh percakapan kerja. Ada jalur cepat?",
        answer:
          "Ada. Track maritim kami fokus ke percakapan kapal: perintah kerja dek/mesin, keselamatan, logistik pelabuhan, dan small talk dengan perwira. Target fungsional A2 dalam 6–8 bulan, tanpa mendalami tata bahasa tulis.",
      },
      {
        question: "Ελληνομάθεια itu apa?",
        answer:
          "Sertifikat resmi kemampuan bahasa Yunani dari Pusat Bahasa Yunani (ΚΕΓ), diakui untuk studi, kerja, dan kewarganegaraan. Berjenjang A1–C2; ujian kewarganegaraan setara B1. Kurikulum Linguo selaras dengan formatnya.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Yunani (alumni & diaspora yang pernah lama tinggal di Yunani) plus opsi native. Untuk track teologi, tersedia pengajar dengan latar studi klasik.",
      },
    ],

    metaTitle: "Kursus Bahasa Yunani Online | Linguo.id — Modern Greek A1–B2",
    metaDescription:
      "Belajar Bahasa Yunani online dari nol. Alfabet Yunani, percakapan Mediterania, track pelaut & teologi, persiapan Ελληνομάθεια. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa yunani",
      "les bahasa yunani online",
      "belajar bahasa yunani",
      "kursus yunani jakarta",
      "belajar alfabet yunani",
      "bahasa yunani modern",
      "kursus yunani online",
      "les yunani murah",
      "bahasa yunani alkitab",
      "yunani untuk pelaut",
    ],
  },

  // ==========================================================================
  // PORTUGIS
  // ==========================================================================
  portugis: {
    urlSlug: "portugis",
    languageSlug: "portuguese-br",
    tagline: "Dari olá sampai Celpe-Bras — bahasa 260 juta penutur, Brasil sampai Timor Leste.",
    heroDescription:
      "Kursus Bahasa Portugis online dengan kurikulum CEFR A1–B2. Fokus Portugis Brasil (Celpe-Bras) dengan opsi Portugal (CAPLE) — untuk karier Timor Leste, bisnis Brasil, dan diaspora Lusofonia.",

    whyLearn: [
      {
        icon: "🇹🇱",
        title: "Timor Leste di Depan Pintu",
        description:
          "Bahasa resmi tetangga terdekat kita. NGO, kontraktor, guru, dan bisnis Indonesia di Dili sangat butuh penutur Portugis — kombinasi paspor Indonesia + Portugis itu langka dan dicari.",
      },
      {
        icon: "🌎",
        title: "Brasil — Raksasa 215 Juta Orang",
        description:
          "Ekonomi terbesar Amerika Latin, sesama anggota forum negara berkembang dengan Indonesia. Perdagangan komoditas, penerbangan (Embraer), dan sepak bola — semua berbahasa Portugis.",
      },
      {
        icon: "⚽",
        title: "Musik, Bola & Budaya Lusofonia",
        description:
          "Bossa nova, samba, kapoeira, liga Brasil, telenovela — plus 9 negara Lusofonia dari Angola sampai Makau. Satu bahasa, empat benua.",
      },
    ],

    targetAudience: [
      {
        emoji: "🇹🇱",
        persona: "Pekerja NGO & Bisnis di Timor Leste",
        benefit: "Portugis praktis Dili: dokumen resmi, rapat, negosiasi lokal.",
      },
      {
        emoji: "💼",
        persona: "Profesional Rute Brasil",
        benefit: "Business Portuguese: trade komoditas, email, presentasi, WhatsApp bisnis.",
      },
      {
        emoji: "🎓",
        persona: "Pelajar Persiapan Celpe-Bras / CAPLE",
        benefit: "Track ujian resmi Brasil (Celpe-Bras) atau Portugal (DIPLE) dengan mock test.",
      },
      {
        emoji: "🎵",
        persona: "Penikmat Musik & Bola Brasil",
        benefit: "Paham lirik bossa nova & funk, komentar bola, kapoeira tanpa penerjemah.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Iniciante",
        sessionCount: 48,
        description:
          "Mulai dari nol. Pelafalan Brasil yang musikal, kalimat dasar, percakapan sehari-hari sejak sesi pertama.",
        topics: [
          "Pelafalan: nasal ão/õe, lh/nh, r Brasil vs Portugal",
          "Artikel o/a & gender, plural",
          "Ser vs estar + konjugasi -ar, -er, -ir",
          "Angka, jam, belanja, restoran",
          "Perkenalan & sapaan (tudo bem?)",
        ],
      },
      {
        level: "A2",
        title: "A2 — Básico",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar dengan struktur dasar lengkap.",
        topics: [
          "Pretérito perfeito vs imperfeito",
          "Futuro & ir + infinitivo",
          "Pronomina objek & refleksif (gaya Brasil)",
          "Pembanding & superlatif",
          "Topik: perjalanan, pekerjaan, keluarga, makanan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Intermediário",
        sessionCount: 80,
        description:
          "Diskusi topik luas, baca artikel ringan, nonton konten Brasil dengan subtitle Portugis.",
        topics: [
          "Subjuntivo presente: kapan wajib",
          "Condicional & pengandaian",
          "Perbedaan Brasil vs Portugal vs Timor (você/tu)",
          "Membaca Globo & Folha level ringan",
          "Percakapan formal vs informal (registro)",
        ],
      },
      {
        level: "B2",
        title: "B2 — Avançado",
        sessionCount: 112,
        description:
          "Mahir untuk kerja & akademik. Persiapan Celpe-Bras (Brasil) atau DIPLE B2 (Portugal).",
        topics: [
          "Subjuntivo imperfeito & futuro do subjuntivo",
          "Português profissional: email, rapat, laporan",
          "Bahasa resmi Timor Leste: dokumen & administrasi",
          "Sastra & media: Paulo Coelho, Saramago berpanduan",
          "Simulasi Celpe-Bras: tarefas terpadu",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Portugis Brasil atau Portugal — Linguo ngajarin yang mana?",
        answer:
          "Default kami Portugis Brasil — penuturnya 20x lebih banyak dan materinya melimpah. Tapi keduanya saling paham, dan untuk tujuan Timor Leste (yang standarnya Eropa) atau CAPLE, pengajar menyesuaikan ejaan & pelafalan Eropa. Bilang tujuanmu di awal, kami arahkan.",
      },
      {
        question: "Saya bisa bahasa Spanyol. Portugis bakal cepat?",
        answer:
          "Sangat — kosakata beririsan ~85%. Tantangannya justru pelafalan (nasal & vokal tertutup Portugis lebih kaya) dan 'false friends'. Siswa berlatar Spanyol biasanya memangkas A1–A2 sampai separuh waktu.",
      },
      {
        question: "Celpe-Bras itu apa?",
        answer:
          "Sertifikat resmi pemerintah Brasil, syarat kuliah di universitas Brasil (termasuk beasiswa PEC-G/PEC-PG) dan validasi profesi. Formatnya unik — berbasis tugas terpadu, bukan pilihan ganda — jadi latihannya harus spesifik, dan itu ada di track B2 kami.",
      },
      {
        question: "Untuk kerja di Timor Leste, level berapa yang cukup?",
        answer:
          "B1 sudah sangat fungsional untuk rapat dan dokumen rutin — apalagi Tetun (bahasa sehari-hari di sana) menyerap banyak kosakata Portugis, jadi B1 Portugis membuat Tetun-mu ikut jalan. Untuk dokumen legal & laporan resmi, targetkan B2.",
      },
      {
        question: "Pengajarnya native atau orang Indonesia?",
        answer:
          "Mix — pengajar Indonesia yang fasih (beberapa berpengalaman kerja di Timor Leste) dan opsi native Brasil. Grammar dijelaskan dalam Bahasa Indonesia di level awal.",
      },
    ],

    metaTitle: "Kursus Bahasa Portugis Online | Linguo.id — Brasil & Timor Leste",
    metaDescription:
      "Belajar Bahasa Portugis online dari nol. Portugis Brasil & Eropa, persiapan Celpe-Bras, karier Timor Leste, bisnis Brasil. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa portugis",
      "les bahasa portugis online",
      "belajar bahasa portugis",
      "kursus portugis jakarta",
      "bahasa portugis timor leste",
      "celpe-bras prep",
      "portugis brasil",
      "kursus portugis online",
      "les portugis murah",
      "bahasa portugis pemula",
    ],
  },
  // ==========================================================================
  // THAILAND
  // ==========================================================================
  thailand: {
    urlSlug: "thailand",
    languageSlug: "thai",
    tagline: "Dari sawasdee sampai baca aksara Thai — bahasa tetangga ASEAN 70 juta penutur.",
    heroDescription:
      "Kursus Bahasa Thailand online dengan kurikulum A1–B2. Lima nada, aksara Thai, percakapan Bangkok sehari-hari — untuk bisnis ASEAN, penggemar drama Thai, dan yang bolak-balik Thailand.",

    whyLearn: [
      {
        icon: "📺",
        title: "Drama Thai & T-Pop Meledak",
        description:
          "Series Thailand (GMMTV, F4 Thailand, KinnPorsche) dan T-pop punya fandom raksasa di Indonesia. Nonton tanpa menunggu subtitle dan paham wordplay yang hilang di terjemahan.",
      },
      {
        icon: "💼",
        title: "Ekonomi #2 ASEAN",
        description:
          "Thailand pusat otomotif, pariwisata, dan F&B Asia Tenggara. Bisnis Indonesia-Thailand terus tumbuh, tapi orang Thailand terkenal kurang nyaman berbahasa Inggris — bahasa lokal jadi pembeda nyata.",
      },
      {
        icon: "✈️",
        title: "Destinasi Bolak-Balik Favorit",
        description:
          "Bangkok, Chiang Mai, Phuket — orang Indonesia ke Thailand jutaan kunjungan per tahun, plus komunitas digital nomad. Bahasa Thai dasar mengubah pengalaman dari turis jadi 'orang dalam'.",
      },
    ],

    targetAudience: [
      {
        emoji: "📺",
        persona: "Penggemar Series Thai & T-Pop",
        benefit: "Belajar dari series favorit — bahasa gaul Bangkok, partikel ka/krub.",
      },
      {
        emoji: "💼",
        persona: "Profesional & Pebisnis Rute Thailand",
        benefit: "Negosiasi supplier, F&B, otomotif — dengan etiket bisnis Thai (kreng jai).",
      },
      {
        emoji: "✈️",
        persona: "Traveler & Digital Nomad",
        benefit: "Percakapan pasar, tawar-menawar, street food, transportasi.",
      },
      {
        emoji: "🎓",
        persona: "Pelajar Pertukaran & Beasiswa Thailand",
        benefit: "Persiapan kuliah/exchange di Chula, Mahidol, Thammasat.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula (Nada & Percakapan Dasar)",
        sessionCount: 48,
        description:
          "Mulai dari nol dengan romanisasi + nada yang benar sejak awal, lalu pelan-pelan masuk aksara Thai.",
        topics: [
          "5 nada Thai: drill minimal pairs sampai otomatis",
          "Partikel sopan ka/krub & struktur kalimat dasar",
          "Angka, jam, harga, tawar-menawar",
          "Makanan & street food — kosakata survival #1",
          "Aksara Thai tahap 1: konsonan kelas menengah",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar (Melek Aksara)",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar dan mulai membaca aksara Thai secara mandiri.",
        topics: [
          "Aksara lengkap: 44 konsonan, vokal, aturan nada",
          "Classifier (kata bantu bilangan) umum",
          "Kata kerja serial & aspek (แล้ว, กำลัง, จะ)",
          "Topik: perjalanan, pekerjaan, keluarga, kesehatan",
          "Membaca menu, rambu, chat sederhana",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah",
        sessionCount: 80,
        description:
          "Diskusi topik luas, nonton series dengan subtitle Thai, baca berita ringan.",
        topics: [
          "Register formal vs informal vs gaul Bangkok",
          "Struktur kompleks: ที่, ซึ่ง, ให้",
          "Idiom & ekspresi series Thai populer",
          "Membaca berita Thairath level ringan",
          "Percakapan telepon & layanan (bank, imigrasi)",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas",
        sessionCount: 112,
        description:
          "Mahir untuk kerja & akademik — termasuk register formal dan bahasa media.",
        topics: [
          "Bahasa formal & kata serapan Pali-Sanskerta",
          "Business Thai: rapat, email, presentasi",
          "Ragam kerajaan (ราชาศัพท์) — pengenalan untuk media",
          "Membaca koran & dokumen resmi",
          "Diskusi budaya, ekonomi & isu ASEAN",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "5 nada Thai susah nggak? Salah nada fatal?",
        answer:
          "Nada memang pembeda makna (maa bisa 'anjing', 'kuda', atau 'datang'), tapi konteks sering menyelamatkan. Kami drill nada lewat pasangan kata sejak sesi pertama sampai otomatis — rata-rata siswa stabil dalam 2–3 bulan. Bonus: grammar Thai sangat sederhana, tanpa konjugasi & tanpa tenses rumit.",
      },
      {
        question: "Perlu belajar aksara Thai atau cukup romanisasi?",
        answer:
          "Awalnya boleh romanisasi biar cepat ngomong, tapi kami masukkan aksara bertahap sejak A1 akhir — karena romanisasi Thai tidak standar dan justru menyesatkan pelafalan. Melek aksara juga membuka menu, rambu, dan subtitle asli.",
      },
      {
        question: "Berapa lama sampai bisa ngobrol di Bangkok?",
        answer:
          "Percakapan fungsional turis (pesan makanan, tawar-menawar, arah) bisa dicapai dalam 3–4 bulan. Percakapan sehari-hari yang nyaman (A2) rata-rata 8–12 bulan dengan 2–3 sesi seminggu.",
      },
      {
        question: "Bahasa Thai mirip bahasa Indonesia?",
        answer:
          "Beda rumpun, tapi ada bonus: struktur SVO sama seperti Indonesia, tanpa perubahan bentuk kata, dan banyak kosakata serapan Sanskerta yang sama-sama kita punya (wela–wela/waktu, phasa–bahasa, racha–raja). Orang Indonesia biasanya lebih cepat dari pembelajar Barat.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Thai (alumni & eks-pekerja Thailand) plus opsi native Thai. Untuk penggemar series, ada pengajar yang memang memakai materi GMMTV sebagai bahan ajar.",
      },
    ],

    metaTitle: "Kursus Bahasa Thailand Online | Linguo.id — Nada, Aksara, Percakapan",
    metaDescription:
      "Belajar Bahasa Thailand online dari nol. 5 nada, aksara Thai, percakapan Bangkok, bisnis ASEAN. Pengajar berpengalaman, semi privat mulai Rp 95.000/sesi.",
    metaKeywords: [
      "kursus bahasa thailand",
      "les bahasa thailand online",
      "belajar bahasa thailand",
      "kursus bahasa thai",
      "belajar bahasa thai",
      "kursus thailand jakarta",
      "les thai murah",
      "belajar aksara thai",
      "bahasa thailand pemula",
      "kursus thai online",
    ],
  },

  // ==========================================================================
  // VIETNAM
  // ==========================================================================
  vietnam: {
    urlSlug: "vietnam",
    languageSlug: "vietnamese",
    tagline: "Dari xin chào sampai negosiasi pabrik — bahasa ekonomi paling panas di ASEAN.",
    heroDescription:
      "Kursus Bahasa Vietnam online dengan kurikulum A1–B2. Enam nada, huruf Latin (tanpa aksara baru!), percakapan Hanoi & Saigon — untuk profesional manufaktur, investor, dan penjelajah ASEAN.",

    whyLearn: [
      {
        icon: "🏭",
        title: "Pabrik Dunia yang Baru",
        description:
          "Samsung, Nike, Apple supplier — manufaktur global pindah ke Vietnam, dan perusahaan Indonesia ikut ekspansi. Manajer & QC yang bisa bahasa Vietnam adalah aset langka bergaji premium.",
      },
      {
        icon: "📈",
        title: "Ekonomi Tumbuh Tercepat ASEAN",
        description:
          "Vietnam konsisten tumbuh 6–7% per tahun. Perdagangan Indonesia-Vietnam terus naik, dan orang Vietnam jauh lebih nyaman bernegosiasi dalam bahasanya sendiri.",
      },
      {
        icon: "✍️",
        title: "Tanpa Aksara Baru",
        description:
          "Satu-satunya bahasa nada besar di Asia yang ditulis huruf Latin (chữ Quốc ngữ). Kamu bisa membaca sejak hari pertama — energi belajar full ke nada dan kosakata.",
      },
    ],

    targetAudience: [
      {
        emoji: "🏭",
        persona: "Profesional Manufaktur di Vietnam",
        benefit: "Kosakata pabrik, QC, HR — komunikasi dengan tim lokal Bac Ninh/Binh Duong.",
      },
      {
        emoji: "💼",
        persona: "Investor & Pebisnis Rute Vietnam",
        benefit: "Negosiasi supplier, etiket bisnis, WhatsApp/Zalo bisnis.",
      },
      {
        emoji: "✈️",
        persona: "Traveler & Digital Nomad",
        benefit: "Street food, tawar-menawar, Grab & kehidupan sehari-hari Da Nang-Saigon.",
      },
      {
        emoji: "🎓",
        persona: "Pelajar & Peneliti ASEAN",
        benefit: "Bekal exchange, riset lapangan, dan studi kawasan Asia Tenggara.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula (Nada & Dasar)",
        sessionCount: 48,
        description:
          "Mulai dari nol. Enam nada dengan drill sistematis, ejaan Quốc ngữ, kalimat dasar sehari-hari.",
        topics: [
          "6 nada + tanda diakritik: drill minimal pairs",
          "Ejaan: đ, ơ, ư, â dan konsonan ng-/nh-/tr-",
          "Kata ganti sapaan (anh/chị/em) — kunci sopan santun",
          "Angka, harga, tawar-menawar, makanan",
          "Perkenalan & percakapan warung kopi",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar dengan struktur dasar lengkap.",
        topics: [
          "Classifier (cái, con, chiếc) umum",
          "Aspek: đã, đang, sẽ, rồi",
          "Pembanding & superlatif (hơn, nhất)",
          "Perbedaan aksen Hanoi vs Saigon",
          "Topik: pekerjaan, keluarga, perjalanan, kesehatan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah",
        sessionCount: 80,
        description:
          "Diskusi topik luas, baca berita ringan, percakapan kerja sehari-hari di kantor/pabrik.",
        topics: [
          "Struktur kompleks: mà, thì, là, bị/được (pasif)",
          "Kosakata kerja: manufaktur, logistik, HR",
          "Idiom & ekspresi sehari-hari",
          "Membaca VnExpress level ringan",
          "Percakapan telepon & rapat singkat",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas",
        sessionCount: 112,
        description:
          "Mahir untuk bisnis & akademik. Bahasa formal, kontrak, dan media Vietnam.",
        topics: [
          "Bahasa formal & kata serapan Hán-Việt",
          "Business Vietnamese: negosiasi, kontrak, email",
          "Membaca koran Tuổi Trẻ & dokumen resmi",
          "Presentasi & rapat penuh dalam bahasa Vietnam",
          "Budaya bisnis: hierarki, gift-giving, quan hệ",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "6 nada Vietnam lebih susah dari 4 nada Mandarin?",
        answer:
          "Jumlahnya lebih banyak tapi ada kompensasi besar: nadanya TERTULIS di setiap kata (dấu sắc, huyền, hỏi…), jadi kamu tak pernah menebak. Ditambah tulisan Latin dan grammar tanpa konjugasi, banyak siswa justru merasa Vietnam lebih cepat 'jalan' daripada Mandarin.",
      },
      {
        question: "Belajar aksen Hanoi atau Saigon?",
        answer:
          "Kami default ke Hanoi (standar nasional, dipakai media & dokumen), lalu kenalkan perbedaan Saigon mulai A2 — penting karena kawasan industri selatan (Binh Duong, Dong Nai) beraksen selatan. Kalau penempatanmu jelas di selatan, bilang di awal, pengajar menyesuaikan.",
      },
      {
        question: "Berapa lama sampai bisa dipakai kerja di pabrik/kantor Vietnam?",
        answer:
          "Percakapan operasional dasar (instruksi kerja, small talk tim) bisa dicapai di A2 — rata-rata 8–10 bulan. Untuk rapat & negosiasi penuh, targetkan B1–B2. Banyak siswa kami belajar sambil sudah ditempatkan, materinya langsung dari kasus harian mereka.",
      },
      {
        question: "Ada kemiripan dengan bahasa Indonesia?",
        answer:
          "Struktur dasarnya sama-sama SVO tanpa perubahan bentuk kata — pola pikirnya familiar. Kata ganti orangnya saja yang lebih kaya (anh/chị/em tergantung umur relatif), dan itu kami latih sejak awal karena menentukan kesopanan.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Vietnam (alumni & eks-ekspatriat Vietnam) plus opsi native. Untuk track manufaktur, tersedia pengajar berpengalaman kerja di kawasan industri Vietnam.",
      },
    ],

    metaTitle: "Kursus Bahasa Vietnam Online | Linguo.id — Percakapan & Bisnis",
    metaDescription:
      "Belajar Bahasa Vietnam online dari nol. 6 nada, huruf Latin, percakapan Hanoi & Saigon, bahasa untuk manufaktur & bisnis. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa vietnam",
      "les bahasa vietnam online",
      "belajar bahasa vietnam",
      "kursus vietnam jakarta",
      "bahasa vietnam bisnis",
      "kursus vietnam online",
      "les vietnam murah",
      "bahasa vietnam pemula",
      "kerja di vietnam",
      "bahasa vietnam percakapan",
    ],
  },

  // ==========================================================================
  // HINDI
  // ==========================================================================
  hindi: {
    urlSlug: "hindi",
    languageSlug: "hindi",
    tagline: "Dari namaste sampai Devanagari — bahasa 600 juta penutur dan layar Bollywood.",
    heroDescription:
      "Kursus Bahasa Hindi online dengan kurikulum A1–B2. Aksara Devanagari, percakapan sehari-hari, bahasa Bollywood — untuk bisnis India, penggemar film, dan penjelajah Asia Selatan.",

    whyLearn: [
      {
        icon: "🎬",
        title: "Bollywood & Musiknya",
        description:
          "Shah Rukh Khan, lagu-lagu Arijit Singh, serial India yang membanjiri TV Indonesia — pahami dialog dan lirik tanpa subtitle. Fandom Bollywood Indonesia itu besar dan multigenerasi.",
      },
      {
        icon: "📈",
        title: "Ekonomi Terbesar #3 Dunia (Segera)",
        description:
          "India lintasan pertumbuhan tercepat di antara ekonomi besar — IT, farmasi, otomotif (Tata, Bajaj masuk Indonesia). Hindi membuka pasar raksasa yang bahasa Inggrisnya hanya lapisan atas.",
      },
      {
        icon: "🕉️",
        title: "Akar Budaya yang Sama",
        description:
          "Ratusan kosakata Sanskerta hidup di bahasa Indonesia: guru, dosa, surga, bahasa, negara. Belajar Hindi terasa seperti menemukan sepupu jauh — plus membuka teks yoga, filsafat & sejarah.",
      },
    ],

    targetAudience: [
      {
        emoji: "🎬",
        persona: "Penggemar Bollywood & Serial India",
        benefit: "Belajar dari film & lagu favorit — dialog, lirik, budaya di baliknya.",
      },
      {
        emoji: "💼",
        persona: "Profesional & Pebisnis Rute India",
        benefit: "Negosiasi, hospitality untuk turis India (pasar besar Bali!), trade.",
      },
      {
        emoji: "🧘",
        persona: "Praktisi Yoga & Studi Budaya",
        benefit: "Devanagari untuk istilah yoga & teks, jembatan ke Sanskerta dasar.",
      },
      {
        emoji: "✈️",
        persona: "Traveler Asia Selatan",
        benefit: "India, Nepal (aksara sama!) — pasar, kereta, tawar-menawar.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula (Devanagari & Dasar)",
        sessionCount: 48,
        description:
          "Mulai dari nol. Aksara Devanagari sistematis, pelafalan retrofleks, kalimat dasar sehari-hari.",
        topics: [
          "Devanagari: vokal, konsonan, matra & konjungta umum",
          "Bunyi khas: retrofleks vs dental, aspirasi",
          "Struktur SOV & postposisi (में, पर, से, को)",
          "Gender kata benda & kesesuaian dasar",
          "Perkenalan, angka, belanja, makanan",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar. Mulai memahami dialog film sederhana.",
        topics: [
          "Waktu lampau, sekarang, depan + kesesuaian gender",
          "Ergatif ने — kunci lampau Hindi",
          "Kata kerja majemuk (compound verbs) umum",
          "Tingkat kesopanan: तू/तुम/आप",
          "Topik: keluarga, perjalanan, pekerjaan, cuaca",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah",
        sessionCount: 80,
        description:
          "Diskusi topik luas, nonton film dengan subtitle Hindi, baca berita ringan.",
        topics: [
          "Subjunktif & pengandaian",
          "Partisipial & klausa relatif (जो…वह)",
          "Perbedaan Hindi-Urdu & kosakata Persia-Arab",
          "Idiom Bollywood & bahasa gaul Mumbai",
          "Membaca berita BBC Hindi level ringan",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas",
        sessionCount: 112,
        description:
          "Mahir untuk bisnis, media & sastra. Register formal (shuddh Hindi) dan percakapan profesional.",
        topics: [
          "Register: shuddh Hindi vs Hindustani percakapan",
          "Business Hindi: rapat, presentasi, email",
          "Membaca koran Dainik Jagran & sastra ringan (Premchand)",
          "Kosakata Sanskerta formal untuk media & pidato",
          "Diskusi budaya, ekonomi & politik Asia Selatan",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Devanagari susah nggak?",
        answer:
          "Sistematis banget — setiap huruf satu bunyi, tanpa ejaan tidak konsisten ala Inggris. Rata-rata siswa lancar baca dalam 4–6 sesi. Aksara ini juga dipakai bahasa Nepal & Marathi dan jadi jembatan ke Sanskerta.",
      },
      {
        question: "Orang India kan bisa bahasa Inggris. Ngapain belajar Hindi?",
        answer:
          "Bahasa Inggris fasih hanya di lapisan atas (~10%). Pasar riil — mitra dagang menengah, staf lapangan, turis India di Bali — jauh lebih nyaman ber-Hindi. Dan seperti di mana pun, berbicara bahasa lawan bicara mengubah relasi bisnis.",
      },
      {
        question: "Hindi dan Urdu itu sama?",
        answer:
          "Dalam percakapan sehari-hari nyaris sama (Hindustani) — kamu otomatis memahami keduanya. Bedanya aksara (Devanagari vs Arab-Persia) dan kosakata formal. Bonus: film Bollywood memakai spektrum keduanya, dan kami bahas ini mulai B1.",
      },
      {
        question: "Berapa lama sampai paham film Bollywood tanpa subtitle?",
        answer:
          "Dialog drama sehari-hari mulai 'nyambung' di akhir A2 (10–12 bulan). Film dengan dialog cepat, wordplay, atau kosakata Urdu puitis butuh B1–B2. Lagu biasanya lebih cepat dipahami karena repetitif.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Hindi (alumni studi India & diaspora) plus opsi native. Untuk penggemar Bollywood, materinya bisa langsung dari film pilihan kamu.",
      },
    ],

    metaTitle: "Kursus Bahasa Hindi Online | Linguo.id — Devanagari & Bollywood",
    metaDescription:
      "Belajar Bahasa Hindi online dari nol. Aksara Devanagari, percakapan sehari-hari, bahasa Bollywood, business Hindi. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa hindi",
      "les bahasa hindi online",
      "belajar bahasa hindi",
      "kursus hindi jakarta",
      "belajar devanagari",
      "bahasa india",
      "belajar bahasa india",
      "kursus hindi online",
      "les hindi murah",
      "bahasa hindi pemula",
    ],
  },

  // ==========================================================================
  // JAWA
  // ==========================================================================
  jawa: {
    urlSlug: "jawa",
    languageSlug: "javanese",
    tagline: "Ngoko, Krama, Krama Inggil — bahasa ibu 80 juta orang, warisan yang hidup.",
    heroDescription:
      "Kursus Bahasa Jawa online dengan kurikulum berjenjang. Unggah-ungguh (tingkat tutur), aksara Jawa, sampai budaya di baliknya — untuk pendatang, generasi diaspora, dan pecinta budaya.",

    whyLearn: [
      {
        icon: "🏠",
        title: "Bahasa Ibu Terbesar di Indonesia",
        description:
          "80+ juta penutur dari Banten sampai Banyuwangi (plus Suriname!). Pindah kerja ke Jawa, menikah dengan orang Jawa, atau melayani pelanggan Jawa — bahasa ini membuka hati, bukan cuma percakapan.",
      },
      {
        icon: "🎭",
        title: "Unggah-Ungguh: Kesopanan yang Berlapis",
        description:
          "Ngoko, Krama, Krama Inggil — sistem tingkat tutur yang menakjubkan sekaligus menakutkan pendatang. Salah tingkat bisa terasa tidak sopan; menguasainya adalah bentuk penghormatan tertinggi.",
      },
      {
        icon: "📜",
        title: "Warisan yang Perlu Penerus",
        description:
          "Aksara Jawa (Hanacaraka), tembang macapat, wayang, serat klasik — kekayaan literatur Jawa berusia berabad-abad. Generasi muda diaspora Jawa banyak yang paham pasif tapi tak bisa menjawab; kelas ini jembatannya.",
      },
    ],

    targetAudience: [
      {
        emoji: "🏢",
        persona: "Pendatang yang Kerja/Kuliah di Jawa",
        benefit: "Bertahan & diterima: percakapan pasar, tetangga, kantor di Jogja-Solo-Semarang.",
      },
      {
        emoji: "💍",
        persona: "Menantu & Pasangan Orang Jawa",
        benefit: "Krama yang benar untuk mertua & acara keluarga — kesan pertama menentukan.",
      },
      {
        emoji: "🌏",
        persona: "Generasi Diaspora Jawa",
        benefit: "Dari paham pasif jadi aktif bicara — termasuk diaspora Suriname & Malaysia.",
      },
      {
        emoji: "🎭",
        persona: "Pecinta Budaya & Seniman",
        benefit: "Aksara Jawa, tembang, wayang — masuk ke sumber aslinya.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "Tingkat 1 — Ngoko Dasar",
        sessionCount: 48,
        description:
          "Mulai dari nol dengan ngoko (ragam akrab) — fondasi kosakata & struktur sebelum naik ke krama.",
        topics: [
          "Pelafalan khas: a jejeg/miring, dha-tha retrofleks",
          "Kosakata inti ngoko & struktur kalimat",
          "Angka, pasaran (Pon, Wage, Kliwon), waktu",
          "Percakapan pasar, warung, tetangga",
          "Peta dialek: Jogja-Solo vs Banyumasan vs Suroboyoan",
        ],
      },
      {
        level: "A2",
        title: "Tingkat 2 — Krama Madya & Sopan Santun",
        sessionCount: 64,
        description: "Naik tingkat tutur: krama untuk orang yang dihormati, plus kapan memakai apa.",
        topics: [
          "Krama madya: kosakata paralel ngoko→krama",
          "Unggah-ungguh: peta kapan ngoko/krama dipakai",
          "Percakapan dengan orang tua & atasan",
          "Ater-ater & panambang (imbuhan Jawa)",
          "Situasi keluarga: lamaran, kenduri, lebaran",
        ],
      },
      {
        level: "B1",
        title: "Tingkat 3 — Krama Inggil & Aksara",
        sessionCount: 80,
        description:
          "Krama inggil untuk penghormatan tertinggi, dan mulai membaca-menulis aksara Jawa.",
        topics: [
          "Krama inggil: kosakata kehormatan (dhahar, sare, tindak)",
          "Aksara Jawa: carakan, pasangan, sandhangan",
          "Pidato ringan (sesorah) & MC acara keluarga",
          "Paribasan, bebasan, saloka (peribahasa)",
          "Membaca teks aksara Jawa sederhana",
        ],
      },
      {
        level: "B2",
        title: "Tingkat 4 — Sastra & Budaya",
        sessionCount: 112,
        description:
          "Masuk ke khazanah: tembang macapat, serat klasik, bahasa pedalangan.",
        topics: [
          "Tembang macapat: Pangkur, Sinom, Dhandhanggula",
          "Membaca serat klasik berpanduan (Wedhatama, Wulangreh)",
          "Bahasa pedalangan & wayang",
          "Sesorah formal: pranatacara pernikahan",
          "Kawi & kosakata sastra lama — pengenalan",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Saya paham bahasa Jawa tapi nggak berani ngomong. Mulai dari mana?",
        answer:
          "Profil paling umum — 'penutur pasif'. Lewat placement kami biasanya lompati materi kosakata dasar dan langsung fokus ke produksi lisan & unggah-ungguh, karena biasanya yang bikin tak berani justru takut salah tingkat tutur, bukan tak tahu kata.",
      },
      {
        question: "Ngoko, krama, krama inggil — wajib kuasai semuanya?",
        answer:
          "Bertahap. Ngoko dulu sebagai fondasi (strukturnya sama), lalu krama untuk situasi hormat, dan krama inggil menyusul untuk kata-kata kunci. Dalam praktik sehari-hari, krama madya yang benar saja sudah sangat dihargai.",
      },
      {
        question: "Dialeknya yang mana? Saya butuh Suroboyoan, bukan Jogja.",
        answer:
          "Standar pengajaran kami Jogja-Solo (baku sekolah & media), tapi kami petakan perbedaan Banyumasan (ngapak) dan Suroboyoan sejak awal. Kalau kebutuhanmu spesifik arek Suroboyo, bilang di awal — ada pengajar penutur aslinya.",
      },
      {
        question: "Aksara Jawa dipelajari juga?",
        answer:
          "Ya, mulai tingkat 3 — setelah bahasanya jalan. Hanacaraka itu sistematis (20 aksara + sandhangan) dan biasanya tuntas dibaca-tulis dalam 8–10 sesi. Untuk yang khusus mau aksara saja, bisa diatur sebagai track terpisah.",
      },
      {
        question: "Anak saya besar di Jakarta, nggak bisa bahasa Jawa sama sekali. Bisa ikut?",
        answer:
          "Justru banyak siswa kami begitu — generasi kedua-ketiga yang ingin nyambung lagi dengan kakek-nenek. Kurikulum dari nol memakai pengantar Bahasa Indonesia, dan materi disesuaikan konteks keluarga masing-masing.",
      },
    ],

    metaTitle: "Kursus Bahasa Jawa Online | Linguo.id — Ngoko, Krama, Aksara Jawa",
    metaDescription:
      "Belajar Bahasa Jawa online: ngoko, krama, krama inggil, aksara Jawa, tembang. Untuk pendatang, menantu, & generasi diaspora. Semi privat mulai Rp 75.000/sesi.",
    metaKeywords: [
      "kursus bahasa jawa",
      "les bahasa jawa online",
      "belajar bahasa jawa",
      "belajar krama inggil",
      "belajar aksara jawa",
      "kursus bahasa jawa krama",
      "les bahasa jawa",
      "bahasa jawa halus",
      "belajar unggah ungguh",
      "kursus jawa online",
    ],
  },

  // ==========================================================================
  // SUNDA
  // ==========================================================================
  sunda: {
    urlSlug: "sunda",
    languageSlug: "sundanese",
    tagline: "Loma jeung lemes — bahasa 40 juta urang Pasundan, dari Bandung sampai Banten.",
    heroDescription:
      "Kursus Bahasa Sunda online dengan kurikulum berjenjang. Undak usuk basa (tingkat tutur), percakapan sehari-hari Bandung, sampai kawih dan budayanya — untuk pendatang dan generasi muda Sunda.",

    whyLearn: [
      {
        icon: "🏙️",
        title: "Bertahan & Diterima di Tatar Sunda",
        description:
          "Bandung magnet mahasiswa & pekerja se-Indonesia, tapi pergaulan sehari-harinya berbahasa Sunda. Paham basa Sunda mengubahmu dari 'urang mana' jadi bagian tongkrongan.",
      },
      {
        icon: "🗣️",
        title: "Undak Usuk: Halus Itu Seni",
        description:
          "Basa lemes untuk yang dihormati, loma untuk teman — salah pakai bisa terasa kasar tanpa kamu sadar. Sistem tingkat tutur Sunda lebih ramping dari Jawa, tapi tetap perlu dipelajari dengan benar.",
      },
      {
        icon: "🎶",
        title: "Budaya yang Kaya & Hidup",
        description:
          "Kawih, pupuh, angklung, wayang golek, sampai stand-up Sunda dan konten kreator Bandung yang meledak di sosmed. Bahasanya adalah pintu masuk semua itu.",
      },
    ],

    targetAudience: [
      {
        emoji: "🎓",
        persona: "Mahasiswa & Pekerja Pendatang di Bandung",
        benefit: "Percakapan kampus, kosan, angkot, pasar — cepat membaur.",
      },
      {
        emoji: "💍",
        persona: "Menantu & Pasangan Urang Sunda",
        benefit: "Basa lemes yang benar untuk mertua & acara keluarga.",
      },
      {
        emoji: "🌏",
        persona: "Generasi Muda Sunda Perantauan",
        benefit: "Dari ngerti-tapi-jawab-Indonesia jadi aktif nyunda.",
      },
      {
        emoji: "🎙️",
        persona: "Kreator Konten & Pekerja Kreatif",
        benefit: "Humor Sunda, punchline, dan register gaul Bandung yang otentik.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "Tingkat 1 — Loma Dasar",
        sessionCount: 48,
        description:
          "Mulai dari nol dengan basa loma (ragam akrab) — kosakata inti dan kalimat sehari-hari.",
        topics: [
          "Pelafalan khas: eu (peuyeum!), é vs e",
          "Kosakata inti & struktur kalimat dasar",
          "Angka, waktu, belanja, kuliner Sunda",
          "Percakapan warung, angkot, tongkrongan",
          "Kecap panganteb & partikel khas (mah, téh, atuh, euy)",
        ],
      },
      {
        level: "A2",
        title: "Tingkat 2 — Lemes & Sopan Santun",
        sessionCount: 64,
        description: "Undak usuk basa: lemes untuk orang yang dihormati, dan kapan memakainya.",
        topics: [
          "Kosakata paralel loma→lemes (dahar→tuang, saré→kulem)",
          "Lemes keur sorangan vs keur batur",
          "Percakapan dengan orang tua & atasan",
          "Rarangkén (imbuhan) produktif",
          "Situasi keluarga: nganjang, lamaran, lebaran",
        ],
      },
      {
        level: "B1",
        title: "Tingkat 3 — Percakapan Mahir",
        sessionCount: 80,
        description:
          "Diskusi topik luas, paham humor Sunda, baca teks & konten media Sunda.",
        topics: [
          "Paribasa & babasan (peribahasa Sunda)",
          "Humor Sunda: heureuy, plesetan, bodor",
          "Membaca Mangle & konten kreator Sunda",
          "Biantara (pidato) ringan & MC acara",
          "Perbedaan dialek: Priangan vs Banten vs Cirebonan",
        ],
      },
      {
        level: "B2",
        title: "Tingkat 4 — Sastra & Budaya",
        sessionCount: 112,
        description:
          "Masuk khazanah: pupuh, kawih, carita pantun, dan aksara Sunda.",
        topics: [
          "Pupuh 17 & kawih klasik (Kinanti, Asmarandana)",
          "Aksara Sunda baku: baca-tulis",
          "Carita pantun & sastra Sunda modern (Ajip Rosidi)",
          "Biantara formal: panata acara pernikahan adat",
          "Sisindiran: paparikan, rarakitan, wawangsalan",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Basa Sunda kasar dan halus itu gimana? Takut salah ngomong.",
        answer:
          "Itu 'undak usuk basa' — dan justru itu alasan belajar terstruktur. Kata sehari-hari punya versi loma (akrab) dan lemes (hormat): dahar vs tuang, indit vs angkat. Kami ajarkan berpasangan sejak awal plus peta situasinya, jadi kamu tak pernah tak sengaja kasar ke orang tua.",
      },
      {
        question: "Saya kuliah di Bandung. Berapa lama sampai bisa nimbrung?",
        answer:
          "Percakapan tongkrongan dasar (plus partikel mah-téh-atuh yang bikin Sunda terasa Sunda) bisa jalan dalam 3–4 bulan. Nyambung penuh termasuk humor & lemes ke dosen sekitar 8–12 bulan.",
      },
      {
        question: "Bahasa Sunda mirip bahasa Jawa?",
        answer:
          "Serumpun tapi bukan dialek satu sama lain — kosakatanya banyak beda (bahkan ada false friends: 'amis' Sunda = manis, Jawa = bau anyir!). Sama-sama punya tingkat tutur, tapi sistem Sunda lebih ramping. Dari bahasa Indonesia, keduanya sama-sama cepat dipelajari.",
      },
      {
        question: "Diajarkan aksara Sunda juga?",
        answer:
          "Ya, di tingkat 4 — aksara Sunda baku (turunan Kaganga) yang sekarang dipakai di papan nama jalan Bandung & Jabar. Sistematis dan biasanya tuntas dalam 6–8 sesi.",
      },
      {
        question: "Anak saya lahir di Jakarta, pengin bisa nyunda ke keluarga di Garut. Bisa?",
        answer:
          "Bisa — profil siswa kami banyak yang begini. Mulai dari nol dengan pengantar Bahasa Indonesia, fokus percakapan keluarga, dan pengajar menyesuaikan dialek kampung halaman (Priangan Timur seperti Garut-Tasik punya rasa sendiri).",
      },
    ],

    metaTitle: "Kursus Bahasa Sunda Online | Linguo.id — Loma, Lemes, Budaya",
    metaDescription:
      "Belajar Bahasa Sunda online: undak usuk basa, percakapan Bandung, paribasa, aksara Sunda. Untuk pendatang & generasi muda. Semi privat mulai Rp 75.000/sesi.",
    metaKeywords: [
      "kursus bahasa sunda",
      "les bahasa sunda online",
      "belajar bahasa sunda",
      "bahasa sunda halus",
      "belajar bahasa sunda lemes",
      "kursus sunda bandung",
      "les sunda online",
      "undak usuk basa sunda",
      "belajar aksara sunda",
      "bahasa sunda pemula",
    ],
  },
  // ==========================================================================
  // SWEDIA
  // ==========================================================================
  swedia: {
    urlSlug: "swedia",
    languageSlug: "swedish",
    tagline: "Dari hej sampai SFI — bahasa negeri Spotify, IKEA, dan work-life balance.",
    heroDescription:
      "Kursus Bahasa Swedia online dengan kurikulum CEFR A1–B2 selaras SFI/Swedex/Tisus. Untuk kerja IT & engineering di Swedia, studi dengan beasiswa SI, atau menyusul pasangan.",

    whyLearn: [
      {
        icon: "💻",
        title: "Karier Tech & Engineering",
        description:
          "Spotify, Ericsson, Volvo, Klarna, IKEA — Swedia surga engineer dengan work-life balance terbaik dunia. Kantor berbahasa Inggris, tapi karier jangka panjang & kehidupan sosial butuh svenska.",
      },
      {
        icon: "🎓",
        title: "Beasiswa SI & Kampus Kelas Dunia",
        description:
          "SI Scholarship (Swedish Institute) full-funded untuk S2 di KTH, Lund, Uppsala. Kuliahnya berbahasa Inggris, tapi bahasa Swedia mempercepat kerja part-time, magang, dan pintu karier setelah lulus.",
      },
      {
        icon: "🏡",
        title: "Menetap: SFI & Permanent Residence",
        description:
          "Pindah karena kerja atau pasangan? Bahasa Swedia kunci integrasi — dan pemerintah menyediakan jalur SFI (A–D). Datang dengan bekal bahasa membuat tahun pertamamu jauh lebih ringan.",
      },
    ],

    targetAudience: [
      {
        emoji: "💻",
        persona: "IT Engineer Incaran Perusahaan Swedia",
        benefit: "Svenska untuk fika & tim — pembeda kandidat di relokasi tech.",
      },
      {
        emoji: "🎓",
        persona: "Pemburu Beasiswa SI",
        benefit: "Bekal hidup di Swedia + nilai plus esai motivasi aplikasi.",
      },
      {
        emoji: "💍",
        persona: "Pasangan WN Swedia (Sambo)",
        benefit: "Percakapan keluarga & persiapan hidup sehari-hari sebelum pindah.",
      },
      {
        emoji: "🌲",
        persona: "Penikmat Budaya Nordik",
        benefit: "Nordic noir, lagom, ABBA — pahami budayanya dari bahasanya.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Nybörjare",
        sessionCount: 48,
        description:
          "Mulai dari nol. Å ä ö, pitch accent, kalimat dasar, percakapan sehari-hari.",
        topics: [
          "Pelafalan: å ä ö, sj-sound, pitch accent dasar",
          "Gender en/ett & bentuk tentu (huset, bilen)",
          "Verba present — tanpa konjugasi per orang!",
          "Angka, jam, belanja, fika & makanan",
          "Perkenalan & small talk ala Swedia",
        ],
      },
      {
        level: "A2",
        title: "A2 — Grundläggande",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar. Setara SFI kurs C–D.",
        topics: [
          "Preteritum & perfekt (har gjort)",
          "Urutan kata: V2 & inversi",
          "Adjektiva: kesesuaian en/ett/plural",
          "Verba partikel (tycker om, håller på)",
          "Topik: kerja, cuaca, rumah, kesehatan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Mellannivå (Swedex B1)",
        sessionCount: 80,
        description:
          "Diskusi topik luas, baca berita ringan, percakapan kantor. Persiapan Swedex B1.",
        topics: [
          "Bisats (anak kalimat) & urutan kata BIFF",
          "Supinum & bentuk pasif (-s)",
          "Membaca 8 Sidor & SVT Nyheter ringan",
          "Svenska kantor: meeting, email, fika culture",
          "Simulasi Swedex B1",
        ],
      },
      {
        level: "B2",
        title: "B2 — Avancerad (Tisus Ready)",
        sessionCount: 112,
        description:
          "Mahir untuk kuliah berbahasa Swedia & kerja profesional. Persiapan Tisus/Swedex B2.",
        topics: [
          "Partisip & struktur formal tulis",
          "Bahasa akademik & rapport-skrivning",
          "Membaca Dagens Nyheter & teks akademik",
          "Presentasi & diskusi profesional penuh",
          "Simulasi Tisus: läs, skriv, tala",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Orang Swedia kan jago bahasa Inggris. Ngapain belajar Swedia?",
        answer:
          "Untuk bertahan — cukup Inggris. Untuk berkembang — tidak. Rapat internal, notulen, lelucon kantor, komunitas, dan banyak lowongan (terutama sektor publik & healthcare) berbahasa Swedia. Imigran yang bisa svenska juga jauh lebih cepat dapat permanent residence secara praktik.",
      },
      {
        question: "Bahasa Swedia susah nggak?",
        answer:
          "Termasuk paling mudah di Eropa untuk pemula: verba tidak berubah per orang (jag är, du är, vi är — sama!), tanpa kasus, kosakata banyak mirip Inggris. Tantangannya cuma pelafalan (sj-sound, pitch accent) — dan itu soal latihan terarah.",
      },
      {
        question: "SFI, Swedex, Tisus — apa bedanya?",
        answer:
          "SFI kursus gratis pemerintah untuk imigran (levelnya A–D ≈ A1–B1). Swedex ujian sertifikasi internasional (A2/B1/B2) yang bisa diambil di luar Swedia. Tisus khusus syarat masuk kuliah berbahasa Swedia. Kurikulum Linguo selaras ketiganya.",
      },
      {
        question: "Belajar Swedia atau Norwegia dulu? Katanya mirip.",
        answer:
          "Sangat mirip — bisa saling paham. Pilih berdasar negara tujuanmu. Bonusnya: setelah satu bahasa Skandinavia, bahasa kedua bisa dipangkas separuh waktu, dan membaca Denmark-Norwegia jadi gratis.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih (alumni Swedia & diaspora) plus opsi native. Materi bisa diarahkan ke tujuanmu: interview kerja tech, kehidupan kampus, atau keluarga.",
      },
    ],

    metaTitle: "Kursus Bahasa Swedia Online | Linguo.id — A1 sampai Tisus",
    metaDescription:
      "Belajar Bahasa Swedia online dari nol. Persiapan SFI, Swedex, Tisus — kerja tech, beasiswa SI, atau menyusul pasangan. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa swedia",
      "les bahasa swedia online",
      "belajar bahasa swedia",
      "kursus swedia jakarta",
      "beasiswa SI swedia",
      "swedex prep",
      "kerja di swedia",
      "les swedia murah",
      "bahasa swedia pemula",
      "kursus swedia online",
    ],
  },

  // ==========================================================================
  // NORWEGIA
  // ==========================================================================
  norwegia: {
    urlSlug: "norwegia",
    languageSlug: "norwegian",
    tagline: "Dari hei sampai Norskprøven — jalur perawat, engineer & gaji tertinggi Eropa.",
    heroDescription:
      "Kursus Bahasa Norwegia (Bokmål) online dengan kurikulum CEFR A1–B2 selaras Norskprøven. Jalur favorit perawat & tenaga kesehatan Indonesia, plus engineer migas-maritim dan pemburu beasiswa.",

    whyLearn: [
      {
        icon: "🧑‍⚕️",
        title: "Norwegia Butuh Perawat — Serius",
        description:
          "Norwegia kekurangan puluhan ribu tenaga kesehatan, dan perawat Indonesia mulai direkrut lewat jalur resmi. Syarat utamanya satu: bahasa Norwegia level B1–B2 (Norskprøven) — gajinya di antara tertinggi Eropa.",
      },
      {
        icon: "🛢️",
        title: "Migas, Maritim & Salmon",
        description:
          "Equinor, armada pelayaran raksasa, dan industri akuakultur terbesar dunia. Insinyur & pelaut Indonesia dengan bahasa Norwegia adalah kombinasi langka yang dicari.",
      },
      {
        icon: "🏔️",
        title: "Bonus 3-in-1 Skandinavia",
        description:
          "Norwegia posisi tengah rumpun Skandinavia — menguasainya membuat kamu membaca Denmark dan memahami Swedia hampir gratis. Satu bahasa, tiga negara.",
      },
    ],

    targetAudience: [
      {
        emoji: "🧑‍⚕️",
        persona: "Perawat & Nakes Tujuan Norwegia",
        benefit: "Target Norskprøven B1–B2 + kosakata helsefag (kesehatan).",
      },
      {
        emoji: "⚓",
        persona: "Pelaut & Engineer Maritim/Migas",
        benefit: "Kosakata teknis kapal & rig, komunikasi kru Norwegia.",
      },
      {
        emoji: "🎓",
        persona: "Calon Mahasiswa di Norwegia",
        benefit: "Bekal hidup & syarat bahasa program berbahasa Norwegia.",
      },
      {
        emoji: "💍",
        persona: "Pasangan & Calon Penduduk",
        benefit: "Syarat bahasa izin tinggal permanen & kewarganegaraan.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Nybegynner",
        sessionCount: 48,
        description:
          "Mulai dari nol dengan Bokmål standar. Pelafalan, tone 1/2, kalimat dasar sehari-hari.",
        topics: [
          "Pelafalan: æ ø å, tone/pitch accent dasar",
          "Gender en/ei/et & bentuk tentu",
          "Verba present — satu bentuk untuk semua subjek",
          "Angka (termasuk sistem baru vs lama), jam, belanja",
          "Perkenalan & percakapan dasar",
        ],
      },
      {
        level: "A2",
        title: "A2 — Grunnleggende (Norskprøven A2)",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar. Setara Norskprøven A1–A2 (syarat beberapa jalur visa).",
        topics: [
          "Preteritum & perfektum",
          "Urutan kata V2 & inversi",
          "Adjektiva & pembanding",
          "Preposisi tempat-waktu yang sering ketukar",
          "Topik: kerja, kesehatan, rumah, cuaca",
        ],
      },
      {
        level: "B1",
        title: "B1 — Mellomnivå (Syarat Kerja Nakes)",
        sessionCount: 80,
        description:
          "Level kunci Norskprøven B1 — syarat otorisasi banyak profesi kesehatan & permanent residence.",
        topics: [
          "Leddsetninger (anak kalimat) & urutan kata",
          "Pasif & s-verb",
          "Norsk kesehatan: pasien, dokumentasi, shift",
          "Membaca NRK & Klar Tale",
          "Simulasi Norskprøven B1: 4 keterampilan",
        ],
      },
      {
        level: "B2",
        title: "B2 — Høyere nivå (Bergenstest)",
        sessionCount: 112,
        description:
          "Mahir profesional — Norskprøven B2/Bergenstest, syarat otorisasi penuh perawat & kuliah.",
        topics: [
          "Struktur kompleks & bahasa formal tulis",
          "Fagspråk: laporan medis / teknis",
          "Membaca Aftenposten & teks akademik",
          "Presentasi & diskusi profesional penuh",
          "Simulasi Norskprøven B2 / Bergenstest",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Saya perawat, mau kerja di Norwegia. Level berapa yang dibutuhkan?",
        answer:
          "Otorisasi perawat (autorisasjon) umumnya mensyaratkan Norskprøven B2 — beberapa jalur helsefagarbeider menerima B1. Realistis dari nol: 18–24 bulan dengan ritme serius. Kurikulum kami memasukkan kosakata klinis sejak B1 supaya kamu tak belajar dua kali.",
      },
      {
        question: "Bokmål atau Nynorsk?",
        answer:
          "Bokmål — dipakai ~90% penduduk, semua media besar, dan itu yang diuji Norskprøven. Nynorsk cukup dikenali pasif nanti setelah tinggal di sana.",
      },
      {
        question: "Norwegia, Swedia, Denmark — mana yang harus dipilih?",
        answer:
          "Ikuti negara tujuanmu — ketiganya saling terkait. Kalau tujuannya karier kesehatan, Norwegia jalurnya paling terbuka untuk orang Indonesia saat ini. Bonus: dari Norwegia, membaca Denmark & memahami Swedia nyaris gratis.",
      },
      {
        question: "Norskprøven itu apa?",
        answer:
          "Ujian resmi pemerintah Norwegia (Kompetanse Norge/HK-dir), level A1–A2, A2–B1, dan B1–B2, diadakan beberapa kali setahun. Dipakai untuk visa, permanent residence, kewarganegaraan, dan otorisasi profesi. Kurikulum Linguo selaras formatnya.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Norwegia (diaspora & alumni) plus opsi native. Untuk track nakes, tersedia pengajar yang paham proses autorisasi.",
      },
    ],

    metaTitle: "Kursus Bahasa Norwegia Online | Linguo.id — Norskprøven A1–B2",
    metaDescription:
      "Belajar Bahasa Norwegia online dari nol. Persiapan Norskprøven & Bergenstest — jalur perawat, maritim, studi. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa norwegia",
      "les bahasa norwegia online",
      "belajar bahasa norwegia",
      "norskproven persiapan",
      "perawat ke norwegia",
      "kerja di norwegia",
      "kursus norwegia jakarta",
      "les norwegia murah",
      "bahasa norwegia pemula",
      "bergenstest prep",
    ],
  },

  // ==========================================================================
  // DENMARK
  // ==========================================================================
  denmark: {
    urlSlug: "denmark",
    languageSlug: "danish",
    tagline: "Dari hej sampai Prøve i Dansk — bahasa negeri hygge, Lego & Maersk.",
    heroDescription:
      "Kursus Bahasa Denmark online dengan kurikulum CEFR A1–B2 selaras Prøve i Dansk 1–3. Untuk kerja & studi di Denmark, menyusul pasangan, dan menaklukkan pelafalan paling tricky di Skandinavia.",

    whyLearn: [
      {
        icon: "🚢",
        title: "Maersk, Novo Nordisk, Vestas, Lego",
        description:
          "Denmark rumah raksasa pelayaran, farmasi, energi angin, dan mainan dunia. Pelaut Indonesia di kapal Maersk dan profesional farmasi-engineering mendapat nilai lebih besar dengan bahasa Denmark.",
      },
      {
        icon: "🏡",
        title: "Menetap: Syarat Bahasa yang Nyata",
        description:
          "Permanent residence & kewarganegaraan Denmark mensyaratkan Prøve i Dansk (PD2/PD3). Pasangan yang datang dengan bekal bahasa menghemat bertahun-tahun proses integrasi.",
      },
      {
        icon: "🎓",
        title: "Studi di Negeri Paling Bahagia",
        description:
          "DTU, Aarhus, Copenhagen Business School — pendidikan kelas dunia dengan budaya kampus egaliter. Kuliah berbahasa Inggris tersedia, tapi kerja part-time & karier lokal berbahasa Denmark.",
      },
    ],

    targetAudience: [
      {
        emoji: "💍",
        persona: "Pasangan WN Denmark",
        benefit: "Persiapan hidup & ujian Prøve i Dansk untuk residence.",
      },
      {
        emoji: "⚓",
        persona: "Pelaut & Profesional Maritim",
        benefit: "Kosakata maritim + percakapan kru — Maersk & armada Denmark.",
      },
      {
        emoji: "💊",
        persona: "Profesional Farmasi & Engineering",
        benefit: "Novo Nordisk, Vestas — dansk kantor & kehidupan sosial.",
      },
      {
        emoji: "🎓",
        persona: "Calon Mahasiswa di Denmark",
        benefit: "Bekal hidup, kerja part-time, dan integrasi kampus.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Begynder",
        sessionCount: 48,
        description:
          "Mulai dari nol dengan fokus ekstra pelafalan — jarak tulisan-ucapan Denmark yang terkenal itu kami jinakkan sejak awal.",
        topics: [
          "Pelafalan: æ ø å, stød, vokal 'menghilang'",
          "Gender en/et & bentuk tentu",
          "Verba present satu bentuk + ordstilling dasar",
          "Angka (halvtreds! sistem 20-an), jam, belanja",
          "Perkenalan & percakapan dasar",
        ],
      },
      {
        level: "A2",
        title: "A2 — Grundlæggende (PD1)",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar. Setara Prøve i Dansk 1.",
        topics: [
          "Datid & førnutid (har lavet)",
          "Urutan kata V2 & inversi",
          "Adjektiva & pembanding",
          "Listening intensif — kunci bahasa Denmark",
          "Topik: kerja, rumah, kesehatan, cuaca",
        ],
      },
      {
        level: "B1",
        title: "B1 — Mellemniveau (PD2)",
        sessionCount: 80,
        description:
          "Level Prøve i Dansk 2 — syarat permanent residence. Diskusi topik luas dengan nyaman.",
        topics: [
          "Ledsætninger & urutan kata kompleks",
          "Pasif (-s & blive) & refleksif",
          "Membaca DR Nyheder ringan",
          "Dansk kantor: meeting, email, sosial",
          "Simulasi Prøve i Dansk 2",
        ],
      },
      {
        level: "B2",
        title: "B2 — Højere niveau (PD3)",
        sessionCount: 112,
        description:
          "Mahir profesional — Prøve i Dansk 3, syarat kewarganegaraan & kuliah berbahasa Denmark.",
        topics: [
          "Struktur formal & bahasa tulis akademik",
          "Fagsprog: maritim / farmasi / teknik",
          "Membaca Politiken & Berlingske",
          "Presentasi & argumentasi penuh",
          "Simulasi Prøve i Dansk 3",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Katanya tulisan dan ucapan bahasa Denmark beda jauh. Separah apa?",
        answer:
          "Memang paling menantang di Skandinavia — banyak konsonan melunak dan ada stød (hentakan glotal). Justru karena itu metode kami listening-first: telinga dilatih sejak sesi pertama dengan audio native, bukan mengeja dari tulisan. Grammarnya sendiri sangat sederhana.",
      },
      {
        question: "Prøve i Dansk itu apa?",
        answer:
          "Ujian resmi pemerintah Denmark tiga jenjang: PD1 (≈A2), PD2 (≈B1, syarat permanent residence), PD3 (≈B2, syarat kewarganegaraan & kuliah). Diadakan Mei & November. Kurikulum Linguo dipetakan langsung ke jenjang ini.",
      },
      {
        question: "Denmark vs Norwegia vs Swedia — tulisannya kok mirip?",
        answer:
          "Denmark & Norwegia (Bokmål) tulisannya 90% mirip — bedanya di pengucapan. Kalau kamu sudah belajar salah satunya, membaca yang lain hampir gratis. Pilih berdasarkan negara tempat kamu akan tinggal.",
      },
      {
        question: "Berapa lama sampai PD2 (permanent residence)?",
        answer:
          "Dari nol rata-rata 14–18 bulan dengan 2–3 sesi seminggu. Banyak siswa mulai dari Indonesia sebelum pindah, lalu lanjut modul language school gratis di Denmark — bekal awal membuat penempatan level di sana jauh lebih tinggi.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih (diaspora Denmark) plus opsi native. Audio & materi listening memakai sumber native asli sejak level pertama.",
      },
    ],

    metaTitle: "Kursus Bahasa Denmark Online | Linguo.id — Prøve i Dansk 1–3",
    metaDescription:
      "Belajar Bahasa Denmark online dari nol. Pelafalan & stød, persiapan Prøve i Dansk, kerja & residence di Denmark. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa denmark",
      "les bahasa denmark online",
      "belajar bahasa denmark",
      "prove i dansk persiapan",
      "kerja di denmark",
      "kursus denmark jakarta",
      "les denmark murah",
      "bahasa denmark pemula",
      "bahasa dansk",
      "kursus dansk online",
    ],
  },

  // ==========================================================================
  // FINLANDIA
  // ==========================================================================
  finlandia: {
    urlSlug: "finlandia",
    languageSlug: "finnish",
    tagline: "Dari moi sampai YKI — bahasa negeri pendidikan terbaik dunia.",
    heroDescription:
      "Kursus Bahasa Finlandia online dengan kurikulum selaras YKI level 1–6. Untuk perawat & pekerja kesehatan jalur Finlandia, pengagum sistem pendidikannya, engineer tech Helsinki, dan pemburu residence.",

    whyLearn: [
      {
        icon: "🧑‍⚕️",
        title: "Finlandia Rekrut Nakes Indonesia",
        description:
          "Finlandia menua cepat dan aktif merekrut perawat & caregiver Indonesia lewat jalur resmi. Kontrak menanti setelah bahasamu sampai — umumnya YKI 3 (B1) untuk otorisasi praktik.",
      },
      {
        icon: "🏫",
        title: "Kiblat Pendidikan Dunia",
        description:
          "Guru-guru Indonesia berbondong mempelajari sistem Finlandia. Membaca materinya langsung — bukan lewat buku terjemahan — memberi kedalaman yang berbeda; plus S2 pendidikan di Helsinki atau Jyväskylä.",
      },
      {
        icon: "📡",
        title: "Tech Helsinki & Residence",
        description:
          "Nokia, Supercell, Wolt — startup scene Helsinki kuat dan kekurangan talenta. Kewarganegaraan Finlandia mensyaratkan YKI 3; datang dengan bekal bahasa memangkas semuanya.",
      },
    ],

    targetAudience: [
      {
        emoji: "🧑‍⚕️",
        persona: "Perawat & Caregiver Jalur Finlandia",
        benefit: "Target YKI 3 + suomen kieli untuk keperawatan (hoitoala).",
      },
      {
        emoji: "🏫",
        persona: "Guru & Praktisi Pendidikan",
        benefit: "Akses materi pedagogi Finlandia asli + persiapan S2 pendidikan.",
      },
      {
        emoji: "💻",
        persona: "Engineer Tech Tujuan Helsinki",
        benefit: "Suomi untuk kehidupan & karier jangka panjang di startup scene.",
      },
      {
        emoji: "💍",
        persona: "Pasangan & Calon Penduduk",
        benefit: "YKI 3 — syarat kewarganegaraan — dengan jalur belajar realistis.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "Taso 1 — Pemula (YKI 1)",
        sessionCount: 48,
        description:
          "Mulai dari nol. Pelafalan super konsisten (baca = tulis!), vokal harmoni, kalimat dasar.",
        topics: [
          "Pelafalan: dobel huruf, ä/ö, vokal harmoni",
          "Verbityypit 1–5 & konjugasi present",
          "Kasus dasar: partitif, genetif, lokal (-ssa/-lla)",
          "Angka, jam, belanja, sauna & kahvi",
          "Perkenalan — puhekieli vs kirjakieli dikenalkan",
        ],
      },
      {
        level: "A2",
        title: "Taso 2 — Dasar (YKI 2)",
        sessionCount: 64,
        description: "Percakapan sehari-hari dengan sistem kasus yang mulai otomatis.",
        topics: [
          "Imperfekti & perfekti",
          "Objek: akkusatif vs partitif (kunci Finlandia!)",
          "Kasus lokal lengkap 6 arah",
          "KPT-vaihtelu (pergantian konsonan)",
          "Topik: kerja, kesehatan, rumah, cuaca",
        ],
      },
      {
        level: "B1",
        title: "Taso 3 — Menengah (YKI 3 — Kewarganegaraan)",
        sessionCount: 80,
        description:
          "Level YKI 3 — syarat kewarganegaraan & mayoritas otorisasi nakes. Diskusi topik luas.",
        topics: [
          "Konditionaali & pengandaian",
          "Pasif — wajib di bahasa kerja & pengumuman",
          "Suomi kesehatan: pasien, dokumentasi, shift",
          "Membaca Selkouutiset & Yle ringan",
          "Simulasi YKI keskitaso: 4 keterampilan",
        ],
      },
      {
        level: "B2",
        title: "Taso 4 — Atas (YKI 4–5)",
        sessionCount: 112,
        description:
          "Mahir profesional & akademik. Partisip, struktur formal, bahasa kerja penuh.",
        topics: [
          "Partisiippi & lauseenvastike (struktur ringkas formal)",
          "Rektio verba yang sering salah",
          "Bahasa akademik & laporan kerja",
          "Membaca Helsingin Sanomat",
          "Simulasi YKI ylin taso",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Katanya bahasa Finlandia paling susah di Eropa. Benar?",
        answer:
          "Beda, bukan sekadar susah — dia bukan rumpun Indo-Eropa. 15 kasus terdengar seram, tapi kabar baiknya: pelafalan 100% konsisten, tanpa gender, tanpa artikel, dan tanpa future tense. Untuk orang Indonesia yang terbiasa imbuhan (me-, -kan, -nya), logika aglutinatif Finlandia justru familiar.",
      },
      {
        question: "YKI itu apa dan level berapa yang saya butuhkan?",
        answer:
          "YKI (Yleiset kielitutkinnot) ujian bahasa resmi Finlandia, skala 1–6. YKI 3 (B1) adalah angka kunci: syarat kewarganegaraan dan mayoritas otorisasi tenaga kesehatan. Kurikulum kami dipetakan langsung ke sana.",
      },
      {
        question: "Saya perawat. Realistis nggak belajar sampai level kerja?",
        answer:
          "Realistis dengan komitmen: rata-rata 18–24 bulan ke YKI 3 dari nol. Program rekrutmen resmi biasanya juga memberi pelatihan bahasa — bekal dari Indonesia membuatmu masuk gelombang berangkat lebih awal. Kosakata hoitoala kami masukkan sejak Taso 3.",
      },
      {
        question: "Puhekieli (bahasa gaul) beda banget sama bahasa buku?",
        answer:
          "Cukup beda (minä→mä, kirjakieli vs puhekieli), dan banyak kursus mengabaikannya — lalu siswanya kaget di Helsinki. Kami kenalkan puhekieli sejak awal secara bertahap supaya telingamu siap dua-duanya.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih suomi (diaspora & alumni Finlandia) plus opsi native. Untuk track nakes, materi klinisnya disusun bersama perawat yang sudah bekerja di sana.",
      },
    ],

    metaTitle: "Kursus Bahasa Finlandia Online | Linguo.id — YKI 1 sampai 5",
    metaDescription:
      "Belajar Bahasa Finlandia online dari nol. Persiapan YKI, jalur perawat & caregiver, studi pendidikan. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa finlandia",
      "les bahasa finlandia online",
      "belajar bahasa finlandia",
      "YKI test persiapan",
      "perawat ke finlandia",
      "kerja di finlandia",
      "kursus finlandia jakarta",
      "les finlandia murah",
      "bahasa suomi",
      "bahasa finlandia pemula",
    ],
  },

  // ==========================================================================
  // ISLANDIA
  // ==========================================================================
  islandia: {
    urlSlug: "islandia",
    languageSlug: "icelandic",
    tagline: "Dari halló sampai membaca Saga — bahasa Viking yang masih hidup.",
    heroDescription:
      "Kursus Bahasa Islandia online dengan kurikulum A1–B2. Bahasa Skandinavia paling murni — penuturnya masih bisa membaca Saga abad ke-13. Untuk pekerja pariwisata-perikanan, pasangan, dan pencinta bahasa.",

    whyLearn: [
      {
        icon: "⚔️",
        title: "Old Norse yang Masih Bernafas",
        description:
          "Islandia nyaris tak berubah sejak era Viking — orang Islandia modern membaca Saga abad ke-13 seperti kita membaca koran. Belajar bahasanya = memegang kunci sastra Norse asli.",
      },
      {
        icon: "🌋",
        title: "Pariwisata & Perikanan Butuh Orang",
        description:
          "Turisme Islandia meledak dan industri perikanannya legendaris — negeri 400 ribu penduduk ini bergantung pada pekerja asing. Bahasa Islandia langsung membedakanmu dari pelamar lain.",
      },
      {
        icon: "🏔️",
        title: "Syarat Menetap & Kewarganegaraan",
        description:
          "Izin tinggal permanen dan kewarganegaraan Islandia mensyaratkan ujian bahasa. Komunitasnya kecil dan erat — bahasa adalah satu-satunya pintu masuk yang sesungguhnya.",
      },
    ],

    targetAudience: [
      {
        emoji: "🏨",
        persona: "Pekerja Pariwisata & Hospitality",
        benefit: "Percakapan tamu & tim — musim turis Islandia haus tenaga kerja.",
      },
      {
        emoji: "🎣",
        persona: "Pekerja Perikanan & Pengolahan",
        benefit: "Kosakata industri ikan + percakapan pabrik & pelabuhan.",
      },
      {
        emoji: "💍",
        persona: "Pasangan WN Islandia",
        benefit: "Persiapan ujian residence & integrasi komunitas kecil yang erat.",
      },
      {
        emoji: "📜",
        persona: "Pencinta Bahasa & Sastra Norse",
        benefit: "Jembatan langsung ke Saga, Edda, dan Old Norse.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Byrjandi",
        sessionCount: 48,
        description:
          "Mulai dari nol. Þ dan ð, pelafalan, kalimat dasar — dengan ekspektasi realistis terhadap morfologinya.",
        topics: [
          "Alfabet 32 huruf: þ (thorn), ð (eth), æ, ö",
          "Pelafalan: pre-aspiration, ll → tl",
          "Gender 3 & artikel tersufiks (húsið)",
          "Verba dasar & sagnorð umum",
          "Perkenalan, angka, belanja, cuaca (topik nasional!)",
        ],
      },
      {
        level: "A2",
        title: "A2 — Grunnstig",
        sessionCount: 64,
        description: "Percakapan sehari-hari dengan 4 kasus dasar yang mulai otomatis.",
        topics: [
          "4 kasus: nf. þf. þgf. ef. dengan pola frekuensi",
          "Verba lampau lemah vs kuat",
          "Adjektiva: deklinasi kuat-lemah praktis",
          "Angka yang ikut kasus (tveir/tvær/tvö)",
          "Topik: kerja, rumah, perjalanan, makanan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Miðstig",
        sessionCount: 80,
        description:
          "Diskusi topik luas & membaca berita ringan. Persiapan ujian bahasa untuk residence.",
        topics: [
          "Subjunktif (viðtengingarháttur) fungsional",
          "Middle voice (-st) & pasif",
          "Membaca RÚV & Vísir ringan",
          "Bahasa kerja: hospitality & perikanan",
          "Simulasi ujian Íslenskupróf residence",
        ],
      },
      {
        level: "B2",
        title: "B2 — Efra stig",
        sessionCount: 112,
        description:
          "Mahir — termasuk pintu ke sastra: membaca Saga berpanduan dengan jembatan dari Islandia modern.",
        topics: [
          "Morfologi penuh & gaya formal",
          "Neologisme Islandia (tölva, sími) & purisme bahasa",
          "Membaca Njáls saga berpanduan",
          "Bahasa akademik & media penuh",
          "Percakapan native-speed dengan idiom",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Sesusah apa bahasa Islandia sebenarnya?",
        answer:
          "Morfologinya paling kaya di Skandinavia — 4 kasus, 3 gender, deklinasi kuat-lemah. Tapi penuturnya cuma 400 ribu dan SANGAT menghargai orang asing yang mencoba; kesalahan dimaafkan, usaha dirayakan. Kami mengajarkannya dengan pola frekuensi: bentuk yang paling sering dipakai dulu, tabel lengkap belakangan.",
      },
      {
        question: "Semua orang Islandia bisa Inggris. Buat apa?",
        answer:
          "Untuk turis — benar. Untuk yang tinggal & bekerja — percakapan komunitas, rapat kerja, dan pertemanan sejati berbahasa Islandia. Izin tinggal permanen juga mensyaratkan ujian bahasa. Di negeri sekecil itu, bahasa adalah keanggotaan.",
      },
      {
        question: "Beneran bisa sampai baca Saga Viking?",
        answer:
          "Bisa — itu keistimewaan Islandia. Bahasa modernnya begitu konservatif sehingga dari B2, Saga bisa dibaca berpanduan (ejaan dinormalisasi). Track sastra kami mengarah ke sana lewat Njáls saga.",
      },
      {
        question: "Berapa lama sampai level percakapan?",
        answer:
          "Lebih lambat dari bahasa Skandinavia lain karena morfologinya: A2 nyaman sekitar 10–14 bulan, B1 (level ujian residence) 18–24 bulan dengan ritme 2–3 sesi seminggu.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih íslenska (langka — dan kami punya) plus opsi native & penutur yang menempuh Icelandic as a Second Language di Háskóli Íslands.",
      },
    ],

    metaTitle: "Kursus Bahasa Islandia Online | Linguo.id — dari Nol sampai Saga",
    metaDescription:
      "Belajar Bahasa Islandia online dari nol. Þ dan ð, kasus & saga, kerja pariwisata-perikanan, ujian residence. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa islandia",
      "les bahasa islandia online",
      "belajar bahasa islandia",
      "bahasa iceland",
      "belajar bahasa iceland",
      "kerja di islandia",
      "kursus islandia jakarta",
      "les islandia murah",
      "bahasa islandia pemula",
      "old norse saga",
    ],
  },
  // ==========================================================================
  // POLANDIA
  // ==========================================================================
  polandia: {
    urlSlug: "polandia",
    languageSlug: "polish",
    tagline: "Dari cześć sampai kontrak kerja — bahasa gerbang kerja Eropa untuk orang Indonesia.",
    heroDescription:
      "Kursus Bahasa Polandia online dengan kurikulum CEFR A1–B2. Polandia kini tujuan kerja Eropa paling terbuka bagi pekerja Indonesia — bahasanya bekal bertahan, naik posisi, dan menetap.",

    whyLearn: [
      {
        icon: "🏭",
        title: "Gerbang Kerja Eropa Paling Terbuka",
        description:
          "Ribuan pekerja Indonesia kini di Polandia — pabrik, logistik, konstruksi, hospitality. Yang bisa bahasa Polandia naik jadi koordinator, lolos wawancara langsung, dan tak bergantung agen.",
      },
      {
        icon: "🎓",
        title: "Kuliah Murah di Jantung Eropa",
        description:
          "Universitas negeri Polandia nyaris gratis untuk program berbahasa Polandia, dan ada beasiswa NAWA. Kraków & Warsawa kota pelajar dengan biaya hidup separuh Eropa Barat.",
      },
      {
        icon: "🇪🇺",
        title: "Ekonomi Terbesar Eropa Tengah",
        description:
          "Polandia ekonomi paling cepat tumbuh di UE — pusat manufaktur, game (CD Projekt), dan IT outsourcing. Karta pobytu (izin tinggal) jangka panjang lebih mudah dengan bahasa.",
      },
    ],

    targetAudience: [
      {
        emoji: "🏭",
        persona: "Pekerja Indonesia di Polandia",
        benefit: "Percakapan pabrik & kehidupan: shift, kontrak, dokumen, belanja.",
      },
      {
        emoji: "📋",
        persona: "Calon Pekerja yang Sedang Proses Visa",
        benefit: "Bekal sebelum berangkat — wawancara & adaptasi minggu pertama.",
      },
      {
        emoji: "🎓",
        persona: "Calon Mahasiswa & Pemburu NAWA",
        benefit: "Persiapan certyfikat B1 untuk program berbahasa Polandia.",
      },
      {
        emoji: "💍",
        persona: "Pasangan & Calon Penduduk Tetap",
        benefit: "B1 — syarat status penduduk jangka panjang UE di Polandia.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Początkujący",
        sessionCount: 48,
        description:
          "Mulai dari nol. Konsonan berdesis Polandia dijinakkan sejak awal, kalimat dasar untuk hidup sehari-hari.",
        topics: [
          "Pelafalan: sz/cz/rz/ż, ś/ć/ź, ą/ę",
          "Gender & verba być, mieć + present",
          "Kasus pertama yang paling kepakai: biernik & narzędnik",
          "Angka, jam, belanja, transportasi",
          "Perkenalan formal (Pan/Pani) vs santai",
        ],
      },
      {
        level: "A2",
        title: "A2 — Podstawowy",
        sessionCount: 64,
        description: "Percakapan sehari-hari & kebutuhan kerja dasar.",
        topics: [
          "Aspek verba: dokonany vs niedokonany",
          "Lampau & masa depan dua aspek",
          "Dopełniacz (genitif) — kasus paling sering",
          "Bahasa kerja: shift, gaji, cuti, BHP (K3)",
          "Topik: kesehatan, dokumen, urząd (kantor pemerintah)",
        ],
      },
      {
        level: "B1",
        title: "B1 — Średni (Certyfikat B1)",
        sessionCount: 80,
        description:
          "Level ujian certyfikatowy B1 — syarat kewarganegaraan & kuliah. Diskusi topik luas.",
        topics: [
          "Sistem 7 kasus lengkap dengan pola frekuensi",
          "Verba gerak & prefiks",
          "Kondisional & kalimat kompleks",
          "Membaca berita Onet/TVN24 ringan",
          "Simulasi egzamin certyfikatowy B1",
        ],
      },
      {
        level: "B2",
        title: "B2 — Wyższy",
        sessionCount: 112,
        description:
          "Mahir profesional — rapat kerja penuh, dokumen resmi, kuliah berbahasa Polandia.",
        topics: [
          "Imiesłowy (participle) & gaya formal",
          "Bahasa dokumen: umowa (kontrak), urząd, ZUS",
          "Polski biznesowy: rapat, email, negosiasi",
          "Membaca Gazeta Wyborcza & teks akademik",
          "Simulasi egzamin certyfikatowy B2",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Saya mau kerja di Polandia lewat agen. Perlu bahasa dulu?",
        answer:
          "Tidak wajib untuk berangkat — tapi sangat menentukan nasib di sana. Pekerja yang bisa dasar Polandia dapat posisi lebih baik, paham kontraknya sendiri (banyak kasus gaji dipotong karena tak paham umowa), dan bisa pindah kerja tanpa tergantung agen. Track kami yang paling laku justru 'bekal 3 bulan sebelum berangkat'.",
      },
      {
        question: "Konsonannya seram — szcz, prz... bisa dilafalkan orang Indonesia?",
        answer:
          "Bisa, dan lebih cepat dari yang kamu kira — sz=sy, cz=cy sudah setengah jalan dari bunyi Indonesia. Kami drill kluster konsonan sejak sesi pertama. Bonus: tekanan kata SELALU di suku kedua dari akhir, jadi tak pernah menebak.",
      },
      {
        question: "7 kasus?! Gimana ngajarinnya?",
        answer:
          "Dengan frekuensi, bukan tabel. Tiga kasus menutupi mayoritas percakapan sehari-hari, jadi itu yang diajarkan dulu sampai otomatis. Sisanya menyusul bertahap. Siswa kami sudah bisa hidup di Polandia jauh sebelum 'selesai' semua kasus.",
      },
      {
        question: "Berapa lama sampai level yang berguna di tempat kerja?",
        answer:
          "Percakapan kerja & hidup dasar (A2): 8–12 bulan reguler, atau 4–5 bulan intensif untuk yang dikejar jadwal keberangkatan. B1 — syarat kewarganegaraan — sekitar 18 bulan.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Polandia (diaspora & alumni NAWA) plus opsi native. Materinya membumi: kontrak kerja, urząd, kehidupan nyata pekerja — bukan cuma buku teks.",
      },
    ],

    metaTitle: "Kursus Bahasa Polandia Online | Linguo.id — Bekal Kerja & B1",
    metaDescription:
      "Belajar Bahasa Polandia online dari nol. Bekal kerja di Polandia, certyfikat B1, kuliah & residence. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa polandia",
      "les bahasa polandia online",
      "belajar bahasa polandia",
      "kerja di polandia",
      "bahasa polandia untuk pekerja",
      "kursus polandia jakarta",
      "les polandia murah",
      "bahasa polski",
      "bahasa polandia pemula",
      "beasiswa NAWA polandia",
    ],
  },

  // ==========================================================================
  // CEKO
  // ==========================================================================
  ceko: {
    urlSlug: "ceko",
    languageSlug: "czech",
    tagline: "Dari ahoj sampai CCE — kuliah GRATIS di Praha kalau bahasamu Ceko.",
    heroDescription:
      "Kursus Bahasa Ceko online dengan kurikulum CEFR A1–B2 selaras ujian CCE. Kuncinya satu: universitas negeri Ceko gratis untuk program berbahasa Ceko — termasuk Charles University.",

    whyLearn: [
      {
        icon: "🎓",
        title: "Kuliah GRATIS — Syaratnya Cuma Bahasa",
        description:
          "Universitas negeri Ceko (Charles University, CTU, Masaryk) menggratiskan kuliah untuk SIAPA PUN yang belajar dalam bahasa Ceko — termasuk mahasiswa asing. B2 adalah tiket masuknya. Ini salah satu deal pendidikan terbaik di Eropa.",
      },
      {
        icon: "🚗",
        title: "Škoda, Manufaktur & Engineering",
        description:
          "Ceko jantung manufaktur Eropa Tengah — otomotif, mesin, kaca. Pekerja teknik & operator Indonesia mulai melirik Ceko; bahasa lokal membuka posisi di atas lini produksi.",
      },
      {
        icon: "🏰",
        title: "Praha: Hidup Eropa dengan Biaya Masuk Akal",
        description:
          "Kota tercantik Eropa dengan biaya hidup jauh di bawah Barat. Izin tinggal permanen mensyaratkan ujian bahasa — datang dengan bekal berarti selangkah di depan.",
      },
    ],

    targetAudience: [
      {
        emoji: "🎓",
        persona: "Calon Mahasiswa Jalur Gratis",
        benefit: "Target CCE B2 untuk masuk program berbahasa Ceko tanpa biaya kuliah.",
      },
      {
        emoji: "🏭",
        persona: "Pekerja Teknik & Manufaktur",
        benefit: "Percakapan pabrik, kontrak, K3 — plus naik posisi.",
      },
      {
        emoji: "💍",
        persona: "Pasangan & Calon Penduduk",
        benefit: "A2–B1 untuk izin tinggal permanen & kewarganegaraan.",
      },
      {
        emoji: "🍺",
        persona: "Penikmat Budaya Eropa Tengah",
        benefit: "Kafka, Kundera, film Ceko, dan hospoda — dari bahasanya langsung.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Začátečník",
        sessionCount: 48,
        description:
          "Mulai dari nol. Háček (č š ž), ř yang legendaris, kalimat dasar sehari-hari.",
        topics: [
          "Pelafalan: č š ž, ř, ě, dlouhé samohlásky",
          "Gender & verba být, mít + present",
          "Akuzativ & lokál — kasus paling kepakai dulu",
          "Angka, jam, belanja, restaurace",
          "Perkenalan formal (vykání) vs akrab (tykání)",
        ],
      },
      {
        level: "A2",
        title: "A2 — Základní",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar. Setara CCE-A2 (syarat permanent residence).",
        topics: [
          "Aspek verba: dokonavý vs nedokonavý",
          "Lampau & masa depan",
          "Genitiv & dativ fungsional",
          "Bahasa kantor imigrasi & dokumen",
          "Topik: kerja, kesehatan, rumah, transportasi",
        ],
      },
      {
        level: "B1",
        title: "B1 — Střední (CCE-B1)",
        sessionCount: 80,
        description:
          "Diskusi topik luas, baca berita ringan. CCE-B1 — syarat kewarganegaraan.",
        topics: [
          "7 kasus lengkap dengan pola frekuensi",
          "Verba gerak & prefiks",
          "Kondicionál & kalimat kompleks",
          "Membaca iDNES & ČT24 ringan",
          "Simulasi CCE-B1",
        ],
      },
      {
        level: "B2",
        title: "B2 — Vyšší (CCE-B2 — Tiket Kuliah Gratis)",
        sessionCount: 112,
        description:
          "Level syarat masuk universitas berbahasa Ceko. Akademik & profesional penuh.",
        topics: [
          "Přechodníky & gaya formal tulis",
          "Bahasa akademik: přednáška, seminář, zkouška",
          "Čeština kantor: email, rapat, presentasi",
          "Membaca Respekt & teks akademik",
          "Simulasi CCE-B2 lengkap",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Beneran kuliah di Ceko bisa gratis?",
        answer:
          "Ya — undang-undang Ceko menggratiskan pendidikan tinggi negeri dalam bahasa Ceko untuk semua kewarganegaraan. Yang berbayar adalah program berbahasa Inggris. Jadi B2 bahasa Ceko (dibuktikan ujian CCE atau ujian kampus) secara harfiah bernilai ratusan juta rupiah biaya kuliah.",
      },
      {
        question: "Berapa lama dari nol sampai B2 buat kuliah?",
        answer:
          "Rata-rata 18–24 bulan dengan 2–3 sesi seminggu. Banyak calon mahasiswa memakai pola: 12–15 bulan di Indonesia sampai B1, lalu program persiapan 1 semester di Ceko. Lebih murah daripada bayar kuliah program Inggris.",
      },
      {
        question: "Bunyi ř itu apa dan bisa dipelajari?",
        answer:
          "Bunyi khas Ceko (seperti r dan ž diucapkan bersamaan) — bahkan anak Ceko mempelajarinya paling akhir. Bisa dilatih dengan teknik bertahap, dan orang Ceko sangat memaklumi. Jangan biarkan satu huruf menghalangi kuliah gratis.",
      },
      {
        question: "CCE itu apa?",
        answer:
          "Ujian sertifikasi resmi dari Charles University (Institut Studi Bahasa & Persiapan), berjenjang A1–C1. CCE-A2 untuk permanent residence, B1 untuk kewarganegaraan, B2 untuk masuk kuliah. Kurikulum kami dipetakan ke formatnya.",
      },
      {
        question: "Ceko sama Slovakia bahasanya sama?",
        answer:
          "Beda tapi saling paham tinggi — orang Ceko dan Slovakia saling bicara bahasanya masing-masing. Belajar Ceko praktis memberi bonus Slovakia pasif.",
      },
    ],

    metaTitle: "Kursus Bahasa Ceko Online | Linguo.id — CCE & Kuliah Gratis di Praha",
    metaDescription:
      "Belajar Bahasa Ceko online dari nol. Target CCE B2 — kuliah gratis di universitas negeri Ceko. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa ceko",
      "les bahasa ceko online",
      "belajar bahasa ceko",
      "kuliah gratis di ceko",
      "kuliah di praha",
      "CCE exam persiapan",
      "kursus ceko jakarta",
      "les ceko murah",
      "bahasa ceko pemula",
      "beasiswa ceko",
    ],
  },

  // ==========================================================================
  // HUNGARIA
  // ==========================================================================
  hungaria: {
    urlSlug: "hungaria",
    languageSlug: "hungarian",
    tagline: "Dari szia sampai Budapest — bekal beasiswa Stipendium Hungaricum.",
    heroDescription:
      "Kursus Bahasa Hungaria online dengan kurikulum A1–B2. Ratusan pelajar Indonesia berangkat tiap tahun lewat Stipendium Hungaricum — bahasa Hungaria membuat hidupmu di sana benar-benar jalan.",

    whyLearn: [
      {
        icon: "🎓",
        title: "Stipendium Hungaricum — Kuota Indonesia Besar",
        description:
          "Beasiswa penuh pemerintah Hungaria memberi Indonesia ratusan kuota per tahun (S1–S3): kuliah, asrama, uang saku. Semua penerima wajib kuliah bahasa Hungaria di tahun pertama — mencicil dari sekarang membuatmu unggul.",
      },
      {
        icon: "🏭",
        title: "Manufaktur & Servis Eropa Tengah",
        description:
          "Audi, Mercedes, Bosch, dan SSC (shared service center) memenuhi Hungaria. Pekerja & profesional Indonesia mulai masuk — bahasa lokal kunci naik dari lini ke koordinasi.",
      },
      {
        icon: "🛁",
        title: "Budapest: Kota Pelajar Terbaik Eropa Tengah",
        description:
          "Biaya hidup ramah, kota indah, komunitas pelajar Indonesia besar. Tapi Hungaria bukan negara yang ramah-Inggris di luar kampus — bahasanya benar-benar dibutuhkan.",
      },
    ],

    targetAudience: [
      {
        emoji: "🎓",
        persona: "Awardee & Pemburu Stipendium Hungaricum",
        benefit: "Curi start kuliah bahasa wajib tahun pertama + hidup sehari-hari.",
      },
      {
        emoji: "🏭",
        persona: "Pekerja Manufaktur & SSC",
        benefit: "Percakapan kerja, kontrak, kehidupan di kota industri.",
      },
      {
        emoji: "💍",
        persona: "Pasangan WN Hungaria",
        benefit: "Percakapan keluarga & integrasi — Hungaria minim ber-Inggris.",
      },
      {
        emoji: "🧩",
        persona: "Pencinta Bahasa Unik",
        benefit: "Bahasa Uralik dengan logika aglutinatif yang memuaskan otak.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Kezdő",
        sessionCount: 48,
        description:
          "Mulai dari nol. Vokal harmoni, konjugasi dasar, kalimat sehari-hari — logika imbuhannya ternyata akrab bagi lidah Indonesia.",
        topics: [
          "Pelafalan: gy, ny, sz vs s, ö/ő ü/ű",
          "Vokal harmoni — kunci semua akhiran",
          "Konjugasi tentu vs tak tentu (alanyi/tárgyas)",
          "Angka, jam, belanja, kávézó",
          "Perkenalan & sapaan (szia vs jó napot)",
        ],
      },
      {
        level: "A2",
        title: "A2 — Alapfok",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar dengan sistem akhiran dasar.",
        topics: [
          "Kasus lokal 9 arah (ban/ba/ból dst) — dipetakan visual",
          "Lampau & masa depan",
          "Kepemilikan (házam, házad) & birtokos",
          "Prefiks verba (meg-, el-, ki-, be-)",
          "Topik: kampus, kerja, kesehatan, transportasi",
        ],
      },
      {
        level: "B1",
        title: "B1 — Középfok alsó",
        sessionCount: 80,
        description:
          "Diskusi topik luas & kebutuhan akademik dasar — level nyaman untuk hidup mandiri di Hungaria.",
        topics: [
          "Kondisional & imperatif-subjungtif",
          "Klausa relatif & kata sambung",
          "Bahasa kampus: ügyintézés, dokumen, email dosen",
          "Membaca Telex/Index ringan",
          "Percakapan telepon & layanan",
        ],
      },
      {
        level: "B2",
        title: "B2 — Középfok (ECL/Origó B2)",
        sessionCount: 112,
        description:
          "Mahir — setara ujian ECL/Origó B2 yang diakui untuk kuliah & kewarganegaraan.",
        topics: [
          "Igenevek (participle) & struktur formal",
          "Bahasa akademik & presentasi",
          "Magyar kantor: rapat, laporan, negosiasi",
          "Membaca HVG & teks akademik",
          "Simulasi ECL B2",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Katanya bahasa Hungaria salah satu tersulit di dunia. Benar?",
        answer:
          "Reputasi itu dari kacamata penutur Inggris. Untuk orang Indonesia ada bonus tak terduga: logika aglutinatif (akhiran ditumpuk seperti imbuhan kita), tanpa gender, tanpa banyak tenses, dan pelafalan konsisten. Yang baru cuma vokal harmoni & konjugasi tentu/tak tentu — dua-duanya sistematis.",
      },
      {
        question: "Saya sudah keterima Stipendium Hungaricum. Masih perlu les?",
        answer:
          "Program memang memberi kuliah bahasa tahun pertama, tapi realitasnya: kelas besar, progres lambat, dan kamu langsung harus hidup — belanja, asrama, birokrasi imigrasi — dalam bahasa Hungaria sejak minggu pertama. Awardee yang datang dengan A1–A2 hidupnya jauh lebih mulus.",
      },
      {
        question: "Orang Hungaria bisa bahasa Inggris nggak?",
        answer:
          "Generasi muda di Budapest — lumayan. Di luar itu (kantor imigrasi, dokter, penjual pasar, kota kecil) — sering tidak. Di antara negara tujuan pelajar Eropa, Hungaria termasuk yang paling membutuhkan bahasa lokalnya.",
      },
      {
        question: "Berapa lama sampai level hidup nyaman di Budapest?",
        answer:
          "A2 (urusan harian mandiri) sekitar 8–12 bulan dengan 2–3 sesi seminggu. Pola favorit calon awardee: mulai saat pengumuman seleksi (~6 bulan sebelum berangkat) supaya tiba dengan A1–A2.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia alumni Hungaria (mayoritas eks-awardee Stipendium Hungaricum) plus opsi native. Mereka juga paham seluk-beluk beasiswanya — bonus mentoring aplikasi.",
      },
    ],

    metaTitle: "Kursus Bahasa Hungaria Online | Linguo.id — Bekal Stipendium Hungaricum",
    metaDescription:
      "Belajar Bahasa Hungaria online dari nol. Bekal Stipendium Hungaricum, hidup di Budapest, ECL B2. Pengajar alumni Hungaria. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa hungaria",
      "les bahasa hungaria online",
      "belajar bahasa hungaria",
      "stipendium hungaricum",
      "beasiswa hungaria",
      "kuliah di hungaria",
      "kursus hungaria jakarta",
      "les hungaria murah",
      "bahasa hungaria pemula",
      "bahasa magyar",
    ],
  },

  // ==========================================================================
  // RUMANIA
  // ==========================================================================
  rumania: {
    urlSlug: "rumania",
    languageSlug: "romanian",
    tagline: "Bahasa Latin yang tersembunyi di Timur — dari salut sampai beasiswa Bukares.",
    heroDescription:
      "Kursus Bahasa Rumania online dengan kurikulum CEFR A1–B2. Bahasa Roman (serumpun Italia-Spanyol!) di Eropa Timur — untuk beasiswa pemerintah Rumania, kerja IT & manufaktur, dan pasangan.",

    whyLearn: [
      {
        icon: "🎓",
        title: "Beasiswa Pemerintah Rumania",
        description:
          "Beasiswa penuh tahunan untuk pelajar Indonesia (S1–S3) dengan tahun persiapan bahasa. Kampus tua seperti Universitas Bukares & Babeș-Bolyai, biaya hidup di antara termurah di UE.",
      },
      {
        icon: "🗣️",
        title: "Diam-diam Serumpun Italia & Spanyol",
        description:
          "Rumania bahasa Roman — kosakatanya beririsan besar dengan Italia, Spanyol, Prancis. Kalau kamu pernah belajar salah satunya, Rumania terasa setengah kenal. Kalau belum: satu batu loncatan ke seluruh rumpun.",
      },
      {
        icon: "💻",
        title: "IT Hub & Manufaktur yang Naik Daun",
        description:
          "Bukares & Cluj pusat IT outsourcing Eropa; Dacia-Renault & pabrik komponen menyebar. Pekerja asing bertambah — bahasa lokal tetap mata uang utama di luar kantor tech.",
      },
    ],

    targetAudience: [
      {
        emoji: "🎓",
        persona: "Pemburu Beasiswa Rumania",
        benefit: "Curi start tahun persiapan bahasa + nilai plus aplikasi.",
      },
      {
        emoji: "💻",
        persona: "Profesional IT & Manufaktur",
        benefit: "Percakapan kantor & kehidupan di Bukares/Cluj.",
      },
      {
        emoji: "💍",
        persona: "Pasangan WN Rumania",
        benefit: "Percakapan keluarga & syarat bahasa kewarganegaraan.",
      },
      {
        emoji: "🧛",
        persona: "Penikmat Budaya & Traveler",
        benefit: "Transylvania, Carpathia, sastra — melampaui klise Dracula.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Începător",
        sessionCount: 48,
        description:
          "Mulai dari nol. Pelafalan hampir se-konsisten Spanyol, kalimat dasar sehari-hari.",
        topics: [
          "Pelafalan: ă, â/î, ș, ț — sisanya nyaris fonetik",
          "Artikel tersufiks (omul, casa) — ciri khas Rumania",
          "A fi, a avea + konjugasi present",
          "Angka, jam, belanja, restoran",
          "Perkenalan & sapaan formal-informal",
        ],
      },
      {
        level: "A2",
        title: "A2 — Elementar",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar dengan struktur dasar lengkap.",
        topics: [
          "Perfect compus & imperfect",
          "Masa depan (o să / voi)",
          "Pronomina objek & datif",
          "Kasus genitif-datif praktis",
          "Topik: kerja, kesehatan, perjalanan, rumah",
        ],
      },
      {
        level: "B1",
        title: "B1 — Intermediar",
        sessionCount: 80,
        description:
          "Diskusi topik luas, baca berita ringan — level nyaman hidup mandiri di Rumania.",
        topics: [
          "Conjunctiv (să + verba) — jantung kalimat Rumania",
          "Condițional & pengandaian",
          "Klausa relatif (care) & kalimat kompleks",
          "Membaca Digi24/HotNews ringan",
          "Bahasa kampus & birokrasi",
        ],
      },
      {
        level: "B2",
        title: "B2 — Avansat",
        sessionCount: 112,
        description:
          "Mahir akademik & profesional — level ujian atestat untuk kuliah & kewarganegaraan.",
        topics: [
          "Gaya formal & bahasa akademik",
          "Română de afaceri: email, rapat, prezentare",
          "Membaca pers & teks akademik",
          "Sastra ringan: Eliade, Cărtărescu berpanduan",
          "Simulasi ujian bahasa tingkat B2",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Bahasa Rumania mirip bahasa apa?",
        answer:
          "Italia adalah kerabat terdekatnya yang terasa — sekitar 77% leksikal sama. Orang yang pernah belajar Italia/Spanyol/Prancis akan sering 'menebak benar'. Lapisan Slavia-nya menambah rasa khas, tapi tulang punggungnya tetap Latin.",
      },
      {
        question: "Beasiswa pemerintah Rumania itu gimana skemanya?",
        answer:
          "Dibuka tiap tahun via Kementerian Luar Negeri Rumania: bebas biaya kuliah, asrama, dan tunjangan, untuk S1–S3. Kuliahnya berbahasa Rumania — penerima tanpa bahasa menjalani 1 tahun persiapan. Mencicil dari Indonesia bisa memangkas atau meringankan tahun itu.",
      },
      {
        question: "Susah nggak dibanding bahasa Latin lain?",
        answer:
          "Sedikit lebih 'bertekstur': ada sisa kasus (genitif-datif) dan artikel yang menempel di belakang kata. Tapi pelafalannya konsisten dan strukturnya tetap Roman yang ramah. Di antara bahasa Eropa Timur, ini pintu masuk paling landai.",
      },
      {
        question: "Berapa lama sampai level percakapan?",
        answer:
          "A2 rata-rata 7–10 bulan dengan 2–3 sesi seminggu (lebih cepat kalau punya dasar Roman lain). B1 — hidup mandiri & kuliah persiapan — sekitar 14–18 bulan.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia alumni Rumania (eks-penerima beasiswa) plus opsi native. Bonus: mereka paham alur aplikasi beasiswanya.",
      },
    ],

    metaTitle: "Kursus Bahasa Rumania Online | Linguo.id — A1 sampai B2",
    metaDescription:
      "Belajar Bahasa Rumania online dari nol. Serumpun Italia-Spanyol, beasiswa pemerintah Rumania, kerja di Bukares. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa rumania",
      "les bahasa rumania online",
      "belajar bahasa rumania",
      "beasiswa rumania",
      "kuliah di rumania",
      "kursus rumania jakarta",
      "les rumania murah",
      "bahasa rumania pemula",
      "bahasa romania",
      "kerja di rumania",
    ],
  },

  // ==========================================================================
  // BULGARIA
  // ==========================================================================
  bulgaria: {
    urlSlug: "bulgaria",
    languageSlug: "bulgarian",
    tagline: "Dari zdravei sampai Sofia — tanah kelahiran aksara Sirilik.",
    heroDescription:
      "Kursus Bahasa Bulgaria online dengan kurikulum CEFR A1–B2. Bahasa Slavia paling ramah pemula — tanpa kasus! — untuk kerja & pabrik di Bulgaria, studi murah, dan pasangan.",

    whyLearn: [
      {
        icon: "🏭",
        title: "Tujuan Kerja Baru Pekerja Indonesia",
        description:
          "Bulgaria mulai merekrut pekerja Indonesia — manufaktur, tekstil, hospitality resort Laut Hitam. Upah UE dengan persaingan pelamar lebih longgar; bahasa lokal langsung membedakan.",
      },
      {
        icon: "⭐",
        title: "Bahasa Slavia Termudah",
        description:
          "Satu-satunya bahasa Slavia besar TANPA sistem kasus — kata bendanya tak berubah-ubah seperti Rusia atau Polandia. Kalau mau masuk dunia Slavia lewat pintu paling landai, ini dia.",
      },
      {
        icon: "📜",
        title: "Rumah Asli Aksara Sirilik",
        description:
          "Sirilik lahir di Bulgaria abad ke-9 (St. Kliment Ohridski) — dan Bulgaria merayakannya tiap 24 Mei. Belajar di sini berarti membaca Sirilik dari sumbernya, bonus modal ke Rusia & Ukraina.",
      },
    ],

    targetAudience: [
      {
        emoji: "🏭",
        persona: "Pekerja Indonesia Tujuan Bulgaria",
        benefit: "Percakapan pabrik & resort, kontrak, kehidupan sehari-hari.",
      },
      {
        emoji: "🎓",
        persona: "Calon Mahasiswa (Kedokteran!)",
        benefit: "Sofia & Plovdiv tujuan kuliah kedokteran berbiaya ringan.",
      },
      {
        emoji: "💍",
        persona: "Pasangan WN Bulgaria",
        benefit: "Percakapan keluarga & syarat bahasa naturalisasi.",
      },
      {
        emoji: "🌹",
        persona: "Pebisnis & Penikmat Balkan",
        benefit: "Rose oil, tekstil, properti Laut Hitam — pasar yang belum ramai.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Начинаещ",
        sessionCount: 48,
        description:
          "Mulai dari nol. Sirilik Bulgaria tuntas cepat, kalimat dasar tanpa beban kasus.",
        topics: [
          "Sirilik 30 huruf versi Bulgaria",
          "Artikel tersufiks (столът, книгата)",
          "Съм (to be) & konjugasi present",
          "Angka, jam, belanja — dan anggukan yang terbalik!",
          "Perkenalan & sapaan",
        ],
      },
      {
        level: "A2",
        title: "A2 — Основен",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar dengan aspek verba dasar.",
        topics: [
          "Aspek verba: свършен vs несвършен",
          "Lampau аорист & имперфект praktis",
          "Masa depan (ще) — paling simpel se-Slavia",
          "Pronomina klitik (го, я, му)",
          "Topik: kerja, kesehatan, rumah, transportasi",
        ],
      },
      {
        level: "B1",
        title: "B1 — Среден",
        sessionCount: 80,
        description:
          "Diskusi topik luas & baca berita ringan — level hidup mandiri di Bulgaria.",
        topics: [
          "Преизказно наклонение (evidential — khas Bulgaria)",
          "Kondisional & kalimat kompleks",
          "Bahasa kerja: kontrak, shift, dokumen",
          "Membaca Dnevnik/БНТ ringan",
          "Percakapan birokrasi & layanan",
        ],
      },
      {
        level: "B2",
        title: "B2 — Напреднал",
        sessionCount: 112,
        description:
          "Mahir profesional & akademik — level ujian bahasa untuk kuliah & kewarganegaraan.",
        topics: [
          "Gaya formal & bahasa dokumen",
          "Бизнес български: rapat, email, negosiasi",
          "Membaca Capital & teks akademik",
          "Presentasi & diskusi penuh",
          "Simulasi ujian standar B2 (СУ/ДЕО)",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Benarkah bahasa Bulgaria paling gampang di antara bahasa Slavia?",
        answer:
          "Untuk pemula — ya. Bulgaria (bersama Makedonia) membuang sistem kasus yang jadi momok Rusia/Polandia/Ceko: kata benda tak berubah bentuk. Verba-nya memang kaya, tapi dipakai berulang jadi cepat otomatis. Plus Sirilik cuma butuh 3–4 sesi.",
      },
      {
        question: "Anggukan kepala di Bulgaria terbalik — serius?",
        answer:
          "Serius: geleng = ya, angguk = tidak. Kami bahas di sesi pertama supaya kamu tak salah beli barang di Sofia. Budaya seperti ini melekat di kurikulum, bukan cuma bahasa.",
      },
      {
        question: "Kerja di Bulgaria lewat agen, perlu bahasa nggak?",
        answer:
          "Sama seperti Polandia: tidak wajib berangkat, sangat menentukan nasib di sana. Yang bisa dasar Bulgaria paham kontraknya, bisa ke dokter sendiri, dan naik posisi. Track 'bekal pra-keberangkatan' 3–4 bulan kami dirancang persis untuk ini.",
      },
      {
        question: "Kalau sudah bisa Rusia, Bulgaria gampang?",
        answer:
          "Sangat — Sirilik sama, kosakata beririsan besar. Tinggal membiasakan artikel tersufiks dan melupakan kasus (enak, kan). Berlaku juga sebaliknya: Bulgaria jadi batu loncatan ringan ke Rusia.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Bulgaria (diaspora & alumni) plus opsi native. Materi kerja & birokrasi diambil dari pengalaman nyata komunitas Indonesia di sana.",
      },
    ],

    metaTitle: "Kursus Bahasa Bulgaria Online | Linguo.id — Slavia Tanpa Kasus",
    metaDescription:
      "Belajar Bahasa Bulgaria online dari nol. Sirilik, bahasa Slavia termudah, bekal kerja & kuliah di Bulgaria. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa bulgaria",
      "les bahasa bulgaria online",
      "belajar bahasa bulgaria",
      "kerja di bulgaria",
      "kuliah di bulgaria",
      "kursus bulgaria jakarta",
      "les bulgaria murah",
      "bahasa bulgaria pemula",
      "belajar sirilik bulgaria",
      "kerja pabrik eropa",
    ],
  },

  // ==========================================================================
  // UKRAINA
  // ==========================================================================
  ukraina: {
    urlSlug: "ukraina",
    languageSlug: "ukrainian",
    tagline: "Dari pryvit sampai Kyiv — bahasa 40 juta penutur yang dunia sedang pelajari.",
    heroDescription:
      "Kursus Bahasa Ukraina online dengan kurikulum CEFR A1–B2. Untuk pekerja kemanusiaan & NGO, profesional rekonstruksi, akademisi studi Eropa Timur, dan penutur Rusia yang ingin beralih.",

    whyLearn: [
      {
        icon: "🕊️",
        title: "Kemanusiaan & Rekonstruksi",
        description:
          "Organisasi internasional, NGO, dan program rekonstruksi Ukraina membutuhkan staf berbahasa Ukraina — dan akan bertahun-tahun ke depan. Kombinasi profesional Indonesia + bahasa Ukraina nyaris tak ada saingan.",
      },
      {
        icon: "🌻",
        title: "Bahasa yang Sedang Bangkit",
        description:
          "40 juta penutur, dan pemakaiannya justru menguat — media, tech (Grammarly, GitLab lahir di sini), dan diaspora global. Belajar sekarang berarti ikut momen sejarah bahasanya.",
      },
      {
        icon: "🎓",
        title: "Studi Eropa Timur & Jurnalisme",
        description:
          "Peneliti, jurnalis, dan analis kawasan tak lagi bisa mengandalkan bahasa Rusia saja untuk memahami Ukraina. Sumber primer, wawancara, dan arsip berbahasa Ukraina.",
      },
    ],

    targetAudience: [
      {
        emoji: "🕊️",
        persona: "Pekerja NGO & Kemanusiaan",
        benefit: "Percakapan lapangan, wawancara, koordinasi program.",
      },
      {
        emoji: "🏗️",
        persona: "Profesional Rekonstruksi & Bisnis",
        benefit: "Bahasa proyek: konstruksi, logistik, tender internasional.",
      },
      {
        emoji: "📰",
        persona: "Jurnalis & Peneliti Kawasan",
        benefit: "Sumber primer, media lokal, wawancara tanpa penerjemah.",
      },
      {
        emoji: "🔄",
        persona: "Penutur Rusia yang Beralih",
        benefit: "Jalur cepat khusus: fokus perbedaan, bukan mulai dari nol.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Початківець",
        sessionCount: 48,
        description:
          "Mulai dari nol. Sirilik versi Ukraina (і, ї, є, ґ), pelafalan merdu, kalimat dasar.",
        topics: [
          "Sirilik Ukraina 33 huruf — beda dari Rusia",
          "Pelafalan: г vs ґ, vokal jernih tanpa reduksi",
          "Gender & verba бути, мати + present",
          "Angka, jam, belanja, transportasi",
          "Perkenalan & sapaan",
        ],
      },
      {
        level: "A2",
        title: "A2 — Базовий",
        sessionCount: 64,
        description: "Percakapan sehari-hari dengan kasus dasar.",
        topics: [
          "Kasus inti dengan pola frekuensi",
          "Aspek verba: доконаний vs недоконаний",
          "Lampau & masa depan (termasuk sintetis -му)",
          "Verba gerak dasar",
          "Topik: keluarga, kerja, kota, kesehatan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Середній",
        sessionCount: 80,
        description:
          "Diskusi topik luas & membaca media — level kerja lapangan fungsional.",
        topics: [
          "7 kasus lengkap termasuk vokatif (khas Ukraina!)",
          "Verba gerak berprefiks",
          "Bahasa kerja NGO: koordinasi, laporan, wawancara",
          "Membaca Ukrainska Pravda ringan",
          "Kondisional & kalimat kompleks",
        ],
      },
      {
        level: "B2",
        title: "B2 — Вищий",
        sessionCount: 112,
        description:
          "Mahir profesional — media, dokumen resmi, dan konteks budaya penuh.",
        topics: [
          "Participle & gaya formal tulis",
          "Bahasa dokumen & birokrasi",
          "Media penuh: Suspilne, hromadske",
          "Sastra modern: Zhadan, Andrukhovych berpanduan",
          "Simulasi ujian derzhavnyi (УМІ) B2",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Ukraina dan Rusia bahasanya sama nggak sih?",
        answer:
          "Beda bahasa — serumpun tapi tidak identik (leksikal ~62% sama; Ukraina justru lebih dekat ke Polandia & Belarusia dalam banyak hal). Alfabetnya pun beda beberapa huruf. Menganggapnya 'dialek Rusia' keliru secara linguistik.",
      },
      {
        question: "Saya sudah bisa bahasa Rusia. Ada jalur cepatnya?",
        answer:
          "Ada — track konversi khusus: fokus ke perbedaan sistematis (fonetik і/и, kosakata palsu-kembar, vokatif, masa depan sintetis) tanpa mengulang dari nol. Biasanya B1 tercapai dalam sepertiga waktu normal.",
      },
      {
        question: "Relevan nggak belajar sekarang?",
        answer:
          "Justru sangat: kebutuhan penutur Ukraina di organisasi internasional, program rekonstruksi, dan media naik tajam dan akan panjang. Sisi lain: penuturnya sendiri makin memilih Ukraina dibanding Rusia — arah bahasanya sedang naik.",
      },
      {
        question: "Berapa lama sampai level kerja lapangan?",
        answer:
          "B1 fungsional dari nol sekitar 16–20 bulan reguler; dengan dasar bahasa Slavia lain, jauh lebih cepat. Untuk penugasan mendesak tersedia jalur intensif berfokus percakapan.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Ukraina plus penutur native (termasuk diaspora). Materi memakai media Ukraina asli sejak level menengah.",
      },
    ],

    metaTitle: "Kursus Bahasa Ukraina Online | Linguo.id — A1 sampai B2",
    metaDescription:
      "Belajar Bahasa Ukraina online dari nol. Untuk NGO & kemanusiaan, rekonstruksi, riset kawasan. Track khusus penutur Rusia. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa ukraina",
      "les bahasa ukraina online",
      "belajar bahasa ukraina",
      "kursus ukraina jakarta",
      "les ukraina murah",
      "bahasa ukraina pemula",
      "bahasa ukraina vs rusia",
      "kerja NGO ukraina",
      "belajar sirilik ukraina",
      "bahasa ukrainska",
    ],
  },
  // ==========================================================================
  // IBRANI
  // ==========================================================================
  ibrani: {
    urlSlug: "ibrani",
    languageSlug: "hebrew",
    tagline: "Dari alef sampai shalom — bahasa Alkitab yang dihidupkan kembali.",
    heroDescription:
      "Kursus Bahasa Ibrani (Modern) online dengan kurikulum A1–B2 gaya Ulpan. Untuk mahasiswa teologi & pembaca Perjanjian Lama, akademisi, dan pembelajar bahasa dengan kisah kebangkitan paling unik di dunia.",

    whyLearn: [
      {
        icon: "📖",
        title: "Membaca Perjanjian Lama dari Sumbernya",
        description:
          "Kejadian, Mazmur, Yesaya — dalam bahasa aslinya, nuansa yang hilang di terjemahan hidup kembali. Mahasiswa teologi & pendeta di Indonesia menjadikan Ibrani bekal eksegesis yang sesungguhnya.",
      },
      {
        icon: "🕎",
        title: "Bahasa yang Bangkit dari 'Mati'",
        description:
          "Satu-satunya bahasa di dunia yang berhasil dihidupkan kembali dari bahasa liturgi menjadi bahasa ibu jutaan orang. Belajar Ibrani Modern = menyentuh eksperimen linguistik paling berhasil dalam sejarah.",
      },
      {
        icon: "🎓",
        title: "Studi Timur Tengah & Arkeologi",
        description:
          "Riset arkeologi Levant, naskah Laut Mati, dan studi Timur Tengah membutuhkan Ibrani — kuno maupun modern. Jembatan dari Modern ke Biblical kami sediakan di level atas.",
      },
    ],

    targetAudience: [
      {
        emoji: "✝️",
        persona: "Mahasiswa Teologi & Pendeta",
        benefit: "Jalur Modern → Biblical Hebrew untuk eksegesis Perjanjian Lama.",
      },
      {
        emoji: "📜",
        persona: "Akademisi & Peminat Naskah Kuno",
        benefit: "Fondasi membaca teks — dari koran Tel Aviv sampai Gulungan Laut Mati.",
      },
      {
        emoji: "🧠",
        persona: "Pembelajar Bahasa Serius",
        benefit: "Sistem akar 3 konsonan (shoresh) — logika bahasa Semit yang elegan.",
      },
      {
        emoji: "💼",
        persona: "Profesional & Peneliti Tech",
        benefit: "Ekosistem riset & startup — banyak paper dan komunitas berbahasa Ibrani.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "Alef — Pemula",
        sessionCount: 48,
        description:
          "Mulai dari nol gaya Ulpan. Alef-bet, membaca dengan & tanpa niqqud, kalimat dasar.",
        topics: [
          "Alef-bet 22 huruf + huruf akhir, baca kanan-ke-kiri",
          "Niqqud (harakat) & transisi membaca tanpanya",
          "Kalimat nominal (tanpa 'to be' di present)",
          "Gender & bilangan — maskulin/feminin",
          "Perkenalan, angka, belanja, sapaan (shalom, mah nishma)",
        ],
      },
      {
        level: "A2",
        title: "Bet — Dasar",
        sessionCount: 64,
        description: "Percakapan sehari-hari dengan sistem binyanim dasar.",
        topics: [
          "Shoresh (akar 3 konsonan) — kunci seluruh bahasa",
          "Binyan Pa'al & Pi'el: present, past",
          "Smichut (rantai kata benda) dasar",
          "Preposisi menyatu (ba-, la-, mi-)",
          "Topik: keluarga, kerja, makanan, perjalanan",
        ],
      },
      {
        level: "B1",
        title: "Gimel — Menengah",
        sessionCount: 80,
        description:
          "Diskusi topik luas, membaca teks tanpa niqqud dengan nyaman, dan pintu ke teks Alkitab dibuka.",
        topics: [
          "7 binyanim lengkap: aktif, pasif, refleksif",
          "Masa depan & imperatif",
          "Membaca berita ringan (Ynet) tanpa niqqud",
          "Pengantar Biblical Hebrew: perbedaan inti & vav-consecutive",
          "Membaca Kejadian 1 & Mazmur pilihan berpanduan",
        ],
      },
      {
        level: "B2",
        title: "Dalet — Atas",
        sessionCount: 112,
        description:
          "Mahir modern & fondasi kuat teks klasik — track terbagi sesuai tujuan: akademik modern atau Biblical.",
        topics: [
          "Sintaks kompleks & gaya formal",
          "Track Biblical: puisi Ibrani, Yesaya, narasi Samuel",
          "Track Modern: akademik, media, presentasi",
          "Kamus & tools riset (BDB, konkordansi, Even-Shoshan)",
          "Membaca Haaretz / teks Masoret sesuai track",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Saya mau baca Alkitab Ibrani. Kenapa mulai dari Ibrani Modern?",
        answer:
          "Bisa langsung Biblical, tapi pengalaman kami: yang lewat Modern dulu lebih cepat DAN lebih tahan lama — karena bahasanya hidup, bisa dipakai ngobrol, dan 80% kosakata inti Alkitab sama. Grammar Biblical (vav-consecutive dll) kami masukkan sebagai jembatan mulai B1. Yang tetap mau langsung Biblical, tersedia track khusus.",
      },
      {
        question: "Baca tanpa harakat (niqqud) itu gimana caranya?",
        answer:
          "Sama seperti Arab gundul: pola. Ibrani ditulis dewasa tanpa niqqud, dan pembaca mengenali kata dari akar & konteks. Kami melatihnya bertahap — mulai dengan niqqud penuh, lalu dilepas sedikit demi sedikit sampai koran Tel Aviv terbaca.",
      },
      {
        question: "Ibrani sama Arab mirip?",
        answer:
          "Serumpun Semit — logika akar 3 konsonan, kalimat nominal, dan banyak kosakata sepupu (shalom–salam, melekh–malik). Kalau kamu pernah belajar Arab, Ibrani terasa setengah kenal; kalau belum, Ibrani jadi pintu masuk rumpun Semit yang lebih landai (grammar-nya lebih ramping).",
      },
      {
        question: "Berapa lama sampai bisa baca Perjanjian Lama?",
        answer:
          "Narasi prosa (Kejadian, Rut, Yunus) mulai terbaca berpanduan di B1 — sekitar 12–16 bulan. Puisi (Mazmur, Ayub) dan nabi-nabi butuh level Dalet. Lebih cepat dari kelas seminari tradisional karena bahasanya kamu pakai aktif, bukan cuma diparsing.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia berlatar studi teologi/linguistik Semit yang fasih Ibrani Modern, plus opsi native. Untuk track Biblical, pengajarnya memegang keduanya — Modern dan klasik.",
      },
    ],

    metaTitle: "Kursus Bahasa Ibrani Online | Linguo.id — Modern & Biblical Hebrew",
    metaDescription:
      "Belajar Bahasa Ibrani online dari alef-bet. Ibrani Modern gaya Ulpan + jembatan ke Biblical Hebrew untuk teologi. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa ibrani",
      "les bahasa ibrani online",
      "belajar bahasa ibrani",
      "biblical hebrew indonesia",
      "bahasa ibrani alkitab",
      "belajar alef bet",
      "kursus ibrani jakarta",
      "les ibrani murah",
      "bahasa ibrani modern",
      "bahasa ibrani untuk teologi",
    ],
  },

  // ==========================================================================
  // PERSIA
  // ==========================================================================
  persia: {
    urlSlug: "persia",
    languageSlug: "persian",
    tagline: "Dari salām sampai Rumi — bahasa puisi terindah di dunia.",
    heroDescription:
      "Kursus Bahasa Persia (Farsi) online dengan kurikulum A1–B2. Untuk pembaca Rumi, Hafez & sastra tasawuf, akademisi studi Islam & Timur Tengah, dan penjelajah peradaban Iran raya.",

    whyLearn: [
      {
        icon: "🌹",
        title: "Rumi & Hafez Tanpa Perantara",
        description:
          "Matsnawi Rumi, Divan Hafez, Shahnameh Ferdowsi — puisi yang terjemahannya saja mengubah hidup orang. Dalam bahasa aslinya, dimensinya berlipat. Sastra tasawuf dunia berbahasa Persia.",
      },
      {
        icon: "🕌",
        title: "Studi Islam & Filologi Nusantara",
        description:
          "Khazanah tasawuf yang mengalir ke Nusantara banyak berbahasa Persia, dan naskah-naskah kuno kita menyimpan jejaknya. Peneliti studi Islam, filolog, dan santri kajian tasawuf sangat diuntungkan.",
      },
      {
        icon: "🗺️",
        title: "Satu Bahasa, Tiga Negara",
        description:
          "Farsi (Iran), Dari (Afganistan), Tajik (Tajikistan) — intinya satu bahasa. Grammar-nya termasuk paling ramah di kawasan: tanpa gender, tanpa kasus, konjugasi teratur.",
      },
    ],

    targetAudience: [
      {
        emoji: "🌹",
        persona: "Pembaca Sastra & Tasawuf",
        benefit: "Jalur menuju Rumi, Hafez, Attar dalam teks asli berpanduan.",
      },
      {
        emoji: "🎓",
        persona: "Akademisi Studi Islam & Sejarah",
        benefit: "Sumber primer Persia + beasiswa universitas Iran (Al-Mustafa dll).",
      },
      {
        emoji: "📜",
        persona: "Filolog & Peneliti Naskah",
        benefit: "Membaca naskah & pengaruh Persia di khazanah Nusantara.",
      },
      {
        emoji: "🎬",
        persona: "Penikmat Budaya Iran",
        benefit: "Sinema Iran (Kiarostami, Farhadi), musik, dan percakapan.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula",
        sessionCount: 48,
        description:
          "Mulai dari nol. Aksara Persia (Arab + 4 huruf ekstra), pelafalan, kalimat dasar.",
        topics: [
          "Aksara: 32 huruf termasuk پ چ ژ گ, bentuk sambung",
          "Pelafalan Persia — lebih lembut dari Arab",
          "Kalimat SOV & ezāfe (-e penghubung)",
          "Budan/dāshtan + konjugasi present",
          "Perkenalan, angka, belanja, ta'ārof dikenalkan",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar — grammar Persia yang ramah mulai terasa.",
        topics: [
          "Lampau sederhana & imperfek (mi-)",
          "Masa depan & subjunktif (be-)",
          "Objek tentu rā & pronomina enklitik",
          "Perbedaan tulisan vs lisan (ketābi vs goftāri)",
          "Topik: keluarga, perjalanan, makanan, seni",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah",
        sessionCount: 80,
        description:
          "Diskusi topik luas, membaca prosa modern, dan bait-bait pertama sastra klasik.",
        topics: [
          "Verba majemuk (kardan-compounds) — jantung Farsi",
          "Kalimat kompleks & ke-clauses",
          "Ta'ārof (etiket kesopanan) dalam praktik",
          "Membaca BBC Persian ringan & prosa pendek",
          "Rubā'i pertama: Khayyām berpanduan",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas (Gerbang Sastra)",
        sessionCount: 112,
        description:
          "Mahir modern & masuk ke klasik: Hafez, Rumi, dan bahasa akademik.",
        topics: [
          "Gaya formal & bahasa akademik-jurnalistik",
          "Aruz (metrum) dasar untuk membaca puisi",
          "Hafez & Rumi: ghazal dan matsnawi berpanduan",
          "Perbedaan Farsi-Dari-Tajik",
          "Membaca esai & sumber akademik Iran",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Bahasa Persia sama bahasa Arab itu beda?",
        answer:
          "Sangat beda — beda rumpun sekalian. Persia itu Indo-Eropa (sepupu jauh Inggris & Hindi), cuma meminjam aksara Arab dan sebagian kosakata. Grammar-nya jauh lebih ramah: tanpa gender, tanpa i'rab, konjugasi teratur. Yang sudah bisa baca hijaiyah dapat diskon besar di aksara.",
      },
      {
        question: "Berapa lama sampai bisa membaca Rumi?",
        answer:
          "Prosa modern terbaca nyaman di B1 (12–16 bulan). Puisi klasik (Rumi, Hafez) mulai dibuka berpanduan di B2 — bahasanya berumur 700 tahun tapi orang Iran modern masih membacanya, seperti kita membaca sastra Melayu klasik. Jalur penuh sekitar 2 tahun — sepadan dengan tujuannya.",
      },
      {
        question: "Ta'ārof itu apa dan kenapa penting?",
        answer:
          "Sistem etiket kesopanan Persia — menawarkan, menolak halus, merendah — yang mengatur hampir semua interaksi. Tanpa memahaminya, kalimat yang benar pun bisa salah makna. Kami mengajarkannya melekat di percakapan sejak A1.",
      },
      {
        question: "Farsi, Dari, Tajik — belajar yang mana?",
        answer:
          "Kurikulum kami Farsi Iran standar (Tehran) — paling banyak materi & media. Dari (Afganistan) praktis sama dengan beda aksen & sebagian kosakata; Tajik memakai Sirilik. Dari Farsi standar, keduanya tinggal penyesuaian.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia berlatar studi Persia/Timur Tengah (beberapa alumni Iran) plus opsi native. Untuk track sastra, pengajarnya memang pembaca sastra klasik.",
      },
    ],

    metaTitle: "Kursus Bahasa Persia Online | Linguo.id — Farsi, dari Nol sampai Rumi",
    metaDescription:
      "Belajar Bahasa Persia (Farsi) online dari nol. Aksara, percakapan, sampai membaca Rumi & Hafez. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa persia",
      "les bahasa persia online",
      "belajar bahasa persia",
      "belajar bahasa farsi",
      "kursus farsi",
      "bahasa iran",
      "belajar bahasa iran",
      "sastra rumi hafez",
      "les persia murah",
      "bahasa persia pemula",
    ],
  },

  // ==========================================================================
  // GEORGIA
  // ==========================================================================
  georgia: {
    urlSlug: "georgia",
    languageSlug: "georgian",
    tagline: "Dari gamarjoba sampai aksara terindah dunia — bahasa Kaukasus yang tak mirip apa pun.",
    heroDescription:
      "Kursus Bahasa Georgia online dengan kurikulum A1–B2. Untuk mahasiswa kedokteran di Tbilisi, digital nomad & pemilik bisnis di Georgia, dan kolektor bahasa yang mencari tantangan sejati.",

    whyLearn: [
      {
        icon: "🩺",
        title: "Kuliah Kedokteran yang Ramah Kantong",
        description:
          "Tbilisi State Medical University & kampus lain jadi tujuan mahasiswa kedokteran internasional — biaya jauh di bawah Eropa Barat, diakui WFME. Kuliahnya berbahasa Inggris, tapi pasien di rumah sakit berbahasa Georgia.",
      },
      {
        icon: "💻",
        title: "Surga Digital Nomad & Bisnis Kecil",
        description:
          "Visa bebas setahun, pajak ramah, biaya hidup rendah — Tbilisi & Batumi penuh nomad dan pemilik usaha asing. Yang bisa bahasa Georgia keluar dari gelembung ekspat dan masuk komunitas (dan supra!) sungguhan.",
      },
      {
        icon: "🍷",
        title: "Peradaban Anggur & Aksara Sendiri",
        description:
          "8000 tahun tradisi wine (tertua di dunia), polifoni UNESCO, dan mkhedruli — aksara yang sering disebut terindah di dunia. Bahasa Kartvelian tak berkerabat dengan bahasa mana pun.",
      },
    ],

    targetAudience: [
      {
        emoji: "🩺",
        persona: "Mahasiswa Kedokteran di Georgia",
        benefit: "Bahasa pasien untuk rotasi klinik + kehidupan Tbilisi.",
      },
      {
        emoji: "💻",
        persona: "Digital Nomad & Pemilik Bisnis",
        benefit: "Keluar dari gelembung ekspat: pasar, birokrasi, komunitas.",
      },
      {
        emoji: "💍",
        persona: "Pasangan & Calon Penduduk",
        benefit: "Integrasi keluarga & syarat bahasa naturalisasi.",
      },
      {
        emoji: "🧗",
        persona: "Kolektor Bahasa & Petualang",
        benefit: "Rumpun Kartvelian — pengalaman linguistik yang tak ada duanya.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula",
        sessionCount: 48,
        description:
          "Mulai dari nol. Mkhedruli 33 huruf, konsonan ejektif, kalimat dasar sehari-hari.",
        topics: [
          "Mkhedruli — tanpa huruf besar, tanpa ejaan aneh",
          "Konsonan ejektif (პ ტ კ ყ) dengan drill audio",
          "Kalimat dasar & verba ser umum",
          "Angka (sistem 20-an!), belanja, bazar",
          "Perkenalan & keramahan Georgia (gamarjoba, madloba)",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar",
        sessionCount: 64,
        description: "Percakapan sehari-hari — dengan sistem verba yang dijinakkan bertahap.",
        topics: [
          "Kasus dasar: nominatif, datif, ergatif dikenalkan",
          "Verba present & future series",
          "Postposisi & kepemilikan",
          "Topik: transportasi, marshrutka, kafe, pasar",
          "Percakapan supra (jamuan) & toast dasar",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah",
        sessionCount: 80,
        description:
          "Diskusi topik luas & percakapan klinik/bisnis dasar — level fungsional Tbilisi.",
        topics: [
          "Aorist & ergatif dalam praktik",
          "Verba polipersonal — bertahap dengan pola frekuensi",
          "Bahasa klinik: keluhan pasien, anamnesis dasar",
          "Bahasa bisnis kecil: sewa, bank, birokrasi",
          "Membaca berita ringan & tanda-tanda kota",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas",
        sessionCount: 112,
        description:
          "Mahir — percakapan penuh, media, dan budaya dari dalam.",
        topics: [
          "Screeve system lengkap & perfect series",
          "Bahasa formal & dokumen",
          "Membaca media Georgia (Netgazeti) & sastra ringan",
          "Polifoni, supra & budaya dari sumber asli",
          "Persiapan ujian bahasa naturalisasi",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Sesulit apa bahasa Georgia sebenarnya?",
        answer:
          "Jujur: verbanya kompleks (polipersonal, ergatif) — ini bahasa tantangan, bukan bahasa cepat saji. Tapi aksaranya justru mudah (33 huruf fonetis, 2–3 sesi tuntas), dan kami menjinakkan verba dengan pola frekuensi: bentuk yang dipakai sehari-hari dulu. Ribuan nomad membuktikan level fungsional itu realistis.",
      },
      {
        question: "Saya kuliah kedokteran di Tbilisi, kuliahnya bahasa Inggris. Perlu Georgia?",
        answer:
          "Sangat — begitu rotasi klinik dimulai, pasienmu berbahasa Georgia (atau Rusia). Mahasiswa internasional yang bisa anamnesis dasar dalam Georgia mendapat pengalaman klinik jauh lebih kaya. Track medis kami fokus ke percakapan pasien sejak B1.",
      },
      {
        question: "Di Georgia bisa pakai bahasa Rusia atau Inggris aja nggak?",
        answer:
          "Generasi tua paham Rusia, anak muda Tbilisi bisa Inggris — untuk turis cukup. Tapi untuk tinggal: birokrasi, pasar, pak sopir marshrutka, dan hati orang Georgia berbahasa Georgia. Usaha kecilmu di sana juga butuh itu.",
      },
      {
        question: "Aksara mkhedruli susah?",
        answer:
          "Justru bagian termudahnya — 33 huruf, satu huruf satu bunyi, tanpa huruf kapital, dan indah ditulis. Mayoritas siswa lancar baca dalam 2–3 sesi.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Georgia (langka, dan kami sediakan) plus opsi native dari Tbilisi. Materi hidup: bazar, marshrutka, supra — bukan cuma buku.",
      },
    ],

    metaTitle: "Kursus Bahasa Georgia Online | Linguo.id — Mkhedruli sampai B2",
    metaDescription:
      "Belajar Bahasa Georgia online dari nol. Aksara mkhedruli, percakapan Tbilisi, track mahasiswa kedokteran & nomad. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa georgia",
      "les bahasa georgia online",
      "belajar bahasa georgia",
      "bahasa kartuli",
      "kuliah kedokteran georgia",
      "kuliah di tbilisi",
      "kursus georgia jakarta",
      "les georgia murah",
      "bahasa georgia pemula",
      "digital nomad georgia",
    ],
  },
  // ==========================================================================
  // KANTON
  // ==========================================================================
  kanton: {
    urlSlug: "kanton",
    languageSlug: "cantonese",
    tagline: "Dari nei hou sampai yum cha — bahasa Hong Kong, Makau & Guangdong.",
    heroDescription:
      "Kursus Bahasa Kanton online dengan kurikulum A1–B2. Bahasa 85 juta penutur di Hong Kong, Makau, Guangdong & diaspora — untuk pekerja Indonesia di Hong Kong, profesional finance, dan pencinta film HK.",

    whyLearn: [
      {
        icon: "🏙️",
        title: "Ratusan Ribu Orang Indonesia di Hong Kong",
        description:
          "Komunitas pekerja Indonesia di Hong Kong salah satu yang terbesar di dunia. Kanton yang baik menentukan hubungan dengan majikan, gaji, perpanjangan kontrak — dan membuka jalur karier di luar domestik.",
      },
      {
        icon: "💹",
        title: "Finance & Trade Hub Asia",
        description:
          "Hong Kong tetap pusat keuangan Asia, dan Guangdong provinsi pabrik dunia (Guangzhou, Shenzhen, Dongguan). Mandarin membuka pintu resminya; Kanton membuka meja makannya — tempat deal sebenarnya terjadi.",
      },
      {
        icon: "🎬",
        title: "Sinema & Musik Legendaris",
        description:
          "Bruce Lee, Wong Kar-wai, Stephen Chow, Cantopop — budaya pop Kanton membentuk Asia. Nikmati In the Mood for Love dan lawakan mo lei tau tanpa kehilangan nuansanya.",
      },
    ],

    targetAudience: [
      {
        emoji: "🧳",
        persona: "Pekerja Indonesia di Hong Kong",
        benefit: "Percakapan majikan & agensi, pasar, MTR — plus naik level karier.",
      },
      {
        emoji: "💼",
        persona: "Profesional Finance & Trade",
        benefit: "Relasi bisnis HK-Guangdong di level personal, bukan cuma formal.",
      },
      {
        emoji: "🎬",
        persona: "Penikmat Film HK & Cantopop",
        benefit: "Nonton tanpa subtitle, paham wordplay Kanton yang legendaris.",
      },
      {
        emoji: "🀄",
        persona: "Keturunan Tionghoa Berakar Kanton",
        benefit: "Nyambung lagi dengan bahasa kakek-nenek & keluarga di Guangdong.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula (Nada & Survival)",
        sessionCount: 48,
        description:
          "Mulai dari nol dengan romanisasi Jyutping. Enam nada, percakapan survival Hong Kong.",
        topics: [
          "6 nada Kanton dengan drill pasangan kata",
          "Jyutping — romanisasi standar",
          "Partikel akhir (aa3, laa3, gaa3) — jiwa bahasa Kanton",
          "Angka, uang, belanja, MTR & transportasi",
          "Perkenalan & sapaan (nei hou, jou san)",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar + mulai mengenal karakter tradisional.",
        topics: [
          "Aspek verba: zo2, gan2, gwo3",
          "Classifier umum (go3, zek3, tiu4)",
          "Karakter tradisional: 300 paling frekuentif",
          "Perbandingan & preferensi",
          "Topik: kerja rumah tangga, masak, kesehatan, cuaca",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah",
        sessionCount: 80,
        description:
          "Diskusi topik luas, nonton drama TVB dengan subtitle, baca pesan & menu.",
        topics: [
          "Struktur kompleks & kata sambung",
          "Bahasa lisan vs tulisan (perbedaan besar di Kanton!)",
          "Slang Hong Kong & ekspresi mo lei tau",
          "~800 karakter tradisional kumulatif",
          "Percakapan telepon, bank, klinik",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas",
        sessionCount: 112,
        description:
          "Mahir — percakapan penuh kecepatan native, media HK, dan bahasa kerja profesional.",
        topics: [
          "Idiom & sik6 zi6 (chengyu versi Kanton)",
          "Business Cantonese: meeting, negosiasi, yum cha etiquette",
          "Berita TVB/RTHK & koran HK",
          "Film klasik & Cantopop sebagai teks",
          "Code-switching Kanton-Inggris khas Hong Kong",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Kanton sama Mandarin bedanya apa? Saling ngerti nggak?",
        answer:
          "Tidak saling paham secara lisan — beda nada (6 vs 4), beda kosakata inti, beda partikel. Yang sama tulisannya (Kanton memakai karakter tradisional plus karakter khusus). Orang Hong Kong menonton TV Mandarin pakai subtitle. Jadi untuk Hong Kong, belajar Kanton — bukan Mandarin.",
      },
      {
        question: "Saya kerja di Hong Kong. Sudah bisa sehari-hari, mau naik level. Bisa?",
        answer:
          "Bisa — profil ini justru banyak. Lewat placement kami petakan lubangnya (biasanya: baca-tulis karakter dan register sopan) lalu fokus ke sana. Kanton yang rapi + literasi dasar membuka pekerjaan di luar sektor domestik: retail, F&B, perawat lansia terlatih.",
      },
      {
        question: "6 nada?! Lebih susah dari Mandarin dong?",
        answer:
          "Nadanya lebih banyak tapi lebih 'datar' (level tones), banyak siswa justru merasa lebih stabil dari nada Mandarin yang meliuk. Dan grammar-nya sama ramahnya: tanpa konjugasi, tanpa tenses. Drill nada kami mulai dari pasangan kata yang kamu pakai tiap hari.",
      },
      {
        question: "Belajar karakternya tradisional atau simplified?",
        answer:
          "Tradisional — standar Hong Kong & Makau. Kalau kamu sudah kenal simplified dari Mandarin, konversinya cepat (kami sediakan peta). Fokus utama tetap lisan dulu; karakter menyusul bertahap sesuai kebutuhan.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Kanton — termasuk eks-pekerja Hong Kong yang paham dunia kerjanya — plus opsi native Hong Kong. Materi bisa diarahkan ke situasi kerjamu langsung.",
      },
    ],

    metaTitle: "Kursus Bahasa Kanton Online | Linguo.id — Bahasa Hong Kong",
    metaDescription:
      "Belajar Bahasa Kanton online dari nol. 6 nada, Jyutping, percakapan Hong Kong, karakter tradisional. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa kanton",
      "les bahasa kanton online",
      "belajar bahasa kanton",
      "bahasa kantonis",
      "bahasa hongkong",
      "belajar bahasa hongkong",
      "kursus kanton jakarta",
      "les kanton murah",
      "bahasa kanton pemula",
      "kerja di hongkong",
    ],
  },

  // ==========================================================================
  // FILIPINA
  // ==========================================================================
  filipina: {
    urlSlug: "filipina",
    languageSlug: "filipino",
    tagline: "Dari kumusta sampai salamat — bahasa serumpun yang paling cepat kamu kuasai.",
    heroDescription:
      "Kursus Bahasa Filipina (Tagalog) online dengan kurikulum A1–B2. Bahasa saudara serumpun Austronesia — kosakatanya banyak yang sama dengan Indonesia — untuk bisnis Manila, BPO, dan komunitas ASEAN.",

    whyLearn: [
      {
        icon: "🌏",
        title: "Bahasa Saudara Serumpun",
        description:
          "Tagalog dan Indonesia satu keluarga Austronesia: mata=mata, langit=langit, anak=anak, mahal=mahal (bedanya di sana artinya 'sayang'!). Tak ada bahasa asing yang lebih cepat 'nyambung' untuk lidah Indonesia.",
      },
      {
        icon: "💼",
        title: "Manila: Hub BPO & Bisnis ASEAN",
        description:
          "Filipina raksasa BPO dunia dan pasar 115 juta orang. Profesional Indonesia di perusahaan regional, maritim, dan F&B yang bisa Tagalog membangun kedekatan yang tak bisa dibeli bahasa Inggris.",
      },
      {
        icon: "🎤",
        title: "Budaya Pop & Komunitas",
        description:
          "OPM (Original Pilipino Music), teleserye, vlog Filipina — plus jutaan interaksi pelaut, perawat & pekerja Indonesia-Filipina di kapal dan rumah sakit seluruh dunia. Kumusta membuka semuanya.",
      },
    ],

    targetAudience: [
      {
        emoji: "💼",
        persona: "Profesional Regional ASEAN",
        benefit: "Relasi bisnis Manila di level personal — bukan cuma Inggris formal.",
      },
      {
        emoji: "⚓",
        persona: "Pelaut & Nakes Sesama Kru Filipina",
        benefit: "Filipina mendominasi kru kapal & perawat dunia — bahasanya perekat.",
      },
      {
        emoji: "💍",
        persona: "Pasangan WN Filipina",
        benefit: "Percakapan keluarga & mertua — plus paham Taglish sehari-hari.",
      },
      {
        emoji: "🎓",
        persona: "Peneliti & Peminat Austronesia",
        benefit: "Perbandingan serumpun yang memperkaya pemahaman bahasa sendiri.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Baguhan",
        sessionCount: 48,
        description:
          "Mulai dari nol — tapi setengah kosakatanya terasa kenal. Fokus ke sistem fokus verba yang jadi pembeda utama.",
        topics: [
          "Pelafalan — nyaris identik Indonesia, plus stress kata",
          "Kosakata kerabat: ribuan kata seasal dipetakan",
          "Ang/ng/sa — sistem penanda khas Tagalog",
          "Angka (kadalasan pakai Spanyol!), belanja, jeepney",
          "Perkenalan & po/opo (kesopanan)",
        ],
      },
      {
        level: "A2",
        title: "A2 — Batayan",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar dengan fokus verba dasar.",
        topics: [
          "Fokus aktor (um-/mag-) vs fokus objek (-in/i-)",
          "Aspek: selesai, sedang, akan (bukan tenses!)",
          "Pronomina lengkap & enclitic order",
          "Taglish — kenyataan sehari-hari Manila",
          "Topik: keluarga, kerja, makanan, perjalanan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Panggitna",
        sessionCount: 80,
        description:
          "Diskusi topik luas, nonton teleserye, baca berita ringan.",
        topics: [
          "Fokus lokatif & benefaktif (-an, ipag-)",
          "Kata sambung & kalimat kompleks",
          "Idiom & bugtong (teka-teki), salawikain (peribahasa)",
          "Membaca berita ABS-CBN/GMA ringan",
          "Percakapan bisnis santai & small talk Filipina",
        ],
      },
      {
        level: "B2",
        title: "B2 — Mataas",
        sessionCount: 112,
        description:
          "Mahir — Tagalog formal, media, dan sastra ringan.",
        topics: [
          "Tagalog formal vs kolokial vs Taglish — kapan yang mana",
          "Bahasa media & pidato",
          "Sastra: Rizal (terjemahan Tagalog) & cerpen modern",
          "Presentasi & negosiasi",
          "Pengantar ragam daerah (Cebuano, Ilocano) — peta saja",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Sebenarnya berapa mirip Tagalog dengan bahasa Indonesia?",
        answer:
          "Serumpun dekat — ribuan kata seasal (balik, bili/beli, takot/takut, itim/hitam) dan bunyi yang nyaris sama. Tapi grammar-nya beda arah: Tagalog pakai sistem fokus verba yang tak ada di Indonesia. Jadi: kosakata diskon besar, grammar tetap perlu belajar — total tetap bahasa asing tercepat untuk orang Indonesia.",
      },
      {
        question: "Orang Filipina kan jago Inggris. Ngapain belajar Tagalog?",
        answer:
          "Karena Inggris itu bahasa kerja mereka, Tagalog bahasa hatinya. Lelucon, gosip pantry, negosiasi santai, keluarga pasangan — semuanya Tagalog/Taglish. Orang Indonesia yang menyapa 'kumusta ka na?' langsung diperlakukan sebagai kapatid (saudara), bukan orang luar.",
      },
      {
        question: "Taglish itu apa?",
        answer:
          "Campuran Tagalog-Inggris yang jadi bahasa sehari-hari Manila ('Na-traffic ako kanina, sorry ha'). Buku teks murni Tagalog sering bikin kaget begitu mendarat. Kami mengajarkan Tagalog baku sebagai fondasi plus Taglish sebagai kenyataan — dua-duanya.",
      },
      {
        question: "Berapa lama sampai bisa ngobrol?",
        answer:
          "Tercepat di katalog kami untuk orang Indonesia: percakapan dasar 3–5 bulan, nyaman ngobrol luas (B1) 10–14 bulan dengan 2–3 sesi seminggu.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Tagalog dan native Filipina yang paham bahasa Indonesia — kombinasi yang membuat perbandingan serumpun jadi alat belajar, bukan sekadar trivia.",
      },
    ],

    metaTitle: "Kursus Bahasa Filipina Online | Linguo.id — Tagalog untuk Orang Indonesia",
    metaDescription:
      "Belajar Bahasa Filipina (Tagalog) online — bahasa serumpun tercepat untuk orang Indonesia. Percakapan, Taglish, bisnis Manila. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa filipina",
      "les bahasa filipina online",
      "belajar bahasa filipina",
      "kursus bahasa tagalog",
      "belajar bahasa tagalog",
      "les tagalog online",
      "bahasa tagalog pemula",
      "kursus tagalog jakarta",
      "les filipina murah",
      "bahasa filipino",
    ],
  },

  // ==========================================================================
  // KHMER
  // ==========================================================================
  khmer: {
    urlSlug: "khmer",
    languageSlug: "khmer",
    tagline: "Dari suosdey sampai aksara Angkor — bahasa Kamboja yang sedang tumbuh.",
    heroDescription:
      "Kursus Bahasa Khmer online dengan kurikulum A1–B2. Tanpa nada (!), aksara warisan Angkor, percakapan Phnom Penh — untuk profesional, NGO, dan pebisnis di Kamboja.",

    whyLearn: [
      {
        icon: "📈",
        title: "Ekonomi Muda yang Lapar Talenta",
        description:
          "Kamboja tumbuh cepat — garmen, konstruksi, fintech (bakong!), agrikultur — dan perusahaan Indonesia mulai masuk. Pasar yang belum ramai pesaing, dan bahasa lokal langsung membuka pintunya.",
      },
      {
        icon: "🕊️",
        title: "NGO & Pembangunan",
        description:
          "Phnom Penh salah satu hub NGO terbesar Asia Tenggara. Staf program yang bisa Khmer turun ke lapangan tanpa penerjemah — nilai yang membedakan di CV kemanusiaan.",
      },
      {
        icon: "🛕",
        title: "Tanpa Nada & Warisan Angkor",
        description:
          "Kejutan: Khmer TIDAK bertonal — satu-satunya bahasa besar daratan Asia Tenggara tanpa nada. Dan aksaranya, induk aksara Thai & Lao, adalah warisan langsung peradaban Angkor.",
      },
    ],

    targetAudience: [
      {
        emoji: "💼",
        persona: "Profesional & Pebisnis di Kamboja",
        benefit: "Garmen, konstruksi, F&B — negosiasi & operasional harian.",
      },
      {
        emoji: "🕊️",
        persona: "Pekerja NGO & Pembangunan",
        benefit: "Bahasa lapangan: wawancara, koordinasi desa, laporan.",
      },
      {
        emoji: "✈️",
        persona: "Ekspatriat & Keluarga di Phnom Penh",
        benefit: "Pasar, tuk-tuk, sekolah anak — hidup mandiri tanpa penerjemah.",
      },
      {
        emoji: "🏛️",
        persona: "Peminat Sejarah & Arkeologi",
        benefit: "Angkor, prasasti, dan akar budaya Indosfer Asia Tenggara.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula",
        sessionCount: 48,
        description:
          "Mulai dari nol dengan romanisasi, aksara menyusul bertahap. Tanpa nada — fokus ke vokal yang kaya.",
        topics: [
          "Pelafalan: vokal kaya & konsonan aspirasi (tanpa nada!)",
          "Struktur SVO sederhana — tanpa konjugasi",
          "Angka, uang riel/dolar, pasar & tawar-menawar",
          "Sapaan & sampeah (salam hormat)",
          "Aksara Khmer tahap 1: konsonan seri A",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar & melek aksara dasar.",
        topics: [
          "Aksara lengkap: 2 seri konsonan, vokal dependen",
          "Classifier & partikel umum",
          "Aspek & waktu (ban, kampung, nung)",
          "Register sopan vs santai",
          "Topik: kerja, kesehatan, transportasi, makanan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah",
        sessionCount: 80,
        description:
          "Diskusi topik luas & bahasa kerja lapangan — level fungsional NGO/bisnis.",
        topics: [
          "Kalimat kompleks & kata sambung",
          "Bahasa lapangan: wawancara, survei, koordinasi",
          "Bahasa bisnis: kontrak sederhana, negosiasi",
          "Membaca koran ringan & pengumuman resmi",
          "Register kerajaan/keagamaan — pengenalan",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas",
        sessionCount: 112,
        description:
          "Mahir — media, dokumen resmi, dan konteks budaya penuh.",
        topics: [
          "Kosakata Pali-Sanskerta formal",
          "Bahasa dokumen & birokrasi",
          "Media Khmer: berita TV & koran penuh",
          "Presentasi & rapat penuh",
          "Sastra & sejarah: teks Angkor dikenalkan",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Beneran bahasa Khmer nggak ada nadanya?",
        answer:
          "Benar — beda dari Thai, Vietnam, Lao, dan Mandarin. Untuk orang Indonesia ini kabar besar: dua momok bahasa Asia (nada & konjugasi) dua-duanya absen. Tantangannya pindah ke vokal yang kaya dan aksara — keduanya bisa di-drill.",
      },
      {
        question: "Aksara Khmer kelihatan rumit banget. Berapa lama?",
        answer:
          "Paling banyak hurufnya di dunia (33 konsonan × 2 seri + vokal), tapi sistematis. Dengan metode bertahap kami, membaca fungsional tercapai dalam 2–3 bulan sambil percakapan tetap jalan pakai romanisasi. Aksara ini juga induk aksara Thai & Lao — sekali paham, dua tetangganya ikut terbaca polanya.",
      },
      {
        question: "Cukup pakai bahasa Inggris di Phnom Penh nggak?",
        answer:
          "Di kafe ekspat — cukup. Di pabrik, desa program NGO, kantor pemerintah, dan pasar — tidak. Kamboja negara muda yang bahasa Inggrisnya terkonsentrasi di segelintir kota; kerja yang sesungguhnya berbahasa Khmer.",
      },
      {
        question: "Berapa lama sampai level kerja lapangan?",
        answer:
          "Percakapan fungsional (A2) 8–10 bulan; bahasa lapangan NGO/bisnis (B1) sekitar 14–18 bulan dengan 2–3 sesi seminggu. Tanpa nada & konjugasi, progresnya terasa stabil.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Khmer (eks-staf NGO & profesional Kamboja) plus opsi native. Materi lapangan diambil dari pengalaman kerja nyata di sana.",
      },
    ],

    metaTitle: "Kursus Bahasa Khmer Online | Linguo.id — Bahasa Kamboja A1–B2",
    metaDescription:
      "Belajar Bahasa Khmer (Kamboja) online dari nol. Tanpa nada, aksara Angkor, percakapan Phnom Penh, bahasa NGO & bisnis. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa khmer",
      "les bahasa khmer online",
      "belajar bahasa khmer",
      "kursus bahasa kamboja",
      "belajar bahasa kamboja",
      "kerja di kamboja",
      "les khmer murah",
      "bahasa khmer pemula",
      "aksara khmer",
      "NGO kamboja",
    ],
  },

  // ==========================================================================
  // LAOS
  // ==========================================================================
  laos: {
    urlSlug: "laos",
    languageSlug: "lao",
    tagline: "Dari sabaidee sampai Mekong — bahasa Laos, bonus paham Thai gratis.",
    heroDescription:
      "Kursus Bahasa Laos online dengan kurikulum A1–B2. Bahasa negeri jalur kereta China–ASEAN — dan kembaran dekat bahasa Thai — untuk profesional proyek, NGO, dan penjelajah Mekong.",

    whyLearn: [
      {
        icon: "🚄",
        title: "Persimpangan Baru ASEAN–China",
        description:
          "Kereta cepat Laos–China mengubah Vientiane jadi simpul logistik baru; proyek energi & infrastruktur menyusul. Profesional yang bisa bahasa Lao masih segelintir — pasar sepi pesaing.",
      },
      {
        icon: "🔁",
        title: "Beli Satu Dapat Dua: Lao ≈ Thai",
        description:
          "Lao dan Thai (khususnya dialek Isan) saling paham tinggi — orang Laos menonton TV Thai tiap hari. Menguasai Lao berarti memahami Thai lisan sebagai bonus, dan sebaliknya.",
      },
      {
        icon: "🕊️",
        title: "NGO & Pembangunan Mekong",
        description:
          "Laos salah satu fokus program pembangunan Asia Tenggara — pendidikan, kesehatan, UXO clearance. Bahasa lokal syarat turun lapangan yang sesungguhnya.",
      },
    ],

    targetAudience: [
      {
        emoji: "🏗️",
        persona: "Profesional Proyek & Logistik",
        benefit: "Bahasa lapangan proyek: koordinasi, vendor, birokrasi Vientiane.",
      },
      {
        emoji: "🕊️",
        persona: "Pekerja NGO & Pembangunan",
        benefit: "Wawancara desa, koordinasi program, laporan lapangan.",
      },
      {
        emoji: "🌏",
        persona: "Pebisnis Kawasan Mekong",
        benefit: "Satu bahasa untuk Laos + bonus Thai/Isan lisan.",
      },
      {
        emoji: "🛶",
        persona: "Traveler Jalur Sungai Mekong",
        benefit: "Luang Prabang sampai Si Phan Don — lepas dari jalur turis.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula",
        sessionCount: 48,
        description:
          "Mulai dari nol. Nada Lao (lebih santai dari Thai), kalimat dasar, percakapan pasar.",
        topics: [
          "Nada Lao dengan drill pasangan kata",
          "Struktur SVO tanpa konjugasi",
          "Angka, kip, pasar & tawar-menawar",
          "Sapaan & nop (salam hormat)",
          "Aksara Lao tahap 1 — lebih ramping dari Thai",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar & melek aksara dasar.",
        topics: [
          "Aksara lengkap: 27 konsonan + vokal",
          "Classifier & partikel akhir",
          "Aspek & waktu (laew, kamlang, si)",
          "Peta Lao ↔ Thai: pola korespondensi bunyi",
          "Topik: kerja, kesehatan, transportasi, makanan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah",
        sessionCount: 80,
        description:
          "Diskusi topik luas & bahasa kerja lapangan — level fungsional proyek/NGO.",
        topics: [
          "Kalimat kompleks & kata sambung",
          "Bahasa lapangan: survei, wawancara, koordinasi",
          "Bahasa proyek: logistik, vendor, laporan",
          "Membaca pengumuman & berita ringan",
          "Mendengar Thai lisan — latihan jembatan",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas",
        sessionCount: 112,
        description:
          "Mahir — media, dokumen resmi, dan register formal.",
        topics: [
          "Kosakata Pali formal & register resmi",
          "Bahasa dokumen & birokrasi",
          "Media Lao penuh + TV Thai sebagai bonus",
          "Presentasi & rapat penuh",
          "Budaya: baci, festival, etiket Buddhis",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Lao sama Thai itu beda bahasa atau beda dialek?",
        answer:
          "Resminya dua bahasa, praktiknya kembaran dekat — orang Vientiane dan orang Isan (Thailand timur laut) ngobrol tanpa hambatan. Aksaranya beda tapi seasal. Belajar Lao memberi Thai lisan pasif sebagai bonus; kami bahkan melatih 'jembatan Thai' secara eksplisit di level menengah.",
      },
      {
        question: "Kalau gitu mending belajar Thai aja dong, penuturnya lebih banyak?",
        answer:
          "Tergantung tujuan. Kalau kerjamu/proyekmu di Laos — belajar Lao: dokumen, birokrasi, dan hati orang Laos berbahasa Lao, dan mereka sangat menghargai orang asing yang memilih bahasanya (bukan bahasa tetangga besarnya). Bonus Thai tetap kamu dapat.",
      },
      {
        question: "Susah nggak dibanding Thai?",
        answer:
          "Sedikit lebih ramah: aksaranya lebih ramping (ejaan Lao direformasi, lebih fonetis), nadanya lebih longgar antar-dialek, grammar sama santainya — tanpa konjugasi, tanpa gender. Bahasa daratan ASEAN yang paling underrated.",
      },
      {
        question: "Berapa lama sampai level kerja lapangan?",
        answer:
          "Percakapan fungsional (A2) 7–10 bulan; bahasa lapangan (B1) 13–16 bulan dengan 2–3 sesi seminggu.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Lao (eks-staf proyek & NGO Mekong) plus opsi native Vientiane.",
      },
    ],

    metaTitle: "Kursus Bahasa Laos Online | Linguo.id — Lao A1–B2, Bonus Thai",
    metaDescription:
      "Belajar Bahasa Laos online dari nol. Aksara Lao, percakapan Vientiane, bahasa proyek & NGO — bonus paham Thai lisan. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa laos",
      "les bahasa laos online",
      "belajar bahasa laos",
      "bahasa lao",
      "kerja di laos",
      "les laos murah",
      "bahasa laos pemula",
      "aksara lao",
      "NGO laos",
      "proyek di laos",
    ],
  },

  // ==========================================================================
  // MYANMAR
  // ==========================================================================
  myanmar: {
    urlSlug: "myanmar",
    languageSlug: "burmese",
    tagline: "Dari mingalaba sampai aksara bundar — bahasa 55 juta penutur di tanah seribu pagoda.",
    heroDescription:
      "Kursus Bahasa Myanmar (Burma) online dengan kurikulum A1–B2. Aksara bundar yang ikonik, nada yang ramah, percakapan Yangon — untuk pekerja kemanusiaan, peneliti, dan pebisnis kawasan.",

    whyLearn: [
      {
        icon: "🕊️",
        title: "Kemanusiaan yang Paling Membutuhkan",
        description:
          "Program kemanusiaan & pengungsi terkait Myanmar adalah salah satu operasi terbesar di Asia — termasuk yang berbasis di Indonesia dan perbatasan Thailand. Staf berbahasa Burma sangat langka dan sangat dicari.",
      },
      {
        icon: "🔬",
        title: "Riset & Diplomasi ASEAN",
        description:
          "Myanmar isu sentral ASEAN — dan Indonesia pemain kuncinya. Peneliti, diplomat, dan jurnalis yang membaca sumber Burma langsung punya kedalaman yang tak dimiliki pembaca terjemahan.",
      },
      {
        icon: "🛕",
        title: "Budaya Buddhis & Pasar Masa Depan",
        description:
          "Tanah Bagan & Shwedagon, tradisi Theravada yang dalam, dan — apa pun politiknya — pasar 55 juta orang yang suatu saat terbuka kembali. Yang siap bahasanya akan masuk pertama.",
      },
    ],

    targetAudience: [
      {
        emoji: "🕊️",
        persona: "Pekerja Kemanusiaan & Pengungsi",
        benefit: "Bahasa lapangan: wawancara, pendampingan, koordinasi.",
      },
      {
        emoji: "📰",
        persona: "Peneliti, Jurnalis & Diplomat",
        benefit: "Sumber primer Burma: media, dokumen, wawancara.",
      },
      {
        emoji: "💼",
        persona: "Pebisnis Kawasan Jangka Panjang",
        benefit: "Jaringan komunitas Myanmar di Thailand, Singapura & diaspora.",
      },
      {
        emoji: "🧘",
        persona: "Praktisi & Peminat Buddhisme Theravada",
        benefit: "Tradisi meditasi Mahasi & Pa-Auk dari sumber aslinya.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula",
        sessionCount: 48,
        description:
          "Mulai dari nol. Tiga nada + creaky voice, romanisasi dulu, aksara bundar menyusul.",
        topics: [
          "Nada Burma: 3 nada + glottal, drill audio",
          "Struktur SOV & partikel dasar",
          "Angka, kyat, pasar & tawar-menawar",
          "Sapaan (mingalaba) & etiket dasar",
          "Aksara Myanmar tahap 1: konsonan dasar",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar & melek aksara bundar.",
        topics: [
          "Aksara lengkap: 33 konsonan + vokal & stacking",
          "Partikel kalimat (te, me, pi) — jantung grammar",
          "Classifier & bilangan",
          "Register sopan (pa) & kata ganti berlapis",
          "Topik: kerja, kesehatan, transportasi, makanan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah",
        sessionCount: 80,
        description:
          "Diskusi topik luas & bahasa kerja lapangan.",
        topics: [
          "Kalimat kompleks & nominalisasi",
          "Bahasa lapangan: wawancara & pendampingan",
          "Perbedaan lisan vs tulisan (diglosia Burma!)",
          "Membaca berita ringan (BBC Burmese)",
          "Kosakata Buddhis & budaya sehari-hari",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas",
        sessionCount: 112,
        description:
          "Mahir — register tulisan formal, media, dan dokumen.",
        topics: [
          "Burma tulisan (literary register) penuh",
          "Kosakata Pali formal",
          "Media & dokumen: berita, laporan, arsip",
          "Presentasi & diskusi penuh",
          "Pengantar bahasa etnis utama (Shan, Karen) — peta saja",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Aksara Myanmar yang bundar-bundar itu susah nggak?",
        answer:
          "Terlihat asing tapi sangat sistematis — semua huruf dibangun dari lingkaran (konon karena dulu ditulis di daun lontar yang sobek kalau ditarik garis lurus). 33 konsonan + vokal, biasanya tuntas dibaca dalam 6–8 sesi bertahap.",
      },
      {
        question: "Bahasa lisan dan tulisannya beda — maksudnya gimana?",
        answer:
          "Burma punya diglosia: bahasa percakapan dan bahasa tulisan (koran, dokumen) memakai partikel & kosakata berbeda. Banyak kursus hanya mengajarkan satu dan siswanya pincang. Kami mulai dari lisan (kebutuhan nyata), lalu bangun register tulisan mulai B1.",
      },
      {
        question: "Aman & etis nggak belajar bahasa Myanmar sekarang?",
        answer:
          "Bahasanya milik rakyatnya, bukan rezim mana pun — dan justru pekerjaan kemanusiaan, jurnalisme, dan pendampingan pengungsi yang paling membutuhkan penuturnya sekarang. Kebutuhan itu nyata dan mendesak.",
      },
      {
        question: "Berapa lama sampai level kerja lapangan?",
        answer:
          "Percakapan fungsional (A2) 8–12 bulan; bahasa lapangan (B1) 15–18 bulan dengan 2–3 sesi seminggu. Nada Burma lebih ramah dari Thai/Vietnam — biasanya bukan hambatan utama.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Burma (eks-pekerja kemanusiaan & peneliti) plus penutur native dari komunitas diaspora.",
      },
    ],

    metaTitle: "Kursus Bahasa Myanmar Online | Linguo.id — Burma A1–B2",
    metaDescription:
      "Belajar Bahasa Myanmar (Burma) online dari nol. Aksara bundar, percakapan Yangon, bahasa kemanusiaan & riset. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa myanmar",
      "les bahasa myanmar online",
      "belajar bahasa myanmar",
      "bahasa burma",
      "belajar bahasa burma",
      "kursus burma jakarta",
      "les myanmar murah",
      "bahasa myanmar pemula",
      "aksara myanmar",
      "kemanusiaan myanmar",
    ],
  },

  // ==========================================================================
  // URDU
  // ==========================================================================
  urdu: {
    urlSlug: "urdu",
    languageSlug: "urdu",
    tagline: "Dari assalamualaikum sampai ghazal — bahasa puisi Asia Selatan.",
    heroDescription:
      "Kursus Bahasa Urdu online dengan kurikulum A1–B2. Aksara Nastaliq yang anggun, kembaran lisan bahasa Hindi, bahasa ghazal & qawwali — untuk bisnis Pakistan, sastra, dan komunitas.",

    whyLearn: [
      {
        icon: "🎶",
        title: "Ghazal, Qawwali & Sastra Sufi",
        description:
          "Ghalib, Iqbal, Faiz — dan qawwali Nusrat Fateh Ali Khan yang menggetarkan dunia. Urdu adalah bahasa puisi Asia Selatan; keindahannya sering disebut tak tertandingi di kawasan.",
      },
      {
        icon: "🤝",
        title: "Pakistan: Pasar 240 Juta yang Terlewat",
        description:
          "Tekstil, beras basmati, olahraga (bola & kriket), farmasi — perdagangan Indonesia-Pakistan terus tumbuh dan pesaing berbahasa Urdu nyaris nol. Hubungan dua negara Muslim terbesar ini penuh peluang.",
      },
      {
        icon: "🎬",
        title: "Bonus Dua Arah dengan Hindi",
        description:
          "Urdu & Hindi lisan praktis satu bahasa (Hindustani) — belajar Urdu berarti memahami Bollywood, plus membaca aksara Nastaliq yang tak dikuasai penonton biasa. Dua pintu, satu kunci.",
      },
    ],

    targetAudience: [
      {
        emoji: "💼",
        persona: "Pebisnis Rute Pakistan",
        benefit: "Tekstil Karachi, dagang Lahore — pasar besar minim pesaing.",
      },
      {
        emoji: "📿",
        persona: "Peminat Sastra Sufi & Qawwali",
        benefit: "Ghalib, Iqbal, Rumi terjemahan Urdu — dari teks aslinya.",
      },
      {
        emoji: "🎓",
        persona: "Mahasiswa & Alumni Pakistan",
        benefit: "IIUI Islamabad & kampus Pakistan — bahasa kampus & kehidupan.",
      },
      {
        emoji: "🎬",
        persona: "Penggemar Drama Pakistan & Bollywood",
        benefit: "Drama Hum TV yang mendunia + lirik lagu dengan kedalaman Urdu.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "A1 — Pemula",
        sessionCount: 48,
        description:
          "Mulai dari nol. Aksara Nastaliq bertahap, pelafalan, kalimat dasar sehari-hari.",
        topics: [
          "Nastaliq: huruf & bentuk sambung — pesona & polanya",
          "Bunyi khas: retrofleks vs dental, aspirasi",
          "Struktur SOV & postposisi (mein, par, se, ko)",
          "Gender & kesesuaian dasar",
          "Perkenalan, angka, belanja, adab sapaan",
        ],
      },
      {
        level: "A2",
        title: "A2 — Dasar",
        sessionCount: 64,
        description: "Percakapan sehari-hari lancar — paralel penuh dengan Hindi lisan.",
        topics: [
          "Waktu lampau-kini-depan + kesesuaian gender",
          "Ergatif ne — kunci kalimat lampau",
          "Kata kerja majemuk umum",
          "Tingkat kesopanan: tu/tum/aap & aadaab",
          "Topik: keluarga, dagang, perjalanan, makanan",
        ],
      },
      {
        level: "B1",
        title: "B1 — Menengah",
        sessionCount: 80,
        description:
          "Diskusi topik luas, nonton drama Pakistan, membaca teks Nastaliq dengan nyaman.",
        topics: [
          "Subjunktif & pengandaian",
          "Kosakata Persia-Arab yang membedakan Urdu dari Hindi",
          "Membaca berita BBC Urdu ringan",
          "Drama Pakistan sebagai teks (Humsafar dkk)",
          "Percakapan bisnis & adab formal",
        ],
      },
      {
        level: "B2",
        title: "B2 — Atas (Gerbang Sastra)",
        sessionCount: 112,
        description:
          "Mahir — Urdu formal, media, dan pintu masuk ghazal.",
        topics: [
          "Urdu formal & jurnalistik (Dawn, Jang)",
          "Aruz dasar untuk membaca ghazal",
          "Ghalib & Iqbal berpanduan",
          "Business Urdu: negosiasi, surat, presentasi",
          "Qawwali sebagai teks: Nusrat & Sabri Brothers",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Urdu sama Hindi bedanya apa? Katanya sama?",
        answer:
          "Lisannya praktis satu bahasa — kamu otomatis paham Bollywood. Bedanya aksara (Nastaliq vs Devanagari) dan kosakata tinggi (Urdu menyerap Persia-Arab, Hindi menyerap Sanskerta). Untuk orang Indonesia yang akrab huruf Arab & kosakata serapan Arab, Urdu sering jadi pintu yang lebih landai.",
      },
      {
        question: "Saya bisa baca huruf Arab (Al-Qur'an). Kepakai nggak?",
        answer:
          "Sangat — aksara Urdu berbasis Arab-Persia, jadi kamu mulai dari setengah jalan. Tinggal membiasakan gaya Nastaliq (miring & bertumpuk), 4 huruf tambahan, dan bunyi retrofleks. Banyak kosakata juga langsung kenal: kitab, dunya, waqt, khabar.",
      },
      {
        question: "Nastaliq itu apa sih?",
        answer:
          "Gaya kaligrafi aksara Arab-Persia yang dipakai Urdu — miring, mengalir, sering disebut aksara terindah di dunia. Sedikit lebih menantang dibaca daripada naskh (gaya Al-Qur'an), tapi polanya konsisten dan kami latih bertahap.",
      },
      {
        question: "Berapa lama sampai bisa ngobrol & nonton drama Pakistan?",
        answer:
          "Percakapan dasar 5–8 bulan (lebih cepat kalau sudah biasa nonton Bollywood — telingamu sudah setengah terlatih). Drama tanpa subtitle nyaman di B1, sekitar 12–16 bulan.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Pengajar Indonesia yang fasih Urdu (alumni Pakistan — IIUI dkk) plus opsi native. Untuk track sastra, pengajarnya pembaca ghazal sungguhan.",
      },
    ],

    metaTitle: "Kursus Bahasa Urdu Online | Linguo.id — Nastaliq sampai Ghazal",
    metaDescription:
      "Belajar Bahasa Urdu online dari nol. Aksara Nastaliq, kembaran Hindi lisan, ghazal & bisnis Pakistan. Semi privat mulai Rp 105.000/sesi.",
    metaKeywords: [
      "kursus bahasa urdu",
      "les bahasa urdu online",
      "belajar bahasa urdu",
      "bahasa pakistan",
      "belajar bahasa pakistan",
      "kursus urdu jakarta",
      "les urdu murah",
      "bahasa urdu pemula",
      "aksara nastaliq",
      "sastra urdu ghazal",
    ],
  },
  // ==========================================================================
  // BETAWI
  // ==========================================================================
  betawi: {
    urlSlug: "betawi",
    languageSlug: "betawi",
    tagline: "Dari nyok sampai kagak — bahasa asli Jakarta yang membentuk bahasa gaul kita.",
    heroDescription:
      "Kursus Bahasa Betawi online. Logat, kosakata & budaya dialek asli Jakarta — akar bahasa gaul Indonesia — untuk kreator konten, seniman, peneliti budaya urban, dan generasi muda Betawi.",

    whyLearn: [
      {
        icon: "🎙️",
        title: "Akar Bahasa Gaul Indonesia",
        description:
          "Gue-lu, banget, kagak, ngapain — bahasa gaul nasional lahir dari Betawi. Kreator konten, penulis skenario & copywriter yang paham akarnya memakai register Jakarta dengan presisi, bukan asal tebak.",
      },
      {
        icon: "🎭",
        title: "Lenong, Gambang Kromong & Si Doel",
        description:
          "Seni pertunjukan Betawi hidup — lenong, palang pintu, ondel-ondel — dan terus dipanggil di acara resmi Jakarta. Pemain, MC & budayawan bergaji dari kefasihan Betawi yang otentik.",
      },
      {
        icon: "🏙️",
        title: "Identitas yang Terancam Hilang",
        description:
          "Di kotanya sendiri, penutur muda Betawi menyusut. Generasi Betawi yang ingin fasih bahasa engkong-neneknya — dan peneliti budaya urban — memburu yang tersisa sebelum terlambat.",
      },
    ],

    targetAudience: [
      {
        emoji: "🎬",
        persona: "Kreator Konten & Penulis",
        benefit: "Register Jakarta yang presisi: dari Betawi pasar sampai gaul kekinian.",
      },
      {
        emoji: "🌆",
        persona: "Generasi Muda Betawi",
        benefit: "Fasih bahasa keluarga — bukan cuma logatnya, tapi kosakata dalamnya.",
      },
      {
        emoji: "🎭",
        persona: "Seniman & MC Palang Pintu",
        benefit: "Pantun Betawi, buka palang pintu, lenong — perangkat lengkap.",
      },
      {
        emoji: "📚",
        persona: "Peneliti Budaya & Linguistik Urban",
        benefit: "Dialek Melayu Betawi: sejarah, variasi ora-orang, kontak bahasa.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "Tingkat 1 — Logat & Kosakata Inti",
        sessionCount: 48,
        description:
          "Dari bahasa Indonesia ke Betawi: pergeseran bunyi, kosakata inti, kalimat sehari-hari.",
        topics: [
          "Bunyi khas: a→e (ape, kenape), -h hilang (udeh, dah)",
          "Kosakata inti: kagak, kudu, doang, ampe, bae",
          "Kata ganti: gue-lu & sopannya (aye, ente)",
          "Partikel rasa: dah, deh, dong, sih ala Betawi",
          "Percakapan warung, pasar & tetangga",
        ],
      },
      {
        level: "A2",
        title: "Tingkat 2 — Percakapan & Rasa",
        sessionCount: 64,
        description: "Ngobrol lepas dengan rasa Betawi yang benar — bukan sekadar logat-logatan.",
        topics: [
          "Imbuhan khas: ke- pasif (ketabrak), -in (bawain)",
          "Ungkapan & seruan: busyet, astagenaga, sialan dah",
          "Betawi Tengah vs Betawi Ora (pinggiran)",
          "Humor Betawi: ledek-ledekan yang sopan",
          "Situasi keluarga: kondangan, lebaran, arisan",
        ],
      },
      {
        level: "B1",
        title: "Tingkat 3 — Pantun & Panggung",
        sessionCount: 80,
        description:
          "Bahasa panggung: pantun, palang pintu, dan seni bertutur Betawi.",
        topics: [
          "Pantun Betawi: struktur & improvisasi",
          "Buka palang pintu: adegan & teks klasik",
          "Sohibul hikayat & tradisi bertutur",
          "Kosakata Arab-Tionghoa-Belanda dalam Betawi",
          "MC acara Betawi: nikahan & sunatan",
        ],
      },
      {
        level: "B2",
        title: "Tingkat 4 — Budaya & Kajian",
        sessionCount: 112,
        description:
          "Masuk khazanah: lenong, gambang kromong, sejarah & kajian dialek.",
        topics: [
          "Naskah lenong & improvisasi panggung",
          "Lagu-lagu gambang kromong & keroncong Tugu",
          "Sejarah bahasa: Melayu pasar, kontak Tionghoa-Bali-Arab",
          "Firman Muntaco & sastra Betawi modern",
          "Dokumentasi: wawancara penutur sepuh",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Bahasa Betawi kan cuma bahasa Indonesia yang dilogat-logatin?",
        answer:
          "Itu mitosnya. Betawi dialek Melayu tersendiri dengan kosakata dalam (kudu, doang, sohor, begah), imbuhan khas, dan lapisan serapan Hokkien-Arab-Belanda-Portugis yang merekam sejarah Batavia. Yang kamu dengar di sinetron cuma kulitnya.",
      },
      {
        question: "Buat kreator konten, ngapain belajar formal? Kan tinggal niru?",
        answer:
          "Niru tanpa paham menghasilkan 'Betawi KW' yang langsung ketahuan penonton Jakarta. Paham sistemnya — kapan gue vs aye, Betawi Tengah vs Ora, mana yang kasar mana yang akrab — membuat kontenmu presisi dan tidak menyinggung.",
      },
      {
        question: "Saya orang Betawi tapi cuma bisa dikit-dikit. Kelasnya cocok?",
        answer:
          "Justru profil siswa terbanyak: generasi yang engkongnya fasih tapi di rumah pakai Indonesia. Placement kami mulai dari yang kamu punya, dan materi keluarga (kondangan, palang pintu) bisa disesuaikan tradisi keluargamu.",
      },
      {
        question: "Ada sertifikat atau ujian resminya?",
        answer:
          "Tidak ada ujian standar nasional untuk Betawi — fokus kami kefasihan nyata & kemampuan panggung. Untuk kebutuhan formal (MC palang pintu, riset), kami terbitkan sertifikat penyelesaian Linguo per tingkat.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Penutur asli Betawi — termasuk pelaku seni palang pintu & lenong — dengan pengalaman mengajar. Bukan sekadar orang Jakarta, tapi orang Betawi.",
      },
    ],

    metaTitle: "Kursus Bahasa Betawi Online | Linguo.id — Logat, Pantun, Budaya",
    metaDescription:
      "Belajar Bahasa Betawi online dari penutur asli. Logat & kosakata dalam, pantun palang pintu, budaya Jakarta. Semi privat mulai Rp 75.000/sesi.",
    metaKeywords: [
      "kursus bahasa betawi",
      "les bahasa betawi",
      "belajar bahasa betawi",
      "bahasa betawi asli",
      "kosakata betawi",
      "pantun betawi",
      "palang pintu betawi",
      "budaya betawi",
      "dialek jakarta",
      "bahasa jakarta",
    ],
  },

  // ==========================================================================
  // BALI
  // ==========================================================================
  bali: {
    urlSlug: "bali",
    languageSlug: "balinese",
    tagline: "Om Swastiastu — bahasa pulau yang kamu tinggali, bukan cuma kunjungi.",
    heroDescription:
      "Kursus Bahasa Bali online dengan tingkatan sor singgih. Untuk pendatang & pekerja di Bali, pasangan orang Bali, pelaku pariwisata, dan generasi muda Bali — dari basa andap sampai aksara.",

    whyLearn: [
      {
        icon: "🏝️",
        title: "Jutaan Pendatang, Sedikit yang Nyambung",
        description:
          "Bali dibanjiri pekerja & pemilik usaha dari seluruh Indonesia — tapi rapat banjar, upacara, dan hati orang Bali berbahasa Bali. Pendatang yang bisa basa Bali diterima sebagai nyama (saudara), bukan tamu.",
      },
      {
        icon: "🛕",
        title: "Sor Singgih: Bahasa Adalah Etika",
        description:
          "Basa andap untuk sesama, basa alus untuk yang dihormati & konteks upacara — salah tingkat di pura atau ke pemangku itu fatal secara sosial. Sistemnya harus dipelajari, bukan ditebak.",
      },
      {
        icon: "💼",
        title: "Nilai Jual di Industri Hospitality",
        description:
          "GM, wedding planner & staf hospitality yang bisa basa Bali membangun relasi beda level dengan tim & vendor lokal — dan tamu domestik pun terkesan. Keterampilan langka di industri terbesar pulau ini.",
      },
    ],

    targetAudience: [
      {
        emoji: "🏢",
        persona: "Pendatang yang Kerja & Usaha di Bali",
        benefit: "Percakapan banjar, vendor, tim lokal — jadi nyama, bukan tamu.",
      },
      {
        emoji: "💍",
        persona: "Pasangan & Menantu Orang Bali",
        benefit: "Basa alus untuk mertua & upacara keluarga — kesan yang menentukan.",
      },
      {
        emoji: "🌺",
        persona: "Generasi Muda Bali",
        benefit: "Dari paham pasif jadi fasih — termasuk alus untuk odalan.",
      },
      {
        emoji: "🏨",
        persona: "Profesional Hospitality & Wedding",
        benefit: "Relasi vendor & tim, istilah upacara, etiket pura untuk tamu.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "Tingkat 1 — Basa Andap Dasar",
        sessionCount: 48,
        description:
          "Mulai dari nol dengan basa andap (ragam sehari-hari) — fondasi sebelum naik ke alus.",
        topics: [
          "Pelafalan & kosakata inti andap",
          "Kalimat dasar & kata ganti (tiang, ragane)",
          "Angka, hari pasaran & kalender Bali dasar",
          "Percakapan warung, pasar, banjar",
          "Om Swastiastu & sapaan sehari-hari",
        ],
      },
      {
        level: "A2",
        title: "Tingkat 2 — Sor Singgih & Sopan Santun",
        sessionCount: 64,
        description: "Naik tingkat: basa alus untuk yang dihormati, dan peta kapan memakainya.",
        topics: [
          "Kosakata paralel andap→alus (medaar→ngajengang)",
          "Alus singgih vs alus sor — meninggikan lawan, merendahkan diri",
          "Percakapan dengan penglingsir & pemangku",
          "Situasi upacara: odalan, ngaben, nganten",
          "Struktur banjar & istilah adat",
        ],
      },
      {
        level: "B1",
        title: "Tingkat 3 — Percakapan Mahir & Upacara",
        sessionCount: 80,
        description:
          "Fasih di dua tingkat, paham konteks upacara, mulai membaca aksara Bali.",
        topics: [
          "Peralihan andap↔alus yang luwes dalam satu percakapan",
          "Kosakata upacara & banten (sesajen)",
          "Aksara Bali: wianjana, pangangge, baca-tulis dasar",
          "Sesenggakan (peribahasa) & wewangsalan",
          "Dialek: Bali dataran vs Bali aga (peta)",
        ],
      },
      {
        level: "B2",
        title: "Tingkat 4 — Sastra & Budaya",
        sessionCount: 112,
        description:
          "Masuk khazanah: kidung, geguritan, dan bahasa upacara tinggi.",
        topics: [
          "Geguritan & pupuh Bali (Sinom, Ginada)",
          "Kidung & kekawin — pengenalan basa Kawi",
          "Membaca lontar sederhana berpanduan",
          "Dharma wacana & bahasa pidato adat",
          "Satua Bali (dongeng) sebagai teks",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Saya pindah kerja ke Bali. Orang Bali kan bisa bahasa Indonesia — perlu banget?",
        answer:
          "Untuk transaksi — tidak. Untuk kehidupan — sangat. Rapat banjar, upacara, obrolan warung sesungguhnya berbahasa Bali, dan pendatang yang mencoba selalu dicatat hangat. Di pulau yang makin padat pendatang, itu pembeda sosial (dan bisnis) yang nyata.",
      },
      {
        question: "Sor singgih itu seberapa wajib? Takut salah malah menyinggung.",
        answer:
          "Justru karena itu dipelajari terstruktur: salah memakai andap ke pemangku itu fatal, tapi orang Bali sangat menghargai pendatang yang berusaha — asal arahnya benar. Kami ajarkan berpasangan (andap+alus sekaligus) plus peta situasi sejak awal.",
      },
      {
        question: "Saya orang Bali tapi alusnya berantakan. Bisa fokus situ aja?",
        answer:
          "Bisa — profil umum: fasih andap dari pergaulan, gagap alus saat odalan atau ketemu penglingsir. Placement kami langsung ke tingkat 2–3, fokus kosakata alus & konteks upacara.",
      },
      {
        question: "Aksara Bali diajarkan juga?",
        answer:
          "Ya, mulai tingkat 3 — aksara Bali kini wajib di papan nama jalan & kantor se-Bali, jadi makin terlihat sehari-hari. Sistemnya sepupu aksara Jawa; baca-tulis dasar biasanya tuntas 8–10 sesi.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Penutur asli Bali dengan latar pendidikan bahasa/sastra Bali — termasuk yang berpengalaman jadi juru bahasa upacara. Materi disesuaikan kabupaten asal keluarga/lingkunganmu.",
      },
    ],

    metaTitle: "Kursus Bahasa Bali Online | Linguo.id — Sor Singgih & Aksara",
    metaDescription:
      "Belajar Bahasa Bali online: basa andap & alus, sor singgih, aksara Bali, bahasa upacara. Untuk pendatang & generasi muda. Semi privat mulai Rp 75.000/sesi.",
    metaKeywords: [
      "kursus bahasa bali",
      "les bahasa bali online",
      "belajar bahasa bali",
      "bahasa bali halus",
      "basa bali alus",
      "sor singgih basa bali",
      "belajar aksara bali",
      "kursus bali denpasar",
      "les bahasa bali",
      "bahasa bali pemula",
    ],
  },

  // ==========================================================================
  // BATAK
  // ==========================================================================
  batak: {
    urlSlug: "batak",
    languageSlug: "batak",
    tagline: "Horas! — bahasa, marga & adat yang mengikat halak Batak di mana pun.",
    heroDescription:
      "Kursus Bahasa Batak (Toba) online. Dari percakapan sehari-hari sampai bahasa adat — martarombo, umpasa, ulos — untuk generasi muda Batak perantauan, menantu, dan peminat budaya.",

    whyLearn: [
      {
        icon: "🌏",
        title: "Diaspora Besar, Bahasa Menipis",
        description:
          "Halak Batak merantau ke seluruh dunia dan sukses di hukum, musik, bisnis — tapi generasi ketiganya banyak yang hanya bisa 'horas'. Bahasa adalah simpul marga; tanpa itu, martarombo (menelusuri kekerabatan) macet.",
      },
      {
        icon: "💍",
        title: "Menantu & Pesta Adat",
        description:
          "Pesta unjuk (pernikahan), mangulosi, tortor — adat Batak hidup dan padat bahasa. Menantu (parumaen/hela) yang paham bahasa & perannya dalam dalihan na tolu dihormati seketika oleh hula-hula.",
      },
      {
        icon: "🎵",
        title: "Musik & Umpasa yang Mendunia",
        description:
          "Dari trio lagu Batak sampai gondang sabangunan — dan umpasa (pantun adat) yang mengalir di tiap pesta. Memahaminya berarti ikut, bukan menonton.",
      },
    ],

    targetAudience: [
      {
        emoji: "🌆",
        persona: "Generasi Muda Batak Perantauan",
        benefit: "Dari 'horas' doang jadi bisa martarombo & ikut pesta adat.",
      },
      {
        emoji: "💍",
        persona: "Menantu & Pasangan Halak Batak",
        benefit: "Bahasa & peranmu dalam dalihan na tolu — bekal pesta unjuk.",
      },
      {
        emoji: "⚖️",
        persona: "Tokoh Muda yang Disiapkan Jadi Parhata",
        benefit: "Umpasa, urutan acara adat, bahasa raja parhata.",
      },
      {
        emoji: "🎵",
        persona: "Musisi & Peminat Budaya Batak",
        benefit: "Lirik lagu Batak, gondang, dan makna di baliknya.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "Tingkat 1 — Percakapan Dasar",
        sessionCount: 48,
        description:
          "Mulai dari nol dengan Batak Toba sehari-hari — kosakata inti & kalimat dasar.",
        topics: [
          "Pelafalan & kosakata inti Toba",
          "Kata ganti (ahu, ho, hamu) & sopannya",
          "Angka, waktu, pasar (onan)",
          "Percakapan keluarga & sapaan kekerabatan dasar",
          "Horas, mauliate & ungkapan sehari-hari",
        ],
      },
      {
        level: "A2",
        title: "Tingkat 2 — Kekerabatan & Marga",
        sessionCount: 64,
        description: "Bahasa untuk martarombo — sistem sapaan kekerabatan yang jadi jantung sosial Batak.",
        topics: [
          "Partuturan: amang, inang, tulang, namboru, lae, ito",
          "Martarombo: menelusuri marga & sapaan yang tepat",
          "Dalihan na tolu dalam bahasa: hula-hula, boru, dongan tubu",
          "Imbuhan Toba: mar-, ma-, di-, -hon",
          "Percakapan kunjungan keluarga & punguan marga",
        ],
      },
      {
        level: "B1",
        title: "Tingkat 3 — Bahasa Adat & Umpasa",
        sessionCount: 80,
        description:
          "Bahasa pesta adat: umpasa, urutan acara, dan peran bicara.",
        topics: [
          "Umpasa: struktur, hafalan inti, kapan dipakai",
          "Bahasa pesta unjuk: mangulosi, tuhor, ulaon",
          "Aksara Batak (surat Batak) dasar",
          "Membaca lirik lagu & teks sederhana",
          "Peta dialek: Toba vs Karo vs Simalungun vs Mandailing",
        ],
      },
      {
        level: "B2",
        title: "Tingkat 4 — Parhata & Khazanah",
        sessionCount: 112,
        description:
          "Bahasa tingkat parhata (juru bicara adat) & sastra lisan.",
        topics: [
          "Marhata sinamot: negosiasi adat pernikahan",
          "Umpasa lanjutan & improvisasi",
          "Turi-turian (sastra lisan) & andung",
          "Pustaha & tradisi tulis — pengenalan",
          "Praktik: simulasi peran di ulaon adat",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Batak kan banyak — Toba, Karo, Mandailing. Yang diajarkan yang mana?",
        answer:
          "Track utama kami Batak Toba (penutur terbanyak & bahasa mayoritas pesta adat di perantauan). Karo dan Mandailing-Angkola cukup berbeda — kalau kebutuhanmu spesifik ke sana, sampaikan di awal; ketersediaan pengajarnya kami carikan.",
      },
      {
        question: "Saya menantu orang Batak, pesta unjuk 8 bulan lagi. Sempat?",
        answer:
          "Sempat untuk yang penting: percakapan dasar + partuturan (sapaan kekerabatan) + peranmu di acara. Salah menyapa tulang itu lebih fatal daripada grammar meleset — makanya kekerabatan kami taruh di depan. Banyak siswa kami persis profil ini.",
      },
      {
        question: "Umpasa itu apa dan kenapa penting banget?",
        answer:
          "Pantun adat yang mengikat tiap tahap upacara — memberi ulos, menyambut hula-hula, mendoakan pengantin. Orang yang bisa melempar umpasa yang pas pada momen yang pas langsung naik statusnya di mata keluarga. Kami ajarkan berjenjang: pahami dulu, hafal inti, lalu improvisasi.",
      },
      {
        question: "Aksara Batak masih dipakai?",
        answer:
          "Sehari-hari tidak, tapi hidup di pustaha (naskah kuno), gorga, dan kini bangkit di komunitas & desain. Kami ajarkan dasarnya di tingkat 3 sebagai warisan — fokus utama tetap bahasa lisan & adat.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Penutur asli Toba — beberapa aktif sebagai parhata muda — yang paham dunia perantauan. Materi disesuaikan: punguan margamu, jenis pesta yang kamu hadapi, lagu yang kamu suka.",
      },
    ],

    metaTitle: "Kursus Bahasa Batak Online | Linguo.id — Toba, Umpasa, Adat",
    metaDescription:
      "Belajar Bahasa Batak Toba online: percakapan, partuturan, umpasa & bahasa pesta adat. Untuk generasi perantauan & menantu. Semi privat mulai Rp 75.000/sesi.",
    metaKeywords: [
      "kursus bahasa batak",
      "les bahasa batak online",
      "belajar bahasa batak",
      "bahasa batak toba",
      "belajar umpasa batak",
      "partuturan batak",
      "martarombo",
      "les batak murah",
      "bahasa batak pemula",
      "adat batak pernikahan",
    ],
  },

  // ==========================================================================
  // BUGIS
  // ==========================================================================
  bugis: {
    urlSlug: "bugis",
    languageSlug: "bugis",
    tagline: "Dari tabe' sampai aksara Lontara — bahasa pelaut ulung Nusantara.",
    heroDescription:
      "Kursus Bahasa Bugis online. Percakapan sehari-hari, adab tabe', aksara Lontara & warisan La Galigo — untuk generasi muda Bugis perantauan, menantu, dan peminat budaya maritim.",

    whyLearn: [
      {
        icon: "⛵",
        title: "Diaspora Pelaut Terbesar Nusantara",
        description:
          "Orang Bugis-Makassar merantau berabad-abad — dari Kalimantan sampai Johor & Sabah. Komunitasnya besar dan solid; bahasanya paspor masuk jaringan dagang & kekerabatan yang legendaris itu.",
      },
      {
        icon: "📜",
        title: "La Galigo: Epik Terpanjang Dunia",
        description:
          "Sureq Galigo lebih panjang dari Mahabharata — ditulis dalam aksara Lontara yang khas. Warisan sastra kelas dunia yang pembaca aslinya kian langka; mempelajarinya adalah konservasi hidup.",
      },
      {
        icon: "🤝",
        title: "Siri' na Pacce: Bahasa Adalah Martabat",
        description:
          "Adab tabe', panggilan puang/daeng, falsafah siri' (harga diri) — kesantunan Bugis padat aturan. Menantu & mitra bisnis yang memahaminya dihormati seketika.",
      },
    ],

    targetAudience: [
      {
        emoji: "🌆",
        persona: "Generasi Muda Bugis Perantauan",
        benefit: "Nyambung lagi dengan keluarga & jaringan perantauan Bugis.",
      },
      {
        emoji: "💍",
        persona: "Menantu & Pasangan Orang Bugis",
        benefit: "Adab tabe', panggilan yang tepat, bekal acara mappacci & pernikahan.",
      },
      {
        emoji: "💼",
        persona: "Perantau & Pebisnis di Sulsel",
        benefit: "Percakapan pasar, pelabuhan & relasi dagang Makassar-Parepare.",
      },
      {
        emoji: "📜",
        persona: "Peneliti & Pecinta La Galigo",
        benefit: "Aksara Lontara & pintu masuk ke naskah sureq.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "Tingkat 1 — Percakapan Dasar",
        sessionCount: 48,
        description:
          "Mulai dari nol. Pelafalan khas (glottal & geminasi), kosakata inti, kalimat sehari-hari.",
        topics: [
          "Pelafalan: hamzah akhir, konsonan ganda (lompo', bella)",
          "Kata ganti & klitik (-ka', -ko, -ki') — kunci Bugis!",
          "Angka, pasar, warung kopi (warkop!)",
          "Tabe' & adab dasar",
          "Perkenalan & sapaan (puang, daeng, andi)",
        ],
      },
      {
        level: "A2",
        title: "Tingkat 2 — Percakapan & Adab",
        sessionCount: 64,
        description: "Ngobrol lepas dengan tingkat kesantunan yang tepat.",
        topics: [
          "Klitik lengkap: fokus & kepemilikan",
          "Registrasi santun: -ki' vs -ko, kapan yang mana",
          "Sistem kekerabatan & panggilan keluarga",
          "Percakapan keluarga: kunjungan, hajatan",
          "Bugis vs Makassar: peta perbedaan",
        ],
      },
      {
        level: "B1",
        title: "Tingkat 3 — Lontara & Ungkapan",
        sessionCount: 80,
        description:
          "Aksara Lontara & kekayaan ungkapan — élong (pantun) dan paseng (petuah).",
        topics: [
          "Aksara Lontara: 23 huruf induk + diakritik",
          "Membaca & menulis teks Lontara sederhana",
          "Élong ugi (pantun Bugis) & paseng to riolo",
          "Kosakata adat: mappacci, mabbarazanji, sompa",
          "Falsafah siri' na pacce dalam bahasa",
        ],
      },
      {
        level: "B2",
        title: "Tingkat 4 — Sastra & Naskah",
        sessionCount: 112,
        description:
          "Masuk khazanah: sureq, bahasa upacara, dan La Galigo berpanduan.",
        topics: [
          "Bahasa sureq vs bahasa lisan",
          "Petikan La Galigo berpanduan",
          "Bahasa upacara pernikahan & madduppa",
          "Naskah lontara' attoriolong (silsilah) — pengenalan",
          "Dokumentasi: wawancara penutur sepuh",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Bugis sama Makassar itu satu bahasa?",
        answer:
          "Dua bahasa berbeda (basa Ugi vs basa Mangkasara') meski serumpun dan sama-sama memakai Lontara. Track kami Bugis; kalau kebutuhanmu Makassar (daeng!), sampaikan di awal — pengajarnya berbeda.",
      },
      {
        question: "Klitik -ka', -ko, -ki' itu apa dan kenapa penting?",
        answer:
          "Partikel kecil yang menempel di kata dan menandai siapa-melakukan-apa plus tingkat hormat — jantung tata bahasa Bugis sekaligus sopan santunnya (-ki' santun, -ko akrab/kasar). Salah pakai langsung terasa. Kami latih dari kalimat pertama.",
      },
      {
        question: "Aksara Lontara masih kepakai?",
        answer:
          "Masih diajarkan di sekolah Sulsel, hidup di naskah & simbol budaya, dan bangkit lagi di desain & media sosial. Di kelas, Lontara masuk tingkat 3 — setelah bahasanya jalan.",
      },
      {
        question: "Saya cuma mau bisa ngobrol sama keluarga pasangan di Bone. Berapa lama?",
        answer:
          "Percakapan keluarga dasar dengan adab yang benar: 4–6 bulan (2 sesi/minggu). Fokusnya langsung ke situasi nyata — kunjungan, makan bersama, panggilan kekerabatan yang tepat.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Penutur asli Bugis (Bone, Wajo, Soppeng, Sidrap) berlatar pendidikan bahasa — beberapa terlibat komunitas pelestarian Lontara.",
      },
    ],

    metaTitle: "Kursus Bahasa Bugis Online | Linguo.id — Percakapan & Lontara",
    metaDescription:
      "Belajar Bahasa Bugis online: percakapan, adab tabe', aksara Lontara, élong & La Galigo. Untuk perantauan & menantu. Semi privat mulai Rp 75.000/sesi.",
    metaKeywords: [
      "kursus bahasa bugis",
      "les bahasa bugis online",
      "belajar bahasa bugis",
      "bahasa bugis sehari hari",
      "belajar aksara lontara",
      "bahasa ugi",
      "les bugis murah",
      "bahasa bugis pemula",
      "budaya bugis",
      "la galigo",
    ],
  },

  // ==========================================================================
  // MADURA
  // ==========================================================================
  madura: {
    urlSlug: "madura",
    languageSlug: "madurese",
    tagline: "Dari dhâ' remma sampai èngghi bhunten — bahasa 13 juta orang pulau garam.",
    heroDescription:
      "Kursus Bahasa Madura online dengan tingkat tutur lengkap. Untuk guru & tenaga kesehatan yang bertugas di Madura, pebisnis, menantu, dan generasi muda Madura perantauan.",

    whyLearn: [
      {
        icon: "🏥",
        title: "Bertugas di Madura? Bahasa Dulu",
        description:
          "Guru, bidan, dokter & penyuluh yang ditempatkan di Madura menghadapi pasien dan wali murid yang kesehariannya berbahasa Madura. Layanan yang menyentuh dimulai dari bahasa — dan kepercayaan mengikutinya.",
      },
      {
        icon: "🤝",
        title: "Jaringan Dagang yang Legendaris",
        description:
          "Perantau Madura menggerakkan besi tua, sate, pangkalan, dan logistik di seluruh Indonesia. Jaringannya erat dan setia — bahasa Madura adalah kunci masuknya, dan mitra yang bisa berbahasa dihormati beda.",
      },
      {
        icon: "🕌",
        title: "Tingkat Tutur & Tradisi Pesantren",
        description:
          "Enjâ'-iyâ (akrab), èngghi-enten, èngghi-bhunten (paling halus) — kesantunan Madura berlapis, dan hidup kental di budaya pesantren & keluarga. Salah tingkat ke kiai atau mertua bukan pilihan.",
      },
    ],

    targetAudience: [
      {
        emoji: "🏥",
        persona: "Guru, Nakes & ASN Bertugas di Madura",
        benefit: "Percakapan pasien/wali murid + tingkat tutur yang aman.",
      },
      {
        emoji: "💼",
        persona: "Pebisnis & Mitra Jaringan Madura",
        benefit: "Relasi dagang: pasar, pangkalan, komunitas perantau.",
      },
      {
        emoji: "💍",
        persona: "Menantu & Pasangan Orang Madura",
        benefit: "Èngghi-bhunten untuk mertua & acara keluarga.",
      },
      {
        emoji: "🌆",
        persona: "Generasi Muda Madura Perantauan",
        benefit: "Dari paham pasif jadi aktif — termasuk ke keluarga di pulau.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "Tingkat 1 — Enjâ'-Iyâ Dasar",
        sessionCount: 48,
        description:
          "Mulai dari nol dengan ragam akrab — pelafalan khas Madura yang tebal dijinakkan dulu.",
        topics: [
          "Pelafalan: konsonan beraspirasi (bh, dh, jh), â",
          "Kosakata inti & kalimat dasar",
          "Angka, pasar, warung",
          "Sapaan & kata ganti dasar",
          "Percakapan tetangga & sehari-hari",
        ],
      },
      {
        level: "A2",
        title: "Tingkat 2 — Tingkat Tutur",
        sessionCount: 64,
        description: "Naik ke èngghi-enten & èngghi-bhunten — peta kapan memakai apa.",
        topics: [
          "Kosakata paralel 3 tingkat (ngakan→neddhâ→adhâ'ar)",
          "Berbahasa ke orang tua, guru & kiai",
          "Imbuhan Madura produktif",
          "Situasi keluarga: kunjungan, hajatan, lebaran",
          "Dialek: Bangkalan vs Pamekasan vs Sumenep",
        ],
      },
      {
        level: "B1",
        title: "Tingkat 3 — Bahasa Profesi & Ungkapan",
        sessionCount: 80,
        description:
          "Bahasa kerja nyata: kelas, puskesmas, pasar — plus kekayaan ungkapan.",
        topics: [
          "Bahasa kelas & sekolah untuk guru",
          "Bahasa kesehatan: anamnesis & edukasi pasien",
          "Parèbhâsan (peribahasa) & ungkapan",
          "Percakapan dagang & negosiasi",
          "Carakan Madhurâ (aksara) — pengenalan",
        ],
      },
      {
        level: "B2",
        title: "Tingkat 4 — Budaya & Sastra",
        sessionCount: 112,
        description:
          "Masuk khazanah: syi'ir, mamaca, dan bahasa adat.",
        topics: [
          "Syi'ir Madura & tradisi pesantren",
          "Mamaca & sastra lisan",
          "Bahasa upacara: pernikahan, rokat, petik laut",
          "Kèjhung & lagu Madura sebagai teks",
          "Dokumentasi penutur sepuh",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Bahasa Madura mirip bahasa Jawa nggak?",
        answer:
          "Serumpun tapi bukan saling paham — kosakatanya berbeda jauh, dan Madura punya bunyi khas (konsonan beraspirasi bh/dh/jh) yang tak ada di Jawa. Yang mirip konsepnya: sama-sama bertingkat tutur. Dari bahasa Indonesia, keduanya sama-sama bisa dipelajari cepat.",
      },
      {
        question: "Saya bidan, baru ditempatkan di Pamekasan. Berapa lama sampai bisa melayani pasien?",
        answer:
          "Percakapan klinis dasar (keluhan, instruksi obat, edukasi) dengan tingkat tutur yang aman: 4–6 bulan fokus. Track profesi kami memang menaruh bahasa puskesmas/kelas di depan — kasus nyata siswa jadi materi.",
      },
      {
        question: "Tiga tingkat tutur — wajib semua?",
        answer:
          "Bertahap. Enjâ'-iyâ dulu sebagai fondasi, lalu èngghi-bhunten untuk orang tua/kiai/mertua — dua ujung itu yang paling kepakai. Yang tengah (èngghi-enten) menyusul alami. Prinsip amannya kami ajarkan: kalau ragu, pakai yang halus.",
      },
      {
        question: "Dialeknya beda-beda ya di tiap kabupaten?",
        answer:
          "Ya — Bangkalan, Pamekasan, Sumenep punya rasa masing-masing (Sumenep dianggap paling halus). Standar pengajaran kami Pamekasan-Sumenep, dengan peta perbedaan sejak awal. Sebut lokasi penempatan/keluargamu, pengajar menyesuaikan.",
      },
      {
        question: "Pengajarnya siapa?",
        answer:
          "Penutur asli Madura berlatar pendidikan bahasa — termasuk yang berpengalaman melatih guru & nakes program penempatan.",
      },
    ],

    metaTitle: "Kursus Bahasa Madura Online | Linguo.id — Tingkat Tutur Lengkap",
    metaDescription:
      "Belajar Bahasa Madura online: enjâ'-iyâ sampai èngghi-bhunten, bahasa profesi untuk guru & nakes, budaya. Semi privat mulai Rp 75.000/sesi.",
    metaKeywords: [
      "kursus bahasa madura",
      "les bahasa madura online",
      "belajar bahasa madura",
      "bahasa madura halus",
      "bahasa madura sehari hari",
      "les madura murah",
      "bahasa madura pemula",
      "tingkat tutur madura",
      "kamus madura",
      "guru di madura",
    ],
  },

  // ==========================================================================
  // BIPA — BAHASA INDONESIA UNTUK PENUTUR ASING
  // ==========================================================================
  indonesia: {
    urlSlug: "indonesia",
    languageSlug: "bipa",
    tagline: "BIPA — Bahasa Indonesia untuk Penutur Asing, dari survival sampai UKBI.",
    heroDescription:
      "Kursus BIPA (Bahasa Indonesia untuk Penutur Asing) online — Indonesian course for expats, spouses & professionals. Kurikulum selaras SKL BIPA & UKBI, pengajar berpengalaman, jadwal fleksibel.",

    whyLearn: [
      {
        icon: "🌏",
        title: "270 Juta Orang, Satu Bahasa Pemersatu",
        description:
          "Bahasa Indonesia membuka negara terbesar keempat dunia — dan salah satu bahasa besar yang paling cepat dipelajari: alfabet Latin, ejaan konsisten, tanpa tenses, tanpa gender. Progress terasa dalam hitungan minggu.",
      },
      {
        icon: "💼",
        title: "Ekspatriat & Profesional di Indonesia",
        description:
          "Rapat berbahasa Inggris, tapi pabrik, klien daerah, dan tim lapangan berbahasa Indonesia. Ekspatriat yang fasih membangun kepercayaan yang tak bisa dicapai lewat penerjemah — plus KITAS hidupnya lebih mudah.",
      },
      {
        icon: "❤️",
        title: "Pasangan, Keluarga & UKBI",
        description:
          "Menikah dengan orang Indonesia, punya mertua di sini, atau menyiapkan naturalisasi? UKBI (Uji Kemahiran Berbahasa Indonesia) adalah ujian resminya — dan keluarga besarmu menanti obrolan pertama.",
      },
    ],

    targetAudience: [
      {
        emoji: "💼",
        persona: "Ekspatriat & Profesional (Expats)",
        benefit: "Bahasa kantor & lapangan — practical Indonesian for work.",
      },
      {
        emoji: "❤️",
        persona: "Pasangan WNA / Foreign Spouses",
        benefit: "Percakapan keluarga, mertua, dan persiapan UKBI naturalisasi.",
      },
      {
        emoji: "🎓",
        persona: "Mahasiswa Asing & Peneliti (Darmasiswa/KNB)",
        benefit: "Bahasa akademik & kehidupan kampus Indonesia.",
      },
      {
        emoji: "🏝️",
        persona: "Digital Nomad di Bali & Jakarta",
        benefit: "Keluar dari bubble ekspat — pasar, ojek, komunitas lokal.",
      },
    ],

    curriculum: [
      {
        level: "A1",
        title: "BIPA 1 — Survival Indonesian",
        sessionCount: 48,
        description:
          "From zero: pronunciation, daily phrases, and the joy of a grammar with no tenses.",
        topics: [
          "Pelafalan & ejaan — konsisten, langsung bisa baca",
          "Kalimat dasar: SVO tanpa konjugasi",
          "Angka, harga, tawar-menawar, ojek & warung",
          "Perkenalan & sapaan (Pak/Bu/Mas/Mbak)",
          "Survival: arah jalan, restoran, belanja",
        ],
      },
      {
        level: "A2",
        title: "BIPA 2 — Percakapan Sehari-hari",
        sessionCount: 64,
        description: "Percakapan harian lancar + imbuhan pertama (ber-, me-).",
        topics: [
          "Imbuhan ber- & me- — pintu masuk morfologi",
          "Kata bantu waktu: sudah, sedang, akan, pernah",
          "Bahasa formal vs percakapan (nggak, banget, dong)",
          "Topik: keluarga, kerja, perjalanan, kesehatan",
          "Small talk Indonesia & basa-basi yang penting",
        ],
      },
      {
        level: "B1",
        title: "BIPA 3–4 — Menengah (UKBI Madya)",
        sessionCount: 80,
        description:
          "Diskusi topik luas, membaca berita, bahasa kantor — target UKBI peringkat Madya.",
        topics: [
          "Imbuhan lengkap: me-kan, me-i, pe-an, ke-an",
          "Kalimat pasif di- — kunci bahasa tulis & sopan",
          "Membaca Kompas/Detik ringan",
          "Bahasa rapat & email kantor",
          "Ragam daerah & bahasa gaul Jakarta — peta",
        ],
      },
      {
        level: "B2",
        title: "BIPA 5–6 — Mahir (UKBI Unggul)",
        sessionCount: 112,
        description:
          "Bahasa akademik, media & profesional penuh — target UKBI Unggul untuk kerja & naturalisasi.",
        topics: [
          "Bahasa formal akademik & laporan",
          "Presentasi, negosiasi & pidato",
          "Media penuh: berita TV, opini koran",
          "Budaya tinggi konteks: kritik halus, penolakan sopan",
          "Simulasi UKBI: 5 seksi lengkap",
        ],
      },
    ],

    pricing: defaultPricing,

    faq: [
      {
        question: "Is this course taught in English?",
        answer:
          "Yes — BIPA 1–2 are taught bilingually (English–Indonesian) by teachers experienced with foreign learners, shifting to full Indonesian immersion from BIPA 3. Materials and session recaps are bilingual at beginner levels.",
      },
      {
        question: "Seberapa cepat bahasa Indonesia bisa dikuasai?",
        answer:
          "Salah satu bahasa besar tercepat di dunia: alfabet Latin, ejaan fonetis, tanpa tenses-gender-kasus. Percakapan survival dalam 2–3 bulan, percakapan nyaman (A2) 6–8 bulan. Tantangan sesungguhnya justru imbuhan & ragam informal — dan di situ pengajar sungguhan mengalahkan aplikasi.",
      },
      {
        question: "UKBI itu apa dan siapa yang butuh?",
        answer:
          "Uji Kemahiran Berbahasa Indonesia — ujian resmi Badan Bahasa, diperlukan untuk naturalisasi (kewarganegaraan), beberapa izin kerja profesi, dan studi. Peringkatnya dari Terbatas sampai Istimewa; kurikulum kami dipetakan ke target Madya & Unggul.",
      },
      {
        question: "Bahasa formal yang saya pelajari kok beda sama yang dipakai orang di jalan?",
        answer:
          "Fenomena klasik pembelajar BIPA: buku mengajarkan 'tidak', jalanan bilang 'nggak'. Kami mengajarkan keduanya sejajar sejak BIPA 2 — bahasa baku sebagai fondasi, ragam percakapan sebagai kenyataan — supaya kamu tak kaget di warung.",
      },
      {
        question: "Bisa untuk pasangan saya yang sama sekali nol?",
        answer:
          "Bisa — justru profil siswa BIPA terbanyak kami: pasangan WNA yang ingin bisa ngobrol dengan mertua & keluarga besar. Kelas privat 1-on-1 dengan materi dari kehidupan nyata kalian (keluarga, kota tempat tinggal, rencana acara).",
      },
    ],

    metaTitle: "Kursus BIPA Online | Linguo.id — Indonesian for Foreigners, UKBI Ready",
    metaDescription:
      "Kursus Bahasa Indonesia untuk Penutur Asing (BIPA) online. Learn Indonesian with certified teachers — survival to UKBI. Semi privat mulai Rp 135.000/sesi.",
    metaKeywords: [
      "kursus BIPA",
      "BIPA online",
      "bahasa indonesia untuk penutur asing",
      "learn indonesian online",
      "indonesian course for foreigners",
      "indonesian language course",
      "kursus bahasa indonesia untuk orang asing",
      "UKBI persiapan",
      "belajar bahasa indonesia expat",
      "indonesian for expats",
    ],
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/** Lookup detail by URL slug (case-insensitive). Returns undefined if not found. */
export function getLanguageDetailBySlug(slug: string): LanguageDetail | undefined {
  return languageDetails[slug.toLowerCase()];
}

/** Returns all URL slugs that have detail pages — used by generateStaticParams. */
export function getAllLanguageDetailSlugs(): string[] {
  return Object.keys(languageDetails);
}

/** Get the matching LanguageMeta from languages.ts via cross-reference. */
export function getLanguageMetaForDetail(detail: LanguageDetail) {
  return languages.find((l) => l.slug === detail.languageSlug);
}
