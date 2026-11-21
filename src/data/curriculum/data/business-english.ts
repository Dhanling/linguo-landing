// [silabus-business-english-v1] English for Business — jalur Inggris untuk dunia kerja,
// A1 → B2 pola resmi 3-4-5-7 (304 sesi). Grammar tetap mengikuti urutan CEFR, tapi
// SEMUA konteksnya kantor: email, telepon, meeting, klien, laporan, presentasi,
// negosiasi. Dibuat 21 Nov 2026 dari lead corporate (PT Epiterma) yang targetnya
// email formal, klarifikasi, bicara di meeting & listening — silabus English umum
// baru menyentuh topik kerja di A2.2.
//
// Salinan dashboard: linguo-admin-dashboard/src/data/silabus/business-english.ts
// (isi sesi WAJIB sama persis).
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
  [1, "Greetings & Introductions at Work", ["good morning", "my name is…", "I work at…", "nice to meet you"]],
  [2, "Jobs & Job Titles", ["manager, engineer, staff", "a / an", "What do you do?"]],
  [3, "Company & Departments", ["HR, Finance, Project", "verb to be: is / are", "I'm in the … team"]],
  [4, "Numbers, Phone Numbers & Email Addresses", ["0–100", "spelling @ & dot", "Could you spell that?"]],
  [5, "Days, Dates & Working Hours", ["Monday–Friday", "from 8 to 5", "ordinal dates"]],
  [6, "Telling Time & Schedules", ["o'clock, half past", "at / on / in", "The meeting is at 9.30"]],
  [7, "The Office & Workplace Objects", ["desk, laptop, printer", "there is / there are"]],
  [8, "Finding Your Way in the Building", ["floor, lobby, meeting room", "next to, opposite", "prepositions of place"]],
  [9, "Present Simple: My Work Routine", ["I check emails", "she works / he goes", "daily tasks"]],
  [10, "Present Simple: Questions & Negatives", ["Do you…? / Does she…?", "don't / doesn't"]],
  [11, "Colleagues & Teams", ["This is my colleague…", "my / your / his / her", "possessive 's"]],
  [12, "Polite Requests: Can & Could", ["Can I…?", "Could you…?", "please & thank you"]],
  [13, "Basic Phone Calls", ["Hello, this is…", "Can I speak to…?", "Hold on, please"]],
  [14, "Taking a Simple Message", ["name & number", "He'll call you back", "reading back details"]],
  [15, "Asking for Repetition & Meaning", ["Sorry?", "Could you repeat that?", "What does … mean?"]],
  [16, "Review & Role Play: My First Day at Work", ["self-introduction", "office tour", "simple phone call"]],
]);

const a1_2 = toSessions([
  [1, "Reading Simple Work Emails", ["subject line", "greeting & sign-off", "finding the main point"]],
  [2, "Writing a Short Email: Opening & Closing", ["Dear / Hi", "I hope you are well", "Best regards"]],
  [3, "Email: Asking for Information", ["Could you send…?", "I would like to know…", "Please let me know"]],
  [4, "Email: Confirming a Time & Place", ["I confirm…", "See you on Monday at…", "date & time format"]],
  [5, "Question Words at Work", ["what, when, where, who", "how many / how much", "asking for details"]],
  [6, "Adverbs of Frequency: Work Habits", ["always, usually, never", "How often do you…?"]],
  [7, "Can & Can't: Skills at Work", ["I can use Excel", "Can you drive?", "talking about skills"]],
  [8, "Present Continuous: What Are You Working On?", ["I'm checking the report", "project status now"]],
  [9, "Present Simple vs Continuous", ["usually vs right now", "work routine vs current task"]],
  [10, "Calendar & Appointments", ["book an appointment", "available / busy", "Is Tuesday OK?"]],
  [11, "Company Products & Services", ["we build / sell / provide", "countable & uncountable"]],
  [12, "Prices, Quantities & Units", ["How much / how many?", "meter, ton, unit", "big numbers"]],
  [13, "Simple Instructions & Safety Signs", ["imperatives", "Wear a helmet", "Don't…"]],
  [14, "Chat Messages at Work", ["short replies", "noted, on it, will do", "polite chat tone"]],
  [15, "Saying Yes, No & Not Sure Politely", ["Sure, no problem", "I'm afraid…", "Let me check"]],
  [16, "Review & Role Play: Email + Phone Practice", ["short email", "phone request", "confirming details"]],
]);

