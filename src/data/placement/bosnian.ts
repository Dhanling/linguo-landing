// ─────────────────────────────────────────────────────────────────────────────
// BOSNIAN (Bosanski) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// linguo-patch:placement-bosnian-v1
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const bosnianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "bs1", difficulty: "A1", type: "multiple",
    question: "Kamu bertemu dosenmu pukul dua siang. Sapaan mana yang paling pas?",
    options: ["Dobro jutro", "Dobar dan", "Laku noć", "Ćao"],
    correct: 1,
    explanation: "'Dobar dan' = selamat siang, netral & sopan. 'Dobro jutro' untuk pagi, 'Laku noć' saat mau tidur, 'Ćao' hanya untuk teman.",
  },
  {
    id: "bs2", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Mi ___ iz Indonezije.' (Kami dari Indonesia.)",
    context: "Kata kerja 'biti' berubah mengikuti pelakunya.",
    options: ["sam", "si", "smo", "su"],
    correct: "smo",
    explanation: "ja sam · ti si · on/ona je · mi SMO · vi ste · oni su.",
  },
  {
    id: "bs3", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "kuća", right: "rumah" },
      { left: "voda", right: "air" },
      { left: "knjiga", right: "buku" },
      { left: "hljeb", right: "roti" },
    ],
    explanation: "Tiga kata pertama berakhiran -a → jenis ženski. 'hljeb' berakhir konsonan → muški.",
  },
  {
    id: "bs4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi Bosnia.",
    tokens: ["kafu", "Ja", "bosansku", "pijem"],
    correct: ["Ja", "pijem", "bosansku", "kafu"],
    explanation: "Kata sifat di DEPAN kata benda, dan keduanya masuk akuzatif: bosanska kafa → bosansku kafu.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "bs5", difficulty: "A2", type: "multiple",
    question: "Mana kalimat yang benar untuk 'Saya tinggal di Sarajevo'?",
    options: ["Živim u Sarajevo.", "Živim u Sarajevu.", "Živim u Sarajeva.", "Živim na Sarajevu."],
    correct: 1,
    explanation: "Tempat (gdje?) = u + LOKATIF: Sarajevo → u Sarajevu. 'u Sarajevo' (akuzatif) dipakai untuk arah: Idem u Sarajevo.",
  },
  {
    id: "bs6", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Imam dva ___.' (Saya punya dua saudara laki-laki.)",
    context: "Sesudah angka 2, 3, 4 kata benda memakai genitif tunggal.",
    options: ["brat", "brata", "braće", "bratu"],
    correct: "brata",
    explanation: "jedan brat · dva/tri/četiri BRATA (genitif tunggal) · pet braće (genitif jamak).",
  },
  {
    id: "bs7", difficulty: "A2", type: "multiple",
    question: "Amra (perempuan) berkata 'Kemarin saya bekerja'. Mana yang benar?",
    options: ["Jučer sam radio.", "Jučer sam radila.", "Jučer ću raditi.", "Jučer radim."],
    correct: 1,
    explanation: "Partisip perfekt ikut jenis kelamin pelaku: radio (lk) / radila (pr). 'ću raditi' itu futur.",
  },
  {
    id: "bs8", difficulty: "A2", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Besok saya akan pergi ke Mostar.",
    tokens: ["u", "Sutra", "Mostar", "ću", "ići"],
    correct: ["Sutra", "ću", "ići", "u", "Mostar"],
    explanation: "Klitik 'ću' wajib di posisi KEDUA — tepat sesudah 'Sutra'. Arah = u + akuzatif (u Mostar).",
  },
  {
    id: "bs9", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Na posao idem ___.' (Saya berangkat kerja naik trem.)",
    context: "Alat/kendaraan dinyatakan dengan instrumental TANPA kata depan.",
    options: ["tramvaj", "tramvaja", "tramvajem", "tramvaju"],
    correct: "tramvajem",
    explanation: "Instrumental muški: -om / -em (sesudah konsonan lunak seperti j): tramvajem, autobusom, vozom.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "bs10", difficulty: "B1", type: "multiple",
    question: "Lengkapi: 'Svaki dan ___ novine, ali jučer sam za dva sata ___ cijelu knjigu.'",
    options: ["čitam / pročitao", "pročitam / čitao", "čitam / čitao", "pročitam / pročitao"],
    correct: 0,
    explanation: "Kebiasaan (svaki dan) → nesvršeni: čitam. Satu kejadian tuntas dalam batas waktu (za dva sata) → svršeni: pročitao.",
  },
  {
    id: "bs11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'Dao ___ knjigu.' (Saya memberikan buku itu kepadanya — dia laki-laki.)",
    context: "Urutan klitik: kata bantu (selain 'je') → datif → akuzatif.",
    options: ["sam mu", "mu sam", "sam ga", "ga sam"],
    correct: "sam mu",
    explanation: "'sam' mendahului klitik kata ganti, dan 'kepadanya' itu datif = mu (ga = akuzatif 'dia/-nya' sebagai objek).",
  },
  {
    id: "bs12", difficulty: "B1", type: "multiple",
    question: "Lengkapi: 'Kad ___ imao više vremena, putovao bih po cijeloj Bosni.'",
    options: ["bih", "sam", "ću", "jesam"],
    correct: 0,
    explanation: "Pengandaian yang mungkin terjadi: kad + kondicional (kad bih imao…), induk kalimatnya juga kondicional (putovao bih).",
  },
  {
    id: "bs13", difficulty: "B1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Itu kota tempat saya lahir.",
    tokens: ["kojem", "To", "grad", "je", "u", "sam", "rodio", "se"],
    correct: ["To", "je", "grad", "u", "kojem", "sam", "se", "rodio"],
    explanation: "Anak kalimat relatif: u kojem (lokatif). Di dalamnya klitik berurutan 'sam se' tepat sesudah 'u kojem', baru partisip 'rodio'.",
  },
  {
    id: "bs14", difficulty: "B1", type: "matching",
    prompt: "Jodohkan turcizam (serapan Turki) dengan artinya:",
    pairs: [
      { left: "komšija", right: "tetangga" },
      { left: "pendžer", right: "jendela" },
      { left: "čaršija", right: "pusat pasar kota lama" },
      { left: "sevdah", right: "rindu-cinta yang sendu" },
    ],
    explanation: "Turcizmi adalah ciri khas ragam Bosnia. 'komšija' & 'čaršija' netral sehari-hari; 'pendžer' & 'sevdah' bernuansa tradisi & lagu sevdalinka.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "bs15", difficulty: "B2", type: "multiple",
    question: "Lengkapi: '___ kući, sreo sam starog prijatelja.' (Dalam perjalanan pulang, saya bertemu teman lama.)",
    options: ["Vraćajući se", "Vrativši", "Vraćao se", "Vratiti se"],
    correct: 0,
    explanation: "Dua kejadian serentak → glagolski prilog sadašnji (-ći) dari kata kerja nesvršeni: vraćajući se. 'Vrativši se' berarti 'sesudah pulang' — dan 'se'-nya tidak boleh hilang.",
  },
  {
    id: "bs16", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'U razredu ima pet ___.' (Di kelas ada lima anak perempuan.)",
    context: "Angka 5 ke atas menuntut genitif jamak.",
    options: ["djevojka", "djevojke", "djevojaka", "djevojkama"],
    correct: "djevojaka",
    explanation: "Genitif jamak ženski berakhiran -a, dan gugus konsonan -jk- dipecah 'nepostojano a': djevojka → djevojaka.",
  },
  {
    id: "bs17", difficulty: "B2", type: "multiple",
    question: "Temanmu menulis di chat: 'Odoh ja!'. Apa maksudnya?",
    options: ["Aku cabut ya — berangkat sekarang", "Aku sudah lama pergi dari sana", "Aku tidak jadi pergi", "Kamu saja yang pergi"],
    correct: 0,
    explanation: "'Odoh' = aorist dari 'otići'. Dalam percakapan, aorist dipakai untuk tindakan yang baru saja/segera terjadi — hidup di chat walau jarang di tulisan resmi.",
  },
  {
    id: "bs18", difficulty: "B2", type: "multiple",
    question: "Mana kalimat yang sepenuhnya memakai ragam baku BOSNIA?",
    options: [
      "Tko je skuhao kavu ovaj tjedan?",
      "Ko je skuvao kafu ove nedelje?",
      "Ko je skuhao kafu ove sedmice?",
      "Tko je skuvao kafu ove sedmice?",
    ],
    correct: 2,
    explanation: "Bosnia: ko, skuhati (dengan h), kafa/kahva, sedmica. 'tko, kava, tjedan' = Kroasia; 'skuvati, nedelja' (ekavica) = Serbia.",
  },
];
