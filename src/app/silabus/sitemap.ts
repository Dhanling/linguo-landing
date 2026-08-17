import type { MetadataRoute } from "next";
import { languages } from "@/data/curriculum";

// [seo-lastmod-jujur-v1] Silabus per bahasa datang dari data statis di
// @/data/curriculum, jadi isinya cuma berubah kalau kurikulumnya diedit —
// bukan tiap kali sitemap di-generate. Dulu semuanya dicap `new Date()` yang
// membuat Google berhenti mempercayai lastmod dari domain ini. Naikkan tanggal
// di bawah kalau data kurikulum benar-benar diperbarui.
const SILABUS_UPDATED = new Date("2026-08-17");

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://linguo.id";

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/silabus`, lastModified: SILABUS_UPDATED, changeFrequency: "weekly", priority: 0.8 },
  ];

  for (const lang of languages) {
    if (lang.available) {
      entries.push({
        url: `${base}/silabus/${lang.slug}`,
        lastModified: SILABUS_UPDATED,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
