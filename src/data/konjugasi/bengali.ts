import type { KonjugasiBahasa, TabelKonjugasi, Segmen } from "./types";

// Bengali (cholito bhasha standar). Verba contoh করা (kora, melakukan / mengerjakan).
// Verba tidak berubah menurut jumlah — hanya persona & tingkat hormat (তুই / তুমি / আপনি).
// Ejaan mengikuti Bangla Academy: করো (tumi), করছ, করল, করব.

const P = [
  { pronomina: "আমি", arti: "saya" },
  { pronomina: "তুই", arti: "kamu (sangat akrab)" },
  { pronomina: "তুমি", arti: "kamu (biasa)" },
  { pronomina: "সে", arti: "dia" },
  { pronomina: "আপনি / তিনি", arti: "Anda / beliau (hormat)" },
  { pronomina: "আমরা", arti: "kami / kita" },
  { pronomina: "তারা", arti: "mereka" },
];

/** Bangun 7 baris dari penanda waktu + akhiran persona per baris P (akhiran "" = tanpa segmen persona). */
function baris(waktu: string, akhir: string[], latin: string[]): TabelKonjugasi["baris"] {
  return P.map((p, i) => {
    const b: Segmen[] = [["কর", "akar"]];
    if (waktu) b.push([waktu, "waktu"]);
    if (akhir[i]) b.push([akhir[i], "persona"]);
    return { ...p, bentuk: b, latin: latin[i] };
  });
}

