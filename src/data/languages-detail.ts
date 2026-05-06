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
      "Belajar Bahasa Korea online bersama pengajar bersertifikat. Kelas privat, semi privat & grup. Hangul, K-drama, persiapan TOPIK. Mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Jepang online dari nol. Hiragana, Katakana, Kanji, persiapan JLPT N5–N1, business Japanese. Pengajar bersertifikat, mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Mandarin online dari Pinyin sampai mahir. Persiapan HSK 1–6, business Mandarin, Hanzi simplified. Pengajar bersertifikat, mulai Rp 50.000/sesi.",
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
      "Kursus Bahasa Inggris online untuk semua level. Conversation, IELTS, TOEFL, business English. Pengajar bersertifikat TESOL/CELTA, mulai Rp 50.000/sesi.",
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
