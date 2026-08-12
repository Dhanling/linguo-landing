// [seo-metadata-halaman-v1] Halaman ini "use client", jadi tidak bisa
// mengekspor `metadata` sendiri. Layout tipis ini yang membawanya — tanpa itu
// halaman mewarisi judul & deskripsi homepage dari src/app/layout.tsx.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/harga",
  title: "Harga Kursus Bahasa Asing Online — Linguo.id",
  description:
    "Daftar harga les bahasa online Linguo untuk 60+ bahasa. Atur level A1–C2, jumlah sesi, dan pengajar lokal atau native. Transparan, tanpa biaya tersembunyi.",
  keywords: [
    "harga kursus bahasa online",
    "biaya les bahasa online",
    "harga les privat bahasa",
    "tarif kursus bahasa asing",
  ],
  ogTitle: "Harga Kursus Bahasa Linguo — Transparan per Bahasa & Level",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
