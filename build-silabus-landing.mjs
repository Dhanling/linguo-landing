#!/usr/bin/env node
// Build Linguo.id landing /silabus section
// Run from ~/linguo-landing

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();

// Sanity
if (!fs.existsSync(path.join(ROOT, 'package.json'))) {
  console.error('❌ Run dari root linguo-landing');
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
console.log(`📦 Repo: ${pkg.name}\n`);
if (!fs.existsSync(path.join(ROOT, 'src/app'))) {
  console.error('❌ src/app tidak ditemukan — pastikan ini repo linguo-landing (Next.js)');
  process.exit(1);
}

const write = (rel, content) => {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.trimStart(), 'utf8');
  console.log(`  ✅ ${rel}`);
};

console.log('📝 Writing files...\n');

// ============================================================
// 1. TYPES
// ============================================================
write('src/data/curriculum/types.ts', `
export interface SessionPreview {
  number: number;
  title: string;
  topics?: string[];
}

export interface Sublevel {
  code: string;
  name: string;
  sessions: SessionPreview[];
  preview: boolean; // true = topics visible (gratis preview), false = titles only (locked)
}

export interface Level {
  code: "A1" | "A2" | "B1" | "B2";
  name: string;
  description: string;
  sublevels: Sublevel[];
}

export type Region = "asian" | "european" | "nusantara" | "middle-eastern" | "african" | "other";

export interface LanguageMeta {
  slug: string;
  name: string;         // Indonesian/English display name
  nativeName: string;   // self-name
  flag: string;         // emoji
  region: Region;
  featured?: boolean;
  available: boolean;   // has full curriculum data
  description?: string;
}

export interface LanguageCurriculum {
  meta: LanguageMeta;
  overview: string;
  levels: Level[];
}
`);

