import type { KonjugasiBahasa, Segmen } from "./types";

// Urdu — tata bahasa identik dengan Hindi, aksara Nastaliq (RTL).
// Verba contoh پڑھنا (parhna, membaca/belajar). Latin mengikuti ejaan silabus (parhta hoon).

const P = {
  mainL: { pronomina: "میں", arti: "saya (lk)" },
  mainP: { pronomina: "میں", arti: "saya (pr)" },
  tum: { pronomina: "تم", arti: "kamu" },
  wohL: { pronomina: "وہ", arti: "dia (lk)" },
  wohP: { pronomina: "وہ", arti: "dia (pr)" },
  ham: { pronomina: "ہم", arti: "kami / kita" },
  aap: { pronomina: "آپ", arti: "Anda (hormat)" },
  woh: { pronomina: "وہ", arti: "mereka" },
};
const URUT = [P.mainL, P.mainP, P.tum, P.wohL, P.wohP, P.ham, P.aap, P.woh];

const TA: [string, string][] = [["تا", "ta"], ["تی", "ti"], ["تے", "te"], ["تا", "ta"], ["تی", "ti"], ["تے", "te"], ["تے", "te"], ["تے", "te"]];
const RAHA: [string, string][] = [["رہا", "raha"], ["رہی", "rahi"], ["رہے", "rahe"], ["رہا", "raha"], ["رہی", "rahi"], ["رہے", "rahe"], ["رہے", "rahe"], ["رہے", "rahe"]];
// ہونا present: akhiran setelah ہ
const HAI: [string, string][] = [["وں", "hoon"], ["وں", "hoon"], ["و", "ho"], ["ے", "hai"], ["ے", "hai"], ["یں", "hain"], ["یں", "hain"], ["یں", "hain"]];
// ہونا past: akhiran setelah تھ
const THA: [string, string][] = [["ا", "tha"], ["ی", "thi"], ["ے", "the"], ["ا", "tha"], ["ی", "thi"], ["ے", "the"], ["ے", "the"], ["ے", "the"]];

