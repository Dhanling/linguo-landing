// =============================================================================
// [silabus-pte-v1] Silabus kelas Persiapan PTE Academic (Private 1-on-1).
//
// Dipakai halaman /persiapan-tes/pte. TIDAK boleh mengimpor React — sama
// seperti lib/testPrep.ts, supaya bisa ikut dibaca route server.
//
// Bentuknya: 16 MODUL (satu kelompok tipe soal per modul) + tiga RENCANA yang
// memetakan modul ke jumlah sesi paket di PRIVATE_SESSION_OPTS (8 / 12 / 16).
// Paket yang lebih pendek MENGGABUNG modul, bukan menulis silabus sendiri —
// jadi isi tiap tipe soal cuma ditulis sekali di PTE_MODULES.
//
// Fakta tentang tesnya (durasi, batas kata, jumlah tipe soal) mengikuti format
// PTE Academic yang berlaku sejak 7 Agustus 2025 dan HARUS sama dengan daftar
// "Tentang tesnya" di content/ebook/pte-prep/SKEMA.md. Jangan menulis jumlah
// soal per tipe atau bobot skor — Pearson tidak menerbitkannya.
// =============================================================================

import { PRIVATE_SESSION_OPTS } from "./testPrep";

export type PteSkill = "orientasi" | "speaking" | "writing" | "reading" | "listening" | "mock";

export const PTE_SKILL_LABEL: Record<PteSkill, string> = {
  orientasi: "Orientasi",
  speaking: "Speaking",
  writing: "Writing",
  reading: "Reading",
  listening: "Listening",
  mock: "Mock test",
};

export interface PteModule {
  id: string;
  skill: PteSkill;
  title: string;
  /** Tipe soal yang digarap, ditulis persis seperti namanya di tes. */
  itemTypes: string[];
  /** Yang dikerjakan di kelas. */
  points: string[];
  /** Satu kalimat: yang bisa dilakukan siswa sesudah modul ini. */
  hasil: string;
}