// ============================================================
// 2. LANGUAGE REGISTRY
// ============================================================
write('src/data/curriculum/languages.ts', `
import type { LanguageMeta } from "./types";

export const languages: LanguageMeta[] = [
  // === FEATURED / Priority ===
  { slug: "english",    name: "Inggris",   nativeName: "English",     flag: "🇬🇧", region: "european",       featured: true, available: true,  description: "Bahasa internasional — dari A1 sampai B2, TOEFL & IELTS ready." },
  { slug: "japanese",   name: "Jepang",    nativeName: "日本語",       flag: "🇯🇵", region: "asian",          featured: true, available: false, description: "Hiragana, Katakana, Kanji — dari nol sampai JLPT." },
  { slug: "korean",     name: "Korea",     nativeName: "한국어",       flag: "🇰🇷", region: "asian",          featured: true, available: false, description: "Hangul, tata bahasa Korea, TOPIK ready." },
  { slug: "mandarin",   name: "Mandarin",  nativeName: "中文",         flag: "🇨🇳", region: "asian",          featured: true, available: false, description: "Pinyin, Hanzi, HSK — metode Linguo untuk pemula." },
  { slug: "spanish",    name: "Spanyol",   nativeName: "Español",     flag: "🇪🇸", region: "european",       featured: true, available: false, description: "Bahasa 500 juta penutur di Eropa & Amerika Latin." },
  { slug: "french",     name: "Prancis",   nativeName: "Français",    flag: "🇫🇷", region: "european",       featured: true, available: false, description: "DELF/DALF prep, budaya Prancis, percakapan sehari-hari." },
  { slug: "german",     name: "Jerman",    nativeName: "Deutsch",     flag: "🇩🇪", region: "european",       featured: true, available: false, description: "Goethe A1–B2, persiapan studi di Jerman." },
  { slug: "italian",    name: "Italia",    nativeName: "Italiano",    flag: "🇮🇹", region: "european",       featured: true, available: false, description: "Dari ciao sampai conversazione — CILS ready." },
  { slug: "arabic",     name: "Arab",      nativeName: "العربية",      flag: "🇸🇦", region: "middle-eastern", featured: true, available: false, description: "Fusha & Ammiyah, untuk agama, studi, atau karier." },
  { slug: "hebrew",     name: "Ibrani",    nativeName: "עברית",        flag: "🇮🇱", region: "middle-eastern", featured: true, available: false, description: "Modern Hebrew dengan fokus percakapan & literasi." },
  { slug: "persian",    name: "Persia",    nativeName: "فارسی",        flag: "🇮🇷", region: "middle-eastern", featured: true, available: false, description: "Farsi — bahasa sastra Rumi, puisi klasik & modern." },
  { slug: "javanese",   name: "Jawa",      nativeName: "Basa Jawa",   flag: "🇮🇩", region: "nusantara",      featured: true, available: false, description: "Ngoko, Krama, Krama Inggil — filosofi Jawa lengkap." },
  { slug: "sundanese",  name: "Sunda",     nativeName: "Basa Sunda",  flag: "🇮🇩", region: "nusantara",      featured: true, available: false, description: "Loma, Lemes — bahasa Pasundan autentik." },
  { slug: "bipa",       name: "BIPA",      nativeName: "Bahasa Indonesia", flag: "🇮🇩", region: "nusantara", featured: true, available: false, description: "Bahasa Indonesia untuk Penutur Asing — BIPA resmi." },
  { slug: "georgian",   name: "Georgia",   nativeName: "ქართული",      flag: "🇬🇪", region: "other",          featured: true, available: false, description: "Kartuli — bahasa unik dengan aksara sendiri." },

  // === European ===
  { slug: "portuguese", name: "Portugis",  nativeName: "Português",   flag: "🇵🇹", region: "european", available: false },
  { slug: "dutch",      name: "Belanda",   nativeName: "Nederlands",  flag: "🇳🇱", region: "european", available: false },
  { slug: "russian",    name: "Rusia",     nativeName: "Русский",     flag: "🇷🇺", region: "european", available: false },
  { slug: "swedish",    name: "Swedia",    nativeName: "Svenska",     flag: "🇸🇪", region: "european", available: false },
  { slug: "norwegian",  name: "Norwegia",  nativeName: "Norsk",       flag: "🇳🇴", region: "european", available: false },
  { slug: "danish",     name: "Denmark",   nativeName: "Dansk",       flag: "🇩🇰", region: "european", available: false },
  { slug: "finnish",    name: "Finlandia", nativeName: "Suomi",       flag: "🇫🇮", region: "european", available: false },
  { slug: "polish",     name: "Polandia",  nativeName: "Polski",      flag: "🇵🇱", region: "european", available: false },
  { slug: "czech",      name: "Ceko",      nativeName: "Čeština",     flag: "🇨🇿", region: "european", available: false },
  { slug: "hungarian",  name: "Hungaria",  nativeName: "Magyar",      flag: "🇭🇺", region: "european", available: false },
  { slug: "romanian",   name: "Rumania",   nativeName: "Română",      flag: "🇷🇴", region: "european", available: false },
  { slug: "greek",      name: "Yunani",    nativeName: "Ελληνικά",     flag: "🇬🇷", region: "european", available: false },
  { slug: "turkish",    name: "Turki",     nativeName: "Türkçe",      flag: "🇹🇷", region: "european", available: false },
  { slug: "bulgarian",  name: "Bulgaria",  nativeName: "Български",   flag: "🇧🇬", region: "european", available: false },
  { slug: "ukrainian",  name: "Ukraina",   nativeName: "Українська",  flag: "🇺🇦", region: "european", available: false },
  { slug: "icelandic",  name: "Islandia",  nativeName: "Íslenska",    flag: "🇮🇸", region: "european", available: false },

  // === Asian ===
  { slug: "cantonese",  name: "Kanton",    nativeName: "廣東話",       flag: "🇭🇰", region: "asian", available: false },
  { slug: "vietnamese", name: "Vietnam",   nativeName: "Tiếng Việt",  flag: "🇻🇳", region: "asian", available: false },
  { slug: "thai",       name: "Thailand",  nativeName: "ภาษาไทย",     flag: "🇹🇭", region: "asian", available: false },
  { slug: "filipino",   name: "Filipina",  nativeName: "Tagalog",     flag: "🇵🇭", region: "asian", available: false },
  { slug: "khmer",      name: "Khmer",     nativeName: "ខ្មែរ",         flag: "🇰🇭", region: "asian", available: false },
  { slug: "lao",        name: "Laos",      nativeName: "ລາວ",          flag: "🇱🇦", region: "asian", available: false },
  { slug: "burmese",    name: "Myanmar",   nativeName: "မြန်မာ",        flag: "🇲🇲", region: "asian", available: false },
  { slug: "hindi",      name: "Hindi",     nativeName: "हिन्दी",         flag: "🇮🇳", region: "asian", available: false },
  { slug: "urdu",       name: "Urdu",      nativeName: "اردو",         flag: "🇵🇰", region: "asian", available: false },
  { slug: "bengali",    name: "Bengali",   nativeName: "বাংলা",         flag: "🇧🇩", region: "asian", available: false },
  { slug: "tamil",      name: "Tamil",     nativeName: "தமிழ்",         flag: "🇮🇳", region: "asian", available: false },
  { slug: "punjabi",    name: "Punjabi",   nativeName: "ਪੰਜਾਬੀ",        flag: "🇮🇳", region: "asian", available: false },
  { slug: "nepali",     name: "Nepal",     nativeName: "नेपाली",         flag: "🇳🇵", region: "asian", available: false },
  { slug: "mongolian",  name: "Mongol",    nativeName: "Монгол",      flag: "🇲🇳", region: "asian", available: false },

  // === Middle Eastern ===
  { slug: "kurdish",    name: "Kurdi",     nativeName: "Kurdî",       flag: "☀️", region: "middle-eastern", available: false },

  // === Nusantara ===
  { slug: "balinese",    name: "Bali",      nativeName: "Basa Bali",   flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "minangkabau", name: "Minang",    nativeName: "Minangkabau", flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "batak",       name: "Batak",     nativeName: "Hata Batak",  flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "bugis",       name: "Bugis",     nativeName: "Ugi",         flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "acehnese",    name: "Aceh",      nativeName: "Bahsa Acèh",  flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "banjar",      name: "Banjar",    nativeName: "Bahasa Banjar", flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "madurese",    name: "Madura",    nativeName: "Bhâsa Madhurâ", flag: "🇮🇩", region: "nusantara", available: false },
  { slug: "betawi",      name: "Betawi",    nativeName: "Bahasa Betawi", flag: "🇮🇩", region: "nusantara", available: false },

  // === African ===
  { slug: "swahili",     name: "Swahili",   nativeName: "Kiswahili",   flag: "🇰🇪", region: "african", available: false },
  { slug: "zulu",        name: "Zulu",      nativeName: "isiZulu",     flag: "🇿🇦", region: "african", available: false },
  { slug: "yoruba",      name: "Yoruba",    nativeName: "Yorùbá",      flag: "🇳🇬", region: "african", available: false },
  { slug: "amharic",     name: "Amhar",     nativeName: "አማርኛ",        flag: "🇪🇹", region: "african", available: false },

  // === Other / Classical ===
  { slug: "latin",       name: "Latin",     nativeName: "Latinum",     flag: "📜", region: "other", available: false },
  { slug: "esperanto",   name: "Esperanto", nativeName: "Esperanto",   flag: "🟢", region: "other", available: false },
  { slug: "armenian",    name: "Armenia",   nativeName: "Հայերեն",      flag: "🇦🇲", region: "other", available: false },
];

export const regionLabels: Record<string, string> = {
  "european": "Eropa",
  "asian": "Asia",
  "middle-eastern": "Timur Tengah",
  "nusantara": "Nusantara",
  "african": "Afrika",
  "other": "Klasik & Lainnya",
};

export const featuredLanguages = languages.filter((l) => l.featured);
export function getLanguageBySlug(slug: string) {
  return languages.find((l) => l.slug === slug);
}
`);