const a1_3 = toSessions([
  [1, "Past Simple: was / were", ["The meeting was long", "Were you at the office?"]],
  [2, "Past Simple: Regular Verbs", ["checked, finished, called", "-ed pronunciation"]],
  [3, "Past Simple: Irregular Verbs", ["sent, went, made, wrote", "Did you…?"]],
  [4, "Reporting What You Did", ["Yesterday I…", "a short daily report", "first, then, after that"]],
  [5, "Future Plans: going to", ["I'm going to visit the site", "next week / tomorrow"]],
  [6, "Making Arrangements", ["Are you free on…?", "present continuous for future"]],
  [7, "Inviting to a Meeting", ["Would you like to join…?", "accepting & declining"]],
  [8, "Joining a Meeting: Basic Phrases", ["I agree", "I have a question", "Can you repeat that?"]],
  [9, "Giving Your Opinion Simply", ["I think…", "In my opinion…", "I'm not sure"]],
  [10, "Asking for Clarification", ["Do you mean…?", "Sorry, I don't understand", "checking understanding"]],
  [11, "Describing a Problem Simply", ["There is a problem with…", "It doesn't work", "broken, late, missing"]],
  [12, "Apologising & Responding", ["Sorry for the delay", "No problem", "It's OK"]],
  [13, "Filling Out Work Forms", ["position, department", "date & signature", "personal details"]],
  [14, "Business Small Talk Basics", ["How was your weekend?", "weather & traffic", "safe topics"]],
  [15, "Welcoming Visitors to the Office", ["Welcome to…", "Please have a seat", "Would you like coffee?"]],
  [16, "Review & Simulation: A Day at Work", ["daily report", "short meeting", "email + call"]],
]);

// ============ A2 — 4 sublevels, preview-locked ============
const a2_1 = titleOnly([
  "Formal vs Informal Emails", "Email Structure: Purpose First",
  "Requesting Information Formally", "Replying to Requests",
  "Sending Attachments & Documents", "Confirming Details in Writing",
  "Following Up on an Email", "Polite Reminders",
  "Making & Changing Appointments by Email", "Present Perfect: Giving Updates",
  "Just / Already / Yet in Emails", "Thanking & Acknowledging",
  "Apologising for Delays", "Short Clarification Emails",
  "Common Email Mistakes", "Review & Email Writing Workshop",
]);

const a2_2 = titleOnly([
  "Welcoming a Client", "Describing Your Company",
  "Your Role & Responsibilities", "Talking About Projects",
  "Comparatives: Comparing Options", "Superlatives: The Best Option",
  "Asking About Client Needs", "Explaining Products & Services",
  "Answering Simple Client Questions", "Making Business Phone Calls",
  "Leaving a Voicemail", "Arranging a Site Visit",
  "Will for Promises & Offers", "First Conditional: If…, We Will…",
  "Small Talk with Clients", "Review & Client Role Play",
]);

const a2_3 = titleOnly([
  "Meeting Vocabulary: Agenda, Minutes, Action Items", "Opening a Meeting",
  "Stating Your Point Simply", "Agreeing & Disagreeing Politely",
  "Asking Questions in a Meeting", "Interrupting Politely",
  "Checking Understanding", "Making Suggestions",
  "Giving Reasons: because, so", "Talking About Deadlines",
  "Must / Have to / Should", "Summarising Action Items",
  "Online Meetings: Zoom & Teams Phrases", "Listening: Short Meeting Clips",
  "Writing Simple Meeting Notes", "Review & Mock Meeting",
]);

const a2_4 = titleOnly([
  "Explaining a Process Step by Step", "Passive Voice Basics in Reports",
  "Describing Progress & Status", "Reporting Problems & Delays",
  "Asking for & Offering Help", "Giving Instructions to Colleagues",
  "Clarification Requests in Writing", "Handling Simple Complaints",
  "Workplace Safety Communication", "Numbers, Data & Simple Charts",
  "Past Continuous: What Happened", "Telling a Work Story",
  "Job Interview Basics", "Talking About Your Career",
  "Working with Foreign Clients: Cultural Tips", "Review & Workplace Simulation",
]);

// ============ B1 — 5 sublevels, preview-locked ============
const b1_1 = titleOnly([
  "Email Tone: Polite & Professional", "Formal Clarification Letters",
  "Writing Clear Requests", "Responding to Complaints in Writing",
  "Writing Status Updates", "Writing Meeting Minutes",
  "Linking Words for Clear Writing", "Reported Speech in Emails",
  "Present Perfect Continuous for Progress", "Writing a Short Report",
  "Proposal Structure", "Describing Graphs & Data",
  "Formal Apologies & Explanations", "Escalation Emails",
  "Editing for Clarity & Conciseness", "Review & Writing Portfolio",
]);

