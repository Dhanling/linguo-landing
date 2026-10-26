import type { KonjugasiBahasa, Segmen } from "./types";

// Hindi — verba contoh पढ़ना (parhna, membaca/belajar). Gender penutur/subjek ikut di verba:
// -ता (lk tunggal), -ती (pr), -ते (lk jamak / hormat). Latin mengikuti ejaan silabus (parhta hoon).

const P = {
  mainL: { pronomina: "मैं", arti: "saya (lk)" },
  mainP: { pronomina: "मैं", arti: "saya (pr)" },
  tum: { pronomina: "तुम", arti: "kamu" },
  vahL: { pronomina: "वह", arti: "dia (lk)" },
  vahP: { pronomina: "वह", arti: "dia (pr)" },
  ham: { pronomina: "हम", arti: "kami / kita" },
  aap: { pronomina: "आप", arti: "Anda (hormat)" },
  ve: { pronomina: "वे", arti: "mereka" },
};
const URUT = [P.mainL, P.mainP, P.tum, P.vahL, P.vahP, P.ham, P.aap, P.ve];

// [penanda aspek/gender, latin] per baris URUT
const TA: [string, string][] = [["ता", "ta"], ["ती", "ti"], ["ते", "te"], ["ता", "ta"], ["ती", "ti"], ["ते", "te"], ["ते", "te"], ["ते", "te"]];
const RAHA: [string, string][] = [["रहा", "raha"], ["रही", "rahi"], ["रहे", "rahe"], ["रहा", "raha"], ["रही", "rahi"], ["रहे", "rahe"], ["रहे", "rahe"], ["रहे", "rahe"]];
// होना present per baris URUT
const HAI: [string, string][] = [["ूँ", "hoon"], ["ूँ", "hoon"], ["ो", "ho"], ["ै", "hai"], ["ै", "hai"], ["ैं", "hain"], ["ैं", "hain"], ["ैं", "hain"]];
// होना past per baris URUT
const THA: [string, string][] = [["ा", "tha"], ["ी", "thi"], ["े", "the"], ["ा", "tha"], ["ी", "thi"], ["े", "the"], ["े", "the"], ["े", "the"]];

