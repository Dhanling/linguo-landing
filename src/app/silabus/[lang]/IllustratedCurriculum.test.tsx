import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getCurriculum, languages, displayLangTitle } from "@/data/curriculum";
import { daftarSlugFromLanguageSlug } from "@/lib/funnelRouting";
import { SILABUS_SCENES, sceneForSession } from "@/lib/silabusScene";
import IllustratedCurriculum from "./IllustratedCurriculum";

const available = languages.flatMap(language => {
  const curriculum = getCurriculum(language.slug);
  return curriculum ? [curriculum] : [];
});

describe("Halaman silabus berilustrasi", () => {
  it.each(available.map(c => [c.meta.slug, c] as const))("%s memakai karakter, sesi, dan jalur daftar bahasanya", (slug, curriculum) => {
    const html = renderToStaticMarkup(<IllustratedCurriculum curriculum={curriculum} />);
    expect(html).toContain(`/images/silabus/scenes-v1/${slug}.webp`);
    expect(html).toContain(`/images/silabus/first-chapter-v1/${slug}.webp`);
    expect(new Set([...html.matchAll(/data-scene="(session-\d+)"/g)].map(m => m[1])).size).toBe(16);
    expect(html).toContain(displayLangTitle(curriculum.meta));
    const registration = ["ielts", "toefl-itp"].includes(slug)
      ? "/daftar/inggris/ielts-toefl"
      : `/daftar/${daftarSlugFromLanguageSlug(slug) || ""}`.replace(/\/$/, "");
    expect(html).toContain(`href="${registration}"`);
    expect(html).toContain(`href="/silabus/${slug}/coba"`);
    const chapter = curriculum.levels[0].sublevels[0];
    expect((html.match(/aria-controls="[^"]+-session-/g) || []).length).toBe(chapter.sessions.length);
    for (const session of chapter.sessions) expect(html).toContain(`id="${slug}-${chapter.code}-session-${session.number}-`);
    if (slug !== "english") expect(html).not.toContain("/images/silabus/english-round-eyes/");
  });
  it("memilih adegan berbeda sesuai materi kartu", () => {
    expect(sceneForSession({title:"Alphabet & Pronunciation"})).toBe("alphabet");
    expect(sceneForSession({title:"Numbers 0–20"})).toBe("numbers");
    expect(sceneForSession({title:"Family Members"})).toBe("family");
    expect(sceneForSession({title:"Waktu dan rutinitas", topics:["vocabulary"]})).toBe("time");
    expect(sceneForSession({title:"Pelajaran lokal", topics:["airport and hotel"]})).toBe("travel");
    expect(new Set(SILABUS_SCENES).size).toBe(20);
  });
});