export const PTE_MODULES: PteModule[] = [
  {
    id: "m01",
    skill: "orientasi",
    title: "Peta tes, diagnostik & target skor",
    itemTypes: ["Personal Introduction"],
    points: [
      "Format PTE Academic terbaru: 3 bagian, 22 tipe soal, sekitar 2 jam di komputer, skor 10–90",
      "Cara jawabanmu dinilai: content, oral fluency, pronunciation, form, grammar, vocabulary, spelling",
      "Tes diagnostik singkat lintas skill, lalu target skor dan rencana belajar pribadi",
    ],
    hasil: "Kamu tahu posisi awalmu, target skor per skill, dan tipe soal mana yang paling perlu digarap.",
  },
  {
    id: "m02",
    skill: "speaking",
    title: "Read Aloud & Repeat Sentence",
    itemTypes: ["Read Aloud", "Repeat Sentence"],
    points: [
      "Read Aloud: memenggal kalimat per kelompok makna, mengatur jeda dan tekanan kata",
      "Repeat Sentence: menangkap dan mengulang kalimat yang hanya diputar sekali",
      "Oral fluency: irama stabil tanpa mengulang, meralat, atau diam lama (mikrofon berhenti merekam setelah 3 detik hening)",
    ],
    hasil: "Kamu bisa membaca dan mengulang kalimat dengan irama yang rata dan jelas.",
  },
  {
    id: "m03",
    skill: "speaking",
    title: "Describe Image",
    itemTypes: ["Describe Image"],
    points: [
      "Kerangka bicara 40 detik: pembuka, dua–tiga data utama, penutup",
      "Latihan grafik garis, batang, pai, tabel, diagram proses, dan peta",
      "Memakai 25 detik persiapan untuk memilih data yang layak disebut",
    ],
    hasil: "Kamu bisa mendeskripsikan gambar apa pun dengan urutan yang sama tanpa kehabisan kata.",
  },
  {
    id: "m04",
    skill: "speaking",
    title: "Retell Lecture & Summarize Group Discussion",
    itemTypes: ["Retell Lecture", "Summarize Group Discussion"],
    points: [
      "Mencatat cepat saat audio diputar: kata kunci, bukan kalimat utuh",
      "Retell Lecture: menceritakan ulang kuliah singkat dalam 40 detik",
      "Summarize Group Discussion: merangkum diskusi tiga orang, siapa berpendapat apa, dalam 2 menit",
    ],
    hasil: "Kamu bisa mengubah catatan singkat jadi rangkuman lisan yang runtut dan sesuai isi audio.",
  },
  {
    id: "m05",
    skill: "speaking",
    title: "Respond to a Situation, Answer Short Question & klinik pelafalan",
    itemTypes: ["Respond to a Situation", "Answer Short Question"],
    points: [
      "Respond to a Situation: merespons situasi sehari-hari atau kampus dengan isi dan nada yang pas dalam 40 detik",
      "Answer Short Question: jawaban satu–dua kata, kosakata akademik dan pengetahuan umum",
      "Klinik pelafalan: bunyi dan tekanan kata yang paling sering meleset pada penutur Indonesia",
    ],
    hasil: "Kamu bisa merespons spontan tanpa hafalan, dengan pelafalan yang mudah dipahami.",
  },
  {
    id: "m06",
    skill: "writing",
    title: "Summarize Written Text",
    itemTypes: ["Summarize Written Text"],
    points: [
      "Menemukan gagasan utama teks sampai 300 kata",
      "Menulis ringkasan SATU kalimat (5–75 kata) yang tetap benar tata bahasanya",
      "Mengatur 10 menit: baca, rangkai, periksa",
    ],
    hasil: "Kamu bisa meringkas teks akademik jadi satu kalimat majemuk yang memenuhi syarat form.",
  },
  {
    id: "m07",
    skill: "writing",
    title: "Write Essay 1: membaca prompt & menyusun kerangka",
    itemTypes: ["Write Essay"],
    points: [
      "Membedah prompt: jenis pertanyaan dan apa saja yang wajib dijawab",
      "Kerangka empat paragraf untuk esai 200–300 kata dalam 20 menit",
      "Menulis paragraf isi: gagasan, alasan, contoh",
    ],
    hasil: "Kamu bisa menyusun kerangka dan menulis esai utuh dalam batas waktu.",
  },
  {
    id: "m08",
    skill: "writing",
    title: "Write Essay 2: bahasa & penyuntingan",
    itemTypes: ["Write Essay"],
    points: [
      "Ragam tata bahasa dan kosakata akademik yang ikut dinilai",
      "Koherensi: penghubung antarkalimat dan antarparagraf",
      "Bedah esai: membandingkan esai skor menengah dan skor tinggi, lalu menyunting esaimu sendiri",
    ],
    hasil: "Kamu tahu apa yang membedakan esai skor 50-an dari 79+, dan bisa menyunting tulisanmu ke arah itu.",
  },
  {
    id: "m09",
    skill: "reading",
    title: "Fill in the Blanks: Dropdown & Drag and Drop",
    itemTypes: ["Fill in the Blanks (Dropdown)", "Fill in the Blanks (Drag and Drop)"],
    points: [
      "Kolokasi dan pasangan kata yang sering diuji",
      "Membaca petunjuk tata bahasa di sekitar celah: kelas kata, bentuk kata kerja, kata depan",
      "Menyaring pengecoh di bank kata",
    ],
    hasil: "Kamu bisa mengisi celah dengan alasan tata bahasa dan makna, bukan menebak.",
  },
  {
    id: "m10",
    skill: "reading",
    title: "Reorder Paragraph & Multiple Choice",
    itemTypes: ["Reorder Paragraph", "Multiple Choice, Single Answer", "Multiple Choice, Multiple Answers"],
    points: [
      "Reorder Paragraph: mencari kalimat pembuka dan pasangan kalimat lewat kata rujukan dan penghubung",
      "Multiple Choice, Single Answer: memindai teks dan menyingkirkan pengecoh",
      "Multiple Choice, Multiple Answers: kapan memilih dan kapan menahan diri, karena jawaban salah mengurangi nilai",
    ],
    hasil: "Kamu bisa menyusun paragraf dan menjawab pilihan ganda tanpa terjebak nilai minus.",
  },
  {
    id: "m11",
    skill: "reading",
    title: "Set Reading berwaktu",
    itemTypes: ["Seluruh tipe soal Reading"],
    points: [
      "Mengerjakan satu bagian Reading utuh dengan satu timer (23–30 menit)",
      "Pembagian waktu per tipe soal dan kapan harus pindah",
      "Analisis kesalahan: kosakata, tata bahasa, atau kehabisan waktu",
    ],
    hasil: "Kamu punya pembagian waktu sendiri untuk Part 2 dan tahu jenis kesalahanmu.",
  },
  {
    id: "m12",
    skill: "listening",
    title: "Summarize Spoken Text",
    itemTypes: ["Summarize Spoken Text"],
    points: [
      "Mencatat inti audio 60–90 detik",
      "Menulis ringkasan 50–70 kata dalam 10 menit",
      "Memeriksa tata bahasa dan ejaan sebelum waktu habis",
    ],
    hasil: "Kamu bisa merangkum kuliah singkat secara tertulis dengan jumlah kata yang tepat.",
  },
  {
    id: "m13",
    skill: "listening",
    title: "Listening pilihan ganda & ringkasan",
    itemTypes: [
      "Multiple Choice, Multiple Answers",
      "Multiple Choice, Single Answer",
      "Highlight Correct Summary",
      "Select Missing Word",
    ],
    points: [
      "Membaca pilihan sebelum audio diputar supaya tahu apa yang harus didengar",
      "Highlight Correct Summary: mencocokkan catatan dengan ringkasan, bukan kata per kata",
      "Select Missing Word: menebak penutup dari arah pembicaraan",
    ],
    hasil: "Kamu bisa mengikuti audio yang diputar sekali dan memilih jawaban dari catatanmu sendiri.",
  },
  {
    id: "m14",
    skill: "listening",
    title: "Fill in the Blanks, Highlight Incorrect Words & Write from Dictation",
    itemTypes: ["Fill in the Blanks (Type In)", "Highlight Incorrect Words", "Write from Dictation"],
    points: [
      "Fill in the Blanks: mengetik kata yang hilang dengan ejaan yang benar",
      "Highlight Incorrect Words: mengikuti transkrip sambil mendengar, tanpa asal klik karena ada nilai minus",
      "Write from Dictation: mengingat dan mengetik kalimat utuh, tiap kata yang benar dihitung",
    ],
    hasil: "Kamu bisa menangkap kata demi kata dan mengetiknya tanpa salah eja.",
  },
  {
    id: "m15",
    skill: "mock",
    title: "Mock test Part 1: Speaking & Writing",
    itemTypes: ["Seluruh tipe soal Part 1"],
    points: [
      "Simulasi berwaktu Part 1 dengan urutan soal seperti di tes",
      "Umpan balik langsung per tipe soal: isi, kelancaran, pelafalan, tata bahasa",
      "Daftar perbaikan pribadi untuk dilatih sebelum sesi terakhir",
    ],
    hasil: "Kamu sudah merasakan tempo Part 1 dan tahu tiga hal yang harus dibenahi lebih dulu.",
  },
  {
    id: "m16",
    skill: "mock",
    title: "Mock test Reading & Listening + strategi hari tes",
    itemTypes: ["Seluruh tipe soal Part 2 & 3"],
    points: [
      "Simulasi berwaktu Part 2 dan Part 3",
      "Pembahasan jawaban dan pola kesalahanmu",
      "Strategi hari tes: cek mikrofon dan headset, mengatur tenaga, dan apa yang dilakukan kalau blank",
    ],
    hasil: "Kamu masuk ruang tes dengan rencana waktu dan daftar periksa yang sudah diuji.",
  },
];

