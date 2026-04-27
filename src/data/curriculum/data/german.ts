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
  [1, "Deutsches Alphabet & Aussprache", ["26 huruf + ä, ö, ü", "ß (Eszett)", "1 huruf = 1 bunyi"]],
  [2, "Umlaute Mastery", ["ä: 'e' terbuka", "ö: bibir bulat", "ü: bibir bulat lidah depan"]],
  [3, "Begrüßungen Regional", ["Hallo, Guten Tag", "Servus (Bayern), Moin (Nord)", "Tschüss"]],
  [4, "Du vs Sie", ["formal vs akrab", "Sie selalu kapital!", "duzen — kapan transisi"]],
  [5, "Sich Vorstellen", ["ich heiße...", "freut mich", "ich komme aus Indonesien"]],
  [6, "Verb SEIN", ["ich bin, du bist, er/sie/es ist", "wir sind, ihr seid, sie sind"]],
  [7, "Verb HABEN", ["ich habe, du hast, er hat", "ich BIN 25 (bukan habe!)", "Hunger, Durst, Angst"]],
  [8, "Personalpronomen", ["ich, du, er, sie, es", "wir, ihr, sie, Sie", "Sie ambigu"]],
  [9, "Drei Geschlechter: der/die/das", ["der Mann, die Frau, das Kind", "hafalkan ARTIKEL bersama noun"]],
  [10, "Plural Bilden", ["+s, +e, +er, +en, Umlaut", "der Apfel → die Äpfel", "die untuk semua plural"]],
  [11, "Zahlen 0–30", ["null, eins, zwei...", "elf, zwölf", "21+: einundzwanzig"]],
  [12, "Die Familie", ["Vater, Mutter, Bruder, Schwester", "Opa, Oma, Onkel, Tante"]],
  [13, "Zahlen 31–100", ["dreißig, vierzig...", "einundvierzig (1+40)", "baca dari belakang"]],
  [14, "Nominativ & Akkusativ — Erste Fälle", ["NOM: subjek (der/die/das)", "AKK: objek (den/die/das)", "milestone Jerman!"]],
  [15, "Fragen Stellen", ["W-Frage: was, wer, wo, wann, wie", "Ja/Nein-Frage: verba di awal", "doch (untuk pertanyaan negatif)"]],
  [16, "Wiederholung & Kulturdialog", ["Pünktlichkeit (ketepatan waktu)", "small talk Jerman"]],
]);

const a1_2 = toSessions([
  [1, "Wochentage, Monate, Jahreszeiten", ["Montag-Sonntag", "Januar-Dezember (kapital!)", "Frühling, Sommer, Herbst, Winter"]],
  [2, "Die Uhrzeit", ["wie spät ist es?", "halb drei = 2:30 (BUKAN 3:30!)", "sistem 24 jam formal"]],
  [3, "Regelmäßige Verben", ["Stamm + Endung", "lernen, arbeiten, wohnen", "-e, -st, -t, -en, -t, -en"]],
  [4, "Unregelmäßige Verben", ["vokaländerung di du/er/sie", "fahren → fährst", "lesen → liest"]],
  [5, "Berufe", ["Lehrer(in), Arzt/Ärztin", "ich bin + Beruf (TANPA artikel)"]],
  [6, "Deutsches Essen & Kultur", ["300+ jenis Brot", "Wurst: Brat, Curry, Weiß", "Reinheitsgebot 1516"]],
  [7, "Im Restaurant", ["ich hätte gern...", "die Rechnung bitte", "Trinkgeld 10%"]],
  [8, "Modalverben", ["können, müssen, wollen", "dürfen, sollen, mögen", "modal di posisi 2, infinitif di akhir"]],
  [9, "Trennbare Verben", ["aufstehen: Ich stehe um 7 auf", "einkaufen, anrufen, fernsehen"]],
  [10, "Wortstellung: V2-Regel", ["verba terkonjugasi di posisi ke-2", "Heute LERNE ich Deutsch", "fondasi sintaks Jerman"]],
  [11, "Possessivartikel", ["mein, dein, sein, ihr", "unser, euer, ihr, Ihr", "berubah dengan kasus"]],
  [12, "Demonstrativa", ["dieser, diese, dieses", "der/die/das + tekanan"]],
  [13, "Körper & Gesundheit", ["Kopf, Augen, Hände, Füße", "mir tut der Kopf weh", "Krankenversicherung"]],
  [14, "Kleidung & Farben", ["Hemd, Hose, Schuhe", "rot, blau, grün, schwarz, weiß"]],
  [15, "Komposita — Kata Majemuk", ["Haus + Tür = Haustür", "Auto + Bahn = Autobahn", "gender ikut kata terakhir"]],
  [16, "Wiederholung & Mini-Dialoge", ["di Café, Supermarkt, Apotheke", "Sonntagsruhe (toko tutup Minggu)"]],
]);

