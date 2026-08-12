// [seo-metadata-halaman-v1] Halaman ini "use client", jadi tidak bisa
// mengekspor `metadata` sendiri. Layout tipis ini yang membawanya — tanpa itu
// halaman mewarisi judul & deskripsi homepage dari src/app/layout.tsx.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/jadi-penerjemah-tersumpah",
  title: "Lowongan Penerjemah Tersumpah — Pool Linguo.id",
  description:
    "Bergabung dengan pool penerjemah tersumpah Linguo. Proyek dokumen legal, teknis, dan bisnis dari klien korporat. Lihat bidang yang dibutuhkan dan cara daftar.",
  keywords: [
    "lowongan penerjemah tersumpah",
    "freelance penerjemah",
    "kerja penerjemah dokumen",
  ],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