// ============================================================
// 3. ENGLISH CURRICULUM (FULL)
// ============================================================
write('src/data/curriculum/data/english.ts', `
import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

// Compact format: [number, title] or [number, title, topics[]]
type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

// ============ A1 — FULLY PREVIEWED ============
const a11 = toSessions([
  [1, "Alphabet & Pronunciation", ["26 huruf", "vokal", "konsonan", "silent letters"]],
  [2, "Greetings & Goodbyes", ["hello / hi", "good morning", "see you"]],
  [3, "Introducing Yourself", ["my name is", "nice to meet you", "nationality"]],
  [4, "Numbers 0–20", ["counting", "phone numbers", "age"]],
  [5, "Days & Months", ["7 hari", "12 bulan", "ordinal numbers"]],
  [6, "Colors & Basic Adjectives", ["primary colors", "big / small", "old / new"]],
  [7, "Family Members", ["mother, father", "siblings", "possessive 's"]],
  [8, "Articles: a, an, the", ["kapan pakai a/an", "the definite"]],
  [9, "Subject Pronouns", ["I, you, he, she", "we, they"]],
  [10, "Verb 'to be' — Positive", ["am / is / are", "contractions"]],
  [11, "Verb 'to be' — Negative & Questions", ["isn't / aren't", "Are you...?"]],
  [12, "Numbers 20–100 & Prices", ["twenty → hundred", "how much"]],
  [13, "Telling Time", ["o'clock", "half past", "quarter to"]],
  [14, "Food & Drinks Basics", ["breakfast items", "common meals"]],
  [15, "Classroom Language", ["pen, book, desk", "may I..."]],
  [16, "Review & First Conversation", ["self-intro", "small talk starter"]],
]);

const a12 = toSessions([
  [1, "Present Simple — Affirmative", ["I work", "he works", "spelling -s"]],
  [2, "Present Simple — Negative & Questions", ["don't / doesn't", "do / does"]],
  [3, "My Home", ["rooms", "furniture", "there is / are"]],
  [4, "Daily Routine", ["wake up", "go to work", "sequencing"]],
  [5, "Possessive Adjectives", ["my, your, his, her, our, their"]],
  [6, "Question Words", ["what, where, when, who, why, how"]],
  [7, "Prepositions of Place", ["in, on, under, next to, behind"]],
  [8, "Clothes & Outfits", ["items", "describing what someone wears"]],
  [9, "Weather & Seasons", ["it's sunny", "cold / hot", "rainy days"]],
  [10, "At the Market", ["fruits & vegetables", "some / any"]],
  [11, "At a Restaurant", ["menu", "I'd like", "the bill please"]],
  [12, "Can & Can't — Ability", ["I can swim", "I can't cook"]],
  [13, "Adverbs of Frequency", ["always, usually, sometimes, never"]],
  [14, "Hobbies & Free Time", ["I like / I don't like", "-ing as noun"]],
  [15, "Likes & Dislikes", ["love, enjoy, hate", "what about you?"]],
  [16, "Review & Role Play", ["restaurant scenario", "shopping scenario"]],
]);

const a13 = toSessions([
  [1, "Present Continuous", ["-ing form", "I am working now"]],
  [2, "Present Simple vs Continuous", ["habit vs now", "spelling rules"]],
  [3, "Object Pronouns", ["me, you, him, her, it, us, them"]],
  [4, "Countable & Uncountable", ["a book / some water", "much / many"]],
  [5, "At the Supermarket", ["quantities", "how many / how much"]],
  [6, "Directions in Town", ["turn left", "go straight", "it's across from"]],
  [7, "Transportation", ["by bus, by car", "take the train"]],
  [8, "Shopping for Clothes", ["sizes", "try on", "too big / small"]],
  [9, "Making Plans", ["let's...", "how about...", "accepting / declining"]],
  [10, "On the Phone", ["this is...", "can I speak to...", "hold on"]],
  [11, "Filling Out Forms", ["personal info", "address format"]],
  [12, "Past Simple: 'to be'", ["was / were", "yesterday"]],
  [13, "Past Simple: Regular Verbs", ["-ed endings", "pronunciation"]],
  [14, "Past Simple: Irregular Verbs", ["went, had, saw, did"]],
  [15, "My Last Weekend", ["storytelling", "first... then... finally"]],
  [16, "Review & Storytelling Practice", ["3-minute personal story"]],
]);

// ============ A2, B1, B2 — TITLES ONLY (preview-locked) ============
const titleOnly = (titles: string[]): SessionPreview[] =>
  titles.map((title, i) => ({ number: i + 1, title }));

const a21 = titleOnly([
  "Past Simple Review & Questions", "Past Simple Negative Forms",
  "Time Expressions (Past)", "Comparative Adjectives", "Superlative Adjectives",
  "Modal: Should (Advice)", "Modal: Must / Have to (Obligation)",
  "Articles Review", "Describing People", "My Hometown",
  "Travel Vocabulary", "At the Airport", "Hotel Check-in",
  "Restaurant Advanced", "Asking for Help", "Review: Travel Role Play",
]);

const a22 = titleOnly([
  "Present Perfect: Introduction", "Present Perfect: Ever / Never",
  "Present Perfect: Just / Already / Yet", "Future: 'Going to'",
  "Future: 'Will'", "First Conditional", "Jobs & Occupations",
  "Job Interview Basics", "Workplace Vocabulary", "Writing Emails",
  "Describing Your Job", "Making Small Talk", "Talking About Experiences",
  "News & Current Events", "Environment & Nature", "Review",
]);

const a23 = titleOnly([
  "Past Continuous", "Past Continuous vs Past Simple",
  "While / When / As", "Relative Clauses (who, which, that)",
  "Adverbs of Manner", "So / Because / However",
  "Expressing Opinions", "Agreeing & Disagreeing",
  "Storytelling Structure", "Describing a Book or Movie",
  "Health & Illness", "At the Doctor's",
  "Sports & Fitness", "Music & Arts",
  "Technology Vocabulary", "Review & Opinion Debate",
]);

const b11 = titleOnly([
  "Present Perfect Continuous", "Past Perfect",
  "Reported Speech: Statements", "Reported Speech: Questions",
  "Passive Voice: Present & Past", "Second Conditional",
  "Modal Verbs Review", "Phrasal Verbs: Daily Life",
  "Phrasal Verbs: Travel", "Idioms: Time & Money",
  "Formal vs Informal Register", "Writing Reviews",
  "Advanced Description", "Cultural Differences",
  "Discussing Movies & Books", "Review",
]);

const b12 = titleOnly([
  "Third Conditional", "Mixed Conditionals",
  "Defining vs Non-defining Relative Clauses", "Participle Clauses",
  "Linking: Although, Despite, However", "News Vocabulary",
  "Light Political Discussion", "Global Issues",
  "Environment Debate", "Technology Impact",
  "Social Media Discourse", "Career Discussions",
  "Interview Skills", "Negotiation Basics",
  "Presenting Ideas", "Review",
]);

const b13 = titleOnly([
  "Modal Perfects (must have, should have)", "Passive Voice Advanced",
  "Nominalization", "Inversion for Emphasis",
  "Advanced Linking", "Expressing Certainty & Doubt",
  "Academic Writing Basics", "Essay Structure",
  "Literature Discussion", "Art & Culture",
  "History Topics", "Science & Discovery",
  "Philosophy Light", "Business English Basics",
  "Meetings & Decisions", "Review",
]);

const b21 = titleOnly([
  "Complex Sentence Structures", "Subjunctive Mood",
  "Emphatic Structures", "Cleft Sentences",
  "Collocations", "Idiomatic Expressions",
  "Metaphor & Simile", "Tone & Register Mastery",
  "Debate Techniques", "Persuasive Writing",
  "Formal Correspondence", "Academic Presentations",
  "Critical Analysis", "Summarizing & Paraphrasing",
  "Creative Writing", "Review",
]);

const b22 = titleOnly([
  "Business Communication", "Report Writing",
  "Project Management Vocabulary", "Leadership Language",
  "Financial English", "Marketing Vocabulary",
  "HR & Recruitment", "Legal Basics",
  "IT & Tech Industry", "Client Relations",
  "International Business Etiquette", "Cross-cultural Communication",
  "Giving Presentations", "Chairing Meetings",
  "Written Proposals", "Review",
]);

const b23 = titleOnly([
  "Idiomatic Fluency", "Cultural Nuances",
  "Humor & Sarcasm", "Slang & Colloquialisms",
  "Regional Varieties (US / UK / AU)", "Advanced Listening Strategies",
  "Fast Speech Comprehension", "Accents & Pronunciation",
  "Academic Discourse", "Journalism & Media Analysis",
  "Literature & Poetry", "Public Speaking",
  "Storytelling Mastery", "Debate & Argumentation",
  "Personal Brand in English", "Final Assessment",
]);

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("english")!,
  overview: "Program 192 sesi yang mengantar kamu dari benar-benar nol sampai percakapan near-native. Setiap level dirancang untuk CEFR standard dan siap untuk IELTS/TOEFL di tahap B2.",
  levels: [
    {
      code: "A1", name: "Elementary Foundation",
      description: "Fondasi bahasa: alfabet, tata bahasa dasar, percakapan sederhana sehari-hari.",
      sublevels: [
        { code: "A1.1", name: "First Steps",   sessions: a11, preview: true },
        { code: "A1.2", name: "Daily Life",    sessions: a12, preview: true },
        { code: "A1.3", name: "Social Basics", sessions: a13, preview: true },
      ],
    },
    {
      code: "A2", name: "Pre-Intermediate",
      description: "Beyond basics: past tense mastery, perjalanan, pekerjaan, ekspresi diri.",
      sublevels: [
        { code: "A2.1", name: "Beyond Basics",    sessions: a21, preview: false },
        { code: "A2.2", name: "Travel & Work",    sessions: a22, preview: false },
        { code: "A2.3", name: "Self-Expression",  sessions: a23, preview: false },
      ],
    },
    {
      code: "B1", name: "Intermediate",
      description: "Fluency foundations: tenses kompleks, budaya, topik abstrak.",
      sublevels: [
        { code: "B1.1", name: "Fluency Foundations", sessions: b11, preview: false },
        { code: "B1.2", name: "Cultural Fluency",    sessions: b12, preview: false },
        { code: "B1.3", name: "Complex Topics",      sessions: b13, preview: false },
      ],
    },
    {
      code: "B2", name: "Upper Intermediate",
      description: "Advanced expression: bisnis, akademik, near-native communication. IELTS / TOEFL ready.",
      sublevels: [
        { code: "B2.1", name: "Advanced Expression",       sessions: b21, preview: false },
        { code: "B2.2", name: "Professional English",      sessions: b22, preview: false },
        { code: "B2.3", name: "Near-Native Communication", sessions: b23, preview: false },
      ],
    },
  ],
};

export default curriculum;
`);