const b1_2 = titleOnly([
  "Leading a Short Meeting", "Presenting an Update in a Meeting",
  "Expressing Opinions with Reasons", "Disagreeing Diplomatically",
  "Asking Follow-up Questions", "Clarifying & Paraphrasing",
  "Handling Interruptions", "Brainstorming Ideas",
  "Second Conditional: Hypothetical Options", "Reaching a Decision",
  "Assigning Tasks & Responsibilities", "Talking About Risks",
  "Problem-Solving Discussions", "Listening: Note-taking in Meetings",
  "Follow-up Email After a Meeting", "Review & Meeting Simulation",
]);

const b1_3 = titleOnly([
  "Structuring a Presentation", "Opening & Introducing a Topic",
  "Signposting Language", "Presenting a Project Timeline",
  "Presenting Data & Charts", "Comparing & Contrasting Options",
  "Making Recommendations", "Body Language & Voice",
  "Handling Q&A", "Dealing with Difficult Questions",
  "Concluding a Presentation", "Slides: Less Text, More Message",
  "Pronunciation: Stress & Intonation", "The One-Minute Pitch",
  "Presenting Online", "Review & Mini Presentation",
]);

const b1_4 = titleOnly([
  "Understanding Client Requirements", "Customer Service Language",
  "Handling Complaints by Phone", "Managing Expectations",
  "Saying No Politely", "Explaining Delays & Changes",
  "Offers & Counter-offers", "Negotiation Basics",
  "Persuasive Language", "Writing Quotations & Offers",
  "Following Up with Prospects", "Building Rapport",
  "Cross-cultural Communication", "Video Calls with Clients",
  "Feedback & Satisfaction Surveys", "Review & Client Simulation",
]);

const b1_5 = titleOnly([
  "Project Vocabulary: Scope, Milestone, Deliverable", "Planning & Scheduling",
  "Describing Responsibilities", "Passive Voice in Technical Writing",
  "Writing Procedures & Instructions", "Quality & Inspection Reports",
  "Health & Safety Communication", "Purchasing & Suppliers",
  "Contracts & Agreements Vocabulary", "Budget & Cost Discussions",
  "Change Requests", "Incident Reports",
  "Handovers & Briefings", "Time Management Language",
  "Teleconference with Overseas Partners", "Review & Project Simulation",
]);

// ============ B2 — 7 sublevels, preview-locked ============
const b2_1 = titleOnly([
  "Writing for Impact", "Formal Correspondence Conventions",
  "Executive Summaries", "Business Report Structure",
  "Writing Recommendations", "Hedging & Cautious Language",
  "Nominalisation in Formal Writing", "Persuasive Proposals",
  "Responding to Disputes in Writing", "Writing Policies & Guidelines",
  "Cohesion & Advanced Linking", "Concise Writing Techniques",
  "Writing for Senior Management", "Professional Profiles & LinkedIn",
  "Peer Review & Editing", "Review & Writing Assessment",
]);

const b2_2 = titleOnly([
  "Preparing for a Negotiation", "Opening Positions",
  "Proposals & Conditions", "Bargaining Language",
  "Third Conditional: Reviewing Past Deals", "Handling Objections",
  "Concessions & Trade-offs", "Reading Between the Lines",
  "Tactful Rejections", "Breaking a Deadlock",
  "Closing a Deal", "Summarising Agreements",
  "Negotiation Styles Across Cultures", "Negotiating by Email",
  "Post-deal Follow-up", "Review & Negotiation Simulation",
]);

const b2_3 = titleOnly([
  "Chairing a Meeting", "Setting Objectives & Agenda",
  "Facilitating Discussion", "Managing Conflict in Meetings",
  "Encouraging Participation", "Keeping Discussion on Track",
  "Decision-making Techniques", "Giving Constructive Feedback",
  "Receiving Feedback", "Delegating Effectively",
  "Motivating a Team", "Running Hybrid Meetings",
  "Management & Board Meetings", "Minutes & Action Tracking",
  "Evaluating a Meeting", "Review & Chairing Practice",
]);

const b2_4 = titleOnly([
  "Storytelling in Business", "Audience Analysis",
  "Persuasion Techniques", "Presenting Complex Data",
  "Rhetorical Devices", "Handling Hostile Questions",
  "Impromptu Speaking", "Presenting Strategy & Vision",
  "Pitching to Clients & Investors", "Panel Discussions",
  "Webinars & Virtual Presentations", "Speaking with Confidence",
  "Connected Speech & Advanced Pronunciation", "Humour & Rapport",
  "Feedback & Improvement", "Review & Final Presentation",
]);

