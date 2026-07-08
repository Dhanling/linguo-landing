import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// KOREAN PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Level selaras TOPIK: A1 ≈ TOPIK 1, A2 ≈ TOPIK 2, B1 ≈ TOPIK 3, B2 ≈ TOPIK 4
// ─────────────────────────────────────────────────────────────────────────────
export const koreanPlacementTest: Question[] = [
  // ═══════════════════════ A1 (TOPIK 1) ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Sapaan yang tepat saat bertemu seseorang dalam bahasa Korea:",
    options: [
      "안녕히 가세요 (annyeonghi gaseyo)",
      "안녕하세요 (annyeonghaseyo)",
      "감사합니다 (gamsahamnida)",
      "잘 자요 (jal jayo)",
    ],
    correct: 1,
    explanation: "'안녕하세요' = halo (formal). '안녕히 가세요' dipakai saat melepas orang yang pergi, '잘 자요' = selamat tidur.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Sino-Korea dengan artinya:",
    pairs: [
      { left: "일 (il)", right: "1" },
      { left: "삼 (sam)", right: "3" },
      { left: "오 (o)", right: "5" },
      { left: "십 (sip)", right: "10" },
    ],
    explanation: "Angka Sino-Korea (일, 이, 삼…) dipakai untuk tanggal, uang, nomor telepon.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: '저 ___ 학생입니다.' (Saya seorang murid.)",
    context: "Partikel penanda topik.",
    options: ["는", "을", "에", "가"],
    correct: "는",
    explanation: "'는' adalah partikel topik setelah kata berakhiran vokal (저 → 저는). Struktur: [Topik] 는 [Info] 입니다.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["밥", "저", "먹어요", "는", "을"],
    correct: ["저", "는", "밥", "을", "먹어요"],
    explanation: "Struktur SOV Korea: Subjek + 는 + Objek + 을 + Kata kerja. '을' = partikel objek setelah konsonan (밥).",
  },

  // ═══════════════════════ A2 (TOPIK 2) ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Bentuk lampau dari '먹어요' (makan):",
    options: [
      "먹어요 (meogeoyo)",
      "먹었어요 (meogeosseoyo)",
      "먹을 거예요 (meogeul geoyeyo)",
      "먹고 있어요 (meokgo isseoyo)",
    ],
    correct: 1,
    explanation: "Bentuk lampau sopan: akar + 았/었어요. '먹었어요' = sudah makan. '먹을 거예요' = akan makan (futur).",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan penghubung -아서/어서 (lalu):",
    translation: "Saya pergi ke sekolah lalu belajar.",
    tokens: ["학교", "공부해요", "가서", "저는", "에"],
    correct: ["저는", "학교", "에", "가서", "공부해요"],
    explanation: "'가서' (dari 가다 + 아서) menghubungkan dua aksi berurutan. '에' = partikel arah/tujuan.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan partikel yang tepat:",
    template: "도서관 ___ 책 ___ 읽어요. (Saya membaca buku di perpustakaan.)",
    blanks: ["에서", "을"],
    options: ["에서", "을", "에", "는", "이", "도"],
    explanation: "'에서' = partikel lokasi tempat beraktivitas. '을' = partikel objek. Ingat: 에 = tujuan diam, 에서 = tempat aksi.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: '저는 커피를 ___ 마셔요.' (Saya tidak minum kopi.)",
    context: "Negasi (tidak).",
    options: ["안", "못", "잘", "또"],
    correct: "안",
    explanation: "'안' + kata kerja = negasi biasa (tidak). '못' = tidak bisa (di luar kemampuan), '잘' = pandai/sering.",
  },

  // ═══════════════════════ B1 (TOPIK 3) ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti kalimat '비가 오지만 나가요.' :",
    options: [
      "Karena hujan, saya keluar",
      "Meskipun hujan, saya tetap keluar",
      "Kalau hujan, saya keluar",
      "Setelah hujan, saya keluar",
    ],
    correct: 1,
    explanation: "'-지만' = tetapi/meskipun. '비가 오지만' = walaupun hujan turun. Bandingkan dengan '-니까' (karena) dan '-면' (kalau).",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat berandai + keinginan:",
    translation: "Kalau ada waktu, saya ingin pergi ke Korea.",
    tokens: ["한국에", "시간이", "가고 싶어요", "있으면"],
    correct: ["시간이", "있으면", "한국에", "가고 싶어요"],
    explanation: "'-(으)면' = kalau/jika. '-고 싶어요' = ingin (melakukan). Klausa syarat mendahului klausa utama.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan pola tata bahasa dengan artinya:",
    pairs: [
      { left: "-아서/어서", right: "karena / lalu" },
      { left: "-(으)면", right: "kalau / jika" },
      { left: "-고 싶다", right: "ingin" },
      { left: "-(으)ㄹ 수 있다", right: "bisa / dapat" },
    ],
    explanation: "Pola penghubung dan modalitas ini adalah inti tata bahasa TOPIK 3.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat dengan partikel yang tepat:",
    template: "도서관 ___ 가서 한국어 ___ 공부했어요. (Pergi ke perpustakaan lalu belajar bahasa Korea.)",
    blanks: ["에", "를"],
    options: ["에", "에서", "를", "은", "가", "와"],
    explanation: "'에' menandai tujuan gerak (가다), '를' menandai objek (공부하다). Perhatikan 에 vs 에서.",
  },

  // ═══════════════════════ B2 (TOPIK 4) ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Arti '공부했더라면 합격했을 텐데.' paling mendekati:",
    options: [
      "Kalau belajar, akan lulus",
      "Seandainya dulu belajar, pasti sudah lulus (tapi tidak)",
      "Karena belajar, jadi lulus",
      "Meskipun belajar, tidak lulus",
    ],
    correct: 1,
    explanation: "'-더라면 …-았을 텐데' = pengandaian masa lampau yang berlawanan fakta + penyesalan. Nuansa: 'seandainya dulu…, pasti sudah…'.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: '이 책은 많은 사람에게 ___.' (Buku ini dibaca banyak orang.)",
    context: "Bentuk pasif (피동).",
    options: ["읽어요", "읽혀요", "읽었어요", "읽을게요"],
    correct: "읽혀요",
    explanation: "'읽다' → '읽히다' (pasif dengan sisipan -히-). '읽혀요' = dibaca. Bentuk aktif '읽어요' = membaca.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Ungkapan idiomatik '눈이 높다' berarti:",
    options: [
      "Sombong dan angkuh",
      "Punya standar/selera yang tinggi (pemilih)",
      "Sangat pintar",
      "Berbadan tinggi",
    ],
    correct: 1,
    explanation: "'눈이 높다' (harfiah 'matanya tinggi') = punya standar tinggi, pilih-pilih. Idiom penting di level lanjutan.",
  },
];
