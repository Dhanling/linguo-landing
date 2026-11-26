// [#f67267e2] Silabus PTE Academic untuk dashboard siswa (tab Materi kelas & slide).
// SALINAN dari repo dashboard src/data/silabus/pte.ts (5 tahap × 16 sesi), yang
// sendiri berasal dari src/lib/pteSyllabus.ts (PTE_MODULES) di repo ini. Kalau
// silabus di dashboard berubah, salin lagi ke sini. Dek slide-nya TIDAK di sini:
// di-fetch dari teach.linguo.id/dek-siswa/pte-<kode>.json (lib/dekSilabusSiswa).
//
// Sengaja TIDAK didaftarkan di languages.ts / index.ts: halaman publik PTE ada di
// /persiapan-tes/pte (/silabus/pte dialihkan ke sana). Modul ini hanya dimuat lewat
// import dinamis lib/silabusSesi & komponen SilabusOutline.
//
// Level registrasi PTE berisi level Inggris umum siswa (A2.2, B1.1, kosong) —
// lib/silabusKelas hanya memetakan level PERSIS B1.2/B2.1/B2.2/C1.1 ke tahap itu,
// sisanya ke B1.1 Foundation.
//
// ---- catatan asli dari dashboard ----
// [silabus-pte-v1] SALINAN silabus PTE Academic dari repo landing
// (linguo-landing/src/lib/pteSyllabus.ts, PTE_MODULES — rencana paket 16 sesi:
// satu modul satu sesi). Dipakai menu Silabus & tabel Materi pengajar. Kalau
// modul di landing diubah, salin lagi ke sini dan sesuaikan
// src/data/dekSilabus/pte-b1-1.ts.
//
// [silabus-pte-v3] PTE kini 5 tahap × 16 sesi (80 sesi), meniru IELTS:
//   B1.1 Foundation          — 16 sesi tadi (paket landing; TIDAK berubah)
//   B1.2 Core Drill          — drill intensif per tipe soal, target 50–65
//   B2.1 Advanced            — kualitas jawaban (fluency, pelafalan, esai &
//                              ringkasan skor tinggi, kosakata akademik), 65–79
//   B2.2 Exam Mastery        — mock penuh berkala, pola kesalahan, hari-H, 79+
//   C1.1 Mock & Klinik       — siklus 16 sesi yang BOLEH DIULANG (bank soal)
// Paket 8 & 12 sesi di landing tetap memakai B1.1; tahap lanjutan hanya untuk
// siswa yang memperpanjang kelas supaya tidak mengulang sesi 1–16.
//
// `registrations.level` kelas PTE/IELTS di prod berisi level Inggris umum siswa
// (A1, A2.2, B1.1, kosong), BUKAN tahap program. Karena itu loadSilabusLevel
// (src/lib/silabusSesi.ts) hanya memetakan level yang PERSIS "B1.2", "B2.1",
// "B2.2" atau "C1.1" ke tahap itu; nilai lain apa pun jatuh ke B1.1. Admin yang
// menaikkan kelas lanjutan cukup mengisi level B1.2 → B2.1 → B2.2 → C1.1.
// Kode sublevel mengikuti pola kunci dek `<slug>-<abc><12>-<n>`.
import type { LanguageCurriculum, LanguageMeta, SessionPreview } from "../types";

const meta: LanguageMeta = {
  slug: "pte",
  name: "PTE Academic",
  nativeName: "PTE Academic",
  flag: "🎓",
  region: "european",
  available: true,
  description: "Persiapan PTE Academic Private 1-on-1 — 5 tahap × 16 sesi.",
};

type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