export type PtePlanSessions = (typeof PRIVATE_SESSION_OPTS)[number];

export interface PtePlanSession {
  /** id modul yang digarap di sesi ini (urut). */
  modules: string[];
  /** Judul sesi kalau modulnya digabung; kosong = judul modul pertama. */
  title?: string;
}

export interface PtePlan {
  sessions: PtePlanSessions;
  label: string;
  /** Untuk siapa paket ini. */
  cocok: string;
  /** Konsekuensi jumlah sesinya, ditulis terus terang. */
  catatan: string;
  plan: PtePlanSession[];
}

export const PTE_PLANS: PtePlan[] = [
  {
    sessions: 8,
    label: "Kilat",
    cocok: "Bahasa Inggrismu sudah kuat (setara B2 atau pernah IELTS 6.5+) dan tinggal mengenal format serta strategi PTE, atau tesmu kurang dari sebulan lagi.",
    catatan: "Dua kelompok tipe soal per sesi. Set Reading berwaktu dikerjakan mandiri sebagai tugas, dan mock test di sesi terakhir versi ringkas.",
    plan: [
      { modules: ["m01", "m02"], title: "Peta tes & target skor + Read Aloud, Repeat Sentence" },
      { modules: ["m03", "m04"], title: "Describe Image, Retell Lecture & Summarize Group Discussion" },
      { modules: ["m05", "m06"], title: "Respond to a Situation, Answer Short Question & Summarize Written Text" },
      { modules: ["m07", "m08"], title: "Write Essay: kerangka, bahasa & penyuntingan" },
      { modules: ["m09", "m10"], title: "Reading: Fill in the Blanks, Reorder Paragraph & Multiple Choice" },
      { modules: ["m12", "m13"], title: "Listening: Summarize Spoken Text & pilihan ganda" },
      { modules: ["m14"] },
      { modules: ["m15", "m16"], title: "Mock test ringkas & strategi hari tes" },
    ],
  },
  {
    sessions: 12,
    label: "Standar",
    cocok: "Levelmu B1–B2 dan kamu mengincar skor 50–65. Tiap skill mendapat porsi yang cukup untuk latihan sekaligus umpan balik.",
    catatan: "Speaking dibahas per kelompok tipe soal; Write Essay, Reading berwaktu, dan mock test masing-masing dipadatkan jadi satu sesi.",
    plan: [
      { modules: ["m01"] },
      { modules: ["m02"] },
      { modules: ["m03"] },
      { modules: ["m04"] },
      { modules: ["m05"] },
      { modules: ["m06"] },
      { modules: ["m07", "m08"], title: "Write Essay: kerangka, bahasa & penyuntingan" },
      { modules: ["m09"] },
      { modules: ["m10", "m11"], title: "Reorder Paragraph, Multiple Choice & set Reading berwaktu" },
      { modules: ["m12", "m13"], title: "Listening: Summarize Spoken Text & pilihan ganda" },
      { modules: ["m14"] },
      { modules: ["m15", "m16"], title: "Mock test ringkas & strategi hari tes" },
    ],
  },
  {
    sessions: 16,
    label: "Lengkap",
    cocok: "Kamu mengincar 65–79+, baru pertama kali ikut tes berbahasa Inggris, atau ada satu skill yang tertinggal jauh dari yang lain.",
    catatan: "Satu modul satu sesi: tiap kelompok tipe soal punya sesinya sendiri, ditambah dua sesi mock test.",
    plan: PTE_MODULES.map((m) => ({ modules: [m.id] })),
  },
];

