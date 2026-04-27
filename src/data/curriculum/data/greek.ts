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
  [1, "Aksara Yunani & Pelafalan", ["24 huruf Yunani", "Α-Ω", "vokal panjang/pendek", "huruf mirip Latin"]],
  [2, "Tanda Tekanan & Diftong", ["tonos (΄)", "αι, ει, οι, ου", "membaca lancar"]],
  [3, "Salam & Perpisahan", ["γεια σου / γεια σας", "καλημέρα", "αντίο, τα λέμε"]],
  [4, "Memperkenalkan Diri", ["με λένε...", "χαίρω πολύ", "kewarganegaraan"]],
  [5, "Angka 0–20", ["μηδέν → είκοσι", "nomor telepon", "umur (είμαι ... χρονών)"]],
  [6, "Hari & Bulan", ["7 hari (Δευτέρα → Κυριακή)", "12 bulan", "tanggal"]],
  [7, "Warna & Adjektiva Dasar", ["κόκκινο, μπλε, πράσινο", "μεγάλο / μικρό", "concord gender"]],
  [8, "Anggota Keluarga", ["μητέρα, πατέρας", "αδελφός / αδελφή", "possessive (μου, σου)"]],
  [9, "Artikel: ο, η, το", ["3 gender", "kapan pakai mana", "definite articles"]],
  [10, "Kata Ganti Subjek", ["εγώ, εσύ, αυτός/αυτή/αυτό", "εμείς, εσείς, αυτοί"]],
  [11, "Kata Kerja 'είμαι' — Positif", ["είμαι, είσαι, είναι", "kontraksi", "είμαι από..."]],
  [12, "Kata Kerja 'είμαι' — Negatif & Tanya", ["δεν είμαι", "είσαι...?", "intonasi"]],
  [13, "Angka 20–100 & Harga", ["εικοσιένα → εκατό", "πόσο κάνει;", "ευρώ & λεπτά"]],
  [14, "Menanyakan Waktu", ["τι ώρα είναι;", "η ώρα είναι...", "και / παρά"]],
  [15, "Makanan & Minuman Dasar", ["πρωινό, μεσημεριανό, δείπνο", "ψωμί, νερό, καφές"]],
  [16, "Review & Percakapan Pertama", ["self-intro", "small talk dasar", "γνωριμία"]],
]);

const a1_2 = toSessions([
  [1, "Present Tense — Verba Reguler (-ω)", ["μιλάω, δουλεύω, μένω", "konjugasi 6 orang"]],
  [2, "Present Tense — Verba (-άω/-ώ)", ["αγαπάω, ρωτάω, ζω", "stress shift"]],
  [3, "Rumahku", ["δωμάτια", "έπιπλα", "υπάρχει / υπάρχουν"]],
  [4, "Rutinitas Harian", ["ξυπνάω, πάω για δουλειά", "urutan: πρώτα... μετά..."]],
  [5, "Adjektiva Possessive", ["μου, σου, του, της, μας, σας, τους"]],
  [6, "Kata Tanya", ["τι, πού, πότε, ποιος, γιατί, πώς"]],
  [7, "Preposisi Tempat", ["σε, από, με, για", "πάνω, κάτω, δίπλα, πίσω"]],
  [8, "Pakaian & Penampilan", ["φούστα, παντελόνι, πουκάμισο", "φοράω"]],
  [9, "Cuaca & Musim", ["κάνει ζέστη / κρύο", "βρέχει, χιονίζει", "4 musim"]],
  [10, "Di Pasar (Λαϊκή)", ["φρούτα & λαχανικά", "λίγο / πολύ", "kilo & μισό κιλό"]],
  [11, "Di Restoran (Ταβέρνα)", ["μενού", "θα ήθελα...", "το λογαριασμό"]],
  [12, "Μπορώ — Kemampuan & Izin", ["μπορώ να + subjunctive", "ξέρω να κολυμπάω"]],
  [13, "Adverb Frekuensi", ["πάντα, συνήθως, μερικές φορές, ποτέ"]],
  [14, "Hobi & Waktu Luang", ["μου αρέσει + nominatif", "fokus speaking"]],
  [15, "Suka & Tidak Suka", ["αγαπώ, μισώ", "εσένα; (and you?)"]],
  [16, "Review & Role Play", ["restoran scenario", "shopping di laïki"]],
]);

