import { describe, expect, it } from "vitest";
import { ringkasKata, uraiSegmen, type SegmenMentah } from "./morfologi";

const kata = (...s: SegmenMentah[]) => s.map(uraiSegmen);

describe("uraiSegmen", () => {
  it("fi'il madhi + dhamir jamak (كَفَرُوا)", () => {
    const [f, d] = kata(["كَفَرُ", "V", "PERF|VF:1|ROOT:كفر|LEM:كَفَرَ|3MP"], ["وا۟", "N", "PRON|SUFF|3MP"]);
    expect(f.label).toMatch(/^Fi'il Madhi/);
    expect(f.wazan).toEqual({ nomor: 1, pola: "فَعَلَ" });
    expect(f.akar).toBe("كفر");
    expect(d.peran).toBe("akhiran");
    expect(ringkasKata([f, d])).toContain("mereka (lk)");
  });

  it("isim majrur dengan awalan huruf jar (بِسْمِ)", () => {
    const s = kata(["بِ", "P", "P|PREF|LEM:ب"], ["سْمِ", "N", "ROOT:سمو|LEM:اسْم|M|GEN"]);
    expect(s[0].label).toMatch(/^Huruf Jar/);
    expect(s[1].irab).toBe("Majrur");
    expect(ringkasKata(s, { isolasi: false })).toMatch(/^بِ \(Huruf Jar\) \+ Isim/);
  });

  it("ACC di harf = inna, di isim = manshub", () => {
    expect(uraiSegmen(["إِنَّ", "P", "ACC|LEM:إِنّ|FAM:إِنّ"]).label).toMatch(/^Huruf Nashb/);
    const isim = uraiSegmen(["كِتَٰبَ", "N", "ROOT:كتب|LEM:كِتاب|M|ACC"]);
    expect(isim.label).toMatch(/^Isim/);
    expect(isim.irab).toBe("Manshub");
  });

  it("mudhari' majzum & lam amr", () => {
    expect(uraiSegmen(["يَكُنْ", "V", "IMPF|VF:1|ROOT:كون|LEM:كانَ|3MS|MOOD:JUS"]).irab).toBe("Majzum");
    expect(uraiSegmen(["لْ", "P", "IMPV|PREF|LEM:ل"]).label).toMatch(/^Lam Amr/);
  });

  it("isim fa'il bab IV", () => {
    const s = uraiSegmen(["مُسْلِمَيْنِ", "N", "ACT_PCPL|VF:4|ROOT:سلم|LEM:مُسْلِم|MD|ACC"]);
    expect(s.label).toMatch(/^Isim Fa'il/);
    expect(s.wazan?.pola).toBe("أَفْعَلَ");
    expect(s.ciri).toContain("mutsanna");
  });
});
