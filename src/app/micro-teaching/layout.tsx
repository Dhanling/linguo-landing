// [seo-halaman-yatim-v1] /micro-teaching itu "use client" tanpa metadata sendiri,
// jadi selama ini ia mewarisi judul, deskripsi, DAN canonical dari homepage —
// HTML hasil prerender-nya mengaku `canonical: https://linguo.id`. Efeknya
// Google diberi tahu "halaman ini duplikat homepage", sinyal yang tidak pernah
// dimaksudkan siapa pun.
//
// Halaman ini bukan halaman publik: isinya dibuka lewat ?param untuk sesi micro
// teaching kandidat pengajar, dan HTML mentahnya cuma "Memuat…" (64 karakter)
// karena seluruh isinya dirender sesudah hidrasi. Tidak ada yang bisa diindeks.
// Jadi jalurnya bukan dikasih metadata bagus, tapi ditutup dari indeks.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/micro-teaching",
  title: "Micro Teaching — Linguo.id",
  description: "Sesi micro teaching kandidat pengajar Linguo.",
  noindex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
