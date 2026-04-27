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
  [1, "Alfabeto Español & Pronunciación", ["27 huruf + ñ", "vokal murni a/e/i/o/u", "tildes & acentos", "ll, rr, ch"]],
  [2, "Saludos y Despedidas", ["hola / buenos días", "adiós / hasta luego", "¿cómo estás?"]],
  [3, "Presentarse", ["me llamo...", "mucho gusto", "soy de Indonesia"]],
  [4, "Tú vs Usted", ["formal vs akrab", "kapan pakai usted", "vosotros vs ustedes"]],
  [5, "Pronombres Personales", ["yo, tú, él, ella", "nosotros, vosotros, ellos"]],
  [6, "Verbo SER — Identidad", ["soy, eres, es", "profesi, kebangsaan, sifat"]],
  [7, "Verbo ESTAR — Estado y Lugar", ["estoy, estás, está", "lokasi & kondisi sementara"]],
  [8, "SER vs ESTAR — Diferencias Clave", ["permanen vs sementara", "soy alegre vs estoy alegre"]],
  [9, "Números 0–30", ["cero, uno, dos...", "21+: veintiuno, veintidós"]],
  [10, "Artículos & Género", ["el, la, los, las", "un, una, unos, unas", "-o/-a"]],
  [11, "Sustantivos en Plural", ["+s / +es", "lápiz → lápices"]],
  [12, "Adjetivos Descriptivos", ["concordancia gender & jumlah", "alto, simpático"]],
  [13, "La Familia", ["padre, madre, hermanos", "posesivos: mi, tu, su"]],
  [14, "Países y Nacionalidades", ["20 negara hispanohablante", "español/española"]],
  [15, "Preguntas Básicas", ["qué, quién, dónde, cuándo", "tanda tanya ganda ¿?"]],
  [16, "Repaso & Primer Diálogo", ["self-intro", "cultural: la bise / cipika-cipiki Spanyol"]],
]);

const a1_2 = toSessions([
  [1, "Días, Meses, Estaciones", ["lunes-domingo (lowercase)", "enero-diciembre", "4 estaciones"]],
  [2, "La Hora", ["¿qué hora es?", "es la una / son las...", "y media, y cuarto"]],
  [3, "Verbos Regulares -AR", ["hablar, estudiar, trabajar", "akhiran -o, -as, -a, -amos"]],
  [4, "Verbos Regulares -ER & -IR", ["comer, beber, vivir, escribir", "perbedaan akhiran"]],
  [5, "Profesiones", ["profesor, médico, ingeniero", "soy + profesión (tanpa artikel)"]],
  [6, "Comida & Tapas", ["pan, queso, jamón", "tapas culture", "vino, sangría"]],
  [7, "En el Restaurante", ["quisiera...", "la cuenta por favor", "menu del día"]],
  [8, "Verbo TENER", ["tengo 25 años (BUKAN soy)", "tener hambre, sed, sueño"]],
  [9, "Verbo IR & Lugares", ["voy, vas, va...", "ir a + tempat", "al, del kontraksi"]],
  [10, "Futuro con IR A", ["voy a estudiar mañana", "rencana akhir pekan"]],
  [11, "Adjetivos Posesivos", ["mi, tu, su, nuestro", "ambiguitas 'su'"]],
  [12, "Demostrativos", ["este, ese, aquel", "tiga jarak"]],
  [13, "El Cuerpo & La Salud", ["cabeza, ojos, manos", "me duele...", "en la farmacia"]],
  [14, "La Ropa & Los Colores", ["camisa, pantalón, zapatos", "rojo, azul, verde"]],
  [15, "Verbos con Cambio de Raíz", ["e→ie querer", "o→ue poder", "e→i pedir"]],
  [16, "Repaso & Mini-Diálogos", ["di restoran", "di toko baju", "cultural: jam makan Spanyol"]],
]);