// ============================================================
// B1.1 · PTE FOUNDATION · 16 SESI (format sejak 7 Agustus 2025)
// Paket 8 & 12 sesi menggabung modul — lihat `overview`.
// ============================================================
const ptePrep = toSessions([
  [1,  "Peta tes, diagnostik & target skor",                                  ["format 3 bagian, 22 tipe soal", "cara penilaian mesin", "Personal Introduction", "diagnostik & target skor"]],
  [2,  "Read Aloud & Repeat Sentence",                                        ["pemenggalan & tekanan kata", "mengulang kalimat sekali dengar", "oral fluency"]],
  [3,  "Describe Image",                                                      ["kerangka 40 detik", "grafik, tabel, proses, peta", "memakai 25 detik persiapan"]],
  [4,  "Retell Lecture & Summarize Group Discussion",                         ["catatan kata kunci", "retell 40 detik", "rangkuman diskusi 3 orang"]],
  [5,  "Respond to a Situation, Answer Short Question & klinik pelafalan",    ["respons situasi 40 detik", "jawaban 1–2 kata", "bunyi yang sering meleset"]],
  [6,  "Summarize Written Text",                                              ["gagasan utama teks ≤300 kata", "satu kalimat 5–75 kata", "manajemen 10 menit"]],
  [7,  "Write Essay 1: membaca prompt & menyusun kerangka",                   ["jenis prompt", "kerangka 4 paragraf", "esai 200–300 kata dalam 20 menit"]],
  [8,  "Write Essay 2: bahasa & penyuntingan",                                ["ragam tata bahasa & kosakata", "koherensi & penghubung", "bedah & sunting esai"]],
  [9,  "Fill in the Blanks: Dropdown & Drag and Drop",                        ["kolokasi", "petunjuk tata bahasa di sekitar celah", "menyaring pengecoh"]],
  [10, "Reorder Paragraph & Multiple Choice",                                 ["kalimat pembuka & kata rujukan", "single answer", "multiple answers & nilai minus"]],
  [11, "Set Reading berwaktu",                                                ["satu bagian Reading utuh 23–30 menit", "pembagian waktu per tipe soal", "analisis kesalahan"]],
  [12, "Summarize Spoken Text",                                               ["catatan audio 60–90 detik", "ringkasan 50–70 kata", "cek tata bahasa & ejaan"]],
  [13, "Listening pilihan ganda & ringkasan",                                 ["MCMA & MCSA", "Highlight Correct Summary", "Select Missing Word"]],
  [14, "Fill in the Blanks, Highlight Incorrect Words & Write from Dictation", ["ketik kata yang hilang", "ikuti transkrip tanpa asal klik", "dikte kalimat utuh"]],
  [15, "Mock test Part 1: Speaking & Writing",                                ["simulasi berwaktu Part 1", "umpan balik per tipe soal", "daftar perbaikan pribadi"]],
  [16, "Mock test Reading & Listening + strategi hari tes",                   ["simulasi Part 2 & 3", "pola kesalahan", "cek mikrofon & headset, strategi hari-H"]],
]);

