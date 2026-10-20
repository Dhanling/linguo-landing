// [seo-metadata-halaman-v1] Halaman ini "use client", jadi tidak bisa
// mengekspor `metadata` sendiri. Layout tipis ini yang membawanya — tanpa itu
// halaman mewarisi judul & deskripsi homepage dari src/app/layout.tsx.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/kosakata",
  title: "Lingwords — Linguo.id",
  description:
    "Progres kosakata kamu terhadap target tiap level CEFR, plus flashcard kata tersimpan. Halaman pribadi, butuh akun Linguo.",
  noindex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