const a1_3 = toSessions([
  [1, "Mi Casa", ["sala, cocina, dormitorio", "muebles", "hay (ada)"]],
  [2, "La Ciudad", ["calle, plaza, esquina", "banco, hospital, museo"]],
  [3, "Direcciones", ["a la derecha, a la izquierda", "todo recto", "¿cómo llego a...?"]],
  [4, "Transporte", ["coche, bus, metro, tren", "ir en + transporte"]],
  [5, "El Tiempo (Cuaca)", ["hace sol, hace frío", "llueve, nieva", "vs Indonesia tropis"]],
  [6, "Hobbies & Tiempo Libre", ["me gusta + verb/noun", "agreement gusta(n)"]],
  [7, "Deportes", ["fútbol, baloncesto, tenis", "Real Madrid, Barça, Boca"]],
  [8, "Música & Cine Hispano", ["flamenco, salsa, reggaeton", "Almodóvar, Cuarón"]],
  [9, "Verbos Reflexivos", ["me, te, se, nos, os, se", "levantarse, ducharse"]],
  [10, "Mi Rutina Diaria", ["por la mañana/tarde/noche", "primero, luego, después"]],
  [11, "Comparaciones", ["más/menos + adj + que", "tan + adj + como"]],
  [12, "Superlativos", ["el más + adj + de", "-ísimo: grandísimo"]],
  [13, "Cantidades", ["mucho, poco, bastante", "un kilo, un litro, una docena"]],
  [14, "Imperativos Básicos", ["habla, come, escribe", "irreguler: di, ven, sal"]],
  [15, "Pronombres OD", ["lo, la, los, las", "lo veo, la conozco"]],
  [16, "Pretérito Perfecto", ["he comido, has visto", "esta semana, alguna vez"]],
]);

// ============ A2 — 4 sublevels, preview-locked ============
const a2_1 = titleOnly([
  "Pretérito Indefinido — Verbos Regulares", "Pretérito Indefinido — Irregulares",
  "Marcadores Temporales del Pasado", "Adjetivos Comparativos Avanzados",
  "Superlativos Absolutos", "Modal: Deber (Consejo & Obligación)",
  "Tener que vs Hay que", "Repaso de Artículos",
  "Describir Personas", "Mi Ciudad Natal",
  "Vocabulario de Viaje", "En el Aeropuerto",
  "Check-in en el Hotel", "Restaurante Avanzado",
  "Pedir Ayuda en la Calle", "Repaso: Rol Play de Viaje",
]);

const a2_2 = titleOnly([
  "Imperfecto: Introducción", "Imperfecto vs Pretérito Indefinido",
  "Narración del Pasado", "Futuro Simple",
  "Futuro: Predicciones", "Conectores Discursivos",
  "Filler Words: bueno, pues, este, vale", "Conversación Natural",
  "Profesiones Avanzadas", "Entrevista de Trabajo Básica",
  "Vocabulario del Lugar de Trabajo", "Escribir Correos Formales",
  "Describir Tu Trabajo", "Small Talk Hispano",
  "Hablar de Experiencias", "Repaso",
]);

const a2_3 = titleOnly([
  "Estar + Gerundio (Continuo)", "Pretérito vs Imperfecto vs Continuo",
  "Mientras / Cuando / Al + Infinitivo", "Cláusulas Relativas (que, quien)",
  "Adverbios de Modo", "Así que / Porque / Sin embargo",
  "Expresar Opiniones", "Estar de Acuerdo / En Desacuerdo",
  "Estructura de un Relato", "Reseñar Libros y Películas",
  "Salud y Enfermedad", "En el Médico",
  "Deportes y Fitness", "Música y Artes",
  "Vocabulario Tecnológico", "Repaso & Debate de Opinión",
]);