const data: KonjugasiBahasa = {
  rtl: true,
  tabel: [
    {
      id: "hona",
      nama: "ہونا — 'adalah' (Present)",
      ringkas: "ہوں / ہو / ہے / ہیں di akhir kalimat (SOV), tidak berubah menurut gender.",
      verba: "ہونا",
      arti: "adalah / ada",
      cocok: [/verb '?hona'?/i],
      baris: [P.mainL, P.tum, P.wohL, P.ham, P.aap, P.woh].map((p) => {
        const i = URUT.indexOf(p);
        return { ...p, arti: p.arti.replace(/ \((lk|pr)\)/, ""), bentuk: [["ہ", "akar"], [HAI[i][0], "persona"]] as Segmen[], latin: HAI[i][1] };
      }),
      catatan: ["آپ & ہم selalu ہیں, walau maksudnya satu orang.", "وہ bisa berarti 'dia' (ہے) atau 'mereka' (ہیں) — lihat verbanya."],
      contoh: { kalimat: "میں ٹھیک ہوں۔", arti: "Saya baik-baik saja.", latin: "main theek hoon." },
    },
    {
      id: "haal-mutlaq",
      nama: "Present Habitual — -تا ہے",
      ringkas: "Kebiasaan & fakta: akar + تا/تی/تے (ikut gender subjek) + ہونا.",
      verba: "پڑھنا",
      arti: "membaca / belajar",
      cocok: [/\bparhta hoon\b|پڑھتا ہوں/i, /agreement adjective \+ verb/i],
      baris: URUT.map((p, i) => ({
        ...p,
        bentuk: [["پڑھ", "akar"], [`${TA[i][0]} `, "waktu"], [`ہ${HAI[i][0]}`, "bantu"]],
        latin: `parh${TA[i][1]} ${HAI[i][1]}`,
      })),
      catatan: [
        "Buang -نا dari infinitif untuk dapat akar: پڑھنا → پڑھ.",
        "Perempuan jamak: ہم پڑھتی ہیں (kami [pr] membaca).",
      ],
      contoh: { kalimat: "میں روز اردو پڑھتا ہوں۔", arti: "Saya belajar bahasa Urdu setiap hari.", latin: "main roz urdu parhta hoon." },
    },
    {
      id: "haal-jaari",
      nama: "Present Progresif — رہا ہے",
      ringkas: "Sedang berlangsung: akar + رہا/رہی/رہے (ikut gender) + ہونا.",
      verba: "پڑھنا",
      arti: "membaca / belajar",
      cocok: [/progresif|progressive(?! writers)/i, /present continuous/i, /\braha hai\b/i, /رہا ہے/],
      baris: URUT.map((p, i) => ({
        ...p,
        bentuk: [["پڑھ ", "akar"], [`${RAHA[i][0]} `, "waktu"], [`ہ${HAI[i][0]}`, "bantu"]],
        latin: `parh ${RAHA[i][1]} ${HAI[i][1]}`,
      })),
      catatan: ["Akar ditulis terpisah: پڑھ رہا ہوں."],
      contoh: { kalimat: "وہ ابھی کتاب پڑھ رہی ہے۔", arti: "Dia (pr) sedang membaca buku sekarang.", latin: "woh abhi kitaab parh rahi hai." },
    },
    {
      id: "hona-maazi",
      nama: "ہونا Lampau — تھا / تھی / تھے",
      ringkas: "'Adalah' di masa lalu: تھا (lk), تھی (pr), تھے (jamak / hormat).",
      verba: "ہونا",
      arti: "adalah (dulu)",
      cocok: [/\b(udaas|waqt) tha\b/i, /(اداس|وقت) تھا/],
      baris: URUT.map((p, i) => ({ ...p, bentuk: [["تھ", "akar"], [THA[i][0], "persona"]] as Segmen[], latin: THA[i][1] })),
      catatan: ["Berbeda dengan ہوں / ہے, bentuk lampau ikut gender.", "Perempuan jamak: تھیں (thin)."],
      contoh: { kalimat: "میں کل بیمار تھا۔", arti: "Kemarin saya sakit.", latin: "main kal beemaar tha." },
    },
    {
      id: "maazi-ne",
      nama: "Past Perfektif + نے",
      ringkas: "Verba transitif di lampau perfektif: subjek + نے, verba ikut gender OBJEK.",
      verba: "پڑھنا",
      arti: "membaca",
      cocok: [/perfective/i, /\b(mainne|usne)\b/i, /(میں|اس) نے/],
      baris: [
        { pronomina: "میں", arti: "saya", bentuk: [["میں ", "persona"], ["نے ", "lain"], ["پڑھ", "akar"], ["ا", "waktu"]], latin: "main ne parha" },
        { pronomina: "تم", arti: "kamu", bentuk: [["تم ", "persona"], ["نے ", "lain"], ["پڑھ", "akar"], ["ا", "waktu"]], latin: "tum ne parha" },
        { pronomina: "وہ", arti: "dia", bentuk: [["اس ", "persona"], ["نے ", "lain"], ["پڑھ", "akar"], ["ا", "waktu"]], latin: "us ne parha" },
        { pronomina: "ہم", arti: "kami / kita", bentuk: [["ہم ", "persona"], ["نے ", "lain"], ["پڑھ", "akar"], ["ا", "waktu"]], latin: "ham ne parha" },
        { pronomina: "آپ", arti: "Anda", bentuk: [["آپ ", "persona"], ["نے ", "lain"], ["پڑھ", "akar"], ["ا", "waktu"]], latin: "aap ne parha" },
        { pronomina: "وہ", arti: "mereka", bentuk: [["انہوں ", "persona"], ["نے ", "lain"], ["پڑھ", "akar"], ["ا", "waktu"]], latin: "unhon ne parha" },
      ],
      catatan: [
        "Urdu menulis نے terpisah (میں نے), Hindi menyambung (मैंने).",
        "Objek perempuan → -ی: میں نے کتاب پڑھی. Objek laki-laki → -ا: میں نے اخبار پڑھا.",
        "Verba intransitif (جانا, آنا) tanpa نے dan ikut subjek: وہ گئی (dia [pr] pergi).",
      ],
      contoh: { kalimat: "میں نے کتاب پڑھی۔", arti: "Saya (sudah) membaca buku itu.", latin: "main ne kitaab parhi." },
    },
    {
      id: "mustaqbil",
      nama: "Future — -وں گا / -ے گا",
      ringkas: "Akar + akhiran persona, lalu گا/گی/گے (ikut gender) ditulis terpisah.",
      verba: "پڑھنا",
      arti: "membaca / belajar",
      cocok: [/future (simple|tense)/i, /\bkarenge\b/i, /کریں گے/],
      baris: [
        { ...P.mainL, bentuk: [["پڑھ", "akar"], ["وں ", "persona"], ["گا", "waktu"]], latin: "parhunga" },
        { ...P.mainP, bentuk: [["پڑھ", "akar"], ["وں ", "persona"], ["گی", "waktu"]], latin: "parhungi" },
        { ...P.tum, bentuk: [["پڑھ", "akar"], ["و ", "persona"], ["گے", "waktu"]], latin: "parhoge" },
        { ...P.wohL, bentuk: [["پڑھ", "akar"], ["ے ", "persona"], ["گا", "waktu"]], latin: "parhega" },
        { ...P.wohP, bentuk: [["پڑھ", "akar"], ["ے ", "persona"], ["گی", "waktu"]], latin: "parhegi" },
        { ...P.ham, bentuk: [["پڑھ", "akar"], ["یں ", "persona"], ["گے", "waktu"]], latin: "parhenge" },
        { ...P.aap, bentuk: [["پڑھ", "akar"], ["یں ", "persona"], ["گے", "waktu"]], latin: "parhenge" },
        { ...P.woh, bentuk: [["پڑھ", "akar"], ["یں ", "persona"], ["گے", "waktu"]], latin: "parhenge" },
      ],
      catatan: ["Contoh di silabus: پھر بات کریں گے (phir baat karenge) — nanti kita bicara lagi."],
      contoh: { kalimat: "میں کل پڑھوں گا۔", arti: "Besok saya akan belajar.", latin: "main kal parhunga." },
    },
  ],
};

export default data;