const a1_3 = toSessions([
  [1, "Mein Zuhause", ["Wohnzimmer, Küche, Schlafzimmer", "es gibt + Akkusativ", "Wechselpräpositionen pengantar"]],
  [2, "Die Stadt", ["Straße, Platz, Ampel", "Bank, Krankenhaus, Bibliothek"]],
  [3, "Wegbeschreibung", ["rechts, links, geradeaus", "wie komme ich zu...?"]],
  [4, "Verkehr", ["Auto, Bus, U-Bahn, Zug", "mit dem Bus (Dativ!)", "ICE: kereta cepat Jerman"]],
  [5, "Das Wetter", ["es ist sonnig/kalt/warm", "es regnet, es schneit", "vs Indonesia tropis"]],
  [6, "Hobbys & Freizeit", ["ich mag + Akkusativ", "ich + verb + gern", "lieber, am liebsten"]],
  [7, "Sport", ["Fußball, Tennis, Schwimmen", "Bundesliga, Bayern München", "Vereinskultur"]],
  [8, "Deutsche Musik & Kino", ["Rammstein, Kraftwerk, Nena", "Wenders, Herzog, Tykwer"]],
  [9, "Reflexive Verben", ["mich, dich, sich", "Akk vs Dat reflexive", "sich anziehen"]],
  [10, "Tagesablauf", ["am Morgen, am Nachmittag", "zuerst, dann, danach", "immer, oft, nie"]],
  [11, "Vergleiche", ["-er + als (Komparativ)", "Umlaut: alt → älter", "so + adj + wie"]],
  [12, "Superlativ", ["am + adj + -sten", "der/die/das + adj + -ste", "gut → besser → am besten"]],
  [13, "Mengen & Maße", ["viel, wenig, genug", "ein Kilo, ein Liter, ein Dutzend"]],
  [14, "Imperativ", ["Komm! Iss! Lies! (du)", "Kommen Sie! (Sie)", "Kommt! (ihr)"]],
  [15, "Dativ — Der Dritte Fall", ["dem/der/dem", "trigger: mit, von, zu, bei, nach", "ich helfe dem Mann"]],
  [16, "Das Perfekt", ["haben/sein + Partizip II", "ge- + Stamm + -t/-en", "sein: pergerakan + perubahan"]],
]);

// ============ A2 — 4 sublevels, preview-locked ============
const a2_1 = titleOnly([
  "Perfekt — Vollständig", "Perfekt vs Präteritum: Wann?",
  "Zeitausdrücke der Vergangenheit", "Komparativ Avanzados",
  "Superlativ Absolut", "Modalverben Avanzado: müssen vs sollen",
  "Brauchen + zu + Infinitiv", "Wiederholung der Artikel",
  "Personen Beschreiben", "Meine Heimatstadt",
  "Reisevokabular", "Am Flughafen",
  "Hotel Check-in", "Restaurant Avanzado",
  "Hilfe Suchen auf der Straße", "Wiederholung: Reise-Rollenspiel",
]);

const a2_2 = titleOnly([
  "Dativ Vollständig — Verben mit Dativ", "Dativ vs Akkusativ: Praxis",
  "Wechselpräpositionen Vollständig", "Futur I (werden + Infinitiv)",
  "Futur: Vorhersagen", "Diskursmarker im Deutschen",
  "Filler Words: also, naja, halt, mal, eben", "Natürliches Gespräch",
  "Berufe Avanzados", "Bewerbungsgespräch",
  "Vokabular am Arbeitsplatz", "Formelle E-Mails Schreiben",
  "Beschreibe Deinen Job", "Small Talk auf Deutsch",
  "Über Erfahrungen Sprechen", "Wiederholung",
]);

const a2_3 = titleOnly([
  "Präsens Progressiv (am + Infinitiv)", "Perfekt vs Präteritum vs Progressiv",
  "Während / Wenn / Als / Indem", "Relativsätze (der, die, das, was)",
  "Adverbien", "Deshalb / Weil / Trotzdem",
  "Meinungen Ausdrücken", "Zustimmen / Widersprechen",
  "Erzählstruktur", "Bücher und Filme Rezensieren",
  "Gesundheit und Krankheit", "Beim Arzt",
  "Sport und Fitness", "Musik und Kunst",
  "Technologievokabular", "Wiederholung & Meinungsdebatte",
]);

