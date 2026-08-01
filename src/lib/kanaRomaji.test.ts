import { describe, expect, it } from "vitest";
import { alignJapaneseTranslit } from "./kanaRomaji";

// Tiruan splitWords (Intl.Segmenter granularity "word") — sama seperti yang dipakai
// player untuk memecah subtitle Jepang jadi kata.
function seg(text: string) {
  const s = new Intl.Segmenter("ja", { granularity: "word" });
  return [...s.segment(text)].map((x) => ({ text: x.segment, isWord: !!x.isWordLike }));
}

/** Peta kata target → bacaan Latin-nya (yang nanti dicetak di atas kata). */
function ruby(target: string, translit: string) {
  const words = seg(target);
  const toks = alignJapaneseTranslit(words, translit);
  if (!toks) return null;
  // Token harus utuh: gabungannya = string translit asli.
  expect(toks.map((t) => t.text).join("")).toBe(translit);
  const wordTexts = words.filter((w) => w.isWord).map((w) => w.text);
  const out: Record<string, string> = {};
  for (const t of toks) {
    if (t.k < 0) continue;
    const w = wordTexts[t.k];
    out[w] = (out[w] ? out[w] + " " : "") + t.text.trim();
  }
  return out;
}

describe("alignJapaneseTranslit", () => {
  it("menjajarkan kana & katakana panjang (コーヒー) ke kata masing-masing", () => {
    const m = ruby("パンとコーヒーを食べます。", "pan to kōhī o tabemasu.");
    expect(m).toBeTruthy();
    expect(m!["パン"]).toBe("pan");
    expect(m!["と"]).toBe("to");
    expect(m!["コーヒー"]).toBe("kōhī");
    expect(m!["を"]).toBe("o");
    expect(m!["ます"]).toBe("masu");
  });

  it("kanji di awal kalimat dapat bacaannya sendiri", () => {
    const m = ruby("毎朝パンを食べます。", "maiasa pan o tabemasu.");
    expect(m).toBeTruthy();
    expect(m!["パン"]).toBe("pan");
    expect(m!["を"]).toBe("o");
    expect(m!["ます"]).toBe("masu");
  });

  it("partikel は dibaca wa", () => {
    const m = ruby("私は学生です", "watashi wa gakusei desu");
    expect(m).toBeTruthy();
    expect(m!["は"]).toBe("wa");
    expect(m!["です"]).toBe("desu");
  });

  it("angka & kanji di tengah tak menggeser bacaan (kasus ニュースを3つ)", () => {
    const m = ruby("ニュースを3つ紹介します", "nyūsu o mittsu shōkai shimasu");
    expect(m).toBeTruthy();
    expect(m!["ニュース"]).toBe("nyūsu");
    expect(m!["を"]).toBe("o");
    expect(m!["ます"]).toBe("masu");
  });

  it("sokuon っ & vokal panjang makron", () => {
    const m = ruby("ちょっと待ってください", "chotto matte kudasai");
    expect(m).toBeTruthy();
    expect(m!["ちょっと"]).toBe("chotto");
    expect(m!["って"]).toBe("tte");
    // Segmenter memecah ください jadi くだ|さい — bacaannya tetap ikut potongannya.
    expect(m!["くだ"] ?? m!["ください"]).toBeTruthy();
  });

  it("vokal panjang ditulis dobel (koohii) tetap cocok", () => {
    const m = ruby("コーヒーを飲みます", "koohii o nomimasu");
    expect(m).toBeTruthy();
    expect(m!["コーヒー"]).toBe("koohii");
    expect(m!["を"]).toBe("o");
  });

  it("dua kata kanji berturut-turut dapat bacaannya masing-masing", () => {
    // 昨日 & 友達 menyatu jadi satu deret (tanda 、 bukan kata) — jangkar と TIDAK
    // boleh nyangkut di huruf 't' milik "tomodachi".
    const m = ruby("昨日、友達と映画を見に行きました。", "kinō, tomodachi to eiga o mi ni ikimashita.");
    expect(m).toBeTruthy();
    expect(m!["昨日"]).toBe("kinō");
    expect(m!["友達"]).toBe("tomodachi");
    expect(m!["と"]).toBe("to");
    expect(m!["映画"]).toBe("eiga");
    expect(m!["を"]).toBe("o");
  });

  it("kanji panjang di tengah kalimat (勉強/日本語)", () => {
    const m = ruby("日本語を勉強しています。", "nihongo o benkyō shite imasu.");
    expect(m).toBeTruthy();
    expect(m!["日本語"]).toBe("nihongo");
    expect(m!["勉強"]).toBe("benkyō");
  });

  it("batal (null) kalau romaji jelas tak sepadan", () => {
    expect(ruby("パンとコーヒーを食べます。", "zzz qqq")).toBeNull();
  });
});
