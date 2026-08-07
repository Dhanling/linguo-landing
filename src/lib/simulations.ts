// Sisi siswa (LMS) — baca simulasi TOEFL/IELTS yang dipublish + simpan attempt & nilai.
// Skema dibikin di admin dashboard (test_simulations / _sections / _questions /
// simulation_attempts / simulation_answers). Penilaian Writing/Speaking via
// edge function grade-simulation (transcribe speaking + AI scoring).
import { supabase } from "@/lib/supabase-client";
import { PROMO_SOURCE_PREFIX, FREE_PROMOS } from "@/lib/simulasiPakets";
// Hanya tipe (dihapus saat kompilasi) — simScore mengimpor tipe dari file ini,
// jadi impor nilai akan jadi lingkaran.
import type { SkillRaw } from "@/lib/simScore";

export type TestType = "toefl" | "ielts" | "jlpt" | "hsk" | "topik" | "goethe";
// Varian/level: IELTS Academic/General · TOEFL ITP/iBT · JLPT N5–N1 · HSK 1–6 ·
// TOPIK I/II · Goethe (CEFR) A1–C2.
export type TestVariant =
  | "academic" | "general" | "itp" | "ibt"
  | "n5" | "n4" | "n3" | "n2" | "n1"
  | "hsk1" | "hsk2" | "hsk3" | "hsk4" | "hsk5" | "hsk6"
  | "topik1" | "topik2"
  | "a1" | "a2" | "b1" | "b2" | "c1" | "c2";
export type Skill = "reading" | "listening" | "writing" | "speaking" | "structure";
export type QuestionType =
  | "multiple_choice" | "true_false_ng" | "fill_blank" | "short_answer"
  | "matching" | "essay" | "speaking_task";

export interface Simulation {
  id: string;
  test_type: TestType;
  test_variant: TestVariant | null;
  title: string;
  description: string | null;
  level: string | null;
  duration_minutes: number;
  is_published: boolean;
  access_mode: "account" | "guest";
  cover_url: string | null; // gambar cover paket (dikelola dari admin)
  created_at: string;
  section_count?: number;
  question_count?: number;
}

export interface Section {
  id: string;
  simulation_id: string;
  skill: Skill;
  title: string;
  instructions: string | null;
  passage: string | null;
  audio_url: string | null;
  duration_minutes: number;
  sort_order: number;
}

export interface Question {
  id: string;
  section_id: string;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  answer: any;
  image_url: string | null; // visual soal (mis. chart IELTS Writing Task 1)
  explanation: string | null;
  points: number;
  sort_order: number;
}

export const TEST_TYPE_LABEL: Record<TestType, string> = {
  toefl: "TOEFL", ielts: "IELTS", jlpt: "JLPT", hsk: "HSK", topik: "TOPIK", goethe: "Goethe",
};
export const TEST_VARIANT_LABEL: Record<TestVariant, string> = {
  academic: "Academic", general: "General", itp: "ITP", ibt: "iBT",
  n5: "N5", n4: "N4", n3: "N3", n2: "N2", n1: "N1",
  hsk1: "1", hsk2: "2", hsk3: "3", hsk4: "4", hsk5: "5", hsk6: "6",
  topik1: "I", topik2: "II",
  a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2",
};
// Label lengkap jenis + varian, mis. "IELTS Academic" / "TOEFL iBT".
export function testTypeLabel(testType: TestType, variant?: TestVariant | null): string {
  return variant ? `${TEST_TYPE_LABEL[testType]} ${TEST_VARIANT_LABEL[variant]}` : TEST_TYPE_LABEL[testType];
}
export const SKILL_LABEL: Record<Skill, string> = {
  reading: "Reading", listening: "Listening", writing: "Writing", speaking: "Speaking",
  structure: "Structure",
};