// ============================================================
// 4. INDEX (getCurriculum helper)
// ============================================================
write('src/data/curriculum/index.ts', `
import type { LanguageCurriculum } from "./types";
import english from "./data/english";

const registry: Record<string, LanguageCurriculum> = {
  english,
};

export function getCurriculum(slug: string): LanguageCurriculum | null {
  return registry[slug] ?? null;
}

export { languages, regionLabels, featuredLanguages, getLanguageBySlug } from "./languages";
export type * from "./types";
`);

// ============================================================
// 5. /silabus page (server)
// ============================================================
write('src/app/silabus/page.tsx', `
import type { Metadata } from "next";
import SilabusHub from "./SilabusHub";
import { languages } from "@/data/curriculum";

export const metadata: Metadata = {
  title: "Silabus Kursus Bahasa | Linguo.id",
  description: "Pelajari kurikulum lengkap untuk 60+ bahasa di Linguo.id. 192 sesi per bahasa, dari A1 sampai B2. CEFR-aligned, IELTS/TOEFL ready.",
  openGraph: {
    title: "Silabus 60+ Bahasa — Linguo.id",
    description: "192 sesi per bahasa. 4 level CEFR. Lihat apa yang akan kamu pelajari sebelum mendaftar.",
    type: "website",
  },
};

export default function SilabusPage() {
  return <SilabusHub languages={languages} />;
}
`);

