import { describe, expect, it } from "vitest";
import { splitCuesBySentence } from "./immersionLearn";

// [watch-sound-tag-v1] Tag suara non-ucapan tak boleh menyeret kalimat ke window
// musik — subtitle kalimat baru muncul saat penutur benar-benar mulai bicara.
describe("tag suara non-ucapan", () => {
  it("memecah '[Musica] Buongiorno…' jadi cue tag + cue ucapan", () => {
    const out = splitCuesBySentence(
      [
        {
          start: 0,
          end: 8,
          target: "[Musica] Buongiorno raga, oggi è martedì.",
          base: "[Musik] Selamat pagi teman-teman, hari ini Selasa.",
        },
      ],
      "it"
    );
    expect(out.length).toBeGreaterThanOrEqual(2);
    expect(out[0].target).toBe("[Musica]");
    expect(out[0].start).toBe(0);
    // Kalimat baru mulai belakangan (bukan ikut detik 0).
    expect(out[1].start).toBeGreaterThan(2);
    expect(out[1].start).toBe(out[0].end);
    expect(out[1].target.startsWith("Buongiorno")).toBe(true);
    expect(out[1].base.startsWith("Selamat")).toBe(true);
  });

  it("cue tag-saja tak digabung ke kalimat sesudahnya", () => {
    const out = splitCuesBySentence(
      [
        { start: 0, end: 5, target: "[Music]", base: "[Musik]" },
        { start: 5.2, end: 8, target: "Hello everyone", base: "Halo semuanya" },
      ],
      "en"
    );
    expect(out).toHaveLength(2);
    expect(out[0].target).toBe("[Music]");
    expect(out[1].start).toBe(5.2);
  });

  it("♪ juga dianggap tag suara", () => {
    const out = splitCuesBySentence(
      [{ start: 0, end: 6, target: "♪♪ Buenos días a todos.", base: "♪♪ Selamat pagi semua." }],
      "es"
    );
    expect(out[0].target).toBe("♪♪");
    expect(out[1].start).toBeGreaterThan(0);
  });

  it("kalimat biasa tak terpengaruh", () => {
    const out = splitCuesBySentence(
      [{ start: 1, end: 4, target: "Buongiorno a tutti.", base: "Selamat pagi semua." }],
      "it"
    );
    expect(out).toHaveLength(1);
    expect(out[0].start).toBe(1);
  });
});