// Durasi total tes sesungguhnya (menit) — dipakai sebagai fallback bila admin
// belum mengisi durasi simulasi/bagian, supaya countdown pengerjaan tetap muncul
// dan sesuai tes asli. TOEFL ITP: Listening 35 + Structure 25 + Reading 55 = 115.
// TOEFL iBT (format baru): ~116. IELTS: Listening 30 + Reading 60 + Writing 60
// (+ Speaking ~15) ≈ 165.
export const REAL_TEST_DURATION_BY_VARIANT: Partial<Record<TestVariant, number>> = {
  itp: 115, ibt: 116, academic: 165, general: 165,
  // JLPT durasi resmi naik dengan level.
  n5: 90, n4: 105, n3: 115, n2: 140, n1: 165,
  // HSK 1–2 pendek, makin tinggi makin panjang.
  hsk1: 40, hsk2: 55, hsk3: 90, hsk4: 105, hsk5: 125, hsk6: 140,
  // TOPIK I (listening+reading) vs TOPIK II (+writing).
  topik1: 100, topik2: 180,
  // Goethe (CEFR) — 4 modul, makin tinggi makin panjang.
  a1: 60, a2: 90, b1: 150, b2: 190, c1: 230, c2: 230,
};
export const REAL_TEST_DURATION_BY_TYPE: Record<TestType, number> = {
  toefl: 115, ielts: 165, jlpt: 115, hsk: 90, topik: 140, goethe: 120,
};
export function defaultDurationMinutes(testType: TestType, variant?: TestVariant | null): number {
  if (variant && REAL_TEST_DURATION_BY_VARIANT[variant] != null) return REAL_TEST_DURATION_BY_VARIANT[variant]!;
  return REAL_TEST_DURATION_BY_TYPE[testType] ?? 0;
}
// Durasi efektif countdown: pakai durasi simulasi bila diset, lalu jumlah durasi
// bagian, terakhir fallback ke durasi tes asli (biar timer selalu otomatis muncul).
export function effectiveDurationMinutes(sim: Simulation, sections: Section[]): number {
  if (sim.duration_minutes > 0) return sim.duration_minutes;
  const sum = sections.reduce((n, s) => n + (s.duration_minutes || 0), 0);
  if (sum > 0) return sum;
  return defaultDurationMinutes(sim.test_type, sim.test_variant);
}
export const AUTO_GRADED: QuestionType[] = [
  "multiple_choice", "true_false_ng", "fill_blank", "short_answer", "matching",
];

// ── Petunjuk default (template) untuk layar intro simulasi ───────────────────
// Dipakai bila admin tidak menulis instruksi sendiri pada bagian/soal.
export const TEST_OVERVIEW: Record<TestType, string> = {
  ielts:
    "IELTS mengukur kemampuan bahasa Inggris melalui empat keterampilan: Listening, Reading, Writing, dan Speaking. Kerjakan tiap bagian secara berurutan dan perhatikan sisa waktu.",
  toefl:
    "TOEFL mengukur kemampuan bahasa Inggris akademik melalui empat keterampilan: Reading, Listening, Speaking, dan Writing. Kerjakan tiap bagian secara berurutan dan perhatikan sisa waktu.",
  jlpt:
    "JLPT (日本語能力試験) mengukur kemampuan bahasa Jepang melalui Pengetahuan Bahasa (huruf, kosakata, tata bahasa), Membaca (読解), dan Menyimak (聴解). Kerjakan tiap bagian secara berurutan dan perhatikan sisa waktu.",
  hsk:
    "HSK (汉语水平考试) mengukur kemampuan bahasa Mandarin melalui Menyimak (听力), Membaca (阅读), dan Menulis (书写, mulai HSK 3). Kerjakan tiap bagian secara berurutan dan perhatikan sisa waktu.",
  topik:
    "TOPIK (한국어능력시험) mengukur kemampuan bahasa Korea melalui Menyimak (듣기), Membaca (읽기), dan Menulis (쓰기, TOPIK II). Kerjakan tiap bagian secara berurutan dan perhatikan sisa waktu.",
  goethe:
    "Goethe-Zertifikat mengukur kemampuan bahasa Jerman melalui empat modul: Lesen (Membaca), Hören (Menyimak), Schreiben (Menulis), dan Sprechen (Berbicara). Kerjakan tiap bagian secara berurutan dan perhatikan sisa waktu.",
};