const a2_4 = titleOnly([
  "Früher (Vergangene Gewohnheiten)", "Damals vs Heute",
  "Reflexivpronomen Avanzados", "Auch / Auch Nicht",
  "Zu + Adjektiv / Genug", "Quantifizierer: Einige, Wenige",
  "Indefinitpronomen: Jemand, Niemand", "Vorlieben Ausdrücken",
  "Vorschläge Machen", "Hilfe Anbieten und Annehmen",
  "Anweisungen Geben", "Prozesse Beschreiben",
  "Feste: Oktoberfest, Weihnachtsmärkte, Karneval", "Esskultur Deutsch",
  "Kultur Indonesien vs Deutschland", "Wiederholung & Kulturaustausch",
]);

// ============ B1 — 5 sublevels, preview-locked ============
const b1_1 = titleOnly([
  "Plusquamperfekt", "Indirekte Rede: Aussagen",
  "Indirekte Rede: Fragen", "Passiv: Präsens und Vergangenheit",
  "Diskursmarker: eigentlich, sozusagen, irgendwie, quasi", "Natürliches Gespräch Avanzado",
  "Verben mit Präposition", "Idiomatische Redewendungen: Zeit & Geld",
  "Formelles vs Informelles Register", "Rezensionen Schreiben",
  "Avanzado Beschreibung", "Kulturelle Unterschiede Deutsch",
  "Über Filme und Bücher Sprechen", "Kino: Wenders, Fassbinder",
  "Leichte Literaturdiskussion", "Wiederholung",
]);

const b1_2 = titleOnly([
  "Konjunktiv II — Einführung", "Konjunktiv II: Wünsche & Höflichkeit",
  "Wenn ... wäre / hätte", "An deiner Stelle würde ich...",
  "Konnektoren: Obwohl, Trotz, Allerdings", "Nachrichtenvokabular",
  "Politische Diskussion Light", "Globale Themen",
  "Umweltdebatte (Klimawandel, Energiewende)", "Auswirkungen der Technologie",
  "Diskurs in Sozialen Medien", "Karrierediskussionen",
  "Bewerbungsfähigkeiten", "Verhandlung Grundlagen",
  "Ideen Präsentieren", "Wiederholung",
]);

const b1_3 = titleOnly([
  "Genitiv — Der Vierte Fall (Komplett)", "Genitivpräpositionen: wegen, trotz, während",
  "Präteritum — Schriftliche Vergangenheit", "Präteritum vs Perfekt: Wann welches?",
  "Avanzado Konnektoren", "Sicherheit & Zweifel Ausdrücken",
  "Akademisches Schreiben Grundlagen", "Aufsatzstruktur",
  "Literaturdiskussion: Goethe, Schiller", "Kunst und Kultur Deutsch",
  "Historische Themen: Mauerfall, Weltkriege", "Wissenschaft und Entdeckung",
  "Philosophie Light: Kant, Nietzsche", "Geschäftsdeutsch Grundlagen",
  "Besprechungen und Entscheidungen", "Wiederholung",
]);

const b1_4 = titleOnly([
  "Partizip I & II als Adjektiv", "Verben mit Präposition Avanzados",
  "Zusammengesetzte Adjektive", "Lange Komposita Verstehen",
  "Hervorhebung mit es-Konstruktionen", "Inversion zur Betonung",
  "Reiseschreibung", "Blogs und Soziale Medien",
  "Öffentliches Sprechen — Grundlagen", "Debattenetikette",
  "Persönliche Essays", "Kreative Beschreibung",
  "Film- und TV-Analyse", "Musik und Poesie Deutsch",
  "Globale Etikette Deutsch", "Wiederholung",
]);

const b1_5 = titleOnly([
  "Indirekte Rede Avanzados", "Wenn nur / Hätte ich nur",
  "Hypothetische Situationen", "Gemischte Zeitformen",
  "Avanzado Passiv", "Lassen + Infinitiv (Causative)",
  "Feste: Oktoberfest Detail, Karneval Köln", "Tag der Deutschen Einheit, Weihnachten",
  "Vokabular zur Problemlösung", "Entscheidungsfindung",
  "Krisenmanagement", "Führung Grundlagen",
  "Teamkommunikation", "Feedback und Kritik",
  "Zeitmanagement", "Wiederholung & Geschäftssimulation",
]);

