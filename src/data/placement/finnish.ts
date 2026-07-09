// ─────────────────────────────────────────────────────────────────────────────
// FINNISH (Suomi) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const finnishPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "fi1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'halo' dalam bahasa Finlandia?",
    options: ["Näkemiin", "Hei", "Hyvää yötä", "Kiitos"],
    correct: 1,
    explanation: "'Hei' (atau 'Moi') = halo. 'Näkemiin' = sampai jumpa, 'Kiitos' = terima kasih.",
  },
  {
    id: "fi2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "talo", right: "rumah" },
      { left: "vesi", right: "air" },
      { left: "leipä", right: "roti" },
      { left: "kissa", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Finlandia tidak punya artikel & gender.",
  },
  {
    id: "fi3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Minä ___ opiskelija.' (Saya seorang mahasiswa.)",
    context: "Verba 'olla' (menjadi) untuk 'minä'.",
    options: ["olen", "olet", "on", "olla"],
    correct: "olen",
    explanation: "Verba 'olla': minä olen, sinä olet, hän on. Untuk 'minä' → 'olen'.",
  },
  {
    id: "fi4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["juon", "Minä", "kahvia"],
    correct: ["Minä", "juon", "kahvia"],
    explanation: "'Minä juon kahvia'. Objek 'kahvi' → 'kahvia' (partitiivi) untuk aksi belum selesai.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "fi5", difficulty: "A2", type: "multiple",
    question: "'Eilen minä ___ jalkapalloa.' (pelata, imperfekti/past)",
    options: ["pelaan", "pelasin", "pelannut", "pelaa"],
    correct: 1,
    explanation: "Imperfekti (past) 'pelata' untuk 'minä' → 'pelasin'.",
  },
  {
    id: "fi6", difficulty: "A2", type: "missing",
    question: "Lokatiivi (sisä-/ulko-) — lengkapi arah 'ke dalam':",
    template: "Menen ___ (koulu) ja olen ___ (koti).",
    blanks: ["kouluun", "kotona"],
    options: ["kouluun", "kotona", "koulussa", "kotiin", "koulu", "koti"],
    explanation: "'kouluun' (illatiivi = ke sekolah), 'kotona' (bentuk khusus = di rumah).",
  },
  {
    id: "fi7", difficulty: "A2", type: "fillChoice",
    question: "'Minulla ___ auto.' (Saya punya mobil.)",
    context: "Struktur kepemilikan Finlandia.",
    options: ["on", "olen", "olla", "ovat"],
    correct: "on",
    explanation: "Kepemilikan: 'Minulla on ...' (harfiah: 'pada saya ada ...'). Selalu 'on'.",
  },
  {
    id: "fi8", difficulty: "A2", type: "multiple",
    question: "'Talo on ___ kuin tuo.' (rumah ini lebih besar)",
    options: ["iso", "isompi", "isoin", "isoa"],
    correct: 1,
    explanation: "Komparatif 'iso' (besar) → 'isompi'. Superlatif → 'isoin'.",
  },
  {
    id: "fi9", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat negatif (kieltoverbi 'ei'):",
    translation: "Saya tidak minum kopi.",
    tokens: ["juo", "Minä", "kahvia", "en"],
    correct: ["Minä", "en", "juo", "kahvia"],
    explanation: "Negasi pakai verba 'ei' terkonjugasi (en/et/ei) + verba tanpa akhiran: 'en juo'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "fi10", difficulty: "B1", type: "multiple",
    question: "'Jos minulla ___ aikaa, matkustaisin enemmän.' (konditionaali)",
    options: ["on", "olisi", "oli", "ollut"],
    correct: 1,
    explanation: "Pengandaian: 'Jos ... olisi (konditionaali), + konditionaali (matkustaisin)'.",
  },
  {
    id: "fi11", difficulty: "B1", type: "missing",
    question: "Objektin sija (akkusatiivi vs partitiivi) — lengkapi:",
    template: "Luen ___ (kirja) joka päivä, ja tänään luin ___ (kirja) loppuun.",
    blanks: ["kirjaa", "kirjan"],
    options: ["kirjaa", "kirjan", "kirja", "kirjat", "kirjassa", "kirjoja"],
    explanation: "Partitiivi 'kirjaa' (aksi belum selesai/berulang), akkusatiivi 'kirjan' (selesai tuntas).",
  },
  {
    id: "fi12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konjungsi dengan artinya:",
    pairs: [
      { left: "koska", right: "karena" },
      { left: "vaikka", right: "meskipun" },
      { left: "jotta", right: "supaya" },
      { left: "kun", right: "ketika" },
    ],
    explanation: "Konjungsi subordinat B1 untuk menghubungkan klausa.",
  },
  {
    id: "fi13", difficulty: "B1", type: "fillChoice",
    question: "'Mies, ___ näin eilen, on naapurini.' (relatiivipronomini)",
    context: "Pilih pronomina relatif dalam kasus objek.",
    options: ["joka", "jonka", "jota", "jossa"],
    correct: "jonka",
    explanation: "'joka' (subjek) → 'jonka' (genitiivi/objek total). 'Mies, jonka näin eilen...'.",
  },
  {
    id: "fi14", difficulty: "B1", type: "multiple",
    question: "'Kahvi ___ juotu.' (Kopi sudah diminum — pasif perfekti)",
    options: ["on", "olen", "ovat", "oli"],
    correct: 0,
    explanation: "Pasif perfekti: 'on' + partisip pasif 'juotu'. 'Kahvi on juotu'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "fi15", difficulty: "B2", type: "multiple",
    question: "'Jos olisin tiennyt, ___.' (konditionaalin perfekti)",
    options: [
      "toimisin toisin",
      "olisin toiminut toisin",
      "toimin toisin",
      "olen toiminut toisin",
    ],
    correct: 1,
    explanation: "Pengandaian lampau: 'olisin + toiminut' (konditionaalin perfekti). 'Jos olisin tiennyt, olisin toiminut toisin'.",
  },
  {
    id: "fi16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat pasif (passiivi):",
    translation: "Buku itu ditulis viime vuonna (tahun lalu).",
    tokens: ["kirjoitettiin", "Kirja", "viime vuonna"],
    correct: ["Kirja", "kirjoitettiin", "viime vuonna"],
    explanation: "Passiivi imperfekti: verba tanpa subjek personal. 'kirjoitettiin' (ditulis). 'Kirja kirjoitettiin viime vuonna'.",
  },
  {
    id: "fi17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Uusi politiikka ___ seurauksia, kun taas vanha vain ___ niitä.",
    blanks: ["lieventää", "pahentaisi"],
    options: ["lieventää", "pahentaisi", "luo", "vahvistaa", "vakauttaa", "estää"],
    explanation: "'lieventää' = meredakan, 'pahentaa' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "fi18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalisaatio (gaya formal)?",
    options: [
      "Hän päätti nopeasti.",
      "Hänen päätöksensä oli nopea.",
      "Hän tekee päätöksen nopeasti.",
      "Nopeasti hän päätti.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'päättää' → nomina 'päätös'. Ciri gaya tulisan formal.",
  },
];
