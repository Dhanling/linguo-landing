import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

// Compact format: [number, title] or [number, title, topics[]]
type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

const titleOnly = (titles: string[]): SessionPreview[] =>
  titles.map((title, i) => ({ number: i + 1, title }));

// ============================================================
// CATATAN PEDAGOGIS
// TOEFL ITP terdiri dari 3 section:
//   Section 1 — Listening Comprehension (50 soal, 35 menit)
//   Section 2 — Structure & Written Expression (40 soal, 25 menit)
//   Section 3 — Reading Comprehension (50 soal, 55 menit)
// Skor: 310–677. Target program ini: 500–550+
// Prasyarat: Inggris umum minimal B1
// ============================================================

// ============================================================
// LEVEL 1 — B1.1 · FOUNDATION (16 sesi, FULLY PREVIEWED)
// Tujuan: Memahami format tes + membangun fondasi 3 section
// ============================================================
const foundation = toSessions([
  [1,  "TOEFL ITP Overview & Scoring System",        ["format 3 section", "scoring 310–677", "strategi umum", "perbedaan ITP vs iBT"]],
  [2,  "Listening Section 1: Short Conversations",   ["setting & topic detection", "paraphrase recognition", "negation & double negative"]],
  [3,  "Listening Section 1: Common Topics",         ["daily life conversations", "campus dialogue", "inference questions"]],
  [4,  "Listening Section 2: Extended Conversations", ["multi-speaker dialogue", "main idea vs detail", "attitude questions"]],
  [5,  "Listening Section 3: Mini-Lectures",         ["academic monologue", "note-taking strategies", "signal words"]],
  [6,  "Structure: Subject-Verb Agreement",          ["singular/plural", "compound subjects", "inverted sentences"]],
  [7,  "Structure: Verb Forms & Tense Consistency",  ["perfect tenses", "passive voice", "modal verbs"]],
  [8,  "Structure: Clauses & Connectors",            ["relative clauses", "adverb clauses", "noun clauses"]],
  [9,  "Written Expression: Common Error Types",     ["wrong word form", "redundancy", "parallelism errors"]],
  [10, "Written Expression: Prepositions & Articles", ["in/on/at", "a vs the", "zero article"]],
  [11, "Reading: Main Idea & Topic Sentences",       ["paragraph structure", "academic passage mapping", "title questions"]],
  [12, "Reading: Vocabulary in Context",             ["context clues", "word family", "tone inference"]],
  [13, "Reading: Inference & Implied Meaning",       ["reading between lines", "author purpose", "except questions"]],
  [14, "Reading: Reference & Pronoun Questions",     ["pronoun antecedent", "this/that/it reference", "logical flow"]],
  [15, "Academic Vocabulary for All 3 Sections",     ["AWL high frequency", "collocations", "formal vs informal"]],
  [16, "Foundation Mock Test & Score Baseline",      ["timed Section 1 drill", "Structure 20 soal", "Reading passage x2"]],
]);

// ============================================================
// LEVEL 2 — B1.2 · CORE SKILLS (16 sesi)
// Tujuan: Drill tiap section intensif, target skor 450–480
// ============================================================
const coreSkills = titleOnly([
  "Listening: Paraphrase & Synonym Drills (S1)",
  "Listening: Negation, Conditionals & Suggestions (S1)",
  "Listening: Extended Conversation Simulation (S2)",
  "Listening: Academic Lecture Simulation (S3)",
  "Listening: Full Section 1–3 Timed Drill (35 menit)",
  "Structure: Parallel Structure & Comparison",
  "Structure: Gerund vs Infinitive Constructions",
  "Structure: Reduction — Participle & Relative Clause",
  "Written Expression: Adjective & Adverb Confusion",
  "Written Expression: Incorrect Word Choice (Diction)",
  "Structure & Written Expression Full Simulation (25 menit)",
  "Reading: Detail & Scanning Questions",
  "Reading: Except / NOT Questions Strategy",
  "Reading: Passage from Natural Science",
  "Reading: Passage from Social Science & History",
  "Core Skills Mock Test — Target Skor 450",
]);