// ============================================================
// B1.2 · CORE DRILL · 16 sesi — soal lebih sulit, target skor 50–65
// ============================================================
const pteCoreDrill = toSessions([
  [1,  "Diagnostik ulang & peta kelemahan per tipe soal",              ["diagnostik 22 tipe soal", "peta kuat–lemah per skill", "target skor 50–65 dan jadwal drill"]],
  [2,  "Drill Read Aloud: teks akademik panjang & kata sulit",          ["membaca ke depan 1–2 frasa", "kata ilmiah multisuku", "memperbaiki ralat tanpa berhenti"]],
  [3,  "Drill Repeat Sentence: kalimat 12–20 kata",                     ["memegang makna, bukan bunyi", "chunking dan jeda", "mengganti kata yang lupa tanpa macet"]],
  [4,  "Drill Describe Image: grafik rumit, peta & proses",             ["grafik dua seri dan tabel padat", "peta dan diagram alur", "kesimpulan tepat dalam 40 detik"]],
  [5,  "Drill Retell Lecture: kuliah 90 detik",                          ["catatan simbol dan singkatan", "urutan sebab–akibat", "retell tanpa menyalin kalimat dosen"]],
  [6,  "Drill Summarize Group Discussion & Respond to a Situation",     ["memisahkan tiga pembicara", "menanggapi situasi formal dan informal", "nada dan register yang tepat"]],
  [7,  "Drill Answer Short Question & Personal Introduction",           ["pengetahuan umum cepat", "kosakata sehari-hari yang sering diuji", "perkenalan diri rapi di bawah 30 detik"]],
  [8,  "Drill Summarize Written Text: teks 250–300 kata",               ["satu kalimat panjang yang sah", "menggabung gagasan dengan penghubung", "mengatur 10 menit"]],
  [9,  "Drill Write Essay: enam jenis prompt dalam 20 menit",           ["opini, diskusi, masalah–solusi", "kerangka cepat 3 menit", "memeriksa form sebelum Next"]],
  [10, "Drill Reading: Fill in the Blanks (Dropdown & Drag and Drop)",  ["kolokasi dan preposisi", "kata fungsi vs kata isi", "menyaring pengecoh yang mirip"]],
  [11, "Drill Reading: Reorder Paragraph, MCSA & MCMA",                 ["rantai referensi dan konektor", "teks abstrak dan sanggahan", "strategi nilai minus"]],
  [12, "Drill Part 2 Reading berwaktu: set penuh & analisis waktu",     ["satu timer untuk lima tipe", "alokasi menit per tipe", "log kesalahan per tipe"]],
  [13, "Drill Summarize Spoken Text",                                    ["catatan dari audio 60–90 detik", "50–70 kata dengan gagasan utama dan pendukung", "tata bahasa dan ejaan cepat"]],
  [14, "Drill Listening: MCMA, MCSA, Highlight Correct Summary & Select Missing Word", ["menebak arah audio", "menyingkirkan ringkasan menyimpang", "kata hilang di akhir rekaman"]],
  [15, "Drill Listening: Fill in the Blanks, Highlight Incorrect Words & Write from Dictation", ["mengetik sambil mendengar", "mengikuti transkrip tanpa asal klik", "dikte kalimat 12–18 kata"]],
  [16, "Mock Core Drill: simulasi ringkas Part 1–3 & skor 50–65",       ["simulasi berwaktu 3 bagian", "pemetaan skor ke tipe soal", "perbaikan sebelum naik ke Advanced"]],
]);

// ============================================================
// B2.1 · ADVANCED · 16 sesi — kualitas jawaban, target skor 65–79
// ============================================================
const pteAdvanced = toSessions([
  [1,  "Dari 65 ke 79: membaca profil skor & enabling skills",           ["enabling skills (grammar, fluency, vocabulary, dll.)", "profil skor per skill", "tiga prioritas kualitas"]],
  [2,  "Oral fluency: ritme, jeda & penghubung lisan",                    ["jeda bermakna vs ragu-ragu", "frasa penghubung pengganti filler", "kecepatan 130–160 kata/menit"]],
  [3,  "Pronunciation I: vokal, diftong & bunyi sulit penutur Indonesia", ["pasangan minimal (ship/sheep)", "konsonan akhir dan gugus konsonan", "th, v/w, schwa"]],
  [4,  "Pronunciation II: tekanan kata & kalimat, intonasi",              ["tekanan suku kata pada kata akademik", "kata isi vs kata fungsi", "nada naik–turun saat membaca"]],
  [5,  "Read Aloud & Repeat Sentence untuk skor tinggi",                  ["integrasi pelafalan dan fluency", "frasa utuh dengan ritme alami", "ketepatan isi tanpa kehilangan irama"]],
  [6,  "Describe Image & Respond to a Situation: bahasa analitis",       ["kata kerja tren dan perbandingan", "hedging dan kesimpulan", "register dan empati dalam situasi"]],
  [7,  "Retell Lecture & Summarize Group Discussion: sintesis & parafrasa", ["menggabung gagasan alih-alih daftar", "parafrasa kata kunci", "menandai posisi tiap pembicara"]],
  [8,  "Kosakata akademik I: kolokasi & kata kerja ilmiah",               ["kolokasi tetap (draw a conclusion)", "kata kerja pelaporan", "keluarga kata"]],
  [9,  "Kosakata akademik II: parafrasa, hedging & nominalisasi",         ["sinonim sesuai konteks", "hedging (tend to, appear to)", "nominalisasi untuk kalimat padat"]],
  [10, "Summarize Written Text skor tinggi: satu kalimat kompleks",       ["struktur klausa terikat", "menghemat kata tanpa kehilangan isi", "cek form dan tata bahasa 60 detik terakhir"]],
  [11, "Write Essay skor tinggi I: argumen & pengembangan",               ["tesis jelas dan argumen spesifik", "contoh yang relevan", "kedalaman, bukan panjang"]],
  [12, "Write Essay skor tinggi II: koherensi, variasi kalimat & penyuntingan", ["variasi struktur kalimat", "referensi dan transisi", "daftar penyuntingan 3 menit"]],
  [13, "Reading lanjut: teks akademik padat & Reorder Paragraph tingkat tinggi", ["kosakata abstrak dalam konteks", "alur argumen dan kontras", "kecepatan baca terarah"]],
  [14, "Reading inferensi: nuansa, sikap penulis & MCMA",                 ["membedakan fakta, pendapat, implikasi", "opsi hampir benar", "manajemen waktu dan nilai minus"]],
  [15, "Listening lanjut: Summarize Spoken Text skor tinggi & detail",     ["catatan terstruktur dari kuliah", "parafrasa dalam ringkasan", "aksen dan kecepatan beragam"]],
  [16, "Listening presisi: Incorrect Words, Dictation, Missing Word & evaluasi tahap", ["ketepatan ejaan dikte", "deteksi ketidakcocokan halus", "profil kualitas jawaban sebelum Exam Mastery"]],
]);

