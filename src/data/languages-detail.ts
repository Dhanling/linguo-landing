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
      "Belajar Bahasa Jerman online dari nol. Persiapan Goethe-Zertifikat, Ausbildung, au pair, studi di Jerman. Pengajar bersertifikat, mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Prancis online dari nol. Persiapan DELF/DALF, Campus France, French for hospitality. Pengajar bersertifikat, mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Spanyol online dari nol. Persiapan DELE/SIELE, percakapan cepat lancar, Spanyol Eropa & Amerika Latin. Mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Italia online dari nol. Persiapan CILS/CELI, studi seni & desain di Italia, beasiswa MAECI. Pengajar bersertifikat, mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Belanda online dari nol. Persiapan Basisexamen Inburgering (MVV), ujian NT2, baca arsip & dokumen hukum. Mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Arab online dari nol. Nahwu-sharaf runtut, memahami Al-Qur'an, Amiyah percakapan, persiapan studi Timur Tengah. Mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Rusia online dari nol. Alfabet Sirilik, persiapan TORFL, beasiswa Open Doors, business Russian. Mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Turki online dari nol. Persiapan Türkiye Bursları, TÖMER, nonton dizi tanpa subtitle. Pengajar alumni Turki, mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Yunani online dari nol. Alfabet Yunani, percakapan Mediterania, track pelaut & teologi, persiapan Ελληνομάθεια. Mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Portugis online dari nol. Portugis Brasil & Eropa, persiapan Celpe-Bras, karier Timor Leste, bisnis Brasil. Mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Thailand online dari nol. 5 nada, aksara Thai, percakapan Bangkok, bisnis ASEAN. Pengajar berpengalaman, mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Vietnam online dari nol. 6 nada, huruf Latin, percakapan Hanoi & Saigon, bahasa untuk manufaktur & bisnis. Mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Hindi online dari nol. Aksara Devanagari, percakapan sehari-hari, bahasa Bollywood, business Hindi. Mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Jawa online: ngoko, krama, krama inggil, aksara Jawa, tembang. Untuk pendatang, menantu, & generasi diaspora. Mulai Rp 50.000/sesi.",
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
      "Belajar Bahasa Sunda online: undak usuk basa, percakapan Bandung, paribasa, aksara Sunda. Untuk pendatang & generasi muda. Mulai Rp 50.000/sesi.",
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