// Cara menjawab per keterampilan — jadi instruksi default tiap bagian.
export const SKILL_HOWTO: Record<Skill, string> = {
  reading:
    "Baca teks dengan teliti, lalu jawab pertanyaan pilihan ganda / True–False–Not Given / isian sesuai informasi pada teks.",
  listening:
    "Putar audio dan simak baik-baik (boleh diputar ulang), lalu jawab pertanyaannya. Tulis jawaban singkat sesuai yang kamu dengar.",
  writing:
    "Tulis esai sesuai instruksi dan jumlah kata minimal.",
  speaking:
    "Rekam jawabanmu menggunakan mikrofon. Bicara dengan jelas sesuai instruksi.",
  structure:
    "Soal tata bahasa (grammar). Pilih jawaban yang melengkapi kalimat dengan benar, atau temukan bagian kalimat yang salah.",
};

// Tata tertib umum. Item bertanda { timed: true } hanya tampil bila ada batas waktu.
export const GENERAL_RULES: { text: string; timed?: boolean }[] = [
  { text: "Kerjakan setiap bagian secara berurutan. Gunakan panel Navigasi Soal untuk berpindah dan memantau soal yang belum dijawab." },
  { text: "Pastikan semua soal sudah dijawab sebelum mengirim — soal yang terlewati ditandai merah pada navigasi." },
  { text: "Untuk bagian Speaking, izinkan akses mikrofon di browser saat diminta." },
  { text: "Jawaban otomatis dikumpulkan ketika waktu habis, jadi pantau terus sisa waktu di pojok atas.", timed: true },
];

// ── Fetch katalog simulasi published (+ jumlah section & soal) ────────────────
export async function fetchPublishedSimulations(): Promise<Simulation[]> {
  const { data, error } = await supabase
    .from("test_simulations")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const [{ data: secs }, { data: qs }] = await Promise.all([
    supabase.from("test_simulation_sections").select("id, simulation_id"),
    supabase.from("test_simulation_questions").select("id, section_id"),
  ]);
  const secToSim: Record<string, string> = {};
  const secCount: Record<string, number> = {};
  (secs || []).forEach((s: any) => {
    secToSim[s.id] = s.simulation_id;
    secCount[s.simulation_id] = (secCount[s.simulation_id] || 0) + 1;
  });
  const qCount: Record<string, number> = {};
  (qs || []).forEach((q: any) => {
    const sim = secToSim[q.section_id];
    if (sim) qCount[sim] = (qCount[sim] || 0) + 1;
  });
  return (data as Simulation[]).map((s) => ({
    ...s,
    section_count: secCount[s.id] ?? 0,
    question_count: qCount[s.id] ?? 0,
  }));
}

// ── Cover foto per JENIS tes (utk kartu teaser "Segera") ──────────────────────
// Kartu terkunci bersifat per-jenis; simulasi-nya bisa saja masih Draft sehingga
// cover-nya tak terbaca lewat query biasa. RPC get_simulation_covers (SECURITY
// DEFINER) hanya mengembalikan {test_type, cover_url}, aman dipanggil siapa pun.
export async function fetchSimulationCovers(): Promise<Partial<Record<TestType, string>>> {
  const { data, error } = await supabase.rpc("get_simulation_covers");
  if (error || !data) return {};
  const out: Partial<Record<TestType, string>> = {};
  (data as { test_type: TestType; cover_url: string | null }[]).forEach((r) => {
    if (r.cover_url) out[r.test_type] = r.cover_url;
  });
  return out;
}

