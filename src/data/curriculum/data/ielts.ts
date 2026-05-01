import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

// Compact format: [number, title] or [number, title, topics[]]
type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

const titleOnly = (titles: string[]): SessionPreview[] =>
  titles.map((title, i) => ({ number: i + 1, title }));

// ============================================================
// LEVEL 1 — B1.1 · FOUNDATION (16 sesi, FULLY PREVIEWED)
// Tujuan: Membangun fondasi 4 skills + vocab akademik
// Prasyarat: Inggris umum minimal B1
// ============================================================
const foundation = toSessions([
  [1,  "IELTS Overview & Band Descriptors",       ["format tes", "band 5–9", "Academic vs General Training", "strategi umum"]],
  [2,  "Academic Vocabulary: Word Families",       ["noun/verb/adj forms", "affixes", "collocations", "AWL top 50"]],
  [3,  "Reading: Skimming & Scanning",             ["locate key info", "topic sentences", "passage mapping"]],
  [4,  "Reading: True/False/Not Given",            ["distinguish fact vs claim", "trap words", "negation traps"]],
  [5,  "Reading: Matching Headings & MCQ",         ["paragraph themes", "eliminate distractors", "time management"]],
  [6,  "Listening: Note Completion",               ["predict answer type", "spelling focus", "paraphrase traps"]],
  [7,  "Listening: Multiple Choice & Maps",        ["Section 1–2 tactics", "direction vocab", "label diagrams"]],
  [8,  "Grammar for Writing: Tense & Voice",       ["passive constructions", "perfect tenses", "formal register"]],
  [9,  "Grammar for Writing: Complex Sentences",   ["relative clauses", "participles", "fronting structures"]],
  [10, "Writing Task 1: Describing Graphs",        ["line/bar/pie charts", "overview paragraph", "trends vocab"]],
  [11, "Writing Task 1: Process & Maps",           ["sequence language", "map change vocab", "passive for process"]],
  [12, "Writing Task 2: Essay Structure",          ["introduction formula", "body paragraph PEEL", "conclusion"]],
  [13, "Speaking Part 1: Personal Questions",      ["fluency over accuracy", "extend answers", "filler strategies"]],
  [14, "Speaking Part 2: Long Turn (Cue Card)",    ["1-minute prep", "structure response", "fillers & linking"]],
  [15, "Speaking Part 3: Abstract Discussion",     ["opinion language", "speculate & qualify", "topic expansion"]],
  [16, "Foundation Mock Test & Feedback",          ["timed Reading + Listening", "Writing Task 1", "Speaking P1"]],
]);

// ============================================================
// LEVEL 2 — B1.2 · CORE SKILLS (16 sesi)
// Tujuan: Drill intensif per skill, target Band 5.5–6.0
// ============================================================
const coreSkills = titleOnly([
  "Reading: Sentence Completion & Short Answer",
  "Reading: Summary Completion & Matching Features",
  "Reading Speed Drills (60 min simulation)",
  "Listening: Section 3 & 4 — Academic Context",
  "Listening: Form & Table Completion",
  "Listening: Full Section Simulation + Error Analysis",
  "Writing Task 1: Comparing Data (Two Charts)",
  "Writing Task 1: Describing Tables & Diagrams",
  "Writing Task 1 Timed Practice + Peer Feedback",
  "Writing Task 2: Opinion & Discussion Essays",
  "Writing Task 2: Problem & Solution Essays",
  "Writing Task 2 Timed Practice + Band Scoring",
  "Speaking: Pronunciation & Intonation",
  "Speaking: Lexical Resource — Synonyms & Idioms",
  "Speaking Full Simulation (Parts 1–3)",
  "Core Skills Mock Test — Band Target 5.5",
]);

// ============================================================
// LEVEL 3 — B2.1 · ADVANCED SKILLS (16 sesi)
// Tujuan: Tingkatkan akurasi & kompleksitas, target Band 6.5
// ============================================================
const advancedSkills = titleOnly([
  "Reading: Inference & Writer's Attitude Questions",
  "Reading: Passage from Science & Technology",
  "Reading: Passage from Social Science & History",
  "Listening: Implicit Meaning & Speaker Attitude",
  "Listening: Paraphrase Recognition Drills",
  "Listening: Authentic Lecture Simulation",
  "Writing Task 1: Advanced Trend Language & Hedging",
  "Writing Task 1: Mixed Data (Chart + Table)",
  "Writing Task 2: Advantages & Disadvantages Essays",
  "Writing Task 2: Two-Part Questions",
  "Writing Task 2: Coherence & Cohesion — Band 7 Criteria",
  "Writing Task 2: Grammatical Range — Targeting Band 7",
  "Speaking: Coherence — Discourse Markers & Signposting",
  "Speaking: Grammatical Range in Spoken English",
  "Speaking: Fluency Training — Reducing Hesitation",
  "Advanced Mock Test — Band Target 6.5",
]);

// ============================================================
// LEVEL 4 — B2.2 · EXAM MASTERY (16 sesi)
// Tujuan: Full exam simulation, error elimination, Band 7.0+
// ============================================================
const examMastery = titleOnly([
  "Band 7 Writing: Lexical Sophistication",
  "Band 7 Writing: Task Achievement Deep Dive",
  "Writing Task 1 & 2 Full Timed Exam (80 min)",
  "Writing Score Breakdown & Targeted Fixes",
  "Reading: Exam Conditions Full Paper (60 min)",
  "Reading: Answer Analysis & Trap Avoidance",
  "Listening: Full Paper Simulation (30 min)",
  "Listening: Score Maximization Strategies",
  "Speaking: Examiner Criteria — What Really Matters",
  "Speaking: Band 7 vs Band 6 Responses (Analysis)",
  "Speaking Full Simulation — Exam Conditions",
  "Full Mock Test 1 — All 4 Sections",
  "Full Mock Test 1 — Detailed Score Report",
  "Full Mock Test 2 — Targeted Weakness Focus",
  "Final Error Analysis & Exam Day Strategy",
  "Full Mock Test 3 — Final Readiness Check",
]);

// ============================================================
// CURRICULUM EXPORT
// ============================================================
const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("ielts")!,
  overview:
    "Program 64 sesi intensif (±96 jam) untuk meraih IELTS Band 6.5–7.0. Dirancang untuk siswa dengan kemampuan Inggris umum minimal B1. Mencakup semua komponen tes: Reading, Listening, Writing Task 1 & 2, dan Speaking Part 1–3. Setiap level diakhiri mock test dengan band scoring nyata.",
  levels: [
    {
      code: "B1.1",
      name: "Foundation",
      description:
        "Membangun fondasi 4 skills IELTS: memahami format tes, vocabulary akademik, dan strategi dasar tiap section.",
      sublevels: [
        {
          code: "B1.1",
          name: "IELTS Foundation",
          sessions: foundation,
          preview: true,
        },
      ],
    },
    {
      code: "B1.2",
      name: "Core Skills",
      description:
        "Drill intensif per skill dengan soal authentic. Target penguasaan Band 5.5–6.0 sebelum naik ke level advanced.",
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
        "Tingkatkan akurasi dan kompleksitas jawaban. Fokus pada kriteria Band 7 untuk Writing dan Speaking.",
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
        "Full mock test dalam kondisi ujian nyata. Error analysis mendalam dan strategi hari-H untuk meraih Band 7.0+.",
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