const a1_3 = toSessions([
  [1, "Gender & Bilangan Nomina", ["maskulin -ος", "feminin -α/-η", "neuter -ο/-ι/-μα"]],
  [2, "Akuzatif: Objek Langsung", ["τον/την/το", "perubahan ending"]],
  [3, "Kata Ganti Objek", ["με, σε, τον, την, το", "posisi sebelum verba"]],
  [4, "Countable & Uncountable", ["ένα ψωμί / λίγο νερό", "πόσο / πόσα"]],
  [5, "Di Supermarket", ["κουτί, μπουκάλι, κιλό", "να σας βοηθήσω;"]],
  [6, "Arah di Kota", ["στρίψε αριστερά / δεξιά", "ίσια", "απέναντι από"]],
  [7, "Transportasi", ["με το λεωφορείο, με το μετρό", "παίρνω το τρένο"]],
  [8, "Belanja Pakaian", ["τι νούμερο φοράτε;", "δοκιμάζω", "πολύ μεγάλο/μικρό"]],
  [9, "Membuat Rencana", ["πάμε...?", "τι λες για...?", "menerima/menolak ajakan"]],
  [10, "Di Telepon", ["εμπρός / παρακαλώ", "μπορώ να μιλήσω με...", "μισό λεπτό"]],
  [11, "Mengisi Formulir", ["ονοματεπώνυμο", "διεύθυνση", "ταχ. κώδικας"]],
  [12, "Past Tense (Αόριστος): είμαι", ["ήμουν, ήσουν, ήταν", "χθες"]],
  [13, "Past Tense Reguler", ["έπαιξα, διάβασα, αγόρασα", "augment ε-"]],
  [14, "Past Tense Iregular", ["πήγα, είδα, έκανα, ήρθα", "memorisasi"]],
  [15, "Akhir Pekan Lalu", ["bercerita", "πρώτα... μετά... τέλος..."]],
  [16, "Review & Storytelling", ["cerita pribadi 3 menit"]],
]);

// ============ A2 — 4 sublevels, preview-locked ============
const a2_1 = titleOnly([
  "Past Tense Review & Pertanyaan", "Past Tense Negatif (δεν + αόριστος)",
  "Ekspresi Waktu Lampau", "Komparatif (πιο... από)", "Superlatif (ο πιο...)",
  "Modal: Πρέπει (Wajib)", "Modal: Μπορώ vs Πρέπει",
  "Review Artikel & Kasus", "Mendeskripsikan Orang", "Kampung Halamanku",
  "Kosakata Perjalanan", "Di Bandara (Αεροδρόμιο)", "Check-in Hotel",
  "Restoran Lanjutan & Μεζέδες", "Meminta Bantuan", "Review: Role Play Liburan ke Yunani",
]);

const a2_2 = titleOnly([
  "Subjunctive (Υποτακτική): Pengantar", "Θέλω να + subjunctive",
  "Future Tense: θα + present (continuous)", "Future Tense: θα + aorist (one-time)",
  "Conditional Pertama (Αν + future)", "Pekerjaan & Profesi",
  "Wawancara Kerja Dasar", "Kosakata Tempat Kerja", "Menulis Email",
  "Mendeskripsikan Pekerjaanmu", "Small Talk", "Berbicara tentang Pengalaman",
  "Berita & Peristiwa Terkini", "Lingkungan & Alam",
  "Pulau-pulau Yunani (Νησιά)", "Review",
]);

const a2_3 = titleOnly([
  "Past Continuous (Παρατατικός)", "Παρατατικός vs Αόριστος",
  "Όταν / Ενώ / Καθώς", "Klausa Relatif (που, ο οποίος)",
  "Adverb Cara (-ως, -ά)", "Έτσι / Επειδή / Όμως",
  "Mengungkapkan Pendapat", "Setuju & Tidak Setuju",
  "Struktur Bercerita", "Mendeskripsikan Buku atau Film",
  "Kesehatan & Sakit", "Di Dokter",
  "Olahraga & Kebugaran", "Musik & Seni (Ρεμπέτικο intro)",
  "Kosakata Teknologi", "Review & Debat Pendapat",
]);

