// [seo-metadata-halaman-v1] Halaman ini "use client", jadi tidak bisa
// mengekspor `metadata` sendiri. Layout tipis ini yang membawanya — tanpa itu
// halaman mewarisi judul & deskripsi homepage dari src/app/layout.tsx.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/corporate-pricelist",
  title: "Daftar Harga Corporate Language Training — Linguo.id",
  description:
    "Pricelist pelatihan bahasa untuk perusahaan: modul dan materi custom per industri, sertifikat kelulusan tiap peserta, serta skema harga per ukuran tim.",
  keywords: [
    "harga corporate training bahasa",
    "biaya pelatihan bahasa perusahaan",
    "pricelist b2b bahasa",
  ],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
