import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// HEBREW PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Fokus: Modern Hebrew (Ibrani Israel modern)
// ─────────────────────────────────────────────────────────────────────────────
export const hebrewPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'שלום (shalom)' adalah:",
    options: ["Terima kasih", "Halo / salam (juga dipakai saat berpisah)", "Maaf", "Selamat makan"],
    correct: 1,
    explanation: "'שלום (shalom)' harfiah berarti 'damai', dipakai untuk halo maupun sampai jumpa. 'תודה (toda)' = terima kasih, 'סליחה (slicha)' = maaf, 'בתיאבון (beteavon)' = selamat makan.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Ibrani dengan artinya:",
    pairs: [
      { left: "אחת (achat)", right: "1" },
      { left: "שלוש (shalosh)", right: "3" },
      { left: "חמש (chamesh)", right: "5" },
      { left: "עשר (eser)", right: "10" },
    ],
    explanation: "Ini bentuk feminin yang dipakai untuk menghitung sehari-hari (harga, nomor telepon, jam).",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: '___ סטודנט. (___ student.)' (Dia [laki-laki] seorang mahasiswa.)",
    context: "Pilih kata ganti yang tepat.",
    options: ["הוא (hu)", "היא (hi)", "אני (ani)", "אתה (ata)"],
    correct: "הוא (hu)",
    explanation: "Ibrani modern tidak memakai kata 'adalah' di kala kini. 'הוא (hu)' = dia (lk), 'היא (hi)' = dia (pr), 'אני (ani)' = saya, 'אתה (ata)' = kamu (lk).",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan roti.",
    tokens: ["לחם (lechem)", "אני (ani)", "אוכל (okhel)"],
    correct: ["אני (ani)", "אוכל (okhel)", "לחם (lechem)"],
    explanation: "Struktur SVO Ibrani: Subjek (אני/ani) + Kata kerja (אוכל/okhel = makan, bentuk maskulin) + Objek (לחם/lechem = roti).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Kalimat mana yang bermakna lampau 'Saya sudah menulis surat'?",
    options: [
      "אני כותב מכתב (ani kotev mikhtav)",
      "כתבתי מכתב (katavti mikhtav)",
      "אכתוב מכתב (ekhtov mikhtav)",
      "אני כותב עכשיו (ani kotev akhshav)",
    ],
    correct: 1,
    explanation: "'כתבתי (katavti)' = saya menulis (lampau, akhiran -ti = 'saya'). 'כותב (kotev)' = kala kini, 'אכתוב (ekhtov)' = akan menulis (futur), 'עכשיו (akhshav)' = sekarang.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat lampau dengan keterangan waktu:",
    translation: "Kemarin saya pergi ke pasar.",
    tokens: ["לשוק (la-shuk)", "אתמול (etmol)", "הלכתי (halakhti)"],
    correct: ["אתמול (etmol)", "הלכתי (halakhti)", "לשוק (la-shuk)"],
    explanation: "'אתמול (etmol)' = kemarin, 'הלכתי (halakhti)' = saya pergi (lampau), awalan 'לְ (le-/la-)' = ke: 'לשוק (la-shuk)' = ke pasar.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat kepemilikan dengan kata yang tepat:",
    template: "___ לי ספר, אבל ___ לי זמן לקרוא. (Saya punya buku, tapi tidak punya waktu untuk membaca.)",
    blanks: ["יש (yesh)", "אין (ein)"],
    options: ["יש (yesh)", "אין (ein)", "היה (haya)", "לא (lo)", "כן (ken)", "עוד (od)"],
    explanation: "Kepemilikan Ibrani: 'יש לי (yesh li)' = ada padaku = saya punya; negasinya 'אין לי (ein li)'. Pengecoh: 'היה (haya)' = dulu ada, 'לא (lo)' = tidak (untuk verba), 'עוד (od)' = masih/lagi.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'אתה ___ לדבר עברית? (ata ___ ledaber ivrit?)' (Apakah kamu bisa berbahasa Ibrani?)",
    context: "Modalitas 'bisa'.",
    options: ["יכול (yakhol)", "צריך (tsarikh)", "רוצה (rotse)", "אוהב (ohev)"],
    correct: "יכול (yakhol)",
    explanation: "'יכול (yakhol)' = bisa/mampu. 'צריך (tsarikh)' = perlu/harus, 'רוצה (rotse)' = ingin, 'אוהב (ohev)' = suka. Semuanya diikuti infinitif 'לדבר (ledaber)' = berbicara.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'למרות שירד גשם, יצאתי. (lamrot she-yarad geshem, yatsati.)' :",
    options: [
      "Karena hujan, saya keluar",
      "Meskipun hujan, saya tetap keluar",
      "Kalau hujan, saya keluar",
      "Setelah hujan, saya keluar",
    ],
    correct: 1,
    explanation: "'למרות ש (lamrot she-)' = meskipun. Bandingkan: 'כי (ki)' = karena, 'אם (im)' = kalau, 'אחרי ש (achrei she-)' = setelah.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung dengan artinya:",
    pairs: [
      { left: "כי (ki)", right: "karena" },
      { left: "אבל (aval)", right: "tetapi" },
      { left: "אם (im)", right: "jika / kalau" },
      { left: "כדי (kedei)", right: "supaya / untuk" },
    ],
    explanation: "Konjungsi ini fondasi kalimat kompleks level menengah. 'כדי (kedei)' selalu diikuti infinitif atau ש (she-).",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'הדירה הזאת ___ יקרה מההיא. (ha-dira ha-zot ___ yekara me-ha-hi.)' (Apartemen ini lebih mahal dari yang itu.)",
    context: "Bentuk perbandingan.",
    options: ["יותר (yoter)", "הכי (hakhi)", "מאוד (me'od)", "כמו (kmo)"],
    correct: "יותר (yoter)",
    explanation: "Komparatif Ibrani: 'יותר … מ (yoter … mi-)' = lebih … dari. 'הכי (hakhi)' = paling (superlatif), 'מאוד (me'od)' = sangat, 'כמו (kmo)' = seperti.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Kalimat pengandaian — lengkapi dengan bentuk yang tepat:",
    template: "אם ___ לי זמן מחר, ___ לים. (Kalau besok saya punya waktu, saya akan pergi ke pantai.)",
    blanks: ["יהיה (yihye)", "אסע (esa)"],
    options: ["יהיה (yihye)", "אסע (esa)", "היה (haya)", "נסעתי (nasati)", "יש (yesh)", "הלכתי (halakhti)"],
    explanation: "Pengandaian nyata tentang masa depan pakai futur: 'יהיה לי (yihye li)' = akan ada padaku, 'אסע (esa)' = saya akan pergi. Pengecoh: 'היה (haya)'/'נסעתי (nasati)' = bentuk lampau, 'יש (yesh)' = ada (kala kini).",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'המכתב נכתב אתמול. (ha-mikhtav nikhtav etmol.)' berarti:",
    options: [
      "Saya menulis surat kemarin",
      "Surat itu ditulis kemarin",
      "Surat itu akan ditulis besok",
      "Dia sedang menulis surat",
    ],
    correct: 1,
    explanation: "Pola verba (binyan) nif'al membentuk pasif: כתב (katav = menulis) → נכתב (nikhtav = ditulis). Sistem binyan adalah kunci tata bahasa Ibrani lanjutan.",
  },
  {
    id: "q14", difficulty: "B2", type: "matching",
    prompt: "Jodohkan idiom Ibrani dengan maknanya:",
    pairs: [
      { left: "חבל על הזמן (chaval al ha-zman)", right: "luar biasa / keren banget (slang)" },
      { left: "על קצה המזלג (al ktse ha-mazleg)", right: "secara singkat / sekilas saja" },
      { left: "שבר את הראש (shavar et ha-rosh)", right: "memeras otak" },
      { left: "אין לי מושג (ein li musag)", right: "saya tidak tahu sama sekali" },
    ],
    explanation: "Harfiahnya menipu: 'chaval al ha-zman' = 'sayang waktunya' tapi justru pujian; 'al ktse ha-mazleg' = 'di ujung garpu'; 'shavar et ha-rosh' = 'memecahkan kepala'.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'סייג לחכמה שתיקה (syag la-chokhma shtika)' paling dekat maknanya dengan:",
    options: [
      "Diam itu emas",
      "Tong kosong nyaring bunyinya",
      "Air tenang menghanyutkan",
      "Besar pasak daripada tiang",
    ],
    correct: 0,
    explanation: "Harfiah: 'pagar bagi kebijaksanaan adalah diam' (dari Pirkei Avot) — orang bijak tahu kapan harus diam. Pengecoh: 'tong kosong' = banyak bicara tanpa isi, 'air tenang' = pendiam tapi berbahaya/hebat, 'besar pasak' = boros.",
  },
];
