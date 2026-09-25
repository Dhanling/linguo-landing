// ─────────────────────────────────────────────────────────────────────────────
// SPANISH (Español) PLACEMENT TEST — 23 soal, mixed types (5 di antaranya listening)
// Distribusi: A1×5 · A2×6 · B1×7 · B2×5 (max 45)
// [placement-listening-v1] Soal ber-`audio` dibunyikan Chirp es-ES lewat /api/tts;
// transkrip sengaja cuma ada di `audio.text` + pembahasan, tidak di layar soal.
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const spanishPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "es1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara menyapa di pagi hari dalam bahasa Spanyol?",
    options: ["Buenas noches", "Buenos días", "Buenas tardes", "Adiós"],
    correct: 1,
    explanation: "'Buenos días' = selamat pagi. 'Buenas tardes' = selamat sore, 'Buenas noches' = selamat malam.",
  },
  {
    id: "es2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "la casa", right: "rumah" },
      { left: "el agua", right: "air" },
      { left: "el pan", right: "roti" },
      { left: "el gato", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Nomina bergender: el (maskulin) / la (feminin).",
  },
  {
    id: "es3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Yo ___ estudiante.' (Saya seorang mahasiswa.)",
    context: "Konjugasi verba 'ser' untuk 'yo'.",
    options: ["soy", "eres", "es", "ser"],
    correct: "soy",
    explanation: "Verba 'ser': yo soy, tú eres, él/ella es. Untuk 'yo' → 'soy'.",
  },
  {
    id: "es4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya suka kopi.",
    tokens: ["gusta", "el", "Me", "café"],
    correct: ["Me", "gusta", "el", "café"],
    explanation: "'Me gusta el café'. Struktur 'gustar' unik: 'me gusta' + benda tunggal.",
  },

  // [placement-listening-v1] Listening A1 — melengkapi (pasangan minimal perro/pero)
  {
    id: "l1", difficulty: "A1", type: "fillChoice",
    audio: { lang: "es", text: "¡Hola! Me llamo Carlos y vivo en Sevilla. Tengo un perro y dos gatos en casa." },
    question: "Dengarkan audio, lalu lengkapi: 'Tengo un ___ y dos gatos.'",
    context: "Pilih kata yang kamu dengar.",
    options: ["pero", "perro", "pelo", "burro"],
    correct: "perro",
    explanation: "Transkrip: '¡Hola! Me llamo Carlos y vivo en Sevilla. Tengo un perro y dos gatos en casa.' (Halo! Nama saya Carlos dan saya tinggal di Sevilla. Saya punya seekor anjing dan dua kucing di rumah.) Awas pasangan mirip: 'perro' (rr bergetar panjang) = anjing, 'pero' (r tunggal) = tetapi. 'pelo' = rambut, 'burro' = keledai.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "es5", difficulty: "A2", type: "multiple",
    question: "'Ayer ___ en un restaurante.' (comer, pretérito untuk 'yo')",
    options: ["como", "comí", "comía", "comeré"],
    correct: 1,
    explanation: "Pretérito indefinido 'comer' untuk 'yo' → 'comí' (aksi selesai di masa lampau).",
  },
  {
    id: "es6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat pretérito:",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["fui", "Ayer", "la", "a", "escuela"],
    correct: ["Ayer", "fui", "a", "la", "escuela"],
    explanation: "'ir' di pretérito untuk 'yo' → 'fui' (bentuknya sama dgn 'ser'). 'Ayer fui a la escuela'.",
  },
  {
    id: "es7", difficulty: "A2", type: "missing",
    question: "Ser vs Estar — lengkapi:",
    template: "Mi hermana ___ médica y ahora ___ en el hospital.",
    blanks: ["es", "está"],
    options: ["es", "está", "son", "están", "ser", "estar"],
    explanation: "'ser' untuk profesi/identitas ('es médica'), 'estar' untuk lokasi ('está en el hospital').",
  },
  {
    id: "es8", difficulty: "A2", type: "fillChoice",
    question: "'He vivido aquí ___ cinco años.' (Saya sudah tinggal di sini selama 5 tahun.)",
    context: "Pilih preposisi durasi.",
    options: ["desde", "hace", "durante", "por"],
    correct: "durante",
    explanation: "'durante' menyatakan durasi. 'desde' = sejak (titik waktu), 'hace' = ... yang lalu.",
  },
  {
    id: "es9", difficulty: "A2", type: "multiple",
    question: "'Deberías ___ al médico.' (Kamu sebaiknya pergi ke dokter.)",
    options: ["vas", "ir", "irás", "fuiste"],
    correct: 1,
    explanation: "Setelah 'deberías' pakai infinitif → 'ir'. 'Deberías ir al médico' = saran.",
  },

  // [placement-listening-v1] Listening A2 — detail informasi (jam + peron)
  {
    id: "l2", difficulty: "A2", type: "multiple",
    audio: { lang: "es", text: "Atención, por favor. El tren con destino a Madrid sale a las nueve y cuarto del andén tres. El viaje dura dos horas." },
    question: "Dengarkan pengumuman. Jam berapa keretanya berangkat, dan dari peron berapa?",
    options: [
      "Jam 09.45, peron 3",
      "Jam 02.00, peron 3",
      "Jam 09.15, peron 3",
      "Jam 09.15, peron 2",
    ],
    correct: 2,
    explanation: "Transkrip: 'Atención, por favor. El tren con destino a Madrid sale a las nueve y cuarto del andén tres. El viaje dura dos horas.' (Mohon perhatian. Kereta tujuan Madrid berangkat pukul sembilan lewat seperempat dari peron tiga. Perjalanan berlangsung dua jam.) 'Las nueve y cuarto' = 09.15 (09.45 = 'las diez menos cuarto'). 'Dos horas' = LAMA perjalanan, bukan jam berangkat (pengecoh). 'Andén' = peron.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "es10", difficulty: "B1", type: "multiple",
    question: "'Si tuviera dinero, ___ por el mundo.' (2º condicional)",
    options: ["viajo", "viajaré", "viajaría", "viajaba"],
    correct: 2,
    explanation: "Kondisional tipe 2: 'Si + imperfecto de subjuntivo (tuviera), + condicional' → 'viajaría'.",
  },
  {
    id: "es11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pretérito perfecto:",
    translation: "Saya belum pernah melihat film itu.",
    tokens: ["he", "Nunca", "visto", "esa", "película"],
    correct: ["Nunca", "he", "visto", "esa", "película"],
    explanation: "Pretérito perfecto: haber (he) + participio (visto). 'Nunca he visto esa película'.",
  },
  {
    id: "es12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konektor dengan artinya:",
    pairs: [
      { left: "aunque", right: "meskipun" },
      { left: "por lo tanto", right: "oleh karena itu" },
      { left: "sin embargo", right: "namun" },
      { left: "por eso", right: "karena itu" },
    ],
    explanation: "Konektor wacana penting di B1 untuk menghubungkan ide.",
  },
  {
    id: "es13", difficulty: "B1", type: "missing",
    question: "Subjuntivo — lengkapi:",
    template: "Espero que ___ bien y que ___ pronto.",
    blanks: ["estés", "vengas"],
    options: ["estés", "vengas", "estás", "vienes", "estar", "venir"],
    explanation: "Setelah 'espero que' (harapan) pakai subjuntivo: 'estés', 'vengas'.",
  },
  {
    id: "es14", difficulty: "B1", type: "fillChoice",
    question: "'Es la persona ___ me ayudó ayer.' (Relativo)",
    context: "Pilih kata ganti relatif.",
    options: ["que", "quien", "cual", "cuyo"],
    correct: "que",
    explanation: "'que' adalah relatif paling umum untuk orang & benda. 'la persona que me ayudó'.",
  },

  // [placement-listening-v1] Listening B1 — menerjemahkan (cuando/para que + subjuntivo)
  {
    id: "l3", difficulty: "B1", type: "multiple",
    audio: { lang: "es", text: "Cuando llegues a casa, llámame para que sepa que estás bien." },
    question: "Dengarkan audio. Pilih terjemahan yang paling tepat:",
    options: [
      "Waktu kamu sampai di rumah, kamu meneleponku dan bilang kamu baik-baik saja.",
      "Nanti kalau kamu sudah sampai di rumah, telepon aku supaya aku tahu kamu baik-baik saja.",
      "Kalau aku sudah sampai di rumah, aku akan meneleponmu supaya kamu tahu aku baik-baik saja.",
      "Begitu sampai di rumah, telepon aku kalau kamu merasa tidak enak badan.",
    ],
    correct: 1,
    explanation: "Transkrip: 'Cuando llegues a casa, llámame para que sepa que estás bien.' 'Cuando + subjuntivo (llegues)' = saat yang BELUM terjadi (nanti kalau sudah sampai), bukan kejadian lampau ('cuando llegaste'). 'Llámame' = perintah 'teleponlah aku', dan 'para que + subjuntivo (sepa)' = supaya aku tahu. Opsi 'kalau aku sampai…' salah subjek: 'llegues' = kamu (tú), 'sepa' = aku (yo).",
  },
  // [placement-listening-v1] Listening B1 — dikte 2 kata (pengecoh bunyi mirip)
  {
    id: "l4", difficulty: "B1", type: "missing",
    audio: { lang: "es", text: "Ayer, cuando llegué a casa, mi madre ya había preparado la cena." },
    question: "Dengarkan audio, lalu isi dua kata yang hilang:",
    template: "Ayer, cuando ___ a casa, mi madre ya ___ preparado la cena.",
    blanks: ["llegué", "había"],
    options: ["llegue", "había", "llegó", "habría", "llegué", "habían"],
    explanation: "Transkrip: 'Ayer, cuando llegué a casa, mi madre ya había preparado la cena.' (Kemarin, waktu saya sampai di rumah, ibu saya sudah menyiapkan makan malam.) 'Llegué' (tekanan di akhir, lle-GUÉ) = saya tiba (pretérito); 'llegue' (lle-GUE, tanpa aksen) = subjuntivo, 'llegó' = dia tiba. 'Había preparado' = pluscuamperfecto (sudah menyiapkan sebelum kejadian lain); 'habría' = akan sudah (condicional), 'habían' = mereka.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "es15", difficulty: "B2", type: "multiple",
    question: "'Si lo hubiera sabido, ___.' (3er condicional)",
    options: [
      "actuaría diferente",
      "habría actuado diferente",
      "actué diferente",
      "actuaba diferente",
    ],
    correct: 1,
    explanation: "Kondisional tipe 3: 'Si + pluscuamperfecto de subjuntivo, + condicional compuesto' → 'habría actuado'.",
  },
  {
    id: "es16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan pronombres (le/lo):",
    translation: "Saya sudah memberikannya (buku) kepadanya.",
    tokens: ["lo", "Se", "dado", "he"],
    correct: ["Se", "lo", "he", "dado"],
    explanation: "Ketika 'le' + 'lo' bertemu, 'le' berubah jadi 'se': 'Se lo he dado'.",
  },
  {
    id: "es17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "La nueva política va a ___ las consecuencias, mientras que la antigua solo las ___.",
    blanks: ["mitigar", "agravaría"],
    options: ["mitigar", "agravaría", "generar", "reforzar", "estabilizar", "impedir"],
    explanation: "'mitigar' = meredakan, 'agravar' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "es18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan nominalización (gaya formal)?",
    options: [
      "Decidió rápidamente.",
      "Su decisión fue rápida.",
      "Ella decide rápido.",
      "Rápidamente, decidió.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'decidir' → nomina 'decisión'. Ciri gaya tulisan formal/akademis.",
  },

  // [placement-listening-v1] Listening B2 — HOTS: menyimpulkan maksud pengumuman
  {
    id: "l5", difficulty: "B2", type: "multiple",
    audio: { lang: "es", text: "El ayuntamiento ha anunciado que el metro será gratuito durante todo el mes de agosto. Sin embargo, la línea dos permanecerá cerrada por obras hasta septiembre, por lo que se recomienda utilizar el autobús." },
    question: "Dengarkan potongan pengumuman ini. Kesimpulan yang PALING masuk akal adalah:",
    options: [
      "Semua jalur metro gratis dan beroperasi normal sepanjang Agustus.",
      "Metro ditutup total selama Agustus karena ada perbaikan.",
      "Bus kota menjadi gratis sampai September sebagai pengganti metro.",
      "Metro gratis selama Agustus, tapi pengguna jalur 2 sebaiknya naik bus karena jalurnya ditutup.",
    ],
    correct: 3,
    explanation: "Transkrip: 'El ayuntamiento ha anunciado que el metro será gratuito durante todo el mes de agosto. Sin embargo, la línea dos permanecerá cerrada por obras hasta septiembre, por lo que se recomienda utilizar el autobús.' (Pemerintah kota mengumumkan metro akan gratis sepanjang bulan Agustus. Namun, jalur dua tetap ditutup karena pekerjaan konstruksi sampai September, sehingga disarankan menggunakan bus.) Kuncinya 'sin embargo' = namun: metro memang gratis, TAPI jalur 2 tutup → penumpangnya dialihkan ke bus. Yang ditutup hanya jalur 2 (bukan total), dan tidak disebut bus menjadi gratis.",
  },
];
