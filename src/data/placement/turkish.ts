// ─────────────────────────────────────────────────────────────────────────────
// TURKISH (Türkçe) PLACEMENT TEST — 18 soal, mixed types
// Distribusi: A1×4 · A2×5 · B1×5 · B2×4 (max 45)
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const turkishPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "tr1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'halo' dalam bahasa Turki?",
    options: ["Hoşça kal", "Merhaba", "İyi geceler", "Teşekkürler"],
    correct: 1,
    explanation: "'Merhaba' = halo. 'Hoşça kal' = sampai jumpa, 'Teşekkürler' = terima kasih.",
  },
  {
    id: "tr2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "ev", right: "rumah" },
      { left: "su", right: "air" },
      { left: "ekmek", right: "roti" },
      { left: "kedi", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Turki tidak punya gender & artikel tentu.",
  },
  {
    id: "tr3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Ben öğrenci___.' (Saya seorang mahasiswa.)",
    context: "Akhiran predikat 'saya adalah' untuk 'ben'.",
    options: ["yim", "sin", "dir", "ler"],
    correct: "yim",
    explanation: "Akhiran orang ke-1 tunggal: '-(y)im'. 'öğrenciyim' = saya (adalah) mahasiswa.",
  },
  {
    id: "tr4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya kopi minum. (Saya minum kopi.)",
    tokens: ["içiyorum", "Ben", "kahve"],
    correct: ["Ben", "kahve", "içiyorum"],
    explanation: "Urutan SOV: subjek + objek + verba. 'Ben kahve içiyorum'.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "tr5", difficulty: "A2", type: "multiple",
    question: "'Dün futbol ___.' (oynamak, geçmiş zaman/past untuk 'ben')",
    options: ["oynuyorum", "oynadım", "oynayacağım", "oynarım"],
    correct: 1,
    explanation: "Past tense '-di': 'oynadım' = saya bermain (kemarin). Vowel harmony: oyna+dı+m.",
  },
  {
    id: "tr6", difficulty: "A2", type: "missing",
    question: "Hal ekleri (kasus arah/lokasi) — lengkapi:",
    template: "Okul___ gidiyorum ve ev___ değilim.",
    blanks: ["a", "de"],
    options: ["a", "de", "dan", "ı", "e", "da"],
    explanation: "'-a/-e' = ke (okula = ke sekolah), '-de/-da' = di (evde = di rumah). Vowel harmony menentukan.",
  },
  {
    id: "tr7", difficulty: "A2", type: "fillChoice",
    question: "'Benim bir arabam ___.' (Saya punya sebuah mobil.)",
    context: "Struktur kepemilikan Turki.",
    options: ["var", "yok", "değil", "oldu"],
    correct: "var",
    explanation: "Kepemilikan: 'Benim ... var' (ada). Benda dpt akhiran posesif -(ı)m: 'arabam'.",
  },
  {
    id: "tr8", difficulty: "A2", type: "multiple",
    question: "'Bu ev şundan daha ___.' (rumah ini lebih besar)",
    options: ["büyük", "büyükçe", "en büyük", "büyümek"],
    correct: 0,
    explanation: "Komparatif pakai 'daha' + kata sifat: 'daha büyük'. Superlatif pakai 'en'.",
  },
  {
    id: "tr9", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat future (gelecek zaman):",
    translation: "Besok saya akan pergi ke sekolah.",
    tokens: ["gideceğim", "Yarın", "okula"],
    correct: ["Yarın", "okula", "gideceğim"],
    explanation: "Future '-ecek/-acak': 'gideceğim' = saya akan pergi. 'Yarın okula gideceğim'.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "tr10", difficulty: "B1", type: "multiple",
    question: "'Vaktim ___, daha çok seyahat ederdim.' (şart/kondisional)",
    options: ["var", "olsa", "oldu", "olacak"],
    correct: 1,
    explanation: "Pengandaian: 'Vaktim olsa (şart), daha çok seyahat ederdim' (aorist + -di).",
  },
  {
    id: "tr11", difficulty: "B1", type: "missing",
    question: "Ortaç (participle -en/-dik) — lengkapi:",
    template: "Dün ___ (görmek) adam komşum. Bu ___ (okumak) kitap güzel.",
    blanks: ["gördüğüm", "okuduğum"],
    options: ["gördüğüm", "okuduğum", "gören", "okuyan", "görmek", "okumak"],
    explanation: "Object participle '-dik' + posesif: 'gördüğüm' (yang saya lihat), 'okuduğum' (yang saya baca).",
  },
  {
    id: "tr12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konektor dengan artinya:",
    pairs: [
      { left: "çünkü", right: "karena" },
      { left: "rağmen", right: "meskipun" },
      { left: "böylece", right: "dengan demikian" },
      { left: "iken", right: "ketika/sementara" },
    ],
    explanation: "Konektor wacana penting di B1.",
  },
  {
    id: "tr13", difficulty: "B1", type: "multiple",
    question: "'Ali ___.' — untuk mengabarkan sesuatu yang TIDAK kita saksikan langsung (duyulan geçmiş / evidential).",
    options: ["geldi", "geliyor", "gelmiş", "gelecek"],
    correct: 2,
    explanation: "Akhiran '-miş' menandai kabar tak langsung/kesimpulan: 'gelmiş' = (katanya/rupanya) dia sudah datang.",
  },
  {
    id: "tr14", difficulty: "B1", type: "multiple",
    question: "'Doktora ___.' (Kamu sebaiknya pergi ke dokter — saran)",
    options: ["gidersin", "gitmelisin", "gittin", "gidiyorsun"],
    correct: 1,
    explanation: "'-meli/-malı' menyatakan keharusan/saran: 'gitmelisin' = kamu sebaiknya/harus pergi.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "tr15", difficulty: "B2", type: "multiple",
    question: "'Bilseydim, ___.' (geçmişe yönelik şart)",
    options: [
      "farklı davranırım",
      "farklı davranırdım",
      "farklı davrandım",
      "farklı davranacağım",
    ],
    correct: 1,
    explanation: "Pengandaian lampau tidak nyata: 'Bilseydim, farklı davranırdım' (aorist + -di = would have).",
  },
  {
    id: "tr16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat pasif (edilgen çatı):",
    translation: "Buku itu geçen yıl (tahun lalu) ditulis.",
    tokens: ["yazıldı", "Kitap", "geçen yıl"],
    correct: ["Kitap", "geçen yıl", "yazıldı"],
    explanation: "Pasif '-il/-in': 'yazmak' → 'yazıldı' (ditulis). 'Kitap geçen yıl yazıldı'.",
  },
  {
    id: "tr17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Yeni politika sonuçları ___, eski politika ise onları sadece ___.",
    blanks: ["hafifletecek", "ağırlaştırırdı"],
    options: ["hafifletecek", "ağırlaştırırdı", "yaratacak", "güçlendirecek", "dengeleyecek", "önleyecek"],
    explanation: "'hafifletmek' = meredakan, 'ağırlaştırmak' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "tr18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan adlaştırma (nominalisasi/gaya formal)?",
    options: [
      "Hızlı karar verdi.",
      "Onun kararı hızlıydı.",
      "O hızlı karar verir.",
      "Hızlıca karar verdi.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'karar vermek' → nomina 'karar'. Ciri gaya tulisan formal.",
  },
];
