// Auto-generated dari 4 file .md kuesioner — v2 (barter TOEFL).
// Single source of truth untuk Discovery Sprint forms.
// Edit di sini, JANGAN edit di file .md (file .md tidak lagi jadi source of truth).

export type QuestionTag =
  | 'SINGLE'
  | 'MULTI'
  | 'LIKERT5'
  | 'RANK'
  | 'LONGTEXT'
  | 'TEXT'
  | 'NUMBER'
  | 'YESNO';

export interface Question {
  number: number;
  text: string;
  tag: QuestionTag;
  required: boolean;
  options?: string[];
  hasOther?: boolean;
  likertLow?: string;
  likertHigh?: string;
  helpText?: string;
  topN?: number;
}

export interface Section {
  title: string;
  questions: Question[];
}

export type PersonaId = 'kepsek' | 'koordinator' | 'guru' | 'siswa';
export type PersonaSlug = 'kepala-sekolah' | 'koordinator' | 'guru' | 'siswa';

export interface Kuesioner {
  id: PersonaId;
  slug: PersonaSlug;
  title: string;
  shortTitle: string;
  audienceLabel: string;
  estimatedMinutes: string;
  voucherAmount: string;
  accentColor: string;
  intro: string;
  closing: string;
  sections: Section[];
}

