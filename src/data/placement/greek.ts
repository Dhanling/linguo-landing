// ─────────────────────────────────────────────────────────────────────────────
// GREEK (Ελληνικά) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const greekPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "el1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'halo' (informal) dalam bahasa Yunani?",
    options: ["Αντίο", "Γεια σου", "Καληνύχτα", "Ευχαριστώ"],
    correct: 1,
    explanation: "'Γεια σου' (ya su) = halo. 'Αντίο' = selamat tinggal, 'Ευχαριστώ' = terima kasih.",
  },
  {
    id: "el2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "το σπίτι", right: "rumah" },
      { left: "το νερό", right: "air" },
      { left: "το ψωμί", right: "roti" },
      { left: "η γάτα", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Artikel: ο (mask.) / η (fem.) / το (netral).",
  },
  {
    id: "el3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Εγώ ___ φοιτητής.' (Saya seorang mahasiswa.)",
    context: "Verba 'είμαι' (menjadi) untuk 'εγώ'.",
    options: ["είμαι", "είσαι", "είναι", "είμαστε"],
    correct: "είμαι",
    explanation: "Verba 'είμαι': εγώ είμαι, εσύ είσαι, αυτός είναι. Untuk 'εγώ' → 'είμαι'.",
  },
  {
    id: "el4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["πίνω", "Εγώ", "καφέ"],
    correct: ["Εγώ", "πίνω", "καφέ"],
    explanation: "'Εγώ πίνω καφέ'. Verba 'πίνω' (minum). 'καφέ' bentuk akusatif objek.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "el5", difficulty: "A2", type: "multiple",
    question: "'Χθες ___ ποδόσφαιρο.' (παίζω, αόριστος/past)",
    options: ["παίζω", "έπαιξα", "θα παίξω", "έπαιζα"],
    correct: 1,
    explanation: "Αόριστος (past selesai) 'παίζω' → 'έπαιξα' = saya (telah) bermain.",
  },
  {
    id: "el6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat lampau (αόριστος):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["πήγα", "Χθες", "σχολείο", "στο"],
    correct: ["Χθες", "πήγα", "στο", "σχολείο"],
    explanation: "'πηγαίνω' → αόριστος 'πήγα'. 'στο' = σε + το (ke). 'Χθες πήγα στο σχολείο'.",
  },
  {
    id: "el7", difficulty: "A2", type: "missing",
    question: "Artikel (nominatif) — lengkapi:",
    template: "___ άντρας διαβάζει και ___ γυναίκα γράφει.",
    blanks: ["Ο", "η"],
    options: ["Ο", "η", "Το", "οι", "τον", "της"],
    explanation: "'ο άντρας' (mask.) dan 'η γυναίκα' (fem.). Artikel harus setuju gender.",
  },
  {
    id: "el8", difficulty: "A2", type: "fillChoice",
    question: "'Πηγαίνω ___ Αθήνα.' (Saya pergi ke Athena.)",
    context: "Pilih bentuk 'σε + artikel' yang tepat.",
    options: ["στην", "στον", "στο", "σε"],
    correct: "στην",
    explanation: "'η Αθήνα' feminin akusatif → σε + την = 'στην Αθήνα'.",
  },
  {
    id: "el9", difficulty: "A2", type: "multiple",
    question: "'Πρέπει να ___ στον γιατρό.' (Kamu harus/sebaiknya ke dokter.)",
    options: ["πηγαίνεις", "πας", "πήγες", "θα πας"],
    correct: 1,
    explanation: "Setelah 'πρέπει να' pakai υποτακτική → 'πας'. 'Πρέπει να πας στον γιατρό'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "el10", difficulty: "B1", type: "multiple",
    question: "'Αν ___ χρόνο, θα ταξίδευα.' (υποθετικός λόγος)",
    options: ["έχω", "είχα", "θα έχω", "έχοντας"],
    correct: 1,
    explanation: "Pengandaian tak nyata: 'Αν είχα χρόνο, θα ταξίδευα' (παρατατικός + θα + παρατατικός).",
  },
  {
    id: "el11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif lampau:",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["γράφτηκε", "Το", "χθες", "γράμμα"],
    correct: ["Το", "γράμμα", "γράφτηκε", "χθες"],
    explanation: "Pasif αόριστος: 'γράφτηκε' (ditulis). 'Το γράμμα γράφτηκε χθες'.",
  },
  {
    id: "el12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konektor dengan artinya:",
    pairs: [
      { left: "επειδή", right: "karena" },
      { left: "αν και", right: "meskipun" },
      { left: "ώστε", right: "sehingga" },
      { left: "ενώ", right: "sementara" },
    ],
    explanation: "Konektor wacana penting di B1 untuk menghubungkan klausa.",
  },
  {
    id: "el13", difficulty: "B1", type: "missing",
    question: "Υποτακτική (setelah 'ελπίζω να') — lengkapi:",
    template: "Ελπίζω να ___ καλά και να ___ σύντομα.",
    blanks: ["είσαι", "έρθεις"],
    options: ["είσαι", "έρθεις", "είναι", "έρχεσαι", "είμαι", "ήρθες"],
    explanation: "Setelah 'ελπίζω να' pakai υποτακτική: 'είσαι' (menjadi), 'έρθεις' (datang).",
  },
  {
    id: "el14", difficulty: "B1", type: "fillChoice",
    question: "'Ο άντρας ___ είδα χθες είναι ο γείτονάς μου.' (αναφορικό)",
    context: "Pilih kata penghubung relatif yang paling umum.",
    options: ["που", "οποίος", "ο οποίος", "όποιος"],
    correct: "που",
    explanation: "'που' adalah penghubung relatif universal (tak berubah): 'ο άντρας που είδα'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "el15", difficulty: "B2", type: "multiple",
    question: "'Αν το ήξερα, ___.' (υποθετικός — μη πραγματικό παρελθόν)",
    options: [
      "θα ενεργούσα διαφορετικά",
      "θα είχα ενεργήσει διαφορετικά",
      "ενέργησα διαφορετικά",
      "ενεργώ διαφορετικά",
    ],
    correct: 1,
    explanation: "Pengandaian lampau tak nyata: 'θα είχα ενεργήσει' (υπερσυντέλικος). 'Αν το ήξερα, θα είχα ενεργήσει διαφορετικά'.",
  },
  {
    id: "el16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan κλιτικά (urutan pronomina):",
    translation: "Saya sudah memberikannya (itu) kepadanya.",
    tokens: ["το", "Του", "έδωσα"],
    correct: ["Του", "το", "έδωσα"],
    explanation: "Urutan klitik: γενική (Του) sebelum αιτιατική (το) di depan verba. 'Του το έδωσα'.",
  },
  {
    id: "el17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Η νέα πολιτική θα ___ τις συνέπειες, ενώ η παλιά θα τις ___ μόνο.",
    blanks: ["μετριάσει", "επιδεινώσει"],
    options: ["μετριάσει", "επιδεινώσει", "δημιουργήσει", "ενισχύσει", "σταθεροποιήσει", "αποτρέψει"],
    explanation: "'μετριάζω' = meredakan, 'επιδεινώνω' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "el18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan ονοματοποίηση (nominalisasi/gaya formal)?",
    options: [
      "Αποφάσισε γρήγορα.",
      "Η απόφασή της ήταν γρήγορη.",
      "Αποφασίζει γρήγορα.",
      "Γρήγορα αποφάσισε.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'αποφασίζω' → nomina 'απόφαση'. Ciri gaya tulisan formal.",
  },
];
