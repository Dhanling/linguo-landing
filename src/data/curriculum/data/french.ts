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
  [1, "Alphabet Français & Accents", ["26 huruf + diacritics", "é, è, ê, à, ç", "huruf bisu (s, t, d, x)"]],
  [2, "Voyelles Nasales", ["3 vokal nasal: an/in/on", "pain, vin, bon", "udara lewat hidung"]],
  [3, "Liaison & Enchaînement", ["les amis [le-zami]", "liaison wajib vs terlarang", "enchaînement"]],
  [4, "Salutations & Politesse", ["bonjour, bonsoir, salut", "comment allez-vous?", "etiket 'bonjour'"]],
  [5, "Tu vs Vous", ["formal vs akrab", "tutoyer & vouvoyer", "kapan transisi"]],
  [6, "Se Présenter", ["je m'appelle...", "enchanté(e)", "je viens d'Indonésie"]],
  [7, "Verbe ÊTRE", ["je suis, tu es, il/elle est", "identitas, profesi, sifat"]],
  [8, "Verbe AVOIR", ["j'ai, tu as, il a", "j'ai 25 ans!", "avoir faim, soif, peur"]],
  [9, "Pronoms Personnels", ["je, tu, il, elle, on", "nous, vous, ils, elles", "on = nous informal"]],
  [10, "Articles Définis & Indéfinis", ["le, la, l', les", "un, une, des", "elision: l'ami"]],
  [11, "Genre des Noms", ["maskulin vs feminin", "akhiran -tion, -té (fem)", "akhiran -ment, -age (mask)"]],
  [12, "Nombres 0–30", ["zéro, un, deux...", "11-16: onze, douze, treize"]],
  [13, "La Famille", ["père, mère, frère, sœur", "mon/ma/mes, ton/ta/tes"]],
  [14, "Nombres 31–100", ["soixante-dix (60+10)", "quatre-vingts (4×20)", "vigesimal"]],
  [15, "Questions de Base", ["qu'est-ce que, qui, où", "3 cara: intonasi/est-ce que/inversion"]],
  [16, "Révision & Dialogue Culturel", ["la bise (cipika-cipiki Prancis)", "small talk Prancis"]],
]);

const a1_2 = toSessions([
  [1, "Jours, Mois, Saisons", ["lundi-dimanche (lowercase)", "janvier-décembre", "4 saisons"]],
  [2, "L'Heure", ["quelle heure est-il?", "et demie, et quart", "sistem 24 jam Prancis"]],
  [3, "Verbes en -ER", ["parler, étudier, habiter", "akhiran -e, -es, -e, -ons"]],
  [4, "Verbes en -IR & -RE", ["finir, choisir, vendre", "3 grup verba", "prendre"]],
  [5, "Professions", ["professeur, médecin, ingénieur", "je suis + métier (tanpa artikel)"]],
  [6, "Cuisine Française & Boulangerie", ["baguette UNESCO", "fromages: camembert, brie", "vin & terroir"]],
  [7, "Au Restaurant", ["je voudrais...", "l'addition s'il vous plaît", "service compris"]],
  [8, "Articles Partitifs", ["du, de la, de l', des", "je mange du pain", "negasi → de"]],
  [9, "Verbe ALLER & Lieux", ["je vais, tu vas...", "au, aux", "parc, école, gare"]],
  [10, "Futur Proche", ["aller + infinitif", "je vais étudier demain"]],
  [11, "Adjectifs Possessifs", ["mon/ma/mes, notre/nos", "trik: mon ami(e) untuk feminin awal vokal"]],
  [12, "Démonstratifs", ["ce, cette, ces", "cet (sebelum vokal/h)"]],
  [13, "Le Corps & La Santé", ["tête, yeux, mains, pieds", "j'ai mal à...", "Sécurité Sociale"]],
  [14, "Vêtements & Couleurs", ["chemise, pantalon", "rouge, bleu, vert", "porter vs s'habiller"]],
  [15, "Verbes Irréguliers Fréquents", ["faire, prendre, venir", "voir, savoir, pouvoir, vouloir"]],
  [16, "Révision & Mini-Dialogues", ["di café", "di marché", "cultural: jam makan Prancis"]],
]);

