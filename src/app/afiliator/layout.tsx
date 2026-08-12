// [seo-metadata-halaman-v1] Halaman ini "use client", jadi tidak bisa
// mengekspor `metadata` sendiri. Layout tipis ini yang membawanya — tanpa itu
// halaman mewarisi judul & deskripsi homepage dari src/app/layout.tsx.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/afiliator",
  title: "Program Afiliasi Linguo — Rekomendasikan, Dapat Komisi",
  description:
    "Dapat komisi dengan merekomendasikan Linguo. Isi data singkat, terima kode referral sendiri, lalu sebarkan di Instagram, TikTok, atau WhatsApp.",
  keywords: ["program afiliasi", "affiliate linguo", "komisi referral kursus bahasa"],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