export const KEPSEK_KUESIONER: Kuesioner = {
  id: "kepsek",
  slug: "kepala-sekolah",
  title: "Kuesioner #1: Kepala Sekolah / Yayasan / Direktur Akademik",
  shortTitle: "Kepala Sekolah",
  audienceLabel: "Kepala Sekolah / Yayasan / Direktur Akademik",
  estimatedMinutes: "10–12 menit",
  voucherAmount: "Akses gratis Simulasi TOEFL Linguo untuk sekolah Anda",
  accentColor: "teal",
  intro: "Bapak/Ibu Yth.,\n\nTerima kasih atas waktu Bapak/Ibu. Kuesioner ini disusun oleh PT. Linguo Edu Indonesia (linguo.id) — penyedia kursus 60+ bahasa asing online sejak 2020 — untuk riset kebutuhan program bahasa di sekolah.\n\nHasil riset ini akan kami gunakan untuk mengembangkan platform LMS khusus pembelajaran bahasa yang lebih sesuai kebutuhan sekolah Indonesia.\n\nKerahasiaan: Data dijaga ketat. Tidak akan ada informasi spesifik per sekolah yang dipublikasikan tanpa izin.\n\nApresiasi: Sebagai timbal balik partisipasi, sekolah Bapak/Ibu akan menerima akses gratis Simulasi TOEFL Linguo untuk siswa, plus Executive Summary Riset Agregat (digital, anonim) sebagai benchmark internal.\n\nEstimasi waktu: 10–12 menit.",
  closing: "Terima kasih, Bapak/Ibu. Akses Simulasi TOEFL Linguo dan Executive Summary Riset akan dikirim dalam 3–7 hari kerja setelah cukup peserta dari sekolah Anda mengisi kuesioner.\n\nJika tertarik diskusi lanjutan tentang program pengembangan bahasa di sekolah Bapak/Ibu, silakan hubungi:\n\nPT Linguo Edu Indonesia\nEmail: hello@linguo.id",
  sections: [
  {
    title: "Section A: Profil Sekolah",
    questions: [
      { number: 1, text: "Nama sekolah/institusi", tag: "TEXT", required: true },
      { number: 2, text: "Jenjang utama yang dikelola", tag: "SINGLE", required: true, options: ["SD","SMP","SMA","SMK","Universitas / Perguruan Tinggi","Multi-jenjang (TK–SMA dalam satu yayasan)"] },
      { number: 3, text: "Tipe sekolah/institusi", tag: "SINGLE", required: true, options: ["Sekolah Negeri","Sekolah Swasta Nasional","Sekolah Internasional (Cambridge, IB, dll.)","Sekolah Berbasis Agama","Sekolah Khusus (kejuruan, talent-based)","Universitas Negeri","Universitas Swasta"] },
      { number: 4, text: "Total siswa aktif di sekolah/institusi", tag: "SINGLE", required: true, options: ["< 200","200 – 500","500 – 1.000","1.000 – 2.500","> 2.500"] },
      { number: 5, text: "Kurikulum yang digunakan untuk program bahasa", tag: "MULTI", required: false, options: ["Kurikulum Merdeka","Kurikulum 2013","Cambridge International (CIE)","International Baccalaureate (IB)","Kurikulum sekolah custom","Mengikuti CEFR (A1–C2)"], hasOther: true }
    ],
  },
  {
    title: "Section B: Program Bahasa di Sekolah",
    questions: [
      { number: 6, text: "Bahasa asing yang diajarkan saat ini", tag: "MULTI", required: true, options: ["Inggris (wajib di hampir semua sekolah)","Mandarin","Jepang","Korea","Arab","Jerman","Prancis","Spanyol","Belanda"], hasOther: true },
      { number: 7, text: "Posisi program bahasa selain Inggris di sekolah", tag: "SINGLE", required: false, options: ["Pelajaran wajib utama (semua siswa)","Wajib + elektif (siswa pilih 1)","Hanya elektif/ekstrakurikuler","Tidak ada bahasa selain Inggris saat ini","Sedang merencanakan untuk tambah bahasa lain"] },
      { number: 8, text: "Rata-rata jam pelajaran bahasa per minggu (per siswa untuk satu bahasa)", tag: "SINGLE", required: false, options: ["< 2 jam","2 – 4 jam","4 – 6 jam","> 6 jam"] },
      { number: 9, text: "Bagaimana Bapak/Ibu menilai kualitas program bahasa di sekolah Anda dibanding sekolah peer/kompetitor?", tag: "LIKERT5", required: false, likertLow: "Jauh lebih buruk", likertHigh: "Jauh lebih baik" },
      { number: 10, text: "Estimasi total investasi tahunan untuk program bahasa di sekolah Anda (gaji guru, materi, tools)", tag: "SINGLE", required: false, options: ["< Rp 50 juta","Rp 50 – 150 juta","Rp 150 – 300 juta","Rp 300 – 500 juta","> Rp 500 juta","Tidak tahu / tidak bisa estimasi"] }
    ],
  },
  {
    title: "Section C: Decision Making",
    questions: [
      { number: 11, text: "Siapa yang biasanya memutuskan pembelian platform/teknologi pembelajaran di sekolah Anda?", tag: "MULTI", required: false, options: ["Yayasan / Pemilik","Kepala Sekolah","Wakasek Kurikulum","Komite Kurikulum / Tim Akademik","Tim IT","Direktur Akademik (universitas)"], hasOther: true },
      { number: 12, text: "Berapa lama proses keputusan pembelian platform tahunan dari evaluasi awal sampai signed contract?", tag: "SINGLE", required: false, options: ["< 1 bulan","1 – 3 bulan","3 – 6 bulan","6 – 12 bulan","> 12 bulan"] },
      { number: 13, text: "Pertimbangan utama saat memilih platform pembelajaran (rank top 3)", tag: "RANK", required: false, options: ["Harga / fit budget","Kelengkapan fitur","Brand reputation / track record","Rekomendasi sekolah lain (referral)","Demo & uji coba (free trial)","Integrasi dengan sistem existing","Support & training pasca-deploy","Compliance/regulasi (kurikulum nasional, akreditasi)","White-label / branding sekolah"], helpText: "rank 1, 2, 3", topN: 3 },
      { number: 14, text: "Yang paling diprioritaskan dalam evaluasi platform khusus untuk program bahasa?", tag: "MULTI", required: false, options: ["Kurikulum bahasa siap pakai per level (A1–C2)","Native speaker integration","Reporting ke yayasan/orang tua","Mobile app untuk siswa","Compliance kurikulum nasional / akreditasi","White-label branding sekolah","Multi-bahasa dalam satu platform","Self-paced learning untuk siswa","Analytics progress siswa"], hasOther: true },
      { number: 15, text: "Anggaran wajar (bagi sekolah Anda) untuk platform khusus program bahasa per tahun (untuk ALL siswa di program bahasa)", tag: "SINGLE", required: false, options: ["< Rp 50 juta","Rp 50 – 100 juta","Rp 100 – 200 juta","Rp 200 – 400 juta","> Rp 400 juta","Tidak tahu / belum ada anggaran khusus"] }
    ],
  },
  {
    title: "Section D: Pain Points & Visi",
    questions: [
      { number: 16, text: "Masalah/tantangan terbesar program bahasa di sekolah Anda saat ini (rank top 3)", tag: "RANK", required: false, options: ["Guru native speaker langka / mahal","Kualitas materi tidak konsisten antar guru","Tracking progress siswa secara real-time susah","Komunikasi ke orang tua siswa manual / tidak terstruktur","Reporting & rapor end-of-term beban berat (manual)","Engagement siswa rendah (banyak yang males)","Kepatuhan akreditasi (data tidak lengkap saat audit)","Kurikulum bahasa langka tidak ada (Vietnam, Korea, dll.)","Re-scheduling kalau guru cancel sulit","Biaya program bahasa terlalu tinggi vs outcome"], topN: 3 },
      { number: 17, text: "Apakah sekolah Anda pernah mempertimbangkan platform LMS spesifik untuk bahasa?", tag: "SINGLE", required: false, options: ["Sudah pakai (sebut di Q18)","Pernah pertimbangkan tapi belum pakai","Belum pernah pertimbangkan"] },
      { number: 18, text: "Jika sudah/pernah, sebutkan platform yang digunakan/dipertimbangkan", tag: "TEXT", required: false },
      { number: 19, text: "Dalam 5 tahun ke depan, bagaimana visi program bahasa di sekolah Anda?", tag: "LONGTEXT", required: false },
      { number: 20, text: "Apa \"single biggest win\" yang ingin dicapai dari platform pembelajaran bahasa?", tag: "LONGTEXT", required: false }
    ],
  },
  {
    title: "Section E: Closing & Pilot Interest",
    questions: [
      { number: 21, text: "Sekolah Anda sudah menawarkan native speaker (guru asing native) untuk program bahasa?", tag: "SINGLE", required: false, options: ["Ya, untuk semua bahasa","Ya, untuk sebagian bahasa","Tidak, semua guru lokal","Tidak ada, tapi ingin"] },
      { number: 22, text: "Apakah sekolah Anda bersedia menjadi early pilot partner untuk platform Lingcore for Schools (terms preferential, free atau diskon besar selama 12 bulan)?", tag: "SINGLE", required: false, options: ["Sangat tertarik, mau ngobrol lebih dalam","Mungkin tertarik, tergantung detail","Tidak tertarik saat ini"] },
      { number: 23, text: "Channel komunikasi paling efektif untuk follow-up", tag: "SINGLE", required: false, options: ["Email","WhatsApp","LinkedIn","Pertemuan offline / kunjungan sekolah","Tidak ingin follow-up"] },
      { number: 24, text: "Nama responden + jabatan resmi", tag: "TEXT", required: true },
      { number: 25, text: "Email atau nomor WhatsApp untuk follow-up & kirim Executive Summary", tag: "TEXT", required: false }
    ],
  }
  ],
};

