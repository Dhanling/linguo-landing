import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// LATIN PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Latin klasik: fokus deklinasi, konjugasi, dan kutipan/peribahasa terkenal.
// ─────────────────────────────────────────────────────────────────────────────
export const latinPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Salve!' adalah:",
    options: ["Selamat tinggal", "Halo / Salam", "Terima kasih", "Silakan"],
    correct: 1,
    explanation: "'Salve!' = halo (sapaan untuk satu orang; 'Salvete!' untuk banyak orang). 'Vale!' = selamat tinggal, 'Gratias (tibi ago)' = terima kasih.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Latin dengan artinya:",
    pairs: [
      { left: "unus", right: "1" },
      { left: "tres", right: "3" },
      { left: "quinque", right: "5" },
      { left: "decem", right: "10" },
    ],
    explanation: "Angka Latin ini hidup sampai sekarang: unus → 'uni-', tres → 'tri-', quinque → 'quint-', decem → 'desimal'.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Ego discipulus ___.' — Saya seorang murid.",
    context: "Kata kerja 'adalah' (esse) untuk orang pertama.",
    options: ["sum", "es", "est", "sumus"],
    correct: "sum",
    explanation: "'sum' = saya adalah (orang ke-1 tunggal). 'es' = kamu adalah, 'est' = dia adalah, 'sumus' = kami adalah. Konjugasi verba esse wajib hafal.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Gadis itu mencintai mawar.",
    tokens: ["rosam", "amat", "Puella"],
    correct: ["Puella", "rosam", "amat"],
    explanation: "Urutan klasik Latin adalah SOV: Puella (subjek, nominatif) + rosam (objek, AKUSATIF -am) + amat (verba). Kasuslah — bukan urutan kata — yang menentukan fungsi.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Bentuk perfectum (lampau selesai) dari 'video' (saya melihat) adalah:",
    options: ["videbo", "vidi", "videbam", "visum"],
    correct: 1,
    explanation: "'vidi' = saya telah melihat (perfectum). 'videbam' = imperfectum (dulu sedang/biasa melihat), 'videbo' = futurum (akan melihat), 'visum' = supinum/partisip.",
  },
  {
    id: "q6", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Marcus ___ aquam dat.' — Marcus memberi air kepada gadis itu.",
    context: "Pilih kasus yang tepat untuk objek tak langsung (penerima).",
    options: ["puella", "puellam", "puellae", "puellarum"],
    correct: "puellae",
    explanation: "Penerima memakai kasus DATIF: 'puellae' = kepada gadis itu. 'puella' = nominatif (subjek), 'puellam' = akusatif (objek langsung), 'puellarum' = genitif jamak (para gadis punya).",
  },
  {
    id: "q7", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Di sekolah kami membaca buku-buku.",
    tokens: ["libros", "In", "legimus", "schola"],
    correct: ["In", "schola", "libros", "legimus"],
    explanation: "'In' + ablatif ('schola') = di sekolah. Lalu objek akusatif jamak 'libros' dan verba 'legimus' (kami membaca) di akhir — pola SOV khas Latin.",
  },
  {
    id: "q8", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan bentuk perfectum yang tepat:",
    template: "Heri Marcus in foro ___ et multa ___. (Kemarin Marcus berjalan-jalan di forum dan membeli banyak barang.)",
    blanks: ["ambulavit", "emit"],
    options: ["ambulavit", "ambulat", "ambulabit", "emit", "emet", "vendidit"],
    explanation: "'Heri' (kemarin) menuntut perfectum: 'ambulavit' = telah berjalan, 'emit' = telah membeli. Pengecoh: 'ambulat' = kini, 'ambulabit'/'emet' = futur, 'vendidit' = telah MENJUAL (kebalikannya).",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'Quamquam pluit, tamen ambulo.':",
    options: [
      "Karena hujan, saya berjalan",
      "Meskipun hujan, saya tetap berjalan",
      "Kalau hujan, saya berjalan",
      "Setelah hujan, saya berjalan",
    ],
    correct: 1,
    explanation: "'Quamquam' = meskipun (konsesif), 'tamen' = namun/tetap. 'pluit' = hujan turun. Pasangan quamquam … tamen … sangat produktif di Latin.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Latin dengan artinya:",
    pairs: [
      { left: "sed", right: "tetapi" },
      { left: "quia", right: "karena" },
      { left: "si", right: "jika" },
      { left: "dum", right: "sementara / selagi" },
    ],
    explanation: "Konjungsi inti kalimat majemuk: 'sed' kontras, 'quia' sebab, 'si' syarat, 'dum' waktu. Menguasainya membuka jalan membaca teks asli.",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'Liber a magistro ___.' — Buku itu dibaca oleh guru.",
    context: "Pilih bentuk pasif yang tepat.",
    options: ["legitur", "legit", "legunt", "legere"],
    correct: "legitur",
    explanation: "Pasif kini orang ke-3 tunggal berakhiran '-tur': 'legitur' = dibaca. Pelaku memakai 'a/ab' + ablatif ('a magistro'). 'legit' = dia membaca (aktif), 'legunt' = mereka membaca, 'legere' = infinitif.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi dengan komparatif dan superlatif:",
    template: "Marcus ___ est quam Titus; omnium ___ est. (Marcus lebih tinggi daripada Titus; ia yang tertinggi dari semuanya.)",
    blanks: ["altior", "altissimus"],
    options: ["altior", "altissimus", "altus", "altiorem", "alte", "altissime"],
    explanation: "Komparatif '-ior' + 'quam' = lebih … daripada; superlatif '-issimus' = paling …. 'altus' = bentuk dasar, 'altiorem' = komparatif akusatif (salah kasus di sini), 'alte'/'altissime' = adverbia.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kutipan Julius Caesar 'Veni, vidi, vici' berarti:",
    options: [
      "Saya datang, saya melihat, saya menang",
      "Saya hidup, saya belajar, saya berjaya",
      "Datanglah, lihatlah, menanglah",
      "Saya akan datang, melihat, dan menang",
    ],
    correct: 0,
    explanation: "Tiga verba perfectum orang ke-1 tunggal: veni (venio), vidi (video), vici (vinco) — laporan kilat kemenangan Caesar di Zela (47 SM). Bukan imperatif ('datanglah') dan bukan futur.",
  },
  {
    id: "q14", difficulty: "B2", type: "multiple",
    question: "Konstruksi 'Urbe capta, cives fugerunt.' paling tepat diterjemahkan:",
    options: [
      "Warga merebut kota lalu melarikan diri",
      "Setelah kota direbut, para warga melarikan diri",
      "Kota itu melarikan diri dari warganya",
      "Para warga merebut kota agar bisa melarikan diri",
    ],
    correct: 1,
    explanation: "'Urbe capta' adalah ABLATIVUS ABSOLUTUS (nomina + partisip pasif dalam ablatif): 'setelah/karena kota direbut'. Klausa ini mandiri dari subjek utama 'cives' — ciri khas prosa Latin klasik.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'Festina lente' — 'bergegaslah perlahan-lahan' — paling dekat maknanya dengan:",
    options: [
      "Tong kosong nyaring bunyinya",
      "Biar lambat asal selamat",
      "Sambil menyelam minum air",
      "Air beriak tanda tak dalam",
    ],
    correct: 1,
    explanation: "'Festina' (imperatif festinare = bergegas) + 'lente' (adverbia = perlahan): kerjakan dengan sigap tapi hati-hati, jangan gegabah. Motto kesayangan Kaisar Augustus.",
  },
];
