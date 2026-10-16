// =============================================================================
// src/data/kursusOfflineKota.ts
// [seo-tes-kota-v1]
//
// Data halaman SEO "Kursus Bahasa Offline di <kota>" — pengajar datang ke
// lokasi siswa. Dirender oleh src/app/kursus-bahasa-offline/[kota]/page.tsx
// dan hub-nya /kursus-bahasa-offline. Pola dicontek dari Ruangguru
// /center/<kota>, TAPI tanpa alamat cabang: Linguo tidak punya cabang di kota
// mana pun selain kantor Bandung, jadi halaman ini TIDAK BOLEH mengaku punya
// tempat belajar lokal.
//
// FAKTA BISNIS (sumber: lib/trial-pricing.ts [offline-private-class-v1] +
// aturan Minling di api/chat/route.ts):
// - Offline untuk Kelas Private, Semi Private & Kelas Kids (OFFLINE_PROGRAMS).
//   Reguler tetap online via Zoom dengan jadwal tetap.
// - Tarif offline = tarif online + OFFLINE_SURCHARGE_PER_SESSION per sesi,
//   sama di semua daerah.
// - Offline belum termasuk paket Recording sesi & E-book.
// - Ketersediaan pengajar TIDAK dijamin — dicek admin per area. Kalau belum
//   ada, siswa bisa pindah ke online (selisih dikembalikan) atau refund penuh
//   (teks FunnelFlow.tsx).
//
// DAFTAR AREA: disalin dari AREA_ALIASES di repo dashboard admin
// (linguo-admin-dashboard/src/lib/areaAliases.ts) — itu peta kecamatan →
// kota yang dipakai admin untuk mencari pengajar terdekat. Kota yang di sana
// cuma muncul di KOTA_LAIN (Medan, Makassar, Malang, …) SENGAJA belum dibuat
// halamannya: tidak ada data area, jadi halamannya pasti tipis.
//
// JANGAN menulis harga di sini. Halaman menghitungnya dari trial-pricing.
// =============================================================================

import type { FaqItem } from "@/lib/schema";

export type GrupArea = {
  /** "Jakarta Selatan", "Kabupaten Bekasi", … */
  wilayah: string;
  area: string[];
};

export type BahasaKota = {
  /** Nama Inggris untuk pricelist (trial-pricing PRICE_CATEGORIES). */
  langEn: string;
  /** Nama tampil bahasa Indonesia ("Inggris"). */
  nama: string;
  /** urlSlug /kursus/bahasa-<x> dan /daftar/<x>. */
  slug: string;
  /** Kenapa bahasa ini relevan di kota ini — satu kalimat. */
  alasan: string;
};

export type KotaOffline = {
  /** Segmen URL: /kursus-bahasa-offline/<slug>. */
  slug: string;
  /** Nama kota untuk judul ("Bandung"). */
  nama: string;
  provinsi: string;
  /** Nilai `?kota=` yang diteruskan ke funnel /daftar (leads.class_city). */
  kotaFunnel: string;
  metaDescription: string;
  /** Paragraf pembuka khas kota — wajib beda antar kota. */
  intro: string;
  grupArea: GrupArea[];
  /** Situasi belajar yang khas di kota ini. */
  kebutuhan: string[];
  bahasa: BahasaKota[];
  /** Slug kota lain yang bertetangga — ditaut di bagian bawah halaman. */
  tetangga: string[];
  /** FAQ khas kota; FAQ umum ditambahkan halaman. */
  faq: FaqItem[];
};

// Bahasa yang sering dipakai — dirangkai ulang per kota dengan alasan sendiri.
const B = {
  inggris: { langEn: "English", nama: "Inggris", slug: "inggris" },
  jepang: { langEn: "Japanese", nama: "Jepang", slug: "jepang" },
  korea: { langEn: "Korean", nama: "Korea", slug: "korea" },
  mandarin: { langEn: "Mandarin", nama: "Mandarin", slug: "mandarin" },
  arab: { langEn: "Arabic", nama: "Arab", slug: "arab" },
  jerman: { langEn: "German", nama: "Jerman", slug: "jerman" },
  prancis: { langEn: "French", nama: "Prancis", slug: "prancis" },
  belanda: { langEn: "Dutch", nama: "Belanda", slug: "belanda" },
  rusia: { langEn: "Russian", nama: "Rusia", slug: "rusia" },
  bipa: { langEn: "BIPA", nama: "Indonesia untuk penutur asing (BIPA)", slug: "indonesia" },
  sunda: { langEn: "Sundanese", nama: "Sunda", slug: "sunda" },
  jawa: { langEn: "Javanese", nama: "Jawa", slug: "jawa" },
  betawi: { langEn: "Betawi", nama: "Betawi", slug: "betawi" },
  bali: { langEn: "Balinese", nama: "Bali", slug: "bali" },
} as const;

