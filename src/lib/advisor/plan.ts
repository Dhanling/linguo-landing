// [ai-funnel-v1] Estimasi rencana belajar — DETERMINISTIK, bukan LLM.
// Semua angka (jumlah sesi, durasi, biaya) dihitung di sini dari struktur
// kurikulum Linguo (A1=3, A2=4, B1=5, B2=7 sublevel × 16 sesi) dan pricelist
// resmi. LLM hanya boleh mengutip hasil fungsi ini, tidak menghitung sendiri.

import {
  BASE_URL,
  CEFR_BANDS,
  SESSIONS_PER_SUBLEVEL,
  SUBLEVELS,
  UNIMATE_URL,
  WA_ADMIN_URL,
  examEquivalent,
  findLanguage,
  normalizeFormat,
  searchPrograms,
  toBand,
  type CefrBand,
  type LanguageEntry,
  type ProgramFormat,
} from "./catalog";

export type PlanInput = {
  language: string;
  /** Level yang SUDAH dikuasai ("none", "A1", "A2.3"). Kosong/none = mulai dari nol. */
  current_level?: string | null;
  target_level: string;
  hours_per_week: number;
  goal?: string | null;
  format?: string | null;
};

export type PlanStage = {
  level: CefrBand;
  sublevels: string[];
  sessions: number;
  exam_equivalent: string | null;
  price_per_session_idr: number | null;
};

export type LearningPlan = {
  ok: true;
  language: { id: string; name: string };
  start_from: string;
  target_level: CefrBand;
  target_exam_equivalent: string | null;
  goal: string | null;
  format: ProgramFormat;
  program: string;
  session_minutes: number;
  sessions_per_week: number;
  total_sessions: number;
  estimated_weeks: number;
  estimated_months: number;
  stages: PlanStage[];
  /** Total biaya kelas per siswa (tarif lokal). null = program bukan tarif per sesi. */
  estimated_cost_idr: number | null;
  cost_note: string;
  next_steps: { label: string; url: string }[];
  suggest_unimate: boolean;
  disclaimer: string;
};

export type PlanError = { ok: false; error: string };

const STUDY_ABROAD_RE = /(studi|kuliah|s1|s2|s3|master|sarjana|beasiswa|scholarship|study|universit|kampus|lpdp)/i;

/** "A2.3" → { band: A2, sub: 3 } (sudah selesai A2.3). "A2" → selesai seluruh A2. */
function parseCurrent(v: string | null | undefined): { band: CefrBand; sub: number } | null {
  const s = String(v || "").trim().toUpperCase();
  const band = toBand(s);
  if (!band) return null;
  const m = s.match(/^[AB][12]\.(\d+)/);
  const sub = m ? Math.min(Number(m[1]), SUBLEVELS[band]) : SUBLEVELS[band];
  return { band, sub };
}

