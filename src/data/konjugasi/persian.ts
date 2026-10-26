import type { KonjugasiBahasa } from "./types";

// Persia (Farsi standar Tehran). Verba contoh خواندن (khândan, membaca):
// akar present خوان (khân), akar past خواند (khând). ZWNJ (‌) wajib di می‌ dan آن‌ها.

const ZWNJ = "‌";
const MI = `می${ZWNJ}`;

const P = [
  { pronomina: "من", arti: "saya" },
  { pronomina: "تو", arti: "kamu (akrab)" },
  { pronomina: "او", arti: "dia" },
  { pronomina: "ما", arti: "kami / kita" },
  { pronomina: "شما", arti: "kalian / Anda (sopan)" },
  { pronomina: `آن${ZWNJ}ها`, arti: "mereka" },
];

// akhiran persona (sama untuk present & past, kecuali او)
const AKHIR = ["م", "ی", "", "یم", "ید", "ند"];
const AKHIR_LAT = ["am", "i", "", "im", "id", "and"];

const data: KonjugasiBahasa = {
  rtl: true,
  tabel: [
    {
      id: "budan",
      nama: "بودن — 'adalah' (bentuk pendek)",
      ringkas: "Akhiran 'adalah' menempel pada kata sifat / benda: -am, -i, ast, -im, -id, -and.",
      verba: "بودن",
      arti: "adalah / berada",
      cocok: [/بودن/, /\bam, i, ast\b/i],
      baris: [
        { ...P[0], bentuk: [["خوب", "akar"], ["م", "persona"]], latin: "khubam" },
        { ...P[1], bentuk: [["خوب", "akar"], ["ی", "persona"]], latin: "khubi" },
        { ...P[2], bentuk: [["خوب ", "akar"], ["است", "persona"]], latin: "khub ast" },
        { ...P[3], bentuk: [["خوب", "akar"], ["یم", "persona"]], latin: "khubim" },
        { ...P[4], bentuk: [["خوب", "akar"], ["ید", "persona"]], latin: "khubid" },
        { ...P[5], bentuk: [["خوب", "akar"], ["ند", "persona"]], latin: "khuband" },
      ],
      catatan: [
        "Contoh memakai خوب (baik): 'saya baik', 'kamu baik', dst.",
        "Bentuk lengkap/penegas: هستم، هستی، هست، هستیم، هستید، هستند.",
        "Negasi: نیستم، نیستی، نیست … (saya bukan / tidak …).",
      ],
      contoh: { kalimat: "من خوبم، ممنون.", arti: "Saya baik, terima kasih.", latin: "man khubam, mamnun." },
    },
    {
      id: "hal-sade",
      nama: "Present — می‌ + Akar Present",
      ringkas: "Sedang / biasa / akan dekat: می‌ + akar present + akhiran persona.",
      verba: "خواندن",
      arti: "membaca",
      cocok: [/verba present/i, /می \+ stem/i],
      baris: P.map((p, i) => ({
        ...p,
        bentuk: [[MI, "waktu"], ["خوان", "akar"], [AKHIR[i] || "د", "persona"]],
        latin: `mikhân${AKHIR_LAT[i] || "ad"}`,
      })),
      catatan: [
        "او di present memakai akhiran -ad (می‌خواند), bukan kosong seperti di past.",
        "Negasi: نمی‌ + akar → نمی‌خوانم (saya tidak membaca).",
        "Akar present sering tak beraturan: رفتن → رو (می‌روم), دیدن → بین (می‌بینم).",
      ],
      contoh: { kalimat: `من هر شب کتاب ${MI}خوانم.`, arti: "Saya membaca buku setiap malam.", latin: "man har shab ketâb mikhânam." },
    },
    {
      id: "amr",
      nama: "Imperatif — بـ + Akar Present",
      ringkas: "Perintah: بـ + akar present (tunggal), + -id untuk jamak / sopan. Larangan: نـ.",
      verba: "خوردن",
      arti: "makan",
      cocok: [/imperatif/i],
      baris: [
        { pronomina: "تو", arti: "kamu (akrab)", bentuk: [["ب", "waktu"], ["خور", "akar"]], latin: "bokhor" },
        { pronomina: "شما", arti: "kalian / Anda", bentuk: [["ب", "waktu"], ["خور", "akar"], ["ید", "persona"]], latin: "bokhorid" },
        { pronomina: "تو (larangan)", arti: "jangan (kamu)", bentuk: [["ن", "lain"], ["خور", "akar"]], latin: "nakhor" },
        { pronomina: "شما (larangan)", arti: "jangan (Anda)", bentuk: [["ن", "lain"], ["خور", "akar"], ["ید", "persona"]], latin: "nakhorid" },
      ],
      catatan: [
        "Vokal بـ ikut suku kata berikutnya: bokhor, tapi bezan (بزن), beravid (بروید).",
        "Lebih sopan: لطفاً + imperatif, atau بفرمایید (silakan).",
      ],
      contoh: { kalimat: "لطفاً بنشینید و چای بخورید.", arti: "Silakan duduk dan minum teh.", latin: "lotfan beneshinid va châi bokhorid." },
    },
    {
      id: "gozashte-sade",
      nama: "Past Simple — Akar Past",
      ringkas: "Akar past (berakhiran -d/-t) + akhiran persona; او tanpa akhiran.",
      verba: "خواندن",
      arti: "membaca",
      cocok: [/past simple/i, /verba past(?! —)/i, /past tense/i, /pertanyaan past/i],
      baris: P.map((p, i) => ({
        ...p,
        bentuk: [["خوان", "akar"], ["د", "waktu"], ...(AKHIR[i] ? ([[AKHIR[i], "persona"]] as [string, "persona"][]) : [])],
        latin: `khând${AKHIR_LAT[i]}`,
      })),
      catatan: [
        "Akar past = infinitif tanpa -an: خواندن → خواند, رفتن → رفت, خوردن → خورد.",
        "Negasi: نـ di depan → نخواندم (saya tidak membaca).",
      ],
      contoh: { kalimat: "دیروز یک کتاب خواندم.", arti: "Kemarin saya membaca sebuah buku.", latin: "diruz yek ketâb khândam." },
    },
    {
      id: "gozashte-estemrari",
      nama: "Past Continuous — می‌ + Akar Past",
      ringkas: "Sedang / biasa melakukan di masa lalu: می‌ + akar past + akhiran persona.",
      verba: "خواندن",
      arti: "membaca",
      cocok: [/past continuous/i],
      baris: P.map((p, i) => ({
        ...p,
        bentuk: [[MI, "waktu"], ["خوان", "akar"], ["د", "waktu"], ...(AKHIR[i] ? ([[AKHIR[i], "persona"]] as [string, "persona"][]) : [])],
        latin: `mikhând${AKHIR_LAT[i]}`,
      })),
      catatan: ["Sama dengan past simple, cukup tambah می‌ di depan: خواندم → می‌خواندم."],
      contoh: {
        kalimat: `وقتی بچه بودم، زیاد کتاب ${MI}خواندم.`,
        arti: "Waktu kecil, saya sering membaca buku.",
        latin: "vaqti bachche budam, ziyâd ketâb mikhândam.",
      },
    },
    {
      id: "gozashte-baeid",
      nama: "Past Perfect — Partisip + بودن",
      ringkas: "Sudah terjadi sebelum kejadian lampau lain: akar past + ـه, lalu بود + akhiran persona.",
      verba: "خواندن",
      arti: "membaca",
      cocok: [/past perfect/i],
      baris: P.map((p, i) => ({
        ...p,
        bentuk: [["خوان", "akar"], ["ده ", "waktu"], ["بود", "bantu"], ...(AKHIR[i] ? ([[AKHIR[i], "persona"]] as [string, "persona"][]) : [])],
        latin: `khânde bud${AKHIR_LAT[i]}`,
      })),
      catatan: ["Partisip lampau = akar past + ـه: خوانده (khânde), رفته (rafte)."],
      contoh: { kalimat: "قبلاً آن کتاب را خوانده بودم.", arti: "Saya sudah pernah membaca buku itu sebelumnya.", latin: "qablan ân ketâb râ khânde budam." },
    },
    {
      id: "ayande",
      nama: "Future — خواه + Akar Past",
      ringkas: "Formal/tulis: خواه + akhiran persona, lalu akar past (tanpa akhiran).",
      verba: "خواندن",
      arti: "membaca",
      cocok: [/future simple/i, /(?<!می‌?)خواهم(?! \+)/],
      baris: P.map((p, i) => ({
        ...p,
        bentuk: [["خواه", "bantu"], [`${AKHIR[i] || "د"} `, "persona"], ["خواند", "akar"]],
        latin: `khâh${AKHIR_LAT[i] || "ad"} khând`,
      })),
      catatan: [
        "Dalam percakapan, masa depan cukup pakai present: فردا می‌خوانم (besok saya baca).",
        "Jangan tertukar dengan می‌خواهم = 'saya mau' (dari خواستن).",
      ],
      contoh: { kalimat: "فردا این کتاب را خواهم خواند.", arti: "Besok saya akan membaca buku ini.", latin: "fardâ in ketâb râ khâham khând." },
    },
  ],
};

export default data;