export const KOORDINATOR_KUESIONER: Kuesioner = {
  id: "koordinator",
  slug: "koordinator",
  title: "Kuesioner #2: Koordinator Kurikulum / Wakasek / Koordinator Bahasa",
  shortTitle: "Koordinator Kurikulum",
  audienceLabel: "Wakasek Kurikulum / Koordinator Bahasa",
  estimatedMinutes: "15–18 menit",
  voucherAmount: "Akses gratis Simulasi TOEFL Linguo untuk sekolah Anda",
  accentColor: "emerald",
  intro: "Bapak/Ibu Yth.,\n\nTerima kasih sudah menerima undangan ini. Sebagai operator harian program bahasa di sekolah, suara Bapak/Ibu paling penting dalam riset kami.\n\nKami sedang mengembangkan Lingcore for Schools — platform LMS khusus pembelajaran bahasa. Sebelum membangun, kami ingin memahami pain harian Bapak/Ibu agar produk yang kami buat benar-benar membantu.\n\nApresiasi: Sekolah Anda akan menerima akses gratis Simulasi TOEFL Linguo untuk siswa, plus Executive Summary Riset Agregat sebagai timbal balik partisipasi.\n\nEstimasi waktu: 15–18 menit. Mohon isi sesuai kondisi nyata di lapangan — tidak ada jawaban salah.",
  closing: "Terima kasih banyak. Insight Bapak/Ibu sangat berharga.\n\nAkses Simulasi TOEFL Linguo dan Executive Summary akan dikirim dalam 3–7 hari kerja setelah cukup peserta dari sekolah Anda mengisi kuesioner.\n\nPT Linguo Edu Indonesia\nEmail: hello@linguo.id",
  sections: [
  {
    title: "Section A: Profil & Konteks Kerja",
    questions: [
      { number: 1, text: "Nama sekolah/institusi", tag: "TEXT", required: true },
      { number: 2, text: "Jabatan / posisi resmi", tag: "TEXT", required: true, helpText: "contoh: Wakasek Kurikulum, Koordinator Bahasa, Direktur Akademik, Kepala Departemen Bahasa" },
      { number: 3, text: "Lama menjabat di posisi ini", tag: "SINGLE", required: false, options: ["< 1 tahun","1 – 3 tahun","3 – 5 tahun","> 5 tahun"] },
      { number: 4, text: "Berapa banyak guru bahasa yang Anda koordinasikan?", tag: "NUMBER", required: false, helpText: "jumlah, isi 0 jika tidak coordinate guru" }
    ],
  },
  {
    title: "Section B: Current Workflow",
    questions: [
      { number: 5, text: "Bagaimana program bahasa di sekolah dijalankan saat ini? (Singkat saja: bahasa apa, format kelas, frekuensi, tools)", tag: "LONGTEXT", required: false },
      { number: 6, text: "Tools/aplikasi yang dipakai untuk program bahasa", tag: "MULTI", required: false, options: ["Google Classroom","Microsoft Teams for Education","Zoom","Google Meet","WhatsApp Group","Google Drive / Sheets","Excel manual","Edmodo","Quipper School","LMS sekolah custom (built in-house)","Schoology","Cakap for Schools","Skolla / Scola"], hasOther: true },
      { number: 7, text: "Berapa banyak tools/aplikasi berbeda yang harus Anda kelola/koordinasikan?", tag: "SINGLE", required: false, options: ["1 – 2 (sangat terintegrasi)","3 – 4","5 – 6","> 6 (sangat fragmented)"] },
      { number: 8, text: "Bagaimana Anda track attendance siswa di kelas bahasa?", tag: "SINGLE", required: false, options: ["Manual paper / absensi cetak","Excel","Google Sheets","LMS sekolah","Aplikasi khusus (sebut di Q9)","Tidak tracking secara konsisten"] },
      { number: 9, text: "Jika pakai aplikasi khusus untuk attendance, sebut namanya", tag: "TEXT", required: false },
      { number: 10, text: "Bagaimana Anda track progress akademik siswa per kelas bahasa?", tag: "LONGTEXT", required: false },
      { number: 11, text: "Siapa yang sourcing materi untuk guru bahasa?", tag: "SINGLE", required: false, options: ["Guru bahasa sendiri (each guru cari sendiri)","Saya / Koordinator","Tim Kurikulum","Vendor luar (penerbit, agen)","Mix beberapa sumber","Tidak ada standardisasi"] },
      { number: 12, text: "Berapa jam per minggu Anda spend untuk admin program bahasa (scheduling, koordinasi guru, tracking siswa)?", tag: "SINGLE", required: false, options: ["< 5 jam","5 – 10 jam","10 – 15 jam","> 15 jam"] },
      { number: 13, text: "Berapa total jam yang diperlukan untuk generate rapor bahasa (per kelas, per term/semester)?", tag: "SINGLE", required: false, options: ["< 8 jam","8 – 16 jam","16 – 32 jam (1 minggu kerja)","> 32 jam (lebih dari seminggu)"] }
    ],
  },
  {
    title: "Section C: Pain Points",
    questions: [
      { number: 14, text: "Top 3 pain operasional terbesar dalam mengelola program bahasa (rank top 3)", tag: "RANK", required: false, options: ["Mencari/onboarding guru native speaker","Kualitas materi tidak konsisten antar guru","Tracking progress siswa manual & makan waktu","Re-schedule mendadak kalau guru cancel","Generating rapor end-of-term (sangat manual)","Komunikasi dengan orang tua via WA tidak terstruktur","Engagement siswa rendah (males ikut kelas)","Tidak ada placement test standar","Kurikulum tidak terdokumentasi (tergantung guru)","Tools terlalu banyak / fragmented","Biaya program bahasa terlalu tinggi","Akreditasi: data tidak lengkap saat audit"], topN: 3 },
      { number: 15, text: "Berapa kali per term/semester ada guru bahasa yang cancel mendadak?", tag: "NUMBER", required: false, helpText: "angka rata-rata" },
      { number: 16, text: "Bagaimana cara Anda handle situasi guru cancel mendadak?", tag: "LONGTEXT", required: false },
      { number: 17, text: "Channel komunikasi dengan orang tua siswa terkait program bahasa", tag: "MULTI", required: false, options: ["WhatsApp Group kelas","WhatsApp pribadi (1-on-1 ortu-guru)","Email resmi sekolah","Surat fisik / undangan cetak","Aplikasi khusus parent portal","Pertemuan / meeting fisik","Tidak ada channel rutin"] },
      { number: 18, text: "Berapa frequency complaint dari orang tua terkait program bahasa per term?", tag: "SINGLE", required: false, options: ["0 (tidak ada)","1 – 3 kali","4 – 10 kali","> 10 kali (sering)"] },
      { number: 19, text: "Top 3 jenis complaint dari orang tua (rank top 3)", tag: "RANK", required: false, options: ["Anak tidak engaged / males ikut kelas bahasa","Progress anak tidak terlihat","Kualitas guru tidak konsisten","Biaya program bahasa terlalu mahal","Anak ketinggalan saat absen","Materi terlalu susah / terlalu mudah","Komunikasi guru-ortu lambat","Schedule berubah-ubah"], hasOther: true, topN: 3 },
      { number: 20, text: "Apakah ada siswa yang drop / pindah dari program bahasa per term/semester?", tag: "SINGLE", required: false, options: ["0% (tidak ada)","< 5%","5 – 15%","> 15%","Tidak tracking"] },
      { number: 21, text: "Alasan utama siswa drop / disengage dari program bahasa?", tag: "LONGTEXT", required: false }
    ],
  },
  {
    title: "Section D: Tools & Tech",
    questions: [
      { number: 22, text: "Berapa nyaman Anda dengan adopsi tools digital baru?", tag: "LIKERT5", required: false, likertLow: "Sangat tidak nyaman", likertHigh: "Sangat nyaman" },
      { number: 23, text: "Berapa nyaman guru bahasa di sekolah Anda dengan adopsi tools digital baru?", tag: "LIKERT5", required: false, helpText: "rata-rata" },
      { number: 24, text: "Akses internet stabil di sekolah?", tag: "SINGLE", required: false, options: ["Ya, di semua kelas","Ya, di sebagian kelas","Terbatas (lab komputer atau ruangan tertentu)","Sangat terbatas","Tidak ada internet sekolah (mengandalkan personal)"] },
      { number: 25, text: "Device yang dipakai siswa saat belajar bahasa", tag: "MULTI", required: false, options: ["Smartphone pribadi","Tablet sekolah (BYOD)","Laptop pribadi","Komputer lab sekolah","Buku fisik only","Tidak ada device khusus"] },
      { number: 26, text: "Apakah sekolah punya budget khusus untuk training adopsi tools baru bagi guru?", tag: "SINGLE", required: false, options: ["Ya, ada budget khusus","Tidak ada budget khusus tapi bisa diadakan","Tidak ada budget & sulit diadakan","Tidak tahu"] },
      { number: 27, text: "Tools digital yang menurut Anda SANGAT MEMBANTU pekerjaan saat ini?", tag: "LONGTEXT", required: false },
      { number: 28, text: "Tools digital yang TIDAK HELPFUL atau dipaksa pakai tapi gak relevan?", tag: "LONGTEXT", required: false }
    ],
  },
  {
    title: "Section E: Wishlist & Solution Fit",
    questions: [
      { number: 29, text: "Jika ada platform \"magic\" untuk program bahasa di sekolah, fitur apa yang paling dibutuhkan? (Rank top 5)", tag: "RANK", required: false, options: ["Kurikulum siap pakai per bahasa & level (60+ bahasa)","Auto-generate rapor draft (template auto-filled)","Attendance 1-tap mobile","Native speaker bookable on-demand (Linguo provide pool)","Live session dengan embedded materi (gak perlu Zoom + Drive lagi)","Self-paced practice untuk siswa di luar jam kelas","Parent portal real-time progress (lihat attendance + nilai)","Quiz auto-grade (multiple choice + fill-in)","Placement test otomatis","Channel chat guru-ortu terstruktur (bukan WA grup chaos)","Auto-detect risk siswa (3x alpa atau nilai turun)","Branding sekolah custom (logo, warna)","Mobile native app","AI suggestion materi/topik"], topN: 5 },
      { number: 30, text: "Fitur \"nice-to-have\" tapi gak essential di awal?", tag: "LONGTEXT", required: false },
      { number: 31, text: "Dealbreaker — fitur/aspek yang harus ada, kalau tidak Anda gak akan pakai LMS bahasa?", tag: "LONGTEXT", required: false },
      { number: 32, text: "Anggaran wajar untuk platform LMS bahasa per tahun (untuk siswa yang ikut program bahasa)", tag: "SINGLE", required: false, options: ["Rp 100.000 – 300.000 / siswa / tahun","Rp 300.000 – 500.000 / siswa / tahun","Rp 500.000 – 1.000.000 / siswa / tahun","> Rp 1.000.000 / siswa / tahun","Tergantung fitur, butuh konsultasi"] },
      { number: 33, text: "Format kontrak yang preferred", tag: "SINGLE", required: false, options: ["Annual (1 tahun lock)","Semester (6 bulan)","Per term (3–4 bulan)","Pay-per-use (per siswa per session)","Multi-year (2–3 tahun discount)"] }
    ],
  },
  {
    title: "Section F: Closing",
    questions: [
      { number: 34, text: "Setelah baca konsep di intro, apa pendapat Anda tentang Lingcore for Schools — platform LMS spesifik bahasa dengan kurikulum 60+ bahasa, dashboard guru-admin-siswa terintegrasi, dan native speaker pool dari Linguo?", tag: "LONGTEXT", required: false },
      { number: 35, text: "Bersediakah Anda interview lanjutan 60 menit (online, sebagai timbal balik tambahan kami sediakan akses Simulasi TOEFL Linguo paket sekolah + bonus e-learning)?", tag: "SINGLE", required: false, options: ["Ya, sangat tertarik","Mungkin, tergantung schedule","Tidak"] }
    ],
  }
  ],
};

