// src/lib/etpBatches.ts
// SATU sumber data batch ETP (TOEFL & IELTS Preparation) untuk landing DAN
// knowledge AI (Ling chat). Sebelumnya halaman jadwal punya salinan statik
// sendiri sementara AI baca tabel etp_batches — dua sumber terpisah, jadi AI
// pernah menyebut batch Juni padahal landing sudah pasang batch Agustus.
//
// Aturannya sekarang:
//   1. Baris tabel etp_batches (is_active) adalah sumber utama — dipakai landing
//      maupun AI lewat resolveEtpBatches().
//   2. Batch yang kelasnya sudah kelar (perkiraan dari tanggal mulai + jumlah
//      sesi) otomatis dibuang, biar batch basi tidak ikut ditawarkan.
//   3. Kalau tabelnya kosong/tidak terbaca, keduanya jatuh ke ETP_FALLBACK_BATCHES
//      di bawah — jadi landing & AI tetap menyebut batch yang sama.

// Bentuk baris tabel etp_batches di Supabase.
export interface EtpBatchRow {
  id: string;
  title: string;
  badge: string;
  icon: string;
  color: string;
  days: string;
  time: string;
  start_date: string; // ISO date string
  duration_min: number;
  total_sessions: number;
  price: number;
  max_capacity: number;
  current_enrolled: number;
  syllabus: { week: string; topics: string[] }[];
  highlights: string[];
  is_active: boolean;
}

// Cadangan statik — WAJIB sama persis dengan baris etp_batches yang aktif.
//
// [etp-batches-satu-sumber-v1, 21 Agu 2026] `etp_batches` bukan tabel lagi,
// melainkan VIEW turunan `test_prep_batches` — jadwal ETP di website sekarang
// ikut menu Test Prep di dashboard, tak perlu migrasi SQL tiap ganti batch.
// Cadangan ini cuma dipakai kalau DB tak terbaca; isinya tetap harus batch yang
// sedang dibuka, karena cadangan basi persis keluhan yang bikin aturan ini ada
// ("website masih memajang batch Agustus padahal September sudah dipublish").
export const ETP_FALLBACK_BATCHES: EtpBatchRow[] = [
  {
    id: "toefl-sep26",
    title: "TOEFL Preparation",
    badge: "TOEFL",
    icon: "", // ikon dirender lewat <EtpIcon> (Lucide) berdasarkan badge
    color: "teal",
    days: "Senin & Rabu",
    time: "19.30 – 21.00 WIB",
    start_date: "2026-09-16",
    duration_min: 90,
    total_sessions: 16,
    price: 300000,
    max_capacity: 15,
    current_enrolled: 0,
    highlights: [
      "Latihan Listening, Structure, Reading intensif",
      "Bank soal TOEFL ITP & PBT terlengkap",
      "Simulasi ujian sebelum test hari H",
      "Target skor 500+ dalam 1 batch",
    ],
    syllabus: [
      { week: "Sesi 1–2", topics: ["Orientasi format TOEFL ITP & strategi umum", "Listening Section: short conversations, surprise questions"] },
      { week: "Sesi 3–4", topics: ["Listening Section: longer conversations & mini talks", "Teknik note-taking & prediksi jawaban"] },
      { week: "Sesi 5–6", topics: ["Structure: subject-verb agreement & verb forms", "Written Expression: error recognition dasar"] },
      { week: "Sesi 7–8", topics: ["Structure lanjutan: parallel structure, relative clauses", "Written Expression: preposisi, artikel, word form"] },
      { week: "Sesi 9–10", topics: ["Reading: main idea, topic sentence, inference", "Vocabulary in context & reference questions"] },
      { week: "Sesi 11–12", topics: ["Reading: scanning & skimming cepat", "Unstated detail & negative fact questions"] },
      { week: "Sesi 13–14", topics: ["Full mock test #1 (Listening + Structure + Reading)", "Review mendalam: analisis kesalahan per section"] },
      { week: "Sesi 15–16", topics: ["Full mock test #2 + simulasi kondisi ujian nyata", "Target skor 500+: strategi akhir & manajemen waktu"] },
    ],
    is_active: true,
  },
  {
    id: "ielts-sep26",
    title: "IELTS Preparation",
    badge: "IELTS",
    icon: "",
    color: "blue",
    days: "Selasa & Kamis",
    time: "19.30 – 21.00 WIB",
    start_date: "2026-09-17",
    duration_min: 90,
    total_sessions: 16,
    price: 300000,
    max_capacity: 15,
    current_enrolled: 0,
    highlights: [
      "4 skill: Listening, Reading, Writing, Speaking",
      "Latihan Task 1 & Task 2 Writing dengan feedback",
      "Mock speaking session 1-on-1",
      "Target band 6.5+ dalam 1 batch",
    ],
    syllabus: [
      { week: "Sesi 1–2", topics: ["Orientasi format IELTS Academic & strategi umum", "Listening Section 1–2: form filling & multiple choice"] },
      { week: "Sesi 3–4", topics: ["Listening Section 3–4: lectures & seminars", "Map labelling, diagram completion, sentence completion"] },
      { week: "Sesi 5–6", topics: ["Reading: True/False/Not Given & Yes/No/Not Given", "Matching headings & matching information"] },
      { week: "Sesi 7–8", topics: ["Reading: summary completion & short answer questions", "Teknik skimming & scanning untuk waktu terbatas"] },
      { week: "Sesi 9–10", topics: ["Writing Task 1: describe grafik, tabel, diagram, peta", "Struktur paragraf & academic vocabulary Task 1"] },
      { week: "Sesi 11–12", topics: ["Writing Task 2: opinion, discussion, problem-solution essay", "Coherence & cohesion, lexical resource, grammatical range"] },
      { week: "Sesi 13–14", topics: ["Speaking Part 1: personal questions & fluency drills", "Speaking Part 2: long turn (cue card) & Part 3: discussion"] },
      { week: "Sesi 15–16", topics: ["Full Academic mock test + mock speaking 1-on-1", "Feedback individual & strategi raih band 6.5+"] },
    ],
    is_active: true,
  },
];

