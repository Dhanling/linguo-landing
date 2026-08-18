// [seo-metadata-halaman-v1] Halaman ini "use client" (lewat FormPengajar), jadi
// judul & deskripsinya dibawa layout tipis ini. Bahasanya Inggris supaya hasil
// pencarian yang menuju versi ini juga berbahasa Inggris.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/jadi-pengajar/en",
  title: "Teach a Language Online — Careers at Linguo.id",
  description:
    "Become a language teacher at Linguo. Set your own days and hours, competitive per-session fee, teach online from anywhere. Check the requirements and apply.",
  keywords: [
    "online language teacher jobs",
    "native speaker teaching jobs indonesia",
    "language tutor vacancy",
  ],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