export const GURU_KUESIONER: Kuesioner = {
  id: "guru",
  slug: "guru",
  title: "Kuesioner #3: Guru Bahasa Asing",
  shortTitle: "Guru Bahasa",
  audienceLabel: "Guru Bahasa Asing",
  estimatedMinutes: "12–15 menit",
  voucherAmount: "Akses gratis Simulasi TOEFL Linguo untuk sekolah Anda",
  accentColor: "cyan",
  intro: "Bapak/Ibu Guru Yth.,\n\nTerima kasih sudah menerima undangan ini. Sebagai guru bahasa di sekolah, pendapat Bapak/Ibu paling penting untuk kami yang sedang merancang platform LMS khusus pembelajaran bahasa.\n\nTujuan kami: membuat tools yang bener-bener bantu guru mengajar lebih efektif tanpa nambah beban admin.\n\nApresiasi: Sekolah Bapak/Ibu akan menerima akses gratis Simulasi TOEFL Linguo untuk siswa sebagai timbal balik partisipasi.\n\nEstimasi waktu: 12–15 menit. Mohon jujur — kami butuh kondisi nyata, bukan kondisi ideal.",
  closing: "Terima kasih banyak, Bapak/Ibu Guru. Insight Bapak/Ibu sangat berharga untuk kami yang ingin membuat tools yang bener-bener bantu guru, bukan menambah beban.\n\nPT Linguo Edu Indonesia\nEmail: hello@linguo.id",
  sections: [
  {
    title: "Section A: Profil",
    questions: [
      { number: 1, text: "Bahasa yang Anda ajarkan di sekolah ini", tag: "MULTI", required: true, options: ["Inggris","Mandarin","Jepang","Korea","Arab","Jerman","Prancis","Spanyol","Belanda"], hasOther: true },
      { number: 2, text: "Sekolah/institusi tempat mengajar", tag: "TEXT", required: true },
      { number: 3, text: "Status mengajar di sekolah ini", tag: "SINGLE", required: false, options: ["Guru tetap (PNS / yayasan)","Guru honorer / kontrak","Freelance / part-time","Native speaker outsource (vendor)"], hasOther: true },
      { number: 4, text: "Lama mengajar bahasa secara total", tag: "SINGLE", required: false, options: ["< 1 tahun","1 – 3 tahun","3 – 5 tahun","5 – 10 tahun","> 10 tahun"] },
      { number: 5, text: "Sertifikasi/kualifikasi yang dimiliki", tag: "MULTI", required: false, options: ["TEFL / TESOL","CELTA / DELTA","DELF / DALF (French)","HSK Level 4+ atau setara (Mandarin)","JLPT N3 atau setara (Japanese)","TOPIK 5+ atau setara (Korean)","Goethe-Zertifikat (German)","S1 Sastra / Pendidikan Bahasa","S2 Linguistik / Pendidikan Bahasa","Native speaker (bahasa target = bahasa ibu)","Tidak ada sertifikasi formal"] }
    ],
  },
  {
    title: "Section B: Workflow Mengajar",
    questions: [
      { number: 6, text: "Berapa kelas/sesi per minggu yang Anda ajar di sekolah ini?", tag: "NUMBER", required: false },
      { number: 7, text: "Berapa total siswa yang Anda handle di sekolah ini?", tag: "NUMBER", required: false },
      { number: 8, text: "Sumber materi mengajar", tag: "MULTI", required: false, options: ["Buku teks resmi sekolah","Materi yang disediakan sekolah","Buat sendiri dari nol","Internet (random search)","YouTube / video edukasi","Buku/platform online berbayar","Materi dari kursus/training"], hasOther: true },
      { number: 9, text: "Berapa jam per minggu Anda spend untuk prep materi & lesson plan?", tag: "SINGLE", required: false, options: ["< 2 jam","2 – 5 jam","5 – 10 jam","> 10 jam"] },
      { number: 10, text: "Bagaimana cara Anda delivery materi ke siswa?", tag: "LONGTEXT", required: false, helpText: "contoh: PPT print out, share link Drive, kirim WA, tulis di papan, dll" },
      { number: 11, text: "Tools/aplikasi yang dipakai untuk session online (saat hybrid atau online-only)", tag: "MULTI", required: false, options: ["Zoom","Google Meet","Microsoft Teams","WhatsApp Video","Tatap muka only (tidak ada online)"], hasOther: true },
      { number: 12, text: "Bagaimana cara Anda assign quiz / PR ke siswa?", tag: "LONGTEXT", required: false, helpText: "contoh: print soal, kirim PDF di WA, Google Forms, dll" },
      { number: 13, text: "Bagaimana cara grading quiz / PR?", tag: "SINGLE", required: false, options: ["Manual paper (koreksi tulisan tangan)","Manual digital (input nilai ke Excel/Sheets)","Online auto-grade (Google Forms / Quizizz / Kahoot)","Mix beberapa cara","Tidak grading rutin"] },
      { number: 14, text: "Berapa jam per minggu Anda spend untuk grading & feedback?", tag: "SINGLE", required: false, options: ["< 2 jam","2 – 5 jam","5 – 10 jam","> 10 jam"] },
      { number: 15, text: "Cara komunikasi dengan siswa di luar jam kelas", tag: "MULTI", required: false, options: ["WhatsApp pribadi (1-on-1)","WhatsApp Group kelas","Email","LMS / portal sekolah","Tidak rutin / hanya saat darurat"], hasOther: true }
    ],
  },
  {
    title: "Section C: Pain Points",
    questions: [
      { number: 16, text: "Top 3 pain dalam mengajar bahasa di sekolah (rank top 3)", tag: "RANK", required: false, options: ["Prep materi & lesson plan makan waktu","Cari materi berkualitas (terutama untuk niche bahasa) susah","Engagement siswa rendah (males ikut, gak fokus)","Grading manual lama & repetitif","Komunikasi dengan ortu via WA ribet","Tracking progress siswa manual","Kelas hybrid/online tidak smooth","Generating rapor end-of-term beban berat","Schedule changes mendadak","Siswa beda level dalam 1 kelas (mixed ability)","Kelas terlalu besar (>20 siswa)","Tidak ada feedback / dukungan dari sekolah"], topN: 3 },
      { number: 17, text: "Berapa frequency siswa absent / skip kelas Anda?", tag: "SINGLE", required: false, options: ["< 10% (jarang)","10 – 25%","25 – 50%","> 50% (sering banget)"] },
      { number: 18, text: "Bagaimana cara Anda follow-up siswa yang ketinggalan?", tag: "LONGTEXT", required: false },
      { number: 19, text: "Apa yang menurut pengalaman Anda bikin siswa engaged dalam pelajaran bahasa?", tag: "LONGTEXT", required: false },
      { number: 20, text: "Apa yang bikin siswa males belajar bahasa?", tag: "LONGTEXT", required: false },
      { number: 21, text: "Tools / teknik yang Anda merasa SUDAH efektif dalam mengajar bahasa selama ini", tag: "LONGTEXT", required: false },
      { number: 22, text: "Tools / teknik yang Anda merasa BELUM efektif atau butuh banget tapi belum punya", tag: "LONGTEXT", required: false },
      { number: 23, text: "Berapa familiar Anda dengan AI tools (ChatGPT, Claude, Gemini, dll.) untuk teaching?", tag: "LIKERT5", required: false, likertLow: "Belum pernah pakai", likertHigh: "Sangat sering pakai untuk teaching" }
    ],
  },
  {
    title: "Section D: Wishlist & Solution Fit",
    questions: [
      { number: 24, text: "Fitur platform yang akan paling membantu Anda mengajar bahasa (rank top 5)", tag: "RANK", required: false, options: ["Library materi siap pakai per bahasa & level (slides, video, audio)","Quiz bank dengan auto-grade","AI suggestion materi/topik untuk lesson plan","Attendance 1-tap mobile (gak ribet)","Live session dengan materi side-panel (slides next to video)","Channel chat dengan siswa terstruktur (bukan WA pribadi)","Speech recognition pronunciation feedback (siswa latihan ngomong)","Auto-generate rapor draft (cuma butuh review)","Lesson plan generator (template per topik)","Student progress dashboard (lihat individual)","Mobile app untuk akses on-the-go","AI co-teacher (jawab pertanyaan siswa di luar jam kelas)","Game-like exercise siswa (gamification)"], topN: 5 },
      { number: 25, text: "Apakah Anda willing pakai AI assistant untuk grading & lesson plan?", tag: "SINGLE", required: false, options: ["Sangat willing — udah pakai ChatGPT secara informal","Willing — kalau dipandu/training dulu","Neutral — tergantung implementasi","Hesitant — concern privacy / quality","Tidak — prefer manual"] },
      { number: 26, text: "Kalau platform ini cocok dengan kebutuhan Anda, apakah Anda akan rekomendasi ke sekolah?", tag: "LIKERT5", required: false, likertLow: "Tidak akan rekomendasi", likertHigh: "Sangat akan rekomendasi" },
      { number: 27, text: "Hal yang paling bikin Anda capek saat mengajar bahasa di sekolah?", tag: "LONGTEXT", required: false },
      { number: 28, text: "\"Magic feature\" yang bikin Anda jatuh cinta dengan tools mengajar bahasa?", tag: "LONGTEXT", required: false }
    ],
  },
  {
    title: "Section E: Closing",
    questions: [
      { number: 29, text: "Bersediakah Anda interview lanjutan 60 menit (online, sebagai timbal balik kami sediakan akses Simulasi TOEFL Linguo + e-book bahasa pilihan)?", tag: "YESNO", required: false },
      { number: 30, text: "Email atau WA untuk follow-up / kirim insentif", tag: "TEXT", required: false }
    ],
  }
  ],
};

