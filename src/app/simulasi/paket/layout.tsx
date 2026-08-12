// [seo-metadata-halaman-v1] Halaman ini "use client", jadi tidak bisa
// mengekspor `metadata` sendiri. Layout tipis ini yang membawanya — tanpa itu
// halaman mewarisi judul & deskripsi homepage dari src/app/layout.tsx.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/simulasi/paket",
  title: "Paket Simulasi TOEFL & IELTS Online — Linguo.id",
  description:
    "Pilih paket simulasi tes Linguo: TOEFL ITP, TOEFL iBT, dan IELTS Academic. Dikerjakan online dengan skor dan laporan hasil per bagian.",
  keywords: [
    "simulasi toefl online",
    "simulasi ielts online",
    "tes prediksi toefl",
    "latihan soal ielts",
  ],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
