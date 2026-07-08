import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// THAI PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const thaiPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Sapaan umum dalam bahasa Thai adalah:",
    options: [
      "ลาก่อน (laa gòn)",
      "สวัสดี (sawàtdii)",
      "ขอบคุณ (khòop khun)",
      "ขอโทษ (khǒo thôot)",
    ],
    correct: 1,
    explanation: "'สวัสดี' = halo/salam (pagi–malam). 'ลาก่อน' = selamat tinggal, 'ขอบคุณ' = terima kasih.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Thai dengan artinya:",
    pairs: [
      { left: "หนึ่ง (nùeng)", right: "1" },
      { left: "สาม (sǎam)", right: "3" },
      { left: "ห้า (hâa)", right: "5" },
      { left: "สิบ (sìp)", right: "10" },
    ],
    explanation: "Angka dasar หนึ่ง~สิบ penting untuk harga dan transaksi.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'ผม ___ นักเรียน' (Saya seorang murid — laki-laki.)",
    context: "Kata kerja 'adalah' (untuk kata benda).",
    options: ["เป็น", "อยู่", "มี", "ได้"],
    correct: "เป็น",
    explanation: "'เป็น' = adalah (untuk status/identitas). 'อยู่' = berada, 'มี' = punya. 'ผม' = kata ganti 'saya' laki-laki.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["ข้าว", "ผม", "กิน"],
    correct: ["ผม", "กิน", "ข้าว"],
    explanation: "Struktur SVO Thai: Subjek (ผม) + Kata kerja (กิน) + Objek (ข้าว).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan aksi selesai 'sudah makan', penanda yang tepat:",
    options: [
      "ผมกินข้าว",
      "ผมกินข้าวแล้ว",
      "ผมจะกินข้าว",
      "ผมกำลังกินข้าว",
    ],
    correct: 1,
    explanation: "'แล้ว' (láew) di akhir menandai aksi sudah selesai. 'จะ' = akan (futur), 'กำลัง' = sedang.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Thai di sekolah.",
    tokens: ["ภาษาไทย", "ที่โรงเรียน", "ผม", "เรียน"],
    correct: ["ผม", "เรียน", "ภาษาไทย", "ที่โรงเรียน"],
    explanation: "'ที่' + tempat = di …. Keterangan tempat umumnya diletakkan di akhir kalimat.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "ร้าน ___ ตอน 7 โมงเช้า และปิด ___ 3 ทุ่ม. (Toko buka pukul 7 pagi dan tutup pukul 9 malam.)",
    blanks: ["เปิด", "ตอน"],
    options: ["เปิด", "ปิด", "ตอน", "ที่", "มี", "แล้ว"],
    explanation: "'เปิด' = buka, 'ปิด' = tutup, 'ตอน' = pada saat (waktu).",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'คุณพูดภาษาไทย ___ ไหม' (Apakah kamu bisa berbahasa Thai?)",
    context: "Modalitas 'bisa'.",
    options: ["ได้", "ต้อง", "ควร", "เคย"],
    correct: "ได้",
    explanation: "'…ได้ไหม' = apakah bisa …? 'ได้' setelah kata kerja = mampu/bisa. 'ต้อง' = harus, 'ควร' = sebaiknya.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'ถึงฝนตกแต่ฉันก็ไป' :",
    options: [
      "Karena hujan, saya pergi",
      "Meskipun hujan, saya tetap pergi",
      "Kalau hujan, saya pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "Pasangan 'ถึง … แต่ …ก็…' = meskipun … tetap …. 'ก็' menegaskan 'tetap juga'.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat berandai:",
    translation: "Kalau ada waktu, saya ingin pergi ke Thailand.",
    tokens: ["ไปเมืองไทย", "มีเวลา", "ถ้า", "ฉันอยาก"],
    correct: ["ถ้า", "มีเวลา", "ฉันอยาก", "ไปเมืองไทย"],
    explanation: "'ถ้า …' = kalau …. 'อยาก' = ingin. Klausa syarat mendahului klausa utama.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "เพราะ", right: "karena" },
      { left: "ถ้า … ก็ …", right: "kalau … maka …" },
      { left: "เพื่อ", right: "supaya / untuk" },
      { left: "แต่", right: "tetapi" },
    ],
    explanation: "Kata penghubung ini adalah inti tata bahasa menengah.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat perbandingan:",
    template: "วันนี้ร้อน ___ เมื่อวาน นี่คือวันที่ร้อน ___ ในสัปดาห์นี้ (Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["กว่า", "ที่สุด"],
    options: ["กว่า", "ที่สุด", "เท่า", "เหมือน", "มาก", "จัง"],
    explanation: "'… กว่า' = lebih … (komparatif). '… ที่สุด' = paling … (superlatif).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat 'โทรศัพท์ของฉันถูกขโมย' berarti:",
    options: [
      "Saya mencuri HP",
      "HP saya dicuri",
      "Saya menjual HP",
      "HP saya rusak",
    ],
    correct: 1,
    explanation: "'ถูก' + kata kerja menandai pasif (biasanya hal buruk). 'ถูกขโมย' = dicuri.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'เขาพูดภาษาไทย ___ เจ้าของภาษา' (Dia berbahasa Thai seperti penutur asli.)",
    context: "Ungkapan perbandingan 'seperti'.",
    options: ["เหมือน", "กว่า", "ที่สุด", "ของ"],
    correct: "เหมือน",
    explanation: "'เหมือน' = seperti/serupa. 'พูด … เหมือนเจ้าของภาษา' = berbicara seperti penutur asli.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'เข้าเมืองตาหลิ่ว ต้องหลิ่วตาตาม' paling dekat maknanya dengan:",
    options: [
      "Air tenang menghanyutkan",
      "Di mana bumi dipijak, di situ langit dijunjung",
      "Sedia payung sebelum hujan",
      "Bagai telur di ujung tanduk",
    ],
    correct: 1,
    explanation: "Peribahasa ini (harfiah: masuk kota orang bermata juling, ikutlah menjulingkan mata) = menyesuaikan diri dengan adat setempat.",
  },
];
