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

const meta = getLanguageBySlug("german")!;

const curriculum: LanguageCurriculum = {
  meta,
  levels: [
    {
      code: "A1",
      title: "A1 — Anfänger (Pemula)",
      description:
        "Fondasi bahasa Jerman: alfabet dengan ä/ö/ü/ß, pelafalan konsisten ala Jerman, sapaan regional, perkenalan, dan pengantar kasus pertama (Nominativ & Akkusativ). Cocok untuk yang belum pernah belajar Jerman sama sekali.",
      sublevels: [
        {
          code: "A1.1",
          title: "Grundlagen des Deutschen (Fondasi Bahasa Jerman)",
          preview: true,
          sessions: toSessions([
            [1, "Willkommen & Deutsches Alphabet (Selamat Datang & Alfabet Jerman)", [
              "Pengenalan bahasa Jerman: 130+ juta penutur di Eropa Tengah",
              "Alfabet Jerman: 26 huruf + Umlaute (ä, ö, ü) + ß (Eszett)",
              "Pelafalan konsisten: 1 huruf = 1 bunyi (vs Inggris)",
              "Sejarah & posisi: lingua franca akademik & industri",
            ]],
            [2, "Aussprache: Umlaute & Eszett (Pelafalan: Umlaut & Eszett)", [
              "Ä: bunyi 'e' terbuka (Mädchen)",
              "Ö: bibir bulat tapi lidah depan (schön)",
              "Ü: bibir bulat, lidah lebih depan (für)",
              "ß: pelafalan seperti 's' tegas (Straße)",
            ]],
            [3, "Begrüßungen Regional (Sapaan Regional)", [
              "Hallo (umum), Guten Morgen, Guten Tag, Guten Abend",
              "Variasi regional: Servus (Bayern), Moin (Norddeutschland), Grüß Gott (Süddeutschland/Österreich)",
              "Tschüss, Auf Wiedersehen, Bis bald, Bis morgen",
              "Wie geht's? — Gut, sehr gut, schlecht, na ja",
            ]],
            [4, "Du vs Sie (Akrab vs Formal)", [
              "Du: keluarga, teman, anak, rekan dekat, sesama mahasiswa",
              "Sie: orang asing, atasan, situasi formal — selalu kapital!",
              "Konjugasi berbeda: du bist vs Sie sind",
              "Cultural: kapan transisi 'duzen' — biasanya inisiatif yang lebih senior",
            ]],
            [5, "Sich Vorstellen (Memperkenalkan Diri)", [
              "Ich heiße... / Ich bin... / Mein Name ist...",
              "Wie heißt du? / Wie heißen Sie?",
              "Freut mich / Sehr erfreut",
              "Ich komme aus Indonesien / Ich bin Indonesier(in)",
            ]],
            [6, "Verb SEIN (Kata Kerja SEIN/Menjadi)", [
              "Konjugasi: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind",
              "Penggunaan: identitas, profesi, kebangsaan, sifat",
              "Negasi: nicht (Ich bin nicht...)",
              "Verba paling penting bahasa Jerman — wajib hafal",
            ]],
            [7, "Verb HABEN (Kata Kerja HABEN/Memiliki)", [
              "Konjugasi: ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben",
              "Penggunaan: kepemilikan, usia (Ich bin 25 — bukan habe!)",
              "Haben Hunger, Durst, Angst, Zeit",
              "SEIN vs HABEN: 2 verba kunci untuk Perfekt nanti",
            ]],
            [8, "Personalpronomen (Kata Ganti Orang)", [
              "Ich, du, er, sie (dia perempuan), es (netral)",
              "Wir, ihr, sie (mereka), Sie (formal — selalu kapital)",
              "Sie ambigu: feminine + plural + formal — konteks menentukan",
              "Pronoun gender wajib mengikuti gender kata benda",
            ]],
            [9, "Drei Geschlechter: der/die/das (Tiga Gender)", [
              "Maskulin: der (der Mann, der Tisch)",
              "Feminin: die (die Frau, die Tür)",
              "Netral: das (das Kind, das Buch)",
              "Tip: hafalkan artikel BERSAMA kata benda — kunci sukses Jerman",
            ]],
            [10, "Plural Bilden (Membentuk Bentuk Jamak)", [
              "Pola plural Jerman: kompleks, ada 5 pola utama",
              "+s: das Auto → die Autos (kata serapan)",
              "+e/+er/+en/Umlaut: der Apfel → die Äpfel",
              "Artikel jamak SELALU 'die' (untuk semua gender)",
            ]],
            [11, "Zahlen 0–30 (Angka 0–30)", [
              "Null, eins, zwei, drei... dreißig",
              "Pola unik 11-12: elf, zwölf",
              "21+: einundzwanzig, zweiundzwanzig (satuan + 'und' + puluhan)",
              "Latihan: nomor telepon, usia, alamat",
            ]],
            [12, "Die Familie (Keluarga)", [
              "Vater, Mutter, Bruder, Schwester, Sohn, Tochter",
              "Großvater (Opa), Großmutter (Oma), Onkel, Tante, Cousin/e",
              "Possessiv: mein/meine, dein/deine, sein/seine, ihr/ihre",
              "Ich habe zwei Brüder / Meine Mutter heißt...",
            ]],
            [13, "Zahlen 31–100 (Angka 31–100)", [
              "Dreißig, vierzig, fünfzig, sechzig... hundert",
              "Pola: einundvierzig (1+40), zweiundsechzig (2+60)",
              "Membaca angka: dari belakang — 'dua puluh tiga' = 'tiga-dua-puluh'",
              "Aplikasi: usia, harga sederhana, tahun lahir",
            ]],
            [14, "Nominativ & Akkusativ — Erste Fälle (Kasus Pertama!)", [
              "Nominativ: subjek (yang melakukan) — der/die/das",
              "Akkusativ: objek langsung — den/die/das (hanya 'der' jadi 'den')",
              "Der Mann sieht den Hund (Pria itu melihat anjing)",
              "Pengantar konsep KASUS — *the* milestone bahasa Jerman",
            ]],
            [15, "Fragen Stellen (Mengajukan Pertanyaan)", [
              "Was, wer, wo, wann, wie, warum, wie viel/viele",
              "W-Frage: kata tanya di awal (Wo wohnst du?)",
              "Ja/Nein-Frage: verba di awal (Wohnst du in Jakarta?)",
              "Doch — jawaban 'ya' untuk pertanyaan negatif (khas Jerman)",
            ]],
            [16, "Wiederholung & Kulturdialog (Review & Dialog Budaya)", [
              "Review komprehensif sesi 1–15",
              "Dialog: bertemu orang Jerman/Austria di Indonesia",
              "Cultural anchor: Pünktlichkeit (ketepatan waktu) sebagai nilai",
              "Self-assessment & persiapan A1.2",
            ]],
          ]),
        },
        {
          code: "A1.2",
          title: "Alltag (Kehidupan Sehari-hari)",
          preview: true,
          sessions: toSessions([
            [1, "Wochentage, Monate, Jahreszeiten (Hari, Bulan, Musim)", [
              "Montag, Dienstag, Mittwoch... Sonntag",
              "Januar, Februar... Dezember (kapital!)",
              "Vier Jahreszeiten: Frühling, Sommer, Herbst, Winter",
              "Welcher Tag ist heute? / Heute ist der 25. März",
            ]],
            [2, "Die Uhrzeit (Waktu/Jam)", [
              "Wie spät ist es? — Es ist eins / Es ist zwei Uhr",
              "Halb (setengah-MINUS), Viertel vor/nach",
              "Achtung: 'halb drei' = 2:30 (BUKAN 3:30!)",
              "Sistem 24 jam (formal): 14 Uhr = 2 PM",
            ]],
            [3, "Regelmäßige Verben (Verba Beraturan)", [
              "Pola konjugasi: Stamm + Endung",
              "Akhiran: -e, -st, -t, -en, -t, -en",
              "Verba sehari-hari: lernen, arbeiten, wohnen, spielen",
              "Latihan: Ich lerne jeden Tag Deutsch",
            ]],
            [4, "Unregelmäßige Verben (Verba Tidak Beraturan)", [
              "Vokaländerung di du/er/sie/es: fahren → fährst, fährt",
              "lesen → liest, sehen → sieht, sprechen → sprichst",
              "essen → isst, nehmen → nimmst",
              "Wajib dihafal — list 30+ verba paling sering",
            ]],
            [5, "Berufe (Profesi)", [
              "Lehrer(in), Arzt/Ärztin, Ingenieur(in), Anwalt/Anwältin",
              "Gender: Lehrer (m) / Lehrerin (f)",
              "Was machst du beruflich? / Was sind Sie von Beruf?",
              "Ich bin + Beruf (TANPA artikel — beda dari Inggris)",
            ]],
            [6, "Deutsches Essen & Kultur (Makanan & Budaya Jerman)", [
              "Brot (300+ jenis!), Brötchen, Brezel",
              "Wurst: Bratwurst, Currywurst, Weißwurst",
              "Bier & Reinheitsgebot — hukum kemurnian 1516",
              "Cultural: Kaffee und Kuchen (jam 15:00 sosial)",
            ]],
            [7, "Im Restaurant (Di Restoran)", [
              "Ich hätte gern... / Ich möchte... / Für mich bitte...",
              "Die Speisekarte, bitte / Die Rechnung, bitte",
              "Was empfehlen Sie? / Was ist das Tagesgericht?",
              "Etiket: Trinkgeld (10%) — sebut total saat bayar",
            ]],
            [8, "Modalverben (Verba Modal)", [
              "können (bisa), müssen (harus), wollen (mau)",
              "dürfen (boleh), sollen (sebaiknya), mögen (suka)",
              "Pola: modal di posisi 2, infinitif di akhir kalimat",
              "Ich kann Deutsch sprechen / Ich muss heute arbeiten",
            ]],
            [9, "Trennbare Verben (Verba Terpisahkan)", [
              "Konsep: prefix terpisah dan pindah ke akhir kalimat",
              "Aufstehen: Ich stehe um 7 Uhr auf",
              "Einkaufen, anrufen, fernsehen, mitkommen",
              "Khas Jerman — perlu adaptasi pikiran",
            ]],
            [10, "Wortstellung: V2-Regel (Aturan Word Order V2)", [
              "Verba TERKONJUGASI selalu di posisi ke-2",
              "Heute lerne ich Deutsch (BUKAN Heute ich lerne)",
              "Inversi subjek-verba kalau bukan subjek di awal",
              "Dasar fondasi sintaks Jerman",
            ]],
            [11, "Possessivartikel (Artikel Possesif)", [
              "Mein/meine/mein, dein/deine/dein, sein/seine/sein",
              "Unser/unsere, euer/eure, ihr/ihre, Ihr/Ihre",
              "Aturan: berperilaku seperti ein/eine — berubah dengan kasus",
              "Mein Vater (Nom) → meinen Vater (Akk)",
            ]],
            [12, "Demonstrativa: dieser, jener (Demonstratif)", [
              "Dieser/diese/dieses (yang ini)",
              "Jener/jene/jenes (yang itu — agak literer)",
              "Lebih sering: der/die/das + tekanan",
              "Penggunaan: spesifikasi, kontras",
            ]],
            [13, "Körper & Gesundheit (Tubuh & Kesehatan)", [
              "Kopf, Augen, Mund, Nase, Ohren, Hände, Füße",
              "Mir tut der Kopf weh / Ich habe Kopfschmerzen",
              "Beim Arzt / In der Apotheke",
              "Krankenversicherung — sistem kesehatan Jerman (cultural)",
            ]],
            [14, "Kleidung (Pakaian)", [
              "Hemd, Hose, Rock, Schuhe, Hut, Mantel",
              "Tragen (mengenakan) vs anziehen (memakai)",
              "Farben: rot, blau, grün, gelb, schwarz, weiß",
              "Beim Einkaufen: Wie viel kostet das? / Welche Größe?",
            ]],
            [15, "Komposita (Kata Majemuk Jerman)", [
              "Khas Jerman: gabungkan kata jadi kata baru",
              "Haus + Tür = Haustür / Auto + Bahn = Autobahn",
              "Kata terkenal: Donaudampfschifffahrtsgesellschaftskapitän",
              "Gender mengikuti kata terakhir",
            ]],
            [16, "Wiederholung & Mini-Dialoge (Review & Dialog Mini)", [
              "Review semua materi A1.2",
              "Roleplay: di Café, Supermarkt, Apotheke",
              "Cultural: Sonntagsruhe (toko tutup hari Minggu)",
              "Persiapan A1.3 — modal verbs & kasus lanjutan",
            ]],
          ]),
        },
        {
          code: "A1.3",
          title: "Meine Welt (Duniaku)",
          preview: true,
          sessions: toSessions([
            [1, "Mein Zuhause (Rumahku)", [
              "Zimmer: Wohnzimmer, Küche, Schlafzimmer, Badezimmer, Esszimmer",
              "Möbel: Tisch, Stuhl, Sofa, Bett, Schrank",
              "Es gibt + Akkusativ: Es gibt einen Tisch",
              "Wechselpräpositionen pengantar: in, auf, unter, neben",
            ]],
            [2, "Die Stadt (Kota)", [
              "Straße, Allee, Platz, Ecke, Ampel",
              "Gebäude: Bank, Krankenhaus, Kirche, Museum, Bibliothek",
              "Wegbeschreibung: rechts, links, geradeaus",
              "Wie komme ich zu...? / Wo ist...?",
            ]],
            [3, "Verkehr (Transportasi)", [
              "Auto, Bus, U-Bahn, Zug, Taxi, Fahrrad, Flugzeug",
              "Mit dem Bus, zu Fuß, mit dem Fahrrad (Dativ!)",
              "Fahrkarte kaufen: Hin, Rückfahrt, Hin- und Rückfahrt",
              "Am Bahnhof: Gleis, Bahnsteig, Verspätung, ICE",
            ]],
            [4, "Das Wetter (Cuaca)", [
              "Es ist sonnig, kalt, warm, windig",
              "Es regnet, es schneit, es ist neblig",
              "Wie ist das Wetter? / Wie wird das Wetter morgen?",
              "Jahreszeiten di Jerman vs tropis Indonesia",
            ]],
            [5, "Hobbys & Freizeit (Hobi & Waktu Luang)", [
              "Ich mag + Akkusativ: Ich mag Lesen / Ich mag das Kino",
              "Gern + verb: Ich lese gern / Ich spiele gern Fußball",
              "Lieber, am liebsten — comparison preference",
              "Hobbys: Sport, Musik, Lesen, Reisen, Kochen",
            ]],
            [6, "Sport (Olahraga)", [
              "Fußball, Basketball, Tennis, Schwimmen, Radfahren",
              "Spielen (sport ball) vs machen (lain)",
              "Vereine & events: Bundesliga, Bayern München, Borussia",
              "Cultural: Vereinskultur — klub olahraga sebagai komunitas",
            ]],
            [7, "Deutsche Musik & Kino (Musik & Film Jerman)", [
              "Künstler: Rammstein, Kraftwerk, Nena, Helene Fischer",
              "Regisseure: Wenders, Fassbinder, Herzog, Tom Tykwer",
              "Genre: Schlager, Krautrock, Neue Deutsche Welle",
              "Vocab: Lied, Film, Album, Konzert",
            ]],
            [8, "Reflexive Verben (Verba Refleksif)", [
              "Reflexivpronomen: mich, dich, sich, uns, euch, sich",
              "Akkusativ vs Dativ reflexive: sich waschen vs sich die Hände waschen",
              "Routine: sich anziehen, sich ausziehen, sich erinnern",
              "Ich ziehe mich um / Er erinnert sich daran",
            ]],
            [9, "Tagesablauf (Rutinitas Harian)", [
              "Am Morgen, am Nachmittag, am Abend",
              "Konnektoren: zuerst, dann, danach, schließlich",
              "Häufigkeit: immer, oft, manchmal, nie",
              "Cerita rutinitas pribadi (5 menit speaking)",
            ]],
            [10, "Vergleiche (Perbandingan)", [
              "Komparativ: -er + als (größer als, kleiner als)",
              "Umlaut di komparativ: alt → älter, jung → jünger",
              "So + adj + wie (sama dengan)",
              "Berlin ist größer als Jakarta — practice",
            ]],
            [11, "Superlativ (Superlatif)", [
              "Am + adj + -sten: am größten, am schönsten",
              "Der/die/das + adj + -ste: der größte Mann",
              "Bentuk irreguler: gut → besser → am besten",
              "Cultural: 'Das beste Bier Bayerns'",
            ]],
            [12, "Mengen & Maße (Kuantitas & Ukuran)", [
              "Viel, wenig, genug, zu viel",
              "Ein Kilo, ein halbes Kilo, ein Liter, ein Dutzend",
              "Numerals besar: hundert, tausend, eine Million",
              "Mata uang: Euro (€) — Eurozone & DACH (Deutschland-Austria-CH)",
            ]],
            [13, "Imperativ (Imperatif)", [
              "Du-Form: Komm! Iss! Lies! Sprich!",
              "Sie-Form: Kommen Sie! Essen Sie! Lesen Sie!",
              "Ihr-Form (jamak informal): Kommt! Esst!",
              "Konteks: instruksi, resep, perintah lalu lintas",
            ]],
            [14, "Dativ — Der Dritte Fall (Kasus Ke-3)", [
              "Dativ: objek tidak langsung — dem/der/dem",
              "Trigger: mit, von, zu, bei, nach, aus, seit, gegenüber",
              "Ich helfe dem Mann / Ich gebe der Frau das Buch",
              "Pengantar — kasus ke-3 dari 4 kasus Jerman",
            ]],
            [15, "Das Perfekt (Past Tense Perfekt)", [
              "Hilfsverb HABEN/SEIN + Partizip II",
              "Partizip II: ge- + Stamm + -t/-en (gemacht, gegangen)",
              "SEIN dipakai untuk: pergerakan + perubahan kondisi",
              "Ich habe gegessen / Ich bin gegangen",
            ]],
            [16, "A1-Komplettwiederholung (Review A1 Lengkap)", [
              "Review semua A1.1, A1.2, A1.3 (48 sesi)",
              "Mini-Präsentation 3 menit: 'Mein Leben, meine Familie, meine Hobbys'",
              "Cultural capstone: Tag der Deutschen Einheit (3 Oktober)",
              "Persiapan masuk A2 — Dativ & Perfekt mendalam",
            ]],
          ]),
        },
      ],
    },
    {
      code: "A2",
      title: "A2 — Grundlegend (Dasar Lanjutan)",
      description:
        "Memperluas kemampuan komunikasi: menguasai Dativ secara penuh dan Perfekt untuk bercerita masa lalu, memperdalam budaya kuliner Jerman (Brot, Wurst, Bier), dan menggunakan filler words dasar (also, naja, halt) agar percakapan natural.",
      sublevels: [
        {
          code: "A2.1",
          title: "Tagesroutine & Freizeit (Rutinitas & Waktu Luang)",
          preview: false,
          sessions: titleOnly(16, "Tagesroutine & Freizeit"),
        },
        {
          code: "A2.2",
          title: "Essen & deutsche Kultur (Kuliner & Budaya Jerman)",
          preview: false,
          sessions: titleOnly(16, "Essen & deutsche Kultur"),
        },
        {
          code: "A2.3",
          title: "Reisen & Verkehr (Perjalanan & Transportasi)",
          preview: false,
          sessions: titleOnly(16, "Reisen & Verkehr"),
        },
        {
          code: "A2.4",
          title: "Dativ & Perfekt (Kasus Dativ & Past Perfect)",
          preview: false,
          sessions: titleOnly(16, "Dativ & Perfekt"),
        },
      ],
    },
    {
      code: "B1",
      title: "B1 — Mittelstufe (Menengah)",
      description:
        "Mencapai kemandirian berbahasa: menguasai Genitiv (kasus ke-4) dan Präteritum, mendiskusikan studi & karir di Jerman, serta menggunakan discourse markers (eigentlich, sozusagen, irgendwie) seperti penutur asli.",
      sublevels: [
        {
          code: "B1.1",
          title: "Gesundheit & Wohlbefinden (Kesehatan & Kesejahteraan)",
          preview: false,
          sessions: titleOnly(16, "Gesundheit & Wohlbefinden"),
        },
        {
          code: "B1.2",
          title: "Arbeit & Studium (Pekerjaan & Studi di Jerman)",
          preview: false,
          sessions: titleOnly(16, "Arbeit & Studium"),
        },
        {
          code: "B1.3",
          title: "Genitiv & Präteritum (Kasus Genitiv & Simple Past)",
          preview: false,
          sessions: titleOnly(16, "Genitiv & Präteritum"),
        },
        {
          code: "B1.4",
          title: "Medien & Technologie (Media & Teknologi)",
          preview: false,
          sessions: titleOnly(16, "Medien & Technologie"),
        },
        {
          code: "B1.5",
          title: "Traditionen & Feste (Tradisi & Festival)",
          preview: false,
          sessions: titleOnly(16, "Traditionen & Feste"),
        },
      ],
    },
    {
      code: "B2",
      title: "B2 — Obere Mittelstufe (Menengah Atas)",
      description:
        "Berkomunikasi dengan kelancaran dan presisi: Konjunktiv I & II, debat, analisis sastra & sinema (Goethe, Kafka, Mann, Berlin School), Modalpartikeln native-like (doch, mal, ja, halt), serta variasi regional dari Hochdeutsch hingga Bayerisch & Schweizerdeutsch.",
      sublevels: [
        {
          code: "B2.1",
          title: "Konjunktiv I & II (Subjungtif Jerman)",
          preview: false,
          sessions: titleOnly(16, "Konjunktiv I & II"),
        },
        {
          code: "B2.2",
          title: "Berufswelt (Dunia Profesional)",
          preview: false,
          sessions: titleOnly(16, "Berufswelt"),
        },
        {
          code: "B2.3",
          title: "Gesellschaft & Aktuelles (Masyarakat & Isu Terkini)",
          preview: false,
          sessions: titleOnly(16, "Gesellschaft & Aktuelles"),
        },
        {
          code: "B2.4",
          title: "Kunst, Kino & Literatur (Seni, Sinema & Sastra)",
          preview: false,
          sessions: titleOnly(16, "Kunst, Kino & Literatur"),
        },
        {
          code: "B2.5",
          title: "Debatte & Argumentation (Debat & Argumentasi + Modalpartikeln)",
          preview: false,
          sessions: titleOnly(16, "Debatte & Argumentation"),
        },
        {
          code: "B2.6",
          title: "Regionale Varianten (Variasi Regional Bahasa Jerman)",
          preview: false,
          sessions: titleOnly(16, "Regionale Varianten"),
        },
        {
          code: "B2.7",
          title: "German Mastery (Penguasaan Bahasa Jerman)",
          preview: false,
          sessions: titleOnly(16, "German Mastery"),
        },
      ],
    },
  ],
};

export default curriculum;
