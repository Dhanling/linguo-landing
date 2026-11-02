import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { normalizeSlide } from "./materiSlides";

describe("cover materi Spanyol per sesi", () => {
  it("mempertahankan cover dan tujuan untuk seluruh sesi A1–B2", () => {
    const covers = new Set<string>();
    for (const [level, total] of [["a1", 3], ["a2", 4], ["b1", 5], ["b2", 7]] as const) {
      for (let sub = 1; sub <= total; sub++) {
        for (let sesi = 1; sesi <= 16; sesi++) {
          for (const tujuan of [false, true]) {
            const cover = `/slide-cover/spanish-v2/spanish-${level}-${sub}-sesi-${sesi}${tujuan ? "-tujuan" : ""}.jpg`;
            const slide = normalizeSlide({ type: tujuan ? "points" : "title", heading: `Sesi ${sesi}`, cover, ruang: "kiri" });
            expect(slide?.cover).toBe(cover);
            expect(existsSync(join(process.cwd(), "public", cover))).toBe(true);
            covers.add(slide!.cover!);
          }
        }
      }
    }
    expect(covers.size).toBe(608);
  });

  it("tetap menolak alamat luar dan jalur di luar folder cover", () => {
    for (const cover of ["https://example.com/cover.jpg", "/slide-cover/spanish-v2/../../secret.jpg", "/other/cover.jpg"]) {
      expect(normalizeSlide({ type: "title", heading: "Sesi", cover })?.cover).toBeUndefined();
    }
  });
});
