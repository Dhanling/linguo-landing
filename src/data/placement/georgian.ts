import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// GEORGIAN (KARTULI) PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Aksara Mkhedruli selalu disertai romanisasi dalam kurung.
// ─────────────────────────────────────────────────────────────────────────────
export const georgianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'გამარჯობა (gamarjoba)' adalah:",
    options: ["Selamat tinggal", "Halo", "Terima kasih", "Maaf"],
    correct: 1,
    explanation: "'გამარჯობა (gamarjoba)' = halo, sapaan paling umum. 'ნახვამდის (nakhvamdis)' = selamat tinggal, 'მადლობა (madloba)' = terima kasih, 'ბოდიში (bodishi)' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Georgia dengan artinya:",
    pairs: [
      { left: "ერთი (erti)", right: "1" },
      { left: "სამი (sami)", right: "3" },
      { left: "ხუთი (khuti)", right: "5" },
      { left: "ათი (ati)", right: "10" },
    ],
    explanation: "Angka dasar 1–10 wajib hafal untuk harga dan transaksi. Georgia memakai sistem vigesimal (basis 20) untuk angka besar, tapi 1–10 adalah fondasinya.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'მე ___ სტუდენტი. (me ___ studenti.)' — Saya seorang mahasiswa.",
    context: "Kata kerja 'adalah' untuk orang pertama.",
    options: ["ვარ (var)", "ხარ (khar)", "არის (aris)", "ვართ (vart)"],
    correct: "ვარ (var)",
    explanation: "'ვარ (var)' = saya adalah (orang ke-1 tunggal). 'ხარ (khar)' = kamu adalah, 'არის (aris)' = dia adalah, 'ვართ (vart)' = kami adalah.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum air.",
    tokens: ["წყალს (ts'q'als)", "მე (me)", "ვსვამ (vsvam)"],
    correct: ["მე (me)", "წყალს (ts'q'als)", "ვსვამ (vsvam)"],
    explanation: "Urutan netral bahasa Georgia adalah SOV: Subjek (მე/me) + Objek (წყალს/ts'q'als) + Verba (ვსვამ/vsvam). Kata kerja umumnya di akhir kalimat.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Bentuk lampau (aorist) yang benar untuk 'Saya menulis surat (kemarin)':",
    options: [
      "ვწერ წერილს (vts'er ts'erils)",
      "დავწერე წერილი (davts'ere ts'erili)",
      "დავწერ წერილს (davts'er ts'erils)",
      "ვწერდი წერილს (vts'erdi ts'erils)",
    ],
    correct: 1,
    explanation: "'დავწერე (davts'ere)' = aorist (lampau selesai). 'ვწერ (vts'er)' = sedang menulis (kini), 'დავწერ (davts'er)' = akan menulis (futur), 'ვწერდი (vts'erdi)' = dulu biasa/sedang menulis (imperfek).",
  },
  {
    id: "q6", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: '___ დაწერა წერილი. (___ dats'era ts'erili.)' — Anak itu menulis surat.",
    context: "Pilih bentuk kasus yang tepat untuk subjek kalimat aorist.",
    options: ["ბავშვი (bavshvi)", "ბავშვმა (bavshvma)", "ბავშვს (bavshvs)", "ბავშვის (bavshvis)"],
    correct: "ბავშვმა (bavshvma)",
    explanation: "Pada kala aorist, subjek verba transitif memakai kasus ERGATIF '-მა (-ma)': ბავშვმა (bavshvma). 'ბავშვი (bavshvi)' = nominatif, 'ბავშვს (bavshvs)' = datif, 'ბავშვის (bavshvis)' = genitif (milik).",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan bentuk futur yang tepat:",
    template: "ხვალ თბილისში ___ და ძველ ქალაქს ___. (Besok saya akan pergi ke Tbilisi dan akan melihat kota tua.)",
    blanks: ["წავალ (ts'aval)", "ვნახავ (vnakhav)"],
    options: ["წავალ (ts'aval)", "წავედი (ts'avedi)", "მივდივარ (mivdivar)", "ვნახავ (vnakhav)", "ვნახე (vnakhe)", "ვხედავ (vkhedav)"],
    explanation: "Futur ditandai preverba: 'წავალ (ts'aval)' = akan pergi, 'ვნახავ (vnakhav)' = akan melihat. Pengecoh: 'წავედი (ts'avedi)' = pergi (lampau), 'მივდივარ (mivdivar)' = sedang pergi, 'ვნახე (vnakhe)' = melihat (lampau), 'ვხედავ (vkhedav)' = melihat (kini).",
  },
  {
    id: "q8", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat lampau dengan keterangan waktu:",
    translation: "Kemarin saya membeli roti.",
    tokens: ["ვიყიდე (viq'ide)", "გუშინ (gushin)", "პური (puri)", "მე (me)"],
    correct: ["გუშინ (gushin)", "მე (me)", "პური (puri)", "ვიყიდე (viq'ide)"],
    explanation: "Keterangan waktu 'გუშინ (gushin)' = kemarin lazim di awal, lalu SOV: subjek + objek + verba. Pada aorist, objek ('პური/puri' = roti) memakai kasus nominatif.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'წვიმს, მაგრამ მე მაინც გარეთ მივდივარ. (ts'vims, magram me maints garet mivdivar.)':",
    options: [
      "Karena hujan, saya keluar",
      "Sedang hujan, tetapi saya tetap keluar",
      "Kalau hujan, saya tidak keluar",
      "Setelah hujan, saya keluar",
    ],
    correct: 1,
    explanation: "'მაგრამ (magram)' = tetapi, 'მაინც (maints)' = tetap/toh. 'წვიმს (ts'vims)' = sedang hujan, 'გარეთ (garet)' = ke luar.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Georgia dengan artinya:",
    pairs: [
      { left: "მაგრამ (magram)", right: "tetapi" },
      { left: "იმიტომ რომ (imitom rom)", right: "karena" },
      { left: "თუ (tu)", right: "kalau / jika" },
      { left: "როცა (rotsa)", right: "ketika" },
    ],
    explanation: "Konjungsi ini kunci merangkai kalimat majemuk level menengah: 'თუ (tu)' membuka klausa syarat, 'როცა (rotsa)' klausa waktu, 'იმიტომ რომ (imitom rom)' klausa sebab.",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'მე შენ ___. (me shen ___.)' — Aku mencintaimu.",
    context: "Verba 'mencintai' termasuk verba inversi (subjek berkasus datif).",
    options: ["მიყვარხარ (miq'varkhar)", "მიყვარს (miq'vars)", "გიყვარვარ (giq'varvar)", "უყვარს (uq'vars)"],
    correct: "მიყვარხარ (miq'varkhar)",
    explanation: "'მიყვარხარ (miq'varkhar)' = aku mencintai KAMU (akhiran -ხარ menandai objek orang ke-2). 'მიყვარს (miq'vars)' = aku mencintainya, 'გიყვარვარ (giq'varvar)' = kamu mencintaiku, 'უყვარს (uq'vars)' = dia mencintainya. Pada verba inversi, si perasa berkasus datif.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat perbandingan:",
    template: "თბილისი ___ დიდია, ___ ქუთაისი. (Tbilisi lebih besar daripada Kutaisi.)",
    blanks: ["უფრო (upro)", "ვიდრე (vidre)"],
    options: ["უფრო (upro)", "ვიდრე (vidre)", "ყველაზე (q'velaze)", "როგორც (rogorts)", "ძალიან (dzalian)", "ცოტა (tsota)"],
    explanation: "Komparatif: 'უფრო … ვიდრე … (upro … vidre …)' = lebih … daripada …. Pengecoh: 'ყველაზე (q'velaze)' = paling (superlatif), 'როგორც (rogorts)' = seperti, 'ძალიან (dzalian)' = sangat, 'ცოტა (tsota)' = sedikit.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Nuansa kalimat 'მას ეს წიგნი წაუკითხავს. (mas es ts'igni ts'auk'itkhavs.)' adalah:",
    options: [
      "Dia sedang membaca buku itu",
      "Rupanya / ternyata dia sudah membaca buku itu",
      "Dia akan membaca buku itu",
      "Dia disuruh membaca buku itu",
    ],
    correct: 1,
    explanation: "Ini bentuk perfek EVIDENSIAL — melaporkan hasil yang disimpulkan/tak disaksikan langsung ('rupanya sudah…'). Ciri khasnya: subjek berkasus datif 'მას (mas)' dan verba berpola წაუკითხავს (ts'auk'itkhavs).",
  },
  {
    id: "q14", difficulty: "B2", type: "multiple",
    question: "Kalimat yang benar untuk 'Besok saya harus bekerja':",
    options: [
      "ხვალ უნდა ვმუშაობ (khval unda vmushaob)",
      "ხვალ უნდა ვიმუშაო (khval unda vimushao)",
      "ხვალ უნდა ვიმუშავებ (khval unda vimushaveb)",
      "ხვალ მუშაობა ვარ (khval mushaoba var)",
    ],
    correct: 1,
    explanation: "'უნდა (unda)' = harus, dan WAJIB diikuti bentuk optatif berakhiran -ო (-o): ვიმუშაო (vimushao). Indikatif kini 'ვმუშაობ (vmushaob)' dan futur 'ვიმუშავებ (vimushaveb)' salah setelah unda; opsi terakhir bukan kalimat gramatikal.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'ათჯერ გაზომე, ერთხელ გაჭერი (atjer gazome, ertkhel gach'eri)' — 'ukur sepuluh kali, potong sekali' — paling dekat maknanya dengan:",
    options: [
      "Sekali merengkuh dayung, dua tiga pulau terlampaui",
      "Pikir dahulu pendapatan, sesal kemudian tiada berguna",
      "Air beriak tanda tak dalam",
      "Besar pasak daripada tiang",
    ],
    correct: 1,
    explanation: "Maknanya: pertimbangkan matang-matang sebelum bertindak agar tak menyesal. 'ათჯერ (atjer)' = sepuluh kali, 'გაზომე (gazome)' = ukurlah, 'ერთხელ (ertkhel)' = sekali, 'გაჭერი (gach'eri)' = potonglah.",
  },
];
