// =============================================================================
// src/data/persiapanTesBahasa.ts
// [seo-tes-kota-v1]
//
// Data halaman SEO "Kursus Persiapan <ujian> Online" — satu entri per ujian
// resmi bahasa asing selain bahasa Inggris. Dirender oleh satu rute dinamis:
// src/app/persiapan-tes/[tes]/page.tsx  →  /persiapan-tes/jlpt, /topik, …
//
// Pola dicontek dari kompetitor (Cakap /persiapan-jlpt): satu URL per kata
// kunci ujian, isinya menjawab "ujiannya apa, levelnya apa, cara persiapannya
// bagaimana, berapa biayanya" — bukan katalog checkout.
//
// ATURAN ISI
// 1. HARGA TIDAK DITULIS DI SINI. Halaman menghitungnya dari lib/testPrep.ts
//    (produk JLPT/TOPIK/HSK/Goethe) atau lib/trial-pricing.ts (DELF → kelas
//    Private Prancis). Jangan pernah menulis angka rupiah di berkas ini.
// 2. Padanan CEFR diambil dari lib/levelEquivalence.ts (A1–B2) supaya sama
//    dengan WA hasil placement, silabus, dan /kursus. Baris C1 ke atas cuma
//    ditambahkan kalau produk test prep-nya memang menjual level itu.
// 3. Fakta ujian ditulis EVERGREEN: tidak ada tanggal ujian, biaya ujian,
//    atau kuota. Yang berubah tiap tahun selalu diarahkan ke situs resmi.
// 4. Slug `pte` TIDAK BOLEH dipakai di sini — /persiapan-tes/pte adalah folder
//    statis tersendiri (silabus PTE) dan menang atas rute dinamis.
// =============================================================================

import type { Band } from "@/lib/levelEquivalence";
import type { TestPrepId } from "@/lib/testPrep";
import type { FaqItem } from "@/lib/schema";

export type BagianUjian = {
  nama: string;
  /** Penjelasan singkat isi bagian ini. */
  isi: string;
};

export type BarisLevelTambahan = {
  /** Label level ujian ("JLPT N1"). */
  label: string;
  cefr: "C1" | "C2";
  catatan: string;
};

export type TesBahasa = {
  /** Segmen URL: /persiapan-tes/<slug>. */
  slug: string;
  /** Nama pendek ujian ("JLPT"). */
  tes: string;
  /** Nama panjang + kepanjangan. */
  namaPanjang: string;
  /** Lembaga penyelenggara resmi. */
  penyelenggara: string;
  /** Situs resmi — ditampilkan sebagai teks, tidak ditautkan dofollow. */
  situsResmi: string;
  /** Nama bahasa dalam bahasa Indonesia ("Jepang"). */
  bahasa: string;
  /** Nama bahasa Inggris untuk pricelist (trial-pricing kategori). */
  langEn: string;
  /** Slug kurikulum/silabus & kunci levelEquivalence ("japanese"). */
  kurikulumSlug: string;
  /** urlSlug /kursus/bahasa-<x> & /daftar/<x> ("jepang"). */
  kursusSlug: string;
  /** Produk test prep di lib/testPrep.ts, kalau ada. Tanpa ini → kelas Private biasa. */
  testPrepId?: TestPrepId;
  /** Sublevel silabus yang khusus membahas ujian ini, kalau ada ("B2.7"). */
  babSilabus?: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** Paragraf jawaban langsung di bawah H1 — berdiri sendiri, bisa dikutip. */
  ringkasan: string;
  bagian: BagianUjian[];
  /** Catatan format penilaian yang evergreen. */
  catatanSkor: string;
  /** Catatan per band A1–B2 (kolom "cocok untuk"). */
  catatanLevel: Partial<Record<Band, string>>;
  levelTambahan?: BarisLevelTambahan[];
  /** Untuk apa orang Indonesia biasanya butuh sertifikat ini. */
  kegunaan: string[];
  /** Fokus persiapan khas ujian ini (selain format umum kelas Linguo). */
  fokus: string[];
  faq: FaqItem[];
};