export async function fetchSimulation(id: string, preview = false): Promise<{
  simulation: Simulation | null; sections: Section[]; questions: Question[];
}> {
  // Mode preview (POV siswa untuk admin/curriculum): admin sering belum login di
  // domain landing → request anon. RLS test_simulation* hanya `to authenticated`,
  // jadi select biasa selalu kosong. Pakai RPC SECURITY DEFINER get_simulation_exam
  // (grant ke anon) yang ambil 1 simulasi by-id, termasuk yang belum dipublikasikan.
  if (preview) {
    const { data, error } = await supabase.rpc("get_simulation_exam", { p_sim_id: id });
    if (error || !data || !data.simulation) return { simulation: null, sections: [], questions: [] };
    const secs = orderSectionsGrouped((data.sections as Section[]) || []);
    return {
      simulation: data.simulation as Simulation,
      sections: secs,
      questions: stripPromptNumbers(orderQuestions(secs, (data.questions as Question[]) || [])),
    };
  }

  const { data: sim } = await supabase
    .from("test_simulations").select("*").eq("id", id).eq("is_published", true).maybeSingle();
  if (!sim) return { simulation: null, sections: [], questions: [] };

  const { data: secs } = await supabase
    .from("test_simulation_sections").select("*").eq("simulation_id", id)
    .order("sort_order", { ascending: true });
  const secIds = (secs || []).map((s: any) => s.id);
  let qs: Question[] = [];
  if (secIds.length) {
    const { data: qData } = await supabase
      .from("test_simulation_questions").select("*").in("section_id", secIds)
      .order("sort_order", { ascending: true });
    qs = (qData as Question[]) || [];
  }
  const orderedSecs = orderSectionsGrouped((secs as Section[]) || []);
  return { simulation: sim as Simulation, sections: orderedSecs, questions: stripPromptNumbers(orderQuestions(orderedSecs, qs)) };
}

// Urutkan soal mengikuti urutan SECTION dulu, baru sort_order dalam tiap section.
// Tanpa ini, query `.order("sort_order")` mengurutkan lintas-section (semua soal
// sort_order 0 dulu, lalu semua sort_order 1, dst) sehingga array `questions`
// teracak antar-section — bikin daftar hasil & navigasi soal jadi tidak urut.
function orderQuestions(sections: Section[], questions: Question[]): Question[] {
  const rank: Record<string, number> = {};
  sections.forEach((s, i) => { rank[s.id] = i; });
  return [...questions].sort(
    (a, b) =>
      (rank[a.section_id] ?? 0) - (rank[b.section_id] ?? 0) ||
      a.sort_order - b.sort_order,
  );
}

// Kelompokkan section per skill — urutan grup mengikuti kemunculan pertama skill
// pada sort_order. CMS admin MENAMPILKAN section digrup per skill (semua Reading
// barengan), tapi sort_order mentah di DB bisa terselip antar-skill (mis. section
// Listening dibuat belakangan dapat sort_order di tengah deretan Reading). Tanpa
// penyamaan ini, urutan bagian yang dilihat siswa beda dari susunan di CMS
// (bug: "Bacaan 5" muncul setelah Listening Section 1).
function orderSectionsGrouped(sections: Section[]): Section[] {
  const rank = new Map<Skill, number>();
  sections.forEach((s) => { if (!rank.has(s.skill)) rank.set(s.skill, rank.size); });
  return sections
    .map((s, i) => ({ s, i }))
    .sort((a, b) => (rank.get(a.s.skill)! - rank.get(b.s.skill)!) || a.i - b.i)
    .map((x) => x.s);
}

// Buang nomor bawaan di awal prompt ("3. What does ...") — soal hasil impor lama
// masih menyimpan nomor di teksnya, padahal UI sudah menomori sendiri → tampil dobel.
const LEADING_NUMBER_RE = /^\s*\d{1,3}[.)]\s+/;
function stripPromptNumbers(questions: Question[]): Question[] {
  return questions.map((q) =>
    q.prompt && LEADING_NUMBER_RE.test(q.prompt)
      ? { ...q, prompt: q.prompt.replace(LEADING_NUMBER_RE, "") }
      : q,
  );
}

// ── Attempt lifecycle ────────────────────────────────────────────────────────
export interface StudentInfo {
  user_id: string | null;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
}

// Intip mode akses simulasi TANPA perlu login — lewat RPC SECURITY DEFINER yang
// granted ke anon. Dipakai untuk memutuskan: pengunjung belum login diarahkan ke
// form identitas tamu (mode 'guest') atau layar wajib-login (mode 'account').
export async function peekSimulationAccess(id: string): Promise<{ is_published: boolean; access_mode: "account" | "guest"; title: string } | null> {
  const { data } = await supabase.rpc("get_simulation_exam", { p_sim_id: id });
  const s = (data as any)?.simulation;
  if (!s) return null;
  return { is_published: !!s.is_published, access_mode: s.access_mode === "guest" ? "guest" : "account", title: s.title };
}