const a2_4 = titleOnly([
  "Soler — Hábitos Habituales", "Antes vs Ahora",
  "Pronombres Reflexivos Avanzados", "Tampoco / También",
  "Demasiado / Suficiente", "Cuantificadores: Algunos, Pocos",
  "Pronombres Indefinidos: Alguien, Nadie", "Expresar Preferencias",
  "Hacer Sugerencias", "Ofrecer y Aceptar Ayuda",
  "Dar Instrucciones", "Describir Procesos",
  "Festivales: Día de Muertos, La Tomatina", "Cultura Gastronómica Hispana",
  "Cultura Indonesia vs Hispana", "Repaso & Intercambio Cultural",
]);

// ============ B1 — 5 sublevels, preview-locked ============
const b1_1 = titleOnly([
  "Pretérito Pluscuamperfecto", "Estilo Indirecto: Afirmaciones",
  "Estilo Indirecto: Preguntas", "Voz Pasiva: Presente y Pasado",
  "Marcadores Discursivos: en plan, o sea, fíjate", "Conversación Natural Avanzada",
  "Verbos con Preposición: Pensar en, Soñar con", "Frases Idiomáticas: Tiempo y Dinero",
  "Registro Formal vs Informal", "Escribir Reseñas",
  "Descripción Avanzada", "Diferencias Culturales Hispanas",
  "Hablar de Películas y Libros", "Cine de Almodóvar",
  "Discusión Literaria Ligera", "Repaso",
]);

const b1_2 = titleOnly([
  "Modo Subjuntivo — Introducción", "Subjuntivo: Deseos & Emociones",
  "Subjuntivo: Duda & Negación", "Espero que / Quiero que",
  "Conectores: Aunque, A pesar de, Sin embargo", "Vocabulario de Noticias",
  "Discusión Política Ligera", "Temas Globales",
  "Debate Ambiental", "Impacto de la Tecnología",
  "Discurso en Redes Sociales", "Discusiones de Carrera",
  "Habilidades de Entrevista", "Negociación Básica",
  "Presentar Ideas", "Repaso",
]);

const b1_3 = titleOnly([
  "Subjuntivo Avanzado: Presente", "Cuando + Subjuntivo (Futuro)",
  "Para que + Subjuntivo", "Subjuntivo en Cláusulas Relativas",
  "Conectores Avanzados", "Expresar Certeza & Duda",
  "Escritura Académica Básica", "Estructura de un Ensayo",
  "Discusión Literaria: García Márquez", "Arte y Cultura Hispana",
  "Temas Históricos", "Ciencia y Descubrimiento",
  "Filosofía Light", "Español para Negocios Básico",
  "Reuniones y Decisiones", "Repaso",
]);

const b1_4 = titleOnly([
  "Verbos: Infinitivo vs Gerundio vs Subjuntivo", "Verbos con Preposición Avanzados",
  "Adjetivos Compuestos", "Diminutivos & Aumentativos",
  "Énfasis con Lo Que / Lo Cual", "Estructuras Enfáticas",
  "Escritura de Viajes", "Blogs y Redes Sociales",
  "Hablar en Público — Básico", "Etiqueta de Debate",
  "Ensayos Personales", "Descripción Creativa",
  "Análisis de Cine y TV", "Música y Poesía Hispana",
  "Etiqueta Global Hispana", "Repaso",
]);

const b1_5 = titleOnly([
  "Estilo Indirecto Avanzado", "Ojalá + Subjuntivo",
  "Situaciones Hipotéticas", "Tiempos Mixtos",
  "Voz Pasiva Avanzada", "Causativos: Hacer Que / Mandar",
  "Festivales Mayores: Inti Raymi, Día de Muertos", "Fallas de Valencia, Carnaval",
  "Vocabulario para Resolver Problemas", "Toma de Decisiones",
  "Gestión de Crisis", "Liderazgo Básico",
  "Comunicación de Equipo", "Feedback y Crítica",
  "Gestión del Tiempo", "Repaso & Simulación de Negocios",
]);

