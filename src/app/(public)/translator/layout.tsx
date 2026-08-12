// [seo-metadata-halaman-v1] Halaman ini "use client", jadi tidak bisa
// mengekspor `metadata` sendiri. Layout tipis ini yang membawanya — tanpa itu
// halaman mewarisi judul & deskripsi homepage dari src/app/layout.tsx.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/translator",
  title: "Jasa Penerjemah Tersumpah Dokumen Resmi — Linguo.id",
  description:
    "Terjemahan tersumpah untuk kontrak, akta notaris, putusan pengadilan, MoU, dan legal opinion. 15+ pasangan bahasa dengan standar pelayanan B2B.",
  keywords: [
    "jasa penerjemah tersumpah",
    "terjemahan dokumen resmi",
    "sworn translator indonesia",
    "penerjemah dokumen legal",
  ],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