const data: KonjugasiBahasa = {
  tabel: [
    {
      id: "hona",
      nama: "होना — 'adalah' (Present)",
      ringkas: "Kata kerja paling penting: हूँ / हो / है / हैं, selalu di akhir kalimat (SOV).",
      verba: "होना",
      arti: "adalah / ada",
      cocok: [/verb '?hona'?/i],
      baris: URUT.filter((_, i) => i !== 1 && i !== 4).map((p) => {
        const i = URUT.indexOf(p);
        return { ...p, arti: p.arti.replace(/ \((lk|pr)\)/, ""), bentuk: [["ह", "akar"], [HAI[i][0], "persona"]] as Segmen[], latin: HAI[i][1] };
      }),
      catatan: ["होना tidak berubah menurut gender: मैं ठीक हूँ dipakai laki-laki maupun perempuan.", "आप & हम selalu हैं, walau artinya satu orang."],
      contoh: { kalimat: "मैं ठीक हूँ।", arti: "Saya baik-baik saja.", latin: "main theek hoon." },
    },
    {
      id: "vartaman-saamaanya",
      nama: "Present Habitual — -ता है",
      ringkas: "Kebiasaan & fakta: akar + ता/ती/ते (ikut gender subjek) + होना.",
      verba: "पढ़ना",
      arti: "membaca / belajar",
      cocok: [/पीता हूँ/, /\b(parhta|khaata) hoon\b/i],
      baris: URUT.map((p, i) => ({
        ...p,
        bentuk: [["पढ़", "akar"], [`${TA[i][0]} `, "waktu"], [`ह${HAI[i][0]}`, "bantu"]],
        latin: `parh${TA[i][1]} ${HAI[i][1]}`,
      })),
      catatan: [
        "Buang -ना dari infinitif untuk dapat akar: पढ़ना → पढ़.",
        "Perempuan jamak: हम पढ़ती हैं (kami [pr] membaca).",
        "Negasi: नहीं sebelum verba, है sering dibuang → मैं नहीं पढ़ता.",
      ],
      contoh: { kalimat: "मैं रोज़ हिंदी पढ़ता हूँ।", arti: "Saya belajar bahasa Hindi setiap hari.", latin: "main roz hindi parhta hoon." },
    },
    {
      id: "vartaman-satat",
      nama: "Present Progresif — रहा है",
      ringkas: "Sedang berlangsung: akar (tetap) + रहा/रही/रहे + होना.",
      verba: "पढ़ना",
      arti: "membaca / belajar",
      cocok: [/progresif|progressive/i, /present continuous/i, /रहा है/, /\braha hai\b/i],
      baris: URUT.map((p, i) => ({
        ...p,
        bentuk: [["पढ़ ", "akar"], [`${RAHA[i][0]} `, "waktu"], [`ह${HAI[i][0]}`, "bantu"]],
        latin: `parh ${RAHA[i][1]} ${HAI[i][1]}`,
      })),
      catatan: ["Akar ditulis terpisah dari रहा: पढ़ रहा हूँ (bukan *पढ़ता रहा).", "रहा ikut gender subjek, sama seperti -ता."],
      contoh: { kalimat: "वह अभी किताब पढ़ रही है।", arti: "Dia (pr) sedang membaca buku sekarang.", latin: "voh abhi kitaab parh rahi hai." },
    },
    {
      id: "hona-bhoot",
      nama: "होना Lampau — था / थी / थे",
      ringkas: "'Adalah' di masa lalu: था (lk), थी (pr), थे (jamak / hormat).",
      verba: "होना",
      arti: "adalah (dulu)",
      cocok: [/उदास था/, /\budaas thaa?\b/i],
      baris: URUT.map((p, i) => ({ ...p, bentuk: [["थ", "akar"], [THA[i][0], "persona"]] as Segmen[], latin: THA[i][1] })),
      catatan: ["Bentuk lampau ikut gender, berbeda dengan हूँ / है yang netral.", "Perempuan jamak: थीं (thin)."],
      contoh: { kalimat: "मैं कल बीमार था।", arti: "Kemarin saya sakit.", latin: "main kal beemaar tha." },
    },
    {
      id: "bhoot-abhyaas",
      nama: "Past Habitual — -ता था",
      ringkas: "Kebiasaan di masa lalu ('dulu biasa…'): akar + ता/ती/ते + था/थी/थे. Tanpa ने.",
      verba: "पढ़ना",
      arti: "membaca / belajar",
      cocok: [/past habitual/i, /\bparhta thaa?\b/i],
      baris: URUT.map((p, i) => ({
        ...p,
        bentuk: [["पढ़", "akar"], [`${TA[i][0]} `, "waktu"], [`थ${THA[i][0]}`, "bantu"]],
        latin: `parh${TA[i][1]} ${THA[i][1]}`,
      })),
      catatan: ["Bukan perfektif, jadi subjek tetap मैं (bukan मैंने) walau verbanya transitif."],
      contoh: { kalimat: "बचपन में मैं बहुत पढ़ता था।", arti: "Waktu kecil saya banyak membaca.", latin: "bachpan mein main bahut parhta tha." },
    },
    {
      id: "bhoot-poorn-ne",
      nama: "Past Perfektif + ने (Ergatif)",
      ringkas: "Verba transitif di lampau perfektif: subjek + ने, verba ikut gender OBJEK (bukan subjek).",
      verba: "पढ़ना",
      arti: "membaca",
      cocok: [/(?<!future )perfective/i, /ने marker/, /\b(mainne|usne)\b/i, /उसने/],
      baris: [
        { pronomina: "मैं", arti: "saya", bentuk: [["मैं", "persona"], ["ने ", "lain"], ["पढ़", "akar"], ["ा", "waktu"]], latin: "mainne parha" },
        { pronomina: "तुम", arti: "kamu", bentuk: [["तुम", "persona"], ["ने ", "lain"], ["पढ़", "akar"], ["ा", "waktu"]], latin: "tumne parha" },
        { pronomina: "वह", arti: "dia", bentuk: [["उस", "persona"], ["ने ", "lain"], ["पढ़", "akar"], ["ा", "waktu"]], latin: "usne parha" },
        { pronomina: "हम", arti: "kami / kita", bentuk: [["हम", "persona"], ["ने ", "lain"], ["पढ़", "akar"], ["ा", "waktu"]], latin: "hamne parha" },
        { pronomina: "आप", arti: "Anda", bentuk: [["आप", "persona"], ["ने ", "lain"], ["पढ़", "akar"], ["ा", "waktu"]], latin: "aapne parha" },
        { pronomina: "वे", arti: "mereka", bentuk: [["उन्हों", "persona"], ["ने ", "lain"], ["पढ़", "akar"], ["ा", "waktu"]], latin: "unhonne parha" },
      ],
      catatan: [
        "Verba tidak berubah menurut subjek — yang berubah bentuk pronomina + ने.",
        "Objek perempuan → -ी: मैंने किताब पढ़ी. Objek laki-laki → -ा: मैंने अख़बार पढ़ा.",
        "Verba intransitif (जाना, आना, सोना) tanpa ने dan ikut subjek: वह गई (dia [pr] pergi).",
      ],
      contoh: { kalimat: "मैंने किताब पढ़ी।", arti: "Saya (sudah) membaca buku itu.", latin: "mainne kitaab parhi." },
    },
    {
      id: "bhavishya",
      nama: "Future — -ऊँगा / -एगा",
      ringkas: "Akhiran persona + गा/गी/गे (ikut gender) langsung menempel pada akar.",
      verba: "पढ़ना",
      arti: "membaca / belajar",
      cocok: [/future (simple|tense)/i, /\b-?egaa?\b/i, /पढ़ूँगा|करूँगा|करेंगे/],
      baris: [
        { ...P.mainL, bentuk: [["पढ़", "akar"], ["ूँ", "persona"], ["गा", "waktu"]], latin: "parhunga" },
        { ...P.mainP, bentuk: [["पढ़", "akar"], ["ूँ", "persona"], ["गी", "waktu"]], latin: "parhungi" },
        { ...P.tum, bentuk: [["पढ़", "akar"], ["ो", "persona"], ["गे", "waktu"]], latin: "parhoge" },
        { ...P.vahL, bentuk: [["पढ़", "akar"], ["े", "persona"], ["गा", "waktu"]], latin: "parhega" },
        { ...P.vahP, bentuk: [["पढ़", "akar"], ["े", "persona"], ["गी", "waktu"]], latin: "parhegi" },
        { ...P.ham, bentuk: [["पढ़", "akar"], ["ें", "persona"], ["गे", "waktu"]], latin: "parhenge" },
        { ...P.aap, bentuk: [["पढ़", "akar"], ["ें", "persona"], ["गे", "waktu"]], latin: "parhenge" },
        { ...P.ve, bentuk: [["पढ़", "akar"], ["ें", "persona"], ["गे", "waktu"]], latin: "parhenge" },
      ],
      catatan: ["Ditulis satu kata (पढ़ूँगा) — beda dengan Urdu yang memisah گا.", "Tanpa गा = subjungtif: मैं पढ़ूँ? (boleh saya baca?)."],
      contoh: { kalimat: "मैं कल पढ़ूँगा।", arti: "Besok saya akan belajar.", latin: "main kal parhunga." },
    },
    {
      id: "aagyaarth",
      nama: "Imperatif per Tingkat Hormat",
      ringkas: "Perintah berubah menurut keakraban: तू (akar saja), तुम (-ओ), आप (-इए).",
      verba: "खाना",
      arti: "makan",
      cocok: [/imperative|imperatif/i],
      baris: [
        { pronomina: "तू", arti: "kamu (sangat akrab)", bentuk: [["खा", "akar"]], latin: "khaa" },
        { pronomina: "तुम", arti: "kamu (biasa)", bentuk: [["खा", "akar"], ["ओ", "persona"]], latin: "khaao" },
        { pronomina: "आप", arti: "Anda (sopan)", bentuk: [["खा", "akar"], ["इए", "persona"]], latin: "khaaiye" },
      ],
      catatan: ["Ke orang yang lebih tua / belum kenal selalu pakai bentuk आप.", "Larangan: मत (jangan) → मत खाओ."],
      contoh: { kalimat: "आप खाना खाइए।", arti: "Silakan makan.", latin: "aap khaana khaaiye." },
    },
  ],
};

export default data;