// Perkiraan tanggal kelas terakhir: ETP jalan 2x seminggu, jadi 16 sesi ≈ 8
// minggu. Dipakai untuk membuang batch yang kelasnya sudah kelar tapi lupa
// dinonaktifkan di tabel — batch begitu yang bikin AI menawarkan jadwal basi.
export function etpBatchEndISO(row: Pick<EtpBatchRow, "start_date" | "total_sessions">): string {
  const start = new Date(String(row.start_date) + "T00:00:00Z");
  if (isNaN(start.getTime())) return "";
  const weeks = Math.ceil((Number(row.total_sessions) || 16) / 2);
  start.setUTCDate(start.getUTCDate() + weeks * 7);
  return start.toISOString().slice(0, 10);
}

// Batch yang masih relevan buat calon siswa: aktif & kelasnya belum kelar.
export function isEtpBatchLive(row: EtpBatchRow, todayISO: string): boolean {
  if (row.is_active === false) return false;
  const end = etpBatchEndISO(row);
  return !end || end >= todayISO;
}

// Dipakai landing & knowledge AI: baris DB kalau ada, kalau kosong pakai
// cadangan statik. Hasilnya identik di kedua tempat.
export function resolveEtpBatches(rows: EtpBatchRow[] | null | undefined, todayISO: string): EtpBatchRow[] {
  const live = (rows || []).filter((r) => isEtpBatchLive(r, todayISO));
  if (live.length) return live;
  return ETP_FALLBACK_BATCHES.filter((r) => isEtpBatchLive(r, todayISO));
}

// Tanggal kalender WIB (UTC+7) hari ini, 'YYYY-MM-DD'.
export function todayWIBISO(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