const b2_5 = titleOnly([
  "The Language of Leadership", "Communicating Change",
  "Performance Reviews", "Coaching Conversations",
  "Difficult Conversations", "Crisis Communication",
  "Internal Announcements", "Delivering Bad News",
  "Influencing Without Authority", "Stakeholder Management",
  "Ethics & Compliance Language", "Diversity & Inclusion at Work",
  "Managing Remote Teams", "Strategic Planning Discussions",
  "Mentoring", "Review & Leadership Case Study",
]);

const b2_6 = titleOnly([
  "Describing Technical Processes", "Specifications & Standards",
  "Reading Technical Documents", "Engineering & Construction Vocabulary",
  "Finance & Accounting Basics", "Marketing & Sales Language",
  "HR & Recruitment Language", "Legal & Contract English",
  "Logistics & Supply Chain", "IT & the Digital Workplace",
  "Sustainability & ESG", "Data & Analytics Language",
  "Writing Technical Reports", "Explaining Technical Ideas to Non-experts",
  "Industry News & Trends", "Review & Industry Project",
]);

const b2_7 = titleOnly([
  "International Business Etiquette", "Working in Cross-cultural Teams",
  "Business Idioms & Phrasal Verbs", "Understanding Native Speakers",
  "Accents in Global Business", "Listening: Business News",
  "Advanced Job Interviews", "Networking Events",
  "Professional Social Media", "TOEIC Listening Strategies",
  "TOEIC Reading Strategies", "Business Case Analysis",
  "Debating Business Issues", "Capstone Project Preparation",
  "Capstone Presentation", "Final Assessment & Certification",
]);

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("business-english")!,
  overview: "Jalur bahasa Inggris khusus dunia kerja: 304 sesi dari nol sampai mandiri di lingkungan profesional internasional. Grammar tetap mengikuti urutan CEFR, tapi semua latihannya memakai situasi kantor — email, telepon, meeting, klien, laporan, presentasi, dan negosiasi. Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Cocok untuk karyawan dan program in-house perusahaan; di tahap B2 sudah siap TOEIC.",
  levels: [
    {
      code: "A1", name: "Business Starter",
      description: "Fondasi bahasa Inggris kerja: perkenalan, telepon dasar, email pendek, rutinitas kantor.",
      sublevels: [
        { code: "A1.1", name: "First Day at Work",       sessions: a1_1, preview: true },
        { code: "A1.2", name: "Office Communication",    sessions: a1_2, preview: true },
        { code: "A1.3", name: "Simple Workplace Tasks",  sessions: a1_3, preview: true },
      ],
    },
    {
      code: "A2", name: "Working Professional",
      description: "Email formal, bicara dengan klien, ikut meeting, dan melaporkan pekerjaan sehari-hari.",
      sublevels: [
        { code: "A2.1", name: "Clear Business Emails",   sessions: a2_1, preview: false },
        { code: "A2.2", name: "Talking with Clients",    sessions: a2_2, preview: false },
        { code: "A2.3", name: "Meeting Basics",          sessions: a2_3, preview: false },
        { code: "A2.4", name: "Workplace Situations",    sessions: a2_4, preview: false },
      ],
    },
    {
      code: "B1", name: "Business Communicator",
      description: "Menulis laporan & surat klarifikasi, memimpin meeting singkat, presentasi, dan melayani klien.",
      sublevels: [
        { code: "B1.1", name: "Professional Writing",          sessions: b1_1, preview: false },
        { code: "B1.2", name: "Meetings & Discussions",        sessions: b1_2, preview: false },
        { code: "B1.3", name: "Presentations",                 sessions: b1_3, preview: false },
        { code: "B1.4", name: "Clients & Customer Service",    sessions: b1_4, preview: false },
        { code: "B1.5", name: "Projects & Operations",         sessions: b1_5, preview: false },
      ],
    },
    {
      code: "B2", name: "Business Professional",
      description: "Negosiasi, memimpin rapat, presentasi persuasif, komunikasi kepemimpinan, dan English industri. TOEIC ready.",
      sublevels: [
        { code: "B2.1", name: "Advanced Business Writing",      sessions: b2_1, preview: false },
        { code: "B2.2", name: "Negotiation",                    sessions: b2_2, preview: false },
        { code: "B2.3", name: "Leading Meetings",               sessions: b2_3, preview: false },
        { code: "B2.4", name: "Persuasive Presentations",       sessions: b2_4, preview: false },
        { code: "B2.5", name: "Leadership Communication",       sessions: b2_5, preview: false },
        { code: "B2.6", name: "Industry & Technical English",   sessions: b2_6, preview: false },
        { code: "B2.7", name: "Global Business & Certification", sessions: b2_7, preview: false },
      ],
    },
  ],
};

export default curriculum;
