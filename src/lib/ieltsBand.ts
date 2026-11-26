// [kuis-band-radar-siswa-v1] Band IELTS per skill + Overall untuk satu submission kuis.
//
// Rumusnya DISAMAKAN dengan Bahas Kuis di dashboard (linguo-admin-dashboard
// src/components/quiz/QuizBahas.tsx, [kuis-bahas-band-v1]) dan tabel konversi
// grade-quiz, supaya angka yang dilihat siswa = angka yang dibahas pengajar di kelas.
// Urutan sumber: band resmi grade-quiz (quiz_submissions.analysis.ielts) → kalau tak
// ada, perkiraan dari skor jawaban (ditandai `kira` = "≈").

export type SkillBand = { label: 'Listening' | 'Reading' | 'Writing' | 'Speaking'; band: number; kira: boolean };
export type BandSubmission = { skill: SkillBand[]; overall: number; kira: boolean };

/** Baris quiz_answers dengan join quiz_questions(type, points, prompt). */
export type AnswerForBand = {
  response: any;
  score: number | null;
  quiz_questions: { type?: string | null; points?: number | null; prompt?: any } | null;
};

const RE_IELTS_SOAL = /^\s*(Listening Part \d|READING PASSAGE \d|WRITING TASK \d|Speaking Part \d|IELTS)/i;
const BAND_L: [number, number][] = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [3, 2], [1, 1]];
const BAND_R: [number, number][] = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [3, 2], [1, 1]];
const bulatBand = (x: number) => Math.floor(x * 2 + 0.5) / 2;
function bandDari40(tabel: [number, number][], skor: number, total: number): number {
  const raw = Math.round((skor / total) * 40);
  for (const [min, b] of tabel) if (raw >= min) return b;
  return 0;
}

function teks(v: any): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return String(v.text ?? v.id ?? v.en ?? '');
  return String(v);
}

const SKILL_DARI_TIPE = (t?: string | null): SkillBand['label'] | null =>
  t === 'listening' ? 'Listening'
    : t === 'reading' ? 'Reading'
    : t === 'speaking' || t === 'speaking_open' ? 'Speaking'
    : t === 'essay' || t === 'translation' || t === 'fill_blank' ? 'Writing'
    : null;

export const URUT_SKILL: SkillBand['label'][] = ['Listening', 'Reading', 'Writing', 'Speaking'];

/** null = bukan kuis bergaya IELTS / belum ada data skill. */
export function hitungBand(answers: AnswerForBand[], analysis: any): BandSubmission | null {
  const resmi = analysis?.ielts && typeof analysis.ielts === 'object' ? analysis.ielts : null;
  const gayaIelts = !!resmi || answers.some((a) => RE_IELTS_SOAL.test(teks(a.quiz_questions?.prompt)));
  if (!gayaIelts) return null;

  const acc = new Map<string, { skor: number; poin: number; sp: number[] }>();
  answers.forEach((a) => {
    const lbl = SKILL_DARI_TIPE(a.quiz_questions?.type);
    if (!lbl) return;
    const r = acc.get(lbl) ?? { skor: 0, poin: 0, sp: [] };
    r.skor += Number(a.score) || 0;
    r.poin += Number(a.quiz_questions?.points) || 1;
    const sb = a.response && typeof a.response === 'object' ? a.response.speaking?.band : null;
    if (typeof sb === 'number') r.sp.push(sb);
    acc.set(lbl, r);
  });

  const skill: SkillBand[] = [];
  URUT_SKILL.forEach((lbl) => {
    const rb = resmi?.[lbl.toLowerCase()]?.band;
    if (typeof rb === 'number') { skill.push({ label: lbl, band: rb, kira: !!resmi?.partial }); return; }
    const r = acc.get(lbl);
    if (!r || !r.poin) return;
    if (lbl === 'Speaking' && r.sp.length) {
      skill.push({ label: lbl, band: bulatBand(r.sp.reduce((x, y) => x + y, 0) / r.sp.length), kira: false });
      return;
    }
    const band = lbl === 'Listening' ? bandDari40(BAND_L, r.skor, r.poin)
      : lbl === 'Reading' ? bandDari40(BAND_R, r.skor, r.poin)
      : bulatBand((r.skor / r.poin) * 9);
    skill.push({ label: lbl, band, kira: true });
  });
  if (!skill.length) return null;
  const overall = typeof resmi?.overall === 'number'
    ? resmi.overall
    : bulatBand(skill.reduce((x, y) => x + y.band, 0) / skill.length);
  return { skill, overall, kira: skill.some((x) => x.kira) || skill.length < 4 };
}
