import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { getLanguageBySlug, displayLangTitle } from "@/data/curriculum/languages";
import { CEFR_QUESTIONS } from "./cefrQuestions";
import { PLACEMENT_LANGUAGE_SLUGS } from "@/data/placementLanguages";
import PlacementIntro from "./PlacementIntro";

const slugs = [...Object.keys(CEFR_QUESTIONS), "ielts", "toefl-itp"];
const languageName = (slug: string) => (({ "portuguese-br": "Portuguese", "portuguese-pt": "Portuguese", filipino: "Tagalog", bipa: "BIPA" } as Record<string, string>)[slug] || slug[0].toUpperCase() + slug.slice(1));

describe("Pembuka placement semua bahasa", () => {
  it.each(slugs)("%s memakai hero sendiri dan ilustrasi kartu bersama", slug => {
    const meta = getLanguageBySlug(slug);
    expect(meta).toBeDefined();
    const questions = CEFR_QUESTIONS[slug];
    const exam = slug === "ielts" || slug === "toefl-itp" ? slug : undefined;
    const html = renderToStaticMarkup(<PlacementIntro slug={slug} langFull={exam ? "English" : languageName(slug)}
      langTitle={displayLangTitle(meta!)} total={questions?.length ?? 10} listening={questions?.filter(q => q.audio).length ?? 0}
      exam={exam} onStart={() => {}} />);
    const hero = slug === "swedish" ? "/illustrations/placement/swedish-study-v1.webp" : `/illustrations/placement/heroes-v1/${slug}.webp`;
    expect(html).toContain(encodeURIComponent(hero));
    expect(html).toContain(encodeURIComponent("/illustrations/placement/self-assessment-v2.webp"));
    expect(html).toContain(encodeURIComponent("/illustrations/placement/speaking-test-v2.webp"));
    expect(html).toContain("Ganti / pilih bahasa");
    expect(html).not.toContain("Kembali ke silabus");
    expect(html).toContain(displayLangTitle(meta!));
    expect(html).not.toContain("HEJ, CALON PENUTUR SWEDIA!");
    expect(html).not.toContain("MULAI DARI SINI");
    expect(html).not.toContain("NaN");
    if (slug !== "swedish") expect(html).not.toContain("Bahasa Swedia");
    if (exam) expect(html).toContain("15 menit");
    else expect(html).toContain(`${questions.length}</strong>`);
  });

  it("pemilih hanya memuat bahasa dengan tes aktif", () => {
    expect([...PLACEMENT_LANGUAGE_SLUGS].sort()).toEqual([...slugs].sort());
  });

  it("semua hero dan kedua ilustrasi kartu tersedia", () => {
    const hashes = new Set<string>();
    for (const slug of slugs) {
      const hero = slug === "swedish" ? "public/illustrations/placement/swedish-study-v1.webp" : `public/illustrations/placement/heroes-v1/${slug}.webp`;
      expect(existsSync(hero), hero).toBe(true);
      hashes.add(createHash("sha256").update(readFileSync(hero)).digest("hex"));
    }
    expect(hashes.size).toBe(slugs.length);
    expect(existsSync("public/illustrations/placement/self-assessment-v2.webp")).toBe(true);
    expect(existsSync("public/illustrations/placement/speaking-test-v2.webp")).toBe(true);
  });
});