// ============ B2 — 7 sublevels, preview-locked ============
const b2_1 = titleOnly([
  "Konjunktiv I (Indirekte Rede Formell)", "Konjunktiv I: Pressesprache",
  "Konjunktiv II Avanzados", "Konditionalsätze: Reale & Irreale",
  "Hypothetische Sätze: Typ 1, 2, 3", "Komplexe Satzstrukturen",
  "Idiomatische Kollokationen", "Idiomatische Ausdrücke",
  "Metapher & Vergleich", "Ton & Register",
  "Debatten-Techniken", "Persuasive Schreibung",
  "Formelle Korrespondenz", "Akademische Präsentationen",
  "Kritische Analyse", "Wiederholung",
]);

const b2_2 = titleOnly([
  "Geschäftskommunikation", "Berichterstattung",
  "Projektmanagement-Vokabular", "Führungssprache",
  "Finanzdeutsch", "Marketingvokabular",
  "HR & Rekrutierung", "Rechtsgrundlagen",
  "Tech-Industrie & IT", "Kundenbeziehungen",
  "Internationale Geschäftsetikette", "Interkulturelle Kommunikation",
  "Präsentationen Halten", "Besprechungen Leiten",
  "Schriftliche Vorschläge", "Wiederholung",
]);

const b2_3 = titleOnly([
  "Idiomatische Flüssigkeit", "Kulturelle Nuancen",
  "Humor & Sarkasmus", "Slang & Umgangssprache",
  "Regionale Varianten: Hochdeutsch vs Bayerisch", "Avanzado Hörstrategien",
  "Schnelles Sprechen Verstehen", "Akzente: Hochdeutsch, Bayerisch, Schweizerdeutsch",
  "Akademischer Diskurs", "Journalismus-Analyse: Süddeutsche, Zeit",
  "Literatur: Mann, Hesse, Brecht", "Öffentliches Sprechen Avanzado",
  "Erzählmeisterschaft", "Debatte & Argumentation",
  "Persönliche Marke auf Deutsch", "Wiederholung",
]);

const b2_4 = titleOnly([
  "Goethe & Klassik", "Schiller & Sturm und Drang",
  "Romantik: Heine, Brüder Grimm", "Realismus: Fontane",
  "Kafka & Existentielle Literatur", "Thomas Mann & Buddenbrooks",
  "Berthold Brecht & Episches Theater", "Modern: Grass, Böll, Walser",
  "Kino: Weimarer Republik (Lang, Murnau)", "Neuer Deutscher Film: Fassbinder, Wenders, Herzog",
  "Berlin School: Petzold, Hochhäusler", "Österreichisches Kino: Haneke, Seidl",
  "Schweizer Kino", "Musik: Klassik (Bach, Beethoven, Wagner)",
  "Filmkritik", "Wiederholung",
]);

const b2_5 = titleOnly([
  "Modalpartikeln Mastery: doch, mal, ja, halt", "Modalpartikeln: eben, schon, aber, bloß",
  "Avanzado Filler & Hedging", "Nativ-Debattenstrategien",
  "Persuasive Avanzado", "Diplomatensprache",
  "Interkulturelle Konfliktlösung", "Politik-Schreibung",
  "Regierungsangelegenheiten", "Öffentliches Sprechen für Führungskräfte",
  "TED-Talk-Stil auf Deutsch", "Motivationsrede",
  "Krisenkommunikation", "Medieninterviews",
  "Pressekonferenzen", "Wiederholung",
]);

const b2_6 = titleOnly([
  "Hochdeutsch — Standard", "Norddeutsch (Hamburg, Bremen)",
  "Bayerisch — Vokabular & Aussprache", "Berlinerisch — Hauptstadtdialekt",
  "Sächsisch & Mitteldeutsch", "Schwäbisch (Stuttgart)",
  "Österreichisches Deutsch", "Wiener Dialekt",
  "Schweizerdeutsch — Schwyzerdütsch", "Liechtenstein & Luxemburg",
  "Jugendsprache: Krass, Geil, Cringe", "Anglizismen vs Reines Deutsch",
  "Verschiedene Akzente Verstehen", "Anpassung an Regionalkontext",
  "Kultur nach Region", "Wiederholung",
]);

