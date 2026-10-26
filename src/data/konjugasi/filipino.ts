import type { KonjugasiBahasa } from "./types";

// Filipino / Tagalog — verba TIDAK berubah menurut persona (ako, ikaw, siya … bentuknya sama).
// Yang berubah adalah ASPEK, jadi tiap baris = satu aspek (pawatas, naganap, nagaganap, magaganap),
// dan tiap tabel = satu jenis afiks (fokus). Reduplikasi suku kata pertama = penanda aspek (waktu).

const ASPEK = {
  pawatas: { pronomina: "Pawatas", arti: "bentuk dasar / perintah" },
  naganap: { pronomina: "Naganap", arti: "completed — sudah" },
  nagaganap: { pronomina: "Nagaganap", arti: "incompleted — sedang / biasa" },
  magaganap: { pronomina: "Magaganap", arti: "contemplated — akan" },
};

const data: KonjugasiBahasa = {
  tabel: [
    {
      id: "um",
      nama: "Afiks -UM- (Fokus Aktor)",
      ringkas: "Sisipan -um- setelah konsonan pertama. Aspek: kumain (sudah), kumakain (sedang), kakain (akan).",
      verba: "kain",
      arti: "makan",
      cocok: [/aspek/i, /-um-/i, /\bkumakain\b/i, /pertanyaan past/i],
      baris: [
        { ...ASPEK.pawatas, bentuk: [["k", "akar"], ["um", "lain"], ["ain", "akar"]] },
        { ...ASPEK.naganap, bentuk: [["k", "akar"], ["um", "lain"], ["ain", "akar"]] },
        { ...ASPEK.nagaganap, bentuk: [["k", "waktu"], ["um", "lain"], ["a", "waktu"], ["kain", "akar"]] },
        { ...ASPEK.magaganap, bentuk: [["ka", "waktu"], ["kain", "akar"]] },
      ],
      catatan: [
        "Pawatas & naganap sama-sama 'kumain' — konteks (kahapon, ngayon) yang membedakan.",
        "Magaganap = ulang suku kata pertama TANPA -um-: kain → kakain, sulat → susulat.",
        "Akar berawal vokal: -um- jadi awalan → alis → umalis, umaalis, aalis.",
      ],
      contoh: { kalimat: "Kumain na ako. Kakain ka ba mamaya?", arti: "Saya sudah makan. Apakah kamu akan makan nanti?" },
    },
    {
      id: "mag",
      nama: "Afiks MAG- (Fokus Aktor)",
      ringkas: "Awalan mag-; m → n saat aksi sudah dimulai/selesai: magluto → nagluto, nagluluto, magluluto.",
      verba: "luto",
      arti: "memasak",
      cocok: [/\bmag-|\bnag-/i, /\b(magluto|nagluluto|nagsulat|nagbabasa)\b/i],
      baris: [
        { ...ASPEK.pawatas, bentuk: [["mag", "lain"], ["luto", "akar"]] },
        { ...ASPEK.naganap, bentuk: [["n", "waktu"], ["ag", "lain"], ["luto", "akar"]] },
        { ...ASPEK.nagaganap, bentuk: [["n", "waktu"], ["ag", "lain"], ["lu", "waktu"], ["luto", "akar"]] },
        { ...ASPEK.magaganap, bentuk: [["mag", "lain"], ["lu", "waktu"], ["luto", "akar"]] },
      ],
      catatan: [
        "Aturan m → n: naganap & nagaganap pakai n- (nag-), pawatas & magaganap tetap m- (mag-).",
        "Pawatas dipakai sebagai perintah: Magluto po kayo (silakan masak).",
      ],
      contoh: { kalimat: "Nagluluto si Nanay ng adobo.", arti: "Ibu sedang memasak adobo." },
    },
    {
      id: "in",
      nama: "Afiks -IN (Fokus Objek)",
      ringkas: "Objek jadi fokus (ang), aktor ditandai ng: kinain ng aso ang isda (ikannya dimakan anjing).",
      verba: "kain",
      arti: "makan → dimakan",
      cocok: [/\b(kinain|ginagawa|kinakain)\b/i, /focus marker drill/i],
      baris: [
        { ...ASPEK.pawatas, bentuk: [["kain", "akar"], ["in", "lain"]] },
        { ...ASPEK.naganap, bentuk: [["k", "akar"], ["in", "lain"], ["ain", "akar"]] },
        { ...ASPEK.nagaganap, bentuk: [["k", "waktu"], ["in", "lain"], ["a", "waktu"], ["kain", "akar"]] },
        { ...ASPEK.magaganap, bentuk: [["ka", "waktu"], ["kain", "akar"], ["in", "lain"]] },
      ],
      catatan: [
        "Naganap & nagaganap: -in- jadi SISIPAN dan akhiran -in hilang (kinain, kinakain).",
        "Pola sama untuk gawa: gawin → ginawa, ginagawa, gagawin.",
      ],
      contoh: { kalimat: "Kinain ng aso ang isda.", arti: "Ikan itu dimakan (oleh) anjing." },
    },
    {
      id: "ma",
      nama: "Afiks MA- (Keadaan / Intransitif)",
      ringkas: "Untuk verba keadaan seperti tidur & melihat: matulog → natulog, natutulog, matutulog.",
      verba: "tulog",
      arti: "tidur",
      cocok: [/\b(natutulog|matulog|natulog)\b/i],
      baris: [
        { ...ASPEK.pawatas, bentuk: [["ma", "lain"], ["tulog", "akar"]] },
        { ...ASPEK.naganap, bentuk: [["n", "waktu"], ["a", "lain"], ["tulog", "akar"]] },
        { ...ASPEK.nagaganap, bentuk: [["n", "waktu"], ["a", "lain"], ["tu", "waktu"], ["tulog", "akar"]] },
        { ...ASPEK.magaganap, bentuk: [["ma", "lain"], ["tu", "waktu"], ["tulog", "akar"]] },
      ],
      catatan: ["Aturan m → n sama dengan mag-: matulog → natulog."],
      contoh: { kalimat: "Natutulog pa ang bata.", arti: "Anak itu masih tidur." },
    },
  ],
};

export default data;
