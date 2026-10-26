import type { KonjugasiBahasa } from "./types";

// Korea — verba tidak berubah menurut persona; yang berubah tingkat tutur & kala.
// Kolom pronomina diisi verba kamus/label bentuk. Romanisasi: Revised Romanization.
// Catatan: Hangul ditulis per suku kata, jadi kontraksi (가 + 아요 → 가요, 하 + 였 → 했)
// tidak bisa dipotong di dalam satu suku — contoh utama memakai batang yang tak melebur.
const data: KonjugasiBahasa = {
  tabel: [
    {
      id: "haeyo-sekarang",
      nama: "~아요 / ~어요 (Sopan, Sekarang)",
      ringkas: "Tingkat tutur standar (해요체). Vokal terakhir batang ㅏ/ㅗ → ~아요, lainnya → ~어요, 하 → 해요.",
      verba: "berbagai verba",
      arti: "aturan vokal",
      cocok: [/~아\/어요/i, /daily routine verbs/i, /verbs of motion/i],
      baris: [
        { pronomina: "앉다 (ㅏ)", arti: "duduk", bentuk: [["앉", "akar"], ["아요", "lain"]], latin: "anjayo" },
        { pronomina: "놀다 (ㅗ)", arti: "bermain", bentuk: [["놀", "akar"], ["아요", "lain"]], latin: "norayo" },
        { pronomina: "먹다", arti: "makan", bentuk: [["먹", "akar"], ["어요", "lain"]], latin: "meogeoyo" },
        { pronomina: "읽다", arti: "membaca", bentuk: [["읽", "akar"], ["어요", "lain"]], latin: "ilgeoyo" },
        { pronomina: "공부하다 (하)", arti: "belajar", bentuk: [["공부", "akar"], ["해요", "lain"]], latin: "gongbuhaeyo" },
        { pronomina: "가다 (lebur)", arti: "pergi", bentuk: [["가", "akar"], ["요", "lain"]], latin: "gayo" },
      ],
      catatan: [
        "Batang bervokal melebur: 가 + 아요 → 가요, 보 + 아요 → 봐요, 마시 + 어요 → 마셔요.",
        "Pertanyaan = bentuk yang sama dengan intonasi naik: 먹어요?",
      ],
      contoh: { kalimat: "저는 매일 밥을 먹어요.", arti: "Saya makan nasi setiap hari.", latin: "Jeoneun maeil babeul meogeoyo." },
    },
    {
      id: "haeyo-lampau",
      nama: "~았어요 / ~었어요 (Lampau)",
      ringkas: "Batang + ~았/었 (penanda lampau, aturan vokal sama) + 어요.",
      verba: "berbagai verba",
      arti: "aturan vokal",
      cocok: [/past tense ~았/i, /days\/months past/i],
      baris: [
        { pronomina: "앉다 (ㅏ)", arti: "sudah duduk", bentuk: [["앉", "akar"], ["았", "waktu"], ["어요", "lain"]], latin: "anjasseoyo" },
        { pronomina: "놀다 (ㅗ)", arti: "sudah bermain", bentuk: [["놀", "akar"], ["았", "waktu"], ["어요", "lain"]], latin: "norasseoyo" },
        { pronomina: "먹다", arti: "sudah makan", bentuk: [["먹", "akar"], ["었", "waktu"], ["어요", "lain"]], latin: "meogeosseoyo" },
        { pronomina: "읽다", arti: "sudah membaca", bentuk: [["읽", "akar"], ["었", "waktu"], ["어요", "lain"]], latin: "ilgeosseoyo" },
        { pronomina: "공부하다 (하)", arti: "sudah belajar", bentuk: [["공부", "akar"], ["했", "waktu"], ["어요", "lain"]], latin: "gongbuhaesseoyo" },
      ],
      catatan: ["했 = 하 + 였 yang melebur; 갔어요 = 가 + 았어요; 마셨어요 = 마시 + 었어요."],
      contoh: { kalimat: "어제 친구하고 놀았어요.", arti: "Kemarin saya bermain dengan teman.", latin: "Eoje chinguhago norasseoyo." },
    },
    {
      id: "masa-depan",
      nama: "~(으)ㄹ 거예요 (Akan)",
      ringkas: "Rencana / perkiraan: batang berakhir konsonan + 을 거예요, berakhir vokal + ㄹ 거예요.",
      verba: "berbagai verba",
      arti: "akan …",
      cocok: [/future ~을/i],
      baris: [
        { pronomina: "먹다", arti: "akan makan", bentuk: [["먹", "akar"], ["을", "waktu"], [" 거예요", "bantu"]], latin: "meogeul geoyeyo" },
        { pronomina: "읽다", arti: "akan membaca", bentuk: [["읽", "akar"], ["을", "waktu"], [" 거예요", "bantu"]], latin: "ilgeul geoyeyo" },
        { pronomina: "앉다", arti: "akan duduk", bentuk: [["앉", "akar"], ["을", "waktu"], [" 거예요", "bantu"]], latin: "anjeul geoyeyo" },
        { pronomina: "공부하다", arti: "akan belajar", bentuk: [["공부", "akar"], ["할", "waktu"], [" 거예요", "bantu"]], latin: "gongbuhal geoyeyo" },
      ],
      catatan: [
        "Batang vokal: ㄹ menempel di suku terakhir: 가다 → 갈 거예요, 하다 → 할 거예요.",
        "Batang ㄹ cukup langsung: 놀다 → 놀 거예요.",
        "Versi formal: ~(으)ㄹ 겁니다.",
      ],
      contoh: { kalimat: "내일 한국어를 공부할 거예요.", arti: "Besok saya akan belajar bahasa Korea.", latin: "Naeil hangugeoreul gongbuhal geoyeyo." },
    },
    {
      id: "hapsyo",
      nama: "~습니다 / ~ㅂ니다 (Formal, 합쇼체)",
      ringkas: "Tingkat tutur formal untuk bisnis, berita, presentasi. Batang konsonan + 습니다, batang vokal + ㅂ니다.",
      verba: "먹다 · 공부하다",
      arti: "makan · belajar",
      cocok: [/합쇼체/],
      baris: [
        { pronomina: "~습니다 (sekarang)", arti: "makan", bentuk: [["먹", "akar"], ["습니다", "lain"]], latin: "meokseumnida" },
        { pronomina: "~습니까? (tanya)", arti: "apakah makan?", bentuk: [["먹", "akar"], ["습니까", "lain"]], latin: "meokseumnikka" },
        { pronomina: "~었습니다 (lampau)", arti: "sudah makan", bentuk: [["먹", "akar"], ["었", "waktu"], ["습니다", "lain"]], latin: "meogeotseumnida" },
        { pronomina: "~을 겁니다 (akan)", arti: "akan makan", bentuk: [["먹", "akar"], ["을", "waktu"], [" 겁니다", "bantu"]], latin: "meogeul geomnida" },
        { pronomina: "~ㅂ니다 (batang vokal)", arti: "belajar", bentuk: [["공부", "akar"], ["합니다", "lain"]], latin: "gongbuhamnida" },
      ],
      catatan: ["ㅂ menempel di suku terakhir batang vokal: 가다 → 갑니다, 하다 → 합니다.", "Kata benda + 입니다: 학생입니다 (saya mahasiswa)."],
      contoh: { kalimat: "회의는 내일 시작합니다.", arti: "Rapat dimulai besok.", latin: "Hoeuineun naeil sijakamnida." },
    },
    {
      id: "negasi",
      nama: "Negasi 안 / 못",
      ringkas: "안 = tidak (memilih tidak), 못 = tidak bisa. Bentuk panjang: ~지 않아요 / ~지 못해요.",
      verba: "먹다",
      arti: "makan",
      cocok: [/negation: 안/i, /안 vs 못/],
      baris: [
        { pronomina: "안 + verba", arti: "tidak makan", bentuk: [["안 ", "lain"], ["먹", "akar"], ["어요", "lain"]], latin: "an meogeoyo" },
        { pronomina: "못 + verba", arti: "tidak bisa makan", bentuk: [["못 ", "lain"], ["먹", "akar"], ["어요", "lain"]], latin: "mot meogeoyo" },
        { pronomina: "~지 않아요", arti: "tidak makan (lebih formal)", bentuk: [["먹", "akar"], ["지 ", "lain"], ["않아요", "bantu"]], latin: "meokji anayo" },
        { pronomina: "~지 못해요", arti: "tidak bisa makan (lebih formal)", bentuk: [["먹", "akar"], ["지 ", "lain"], ["못해요", "bantu"]], latin: "meokji motaeyo" },
        { pronomina: "안 + lampau", arti: "tadi tidak makan", bentuk: [["안 ", "lain"], ["먹", "akar"], ["었", "waktu"], ["어요", "lain"]], latin: "an meogeosseoyo" },
      ],
      catatan: ["Verba 명사+하다: 안/못 masuk ke tengah: 공부 안 해요 (bukan 안 공부해요).", "못 먹어요 diucapkan [몬머거요]."],
      contoh: { kalimat: "저는 매운 음식을 못 먹어요.", arti: "Saya tidak bisa makan makanan pedas.", latin: "Jeoneun maeun eumsigeul mot meogeoyo." },
    },
    {
      id: "honorifik-si",
      nama: "Honorifik ~(으)시-",
      ringkas: "Sisipan ~(으)시- menghormati PELAKU (orang tua, atasan). Ditaruh setelah batang, sebelum kala & tingkat tutur.",
      verba: "가다",
      arti: "pergi",
      cocok: [/honorific verb/i, /special honorific verbs/i, /honorific subject — 께서/i],
      baris: [
        { pronomina: "~세요 (sekarang)", arti: "(beliau) pergi", bentuk: [["가", "akar"], ["세요", "lain"]], latin: "gaseyo" },
        { pronomina: "~셨어요 (lampau)", arti: "(beliau) sudah pergi", bentuk: [["가", "akar"], ["셨", "waktu"], ["어요", "lain"]], latin: "gasyeosseoyo" },
        { pronomina: "~실 거예요 (akan)", arti: "(beliau) akan pergi", bentuk: [["가", "akar"], ["실", "waktu"], [" 거예요", "bantu"]], latin: "gasil geoyeyo" },
        { pronomina: "~십니다 (formal)", arti: "(beliau) pergi", bentuk: [["가", "akar"], ["십니다", "lain"]], latin: "gasimnida" },
      ],
      catatan: [
        "세요 = 시 + 어요, 셨 = 시 + 었 (melebur). Batang konsonan memakai 으: 읽으세요, 읽으셨어요.",
        "Verba khusus: 먹다 → 드세요 / 잡수세요, 자다 → 주무세요, 있다 → 계세요.",
        "Jangan dipakai untuk diri sendiri.",
      ],
      contoh: { kalimat: "할머니께서 시장에 가셨어요.", arti: "Nenek sudah pergi ke pasar.", latin: "Halmeonikkeseo sijange gasyeosseoyo." },
    },
    {
      id: "niat-ryeogo",
      nama: "~(으)려고 해요 (Berniat)",
      ringkas: "Niat / rencana yang disengaja: batang + (으)려고 + 하다.",
      verba: "berbagai verba",
      arti: "berniat …",
      cocok: [/~으려고/],
      baris: [
        { pronomina: "먹다", arti: "berniat makan", bentuk: [["먹", "akar"], ["으려고", "lain"], [" 해요", "bantu"]], latin: "meogeuryeogo haeyo" },
        { pronomina: "가다", arti: "berniat pergi", bentuk: [["가", "akar"], ["려고", "lain"], [" 해요", "bantu"]], latin: "garyeogo haeyo" },
        { pronomina: "공부하다", arti: "berniat belajar", bentuk: [["공부하", "akar"], ["려고", "lain"], [" 해요", "bantu"]], latin: "gongbuharyeogo haeyo" },
        { pronomina: "먹다 (lampau)", arti: "tadinya berniat makan", bentuk: [["먹", "akar"], ["으려고", "lain"], [" 했어요", "bantu"]], latin: "meogeuryeogo haesseoyo" },
      ],
      catatan: ["Lampau ~려고 했어요 sering berarti \"tadinya mau …, tapi tidak jadi\"."],
      contoh: { kalimat: "주말에 부산에 가려고 해요.", arti: "Akhir pekan ini saya berniat pergi ke Busan.", latin: "Jumare busane garyeogo haeyo." },
    },
  ],
};

export default data;
