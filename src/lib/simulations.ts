// Sisi siswa (LMS) — baca simulasi TOEFL/IELTS yang dipublish + simpan attempt & nilai.
// Skema dibikin di admin dashboard (test_simulations / _sections / _questions /
// simulation_attempts / simulation_answers). Penilaian Writing/Speaking via
// edge function grade-simulation (transcribe speaking + AI scoring).
import { supabase } from "@/lib/supabase-client";

export type TestType = "toefl" | "ielts";
// Varian spesifik: IELTS Academic/General, TOEFL ITP/iBT.
export type TestVariant = "academic" | "general" | "itp" | "ibt";
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

export const TEST_TYPE_LABEL: Record<TestType, string> = { toefl: "TOEFL", ielts: "IELTS" };
export const TEST_VARIANT_LABEL: Record<TestVariant, string> = {
  academic: "Academic", general: "General", itp: "ITP", ibt: "iBT",
};
// Label lengkap jenis + varian, mis. "IELTS Academic" / "TOEFL iBT".
export function testTypeLabel(testType: TestType, variant?: TestVariant | null): string {
  return variant ? `${TEST_TYPE_LABEL[testType]} ${TEST_VARIANT_LABEL[variant]}` : TEST_TYPE_LABEL[testType];
}
export const SKILL_LABEL: Record<Skill, string> = {
  reading: "Reading", listening: "Listening", writing: "Writing", speaking: "Speaking",
  structure: "Structure",
};
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
    const secs = (data.sections as Section[]) || [];
    return {
      simulation: data.simulation as Simulation,
      sections: secs,
      questions: orderQuestions(secs, (data.questions as Question[]) || []),
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
  return { simulation: sim as Simulation, sections: (secs as Section[]) || [], questions: orderQuestions((secs as Section[]) || [], qs) };
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

// ── Attempt lifecycle ────────────────────────────────────────────────────────
export interface StudentInfo {
  user_id: string | null;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
}

export async function getStudentInfo(): Promise<StudentInfo | null> {
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("simulation_entitlements")
    .select("test_type")
    .eq("status", "active");
  return Array.from(new Set((data || []).map((r: any) => r.test_type))) as TestType[];
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
