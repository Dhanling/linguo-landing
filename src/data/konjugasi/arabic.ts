import type { KonjugasiBahasa, BarisKonjugasi } from "./types";

// Arab (MSA / Fusha) — verba contoh كَتَبَ (k-t-b, "menulis"), pola fa'ala / yaf'ulu.
// Bentuk dual & jamak perempuan (أنتما، هما، أنتنّ، هنّ) sengaja tidak ditampilkan agar ringkas.

const P = {
  ana: { pronomina: "أَنَا", arti: "saya" },
  anta: { pronomina: "أَنْتَ", arti: "kamu (lk)" },
  anti: { pronomina: "أَنْتِ", arti: "kamu (pr)" },
  huwa: { pronomina: "هُوَ", arti: "dia (lk)" },
  hiya: { pronomina: "هِيَ", arti: "dia (pr)" },
  nahnu: { pronomina: "نَحْنُ", arti: "kami / kita" },
  antum: { pronomina: "أَنْتُمْ", arti: "kalian (lk / campuran)" },
  hum: { pronomina: "هُمْ", arti: "mereka (lk / campuran)" },
};

// Mudhari' marfu' — dipakai ulang oleh tabel كان + mudhari' dan سـ + mudhari'.
const mudhari: Omit<BarisKonjugasi, "pronomina" | "arti">[] = [
  { bentuk: [["أَ", "persona"], ["كْتُبُ", "akar"]], latin: "aktubu" },
  { bentuk: [["تَ", "persona"], ["كْتُبُ", "akar"]], latin: "taktubu" },
  { bentuk: [["تَ", "persona"], ["كْتُبِ", "akar"], ["ينَ", "persona"]], latin: "taktubīna" },
  { bentuk: [["يَ", "persona"], ["كْتُبُ", "akar"]], latin: "yaktubu" },
  { bentuk: [["تَ", "persona"], ["كْتُبُ", "akar"]], latin: "taktubu" },
  { bentuk: [["نَ", "persona"], ["كْتُبُ", "akar"]], latin: "naktubu" },
  { bentuk: [["تَ", "persona"], ["كْتُبُ", "akar"], ["ونَ", "persona"]], latin: "taktubūna" },
  { bentuk: [["يَ", "persona"], ["كْتُبُ", "akar"], ["ونَ", "persona"]], latin: "yaktubūna" },
];

// Madhi — dipakai ulang oleh tabel كان قد + madhi.
const madhi: Omit<BarisKonjugasi, "pronomina" | "arti">[] = [
  { bentuk: [["كَتَبْ", "akar"], ["تُ", "persona"]], latin: "katabtu" },
  { bentuk: [["كَتَبْ", "akar"], ["تَ", "persona"]], latin: "katabta" },
  { bentuk: [["كَتَبْ", "akar"], ["تِ", "persona"]], latin: "katabti" },
  { bentuk: [["كَتَبَ", "akar"]], latin: "kataba" },
  { bentuk: [["كَتَبَ", "akar"], ["تْ", "persona"]], latin: "katabat" },
  { bentuk: [["كَتَبْ", "akar"], ["نَا", "persona"]], latin: "katabnā" },
  { bentuk: [["كَتَبْ", "akar"], ["تُمْ", "persona"]], latin: "katabtum" },
  { bentuk: [["كَتَبُ", "akar"], ["وا", "persona"]], latin: "katabū" },
];

const urut = [P.ana, P.anta, P.anti, P.huwa, P.hiya, P.nahnu, P.antum, P.hum];

// كان dalam madhi: kuntu, kunta, kunti, kāna, kānat, kunnā, kuntum, kānū
const kana: [string, string][] = [
  ["كُنْتُ ", "kuntu"],
  ["كُنْتَ ", "kunta"],
  ["كُنْتِ ", "kunti"],
  ["كَانَ ", "kāna"],
  ["كَانَتْ ", "kānat"],
  ["كُنَّا ", "kunnā"],
  ["كُنْتُمْ ", "kuntum"],
  ["كَانُوا ", "kānū"],
];