// ============ B2 — 7 sublevels, preview-locked ============
const b2_1 = titleOnly([
  "Subjuntivo: Imperfecto", "Pluscuamperfecto de Subjuntivo",
  "Condicional Simple", "Condicional Compuesto",
  "Oraciones Condicionales: Si Tipos 1, 2, 3", "Estructuras de Énfasis",
  "Colocaciones Idiomáticas", "Expresiones Idiomáticas",
  "Metáfora & Símil", "Tono & Registro",
  "Técnicas de Debate", "Escritura Persuasiva",
  "Correspondencia Formal", "Presentaciones Académicas",
  "Análisis Crítico", "Repaso",
]);

const b2_2 = titleOnly([
  "Comunicación Empresarial", "Redacción de Informes",
  "Vocabulario de Gestión de Proyectos", "Lenguaje de Liderazgo",
  "Español Financiero", "Vocabulario de Marketing",
  "RR.HH. & Reclutamiento", "Conceptos Legales Básicos",
  "Industria Tech & IT", "Relaciones con Clientes",
  "Etiqueta de Negocios Internacional", "Comunicación Intercultural",
  "Hacer Presentaciones", "Dirigir Reuniones",
  "Propuestas Escritas", "Repaso",
]);

const b2_3 = titleOnly([
  "Fluidez Idiomática", "Matices Culturales",
  "Humor & Sarcasmo", "Argot & Coloquialismos",
  "Variantes Regionales: España vs Latam", "Estrategias de Escucha Avanzada",
  "Comprensión del Habla Rápida", "Acentos: Ibérico, Mexicano, Rioplatense",
  "Discurso Académico", "Análisis de Periodismo",
  "Literatura: Borges, Neruda, Cortázar", "Hablar en Público Avanzado",
  "Maestría Narrativa", "Debate & Argumentación",
  "Marca Personal en Español", "Repaso",
]);

const b2_4 = titleOnly([
  "Análisis Literario: Cervantes & Don Quijote", "El Boom Latinoamericano",
  "García Márquez & Realismo Mágico", "Cine Español: Almodóvar, Buñuel",
  "Cine Mexicano: Cuarón, Del Toro, Iñárritu", "Cine Argentino & Sudamericano",
  "Música: Flamenco a Reggaeton", "Tango Argentino: Letras y Cultura",
  "Pintura: Goya, Velázquez, Frida Kahlo", "Arquitectura: Gaudí & Más",
  "Poesía: Lorca, Mistral, Paz", "Teatro: Lope de Vega",
  "Periodismo & Crónica", "Análisis de Series Hispanas",
  "Crítica de Cine", "Repaso",
]);

const b2_5 = titleOnly([
  "Filler Words Nativos: tío, tía, en plan", "Hedging & Suavizar Opiniones",
  "Estrategias de Debate Nativo", "Técnicas Persuasivas Avanzadas",
  "Lenguaje Diplomático", "Resolución de Conflictos Interculturales",
  "Redacción de Políticas", "Asuntos Gubernamentales",
  "Hablar en Público para Líderes", "Estilo TED Talk en Español",
  "Discurso Motivacional", "Presencia Ejecutiva",
  "Comunicación de Crisis", "Entrevistas con Medios",
  "Conferencias de Prensa", "Repaso",
]);

const b2_6 = titleOnly([
  "Variantes Regionales — España (Castellano)", "Andalucía & Canarias",
  "México: Vocabulario & Modismos", "Argentina: Voseo & Lunfardo",
  "Colombia, Venezuela, Caribe", "Chile, Perú, Bolivia",
  "Centroamérica: Guatemala a Panamá", "Español de EE.UU. & Spanglish",
  "Diferencias de Vocabulario por País", "Pronunciación: Ceceo vs Seseo",
  "Argot Juvenil Hispano", "Modismos Específicos por Región",
  "Comprender Acentos Diversos", "Adaptarse al Contexto Regional",
  "Cultura por Región", "Repaso",
]);

