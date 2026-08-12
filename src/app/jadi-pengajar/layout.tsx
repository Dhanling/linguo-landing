// [seo-metadata-halaman-v1] Halaman ini "use client", jadi tidak bisa
// mengekspor `metadata` sendiri. Layout tipis ini yang membawanya — tanpa itu
// halaman mewarisi judul & deskripsi homepage dari src/app/layout.tsx.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/jadi-pengajar",
  title: "Lowongan Pengajar Bahasa Online — Karier di Linguo.id",
  description:
    "Jadi pengajar bahasa di Linguo. Tentukan sendiri hari dan jam mengajar, fee kompetitif per sesi, kelas online dari mana saja. Cek kualifikasi dan daftar.",
  keywords: [
    "lowongan pengajar bahasa",
    "lowongan guru bahasa online",
    "kerja jadi tutor bahasa",
  ],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
