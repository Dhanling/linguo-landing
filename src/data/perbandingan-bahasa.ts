// =============================================================================
// src/data/perbandingan-bahasa.ts
// [aeo-perbandingan-bahasa-v1]
//
// Data untuk /perbandingan/bahasa-<slug> — halaman "kursus bahasa X online
// terbaik" per bahasa. Kueri berpola "kursus bahasa jepang online terbaik"
// selama ini dijawab mesin jawaban dari listicle pihak ketiga (my-best, Popbela,
// dsb) yang tidak memuat Linguo.id sama sekali. Halaman per bahasa yang jujur,
// bertanggal, dan bisa dikutip per paragraf adalah cara Linguo masuk ke jawaban
// itu tanpa menunggu media menulisnya.
//
// PRINSIP (sama dengan /perbandingan — baca kepala src/app/perbandingan/page.tsx):
// 1. TIDAK ADA angka harga pihak lain. Yang ditulis struktur harganya saja.
// 2. Klaim tentang lembaga lain dibatasi hal publik & stabil: siapa mereka
//    (lembaga resmi pemerintah X, marketplace, aplikasi), format, dan ujian
//    yang terkait. Bukan kualitas, bukan jumlah siswa, bukan rating.
// 3. Kalau ragu sebuah lembaga masih membuka kelas di Indonesia, JANGAN
//    dimasukkan. Satu fakta keliru membuat seluruh halaman tidak dikutip.
// 4. Angka tentang Linguo WAJIB dari pricelist (trial-pricing.ts) / BRAND_FACTS.
// =============================================================================

/** Naikkan HANYA saat isi data di berkas ini benar-benar diubah. */
export const PERBANDINGAN_BAHASA_UPDATED = new Date("2026-09-30");

export type Alternatif = {
  nama: string;
  /** Jenis penyedia dalam satu frasa. */
  tipe: string;
  format: string;
  /** STRUKTUR harga, bukan angka. */
  harga: string;
  /** Paling cocok untuk siapa. Wajib jujur — ini yang membuat halaman dikutip. */
  cocok: string;
  /** Kekurangan nyata, bukan pujian terselubung. */
  kurang: string;
};

export type PerbandinganBahasa = {
  /** Ujian resmi yang diakui untuk bahasa ini, kalau ada. */
  ujian?: string;
  /** Lembaga/penyedia spesifik bahasa ini (di luar marketplace & aplikasi). */
  alternatif: Alternatif[];
  /** Kondisi tambahan kapan Linguo bukan pilihan terbaik, khusus bahasa ini. */
  bukanTambahan?: Array<{ kondisi: string; alasan: string; kemana: string }>;
};

const CEK = "cek situs resmi";

export const MARKETPLACE: Alternatif = {
  nama: "italki / Preply",
  tipe: "Marketplace tutor global",
  format: "Live 1-on-1, tutor dipilih sendiri per sesi",
  harga: `Ditentukan masing-masing tutor — ${CEK}`,
  cocok: "Ingin bebas memilih dan mengganti tutor, termasuk penutur asli, di jam berapa pun",
  kurang: "Tidak ada kurikulum terpusat; mutu sangat bergantung pada tutor yang dipilih, dan bahasa pengantarnya sering bahasa Inggris",
};

export const DUOLINGO: Alternatif = {
  nama: "Duolingo",
  tipe: "Aplikasi belajar mandiri",
  format: "Latihan singkat di aplikasi, tanpa pengajar",
  harga: "Gratis, dengan opsi langganan berbayar",
  cocok: "Membangun kebiasaan harian dan kosakata dasar tanpa biaya",
  kurang: "Tidak ada lawan bicara manusia, jadi kemampuan berbicara dan mendengar percakapan nyata hampir tidak terlatih",
};