// ============================================================
// LEVEL 3 — B2.1 · ADVANCED SKILLS (16 sesi)
// Tujuan: Tingkatkan akurasi & kecepatan, target skor 480–520
// ============================================================
const advancedSkills = titleOnly([
  "Listening: Attitude & Inference — Advanced Drills",
  "Listening: Rapid-Speech Comprehension Training",
  "Listening: Authentic Academic Lecture (Full S3)",
  "Structure: Subjunctive & Conditional Sentences",
  "Structure: Inversion & Emphatic Do/Did",
  "Written Expression: Advanced Error Detection Drills",
  "Written Expression: Mixed Error Types — Speed Round",
  "Reading: Passage from Physical Science",
  "Reading: Passage from Arts & Humanities",
  "Reading: Time Management — 55 Menit Full Simulation",
  "Reading: Eliminating Wrong Answers Systematically",
  "Vocabulary: Roots, Prefixes & Suffixes Strategy",
  "Cross-Section Review: Common Paraphrase Patterns",
  "Error Analysis: Top 20 Trap Questions TOEFL ITP",
  "Advanced Section Simulation (All 3, Partial Timed)",
  "Advanced Mock Test — Target Skor 500",
]);

// ============================================================
// LEVEL 4 — B2.2 · EXAM MASTERY (16 sesi)
// Tujuan: Full simulation + eliminasi kesalahan, target 550+
// ============================================================
const examMastery = titleOnly([
  "Score Maximization: Listening Guessing Strategy",
  "Score Maximization: Structure Process of Elimination",
  "Score Maximization: Reading — Never Leave Blank",
  "Full Mock Test 1 — Exam Conditions (115 menit)",
  "Mock Test 1 Score Report & Section Analysis",
  "Listening: Targeted Weakness Drill (post-Mock 1)",
  "Structure: Targeted Weakness Drill (post-Mock 1)",
  "Reading: Targeted Weakness Drill (post-Mock 1)",
  "Full Mock Test 2 — Exam Conditions",
  "Mock Test 2 Score Report & Improvement Tracking",
  "High-Frequency Grammar Rules — Final Review",
  "High-Frequency Vocabulary — Final Review",
  "Exam Day Protocol: Timing, Pacing, Stress Management",
  "Full Mock Test 3 — Final Readiness Assessment",
  "Mock Test 3 Score Analysis & Final Coaching",
  "Final Session: Strategy Consolidation & Exam Briefing",
]);

// ============================================================
// CURRICULUM EXPORT
// ============================================================
const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("toefl-itp")!,
  overview:
    "Program 64 sesi intensif (±96 jam) untuk meraih skor TOEFL ITP 500–550+. Dirancang untuk siswa dengan kemampuan Inggris umum minimal B1. Mencakup ketiga section tes: Listening Comprehension, Structure & Written Expression, dan Reading Comprehension. Setiap level diakhiri full mock test dengan skor aktual.",
  levels: [
    {
      code: "B1.1",
      name: "Foundation",
      description:
        "Memahami format TOEFL ITP dan membangun fondasi strategi untuk ketiga section. Termasuk baseline mock test untuk mengetahui starting score.",
      sublevels: [
        {
          code: "B1.1",
          name: "TOEFL ITP Foundation",
          sessions: foundation,
          preview: true,
        },
      ],
    },
    {
      code: "B1.2",
      name: "Core Skills",
      description:
        "Drill intensif per section dengan soal-soal authentic. Fokus pada pola soal yang paling sering muncul. Target skor 450.",
      sublevels: [
        {
          code: "B1.2",
          name: "Core Skills Drill",
          sessions: coreSkills,
          preview: false,
        },
      ],
    },
    {
      code: "B2.1",
      name: "Advanced Skills",
      description:
        "Tingkatkan akurasi dan kecepatan menjawab. Latihan soal-soal tingkat tinggi dan strategi eliminasi jawaban. Target skor 500.",
      sublevels: [
        {
          code: "B2.1",
          name: "Advanced Skills",
          sessions: advancedSkills,
          preview: false,
        },
      ],
    },
    {
      code: "B2.2",
      name: "Exam Mastery",
      description:
        "Full mock test dalam kondisi ujian nyata. Analisis skor mendalam, eliminasi kelemahan, dan strategi hari-H untuk meraih 550+.",
      sublevels: [
        {
          code: "B2.2",
          name: "Exam Mastery",
          sessions: examMastery,
          preview: false,
        },
      ],
    },
  ],
};

export default curriculum;
