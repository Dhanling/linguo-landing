// ─────────────────────────────────────────────────────────────────────────────
// FRENCH (Français) PLACEMENT TEST — 23 soal, mixed types (5 di antaranya listening)
// Distribusi: A1×5 · A2×6 · B1×7 · B2×5 (skor dinormalisasi ke skala 45)
// [placement-listening-v1] Soal ber-`audio` dibunyikan Chirp fr lewat /api/tts;
// transkrip sengaja cuma ada di `audio.text` + pembahasan, tidak di layar soal.
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const frenchPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "fr1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'selamat pagi/halo (siang hari)' dalam bahasa Prancis?",
    options: ["Bonne nuit", "Bonjour", "Au revoir", "Merci"],
    correct: 1,
    explanation: "'Bonjour' = halo/selamat pagi. 'Au revoir' = sampai jumpa, 'Merci' = terima kasih.",
  },
  {
    id: "fr2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "la maison", right: "rumah" },
      { left: "l'eau", right: "air" },
      { left: "le pain", right: "roti" },
      { left: "le chat", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Setiap nomina punya gender: le (maskulin) / la (feminin).",
  },
  {
    id: "fr3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Je ___ étudiant.' (Saya seorang mahasiswa.)",
    context: "Konjugasi verba 'être' (menjadi) untuk 'je'.",
    options: ["suis", "es", "est", "être"],
    correct: "suis",
    explanation: "Verba 'être': je suis, tu es, il/elle est. Untuk 'je' → 'suis'.",
  },
  {
    id: "fr4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya suka kopi.",
    tokens: ["aime", "le", "J'", "café"],
    correct: ["J'", "aime", "le", "café"],
    explanation: "'J'aime le café'. Verba 'aimer' + artikel tentu 'le' untuk menyatakan suka secara umum.",
  },

  // [placement-listening-v1] Listening A1 — melengkapi (pasangan minimal deux/des)
  {
    id: "l1", difficulty: "A1", type: "fillChoice",
    audio: { lang: "fr", text: "Bonjour ! Je m'appelle Julie. J'habite à Lyon et j'ai deux chats." },
    question: "Dengarkan audio, lalu lengkapi: 'J'ai ___ chats.'",
    context: "Pilih kata yang kamu dengar.",
    options: ["des", "deux", "douze", "trois"],
    correct: "deux",
    explanation: "Transkrip: 'Bonjour ! Je m'appelle Julie. J'habite à Lyon et j'ai deux chats.' (Halo! Nama saya Julie. Saya tinggal di Lyon dan punya dua ekor kucing.) Awas pasangan mirip: 'deux' [dø] = dua, 'des' [de] = beberapa (artikel jamak) — bedanya cuma bunyi vokal 'eu' vs 'é'. 'douze' = dua belas, 'trois' = tiga.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "fr5", difficulty: "A2", type: "multiple",
    question: "'Hier, j'___ mangé au restaurant.' (Passé composé)",
    options: ["ai", "suis", "as", "est"],
    correct: 0,
    explanation: "Passé composé 'manger' pakai auxiliary 'avoir' → 'j'ai mangé'. Untuk 'je' = 'ai'.",
  },
  {
    id: "fr6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat Passé composé (dgn 'être'):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["suis", "Je", "hier", "allé", "à", "l'école"],
    correct: ["Je", "suis", "allé", "hier", "à", "l'école"],
    explanation: "Verba gerak 'aller' pakai 'être' di passé composé: 'je suis allé(e)'.",
  },
  {
    id: "fr7", difficulty: "A2", type: "missing",
    question: "Lengkapi dengan verba yang tepat:",
    template: "Elle ___ du café le matin, mais aujourd'hui elle ___ du thé.",
    blanks: ["boit", "boit"],
    options: ["boit", "bois", "boivent", "buvait", "a bu", "boire"],
    explanation: "Verba 'boire' untuk il/elle → 'boit' (present untuk rutinitas & aksi sekarang).",
  },
  {
    id: "fr8", difficulty: "A2", type: "fillChoice",
    question: "'Je vais ___ Paris demain.' (Saya akan ke Paris besok.)",
    context: "Pilih preposisi untuk nama kota.",
    options: ["à", "en", "au", "dans"],
    correct: "à",
    explanation: "Untuk nama kota pakai 'à' → 'à Paris'. 'en' untuk negara feminin, 'au' untuk negara maskulin.",
  },
  {
    id: "fr9", difficulty: "A2", type: "multiple",
    question: "'Tu ___ voir un médecin.' (kamu sebaiknya menemui dokter — saran)",
    options: ["dois", "devrais", "peux", "veux"],
    correct: 1,
    explanation: "'devrais' (conditionnel dari devoir) menyatakan saran, mirip 'should'.",
  },

  // [placement-listening-v1] Listening A2 — detail informasi (jam + nomor jalur)
  {
    id: "l2", difficulty: "A2", type: "multiple",
    audio: { lang: "fr", text: "Mesdames et messieurs, le train pour Marseille part à dix heures quinze, voie numéro trois. Attention, le train de neuf heures est annulé." },
    question: "Dengarkan pengumuman. Jam berapa kereta ke Marseille berangkat, dan dari jalur berapa?",
    options: [
      "Jam 09.00, jalur 3",
      "Jam 10.50, jalur 3",
      "Jam 10.15, jalur 3",
      "Jam 10.15, jalur 13",
    ],
    correct: 2,
    explanation: "Transkrip: 'Mesdames et messieurs, le train pour Marseille part à dix heures quinze, voie numéro trois. Attention, le train de neuf heures est annulé.' (Bapak-bapak dan ibu-ibu, kereta ke Marseille berangkat pukul 10.15, jalur nomor 3. Perhatian, kereta pukul 09.00 dibatalkan.) 'dix heures quinze' = 10.15 — jangan tertukar 'quinze' (15) dengan 'cinquante' (50). Jam 09.00 adalah kereta yang DIBATALKAN (pengecoh), dan 'trois' = 3, bukan 'treize' (13).",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "fr10", difficulty: "B1", type: "multiple",
    question: "'Si j'avais le temps, je ___ plus.' (2ème conditionnel)",
    options: ["voyage", "voyagerai", "voyagerais", "voyageais"],
    correct: 2,
    explanation: "Kondisional tipe 2: 'Si + imparfait, ... conditionnel présent' → 'voyagerais'.",
  },
  {
    id: "fr11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif (voix passive):",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["a", "été", "La", "écrite", "lettre", "hier"],
    correct: ["La", "lettre", "a", "été", "écrite", "hier"],
    explanation: "Passif: sujet + être (terkonjugasi) + participe passé. 'écrite' setuju gender feminin dgn 'lettre'.",
  },
  {
    id: "fr12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan ungkapan dengan artinya:",
    pairs: [
      { left: "tout de suite", right: "segera" },
      { left: "d'habitude", right: "biasanya" },
      { left: "en même temps", right: "pada saat yang sama" },
      { left: "de temps en temps", right: "kadang-kadang" },
    ],
    explanation: "Ekspresi keterangan waktu yang umum di level B1.",
  },
  {
    id: "fr13", difficulty: "B1", type: "missing",
    question: "Kata ganti relatif — lengkapi:",
    template: "C'est le livre ___ j'ai acheté et ___ est très intéressant.",
    blanks: ["que", "qui"],
    options: ["que", "qui", "dont", "où", "quoi", "lequel"],
    explanation: "'que' = objek langsung, 'qui' = subjek. 'le livre que j'ai acheté / qui est intéressant'.",
  },
  {
    id: "fr14", difficulty: "B1", type: "fillChoice",
    question: "'Il faut que tu ___ à l'heure.' (Subjonctif)",
    context: "Verba 'être' dalam subjonctif untuk 'tu'.",
    options: ["es", "sois", "seras", "étais"],
    correct: "sois",
    explanation: "Setelah 'il faut que' pakai subjonctif. 'être' → que tu sois.",
  },

  // [placement-listening-v1] Listening B1 — menerjemahkan (plus-que-parfait)
  {
    id: "l3", difficulty: "B1", type: "multiple",
    audio: { lang: "fr", text: "Quand je suis arrivé à la gare, le train était déjà parti." },
    question: "Dengarkan audio. Pilih terjemahan yang paling tepat:",
    options: [
      "Ketika saya tiba di stasiun, keretanya baru akan berangkat.",
      "Ketika saya tiba di stasiun, keretanya sudah berangkat.",
      "Saya tiba di stasiun tepat saat keretanya berangkat.",
      "Ketika keretanya berangkat, saya sudah tiba di stasiun.",
    ],
    correct: 1,
    explanation: "Transkrip: 'Quand je suis arrivé à la gare, le train était déjà parti.' Pola plus-que-parfait 'était parti' (imparfait être + participe passé) = kejadian yang SUDAH selesai sebelum kejadian lampau lain ('je suis arrivé'). Jadi kereta berangkat lebih dulu, baru saya tiba. Opsi 'baru akan berangkat' butuh 'allait partir', 'tepat saat' butuh 'au moment où le train partait', dan opsi terakhir membalik urutan kejadiannya.",
  },
  // [placement-listening-v1] Listening B1 — dikte 2 kata (pengecoh bunyi mirip/homofon)
  {
    id: "l4", difficulty: "B1", type: "missing",
    audio: { lang: "fr", text: "Ils ont décidé de partir en vacances au mois d'août, mais ils n'ont pas encore réservé l'hôtel." },
    question: "Dengarkan audio, lalu isi dua kata yang hilang:",
    template: "Ils ___ décidé de partir en vacances au mois d'août, mais ils n'ont pas encore ___ l'hôtel.",
    blanks: ["ont", "réservé"],
    options: ["sont", "réserver", "ont", "réservez", "on", "réservé"],
    explanation: "Transkrip: 'Ils ont décidé de partir en vacances au mois d'août, mais ils n'ont pas encore réservé l'hôtel.' (Mereka sudah memutuskan berlibur pada bulan Agustus, tapi mereka belum memesan hotelnya.) 'ils ont' dibaca [il-zɔ̃] (liaison bunyi z), sedangkan 'ils sont' [il-sɔ̃] (bunyi s) — lagi pula 'décider' memakai auxiliary avoir. 'réservé', 'réserver', dan 'réservez' bunyinya sama persis; setelah 'n'ont pas encore' (passé composé) wajib participe passé 'réservé'.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "fr15", difficulty: "B2", type: "multiple",
    question: "'Si j'avais su, je ___.' (conditionnel passé)",
    options: [
      "serais venu",
      "aurais agi différemment",
      "agirais différemment",
      "avais agi différemment",
    ],
    correct: 1,
    explanation: "Kondisional tipe 3: 'Si + plus-que-parfait, conditionnel passé' → 'aurais agi'.",
  },
  {
    id: "fr16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan pronom (ordre des pronoms):",
    translation: "Saya sudah memberikannya (buku) kepadanya.",
    tokens: ["le", "Je", "donné", "lui", "ai"],
    correct: ["Je", "le", "lui", "ai", "donné"],
    explanation: "Urutan pronom: COD (le) sebelum COI (lui) di depan auxiliary. 'Je le lui ai donné.'",
  },
  {
    id: "fr17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "La nouvelle mesure va ___ les conséquences, alors que l'ancienne ne ferait que les ___.",
    blanks: ["atténuer", "aggraver"],
    options: ["atténuer", "aggraver", "générer", "renforcer", "stabiliser", "empêcher"],
    explanation: "'atténuer' = meredakan, 'aggraver' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "fr18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan gaya formal (nominalisation)?",
    options: [
      "Elle a décidé rapidement.",
      "Sa décision a été rapide.",
      "Elle décide vite.",
      "Rapidement, elle a décidé.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'décider' → nomina 'décision'. Ciri gaya tulisan formal/akademis.",
  },

  // [placement-listening-v1] Listening B2 — HOTS: menyimpulkan maksud pengumuman
  {
    id: "l5", difficulty: "B2", type: "multiple",
    audio: { lang: "fr", text: "La mairie annonce que la piscine municipale restera ouverte tout l'été. Cependant, à cause des travaux, le grand bassin sera fermé jusqu'à fin juillet, et le petit bassin sera réservé aux enfants." },
    question: "Dengarkan pengumuman ini. Kesimpulan yang PALING masuk akal adalah:",
    options: [
      "Kolam renang kota ditutup total sampai akhir Juli.",
      "Anak-anak dilarang berenang selama musim panas karena ada renovasi.",
      "Renovasi sudah selesai, jadi semua orang bisa berenang sepanjang musim panas.",
      "Kolamnya tetap buka, tapi sampai akhir Juli orang dewasa praktis belum bisa berenang di sana.",
    ],
    correct: 3,
    explanation: "Transkrip: 'La mairie annonce que la piscine municipale restera ouverte tout l'été. Cependant, à cause des travaux, le grand bassin sera fermé jusqu'à fin juillet, et le petit bassin sera réservé aux enfants.' (Pemkot mengumumkan kolam renang kota tetap buka sepanjang musim panas. Namun, karena ada pekerjaan renovasi, kolam besar ditutup sampai akhir Juli, dan kolam kecil khusus untuk anak-anak.) Kuncinya 'cependant' = namun: kolam secara resmi BUKA, tapi kolam besar tutup dan kolam kecil 'réservé aux enfants' → orang dewasa belum bisa berenang sampai akhir Juli. Kolam tidak ditutup total ('restera ouverte'), anak-anak justru boleh, dan renovasi ('travaux') masih berlangsung.",
  },
];