const b2_7 = titleOnly([
  "German Mastery: Formelles Register Avanzados", "Pragmatik: Implikatur & Höflichkeit",
  "Akademische Diskurs-Meisterschaft", "Tiefe Literaturanalyse",
  "Avanzado Debatte: Struktur & Widerlegung", "Kreatives Schreiben: Kurzgeschichte",
  "Deutsch für Profis — Medizin", "Deutsch für Profis — Tech & Engineering",
  "Deutsch für Profis — Wissenschaft (Studium in Deutschland)", "Cross-Cultural Communication Mastery",
  "Avanzado Übersetzung Deutsch-Indonesisch", "Konsekutivdolmetschen",
  "Capstone: Lange Hausarbeit auf Deutsch", "Capstone: Professionelle Präsentation 15 Min",
  "Capstone: Deutscher Stammtisch / Roundtable", "Abschlussprüfung & Linguo-Zertifizierung",
]);

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("german")!,
  overview: "Program 304 sesi yang mengantar kamu dari benar-benar nol sampai percakapan near-native dalam bahasa Jerman. Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Setiap level CEFR-aligned dengan penekanan khusus pada 4 kasus (Nominativ → Akkusativ → Dativ → Genitiv), V2 word order, separable verbs, dan Modalpartikeln native (doch, mal, ja, halt). Ideal untuk persiapan studi di Jerman.",
  levels: [
    {
      code: "A1", name: "Grundlagen des Deutschen",
      description: "Fondasi bahasa Jerman: alfabet dengan ä/ö/ü/ß, sapaan regional, du vs Sie, 3 gender (der/die/das), pengantar kasus (Nominativ & Akkusativ).",
      sublevels: [
        { code: "A1.1", name: "Erste Schritte",            sessions: a1_1, preview: true },
        { code: "A1.2", name: "Alltag",                    sessions: a1_2, preview: true },
        { code: "A1.3", name: "Meine Welt & Erste Fälle",  sessions: a1_3, preview: true },
      ],
    },
    {
      code: "A2", name: "Grundstufe",
      description: "Dativ lengkap & Wechselpräpositionen, Perfekt untuk bercerita, modal verbs avanzados, filler words natural (also, naja, halt, mal).",
      sublevels: [
        { code: "A2.1", name: "Über die Basis Hinaus",       sessions: a2_1, preview: false },
        { code: "A2.2", name: "Dativ & Konversation",        sessions: a2_2, preview: false },
        { code: "A2.3", name: "Selbstausdruck",              sessions: a2_3, preview: false },
        { code: "A2.4", name: "Kulturelle Grundlagen",       sessions: a2_4, preview: false },
      ],
    },
    {
      code: "B1", name: "Mittelstufe",
      description: "Konjunktiv II untuk hypothetical, Genitiv (kasus ke-4), Präteritum tertulis, diskursmarker native (eigentlich, sozusagen), studi & karir di Jerman.",
      sublevels: [
        { code: "B1.1", name: "Konversationsflüssigkeit",  sessions: b1_1, preview: false },
        { code: "B1.2", name: "Konjunktiv II & Gesellschaft", sessions: b1_2, preview: false },
        { code: "B1.3", name: "Genitiv & Präteritum",      sessions: b1_3, preview: false },
        { code: "B1.4", name: "Kreativer Ausdruck",        sessions: b1_4, preview: false },
        { code: "B1.5", name: "Berufliche Brücke",         sessions: b1_5, preview: false },
      ],
    },
    {
      code: "B2", name: "Obere Mittelstufe",
      description: "Konjunktiv I (Pressesprache), debat, sastra (Goethe, Kafka, Mann), sinema (Berlin School, Wenders), Modalpartikeln native (doch, mal, halt), variasi Hochdeutsch-Bayerisch-Schweizerdeutsch.",
      sublevels: [
        { code: "B2.1", name: "Avanzado Ausdruck",            sessions: b2_1, preview: false },
        { code: "B2.2", name: "Berufsdeutsch",                sessions: b2_2, preview: false },
        { code: "B2.3", name: "Quasi-Native Kommunikation",   sessions: b2_3, preview: false },
        { code: "B2.4", name: "Kunst, Kino & Literatur",      sessions: b2_4, preview: false },
        { code: "B2.5", name: "Modalpartikeln & Diplomatie",  sessions: b2_5, preview: false },
        { code: "B2.6", name: "Regionale Varianten",          sessions: b2_6, preview: false },
        { code: "B2.7", name: "German Mastery (Capstone)",    sessions: b2_7, preview: false },
      ],
    },
  ],
};

export default curriculum;