const a1_3 = toSessions([
  [1, "Ma Maison", ["salon, cuisine, chambre", "il y a (ada)", "préposisi: dans, sur, sous"]],
  [2, "La Ville", ["rue, avenue, place", "banque, hôpital, musée"]],
  [3, "Directions", ["à droite, à gauche", "tout droit", "comment aller à...?"]],
  [4, "Transport", ["voiture, bus, métro, train", "TGV (kereta cepat)", "billet aller-retour"]],
  [5, "Le Temps Qu'il Fait", ["il fait beau/froid/chaud", "il pleut, il neige", "vs Indonesia tropis"]],
  [6, "Loisirs & Hobbies", ["j'aime + verb/noun", "moi aussi, moi non plus"]],
  [7, "Les Sports", ["football, tennis, natation", "Tour de France, Roland-Garros"]],
  [8, "Musique & Cinéma Français", ["Piaf, Stromae, Indila", "chanson française, rap"]],
  [9, "Verbes Pronominaux", ["se lever, se doucher", "me, te, se, nous, vous, se"]],
  [10, "Ma Routine Quotidienne", ["le matin, l'après-midi", "d'abord, puis, ensuite"]],
  [11, "Comparaisons", ["plus/moins + adj + que", "aussi + adj + que", "meilleur, pire"]],
  [12, "Superlatifs", ["le plus + adj + de", "le moins + adj + de"]],
  [13, "Quantités", ["beaucoup, peu, assez, trop", "un kilo, une douzaine"]],
  [14, "Impératifs de Base", ["parle, mange (tu)", "parlez, mangez (vous)", "parlons (nous)"]],
  [15, "Pronoms COD", ["le, la, les", "je le vois, je la connais"]],
  [16, "Le Passé Composé", ["avoir + participe passé", "être: DR & MRS VANDERTRAMP", "accord avec être"]],
]);

// ============ A2 — 4 sublevels, preview-locked ============
const a2_1 = titleOnly([
  "Passé Composé — Verbes Réguliers", "Passé Composé — Verbes Irréguliers",
  "Marqueurs Temporels du Passé", "Comparatifs Avancés",
  "Superlatifs Absolus", "Modal: Devoir (Conseil & Obligation)",
  "Il Faut + Infinitif", "Révision des Articles",
  "Décrire les Personnes", "Ma Ville Natale",
  "Vocabulaire de Voyage", "À l'Aéroport",
  "Check-in à l'Hôtel", "Restaurant Avancé",
  "Demander de l'Aide dans la Rue", "Révision: Jeu de Rôle Voyage",
]);

const a2_2 = titleOnly([
  "Imparfait: Introduction", "Imparfait vs Passé Composé",
  "Narration au Passé", "Futur Simple",
  "Futur: Prédictions", "Connecteurs Discursifs",
  "Filler Words: euh, bah, ben, alors, voilà", "Conversation Naturelle",
  "Professions Avancées", "Entretien d'Embauche Basique",
  "Vocabulaire du Lieu de Travail", "Écrire des E-mails Formels",
  "Décrire Votre Travail", "Small Talk à la Française",
  "Parler d'Expériences", "Révision",
]);

const a2_3 = titleOnly([
  "Être en Train de + Infinitif", "Passé vs Imparfait vs Continu",
  "Pendant Que / Quand / En + Gérondif", "Pronoms Relatifs (qui, que, où)",
  "Adverbes en -ment", "Donc / Parce que / Cependant",
  "Exprimer des Opinions", "Être d'Accord / Pas d'Accord",
  "Structure d'un Récit", "Critiquer Livres et Films",
  "Santé et Maladie", "Chez le Médecin",
  "Sports et Forme", "Musique et Arts",
  "Vocabulaire Technologique", "Révision & Débat d'Opinion",
]);