// Mulai sesi tamu (B2B): Supabase Anonymous Sign-In → jadi role authenticated
// sehingga attempt/jawaban tersimpan lewat RLS yang sudah ada. Nama/email/WA dari
// form disimpan ke attempt (bukan ke profil). Butuh Anonymous Sign-Ins aktif di
// dashboard Supabase (Auth settings).
export async function startGuestSession(name: string, email: string | null, whatsapp: string | null): Promise<StudentInfo | null> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) return null;
  return {
    user_id: data.user.id,
    name: name.trim() || null,
    email: email?.trim() || null,
    whatsapp: whatsapp?.trim() || null,
  };
}

export async function getStudentInfo(): Promise<StudentInfo | null> {
  // [perf:auth-getsession-v1] getSession() baca sesi lokal; getUser() SELALU
  // menembak /auth/v1/user ke jaringan. Dipanggil di jalur buka tab Simulasi,
  // jadi satu round-trip itu langsung terasa sebagai "loading lama". Identitas
  // di sini cuma untuk tampilan/pra-isi — otoritasnya tetap RLS di server.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;
  let name = (user.user_metadata?.full_name as string) || (user.email?.split("@")[0] ?? null);
  let whatsapp: string | null = null;
  try {
    const { data: prof } = await supabase.from("profiles").select("full_name, nickname, whatsapp, email").eq("id", user.id).maybeSingle();
    if (prof) { name = prof.full_name || prof.nickname || name; whatsapp = prof.whatsapp ?? null; }
  } catch {}
  return { user_id: user.id, name, email: user.email ?? null, whatsapp };
}

// ── Entitlement (simulasi-paywall-v1) ────────────────────────────────────────
// Jenis tes yang sudah dibeli user saat ini. RLS "Self read entitlement" sudah
// memfilter ke baris milik user (by uid/email), jadi tak perlu filter manual.
export async function fetchMyEntitlements(): Promise<TestType[]> {
  // [perf:auth-getsession-v1] cukup sesi lokal — barisnya tetap disaring RLS.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];
  const { data } = await supabase
    .from("simulation_entitlements")
    .select("test_type")
    .eq("status", "active");
  return Array.from(new Set((data || []).map((r: any) => r.test_type))) as TestType[];
}

// ── promo-code-v1: cap attempt utk entitlement gratis (mis. LINGUOHEMAT) ──────
export interface PromoAttemptStatus {
  used: number;      // berapa kali user sudah mengerjakan tes jenis ini
  limit: number;     // jatah dari promo
  remaining: number; // sisa kesempatan
  blocked: boolean;  // true bila jatah habis
}

// Cek status jatah gratis utk sebuah jenis tes. Return null bila:
// - user belum login, ATAU
// - entitlement bukan promo (mis. sudah bayar → unlimited, tak dibatasi).
// Kalau entitlement-nya promo, kembalikan pemakaian vs jatah.
export async function getPromoAttemptStatus(testType: TestType): Promise<PromoAttemptStatus | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS "Self read entitlement" sudah memfilter ke baris milik user.
  const { data: ents } = await supabase
    .from("simulation_entitlements")
    .select("source_external_id")
    .eq("status", "active")
    .eq("test_type", testType);
  if (!ents || ents.length === 0) return null;

  const isPromoSrc = (s: unknown) => typeof s === "string" && s.startsWith(PROMO_SOURCE_PREFIX);
  // Ada pembelian berbayar (non-promo)? → akses penuh, tak dibatasi.
  if (ents.some((e) => !isPromoSrc(e.source_external_id))) return null;

  const promoRow = ents.find((e) => isPromoSrc(e.source_external_id))!;
  const code = String(promoRow.source_external_id).slice(PROMO_SOURCE_PREFIX.length);
  const limit = FREE_PROMOS[code]?.attemptLimit ?? 3;

  // Hitung attempt yang BENAR-BENAR sudah dikumpulkan (submitted_at terisi) untuk
  // jenis tes ini. Attempt yang masih "in_progress" (mulai lalu keluar tanpa submit)
  // TIDAK dihitung — jatah baru terpakai saat siswa menekan "Selesai & Kirim".
  const { count } = await supabase
    .from("simulation_attempts")
    .select("id, test_simulations!inner(test_type)", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("test_simulations.test_type", testType)
    .not("submitted_at", "is", null);
  const used = count ?? 0;
  return { used, limit, remaining: Math.max(0, limit - used), blocked: used >= limit };
}