export const DEFAULT_PTE_PLAN: PtePlanSessions = 16;

export function getPteModule(id: string): PteModule | null {
  return PTE_MODULES.find((m) => m.id === id) ?? null;
}

export function getPtePlan(sessions: number): PtePlan {
  return PTE_PLANS.find((p) => p.sessions === sessions) ?? PTE_PLANS[PTE_PLANS.length - 1];
}

// ── Sekilas tesnya ───────────────────────────────────────────────────────────
export const PTE_TEST_PARTS: { part: string; name: string; duration: string; types: number; contoh: string }[] = [
  {
    part: "Part 1",
    name: "Speaking & Writing",
    duration: "76–84 menit",
    types: 9,
    contoh: "Read Aloud, Repeat Sentence, Describe Image, Retell Lecture, Summarize Group Discussion, Respond to a Situation, Write Essay",
  },
  {
    part: "Part 2",
    name: "Reading",
    duration: "23–30 menit",
    types: 5,
    contoh: "Fill in the Blanks, Reorder Paragraph, Multiple Choice",
  },
  {
    part: "Part 3",
    name: "Listening",
    duration: "31–39 menit",
    types: 8,
    contoh: "Summarize Spoken Text, Highlight Incorrect Words, Write from Dictation",
  },
];

// Konkordansi skor Overall PTE Academic ↔ IELTS Academic (studi Pearson, Juli
// 2025): rentang skor PTE yang setara tiap band IELTS.
export const PTE_IELTS_CONCORDANCE: { ielts: string; pte: string }[] = [
  { ielts: "6.0", pte: "47–54" },
  { ielts: "6.5", pte: "55–62" },
  { ielts: "7.0", pte: "63–70" },
  { ielts: "7.5", pte: "71–78" },
  { ielts: "8.0", pte: "79–85" },
];

