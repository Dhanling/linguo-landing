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
  [1, "Alphabet & Pronunciation", ["29 huruf (+æ ø å)", "vokal & konsonan", "intro stød (glottal stop)", "bløde d & tavse bogstaver"]],
  [2, "Greetings & Goodbyes", ["hej / goddag", "godmorgen / godaften", "farvel / vi ses"]],
  [3, "Introducing Yourself", ["jeg hedder…", "jeg er fra…", "jeg er + profession"]],
  [4, "Numbers 0–20", ["nul → tyve", "telefonnummer", "alder: jeg er … år"]],
  [5, "Days & Months", ["mandag → søndag", "januar → december", "ordinaltal: første, anden"]],
  [6, "Colors & Basic Adjectives", ["rød, blå, grøn, gul", "stor / lille", "ny / gammel"]],
  [7, "Family Members", ["mor, far, søster, bror", "bedstemor, bedstefar", "possessive: mors / fars"]],
  [8, "Articles: en vs et", ["en bil, en mand (~75%)", "et hus, et barn (~25%)", "hafalkan per kata"]],
  [9, "Subject Pronouns", ["jeg, du, han, hun", "det/den, vi, I, de"]],
  [10, "Verb 'at være' — Positive", ["jeg er, du er, han er", "vi er, I er, de er"]],
  [11, "Verb 'at være' — Negative & Questions", ["er ikke", "Er du…? + V2 inversion"]],
  [12, "Numbers 20–100 & Vigesimal Quirks", ["tyve, tredive, fyrre", "halvtreds (50), tres (60), halvfjerds (70), firs (80), halvfems (90)", "Hvor meget koster det?"]],
  [13, "Telling Time", ["Hvad er klokken?", "klokken er ti", "halv tre (= 14:30), kvart i / over"]],
  [14, "Food & Drinks Basics", ["brød, ost, smør, mælk", "kaffe, te, øl, vand", "morgenmad, frokost, aftensmad"]],
  [15, "Classroom Language", ["bog, blyant, kuglepen", "Må jeg…? Kan du gentage?"]],
  [16, "Review & First Conversation", ["self-intro lengkap", "small talk: vejret, navn, hvor er du fra"]],
]);

const a1_2 = toSessions([
  [1, "Present Tense — Same Form All Persons", ["jeg taler, du taler, han taler", "-er ending", "no conjugation per person!"]],
  [2, "Present Tense — Negative & Questions", ["jeg taler ikke", "Taler du dansk? — inversion", "ikke placement after verb"]],
  [3, "My Home", ["værelser: stue, køkken, badeværelse", "møbler: bord, stol, seng", "der er / der står"]],
  [4, "Daily Routine", ["vågne op, stå op, gå på arbejde", "først → så → til sidst", "om morgenen / aftenen"]],
  [5, "Possessive Adjectives", ["min/mit, din/dit (en/et agreement)", "hans, hendes, vores, jeres, deres"]],
  [6, "Question Words", ["Hvad, Hvor, Hvornår", "Hvem, Hvorfor, Hvordan"]],
  [7, "Prepositions of Place", ["i, på, under, over", "ved siden af, bagved, foran"]],
  [8, "Clothes & Outfits", ["tøj: bukser, skjorte, kjole, jakke", "sko, hat, halstørklæde"]],
  [9, "Weather & Seasons", ["Det regner / sner / blæser", "kold / varm / mild", "forår, sommer, efterår, vinter"]],
  [10, "At the Market", ["frugt og grønt", "noget / nogen quantifiers", "Hvad koster det?"]],
  [11, "At a Restaurant", ["menukort, hovedret, dessert", "Jeg vil gerne have…", "Regningen, tak"]],
  [12, "Kan & Kan ikke — Ability", ["Jeg kan svømme", "Jeg kan ikke lave mad", "Kan du…?"]],
  [13, "Adverbs of Frequency", ["altid, ofte, nogle gange", "sjældent, aldrig", "placement after verb"]],
  [14, "Hobbies & Free Time", ["Jeg kan lide at + verb", "fritid: at læse, at se film, at lytte til musik"]],
  [15, "Likes & Dislikes", ["Jeg elsker / Jeg hader", "Hvad med dig?", "preferences"]],
  [16, "Review & Role Play", ["restaurant scenario", "shopping scenario", "asking for directions"]],
]);