export async function createAttempt(simulationId: string, info: StudentInfo): Promise<string | null> {
  const { data, error } = await supabase
    .from("simulation_attempts")
    .insert({
      simulation_id: simulationId,
      user_id: info.user_id,
      student_name: info.name,
      student_email: info.email,
      student_whatsapp: info.whatsapp,
      status: "in_progress",
    })
    .select("id")
    .single();
  if (error) return null;
  return data.id as string;
}

// ── Upload rekaman speaking ──────────────────────────────────────────────────
export async function uploadRecording(attemptId: string, questionId: string, blob: Blob): Promise<string | null> {
  const path = `${attemptId}/${questionId}-${Date.now()}.webm`;
  const { error } = await supabase.storage.from("simulation-recordings").upload(path, blob, {
    contentType: blob.type || "audio/webm", upsert: true,
  });
  if (error) return null;
  const { data } = supabase.storage.from("simulation-recordings").getPublicUrl(path);
  return data.publicUrl;
}

// ── Penilaian objektif (client-side) ─────────────────────────────────────────
export function gradeObjective(q: Question, selectedIndex: number | null, text: string): { correct: boolean; points: number } {
  if (q.type === "multiple_choice" || q.type === "true_false_ng" || q.type === "matching") {
    const correct = typeof q.answer === "number" && selectedIndex === q.answer;
    return { correct, points: correct ? q.points : 0 };
  }
  if (q.type === "fill_blank" || q.type === "short_answer") {
    const key = (typeof q.answer === "string" ? q.answer : (q.answer?.text ?? "")).trim().toLowerCase();
    const correct = key !== "" && text.trim().toLowerCase() === key;
    return { correct, points: correct ? q.points : 0 };
  }
  return { correct: false, points: 0 };
}

// ── Panggil AI grading (writing/speaking) ────────────────────────────────────
export async function gradeWithAI(input: {
  test_type: TestType; skill: "writing" | "speaking";
  prompt: string; rubric?: string; response_text?: string; audio_url?: string;
  image_url?: string; // visual Writing Task 1 — dinilai via model vision
}): Promise<{ score: number; feedback: string; transcript?: string } | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/grade-simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.error) return null;
    return { score: data.score, feedback: data.feedback, transcript: data.transcript };
  } catch {
    return null;
  }
}

export interface AnswerPayload {
  question_id: string;
  section_skill: Skill;
  response_text: string | null;
  audio_url: string | null;
  selected_index: number | null;
  is_correct: boolean | null;
  points_earned: number | null;
  ai_score: number | null;
  ai_feedback: string | null;
}

export async function saveAnswers(attemptId: string, answers: AnswerPayload[]): Promise<boolean> {
  if (!answers.length) return true;
  const { error } = await supabase
    .from("simulation_answers")
    .insert(answers.map((a) => ({ attempt_id: attemptId, ...a })));
  return !error;
}

// ── [sim-riwayat-v1] Riwayat pengerjaan & hasil lama ─────────────────────────
// Siswa sering menutup halaman hasil lalu tak bisa menemukan skornya lagi.
// Riwayat dibaca dari simulation_attempts (RLS "Own attempts" → baris sendiri),
// rincian per subtes dari simulation_answers (RLS "Own answers").

