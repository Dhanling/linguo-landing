// [seo-metadata-halaman-v1] Halaman ini "use client", jadi tidak bisa
// mengekspor `metadata` sendiri. Layout tipis ini yang membawanya — tanpa itu
// halaman mewarisi judul & deskripsi homepage dari src/app/layout.tsx.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/lingfluencer",
  title: "Lingfluencer — Belajar Bahasa Gratis + Komisi 10% | Linguo.id",
  description:
    "Program kolaborasi kreator Linguo: akses paket e-learning 10+ bahasa, komunitas eksklusif, dan komisi 10% dari tiap pembelian lewat linkmu.",
  keywords: ["program kreator linguo", "kolaborasi influencer bahasa", "lingfluencer"],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
