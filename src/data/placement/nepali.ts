import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// NEPALI PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// ─────────────────────────────────────────────────────────────────────────────
export const nepaliPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'नमस्ते (namaste)' adalah:",
    options: ["Selamat tinggal", "Halo / Salam", "Terima kasih", "Maaf"],
    correct: 1,
    explanation: "'नमस्ते (namaste)' = salam/halo, sapaan universal Nepal sambil merangkapkan kedua telapak tangan. 'धन्यवाद (dhanyabaad)' = terima kasih, 'माफ गर्नुहोस् (maaph garnuhos)' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Nepali dengan artinya:",
    pairs: [
      { left: "एक (ek)", right: "1" },
      { left: "तीन (tin)", right: "3" },
      { left: "पाँच (paanch)", right: "5" },
      { left: "दस (das)", right: "10" },
    ],
    explanation: "Angka dasar एक (ek) sampai दस (das) penting untuk harga dan transaksi — mirip angka Hindi karena sama-sama turunan Sanskerta.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'म विद्यार्थी ___। (ma vidyaarthi ___.)' (Saya seorang pelajar.)",
    context: "Kopula 'adalah' yang cocok dengan subjek 'saya'.",
    options: ["हुँ (hun)", "हो (ho)", "छ (chha)", "हौ (hau)"],
    correct: "हुँ (hun)",
    explanation: "Kopula Nepali menyesuaikan subjek: म (ma) → हुँ (hun), ऊ/यो (dia/ini) → हो (ho), तिमी (timi, kamu) → हौ (hau). 'छ (chha)' dipakai untuk keberadaan/lokasi, bukan identitas.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["भात (bhaat)", "खान्छु (khaanchhu)", "म (ma)"],
    correct: ["म (ma)", "भात (bhaat)", "खान्छु (khaanchhu)"],
    explanation: "Nepali berpola SOV: Subjek म (ma) + Objek भात (bhaat) + Kata kerja खान्छु (khaanchhu). Kata kerja selalu di akhir — beda dari bahasa Indonesia yang SVO.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan 'kemarin saya pergi ke sekolah' (lampau), kalimat yang tepat:",
    options: [
      "म स्कुल जान्छु (ma skul jaanchhu)",
      "म हिजो स्कुल गएँ (ma hijo skul gaen)",
      "म स्कुल जानेछु (ma skul jaanechhu)",
      "म स्कुल गइरहेको छु (ma skul gairaheko chhu)",
    ],
    correct: 1,
    explanation: "'गएँ (gaen)' = bentuk lampau orang pertama dari 'pergi'. 'जान्छु (jaanchhu)' = pergi (kebiasaan/kini), 'जानेछु (jaanechhu)' = akan pergi (futur), 'गइरहेको छु (gairaheko chhu)' = sedang pergi. 'हिजो (hijo)' = kemarin.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan keterangan tempat:",
    translation: "Saya belajar bahasa Nepali di sekolah.",
    tokens: ["सिक्छु (sikchhu)", "म (ma)", "नेपाली (nepaali)", "स्कुलमा (skulmaa)"],
    correct: ["म (ma)", "स्कुलमा (skulmaa)", "नेपाली (nepaali)", "सिक्छु (sikchhu)"],
    explanation: "Keterangan tempat 'स्कुलमा (skulmaa)' = di sekolah memakai akhiran lokatif -मा (-maa) dan diletakkan sebelum objek; kata kerja 'सिक्छु (sikchhu)' = belajar tetap di akhir (SOV).",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kata yang tepat:",
    template: "पसल ___ ७ बजे ___। (pasal … 7 baje … — Toko buka pukul 7 pagi.)",
    blanks: ["बिहान (bihaan)", "खुल्छ (khulchha)"],
    options: ["बिहान (bihaan)", "बेलुका (beluka)", "खुल्छ (khulchha)", "बन्द हुन्छ (banda hunchha)", "जान्छ (jaanchha)", "राति (raati)"],
    explanation: "'बिहान (bihaan)' = pagi, 'खुल्छ (khulchha)' = buka. Pengecoh: 'बेलुका (beluka)' = sore, 'राति (raati)' = malam, 'बन्द हुन्छ (banda hunchha)' = tutup, 'जान्छ (jaanchha)' = pergi.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'टेबल ___ किताब छ। (tebal ___ kitaab chha.)' (Ada buku di atas meja.)",
    context: "Kata penunjuk posisi (postposisi).",
    options: ["माथि (maathi)", "मुनि (muni)", "भित्र (bhitra)", "अगाडि (agaadi)"],
    correct: "माथि (maathi)",
    explanation: "'माथि (maathi)' = di atas, diletakkan SETELAH kata benda (postposisi) — kebalikan preposisi Indonesia. 'मुनि (muni)' = di bawah, 'भित्र (bhitra)' = di dalam, 'अगाडि (agaadi)' = di depan. 'छ (chha)' = ada.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'पानी परे पनि म जान्छु। (paani pare pani ma jaanchhu.)':",
    options: [
      "Karena hujan, saya pergi",
      "Meskipun hujan, saya tetap pergi",
      "Kalau hujan, saya tidak pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "Pola 'kata kerja-ए पनि (-e pani)' = meskipun: 'परे पनि (pare pani)' = meskipun turun (hujan). 'पानी पर्नु (paani parnu)' harfiah 'air jatuh' = hujan. Jangan tertukar: 'पनि (pani)' = juga/pun, 'पानी (paani)' = air.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Nepali dengan artinya:",
    pairs: [
      { left: "किनभने (kinabhane)", right: "karena" },
      { left: "यदि (yadi)", right: "kalau" },
      { left: "तर (tara)", right: "tetapi" },
      { left: "त्यसैले (tyasaile)", right: "oleh karena itu" },
    ],
    explanation: "Konjungsi inti kalimat kompleks: किनभने (sebab), यदि (syarat), तर (pertentangan), त्यसैले (akibat/kesimpulan).",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: '___ समय भयो भने म आउँछु। (___ samaya bhayo bhane ma aaunchhu.)' (Kalau ada waktu, saya akan datang.)",
    context: "Kata pengandaian.",
    options: ["यदि (yadi)", "तर (tara)", "किनभने (kinabhane)", "जब (jaba)"],
    correct: "यदि (yadi)",
    explanation: "Pengandaian Nepali memakai pasangan 'यदि … भने (yadi … bhane)' = kalau … maka. 'भयो भने (bhayo bhane)' = kalau ada/terjadi. 'तर (tara)' = tetapi, 'किनभने (kinabhane)' = karena, 'जब (jaba)' = ketika.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi kalimat dengan kata bandingan:",
    template: "आज हिजो ___ गर्मी छ। यो हप्ताको ___ गर्मी दिन हो। (aaja hijo … garmi chha. yo haptaako … garmi din ho — Hari ini lebih panas dari kemarin. Ini hari terpanas minggu ini.)",
    blanks: ["भन्दा (bhandaa)", "सबैभन्दा (sabaibhandaa)"],
    options: ["भन्दा (bhandaa)", "सबैभन्दा (sabaibhandaa)", "जस्तै (jastai)", "धेरै (dherai)", "अलि (ali)", "पनि (pani)"],
    explanation: "'X भन्दा (bhandaa)' = lebih … daripada X (komparatif), 'सबैभन्दा (sabaibhandaa)' = paling (harfiah 'daripada semua', superlatif). Pengecoh: 'जस्तै (jastai)' = seperti, 'धेरै (dherai)' = banyak/sangat, 'अलि (ali)' = agak, 'पनि (pani)' = juga.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'चिठी लेखियो। (chithi lekhiyo.)' berarti:",
    options: [
      "Dia sedang menulis surat",
      "Surat itu telah ditulis",
      "Surat itu akan ditulis",
      "Saya merobek surat itu",
    ],
    correct: 1,
    explanation: "Pasif Nepali dibentuk dengan sisipan -इ- (-i-) pada kata kerja: लेख्नु (lekhnu, menulis) → लेखियो (lekhiyo, ditulis — lampau). Pelaku tidak perlu disebut, mirip pasif 'di-' bahasa Indonesia.",
  },
  {
    id: "q14", difficulty: "B2", type: "multiple",
    question: "Kalimat 'उनी नेपाली मान्छे जस्तै नेपाली बोल्छन्। (uni nepaali maanchhe jastai nepaali bolchhan.)' berarti:",
    options: [
      "Dia berbahasa Nepali seperti orang Nepal asli",
      "Dia berbahasa Nepali lebih baik dari orang Nepal",
      "Dia belajar bahasa Nepali dari orang Nepal",
      "Dia mengajar bahasa Nepali kepada orang Nepal",
    ],
    correct: 0,
    explanation: "'X जस्तै (jastai)' = seperti X (penyerupaan): 'नेपाली मान्छे जस्तै (nepaali maanchhe jastai)' = seperti orang Nepal. 'उनी (uni)' = dia (bentuk hormat), 'बोल्छन् (bolchhan)' = berbicara. Bandingkan 'भन्दा (bhandaa)' = lebih dari.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa Nepali 'एक हातले ताली बज्दैन (ek haatle taali bajdaina)' — 'satu tangan tak bisa bertepuk' — paling dekat maknanya dengan:",
    options: [
      "Tong kosong nyaring bunyinya",
      "Bertepuk sebelah tangan tak akan berbunyi",
      "Sekali dayung dua pulau terlampaui",
      "Air beriak tanda tak dalam",
    ],
    correct: 1,
    explanation: "Maknanya: sesuatu (kerja sama maupun pertengkaran) tak mungkin terjadi dari satu pihak saja — padanannya 'Bertepuk sebelah tangan tak akan berbunyi'. 'हात (haat)' = tangan, 'ताली (taali)' = tepukan, 'बज्दैन (bajdaina)' = tidak berbunyi.",
  },
];