const a1_3 = toSessions([
  [1, "Definite Article as Suffix", ["en bil → bilen", "et hus → huset", "biler → bilerne (plural definite)", "CRITICAL Danish feature"]],
  [2, "Past Tense — Preteritum Regular", ["talte (talk), arbejdede (worked)", "-ede / -te endings"]],
  [3, "Past Tense — Common Irregulars", ["var (was), havde (had), gik (went)", "kom, så, gjorde, fik"]],
  [4, "Object Pronouns", ["mig, dig, ham, hende", "os, jer, dem", "den/det objects"]],
  [5, "V2 Word Order", ["verb-second rule", "I går spiste jeg pizza (bukan: jeg spiste)", "core Danish syntax"]],
  [6, "Modal Verbs", ["kan (can), skal (must/will)", "vil (want), må (may/must)", "+ infinitive tanpa 'at'"]],
  [7, "Directions in Town", ["drej til venstre / højre", "gå lige ud", "over for, på hjørnet"]],
  [8, "Transportation", ["med bus, med tog, med cykel", "tage S-toget, gå til fods"]],
  [9, "Shopping for Clothes", ["størrelser: small, medium…", "prøve på", "for stor / for lille"]],
  [10, "Making Plans", ["Skal vi…? Hvad med…?", "accept: Ja, gerne / Det lyder godt", "decline: Beklager, jeg kan ikke"]],
  [11, "On the Phone", ["Det er … der taler", "Kan jeg tale med…?", "Vent et øjeblik"]],
  [12, "Filling Out Forms", ["personlige oplysninger", "fornavn, efternavn, adresse, postnr."]],
  [13, "Basic Connectors", ["og, men, eller", "fordi (because), hvis (if), så (so)"]],
  [14, "Adjective Inflection en/et/plural", ["en stor bil / et stort hus / store biler", "must agree with noun gender + number"]],
  [15, "My Last Weekend", ["preteritum storytelling", "først… så… til sidst…", "3-min personal story"]],
  [16, "Review & Hygge Introduction", ["cultural concept: hygge", "what makes it Danish", "self-narrative review"]],
]);

// ============ A2 — 4 sublevels, preview-locked ============
const a2_1 = titleOnly([
  "Past Tense Mastery — Regular & Irregular",
  "Past Tense — Negative & Questions",
  "Time Expressions (Past) — i går, sidste uge",
  "Comparative Adjectives — større, mindre",
  "Superlative Adjectives — størst, mindst",
  "Modal: Burde (Should) — Advice",
  "Modal: Skal / Være nødt til (Must / Have to)",
  "Definite & Indefinite Review",
  "Describing People — hair, eyes, personality",
  "My Hometown",
  "Travel Vocabulary — rejse, ferie",
  "At the Airport — lufthavn, gate, bagage",
  "Hotel Check-in — booking, værelse",
  "Restaurant Advanced — anbefalinger, klager",
  "Asking for Help — Kan du hjælpe mig?",
  "Review: Travel Role Play",
]);

const a2_2 = titleOnly([
  "Perfektum — har + past participle",
  "Perfektum — Aldrig / Nogensinde",
  "Perfektum — Lige / Allerede / Endnu",
  "Future: Skal til at (Going to)",
  "Future: Vil (Will)",
  "First Conditional — Hvis… så…",
  "Jobs & Occupations",
  "Job Interview Basics (Danish style)",
  "Workplace Vocabulary — kollega, chef, møde",
  "Writing Emails — formal vs informal",
  "Describing Your Job",
  "Making Small Talk — Danish vejret-culture",
  "Talking About Experiences",
  "News & Current Events",
  "Environment & Nature — klima",
  "Review",
]);