const data: KonjugasiBahasa = {
  rtl: true,
  tabel: [
    {
      id: "mudhari",
      nama: "Fi'il Mudhari' (Present)",
      ringkas: "Sedang / biasa dilakukan. Prefiks أ ت ي ن menandai persona, sufiks -īna / -ūna menambah gender & jamak.",
      verba: "كَتَبَ – يَكْتُبُ",
      arti: "menulis",
      cocok: [/verba mud[aā]ri'?/i, /mud[aā]ri'? \(present\)/i, /\bverba present\b/i],
      baris: urut.map((p, i) => ({ ...p, ...mudhari[i] })),
      catatan: [
        "Ingat 4 huruf prefiks: أ (saya), ت (kamu / dia pr), ي (dia lk / mereka), ن (kami) — disingkat «أنيت».",
        "تَكْتُبُ dipakai untuk أنتَ dan هي sekaligus — konteks yang membedakan.",
        "Negasi: لَا + mudhari' → لَا أَكْتُبُ (saya tidak menulis).",
      ],
      contoh: { kalimat: "أَكْتُبُ رِسَالَةً لِأُمِّي.", arti: "Saya menulis surat untuk ibu saya.", latin: "aktubu risālatan li-ummī." },
    },
    {
      id: "amr",
      nama: "Fi'il Amr (Perintah)",
      ringkas: "Perintah langsung ke lawan bicara. Dibentuk dari mudhari': buang prefiks تَ, tambah hamzah washal اُ.",
      verba: "كَتَبَ – اُكْتُبْ",
      arti: "menulis → tulislah!",
      cocok: [/imperatif/i, /\bamr\b/i],
      baris: [
        { ...P.anta, bentuk: [["اُ", "lain"], ["كْتُبْ", "akar"]], latin: "uktub" },
        { ...P.anti, bentuk: [["اُ", "lain"], ["كْتُبِ", "akar"], ["ي", "persona"]], latin: "uktubī" },
        { ...P.antum, bentuk: [["اُ", "lain"], ["كْتُبُ", "akar"], ["وا", "persona"]], latin: "uktubū" },
      ],
      catatan: [
        "Vokal hamzah ikut vokal tengah mudhari': يَكْتُبُ → اُكْتُبْ, tapi يَذْهَبُ → اِذْهَبْ, يَجْلِسُ → اِجْلِسْ.",
        "Larangan pakai لَا + mudhari' majzum: لَا تَكْتُبْ (jangan tulis).",
      ],
      contoh: { kalimat: "اُكْتُبْ اسْمَكَ هُنَا، مِنْ فَضْلِكَ.", arti: "Tolong tulis namamu di sini.", latin: "uktub ismaka hunā, min faḍlika." },
    },
    {
      id: "madhi",
      nama: "Fi'il Madhi (Past)",
      ringkas: "Kejadian yang sudah selesai. Akar tetap di depan, akhiran menandai persona.",
      verba: "كَتَبَ",
      arti: "menulis",
      cocok: [/verba m[aā]dh?[iī]\b/i, /m[aā]dhi \(past\)/i, /akhiran past/i, /past tense \+ deskripsi/i, /pertanyaan past/i],
      baris: urut.map((p, i) => ({ ...p, ...madhi[i] })),
      catatan: [
        "Bentuk kamus Arab = madhi هُوَ: كَتَبَ (dia lk menulis).",
        "Akhiran -tu / -ta / -ti dibedakan hanya oleh harakat — baca dengan teliti.",
        "Alif pada كَتَبُوا tidak dibaca (alif fāriqa).",
      ],
      contoh: { kalimat: "كَتَبْتُ رِسَالَةً أَمْسِ.", arti: "Kemarin saya menulis surat.", latin: "katabtu risālatan amsi." },
    },
    {
      id: "kana-mudhari",
      nama: "Kāna + Mudhari' (Past Continuous)",
      ringkas: "Sedang / biasa melakukan di masa lalu: كان (madhi) + mudhari', keduanya ikut persona.",
      verba: "كَانَ + يَكْتُبُ",
      arti: "dulu (sedang) menulis",
      cocok: [/past continuous/i, /كان \+ mud[aā]ri/i],
      baris: urut.map((p, i) => ({
        ...p,
        bentuk: [[kana[i][0], "bantu"], ...mudhari[i].bentuk],
        latin: `${kana[i][1]} ${mudhari[i].latin}`,
      })),
      catatan: [
        "Dua-duanya dikonjugasi: كُنْتُ أَكْتُبُ, bukan *كَانَ أَكْتُبُ.",
        "Bisa berarti 'dulu biasa…' (kebiasaan) atau 'sedang… ketika…'.",
      ],
      contoh: {
        kalimat: "كُنْتُ أَكْتُبُ عِنْدَمَا رَنَّ الْهَاتِفُ.",
        arti: "Saya sedang menulis ketika telepon berdering.",
        latin: "kuntu aktubu ʿindamā ranna l-hātifu.",
      },
    },
    {
      id: "kana-qad-madhi",
      nama: "Kāna Qad + Madhi (Past Perfect)",
      ringkas: "Sudah terjadi sebelum kejadian lampau lain: كان + قَدْ + madhi.",
      verba: "كَانَ قَدْ كَتَبَ",
      arti: "sudah menulis (sebelumnya)",
      cocok: [/past perfect/i, /كان قد/],
      baris: urut.map((p, i) => ({
        ...p,
        bentuk: [[kana[i][0], "bantu"], ["قَدْ ", "waktu"], ...madhi[i].bentuk],
        latin: `${kana[i][1]} qad ${madhi[i].latin}`,
      })),
      catatan: ["قَدْ menegaskan 'sudah'; كان dan madhi sama-sama ikut persona."],
      contoh: {
        kalimat: "كُنْتُ قَدْ كَتَبْتُ الرِّسَالَةَ قَبْلَ أَنْ يَصِلَ.",
        arti: "Saya sudah menulis surat itu sebelum dia tiba.",
        latin: "kuntu qad katabtu r-risālata qabla an yaṣila.",
      },
    },
    {
      id: "mustaqbal",
      nama: "Masa Depan — سَـ / سَوْفَ + Mudhari'",
      ringkas: "Tempel سَـ di depan mudhari' (dekat), atau pakai سَوْفَ terpisah (lebih jauh / tegas).",
      verba: "سَيَكْتُبُ",
      arti: "akan menulis",
      cocok: [/\bfuture\b(?! of)/i, /سوف/],
      baris: urut.map((p, i) => ({
        ...p,
        bentuk: [["سَ", "waktu"], ...mudhari[i].bentuk],
        latin: `sa-${mudhari[i].latin}`,
      })),
      catatan: [
        "سَـ ditulis menyambung; سَوْفَ ditulis terpisah: سَوْفَ أَكْتُبُ.",
        "Negasi masa depan: لَنْ + mudhari' manshub → لَنْ أَكْتُبَ (saya tidak akan menulis).",
      ],
      contoh: { kalimat: "سَأَكْتُبُ لَكَ غَدًا.", arti: "Besok saya akan menulis untukmu.", latin: "sa-aktubu laka ghadan." },
    },
  ],
};

export default data;
