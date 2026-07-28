// [beranda-insights-v1] Ringkasan belajar siswa buat kartu visual di Beranda /akun
// dan delta skill di tab Progress detail kelas.
//
// Semua pengambilan data di sini SENGAJA tahan banting: tiap bagian dibungkus
// try/catch sendiri dan balikin nilai kosong kalau tabel/policy-nya belum ada.
// Alasannya sama kayak ClassProgressTab/ClassMateriTab — beberapa tabel
// (class_reports, class_materials, homework_submissions) dimigrasi manual, jadi
// dashboard TIDAK BOLEH mati cuma gara-gara satu tabel belum jalan.

import { supabase } from "@/lib/supabase-client";

export const SKILL_KEYS = ["speaking", "listening", "reading", "writing"] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

// Skor 1–5 → band CEFR. Skala & urutan HARUS sama dengan cefr() di
// ClassProgressTab dan CEFR_LEVELS di dashboard pengajar.
const CEFR_BANDS = [
  { band: "A1", name: "Pemula" },
  { band: "A2", name: "Dasar" },
  { band: "B1", name: "Menengah" },
  { band: "B2", name: "Menengah Atas" },
  { band: "C1", name: "Mahir" },
];
export const cefrBand = (score: number) =>
  CEFR_BANDS[Math.min(5, Math.max(1, Math.round(score))) - 1];

/** Skor 1–5 → persen (biar sebaris sama bar progres lain di dashboard). */
export const scorePct = (score: number) => Math.round((Math.max(0, Math.min(5, score)) / 5) * 100);

export type SkillDelta = {
  key: SkillKey;
  /** Skor terkini dari student_skills (0 = belum dinilai). */
  score: number;
  /** Skor di rapor terakhir; null = belum ada pembanding. */
  before: number | null;
  /** score - before, null kalau tak ada pembanding. Positif = naik. */
  delta: number | null;
  note: string | null;
};

export type SkillProgress = {
  registrationId: string;
  skills: SkillDelta[];
  /** Rata-rata skor terkini dari skill yang sudah dinilai (0 kalau belum ada). */
  avg: number;
  /** Rata-rata di rapor pembanding; null kalau belum ada rapor. */
  avgBefore: number | null;
  /** Awal periode = terbitnya rapor pembanding. */
  periodStart: string | null;
  /** Akhir periode = penilaian skill terbaru. */
  periodEnd: string | null;
  /** Ada minimal satu skill yang sudah dinilai. */
  rated: boolean;
};

export type PendingHomework = {
  scheduleId: string;
  registrationId: string;
  homework: string;
  scheduledAt: string;
  sessionNumber: number | null;
};

export type RecentMaterial = {
  id: string;
  registrationId: string;
  title: string;
  kind: string | null;
  url: string;
  createdAt: string;
};

export type WeekLoad = {
  /** Menit sesi yang SUDAH selesai minggu ini. */
  doneMinutes: number;
  /** Menit sesi yang masih akan datang minggu ini. */
  upcomingMinutes: number;
  doneCount: number;
  upcomingCount: number;
};

export type LeaderboardRow = {
  label: string;
  isMe: boolean;
  progressPct: number;
  sessionsDone: number;
};

export type Leaderboard = {
  registrationId: string;
  language: string;
  rows: LeaderboardRow[];
  myRank: number | null;
};

export type StudentInsights = {
  skills: SkillProgress[];
  pendingHomework: PendingHomework[];
  materials: RecentMaterial[];
  week: WeekLoad;
  leaderboard: Leaderboard | null;
};

export const EMPTY_INSIGHTS: StudentInsights = {
  skills: [],
  pendingHomework: [],
  materials: [],
  week: { doneMinutes: 0, upcomingMinutes: 0, doneCount: 0, upcomingCount: 0 },
  leaderboard: null,
};