const a2_3 = titleOnly([
  "Past Action in Progress — var ved at / var i gang med",
  "Background vs Foreground in Stories",
  "Mens (While), Da (When)",
  "Relative Clauses — som, der",
  "Adverbs of Manner — hurtigt, langsomt",
  "Connectors — så, fordi, men",
  "Expressing Opinions — Jeg synes / Jeg mener",
  "Agreeing & Disagreeing — Jeg er enig / uenig",
  "Storytelling Structure",
  "Describing a Book or Movie",
  "Health & Illness — sygdom, kroppen",
  "At the Doctor's — lægen, akut",
  "Sports & Fitness — fodbold, håndbold, cykling",
  "Music & Arts",
  "Technology Vocabulary",
  "Review & Opinion Debate",
]);

const a2_4 = titleOnly([
  "Plejede at (Used To) — Past Habits",
  "Reflexive Pronouns — sig, sig selv",
  "Begge / Enten / Hverken (Both/Either/Neither)",
  "For meget / Nok (Too / Enough)",
  "Quantifiers — lidt, nogle, mange, få",
  "Indefinite Pronouns — nogen, ingen, enhver",
  "Expressing Preferences — Jeg foretrækker",
  "Making Suggestions — Skal vi…?",
  "Offering & Accepting Help",
  "Giving Instructions",
  "Describing Processes",
  "Danish Festivals — jul, sankt hans, fastelavn, påske",
  "Danish Food Culture — smørrebrød, frikadeller, øllebrød",
  "Indonesian vs Danish Culture",
  "Janteloven — The Law of Jante",
  "Review & Cultural Exchange",
]);

// ============ B1 — 5 sublevels, preview-locked ============
const b1_1 = titleOnly([
  "No Present Continuous — Danish Alternatives (er ved at / sidder og)",
  "Pluskvamperfektum (Past Perfect) — havde + participle",
  "Reported Speech: Statements",
  "Reported Speech: Questions",
  "Passive Voice: s-form — bygges, sælges",
  "Passive Voice: Blive-passive — bliver bygget",
  "Second Conditional — Hvis jeg var…",
  "Modal Verbs Review",
  "Particle Verbs — tage med, gå ud, komme tilbage",
  "Idioms: Time & Money",
  "Formal vs Informal — du vs De (historical use)",
  "Writing Reviews",
  "Advanced Description",
  "Cultural Differences — Scandinavian context",
  "Discussing Danish TV — Borgen, Forbrydelsen",
  "Review",
]);

const b1_2 = titleOnly([
  "Third Conditional — Hvis jeg havde været…",
  "Mixed Conditionals",
  "Defining vs Non-defining Relative Clauses",
  "Participle Constructions",
  "Linking: Selvom, På trods af, Imidlertid",
  "News Vocabulary",
  "Danish Politics — Folketinget, statsminister, koalition",
  "Global Issues",
  "Environment Debate — klimaforandringer",
  "Technology Impact",
  "Social Media Discourse",
  "Career Discussions",
  "Interview Skills",
  "Negotiation Basics",
  "Presenting Ideas",
  "Review",
]);

const b1_3 = titleOnly([
  "Modal Perfects — burde have, skulle have",
  "Advanced Passive",
  "Nominalization",
  "Inversion for Emphasis — Danish V2 mastery",
  "Advanced Linking",
  "Expressing Certainty & Doubt — sikkert, måske, formentlig",
  "Academic Writing Basics",
  "Essay Structure",
  "Literature Discussion — H.C. Andersen, Karen Blixen",
  "Danish Design & Architecture — Arne Jacobsen, Bang & Olufsen",
  "History Topics — Vikingerne, 1864, 1940–45",
  "Science & Discovery — Niels Bohr",
  "Philosophy Light — Kierkegaard intro",
  "Business Danish Basics",
  "Meetings & Decisions",
  "Review",
]);

const b1_4 = titleOnly([
  "Gerunds & Infinitive Equivalents — at + verb",
  "Advanced Particle Verbs",
  "Compound Words — speciallægepraksis, sundhedsforsikring",
  "Affixes — Prefixes & Suffixes",
  "Emphasis with Det er… der/som",
  "Cleft Sentences Intro",
  "Travel Writing",
  "Blog & Social Media Writing",
  "Public Speaking Basics",
  "Debate Etiquette — Danish soft-debate style",
  "Personal Essays",
  "Creative Description",
  "Film & TV Analysis — Lars von Trier, Danish noir",
  "Music & Poetry — Inger Christensen, Yahya Hassan",
  "Global Etiquette — Janteloven in practice",
  "Review",
]);