// ============================================================
// B2.2 · EXAM MASTERY · 16 sesi — mock penuh, pola kesalahan, hari-H, 79+
// ============================================================
const pteExamMastery = toSessions([
  [1,  "Audit skor & rencana 16 sesi menuju 79+",                          ["skor, skill minimum, dan tenggat", "audit kekuatan dan kebocoran", "kalender mock dan klinik"]],
  [2,  "Mock 1 · Part 1 Speaking & Writing (penuh)",                       ["simulasi berwaktu tanpa jeda", "rekaman dan arsip jawaban", "disiplin timer"]],
  [3,  "Bedah Mock 1 Part 1: pola kesalahan Speaking & Writing",            ["kesalahan form dan waktu", "pola fluency dan pelafalan", "daftar perbaikan per tipe soal"]],
  [4,  "Mock 1 · Part 2 Reading & Part 3 Listening (penuh)",               ["satu timer Reading", "audio sekali putar", "catatan ritme konsentrasi"]],
  [5,  "Bedah Mock 1 Part 2–3 & perbaikan terarah",                         ["salah karena isi vs karena waktu", "nilai minus yang terbuang", "drill ulang tipe terlemah"]],
  [6,  "Klinik 79+ Speaking: fluency & pelafalan di bawah tekanan",         ["menjaga kualitas di soal terakhir", "pemulihan setelah kata macet", "bicara jelas dengan headset"]],
  [7,  "Klinik 79+ Writing: ringkasan & esai",                              ["isi relevan (ditinjau penilai manusia)", "kalimat tepat dan beragam", "kontrol 20 menit esai"]],
  [8,  "Klinik 79+ Reading & Listening: akurasi & waktu",                   ["kesalahan kecil yang berulang", "keputusan cepat tanpa gegabah", "strategi menebak yang masuk akal"]],
  [9,  "Mock 2 · simulasi penuh satu kali duduk",                           ["Part 1–3 berurutan ±2 jam", "jeda dan energi", "pencatatan waktu nyata"]],
  [10, "Bedah Mock 2 & pola kesalahan lintas mock",                         ["membandingkan Mock 1 dan 2", "tipe soal yang tetap bocor", "perubahan strategi"]],
  [11, "Manajemen waktu & energi dalam tes ±2 jam",                         ["pembagian perhatian Part 1–3", "istirahat singkat dan fokus", "tidak terjebak di satu soal"]],
  [12, "Strategi hari-H: logistik, aturan & peralatan",                     ["persiapan sehari sebelumnya", "aturan pusat tes dan identitas (cek Pearson)", "tes mikrofon dan headset"]],
  [13, "Menghadapi kejutan: soal asing, audio buruk & blank",               ["soal tak dikenal tetap dijawab", "audio atau gambar sulit", "pulih dari kosong"]],
  [14, "Mock 3 · kondisi hari-H",                                           ["simulasi lengkap dengan aturan tes", "tanpa interupsi pengajar", "refleksi langsung"]],
  [15, "Bedah Mock 3 & daftar perbaikan akhir",                             ["perbandingan tiga mock", "tiga perbaikan terakhir", "latihan fokus sisa hari"]],
  [16, "Persiapan terakhir: rencana 48 jam & langkah kalau skor kurang",     ["rutinitas 48 jam", "rencana tes ulang", "keputusan skor dan tenggat lembaga"]],
]);

