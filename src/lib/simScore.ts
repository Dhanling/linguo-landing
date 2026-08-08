// [sim-official-score-v1] Konversi hasil simulasi → SKALA RESMI tiap ujian.
//
// Sebelumnya siswa hanya melihat poin mentah (mis. "78/110") sehingga tak tahu
// posisinya di skala aslinya: TOEFL ITP 310–677, TOEFL iBT 0–120, IELTS band
// 0–9, JLPT 0–180, HSK 200/300, TOPIK 200/300, Goethe 100/modul.
//
// Cara kerjanya BUKAN linear atas total poin (itu bikin TOEFL 0% = 310 tapi
// 50% = 493 padahal tabel resmi tidak begitu). Yang dipakai:
//   1. hitung persentase benar PER SUBTES (listening / structure / reading / …),
//   2. skalakan ke jumlah soal resmi subtes itu (mis. Listening ITP = 50 soal),
//   3. konversi lewat tabel resmi tiap subtes → nilai subtes,
//   4. gabungkan jadi skor total memakai rumus resmi ujiannya.
//
// Tetap ESTIMASI (jumlah soal simulasi biasanya lebih sedikit dari ujian asli &
// Writing/Speaking dinilai AI), tapi jauh lebih dekat ke skor sebenarnya dan
// selalu berada di rentang skala yang benar.
import type { Skill, TestType, TestVariant } from "@/lib/simulations";

export type ScoreScale = "toefl_itp" | "toefl_ibt" | "ielts" | "jlpt" | "hsk" | "topik" | "goethe";

// Rincian mentah satu subtes (skill) dalam satu attempt.
export interface SkillRaw {
  skill: Skill;
  correct: number; // jawaban objektif yang benar
  objective: number; // jumlah soal objektif
  aiScores: number[]; // skor AI 0–100 (writing/speaking)
  earned: number; // poin diperoleh
  max: number; // poin maksimum
  // [sim-blank-attempt-v1] jumlah soal yang BENAR-BENAR diisi (pilihan dipilih /
  // teks terisi / rekaman terunggah). Soal kosong tetap tercatat sebagai baris
  // jawaban dengan is_correct=false, jadi tanpa angka ini attempt yang tak
  // dikerjakan sama sekali tak bisa dibedakan dari yang salah semua.
  answered?: number;
}

export interface OfficialSkill {
  key: string;
  skills: Skill[];
  label: string;
  value: number | null; // nilai pada skala resmi subtes (null = tak dikerjakan)
  max: number;
  display: string; // "52" · "Band 6.5" · "78/100"
  detail: string; // "32 dari 50 soal benar" · "nilai AI 74/100"
  fraction: number; // 0–1 (untuk bar)
  informational?: boolean; // subtes yang tidak dihitung di skala resmi ujian ini
  belowMin?: boolean; // JLPT: di bawah nilai minimum per seksi
}