const b1_5 = titleOnly([
  "Advanced Reported Speech",
  "Ville ønske at / Hvis bare (Wish / If Only)",
  "Hypothetical Situations",
  "Mixed Tenses",
  "Advanced Passive",
  "Causative — få nogen til at",
  "Expressing Regret",
  "Expressing Hope & Wishes",
  "Problem-Solving Vocabulary",
  "Decision Making",
  "Crisis Management",
  "Leadership Basics",
  "Team Communication — Danish flat hierarchy",
  "Feedback & Critique — direkte Danish style",
  "Time Management",
  "Review & Business Simulation",
]);

// ============ B2 — 7 sublevels, preview-locked ============
const b2_1 = titleOnly([
  "Complex Sentence Structures",
  "Konjunktiv — Limited Danish Subjunctive",
  "Emphatic Structures",
  "Cleft Sentences Advanced",
  "Collocations",
  "Idiomatic Expressions — Danske udtryk",
  "Metaphor & Simile",
  "Tone & Register Mastery",
  "Debate Techniques",
  "Persuasive Writing",
  "Formal Correspondence",
  "Academic Presentations",
  "Critical Analysis",
  "Summarizing & Paraphrasing",
  "Creative Writing",
  "Review",
]);

const b2_2 = titleOnly([
  "Business Communication",
  "Report Writing",
  "Project Management Vocabulary",
  "Leadership Language",
  "Financial Danish — bank, regnskab",
  "Marketing Vocabulary",
  "HR & Recruitment",
  "Legal Basics — kontrakt, lov",
  "IT & Tech Industry",
  "Client Relations",
  "International Business Etiquette",
  "Cross-cultural Communication",
  "Giving Presentations",
  "Chairing Meetings — Danish meeting culture",
  "Written Proposals",
  "Review",
]);

const b2_3 = titleOnly([
  "Idiomatic Fluency",
  "Cultural Nuances — hygge & janteloven applied",
  "Humor & Sarcasm — Danish dry humor",
  "Slang & Colloquialisms — ungdomssprog",
  "Regional Varieties — Jysk, Sjællandsk, Sønderjysk, Bornholmsk",
  "Advanced Listening Strategies",
  "Fast Speech Comprehension",
  "Accents — Copenhagen vs Aarhus vs Jutland",
  "Academic Discourse",
  "Journalism — Politiken, Berlingske, DR",
  "Literature & Poetry",
  "Public Speaking",
  "Storytelling Mastery",
  "Debate & Argumentation",
  "Personal Brand in Danish",
  "Review",
]);

const b2_4 = titleOnly([
  "Academic Reading Strategies",
  "Research Vocabulary",
  "Thesis Writing — speciale, afhandling",
  "Citation — Danish academic conventions",
  "Data Presentation",
  "Graphs & Charts Description",
  "Scientific Method",
  "Experimental Reports",
  "Peer Review Language",
  "Conference Presentations",
  "Research Proposals",
  "Literature Review",
  "Abstract Writing",
  "Hypothesis Formulation",
  "Academic Debate",
  "Review",
]);

const b2_5 = titleOnly([
  "Legal Danish Introduction",
  "Contract Vocabulary",
  "Negotiation Mastery",
  "Arbitration & Mediation",
  "Diplomatic Language",
  "Intercultural Dispute Resolution",
  "Policy Writing",
  "Government Affairs — Folketinget, kommune",
  "Public Speaking for Leaders",
  "TED Talk Style",
  "Motivational Speaking",
  "Executive Presence",
  "Crisis Communication",
  "Media Interviews",
  "Press Conferences",
  "Review",
]);

const b2_6 = titleOnly([
  "Literary Analysis",
  "Poetry Interpretation",
  "Old Norse Heritage — runer, sagaer",
  "Modern Literature — Tove Ditlevsen, Yahya Hassan",
  "Short Story Crafting",
  "Novel Structure",
  "Character Development",
  "Dialogue Writing",
  "Screenplay Basics",
  "Song Lyric Writing",
  "Translation Skills — DA ↔ ID",
  "Subtitling Basics",
  "Creative Non-fiction",
  "Memoir Writing",
  "Travel Writing Mastery",
  "Review",
]);

