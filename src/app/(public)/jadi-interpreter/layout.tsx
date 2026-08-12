// [seo-metadata-halaman-v1] Halaman ini "use client", jadi tidak bisa
// mengekspor `metadata` sendiri. Layout tipis ini yang membawanya — tanpa itu
// halaman mewarisi judul & deskripsi homepage dari src/app/layout.tsx.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/jadi-interpreter",
  title: "Lowongan Freelance Interpreter — Linguo.id",
  description:
    "Daftar jadi freelance interpreter di Linguo. Penugasan event B2B, jadwal fleksibel, dan pembayaran per proyek. Isi form lamaran beserta CV kamu.",
  keywords: ["lowongan interpreter", "freelance interpreter", "kerja jadi juru bahasa"],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