export interface AttemptSummary {
  id: string;
  simulation_id: string;
  title: string;
  test_type: TestType;
  test_variant: TestVariant | null;
  status: string;
  score: number | null;
  max_score: number | null;
  started_at: string;
  submitted_at: string | null;
  // [sim-certificate-v1] nama yang dipakai saat mengerjakan — dicetak di sertifikat
  // (peserta tamu B2B tak punya profil, namanya cuma ada di baris attempt ini).
  student_name?: string | null;
  skills: SkillRaw[]; // rincian per subtes → konversi skala resmi (lib/simScore)
}

export interface AttemptAnswerRow {
  question_id: string;
  section_skill: Skill | null;
  response_text: string | null;
  audio_url: string | null;
  selected_index: number | null;
  is_correct: boolean | null;
  points_earned: number | null;
  ai_score: number | null;
  ai_feedback: string | null;
}

const SKILL_ORDER: Skill[] = ["listening", "structure", "reading", "writing", "speaking"];

// Satu baris jawaban dianggap DIISI bila ada pilihan/teks/rekaman. Soal yang
// dilewati tetap ditulis sebagai baris (is_correct=false), jadi pengecekan ini
// yang membedakan "salah semua" dari "tidak dikerjakan sama sekali".
export function isAnsweredRow(
  r: Partial<Pick<AttemptAnswerRow, "selected_index" | "response_text" | "audio_url">>,
): boolean {
  return (
    r.selected_index != null ||
    (typeof r.response_text === "string" && r.response_text.trim() !== "") ||
    !!r.audio_url
  );
}

// Kumpulkan jawaban jadi rincian per subtes (benar/objektif/nilai AI/poin).
export function aggregateSkills(
  rows: Array<
    Pick<AttemptAnswerRow, "section_skill" | "is_correct" | "points_earned" | "ai_score"> &
      Partial<Pick<AttemptAnswerRow, "selected_index" | "response_text" | "audio_url">>
  >,
  maxPointsOf?: (row: any) => number,
): SkillRaw[] {
  const map = new Map<Skill, SkillRaw>();
  rows.forEach((r) => {
    const skill = (r.section_skill ?? "reading") as Skill;
    if (!map.has(skill)) map.set(skill, { skill, correct: 0, objective: 0, aiScores: [], earned: 0, max: 0, answered: 0 });
    const s = map.get(skill)!;
    if (r.is_correct != null) { s.objective += 1; if (r.is_correct) s.correct += 1; }
    if (r.ai_score != null) s.aiScores.push(Number(r.ai_score));
    if (isAnsweredRow(r)) s.answered = (s.answered ?? 0) + 1;
    s.earned += Number(r.points_earned ?? 0);
    if (maxPointsOf) s.max += maxPointsOf(r);
  });
  return Array.from(map.values()).sort(
    (a, b) => SKILL_ORDER.indexOf(a.skill) - SKILL_ORDER.indexOf(b.skill),
  );
}

// Riwayat attempt yang sudah dikumpulkan, terbaru dulu.
export async function fetchMyAttempts(limit = 30): Promise<AttemptSummary[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  // Sengaja TANPA join ke test_simulations: kalau entitlement/publikasi simulasi
  // berubah, inner join akan menelan seluruh baris riwayat. Judul diambil terpisah
  // dan tetap tampil apa adanya bila simulasinya sudah tak terbaca.
  const { data: rows } = await supabase
    .from("simulation_attempts")
    .select("id, simulation_id, status, score, max_score, started_at, submitted_at")
    .eq("user_id", session.user.id)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (!rows || rows.length === 0) return [];

  const simIds = Array.from(new Set(rows.map((r: any) => r.simulation_id)));
  const attemptIds = rows.map((r: any) => r.id);
  const [{ data: sims }, { data: answers }] = await Promise.all([
    supabase.from("test_simulations").select("id, title, test_type, test_variant").in("id", simIds),
    supabase
      .from("simulation_answers")
      // selected_index/response_text/audio_url ikut dibaca supaya attempt yang
      // dikumpulkan kosong bisa dikenali (lihat isAnsweredRow).
      .select("attempt_id, section_skill, is_correct, points_earned, ai_score, selected_index, response_text, audio_url")
      .in("attempt_id", attemptIds),
  ]);

  const simOf = new Map<string, any>();
  (sims || []).forEach((s: any) => simOf.set(s.id, s));
  const ansOf = new Map<string, any[]>();
  (answers || []).forEach((a: any) => {
    const list = ansOf.get(a.attempt_id) ?? [];
    list.push(a);
    ansOf.set(a.attempt_id, list);
  });

  return rows.map((r: any) => {
    const sim = simOf.get(r.simulation_id);
    return {
      id: r.id,
      simulation_id: r.simulation_id,
      title: sim?.title ?? "Simulasi",
      test_type: (sim?.test_type ?? "toefl") as TestType,
      test_variant: (sim?.test_variant ?? null) as TestVariant | null,
      status: r.status,
      score: r.score == null ? null : Number(r.score),
      max_score: r.max_score == null ? null : Number(r.max_score),
      started_at: r.started_at,
      submitted_at: r.submitted_at,
      skills: aggregateSkills(ansOf.get(r.id) ?? []),
    };
  });
}