export const OTODIDAK: Alternatif = {
  nama: "Belajar mandiri (buku, YouTube, podcast)",
  tipe: "Sumber gratis tanpa pengajar",
  format: "Mandiri, kapan saja",
  harga: "Gratis atau biaya buku saja",
  cocok: "Mengenal bahasanya dulu sebelum memutuskan ikut kursus",
  kurang: "Materi untuk penutur Indonesia sering sangat sedikit, tidak ada yang mengoreksi pengucapan dan tata bahasa",
};

/** Alternatif untuk bahasa daerah Nusantara. */
export const TUTOR_LOKAL: Alternatif = {
  nama: "Tutor lokal atau sanggar budaya",
  tipe: "Les tatap muka di daerah asal bahasa",
  format: "Tatap muka, jadwal menyesuaikan tutor",
  harga: "Kesepakatan langsung dengan tutor",
  cocok: "Tinggal di daerah penutur bahasa itu dan ingin sekaligus belajar budayanya langsung",
  kurang: "Sulit dicari di luar daerah asal; umumnya tanpa kurikulum berjenjang",
};

/**
 * Bahasa yang kursusnya tersedia di Duolingo (dari bahasa Inggris atau
 * Indonesia). Bahasa di luar daftar ini TIDAK diberi baris Duolingo.
 */
export const DUOLINGO_LANGS = new Set([
  "inggris", "jepang", "korea", "mandarin", "jerman", "prancis", "spanyol",
  "italia", "belanda", "arab", "rusia", "turki", "yunani", "portugis",
  "vietnam", "hindi", "swedia", "norwegia", "denmark", "finlandia", "polandia",
  "ceko", "hungaria", "rumania", "ukraina", "ibrani", "swahili",
]);

/** Bahasa daerah Nusantara — alternatifnya berbeda dari bahasa asing. */
export const BAHASA_DAERAH = new Set(["jawa", "sunda", "betawi", "bali", "batak", "bugis", "madura"]);

/** Halaman tidak dibuat untuk slug ini (BIPA: audiensnya penutur asing). */
export const TANPA_PERBANDINGAN = new Set(["indonesia"]);

