// [seo-ebook-canonical-v1] Halaman /produk/ebook adalah "use client", jadi tidak
// bisa mengekspor `metadata` sendiri. Tanpa layout ini ia mewarisi metadata
// homepage dari src/app/layout.tsx — dan itulah yang terjadi selama ini:
//
//   <title>Kursus Bahasa Asing Online No.1 di Indonesia — Linguo.id</title>
//   <link rel="canonical" href="https://linguo.id"/>
//
// Canonical yang menunjuk homepage sama artinya dengan memberi tahu Google
// "halaman ini duplikat homepage, jangan indeks". Padahal ini halaman jualan
// sungguhan yang ditaut dari homepage. Halaman ini juga sekalian didaftarkan di
// src/app/sitemap.ts — tiga tempat (metadata, sitemap, robots) harus sepakat.

import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/produk/ebook",
  title: "E-Book Belajar Bahasa Asing — 20 Bahasa, Mulai Rp 79.000 | Linguo.id",
  description:
    "E-book belajar bahasa asing format PDF: kosakata praktis, contoh percakapan, dan latihan soal. Tersedia 20 bahasa, akses selamanya, update gratis. Mulai Rp 79.000.",
  keywords: [
    "ebook belajar bahasa",
    "buku digital bahasa asing",
    "ebook bahasa inggris pdf",
    "modul belajar bahasa",
  ],
  ogType: "website",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
