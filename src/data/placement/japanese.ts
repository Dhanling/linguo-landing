import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// JAPANESE PLACEMENT TEST (15 questions, mixed types)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Levels aligned with JLPT: A1 ≈ N5, A2 ≈ N4, B1 ≈ N3, B2 ≈ N2
// ─────────────────────────────────────────────────────────────────────────────
export const japanesePlacementTest: Question[] = [
  // ═══════════════════════ A1 (JLPT N5) ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Sapaan yang tepat untuk pagi hari dalam bahasa Jepang:",
    options: [
      "おやすみなさい (oyasumi nasai)",
      "おはようございます (ohayō gozaimasu)",
      "こんばんは (konbanwa)",
      "さようなら (sayōnara)",
    ],
    correct: 1,
    explanation: "'おはようございます' dipakai dari pagi hingga sekitar jam 10-11. 'こんばんは' untuk malam.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka hiragana dengan artinya:",
    pairs: [
      { left: "いち (ichi)", right: "1" },
      { left: "さん (san)", right: "3" },
      { left: "ご (go)", right: "5" },
      { left: "じゅう (jū)", right: "10" },
    ],
    explanation: "Angka dasar 1-10 adalah fondasi untuk country name, umur, tanggal.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'わたし ___ がくせい です。' (Saya adalah murid.)",
    context: "Partikel topic marker.",
    options: ["は", "を", "に", "が"],
    correct: "は",
    explanation: "'は' (dibaca 'wa' saat jadi partikel) adalah topic marker. Struktur: [Topik] は [Info] です.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["ごはん", "を", "たべます", "わたし", "は"],
    correct: ["わたし", "は", "ごはん", "を", "たべます"],
    explanation: "Struktur SOV Jepang: Subject + は + Object + を + Verb. 'を' (o) = partikel objek langsung.",
  },

  // ═══════════════════════ A2 (JLPT N4) ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Bentuk lampau (past) dari 'たべます' (makan):",
    options: [
      "たべます (tabemasu)",
      "たべました (tabemashita)",
      "たべません (tabemasen)",
      "たべて (tabete)",
    ],
    correct: 1,
    explanation: "Bentuk lampau polite form: -ます → -ました. 'たべました' = sudah makan.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan te-form (untuk menghubungkan):",
    translation: "Saya pergi ke sekolah lalu belajar.",
    tokens: ["がっこう", "べんきょうします", "いって", "に", "わたし", "は"],
    correct: ["わたし", "は", "がっこう", "に", "いって", "べんきょうします"],
    explanation: "Te-form ('いって' dari 'いきます') menghubungkan dua kata kerja berurutan. 'に' partikel arah.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan partikel yang tepat:",
    template: "としょかん ___ ほん ___ よみます。 (Saya baca buku di perpustakaan.)",
    blanks: ["で", "を"],
    options: ["で", "に", "を", "は", "が", "へ"],
    explanation: "'で' = partikel tempat aktivitas. 'を' = partikel objek langsung. Ingat: に = tujuan (statis), で = lokasi aktivitas.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Bentuk potensial: 'にほんご を ___ 。' (Saya bisa bahasa Jepang.)",
    context: "Bentuk potensial dari 'はなす' (berbicara).",
    options: ["はなせます", "はなします", "はなれます", "はなります"],
    correct: "はなせます",
    explanation: "Verb group 1 (u-verb): -u → -eru. 'はなす' → 'はなせる' / polite 'はなせます'.",
  },

  // ═══════════════════════ B1 (JLPT N3) ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Pilih kalimat dengan keigo (bahasa hormat) yang benar:",
    options: [
      "しゃちょう は ごはん を たべます。",
      "しゃちょう は ごはん を めしあがります。",
      "しゃちょう は ごはん を いただきます。",
      "しゃちょう は ごはん を たべる。",
    ],
    correct: 1,
    explanation: "'めしあがります' adalah sonkeigo (keigo hormat) untuk 'たべる'. 'いただきます' adalah kenjōgo (merendahkan diri sendiri).",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif (受身形):",
    translation: "Saya dimarahi oleh guru.",
    tokens: ["せんせい", "しかられました", "に", "わたし", "は"],
    correct: ["わたし", "は", "せんせい", "に", "しかられました"],
    explanation: "Pasif: Subject は Agent に Verb-pasif. 'しかる' (memarahi) → 'しかられる' (dimarahi).",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan ekspresi dengan fungsinya:",
    pairs: [
      { left: "〜たほうがいい", right: "saran (sebaiknya...)" },
      { left: "〜なければならない", right: "keharusan (harus...)" },
      { left: "〜てもいい", right: "izin (boleh...)" },
      { left: "〜てはいけない", right: "larangan (tidak boleh...)" },
    ],
    explanation: "4 ekspresi modal utama di level N3. Sangat sering muncul di percakapan formal dan JLPT.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi dengan bentuk conditional yang tepat:",
    template: "あめ が ___、 いえ に います。 (Kalau hujan, saya di rumah.)",
    blanks: ["ふったら"],
    options: ["ふったら", "ふれば", "ふると", "ふるなら", "ふって", "ふります"],
    explanation: "'〜たら' adalah conditional paling fleksibel. 'ふる' (turun/hujan) → 'ふったら'.",
  },

  // ═══════════════════════ B2 (JLPT N2) ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Pilih kalimat dengan bentuk causative-passive (使役受身) yang benar:",
    options: [
      "ははに やさいを たべさせました。",
      "ははに やさいを たべさせられました。",
      "ははに やさいを たべられました。",
      "ははは やさいを たべさせます。",
    ],
    correct: 1,
    explanation: "Causative-passive = 'dipaksa untuk...'. 'たべる' → 'たべさせる' (causative) → 'たべさせられる' (causative-passive). Artinya 'dipaksa makan oleh ibu'.",
  },
  {
    id: "q14", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat formal dengan ekspresi 'にもかかわらず':",
    translation: "Meskipun hujan, dia tetap datang.",
    tokens: ["かれ", "きました", "あめ", "は", "にもかかわらず"],
    correct: ["あめ", "にもかかわらず", "かれ", "は", "きました"],
    explanation: "'〜にもかかわらず' = meskipun/walaupun. Register formal, sering di tulisan akademik atau berita.",
  },
  {
    id: "q15", difficulty: "B2", type: "missing",
    question: "Lengkapi dengan ekspresi formal yang tepat:",
    template: "この ほん は ___ むずかしい ___ 、 よみました。 (Buku ini sulit tapi saya tetap baca.)",
    blanks: ["ほど", "けれど"],
    options: ["ほど", "ぐらい", "けれど", "から", "ので", "のに"],
    explanation: "'ほど' = sampai tingkat/sedemikian rupa. 'けれど' = tapi (formal dari 'けど'). Pola ini sering muncul di essay N2.",
  },
];