// ============================================================
// C1.1 · MOCK & KLINIK · 16 sesi — SIKLUS BERULANG
// Tiap sesi = prosedur + bank soal yang bisa dipakai lagi di siklus berikutnya
// (ambil set bank berikutnya, klinik memakai tipe terlemah siswa saat itu).
// ============================================================
const pteMockKlinik = toSessions([
  [1,  "Cara memakai siklus: prosedur, lembar kemajuan & bank soal",        ["alur 16 sesi dan cara mengulang", "lembar kemajuan dan tipe terlemah", "memilih set bank soal berikutnya"]],
  [2,  "Mock A · Part 1 Speaking & Writing",                                ["prosedur mock berwaktu", "bank soal Speaking & Writing set A", "pencatatan skor sementara"]],
  [3,  "Bedah Mock A & penetapan klinik",                                    ["pola kesalahan Part 1", "tiga tipe terlemah siklus ini", "target klinik"]],
  [4,  "Klinik Speaking I: Read Aloud, Repeat Sentence & Describe Image",   ["prosedur klinik tipe terlemah", "bank soal set A", "ukuran lulus klinik"]],
  [5,  "Klinik Speaking II: Retell, Group Discussion, Situation & Short Question", ["bank soal set A", "perbaikan terarah", "cek ulang kriteria"]],
  [6,  "Mock B · Part 2 Reading & Part 3 Listening",                         ["prosedur mock berwaktu", "bank soal Reading & Listening set B", "analisis waktu"]],
  [7,  "Bedah Mock B & Klinik Reading",                                      ["pola kesalahan Reading", "bank soal Fill in the Blanks, Reorder, MC", "ukuran lulus klinik"]],
  [8,  "Klinik Listening",                                                   ["bank Summarize Spoken Text, MCMA, Highlight, Dictation", "perbaikan terarah", "cek ulang"]],
  [9,  "Klinik Writing: Summarize Written Text & Write Essay",               ["bank prompt set A", "umpan balik form dan isi", "ukuran lulus klinik"]],
  [10, "Mock C · penuh Part 1–3",                                            ["prosedur mock penuh", "bank soal set C", "disiplin timer"]],
  [11, "Bedah Mock C & peta tren tiga mock",                                  ["tren skor Mock A, B, C", "tipe yang membaik dan yang tetap", "rencana klinik berikutnya"]],
  [12, "Klinik lintas skill: tipe terintegrasi",                              ["Read Aloud, Repeat Sentence, Summarize Spoken Text, Dictation", "bank soal set B", "ukuran lulus klinik"]],
  [13, "Klinik kecepatan, ketahanan & nilai minus",                           ["latihan timer ketat", "keputusan cepat", "bank MCMA dan Highlight set B"]],
  [14, "Mock D · penuh kondisi hari-H",                                       ["prosedur lengkap tanpa jeda", "bank soal set D", "refleksi langsung"]],
  [15, "Bedah Mock D & klinik tipe sisa",                                     ["perbandingan empat mock", "klinik tipe yang masih lemah", "bank soal set C"]],
  [16, "Penutup siklus: lembar kemajuan & rencana siklus berikutnya",         ["rekap tipe terlemah", "memilih set bank untuk siklus ulang", "keputusan lanjut atau tes"]],
]);