// ============================================================
// 6. SilabusHub (client)
// ============================================================
write('src/app/silabus/SilabusHub.tsx', `
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageMeta } from "@/data/curriculum";
import { regionLabels } from "@/data/curriculum/languages";

export default function SilabusHub({ languages }: { languages: LanguageMeta[] }) {
  const [query, setQuery] = useState("");
  const [activeRegion, setActiveRegion] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return languages.filter((l) => {
      const matchQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.slug.includes(q);
      const matchRegion = activeRegion === "all" || l.region === activeRegion;
      return matchQuery && matchRegion;
    });
  }, [query, activeRegion, languages]);

  const featured = filtered.filter((l) => l.featured);
  const rest = filtered.filter((l) => !l.featured);
  const grouped = useMemo(() => {
    const g: Record<string, LanguageMeta[]> = {};
    rest.forEach((l) => { (g[l.region] ||= []).push(l); });
    return g;
  }, [rest]);

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative pt-24 md:pt-36 pb-20 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#1A9E9E]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-200/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A9E9E]/10 text-[#1A9E9E] text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-[#1A9E9E] animate-pulse" />
              Kurikulum Transparan · CEFR-aligned
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
              Lihat apa yang akan
              <br />
              kamu{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-[#1A9E9E]">pelajari.</span>
                <span className="absolute bottom-1 md:bottom-2 left-0 right-0 h-3 md:h-5 bg-amber-300/60 -z-0" />
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-gray-600 max-w-2xl leading-relaxed">
              192 sesi per bahasa. 4 level dari A1 sampai B2. Pilih bahasa — lihat silabus lengkap sebelum kamu daftar.
            </p>

            <div className="mt-10 flex flex-wrap gap-8 text-sm text-gray-500">
              <div><span className="block text-3xl font-bold text-gray-900">60+</span>Bahasa</div>
              <div><span className="block text-3xl font-bold text-gray-900">192</span>Sesi per Bahasa</div>
              <div><span className="block text-3xl font-bold text-gray-900">4</span>Level CEFR</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SEARCH + FILTER */}
      <section className="sticky top-16 md:top-20 z-20 bg-white/90 backdrop-blur-md border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 md:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari bahasa... (contoh: Jepang, English, Sunda)"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-base"
            />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
            {[["all", "Semua"], ...Object.entries(regionLabels)].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveRegion(key)}
                className={\`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors \${
                  activeRegion === key
                    ? "bg-[#1A9E9E] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }\`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-baseline justify-between mb-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Bahasa Unggulan</h2>
              <p className="text-sm text-gray-500 hidden md:block">Paling diminati di Linguo.id</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {featured.map((lang, i) => (
                <LanguageCard key={lang.slug} lang={lang} index={i} large />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BY REGION */}
      {Object.keys(grouped).length > 0 && (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 space-y-16">
            {Object.entries(grouped).map(([region, items]) => (
              <div key={region}>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">
                  {regionLabels[region]}
                  <span className="ml-3 text-sm font-normal text-gray-400">{items.length} bahasa</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {items.map((lang, i) => (
                    <LanguageCard key={lang.slug} lang={lang} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EMPTY */}
      <AnimatePresence>
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-32 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-500">Tidak ada bahasa yang cocok dengan pencarian kamu.</p>
            <button onClick={() => { setQuery(""); setActiveRegion("all"); }} className="mt-6 text-[#1A9E9E] font-medium hover:underline">Reset filter</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA STRIP */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#1A9E9E] to-[#0E6B6B] p-10 md:p-16 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-300/30 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-2xl">
                Bahasa kamu belum ada di sini?
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-xl">
                Kami terus menambah bahasa baru. Hubungi kami untuk request kurikulum kustom atau kelas perusahaan.
              </p>
              <a
                href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20ingin%20tanya%20soal%20kurikulum%20bahasa"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-amber-400 text-gray-900 rounded-full font-semibold hover:bg-amber-300 transition-colors"
              >
                Tanya via WhatsApp
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function LanguageCard({ lang, index, large = false }: { lang: LanguageMeta; index: number; large?: boolean }) {
  const isLocked = !lang.available;
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.4) }}
      whileHover={{ y: -4 }}
      className={\`group relative bg-white rounded-2xl border border-gray-100 hover:border-[#1A9E9E]/40 hover:shadow-lg transition-all cursor-pointer \${
        large ? "p-6 md:p-7" : "p-4 md:p-5"
      } \${isLocked ? "opacity-90" : ""}\`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={\`\${large ? "text-4xl" : "text-3xl"}\`}>{lang.flag}</div>
        {isLocked ? (
          <span className="text-[10px] uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Segera</span>
        ) : (
          <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Tersedia</span>
        )}
      </div>
      <h3 className={\`font-bold text-gray-900 mb-1 \${large ? "text-xl md:text-2xl" : "text-base"}\`}>
        Bahasa {lang.name}
      </h3>
      <p className="text-sm text-gray-500 mb-2">{lang.nativeName}</p>
      {large && lang.description && (
        <p className="text-sm text-gray-600 leading-relaxed mt-3">{lang.description}</p>
      )}
      <div className="mt-4 text-sm font-medium text-[#1A9E9E] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
        {isLocked ? "Waitlist" : "Lihat silabus"}
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );

  if (isLocked) {
    return (
      <a
        href={\`https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20tertarik%20dengan%20kelas%20Bahasa%20\${encodeURIComponent(lang.name)}\`}
        target="_blank"
        rel="noopener"
      >
        {content}
      </a>
    );
  }
  return <Link href={\`/silabus/\${lang.slug}\`}>{content}</Link>;
}
`);

