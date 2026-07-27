import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// LAO PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const laoPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'ສະບາຍດີ (sabaidee)' adalah:",
    options: ["Selamat tinggal", "Halo / Apa kabar", "Terima kasih", "Maaf"],
    correct: 1,
    explanation: "'ສະບາຍດີ (sabaidee)' = halo, sapaan paling umum di Laos (harfiah: 'sehat/baik'). 'ຂອບໃຈ (khop chai)' = terima kasih, 'ລາກ່ອນ (la kon)' = selamat tinggal, 'ຂໍໂທດ (kho thot)' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Lao dengan artinya:",
    pairs: [
      { left: "ໜຶ່ງ (neung)", right: "1" },
      { left: "ສາມ (sam)", right: "3" },
      { left: "ຫ້າ (ha)", right: "5" },
      { left: "ສິບ (sip)", right: "10" },
    ],
    explanation: "Angka dasar ໜຶ່ງ (neung) sampai ສິບ (sip) penting untuk harga dan transaksi. Mirip bahasa Thai: neung, sam, ha, sip.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'ຂ້ອຍ ___ ນັກຮຽນ. (khoy ___ nak hian)' (Saya seorang pelajar.)",
    context: "Kata kerja 'adalah' untuk profesi/status.",
    options: ["ເປັນ (pen)", "ມີ (mi)", "ຢູ່ (yu)", "ໄປ (pai)"],
    correct: "ເປັນ (pen)",
    explanation: "'ເປັນ (pen)' = adalah, dipakai untuk profesi/status. 'ມີ (mi)' = punya, 'ຢູ່ (yu)' = berada di, 'ໄປ (pai)' = pergi.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["ກິນ (kin)", "ເຂົ້າ (khao)", "ຂ້ອຍ (khoy)"],
    correct: ["ຂ້ອຍ (khoy)", "ກິນ (kin)", "ເຂົ້າ (khao)"],
    explanation: "Struktur SVO bahasa Lao: Subjek ຂ້ອຍ (khoy) + Kata kerja ກິນ (kin) + Objek ເຂົ້າ (khao). Sama seperti bahasa Indonesia, tanpa konjugasi.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'sudah makan' (aksi selesai), kalimat yang tepat:",
    options: [
      "ຂ້ອຍກິນເຂົ້າ (khoy kin khao)",
      "ຂ້ອຍກິນເຂົ້າແລ້ວ (khoy kin khao laew)",
      "ຂ້ອຍຈະກິນເຂົ້າ (khoy cha kin khao)",
      "ຂ້ອຍກຳລັງກິນເຂົ້າ (khoy kamlang kin khao)",
    ],
    correct: 1,
    explanation: "'ແລ້ວ (laew)' di akhir kalimat = sudah (aksi selesai). 'ຈະ (cha)' = akan (futur), 'ກຳລັງ (kamlang)' = sedang (progresif). Bahasa Lao tak mengubah bentuk kata kerja, cukup tambah penanda.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Lao di sekolah.",
    tokens: ["ພາສາລາວ (phasa lao)", "ຂ້ອຍ (khoy)", "ຢູ່ໂຮງຮຽນ (yu hong hian)", "ຮຽນ (hian)"],
    correct: ["ຂ້ອຍ (khoy)", "ຮຽນ (hian)", "ພາສາລາວ (phasa lao)", "ຢູ່ໂຮງຮຽນ (yu hong hian)"],
    explanation: "Keterangan tempat 'ຢູ່ໂຮງຮຽນ (yu hong hian)' = di sekolah diletakkan di akhir kalimat, setelah objek — pola yang sama dengan bahasa Indonesia.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "ຮ້ານ ___ ___ 7 ໂມງເຊົ້າ. (han … 7 mong sao — Toko buka pukul 7 pagi.)",
    blanks: ["ເປີດ (poet)", "ຕອນ (ton)"],
    options: ["ເປີດ (poet)", "ປິດ (pit)", "ຕອນ (ton)", "ຢູ່ (yu)", "ມີ (mi)", "ຫຼາຍ (lai)"],
    explanation: "'ເປີດ (poet)' = buka, 'ຕອນ (ton)' = pada (penanda waktu). Pengecoh: 'ປິດ (pit)' = tutup, 'ມີ (mi)' = punya, 'ຫຼາຍ (lai)' = banyak.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'ເຈົ້າເວົ້າພາສາລາວ ___ ບໍ່? (chao wao phasa lao ___ bo?)' (Apakah kamu bisa berbahasa Lao?)",
    context: "Penanda kemampuan 'bisa'.",
    options: ["ໄດ້ (dai)", "ຕ້ອງ (tong)", "ຄວນ (khuan)", "ແລ້ວ (laew)"],
    correct: "ໄດ້ (dai)",
    explanation: "'ໄດ້ (dai)' setelah kata kerja = bisa/mampu; '… ໄດ້ບໍ່?' = apakah bisa …? 'ຕ້ອງ (tong)' = harus, 'ຄວນ (khuan)' = sebaiknya, 'ແລ້ວ (laew)' = sudah.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'ເຖິງແມ່ນວ່າຝົນຕົກ ຂ້ອຍກໍຍັງໄປ. (thoeng maen wa fon tok, khoy ko nyang pai.)':",
    options: [
      "Karena hujan, saya pergi",
      "Meskipun hujan, saya tetap pergi",
      "Kalau hujan, saya pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "'ເຖິງແມ່ນວ່າ (thoeng maen wa)' = meskipun, berpasangan dengan 'ກໍ (ko)' = tetap/juga. 'ຍັງ (nyang)' = masih. Pola konsesif ini inti tata bahasa B1.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Lao dengan artinya:",
    pairs: [
      { left: "ເພາະວ່າ (phor wa)", right: "karena" },
      { left: "ຖ້າ (tha)", right: "kalau" },
      { left: "ເພື່ອ (pheua)", right: "supaya / untuk" },
      { left: "ແຕ່ (tae)", right: "tetapi" },
    ],
    explanation: "Empat konjungsi ini kunci menyusun kalimat kompleks: sebab (ເພາະວ່າ), syarat (ຖ້າ), tujuan (ເພື່ອ), dan pertentangan (ແຕ່).",
  },
  {
    id: "q11", difficulty: "B1", type: "multiple",
    question: "Kalimat 'ຖ້າມີເວລາ ຂ້ອຍຢາກໄປປະເທດລາວ. (tha mi wela, khoy yak pai pathet lao.)' berarti:",
    options: [
      "Karena ada waktu, saya pergi ke Laos",
      "Kalau ada waktu, saya ingin pergi ke Laos",
      "Meskipun ada waktu, saya tidak ke Laos",
      "Setelah ada waktu, saya pulang dari Laos",
    ],
    correct: 1,
    explanation: "'ຖ້າ (tha)' = kalau (pengandaian), 'ຢາກ (yak)' = ingin. Klausa syarat mendahului klausa utama, persis pola 'kalau … maka …' bahasa Indonesia.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat dengan kata bandingan:",
    template: "ມື້ນີ້ຮ້ອນ ___ ມື້ວານ. ມື້ນີ້ແມ່ນມື້ຮ້ອນ ___ ໃນອາທິດ. (meu ni hon … meu wan. meu ni maen meu hon … nai athit — Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["ກວ່າ (kwa)", "ທີ່ສຸດ (thi sut)"],
    options: ["ກວ່າ (kwa)", "ທີ່ສຸດ (thi sut)", "ຄື (khue)", "ເທົ່າ (thao)", "ຫຼາຍ (lai)", "ແທ້ (thae)"],
    explanation: "'… ກວ່າ (kwa)' = lebih … dari (komparatif), '… ທີ່ສຸດ (thi sut)' = paling … (superlatif). Pengecoh: 'ຄື (khue)' = seperti, 'ເທົ່າ (thao)' = sama dengan, 'ແທ້ (thae)' = sungguh.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'ໂທລະສັບຂອງຂ້ອຍຖືກລັກ. (tholasap khong khoy thuek lak.)' berarti:",
    options: [
      "Saya mencuri HP",
      "HP saya dicuri",
      "Saya menjual HP",
      "HP saya rusak sendiri",
    ],
    correct: 1,
    explanation: "'ຖືກ (thuek)' menandai kalimat pasif, terutama untuk kejadian tidak menyenangkan (dikenai sesuatu yang buruk). 'ຖືກລັກ (thuek lak)' = dicuri. 'ຂອງ (khong)' = milik/punya.",
  },
  {
    id: "q14", difficulty: "B2", type: "fillChoice",
    question: "Lengkapi: 'ລາວເວົ້າພາສາລາວ ___ ຄົນລາວແທ້ໆ. (lao wao phasa lao ___ khon lao thae thae.)' (Dia berbahasa Lao seperti orang Laos asli.)",
    context: "Ungkapan perbandingan 'seperti/seolah'.",
    options: ["ຄື (khue)", "ກວ່າ (kwa)", "ເທົ່າ (thao)", "ຂອງ (khong)"],
    correct: "ຄື (khue)",
    explanation: "'ຄື (khue)' = seperti/seolah, untuk penyerupaan. Awas: 'ລາວ (lao)' di awal kalimat = dia (kata ganti orang ketiga), beda dari 'ພາສາລາວ' = bahasa Lao. 'ກວ່າ (kwa)' = lebih dari, 'ເທົ່າ (thao)' = sama dengan.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa Lao 'ເຂົ້າເມືອງຕາຫຼິ່ວ ໃຫ້ຫຼິ່ວຕາຕາມ (khao mueang ta liu, hai liu ta tam)' — 'masuk kota orang bermata sipit, ikutlah menyipitkan mata' — paling dekat maknanya dengan:",
    options: [
      "Sekali dayung dua pulau terlampaui",
      "Di mana bumi dipijak, di situ langit dijunjung",
      "Air beriak tanda tak dalam",
      "Tong kosong nyaring bunyinya",
    ],
    correct: 1,
    explanation: "Maknanya: menyesuaikan diri dengan adat dan kebiasaan tempat yang kita datangi — persis 'Di mana bumi dipijak, di situ langit dijunjung'. Pengecoh lain bermakna efisiensi (dayung), orang dangkal (air beriak), dan omong besar (tong kosong).",
  },
];