/** Senin 00:00 minggu berjalan (pekan Indonesia mulai Senin, samain sama JadwalCalendar). */
export function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const off = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - off);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Format menit → "1j 30m" / "45m". */
export function fmtDuration(minutes: number): string {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}j ${m}m`;
  if (h) return `${h} jam`;
  return `${m}m`;
}

// ── 1) Skill + delta ────────────────────────────────────────────────────────
// Pembanding diambil dari class_reports (rapor TERBIT terakhir), bukan dari
// riwayat student_skills — tabel itu cuma nyimpen nilai terkini per skill, jadi
// satu-satunya jejak nilai lama yang kita punya ada di snapshot rapor.
async function loadSkillProgress(regIds: string[]): Promise<SkillProgress[]> {
  if (regIds.length === 0) return [];

  const [curRes, repRes] = await Promise.all([
    supabase
      .from("student_skills")
      .select("registration_id, skill, score, notes, updated_at")
      .in("registration_id", regIds),
    supabase
      .from("class_reports")
      .select("registration_id, skills, published_at")
      .in("registration_id", regIds)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false }),
  ]);

  if (curRes.error) {
    console.warn("[beranda-insights] student_skills tidak terbaca:", curRes.error.message);
    return [];
  }

  // Rapor pembanding = yang published_at-nya paling baru per registrasi.
  // Hasil query sudah desc, jadi yang pertama masuk = yang dipakai.
  const baseline = new Map<string, { skills: Record<string, any>; publishedAt: string }>();
  if (repRes.error) {
    console.warn("[beranda-insights] class_reports tidak terbaca:", repRes.error.message);
  } else {
    (repRes.data || []).forEach((r: any) => {
      if (!baseline.has(r.registration_id)) {
        baseline.set(r.registration_id, { skills: r.skills || {}, publishedAt: r.published_at });
      }
    });
  }

  const byReg = new Map<string, any[]>();
  (curRes.data || []).forEach((r: any) => {
    const list = byReg.get(r.registration_id) || [];
    list.push(r);
    byReg.set(r.registration_id, list);
  });

  const out: SkillProgress[] = [];
  byReg.forEach((rows, registrationId) => {
    const cur: Record<string, any> = {};
    rows.forEach((r) => { cur[r.skill] = r; });
    const base = baseline.get(registrationId);

    const skills: SkillDelta[] = SKILL_KEYS.map((key) => {
      const score = Number(cur[key]?.score) || 0;
      const rawBefore = base ? Number(base.skills?.[key]?.score) || 0 : 0;
      // Pembanding cuma valid kalau DUA-DUANYA punya angka — kalau salah satu
      // kosong, "naik dari 0" itu bohong, bukan progres.
      const before = base && rawBefore > 0 && score > 0 ? rawBefore : null;
      return {
        key,
        score,
        before,
        delta: before === null ? null : Number((score - before).toFixed(2)),
        note: cur[key]?.notes || null,
      };
    });

    const ratedNow = skills.filter((s) => s.score > 0);
    const avg = ratedNow.length ? ratedNow.reduce((a, s) => a + s.score, 0) / ratedNow.length : 0;
    const withBefore = skills.filter((s) => s.before !== null);
    const avgBefore = withBefore.length
      ? withBefore.reduce((a, s) => a + (s.before as number), 0) / withBefore.length
      : null;
    const periodEnd = rows.reduce<string | null>(
      (acc, r) => (r.updated_at && (!acc || r.updated_at > acc) ? r.updated_at : acc), null);

    out.push({
      registrationId,
      skills,
      avg,
      avgBefore,
      periodStart: base?.publishedAt || null,
      periodEnd,
      rated: ratedNow.length > 0,
    });
  });

  return out;
}

// ── 2) PR yang belum disetor ────────────────────────────────────────────────
// PR = kolom schedules.homework yang diisi pengajar saat menutup sesi.
// Belum disetor = tidak ada baris homework_submissions untuk schedule itu.
async function loadPendingHomework(regIds: string[]): Promise<PendingHomework[]> {
  if (regIds.length === 0) return [];
  try {
    const { data: rows, error } = await supabase
      .from("schedules")
      .select("id, registration_id, homework, scheduled_at, session_number")
      .in("registration_id", regIds)
      .not("homework", "is", null)
      .order("scheduled_at", { ascending: false })
      .limit(40);
    if (error) throw error;

    const withHw = (rows || []).filter((s: any) => (s.homework || "").trim());
    if (withHw.length === 0) return [];

    const { data: subs, error: subErr } = await supabase
      .from("homework_submissions")
      .select("schedule_id")
      .in("schedule_id", withHw.map((s: any) => s.id));
    if (subErr) throw subErr;

    const submitted = new Set((subs || []).map((s: any) => s.schedule_id));
    return withHw
      .filter((s: any) => !submitted.has(s.id))
      .map((s: any) => ({
        scheduleId: s.id,
        registrationId: s.registration_id,
        homework: String(s.homework).trim(),
        scheduledAt: s.scheduled_at,
        sessionNumber: s.session_number ?? null,
      }));
  } catch (e: any) {
    // Kolom homework / tabel homework_submissions belum dimigrasi → anggap nihil.
    console.warn("[beranda-insights] PR tidak terbaca:", e?.message || e);
    return [];
  }
}

// ── 3) Materi terbaru ───────────────────────────────────────────────────────
async function loadRecentMaterials(regIds: string[]): Promise<RecentMaterial[]> {
  if (regIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from("class_materials")
      .select("id, registration_id, title, kind, url, created_at")
      .in("registration_id", regIds)
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) throw error;
    return (data || [])
      .filter((m: any) => m.url)
      .map((m: any) => ({
        id: m.id,
        registrationId: m.registration_id,
        title: m.title || "Materi",
        kind: m.kind || null,
        url: m.url,
        createdAt: m.created_at,
      }));
  } catch (e: any) {
    console.warn("[beranda-insights] class_materials tidak terbaca:", e?.message || e);
    return [];
  }
}

// ── 4) Beban belajar minggu ini ─────────────────────────────────────────────
async function loadWeekLoad(regIds: string[]): Promise<WeekLoad> {
  const empty: WeekLoad = { doneMinutes: 0, upcomingMinutes: 0, doneCount: 0, upcomingCount: 0 };
  if (regIds.length === 0) return empty;
  try {
    const from = startOfWeek(new Date());
    const to = new Date(from.getTime() + 7 * 86400000);
    const { data, error } = await supabase
      .from("schedules")
      .select("scheduled_at, duration_minutes, status")
      .in("registration_id", regIds)
      .gte("scheduled_at", from.toISOString())
      .lt("scheduled_at", to.toISOString());
    if (error) throw error;

    const now = Date.now();
    const out = { ...empty };
    (data || []).forEach((s: any) => {
      // Sesi batal tidak dihitung sebagai beban belajar.
      if (s.status === "cancelled" || s.status === "canceled") return;
      const mins = Number(s.duration_minutes) || 60;
      const sudah = s.status === "completed" || new Date(s.scheduled_at).getTime() < now;
      if (sudah) { out.doneMinutes += mins; out.doneCount += 1; }
      else { out.upcomingMinutes += mins; out.upcomingCount += 1; }
    });
    return out;
  } catch (e: any) {
    console.warn("[beranda-insights] beban minggu tidak terbaca:", e?.message || e);
    return empty;
  }
}

// ── 5) Peringkat kelas grup ─────────────────────────────────────────────────
// Siswa TIDAK boleh baca registrasi siswa lain (RLS), jadi papan peringkat cuma
// bisa lewat RPC SECURITY DEFINER yang balikin data teranonimkan (inisial saja).
// Selama RPC-nya belum dipasang di Supabase, fungsi ini balik null dan kartunya
// tidak dirender sama sekali — bukan error.
async function loadLeaderboard(
  regs: { id: string; language: string; batch_id?: string | null }[]
): Promise<Leaderboard | null> {
  const grup = regs.find((r) => r.batch_id);
  if (!grup) return null;
  try {
    const { data, error } = await supabase.rpc("lms_class_leaderboard", {
      p_registration_id: grup.id,
    });
    if (error) throw error;
    const rows: LeaderboardRow[] = (data || []).map((r: any) => ({
      label: r.display_label || "??",
      isMe: !!r.is_me,
      progressPct: Math.round(Number(r.progress_pct) || 0),
      sessionsDone: Number(r.sessions_done) || 0,
    }));
    if (rows.length < 2) return null; // sendirian bukan papan peringkat
    const myIdx = rows.findIndex((r) => r.isMe);
    return {
      registrationId: grup.id,
      language: grup.language,
      rows,
      myRank: myIdx >= 0 ? myIdx + 1 : null,
    };
  } catch (e: any) {
    console.warn("[beranda-insights] papan peringkat belum tersedia:", e?.message || e);
    return null;
  }
}

/** Ambil semua ringkasan sekaligus (paralel). Tidak pernah melempar error. */
export async function fetchStudentInsights(
  regs: { id: string; language: string; batch_id?: string | null }[]
): Promise<StudentInsights> {
  const regIds = regs.map((r) => r.id).filter(Boolean);
  const [skills, pendingHomework, materials, week, leaderboard] = await Promise.all([
    loadSkillProgress(regIds).catch(() => [] as SkillProgress[]),
    loadPendingHomework(regIds),
    loadRecentMaterials(regIds),
    loadWeekLoad(regIds),
    loadLeaderboard(regs),
  ]);
  return { skills, pendingHomework, materials, week, leaderboard };
}

/** Versi satu registrasi — dipakai tab Progress di detail kelas. */
export async function fetchSkillProgressFor(regId: string): Promise<SkillProgress | null> {
  const list = await loadSkillProgress([regId]).catch(() => [] as SkillProgress[]);
  return list.find((s) => s.registrationId === regId) || null;
}
