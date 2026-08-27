// [seo-metadata-halaman-v1] Halaman ini "use client", jadi tidak bisa
// mengekspor `metadata` sendiri. Layout tipis ini yang membawanya — tanpa itu
// halaman mewarisi judul & deskripsi homepage dari src/app/layout.tsx.
import type { ReactNode } from "react";
import BreadcrumbLd from "@/components/BreadcrumbLd"; // [aeo-schema-v1]
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/kelas-anak",
  title: "Kursus Bahasa Asing untuk Anak 5–12 Tahun — Linguo.id",
  description:
    "Kelas bahasa anak Linguo: Little Learner (5–8 th) dan Young Explorer (9–12 th). Belajar lewat flashcard, games, dan progress report bulanan untuk orang tua.",
  keywords: [
    "kursus bahasa inggris anak",
    "les bahasa asing untuk anak",
    "kursus bahasa anak online",
    "les privat anak",
  ],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <BreadcrumbLd trail={[{ name: "Kursus Bahasa Anak", path: "/kelas-anak" }]} />
      {children}
    </>
  );
}