// Satu attempt lama beserta soal & jawabannya → untuk halaman "lihat hasil lagi".
export async function fetchAttemptReview(attemptId: string): Promise<{
  attempt: AttemptSummary;
  simulation: Simulation | null;
  sections: Section[];
  questions: Question[];
  answers: AttemptAnswerRow[];
} | null> {
  const { data: att } = await supabase
    .from("simulation_attempts")
    .select("id, simulation_id, status, score, max_score, started_at, submitted_at, student_name")
    .eq("id", attemptId)
    .maybeSingle();
  if (!att) return null;

  // Simulasi diambil TANPA filter is_published — attempt-nya sudah selesai, jadi
  // hasilnya harus tetap bisa dibuka walau simulasinya dikembalikan ke draft.
  const [{ data: sim }, { data: secs }, { data: ansRows }] = await Promise.all([
    supabase.from("test_simulations").select("*").eq("id", att.simulation_id).maybeSingle(),
    supabase
      .from("test_simulation_sections").select("*").eq("simulation_id", att.simulation_id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("simulation_answers")
      .select("question_id, section_skill, response_text, audio_url, selected_index, is_correct, points_earned, ai_score, ai_feedback")
      .eq("attempt_id", attemptId),
  ]);

  const sections = orderSectionsGrouped((secs as Section[]) || []);
  let questions: Question[] = [];
  if (sections.length) {
    const { data: qData } = await supabase
      .from("test_simulation_questions").select("*")
      .in("section_id", sections.map((s) => s.id))
      .order("sort_order", { ascending: true });
    questions = stripPromptNumbers(orderQuestions(sections, (qData as Question[]) || []));
  }

  const answers = (ansRows as AttemptAnswerRow[]) || [];
  const pointsOf = new Map<string, number>();
  questions.forEach((q) => pointsOf.set(q.id, q.points));

  return {
    attempt: {
      id: att.id,
      simulation_id: att.simulation_id,
      title: (sim as any)?.title ?? "Simulasi",
      test_type: ((sim as any)?.test_type ?? "toefl") as TestType,
      test_variant: ((sim as any)?.test_variant ?? null) as TestVariant | null,
      status: att.status,
      score: att.score == null ? null : Number(att.score),
      max_score: att.max_score == null ? null : Number(att.max_score),
      started_at: att.started_at,
      submitted_at: att.submitted_at,
      student_name: (att as any).student_name ?? null,
      skills: aggregateSkills(answers, (r: AttemptAnswerRow) => pointsOf.get(r.question_id) ?? 0),
    },
    simulation: (sim as Simulation) ?? null,
    sections,
    questions,
    answers,
  };
}

export async function finalizeAttempt(attemptId: string, totals: {
  score: number; max_score: number; auto_score: number; ai_score: number;
}): Promise<boolean> {
  const { error } = await supabase
    .from("simulation_attempts")
    .update({
      status: "graded",
      score: totals.score,
      max_score: totals.max_score,
      auto_score: totals.auto_score,
      ai_score: totals.ai_score,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId);
  return !error;
}