const data: KonjugasiBahasa = {
  tabel: [
    {
      id: "kini-sederhana",
      nama: "Kini Sederhana (Present Simple)",
      ringkas: "Kebiasaan & fakta: akar + akhiran persona, tanpa penanda waktu.",
      verba: "করা",
      arti: "melakukan / mengerjakan",
      cocok: [/kini sederhana/i, /tingkat kesopanan/i, /tabel kala/i],
      baris: baris("", ["ি", "িস", "ো", "ে", "েন", "ি", "ে"], ["kori", "koris", "koro", "kore", "koren", "kori", "kore"]),
      catatan: [
        "Akhiran kunci: -i (saya/kami), -is (তুই), -o (তুমি), -e (dia/mereka), -en (hormat).",
        "আমরা = আমি, তারা = সে — jumlah tidak mengubah verba.",
        "Negasi: না di belakang verba → আমি করি না.",
      ],
      contoh: { kalimat: "আমি অফিসে কাজ করি।", arti: "Saya bekerja di kantor.", latin: "ami ofise kaj kori." },
    },
    {
      id: "kini-berlangsung",
      nama: "Kini Berlangsung (Present Continuous)",
      ringkas: "Sedang berlangsung: akar + ছ + akhiran persona.",
      verba: "করা",
      arti: "melakukan / mengerjakan",
      cocok: [/kini berlangsung/i],
      baris: baris("ছ", ["ি", "িস", "", "ে", "েন", "ি", "ে"], ["korchhi", "korchhis", "korchho", "korchhe", "korchhen", "korchhi", "korchhe"]),
      catatan: ["তুমি করছ dibaca korchho — vokal 'o' bawaan tidak ditulis."],
      contoh: { kalimat: "আমি এখন রান্না করছি।", arti: "Saya sedang memasak sekarang.", latin: "ami ekhon ranna korchhi." },
    },
    {
      id: "lampau-sederhana",
      nama: "Lampau Sederhana (Past Simple)",
      ringkas: "Kejadian selesai di masa lalu: akar + ল + akhiran persona.",
      verba: "করা",
      arti: "melakukan / mengerjakan",
      cocok: [/lampau sederhana/i],
      baris: baris("ল", ["াম", "ি", "ে", "", "েন", "াম", ""], ["korlam", "korli", "korle", "korlo", "korlen", "korlam", "korlo"]),
      catatan: ["সে করল dibaca korlo.", "ল = penanda lampau: করি (kini) → করলাম (lampau)."],
      contoh: { kalimat: "গতকাল আমি অনেক কাজ করলাম।", arti: "Kemarin saya banyak bekerja.", latin: "gotokal ami onek kaj korlam." },
    },
    {
      id: "kini-sempurna",
      nama: "Kini Sempurna (Present Perfect)",
      ringkas: "Sudah dilakukan & hasilnya masih terasa: akar + েছ + akhiran persona.",
      verba: "করা",
      arti: "melakukan / mengerjakan",
      cocok: [/lampau sempurna &/i, /করেছি(?!ল)/, /\bkorechhi\b/i],
      baris: baris("েছ", ["ি", "িস", "", "ে", "েন", "ি", "ে"], ["korechhi", "korechhis", "korechho", "korechhe", "korechhen", "korechhi", "korechhe"]),
      catatan: ["Negasi bentuk ini memakai present + নি: আমি করিনি (saya belum/tidak melakukan)."],
      contoh: { kalimat: "আমি কাজটা করেছি।", arti: "Saya sudah mengerjakan tugas itu.", latin: "ami kajta korechhi." },
    },
    {
      id: "lampau-kebiasaan",
      nama: "Lampau Kebiasaan (Past Habitual)",
      ringkas: "'Dulu biasa…': akar + ত + akhiran persona. Juga untuk kalimat pengandaian.",
      verba: "করা",
      arti: "melakukan / mengerjakan",
      cocok: [/করতাম/, /\bkortam\b/i, /lampau .*kebiasaan/i],
      baris: baris("ত", ["াম", "িস", "ে", "", "েন", "াম", ""], ["kortam", "kortis", "korte", "korto", "korten", "kortam", "korto"]),
      catatan: ["Pola akhiran sama dengan lampau sederhana, hanya ল diganti ত (kecuali তুই: -tis)."],
      contoh: {
        kalimat: "ছোটবেলায় আমি অনেক খেলাধুলা করতাম।",
        arti: "Waktu kecil saya dulu banyak berolahraga.",
        latin: "chhotobelay ami onek kheladhula kortam.",
      },
    },
    {
      id: "masa-depan",
      nama: "Masa Depan (Future)",
      ringkas: "Rencana & janji: akar + ব + akhiran persona.",
      verba: "করা",
      arti: "melakukan / mengerjakan",
      cocok: [/verba masa depan/i, /আমি করব/],
      baris: baris("ব", ["", "ি", "ে", "ে", "েন", "", "ে"], ["korbo", "korbi", "korbe", "korbe", "korben", "korbo", "korbe"]),
      catatan: ["আমি করব dibaca korbo.", "তুমি & সে sama-sama করবে — konteks yang membedakan."],
      contoh: { kalimat: "আগামীকাল আমি কাজটা করব।", arti: "Besok saya akan mengerjakannya.", latin: "agamikal ami kajta korbo." },
    },
    {
      id: "lampau-berlangsung",
      nama: "Lampau Berlangsung (Past Continuous)",
      ringkas: "Sedang berlangsung di masa lalu: akar + ছিল + akhiran persona.",
      verba: "করা",
      arti: "melakukan / mengerjakan",
      cocok: [/lampau berlangsung/i, /করছিলাম/],
      baris: baris("ছিল", ["াম", "ি", "ে", "", "েন", "াম", ""], ["korchhilam", "korchhili", "korchhile", "korchhilo", "korchhilen", "korchhilam", "korchhilo"]),
      contoh: {
        kalimat: "তুমি যখন ফোন করলে, আমি রান্না করছিলাম।",
        arti: "Waktu kamu menelepon, saya sedang memasak.",
        latin: "tumi jokhon phon korle, ami ranna korchhilam.",
      },
    },
    {
      id: "lampau-sempurna",
      nama: "Lampau Sempurna (Past Perfect)",
      ringkas: "Sudah selesai sebelum kejadian lampau lain / masa lalu jauh: akar + েছিল + akhiran persona.",
      verba: "করা",
      arti: "melakukan / mengerjakan",
      cocok: [/lampau sempurna(?! &)/i, /করেছিলাম/],
      baris: baris("েছিল", ["াম", "ি", "ে", "", "েন", "াম", ""], ["korechhilam", "korechhili", "korechhile", "korechhilo", "korechhilen", "korechhilam", "korechhilo"]),
      contoh: {
        kalimat: "সে আসার আগেই আমি কাজটা করেছিলাম।",
        arti: "Saya sudah menyelesaikan pekerjaan itu sebelum dia datang.",
        latin: "she ashar agei ami kajta korechhilam.",
      },
    },
    {
      id: "perintah",
      nama: "Perintah (Imperatif)",
      ringkas: "Perintah per tingkat hormat: কর (তুই), করো (তুমি), করুন (আপনি), করুক (biarlah dia).",
      verba: "করা",
      arti: "melakukan / mengerjakan",
      cocok: [/perintah, larangan/i, /imperatif/i],
      baris: [
        { pronomina: "তুই", arti: "kamu (sangat akrab)", bentuk: [["কর", "akar"]], latin: "kor" },
        { pronomina: "তুমি", arti: "kamu (biasa)", bentuk: [["কর", "akar"], ["ো", "persona"]], latin: "koro" },
        { pronomina: "আপনি", arti: "Anda (hormat)", bentuk: [["কর", "akar"], ["ুন", "persona"]], latin: "korun" },
        { pronomina: "সে", arti: "biarlah dia", bentuk: [["কর", "akar"], ["ুক", "persona"]], latin: "koruk" },
      ],
      catatan: ["Larangan: tambah না → কোরো না / করবেন না (jangan).", "Sopan: দয়া করে + করুন."],
      contoh: { kalimat: "দয়া করে একটু অপেক্ষা করুন।", arti: "Mohon tunggu sebentar.", latin: "doya kore ektu opekkha korun." },
    },
  ],
};

export default data;
