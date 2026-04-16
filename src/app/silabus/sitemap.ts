import type { MetadataRoute } from "next";
import { languages } from "@/data/curriculum";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://linguo.id";
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/silabus`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  for (const lang of languages) {
    if (lang.available) {
      entries.push({
        url: `${base}/silabus/${lang.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