const curriculum: LanguageCurriculum = {
  meta,
  overview:
    "Persiapan PTE Academic Private 1-on-1 dalam 5 tahap × 16 sesi (80 sesi), mengikuti format terbaru sejak 7 Agustus 2025: Part 1 Speaking & Writing, Part 2 Reading, Part 3 Listening — 22 tipe soal, ±2 jam, skor 10–90. Prasyarat Inggris umum minimal B1. B1.1 Foundation (paket landing): modul per kelompok tipe soal + dua mock. B1.2 Core Drill: latihan intensif per tipe soal, target 50–65. B2.1 Advanced: kualitas jawaban (fluency, pelafalan, esai & ringkasan skor tinggi, kosakata akademik), target 65–79. B2.2 Exam Mastery: mock penuh berkala, analisis pola kesalahan, strategi hari-H, target 79+. C1.1 Mock & Klinik: siklus 16 sesi mock berselang klinik tipe terlemah, bisa diulang dengan bank soal berbeda. Paket 8 sesi menggabung dua modul B1.1 per sesi (m01+02, 03+04, 05+06, 07+08, 09+10, 12+13, 14, 15+16 — set Reading berwaktu jadi PR); paket 12 sesi menggabung m07+08, m10+11, m12+13, m15+16. E-book pendamping: PTE Academic Prep – Skor 65+ (Pustaka).",
  // Kode level dibuat UNIK (B1, B2, C1) dengan dua sublevel di B1 dan B2 — beda
  // dari ielts.ts yang memakai "B1" dua kali; kode kembar membuat tab level
  // kedua di SilabusKatalogPanel tak bisa dibuka (levelCode dicari lewat find).
  levels: [
    {
      code: "B1",
      name: "Foundation & Core Drill",
      description:
        "Foundation: strategi per tipe soal, cara penilaian mesin Pearson, dua mock. Core Drill: latihan intensif per tipe soal dengan materi lebih sulit, target skor 50–65.",
      sublevels: [
        {
          code: "B1.1",
          name: "PTE Foundation",
          sessions: ptePrep,
          preview: true,
        },
        {
          code: "B1.2",
          name: "PTE Core Drill",
          sessions: pteCoreDrill,
          preview: false,
        },
      ],
    },
    {
      code: "B2",
      name: "Advanced & Exam Mastery",
      description:
        "Advanced: kualitas jawaban (fluency, pelafalan, esai dan ringkasan skor tinggi, kosakata akademik), target 65–79. Exam Mastery: mock penuh berkala, analisis pola kesalahan, strategi hari-H, target 79+.",
      sublevels: [
        {
          code: "B2.1",
          name: "PTE Advanced",
          sessions: pteAdvanced,
          preview: false,
        },
        {
          code: "B2.2",
          name: "PTE Exam Mastery",
          sessions: pteExamMastery,
          preview: false,
        },
      ],
    },
    {
      // Tipe Level belum mengenal "C1" (katalog publik hanya A1–B2); modul ini tidak
      // dirender katalog, cukup dibaca silabusSesi/SilabusOutline yang tak bergantung tipe.
      code: "C1" as unknown as LanguageCurriculum["levels"][number]["code"],
      name: "Mock & Klinik",
      description:
        "Siklus 16 sesi yang bisa diulang: mock test berselang dengan klinik tipe soal terlemah, memakai prosedur dan bank soal yang dapat dipakai ulang.",
      sublevels: [
        {
          code: "C1.1",
          name: "PTE Mock & Klinik (bisa diulang)",
          sessions: pteMockKlinik,
          preview: false,
        },
      ],
    },
  ],
};

export default curriculum;
