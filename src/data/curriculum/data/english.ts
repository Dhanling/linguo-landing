import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

// Compact format: [number, title] or [number, title, topics[]]
type Raw = [number, string, string[]?];

const toSessions = (raw: Raw[]): SessionPreview[] =>
  raw.map(([number, title, topics]) => ({ number, title, ...(topics ? { topics } : {}) }));

const titleOnly = (titles: string[]): SessionPreview[] =>
  titles.map((title, i) => ({ number: i + 1, title }));

// ============ A1 — 3 sublevels, FULLY PREVIEWED ============
const a1_1 = toSessions([
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

const a1_2 = toSessions([
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

const a1_3 = toSessions([
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

// ============ A2 — 4 sublevels, preview-locked ============
const a2_1 = titleOnly([
  "Past Simple Review & Questions", "Past Simple Negative Forms",
  "Time Expressions (Past)", "Comparative Adjectives", "Superlative Adjectives",
  "Modal: Should (Advice)", "Modal: Must / Have to (Obligation)",
  "Articles Review", "Describing People", "My Hometown",
  "Travel Vocabulary", "At the Airport", "Hotel Check-in",
  "Restaurant Advanced", "Asking for Help", "Review: Travel Role Play",
]);

const a2_2 = titleOnly([
  "Present Perfect: Introduction", "Present Perfect: Ever / Never",
  "Present Perfect: Just / Already / Yet", "Future: 'Going to'",
  "Future: 'Will'", "First Conditional", "Jobs & Occupations",
  "Job Interview Basics", "Workplace Vocabulary", "Writing Emails",
  "Describing Your Job", "Making Small Talk", "Talking About Experiences",
  "News & Current Events", "Environment & Nature", "Review",
]);

const a2_3 = titleOnly([
  "Past Continuous", "Past Continuous vs Past Simple",
  "While / When / As", "Relative Clauses (who, which, that)",
  "Adverbs of Manner", "So / Because / However",
  "Expressing Opinions", "Agreeing & Disagreeing",
  "Storytelling Structure", "Describing a Book or Movie",
  "Health & Illness", "At the Doctor's",
  "Sports & Fitness", "Music & Arts",
  "Technology Vocabulary", "Review & Opinion Debate",
]);

const a2_4 = titleOnly([
  "Used To (Past Habits)", "Would for Past Habits",
  "Reflexive Pronouns", "Both / Either / Neither",
  "Too / Enough", "Quantifiers: A Few, A Little",
  "Indefinite Pronouns: Someone, Anyone", "Expressing Preferences",
  "Making Suggestions", "Offering & Accepting Help",
  "Giving Instructions", "Describing Processes",
  "Festivals & Celebrations", "Food Culture",
  "Indonesian vs English Culture", "Review & Cultural Exchange",
]);

// ============ B1 — 5 sublevels, preview-locked ============
const b1_1 = titleOnly([
  "Present Perfect Continuous", "Past Perfect",
  "Reported Speech: Statements", "Reported Speech: Questions",
  "Passive Voice: Present & Past", "Second Conditional",
  "Modal Verbs Review", "Phrasal Verbs: Daily Life",
  "Phrasal Verbs: Travel", "Idioms: Time & Money",
  "Formal vs Informal Register", "Writing Reviews",
  "Advanced Description", "Cultural Differences",
  "Discussing Movies & Books", "Review",
]);

const b1_2 = titleOnly([
  "Third Conditional", "Mixed Conditionals",
  "Defining vs Non-defining Relative Clauses", "Participle Clauses",
  "Linking: Although, Despite, However", "News Vocabulary",
  "Light Political Discussion", "Global Issues",
  "Environment Debate", "Technology Impact",
  "Social Media Discourse", "Career Discussions",
  "Interview Skills", "Negotiation Basics",
  "Presenting Ideas", "Review",
]);

const b1_3 = titleOnly([
  "Modal Perfects (must have, should have)", "Passive Voice Advanced",
  "Nominalization", "Inversion for Emphasis",
  "Advanced Linking", "Expressing Certainty & Doubt",
  "Academic Writing Basics", "Essay Structure",
  "Literature Discussion", "Art & Culture",
  "History Topics", "Science & Discovery",
  "Philosophy Light", "Business English Basics",
  "Meetings & Decisions", "Review",
]);

const b1_4 = titleOnly([
  "Gerunds & Infinitives", "Advanced Phrasal Verbs",
  "Compound Adjectives", "Hyphenated Words",
  "Emphasis with Do/Did", "Cleft Sentences Intro",
  "Travel Writing", "Blog & Social Media Writing",
  "Public Speaking Basics", "Debate Etiquette",
  "Personal Essays", "Creative Description",
  "Film & TV Analysis", "Music & Poetry",
  "Global Etiquette", "Review",
]);

const b1_5 = titleOnly([
  "Advanced Reported Speech", "Wish & If Only",
  "Hypothetical Situations", "Mixed Tenses",
  "Advanced Passive", "Causative Have & Get",
  "Expressing Regret", "Expressing Hope & Wishes",
  "Problem-Solving Vocabulary", "Decision Making",
  "Crisis Management", "Leadership Basics",
  "Team Communication", "Feedback & Critique",
  "Time Management", "Review & Business Simulation",
]);

// ============ B2 — 7 sublevels, preview-locked ============
const b2_1 = titleOnly([
  "Complex Sentence Structures", "Subjunctive Mood",
  "Emphatic Structures", "Cleft Sentences",
  "Collocations", "Idiomatic Expressions",
  "Metaphor & Simile", "Tone & Register Mastery",
  "Debate Techniques", "Persuasive Writing",
  "Formal Correspondence", "Academic Presentations",
  "Critical Analysis", "Summarizing & Paraphrasing",
  "Creative Writing", "Review",
]);

const b2_2 = titleOnly([
  "Business Communication", "Report Writing",
  "Project Management Vocabulary", "Leadership Language",
  "Financial English", "Marketing Vocabulary",
  "HR & Recruitment", "Legal Basics",
  "IT & Tech Industry", "Client Relations",
  "International Business Etiquette", "Cross-cultural Communication",
  "Giving Presentations", "Chairing Meetings",
  "Written Proposals", "Review",
]);

const b2_3 = titleOnly([
  "Idiomatic Fluency", "Cultural Nuances",
  "Humor & Sarcasm", "Slang & Colloquialisms",
  "Regional Varieties (US / UK / AU)", "Advanced Listening Strategies",
  "Fast Speech Comprehension", "Accents & Pronunciation",
  "Academic Discourse", "Journalism & Media Analysis",
  "Literature & Poetry", "Public Speaking",
  "Storytelling Mastery", "Debate & Argumentation",
  "Personal Brand in English", "Review",
]);

const b2_4 = titleOnly([
  "Academic Reading Strategies", "Research Vocabulary",
  "Thesis Writing Basics", "Citation & Referencing",
  "Data Presentation", "Graphs & Charts Description",
  "Scientific Method", "Experimental Reports",
  "Peer Review Language", "Conference Presentations",
  "Research Proposals", "Literature Review",
  "Abstract Writing", "Hypothesis Formulation",
  "Academic Debate", "Review",
]);

const b2_5 = titleOnly([
  "Legal English Introduction", "Contract Vocabulary",
  "Negotiation Mastery", "Arbitration & Mediation",
  "Diplomatic Language", "Intercultural Dispute Resolution",
  "Policy Writing", "Government Affairs",
  "Public Speaking for Leaders", "TED Talk Style",
  "Motivational Speaking", "Executive Presence",
  "Crisis Communication", "Media Interviews",
  "Press Conferences", "Review",
]);

const b2_6 = titleOnly([
  "Literary Analysis", "Poetry Interpretation",
  "Shakespearean English Basics", "Modern Literature",
  "Short Story Crafting", "Novel Structure",
  "Character Development", "Dialogue Writing",
  "Screenplay Basics", "Song Lyric Writing",
  "Translation Skills", "Subtitling Basics",
  "Creative Non-fiction", "Memoir Writing",
  "Travel Writing Mastery", "Review",
]);

const b2_7 = titleOnly([
  "IELTS Writing Task 1", "IELTS Writing Task 2",
  "IELTS Reading Strategies", "IELTS Listening",
  "IELTS Speaking Part 1", "IELTS Speaking Part 2 & 3",
  "TOEFL Integrated Writing", "TOEFL Independent Writing",
  "TOEFL Reading", "TOEFL Listening",
  "TOEFL Speaking", "Mock Tests Strategy",
  "Time Management in Tests", "Common Pitfalls",
  "Score Improvement Tactics", "Final Mock Test & Review",
]);

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("english")!,
  overview: "Program 304 sesi yang mengantar kamu dari benar-benar nol sampai percakapan near-native. Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Setiap level dirancang untuk CEFR standard dan siap untuk IELTS/TOEFL di tahap B2.",
  levels: [
    {
      code: "A1", name: "Elementary Foundation",
      description: "Fondasi bahasa: alfabet, tata bahasa dasar, percakapan sederhana sehari-hari.",
      sublevels: [
        { code: "A1.1", name: "First Steps",   sessions: a1_1, preview: true },
        { code: "A1.2", name: "Daily Life",    sessions: a1_2, preview: true },
        { code: "A1.3", name: "Social Basics", sessions: a1_3, preview: true },
      ],
    },
    {
      code: "A2", name: "Pre-Intermediate",
      description: "Beyond basics: past tense mastery, perjalanan, pekerjaan, ekspresi diri.",
      sublevels: [
        { code: "A2.1", name: "Beyond Basics",        sessions: a2_1, preview: false },
        { code: "A2.2", name: "Travel & Work",        sessions: a2_2, preview: false },
        { code: "A2.3", name: "Self-Expression",      sessions: a2_3, preview: false },
        { code: "A2.4", name: "Cultural Foundations", sessions: a2_4, preview: false },
      ],
    },
    {
      code: "B1", name: "Intermediate",
      description: "Fluency foundations: tenses kompleks, budaya, topik abstrak.",
      sublevels: [
        { code: "B1.1", name: "Fluency Foundations",   sessions: b1_1, preview: false },
        { code: "B1.2", name: "Cultural Fluency",      sessions: b1_2, preview: false },
        { code: "B1.3", name: "Complex Topics",        sessions: b1_3, preview: false },
        { code: "B1.4", name: "Creative Expression",   sessions: b1_4, preview: false },
        { code: "B1.5", name: "Professional Bridge",   sessions: b1_5, preview: false },
      ],
    },
    {
      code: "B2", name: "Upper Intermediate",
      description: "Advanced expression: bisnis, akademik, near-native communication. IELTS / TOEFL ready.",
      sublevels: [
        { code: "B2.1", name: "Advanced Expression",       sessions: b2_1, preview: false },
        { code: "B2.2", name: "Professional English",      sessions: b2_2, preview: false },
        { code: "B2.3", name: "Near-Native Communication", sessions: b2_3, preview: false },
        { code: "B2.4", name: "Academic Mastery",          sessions: b2_4, preview: false },
        { code: "B2.5", name: "Leadership & Diplomacy",    sessions: b2_5, preview: false },
        { code: "B2.6", name: "Creative & Literary",       sessions: b2_6, preview: false },
        { code: "B2.7", name: "Test Prep (IELTS/TOEFL)",   sessions: b2_7, preview: false },
      ],
    },
  ],
};

export default curriculum;