const bhs = (b: (typeof B)[keyof typeof B], alasan: string): BahasaKota => ({ ...b, alasan });

export const KOTA_OFFLINE: KotaOffline[] = [
  // ---------------------------------------------------------------------------
  {
    slug: "jakarta",
    nama: "Jakarta",
    provinsi: "DKI Jakarta",
    kotaFunnel: "Jakarta",
    metaDescription:
      "Kursus bahasa offline di Jakarta: pengajar privat datang ke rumah atau kantor di Jakarta Selatan, Pusat, Barat, Utara, dan Timur. Inggris, Jepang, Korea, Mandarin, dan 60+ bahasa lain.",
    intro:
      "Di Jakarta, waktu tempuh sering lebih mahal daripada biaya kursusnya. Karena itu kelas offline Linguo dibalik: bukan kamu yang datang ke tempat kursus, tetapi pengajar yang datang ke rumah, apartemen, atau kantormu — dari Kebayoran dan SCBD sampai Kelapa Gading dan Cibubur. Jadwal disepakati bersama, jadi kelas bisa digelar sebelum jam kantor, saat makan siang, atau akhir pekan.",
    grupArea: [
      { wilayah: "Jakarta Selatan", area: ["Kebayoran", "Blok M", "Senayan", "SCBD", "Senopati", "Pondok Indah", "Cilandak", "Fatmawati", "Lebak Bulus", "Kemang", "Tebet", "Kuningan", "Setiabudi", "Pasar Minggu", "Jagakarsa", "Pejaten", "Cipete", "Pesanggrahan"] },
      { wilayah: "Jakarta Pusat", area: ["Menteng", "Tanah Abang", "Thamrin", "Sudirman", "Gambir", "Senen", "Salemba", "Cempaka Putih", "Kemayoran", "Bendungan Hilir"] },
      { wilayah: "Jakarta Barat", area: ["Kebon Jeruk", "Grogol", "Tomang", "Palmerah", "Slipi", "Kembangan", "Puri Indah", "Tanjung Duren", "Cengkareng", "Kalideres", "Meruya"] },
      { wilayah: "Jakarta Utara", area: ["Kelapa Gading", "Sunter", "Pluit", "Penjaringan", "Ancol", "Tanjung Priok", "Pademangan", "Pantai Indah Kapuk"] },
      { wilayah: "Jakarta Timur", area: ["Rawamangun", "Pulogadung", "Cakung", "Cawang", "Jatinegara", "Duren Sawit", "Kramat Jati", "Ciracas", "Cibubur", "Condet", "Matraman", "Kalimalang"] },
    ],
    kebutuhan: [
      "Karyawan dan eksekutif yang butuh kelas di kantor, termasuk kelas Semi Private untuk beberapa rekan satu tim.",
      "Anak sekolah yang belajar di rumah setelah jam sekolah, tanpa harus diantar ke tempat kursus.",
      "Persiapan pindah atau kuliah ke luar negeri, termasuk persiapan ujian bahasa.",
      "Ekspatriat yang ingin belajar bahasa Indonesia di apartemen atau kantornya.",
    ],
    bahasa: [
      bhs(B.inggris, "Paling banyak dicari untuk kerja kantoran dan rapat dengan klien asing."),
      bhs(B.mandarin, "Banyak dipakai di perdagangan dan bisnis keluarga."),
      bhs(B.jepang, "Untuk karyawan perusahaan Jepang dan persiapan JLPT."),
      bhs(B.korea, "Untuk kerja di perusahaan Korea maupun minat budaya."),
      bhs(B.arab, "Untuk ibadah, studi, dan kerja di Timur Tengah."),
      bhs(B.bipa, "Untuk ekspatriat dan keluarganya yang tinggal di Jakarta."),
      bhs(B.betawi, "Untuk yang ingin mengenal bahasa asli kota Jakarta."),
    ],
    tetangga: ["tangerang-selatan", "tangerang", "depok", "bekasi", "bogor"],
    faq: [
      {
        q: "Apakah pengajar bisa datang ke kantor saya di Jakarta?",
        a: "Bisa, selama ada pengajar yang bisa menjangkau lokasi kantormu dan jadwalnya cocok. Untuk kelas beberapa karyawan sekaligus atas nama perusahaan, program korporat Linguo biasanya lebih pas karena materi dan laporannya disusun untuk lembaga.",
      },
      {
        q: "Wilayah Jakarta mana saja yang bisa dilayani?",
        a: "Permintaan dari kelima wilayah kota Jakarta diterima. Kepastiannya bergantung pada pengajar yang tersedia di sekitar lokasimu, jadi sebutkan kecamatan dan patokan saat bertanya lewat WhatsApp.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "bandung",
    nama: "Bandung",
    provinsi: "Jawa Barat",
    kotaFunnel: "Bandung",
    metaDescription:
      "Kursus bahasa offline di Bandung: pengajar privat datang ke rumah di Dago, Buah Batu, Antapani, Pasteur, sampai Lembang. Inggris, Jepang, Korea, Jerman, Sunda, dan 60+ bahasa lain.",
    intro:
      "Bandung adalah kota asal Linguo — kantor kami ada di Dago, Coblong. Meski begitu, kelas offline tidak digelar di kantor: pengajar yang datang ke rumah, kos, atau tempat kerjamu di Bandung Raya. Ini cocok untuk kota pelajar dengan kampus besar dan jalanan yang padat di jam sibuk — kamu tidak perlu menembus macet Pasteur atau Dago untuk belajar.",
    grupArea: [
      { wilayah: "Bandung Utara", area: ["Dago", "Cihampelas", "Pasteur", "Lembang"] },
      { wilayah: "Bandung Timur", area: ["Antapani", "Ujungberung", "Gedebage", "Kiaracondong"] },
      { wilayah: "Bandung Selatan", area: ["Buah Batu"] },
      { wilayah: "Sekitar Bandung", area: ["Cimahi"] },
    ],
    kebutuhan: [
      "Mahasiswa yang menyiapkan kuliah atau beasiswa ke luar negeri, termasuk ujian bahasa Jerman dan Jepang.",
      "Pelajar SMP/SMA yang ingin les privat bahasa di rumah.",
      "Pekerja kreatif dan pelaku usaha yang melayani tamu atau klien asing.",
      "Pendatang yang ingin belajar bahasa Sunda untuk pergaulan sehari-hari.",
    ],
    bahasa: [
      bhs(B.inggris, "Untuk kuliah, kerja, dan persiapan IELTS/TOEFL."),
      bhs(B.jerman, "Banyak dicari untuk kuliah dan Ausbildung di Jerman."),
      bhs(B.jepang, "Untuk program kerja dan kuliah di Jepang."),
      bhs(B.korea, "Untuk minat budaya maupun kerja di perusahaan Korea."),
      bhs(B.prancis, "Untuk kuliah dan beasiswa ke negara berbahasa Prancis."),
      bhs(B.sunda, "Bahasa sehari-hari Bandung — dari Loma sampai Lemes."),
    ],
    tetangga: ["jakarta", "bogor"],
    faq: [
      {
        q: "Apakah bisa belajar langsung di kantor Linguo Bandung?",
        a: "Kantor Linguo di Dago dipakai untuk operasional, bukan ruang kelas. Kelas offline berjalan di lokasi siswa: pengajar datang ke rumah, kos, atau kantormu.",
      },
      {
        q: "Apakah Lembang dan Cimahi termasuk?",
        a: "Permintaan dari Lembang dan Cimahi diterima, tetapi karena lebih jauh dari pusat kota, ketersediaan pengajarnya perlu dicek dulu. Sebutkan lokasi lengkapmu saat bertanya lewat WhatsApp.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "surabaya",
    nama: "Surabaya",
    provinsi: "Jawa Timur",
    kotaFunnel: "Surabaya",
    metaDescription:
      "Kursus bahasa offline di Surabaya: pengajar privat datang ke rumah atau kantor di Gubeng, Darmo, Rungkut, Sukolilo, Manyar, sampai Waru. Inggris, Mandarin, Jepang, Korea, dan 60+ bahasa lain.",
    intro:
      "Surabaya adalah kota dagang dan pelabuhan, jadi kebutuhan bahasanya praktis: bahasa Inggris dan Mandarin untuk bisnis, bahasa Jepang dan Korea untuk kerja, ditambah kebutuhan pelajar di sekitar kampus-kampus besar di Sukolilo dan Gubeng. Dengan kelas offline Linguo, pengajar datang ke rumah atau kantormu, sehingga kamu tidak perlu menyesuaikan diri dengan jadwal tempat kursus.",
    grupArea: [
      { wilayah: "Surabaya Timur", area: ["Gubeng", "Rungkut", "Sukolilo", "Manyar", "Kenjeran"] },
      { wilayah: "Surabaya Pusat & Selatan", area: ["Tunjungan", "Darmo", "Wonokromo"] },
      { wilayah: "Sekitar Surabaya", area: ["Waru (Sidoarjo)"] },
    ],
    kebutuhan: [
      "Pelaku usaha dan karyawan yang berhubungan dengan mitra dagang luar negeri.",
      "Mahasiswa yang menyiapkan studi lanjut atau beasiswa.",
      "Anak sekolah yang les privat di rumah sepulang sekolah.",
      "Calon pekerja ke Jepang atau Korea yang butuh latihan intensif.",
    ],
    bahasa: [
      bhs(B.inggris, "Untuk bisnis, kerja, dan persiapan ujian internasional."),
      bhs(B.mandarin, "Banyak dipakai di perdagangan dan bisnis keluarga."),
      bhs(B.jepang, "Untuk program kerja ke Jepang dan persiapan JLPT."),
      bhs(B.korea, "Untuk kerja maupun minat budaya Korea."),
      bhs(B.arab, "Untuk ibadah, pesantren, dan studi ke Timur Tengah."),
      bhs(B.jawa, "Untuk pendatang yang ingin lancar bahasa sehari-hari Jawa Timur."),
    ],
    tetangga: ["semarang", "yogyakarta"],
    faq: [
      {
        q: "Apakah Sidoarjo termasuk area kelas offline Surabaya?",
        a: "Area perbatasan seperti Waru biasanya masih terjangkau pengajar dari Surabaya. Untuk lokasi Sidoarjo yang lebih jauh, ketersediaan pengajar dicek dulu lewat WhatsApp.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "yogyakarta",
    nama: "Yogyakarta",
    provinsi: "DI Yogyakarta",
    kotaFunnel: "Yogyakarta",
    metaDescription:
      "Kursus bahasa offline di Jogja: pengajar privat datang ke kos atau rumah di Gejayan, Seturan, Condongcatur, Kaliurang, Kotagede, dan sekitarnya. Inggris, Jepang, Korea, Jerman, BIPA, dan 60+ bahasa lain.",
    intro:
      "Yogyakarta adalah kota pelajar: sebagian besar permintaan kelas datang dari mahasiswa di sekitar kampus-kampus di Sleman — Gejayan, Seturan, Condongcatur, dan Jalan Kaliurang — yang menyiapkan beasiswa, ujian bahasa, atau kerja ke luar negeri. Jogja juga kota wisata, sehingga ada kebutuhan bahasa asing untuk pelaku pariwisata dan bahasa Indonesia untuk mahasiswa asing. Pengajar Linguo datang ke kos, rumah, atau tempat kerjamu.",
    grupArea: [
      { wilayah: "Kota Yogyakarta", area: ["Malioboro", "Kotagede", "Umbulharjo"] },
      { wilayah: "Sleman", area: ["Gejayan", "Condongcatur", "Seturan", "Kaliurang", "Godean"] },
    ],
    kebutuhan: [
      "Mahasiswa yang menyiapkan beasiswa luar negeri dan ujian bahasa.",
      "Pelaku pariwisata dan usaha kreatif yang melayani tamu asing.",
      "Mahasiswa dan peneliti asing yang belajar bahasa Indonesia (BIPA).",
      "Pendatang yang ingin bisa berbahasa Jawa, termasuk krama.",
    ],
    bahasa: [
      bhs(B.inggris, "Untuk beasiswa, kuliah, dan persiapan IELTS/TOEFL."),
      bhs(B.jepang, "Untuk program kerja dan kuliah di Jepang."),
      bhs(B.korea, "Untuk beasiswa dan minat budaya Korea."),
      bhs(B.jerman, "Untuk kuliah dan Ausbildung di Jerman."),
      bhs(B.belanda, "Untuk riset sejarah, arsip, dan studi ke Belanda."),
      bhs(B.bipa, "Untuk mahasiswa, peneliti, dan ekspatriat di Jogja."),
      bhs(B.jawa, "Ngoko sampai krama inggil untuk pergaulan dan budaya."),
    ],
    tetangga: ["semarang", "surabaya"],
    faq: [
      {
        q: "Apakah pengajar bisa datang ke kos?",
        a: "Bisa, selama lokasinya terjangkau pengajar dan ada tempat yang cukup tenang untuk belajar. Kalau ruangannya kurang nyaman, kelas juga bisa digelar di tempat lain yang disepakati bersama pengajar.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "semarang",
    nama: "Semarang",
    provinsi: "Jawa Tengah",
    kotaFunnel: "Semarang",
    metaDescription:
      "Kursus bahasa offline di Semarang: pengajar privat datang ke rumah di Tembalang, Banyumanik, Simpang Lima, Pedurungan, sampai Ungaran. Inggris, Mandarin, Jepang, Korea, dan 60+ bahasa lain.",
    intro:
      "Permintaan kelas di Semarang terbagi dua: kawasan kampus di Tembalang dan Banyumanik yang dipenuhi mahasiswa, dan pusat kota di sekitar Simpang Lima serta Pedurungan yang lebih banyak diisi keluarga dan pekerja. Pengajar Linguo datang ke rumah, kos, atau kantormu, termasuk ke arah Ungaran, sehingga kamu tidak perlu naik-turun bukit untuk ikut kursus.",
    grupArea: [
      { wilayah: "Semarang Atas", area: ["Tembalang", "Banyumanik"] },
      { wilayah: "Semarang Tengah & Timur", area: ["Simpang Lima", "Pedurungan"] },
      { wilayah: "Kabupaten Semarang", area: ["Ungaran"] },
    ],
    kebutuhan: [
      "Mahasiswa di kawasan Tembalang yang menyiapkan beasiswa dan ujian bahasa.",
      "Anak sekolah yang les privat di rumah.",
      "Karyawan yang butuh bahasa asing untuk pekerjaan.",
    ],
    bahasa: [
      bhs(B.inggris, "Untuk kuliah, kerja, dan persiapan ujian internasional."),
      bhs(B.mandarin, "Untuk bisnis dan minat budaya Tionghoa."),
      bhs(B.jepang, "Untuk program kerja ke Jepang dan persiapan JLPT."),
      bhs(B.korea, "Untuk kerja maupun minat budaya Korea."),
      bhs(B.jerman, "Untuk kuliah dan Ausbildung di Jerman."),
      bhs(B.jawa, "Untuk pendatang yang ingin lancar bahasa Jawa sehari-hari."),
    ],
    tetangga: ["yogyakarta", "surabaya"],
    faq: [
      {
        q: "Apakah Ungaran termasuk?",
        a: "Permintaan dari Ungaran diterima. Karena jaraknya lebih jauh dari pusat kota, ketersediaan pengajar dicek dulu lewat WhatsApp sebelum pembayaran.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "bali",
    nama: "Bali",
    provinsi: "Bali",
    kotaFunnel: "Bali",
    metaDescription:
      "Kursus bahasa offline di Bali: pengajar privat datang ke rumah, vila, atau tempat kerja di Denpasar, Sanur, Renon, Kuta, Seminyak, Canggu, Jimbaran, Nusa Dua, dan Ubud. Inggris, BIPA, Rusia, Jepang, dan 60+ bahasa lain.",
    intro:
      "Kebutuhan bahasa di Bali sangat terkait pariwisata. Pekerja hotel, restoran, dan pemandu wisata butuh bahasa tamu mereka; sebaliknya, ekspatriat dan digital nomad yang menetap di Canggu, Seminyak, atau Ubud ingin bisa berbahasa Indonesia. Pengajar Linguo datang ke rumah, vila, atau tempat kerjamu di kawasan Denpasar dan Badung, dengan jadwal yang bisa mengikuti sif kerja.",
    grupArea: [
      { wilayah: "Denpasar", area: ["Sanur", "Renon"] },
      { wilayah: "Badung", area: ["Kuta", "Legian", "Seminyak", "Canggu", "Jimbaran", "Nusa Dua"] },
      { wilayah: "Gianyar", area: ["Ubud"] },
    ],
    kebutuhan: [
      "Pekerja pariwisata yang ingin melayani tamu dalam bahasa mereka.",
      "Ekspatriat, pensiunan, dan digital nomad yang belajar bahasa Indonesia (BIPA).",
      "Pemilik usaha yang menyiapkan staf dengan kelas Semi Private.",
      "Anak keluarga ekspatriat maupun lokal yang les di rumah.",
    ],
    bahasa: [
      bhs(B.inggris, "Bahasa layanan utama di hotel, restoran, dan tur."),
      bhs(B.bipa, "Untuk ekspatriat dan keluarganya yang menetap di Bali."),
      bhs(B.rusia, "Untuk melayani wisatawan dan penghuni berbahasa Rusia."),
      bhs(B.jepang, "Untuk layanan wisatawan Jepang dan program kerja ke Jepang."),
      bhs(B.korea, "Untuk layanan wisatawan Korea."),
      bhs(B.mandarin, "Untuk layanan wisatawan berbahasa Mandarin."),
      bhs(B.bali, "Untuk pendatang yang ingin mengenal bahasa dan budaya Bali."),
    ],
    tetangga: [],
    faq: [
      {
        q: "Can expats in Bali take offline Indonesian (BIPA) lessons?",
        a: "Yes. A Linguo teacher can come to your home, villa, or workplace in the Denpasar and Badung area, subject to teacher availability in your area. Message us on WhatsApp with your location and preferred schedule, in English if you prefer.",
      },
      {
        q: "Apakah Ubud dan area di luar Denpasar–Badung bisa dilayani?",
        a: "Permintaan dari Ubud dan area lain di luar Denpasar–Badung diterima, tetapi ketersediaan pengajarnya lebih terbatas. Tanyakan lewat WhatsApp dengan menyebutkan lokasi lengkapmu.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "bekasi",
    nama: "Bekasi",
    provinsi: "Jawa Barat",
    kotaFunnel: "Bekasi",
    metaDescription:
      "Kursus bahasa offline di Bekasi & Cikarang: pengajar privat datang ke rumah atau kantor di Harapan Indah, Summarecon, Jatiasih, Pondok Gede, Tambun, Jababeka, sampai Lippo Cikarang. Inggris, Jepang, Korea, Mandarin, dan 60+ bahasa lain.",
    intro:
      "Bekasi punya dua wajah: perumahan padat penduduk yang warganya banyak bekerja di Jakarta, dan kawasan industri Cikarang yang dipenuhi pabrik perusahaan Jepang dan Korea. Dua-duanya membuat kelas di lokasi siswa masuk akal — orang tua tak perlu mengantar anak ke tempat kursus, dan karyawan pabrik bisa belajar di rumah atau mes sepulang sif. Pengajar Linguo datang ke tempatmu di Kota maupun Kabupaten Bekasi.",
    grupArea: [
      { wilayah: "Kota Bekasi", area: ["Harapan Indah", "Summarecon Bekasi", "Jatiasih", "Pondok Gede", "Jatibening", "Kemang Pratama", "Rawalumbu", "Bantargebang", "Mustikajaya", "Kranji"] },
      { wilayah: "Kabupaten Bekasi", area: ["Cikarang", "Jababeka", "Lippo Cikarang", "Deltamas", "Tambun", "Cibitung", "Babelan"] },
    ],
    kebutuhan: [
      "Karyawan perusahaan Jepang dan Korea di kawasan industri Cikarang.",
      "Anak sekolah yang les privat di rumah.",
      "Pekerja yang ingin belajar di akhir pekan tanpa ke Jakarta.",
      "Calon pekerja ke Jepang yang butuh latihan intensif sebelum tes.",
    ],
    bahasa: [
      bhs(B.jepang, "Banyak dibutuhkan karyawan perusahaan Jepang di Cikarang."),
      bhs(B.korea, "Untuk karyawan perusahaan Korea dan minat budaya."),
      bhs(B.inggris, "Untuk kerja, sekolah, dan persiapan ujian."),
      bhs(B.mandarin, "Untuk bisnis dan kerja di perusahaan Tiongkok."),
      bhs(B.arab, "Untuk ibadah dan studi."),
    ],
    tetangga: ["jakarta", "bogor", "depok"],
    faq: [
      {
        q: "Apakah Cikarang dan kawasan industri termasuk?",
        a: "Permintaan dari Cikarang, Jababeka, Lippo Cikarang, dan Deltamas diterima. Untuk kelas di dalam kawasan pabrik, pastikan dulu izin akses tamu dari perusahaanmu; untuk pelatihan beberapa karyawan atas nama perusahaan, program korporat Linguo biasanya lebih pas.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "depok",
    nama: "Depok",
    provinsi: "Jawa Barat",
    kotaFunnel: "Depok",
    metaDescription:
      "Kursus bahasa offline di Depok: pengajar privat datang ke rumah atau kos di Margonda, Beji, Pondok Cina, Kukusan, Cinere, Sawangan, Cimanggis, dan sekitarnya. Inggris, Jepang, Korea, Jerman, Arab, dan 60+ bahasa lain.",
    intro:
      "Depok adalah kota kampus dan kota komuter sekaligus. Kawasan Margonda, Beji, Pondok Cina, dan Kukusan dipenuhi mahasiswa yang menyiapkan beasiswa dan ujian bahasa, sementara perumahan di Cinere, Sawangan, dan Cimanggis diisi keluarga yang anaknya butuh les di rumah. Pengajar Linguo datang ke kos, rumah, atau tempat kerjamu.",
    grupArea: [
      { wilayah: "Kawasan kampus", area: ["Margonda", "Beji", "Pondok Cina", "Kukusan"] },
      { wilayah: "Depok lainnya", area: ["Cinere", "Limo", "Sawangan", "Pancoran Mas", "Sukmajaya", "Cilodong", "Cimanggis", "Tapos"] },
    ],
    kebutuhan: [
      "Mahasiswa yang menyiapkan beasiswa, pertukaran pelajar, dan ujian bahasa.",
      "Anak sekolah yang les privat di rumah.",
      "Pekerja komuter yang hanya punya waktu di malam hari atau akhir pekan.",
    ],
    bahasa: [
      bhs(B.inggris, "Untuk beasiswa, kuliah, dan persiapan IELTS/TOEFL."),
      bhs(B.jepang, "Untuk beasiswa dan program kerja di Jepang."),
      bhs(B.korea, "Untuk beasiswa dan minat budaya Korea."),
      bhs(B.jerman, "Untuk kuliah dan Ausbildung di Jerman."),
      bhs(B.arab, "Untuk ibadah dan studi ke Timur Tengah."),
      bhs(B.prancis, "Untuk kuliah dan beasiswa ke negara berbahasa Prancis."),
    ],
    tetangga: ["jakarta", "bogor", "bekasi"],
    faq: [
      {
        q: "Apakah area perbatasan seperti Cinere dan Cibubur termasuk?",
        a: "Area perbatasan Depok dengan Jakarta Selatan dan Jakarta Timur, seperti Cinere dan Cibubur, biasanya bisa dijangkau pengajar dari kedua sisi. Kepastiannya dicek lewat WhatsApp sesuai lokasi lengkapmu.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "bogor",
    nama: "Bogor",
    provinsi: "Jawa Barat",
    kotaFunnel: "Bogor",
    metaDescription:
      "Kursus bahasa offline di Bogor: pengajar privat datang ke rumah di Baranangsiang, Dramaga, Sentul, Cibinong, Cileungsi, Ciawi, dan sekitarnya. Inggris, Jepang, Korea, Jerman, Sunda, dan 60+ bahasa lain.",
    intro:
      "Bogor membentang luas, dari pusat kota di sekitar Baranangsiang, kawasan kampus di Dramaga, sampai perumahan baru di Sentul, Cibinong, dan Cileungsi. Jarak antarwilayahnya jauh, jadi kelas yang datang ke rumah jauh lebih praktis daripada pergi ke tempat kursus. Pengajar Linguo datang ke lokasimu di Kota maupun Kabupaten Bogor, sesuai ketersediaan pengajar di area itu.",
    grupArea: [
      { wilayah: "Kota Bogor & kampus", area: ["Baranangsiang", "Dramaga"] },
      { wilayah: "Kabupaten Bogor", area: ["Sentul", "Cibinong", "Citeureup", "Gunung Putri", "Cileungsi", "Jonggol", "Parung"] },
      { wilayah: "Jalur Puncak", area: ["Ciawi", "Cisarua", "Puncak"] },
    ],
    kebutuhan: [
      "Mahasiswa dan peneliti yang menyiapkan studi lanjut dan publikasi berbahasa asing.",
      "Keluarga di perumahan Sentul dan Cibinong yang mencari les privat di rumah.",
      "Pelaku usaha wisata di jalur Puncak.",
    ],
    bahasa: [
      bhs(B.inggris, "Untuk studi lanjut, riset, dan persiapan ujian."),
      bhs(B.jepang, "Untuk beasiswa dan program kerja di Jepang."),
      bhs(B.korea, "Untuk minat budaya dan kerja."),
      bhs(B.jerman, "Untuk kuliah dan Ausbildung di Jerman."),
      bhs(B.arab, "Untuk ibadah dan studi."),
      bhs(B.sunda, "Bahasa sehari-hari di Bogor dan sekitarnya."),
    ],
    tetangga: ["depok", "jakarta", "bekasi"],
    faq: [
      {
        q: "Apakah kawasan Puncak bisa dilayani?",
        a: "Permintaan dari Ciawi, Cisarua, dan Puncak diterima, tetapi ketersediaan pengajarnya lebih terbatas dibanding pusat kota. Tanyakan lewat WhatsApp dengan lokasi lengkapmu; kalau belum ada pengajar, kelas online bisa jadi pilihan.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "tangerang",
    nama: "Tangerang",
    provinsi: "Banten",
    kotaFunnel: "Tangerang",
    metaDescription:
      "Kursus bahasa offline di Tangerang: pengajar privat datang ke rumah atau kantor di Karawaci, Cipondoh, Ciledug, Cikokol, Kelapa Dua, Cikupa, sampai Balaraja. Inggris, Mandarin, Jepang, Korea, dan 60+ bahasa lain.",
    intro:
      "Kota dan Kabupaten Tangerang adalah perpaduan perumahan besar, kawasan pabrik, dan bandara internasional di Neglasari. Permintaan bahasanya ikut beragam: les privat untuk anak di Karawaci dan Cipondoh, bahasa asing untuk karyawan pabrik di Cikupa dan Balaraja, serta bahasa layanan untuk pekerja penerbangan. Pengajar Linguo datang ke lokasimu.",
    grupArea: [
      { wilayah: "Kota Tangerang", area: ["Karawaci", "Cipondoh", "Ciledug", "Cikokol", "Batuceper", "Neglasari"] },
      { wilayah: "Kabupaten Tangerang", area: ["Kelapa Dua", "Curug", "Legok", "Cisauk", "Pasar Kemis", "Cikupa", "Balaraja", "Tigaraksa"] },
    ],
    kebutuhan: [
      "Anak sekolah yang les privat di rumah.",
      "Karyawan pabrik dan kawasan industri yang butuh bahasa asing untuk kerja.",
      "Pekerja di sekitar bandara yang melayani penumpang asing.",
    ],
    bahasa: [
      bhs(B.inggris, "Untuk sekolah, kerja, dan layanan di bandara."),
      bhs(B.mandarin, "Untuk bisnis dan kerja di perusahaan Tiongkok."),
      bhs(B.jepang, "Untuk karyawan perusahaan Jepang dan program kerja."),
      bhs(B.korea, "Untuk karyawan perusahaan Korea dan minat budaya."),
      bhs(B.arab, "Untuk ibadah dan studi."),
    ],
    tetangga: ["tangerang-selatan", "jakarta"],
    faq: [
      {
        q: "Apa bedanya halaman ini dengan Tangerang Selatan?",
        a: "Halaman ini mencakup Kota dan Kabupaten Tangerang (Karawaci, Cipondoh, Cikupa, dan sekitarnya). BSD, Bintaro, Serpong, dan sekitarnya ada di halaman Tangerang Selatan. Aturan dan biayanya sama; yang membedakan hanya pengajar yang tersedia di area itu.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  {
    slug: "tangerang-selatan",
    nama: "Tangerang Selatan",
    provinsi: "Banten",
    kotaFunnel: "Tangerang Selatan",
    metaDescription:
      "Kursus bahasa offline di Tangerang Selatan: pengajar privat datang ke rumah di BSD, Bintaro, Serpong, Alam Sutera, Gading Serpong, Ciputat, dan Pamulang. Inggris, Mandarin, Jepang, Korea, Jerman, dan 60+ bahasa lain.",
    intro:
      "BSD, Bintaro, Alam Sutera, dan Gading Serpong adalah kawasan keluarga dengan banyak sekolah nasional plus dan internasional. Permintaan kelas bahasa di sini didominasi les privat anak dan remaja di rumah, ditambah orang tua yang ingin belajar di akhir pekan. Pengajar Linguo datang ke rumahmu di Tangerang Selatan, termasuk area perbatasan dengan Jakarta Selatan.",
    grupArea: [
      { wilayah: "Serpong & sekitarnya", area: ["BSD", "Serpong", "Alam Sutera", "Gading Serpong", "Rawa Buntu"] },
      { wilayah: "Bintaro & sekitarnya", area: ["Bintaro", "Pondok Aren", "Jurang Mangu"] },
      { wilayah: "Ciputat & Pamulang", area: ["Ciputat", "Pamulang", "Pondok Cabe"] },
    ],
    kebutuhan: [
      "Anak dan remaja yang butuh les privat di rumah untuk mendukung pelajaran sekolah.",
      "Keluarga yang menyiapkan pindah atau kuliah ke luar negeri.",
      "Orang tua dan pekerja yang hanya punya waktu di akhir pekan.",
    ],
    bahasa: [
      bhs(B.inggris, "Untuk sekolah, kuliah, dan persiapan IELTS/TOEFL."),
      bhs(B.mandarin, "Banyak dipelajari pelajar sebagai bahasa asing kedua."),
      bhs(B.jepang, "Untuk minat budaya dan persiapan JLPT."),
      bhs(B.korea, "Untuk minat budaya dan persiapan TOPIK."),
      bhs(B.jerman, "Untuk kuliah dan Ausbildung di Jerman."),
      bhs(B.prancis, "Untuk pelajar sekolah dan persiapan DELF."),
    ],
    tetangga: ["tangerang", "jakarta", "depok"],
    faq: [
      {
        q: "Apakah Bintaro sektor yang masuk Jakarta Selatan juga dilayani?",
        a: "Ya. Permintaan dari Bintaro, baik yang masuk Tangerang Selatan maupun Jakarta Selatan, diterima dan dicocokkan dengan pengajar terdekat.",
      },
    ],
  },
];

export function getKotaOffline(slug: string): KotaOffline | null {
  return KOTA_OFFLINE.find((k) => k.slug === slug) ?? null;
}

/** Tanggal isi halaman kota terakhir diubah — dipakai sitemap (lastmod jujur). */
export const KOTA_OFFLINE_UPDATED = new Date("2026-10-16");