// ============================================================
// 7. /silabus/[lang]/page.tsx
// ============================================================
write('src/app/silabus/[lang]/page.tsx', `
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurriculum, languages } from "@/data/curriculum";
import CurriculumViewer from "./CurriculumViewer";

type Props = { params: Promise<{ lang: string }> };

export async function generateStaticParams() {
  return languages.filter((l) => l.available).map((l) => ({ lang: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const c = getCurriculum(lang);
  if (!c) return { title: "Silabus tidak ditemukan | Linguo.id" };
  return {
    title: \`Silabus Bahasa \${c.meta.name} — A1 sampai B2 | Linguo.id\`,
    description: \`Kurikulum lengkap Bahasa \${c.meta.name} di Linguo.id: 192 sesi, 4 level CEFR. \${c.overview}\`,
    openGraph: {
      title: \`Silabus Bahasa \${c.meta.name} — Linguo.id\`,
      description: c.overview,
      type: "website",
    },
  };
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  const curriculum = getCurriculum(lang);
  if (!curriculum) notFound();
  return <CurriculumViewer curriculum={curriculum} />;
}
`);

// ============================================================
// 8. CurriculumViewer (client)
// ============================================================
write('src/app/silabus/[lang]/CurriculumViewer.tsx', `
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCurriculum, Level, Sublevel } from "@/data/curriculum";

const levelColors: Record<string, { bg: string; text: string; accent: string }> = {
  A1: { bg: "bg-emerald-50",  text: "text-emerald-700",  accent: "bg-emerald-500" },
  A2: { bg: "bg-sky-50",      text: "text-sky-700",      accent: "bg-sky-500" },
  B1: { bg: "bg-violet-50",   text: "text-violet-700",   accent: "bg-violet-500" },
  B2: { bg: "bg-rose-50",     text: "text-rose-700",     accent: "bg-rose-500" },
};

export default function CurriculumViewer({ curriculum }: { curriculum: LanguageCurriculum }) {
  const { meta, overview, levels } = curriculum;

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-br from-[#1A9E9E]/10 to-amber-200/30 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/silabus" className="text-sm text-gray-500 hover:text-[#1A9E9E] inline-flex items-center gap-1 mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Semua silabus
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-6xl md:text-7xl">{meta.flag}</span>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-widest">Silabus</p>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Bahasa {meta.name}</h1>
              <p className="text-lg md:text-xl text-gray-500 italic mt-1">{meta.nativeName}</p>
            </div>
          </div>

          <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-3xl">{overview}</p>

          <div className="mt-10 flex flex-wrap gap-6 text-sm">
            <Stat label="Total Sesi" value="192" />
            <Stat label="Level" value="A1 → B2" />
            <Stat label="Sublevel" value="12" />
            <Stat label="Standard" value="CEFR" />
          </div>
        </div>
      </section>

      {/* LEVELS */}
      <section className="pb-20 md:pb-32">
        <div className="max-w-5xl mx-auto px-6 space-y-20 md:space-y-28">
          {levels.map((level, i) => (
            <LevelSection key={level.code} level={level} index={i} langName={meta.name} />
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="pb-20 md:pb-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gray-900 text-white p-10 md:p-16 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#1A9E9E]/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl" />
            <div className="relative">
              <p className="text-sm uppercase tracking-widest text-amber-300 mb-4">Siap mulai?</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Mulai perjalanan bahasa <span className="text-[#1A9E9E]">{meta.name}</span> kamu hari ini.
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-xl">
                Konsultasi gratis via WhatsApp. Pengajar akan bantu tentukan level kamu dan rekomendasikan kelas yang pas.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={\`https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20tertarik%20dengan%20kelas%20Bahasa%20\${encodeURIComponent(meta.name)}\`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#1A9E9E] text-white rounded-full font-semibold hover:bg-[#147a7a] transition-colors"
                >
                  Konsultasi Gratis
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </a>
                <Link href="/produk" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors">
                  Lihat Harga
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-xs uppercase tracking-widest text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function LevelSection({ level, index, langName }: { level: Level; index: number; langName: string }) {
  const c = levelColors[level.code];
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
    >
      <div className={\`flex items-center gap-4 mb-8 \${c.bg} rounded-2xl p-5 md:p-6\`}>
        <div className={\`w-14 h-14 md:w-16 md:h-16 rounded-xl \${c.accent} text-white font-bold text-xl md:text-2xl flex items-center justify-center\`}>
          {level.code}
        </div>
        <div className="flex-1">
          <h2 className={\`text-2xl md:text-3xl font-bold \${c.text}\`}>{level.name}</h2>
          <p className="text-gray-700 text-sm md:text-base mt-1">{level.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {level.sublevels.map((sub) => (
          <SublevelCard key={sub.code} sublevel={sub} langName={langName} />
        ))}
      </div>
    </motion.div>
  );
}

function SublevelCard({ sublevel, langName }: { sublevel: Sublevel; langName: string }) {
  const [open, setOpen] = useState(sublevel.preview);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-gray-400 tracking-widest">{sublevel.code}</span>
          <div>
            <div className="font-semibold text-lg">{sublevel.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {sublevel.sessions.length} sesi · {sublevel.preview ? "Preview lengkap" : "Judul sesi + daftarkan untuk detail"}
            </div>
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-gray-100">
              <ol className="divide-y divide-gray-100">
                {sublevel.sessions.map((s) => (
                  <li key={s.number} className="py-4 flex gap-4">
                    <span className="font-mono text-xs text-gray-400 w-8 flex-shrink-0 pt-1">#{String(s.number).padStart(2, "0")}</span>
                    <div className="flex-1">
                      <div className={\`font-medium \${sublevel.preview ? "text-gray-900" : "text-gray-500"}\`}>
                        {s.title}
                      </div>
                      {s.topics && s.topics.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {s.topics.map((t) => (
                            <span key={t} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>

              {!sublevel.preview && (
                <div className="mt-6 p-5 bg-gradient-to-br from-[#1A9E9E]/5 to-amber-50 rounded-xl border border-[#1A9E9E]/10">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🔒</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Detail topik tersembunyi</p>
                      <p className="text-sm text-gray-600 mt-1">Daftar untuk akses materi lengkap tiap sesi: kosakata, pola kalimat, latihan, dan referensi budaya.</p>
                      <a
                        href={\`https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20tertarik%20daftar%20kelas%20\${encodeURIComponent(langName)}%20level%20\${encodeURIComponent(sublevel.code)}\`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#1A9E9E] mt-3 hover:underline"
                      >
                        Daftar & buka detail →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`);