export const PERBANDINGAN_BAHASA: Record<string, PerbandinganBahasa> = {
  inggris: {
    ujian: "IELTS, TOEFL (iBT/ITP), atau TOEIC",
    alternatif: [
      {
        nama: "EF (English First)",
        tipe: "Jaringan sekolah bahasa internasional",
        format: "Kelas di cabang fisik + online",
        harga: `Paket per level, umumnya jangka panjang — ${CEK}`,
        cocok: "Butuh sertifikat bermerek internasional dan kelas tatap muka di kota besar",
        kurang: "Komitmen paket panjang; hanya bahasa Inggris",
      },
      {
        nama: "Wall Street English",
        tipe: "Jaringan sekolah bahasa internasional",
        format: "Blended — center fisik + materi digital",
        harga: `Paket per level, umumnya jangka panjang — ${CEK}`,
        cocok: "Suka metode blended terstruktur dengan center yang bisa didatangi",
        kurang: "Komitmen paket panjang; harus dekat center",
      },
      {
        nama: "Cakap",
        tipe: "Platform kursus online Indonesia",
        format: "Live online — privat & grup",
        harga: `Paket berbasis jumlah sesi — ${CEK}`,
        cocok: "Ingin platform lokal dengan aplikasi mobile dan program upskilling kerja",
        kurang: "Pilihan bahasa di luar bahasa-bahasa utama terbatas",
      },
      {
        nama: "Kampung Inggris Pare",
        tipe: "Kursus intensif tatap muka (Pare, Kediri)",
        format: "Kelas harian + asrama berbahasa Inggris, per periode",
        harga: `Per periode, berbeda tiap lembaga — ${CEK}`,
        cocok: "Bisa meninggalkan kerja/kuliah beberapa minggu untuk imersi penuh",
        kurang: "Harus datang dan tinggal di Pare; tidak bisa sambil bekerja",
      },
    ],
    bukanTambahan: [
      {
        kondisi: "Kamu butuh skor IELTS/TOEFL dalam waktu dekat",
        alasan: "Kelas percakapan umum tidak dirancang untuk mengejar skor. Yang kamu butuhkan adalah kelas persiapan tes dengan latihan soal dan simulasi berwaktu.",
        kemana: "Kelas persiapan IELTS/TOEFL — di Linguo.id tersedia program terpisahnya di /persiapan-tes",
      },
    ],
  },
  jepang: {
    ujian: "JLPT (N5 sampai N1)",
    alternatif: [
      {
        nama: "The Japan Foundation (Marugoto)",
        tipe: "Lembaga kebudayaan resmi pemerintah Jepang",
        format: "Kursus online Marugoto untuk belajar mandiri; kelas di Jakarta",
        harga: `Kursus online mandirinya gratis; kelas — ${CEK}`,
        cocok: "Ingin materi standar resmi Jepang dan bisa belajar mandiri",
        kurang: "Versi online gratisnya tanpa pengajar; kelas tatap mukanya hanya di Jakarta",
      },
      {
        nama: "LPK program kerja ke Jepang",
        tipe: "Lembaga pelatihan kerja",
        format: "Kelas intensif tatap muka, sering berasrama",
        harga: `Paket program penempatan — ${CEK}`,
        cocok: "Target utamanya kerja atau magang di Jepang (mis. Tokutei Ginou)",
        kurang: "Terikat program penempatan kerja; kurang cocok untuk kuliah, hobi, atau anime",
      },
    ],
  },
  korea: {
    ujian: "TOPIK (I dan II); untuk kerja lewat jalur G to G: EPS-TOPIK",
    alternatif: [
      {
        nama: "King Sejong Institute",
        tipe: "Lembaga resmi pemerintah Korea",
        format: "Kelas per semester, tatap muka di beberapa kota Indonesia",
        harga: `Biaya per semester — ${CEK} cabang terdekat`,
        cocok: "Ingin kurikulum resmi Korea (Sejong Korean) dan dekat cabangnya",
        kurang: "Pendaftaran per angkatan dengan kuota; jadwal mengikuti semester",
      },
      {
        nama: "Lembaga persiapan EPS-TOPIK",
        tipe: "Kursus persiapan kerja ke Korea",
        format: "Kelas intensif tatap muka",
        harga: `Paket per program — ${CEK}`,
        cocok: "Target kerja ke Korea lewat skema EPS",
        kurang: "Materinya fokus soal ujian kerja, bukan percakapan atau TOPIK akademik",
      },
    ],
  },
  mandarin: {
    ujian: "HSK (level 1 sampai 6/9) dan HSKK untuk berbicara",
    alternatif: [
      {
        nama: "Confucius Institute",
        tipe: "Pusat bahasa Mandarin di sejumlah universitas Indonesia",
        format: "Kelas tatap muka per semester/angkatan",
        harga: `Per angkatan — ${CEK} universitas penyelenggara`,
        cocok: "Tinggal di kota kampus penyelenggara dan menyiapkan HSK atau beasiswa",
        kurang: "Hanya di kota tertentu; jadwal mengikuti angkatan",
      },
    ],
  },
  jerman: {
    ujian: "Goethe-Zertifikat (A1–C2), TestDaF, atau telc",
    alternatif: [
      {
        nama: "Goethe-Institut Indonesia",
        tipe: "Lembaga kebudayaan resmi Jerman",
        format: "Kelas per modul level, tatap muka (Jakarta, Bandung) & online",
        harga: `Per modul level — ${CEK}`,
        cocok: "Butuh Goethe-Zertifikat untuk visa, Ausbildung, atau kuliah, langsung dari penyelenggara ujiannya",
        kurang: "Jadwal per angkatan dan intensif; kelas tatap muka hanya di kota tertentu",
      },
      {
        nama: "Lembaga persiapan Ausbildung",
        tipe: "Kursus + agen penempatan",
        format: "Kelas intensif, sering tatap muka",
        harga: `Paket program — ${CEK}`,
        cocok: "Target Ausbildung dan ingin sekalian diurus dokumennya",
        kurang: "Terikat program; materi dikejar ke level ujian, bukan percakapan santai",
      },
    ],
  },
  prancis: {
    ujian: "DELF (A1–B2) dan DALF (C1–C2)",
    alternatif: [
      {
        nama: "IFI (Institut Français Indonesia)",
        tipe: "Lembaga kebudayaan resmi Prancis",
        format: "Kelas tatap muka (Jakarta, Bandung, Surabaya, Yogyakarta) & online",
        harga: `Per sesi/trimester — ${CEK}`,
        cocok: "Butuh DELF/DALF atau ingin kurikulum standar Prancis",
        kurang: "Jadwal per angkatan; kelas tatap mukanya hanya di kota IFI",
      },
    ],
  },
  spanyol: {
    ujian: "DELE atau SIELE",
    alternatif: [
      {
        nama: "Instituto Cervantes (AVE Global)",
        tipe: "Lembaga resmi pemerintah Spanyol",
        format: "Kursus online AVE Global, sebagian besar mandiri",
        harga: `Per level — ${CEK}`,
        cocok: "Ingin materi resmi Cervantes yang selaras dengan DELE",
        kurang: "Tidak ada pusat kursus tatap muka Instituto Cervantes di Indonesia",
      },
    ],
  },
  italia: {
    ujian: "CILS, CELI, atau PLIDA",
    alternatif: [
      {
        nama: "Istituto Italiano di Cultura Jakarta",
        tipe: "Lembaga kebudayaan resmi Italia",
        format: "Kelas bahasa Italia per angkatan di Jakarta",
        harga: `Per angkatan — ${CEK}`,
        cocok: "Tinggal di Jakarta dan ingin kelas bersama komunitas budaya Italia",
        kurang: "Hanya di Jakarta; jadwal mengikuti angkatan",
      },
    ],
  },
  belanda: {
    ujian: "CNaVT; untuk integrasi di Belanda: ujian inburgering",
    alternatif: [
      {
        nama: "Erasmus Taalcentrum",
        tipe: "Pusat bahasa Belanda di Jakarta",
        format: "Kelas tatap muka per angkatan",
        harga: `Per angkatan — ${CEK}`,
        cocok: "Tinggal di Jakarta dan menyiapkan kuliah atau riset arsip di Belanda",
        kurang: "Hanya di Jakarta; jadwal mengikuti angkatan",
      },
    ],
  },
  arab: {
    alternatif: [
      {
        nama: "LIPIA, ma'had, atau pesantren",
        tipe: "Lembaga bahasa Arab tatap muka",
        format: "Kelas tatap muka intensif, sebagian berasrama",
        harga: "Bervariasi; sebagian gratis dengan seleksi masuk",
        cocok: "Siap belajar penuh waktu untuk studi Islam dan Fusha yang mendalam",
        kurang: "Butuh waktu penuh dan lolos seleksi; tidak bisa sambil bekerja",
      },
    ],
  },
  turki: {
    ujian: "Ujian kemahiran bahasa Turki (TYS) dari Yunus Emre Enstitüsü",
    alternatif: [
      {
        nama: "Yunus Emre Enstitüsü Jakarta",
        tipe: "Lembaga kebudayaan resmi Turki",
        format: "Kelas per angkatan di Jakarta & online",
        harga: `Per angkatan — ${CEK}`,
        cocok: "Ingin kurikulum resmi Turki dan menyiapkan beasiswa Türkiye Bursları",
        kurang: "Kuota per angkatan; jadwal tidak bisa diatur sendiri",
      },
    ],
  },
  rusia: { ujian: "TORFL (TRKI)", alternatif: [] },
  portugis: { ujian: "CAPLE (Portugal) atau Celpe-Bras (Brasil)", alternatif: [] },
};