const a2_4 = titleOnly([
  "Συνήθιζα να (Kebiasaan Lampau)", "Kebiasaan Berulang dengan Παρατατικός",
  "Kata Ganti Refleksif (ο εαυτός μου)", "Και οι δύο / Κανένας / Κάποιος",
  "Πολύ / Αρκετά / Πάρα πολύ", "Quantifier: Λίγος, Μερικοί",
  "Kata Ganti Tak Tentu", "Mengungkapkan Preferensi",
  "Memberi Saran", "Menawarkan & Menerima Bantuan",
  "Memberi Instruksi", "Mendeskripsikan Proses",
  "Festival Yunani: Πάσχα & Apokries", "Kuliner Yunani (Σουβλάκι, Μουσακάς, Φέτα)",
  "Budaya Indonesia vs Yunani", "Review & Pertukaran Budaya",
]);

// ============ B1 — 5 sublevels, preview-locked ============
const b1_1 = titleOnly([
  "Present Perfect (Παρακείμενος)", "Past Perfect (Υπερσυντέλικος)",
  "Reported Speech: Pernyataan", "Reported Speech: Pertanyaan",
  "Passive Voice: Present & Past", "Conditional Kedua (Αν + παρατατικός, θα + παρατατικός)",
  "Review Modal Verbs", "Phrasal-like: Verba dengan Preposisi",
  "Ungkapan Idiomatik Sehari-hari", "Idiom: Waktu & Uang",
  "Register Formal vs Informal", "Menulis Ulasan",
  "Deskripsi Lanjutan", "Perbedaan Budaya",
  "Diskusi Film & Buku Yunani (Z, Ελληνικός Κινηματογράφος)", "Review",
]);

const b1_2 = titleOnly([
  "Conditional Ketiga", "Conditional Campuran",
  "Klausa Relatif Defining vs Non-defining", "Klausa Participle (Μετοχή)",
  "Penghubung: Παρόλο που, Ωστόσο, Εντούτοις", "Kosakata Berita",
  "Diskusi Politik Ringan", "Isu Global",
  "Debat Lingkungan", "Dampak Teknologi",
  "Diskursus Media Sosial", "Diskusi Karier",
  "Skill Wawancara", "Negosiasi Dasar",
  "Mempresentasikan Ide", "Review",
]);

const b1_3 = titleOnly([
  "Modal Perfect (Θα έπρεπε να είχα...)", "Passive Voice Lanjutan",
  "Nominalisasi (-ση, -μός)", "Inversi untuk Penekanan",
  "Penghubung Lanjutan", "Mengungkapkan Kepastian & Keraguan",
  "Dasar Penulisan Akademik", "Struktur Esai",
  "Diskusi Sastra (Καζαντζάκης intro)", "Seni & Budaya",
  "Topik Sejarah (Αρχαία vs Νεότερη Ελλάδα)", "Sains & Penemuan",
  "Filsafat Ringan (Σωκράτης, Πλάτων intro)", "Dasar Bahasa Bisnis",
  "Rapat & Pengambilan Keputusan", "Review",
]);

const b1_4 = titleOnly([
  "Gerund & Infinitive (Ελληνικά: subjunctive vs noun)", "Verba dengan Preposisi Lanjutan",
  "Adjektiva Majemuk", "Kata Berimbuhan (πρό-, αντί-, υπερ-)",
  "Penekanan dengan Όντως / Πράγματι", "Cleft Sentences Pengantar",
  "Travel Writing (Pulau-pulau Yunani)", "Blog & Tulisan Media Sosial",
  "Public Speaking Dasar", "Etiket Debat",
  "Esai Pribadi", "Deskripsi Kreatif",
  "Analisis Film & TV (Λάνθιμος, Αγγελόπουλος)", "Musik & Puisi (Ποίηση Καβάφη)",
  "Etiket Global", "Review",
]);