export function estimateLearningPlan(input: PlanInput): LearningPlan | PlanError {
  const lang = findLanguage(input.language);
  if (!lang) return { ok: false, error: `Bahasa "${input.language}" tidak ditemukan di katalog Linguo.` };
  const target = toBand(input.target_level);
  if (!target) return { ok: false, error: "Target level harus salah satu dari A1, A2, B1, B2." };
  const hpw = Number(input.hours_per_week);
  if (!Number.isFinite(hpw) || hpw <= 0 || hpw > 30)
    return { ok: false, error: "hours_per_week harus angka 1–30." };

  let format = normalizeFormat(input.format) ?? "private";
  if (format === "test-prep" || format === "kids") format = "private"; // estimasi CEFR umum
  if (format === "reguler" && !lang.regulerAvailable) format = "private";

  const cur = parseCurrent(input.current_level);
  const targetIdx = CEFR_BANDS.indexOf(target);
  const curIdx = cur ? CEFR_BANDS.indexOf(cur.band) : -1;
  if (cur && (curIdx > targetIdx || (curIdx === targetIdx && cur.sub >= SUBLEVELS[cur.band]))) {
    return { ok: false, error: `Level sekarang (${input.current_level}) sudah setara atau di atas target ${target}.` };
  }

  const offers = searchPrograms({ language: lang.id, format }).programs;
  const offer = offers.find((p) => p.format === format) || offers[0];
  const sessionMinutes = offer?.session_minutes ?? 60;

  const stages: PlanStage[] = [];
  for (let i = Math.max(curIdx, 0); i <= targetIdx; i++) {
    const band = CEFR_BANDS[i];
    const startSub = cur && i === curIdx ? cur.sub + 1 : 1;
    if (cur && i < curIdx) continue;
    if (startSub > SUBLEVELS[band]) continue;
    const subs: string[] = [];
    for (let s = startSub; s <= SUBLEVELS[band]; s++) subs.push(`${band}.${s}`);
    stages.push({
      level: band,
      sublevels: subs,
      sessions: subs.length * SESSIONS_PER_SUBLEVEL,
      exam_equivalent: examEquivalent(lang, band)?.label ?? null,
      price_per_session_idr: offer?.price_per_session_idr?.[band] ?? null,
    });
  }

  const totalSessions = stages.reduce((n, s) => n + s.sessions, 0);
  // Satu sesi = sessionMinutes; jam/minggu → sesi/minggu (minimal 1).
  const sessionsPerWeek = Math.max(1, Math.round((hpw * 60) / sessionMinutes));
  const weeks = Math.ceil(totalSessions / sessionsPerWeek);

  let cost: number | null = null;
  let costNote: string;
  if (format === "reguler") {
    costNote = `Kelas Reguler dibayar per batch (Rp ${(offer?.package_price_idr ?? 0).toLocaleString("id-ID")} / 2 bulan, 8 pertemuan). Jumlah batch tergantung jadwal yang dibuka — konfirmasi ke admin.`;
  } else {
    cost = stages.reduce((n, s) => n + (s.price_per_session_idr ?? 0) * s.sessions, 0);
    costNote =
      format === "semi-private"
        ? "Biaya per siswa untuk grup 2 orang, tarif pengajar lokal. Grup lebih besar lebih murah per siswa."
        : "Biaya total per siswa, tarif pengajar lokal, sesi 60 menit. Pembayaran bisa per paket sublevel (16 sesi), tidak harus sekaligus.";
  }

  const startFrom = stages[0]?.sublevels[0] ?? `${target}.1`;
  const studyAbroad = STUDY_ABROAD_RE.test(String(input.goal || ""));

  const nextSteps: { label: string; url: string }[] = [];
  if (lang.placementTestUrl && cur) nextSteps.push({ label: "Ikut placement test gratis", url: lang.placementTestUrl });
  nextSteps.push({ label: "Daftar kelas / trial", url: lang.registerUrl });
  if (lang.syllabusUrl) nextSteps.push({ label: "Lihat silabus", url: lang.syllabusUrl });
  nextSteps.push({ label: "Tanya admin via WhatsApp", url: WA_ADMIN_URL });
  if (studyAbroad) nextSteps.push({ label: "Konsultasi studi luar negeri (Unimate)", url: UNIMATE_URL });

  return {
    ok: true,
    language: { id: lang.id, name: lang.name },
    start_from: startFrom,
    target_level: target,
    target_exam_equivalent: examEquivalent(lang, target)?.label ?? null,
    goal: input.goal ? String(input.goal).slice(0, 200) : null,
    format,
    program: offer?.program ?? "Kelas Private",
    session_minutes: sessionMinutes,
    sessions_per_week: sessionsPerWeek,
    total_sessions: totalSessions,
    estimated_weeks: weeks,
    estimated_months: Math.round((weeks / 4.345) * 10) / 10,
    stages,
    estimated_cost_idr: cost,
    cost_note: costNote,
    next_steps: nextSteps,
    suggest_unimate: studyAbroad,
    disclaimer:
      "Estimasi berdasarkan struktur kurikulum Linguo (16 sesi per sublevel) dengan kehadiran rutin. Kecepatan nyata tergantung latihan mandiri; padanan ujian bersifat perkiraan, bukan jaminan lulus.",
  };
}

export function placementTestLink(language: string): { ok: boolean; language?: string; url?: string; note: string } {
  const lang: LanguageEntry | null = findLanguage(language);
  if (!lang) return { ok: false, note: `Bahasa "${language}" tidak ditemukan.` };
  if (!lang.placementTestUrl)
    return {
      ok: false,
      language: lang.name,
      note: `Placement test online belum tersedia untuk ${lang.name}. Admin bisa mengatur tes lisan lewat WhatsApp: ${WA_ADMIN_URL}`,
    };
  return {
    ok: true,
    language: lang.name,
    url: lang.placementTestUrl,
    note: "Placement test online, hasilnya perkiraan level CEFR. Kalau benar-benar pemula, tidak perlu tes — langsung mulai dari A1.1.",
  };
}

export { BASE_URL };