export const SISWA_KUESIONER: Kuesioner = {
  id: "siswa",
  slug: "siswa",
  title: "Kuesioner #4: Siswa (SMP / SMA / Universitas)",
  shortTitle: "Siswa",
  audienceLabel: "Siswa SMP / SMA / Mahasiswa",
  estimatedMinutes: "5–7 menit",
  voucherAmount: "Akses gratis Simulasi TOEFL Linguo untuk sekolah Anda",
  accentColor: "sky",
  intro: "Hai! 👋\n\nKami dari Linguo lagi bikin app belajar bahasa baru buat sekolah, dan kami pengen tau kamu lebih suka belajar bahasa kayak gimana.\n\nIni bukan tugas, bukan ujian. Jujur aja gimana pengalaman kamu — gak ada jawaban salah!\n\nBonus: Sekolahmu bakal dapet akses gratis Simulasi TOEFL Linguo (kamu juga bisa pakai!) kalau cukup banyak siswa di sekolah kamu yang isi kuesioner ini.\n\nWaktu: cuma 5–7 menit. Bisa diisi via HP. Yuk mulai!",
  closing: "Makasih banget udah luangin waktu! 🙌\n\nSekolahmu akan dapet akses Simulasi TOEFL Linguo dalam 3–7 hari kerja setelah cukup banyak siswa partisipasi.\n\nMau tau update Linguo? Follow @linguo.id di Instagram & TikTok.\n\nKalau ada pertanyaan: hello@linguo.id\n\n— Tim Linguo",
  sections: [
  {
    title: "Section A: Profil Singkat",
    questions: [
      { number: 1, text: "Kamu sekarang kelas/jenjang apa?", tag: "SINGLE", required: false, options: ["SMP (kelas 7–9)","SMA / SMK (kelas 10–12)","Mahasiswa S1","Mahasiswa S2 / S3"], hasOther: true },
      { number: 2, text: "Sekolah/kampus kamu (nama)", tag: "TEXT", required: true },
      { number: 3, text: "Bahasa asing apa aja yang kamu pelajari di sekolah/kampus saat ini?", tag: "MULTI", required: false, options: ["Inggris","Mandarin","Jepang","Korea","Arab","Jerman","Prancis","Spanyol","Belanda"], hasOther: true },
      { number: 4, text: "Bahasa apa yang kamu pengen banget bisa, tapi belum diajarin sekolah?", tag: "TEXT", required: false }
    ],
  },
  {
    title: "Section B: Pengalaman Belajar Bahasa di Sekolah",
    questions: [
      { number: 5, text: "Seberapa enjoy kamu belajar bahasa di sekolah?", tag: "LIKERT5", required: false, likertLow: "Bosen banget 😴", likertHigh: "Suka banget 🤩" },
      { number: 6, text: "Hal yang paling kamu suka dari pelajaran bahasa di sekolah?", tag: "LONGTEXT", required: false, helpText: "tulis singkat aja, 1–2 kalimat" },
      { number: 7, text: "Hal yang paling membosankan / bikin males dari pelajaran bahasa di sekolah?", tag: "LONGTEXT", required: false },
      { number: 8, text: "Aplikasi belajar bahasa yang pernah kamu pakai (di luar sekolah / sendiri)", tag: "MULTI", required: false, options: ["Duolingo","Cake (English)","Lingoda","Babbel","Memrise","Linguo (linguo.id)","Cakap","Italki","Preply","HelloChinese (Mandarin)","Drops","Busuu","Tidak pernah pakai app"], hasOther: true },
      { number: 9, text: "Aplikasi belajar bahasa yang paling efektif menurut kamu, dan kenapa?", tag: "LONGTEXT", required: false },
      { number: 10, text: "Berapa jam per minggu kamu belajar bahasa di luar jam sekolah (sendiri / app / kursus)?", tag: "SINGLE", required: false, options: ["0 (gak pernah di luar sekolah)","< 1 jam","1 – 3 jam","3 – 5 jam","> 5 jam"] }
    ],
  },
  {
    title: "Section C: Apa yang Bikin Kamu Engaged",
    questions: [
      { number: 11, text: "Apa yang bikin kamu SEMANGAT belajar bahasa?", tag: "MULTI", required: false, options: ["Bisa ngobrol langsung dengan native speaker","Lulus ujian / nilai bagus","Pengen travel ke negara tersebut","Bisa nonton film / drama / anime tanpa subtitle","Karir / kerjaan masa depan","Pacar / teman dari negara tersebut","Suka konten bahasa tersebut (musik, drama, anime, K-pop, dll.)","Pengen pamer / unique skill"], hasOther: true },
      { number: 12, text: "Apa yang bikin kamu MALES belajar bahasa?", tag: "MULTI", required: false, options: ["Materi monoton / itu-itu aja","Guru kurang engaging / boring","Materi terlalu susah, gak ngerti","Materi terlalu gampang, bosen","Gak ada feedback (gak tau bener apa salah)","Cuma hapalan kosakata / grammar","Banyak tugas / PR","Gak relevan dengan kehidupan / minat"], hasOther: true },
      { number: 13, text: "Kamu lebih prefer belajar bahasa dengan...", tag: "SINGLE", required: false, options: ["Live class formal (guru live)","Self-paced game-like (kayak Duolingo, sendiri)","Mix antara live + self-paced","Tatap muka langsung dengan native speaker","Video lessons (nonton, gak interaktif)"], hasOther: true },
      { number: 14, text: "Device utama yang kamu pakai untuk belajar / akses materi", tag: "SINGLE", required: false, options: ["Smartphone / HP","Tablet","Laptop pribadi","PC / komputer sekolah","Buku fisik (gak digital)"] },
      { number: 15, text: "Apakah kamu sering chat dengan guru bahasa di luar jam sekolah (untuk tanya / klarifikasi)?", tag: "SINGLE", required: false, options: ["Sering banget","Kadang-kadang","Jarang","Gak pernah"] }
    ],
  },
  {
    title: "Section D: Wishlist Kamu",
    questions: [
      { number: 16, text: "Fitur yang kamu pengen ada di app belajar bahasa dari sekolah (rank top 5)", tag: "RANK", required: false, options: ["Game-like learning (achievements, level, badges)","Leaderboard kelas (kompetisi sama temen)","Native speaker chat practice","AI conversation practice (latihan ngobrol pakai AI)","Video lessons short-form (kayak TikTok / Reels)","Konten K-pop / anime / film terintegrasi","Self-paced practice (latihan sendiri kapan aja)","Streak / reward system (rajin = dapet hadiah)","Voice / speech practice dengan feedback (latihan ngomong dikoreksi)","Group challenge mode (latihan bareng temen)","Materi bisa di-download offline","Recap kelas yang aku absen","Quiz interaktif yang fun","Catatan otomatis dari kelas"], topN: 5 },
      { number: 17, text: "Apakah kamu willing belajar bahasa via app mobile pasangan dari sekolah?", tag: "LIKERT5", required: false, likertLow: "Gak mau", likertHigh: "Mau banget" },
      { number: 18, text: "Kalau kamu bisa bikin app belajar bahasa dari nol, fitur apa yang wajib ada?", tag: "LONGTEXT", required: false }
    ],
  },
  {
    title: "Section E: Closing",
    questions: [
      { number: 19, text: "Boleh kasih usulan / kritik untuk sekolah lo soal pelajaran bahasa? (anonim)", tag: "LONGTEXT", required: false },
      { number: 20, text: "Nama panggilan + email/WA untuk follow-up dan info akses Simulasi TOEFL", tag: "TEXT", required: true }
    ],
  }
  ],
};

export const ALL_KUESIONERS: Kuesioner[] = [
  KEPSEK_KUESIONER,
  KOORDINATOR_KUESIONER,
  GURU_KUESIONER,
  SISWA_KUESIONER,
];

export const KUESIONER_BY_SLUG: Record<PersonaSlug, Kuesioner> = {
  'kepala-sekolah': KEPSEK_KUESIONER,
  'koordinator': KOORDINATOR_KUESIONER,
  'guru': GURU_KUESIONER,
  'siswa': SISWA_KUESIONER,
};

export const KUESIONER_BY_ID: Record<PersonaId, Kuesioner> = {
  kepsek: KEPSEK_KUESIONER,
  koordinator: KOORDINATOR_KUESIONER,
  guru: GURU_KUESIONER,
  siswa: SISWA_KUESIONER,
};

export function getTotalQuestions(k: Kuesioner): number {
  return k.sections.reduce((sum, s) => sum + s.questions.length, 0);
}

export function isAnswered(q: Question, value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0 && value.some(v => v !== '' && v !== null);
  if (typeof value === 'number') return true;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return false;
}
