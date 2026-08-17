import { describe, expect, it } from "vitest";
import { konversi } from "./engine";
import { romajaKeHangul } from "./hangul";
import { imeUntuk } from "./index";

const sel = async (teks: string, aksara: any, kode: string) =>
  (await konversi(teks, aksara, kode, true)).hasil;

describe("Sirilik", () => {
  it("mengetik kalimat Rusia utuh", async () => {
    expect(await sel("ya ne lyublyu kofe", "cyrillic", "ru")).toBe("я не люблю кофе");
  });

  it("mendahulukan kunci terpanjang", async () => {
    // shch harus utuh jadi щ, bukan ш + ч
    expect(await sel("shchi", "cyrillic", "ru")).toBe("щи");
    expect(await sel("shkola", "cyrillic", "ru")).toBe("школа");
  });

  it("ikut huruf besar", async () => {
    expect(await sel("Moskva", "cyrillic", "ru")).toBe("Москва");
  });

  it("menahan ekor yang masih bisa tumbuh", async () => {
    // "s" belum boleh jadi с — bisa berlanjut jadi sh/shch
    const r = await konversi("s", "cyrillic", "ru", false);
    expect(r).toEqual({ hasil: "", sisa: "s" });
    // begitu ada vokal, keputusannya sudah pasti
    expect((await konversi("sa", "cyrillic", "ru", false)).hasil).toBe("са");
  });

  it("Ukraina memakai і dan ї, bukan huruf Rusia", async () => {
    expect(await sel("yi", "cyrillic", "uk")).toBe("ї");
    expect(await sel("i", "cyrillic", "uk")).toBe("і");
  });
});

describe("Yunani", () => {
  it("sigma di ujung kata jadi ς", async () => {
    expect(await sel("kalos", "greek", "el")).toBe("καλoς".replace("o", "ο"));
  });
  it("sigma di tengah tetap σ", async () => {
    expect(await sel("kosmos", "greek", "el")).toBe("κοσμος");
  });
});

describe("Hangul", () => {
  it("konsonan akhir milik suku kata berikutnya kalau diikuti vokal", () => {
    expect(romajaKeHangul("hana", true).hasil).toBe("하나");
    expect(romajaKeHangul("han", true).hasil).toBe("한");
  });
  it("merakit sapaan", () => {
    expect(romajaKeHangul("annyeong", true).hasil).toBe("안녕");
    expect(romajaKeHangul("hangug", true).hasil).toBe("한국");
  });
  it("menahan suku kata yang belum jelas", () => {
    // "han" bisa jadi 한 atau awal "hana" — jangan dipatok dulu
    expect(romajaKeHangul("han", false)).toEqual({ hasil: "", sisa: "han" });
  });
});

describe("Kana", () => {
  it("romaji jadi hiragana", async () => {
    expect(await sel("watashi", "kana", "ja")).toBe("わたし");
    expect(await sel("nihongo", "kana", "ja")).toBe("にほんご");
  });
});

describe("Pemilihan bahasa", () => {
  it("mengenali nama bahasa dari target_lang", () => {
    expect(imeUntuk("Russian")?.kode).toBe("ru");
    expect(imeUntuk("Mandarin")?.mode).toBe("kandidat");
    expect(imeUntuk("Japanese")?.aksara).toBe("kana");
  });
  it("bahasa beraksara Latin tidak dapat IME", () => {
    expect(imeUntuk("English")).toBeNull();
    expect(imeUntuk("Indonesian")).toBeNull();
    expect(imeUntuk("")).toBeNull();
  });
  it("bahasa yang belum punya mesin jujur tidak dipaksakan", () => {
    // Arab/Thai/Hindi sengaja tak dipasang — lihat catatan di tables.ts
    expect(imeUntuk("Arabic")).toBeNull();
    expect(imeUntuk("Thai")).toBeNull();
    expect(imeUntuk("Hindi")).toBeNull();
  });
});