const a2_4 = titleOnly([
  "Avoir l'Habitude de", "Autrefois vs Maintenant",
  "Pronoms Réfléchis Avancés", "Aussi / Non Plus",
  "Trop / Assez", "Quantificateurs: Quelques, Peu",
  "Pronoms Indéfinis: Quelqu'un, Personne", "Exprimer des Préférences",
  "Faire des Suggestions", "Offrir et Accepter de l'Aide",
  "Donner des Instructions", "Décrire des Processus",
  "Festivals: 14 Juillet, Fête de la Musique", "Culture Gastronomique",
  "Culture Indonésienne vs Française", "Révision & Échange Culturel",
]);

// ============ B1 — 5 sublevels, preview-locked ============
const b1_1 = titleOnly([
  "Plus-que-parfait", "Discours Indirect: Affirmations",
  "Discours Indirect: Questions", "Voix Passive: Présent et Passé",
  "Marqueurs Discursifs: en fait, du coup, quoi, genre", "Conversation Naturelle Avancée",
  "Verbes Pronominaux Avancés", "Expressions Idiomatiques: Temps & Argent",
  "Registre Formel vs Informel", "Écrire des Critiques",
  "Description Avancée", "Différences Culturelles Françaises",
  "Parler de Films et Livres", "Cinéma de Truffaut",
  "Discussion Littéraire Légère", "Révision",
]);

const b1_2 = titleOnly([
  "Subjonctif — Introduction", "Subjonctif: Désirs & Émotions",
  "Subjonctif: Doute & Négation", "Il Faut Que + Subjonctif",
  "Connecteurs: Bien Que, Malgré, Cependant", "Vocabulaire de l'Actualité",
  "Discussion Politique Légère", "Sujets Mondiaux",
  "Débat Environnemental", "Impact de la Technologie",
  "Discours sur les Réseaux Sociaux", "Discussions de Carrière",
  "Compétences d'Entretien", "Négociation de Base",
  "Présenter des Idées", "Révision",
]);

const b1_3 = titleOnly([
  "Subjonctif Avancé: Présent", "Subjonctif Passé",
  "Pour Que + Subjonctif", "Subjonctif dans Propositions Relatives",
  "Connecteurs Avancés", "Exprimer Certitude & Doute",
  "Écriture Académique de Base", "Structure d'une Dissertation",
  "Discussion Littéraire: Hugo, Camus", "Art et Culture Française",
  "Sujets Historiques: Révolution, Guerres", "Science et Découverte",
  "Philosophie Française Light", "Français des Affaires Basique",
  "Réunions et Décisions", "Révision",
]);

const b1_4 = titleOnly([
  "Gérondif vs Participe Présent", "Verbes avec Préposition Avancés",
  "Adjectifs Composés", "Mots Tronqués (resto, ciné)",
  "Mise en Relief: C'est... Que", "Phrases Clivées",
  "Écriture de Voyage", "Blogs et Réseaux Sociaux",
  "Parler en Public — Base", "Étiquette du Débat",
  "Essais Personnels", "Description Créative",
  "Analyse de Cinéma et TV", "Musique et Poésie Française",
  "Étiquette Globale Française", "Révision",
]);

const b1_5 = titleOnly([
  "Discours Indirect Avancé", "Si Seulement / J'Aimerais Que",
  "Situations Hypothétiques", "Temps Mixtes",
  "Voix Passive Avancée", "Faire / Laisser + Infinitif",
  "Festivals: Cannes, Festival d'Avignon", "Tour de France, Roland-Garros",
  "Vocabulaire de Résolution de Problèmes", "Prise de Décision",
  "Gestion de Crise", "Leadership de Base",
  "Communication d'Équipe", "Feedback et Critique",
  "Gestion du Temps", "Révision & Simulation d'Affaires",
]);