const b1_5 = titleOnly([
  "Reported Speech Lanjutan", "Μακάρι & Ας (Wishes)",
  "Situasi Hipotetis", "Mixed Tenses",
  "Passive Lanjutan", "Causative Έχω/Βάζω να + subjunctive",
  "Mengungkapkan Penyesalan", "Mengungkapkan Harapan",
  "Kosakata Pemecahan Masalah", "Pengambilan Keputusan",
  "Manajemen Krisis", "Dasar Kepemimpinan",
  "Komunikasi Tim", "Feedback & Kritik",
  "Manajemen Waktu", "Review & Simulasi Bisnis",
]);

// ============ B2 — 7 sublevels, preview-locked ============
const b2_1 = titleOnly([
  "Struktur Kalimat Kompleks", "Subjunctive Lanjutan (Υποτακτική Παρακειμένου)",
  "Struktur Emfatik", "Cleft Sentences",
  "Kolokasi (Συνάψεις)", "Ekspresi Idiomatik",
  "Metafora & Simile", "Penguasaan Tone & Register",
  "Teknik Debat", "Penulisan Persuasif",
  "Korespondensi Formal", "Presentasi Akademik",
  "Analisis Kritis", "Merangkum & Parafrase",
  "Penulisan Kreatif", "Review",
]);

const b2_2 = titleOnly([
  "Komunikasi Bisnis", "Penulisan Laporan",
  "Kosakata Manajemen Proyek", "Bahasa Kepemimpinan",
  "Bahasa Yunani Finansial", "Kosakata Marketing",
  "HR & Rekrutmen", "Dasar Bahasa Hukum",
  "Industri IT & Tek", "Hubungan Klien",
  "Etiket Bisnis Internasional", "Komunikasi Lintas Budaya",
  "Memberikan Presentasi", "Memimpin Rapat",
  "Proposal Tertulis", "Review",
]);

const b2_3 = titleOnly([
  "Fluency Idiomatik", "Nuansa Budaya Yunani",
  "Humor & Ironi (Ειρωνεία)", "Slang & Bahasa Sehari-hari",
  "Variasi Regional (Κρητικά, Κυπριακά, Ποντιακά)", "Strategi Listening Lanjutan",
  "Pemahaman Bicara Cepat", "Aksen & Pelafalan Lanjutan",
  "Diskursus Akademik", "Jurnalisme & Analisis Media (Καθημερινή, Lifo)",
  "Sastra & Puisi (Σεφέρης, Ελύτης)", "Public Speaking",
  "Penguasaan Storytelling", "Debat & Argumentasi",
  "Personal Brand dalam Bahasa Yunani", "Review",
]);

const b2_4 = titleOnly([
  "Strategi Membaca Akademik", "Kosakata Riset",
  "Dasar Penulisan Tesis", "Sitasi & Referensi",
  "Presentasi Data", "Mendeskripsikan Grafik & Diagram",
  "Metode Ilmiah", "Laporan Eksperimen",
  "Bahasa Peer Review", "Presentasi Konferensi",
  "Proposal Riset", "Tinjauan Pustaka",
  "Penulisan Abstrak", "Formulasi Hipotesis",
  "Debat Akademik", "Review",
]);

const b2_5 = titleOnly([
  "Pengantar Bahasa Hukum Yunani", "Kosakata Kontrak",
  "Penguasaan Negosiasi", "Arbitrase & Mediasi",
  "Bahasa Diplomatik", "Resolusi Sengketa Antarbudaya",
  "Penulisan Kebijakan", "Urusan Pemerintahan (Δημόσια Διοίκηση)",
  "Public Speaking untuk Pemimpin", "Gaya TED Talk",
  "Pidato Motivasional", "Executive Presence",
  "Komunikasi Krisis", "Wawancara Media",
  "Konferensi Pers", "Review",
]);