export const TES_BAHASA: TesBahasa[] = [
  // ---------------------------------------------------------------------------
  {
    slug: "jlpt",
    tes: "JLPT",
    namaPanjang: "Japanese-Language Proficiency Test (日本語能力試験)",
    penyelenggara: "The Japan Foundation dan Japan Educational Exchanges and Services (JEES)",
    situsResmi: "jlpt.jp",
    bahasa: "Jepang",
    langEn: "Japanese",
    kurikulumSlug: "japanese",
    kursusSlug: "jepang",
    testPrepId: "jlpt",
    babSilabus: "B2.7",
    metaTitle: "Kursus Persiapan JLPT Online N5–N1 | Linguo.id",
    metaDescription:
      "Kursus persiapan JLPT online N5 sampai N1: kosakata, kanji, tata bahasa, dokkai, dan choukai plus mock test. Semi-private atau private 1-on-1, placement test gratis.",
    keywords: [
      "kursus persiapan JLPT",
      "les JLPT online",
      "persiapan JLPT N5",
      "persiapan JLPT N4",
      "kursus JLPT N3",
      "belajar JLPT online",
    ],
    ringkasan:
      "JLPT (Japanese-Language Proficiency Test) adalah ujian kemampuan bahasa Jepang untuk penutur non-Jepang dengan lima level, dari N5 (paling mudah) sampai N1 (paling sulit). Ujiannya pilihan ganda dan menguji tiga hal: pengetahuan bahasa (kosakata, kanji, tata bahasa), membaca, dan mendengar — tanpa tes berbicara atau menulis esai. Di Linguo, persiapan JLPT berjalan live via Zoom dalam grup kecil atau private 1-on-1, dengan latihan soal berformat JLPT dan mock test berwaktu.",
    bagian: [
      { nama: "Pengetahuan bahasa — kosakata & kanji (文字・語彙)", isi: "Cara baca kanji, penulisan kata, sinonim, dan pemakaian kata dalam kalimat." },
      { nama: "Pengetahuan bahasa — tata bahasa (文法)", isi: "Memilih pola kalimat yang tepat dan menyusun kalimat dengan urutan yang benar." },
      { nama: "Membaca (読解)", isi: "Teks pendek sampai panjang: pengumuman, surel, esai, dan artikel, tergantung level." },
      { nama: "Mendengar (聴解)", isi: "Percakapan dan monolog dengan kecepatan alami; audio diputar sekali." },
    ],
    catatanSkor:
      "Skor total JLPT berskala 0–180 di semua level. Untuk lulus, skor total dan skor tiap bagian sama-sama harus melewati batas minimum, jadi satu bagian yang sangat lemah bisa membuat gagal walau totalnya cukup.",
    catatanLevel: {
      A1: "Hiragana, katakana, kanji dasar, kalimat sehari-hari yang sederhana.",
      A2: "Percakapan sehari-hari dan bacaan pendek; level yang sering diminta program kerja.",
      B1: "Level jembatan: bacaan lebih panjang dan percakapan dengan kecepatan mendekati alami.",
      B2: "Artikel koran, opini, dan percakapan native; banyak dipakai untuk kerja kantoran & kuliah.",
    },
    levelTambahan: [
      { label: "JLPT N1", cefr: "C1", catatan: "Level tertinggi: teks abstrak dan nuansa bahasa tingkat lanjut." },
    ],
    kegunaan: [
      "Melamar kerja di Jepang — program pekerja berketerampilan khusus (Tokutei Ginou/SSW) umumnya meminta minimal JLPT N4 atau JFT-Basic, ditambah tes keterampilan bidangnya.",
      "Melamar ke perusahaan Jepang di Indonesia, misalnya di kawasan industri Cikarang dan Karawang.",
      "Syarat beasiswa dan pendaftaran kuliah atau sekolah bahasa di Jepang.",
      "Bukti kemampuan yang terukur di CV, terutama N3 ke atas.",
    ],
    fokus: [
      "Target kanji dan kosakata per level dilatih bertahap, bukan dihafal sekaligus menjelang ujian.",
      "Latihan dokkai dengan batas waktu, karena kehabisan waktu di bagian membaca adalah penyebab gagal yang paling umum.",
      "Choukai dengan audio sekali putar dan teknik mencatat kata kunci.",
      "Mock test berwaktu untuk melihat bagian mana yang masih di bawah batas lulus.",
    ],
    faq: [
      {
        q: "Berapa lama persiapan JLPT N5 sampai N4?",
        a: "Tergantung titik awal dan intensitas belajar. Pemula total biasanya butuh beberapa bulan untuk N5, lalu waktu tambahan untuk N4. Cara paling cepat untuk tahu posisimu adalah placement test gratis bahasa Jepang di Linguo; hasilnya dipakai pengajar untuk menyusun rencana sampai tanggal ujianmu.",
      },
      {
        q: "Apakah JLPT ada tes berbicara?",
        a: "Tidak. JLPT hanya menguji pengetahuan bahasa (kosakata, kanji, tata bahasa), membaca, dan mendengar dalam format pilihan ganda. Kalau kamu juga butuh kemampuan bicara untuk wawancara kerja, latihan percakapan bisa dimasukkan ke kelas private.",
      },
      {
        q: "Apakah sertifikat Linguo sama dengan sertifikat JLPT?",
        a: "Tidak. Linguo adalah tempat persiapan, bukan penyelenggara ujian. Sertifikat JLPT resmi hanya didapat dengan mengikuti ujian JLPT yang diselenggarakan The Japan Foundation dan JEES. E-certificate Linguo adalah bukti kamu menyelesaikan kursus.",
      },
      {
        q: "Kapan jadwal ujian JLPT?",
        a: "JLPT diadakan beberapa kali dalam setahun dengan kota ujian dan masa pendaftaran yang diumumkan penyelenggara. Jadwal dan biayanya bisa berubah, jadi selalu cek pengumuman terbaru di situs resmi JLPT atau penyelenggara di kotamu, lalu mulai persiapan jauh sebelum tanggal ujian.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "topik",
    tes: "TOPIK",
    namaPanjang: "Test of Proficiency in Korean (한국어능력시험)",
    penyelenggara: "National Institute for International Education (NIIED), Kementerian Pendidikan Korea",
    situsResmi: "topik.go.kr",
    bahasa: "Korea",
    langEn: "Korean",
    kurikulumSlug: "korean",
    kursusSlug: "korea",
    testPrepId: "topik",
    babSilabus: "B2.7",
    metaTitle: "Kursus Persiapan TOPIK Online (TOPIK I & II) | Linguo.id",
    metaDescription:
      "Kursus persiapan TOPIK online untuk TOPIK I dan TOPIK II: 듣기, 읽기, 쓰기, kosakata, dan tata bahasa plus mock test. Semi-private atau private 1-on-1, placement test gratis.",
    keywords: [
      "kursus persiapan TOPIK",
      "les TOPIK online",
      "persiapan TOPIK I",
      "persiapan TOPIK II",
      "belajar TOPIK online",
      "kursus bahasa Korea TOPIK",
    ],
    ringkasan:
      "TOPIK (Test of Proficiency in Korean) adalah ujian resmi kemampuan bahasa Korea dari NIIED. Ada dua jenjang: TOPIK I untuk pemula (hasil Level 1–2) dan TOPIK II untuk menengah sampai mahir (hasil Level 3–6). Kamu tidak memilih level saat mendaftar — level ditentukan dari skor yang diraih. Di Linguo, persiapan TOPIK berjalan live via Zoom dalam grup kecil atau private 1-on-1, dengan latihan soal berformat resmi dan mock test.",
    bagian: [
      { nama: "TOPIK I — Mendengar (듣기)", isi: "Percakapan pendek sehari-hari, pengumuman sederhana." },
      { nama: "TOPIK I — Membaca (읽기)", isi: "Teks pendek, iklan, dan pesan; menebak topik dan isi utama." },
      { nama: "TOPIK II — Mendengar & Membaca", isi: "Dialog, berita, ceramah, dan artikel dengan topik umum sampai akademik." },
      { nama: "TOPIK II — Menulis (쓰기)", isi: "Melengkapi kalimat, menulis paragraf pendek, dan esai argumentatif." },
    ],
    catatanSkor:
      "Skor maksimum TOPIK I adalah 200 dan TOPIK II 300. Level yang tercantum di sertifikat ditentukan dari skor total, dan hasilnya berlaku dua tahun sejak pengumuman — cek lagi syarat lembaga tujuanmu.",
    catatanLevel: {
      A1: "Hangul, kosakata dasar, kalimat perkenalan dan kebutuhan sehari-hari.",
      A2: "Percakapan sehari-hari dan teks pendek; batas atas TOPIK I.",
      B1: "Awal TOPIK II: topik umum, mulai ada tugas menulis paragraf.",
      B2: "Topik sosial dan pekerjaan; level yang sering diminta untuk kuliah di Korea.",
    },
    levelTambahan: [
      { label: "TOPIK II Level 5–6", cefr: "C1", catatan: "Teks akademik dan profesional; dilatih di kelas private." },
    ],
    kegunaan: [
      "Syarat pendaftaran kuliah dan beasiswa di Korea Selatan.",
      "Melamar ke perusahaan Korea di Indonesia atau di Korea.",
      "Bukti kemampuan yang terukur di CV, misalnya untuk penerjemah atau staf hubungan dengan klien Korea.",
    ],
    fokus: [
      "Kosakata dan pola tata bahasa per jenjang, termasuk pola yang mirip tapi beda nuansa.",
      "듣기 dengan kecepatan asli dan latihan menebak isi dari pertanyaan sebelum audio diputar.",
      "쓰기 TOPIK II: struktur paragraf dan esai, dikoreksi pengajar satu per satu.",
      "Mock test berwaktu untuk menghitung perkiraan level dari skor.",
    ],
    faq: [
      {
        q: "Apa beda TOPIK dengan EPS-TOPIK?",
        a: "TOPIK adalah ujian kemampuan bahasa Korea umum dari NIIED, dipakai untuk kuliah, beasiswa, dan kerja profesional. EPS-TOPIK adalah ujian terpisah untuk program kerja Employment Permit System dengan format dan penyelenggara yang berbeda. Kelas persiapan Linguo mengikuti format TOPIK; kalau tujuanmu EPS-TOPIK, tanyakan dulu lewat WhatsApp sebelum mendaftar.",
      },
      {
        q: "Saya pemula, harus mulai dari TOPIK I?",
        a: "Ya. TOPIK I mencakup Level 1–2 dan hanya berisi mendengar dan membaca, jadi cocok sebagai target pertama. Kalau kamu belum bisa membaca Hangul, mulai dulu dari kelas bahasa Korea level A1, lalu lanjut ke persiapan TOPIK I.",
      },
      {
        q: "Apakah sertifikat Linguo sama dengan sertifikat TOPIK?",
        a: "Tidak. Linguo adalah tempat persiapan, bukan penyelenggara ujian. Sertifikat TOPIK resmi hanya didapat dari ujian TOPIK yang diselenggarakan NIIED. E-certificate Linguo adalah bukti kamu menyelesaikan kursus.",
      },
      {
        q: "Kapan jadwal ujian TOPIK di Indonesia?",
        a: "TOPIK diadakan beberapa kali dalam setahun, tetapi tidak semua putaran dibuka di Indonesia dan kotanya terbatas. Jadwal dan biaya ujian bisa berubah, jadi cek pengumuman terbaru di situs resmi TOPIK atau penyelenggara lokal, lalu mulai persiapan jauh sebelumnya.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "hsk",
    tes: "HSK",
    namaPanjang: "Hanyu Shuiping Kaoshi (汉语水平考试)",
    penyelenggara: "Chinese Testing International (CTI)",
    situsResmi: "chinesetest.cn",
    bahasa: "Mandarin",
    langEn: "Mandarin",
    kurikulumSlug: "mandarin",
    kursusSlug: "mandarin",
    testPrepId: "hsk",
    babSilabus: "B2.7",
    metaTitle: "Kursus Persiapan HSK Online HSK 1–6 | Linguo.id",
    metaDescription:
      "Kursus persiapan HSK online HSK 1 sampai HSK 6: hanzi, kosakata, tata bahasa, membaca, menyimak, dan menulis plus mock test. Semi-private atau private 1-on-1, placement test gratis.",
    keywords: [
      "kursus persiapan HSK",
      "les HSK online",
      "persiapan HSK 3",
      "persiapan HSK 4",
      "kursus mandarin HSK",
      "belajar HSK online",
    ],
    ringkasan:
      "HSK (Hanyu Shuiping Kaoshi) adalah ujian kemampuan bahasa Mandarin standar untuk penutur non-Tionghoa. Format yang masih paling banyak diujikan punya enam level, HSK 1 sampai HSK 6; HSK 1–2 berisi menyimak dan membaca, mulai HSK 3 ditambah menulis. Tes berbicaranya terpisah, namanya HSKK. Di Linguo, persiapan HSK berjalan live via Zoom dalam grup kecil atau private 1-on-1, dengan latihan soal berformat HSK dan mock test.",
    bagian: [
      { nama: "Menyimak (听力)", isi: "Dialog dan monolog pendek sampai panjang; mencocokkan gambar, memilih jawaban." },
      { nama: "Membaca (阅读)", isi: "Mengisi kata yang hilang, mengurutkan kalimat, dan memahami teks." },
      { nama: "Menulis (书写) — mulai HSK 3", isi: "Menyusun kalimat, menulis hanzi, sampai menulis ringkasan dan karangan pendek." },
    ],
    catatanSkor:
      "HSK 1–2 punya skor maksimum 200, HSK 3–6 skor maksimum 300. Penyelenggara sedang memperkenalkan format baru berjenjang sembilan (HSK 3.0) secara bertahap — level yang dibuka di pusat ujianmu perlu dicek langsung.",
    catatanLevel: {
      A1: "Pinyin, nada, dan ratusan kosakata dasar; padanan HSK 1–2.",
      A2: "Percakapan sehari-hari dan teks pendek; mulai ada tugas menulis.",
      B1: "Topik umum dengan kosakata lebih luas; level yang sering diminta untuk kuliah berbahasa Mandarin.",
      B2: "Membaca artikel dan menulis karangan pendek; dipakai untuk kerja dan studi lanjut.",
    },
    levelTambahan: [
      { label: "HSK 6", cefr: "C1", catatan: "Level tertinggi HSK 2.0; dilatih di kelas private." },
    ],
    kegunaan: [
      "Syarat beasiswa dan kuliah di Tiongkok.",
      "Melamar kerja di perusahaan yang berurusan dengan mitra Tiongkok, termasuk di Indonesia.",
      "Bukti kemampuan yang terukur di CV, terutama HSK 4 ke atas.",
    ],
    fokus: [
      "Hanzi dan kosakata per level dilatih bertahap, termasuk pembacaan tanpa bantuan pinyin di level atas.",
      "Menyimak dengan audio sekali putar dan latihan menebak isi dari pilihan jawaban.",
      "Menulis HSK: susun kalimat dan karangan pendek yang dikoreksi pengajar.",
      "Mock test berwaktu, karena waktu membaca di HSK 4 ke atas sangat ketat.",
    ],
    faq: [
      {
        q: "HSK level berapa yang dibutuhkan untuk kuliah di Tiongkok?",
        a: "Syaratnya berbeda per kampus, program, dan beasiswa. Program berbahasa Mandarin umumnya meminta HSK level menengah ke atas, sedangkan program berbahasa Inggris kadang tidak mensyaratkan HSK sama sekali. Selalu cek syarat resmi kampus atau beasiswa yang kamu tuju.",
      },
      {
        q: "Apakah HSK ada tes berbicara?",
        a: "Tes berbicara Mandarin terpisah dari HSK dan bernama HSKK. Kalau kamu butuh keduanya, latihan berbicara bisa dimasukkan ke kelas private.",
      },
      {
        q: "Apakah sertifikat Linguo sama dengan sertifikat HSK?",
        a: "Tidak. Linguo adalah tempat persiapan, bukan penyelenggara ujian. Sertifikat HSK resmi hanya didapat dari ujian HSK di pusat ujian resmi. E-certificate Linguo adalah bukti kamu menyelesaikan kursus.",
      },
      {
        q: "Kalau HSK berganti ke format sembilan level, apakah persiapannya sia-sia?",
        a: "Tidak. Kosakata, hanzi, dan kemampuan menyimak serta membaca tetap jadi inti kedua format. Yang berbeda adalah pembagian levelnya, jadi sebelum mendaftar ujian pastikan dulu format yang dibuka di pusat ujianmu, lalu pengajar menyesuaikan latihan soalnya.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "goethe",
    tes: "Goethe-Zertifikat",
    namaPanjang: "Goethe-Zertifikat A1–C2",
    penyelenggara: "Goethe-Institut",
    situsResmi: "goethe.de",
    bahasa: "Jerman",
    langEn: "German",
    kurikulumSlug: "german",
    kursusSlug: "jerman",
    testPrepId: "goethe",
    metaTitle: "Kursus Persiapan Goethe-Zertifikat Online A1–C1 | Linguo.id",
    metaDescription:
      "Kursus persiapan ujian Goethe-Zertifikat online A1 sampai C1: Lesen, Hören, Schreiben, Sprechen plus mock test. Untuk Ausbildung, kuliah, dan kerja di Jerman. Placement test gratis.",
    keywords: [
      "kursus persiapan Goethe",
      "les Goethe Zertifikat online",
      "persiapan Goethe A1",
      "persiapan Goethe B1",
      "kursus bahasa Jerman Ausbildung",
      "persiapan ujian bahasa Jerman",
    ],
    ringkasan:
      "Goethe-Zertifikat adalah sertifikat bahasa Jerman dari Goethe-Institut yang levelnya langsung mengikuti CEFR, dari A1 sampai C2. Setiap ujian menguji empat keterampilan: membaca (Lesen), mendengar (Hören), menulis (Schreiben), dan berbicara (Sprechen). Mulai B1, ujiannya modular sehingga modul yang belum lulus bisa diulang sendiri. Di Linguo, persiapan Goethe berjalan live via Zoom dalam grup kecil atau private 1-on-1, termasuk simulasi ujian lisan dengan pengajar.",
    bagian: [
      { nama: "Lesen (membaca)", isi: "Teks sehari-hari sampai artikel; mencari informasi dan memahami pendapat." },
      { nama: "Hören (mendengar)", isi: "Pengumuman, percakapan, dan wawancara dengan berbagai aksen." },
      { nama: "Schreiben (menulis)", isi: "Formulir dan pesan pendek di level awal, surel formal dan opini di level atas." },
      { nama: "Sprechen (berbicara)", isi: "Ujian lisan dengan penguji, sering berpasangan dengan peserta lain." },
    ],
    catatanSkor:
      "Setiap level punya ujian sendiri; kamu memilih level saat mendaftar, lalu lulus atau tidak lulus di level itu. Syarat level dan masa berlaku sertifikat ditentukan lembaga tujuan (kedutaan, kampus, atau pemberi kerja), jadi cek syarat mereka sebelum memilih level.",
    catatanLevel: {
      A1: "Start Deutsch 1: perkenalan dan kebutuhan dasar; sering diminta untuk visa reunifikasi keluarga.",
      A2: "Situasi sehari-hari: belanja, kerja, dan perjalanan.",
      B1: "Level yang paling sering diminta untuk Ausbildung dan kerja di Jerman.",
      B2: "Sering diminta untuk kuliah, profesi kesehatan, dan pekerjaan kantoran.",
    },
    levelTambahan: [
      { label: "Goethe-Zertifikat C1", cefr: "C1", catatan: "Untuk kuliah dan pekerjaan profesional tingkat lanjut." },
    ],
    kegunaan: [
      "Syarat Ausbildung (pendidikan vokasi) dan kerja di Jerman — level yang diminta biasanya B1 atau B2, tergantung bidang dan negara bagian.",
      "Syarat kuliah di Jerman untuk program berbahasa Jerman.",
      "Visa reunifikasi keluarga, yang umumnya meminta bukti bahasa Jerman dasar (A1).",
      "Profesi kesehatan seperti perawat, yang syarat bahasanya biasanya lebih tinggi.",
    ],
    fokus: [
      "Simulasi Sprechen dengan pengajar, karena ujian lisan paling sering jadi titik lemah.",
      "Schreiben dengan format surel dan opini sesuai level, dikoreksi pengajar.",
      "Hören dengan berbagai aksen dan latihan menangkap informasi rinci (angka, waktu, nama).",
      "Mock test per modul supaya kamu tahu modul mana yang perlu diulang.",
    ],
    faq: [
      {
        q: "Goethe B1 cukup untuk Ausbildung?",
        a: "Banyak program Ausbildung meminta B1, tetapi sebagian bidang dan pemberi kerja meminta B2. Cek syarat resmi program atau agensi yang kamu tuju, lalu pilih level persiapan yang sesuai.",
      },
      {
        q: "Apa maksud ujian Goethe modular?",
        a: "Mulai level B1, Lesen, Hören, Schreiben, dan Sprechen adalah modul terpisah. Kalau satu modul belum lulus, kamu cukup mengulang modul itu saja. Di kelas persiapan, mock test per modul dipakai untuk menentukan modul mana yang perlu porsi lebih.",
      },
      {
        q: "Apakah sertifikat Linguo sama dengan Goethe-Zertifikat?",
        a: "Tidak. Linguo adalah tempat persiapan, bukan penyelenggara ujian. Goethe-Zertifikat resmi hanya didapat dari ujian di Goethe-Institut atau mitra ujiannya. E-certificate Linguo adalah bukti kamu menyelesaikan kursus.",
      },
      {
        q: "Berapa lama dari nol sampai B1?",
        a: "Tergantung intensitas belajar dan waktu belajar mandiri. Cara paling jujur untuk memperkirakannya adalah placement test gratis bahasa Jerman di Linguo, lalu pengajar menyusun rencana dari level awalmu sampai tanggal ujian.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // DELF tidak punya produk di lib/testPrep.ts (checkout /persiapan-tes), jadi
  // halamannya mengarah ke Kelas Private bahasa Prancis biasa dengan fokus
  // DELF. Harga = pricelist Private (trial-pricing), BUKAN premi test prep.
  {
    slug: "delf",
    tes: "DELF",
    namaPanjang: "Diplôme d'études en langue française (DELF) dan DALF",
    penyelenggara: "France Éducation international, atas nama Kementerian Pendidikan Prancis",
    situsResmi: "france-education-international.fr",
    bahasa: "Prancis",
    langEn: "French",
    kurikulumSlug: "french",
    kursusSlug: "prancis",
    metaTitle: "Kursus Persiapan DELF Online A1–B2 (Private 1-on-1) | Linguo.id",
    metaDescription:
      "Kursus persiapan DELF online A1 sampai B2 lewat kelas private bahasa Prancis 1-on-1: compréhension orale & écrite, production écrite & orale. Placement test gratis.",
    keywords: [
      "kursus persiapan DELF",
      "les DELF online",
      "persiapan DELF B1",
      "persiapan DELF B2",
      "kursus bahasa Prancis DELF",
      "persiapan DELF DALF",
    ],
    ringkasan:
      "DELF (Diplôme d'études en langue française) adalah diploma resmi bahasa Prancis untuk level A1 sampai B2; untuk C1 dan C2 namanya DALF. Setiap level menguji empat keterampilan dengan bobot yang sama: memahami lisan, memahami tulisan, menulis, dan berbicara. Di Linguo, persiapan DELF berjalan lewat kelas Private bahasa Prancis 1-on-1 via Zoom, dengan latihan soal berformat DELF dan simulasi ujian lisan.",
    bagian: [
      { nama: "Compréhension de l'oral", isi: "Memahami rekaman audio: pengumuman, percakapan, dan siaran." },
      { nama: "Compréhension des écrits", isi: "Memahami teks: pesan, iklan, artikel, sampai teks argumentatif di B2." },
      { nama: "Production écrite", isi: "Menulis pesan, surat, atau esai opini sesuai level." },
      { nama: "Production orale", isi: "Ujian lisan dengan penguji: perkenalan, simulasi, dan menyampaikan pendapat." },
    ],
    catatanSkor:
      "Tiap bagian bernilai 25 poin dengan total 100. Untuk lulus, total minimal 50 dan tidak boleh ada bagian di bawah 5. Diploma DELF dan DALF tidak punya masa kedaluwarsa, tetapi lembaga tujuan kadang meminta sertifikat yang masih baru — cek syarat mereka.",
    catatanLevel: {
      A1: "Perkenalan dan kebutuhan dasar.",
      A2: "Situasi sehari-hari: belanja, perjalanan, pekerjaan sederhana.",
      B1: "Bercerita dan menyampaikan pendapat sederhana; dipakai untuk sebagian program kerja dan imigrasi.",
      B2: "Berargumen dan memahami teks panjang; level yang banyak diminta untuk kuliah berbahasa Prancis.",
    },
    kegunaan: [
      "Syarat kuliah di program berbahasa Prancis — banyak kampus meminta B2.",
      "Persyaratan kerja dan imigrasi ke negara berbahasa Prancis, yang levelnya berbeda per program.",
      "Bukti kemampuan seumur hidup di CV, karena diplomanya tidak kedaluwarsa.",
    ],
    fokus: [
      "Production orale: simulasi ujian lisan lengkap dengan waktu persiapan seperti ujian asli.",
      "Production écrite: struktur surat dan esai opini, dikoreksi pengajar.",
      "Latihan per bagian dengan batas minimum 5 poin, supaya tidak ada bagian yang menggagalkan nilai total.",
      "Kosakata tematik per level sesuai topik yang sering muncul.",
    ],
    faq: [
      {
        q: "Apa beda DELF dan DALF?",
        a: "Keduanya diploma resmi bahasa Prancis dari penyelenggara yang sama. DELF untuk level A1 sampai B2, DALF untuk C1 dan C2. Kelas di Linguo mengikuti kurikulum bahasa Prancis A1 sampai B2, jadi fokusnya persiapan DELF.",
      },
      {
        q: "Apakah ada kelas grup persiapan DELF?",
        a: "Saat ini persiapan DELF di Linguo berjalan lewat kelas Private 1-on-1 atau Semi Private kalau kamu punya teman belajar sendiri. Materi dan porsi latihan disesuaikan dengan level target dan tanggal ujianmu.",
      },
      {
        q: "Apakah sertifikat Linguo sama dengan diploma DELF?",
        a: "Tidak. Linguo adalah tempat persiapan, bukan penyelenggara ujian. Diploma DELF resmi hanya didapat dari ujian di pusat ujian resmi, di Indonesia melalui jaringan Institut Français Indonesia (IFI). E-certificate Linguo adalah bukti kamu menyelesaikan kursus.",
      },
      {
        q: "Kapan jadwal ujian DELF?",
        a: "Jadwal dan biaya ujian ditentukan pusat ujian dan bisa berubah. Cek pengumuman terbaru di pusat ujian terdekat, lalu mulai persiapan jauh sebelum tanggal ujian.",
      },
    ],
  },
];

export function getTesBahasa(slug: string): TesBahasa | null {
  return TES_BAHASA.find((t) => t.slug === slug) ?? null;
}

/** Halaman ini diubah isinya terakhir kali — dipakai sitemap (lastmod jujur). */
export const TES_BAHASA_UPDATED = new Date("2026-10-16");