export interface OfficialScore {
  scale: ScoreScale;
  scaleLabel: string; // "TOEFL ITP"
  headline: string; // "437" · "6.5"
  unit: string; // "ITP" · "iBT" · "Band" · "/180"
  min: number;
  max: number;
  fraction: number; // posisi skor di dalam rentang skala (untuk bar)
  verdict: string | null; // "Lulus" · "Level 4" · null
  rangeLabel: string; // "Skala 310–677"
  skills: OfficialSkill[];
  partial: boolean; // ada subtes resmi yang tak ada di simulasi ini
  estimateOnly: boolean; // rincian per subtes tak tersedia → estimasi kasar
  note: string;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const roundHalf = (n: number) => Math.round(n * 2) / 2;

// ── Deteksi skala dari jenis + varian tes ────────────────────────────────────
export function detectScoreScale(
  testType: TestType | undefined,
  title?: string | null,
  variant?: TestVariant | null,
): ScoreScale {
  if (testType === "ielts") return "ielts";
  if (testType === "jlpt") return "jlpt";
  if (testType === "hsk") return "hsk";
  if (testType === "topik") return "topik";
  if (testType === "goethe") return "goethe";
  // TOEFL — varian eksplisit paling andal; fallback ke petunjuk pada judul.
  if (variant === "ibt") return "toefl_ibt";
  if (variant === "itp") return "toefl_itp";
  const t = (title ?? "").toLowerCase();
  if (/\bibt\b/.test(t)) return "toefl_ibt";
  if (/\bitp\b|\bpbt\b|prediction|prediksi/.test(t)) return "toefl_itp";
  return "toefl_itp"; // default TOEFL "ratusan" (ITP/Prediction)
}

// ── Interpolasi tabel konversi ───────────────────────────────────────────────
// Tabel resmi panjang (tiap raw score punya nilainya); di sini disimpan sebagai
// titik jangkar tiap 5 soal lalu diinterpolasi linear di antaranya — hasilnya
// meleset paling banyak 1 poin dari tabel cetaknya.
type Anchor = [raw: number, converted: number];
function interp(anchors: Anchor[], raw: number): number {
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (raw <= first[0]) return first[1];
  if (raw >= last[0]) return last[1];
  for (let i = 1; i < anchors.length; i++) {
    const [x1, y1] = anchors[i];
    if (raw <= x1) {
      const [x0, y0] = anchors[i - 1];
      return y0 + ((raw - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return last[1];
}

// TOEFL ITP/PBT — tabel konversi tiap seksi (nilai seksi 20–68).
const ITP_LISTENING: Anchor[] = [[0, 24], [5, 27], [10, 31], [15, 41], [20, 45], [25, 48], [30, 51], [35, 54], [40, 57], [45, 62], [50, 68]];
const ITP_STRUCTURE: Anchor[] = [[0, 20], [5, 24], [10, 33], [15, 40], [20, 44], [25, 49], [30, 54], [35, 60], [40, 68]];
const ITP_READING: Anchor[] = [[0, 21], [5, 24], [10, 29], [15, 35], [20, 40], [25, 43], [30, 48], [35, 52], [40, 55], [45, 60], [50, 67]];

// TOEFL iBT — raw (dalam persen benar) → nilai seksi 0–30 (Reading/Listening).
const IBT_CURVE: Anchor[] = [
  [0, 0], [7, 1], [13, 2], [20, 4], [27, 7], [33, 9], [40, 12], [47, 14],
  [53, 17], [60, 19], [67, 21], [73, 23], [80, 25], [87, 27], [93, 29], [100, 30],
];

// IELTS — raw benar dari 40 soal → band. Ambang = nilai minimum tiap band.
type BandStep = [minRaw: number, band: number];
const IELTS_LISTENING: BandStep[] = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5],
  [16, 5], [13, 4.5], [11, 4], [8, 3.5], [6, 3], [4, 2.5], [3, 2], [2, 1.5], [1, 1], [0, 0],
];
const IELTS_READING_ACADEMIC: BandStep[] = [
  [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5],
  [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [3, 2], [2, 1.5], [1, 1], [0, 0],
];
const IELTS_READING_GENERAL: BandStep[] = [
  [40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5],
  [23, 5], [19, 4.5], [15, 4], [12, 3.5], [9, 3], [6, 2.5], [4, 2], [2, 1.5], [1, 1], [0, 0],
];
function bandOf(steps: BandStep[], raw: number): number {
  for (const [minRaw, band] of steps) if (raw >= minRaw) return band;
  return 0;
}
// Pembulatan resmi band keseluruhan IELTS: sisa ≥.25 → .5, sisa ≥.75 → naik 1.
function ieltsOverall(bands: number[]): number {
  const m = mean(bands);
  const base = Math.floor(m);
  const f = m - base;
  return f < 0.25 ? base : f < 0.75 ? base + 0.5 : base + 1;
}

// Ambang lulus JLPT per level (total selalu skala 180).
const JLPT_PASS: Partial<Record<TestVariant, number>> = { n5: 80, n4: 90, n3: 95, n2: 90, n1: 100 };

export const SCALE_LABEL: Record<ScoreScale, string> = {
  toefl_itp: "TOEFL ITP",
  toefl_ibt: "TOEFL iBT",
  ielts: "IELTS",
  jlpt: "JLPT",
  hsk: "HSK",
  topik: "TOPIK",
  goethe: "Goethe-Zertifikat",
};

// ── Spesifikasi skala ────────────────────────────────────────────────────────
interface SectionSpec {
  key: string;
  label: string;
  skills: Skill[]; // skill di simulasi yang mengisi seksi ini
  max: number; // nilai maksimum seksi
  min?: number; // nilai minimum kelulusan seksi (JLPT)
  convert: (fraction: number) => number; // persen benar → nilai seksi
  band?: boolean; // tampilkan sebagai "Band x.x"
}
interface ScaleSpec {
  unit: string;
  min: number;
  max: number;
  totalMax: number; // penjumlahan maksimum semua seksi (untuk skor total)
  sections: SectionSpec[];
  // total dari seksi yang ADA; `scaled` = sudah diproporsikan ke seluruh seksi.
  total: (present: { spec: SectionSpec; value: number }[], scaled: number) => number;
  format: (value: number) => string;
  verdict?: (value: number, present: { spec: SectionSpec; value: number }[]) => string | null;
  note: string;
}

// Konversi objektif: persen benar → raw soal resmi → tabel seksi.
const viaTable = (items: number, table: Anchor[]) => (f: number) => interp(table, f * items);
const linearTo = (max: number) => (f: number) => f * max;

function scaleSpec(scale: ScoreScale, variant?: TestVariant | null): ScaleSpec {
  if (scale === "toefl_itp") {
    return {
      unit: "ITP", min: 310, max: 677, totalMax: 680, // 68 × 10 — total dihitung di total()
      sections: [
        { key: "listening", label: "Section 1 — Listening Comprehension", skills: ["listening"], max: 68, convert: viaTable(50, ITP_LISTENING) },
        { key: "structure", label: "Section 2 — Structure & Written Expression", skills: ["structure"], max: 68, convert: viaTable(40, ITP_STRUCTURE) },
        { key: "reading", label: "Section 3 — Reading Comprehension", skills: ["reading"], max: 68, convert: viaTable(50, ITP_READING) },
      ],
      // Skor total ITP = (S1 + S2 + S3) / 3 × 10 → 310–677.
      total: (present) => Math.max(310, Math.min(677, Math.round(mean(present.map((p) => p.value)) * 10))),
      format: (v) => String(Math.round(v)),
      note: "Nilai tiap seksi memakai tabel konversi TOEFL ITP (20–68), lalu total = rata-rata seksi × 10.",
    };
  }
  if (scale === "toefl_ibt") {
    return {
      unit: "iBT", min: 0, max: 120, totalMax: 120,
      sections: [
        { key: "reading", label: "Reading", skills: ["reading"], max: 30, convert: (f) => interp(IBT_CURVE, f * 100) },
        { key: "listening", label: "Listening", skills: ["listening"], max: 30, convert: (f) => interp(IBT_CURVE, f * 100) },
        { key: "speaking", label: "Speaking", skills: ["speaking"], max: 30, convert: linearTo(30) },
        { key: "writing", label: "Writing", skills: ["writing"], max: 30, convert: linearTo(30) },
      ],
      total: (_p, scaled) => Math.max(0, Math.min(120, Math.round(scaled))),
      format: (v) => String(Math.round(v)),
      note: "Tiap seksi diskalakan 0–30 (Reading & Listening lewat tabel konversi iBT), total 0–120.",
    };
  }
  if (scale === "ielts") {
    const readingTable = variant === "general" ? IELTS_READING_GENERAL : IELTS_READING_ACADEMIC;
    return {
      unit: "Band", min: 0, max: 9, totalMax: 9,
      sections: [
        { key: "listening", label: "Listening", skills: ["listening"], max: 9, band: true, convert: (f) => bandOf(IELTS_LISTENING, Math.round(f * 40)) },
        { key: "reading", label: "Reading", skills: ["reading"], max: 9, band: true, convert: (f) => bandOf(readingTable, Math.round(f * 40)) },
        { key: "writing", label: "Writing", skills: ["writing"], max: 9, band: true, convert: (f) => roundHalf(f * 9) },
        { key: "speaking", label: "Speaking", skills: ["speaking"], max: 9, band: true, convert: (f) => roundHalf(f * 9) },
      ],
      // Overall band = rata-rata band keempat skill, dibulatkan aturan resmi.
      total: (present) => ieltsOverall(present.map((p) => p.value)),
      format: (v) => v.toFixed(1),
      note: "Listening & Reading dikonversi lewat tabel band resmi (dari 40 soal); Writing & Speaking dari penilaian AI. Overall band = rata-rata keempatnya (pembulatan resmi ke 0,5).",
    };
  }
  if (scale === "jlpt") {
    const threeSections = variant === "n1" || variant === "n2" || variant === "n3";
    const sections: SectionSpec[] = threeSections
      ? [
          { key: "goi", label: "Pengetahuan Bahasa (文字・語彙・文法)", skills: ["structure"], max: 60, min: 19, convert: linearTo(60) },
          { key: "dokkai", label: "Membaca (読解)", skills: ["reading"], max: 60, min: 19, convert: linearTo(60) },
          { key: "choukai", label: "Menyimak (聴解)", skills: ["listening"], max: 60, min: 19, convert: linearTo(60) },
        ]
      : [
          { key: "goi", label: "Pengetahuan Bahasa & Membaca", skills: ["structure", "reading"], max: 120, min: 38, convert: linearTo(120) },
          { key: "choukai", label: "Menyimak (聴解)", skills: ["listening"], max: 60, min: 19, convert: linearTo(60) },
        ];
    const pass = JLPT_PASS[variant ?? "n3"] ?? 90;
    return {
      unit: "/180", min: 0, max: 180, totalMax: 180,
      sections,
      total: (_p, scaled) => Math.max(0, Math.min(180, Math.round(scaled))),
      format: (v) => String(Math.round(v)),
      verdict: (v, present) => {
        const belowMin = present.some((p) => p.spec.min != null && p.value < p.spec.min);
        if (v < pass) return `Belum lulus (butuh ${pass}/180)`;
        if (belowMin) return "Belum lulus (ada seksi di bawah nilai minimum)";
        return "Lulus";
      },
      note: `Tiap seksi diskalakan ke nilai resminya, total 0–180. Lulus butuh ${pass}/180 DAN tiap seksi memenuhi nilai minimum.`,
    };
  }
  if (scale === "hsk") {
    const two = variant === "hsk1" || variant === "hsk2"; // HSK 1–2: tanpa 书写
    const sections: SectionSpec[] = [
      { key: "listening", label: "Menyimak (听力)", skills: ["listening"], max: 100, convert: linearTo(100) },
      { key: "reading", label: "Membaca (阅读)", skills: ["reading"], max: 100, convert: linearTo(100) },
    ];
    if (!two) sections.push({ key: "writing", label: "Menulis (书写)", skills: ["writing"], max: 100, convert: linearTo(100) });
    const totalMax = two ? 200 : 300;
    const pass = two ? 120 : 180;
    return {
      unit: `/${totalMax}`, min: 0, max: totalMax, totalMax,
      sections,
      total: (_p, scaled) => Math.max(0, Math.min(totalMax, Math.round(scaled))),
      format: (v) => String(Math.round(v)),
      verdict: (v) => (v >= pass ? "Lulus" : `Belum lulus (butuh ${pass}/${totalMax})`),
      note: `Tiap bagian bernilai 100 poin. Lulus bila total minimal ${pass}/${totalMax}.`,
    };
  }
  if (scale === "topik") {
    const two = variant === "topik2"; // TOPIK II pakai 쓰기 (menulis)
    const sections: SectionSpec[] = [
      { key: "listening", label: "Menyimak (듣기)", skills: ["listening"], max: 100, convert: linearTo(100) },
      { key: "reading", label: "Membaca (읽기)", skills: ["reading"], max: 100, convert: linearTo(100) },
    ];
    if (two) sections.push({ key: "writing", label: "Menulis (쓰기)", skills: ["writing"], max: 100, convert: linearTo(100) });
    const totalMax = two ? 300 : 200;
    return {
      unit: `/${totalMax}`, min: 0, max: totalMax, totalMax,
      sections,
      total: (_p, scaled) => Math.max(0, Math.min(totalMax, Math.round(scaled))),
      format: (v) => String(Math.round(v)),
      verdict: (v) => {
        if (two) {
          if (v >= 230) return "Level 6";
          if (v >= 190) return "Level 5";
          if (v >= 150) return "Level 4";
          if (v >= 120) return "Level 3";
          return "Belum lulus (butuh 120/300)";
        }
        if (v >= 140) return "Level 2";
        if (v >= 80) return "Level 1";
        return "Belum lulus (butuh 80/200)";
      },
      note: two
        ? "Tiap bagian 100 poin (total 300). Level 3 ≥120 · Level 4 ≥150 · Level 5 ≥190 · Level 6 ≥230."
        : "Tiap bagian 100 poin (total 200). Level 1 ≥80 · Level 2 ≥140.",
    };
  }
  // Goethe — 4 modul, tiap modul 100 poin, lulus 60.
  return {
    unit: "/100", min: 0, max: 100, totalMax: 100,
    sections: [
      { key: "reading", label: "Lesen (Membaca)", skills: ["reading"], max: 100, convert: linearTo(100) },
      { key: "listening", label: "Hören (Menyimak)", skills: ["listening"], max: 100, convert: linearTo(100) },
      { key: "writing", label: "Schreiben (Menulis)", skills: ["writing"], max: 100, convert: linearTo(100) },
      { key: "speaking", label: "Sprechen (Berbicara)", skills: ["speaking"], max: 100, convert: linearTo(100) },
    ],
    total: (present) => Math.round(mean(present.map((p) => p.value))),
    format: (v) => String(Math.round(v)),
    verdict: (v) => (v >= 60 ? "Lulus" : "Belum lulus (butuh 60/100)"),
    note: "Tiap modul bernilai 100 poin; nilai akhir = rata-rata modul. Lulus bila minimal 60 poin.",
  };
}

const SKILL_TITLE: Record<Skill, string> = {
  reading: "Reading", listening: "Listening", writing: "Writing",
  speaking: "Speaking", structure: "Structure",
};

// Gabungkan beberapa skill jadi satu seksi resmi (mis. JLPT N5: Pengetahuan
// Bahasa + Membaca dihitung satu seksi 120 poin).
function mergeSkills(rows: SkillRaw[]): { fraction: number; detail: string } | null {
  if (!rows.length) return null;
  const objective = rows.reduce((n, r) => n + r.objective, 0);
  if (objective > 0) {
    const correct = rows.reduce((n, r) => n + r.correct, 0);
    return { fraction: clamp01(correct / objective), detail: `${correct} dari ${objective} soal benar` };
  }
  const ai = rows.flatMap((r) => r.aiScores);
  if (ai.length) {
    const v = Math.round(mean(ai));
    return { fraction: clamp01(v / 100), detail: `nilai AI ${v}/100` };
  }
  const max = rows.reduce((n, r) => n + r.max, 0);
  if (max > 0) {
    const earned = rows.reduce((n, r) => n + r.earned, 0);
    return { fraction: clamp01(earned / max), detail: `${Math.round(earned)} dari ${Math.round(max)} poin` };
  }
  return { fraction: 0, detail: "belum dinilai" };
}

/**
 * Skor pada skala resmi ujian.
 *
 * `skills` = rincian per subtes (dari jawaban attempt). Bila kosong, dipakai
 * `aggregate` (total poin attempt) sebagai estimasi kasar: persen totalnya
 * diterapkan ke semua seksi resmi — hasilnya tetap berada di rentang skala yang
 * benar, cuma tak bisa membedakan kekuatan antar-subtes.
 *
 * Kembalikan null bila tak ada apa pun untuk dikonversi: belum dinilai, atau
 * skornya nol (lihat [sim-blank-attempt-v1] di bawah).
 */
export function officialScore(input: {
  testType: TestType;
  variant?: TestVariant | null;
  title?: string | null;
  skills?: SkillRaw[];
  aggregate?: { score: number | null; max: number | null } | null;
}): OfficialScore | null {
  const scale = detectScoreScale(input.testType, input.title, input.variant);
  const spec = scaleSpec(scale, input.variant);
  const rows = input.skills ?? [];
  const hasRows = rows.some((r) => r.objective > 0 || r.aiScores.length > 0 || r.max > 0);

  // [sim-blank-attempt-v1] Hasil NOL tidak dikonversi.
  // Skala resmi punya batas bawah yang bukan nol (TOEFL ITP mulai 310, IELTS band
  // 0 pun tetap "band"), jadi attempt yang tak menghasilkan poin sama sekali —
  // ditinggal lalu auto-submit saat waktu habis — akan tampil "0/110 → 310 ITP"
  // seolah itu hasil ujian sungguhan. Tanpa satu pun jawaban benar / nilai AI,
  // tidak ada yang bisa dipetakan ke tabel konversi: kembalikan null → UI "—".
  const evidence = hasRows
    ? rows.reduce((n, r) => n + r.correct + r.aiScores.reduce((x, y) => x + y, 0) + Math.max(0, r.earned), 0)
    : (input.aggregate?.score ?? 0);
  if (evidence <= 0) return null;

  // Fallback: tanpa rincian subtes → pakai persen total poin untuk semua seksi.
  let flatFraction: number | null = null;
  if (!hasRows) {
    const agg = input.aggregate;
    if (!agg || agg.score == null || !agg.max) return null;
    flatFraction = clamp01(agg.score / agg.max);
  }

  const skills: OfficialSkill[] = [];
  const present: { spec: SectionSpec; value: number }[] = [];
  const usedSkills = new Set<Skill>();

  for (const sec of spec.sections) {
    const secRows = rows.filter((r) => sec.skills.includes(r.skill));
    secRows.forEach((r) => usedSkills.add(r.skill));
    const merged = flatFraction != null
      ? { fraction: flatFraction, detail: "estimasi dari total poin" }
      : mergeSkills(secRows);
    if (!merged) {
      skills.push({
        key: sec.key, skills: sec.skills, label: sec.label, value: null, max: sec.max,
        display: "—", detail: "tidak ada di simulasi ini", fraction: 0,
      });
      continue;
    }
    const raw = sec.convert(merged.fraction);
    const value = sec.band ? roundHalf(raw) : Math.round(raw);
    present.push({ spec: sec, value });
    skills.push({
      key: sec.key, skills: sec.skills, label: sec.label, value, max: sec.max,
      display: sec.band ? `Band ${value.toFixed(1)}` : String(value),
      detail: merged.detail,
      // Bar memakai persen benar, bukan value/max — nilai terendah beberapa
      // skala bukan nol (ITP mulai 20) sehingga bar akan tampak terisi padahal
      // tak ada jawaban benar.
      fraction: merged.fraction,
      belowMin: sec.min != null && value < sec.min,
    });
  }

  // Subtes di simulasi yang tak punya tempat di skala resmi ujian ini
  // (mis. Writing di TOEFL ITP) — ditampilkan sebagai info, tak masuk total.
  for (const r of rows) {
    if (usedSkills.has(r.skill)) continue;
    if (spec.sections.some((s) => s.skills.includes(r.skill))) continue;
    const merged = mergeSkills([r]);
    if (!merged) continue;
    skills.push({
      key: `info-${r.skill}`, skills: [r.skill], label: SKILL_TITLE[r.skill] ?? r.skill,
      value: null, max: 100, display: `${Math.round(merged.fraction * 100)}%`,
      detail: merged.detail, fraction: merged.fraction, informational: true,
    });
  }

  if (!present.length) return null;

  // Proporsi total: bila hanya sebagian seksi resmi yang ada di simulasi, skor
  // total diperkirakan proporsional (mis. cuma Reading → total dihitung seolah
  // seksi lain setara). Ditandai `partial` supaya UI bisa memberi catatan.
  const presentMax = present.reduce((n, p) => n + p.spec.max, 0);
  const allMax = spec.sections.reduce((n, s) => n + s.max, 0);
  const sum = present.reduce((n, p) => n + p.value, 0);
  const scaled = presentMax > 0 ? (sum / presentMax) * spec.totalMax : 0;
  const value = spec.total(present, scaled);
  const partial = present.length < spec.sections.length || presentMax < allMax;

  return {
    scale,
    scaleLabel: SCALE_LABEL[scale],
    headline: spec.format(value),
    unit: spec.unit,
    min: spec.min,
    max: spec.max,
    fraction: spec.max > spec.min ? clamp01((value - spec.min) / (spec.max - spec.min)) : 0,
    verdict: spec.verdict ? spec.verdict(value, present) : null,
    rangeLabel: `Skala ${spec.min}–${spec.max}`,
    skills,
    partial,
    estimateOnly: flatFraction != null,
    note: spec.note,
  };
}

// Ringkasan satu baris untuk daftar/riwayat, mis. "437 ITP" · "Band 6.5".
export function officialScoreShort(s: OfficialScore): string {
  return s.unit.startsWith("/") ? `${s.headline}${s.unit}` : `${s.headline} ${s.unit}`;
}

// ── Skor terbaik lintas pengerjaan ───────────────────────────────────────────
// [sim-score-report-v1] Meniru cara laporan skor resmi menampilkan nilai TERTINGGI
// tiap seksi dari semua tanggal tes yang masih berlaku (di TOEFL iBT namanya
// MyBest Scores). Berguna di laporan Linguo karena siswa biasanya mengulang
// simulasi beberapa kali dan puncak tiap seksi jatuh di tanggal yang berbeda.
export interface BestSectionScore {
  key: string;
  label: string;
  value: number | null; // null = seksi ini belum pernah diujikan
  max: number;
  display: string;
  testDate: string | null; // tanggal pengerjaan yang menghasilkan nilai ini
}

export interface BestScores {
  headline: string; // total dari gabungan nilai tertinggi tiap seksi
  unit: string;
  sections: BestSectionScore[];
  attempts: number; // banyak pengerjaan yang ikut dihitung
  asOf: string | null; // pengerjaan terbaru yang ikut dihitung
  partial: boolean; // masih ada seksi resmi yang belum pernah diujikan
}

/**
 * Gabungkan beberapa hasil pada SKALA YANG SAMA jadi satu ringkasan "nilai
 * tertinggi tiap seksi". Total dihitung dengan rumus resmi ujiannya (bukan
 * dijumlah mentah), jadi ITP tetap rata-rata seksi × 10 dan IELTS tetap
 * pembulatan band resmi.
 */
export function bestScores(
  scale: ScoreScale,
  variant: TestVariant | null | undefined,
  entries: Array<{ official: OfficialScore; submittedAt: string | null }>,
): BestScores | null {
  const rows = entries.filter((e) => e.official.scale === scale);
  if (!rows.length) return null;

  const spec = scaleSpec(scale, variant);
  const sections: BestSectionScore[] = [];
  const present: { spec: SectionSpec; value: number }[] = [];

  for (const sec of spec.sections) {
    let best: { value: number; display: string; date: string | null } | null = null;
    for (const r of rows) {
      const s = r.official.skills.find((k) => k.key === sec.key);
      if (!s || s.value == null || s.informational) continue;
      if (!best || s.value > best.value) best = { value: s.value, display: s.display, date: r.submittedAt };
    }
    if (!best) {
      sections.push({ key: sec.key, label: sec.label, value: null, max: sec.max, display: "—", testDate: null });
      continue;
    }
    present.push({ spec: sec, value: best.value });
    sections.push({ key: sec.key, label: sec.label, value: best.value, max: sec.max, display: best.display, testDate: best.date });
  }
  if (!present.length) return null;

  // Sama persis dengan officialScore(): seksi yang tak ada diperkirakan
  // proporsional supaya totalnya tetap berada di rentang skala yang benar.
  const presentMax = present.reduce((n, p) => n + p.spec.max, 0);
  const sum = present.reduce((n, p) => n + p.value, 0);
  const scaled = presentMax > 0 ? (sum / presentMax) * spec.totalMax : 0;
  const dates = rows.map((r) => r.submittedAt).filter(Boolean).sort() as string[];

  return {
    headline: spec.format(spec.total(present, scaled)),
    unit: spec.unit,
    sections,
    attempts: rows.length,
    asOf: dates.length ? dates[dates.length - 1] : null,
    partial: present.length < spec.sections.length,
  };
}