const b2_6 = titleOnly([
  "Analisis Sastra Yunani", "Interpretasi Puisi (Καβάφης deep-dive)",
  "Yunani Klasik: Cuplikan Homer (Ομηρικά)", "Sastra Modern (Καζαντζάκης, Ξενάκης)",
  "Menulis Cerpen", "Struktur Novel",
  "Pengembangan Karakter", "Penulisan Dialog",
  "Dasar Skenario", "Penulisan Lirik Lagu",
  "Skill Penerjemahan (Yunani ↔ Indonesia)", "Dasar Subtitling",
  "Non-fiksi Kreatif", "Penulisan Memoar",
  "Travel Writing tentang Yunani", "Review",
]);

const b2_7 = titleOnly([
  "Modern Greek Mastery: Pengantar", "Diglossia: Καθαρεύουσα vs Δημοτική",
  "Etimologi: Akar Yunani dalam Sains & Medis", "Wacana Filosofis (Πλάτων, Αριστοτέλης)",
  "Mitologi sebagai Lensa Budaya", "Tragedi Yunani (Σοφοκλής, Ευριπίδης)",
  "Puisi Modern: Καβάφης, Ρίτσος, Σεφέρης", "Bioskop Yunani Kontemporer",
  "Wacana Politik Yunani Modern", "Krisis Ekonomi & Pemulihan (2010–sekarang)",
  "Identitas Diaspora Yunani", "Hubungan Yunani–Turki & Siprus",
  "Tradisi Ortodoks & Kehidupan Modern", "Yunani dalam Uni Eropa",
  "Capstone: Pidato Pribadi tentang Yunani", "Review Akhir & Sertifikasi Linguo B2",
]);

const curriculum: LanguageCurriculum = {
  meta: getLanguageBySlug("greek")!,
  overview: "Program 304 sesi yang mengantar kamu dari benar-benar nol — termasuk aksara Yunani 24 huruf — sampai percakapan near-native. Struktur Linguo: A1 (3 chapter), A2 (4 chapter), B1 (5 chapter), B2 (7 chapter). Setiap level dirancang sesuai standar CEFR. Bonus: ribuan kata sains, medis, dan filsafat di bahasa modern berakar dari Yunani — kamu sudah punya keunggulan tanpa sadar.",
  levels: [
    {
      code: "A1", name: "Elementary Foundation",
      description: "Fondasi bahasa: aksara Yunani, tata bahasa dasar, percakapan sederhana sehari-hari.",
      sublevels: [
        { code: "A1.1", name: "First Steps",   sessions: a1_1, preview: true },
        { code: "A1.2", name: "Daily Life",    sessions: a1_2, preview: true },
        { code: "A1.3", name: "Social Basics", sessions: a1_3, preview: true },
      ],
    },
    {
      code: "A2", name: "Pre-Intermediate",
      description: "Beyond basics: aoristos & paratatikos, perjalanan ke Yunani, pekerjaan, ekspresi diri.",
      sublevels: [
        { code: "A2.1", name: "Beyond Basics",          sessions: a2_1, preview: false },
        { code: "A2.2", name: "Travel & Hospitality",   sessions: a2_2, preview: false },
        { code: "A2.3", name: "Self-Expression",        sessions: a2_3, preview: false },
        { code: "A2.4", name: "Cultural Foundations",   sessions: a2_4, preview: false },
      ],
    },
    {
      code: "B1", name: "Intermediate",
      description: "Fluency foundations: tenses kompleks, budaya Yunani, topik abstrak, sastra & filsafat ringan.",
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
      description: "Advanced expression: bisnis, akademik, sastra & filsafat. Capstone dengan deep-dive ke Modern Greek dan warisan klasik.",
      sublevels: [
        { code: "B2.1", name: "Advanced Expression",       sessions: b2_1, preview: false },
        { code: "B2.2", name: "Professional Greek",        sessions: b2_2, preview: false },
        { code: "B2.3", name: "Near-Native Communication", sessions: b2_3, preview: false },
        { code: "B2.4", name: "Academic Mastery",          sessions: b2_4, preview: false },
        { code: "B2.5", name: "Leadership & Diplomacy",    sessions: b2_5, preview: false },
        { code: "B2.6", name: "Creative & Literary",       sessions: b2_6, preview: false },
        { code: "B2.7", name: "Modern Greek Mastery",      sessions: b2_7, preview: false },
      ],
    },
  ],
};

export default curriculum;