// ============ B2 — 7 sublevels, preview-locked ============
const b2_1 = titleOnly([
  "Subjonctif Imparfait & Plus-que-parfait", "Conditionnel Présent",
  "Conditionnel Passé", "Phrases Hypothétiques: Si Types 1, 2, 3",
  "Structures Emphatiques", "Collocations Idiomatiques",
  "Expressions Idiomatiques", "Métaphore & Comparaison",
  "Ton & Registre", "Techniques de Débat",
  "Écriture Persuasive", "Correspondance Formelle",
  "Présentations Académiques", "Analyse Critique",
  "Résumé & Paraphrase", "Révision",
]);

const b2_2 = titleOnly([
  "Communication d'Entreprise", "Rédaction de Rapports",
  "Vocabulaire de Gestion de Projet", "Langage du Leadership",
  "Français Financier", "Vocabulaire Marketing",
  "RH & Recrutement", "Concepts Légaux de Base",
  "Industrie Tech & IT", "Relations Clients",
  "Étiquette des Affaires Internationale", "Communication Interculturelle",
  "Faire des Présentations", "Animer des Réunions",
  "Propositions Écrites", "Révision",
]);

const b2_3 = titleOnly([
  "Fluidité Idiomatique", "Nuances Culturelles",
  "Humour & Sarcasme", "Argot & Langue Familière",
  "Variantes Régionales: France vs Québec vs Belgique", "Stratégies d'Écoute Avancées",
  "Compréhension de la Parole Rapide", "Accents: Parisien, Québécois, Belge, Africain",
  "Discours Académique", "Analyse Journalistique",
  "Littérature: Hugo, Camus, Sartre", "Parler en Public Avancé",
  "Maîtrise Narrative", "Débat & Argumentation",
  "Marque Personnelle en Français", "Révision",
]);

const b2_4 = titleOnly([
  "Hugo & Le Romantisme", "Balzac & Le Réalisme",
  "Camus, Sartre & l'Existentialisme", "Proust & La Recherche",
  "Cinéma: Truffaut & La Nouvelle Vague", "Godard, Resnais, Varda",
  "Cinéma Contemporain: Audiard, Sciamma, Ozon", "Cinéma d'Animation: Ghibli vs Astérix",
  "Peinture: Impressionnisme (Monet, Renoir)", "Peinture: Cubisme (Picasso, Braque)",
  "Poésie: Baudelaire, Rimbaud, Verlaine", "Théâtre: Molière, Racine",
  "Bande Dessinée: Tintin, Astérix", "Chanson: Brel, Brassens, Aznavour",
  "Critique de Films", "Révision",
]);

const b2_5 = titleOnly([
  "Filler Words Natifs: tu vois, en gros, finalement", "Atténuation & Adoucir Opinions",
  "Stratégies de Débat Natif", "Techniques Persuasives Avancées",
  "Langage Diplomatique", "Résolution de Conflits Interculturels",
  "Rédaction de Politiques", "Affaires Gouvernementales",
  "Parler en Public pour Leaders", "Style TED Talk en Français",
  "Discours Motivationnel", "Présence Exécutive",
  "Communication de Crise", "Entretiens avec les Médias",
  "Conférences de Presse", "Révision",
]);

const b2_6 = titleOnly([
  "Variantes Régionales — France Métropolitaine", "Français du Sud vs Nord",
  "Québécois: Particularités & Vocabulaire", "Joual & Argot Québécois",
  "Belgique: Belgicismes (septante, nonante)", "Suisse Romande",
  "Afrique Francophone: Sénégal, Côte d'Ivoire", "Maghreb: Maroc, Algérie, Tunisie",
  "Créoles Francophones: Haïti, Antilles", "Différences de Vocabulaire par Pays",
  "Verlan: Argot Inversé", "Argot Jeunesse Francophone",
  "Comprendre Accents Divers", "Adapter au Contexte Régional",
  "Culture par Région Francophone", "Révision",
]);