const b2_7 = titleOnly([
  "Prøve i Dansk 3 — Skriftlig Fremstilling Task 1",
  "Prøve i Dansk 3 — Skriftlig Fremstilling Task 2",
  "Prøve i Dansk 3 — Læseforståelse",
  "Prøve i Dansk 3 — Lytteforståelse",
  "Prøve i Dansk 3 — Mundtlig Kommunikation Part 1",
  "Prøve i Dansk 3 — Mundtlig Kommunikation Part 2 & 3",
  "Studieprøven — Long Essay Writing (Stretch)",
  "Studieprøven — Short Response",
  "Studieprøven — Reading",
  "Studieprøven — Listening",
  "Studieprøven — Speaking",
  "Mock Tests Strategy",
  "Time Management in Tests",
  "Common Pitfalls — Danish vs Indonesian L1",
  "Score Improvement Tactics",
  "Final Mock Test & Review",
]);

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("danish")!,
  overview: "Program 304 sesi yang mengantar kamu dari benar-benar nol sampai percakapan near-native dalam bahasa Denmark (Dansk). Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Setiap level dirancang untuk CEFR standard dengan fokus pada keunikan Danish — alfabet 29 huruf (æ ø å), pelafalan stød & bløde d, sistem angka vigesimal, dan integrasi budaya Skandinavia (hygge, janteloven). B2 ready untuk Prøve i Dansk 3 dan Studieprøven.",
  levels: [
    {
      code: "A1", name: "Elementary Foundation",
      description: "Fondasi bahasa: alfabet 29 huruf, en/et gender, tata bahasa dasar, percakapan sehari-hari.",
      sublevels: [
        { code: "A1.1", name: "First Steps",   sessions: a1_1, preview: true },
        { code: "A1.2", name: "Daily Life",    sessions: a1_2, preview: true },
        { code: "A1.3", name: "Social Basics", sessions: a1_3, preview: true },
      ],
    },
    {
      code: "A2", name: "Pre-Intermediate",
      description: "Beyond basics: perfektum mastery, V2 syntax, perjalanan, pekerjaan, budaya Denmark.",
      sublevels: [
        { code: "A2.1", name: "Beyond Basics",        sessions: a2_1, preview: false },
        { code: "A2.2", name: "Travel & Work",        sessions: a2_2, preview: false },
        { code: "A2.3", name: "Self-Expression",      sessions: a2_3, preview: false },
        { code: "A2.4", name: "Cultural Foundations", sessions: a2_4, preview: false },
      ],
    },
    {
      code: "B1", name: "Intermediate",
      description: "Fluency foundations: tenses kompleks, passive voice (s-form & blive), konteks budaya Skandinavia.",
      sublevels: [
        { code: "B1.1", name: "Fluency Foundations",  sessions: b1_1, preview: false },
        { code: "B1.2", name: "Cultural Fluency",     sessions: b1_2, preview: false },
        { code: "B1.3", name: "Complex Topics",       sessions: b1_3, preview: false },
        { code: "B1.4", name: "Creative Expression",  sessions: b1_4, preview: false },
        { code: "B1.5", name: "Professional Bridge",  sessions: b1_5, preview: false },
      ],
    },
    {
      code: "B2", name: "Upper Intermediate",
      description: "Advanced expression: bisnis Denmark, akademik, near-native. Prøve i Dansk 3 / Studieprøven ready.",
      sublevels: [
        { code: "B2.1", name: "Advanced Expression",       sessions: b2_1, preview: false },
        { code: "B2.2", name: "Professional Danish",       sessions: b2_2, preview: false },
        { code: "B2.3", name: "Near-Native Communication", sessions: b2_3, preview: false },
        { code: "B2.4", name: "Academic Mastery",          sessions: b2_4, preview: false },
        { code: "B2.5", name: "Leadership & Diplomacy",    sessions: b2_5, preview: false },
        { code: "B2.6", name: "Creative & Literary",       sessions: b2_6, preview: false },
        { code: "B2.7", name: "Test Prep (Prøve i Dansk)", sessions: b2_7, preview: false },
      ],
    },
  ],
};

export default curriculum;