// FAQ ini DIRENDER di halaman dan dipakai untuk schema FAQPage — dua-duanya
// harus dari daftar yang sama (lihat faqSchema di lib/schema.ts).
export const PTE_FAQ: { q: string; a: string }[] = [
  {
    q: "Apa bedanya PTE Academic dengan IELTS?",
    a: "PTE Academic seluruhnya dikerjakan di komputer, termasuk Speaking yang direkam lewat mikrofon headset tanpa pewawancara. Tesnya terdiri dari 22 tipe soal pendek, satu soal sering menilai dua skill sekaligus, dan hasilnya biasanya keluar dalam kurang lebih dua hari. Karena itu persiapannya berfokus pada cara kerja tiap tipe soal dan cara penilaiannya.",
  },
  {
    q: "Paket berapa sesi yang sebaiknya saya ambil?",
    a: "Paket 8 sesi cocok kalau bahasa Inggrismu sudah setara B2 dan tinggal mengenal format PTE. Paket 12 sesi untuk level B1–B2 yang mengincar skor 50–65. Paket 16 sesi untuk target 65–79+ atau kalau ini tes bahasa Inggris pertamamu. Sesi pertama selalu diawali diagnostik, jadi pengajar bisa menyarankan penyesuaian sejak awal.",
  },
  {
    q: "Berapa level bahasa Inggris minimal untuk ikut kelas ini?",
    a: "Disarankan minimal B1 (Intermediate). Kelas ini melatih strategi dan tipe soal PTE, bukan mengajarkan bahasa Inggris dari dasar. Kalau levelmu masih di bawah B1, lebih efektif memulai dari kelas General English dulu.",
  },
  {
    q: "Apakah urutan silabusnya bisa disesuaikan?",
    a: "Bisa. Kelas PTE di Linguo saat ini Private 1-on-1, jadi pengajar menyesuaikan urutan dan porsi tiap modul dengan hasil diagnostik, target skor, dan tanggal tesmu. Silabus di halaman ini adalah urutan bakunya.",
  },
  {
    q: "Apakah biaya kelas sudah termasuk biaya tes PTE?",
    a: "Belum. Biaya kelas hanya untuk sesi persiapan bersama pengajar. Pendaftaran dan biaya tes PTE Academic dibayar terpisah langsung ke Pearson.",
  },
  {
    q: "Apakah ada mock test?",
    a: "Ada simulasi berwaktu bersama pengajar di sesi akhir, lengkap dengan umpan balik per tipe soal. Di paket 16 sesi simulasinya dua sesi (Part 1, lalu Part 2 dan 3); di paket 8 dan 12 sesi versinya ringkas dalam satu sesi. Tes latihan berskor mesin dari Pearson dijual terpisah oleh Pearson.",
  },
];