const b2_7 = titleOnly([
  "French Mastery: Registre Formel Avancé", "Pragmatique: Implicatures & Politesse",
  "Maîtrise du Discours Académique", "Analyse Littéraire Profonde",
  "Débat Avancé: Structure & Réfutation", "Écriture Créative: Nouvelle",
  "Français pour Professionnels — Santé", "Français pour Professionnels — Tech",
  "Français pour Professionnels — Diplomatie", "Communication Cross-Culturelle Maîtrisée",
  "Traduction Avancée Français-Indonésien", "Interprétation Consécutive",
  "Capstone: Dissertation Longue en Français", "Capstone: Présentation Professionnelle 15 min",
  "Capstone: Table Ronde Francophone", "Examen Final & Certification Linguo",
]);

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("french")!,
  overview: "Program 304 sesi yang mengantar kamu dari benar-benar nol sampai percakapan near-native dalam bahasa Prancis. Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Setiap level CEFR-aligned dengan penekanan pada vokal nasal, liaison, modus subjonctif (milestone B1), dan variasi francophone dari Paris hingga Québec & Afrika.",
  levels: [
    {
      code: "A1", name: "Fondations du Français",
      description: "Fondasi bahasa Prancis: alfabet dengan accent (é, è, ê, à, ç), 3 vokal nasal, liaison & enchaînement, tu vs vous, dan struktur kalimat dasar.",
      sublevels: [
        { code: "A1.1", name: "Premiers Pas",          sessions: a1_1, preview: true },
        { code: "A1.2", name: "Vie Quotidienne",       sessions: a1_2, preview: true },
        { code: "A1.3", name: "Mon Univers",           sessions: a1_3, preview: true },
      ],
    },
    {
      code: "A2", name: "Pré-Intermédiaire",
      description: "Bercerita masa lalu (passé composé vs imparfait), gastronomi Prancis, mulai filler words natural (euh, bah, alors, voilà).",
      sublevels: [
        { code: "A2.1", name: "Au-delà des Bases",        sessions: a2_1, preview: false },
        { code: "A2.2", name: "Travail & Conversation",   sessions: a2_2, preview: false },
        { code: "A2.3", name: "Expression Personnelle",   sessions: a2_3, preview: false },
        { code: "A2.4", name: "Fondements Culturels",     sessions: a2_4, preview: false },
      ],
    },
    {
      code: "B1", name: "Intermédiaire",
      description: "Modus subjonctif (milestone besar Prancis), discourse markers seperti penutur asli (en fait, du coup, quoi), diskusi sosial-budaya.",
      sublevels: [
        { code: "B1.1", name: "Fluidité Conversationnelle", sessions: b1_1, preview: false },
        { code: "B1.2", name: "Subjonctif & Société",       sessions: b1_2, preview: false },
        { code: "B1.3", name: "Sujets Complexes",           sessions: b1_3, preview: false },
        { code: "B1.4", name: "Expression Créative",        sessions: b1_4, preview: false },
        { code: "B1.5", name: "Pont Professionnel",         sessions: b1_5, preview: false },
      ],
    },
    {
      code: "B2", name: "Intermédiaire Avancé",
      description: "Subjonctif lanjutan, debat ala Prancis, sastra (Hugo, Camus, Proust), sinema (Nouvelle Vague hingga Sciamma), variasi francophone Paris-Québec-Afrika.",
      sublevels: [
        { code: "B2.1", name: "Expression Avancée",          sessions: b2_1, preview: false },
        { code: "B2.2", name: "Français Professionnel",      sessions: b2_2, preview: false },
        { code: "B2.3", name: "Communication Quasi-Native",  sessions: b2_3, preview: false },
        { code: "B2.4", name: "Art, Cinéma & Littérature",   sessions: b2_4, preview: false },
        { code: "B2.5", name: "Leadership & Diplomatie",     sessions: b2_5, preview: false },
        { code: "B2.6", name: "Variantes Régionales",        sessions: b2_6, preview: false },
        { code: "B2.7", name: "French Mastery (Capstone)",   sessions: b2_7, preview: false },
      ],
    },
  ],
};

export default curriculum;
