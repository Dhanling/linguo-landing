// [seo-metadata-halaman-v1] Halaman ini "use client", jadi tidak bisa
// mengekspor `metadata` sendiri. Layout tipis ini yang membawanya — tanpa itu
// halaman mewarisi judul & deskripsi homepage dari src/app/layout.tsx.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/interpreter",
  title: "Jasa Interpreter Profesional untuk Event B2B — Linguo.id",
  description:
    "Sewa interpreter untuk konferensi, meeting, dan event bisnis. Tersedia mode simultaneous dan consecutive, lengkap dengan equipment dan tim berpengalaman.",
  keywords: [
    "jasa interpreter",
    "sewa penerjemah lisan",
    "interpreter simultan",
    "jasa interpreter event",
  ],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