// ============================================================
// 9. /silabus/sitemap.ts — dynamic
// ============================================================
write('src/app/silabus/sitemap.ts', `
import type { MetadataRoute } from "next";
import { languages } from "@/data/curriculum";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://linguo.id";
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: \`\${base}/silabus\`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  for (const lang of languages) {
    if (lang.available) {
      entries.push({
        url: \`\${base}/silabus/\${lang.slug}\`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
`);

// ============================================================
// 10. NAVBAR PATCH — search for Navbar/Header, insert Silabus link
// ============================================================
console.log('\n🔧 Patching navbar...');

function findFiles(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === '.next') continue;
    const p = path.join(dir, item.name);
    if (item.isDirectory()) findFiles(p, ext, out);
    else if (item.name.endsWith(ext)) out.push(p);
  }
  return out;
}

const candidates = findFiles(path.join(ROOT, 'src'), '.tsx');
const navbarFiles = candidates.filter((f) => /navbar|header|nav\./i.test(path.basename(f)));
console.log(`  Found ${navbarFiles.length} navbar-candidate file(s):`);
navbarFiles.forEach((f) => console.log(`    • ${path.relative(ROOT, f)}`));

let patched = false;
for (const file of navbarFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Look for Blog link (context says navbar has Blog)
  // Try multiple patterns
  const patterns = [
    // <Link href="/blog">Blog</Link>
    /(\s*)(<Link[^>]+href=["']\/blog["'][^>]*>Blog<\/Link>)/,
    // href: "/blog", label: "Blog"
    /(\s*)(\{\s*href:\s*["']\/blog["'][^}]*label:\s*["']Blog["'][^}]*\},?)/,
    // { label: "Blog", href: "/blog" }
    /(\s*)(\{\s*label:\s*["']Blog["'][^}]*href:\s*["']\/blog["'][^}]*\},?)/,
  ];
  let updated = content;
  for (const pat of patterns) {
    const m = updated.match(pat);
    if (!m) continue;
    if (/Silabus|\/silabus/.test(updated)) {
      console.log(`  ✓ ${path.basename(file)}: Silabus already present, skip`);
      break;
    }
    const indent = m[1];
    const original = m[2];
    let silabus;
    if (original.includes('<Link')) {
      silabus = `<Link href="/silabus">Silabus</Link>`;
    } else if (original.includes('label:')) {
      silabus = original.replace(/["']Blog["']/g, '"Silabus"').replace(/\/blog/g, '/silabus');
    } else {
      silabus = original;
    }
    updated = updated.replace(pat, `${indent}${silabus}${indent}${original}`);
    fs.writeFileSync(file, updated, 'utf8');
    console.log(`  ✅ Patched ${path.relative(ROOT, file)}`);
    patched = true;
    break;
  }
}

if (!patched) {
  console.log('  ⚠️  Tidak berhasil auto-patch navbar. Tambahkan manual <Link href="/silabus">Silabus</Link> di navbar, sebelum link Blog.');
}

// ============================================================
// 11. GIT
// ============================================================
console.log('\n🚀 Git commit & push...\n');
try {
  execSync('git add -A', { stdio: 'inherit', cwd: ROOT });
  execSync(
    'git commit -m "feat(silabus): landing page with curriculum preview for 60+ languages"',
    { stdio: 'inherit', cwd: ROOT }
  );
  execSync('git push', { stdio: 'inherit', cwd: ROOT });
  console.log('\n✅ Pushed to GitHub, Vercel akan auto-deploy.\n');
} catch (e) {
  console.log('\n⚠️  Git error:', e.message);
  console.log('   Cek: git status → git add -A && git commit -m "..." && git push manual');
}

// Self-delete
try {
  fs.unlinkSync(fileURLToPath(import.meta.url));
  console.log('🗑️  Script self-deleted\n');
} catch {}

console.log('═══════════════════════════════════════════════');
console.log('✨ DONE! Cek:');
console.log('   • https://linguo.id/silabus');
console.log('   • https://linguo.id/silabus/english');
console.log('═══════════════════════════════════════════════\n');
