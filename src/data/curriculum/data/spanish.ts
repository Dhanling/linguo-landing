import type { LanguageCurriculum, SessionPreview } from "../types";
import { getLanguageBySlug } from "../languages";

// Compact format: [sessionNumber, title, topics?]
type Raw = [number, string, string[]?];

// Helper for A1 sublevels (preview: TRUE) — sessions with topics array
const toSessions = (rows: Raw[]): SessionPreview[] =>
  rows.map(([number, title, topics]) => ({
    number,
    title,
    topics: topics ?? [],
  }));

// Helper for A2/B1/B2 sublevels (preview: FALSE) — title only
const titleOnly = (count: number, prefix: string): SessionPreview[] =>
  Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    title: `${prefix} — Sesi ${i + 1}`,
  }));

const meta = getLanguageBySlug("spanish")!;

const curriculum: LanguageCurriculum = {
  meta,
  levels: [
    {
      code: "A1",
      title: "A1 — Principiante (Pemula)",
      description:
        "Fondasi bahasa Spanyol: alfabet dengan ñ dan tildes, pelafalan vokal murni khas Spanyol, sapaan, perkenalan diri, angka, dan struktur kalimat dasar. Cocok untuk yang belum pernah belajar Spanyol sama sekali.",
      sublevels: [
        {
          code: "A1.1",
          title: "Fundamentos del Español (Fondasi Bahasa Spanyol)",
          preview: true,
          sessions: toSessions([
            [1, "Bienvenida & Alfabeto Español (Selamat Datang & Alfabet Spanyol)", [
              "Pengenalan bahasa Spanyol: 500+ juta penutur di 20+ negara",
              "Alfabet Spanyol: 27 huruf termasuk ñ",
              "Huruf khusus: ñ, ll, rr, ch — sejarah & pelafalan",
              "Tildes (´) & fungsinya: tekanan kata (acento)",
            ]],
            [2, "Pronunciación: Vocales Puras (Pelafalan: Vokal Murni)", [
              "Lima vokal murni: a, e, i, o, u — konsisten beda dari Inggris",
              "Latihan minimal pairs: pero/perro, casa/caza",
              "Diftong: ai, ei, oi, au, eu, ou",
              "Aturan penekanan kata (sílaba tónica)",
            ]],
            [3, "Saludos y Despedidas (Sapaan & Perpisahan)", [
              "Hola, buenos días, buenas tardes, buenas noches",
              "Adiós, hasta luego, hasta mañana, chao",
              "¿Cómo estás? vs ¿Cómo está usted? — tú vs usted",
              "Respons: bien, mal, regular, muy bien, así así",
            ]],
            [4, "Presentaciones Personales (Perkenalan Diri)", [
              "Me llamo... / Soy... / Mi nombre es...",
              "¿Cómo te llamas? / ¿Cuál es tu nombre?",
              "Mucho gusto, encantado/encantada",
              "Asal negara: soy de Indonesia, soy indonesio/indonesia",
            ]],
            [5, "Pronombres Personales (Kata Ganti Orang)", [
              "Yo, tú, él, ella, usted",
              "Nosotros/nosotras, vosotros/vosotras, ellos/ellas, ustedes",
              "Perbedaan vosotros (Spanyol) vs ustedes (Latin Amerika)",
              "Kapan pakai usted: situasi formal, orang tua, profesional",
            ]],
            [6, "Verbo SER: Identidad (Kata Kerja SER: Identitas)", [
              "Konjugasi SER: soy, eres, es, somos, sois, son",
              "Penggunaan: nama, profesi, asal, sifat permanen",
              "Yo soy estudiante / Ella es profesora",
              "Negasi: No soy... / No es...",
            ]],
            [7, "Verbo ESTAR: Estado y Lugar (Kata Kerja ESTAR: Kondisi & Tempat)", [
              "Konjugasi ESTAR: estoy, estás, está, estamos, estáis, están",
              "Penggunaan: lokasi, kondisi sementara, perasaan",
              "Estoy cansado / Estamos en Yakarta",
              "SER vs ESTAR: pengantar perbedaan kunci",
            ]],
            [8, "Números 0–30 (Angka 0–30)", [
              "Cero, uno, dos, tres... hingga treinta",
              "Pola unik 16-19: dieciséis, diecisiete...",
              "21-29: veintiuno, veintidós... (digabung)",
              "Latihan: nomor telepon, usia, jam dasar",
            ]],
            [9, "Artículos y Género (Artikel & Gender Kata Benda)", [
              "Artikel definit: el, la, los, las",
              "Artikel indefinit: un, una, unos, unas",
              "Aturan gender: -o (maskulin), -a (feminin)",
              "Pengecualian umum: el problema, la mano, el día",
            ]],
            [10, "Sustantivos: Plural (Kata Benda: Bentuk Jamak)", [
              "Aturan +s (akhiran vokal): libro → libros",
              "Aturan +es (akhiran konsonan): ciudad → ciudades",
              "Perubahan -z → -ces: lápiz → lápices",
              "Artikel & adjektiva mengikuti jumlah",
            ]],
            [11, "Adjetivos Descriptivos (Kata Sifat Deskriptif)", [
              "Posisi adjektiva: setelah kata benda (casa grande)",
              "Concordancia: gender & jumlah harus cocok",
              "Sifat fisik: alto, bajo, joven, viejo, guapo",
              "Sifat karakter: simpático, amable, divertido",
            ]],
            [12, "Países y Nacionalidades (Negara & Kebangsaan)", [
              "España, México, Argentina, Colombia, Perú...",
              "Adjektiva kebangsaan: español/española, mexicano/mexicana",
              "20 negara berbahasa Spanyol — peta dunia hispanohablante",
              "¿De dónde eres? — practice negara & nationality",
            ]],
            [13, "La Familia (Keluarga)", [
              "Padre, madre, hermano, hermana, hijo, hija",
              "Abuelo, abuela, tío, tía, primo, prima",
              "Possesif: mi, tu, su, nuestro, vuestro",
              "Tengo dos hermanos / Mi madre se llama...",
            ]],
            [14, "Números 31–100 (Angka 31–100)", [
              "Treinta y uno, cuarenta, cincuenta... cien",
              "Pola dengan 'y': cuarenta y cinco, sesenta y ocho",
              "Cien vs ciento: kapan pakai yang mana",
              "Aplikasi: usia, harga sederhana, tahun lahir",
            ]],
            [15, "Preguntas Básicas (Pertanyaan Dasar)", [
              "Qué, quién, dónde, cuándo, cómo, por qué, cuánto",
              "Tanda tanya ganda: ¿...? — khas Spanyol",
              "¿Qué es esto? / ¿Quién es ella? / ¿Dónde está?",
              "Intonasi pertanyaan tanpa kata tanya",
            ]],
            [16, "Repaso & Diálogo Cultural (Review & Dialog Budaya)", [
              "Review komprehensif sesi 1-15",
              "Dialog: bertemu orang Spanyol/Latino di Indonesia",
              "Cultural anchor: budaya saludo (cipika-cipiki di Spanyol)",
              "Self-assessment & persiapan A1.2",
            ]],
          ]),
        },
        {
          code: "A1.2",
          title: "Vida Cotidiana (Kehidupan Sehari-hari)",
          preview: true,
          sessions: toSessions([
            [1, "Días, Meses, Estaciones (Hari, Bulan, Musim)", [
              "Lunes, martes, miércoles... domingo (lowercase!)",
              "Enero, febrero... diciembre",
              "Cuatro estaciones: primavera, verano, otoño, invierno",
              "¿Qué día es hoy? / ¿En qué mes naciste?",
            ]],
            [2, "La Hora (Waktu/Jam)", [
              "¿Qué hora es? — Es la una / Son las dos",
              "Y media, y cuarto, menos cuarto",
              "De la mañana, de la tarde, de la noche",
              "Janji temu: ¿A qué hora? / Nos vemos a las...",
            ]],
            [3, "Verbos Regulares -AR (Kata Kerja Beraturan -AR)", [
              "Pola konjugasi -AR: hablar, estudiar, trabajar",
              "Akhiran: -o, -as, -a, -amos, -áis, -an",
              "Verba sehari-hari: cantar, bailar, escuchar, mirar",
              "Latihan kalimat: Yo estudio español todos los días",
            ]],
            [4, "Verbos Regulares -ER, -IR (Kata Kerja Beraturan -ER, -IR)", [
              "Pola -ER: comer, beber, leer, aprender",
              "Pola -IR: vivir, escribir, abrir, recibir",
              "Akhiran -ER: -o, -es, -e, -emos, -éis, -en",
              "Akhiran -IR: -o, -es, -e, -imos, -ís, -en",
            ]],
            [5, "Profesiones (Profesi)", [
              "Profesor, médico, ingeniero, abogado, enfermera",
              "Gender: el doctor / la doctora",
              "¿En qué trabajas? / ¿A qué te dedicas?",
              "Trabajo en... / Soy + profesión (tanpa artikel)",
            ]],
            [6, "Comida Básica & Tapas (Makanan Dasar & Tapas)", [
              "Pan, queso, jamón, aceitunas, tortilla española",
              "Tapas: budaya makan kecil khas Spanyol",
              "Bebidas: agua, café, vino, sangría, horchata",
              "En el restaurante: ¿Qué quieres comer?",
            ]],
            [7, "Pedir en un Restaurante (Memesan di Restoran)", [
              "Quisiera... / Me gustaría... / Para mí...",
              "La carta, por favor / La cuenta, por favor",
              "¿Qué recomienda? / ¿Tienen menú del día?",
              "Etiket: propina (tip) di Spanyol vs Latin Amerika",
            ]],
            [8, "Verbo TENER (Kata Kerja TENER/Memiliki)", [
              "Konjugasi: tengo, tienes, tiene, tenemos, tenéis, tienen",
              "Tener + edad: Tengo 25 años (BUKAN 'soy 25')",
              "Tener hambre, sed, sueño, calor, frío, miedo",
              "Tener que + infinitivo: keharusan",
            ]],
            [9, "Verbo IR & Lugares (Kata Kerja IR & Tempat)", [
              "Konjugasi IR: voy, vas, va, vamos, vais, van",
              "Ir a + tempat: Voy al supermercado",
              "Kontraksi: a + el = al, de + el = del",
              "Tempat umum: parque, escuela, oficina, tienda",
            ]],
            [10, "Futuro con IR A (Future Tense dengan IR A)", [
              "Struktur: ir + a + infinitivo",
              "Voy a estudiar mañana / Vamos a viajar",
              "Ekspresi waktu masa depan: mañana, la próxima semana",
              "Latihan: rencana akhir pekan",
            ]],
            [11, "Adjetivos Posesivos (Kata Sifat Possesif)", [
              "Mi/mis, tu/tus, su/sus",
              "Nuestro/nuestra/nuestros/nuestras",
              "Penggunaan: Mi familia, tus libros, nuestra casa",
              "Su = his/her/their/your formal — ambiguitas",
            ]],
            [12, "Demostrativos: Este, Ese, Aquel (Demonstratif)", [
              "Este/esta (dekat) — esto",
              "Ese/esa (sedang jauh) — eso",
              "Aquel/aquella (jauh) — aquello",
              "Bentuk jamak & netral",
            ]],
            [13, "El Cuerpo & La Salud (Tubuh & Kesehatan)", [
              "Cabeza, ojos, boca, nariz, oídos, manos, pies",
              "Me duele... / Tengo dolor de...",
              "En la farmacia / en el médico",
              "Estoy enfermo vs Soy enfermo (jebakan SER/ESTAR)",
            ]],
            [14, "La Ropa (Pakaian)", [
              "Camisa, pantalón, falda, zapatos, sombrero",
              "Llevar (mengenakan) vs ponerse (memakai)",
              "Colores: rojo, azul, verde, amarillo, negro, blanco",
              "De compras: ¿Cuánto cuesta? / ¿Tiene en otra talla?",
            ]],
            [15, "Verbos con Cambio de Raíz (Stem-Changing Verbs)", [
              "e → ie: querer, preferir, pensar",
              "o → ue: poder, dormir, volver",
              "e → i: pedir, servir, repetir",
              "Pola: berubah di semua bentuk kecuali nosotros/vosotros",
            ]],
            [16, "Repaso & Mini-Diálogos (Review & Dialog Mini)", [
              "Review semua materi A1.2",
              "Roleplay: di restoran, toko baju, apotek",
              "Cultural: jam makan di Spanyol vs Latam vs Indonesia",
              "Persiapan A1.3 — ekspansi vokabuler",
            ]],
          ]),
        },
        {
          code: "A1.3",
          title: "Mi Mundo (Duniaku)",
          preview: true,
          sessions: toSessions([
            [1, "Mi Casa (Rumahku)", [
              "Habitaciones: sala, cocina, dormitorio, baño, comedor",
              "Muebles: mesa, silla, sofá, cama, armario",
              "Hay (ada) — invariable: Hay una mesa / Hay tres sillas",
              "Preposisi tempat: en, sobre, debajo, al lado de",
            ]],
            [2, "La Ciudad (Kota)", [
              "Calle, avenida, plaza, esquina, semáforo",
              "Edificios: banco, hospital, iglesia, museo, biblioteca",
              "Direcciones: a la derecha, a la izquierda, todo recto",
              "¿Cómo llego a...? / ¿Dónde está...?",
            ]],
            [3, "Transporte (Transportasi)", [
              "Coche, autobús, metro, tren, taxi, bicicleta, avión",
              "Ir en + transporte (BUKAN ir con)",
              "Comprar billetes: ida, vuelta, ida y vuelta",
              "En la estación: andén, vía, retraso",
            ]],
            [4, "El Tiempo Atmosférico (Cuaca)", [
              "Hace sol, hace frío, hace calor, hace viento",
              "Llueve, nieva, está nublado",
              "¿Qué tiempo hace? / ¿Cómo está el clima?",
              "Estaciones di Spanyol vs Indonesia (tropis)",
            ]],
            [5, "Hobbies y Tiempo Libre (Hobi & Waktu Luang)", [
              "Me gusta + infinitivo: Me gusta leer",
              "Me gusta(n) + sustantivo: Me gusta el cine / Me gustan los libros",
              "A mí también, a mí tampoco — agreement",
              "Hobbies: deportes, música, lectura, viajar, cocinar",
            ]],
            [6, "Deportes (Olahraga)", [
              "Fútbol, baloncesto, tenis, natación, ciclismo",
              "Jugar a (sport) vs Practicar (sport)",
              "Equipos famosos: Real Madrid, Barça, Boca Juniors",
              "Cultural: La Liga, Copa Libertadores, Mundial",
            ]],
            [7, "Música y Cine Hispano (Musik & Film Hispanik)", [
              "Géneros: flamenco, salsa, reggaeton, bachata, tango",
              "Artistas: Shakira, Bad Bunny, Rosalía, Karol G",
              "Cine: Almodóvar, Del Toro, Iñárritu, Cuarón",
              "Vocab: canción, película, álbum, concierto",
            ]],
            [8, "Verbos Reflexivos (Verba Refleksif)", [
              "Pengantar reflexive pronouns: me, te, se, nos, os, se",
              "Rutina diaria: levantarse, ducharse, vestirse, acostarse",
              "Posisi pronoun: sebelum verb terkonjugasi",
              "Me levanto a las siete / Se acuesta tarde",
            ]],
            [9, "Mi Rutina Diaria (Rutinitas Harianku)", [
              "Por la mañana, por la tarde, por la noche",
              "Conectores: primero, luego, después, finalmente",
              "Frecuencia: siempre, a menudo, a veces, nunca",
              "Cerita rutinitas pribadi (5 menit speaking)",
            ]],
            [10, "Comparaciones (Perbandingan)", [
              "Más + adj + que / Menos + adj + que",
              "Tan + adj + como (sama dengan)",
              "Mejor, peor, mayor, menor — bentuk irreguler",
              "Madrid es más grande que Yakarta — practice",
            ]],
            [11, "Superlativos (Superlatif)", [
              "El/la más + adj + de: el más alto de la clase",
              "Akhiran -ísimo: grandísimo, buenísimo",
              "Comparación dengan negara/kota Spanyol-Latino",
              "Cultural: 'lo mejor de México'",
            ]],
            [12, "Cantidades & Medidas (Kuantitas & Ukuran)", [
              "Mucho, poco, bastante, demasiado",
              "Un kilo, medio kilo, un litro, una docena",
              "Numerals besar: cien, mil, un millón",
              "Mata uang: euro, peso (mexicano/argentino), sol, bolívar",
            ]],
            [13, "Imperativos Básicos (Imperatif Dasar)", [
              "Tú affirmative: habla, come, escribe (regular)",
              "Bentuk irreguler: di, ven, sal, pon, haz, ten, ve",
              "Usted: hable, coma, escriba",
              "Konteks: instruksi, resep, perintah lalu lintas",
            ]],
            [14, "Pronombres de Objeto Directo (Pronoun Objek Langsung)", [
              "Lo, la, los, las — menggantikan objek langsung",
              "Posisi: sebelum verb terkonjugasi",
              "Lo veo / La conozco / Los compramos",
              "Latihan transformasi kalimat",
            ]],
            [15, "El Pretérito Perfecto (Past Tense Perfect)", [
              "Auxiliar HABER: he, has, ha, hemos, habéis, han",
              "Participio: -ado (-ar), -ido (-er/-ir)",
              "Penggunaan: hari ini, esta semana, alguna vez",
              "He visitado España / ¿Has comido tapas?",
            ]],
            [16, "Repaso A1 Completo (Review A1 Lengkap)", [
              "Review semua A1.1, A1.2, A1.3 (48 sesi)",
              "Mini-presentation 3 menit: 'Mi vida, mi familia, mis hobbies'",
              "Cultural capstone: Día de la Hispanidad / 12 Octubre",
              "Persiapan masuk A2 — ekspektasi level intermedio",
            ]],
          ]),
        },
      ],
    },
    {
      code: "A2",
      title: "A2 — Elemental (Dasar Lanjutan)",
      description:
        "Memperluas kemampuan komunikasi sehari-hari: bercerita tentang masa lalu (pretérito vs imperfecto), berbagi pengalaman kuliner & traveling lintas dunia hispanik, dan menguasai struktur naratif dasar.",
      sublevels: [
        {
          code: "A2.1",
          title: "Rutinas y Tiempo Libre (Rutinitas & Waktu Luang)",
          preview: false,
          sessions: titleOnly(16, "Rutinas y Tiempo Libre"),
        },
        {
          code: "A2.2",
          title: "Comida y Cultura Hispana (Kuliner & Budaya Hispanik)",
          preview: false,
          sessions: titleOnly(16, "Comida y Cultura Hispana"),
        },
        {
          code: "A2.3",
          title: "Viajes y Direcciones (Perjalanan & Petunjuk Arah)",
          preview: false,
          sessions: titleOnly(16, "Viajes y Direcciones"),
        },
        {
          code: "A2.4",
          title: "Pretérito Indefinido & Imperfecto (Bentuk Lampau Naratif)",
          preview: false,
          sessions: titleOnly(16, "Pretérito Indefinido & Imperfecto"),
        },
      ],
    },
    {
      code: "B1",
      title: "B1 — Intermedio (Menengah)",
      description:
        "Mencapai kemandirian berbahasa: menguasai modo subjuntivo (milestone besar bahasa Spanyol), berdiskusi tentang isu sosial-budaya, dan memahami media berbahasa Spanyol secara umum.",
      sublevels: [
        {
          code: "B1.1",
          title: "Salud y Bienestar (Kesehatan & Kesejahteraan)",
          preview: false,
          sessions: titleOnly(16, "Salud y Bienestar"),
        },
        {
          code: "B1.2",
          title: "Trabajo y Estudios (Pekerjaan & Studi)",
          preview: false,
          sessions: titleOnly(16, "Trabajo y Estudios"),
        },
        {
          code: "B1.3",
          title: "Modo Subjuntivo: Introducción (Pengantar Modus Subjungtif)",
          preview: false,
          sessions: titleOnly(16, "Modo Subjuntivo: Introducción"),
        },
        {
          code: "B1.4",
          title: "Medios y Tecnología (Media & Teknologi)",
          preview: false,
          sessions: titleOnly(16, "Medios y Tecnología"),
        },
        {
          code: "B1.5",
          title: "Tradiciones y Festivales (Tradisi & Festival)",
          preview: false,
          sessions: titleOnly(16, "Tradiciones y Festivales"),
        },
      ],
    },
    {
      code: "B2",
      title: "B2 — Intermedio Alto (Menengah Atas)",
      description:
        "Berkomunikasi dengan kelancaran dan presisi: subjuntivo lanjutan, debate, analisis sastra & sinema hispanik, serta memahami variasi regional dari Spanyol hingga Argentina.",
      sublevels: [
        {
          code: "B2.1",
          title: "Subjuntivo Avanzado & Condicionales (Subjungtif Lanjutan & Kondisional)",
          preview: false,
          sessions: titleOnly(16, "Subjuntivo Avanzado & Condicionales"),
        },
        {
          code: "B2.2",
          title: "Mundo Profesional (Dunia Profesional)",
          preview: false,
          sessions: titleOnly(16, "Mundo Profesional"),
        },
        {
          code: "B2.3",
          title: "Sociedad y Actualidad (Masyarakat & Isu Terkini)",
          preview: false,
          sessions: titleOnly(16, "Sociedad y Actualidad"),
        },
        {
          code: "B2.4",
          title: "Arte, Cine y Literatura (Seni, Sinema & Sastra)",
          preview: false,
          sessions: titleOnly(16, "Arte, Cine y Literatura"),
        },
        {
          code: "B2.5",
          title: "Debate y Argumentación (Debat & Argumentasi)",
          preview: false,
          sessions: titleOnly(16, "Debate y Argumentación"),
        },
        {
          code: "B2.6",
          title: "Variantes Regionales (Variasi Regional Bahasa Spanyol)",
          preview: false,
          sessions: titleOnly(16, "Variantes Regionales"),
        },
        {
          code: "B2.7",
          title: "Spanish Mastery (Penguasaan Bahasa Spanyol)",
          preview: false,
          sessions: titleOnly(16, "Spanish Mastery"),
        },
      ],
    },
  ],
};

export default curriculum;