const b2_7 = titleOnly([
  "Spanish Mastery: Registro Formal Avanzado", "Pragmática: Implicaturas & Cortesía",
  "Maestría de Discurso Académico", "Análisis Literario Profundo",
  "Debate Avanzado: Estructura & Refutación", "Escritura Creativa: Cuento",
  "Español para Profesionales — Salud", "Español para Profesionales — Tech",
  "Español para Profesionales — Diplomacia", "Comunicación Cross-Cultural Maestra",
  "Traducción Avanzada Español-Indonesia", "Interpretación Consecutiva",
  "Capstone: Ensayo Largo en Español", "Capstone: Presentación Profesional 15 min",
  "Capstone: Mesa Redonda Hispana", "Examen Final & Certificación Linguo",
]);

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("spanish")!,
  overview: "Program 304 sesi yang mengantar kamu dari benar-benar nol sampai percakapan near-native dalam bahasa Spanyol. Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Setiap level CEFR-aligned dengan penekanan pada SER vs ESTAR, modo subjuntivo (milestone B1), dan variasi regional dari Spanyol hingga Amerika Latin.",
  levels: [
    {
      code: "A1", name: "Fundamentos del Español",
      description: "Fondasi bahasa Spanyol: alfabet dengan ñ, vokal murni, SER vs ESTAR, tú vs usted, dan struktur kalimat dasar.",
      sublevels: [
        { code: "A1.1", name: "Primeros Pasos",      sessions: a1_1, preview: true },
        { code: "A1.2", name: "Vida Cotidiana",      sessions: a1_2, preview: true },
        { code: "A1.3", name: "Mi Mundo Hispano",    sessions: a1_3, preview: true },
      ],
    },
    {
      code: "A2", name: "Pre-Intermedio",
      description: "Bercerita masa lalu (pretérito vs imperfecto), kuliner & traveling lintas dunia hispanik, mulai filler words natural (bueno, pues, vale).",
      sublevels: [
        { code: "A2.1", name: "Más Allá de lo Básico",   sessions: a2_1, preview: false },
        { code: "A2.2", name: "Trabajo & Conversación",  sessions: a2_2, preview: false },
        { code: "A2.3", name: "Expresión Personal",      sessions: a2_3, preview: false },
        { code: "A2.4", name: "Fundamentos Culturales",  sessions: a2_4, preview: false },
      ],
    },
    {
      code: "B1", name: "Intermedio",
      description: "Modo subjuntivo (milestone besar Spanyol), discourse markers seperti penutur asli, diskusi sosial-budaya hispanik.",
      sublevels: [
        { code: "B1.1", name: "Fluidez Conversacional", sessions: b1_1, preview: false },
        { code: "B1.2", name: "Subjuntivo & Sociedad",  sessions: b1_2, preview: false },
        { code: "B1.3", name: "Temas Complejos",        sessions: b1_3, preview: false },
        { code: "B1.4", name: "Expresión Creativa",     sessions: b1_4, preview: false },
        { code: "B1.5", name: "Puente Profesional",     sessions: b1_5, preview: false },
      ],
    },
    {
      code: "B2", name: "Intermedio Alto",
      description: "Subjuntivo lanjutan, debat & argumentasi, sastra (Cervantes, García Márquez), sinema (Almodóvar, Cuarón), variasi regional España-Latam.",
      sublevels: [
        { code: "B2.1", name: "Expresión Avanzada",          sessions: b2_1, preview: false },
        { code: "B2.2", name: "Español Profesional",         sessions: b2_2, preview: false },
        { code: "B2.3", name: "Comunicación Cuasi-Nativa",   sessions: b2_3, preview: false },
        { code: "B2.4", name: "Arte, Cine & Literatura",     sessions: b2_4, preview: false },
        { code: "B2.5", name: "Liderazgo & Diplomacia",      sessions: b2_5, preview: false },
        { code: "B2.6", name: "Variantes Regionales",        sessions: b2_6, preview: false },
        { code: "B2.7", name: "Spanish Mastery (Capstone)",  sessions: b2_7, preview: false },
      ],
    },
  ],
};

export default curriculum;
